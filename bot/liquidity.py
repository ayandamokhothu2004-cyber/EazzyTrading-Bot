"""
Institutional Algorithmic Trading Bot - Liquidity Module

Identifies institutional liquidity pools (EQH, EQL, PDH, PDL)
and detects true liquidity sweeps.
Strict Rule: No liquidity sweep = NO TRADE.
"""

import logging
from datetime import datetime, date
from typing import List, Dict, Any, Optional

logger = logging.getLogger("LiquidityAnalyzer")


class LiquidityAnalyzer:
    """Detects liquidity targets and validates false breaks / liquidity sweeps."""

    def __init__(self, eq_tolerance_pct: float = 0.0005):
        self.eq_tolerance_pct = eq_tolerance_pct

    def get_pdh_pdl(self, d1_candles: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[float]]:
        """Calculates Previous Day High (PDH) and Previous Day Low (PDL)."""
        if len(d1_candles) < 2:
            return None, None

        # Previous completed daily candle
        prev_day = d1_candles[-2]
        return prev_day["high"], prev_day["low"]

    def find_equal_highs_lows(self, swing_highs: List[Dict[str, Any]], swing_lows: List[Dict[str, Any]]) -> Tuple[List[float], List[float]]:
        """Identifies Equal Highs (EQH) and Equal Lows (EQL) clusters."""
        eqh_levels = []
        eql_levels = []

        # Check Equal Highs
        for i in range(len(swing_highs)):
            for j in range(i + 1, len(swing_highs)):
                p1 = swing_highs[i]["price"]
                p2 = swing_highs[j]["price"]
                if abs(p1 - p2) / p1 <= self.eq_tolerance_pct:
                    eqh_levels.append(max(p1, p2))

        # Check Equal Lows
        for i in range(len(swing_lows)):
            for j in range(i + 1, len(swing_lows)):
                p1 = swing_lows[i]["price"]
                p2 = swing_lows[j]["price"]
                if abs(p1 - p2) / p1 <= self.eq_tolerance_pct:
                    eql_levels.append(min(p1, p2))

        return list(set(eqh_levels)), list(set(eql_levels))

    def detect_liquidity_sweep(
        self,
        candles: List[Dict[str, Any]],
        pdh: Optional[float],
        pdl: Optional[float],
        eqh_list: List[float],
        eql_list: List[float],
        trend: str
    ) -> Dict[str, Any]:
        """
        Determines if price recently swept liquidity.
        For BUY: Needs Bearish sweep of EQL or PDL (Price pierced below EQL/PDL then closed back above).
        For SELL: Needs Bullish sweep of EQH or PDH (Price pierced above EQH/PDH then closed back below).
        """
        result = {
            "is_swept": False,
            "direction": None,  # 'BULLISH_SWEEP' (for long) or 'BEARISH_SWEEP' (for short)
            "swept_level": None,
            "level_type": None,  # 'PDH', 'PDL', 'EQH', 'EQL'
            "sweep_candle": None
        }

        if not candles or len(candles) < 3:
            return result

        # Check recent 10 execution candles
        recent_candles = candles[-10:]

        # 1. Bullish Sweep of Sellside Liquidity (EQL or PDL) -> Opportunity for BUY
        sellside_targets = []
        if pdl is not None:
            sellside_targets.append(("PDL", pdl))
        for eql in eql_list:
            sellside_targets.append(("EQL", eql))

        if trend in ["UPTREND", "NO_TREND"]:
            for level_type, level_price in sellside_targets:
                for c in recent_candles:
                    # Pierced below level but closed back above level (rejection wick below)
                    if c["low"] < level_price and c["close"] > level_price:
                        result["is_swept"] = True
                        result["direction"] = "BULLISH_SWEEP"  # Swept sellside liquidity, prepare for LONG
                        result["swept_level"] = level_price
                        result["level_type"] = level_type
                        result["sweep_candle"] = c
                        return result

        # 2. Bearish Sweep of Buyside Liquidity (EQH or PDH) -> Opportunity for SELL
        buyside_targets = []
        if pdh is not None:
            buyside_targets.append(("PDH", pdh))
        for eqh in eqh_list:
            buyside_targets.append(("EQH", eqh))

        if trend in ["DOWNTREND", "NO_TREND"]:
            for level_type, level_price in buyside_targets:
                for c in recent_candles:
                    # Pierced above level but closed back below level (rejection wick above)
                    if c["high"] > level_price and c["close"] < level_price:
                        result["is_swept"] = True
                        result["direction"] = "BEARISH_SWEEP"  # Swept buyside liquidity, prepare for SHORT
                        result["swept_level"] = level_price
                        result["level_type"] = level_type
                        result["sweep_candle"] = c
                        return result

        return result
