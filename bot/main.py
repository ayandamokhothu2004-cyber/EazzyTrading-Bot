"""
Institutional Algorithmic Trading Bot - Main Execution Entry Point

Production-ready orchestrator that runs the trading event loop, handles heartbeat,
validates session filters, verifies spread safety, and executes trades discipline-first.
"""

import time
import logging
from datetime import datetime, timezone

from bot import config
from bot.market_data import MarketDataManager
from bot.trend import TrendAnalyzer
from bot.liquidity import LiquidityAnalyzer
from bot.structure import StructureAnalyzer
from bot.entries import EntryEngine
from bot.risk import RiskManager
from bot.trade_manager import TradeManager
from bot.journal import TradeJournal

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("InstitutionalBot")


class TradingBotEngine:
    """Core algorithmic trading execution engine."""

    def __init__(self):
        logger.info("Initializing Institutional Algorithmic Trading Bot System...")

        self.symbols = config.SYMBOLS
        self.market_data = MarketDataManager(self.symbols)
        self.trend_analyzer = TrendAnalyzer()
        self.liquidity_analyzer = LiquidityAnalyzer()
        self.structure_analyzer = StructureAnalyzer()
        self.entry_engine = EntryEngine()

        self.risk_manager = RiskManager(
            risk_per_trade_pct=config.RISK_PER_TRADE_PCT,
            max_daily_trades=config.MAX_DAILY_TRADES,
            max_consecutive_losses=config.MAX_CONSECUTIVE_LOSSES,
            max_daily_drawdown_pct=config.MAX_DAILY_DRAWDOWN_PCT,
            max_weekly_drawdown_pct=config.MAX_WEEKLY_DRAWDOWN_PCT,
            max_monthly_drawdown_pct=config.MAX_MONTHLY_DRAWDOWN_PCT
        )

        self.trade_manager = TradeManager(
            tp1_rr=config.TP1_RR,
            partial_close_pct=config.PARTIAL_CLOSE_PCT,
            breakeven_after_tp1=config.BREAKEVEN_AFTER_TP1
        )

        self.journal = TradeJournal(config.JOURNAL_FILE)
        self.is_running = False

    def is_in_trading_session(self) -> bool:
        """Checks if current time falls inside London or New York trading session."""
        now_utc = datetime.now(timezone.utc).time()

        lon_start = datetime.strptime(config.LONDON_SESSION_START, "%H:%M").time()
        lon_end = datetime.strptime(config.LONDON_SESSION_END, "%H:%M").time()

        ny_start = datetime.strptime(config.NY_SESSION_START, "%H:%M").time()
        ny_end = datetime.strptime(config.NY_SESSION_END, "%H:%M").time()

        in_london = lon_start <= now_utc <= lon_end
        in_ny = ny_start <= now_utc <= ny_end

        # Friday evening filter check
        now_dt = datetime.now(timezone.utc)
        if config.AVOID_FRIDAY_EVENING and now_dt.weekday() == 4:  # Friday
            cutoff = datetime.strptime(config.FRIDAY_CUTOFF_TIME, "%H:%M").time()
            if now_utc >= cutoff:
                logger.info("Friday evening cutoff active. Trading suspended for weekend.")
                return False

        return in_london or in_ny

    def run_cycle_for_symbol(self, symbol: str):
        """Executes a single evaluation cycle for a symbol."""
        # 1. Check current spread
        current_spread = self.market_data.get_current_spread(symbol)
        max_allowed_spread = config.MAX_SPREAD_PIPS.get(symbol, 2.0)

        # 2. Get current prices and update existing positions
        ask, bid = self.market_data.get_current_price(symbol)
        closed_reports = self.trade_manager.update_positions(symbol, ask, bid)

        for report in closed_reports:
            # Update risk tracker and record trade in journal
            self.risk_manager.record_trade_result(report["pl"])
            self.journal.log_trade(
                symbol=report["symbol"],
                direction=report["direction"],
                entry_price=report["entry_price"],
                sl_price=report["entry_price"],  # Simplified SL
                tp_price=report["exit_price"],
                exit_price=report["exit_price"],
                lot_size=report["lot_size"],
                risk_pct=config.RISK_PER_TRADE_PCT,
                profit_loss=report["pl"],
                rr_achieved=2.0 if report["pl"] > 0 else -1.0,
                reason=report["reason"]
            )

        # 3. Check Session Filter
        if not self.is_in_trading_session():
            return

        # 4. Check Risk Permission
        account_balance = 100000.0  # Placeholder or retrieved from MT5
        is_allowed, reason = self.risk_manager.validate_trade_permission(
            symbol, current_spread, max_allowed_spread, account_balance, account_balance
        )

        if not is_allowed:
            return

        # 5. Fetch Multi-timeframe Bar Data
        candles_h4 = self.market_data.get_candles(symbol, "H4", 100)
        candles_h1 = self.market_data.get_candles(symbol, "H1", 100)
        candles_m15 = self.market_data.get_candles(symbol, "M15", 100)

        if not candles_h4 or not candles_h1 or not candles_m15:
            return

        # STEP 1: Determine Higher Timeframe Trend (H4 / H1)
        trend = self.trend_analyzer.evaluate_trend(candles_h4, candles_h1)
        if trend == "NO_TREND":
            return

        # STEP 2: Identify Liquidity Pools & Sweeps
        swing_highs, swing_lows = self.trend_analyzer.find_swing_points(candles_m15)
        pdh, pdl = self.liquidity_analyzer.get_pdh_pdl(candles_h4)
        eqh, eql = self.liquidity_analyzer.find_equal_highs_lows(swing_highs, swing_lows)

        sweep = self.liquidity_analyzer.detect_liquidity_sweep(candles_m15, pdh, pdl, eqh, eql, trend)
        if not sweep["is_swept"]:
            return

        # STEP 3: Wait for Confirmation (BOS / CHoCH)
        confirmation = self.structure_analyzer.detect_confirmation(candles_m15, swing_highs, swing_lows, sweep["direction"])
        if not confirmation["has_confirmation"]:
            return

        # STEP 4: Pullback Evaluation & Entry Model
        signal = self.entry_engine.evaluate_entry(
            model_type=config.ACTIVE_ENTRY_MODEL,
            candles=candles_m15,
            trend=trend,
            sweep=sweep,
            confirmation=confirmation,
            ob_required=config.ORDER_BLOCK_ENABLED,
            fvg_required=config.FVG_ENABLED
        )

        if not signal["valid"]:
            return

        # STEP 5: Risk Calculation & Execution
        lot_size = self.risk_manager.calculate_lot_size(
            symbol=symbol,
            account_balance=account_balance,
            entry_price=signal["entry_price"],
            sl_price=signal["sl_price"]
        )

        # Place Order
        self.trade_manager.execute_order(
            symbol=symbol,
            order_type=signal["direction"],
            lot_size=lot_size,
            entry_price=signal["entry_price"],
            sl_price=signal["sl_price"],
            tp2_liquidity_price=None,
            reason=signal["reason"]
        )

    def start(self):
        """Starts the main trading execution loop."""
        self.is_running = True
        logger.info("Bot execution engine STARTED. Connecting to Market Data...")

        logger.info("Calling MarketData.initialize()...")
        result = self.market_data.initialize()
        logger.info(f"MarketData.initialize() returned: {result}")

        if not result:
            logger.error("Failed to initialize Market Data. Exiting.")
            return

        logger.info("Market Data initialized successfully.")
        logger.info("Entering Main Rule Execution Loop. Press Ctrl+C to stop.")
        try:
            while self.is_running:
                for symbol in self.symbols:
                    try:
                        self.run_cycle_for_symbol(symbol)
                    except Exception as e:
                        logger.error(f"Error evaluating symbol {symbol}: {e}", exc_info=True)

                time.sleep(5)  # 5 second pulse
        except KeyboardInterrupt:
            logger.info("Shutdown signal received. Stopping Bot safely.")
            self.is_running = False


if __name__ == "__main__":
    bot = TradingBotEngine()
    bot.start()
