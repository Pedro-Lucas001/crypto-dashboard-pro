import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export function GlobalMetrics() {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGlobalMetrics() {
      try {
        const response = await api.get('/global');
        setGlobalData(response.data.data);
      } catch (error) {
        console.error('Erro ao buscar métricas globais:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGlobalMetrics();
  }, []);

  if (loading || !globalData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-xs text-slate-400">Criptomoedas Ativas</span>
        <p className="text-xl font-bold text-slate-100">{globalData.active_cryptocurrencies.toLocaleString('pt-BR')}</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-xs text-slate-400">Cap. Mercado Global</span>
        <p className="text-xl font-bold text-orange-500">
          {globalData.total_market_cap.brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-xs text-slate-400">Volume 24h</span>
        <p className="text-xl font-bold text-slate-100">
          {globalData.total_volume.brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <span className="text-xs text-slate-400">Dominância do Bitcoin</span>
        <p className="text-xl font-bold text-emerald-400">{globalData.market_cap_percentage.btc.toFixed(1)}%</p>
      </div>
    </div>
  );
}