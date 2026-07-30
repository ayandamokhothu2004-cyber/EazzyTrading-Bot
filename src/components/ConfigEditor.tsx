import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, Clock, Sliders, AlertCircle } from 'lucide-react';

export const ConfigEditor: React.FC = () => {
  const [configCode, setConfigCode] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for quick rule customization
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [maxDailyTrades, setMaxDailyTrades] = useState<number>(2);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(2);
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState<number>(2.0);
  const [activeModel, setActiveModel] = useState<string>('MODEL_A');
  const [obEnabled, setObEnabled] = useState<boolean>(true);
  const [fvgEnabled, setFvgEnabled] = useState<boolean>(true);
  const [eurusdSpread, setEurusdSpread] = useState<number>(1.5);
  const [nas100Spread, setNas100Spread] = useState<number>(25.0);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.status === 'success') {
        setConfigCode(data.code);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: configCode })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title */}
      <div className="bg-[#111113] border border-[#1F2937] rounded-none p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">RULE PARAMETERS & RISK CONFIGURATION</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            CENTRALLY MANAGE ACCOUNT RISK RULES, SESSION FILTERS, STOP LOSS TARGETS, AND PYTHON CONFIG.PY.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black px-4 py-2 text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)]"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>SAVED TO BOT</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Risk & Drawdown Management */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 space-y-4">
          <div className="flex items-center space-x-2 text-green-500 border-b border-[#1F2937] pb-2 font-mono">
            <Shield className="w-4 h-4" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">RISK & CIRCUIT BREAKERS</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-500 block mb-1 uppercase text-[10px]">Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1 uppercase text-[10px]">Max Daily Trades</label>
              <input
                type="number"
                value={maxDailyTrades}
                onChange={(e) => setMaxDailyTrades(Number(e.target.value))}
                className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1 uppercase text-[10px]">Consecutive Loss Lock (Trades)</label>
              <input
                type="number"
                value={maxConsecutiveLosses}
                onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))}
                className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-slate-500 block mb-1 uppercase text-[10px]">Max Daily Drawdown Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={maxDailyDrawdown}
                onChange={(e) => setMaxDailyDrawdown(Number(e.target.value))}
                className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Strategy Execution Model */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400 border-b border-[#1F2937] pb-2 font-mono">
            <Sliders className="w-4 h-4" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">STRATEGY & ENTRY FILTERS</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-500 block mb-1 uppercase text-[10px]">Active Entry Model</label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none focus:border-green-500 font-semibold"
              >
                <option value="MODEL_A">Model A: Sweep + BOS + Pullback</option>
                <option value="MODEL_B">Model B: Supply/Demand + Rejection</option>
                <option value="MODEL_C">Model C: Sweep + CHoCH + FVG Fill</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black border border-[#1F2937]">
              <span className="text-slate-400 text-[11px]">Order Block (OB) Requirement</span>
              <input
                type="checkbox"
                checked={obEnabled}
                onChange={(e) => setObEnabled(e.target.checked)}
                className="w-4 h-4 accent-green-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black border border-[#1F2937]">
              <span className="text-slate-400 text-[11px]">Fair Value Gap (FVG) Requirement</span>
              <input
                type="checkbox"
                checked={fvgEnabled}
                onChange={(e) => setFvgEnabled(e.target.checked)}
                className="w-4 h-4 accent-green-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-slate-500 block mb-1 uppercase text-[9px]">EURUSD Spread (pips)</label>
                <input
                  type="number"
                  step="0.1"
                  value={eurusdSpread}
                  onChange={(e) => setEurusdSpread(Number(e.target.value))}
                  className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1 uppercase text-[9px]">NAS100 Spread (pts)</label>
                <input
                  type="number"
                  step="1"
                  value={nas100Spread}
                  onChange={(e) => setNas100Spread(Number(e.target.value))}
                  className="w-full bg-black border border-[#1F2937] text-white px-3 py-2 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions & Time Filters */}
        <div className="bg-[#111113] border border-[#1F2937] p-5 space-y-4">
          <div className="flex items-center space-x-2 text-orange-500 border-b border-[#1F2937] pb-2 font-mono">
            <Clock className="w-4 h-4" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">TRADING SESSIONS & NEWS</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-black border border-[#1F2937]">
              <div className="font-bold text-white mb-1">London Session</div>
              <div className="text-slate-500 text-[11px]">08:00 UTC - 16:00 UTC</div>
            </div>

            <div className="p-3 bg-black border border-[#1F2937]">
              <div className="font-bold text-white mb-1">New York Session</div>
              <div className="text-slate-500 text-[11px]">13:00 UTC - 21:00 UTC</div>
            </div>

            <div className="p-3 bg-orange-900/20 border border-orange-500/30 text-orange-400 text-[10px] leading-relaxed">
              <strong>Friday Cutoff:</strong> Bot automatically halts execution at 18:00 UTC on Fridays to prevent weekend gaps.
            </div>
          </div>
        </div>

      </div>

      {/* Raw Python config.py Source Editor */}
      <div className="bg-[#111113] border border-[#1F2937] p-5">
        <div className="flex items-center justify-between mb-3 border-b border-[#1F2937] pb-3 font-mono">
          <h3 className="font-bold text-white text-xs uppercase tracking-widest">PYTHON SOURCE CODE (bot/config.py)</h3>
          <span className="text-[10px] text-slate-500 uppercase">PEP8 COMPLIANT CONFIGURATION</span>
        </div>

        <textarea
          value={configCode}
          onChange={(e) => setConfigCode(e.target.value)}
          rows={16}
          className="w-full bg-black text-green-500 font-mono text-xs p-4 border border-[#1F2937] outline-none focus:border-green-500 leading-relaxed"
        />
      </div>

    </div>
  );
};
