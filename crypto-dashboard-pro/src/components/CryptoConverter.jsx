import React, { useState, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";

export function CryptoConverter({ cryptos }) {
  const [amount, setAmount] = useState(1);
  const [selectedCoin, setSelectedCoin] = useState(cryptos[0] || null);

  useEffect(() => {
    if (cryptos.length > 0 && !selectedCoin) {
      setSelectedCoin(cryptos[0]);
    }
  }, [cryptos, selectedCoin]);

  if (!selectedCoin) return null;

  const convertedValue = amount * selectedCoin.current_price;

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-slate-100">
          Conversor Rápido
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Quantidade
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Ativo</label>
          <select
            value={selectedCoin.id}
            onChange={(e) => {
              const coin = cryptos.find((c) => c.id === e.target.value);
              setSelectedCoin(coin);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500 transition-all"
          >
            {cryptos.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs text-slate-400 mb-1">
            Valor Estimado (BRL)
          </span>
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-orange-500 truncate">
            {isNaN(convertedValue)
              ? "R$ 0,00"
              : convertedValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
          </div>
        </div>
      </div>
    </div>
  );
}
