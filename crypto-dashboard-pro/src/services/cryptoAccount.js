// Supabase Auth and PostgREST integration using the documented HTTP APIs.
// No privileged key is ever used in browser code.
const baseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const STORAGE_KEY = "cryptoops.auth.session.v1";
export const supabaseConfigured = Boolean(baseUrl && publicKey);

let session = null;
try {
  if (typeof window !== "undefined") {
    session = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
  }
} catch {
  session = null;
}
let refreshing = null;
const listeners = new Set();

function saveSession(next) {
  session = next;
  if (typeof window !== "undefined") {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }
  for (const listener of listeners) listener(next);
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function currentSession() { return session; }
export function clearSession() { saveSession(null); }

async function request(endpoint, { method = "GET", body, token, headers = {} } = {}) {
  if (!supabaseConfigured) throw new Error("Supabase não configurado. Defina as variáveis VITE_SUPABASE_*.");
  const response = await fetch(baseUrl + endpoint, {
    method,
    headers: {
      apikey: publicKey,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    let message = "Erro de comunicação com o Supabase (" + response.status + ")";
    try {
      const data = await response.json();
      message = data.msg || data.message || data.error_description || data.error || message;
    } catch { /* Keep status-based error */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204 || response.status === 205) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function persistAuth(data) {
  if (!data?.access_token || !data?.refresh_token) return null;
  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user || session?.user || null,
  };
  saveSession(next);
  return next;
}

export async function signIn(email, password) {
  const data = await request("/auth/v1/token?grant_type=password", {
    method: "POST", body: { email, password },
  });
  return persistAuth(data);
}

export async function signUp(email, password) {
  const data = await request("/auth/v1/signup", { method: "POST", body: { email, password } });
  if (data?.access_token) persistAuth(data);
  return Boolean(data?.access_token);
}

export async function getAccessToken() {
  if (!session?.access_token) throw new Error("Entre na sua conta para continuar.");
  if (session.expires_at > Math.floor(Date.now() / 1000) + 60) return session.access_token;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const result = await request("/auth/v1/token?grant_type=refresh_token", {
          method: "POST", body: { refresh_token: session.refresh_token },
        });
        return persistAuth(result)?.access_token;
      } catch (error) {
        if ([400, 401, 403].includes(error.status)) saveSession(null);
        throw error;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function getAuthenticatedUser() {
  const token = await getAccessToken();
  const user = await request("/auth/v1/user", { token });
  if (session && user?.id) saveSession({ ...session, user });
  return user;
}

export async function signOut() {
  try {
    if (session?.access_token) {
      const token = await getAccessToken();
      await request("/auth/v1/logout", { method: "POST", token });
    }
  } finally {
    saveSession(null);
  }
}

// Restrict resources to the project's explicitly intended public tables.
const TABLES = new Set(["crypto_favorites", "price_alerts", "price_notifications"]);
async function rest(table, { method = "GET", query = {}, data, prefer } = {}) {
  if (!TABLES.has(table)) throw new Error("Recurso desconhecido");
  const qs = new URLSearchParams(query);
  const token = await getAccessToken();
  return request("/rest/v1/" + table + (qs.size ? "?" + qs : ""), {
    method, token, body: data,
    headers: prefer ? { Prefer: prefer } : {},
  });
}

export const cryptoStore = {
  favorites: () => rest("crypto_favorites", {
    query: { select: "user_id,coin_id,coin_symbol,coin_name,created_at", order: "created_at.desc" },
  }),
  addFavorite: (userId, coin) => rest("crypto_favorites", {
    method: "POST", prefer: "resolution=merge-duplicates,return=representation",
    data: { user_id: userId, coin_id: coin.id, coin_symbol: coin.symbol, coin_name: coin.name },
  }),
  removeFavorite: (coinId) => rest("crypto_favorites", {
    method: "DELETE", query: { coin_id: "eq." + coinId },
  }),
  alerts: () => rest("price_alerts", {
    query: { select: "*", order: "created_at.desc", limit: "100" },
  }),
  addAlert: (userId, coin, direction, targetPrice, notifyEmail) => rest("price_alerts", {
    method: "POST", prefer: "return=representation",
    data: {
      user_id: userId, coin_id: coin.id, coin_symbol: coin.symbol,
      direction, target_price: targetPrice, notify_email: notifyEmail,
    },
  }),
  removeAlert: (id) => rest("price_alerts", {
    method: "DELETE", query: { id: "eq." + id },
  }),
  setAlertActive: (id, isActive) => rest("price_alerts", {
    method: "PATCH", query: { id: "eq." + id },
    data: { is_active: isActive },
  }),
  notifications: () => rest("price_notifications", {
    query: { select: "*", order: "created_at.desc", limit: "100" },
  }),
  markRead: (id) => rest("price_notifications", {
    method: "PATCH", query: { id: "eq." + id, read_at: "is.null" },
    data: { read_at: new Date().toISOString() },
  }),
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    try { session = JSON.parse(event.newValue || "null"); } catch { session = null; }
    for (const listener of listeners) listener(session);
  });
}
