import React from 'react';
import { Bot, Play, Square, ShieldCheck, Activity, Terminal, Layers, BookOpen, Settings } from 'lucide-react';
import { BotDashboardData } from '../types';

interface NavbarProps {
  data: BotDashboardData | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ data, activeTab, setActiveTab, onToggleBot }) => {
  const isRunning = data?.isRunning ?? false;

  return (
    <header className="bg-[#0A0A0B] border-b border-[#1F2937] text-slate-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#111113] border border-[#1F2937] rounded-lg text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tighter uppercase text-white font-sans">
                  Institutional Quant-System
                </span>
                <span className="text-slate-500 font-mono text-xs hidden sm:inline">
                  v2.1.0-STABLE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-green-900/30 text-green-500 border border-green-500/30 rounded">
                  MT5
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 hidden sm:block">
                RULE_BASED_EXECUTION_ENGINE // EURUSD & NAS100
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#111113] p-1 rounded-lg border border-[#1F2937]">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'backtest', label: 'Backtester & Models', icon: Layers },
              { id: 'journal', label: 'Trade Journal', icon: BookOpen },
              { id: 'config', label: 'Rules & Risk Config', icon: Settings },
              { id: 'inspector', label: 'Python Code', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-green-500 text-black font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-[#1F2937]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls & Bot Execution Switch */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-5 text-[10px] font-mono tracking-widest uppercase">
              <div className="flex flex-col items-end">
                <span className="text-slate-500">Broker</span>
                <span className="text-white font-semibold">METATRADER 5</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500">Session</span>
                <span className="text-orange-500 font-semibold">{data?.activeSession || 'London Open'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500">Latency</span>
                <span className="text-green-500 font-semibold">12ms</span>
              </div>
            </div>

            <button
              onClick={onToggleBot}
              className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-mono font-bold transition-all ${
                isRunning
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  : 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE BOT</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START BOT</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex overflow-x-auto space-x-1 py-2 border-t border-[#1F2937]">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'backtest', label: 'Backtest' },
            { id: 'journal', label: 'Journal' },
            { id: 'config', label: 'Config' },
            { id: 'inspector', label: 'Python' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap ${
                activeTab === tab.id ? 'bg-green-500 text-black font-bold' : 'text-slate-400 bg-[#111113] border border-[#1F2937]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
