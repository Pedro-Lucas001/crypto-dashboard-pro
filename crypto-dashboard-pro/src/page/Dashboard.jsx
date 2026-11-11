import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  Coins,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { CryptoChart } from "../components/CryptoChart";
import { GlobalMetrics } from "../components/GlobalMetrics";
import { CryptoConverter } from "../components/CryptoConverter";

const NAV_ITEMS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "markets", label: "Mercado de ativos", icon: Coins },
  { id: "converter", label: "Conversor", icon: ArrowRightLeft },
];

const HEADINGS = {
  overview: {
    eyebrow: "INTELIGÊNCIA DE MERCADO",
    title: "Visão geral do mercado",
    description: "Acompanhe os principais movimentos do mercado cripto em um só lugar.",
  },
  markets: {
    eyebrow: "EXPLORAR ATIVOS",
    title: "Mercado de criptomoedas",
    description: "Compare preços, capitalização e variações dos principais ativos.",
  },
  converter: {
    eyebrow: "FERRAMENTAS",
    title: "Conversor de criptomoedas",
    description: "Simule conversões com base nas últimas cotações disponíveis.",
  },
};

function formatMoney(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 8 : value > 0 && value < 1 ? 6 : 2,
  }).format(value);
}

function formatCompactBRL(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return "R$ " + new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function PriceChange({ value }) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span className="change change-neutral">—</span>;
  }
  const rising = value >= 0;
  const Icon = rising ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={"change " + (rising ? "change-up" : "change-down")}>
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
      {Math.abs(value).toFixed(2).replace(".", ",")}%
    </span>
  );
}

function AssetIdentity({ coin }) {
  return (
    <span className="asset-identity">
      <img src={coin.image} alt="" className="asset-avatar" loading="lazy" />
      <span className="asset-names">
        <span className="asset-name">{coin.name}</span>
        <span className="asset-symbol">{coin.symbol?.toUpperCase()}</span>
      </span>
    </span>
  );
}

