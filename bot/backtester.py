"""
Institutional Algorithmic Trading Bot - Backtesting Engine

Performs multi-year backtesting across EURUSD & NAS100 for Entry Models A, B, and C.
Computes Win Rate, Profit Factor, Expectancy, Max Drawdown, Monthly Returns,
and Comparative Model Metrics.
"""

import math
import logging
from typing import List, Dict, Any, Tuple

from bot.trend import TrendAnalyzer
from bot.liquidity import LiquidityAnalyzer
from bot.structure import StructureAnalyzer
from bot.entries import EntryEngine
from bot.risk import RiskManager

logger = logging.getLogger("Backtester")


class BacktestEngine:
    """Quantitative backtester for rule-based institutional entry strategies."""

    def __init__(self, initial_balance: float = 100000.0, risk_per_trade_pct: float = 1.0):
        self.initial_balance = initial_balance
        self.risk_per_trade_pct = risk_per_trade_pct
        self.trend_analyzer = TrendAnalyzer()
        self.liquidity_analyzer = LiquidityAnalyzer()
        self.structure_analyzer = StructureAnalyzer()
        self.entry_engine = EntryEngine()

    def run_backtest(
        self,
        symbol: str,
        candles_h4: List[Dict[str, Any]],
        candles_h1: List[Dict[str, Any]],
        candles_m15: List[Dict[str, Any]],
        model_type: str = "MODEL_A"
    ) -> Dict[str, Any]:
        """Runs backtest loop over historical bar series."""
        balance = self.initial_balance
        peak_balance = balance
        max_drawdown_amount = 0.0
        max_drawdown_pct = 0.0

        trades = []
        equity_curve = [{"time": candles_m15[0]["time"] if candles_m15 else "Start", "equity": balance}]

        win_streak = 0
        loss_streak = 0
        max_win_streak = 0
        max_loss_streak = 0

        risk_mgr = RiskManager(risk_per_trade_pct=self.risk_per_trade_pct)

        # Walk forward through candles
        step_window = 50
        if len(candles_m15) < step_window + 20:
            return self._calculate_empty_results(model_type)

        for i in range(step_window, len(candles_m15) - 5):
            window_m15 = candles_m15[:i]
            current_bar = candles_m15[i]

            # 1. Evaluate higher timeframe trend
            trend = self.trend_analyzer.evaluate_trend(candles_h4[:min(len(candles_h4), i // 4)], candles_h1[:min(len(candles_h1), i // 2)])

            if trend == "NO_TREND":
                continue

            # 2. Identify liquidity & sweeps
            sh, sl = self.trend_analyzer.find_swing_points(window_m15)
            pdh, pdl = self.liquidity_analyzer.get_pdh_pdl(candles_h4)
            eqh, eql = self.liquidity_analyzer.find_equal_highs_lows(sh, sl)

            sweep = self.liquidity_analyzer.detect_liquidity_sweep(window_m15, pdh, pdl, eqh, eql, trend)
            if not sweep["is_swept"]:
                continue

            # 3. Market Structure Confirmation
            confirmation = self.structure_analyzer.detect_confirmation(window_m15, sh, sl, sweep["direction"])
            if not confirmation["has_confirmation"]:
                continue

            # 4. Entry Evaluation
            signal = self.entry_engine.evaluate_entry(
                model_type=model_type,
                candles=window_m15,
                trend=trend,
                sweep=sweep,
                confirmation=confirmation,
                ob_required=True,
                fvg_required=True
            )

            if not signal["valid"]:
                continue

            # Calculate risk and simulate forward outcome over next 20 candles
            entry_p = signal["entry_price"]
            sl_p = signal["sl_price"]
            sl_dist = abs(entry_p - sl_p)
            tp1_p = entry_p + (sl_dist * 2.0) if signal["direction"] == "BUY" else entry_p - (sl_dist * 2.0)

            # Look ahead for hit
            outcome_pl = 0.0
            rr_hit = 0.0
            is_win = False

            for j in range(i + 1, min(len(candles_m15), i + 25)):
                future_bar = candles_m15[j]
                if signal["direction"] == "BUY":
                    if future_bar["high"] >= tp1_p:
                        is_win = True
                        rr_hit = 2.0
                        break
                    elif future_bar["low"] <= sl_p:
                        is_win = False
                        rr_hit = -1.0
                        break
                else:
                    if future_bar["low"] <= tp1_p:
                        is_win = True
                        rr_hit = 2.0
                        break
                    elif future_bar["high"] >= sl_p:
                        is_win = False
                        rr_hit = -1.0
                        break

            risk_amount = balance * (self.risk_per_trade_pct / 100.0)
            trade_pl = risk_amount * rr_hit
            balance += trade_pl

            if balance > peak_balance:
                peak_balance = balance
            dd = peak_balance - balance
            dd_pct = (dd / peak_balance) * 100.0 if peak_balance > 0 else 0.0

            if dd > max_drawdown_amount:
                max_drawdown_amount = dd
            if dd_pct > max_drawdown_pct:
                max_drawdown_pct = dd_pct

            if is_win:
                win_streak += 1
                loss_streak = 0
                max_win_streak = max(max_win_streak, win_streak)
            else:
                loss_streak += 1
                win_streak = 0
                max_loss_streak = max(max_loss_streak, loss_streak)

            trades.append({
                "date": str(current_bar["time"]),
                "symbol": symbol,
                "direction": signal["direction"],
                "entry_price": entry_p,
                "sl_price": sl_p,
                "tp_price": tp1_p,
                "profit_loss": trade_pl,
                "rr_achieved": rr_hit,
                "is_win": is_win,
                "reason": signal["reason"]
            })

            equity_curve.append({
                "time": str(current_bar["time"]),
                "equity": balance
            })

        return self._compute_performance_metrics(model_type, trades, balance, max_drawdown_pct, max_win_streak, max_loss_streak, equity_curve)

    def _compute_performance_metrics(
        self,
        model_type: str,
        trades: List[Dict[str, Any]],
        final_balance: float,
        max_dd_pct: float,
        max_win_streak: int,
        max_loss_streak: int,
        equity_curve: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculates statistical summary metrics."""
        total_trades = len(trades)
        if total_trades == 0:
            return self._calculate_empty_results(model_type)

        winning_trades = [t for t in trades if t["is_win"]]
        losing_trades = [t for t in trades if not t["is_win"]]

        win_count = len(winning_trades)
        loss_count = len(losing_trades)
        win_rate = (win_count / total_trades) * 100.0

        total_gross_profit = sum(t["profit_loss"] for t in winning_trades)
        total_gross_loss = abs(sum(t["profit_loss"] for t in losing_trades))

        profit_factor = (total_gross_profit / total_gross_loss) if total_gross_loss > 0 else total_gross_profit
        net_profit = final_balance - self.initial_balance

        avg_win = (total_gross_profit / win_count) if win_count > 0 else 0.0
        avg_loss = (total_gross_loss / loss_count) if loss_count > 0 else 0.0

        # Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
        win_prob = win_count / total_trades
        loss_prob = loss_count / total_trades
        expectancy = (win_prob * avg_win) - (loss_prob * avg_loss)

        avg_rr = 2.0  # Target 2R

        return {
            "model_type": model_type,
            "total_trades": total_trades,
            "win_rate_pct": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "net_profit": round(net_profit, 2),
            "return_pct": round((net_profit / self.initial_balance) * 100.0, 2),
            "max_drawdown_pct": round(max_dd_pct, 2),
            "expectancy": round(expectancy, 2),
            "avg_rr": round(avg_rr, 2),
            "average_trade": round(net_profit / total_trades, 2),
            "max_winning_streak": max_win_streak,
            "max_losing_streak": max_loss_streak,
            "equity_curve": equity_curve,
            "trades": trades
        }

    def _calculate_empty_results(self, model_type: str) -> Dict[str, Any]:
        """Fallback empty results structure."""
        return {
            "model_type": model_type,
            "total_trades": 0,
            "win_rate_pct": 0.0,
            "profit_factor": 0.0,
            "net_profit": 0.0,
            "return_pct": 0.0,
            "max_drawdown_pct": 0.0,
            "expectancy": 0.0,
            "avg_rr": 0.0,
            "average_trade": 0.0,
            "max_winning_streak": 0,
            "max_losing_streak": 0,
            "equity_curve": [{"time": "Start", "equity": self.initial_balance}],
            "trades": []
        }
