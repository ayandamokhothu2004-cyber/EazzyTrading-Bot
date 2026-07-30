import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveDashboard } from './components/LiveDashboard';
import { BacktestStudio } from './components/BacktestStudio';
import { ConfigEditor } from './components/ConfigEditor';
import { CodeInspector } from './components/CodeInspector';
import { TradeJournalView } from './components/TradeJournalView';
import { BrokerModal } from './components/BrokerModal';
import { BotDashboardData } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dashboardData, setDashboardData] = useState<BotDashboardData | null>(null);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState<boolean>(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.status === 'success') {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBot = async () => {
    try {
      const res = await fetch('/api/bot/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to toggle bot:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 font-sans selection:bg-green-500 selection:text-black">
      
      {/* Top Header */}
      <Navbar
        data={dashboardData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleBot={handleToggleBot}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
      />

      {/* Main Body Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <LiveDashboard data={dashboardData} />}
        {activeTab === 'backtest' && <BacktestStudio />}
        {activeTab === 'journal' && <TradeJournalView />}
        {activeTab === 'config' && <ConfigEditor />}
        {activeTab === 'inspector' && <CodeInspector />}
      </main>

      {/* Broker Connection Modal */}
      <BrokerModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        activeBroker={dashboardData?.activeBroker}
        onConnected={fetchDashboard}
      />

    </div>
  );
}
