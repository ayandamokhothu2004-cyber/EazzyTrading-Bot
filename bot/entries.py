"""
Institutional Algorithmic Trading Bot - Entry Engine Module

Identifies Order Blocks (OB), Fair Value Gaps (FVG), structure pullbacks,
and evaluates execution Entry Models (A, B, C).
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("EntryEngine")


class EntryEngine:
    """Calculates entry points, Order Blocks, FVGs, and validates pullback conditions."""

    def find_fair_value_gaps(self, candles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies 3-candle Fair Value Gaps (FVG) / Imbalances.
        Bullish FVG: Low of Candle 3 > High of Candle 1 (Gap between C1 High and C3 Low).
        Bearish FVG: High of Candle 3 < Low of Candle 1 (Gap between C1 Low and C3 High).
        """
        fvgs = []
        if len(candles) < 3:
            return fvgs

        for i in range(2, len(candles)):
            c1 = candles[i - 2]
            c2 = candles[i - 1]
            c3 = candles[i]

            # Bullish FVG
            if c3["low"] > c1["high"]:
                fvgs.append({
                    "type": "BULLISH_FVG",
                    "top": c3["low"],
                    "bottom": c1["high"],
                    "midpoint": (c3["low"] + c1["high"]) / 2.0,
                    "candle_time": c2["time"]
                })

            # Bearish FVG
            elif c3["high"] < c1["low"]:
                fvgs.append({
                    "type": "BEARISH_FVG",
                    "top": c1["low"],
                    "bottom": c3["high"],
                    "midpoint": (c1["low"] + c3["high"]) / 2.0,
                    "candle_time": c2["time"]
                })

        return fvgs

    def find_order_blocks(self, candles: List[Dict[str, Any]], confirmation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Identifies the last opposing candle before displacement (Order Block).
        Bullish OB: Last bearish candle prior to bullish impulse/break.
        Bearish OB: Last bullish candle prior to bearish impulse/break.
        """
        if not confirmation.get("has_confirmation"):
            return None

        break_candle = confirmation.get("break_candle")
        if not break_candle or len(candles) < 10:
            return None

        direction = confirmation.get("direction")

        # Find break candle index
        break_idx = None
        for idx, c in enumerate(candles):
            if c["time"] == break_candle["time"]:
                break_idx = idx
                break

        if break_idx is None or break_idx < 3:
            return None

        # Look backward for last opposing color candle
        if direction == "BULLISH":
            for k in range(break_idx - 1, max(0, break_idx - 8), -1):
                if candles[k]["close"] < candles[k]["open"]:  # Bearish candle
                    return {
                        "type": "BULLISH_OB",
                        "high": candles[k]["high"],
                        "low": candles[k]["low"],
                        "open": candles[k]["open"],
                        "close": candles[k]["close"],
                        "time": candles[k]["time"]
                    }

        elif direction == "BEARISH":
            for k in range(break_idx - 1, max(0, break_idx - 8), -1):
                if candles[k]["close"] > candles[k]["open"]:  # Bullish candle
                    return {
                        "type": "BEARISH_OB",
                        "high": candles[k]["high"],
                        "low": candles[k]["low"],
                        "open": candles[k]["open"],
                        "close": candles[k]["close"],
                        "time": candles[k]["time"]
                    }

        return None

    def evaluate_entry(
        self,
        model_type: str,
        candles: List[Dict[str, Any]],
        trend: str,
        sweep: Dict[str, Any],
        confirmation: Dict[str, Any],
        ob_required: bool,
        fvg_required: bool
    ) -> Dict[str, Any]:
        """
        Evaluates complete entry signal according to Model A, Model B, or Model C.
        Returns trade opportunity dictionary if all criteria are met.
        """
        signal = {
            "valid": False,
            "direction": None,  # 'BUY' or 'SELL'
            "entry_price": 0.0,
            "sl_price": 0.0,
            "reason": None,
            "ob": None,
            "fvg": None
        }

        if not sweep.get("is_swept") or not confirmation.get("has_confirmation"):
            return signal

        direction = "BUY" if confirmation.get("direction") == "BULLISH" else "SELL"
        last_candle = candles[-1]
        current_close = last_candle["close"]

        fvgs = self.find_fair_value_gaps(candles)
        ob = self.find_order_blocks(candles, confirmation)

        # Stop Loss Placement Rules:
        # Above sweep high for Sells, Below sweep low for Buys
        sweep_candle = sweep.get("sweep_candle")
        if direction == "BUY":
            sl_price = (sweep_candle["low"] if sweep_candle else last_candle["low"]) - 0.0005
        else:
            sl_price = (sweep_candle["high"] if sweep_candle else last_candle["high"]) + 0.0005

        # Check model requirements
        if model_type == "MODEL_A":
            # Model A: Trend -> Liquidity Sweep -> BOS -> Pullback to Structure/OB
            has_pulled_back = False
            if direction == "BUY":
                if ob and current_close <= ob["high"]:
                    has_pulled_back = True
                elif not ob_required:
                    has_pulled_back = True
            else:
                if ob and current_close >= ob["low"]:
                    has_pulled_back = True
                elif not ob_required:
                    has_pulled_back = True

            if has_pulled_back:
                signal["valid"] = True
                signal["direction"] = direction
                signal["entry_price"] = current_close
                signal["sl_price"] = sl_price
                signal["reason"] = f"Model A: {trend} -> {sweep['level_type']} Sweep -> {confirmation['signal_type']} -> Pullback"
                signal["ob"] = ob
                return signal

        elif model_type == "MODEL_B":
            # Model B: Trend -> Supply/Demand Zone -> Rejection Candle
            rejection_candle = (last_candle["close"] > last_candle["open"]) if direction == "BUY" else (last_candle["close"] < last_candle["open"])
            if rejection_candle:
                signal["valid"] = True
                signal["direction"] = direction
                signal["entry_price"] = current_close
                signal["sl_price"] = sl_price
                signal["reason"] = f"Model B: {trend} -> Supply/Demand Rejection Candle"
                return signal

        elif model_type == "MODEL_C":
            # Model C: Trend -> Liquidity Sweep -> CHoCH -> FVG Fill
            matching_fvgs = [f for f in fvgs if f["type"] == (f"BULLISH_FVG" if direction == "BUY" else "BEARISH_FVG")]
            if matching_fvgs or not fvg_required:
                signal["valid"] = True
                signal["direction"] = direction
                signal["entry_price"] = current_close
                signal["sl_price"] = sl_price
                signal["reason"] = f"Model C: {trend} -> {sweep['level_type']} Sweep -> CHoCH -> FVG Imbalance"
                signal["fvg"] = matching_fvgs[-1] if matching_fvgs else None
                return signal

        return signal
