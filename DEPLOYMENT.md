# 🚀 Production Deployment Guide: Frontend (Netlify) & Backend (MT5 VPS / Cloud)

This guide walks you through deploying your upgraded institutional MetaTrader 5 (MT5) Trading Platform.

---

## 🏗️ Architecture Overview

1. **Frontend (Netlify)**:
   - Built using Vite, React 18, and Tailwind CSS.
   - Hosted globally on Netlify CDN with automatic updates on `git push`.
   - Communicates securely with your backend REST API & WebSocket service.

2. **Backend Engine (VPS / Docker / Render)**:
   - Runs `server.ts` Node.js proxy and Python 3.10 MT5 execution engine (`bot/main.py`).
   - Binds to your MT5 Terminal (JustMarkets, Exness, XM, HFM, FBS, OctaFX, Deriv, IC Markets).
   - Manages automated 24/7 scanning, Order Blocks, Liquidity Sweeps, and Risk Guardrails.

---

## 🌐 1. Deploying Frontend to Netlify

1. Push your project to **GitHub**:
   ```bash
   git add .
   git commit -m "Upgrade MT5 Live Trading Engine & Docker Setup"
   git push origin main
   ```
2. Log in to [Netlify](https://app.netlify.com) and click **"Add new site" -> "Import an existing project"**.
3. Select your GitHub repository.
4. Netlify will auto-detect configuration from `netlify.toml`:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Click **Deploy Site**. Your live dashboard is now accessible globally!

---

## 🖥️ 2. Deploying Backend MT5 Engine

### Option A: Windows VPS / Local PC (Recommended for direct MT5 Terminal API)
1. Download & Install MetaTrader 5 Terminal from your broker (e.g., JustMarkets, Exness).
2. Log into your Demo or Live account in MT5 Terminal.
3. Install Python 3.10+ & Node.js 20 on your VPS.
4. Clone your repository:
   ```bash
   git clone https://github.com/your-username/institutional-algo-bot.git
   cd institutional-algo-bot
   ```
5. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
6. Start the production backend server:
   ```bash
   npm run build
   npm start
   ```

### Option B: Docker Container Deployment (Render / Railway / DigitalOcean / AWS)
1. Build & Run locally or on server:
   ```bash
   docker-compose up -d --build
   ```
2. Set environment variables in `.env` or container settings:
   - `MT5_ACCOUNT=1200280297`
   - `MT5_SERVER=JustMarkets-Demo3`
   - `MT5_PASSWORD=your_password`
   - `TELEGRAM_BOT_TOKEN=your_token` (Optional for trade alerts)
   - `TELEGRAM_CHAT_ID=your_chat_id`

---

## 🔒 Security Best Practices

- Never commit broker passwords or secret API keys to GitHub.
- Store sensitive values in `.env` or platform environment variables.
- All broker communication is proxied through server-side endpoints (`/api/*`).
