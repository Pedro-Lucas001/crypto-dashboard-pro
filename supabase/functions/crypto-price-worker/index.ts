// CryptoOps: server-only price alert worker.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { thresholdReached } from "./alertRules.ts";

type PriceAlert = {
  id: string;
  user_id: string;
  coin_id: string;
  coin_symbol: string;
  direction: "above" | "below";
  target_price: number | string;
};
type Notification = {
  id: string;
  user_id: string;
  coin_symbol: string;
  direction: "above" | "below";
  target_price: number | string;
  observed_price: number | string;
  email_attempts: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cronSecret = Deno.env.get("CRYPTOOPS_CRON_SECRET") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const fromEmail = Deno.env.get("CRYPTOOPS_FROM_EMAIL") ?? "";
const db = createClient(supabaseUrl || "https://invalid.supabase.co", serviceKey || "missing", {
  auth: { autoRefreshToken: false, persistSession: false },
});

function securelyEquals(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

async function marketPrices(ids: string[]) {
  const prices = new Map<string, number>();
  for (let offset = 0; offset < ids.length; offset += 50) {
    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.searchParams.set("vs_currency", "brl");
    url.searchParams.set("ids", ids.slice(offset, offset + 50).join(","));
    url.searchParams.set("per_page", "250");
    url.searchParams.set("sparkline", "false");
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error("CoinGecko returned HTTP " + response.status);
    const rows: Array<{ id: string; current_price: number }> = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid market data");
    for (const coin of rows) {
      if (typeof coin.id === "string" && Number.isFinite(coin.current_price) && coin.current_price > 0) {
        prices.set(coin.id, coin.current_price);
      }
    }
  }
  return prices;
}

async function checkAlerts() {
  // A bounded batch prevents a single invocation from running indefinitely.
  const { data, error } = await db.from("price_alerts")
    .select("id,user_id,coin_id,coin_symbol,direction,target_price")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) throw error;
  const alerts = (data ?? []) as PriceAlert[];
  const prices = alerts.length ? await marketPrices([...new Set(alerts.map((a) => a.coin_id))]) : new Map<string, number>();
  let triggered = 0;
  let unavailable = 0;
  for (const alert of alerts) {
    const observed = prices.get(alert.coin_id);
    if (!observed) { unavailable++; continue; }
    const threshold = Number(alert.target_price);
    const hit = thresholdReached(alert.direction, observed, threshold);
    if (!hit) continue;
    // Only the winning worker updates an active alert; the SQL trigger inserts
    // the durable inbox event in this same transaction.
    const { data: updated, error: updateError } = await db.from("price_alerts").update({
      is_active: false,
      triggered_at: new Date().toISOString(),
      triggered_price: observed,
    }).eq("id", alert.id).eq("is_active", true).select("id");
    if (updateError) throw updateError;
    if (updated?.length) triggered++;
  }
  return { scanned: alerts.length, triggered, unavailable, atLimit: alerts.length === 1000 };
}

async function sendPendingEmails() {
  const { data, error } = await db.from("price_notifications")
    .select("id,user_id,coin_symbol,direction,target_price,observed_price,email_attempts")
    .in("email_status", ["pending", "failed"])
    .lt("email_attempts", 3)
    .order("created_at", { ascending: true })
    .limit(40);
  if (error) throw error;
  const messages = (data ?? []) as Notification[];
  if (!resendKey || !fromEmail) return { sent: 0, failed: 0, pending: messages.length };
  let sent = 0;
  let failed = 0;
  for (const message of messages) {
    try {
      const { data: userResult, error: userError } = await db.auth.admin.getUserById(message.user_id);
      if (userError || !userResult.user?.email) throw new Error("Recipient email unavailable");
      const direction = message.direction === "above" ? "acima de" : "abaixo de";
      const subject = "CryptoOps: alerta de " + message.coin_symbol.toUpperCase();
      const emailText = "Seu alerta de " + message.coin_symbol.toUpperCase() + " foi ativado.\n" +
        "Cotação observada: R$ " + message.observed_price + "\n" +
        "Condição: " + direction + " R$ " + message.target_price + "\n\n" +
        "Confira os detalhes no CryptoOps. Dados indicativos, não constituem recomendação de investimento.";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + resendKey,
          "Content-Type": "application/json",
          "Idempotency-Key": "cryptoops-alert/" + message.id,
        },
        body: JSON.stringify({
          from: fromEmail, to: [userResult.user.email], subject, text: emailText,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error("Email provider returned HTTP " + response.status);
      const { error: saveError } = await db.from("price_notifications").update({
        email_status: "sent", email_error: null, email_attempts: message.email_attempts + 1,
      }).eq("id", message.id);
      if (saveError) throw saveError;
      sent++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      console.error("Notification email failed", message.id, reason);
      const { error: saveError } = await db.from("price_notifications").update({
        email_status: "failed",
        email_error: reason.slice(0, 250),
        email_attempts: message.email_attempts + 1,
      }).eq("id", message.id);
      if (saveError) console.error("Could not record email retry state", saveError);
      failed++;
    }
  }
  return { sent, failed, pending: 0 };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const auth = request.headers.get("authorization") ?? "";
  if (!cronSecret || !serviceKey || !supabaseUrl || !securelyEquals(auth, "Bearer " + cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await checkAlerts();
    const email = await sendPendingEmails();
    console.log("CryptoOps alert poll", JSON.stringify({ ...result, email }));
    return Response.json({ ok: true, ...result, email });
  } catch (error) {
    console.error("CryptoOps worker failed", error);
    return Response.json({ ok: false, error: "Price alert processing failed" }, { status: 500 });
  }
});
