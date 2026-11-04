import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { CryptoChart } from "../components/CryptoChart";
import { GlobalMetrics } from "../components/GlobalMetrics";
import { CryptoConverter } from "../components/CryptoConverter";
import {
  TrendingUp,
  Search,
  LayoutDashboard,
  Coins,
  ArrowRightLeft,
  Bell,
  Globe,
  Flame,
} from "lucide-react";

export function Dashboard() {
  const [cryptos, setCryptos] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadCryptos() {
      try {
        const response = await api.get("/coins/markets", {
          params: {
            vs_currency: "brl",
            order: "market_cap_desc",
            per_page: 15,
            page: 1,
            sparkline: false,
          },
        });
        setCryptos(response.data);
        if (response.data.length > 0) {
          setSelectedCoin(response.data[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar cotações:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCryptos();
  }, []);

  const filteredCryptos = cryptos.filter((coin) => {
    return (
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    );
  });

  const topGainers = [...cryptos]
    .sort(
      (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
    )
    .slice(0, 5);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#020203",
        color: "#eee",
        fontFamily: "sans-serif",
      }}
    >
      {/* 1. SIDEBAR LATERAL FIXA */}
      <aside
        style={{
          width: "260px",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          backgroundColor: "#040406",
          borderRight: "1px solid #191b1d",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
        }}
      >
        <div
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            borderBottom: "1px solid #191b1d",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                color: "#000",
              }}
            >
              <TrendingUp
                style={{ width: "20px", height: "20px", color: "#10b981" }}
              />
            </div>
            <span style={{ fontWeight: 600, fontSize: "18px", color: "#fff" }}>
              CryptoOps
            </span>
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "overview" ? "#101214" : "transparent",
              color: activeTab === "overview" ? "#fff" : "#8f8f8f",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              position: "relative",
            }}
          >
            {activeTab === "overview" && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "24px",
                  borderTopRightRadius: "99px",
                  borderBottomRightRadius: "99px",
                  backgroundColor: "#10b981",
                }}
              ></span>
            )}
            <LayoutDashboard style={{ width: "20px", height: "20px" }} />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab("markets")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "markets" ? "#101214" : "transparent",
              color: activeTab === "markets" ? "#fff" : "#8f8f8f",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              position: "relative",
            }}
          >
            {activeTab === "markets" && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "24px",
                  borderTopRightRadius: "99px",
                  borderBottomRightRadius: "99px",
                  backgroundColor: "#10b981",
                }}
              ></span>
            )}
            <Coins style={{ width: "20px", height: "20px" }} />
            <span>Mercado de Ativos</span>
          </button>

          <button
            onClick={() => setActiveTab("converter")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor:
                activeTab === "converter" ? "#101214" : "transparent",
              color: activeTab === "converter" ? "#fff" : "#8f8f8f",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              position: "relative",
            }}
          >
            {activeTab === "converter" && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "24px",
                  borderTopRightRadius: "99px",
                  borderBottomRightRadius: "99px",
                  backgroundColor: "#10b981",
                }}
              ></span>
            )}
            <ArrowRightLeft style={{ width: "20px", height: "20px" }} />
            <span>Conversor Rápido</span>
          </button>
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid #191b1d" }}>
          <div
            style={{
              backgroundColor: "#101214",
              padding: "12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
              }}
            ></div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "#fff" }}>
                API CoinGecko
              </p>
              <p style={{ fontSize: "10px", color: "#8f8f8f" }}>Sincronizado</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CORPO PRINCIPAL DESLOCADO PARA A DIREITA DA SIDEBAR */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: "260px",
        }}
      >
        {/* HEADER SUPERIOR */}
        <header
          style={{
            height: "64px",
            borderBottom: "1px solid #191b1d",
            backgroundColor: "rgba(2, 2, 3, 0.8)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#fff",
                margin: 0,
              }}
            >
              {activeTab === "overview" && "Visão Geral do Mercado"}
              {activeTab === "markets" && "Listagem de Ativos"}
              {activeTab === "converter" && "Conversor de Moedas"}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#8f8f8f",
              }}
            >
              <Globe
                style={{ width: "16px", height: "16px", color: "#10b981" }}
              />
              <span>Moeda Base: BRL (R$)</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                width: "240px",
              }}
            >
              <Search
                style={{
                  position: "absolute",
                  left: "12px",
                  width: "16px",
                  height: "16px",
                  color: "#8f8f8f",
                }}
              />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  paddingLeft: "36px",
                  paddingRight: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#101214",
                  border: "1px solid #191b1d",
                  fontSize: "14px",
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>

            <button
              style={{
                position: "relative",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                color: "#8f8f8f",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Bell style={{ width: "20px", height: "20px" }} />
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                }}
              ></span>
            </button>

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                overflow: "hidden",
                backgroundColor: "#101214",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#10b981",
                border: "1px solid #191b1d",
              }}
            >
              PL
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {activeTab === "converter" ? (
            <div
              style={{ maxWidth: "600px", margin: "40px auto", width: "100%" }}
            >
              <CryptoConverter cryptos={cryptos} />
            </div>
          ) : (
            <>
              <GlobalMetrics />

              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "250px",
                  }}
                >
                  <p style={{ color: "#8f8f8f" }}>
                    A carregar dados do ecossistema...
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {selectedCoin && activeTab === "overview" && (
                    <div
                      style={{
                        backgroundColor: "#050607",
                        border: "1px solid #191b1d",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img
                            src={selectedCoin.image}
                            alt={selectedCoin.name}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                            }}
                          />
                          <div>
                            <h3
                              style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#fff",
                                margin: 0,
                              }}
                            >
                              {selectedCoin.name}
                            </h3>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#8f8f8f",
                                textTransform: "uppercase",
                              }}
                            >
                              {selectedCoin.symbol} / BRL
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: "18px",
                              fontWeight: 700,
                              color: "#fff",
                              margin: 0,
                            }}
                          >
                            {selectedCoin.current_price.toLocaleString(
                              "pt-BR",
                              { style: "currency", currency: "BRL" },
                            )}
                          </p>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color:
                                selectedCoin.price_change_percentage_24h >= 0
                                  ? "#10b981"
                                  : "#f87171",
                            }}
                          >
                            {selectedCoin.price_change_percentage_24h >= 0
                              ? "+"
                              : ""}
                            {selectedCoin.price_change_percentage_24h?.toFixed(
                              2,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <CryptoChart
                        coinId={selectedCoin.id}
                        coinName={selectedCoin.name}
                      />
                    </div>
                  )}

                  {/* DUAS COLUNAS INFERIORES */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(350px, 1fr))",
                      gap: "24px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#050607",
                        border: "1px solid #191b1d",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "20px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#fff",
                              margin: 0,
                            }}
                          >
                            Ativos Monitorados
                          </h3>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#8f8f8f",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Clique num ativo para ver o gráfico
                          </p>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#8f8f8f",
                            backgroundColor: "#101214",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid #191b1d",
                          }}
                        >
                          {filteredCryptos.length} ativos
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {filteredCryptos.slice(0, 5).map((coin) => {
                          const isPositive =
                            coin.price_change_percentage_24h >= 0;
                          return (
                            <div
                              key={coin.id}
                              onClick={() => {
                                setSelectedCoin(coin);
                                setActiveTab("overview");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#101214")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <img
                                  src={coin.image}
                                  alt={coin.name}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                  }}
                                />
                                <div>
                                  <p
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 500,
                                      color: "#fff",
                                      margin: 0,
                                    }}
                                  >
                                    {coin.name}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color: "#8f8f8f",
                                      margin: 0,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {coin.symbol}
                                  </p>
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "16px",
                                }}
                              >
                                <div style={{ textAlign: "right" }}>
                                  <p
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "#fff",
                                      margin: 0,
                                    }}
                                  >
                                    {coin.current_price.toLocaleString(
                                      "pt-BR",
                                      { style: "currency", currency: "BRL" },
                                    )}
                                  </p>
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor: isPositive
                                      ? "rgba(16, 185, 129, 0.1)"
                                      : "rgba(248, 113, 113, 0.1)",
                                    color: isPositive ? "#10b981" : "#f87171",
                                  }}
                                >
                                  {isPositive ? "+" : ""}
                                  {coin.price_change_percentage_24h?.toFixed(2)}
                                  %
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#050607",
                        border: "1px solid #191b1d",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "20px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#fff",
                              margin: 0,
                            }}
                          >
                            Destaques de Alta (24h)
                          </h3>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#8f8f8f",
                              margin: "4px 0 0 0",
                            }}
                          >
                            Maiores variações positivas
                          </p>
                        </div>
                        <Flame
                          style={{
                            width: "20px",
                            height: "20px",
                            color: "#f59e0b",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {topGainers.map((coin, index) => (
                          <div
                            key={coin.id}
                            onClick={() => {
                              setSelectedCoin(coin);
                              setActiveTab("overview");
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#101214")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                <img
                                  src={coin.image}
                                  alt={coin.name}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                  }}
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    backgroundColor: "#f59e0b",
                                    fontSize: "9px",
                                    fontWeight: "bold",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#000",
                                  }}
                                >
                                  {index + 1}
                                </div>
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#fff",
                                    margin: 0,
                                  }}
                                >
                                  {coin.name}
                                </p>
                                <p
                                  style={{
                                    fontSize: "12px",
                                    color: "#8f8f8f",
                                    margin: 0,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {coin.symbol}
                                </p>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#fff",
                                  margin: 0,
                                }}
                              >
                                {coin.current_price.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#10b981",
                                  margin: 0,
                                }}
                              >
                                +{coin.price_change_percentage_24h?.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