function MarketTable({ coins, selectedId, onSelect, compact = false }) {
  if (coins.length === 0) {
    return (
      <div className="empty-state">
        <Search size={22} aria-hidden="true" />
        <strong>Nenhum ativo encontrado</strong>
        <span>Tente pesquisar outro nome ou símbolo.</span>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className={"market-table " + (compact ? "market-table-compact" : "")}>
        <thead>
          <tr>
            <th scope="col">Ativo</th>
            <th scope="col">Preço atual</th>
            <th scope="col">24 horas</th>
            <th scope="col" className="market-cap-col">Capitalização</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id} className={selectedId === coin.id ? "is-selected" : ""}>
              <td>
                <button type="button" className="asset-button" onClick={() => onSelect(coin.id)} aria-label={"Ver gráfico de " + coin.name}>
                  <AssetIdentity coin={coin} />
                </button>
              </td>
              <td className="price-cell">{formatMoney(coin.current_price)}</td>
              <td><PriceChange value={coin.price_change_percentage_24h} /></td>
              <td className="market-cap-col muted-cell">{formatCompactBRL(coin.market_cap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const [cryptos, setCryptos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCoinId, setSelectedCoinId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [metricsRefresh, setMetricsRefresh] = useState(0);

  const loadCryptos = useCallback(async (signal) => {
    setRefreshing(true);
    try {
      const response = await api.get("/coins/markets", {
        params: {
          vs_currency: "brl",
          order: "market_cap_desc",
          per_page: 15,
          page: 1,
          sparkline: false,
        },
        signal,
      });
      if (!Array.isArray(response.data)) {
        throw new Error("Resposta de mercado inválida");
      }
      setCryptos(response.data);
      setError("");
      setLastUpdated(new Date());
    } catch (requestError) {
      if (signal?.aborted) return;
      console.error("Falha ao carregar mercado:", requestError);
      setError("Não foi possível atualizar as cotações. Verifique a conexão ou tente novamente em instantes.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCryptos(controller.signal);
    const interval = window.setInterval(() => loadCryptos(controller.signal), 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [loadCryptos]);

  const selectedCoin = cryptos.find((coin) => coin.id === selectedCoinId) || cryptos[0] || null;
  const filteredCryptos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cryptos.filter((coin) =>
      coin.name?.toLowerCase().includes(query) || coin.symbol?.toLowerCase().includes(query),
    );
  }, [cryptos, search]);
  const topGainers = useMemo(() =>
    [...cryptos]
      .filter((coin) => Number.isFinite(coin.price_change_percentage_24h) && coin.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 5),
  [cryptos]);

  const selectTab = (id) => {
    setActiveTab(id);
    setMenuOpen(false);
  };
  const selectCoin = (id) => {
    setSelectedCoinId(id);
    selectTab("overview");
  };
  const refresh = () => {
    loadCryptos();
    setMetricsRefresh((count) => count + 1);
  };
  const heading = HEADINGS[activeTab];

  return (
    <div className="app-shell">
      {menuOpen && (
        <button type="button" className="mobile-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu de navegação" />
      )}

      <aside className={"sidebar " + (menuOpen ? "sidebar-open" : "")} aria-label="Menu principal">
        <div className="brand">
          <div className="brand-mark"><TrendingUp size={22} strokeWidth={2.5} aria-hidden="true" /></div>
          <div className="brand-wordmark">
            <strong>Crypto<span>Ops</span></strong>
            <small>MARKET INTELLIGENCE</small>
          </div>
          <button type="button" className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Seções do painel">
          <span className="sidebar-label">WORKSPACE</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => selectTab(id)} aria-current={activeTab === id ? "page" : undefined} className={"nav-item " + (activeTab === id ? "nav-item-active" : "")}>
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {activeTab === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="source-card">
            <div className={"source-dot " + (error || !lastUpdated ? "source-dot-offline" : "")} />
            <div>
              <strong>{error ? "Conexão instável" : lastUpdated ? "Cotações atualizadas" : "Aguardando dados"}</strong>
              <span>Fonte: CoinGecko API</span>
            </div>
          </div>
          <p>CryptoOps <span>·</span> Painel de mercado</p>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <div className="topbar-start">
            <button type="button" className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu de navegação">
              <Menu size={22} />
            </button>
            <span className="breadcrumb-label">Painel</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">{activeTab === "overview" ? "Visão geral" : activeTab === "markets" ? "Mercado" : "Conversor"}</span>
          </div>

          <div className="topbar-actions">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Pesquisar criptomoedas</span>
              <input type="search" placeholder="Buscar ativo..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <span className="search-shortcut">BTC</span>
            </label>
            <button type="button" className="refresh-button" onClick={refresh} disabled={refreshing} aria-label="Atualizar cotações">
              <RefreshCw size={16} className={refreshing ? "is-spinning" : ""} aria-hidden="true" />
              <span>Atualizar</span>
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" />{heading.eyebrow}</div>
              <h1>{heading.title}</h1>
              <p>{heading.description}</p>
            </div>
            <div className="updated-label" aria-live="polite">
              <span className={"status-pill " + (error ? "status-warning" : "")}>
                <span className="status-indicator" />
                {error ? "Atualização indisponível" : refreshing ? "Atualizando dados" : lastUpdated ? "Dados carregados" : "Conectando"}
              </span>
              {lastUpdated && <span className="updated-time">Última atualização: {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </div>

          {error && (
            <div className="alert-banner" role="alert">
              <span>{error}</span>
              <button type="button" onClick={refresh}>Tentar novamente <ArrowRight size={14} /></button>
            </div>
          )}

          {activeTab !== "converter" && <GlobalMetrics refreshKey={metricsRefresh} />}

          {loading ? (
            <div className="loading-panel" role="status" aria-live="polite">
              <div className="loading-spinner" />
              <strong>Preparando seu painel</strong>
              <span>Carregando cotações do mercado...</span>
            </div>
          ) : activeTab === "converter" ? (
            <section className="converter-layout">
              <div className="panel converter-panel">
                <div className="panel-heading">
                  <div><div className="panel-kicker">FERRAMENTA DE MERCADO</div><h2>Simulador de conversão</h2><p>Veja o valor estimado entre criptomoedas e reais.</p></div>
                </div>
                <CryptoConverter cryptos={cryptos} />
              </div>
              <div className="converter-aside">
                <div className="info-icon"><ArrowRightLeft size={22} /></div>
                <h3>Conversão simplificada</h3>
                <p>Os valores são calculados a partir da última cotação disponível. Podem variar em relação ao preço final de uma operação.</p>
                <div className="info-rule" />
                <span>Moeda de referência</span><strong>Real brasileiro · BRL</strong>
              </div>
            </section>
          ) : activeTab === "markets" ? (
            <section className="panel market-panel">
              <div className="panel-heading panel-heading-split">
                <div><div className="panel-kicker">ACOMPANHAMENTO</div><h2>Todos os ativos</h2><p>Selecione um ativo para visualizar seu histórico.</p></div>
                <span className="count-pill">{filteredCryptos.length} ativos</span>
              </div>
              <MarketTable coins={filteredCryptos} selectedId={selectedCoin?.id} onSelect={selectCoin} />
            </section>
          ) : (
            <>
              <div className="overview-grid">
                <section className="panel chart-panel">
                  <div className="panel-heading panel-heading-split chart-heading">
                    <div>
                      <div className="panel-kicker">DESTAQUE DO MERCADO</div>
                      {selectedCoin ? (
                        <div className="selected-asset"><img src={selectedCoin.image} alt="" /><div><h2>{selectedCoin.name}</h2><span>{selectedCoin.symbol?.toUpperCase()} / BRL</span></div></div>
                      ) : <h2>Histórico de mercado</h2>}
                    </div>
                    {selectedCoin && <div className="selected-price"><strong>{formatMoney(selectedCoin.current_price)}</strong><PriceChange value={selectedCoin.price_change_percentage_24h} /></div>}
                  </div>
                  {selectedCoin ? (
                    <>
                      <div className="chart-toolbar">
                        <span>Variação de preço</span>
                        <span className="period-chip"><BarChart3 size={14} /> Últimos 7 dias</span>
                      </div>
                      <CryptoChart coinId={selectedCoin.id} coinName={selectedCoin.name} />
                    </>
                  ) : (
                    <div className="empty-state"><Coins size={24} /><strong>Sem dados de mercado</strong><span>Atualize para carregar o gráfico.</span></div>
                  )}
                </section>

                <section className="panel movers-panel">
                  <div className="panel-heading">
                    <div className="panel-kicker">MOVIMENTO DO DIA</div>
                    <h2>Maiores altas</h2>
                    <p>Variação positiva nas últimas 24h</p>
                  </div>
                  {topGainers.length > 0 ? (
                    <div className="movers-list">
                      {topGainers.map((coin, index) => (
                        <button type="button" className="mover-row" key={coin.id} onClick={() => selectCoin(coin.id)}>
                          <span className="mover-rank">{String(index + 1).padStart(2, "0")}</span>
                          <AssetIdentity coin={coin} />
                          <PriceChange value={coin.price_change_percentage_24h} />
                          <ArrowRight size={15} className="mover-arrow" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state"><TrendingUp size={23} /><strong>Sem altas no momento</strong><span>Nenhum dos ativos monitorados apresenta variação positiva.</span></div>
                  )}
                  <div className="panel-bottom-note">Ranking entre os 15 maiores ativos por capitalização.</div>
                </section>
              </div>

              <section className="panel market-panel">
                <div className="panel-heading panel-heading-split">
                  <div><div className="panel-kicker">PANORAMA</div><h2>Ativos monitorados</h2><p>Preços e desempenho das principais criptomoedas.</p></div>
                  <button type="button" className="text-link" onClick={() => selectTab("markets")}>Ver mercado completo <ArrowRight size={16} /></button>
                </div>
                <MarketTable compact coins={filteredCryptos.slice(0, 7)} selectedId={selectedCoin?.id} onSelect={selectCoin} />
              </section>
            </>
          )}

          <footer className="dashboard-footer">
            <span>Dados de mercado fornecidos pela CoinGecko.</span>
            <span>Conteúdo informativo. Não constitui recomendação de investimento.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
