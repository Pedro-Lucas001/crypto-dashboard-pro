import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/api";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: value < 1 ? 6 : 2 }).format(value);
}

export function CryptoChart({ coinId, coinName }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      setChartData([]);
      try {
        const { data } = await api.get("/coins/" + encodeURIComponent(coinId) + "/market_chart", {
          params: { vs_currency: "brl", days: 7 },
          signal: controller.signal,
        });
        if (!Array.isArray(data.prices)) throw new Error("Histórico inválido");
        setChartData(data.prices.map(([timestamp, price]) => ({ timestamp, price })));
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Erro ao carregar gráfico:", err);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    if (coinId) load();
    return () => controller.abort();
  }, [coinId]);

  if (loading) return <div className="chart-area chart-loading" role="status">Carregando histórico de {coinName}...</div>;
  if (error || chartData.length === 0) return <div className="chart-area chart-loading" role="status">Histórico indisponível no momento.</div>;

  return (
    <div className="chart-area" role="img" aria-label={"Gráfico de preços de " + coinName + " nos últimos sete dias"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 9, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="cryptoPriceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#42d6a6" stopOpacity={0.29} />
              <stop offset="95%" stopColor="#42d6a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#243039" strokeDasharray="3 5" />
          <XAxis dataKey="timestamp" type="number" domain={["dataMin", "dataMax"]} scale="time" tickFormatter={(time) => new Date(time).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} minTickGap={30} axisLine={false} tickLine={false} tick={{ fill: "#748494", fontSize: 10 }} dy={10} />
          <YAxis domain={["auto", "auto"]} tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v)} axisLine={false} tickLine={false} width={55} tick={{ fill: "#748494", fontSize: 10 }} />
          <Tooltip labelFormatter={(time) => new Date(time).toLocaleString("pt-BR")} formatter={(value) => [money(value), "Preço"]} contentStyle={{ background: "#182029", border: "1px solid #35424e", borderRadius: 10, color: "#eaf0f5", fontSize: 12 }} labelStyle={{ color: "#a9b5c1" }} />
          <Area type="monotone" dataKey="price" stroke="#48dcb0" strokeWidth={2.4} fill="url(#cryptoPriceFill)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
