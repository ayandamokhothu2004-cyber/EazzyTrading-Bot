import React, { useState, useEffect } from 'react';
import { Shield, Check, Server, Lock, User, AlertCircle, Cpu, Wifi, X } from 'lucide-react';
import { BrokerConfig } from '../types';

interface BrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBroker?: BrokerConfig;
  onConnected?: () => void;
}

interface PresetBroker {
  id: string;
  name: string;
  defaultServer: string;
  servers: string[];
}

const PRESET_BROKERS: PresetBroker[] = [
  {
    id: 'justmarkets',
    name: 'JustMarkets',
    defaultServer: 'JustMarkets-Demo3',
    servers: ['JustMarkets-Demo3', 'JustMarkets-Live', 'JustMarkets-Live2', 'JustMarkets-Demo', 'JustMarkets-Demo2']
  },
  {
    id: 'xm',
    name: 'XM Global',
    defaultServer: 'XMGlobal-Real 3',
    servers: ['XMGlobal-Real 3', 'XMGlobal-Real 2', 'XMGlobal-Real 1', 'XMGlobal-Demo 1']
  },
  {
    id: 'exness',
    name: 'Exness',
    defaultServer: 'Exness-Real10',
    servers: ['Exness-Real10', 'Exness-Real11', 'Exness-Real1', 'Exness-Trial1', 'Exness-Trial2']
  },
  {
    id: 'icmarkets',
    name: 'IC Markets',
    defaultServer: 'ICMarkets-Live01',
    servers: ['ICMarkets-Live01', 'ICMarkets-Live02', 'ICMarkets-Demo01']
  },
  {
    id: 'pepperstone',
    name: 'Pepperstone',
    defaultServer: 'Pepperstone-Live01',
    servers: ['Pepperstone-Live01', 'Pepperstone-Live02', 'Pepperstone-Demo01']
  },
  {
    id: 'deriv',
    name: 'Deriv (Financial/SVG)',
    defaultServer: 'Deriv-Server',
    servers: ['Deriv-Server', 'Deriv-Server-02', 'Deriv-Demo']
  },
  {
    id: 'hfm',
    name: 'HFM (HF Markets)',
    defaultServer: 'HFMarketsSA-Live',
    servers: ['HFMarketsSA-Live', 'HFMarkets-Demo']
  },
  {
    id: 'fbs',
    name: 'FBS Real / Demo',
    defaultServer: 'FBS-Real-1',
    servers: ['FBS-Real-1', 'FBS-[#01] Demo']
  },
  {
    id: 'octafx',
    name: 'OctaFX',
    defaultServer: 'OctaFX-Real',
    servers: ['OctaFX-Real', 'OctaFX-Demo']
  },
  {
    id: 'vantage',
    name: 'Vantage Markets',
    defaultServer: 'VantageFX-Live',
    servers: ['VantageFX-Live', 'VantageFX-Demo']
  },
  {
    id: 'tickmill',
    name: 'Tickmill',
    defaultServer: 'Tickmill-Live',
    servers: ['Tickmill-Live', 'Tickmill-Demo']
  },
  {
    id: 'avatrade',
    name: 'AvaTrade',
    defaultServer: 'Ava-Real1',
    servers: ['Ava-Real1', 'Ava-Demo']
  },
  {
    id: 'custom',
    name: 'Custom MT5 Broker',
    defaultServer: 'Custom-MT5-Live',
    servers: ['Custom-MT5-Live']
  }
];

