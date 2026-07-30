"""
Institutional Algorithmic Trading Bot - Trading Journal Module

Automatically records every executed trade with exact operational parameters,
reasons for entry, lot sizes, risk, and P/L for post-trade analysis.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger("TradeJournal")


class TradeJournal:
    """Records trade history and provides analytical summaries."""

    def __init__(self, journal_path: str):
        self.journal_path = journal_path
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        """Creates log folder and file if absent."""
        os.makedirs(os.path.dirname(self.journal_path), exist_ok=True)
        if not os.path.exists(self.journal_path):
            with open(self.journal_path, "w") as f:
                json.dump([], f, indent=2)

    def log_trade(
        self,
        symbol: str,
        direction: str,
        entry_price: float,
        sl_price: float,
        tp_price: float,
        exit_price: float,
        lot_size: float,
        risk_pct: float,
        profit_loss: float,
        rr_achieved: float,
        reason: str
    ) -> Dict[str, Any]:
        """Logs trade record to local JSON database."""
        trade_entry = {
            "trade_id": f"TRD_{int(datetime.utcnow().timestamp())}",
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "time": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "symbol": symbol,
            "direction": direction,
            "entry_price": round(entry_price, 5),
            "sl_price": round(sl_price, 5),
            "tp_price": round(tp_price, 5),
            "exit_price": round(exit_price, 5),
            "lot_size": lot_size,
            "risk_pct": risk_pct,
            "profit_loss": round(profit_loss, 2),
            "rr_achieved": round(rr_achieved, 2),
            "reason_for_entry": reason
        }

        try:
            with open(self.journal_path, "r") as f:
                trades = json.load(f)

            trades.append(trade_entry)

            with open(self.journal_path, "w") as f:
                json.dump(trades, f, indent=2)

            logger.info(f"Logged Trade {trade_entry['trade_id']} to Journal ({symbol} {direction} ${profit_loss:+.2f}).")
        except Exception as e:
            logger.error(f"Failed to write to trade journal: {e}")

        return trade_entry

    def get_all_trades(self) -> List[Dict[str, Any]]:
        """Retrieves all logged trades."""
        if not os.path.exists(self.journal_path):
            return []
        try:
            with open(self.journal_path, "r") as f:
                return json.load(f)
        except Exception:
            return []
