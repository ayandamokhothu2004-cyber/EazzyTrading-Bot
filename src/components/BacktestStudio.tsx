import React, { useState, useEffect } from 'react';
import { Layers, Play, Award, TrendingUp, ShieldAlert, BarChart3, RefreshCw, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { BacktestResults, ModelComparisonResult } from '../types';

export const BacktestStudio: React.FC = () => {
  const [symbol, setSymbol] = useState<'EURUSD' | 'NAS100'>('EURUSD');
  const [years, setYears] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [selectedModel, setSelectedModel] = useState<'MODEL_A' | 'MODEL_B' | 'MODEL_C'>('MODEL_A');

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, years, riskPct: 1.0, activeModel: 'ALL' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResults(data.data);
      }
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, [symbol, years]);

  const activeModelData: ModelComparisonResult | undefined = results?.modelsComparison.find(
    (m) => m.modelKey === selectedModel
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header & Controls */}
      <div className="bg-[#111113] border border-[#1F2937] rounded-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">QUANTITATIVE BACKTESTING & MODEL COMPARISON</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            EVALUATE ENTRY MODELS A, B, AND C ACROSS HISTORICAL DATA UNDER FIXED 1.0% RISK RULES.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Symbol Select */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value as 'EURUSD' | 'NAS100')}
            className="bg-black text-white text-xs font-mono font-semibold px-3 py-2 border border-[#1F2937] outline-none focus:border-green-500"
          >
            <option value="EURUSD">EURUSD (Forex Major)</option>
            <option value="NAS100">NAS100 (US Tech Index)</option>
          </select>

          {/* Duration Select */}
          <select
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="bg-black text-white text-xs font-mono font-semibold px-3 py-2 border border-[#1F2937] outline-none focus:border-green-500"
          >
            <option value={1}>1 Year Data</option>
            <option value={2}>2 Years Data</option>
            <option value={3}>3 Years Data</option>
          </select>

          {/* Run Backtest Button */}
          <button
            onClick={runBacktest}
            disabled={loading}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded-none text-xs font-mono font-bold transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'SIMULATING...' : 'RUN ANALYSIS'}</span>
          </button>
        </div>
      </div>

      {/* Entry Models Comparative Cards */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.modelsComparison.map((model) => {
            const isSelected = selectedModel === model.modelKey;
            return (
              <div
                key={model.modelKey}
                onClick={() => setSelectedModel(model.modelKey)}
                className={`cursor-pointer transition-all p-5 border ${
                  isSelected
                    ? 'bg-[#111113] border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : 'bg-[#111113] border-[#1F2937] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3 font-mono">
                  <span className={`text-[10px] font-bold px-2 py-0.5 ${isSelected ? 'bg-green-500 text-black' : 'bg-black text-slate-400 border border-[#1F2937]'}`}>
                    {model.modelKey}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">1% RISK / TRADE</span>
                </div>

                <h3 className="font-bold text-white text-sm mb-3 font-mono">{model.modelName}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-black p-2 border border-[#1F2937]">
                    <span className="text-slate-500 text-[9px] uppercase">Win Rate</span>
                    <div className="font-bold text-green-500 text-base">{model.winRate}%</div>
                  </div>
                  <div className="bg-black p-2 border border-[#1F2937]">
                    <span className="text-slate-500 text-[9px] uppercase">Profit Factor</span>
                    <div className="font-bold text-white text-base">{model.profitFactor}</div>
                  </div>
                  <div className="bg-black p-2 border border-[#1F2937]">
                    <span className="text-slate-500 text-[9px] uppercase">Net Return</span>
                    <div className="font-bold text-green-500 text-base">+{model.returnPct}%</div>
                  </div>
                  <div className="bg-black p-2 border border-[#1F2937]">
                    <span className="text-slate-500 text-[9px] uppercase">Max Drawdown</span>
                    <div className="font-bold text-orange-400 text-base">{model.maxDrawdownPct}%</div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] font-mono text-slate-500 flex justify-between border-t border-[#1F2937] pt-2">
                  <span>EXPECTANCY: <strong className="text-white">${model.expectancy}</strong></span>
                  <span>AVG R: <strong className="text-green-500">{model.avgRR}R</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Model Detailed Analytics & Equity Curve */}
      {activeModelData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Equity Growth Curve Chart */}
          <div className="lg:col-span-2 bg-[#111113] border border-[#1F2937] p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[#1F2937] pb-3">
              <div>
                <h3 className="font-bold text-white text-xs uppercase font-mono tracking-widest">EQUITY GROWTH CURVE</h3>
                <p className="text-[11px] font-mono text-slate-500">{activeModelData.modelName} ({results?.period})</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-green-500 bg-green-900/30 px-2.5 py-1 border border-green-500/30">
                START: $100,000 → END: ${(100000 + activeModelData.netProfit).toLocaleString()}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeModelData.equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="bar" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#1F2937', color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#64748b' }}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Returns Breakdown */}
          <div className="bg-[#111113] border border-[#1F2937] p-5">
            <h3 className="font-bold text-white text-xs uppercase font-mono tracking-widest mb-1">MONTHLY RETURNS MATRIX</h3>
            <p className="text-[11px] font-mono text-slate-500 mb-4">MONTHLY PERFORMANCE (%)</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeModelData.monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#1F2937', color: '#cbd5e1', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="returnPct" fill="#22c55e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Quantitative Summary Metrics Grid */}
      {activeModelData && (
        <div className="bg-[#111113] border border-[#1F2937] p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center font-mono">
          <div className="bg-black p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">TOTAL TRADES</span>
            <div className="text-base font-bold text-white mt-1">{activeModelData.totalTrades}</div>
          </div>
          <div className="bg-black p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">EXPECTANCY</span>
            <div className="text-base font-bold text-green-500 mt-1">${activeModelData.expectancy}</div>
          </div>
          <div className="bg-black p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">MAX WIN STREAK</span>
            <div className="text-base font-bold text-green-500 mt-1">{activeModelData.longestWinStreak} TRADES</div>
          </div>
          <div className="bg-[#0A0A0B] p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">MAX LOSS STREAK</span>
            <div className="text-base font-bold text-red-400 mt-1">{activeModelData.longestLossStreak} TRADES</div>
          </div>
          <div className="bg-black p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">AVERAGE TRADE</span>
            <div className="text-base font-bold text-white mt-1">
              ${activeModelData.averageTrade ?? Math.round(activeModelData.netProfit / activeModelData.totalTrades)}
            </div>
          </div>
          <div className="bg-black p-3 border border-[#1F2937]">
            <span className="text-[10px] text-slate-500 uppercase">TARGET R-MULTIPLE</span>
            <div className="text-base font-bold text-green-500 mt-1">2.0R (TP1)</div>
          </div>
        </div>
      )}

    </div>
  );
};
