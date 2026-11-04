import React from "react";

export function CardCrypto({ coin }) {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-orange-500/50 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <img src={coin.image} alt={coin.name} className="w-8 h-8" />
        <div>
          <h2 className="font-bold text-lg text-slate-100">{coin.name}</h2>
          <span className="text-xs uppercase text-slate-400">
            {coin.symbol}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-end mt-4">
        <div>
          <span className="text-xs text-slate-400">Preço (BRL)</span>
          <p className="text-xl font-semibold text-slate-100">
            {coin.current_price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <span
          className={`text-sm font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
        >
          {isPositive ? "+" : ""}
          {coin.price_change_percentage_24h?.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
