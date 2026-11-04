import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export function CryptoChart({ coinId, coinName }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChartData() {
      try {
        setLoading(true);
        // Busca os dados históricos dos últimos 7 dias
        const response = await api.get(`/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'brl',
            days: 7,
          },
        });

        // Formata os dados para o Recharts (timestamp e preço)
        const prices = response.data.prices.map(([timestamp, price]) => {
          const date = new Date(timestamp);
          return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: price,
          };
        });

        setChartData(prices);
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
      } finally {
        setLoading(false);
      }
    }

    if (coinId) {
      loadChartData();
    }
  }, [coinId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400 animate-pulse">A carregar gráfico histórico...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">
        Histórico de Preços (7 dias) - <span className="text-orange-500">{coinName}</span>
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 12 }} />
            <YAxis 
              stroke="#64748b" 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
              formatter={(value) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 'Preço']}
            />
            <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}