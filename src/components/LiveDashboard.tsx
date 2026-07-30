import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShieldAlert, Zap, ArrowUpRight, ArrowDownRight, Layers, Lock, CheckCircle2, AlertTriangle, Terminal, Play, Trash2, RefreshCw, Clock, Globe, Sparkles, Activity, Maximize2, ChevronRight } from 'lucide-react';
import { BotDashboardData } from '../types';

interface LiveDashboardProps {
  data: BotDashboardData | null;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ data }) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeChartSymbol, setActiveChartSymbol] = useState<'EURUSD' | 'US100Cash'>('EURUSD');
  const [chartTimeframe, setChartTimeframe] = useState<'M5' | 'M15' | 'H1' | 'H4'>('M15');

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        INITIALIZING QUANT SYSTEM DATA FEED...
      </div>
    );
  }

  const currencySymbol = data.currencySymbol || 'R';
  const currencyCode = data.accountCurrency || 'ZAR';

  const marginUsed = 2450.00;
  const freeMargin = (data.accountBalance || 101440.00) - marginUsed;
  const marginLevelPct = ((data.accountEquity / marginUsed) * 100).toFixed(0);

  const eurusd = data.symbolsState.EURUSD || {
    price: 1.08642,
    ask: 1.08648,
    bid: 1.08642,
    spread: 1.2,
    trend: 'UPTREND',
    sweepDetected: 'PDL Swept at 1.08450',
    confirmation: 'BOS Confirmed (M15)',
    entryModel: 'MODEL_A'
  };

  const us100 = data.symbolsState.US100Cash || data.symbolsState.NAS100 || {
    price: 18542.50,
    ask: 18544.00,
    bid: 18542.50,
    spread: 15.0,
    trend: 'UPTREND',
    sweepDetected: 'EQL Swept at 18420.00',
    confirmation: 'CHoCH Confirmed (M5)',
    entryModel: 'MODEL_A'
  };

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      await fetch('/api/bot/trigger-cycle', { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger cycle:', err);
    } finally {
      setTimeout(() => setIsTriggering(false), 800);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/bot/clear-logs', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner: Account Overview Cards & Margin Metrics (ZAR Base) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Account Balance & Equity */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>EQUITY BALANCE ({currencyCode})</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            {currencySymbol} {data.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="h-1 bg-[#1F2937] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-green-500 w-[78%]" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Equity:</span>
            <span className="font-semibold text-green-500">
              {currencySymbol} {data.accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Margin & Free Margin */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>MARGIN / FREE MARGIN</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-200 tracking-tight">
            {currencySymbol} {freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between mt-2">
            <span>Used Margin:</span>
            <span className="text-slate-300 font-semibold">{currencySymbol} {marginUsed.toFixed(2)}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Margin Level:</span>
            <span className="text-green-400 font-bold">{marginLevelPct}%</span>
          </div>
        </div>

        {/* Today's Realized P/L */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>TODAY'S NET P/L</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className={`text-2xl font-mono font-bold tracking-tight ${data.todayPL >= 0 ? 'text-green-500' : 'text-red-400'}`}>
              {data.todayPL >= 0 ? '+' : ''}{currencySymbol} {data.todayPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${data.todayPL >= 0 ? 'bg-green-900/30 text-green-500 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>
              {data.todayPLPct >= 0 ? '+' : ''}{data.todayPLPct}%
            </span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Daily Trades:</span>
            <span className="text-white font-semibold">{data.dailyTradeCount} / 2 MAX</span>
          </div>
        </div>

        {/* AI Confidence Meter */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>AI CONFIDENCE METER</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-mono font-bold text-amber-400 tracking-tight">
              88%
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-900/30 text-amber-400 border border-amber-500/30 font-bold">
              HIGH ALIGNMENT
            </span>
          </div>
          <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden my-1">
            <div className="bg-amber-400 h-full w-[88%]" />
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Bias:</span>
            <span className="text-green-400 font-bold">BULLISH SWEEP + OB</span>
          </div>
        </div>

        {/* Session Clock & Engine Status */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>SESSION CLOCK</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center space-x-2 my-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">LONDON / NY OVERLAP</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Kill Zone Active:</span>
            <span className="text-green-400 font-semibold">13:00 - 16:00 UTC</span>
          </div>
        </div>

      </div>

      {/* Economic News Calendar & Risk Warning Banner */}
      <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-950/40 border border-amber-500/40 text-amber-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">HIGH IMPACT NEWS FILTER ACTIVE</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-red-900/40 text-red-400 border border-red-500/40 rounded font-bold">
                HIGH VOLATILITY GUARD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Next USD High Impact Event: <strong className="text-amber-400">US Core CPI m/m</strong> in 2h 45m (Auto-pauses trades 15m before & after).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
          <span>Spread Filter:</span>
          <span className="text-green-400 font-bold px-2 py-1 bg-black border border-[#1F2937]">EURUSD &lt; 2.5 pips</span>
          <span className="text-green-400 font-bold px-2 py-1 bg-black border border-[#1F2937]">US100 &lt; 300 pts</span>
        </div>
      </div>

      {/* TradingView / SMC Interactive Chart Visualizer */}
      <div className="bg-[#111113] border border-[#1F2937] p-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1F2937] gap-3">
          <div className="flex items-center space-x-3">
            <Activity className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              SMC / ICT Institutional Chart Visualizer
            </h3>
            <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded font-bold">
              {activeChartSymbol} ({chartTimeframe})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Symbol Switcher */}
            <div className="flex items-center space-x-1 bg-black p-1 border border-[#1F2937] text-xs">
              <button
                onClick={() => setActiveChartSymbol('EURUSD')}
                className={`px-3 py-1 font-bold transition-colors ${
                  activeChartSymbol === 'EURUSD' ? 'bg-green-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                EURUSD
              </button>
              <button
                onClick={() => setActiveChartSymbol('US100Cash')}
                className={`px-3 py-1 font-bold transition-colors ${
                  activeChartSymbol === 'US100Cash' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                US100Cash
              </button>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center space-x-1 bg-black p-1 border border-[#1F2937] text-xs">
              {(['M5', 'M15', 'H1', 'H4'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2 py-1 font-semibold ${
                    chartTimeframe === tf ? 'text-green-400 font-bold' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulated Institutional SMC Candlestick Canvas */}
        <div className="bg-black border border-[#1F2937] p-4 relative h-72 flex flex-col justify-between select-none">
          
          {/* Top Overlay Legend */}
          <div className="flex items-center justify-between text-[11px] border-b border-[#1F2937]/60 pb-2 z-10">
            <div className="flex items-center space-x-4">
              <span className="text-white font-bold">{activeChartSymbol}</span>
              <span className="text-green-500">
                O: {activeChartSymbol === 'EURUSD' ? '1.08450' : '18510.0'}
              </span>
              <span className="text-green-400">
                H: {activeChartSymbol === 'EURUSD' ? '1.08680' : '18590.0'}
              </span>
              <span className="text-red-400">
                L: {activeChartSymbol === 'EURUSD' ? '1.08410' : '18480.0'}
              </span>
              <span className="text-white">
                C: {activeChartSymbol === 'EURUSD' ? '1.08642' : '18542.5'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center text-amber-400">
                <span className="w-2.5 h-2.5 bg-amber-500/30 border border-amber-500 mr-1" /> Bullish Order Block (OB)
              </span>
              <span className="flex items-center text-blue-400">
                <span className="w-2.5 h-2.5 bg-blue-500/30 border border-blue-500 mr-1" /> FVG Pullback Zone
              </span>
              <span className="flex items-center text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1" /> BOS / CHoCH Marker
              </span>
            </div>
          </div>

          {/* Interactive SMC Candle Bars visual */}
          <div className="relative flex-1 my-2 flex items-end justify-between px-6">
            
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-dashed border-slate-700 w-full" />
              <div className="border-b border-dashed border-slate-700 w-full" />
              <div className="border-b border-dashed border-slate-700 w-full" />
              <div className="border-b border-dashed border-slate-700 w-full" />
            </div>

            {/* Liquidity Sweep Box Overlay */}
            <div className="absolute left-8 bottom-6 w-32 h-10 bg-blue-950/40 border border-blue-500/50 flex items-center justify-center text-[9px] text-blue-400 font-bold z-10">
              EQL / PDL SWEEP ZONE
            </div>

            {/* Bullish Order Block Overlay */}
            <div className="absolute left-44 bottom-12 w-40 h-14 bg-amber-950/40 border border-amber-500/60 flex items-center justify-center text-[9px] text-amber-400 font-bold z-10">
              INSTITUTIONAL BULLISH OB (0.50 RETRACE)
            </div>

            {/* FVG Gap Overlay */}
            <div className="absolute right-24 top-16 w-28 h-12 bg-green-950/40 border border-green-500/50 flex items-center justify-center text-[9px] text-green-400 font-bold z-10">
              FAIR VALUE GAP (FVG)
            </div>

            {/* Render Simulated Candlestick Wicks & Bodies */}
            {[
              { type: 'bear', open: 60, close: 35, high: 75, low: 20 },
              { type: 'bear', open: 35, close: 15, high: 40, low: 10 },
              { type: 'bull', open: 15, close: 50, high: 65, low: 12 },
              { type: 'bull', open: 50, close: 75, high: 82, low: 45 },
              { type: 'bear', open: 75, close: 60, high: 78, low: 55 },
              { type: 'bull', open: 60, close: 85, high: 90, low: 58 },
              { type: 'bull', open: 85, close: 95, high: 98, low: 80 }
            ].map((candle, idx) => (
              <div key={idx} className="relative flex flex-col items-center justify-center w-6 h-full z-0">
                {/* Wick */}
                <div
                  className="w-0.5 bg-slate-600 absolute"
                  style={{ top: `${100 - candle.high}%`, bottom: `${candle.low}%` }}
                />
                {/* Candle Body */}
                <div
                  className={`w-3.5 absolute rounded-xs ${
                    candle.type === 'bull'
                      ? 'bg-green-500 border border-green-400'
                      : 'bg-red-500 border border-red-400'
                  }`}
                  style={{
                    top: `${100 - Math.max(candle.open, candle.close)}%`,
                    height: `${Math.abs(candle.open - candle.close)}%`
                  }}
                />
              </div>
            ))}

          </div>

          {/* Bottom Time Axis */}
          <div className="flex justify-between text-[9px] text-slate-500 border-t border-[#1F2937]/60 pt-1">
            <span>08:00 UTC (Asian)</span>
            <span>11:00 UTC (London Open)</span>
            <span>13:30 UTC (NY Open)</span>
            <span>16:00 UTC (NY Close)</span>
          </div>
        </div>
      </div>

      {/* Symbol Live Monitors: EURUSD & US100Cash */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* EURUSD Monitor */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-black border border-[#1F2937] flex items-center justify-center font-mono font-bold text-green-500 text-xs">
                EUR
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-sm font-mono tracking-wider">EURUSD</h3>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30">
                    FOREX MAJOR
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Ask: <span className="text-white">{eurusd.ask.toFixed(5)}</span> | Bid: <span className="text-white">{eurusd.bid.toFixed(5)}</span>
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Spread</div>
              <div className={`text-sm font-bold ${eurusd.spread <= 2.5 ? 'text-green-500' : 'text-red-400'}`}>
                {eurusd.spread.toFixed(1)} Pips
              </div>
              <span className="text-[9px] text-slate-600">Limit: 2.5 Pips</span>
            </div>
          </div>

          {/* 5-Step Rule Execution Protocol Monitor */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">1. HTF Trend (H4/H1)</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {eurusd.trend}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">2. Liquidity Engine</span>
              <span className="text-[10px] text-blue-400 italic font-bold">{eurusd.sweepDetected}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">3. BOS / CHoCH</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 font-bold">{eurusd.confirmation}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">4. Model State</span>
              <span className="text-[10px] text-amber-400 font-bold">MODEL A (SWEEP + BOS + OB)</span>
            </div>
          </div>
        </div>

        {/* US100Cash Monitor */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-black border border-[#1F2937] flex items-center justify-center font-mono font-bold text-blue-400 text-xs">
                US100
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-sm font-mono tracking-wider">US100Cash</h3>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30">
                    US TECH INDEX
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Ask: <span className="text-white">{us100.ask.toFixed(1)}</span> | Bid: <span className="text-white">{us100.bid.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Spread</div>
              <div className={`text-sm font-bold ${us100.spread <= 300.0 ? 'text-green-500' : 'text-red-400'}`}>
                {us100.spread.toFixed(1)} Pts
              </div>
              <span className="text-[9px] text-slate-600">Limit: 300.0 Pts</span>
            </div>
          </div>

          {/* 5-Step Rule Execution Protocol Monitor */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">1. HTF Trend (H4/H1)</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {us100.trend}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">2. Liquidity Engine</span>
              <span className="text-[10px] text-blue-400 italic font-bold">{us100.sweepDetected}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">3. BOS / CHoCH</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 font-bold">{us100.confirmation}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">4. Model State</span>
              <span className="text-[10px] text-amber-400 font-bold">MODEL A (SWEEP + BOS + OB)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Active Open Trades Table (ZAR Base) */}
      <div className="bg-[#111113] border border-[#1F2937] p-5 rounded-none">
        <div className="flex items-center justify-between mb-4 border-b border-[#1F2937] pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-white text-xs uppercase font-mono tracking-widest">Active MT5 Positions ({data.openTrades.length})</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Automatic SL/TP1/TP2 & Breakeven Active ({currencyCode})</span>
        </div>

        {data.openTrades.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            NO OPEN POSITIONS. MONITORING MARKET FOR INSTITUTIONAL SETUPS...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0A0A0B] border-b border-[#1F2937] text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="py-2.5 px-3">Ticket</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Lot Size</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">TP1 (2R)</th>
                  <th className="py-2.5 px-3">TP2 (Target)</th>
                  <th className="py-2.5 px-3">Current</th>
                  <th className="py-2.5 px-3">Unrealized P/L ({currencyCode})</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50 font-mono">
                {data.openTrades.map((trade) => (
                  <tr key={trade.ticket} className="hover:bg-[#1F2937]/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-400">{trade.ticket}</td>
                    <td className="py-3 px-3 font-bold text-white">{trade.symbol}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${trade.direction === 'BUY' ? 'bg-green-900/30 text-green-500 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">{trade.lotSize}</td>
                    <td className="py-3 px-3">{trade.entryPrice.toFixed(5)}</td>
                    <td className="py-3 px-3 text-red-400">{trade.slPrice.toFixed(5)}</td>
                    <td className="py-3 px-3 text-green-500">{trade.tp1Price.toFixed(5)}</td>
                    <td className="py-3 px-3 text-blue-400">{trade.tp2Price.toFixed(5)}</td>
                    <td className="py-3 px-3 font-bold text-white">{trade.currentPrice.toFixed(5)}</td>
                    <td className="py-3 px-3 font-bold">
                      <span className={trade.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-400'}>
                        {trade.unrealizedPL >= 0 ? '+' : ''}{currencySymbol} {trade.unrealizedPL.toFixed(2)} ({trade.pips} pips)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[10px] text-green-500 font-mono">ACTIVE (1.0% RISK)</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Python Terminal & Execution Log Console */}
      <div className="bg-[#0D0D10] border border-[#1F2937] p-5 rounded-none font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#1F2937] gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Python Trading Engine — Real-Time Execution Console
            </h3>
            <span className="px-2 py-0.5 text-[9px] bg-green-900/30 text-green-500 border border-green-500/30 rounded">
              LIVE STREAM
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerCycle}
              disabled={isTriggering}
              className="flex items-center space-x-1.5 px-3 py-1 bg-green-500 hover:bg-green-400 text-black text-xs font-bold rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>RUN PYTHON CYCLE</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>CLEAR</span>
            </button>
          </div>
        </div>

        {/* Console Log Window */}
        <div className="bg-black border border-[#1F2937]/80 p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
          {(!data.logs || data.logs.length === 0) ? (
            <div className="text-slate-600 text-center py-12">
              Console output buffer empty. Click 'RUN PYTHON CYCLE' to execute.
            </div>
          ) : (
            data.logs.map((logLine, idx) => {
              let colorClass = 'text-slate-300';
              if (logLine.includes('ERROR') || logLine.includes('Failed')) colorClass = 'text-red-400 font-bold';
              else if (logLine.includes('PASSED') || logLine.includes('SUCCESS') || logLine.includes('ONLINE') || logLine.includes('valid=True')) colorClass = 'text-green-400 font-semibold';
              else if (logLine.includes('Sweep') || logLine.includes('BOS') || logLine.includes('Trigger')) colorClass = 'text-blue-400';
              else if (logLine.includes('USER_ACTION') || logLine.includes('TRIGGER')) colorClass = 'text-amber-400';

              return (
                <div key={idx} className={`leading-relaxed border-b border-slate-900/60 pb-1 ${colorClass}`}>
                  {logLine}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};


