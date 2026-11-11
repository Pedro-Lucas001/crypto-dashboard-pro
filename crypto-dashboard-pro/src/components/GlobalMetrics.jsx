import { useEffect, useState } from "react";
import { Activity, BarChart3, Bitcoin, Globe2 } from "lucide-react";
import { api } from "../services/api";

function formatCompact(value) {
  if (!Number.isFinite(value)) return "—";
  return "R$ " + new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}
const cards = [
  { label: "Criptomoedas ativas", hint: "Ativos no mercado", icon: Activity, getValue: (data) => Number(data.active_cryptocurrencies ?? 0).toLocaleString("pt-BR") },
  { label: "Capitalização global", hint: "Valor total do mercado", icon: Globe2, getValue: (data) => formatCompact(data.total_market_cap?.brl) },
  { label: "Volume em 24h", hint: "Volume negociado global", icon: BarChart3, getValue: (data) => formatCompact(data.total_volume?.brl) },
  { label: "Dominância BTC", hint: "Participação de mercado", icon: Bitcoin, getValue: (data) => Number.isFinite(data.market_cap_percentage?.btc) ? data.market_cap_percentage.btc.toFixed(1).replace(".", ",") + "%" : "—" },
];

export function GlobalMetrics({ refreshKey = 0 }) {
  const [globalData, setGlobalData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await api.get("/global", { signal: controller.signal });
        if (!response.data?.data) throw new Error("Métricas globais indisponíveis");
        setGlobalData(response.data.data);
        setError(false);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Erro ao carregar métricas globais:", err);
          setError(true);
        }
      }
    }
    load();
    const interval = window.setInterval(load, 60_000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [refreshKey]);

  return (
    <section className="metrics-grid" aria-label="Indicadores globais do mercado">
      {cards.map(({ label, hint, icon: Icon, getValue }) => (
        <article className="metric-card" key={label}>
          <div className="metric-icon"><Icon size={17} strokeWidth={1.9} aria-hidden="true" /></div>
          <span className="metric-label">{label}</span>
          <div className="metric-value">{globalData ? getValue(globalData) : "—"}</div>
          <div className="metric-bottom">{error ? "Dados podem estar desatualizados" : hint}</div>
        </article>
      ))}
    </section>
  );
}
