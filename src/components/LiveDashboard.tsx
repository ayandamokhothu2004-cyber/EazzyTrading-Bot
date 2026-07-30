import React from 'react';
import { DollarSign, TrendingUp, ShieldAlert, Zap, ArrowUpRight, ArrowDownRight, Layers, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BotDashboardData } from '../types';

interface LiveDashboardProps {
  data: BotDashboardData | null;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        INITIALIZING QUANT SYSTEM DATA FEED...
      </div>
    );
  }

  const eurusd = data.symbolsState.EURUSD;
  const nas100 = data.symbolsState.NAS100;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner: Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Account Balance & Equity */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>EQUITY BALANCE</span>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            ${data.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="h-1 bg-[#1F2937] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-green-500 w-[78%]" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Equity:</span>
            <span className="font-semibold text-green-500">
              ${data.accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
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
              {data.todayPL >= 0 ? '+' : ''}${data.todayPL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

        {/* Daily Risk Protection Meter */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>DAILY RISK DRAWDOWN</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] font-mono text-slate-400">Risk Used:</span>
            <span className="text-xs font-mono font-bold text-orange-400">{data.dailyRiskUsedPct}% / 2.0%</span>
          </div>
          <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden my-1">
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${(data.dailyRiskUsedPct / 2.0) * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Consecutive Losses:</span>
            <span className="text-white font-semibold">{data.consecutiveLosses} / 2 MAX</span>
          </div>
        </div>

        {/* Session & Engine Status */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 flex flex-col justify-between h-28 rounded-none">
          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-mono">
            <span>CIRCUIT BREAKER</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-center space-x-2 my-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">MONITORING MARKET</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Max Limit:</span>
            <span className="text-slate-300 font-semibold">2% Daily / 5% Max</span>
          </div>
        </div>

      </div>

      {/* Symbol Live Monitors: EURUSD & NAS100 */}
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
              <div className={`text-sm font-bold ${eurusd.spread <= 1.5 ? 'text-green-500' : 'text-red-400'}`}>
                {eurusd.spread.toFixed(1)} Pips
              </div>
              <span className="text-[9px] text-slate-600">Limit: 1.5 Pips</span>
            </div>
          </div>

          {/* 5-Step Rule Execution Protocol Monitor */}
          <div className="space-y-2 font-mono">
            
            {/* Step 1: Trend */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">1. HTF Trend (H4/H1)</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {eurusd.trend}
              </span>
            </div>

            {/* Step 2: Liquidity */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">2. Liquidity Engine</span>
              <span className="text-[10px] text-blue-400 italic font-bold">{eurusd.sweepDetected}</span>
            </div>

            {/* Step 3: Confirmation */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">3. BOS / CHoCH</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 font-bold">{eurusd.confirmation}</span>
            </div>

            {/* Step 4: Pullback & Model */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">4. Model State</span>
              <span className="text-[10px] text-amber-400 font-bold">MODEL A (SWEEP + BOS + OB)</span>
            </div>

          </div>
        </div>

        {/* NAS100 Monitor */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 rounded-none flex flex-col">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-black border border-[#1F2937] flex items-center justify-center font-mono font-bold text-blue-400 text-xs">
                NAS
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white text-sm font-mono tracking-wider">NAS100</h3>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30">
                    US TECH INDEX
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Ask: <span className="text-white">{nas100.ask.toFixed(1)}</span> | Bid: <span className="text-white">{nas100.bid.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Spread</div>
              <div className={`text-sm font-bold ${nas100.spread <= 25.0 ? 'text-green-500' : 'text-red-400'}`}>
                {nas100.spread.toFixed(1)} Pts
              </div>
              <span className="text-[9px] text-slate-600">Limit: 25.0 Pts</span>
            </div>
          </div>

          {/* 5-Step Rule Execution Protocol Monitor */}
          <div className="space-y-2 font-mono">
            
            {/* Step 1: Trend */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">1. HTF Trend (H4/H1)</span>
              <span className="text-[10px] px-2 py-0.5 bg-green-900/30 text-green-500 border border-green-500/30 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {nas100.trend}
              </span>
            </div>

            {/* Step 2: Liquidity */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">2. Liquidity Engine</span>
              <span className="text-[10px] text-blue-400 italic font-bold">{nas100.sweepDetected}</span>
            </div>

            {/* Step 3: Confirmation */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">3. BOS / CHoCH</span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-500/30 font-bold">{nas100.confirmation}</span>
            </div>

            {/* Step 4: Pullback & Model */}
            <div className="flex items-center justify-between p-2 bg-black border border-[#1F2937]">
              <span className="text-[10px] text-slate-500 uppercase">4. Model State</span>
              <span className="text-[10px] text-amber-400 font-bold">MODEL A (SWEEP + BOS + OB)</span>
            </div>

          </div>
        </div>

      </div>

      {/* Active Open Trades Table */}
      <div className="bg-[#111113] border border-[#1F2937] p-5 rounded-none">
        <div className="flex items-center justify-between mb-4 border-b border-[#1F2937] pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-white text-xs uppercase font-mono tracking-widest">Active MT5 Positions ({data.openTrades.length})</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Automatic SL/TP1/TP2 & Breakeven Active</span>
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
                  <th className="py-2.5 px-3">Unrealized P/L</th>
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
                        {trade.unrealizedPL >= 0 ? '+' : ''}${trade.unrealizedPL.toFixed(2)} ({trade.pips} pips)
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

    </div>
  );
};
