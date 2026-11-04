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
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
