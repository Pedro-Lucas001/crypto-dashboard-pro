import { useEffect, useState } from "react";

function formatBRL(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: value < 1 ? 6 : 2 }).format(value);
}
export function CryptoConverter({ cryptos }) {
  const [amount, setAmount] = useState("1");
  const [selectedCoinId, setSelectedCoinId] = useState("");
  useEffect(() => {
    if (cryptos.length && !cryptos.some((coin) => coin.id === selectedCoinId)) setSelectedCoinId(cryptos[0].id);
  }, [cryptos, selectedCoinId]);

  const selected = cryptos.find((coin) => coin.id === selectedCoinId);
  const numericAmount = Number(amount);
  const validAmount = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount >= 0;
  const result = validAmount && selected ? numericAmount * selected.current_price : NaN;

  if (!cryptos.length) return <div className="empty-state"><strong>Sem cotações para converter</strong><span>Atualize os dados e tente novamente.</span></div>;

  return (
    <div className="converter-content">
      <div className="converter-fields">
        <div className="converter-field">
          <label htmlFor="crypto-quantity">Quantidade</label>
          <input id="crypto-quantity" type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div className="converter-field">
          <label htmlFor="crypto-asset">Criptomoeda</label>
          <select id="crypto-asset" value={selectedCoinId} onChange={(event) => setSelectedCoinId(event.target.value)}>
            {cryptos.map((coin) => <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol.toUpperCase()})</option>)}
          </select>
        </div>
      </div>
      <div className="converter-result" aria-live="polite">
        <span>Valor estimado em reais</span>
        <strong>{formatBRL(result)}</strong>
      </div>
      <p className="converter-note">* Conversão indicativa sem taxas de negociação ou spread. Cotação sujeita a alterações.</p>
    </div>
  );
}
