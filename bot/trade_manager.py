"""
Institutional Algorithmic Trading Bot - Trade Manager Module

Executes trade orders on MT5 / order book, manages dynamic TP1 (2R) & TP2 targets,
handles partial closes (50%), moves SL to Breakeven, and maintains trailing stops.
"""

import logging
import time
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("TradeManager")

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False


class TradeManager:
    """Manages active trading positions, partial exits, breakeven adjustments, and order execution."""

    def __init__(self, tp1_rr: float = 2.0, partial_close_pct: float = 50.0, breakeven_after_tp1: bool = True):
        self.tp1_rr = tp1_rr
        self.partial_close_pct = partial_close_pct
        self.breakeven_after_tp1 = breakeven_after_tp1
        self.active_positions: Dict[str, Dict[str, Any]] = {}

    def execute_order(
        self,
        symbol: str,
        order_type: str,  # 'BUY' or 'SELL'
        lot_size: float,
        entry_price: float,
        sl_price: float,
        tp2_liquidity_price: Optional[float],
        reason: str
    ) -> Dict[str, Any]:
        """
        Calculates TP1 at 2R and executes position via MT5 terminal or order engine.
        """
        sl_distance = abs(entry_price - sl_price)
        if order_type == "BUY":
            tp1_price = entry_price + (sl_distance * self.tp1_rr)
            tp2_price = tp2_liquidity_price if tp2_liquidity_price and tp2_liquidity_price > tp1_price else (entry_price + (sl_distance * 4.0))
        else:
            tp1_price = entry_price - (sl_distance * self.tp1_rr)
            tp2_price = tp2_liquidity_price if tp2_liquidity_price and tp2_liquidity_price < tp1_price else (entry_price - (sl_distance * 4.0))

        trade_id = f"ORDER_{int(time.time())}"

        if MT5_AVAILABLE:
            # Send live order request to MT5
            cmd = mt5.ORDER_TYPE_BUY if order_type == "BUY" else mt5.ORDER_TYPE_SELL
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": lot_size,
                "type": cmd,
                "price": entry_price,
                "sl": sl_price,
                "tp": tp1_price,
                "deviation": 10,
                "magic": 202608,
                "comment": f"Bot {reason[:15]}",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            res = mt5.order_send(request)
            if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                trade_id = str(res.order)
                logger.info(f"MT5 Order Executed Successfully! Ticket: {trade_id}")
            else:
                ret = res.retcode if res else "UNKNOWN"
                logger.error(f"MT5 Order Execution Failed! Return code: {ret}")

        # Store internal position tracking state
        position = {
            "ticket": trade_id,
            "symbol": symbol,
            "order_type": order_type,
            "lot_size": lot_size,
            "initial_lot": lot_size,
            "entry_price": entry_price,
            "sl_price": sl_price,
            "tp1_price": tp1_price,
            "tp2_price": tp2_price,
            "tp1_hit": False,
            "breakeven_active": False,
            "reason": reason,
            "open_time": time.time(),
            "realized_pl": 0.0
        }

        self.active_positions[trade_id] = position
        logger.info(f"Position Registered [{trade_id}]: {order_type} {lot_size} lots {symbol} @ {entry_price:.5f} | SL: {sl_price:.5f} | TP1(2R): {tp1_price:.5f}")
        return position

    def update_positions(self, symbol: str, current_ask: float, current_bid: float) -> List[Dict[str, Any]]:
        """
        Monitors active positions against live prices for TP1 (2R) hit, partial closes, and breakeven adjustment.
        Returns list of closed position reports.
        """
        closed_reports = []
        tickets_to_remove = []

        for ticket, pos in self.active_positions.items():
            if pos["symbol"] != symbol:
                continue

            current_price = current_bid if pos["order_type"] == "BUY" else current_ask

            # 1. Check Stop Loss Hit
            is_sl_hit = (current_price <= pos["sl_price"]) if pos["order_type"] == "BUY" else (current_price >= pos["sl_price"])
            if is_sl_hit:
                loss_amount = (pos["sl_price"] - pos["entry_price"]) * pos["lot_size"] * (100000.0 if "EUR" in symbol else 1.0)
                pos["realized_pl"] += loss_amount
                closed_reports.append({
                    "ticket": ticket,
                    "symbol": symbol,
                    "direction": pos["order_type"],
                    "entry_price": pos["entry_price"],
                    "exit_price": pos["sl_price"],
                    "lot_size": pos["lot_size"],
                    "pl": loss_amount,
                    "status": "STOP_LOSS",
                    "reason": pos["reason"]
                })
                tickets_to_remove.append(ticket)
                continue

            # 2. Check TP1 Hit (2R Multiple) -> Execute Partial Close & Breakeven
            if not pos["tp1_hit"]:
                is_tp1_hit = (current_price >= pos["tp1_price"]) if pos["order_type"] == "BUY" else (current_price <= pos["tp1_price"])
                if is_tp1_hit:
                    pos["tp1_hit"] = True
                    partial_lots = round(pos["lot_size"] * (self.partial_close_pct / 100.0), 2)
                    pos["lot_size"] -= partial_lots

                    # Partial profit
                    partial_profit = abs(pos["tp1_price"] - pos["entry_price"]) * partial_lots * (100000.0 if "EUR" in symbol else 1.0)
                    pos["realized_pl"] += partial_profit

                    logger.info(f"TP1 HIT (2R) for Ticket {ticket}! Closed {partial_lots} lots for +${partial_profit:.2f} profit.")

                    # Move SL to Breakeven
                    if self.breakeven_after_tp1:
                        pos["sl_price"] = pos["entry_price"]
                        pos["breakeven_active"] = True
                        logger.info(f"Stop Loss moved to BREAKEVEN ({pos['entry_price']:.5f}) for Ticket {ticket}.")

            # 3. Check TP2 Hit (Liquidity Target)
            is_tp2_hit = (current_price >= pos["tp2_price"]) if pos["order_type"] == "BUY" else (current_price <= pos["tp2_price"])
            if is_tp2_hit:
                final_profit = abs(pos["tp2_price"] - pos["entry_price"]) * pos["lot_size"] * (100000.0 if "EUR" in symbol else 1.0)
                pos["realized_pl"] += final_profit
                closed_reports.append({
                    "ticket": ticket,
                    "symbol": symbol,
                    "direction": pos["order_type"],
                    "entry_price": pos["entry_price"],
                    "exit_price": pos["tp2_price"],
                    "lot_size": pos["initial_lot"],
                    "pl": pos["realized_pl"],
                    "status": "TAKE_PROFIT_2",
                    "reason": pos["reason"]
                })
                tickets_to_remove.append(ticket)

        for ticket in tickets_to_remove:
            del self.active_positions[ticket]

        return closed_reports
