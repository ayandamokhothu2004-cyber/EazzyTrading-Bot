import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';
import { JournalTrade } from '../types';

export const TradeJournalView: React.FC = () => {
  const [trades, setTrades] = useState<JournalTrade[]>([]);
  const [symbolFilter, setSymbolFilter] = useState<string>('ALL');

  const fetchJournal = async () => {
    try {
      const res = await fetch('/api/journal');
      const data = await res.json();
      if (data.status === 'success') {
        setTrades(data.data);
      }
    } catch (err) {
      console.error('Failed to load journal:', err);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, []);

  const filteredTrades = trades.filter((t) =>
    symbolFilter === 'ALL' ? true : t.symbol === symbolFilter
  );

  const totalPL = filteredTrades.reduce((acc, t) => acc + t.profit_loss, 0);
  const winCount = filteredTrades.filter((t) => t.profit_loss > 0).length;
  const winRate = filteredTrades.length > 0 ? ((winCount / filteredTrades.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-[#111113] border border-[#1F2937] rounded-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">AUTOMATED LOCAL TRADE JOURNAL</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            EVERY EXECUTED TRADE IS AUTOMATICALLY LOGGED WITH EXACT SETUP REASONS, RISK, AND ACHIEVED R-MULTIPLES.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="bg-black text-white text-xs font-mono font-semibold px-3 py-2 border border-[#1F2937] outline-none focus:border-green-500"
          >
            <option value="ALL">All Pairs (EURUSD & NAS100)</option>
            <option value="EURUSD">EURUSD Only</option>
            <option value="NAS100">NAS100 Only</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase">LOGGED EXECUTIONS</span>
          <div className="text-2xl font-bold text-white mt-1">{filteredTrades.length} TRADES</div>
        </div>
        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase">JOURNAL WIN RATE</span>
          <div className="text-2xl font-bold text-green-500 mt-1">{winRate}%</div>
        </div>
        <div className="bg-[#111113] border border-[#1F2937] p-4">
          <span className="text-slate-500 text-[10px] uppercase">NET REALIZED P/L</span>
          <div className={`text-2xl font-bold mt-1 ${totalPL >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Journal Table */}
      <div className="bg-[#111113] border border-[#1F2937] p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0A0A0B] border-b border-[#1F2937] text-slate-500 font-mono text-[10px] uppercase tracking-widest">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Pair</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Entry</th>
                <th className="py-2.5 px-3">SL</th>
                <th className="py-2.5 px-3">TP</th>
                <th className="py-2.5 px-3">Exit</th>
                <th className="py-2.5 px-3">Lot Size</th>
                <th className="py-2.5 px-3">Risk %</th>
                <th className="py-2.5 px-3">Profit / Loss</th>
                <th className="py-2.5 px-3">R-Multiple</th>
                <th className="py-2.5 px-3">Reason For Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50 font-mono">
              {filteredTrades.map((t) => (
                <tr key={t.trade_id} className="hover:bg-[#1F2937]/30 transition-colors">
                  <td className="py-3 px-3 text-slate-500">
                    <div>{t.date}</div>
                    <div className="text-[9px] text-slate-600">{t.time}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-white">{t.symbol}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${t.direction === 'BUY' ? 'bg-green-900/30 text-green-500 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3">{t.entry_price.toFixed(5)}</td>
                  <td className="py-3 px-3 text-red-400">{t.sl_price.toFixed(5)}</td>
                  <td className="py-3 px-3 text-green-500">{t.tp_price.toFixed(5)}</td>
                  <td className="py-3 px-3 font-bold text-white">{t.exit_price.toFixed(5)}</td>
                  <td className="py-3 px-3">{t.lot_size}</td>
                  <td className="py-3 px-3">{t.risk_pct}%</td>
                  <td className={`py-3 px-3 font-bold ${t.profit_loss >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {t.profit_loss >= 0 ? '+' : ''}${t.profit_loss.toFixed(2)}
                  </td>
                  <td className={`py-3 px-3 font-bold ${t.rr_achieved > 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {t.rr_achieved > 0 ? '+' : ''}{t.rr_achieved}R
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                    {t.reason_for_entry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
