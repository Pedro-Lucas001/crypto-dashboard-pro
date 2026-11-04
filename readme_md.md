# Crypto Dashboard Pro 🚀

Painel reativo e corporativo de monitoramento de ativos, cotações em tempo real, gráficos históricos e métricas globais do mercado financeiro. Desenvolvido com **React**, **Vite**, **Tailwind CSS** e **CoinGecko API**.

---

## ✨ Funcionalidades

* **Visão Geral em Tempo Real:** Acompanha as principais criptomoedas do mercado ordenadas por capitalização de mercado.
* **Métricas Globais:** Indicadores macroeconómicos globais (cap. de mercado global, volume de 24h e dominância do Bitcoin).
* **Gráficos Interativos:** Histórico de preços dinâmico dos últimos 7 dias gerado com *Recharts*.
* **Pesquisa Instantânea:** Filtro em tempo real por nome ou símbolo (ex: BTC, Ethereum).
* **Conversor Rápido de Moedas:** Calculadora integrada para conversão instantânea de ativos em Reais (BRL).
* **Design Enterprise / V0 Style:** Interface moderna em modo escuro inspirada em painéis operacionais corporativos de alta performance.

---

## 🛠️ Tecnologias Utilizadas

* **React + Vite** (Alta performance e HMR rápido)
* **Tailwind CSS** (Estilização moderna e responsiva)
* **Axios** (Consumo de dados da API pública CoinGecko)
* **Recharts** (Gráficos de área interativos)
* **Lucide React** (Ícones minimalistas)

---

## ⚙️ Como Executar o Projeto Localmente

Certifica-te de que tens o **Node.js** instalado no teu computador. Depois, executa os seguintes comandos no terminal:

```bash
# 1. Clonar o repositório
git clone https://github.com/Pedro-Lucas001/crypto-dashboard-pro.git

# 2. Entrar na pasta do projeto
cd crypto-dashboard-pro

# 3. Instalar as dependências
npm install

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

O projeto estará acessível no teu navegador através do endereço gerado no terminal (geralmente `http://localhost:5173`).

---

## 📂 Estrutura de Pastas

```text
src/
├── components/        # Componentes reutilizáveis (Cards, Gráficos, Métricas, Conversor)
├── page/              # Páginas principais (Dashboard)
├── services/          # Configuração do Axios e serviços de API
├── styles/            # Estilos globais e configurações do Tailwind
├── App.jsx            # Componente raiz
└── main.jsx           # Ponto de entrada da aplicação
```

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de portfólio. Sinta-se à vontade para utilizar e melhorar!