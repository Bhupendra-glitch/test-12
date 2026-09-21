import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmiSection } from '../components/EmiSection';
import { CivilSection } from '../components/CivilSection';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { LogOut, Bot, Sparkles, Building2, BarChart3, User, ChevronDown } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout, updateUserLoans, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'emi' | 'civil'>('emi');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);

  if (!user) return null;

  const handleQuickSwitch = async (targetUserId: string) => {
    setIsSwitchingUser(true);
    try {
      await login(targetUserId, 'password123');
    } catch (e) {
      console.error('User switch error:', e);
    } finally {
      setIsSwitchingUser(false);
    }
  };

  return (
    <div id="dashboard-screen" className="min-h-screen bg-[#0b1220] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1220]/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0b1220] rounded-[10px] flex items-center justify-center">
                <span className="text-lg">💸</span>
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>GigCred</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                AI Financial Health &amp; Income Twin
              </div>
            </div>
          </div>

          {/* Center/Right: User Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Demo Switcher */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Demo:</span>
              {(['GIG1001', 'GIG1002', 'GIG1003'] as const).map((uid) => (
                <button
                  key={uid}
                  type="button"
                  onClick={() => handleQuickSwitch(uid)}
                  disabled={isSwitchingUser}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                    user.userId === uid
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {uid}
                </button>
              ))}
            </div>

            {/* Welcome User Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                {user.userId.replace('GIG', '')}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-semibold text-white font-mono">{user.userId}</div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {user.name} ({user.occupation})
                </div>
              </div>
            </div>

            {/* AI Assistant Trigger Button */}
            <button
              id="ai-assistant-toggle"
              type="button"
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Advice</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* Logout Button */}
            <button
              id="logout-button"
              type="button"
              onClick={logout}
              title="Logout from GigCred"
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section Tabs Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
            <button
              id="tab-emi-section"
              type="button"
              onClick={() => setActiveTab('emi')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'emi'
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏦 EMI Section</span>
            </button>

            <button
              id="tab-civil-section"
              type="button"
              onClick={() => setActiveTab('civil')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'civil'
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>📊 CIVIL Section</span>
            </button>
          </div>

          {/* Quick Context Strip */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {user.platform}
            </span>
            <span className="text-slate-600">•</span>
            <span>Net Monthly: <strong className="text-white font-mono">₹{user.monthlyIncome.toLocaleString('en-IN')}</strong></span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Score: <strong className="text-emerald-400 font-mono">{user.cashflowScore}</strong></span>
          </div>
        </div>

        {/* Tab View Render */}
        {activeTab === 'emi' ? (
          <EmiSection user={user} onUpdateLoans={updateUserLoans} />
        ) : (
          <CivilSection user={user} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            GigCred v2.0 (React + Node.js Edition) • Prepared by Juhi Rathod
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Understand, predict, and simulate your money before you borrow.
          </div>
        </div>
      </footer>

      {/* Gemini AI Assistant Drawer */}
      <AiAssistantModal
        user={user}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
};
