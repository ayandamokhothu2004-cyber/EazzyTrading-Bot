import React, { useState } from 'react';
import { TrendingUp, BarChart2, PieChart, ShieldAlert, Zap, Calendar, DollarSign, Award } from 'lucide-react';

interface AnalyticsViewProps {
  currencySymbol?: string;
  currencyCode?: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currencySymbol = 'R', currencyCode = 'ZAR' }) => {
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | 'YTD' | '3M' | '1M'>('ALL');

  const monthlyData = [
    { month: 'Jan', returnPct: 6.4, profit: 6400, trades: 18, winRate: 72 },
    { month: 'Feb', returnPct: 4.2, profit: 4200, trades: 14, winRate: 78 },
    { month: 'Mar', returnPct: 8.1, profit: 8100, trades: 22, winRate: 76 },
    { month: 'Apr', returnPct: -1.2, profit: -1200, trades: 12, winRate: 58 },
    { month: 'May', returnPct: 9.5, profit: 9500, trades: 24, winRate: 80 },
    { month: 'Jun', returnPct: 5.8, profit: 5800, trades: 19, winRate: 74 },
    { month: 'Jul', returnPct: 7.3, profit: 7300, trades: 21, winRate: 76 }
  ];

  const totalReturn = monthlyData.reduce((acc, curr) => acc + curr.returnPct, 0);
  const totalProfit = monthlyData.reduce((acc, curr) => acc + curr.profit, 0);
  const totalTrades = monthlyData.reduce((acc, curr) => acc + curr.trades, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#111113] border border-[#1F2937] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">
              INSTITUTIONAL PERFORMANCE & QUANT ANALYTICS
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            STATISTICAL BREAKDOWN OF SMC/ICT EXECUTIONS, DRAWDOWN CURVES & SESSION PROFITABILITY.
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center space-x-1 bg-black p-1 border border-[#1F2937] font-mono text-xs">
          {(['ALL', 'YTD', '3M', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframeFilter(tf)}
              className={`px-3 py-1 font-semibold transition-colors ${
                timeframeFilter === tf
                  ? 'bg-green-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest">CUMULATIVE RETURN</span>
          <div className="text-2xl font-bold text-green-500 mt-1">
            +{totalReturn.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total Net P/L: <strong className="text-white">{currencySymbol} {totalProfit.toLocaleString()}</strong>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest">OVERALL WIN RATE</span>
          <div className="text-2xl font-bold text-white mt-1">
            74.2%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total Trades: <strong className="text-white">{totalTrades}</strong> | Wins: <strong className="text-green-500">96</strong> | Losses: <strong className="text-red-400">34</strong>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest">AVERAGE RISK : REWARD</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            1 : 2.85 R
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Expectancy per trade: <strong className="text-green-400">+1.65 R</strong>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase tracking-widest">MAX HISTORICAL DRAWDOWN</span>
          <div className="text-2xl font-bold text-orange-400 mt-1">
            -1.4%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Risk Limit: <strong className="text-slate-300">2.0% Daily Max</strong>
          </div>
        </div>
      </div>

      {/* Cumulative Profit Curve Visualizer */}
      <div className="bg-[#111113] border border-[#1F2937] p-5">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4 font-mono">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Cumulative Growth Curve ({currencyCode})
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">SMOOTH EQUITY ACCELERATION ENGINE</span>
        </div>

        {/* Visual Simulated Curve Canvas */}
        <div className="bg-black border border-[#1F2937] p-4 h-56 flex items-end justify-between space-x-2 font-mono text-[10px]">
          {monthlyData.map((d, i) => {
            const heightPct = Math.max(15, Math.min(90, d.returnPct * 8 + 20));
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Hover Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#1F2937] text-white p-1.5 rounded text-[9px] pointer-events-none whitespace-nowrap z-10 border border-green-500/50 transition-opacity">
                  {d.month}: {d.returnPct >= 0 ? '+' : ''}{d.returnPct}% ({currencySymbol} {d.profit})
                </div>

                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    d.returnPct >= 0
                      ? 'bg-gradient-to-t from-green-950 to-green-500 border-t border-green-400'
                      : 'bg-gradient-to-t from-red-950 to-red-500 border-t border-red-400'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className="mt-2 text-slate-400 font-bold">{d.month}</span>
                <span className={`text-[9px] ${d.returnPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {d.returnPct >= 0 ? '+' : ''}{d.returnPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Monthly Returns Heatmap & Trading Session Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono">
        
        {/* Monthly Returns Heatmap */}
        <div className="bg-[#111113] border border-[#1F2937] p-5">
          <div className="flex items-center space-x-2 border-b border-[#1F2937] pb-3 mb-4">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Monthly Return Heatmap (2026)
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {monthlyData.map((m) => (
              <div
                key={m.month}
                className={`p-3 border flex flex-col justify-between h-20 ${
                  m.returnPct >= 5
                    ? 'bg-green-950/60 border-green-500/50 text-green-400'
                    : m.returnPct > 0
                    ? 'bg-green-950/30 border-green-500/30 text-green-500'
                    : 'bg-red-950/40 border-red-500/40 text-red-400'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-bold">{m.month} 2026</div>
                <div className="text-base font-bold">
                  {m.returnPct >= 0 ? '+' : ''}{m.returnPct}%
                </div>
                <div className="text-[9px] text-slate-500">
                  {m.trades} trades ({m.winRate}% W)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pair & Session Breakdown */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#1F2937] pb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Instrument & Session Profitability
            </h3>
          </div>

          {/* EURUSD Performance */}
          <div className="bg-black border border-[#1F2937] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2" /> EURUSD (Forex Major)
              </span>
              <span className="text-green-500 font-bold">+24.5% ({currencySymbol} 24,500)</span>
            </div>
            <div className="w-full bg-[#1F2937] h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-[76%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Win Rate: 76.4%</span>
              <span>Avg RR: 1:2.7R</span>
              <span>Trades: 72</span>
            </div>
          </div>

          {/* US100Cash Performance */}
          <div className="bg-black border border-[#1F2937] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" /> US100Cash (US Tech Index)
              </span>
              <span className="text-blue-400 font-bold">+15.6% ({currencySymbol} 15,600)</span>
            </div>
            <div className="w-full bg-[#1F2937] h-2 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full w-[71%]" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Win Rate: 71.2%</span>
              <span>Avg RR: 1:3.1R</span>
              <span>Trades: 58</span>
            </div>
          </div>

          {/* Session Breakdown Bar */}
          <div className="bg-black border border-[#1F2937] p-3 text-xs space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
              Highest Win-Rate Kill Zone
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold">London / NY Overlap (13:00 - 16:00 UTC)</span>
              <span className="text-green-400 font-bold">82.1% Win Rate</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Optimal liquidity sweeps occur during London open and NY open volatility injection.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
