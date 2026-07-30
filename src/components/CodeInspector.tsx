import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, FileCode, Download, Cpu } from 'lucide-react';

export const CodeInspector: React.FC = () => {
  const [modules, setModules] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      const data = await res.json();
      if (data.status === 'success') {
        setModules(data.modules);
      }
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleCopy = () => {
    if (modules[selectedFile]) {
      navigator.clipboard.writeText(modules[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const moduleList = [
    { name: 'main.py', label: 'Main Execution Engine', desc: 'Production event loop & orchestration' },
    { name: 'config.py', label: 'Configuration', desc: 'Central rules & risk limits' },
    { name: 'market_data.py', label: 'Market Data & MT5', desc: 'Tick quotes & auto-reconnect' },
    { name: 'trend.py', label: 'Higher Timeframe Trend', desc: 'H4/H1 swing highs & lows' },
    { name: 'liquidity.py', label: 'Liquidity Analyzer', desc: 'EQH/EQL/PDH/PDL sweeps' },
    { name: 'structure.py', label: 'Market Structure', desc: 'BOS & CHoCH confirmation' },
    { name: 'entries.py', label: 'Entry Models', desc: 'Order Block & FVG pullbacks' },
    { name: 'risk.py', label: 'Risk Manager', desc: '1% sizing & drawdown circuit breakers' },
    { name: 'order_manager.py', label: 'Order Manager', desc: 'MT5 order placement, modification & cancellation' },
    { name: 'trade_manager.py', label: 'Trade Manager', desc: 'TP1 (2R), TP2 & breakeven SL' },
    { name: 'journal.py', label: 'Trade Journal', desc: 'Automated JSON/CSV trade logger' },
    { name: 'backtester.py', label: 'Backtester Engine', desc: 'Multi-year Model A/B/C comparison' },
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="bg-[#111113] border border-[#1F2937] rounded-none p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">MODULAR PYTHON CODEBASE INSPECTOR</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            PRODUCTION-GRADE, PEP8 COMPLIANT OBJECT-ORIENTED PYTHON SOURCE CODE FOR METATRADER 5 EXECUTION.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 bg-black hover:bg-slate-900 text-white px-4 py-2 font-mono text-xs font-bold border border-[#1F2937] transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          <span>{copied ? 'COPIED TO CLIPBOARD' : `COPY ${selectedFile.toUpperCase()}`}</span>
        </button>
      </div>

      {/* Main Layout: File Selector Sidebar + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono">
        
        {/* Module Sidebar */}
        <div className="bg-[#111113] border border-[#1F2937] p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2 mb-1 border-b border-[#1F2937]">
            BOT MODULES ({moduleList.length})
          </div>

          {moduleList.map((m) => {
            const isSelected = selectedFile === m.name;
            return (
              <button
                key={m.name}
                onClick={() => setSelectedFile(m.name)}
                className={`w-full text-left p-3 transition-all border ${
                  isSelected
                    ? 'bg-black border-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                    : 'bg-black/50 border-[#1F2937] text-slate-400 hover:bg-black hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-green-500' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs">{m.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate pl-5 font-sans">{m.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Code Content Window */}
        <div className="lg:col-span-3 bg-black border border-[#1F2937] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4 font-mono">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-white">bot/{selectedFile}</span>
            </div>
            <span className="text-[9px] uppercase font-bold text-green-500 bg-green-900/30 px-2 py-0.5 border border-green-500/30">
              PYTHON 3.10+ / MT5 API
            </span>
          </div>

          <pre className="font-mono text-xs text-green-400 overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto p-2">
            {modules[selectedFile] || '# Loading module content...'}
          </pre>
        </div>

      </div>

    </div>
  );
};
