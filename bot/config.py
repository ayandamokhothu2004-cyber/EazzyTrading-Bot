"""
Institutional Algorithmic Trading Bot - Configuration Module

All system parameters, risk thresholds, trading sessions, filters,
and strategy settings are centrally managed here.
"""

import os

# ==============================================================================
# SYMBOLS & TIMEFRAMES
# ==============================================================================
SYMBOLS = ["EURUSD", "US100Cash"]

# Higher timeframes for trend bias determination
BIAS_TIMEFRAMES = ["H4", "H1"]

# Execution timeframes for entry signals
EXECUTION_TIMEFRAMES = ["M15", "M5"]

# ==============================================================================
# RISK MANAGEMENT
# ==============================================================================
# Account base currency
ACCOUNT_CURRENCY = "ZAR"

# Percentage of account balance to risk per trade (e.g., 1.0 = 1%)
RISK_PER_TRADE_PCT = 1.0

# Daily execution limits
MAX_DAILY_TRADES = 2
MAX_CONSECUTIVE_LOSSES = 2

# Drawdown protection limits
MAX_DAILY_DRAWDOWN_PCT = 2.0
MAX_WEEKLY_DRAWDOWN_PCT = 5.0
MAX_MONTHLY_DRAWDOWN_PCT = 10.0

# ==============================================================================
# STOP LOSS & TAKE PROFIT CONFIGURATION
# ==============================================================================
# TP1 Risk:Reward Multiple
TP1_RR = 2.0

# TP2 Liquidity Target Percentage
PARTIAL_CLOSE_PCT = 50.0  # Close 50% of position at TP1

# Move Stop Loss to Breakeven after TP1 is hit
BREAKEVEN_AFTER_TP1 = True

# Trailing Stop Settings
TRAILING_STOP_ENABLED = False
TRAILING_STOP_DISTANCE_ATR = 1.5  # Trailing distance in ATR multiples

# ==============================================================================
# STRATEGY & ENTRY FILTERS
# ==============================================================================
# Order Block requirement filter (True = required, False = optional)
ORDER_BLOCK_ENABLED = True

# Fair Value Gap (FVG) requirement filter (True = required, False = optional)
FVG_ENABLED = True

# Entry Models: 'MODEL_A' (Sweep + BOS + Pullback), 'MODEL_B' (Supply/Demand + Rejection), 'MODEL_C' (Sweep + CHoCH + FVG)
ACTIVE_ENTRY_MODEL = "MODEL_A"

# Maximum allowed spread in pips (EURUSD) and points (US100Cash)
MAX_SPREAD_PIPS = {
    "EURUSD": 2.5,
    "US100Cash": 300.0
}

# ==============================================================================
# SESSION & TIME FILTERS
# ==============================================================================
# Sessions allowed for trading (UTC time)
LONDON_SESSION_START = "08:00"
LONDON_SESSION_END = "16:00"

NY_SESSION_START = "13:00"
NY_SESSION_END = "21:00"

# Filters activation switches
NEWS_FILTER_ENABLED = True
AVOID_FRIDAY_EVENING = True
FRIDAY_CUTOFF_TIME = "18:00"  # Stop taking trades after 18:00 UTC on Fridays

# ==============================================================================
# JOURNAL & SYSTEM LOGGING
# ==============================================================================
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
JOURNAL_FILE = os.path.join(os.path.dirname(__file__), "logs", "trade_journal.json")

# MT5 Terminal Path (Optional - auto-detected if empty)
MT5_PATH = ""
MT5_LOGIN = 0
MT5_PASSWORD = ""
MT5_SERVER = ""
