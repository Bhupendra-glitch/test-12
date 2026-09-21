import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Sparkles, AlertCircle, User, Lock, Wallet } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [userId, setUserId] = useState('GIG1001');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(userId.trim().toUpperCase(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (id: string) => {
    setUserId(id);
    setPassword('password123');
    setError(null);
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center p-4 bg-[#0b1220] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 p-0.5 shadow-lg shadow-emerald-500/20 mb-4">
            <div className="w-full h-full bg-[#0b1220] rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💸</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            GigCred <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">v2.0</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI Financial Health &amp; Income Twin
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-card p-6 sm:p-8 shadow-2xl border border-slate-700/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div id="login-error-message" className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>User ID</span>
                <span className="text-[10px] text-slate-400 lowercase font-normal">(GIG1001–GIG1100)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="user-id-input"
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  placeholder="e.g. GIG1001"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>🚀 Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Profiles Quick Selector */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>One-Click Demo Profiles</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-profile-1001"
                onClick={() => setDemoCredentials('GIG1001')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  userId === 'GIG1001'
                    ? 'border-emerald-500/80 bg-emerald-500/10'
                    : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="font-mono text-xs font-bold text-white">GIG1001</div>
                <div className="text-[10px] text-emerald-400">Low Risk • 1 Loan</div>
              </button>

              <button
                type="button"
                id="demo-profile-1002"
                onClick={() => setDemoCredentials('GIG1002')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  userId === 'GIG1002'
                    ? 'border-emerald-500/80 bg-emerald-500/10'
                    : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="font-mono text-xs font-bold text-white">GIG1002</div>
                <div className="text-[10px] text-amber-400">Mod Risk • 3 Loans</div>
              </button>

              <button
                type="button"
                id="demo-profile-1003"
                onClick={() => setDemoCredentials('GIG1003')}
                className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                  userId === 'GIG1003'
                    ? 'border-emerald-500/80 bg-emerald-500/10'
                    : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
                }`}
              >
                <div className="font-mono text-xs font-bold text-white">GIG1003</div>
                <div className="text-[10px] text-cyan-400">Low Risk • 4 Loans</div>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Demo Password: <code className="text-slate-200 font-mono">password123</code></span>
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                JWT Secured
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
          <span>Streamlit → React 18 + Node.js Full-Stack Architecture</span>
        </p>
      </div>
    </div>
  );
};
