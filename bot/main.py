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
        logger.info(f"=== Processing Symbol: {symbol} ===")

        # 1. Check current spread
        current_spread = self.market_data.get_current_spread(symbol)
        max_allowed_spread = config.MAX_SPREAD_PIPS.get(symbol, 2.0)
        logger.info(f"[{symbol}] Current spread: {current_spread} pips/pts (Max Allowed: {max_allowed_spread})")

        # 2. Get current prices and update existing positions
        ask, bid = self.market_data.get_current_price(symbol)
        logger.info(f"[{symbol}] Current price - Ask: {ask}, Bid: {bid}")

        closed_reports = self.trade_manager.update_positions(symbol, ask, bid)

        for report in closed_reports:
            logger.info(f"[{symbol}] Position closed: {report}")
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
        in_session = self.is_in_trading_session()
        if not in_session:
            logger.info(f"[{symbol}] Session Filter: FAILED (outside active trading session hours). Order Skipped.")
            return
        logger.info(f"[{symbol}] Session Filter: PASSED (active trading session)")

        # 4. Check Risk Permission
        account_balance = 100000.0  # Placeholder or retrieved from MT5
        is_allowed, reason = self.risk_manager.validate_trade_permission(
            symbol, current_spread, max_allowed_spread, account_balance, account_balance
        )

        if not is_allowed:
            logger.info(f"[{symbol}] Risk Manager Permission: REJECTED ({reason}). Order Skipped.")
            return
        logger.info(f"[{symbol}] Risk Manager Permission: PASSED ({reason})")

        # 5. Fetch Multi-timeframe Bar Data
        candles_h4 = self.market_data.get_candles(symbol, "H4", 100)
        candles_h1 = self.market_data.get_candles(symbol, "H1", 100)
        candles_m15 = self.market_data.get_candles(symbol, "M15", 100)

        if not candles_h4 or not candles_h1 or not candles_m15:
            logger.info(
                f"[{symbol}] Market Data: INSUFFICIENT CANDLE DATA "
                f"(H4 count: {len(candles_h4) if candles_h4 else 0}, "
                f"H1 count: {len(candles_h1) if candles_h1 else 0}, "
                f"M15 count: {len(candles_m15) if candles_m15 else 0}). Order Skipped."
            )
            return

        # STEP 1: Determine Higher Timeframe Trend (H4 / H1)
        trend = self.trend_analyzer.evaluate_trend(candles_h4, candles_h1)
        logger.info(f"[{symbol}] Trend Analysis Result: {trend}")
        if trend == "NO_TREND":
            logger.info(f"[{symbol}] Order Skipped: No clear higher timeframe trend (H1/H4).")
            return

        # STEP 2: Identify Liquidity Pools & Sweeps
        swing_highs, swing_lows = self.trend_analyzer.find_swing_points(candles_m15)
        pdh, pdl = self.liquidity_analyzer.get_pdh_pdl(candles_h4)
        eqh, eql = self.liquidity_analyzer.find_equal_highs_lows(swing_highs, swing_lows)

        sweep = self.liquidity_analyzer.detect_liquidity_sweep(candles_m15, pdh, pdl, eqh, eql, trend)
        logger.info(
            f"[{symbol}] Liquidity Sweep Detection Result: "
            f"is_swept={sweep.get('is_swept')}, direction={sweep.get('direction')}, "
            f"sweep_level={sweep.get('sweep_level')}, level_price={sweep.get('level_price')}"
        )
        if not sweep["is_swept"]:
            logger.info(f"[{symbol}] Order Skipped: No liquidity sweep detected on M15.")
            return

        # STEP 3: Wait for Confirmation (BOS / CHoCH)
        confirmation = self.structure_analyzer.detect_confirmation(candles_m15, swing_highs, swing_lows, sweep["direction"])
        logger.info(
            f"[{symbol}] Structure Confirmation Result: "
            f"has_confirmation={confirmation.get('has_confirmation')}, type={confirmation.get('type')}, "
            f"break_price={confirmation.get('break_price')}"
        )
        if not confirmation["has_confirmation"]:
            logger.info(f"[{symbol}] Order Skipped: No BOS/CHoCH structure confirmation on M15.")
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
        logger.info(
            f"[{symbol}] Entry Model ({config.ACTIVE_ENTRY_MODEL}) Result: "
            f"valid={signal.get('valid')}, direction={signal.get('direction')}, "
            f"entry_price={signal.get('entry_price')}, sl_price={signal.get('sl_price')}, reason={signal.get('reason')}"
        )

        if not signal["valid"]:
            logger.info(f"[{symbol}] Order Skipped: Entry model signal not valid ({signal.get('reason')}).")
            return

        # STEP 5: Risk Calculation & Execution
        lot_size = self.risk_manager.calculate_lot_size(
            symbol=symbol,
            account_balance=account_balance,
            entry_price=signal["entry_price"],
            sl_price=signal["sl_price"]
        )
        logger.info(f"[{symbol}] Calculated Lot Size: {lot_size} (Entry: {signal['entry_price']}, SL: {signal['sl_price']}, Risk: {config.RISK_PER_TRADE_PCT}%)")

        # Place Order
        logger.info(f"[{symbol}] Sending Order: Direction={signal['direction']}, Lot={lot_size}, Entry={signal['entry_price']}, SL={signal['sl_price']}, Reason={signal['reason']}")
        order_result = self.trade_manager.execute_order(
            symbol=symbol,
            order_type=signal["direction"],
            lot_size=lot_size,
            entry_price=signal["entry_price"],
            sl_price=signal["sl_price"],
            tp2_liquidity_price=None,
            reason=signal["reason"]
        )
        logger.info(f"[{symbol}] Order Execution Completed. Result: {order_result}")

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
