import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BellRing, Check, CircleUserRound, LoaderCircle, LogOut, Plus, Star, Trash2 } from "lucide-react";
import {
  clearSession, cryptoStore, currentSession, getAuthenticatedUser,
  signIn, signOut, signUp, subscribeSession, supabaseConfigured,
} from "../services/cryptoAccount";

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
    maximumFractionDigits: number > 0 && number < 1 ? 6 : 2,
  }).format(number);
}
function time(value) {
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function Notice({ message, negative = false }) {
  return message ? <div role={negative ? "alert" : "status"} className={"workspace-notice " + (negative ? "workspace-notice-error" : "")}>{message}</div> : null;
}

export function CryptoWorkspace({ tab, cryptos, onSelectCoin }) {
  const [user, setUser] = useState(currentSession()?.user ?? null);
  const [authChecking, setAuthChecking] = useState(Boolean(currentSession()));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [coinId, setCoinId] = useState("");
  const [direction, setDirection] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeSession((next) => {
      if (!mounted) return;
      setUser(next?.user ?? null);
      if (!next) { setFavorites([]); setAlerts([]); setInbox([]); }
    });
    async function validate() {
      if (!currentSession()) { setAuthChecking(false); return; }
      try {
        const fresh = await getAuthenticatedUser();
        if (mounted) setUser(fresh);
      } catch (err) {
        if ([400, 401, 403].includes(err.status)) {
          clearSession();
          if (mounted) setError("Sua sessão expirou. Entre novamente.");
        } else if (mounted) {
          setError("Não foi possível validar a sessão. Verifique sua conexão.");
        }
      } finally { if (mounted) setAuthChecking(false); }
    }
    validate();
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [savedFavorites, savedAlerts, notifications] = await Promise.all([
        cryptoStore.favorites(), cryptoStore.alerts(), cryptoStore.notifications(),
      ]);
      setFavorites(savedFavorites || []);
      setAlerts(savedAlerts || []);
      setInbox(notifications || []);
      setError("");
    } catch (err) {
      setError(err.message || "Não foi possível carregar sua conta.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    refresh();
    const interval = window.setInterval(refresh, 45_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [user?.id, refresh]);

  useEffect(() => {
    if (cryptos.length && !cryptos.some((coin) => coin.id === coinId)) {
      setCoinId(cryptos[0].id);
    }
  }, [cryptos, coinId]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.coin_id)), [favorites]);
  const currentCoin = cryptos.find((coin) => coin.id === coinId);
  const unread = inbox.filter((entry) => !entry.read_at).length;

  async function handleAuth(event) {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (authMode === "signin") {
        await signIn(email.trim(), password);
        await getAuthenticatedUser();
        setMessage("Conectado com sucesso.");
      } else {
        const loggedIn = await signUp(email.trim(), password);
        if (loggedIn) await getAuthenticatedUser();
        else setMessage("Conta criada. Confirme o e-mail enviado pelo Supabase antes de entrar.");
      }
      setPassword("");
    } catch (err) {
      setError(err.message || "Não foi possível autenticar.");
    } finally { setBusy(false); }
  }

  async function execute(action, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await refresh();
      if (success) setMessage(success);
    } catch (err) {
      setError(err.message || "Operação não concluída.");
    } finally { setBusy(false); }
  }

  const toggleFavorite = (coin) => execute(
    () => favoriteIds.has(coin.id) ? cryptoStore.removeFavorite(coin.id) : cryptoStore.addFavorite(user.id, coin),
  );

  function createAlert(event) {
    event.preventDefault();
    const amount = Number(targetPrice);
    if (!currentCoin || !Number.isFinite(amount) || amount <= 0) {
      setError("Selecione um ativo e informe um preço-alvo maior que zero.");
      return;
    }
    execute(
      () => cryptoStore.addAlert(user.id, currentCoin, direction, amount, notifyEmail),
      "Alerta criado. A avaliação de preços ocorrerá na próxima execução agendada.",
    );
  }

  if (!supabaseConfigured) {
    return (
      <section className="panel workspace-panel">
        <div className="workspace-empty">
          <AlertCircle size={24} />
          <h2>Conexão com Supabase pendente</h2>
          <p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local para habilitar contas, favoritos e alertas.</p>
          <span>Use um projeto Supabase dedicado ao CryptoOps.</span>
        </div>
      </section>
    );
  }

  if (authChecking) {
    return <div role="status" className="loading-panel"><LoaderCircle className="is-spinning" /><span>Validando sua sessão...</span></div>;
  }

  if (!user) {
    return (
      <section className="auth-layout">
        <div className="panel auth-panel">
          <span className="panel-kicker">CONTA CRYPTOOPS</span>
          <div className="account-icon"><CircleUserRound size={25} /></div>
          <h2>{authMode === "signin" ? "Acesse sua conta" : "Crie sua conta"}</h2>
          <p>Salve favoritos e configure alertas persistentes, sincronizados com sua conta.</p>
          <form className="workspace-form" onSubmit={handleAuth}>
            <label htmlFor="account-email">E-mail</label>
            <input id="account-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@exemplo.com" />
            <label htmlFor="account-password">Senha</label>
            <input id="account-password" type="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo de 6 caracteres" />
            <button type="submit" className="workspace-primary" disabled={busy}>
              {busy ? "Processando..." : authMode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <button type="button" className="workspace-text-button" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}>
            {authMode === "signin" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
          <Notice message={error} negative />
          <Notice message={message} />
        </div>
        <aside className="auth-benefits">
          <h3>Monitoramento personalizado</h3>
          <p>Crie sua lista de ativos e acompanhe disparos de alertas mesmo depois de fechar o navegador.</p>
          <div><Star size={18} /><span>Favoritos sincronizados</span></div>
          <div><BellRing size={18} /><span>Alertas persistentes</span></div>
          <div><Check size={18} /><span>Histórico de notificações</span></div>
        </aside>
      </section>
    );
  }

  return (
    <section className="workspace-stack">
      <div className="workspace-summary">
        <div className="workspace-profile"><CircleUserRound size={23} /><div><strong>{user.email}</strong><span>Conta conectada</span></div></div>
        <div className="workspace-stats">
          <span><Star size={15} /> {favorites.length} favoritos</span>
          <span><BellRing size={15} /> {alerts.filter((a) => a.is_active).length} alertas ativos</span>
          <span>{unread} não lidas</span>
        </div>
        <button type="button" className="workspace-logout" onClick={async () => { setBusy(true); setError(""); try { await signOut(); setMessage("Sessão encerrada."); } catch (err) { setError(err.message || "Falha ao encerrar a sessão."); } finally { setBusy(false); } }}><LogOut size={16} /> Sair</button>
      </div>
      <Notice message={error} negative />
      <Notice message={message} />
      {loading && <div role="status" className="workspace-loading">Carregando sua conta...</div>}

      {tab === "account" && (
        <div className="panel workspace-panel">
          <div className="panel-heading"><span className="panel-kicker">MINHA CONTA</span><h2>Preferências de monitoramento</h2><p>Seus dados são associados a esta conta e protegidos por políticas de acesso no Supabase.</p></div>
          <div className="workspace-account-copy">Para gerenciar sua carteira e configurar alertas, acesse as seções <strong>Favoritos</strong>, <strong>Alertas</strong> e <strong>Notificações</strong> no menu lateral.</div>
        </div>
      )}

      {tab === "watchlist" && (
        <div className="panel workspace-panel">
          <div className="panel-heading"><span className="panel-kicker">MEUS ATIVOS</span><h2>Favoritos</h2><p>Selecione a estrela para salvar ou remover ativos da sua conta.</p></div>
          <div className="workspace-list">
            {cryptos.length ? cryptos.map((coin) => (
              <div className="workspace-item" key={coin.id}>
                <img src={coin.image} alt="" />
                <div className="workspace-item-main"><strong>{coin.name}</strong><span>{coin.symbol.toUpperCase()}</span></div>
                <strong className="workspace-price">{money(coin.current_price)}</strong>
                <button type="button" disabled={busy} className={"workspace-star " + (favoriteIds.has(coin.id) ? "workspace-star-active" : "")} onClick={() => toggleFavorite(coin)} aria-label={(favoriteIds.has(coin.id) ? "Remover " : "Favoritar ") + coin.name} aria-pressed={favoriteIds.has(coin.id)}><Star size={19} fill={favoriteIds.has(coin.id) ? "currentColor" : "none"} /></button>
                <button type="button" className="workspace-secondary workspace-view" onClick={() => onSelectCoin(coin.id)}>Gráfico</button>
              </div>
            )) : <div className="workspace-empty">Não há cotações disponíveis. Confira sua conexão com a API.</div>}
            {favorites.some((favorite) => !cryptos.some((coin) => coin.id === favorite.coin_id)) && (
              <div className="workspace-archived">Outros favoritos salvos: {favorites.filter((f) => !cryptos.some((coin) => coin.id === f.coin_id)).map((f) => f.coin_name).join(", ")}.</div>
            )}
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="workspace-two-columns">
          <div className="panel workspace-panel">
            <div className="panel-heading"><span className="panel-kicker">NOVO ALERTA</span><h2>Definir preço-alvo</h2><p>O monitoramento ocorre no servidor, inclusive com o site fechado.</p></div>
            <form className="workspace-form" onSubmit={createAlert}>
              <label htmlFor="alert-coin">Criptomoeda</label>
              <select id="alert-coin" value={coinId} onChange={(e) => setCoinId(e.target.value)} required disabled={!cryptos.length}>
                {cryptos.map((coin) => <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol.toUpperCase()})</option>)}
              </select>
              <label htmlFor="alert-direction">Quando a cotação estiver</label>
              <select id="alert-direction" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="above">Igual ou acima de</option>
                <option value="below">Igual ou abaixo de</option>
              </select>
              <label htmlFor="alert-target">Preço-alvo (BRL)</label>
              <input id="alert-target" type="number" min="0.000000000001" step="any" inputMode="decimal" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="Ex.: 350000" required />
              {currentCoin && <span className="workspace-hint">Cotação observada no painel: {money(currentCoin.current_price)}</span>}
              <label className="workspace-checkbox"><input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} /> Também enviar por e-mail (quando o provedor estiver configurado)</label>
              <button type="submit" className="workspace-primary" disabled={busy || !cryptos.length}><Plus size={17} /> Criar alerta</button>
            </form>
          </div>
          <div className="panel workspace-panel">
            <div className="panel-heading"><span className="panel-kicker">MINHA AUTOMAÇÃO</span><h2>Alertas cadastrados</h2><p>Um alerta dispara uma vez e fica inativo até ser reativado.</p></div>
            <div className="workspace-list">
              {alerts.length === 0 ? <div className="workspace-empty">Nenhum alerta cadastrado.</div> : alerts.map((alert) => (
                <div className="workspace-item workspace-alert-item" key={alert.id}>
                  <div className="workspace-item-main"><strong>{alert.coin_symbol?.toUpperCase()}</strong><span>{alert.direction === "above" ? "Acima de" : "Abaixo de"} {money(alert.target_price)}</span></div>
                  <span className={"workspace-state " + (alert.is_active ? "workspace-state-active" : "")}>{alert.is_active ? "Ativo" : "Disparado / pausado"}</span>
                  <button type="button" disabled={busy} className="workspace-secondary" onClick={() => execute(() => cryptoStore.setAlertActive(alert.id, !alert.is_active))}>{alert.is_active ? "Pausar" : "Reativar"}</button>
                  <button type="button" disabled={busy} className="workspace-danger" onClick={() => execute(() => cryptoStore.removeAlert(alert.id))} aria-label={"Excluir alerta de " + alert.coin_symbol}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "inbox" && (
        <div className="panel workspace-panel">
          <div className="panel-heading"><span className="panel-kicker">CENTRAL DE NOTIFICAÇÕES</span><h2>Alertas disparados</h2><p>Eventos registrados pelo servidor e vinculados à sua conta.</p></div>
          <div className="workspace-list">
            {inbox.length === 0 ? <div className="workspace-empty"><BellRing size={25} /><span>Nenhum alerta disparado ainda.</span></div> : inbox.map((entry) => (
              <div className={"workspace-item workspace-notification " + (!entry.read_at ? "workspace-unread" : "")} key={entry.id}>
                <div className="workspace-notification-icon"><BellRing size={17} /></div>
                <div className="workspace-item-main">
                  <strong>{entry.coin_symbol?.toUpperCase()}: alvo atingido</strong>
                  <span>Cotação: {money(entry.observed_price)} · {entry.direction === "above" ? "Acima" : "Abaixo"} de {money(entry.target_price)}</span>
                  <small>{time(entry.triggered_at)} {entry.email_status === "sent" ? " · E-mail enviado" : ""}</small>
                </div>
                {!entry.read_at && <button type="button" disabled={busy} className="workspace-secondary" onClick={() => execute(() => cryptoStore.markRead(entry.id))}><Check size={15} /> Marcar lida</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
