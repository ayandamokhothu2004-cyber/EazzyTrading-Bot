# 📈 Institutional AI Quantitative Trading Bot & Dashboard

A production-grade algorithmic Forex & Index trading bot dashboard built with **React**, **Vite**, **Tailwind CSS**, and a **Python MetaTrader 5 (MT5)** execution engine. 

Designed for **SMC (Smart Money Concepts)** and **ICT (Inner Circle Trader)** execution on **EURUSD** and **US100Cash** (NAS100), optimized for South African Rand (ZAR) accounts as well as USD/EUR/GBP base accounts.

---

## 🚀 Key Features

- **Live MT5 Broker Bridge**: Instant connection to **JustMarkets**, **Exness**, **XM Global**, **HFM**, **Deriv**, **IC Markets**, **Pepperstone**, and custom MT5 servers. Pre-configured with live account `#1200280297` on `JustMarkets-Demo3`.
- **Institutional Trading Dashboard**:
  - Live Equity, Balance, Margin, Free Margin, Net Daily P/L (ZAR / USD).
  - AI Confidence Meter (SMC/ICT Bullish/Bearish Alignment index).
  - Session Clock (London Open, New York Overlap, Asian Kill Zone countdowns).
  - High-Impact Economic News Calendar & Filter.
  - Interactive TradingView / SMC Chart visualizer with real-time candle data, Order Blocks, Liquidity Sweeps, and BOS/CHoCH markers.
  - Live Python execution terminal streaming real-time event logs.
- **5-Step Rule Execution Engine**:
  1. Higher Timeframe (H4/H1) Trend Confirmation.
  2. Liquidity Sweep Detection (PDH/PDL, EQH/EQL).
  3. Lower Timeframe Confirmation (BOS / CHoCH on M15/M5).
  4. Model Pullback (Order Block / Fair Value Gap).
  5. Strict 1% Sizing & Automated SL/TP1 (2R)/TP2 (Target) + Breakeven Management.
- **Analytics & Heatmaps**: Monthly returns, win/loss ratio, equity curve, drawdowns, session breakdown.
- **Backtesting Studio**: Multi-year historical CSV data simulation engine with Monte Carlo expectancy calculation.
- **GitHub & Netlify Ready**: Single-command build (`npm run build`) producing clean static assets for Netlify SPA hosting.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts.
- **Backend API**: Express / Node.js (`server.ts`) proxying live broker metrics and market state.
- **Trading Engine**: Python 3.10+ MetaTrader 5 API (`bot/main.py`, `bot/config.py`, `bot/entries.py`).
- **Deployment**: Netlify (`netlify.toml`) & GitHub Actions CI/CD (`.github/workflows/deploy.yml`).

---

## 📦 Quick Start & Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/institutional-algo-bot.git
cd institutional-algo-bot
```

### 2. Install Dependencies
```bash
npm install
pip install -r requirements.txt
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Netlify Deployment

1. Push your repository to **GitHub**.
2. Connect your repository in **Netlify**.
3. Set build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Deploy! The `netlify.toml` automatically handles SPA routing.

---

## 🛡️ Risk Management Guardrails

- **Max Daily Loss**: 2.0% (Circuit breaker triggers auto-shutdown).
- **Max Open Trades**: 2 Trades simultaneously.
- **Max Consecutive Losses**: 2 Losses (Cooldown enforced).
- **Spread Limits**: EURUSD <= 2.5 Pips | US100Cash <= 300 Pts.

---

## 📄 License

MIT License - Free for institutional and personal algorithmic trading use.
