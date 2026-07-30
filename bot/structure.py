"""
Institutional Algorithmic Trading Bot - Structure Module

Detects Break of Structure (BOS) and Change of Character (CHoCH) confirmation signals.
Strict Rule: No confirmation = NO TRADE.
"""

import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("StructureAnalyzer")


class StructureAnalyzer:
    """Evaluates market structure confirmations (BOS and CHoCH)."""

    def detect_confirmation(
        self,
        candles: List[Dict[str, Any]],
        swing_highs: List[Dict[str, Any]],
        swing_lows: List[Dict[str, Any]],
        sweep_direction: str
    ) -> Dict[str, Any]:
        """
        Determines if a valid BOS or CHoCH occurred following a liquidity sweep.
        """
        result = {
            "has_confirmation": False,
            "signal_type": None,  # 'BOS' or 'CHoCH'
            "direction": None,    # 'BULLISH' or 'BEARISH'
            "break_price": None,
            "break_candle": None
        }

        if not candles or len(candles) < 5 or not swing_highs or not swing_lows:
            return result

        recent_candles = candles[-8:]
        last_swing_high = swing_highs[-1]["price"]
        last_swing_low = swing_lows[-1]["price"]

        # Bullish Confirmation (After Bullish Sweep of Liquidity)
        if sweep_direction == "BULLISH_SWEEP":
            for c in recent_candles:
                # Candle body closes above recent swing high -> BOS / CHoCH
                if c["close"] > last_swing_high:
                    result["has_confirmation"] = True
                    # CHoCH if it broke opposing market structure, BOS if continuation
                    result["signal_type"] = "CHoCH" if len(swing_highs) > 1 and last_swing_high < swing_highs[-2]["price"] else "BOS"
                    result["direction"] = "BULLISH"
                    result["break_price"] = last_swing_high
                    result["break_candle"] = c
                    return result

        # Bearish Confirmation (After Bearish Sweep of Liquidity)
        elif sweep_direction == "BEARISH_SWEEP":
            for c in recent_candles:
                # Candle body closes below recent swing low -> BOS / CHoCH
                if c["close"] < last_swing_low:
                    result["has_confirmation"] = True
                    result["signal_type"] = "CHoCH" if len(swing_lows) > 1 and last_swing_low > swing_lows[-2]["price"] else "BOS"
                    result["direction"] = "BEARISH"
                    result["break_price"] = last_swing_low
                    result["break_candle"] = c
                    return result

        return result
