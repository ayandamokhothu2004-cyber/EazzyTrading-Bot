"""
Institutional Algorithmic Trading Bot - Market Data Module

Handles connection to MetaTrader 5, symbol subscription, market data retrieval,
tick quote polling, and automated reconnection logic.
"""

import time
import logging
import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MarketData")

# Try importing MetaTrader5 package
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    logger.warning("MetaTrader5 package not installed or supported on this platform. Running in Simulation Mode.")


class MarketDataManager:
    """Manages MT5 terminal connectivity, candle history fetching, and real-time tick streaming."""

    def __init__(self, symbols: List[str]):
        self.symbols = symbols
        self.is_connected = False
        self.simulation_mode = not MT5_AVAILABLE
        self.last_tick_time: Dict[str, float] = {}

    def initialize(self) -> bool:
        """Initializes connection to MT5 terminal."""
        if not MT5_AVAILABLE:
            logger.info("Initializing Market Data Manager in SIMULATION mode.")
            self.is_connected = True
            return True

        if not mt5.initialize():
            logger.error(f"MT5 Initialization failed. Error code: {mt5.last_error()}")
            self.is_connected = False
            return False

        logger.info(f"Connected to MetaTrader 5 (Terminal Build: {mt5.version()[0]})")
        self.is_connected = True

        # Ensure symbols are visible in MarketWatch
        for symbol in self.symbols:
            if not mt5.symbol_select(symbol, True):
                logger.warning(f"Failed to select symbol {symbol} in MT5 MarketWatch.")

        return True

    def ensure_connection(self) -> bool:
        """Checks connection status and attempts automatic reconnection if dropped."""
        if self.simulation_mode:
            return True

        if not MT5_AVAILABLE or not mt5.terminal_info():
            logger.warning("MT5 Connection lost! Attempting auto-reconnection...")
            self.is_connected = False
            return self.initialize()

        self.is_connected = True
        return True

    def get_timeframe_enum(self, tf_str: str):
        """Maps string timeframe to MT5 timeframe constant."""
        if not MT5_AVAILABLE:
            return tf_str

        tf_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        return tf_map.get(tf_str, mt5.TIMEFRAME_M15)

    def get_candles(self, symbol: str, timeframe: str, count: int = 200) -> List[Dict[str, Any]]:
        """Retrieves OHLCV candle historical data for a symbol."""
        self.ensure_connection()

        if self.simulation_mode:
            return self._generate_simulated_candles(symbol, timeframe, count)

        tf_enum = self.get_timeframe_enum(timeframe)
        rates = mt5.copy_rates_from_pos(symbol, tf_enum, 0, count)

        if rates is None or len(rates) == 0:
            logger.error(f"Failed to fetch rates for {symbol} ({timeframe}). Error: {mt5.last_error()}")
            return []

        candles = []
        for rate in rates:
            candles.append({
                "time": datetime.fromtimestamp(rate["time"], tz=timezone.utc),
                "open": float(rate["open"]),
                "high": float(rate["high"]),
                "low": float(rate["low"]),
                "close": float(rate["close"]),
                "tick_volume": int(rate["tick_volume"]),
                "spread": int(rate["spread"])
            })

        return candles

    def get_current_spread(self, symbol: str) -> float:
        """Retrieves current spread in pips (for FX) or points (for Indices)."""
        self.ensure_connection()

        if self.simulation_mode:
            # Return realistic simulated spreads
            return 1.1 if "EUR" in symbol else 18.0

        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return 999.0

        point = symbol_info.point
        spread_points = symbol_info.spread

        if "EUR" in symbol or "GBP" in symbol or "USD" in symbol:
            # Convert points to pips for Forex (1 pip = 10 points for 5-digit broker)
            return spread_points / 10.0 if symbol_info.digits == 5 else spread_points
        else:
            return float(spread_points)

    def get_current_price(self, symbol: str) -> Tuple[float, float]:
        """Returns tuple of (ask, bid) prices."""
        self.ensure_connection()

        if self.simulation_mode:
            base_price = 1.0850 if "EUR" in symbol else 18500.0
            spread = 0.0001 if "EUR" in symbol else 1.5
            return base_price + spread, base_price

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return 0.0, 0.0

        return tick.ask, tick.bid

    def _generate_simulated_candles(self, symbol: str, timeframe: str, count: int) -> List[Dict[str, Any]]:
        """Generates realistic market candles for backtesting/sandbox testing."""
        candles = []
        now = time.time()
        base_price = 1.0850 if "EUR" in symbol else 18500.0
        step = 60 if timeframe == "M1" else 300 if timeframe == "M5" else 900 if timeframe == "M15" else 3600 if timeframe == "H1" else 14400

        curr_price = base_price
        for i in range(count, 0, -1):
            t = now - (i * step)
            # Create price action movement
            volatility = 0.0015 if "EUR" in symbol else 25.0
            delta = (math.sin(i * 0.1) * volatility) + (math.cos(i * 0.05) * volatility * 0.5)
            open_p = curr_price
            close_p = curr_price + delta
            high_p = max(open_p, close_p) + (volatility * 0.3)
            low_p = min(open_p, close_p) - (volatility * 0.3)
            curr_price = close_p

            candles.append({
                "time": datetime.fromtimestamp(t, tz=timezone.utc),
                "open": round(open_p, 5 if "EUR" in symbol else 2),
                "high": round(high_p, 5 if "EUR" in symbol else 2),
                "low": round(low_p, 5 if "EUR" in symbol else 2),
                "close": round(close_p, 5 if "EUR" in symbol else 2),
                "tick_volume": 1200,
                "spread": 10 if "EUR" in symbol else 15
            })

        return candles