export const BrokerModal: React.FC<BrokerModalProps> = ({ isOpen, onClose, activeBroker, onConnected }) => {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(activeBroker?.id || 'justmarkets');
  const [server, setServer] = useState<string>(activeBroker?.server || 'JustMarkets-Demo3');
  const [customServer, setCustomServer] = useState<string>('');
  const [loginId, setLoginId] = useState<string>(activeBroker?.loginId || '1200280297');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [isDemo, setIsDemo] = useState<boolean>(activeBroker?.isDemo ?? true);
  const [currency, setCurrency] = useState<string>(activeBroker?.currency || 'ZAR');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentBroker = PRESET_BROKERS.find(b => b.id === selectedBrokerId) || PRESET_BROKERS[0];

  useEffect(() => {
    if (currentBroker && selectedBrokerId !== 'custom') {
      setServer(currentBroker.defaultServer);
    }
  }, [selectedBrokerId]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const finalServer = selectedBrokerId === 'custom' ? customServer || server : server;

    try {
      const res = await fetch('/api/broker/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: selectedBrokerId,
          name: currentBroker.name,
          server: finalServer,
          loginId,
          password,
          isDemo,
          currency
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setMessage({ type: 'success', text: `Successfully connected to ${currentBroker.name} (${finalServer})!` });
        if (onConnected) onConnected();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to establish MT5 broker bridge.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network connection error during broker authentication.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#111113] border border-[#1F2937] max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5 border-b border-[#1F2937] pb-4">
          <div className="p-2.5 bg-green-900/20 border border-green-500/30 text-green-500">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              MT5 Live Broker Integration
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Connect Python Engine directly to XM, JustMarkets, Exness, or Deriv
            </p>
          </div>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          {/* Select Broker Preset */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-2">
              Select Broker Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_BROKERS.map((b) => {
                const isSelected = selectedBrokerId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBrokerId(b.id)}
                    className={`p-2.5 text-left font-mono text-xs border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-green-950/40 border-green-500 text-white font-bold'
                        : 'bg-black/60 border-[#1F2937] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {isSelected && (
                      <span className="text-[9px] text-green-400 flex items-center mt-1">
                        <Check className="w-3 h-3 mr-0.5" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broker Server Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                MT5 Server Host
              </label>
              {selectedBrokerId === 'custom' ? (
                <input
                  type="text"
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                  placeholder="e.g. MetaQuotes-Demo"
                  required
                  className="w-full bg-black border border-[#1F2937] text-white font-mono text-xs px-3 py-2 outline-none focus:border-green-500"
                />
              ) : (
                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full bg-black border border-[#1F2937] text-white font-mono text-xs px-3 py-2 outline-none focus:border-green-500"
                >
                  {currentBroker.servers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Account Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-black border border-[#1F2937] text-white font-mono text-xs px-3 py-2 outline-none focus:border-green-500"
              >
                <option value="ZAR">ZAR (South African Rand - R)</option>
                <option value="USD">USD (US Dollar - $)</option>
                <option value="EUR">EUR (Euro - €)</option>
                <option value="GBP">GBP (Pound - £)</option>
              </select>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center">
                <User className="w-3 h-3 mr-1 text-slate-500" /> MT5 Login ID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. 9401294"
                required
                className="w-full bg-black border border-[#1F2937] text-white font-mono text-xs px-3 py-2 outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1 flex items-center">
                <Lock className="w-3 h-3 mr-1 text-slate-500" /> Password / Investor Pass
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-black border border-[#1F2937] text-white font-mono text-xs px-3 py-2 outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Account Mode Switch */}
          <div className="flex items-center justify-between p-3 bg-black border border-[#1F2937]">
            <span className="text-xs font-mono text-slate-300">Account Environment</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsDemo(false)}
                className={`px-3 py-1 text-xs font-mono font-bold border transition-colors ${
                  !isDemo
                    ? 'bg-green-500 text-black border-green-500'
                    : 'bg-black text-slate-500 border-[#1F2937]'
                }`}
              >
                LIVE REAL
              </button>
              <button
                type="button"
                onClick={() => setIsDemo(true)}
                className={`px-3 py-1 text-xs font-mono font-bold border transition-colors ${
                  isDemo
                    ? 'bg-blue-500 text-black border-blue-500'
                    : 'bg-black text-slate-500 border-[#1F2937]'
                }`}
              >
                DEMO
              </button>
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3 text-xs font-mono border flex items-center ${
                message.type === 'success'
                  ? 'bg-green-950/40 text-green-400 border-green-500/40'
                  : 'bg-red-950/40 text-red-400 border-red-500/40'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-mono rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold font-mono uppercase tracking-wider rounded transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Wifi className="w-4 h-4 animate-pulse" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>CONNECT TO BROKER</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
