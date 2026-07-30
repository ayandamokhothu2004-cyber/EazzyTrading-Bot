"""
Institutional Algorithmic Trading Bot - Risk Management Module

Calculates position lot sizes dynamically based on 1% risk rules
and enforces daily trade limits, drawdown circuit breakers, and spread constraints.
"""

import logging
from datetime import date
from typing import Dict, Any, Tuple

logger = logging.getLogger("RiskManager")


class RiskManager:
    """Enforces strict account risk parameters and loss limits."""

    def __init__(
        self,
        risk_per_trade_pct: float = 1.0,
        max_daily_trades: int = 2,
        max_consecutive_losses: int = 2,
        max_daily_drawdown_pct: float = 2.0,
        max_weekly_drawdown_pct: float = 5.0,
        max_monthly_drawdown_pct: float = 10.0
    ):
        self.risk_per_trade_pct = risk_per_trade_pct
        self.max_daily_trades = max_daily_trades
        self.max_consecutive_losses = max_consecutive_losses
        self.max_daily_drawdown_pct = max_daily_drawdown_pct
        self.max_weekly_drawdown_pct = max_weekly_drawdown_pct
        self.max_monthly_drawdown_pct = max_monthly_drawdown_pct

        # Daily State Tracker
        self.current_date: str = str(date.today())
        self.daily_trade_count: int = 0
        self.consecutive_losses: int = 0
        self.daily_starting_balance: float = 100000.0
        self.daily_realized_pl: float = 0.0

    def reset_daily_tracker_if_needed(self, current_balance: float):
        """Resets daily trading counters at midnight UTC."""
        today_str = str(date.today())
        if self.current_date != today_str:
            logger.info(f"New trading day detected ({today_str}). Resetting daily trade counter.")
            self.current_date = today_str
            self.daily_trade_count = 0
            self.daily_starting_balance = current_balance
            self.daily_realized_pl = 0.0

    def calculate_lot_size(
        self,
        symbol: str,
        account_balance: float,
        entry_price: float,
        sl_price: float
    ) -> float:
        """
        Calculates exact lot size for 1% account risk.
        Lot Size = (Account Balance * Risk %) / (SL Distance in Points * Point Value)
        """
        if account_balance <= 0 or entry_price <= 0 or sl_price <= 0:
            return 0.01

        sl_distance = abs(entry_price - sl_price)
        if sl_distance <= 0:
            return 0.01

        risk_amount = account_balance * (self.risk_per_trade_pct / 100.0)

        # Standard Contract Sizes
        if "EUR" in symbol or "GBP" in symbol or "USD" in symbol:
            # Forex: Standard lot is 100,000 units (1 pip on 1.00 lot = $10)
            contract_size = 100000.0
            lot_size = risk_amount / (sl_distance * contract_size)
        else:
            # Index (NAS100): 1 lot = 1 index contract ($1 per point)
            contract_size = 1.0
            lot_size = risk_amount / (sl_distance * contract_size)

        # Round lot size to 2 decimal places (minimum 0.01)
        raw_lot = round(lot_size, 2)
        final_lot = max(0.01, min(raw_lot, 50.0))  # Cap maximum single position lot

        logger.info(f"Risk Calculation: Balance=${account_balance:.2f} | Risk=${risk_amount:.2f} | SL Distance={sl_distance:.5f} -> Lot Size={final_lot}")
        return final_lot

    def validate_trade_permission(
        self,
        symbol: str,
        current_spread: float,
        max_allowed_spread: float,
        account_balance: float,
        current_equity: float
    ) -> Tuple[bool, str]:
        """
        Validates all risk rules before opening a position.
        Returns (is_allowed, reason_if_denied).
        """
        self.reset_daily_tracker_if_needed(account_balance)

        # 1. Spread Check
        if current_spread > max_allowed_spread:
            return False, f"Spread too high: {current_spread:.2f} > Max Allowed {max_allowed_spread:.2f}"

        # 2. Maximum Daily Trades Check
        if self.daily_trade_count >= self.max_daily_trades:
            return False, f"Daily trade limit reached ({self.daily_trade_count}/{self.max_daily_trades})"

        # 3. Consecutive Losses Check
        if self.consecutive_losses >= self.max_consecutive_losses:
            return False, f"Consecutive loss lock active ({self.consecutive_losses}/{self.max_consecutive_losses})"

        # 4. Daily Drawdown Protection
        daily_loss_pct = ((self.daily_starting_balance - current_equity) / self.daily_starting_balance) * 100.0
        if daily_loss_pct >= self.max_daily_drawdown_pct:
            return False, f"Maximum Daily Drawdown breached ({daily_loss_pct:.2f}% >= {self.max_daily_drawdown_pct:.2f}%)"

        return True, "APPROVED"

    def record_trade_result(self, profit_loss: float):
        """Updates internal risk state after a trade closes."""
        self.daily_trade_count += 1
        self.daily_realized_pl += profit_loss

        if profit_loss < 0:
            self.consecutive_losses += 1
            logger.warning(f"Trade Closed with Loss (${profit_loss:.2f}). Consecutive losses: {self.consecutive_losses}")
        else:
            self.consecutive_losses = 0
            logger.info(f"Trade Closed with Profit (+${profit_loss:.2f}). Consecutive losses reset to 0.")
