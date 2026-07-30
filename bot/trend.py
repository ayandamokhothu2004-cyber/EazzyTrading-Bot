"""
Institutional Algorithmic Trading Bot - Higher Timeframe Trend Module

Determines higher timeframe (H4/H1) structural direction.
Strict Rule:
- Uptrend: Sequence of Higher Highs & Higher Lows.
- Downtrend: Sequence of Lower Highs & Lower Lows.
- Unclear: Ranging or mixed structure -> NO_TREND (NO TRADE).
"""

import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("TrendAnalyzer")


class TrendAnalyzer:
    """Analyzes swing highs and swing lows to classify macro market trend direction."""

    def __init__(self, swing_lookback: int = 5):
        self.swing_lookback = swing_lookback

    def find_swing_points(self, candles: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Identifies Swing Highs and Swing Lows using fractal lookback window."""
        swing_highs = []
        swing_lows = []

        if len(candles) < (self.swing_lookback * 2 + 1):
            return swing_highs, swing_lows

        for i in range(self.swing_lookback, len(candles) - self.swing_lookback):
            curr_high = candles[i]["high"]
            curr_low = candles[i]["low"]

            # Swing High Check
            is_swing_high = True
            for k in range(1, self.swing_lookback + 1):
                if candles[i - k]["high"] >= curr_high or candles[i + k]["high"] >= curr_high:
                    is_swing_high = False
                    break

            if is_swing_high:
                swing_highs.append({
                    "index": i,
                    "price": curr_high,
                    "time": candles[i]["time"]
                })

            # Swing Low Check
            is_swing_low = True
            for k in range(1, self.swing_lookback + 1):
                if candles[i - k]["low"] <= curr_low or candles[i + k]["low"] <= curr_low:
                    is_swing_low = False
                    break

            if is_swing_low:
                swing_lows.append({
                    "index": i,
                    "price": curr_low,
                    "time": candles[i]["time"]
                })

        return swing_highs, swing_lows

    def evaluate_trend(self, h4_candles: List[Dict[str, Any]], h1_candles: List[Dict[str, Any]]) -> str:
        """
        Evaluates trend across H4 and H1 timeframes.
        Returns 'UPTREND', 'DOWNTREND', or 'NO_TREND'.
        """
        h4_trend = self._get_single_tf_trend(h4_candles)
        h1_trend = self._get_single_tf_trend(h1_candles)

        # Both H4 and H1 must align, or H4 dictates bias if H1 is neutral
        if h4_trend == h1_trend and h4_trend != "NO_TREND":
            return h4_trend
        elif h4_trend != "NO_TREND" and h1_trend == "NO_TREND":
            return h4_trend
        else:
            return "NO_TREND"

    def _get_single_tf_trend(self, candles: List[Dict[str, Any]]) -> str:
        """Determines trend for a single timeframe candle dataset."""
        if len(candles) < 30:
            return "NO_TREND"

        swing_highs, swing_lows = self.find_swing_points(candles)

        if len(swing_highs) < 2 or len(swing_lows) < 2:
            return "NO_TREND"

        recent_sh1 = swing_highs[-1]["price"]
        recent_sh2 = swing_highs[-2]["price"]

        recent_sl1 = swing_lows[-1]["price"]
        recent_sl2 = swing_lows[-2]["price"]

        is_higher_highs = recent_sh1 > recent_sh2
        is_higher_lows = recent_sl1 > recent_sl2

        is_lower_highs = recent_sh1 < recent_sh2
        is_lower_lows = recent_sl1 < recent_sl2

        if is_higher_highs and is_higher_lows:
            return "UPTREND"
        elif is_lower_highs and is_lower_lows:
            return "DOWNTREND"
        else:
            return "NO_TREND"
