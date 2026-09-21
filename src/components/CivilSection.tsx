import React, { useState, useEffect } from 'react';
import { UserProfile, ShapFactor, IncomeForecastPoint, MonteCarloResult, AlertItem, RoadmapPhase } from '../types';
import { api } from '../api/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowUpRight,
  CheckCircle,
  Coins,
  Repeat,
  Sparkles,
  PieChart as PieIcon,
  Activity,
  CalendarCheck
} from 'lucide-react';

interface CivilSectionProps {
  user: UserProfile;
}

export const CivilSection: React.FC<CivilSectionProps> = ({ user }) => {
  const [shapFactors, setShapFactors] = useState<ShapFactor[]>(user.shapFactors || []);
  const [forecastData, setForecastData] = useState<IncomeForecastPoint[]>([]);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>(user.alerts || []);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>(user.roadmap || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatingMonteCarlo, setSimulatingMonteCarlo] = useState<boolean>(false);
  const [volatilitySetting, setVolatilitySetting] = useState<number>(0.22);

  useEffect(() => {
    let isCurrent = true;
    async function loadCivilData() {
      setLoading(true);
      try {
        const [shapRes, forecastRes, mcRes, alertsRes, roadmapRes] = await Promise.all([
          api.getShapFactors(user.userId),
          api.getIncomeForecast(user.monthlyIncome),
          api.getMonteCarlo(user.monthlyIncome, user.monthlyEMI, volatilitySetting),
          api.getAlerts(user.userId),
          api.getRoadmap(user.userId),
        ]);
        if (isCurrent) {
          if (shapRes?.length) setShapFactors(shapRes);
          if (forecastRes?.length) setForecastData(forecastRes);
          if (mcRes) setMonteCarlo(mcRes);
          if (alertsRes?.length) setAlerts(alertsRes);
          if (roadmapRes?.length) setRoadmap(roadmapRes);
        }
      } catch (err) {
        console.error('Failed to load CIVIL metrics:', err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadCivilData();
    return () => {
      isCurrent = false;
    };
  }, [user.userId, user.monthlyIncome, user.monthlyEMI]);

  const runReSimulation = async (vol: number) => {
    setVolatilitySetting(vol);
    setSimulatingMonteCarlo(true);
    try {
      const res = await api.getMonteCarlo(user.monthlyIncome, user.monthlyEMI, vol);
      setMonteCarlo(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingMonteCarlo(false);
    }
  };

  // Score arc gauge calculation
  const scorePercent = Math.min(100, Math.max(0, ((user.cashflowScore - 300) / (900 - 300)) * 100));
  const strokeDashoffset = 251.2 - (251.2 * (scorePercent * 0.75)) / 100; // 270 deg arc

  // Formatting helper for Indian Rupee currency
  const formatInr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div id="civil-section" className="space-y-6">
      {/* Top Row: Cashflow Score Gauge + Income Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cashflow Score Display (Gauge + Tier + Confidence) */}
        <div id="cashflow-score-card" className="lg:col-span-5 glass-card p-6 border border-slate-700/60 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-white">
              <Activity className="w-4 h-4 text-emerald-400" />
              Cashflow Credit Score
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
              {user.confidence}% Model Confidence
            </span>
          </div>

          {/* SVG Circular / Arc Gauge */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-135" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="text-slate-800"
                strokeWidth="8"
                strokeDasharray="188.4"
                strokeDashoffset="0"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Active colored arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className={
                  user.scoreTier === 'Prime' ? 'text-emerald-500' :
                  user.scoreTier === 'Near-Prime' ? 'text-amber-500' :
                  'text-rose-500'
                }
                strokeWidth="8"
                strokeDasharray="188.4"
                strokeDashoffset={188.4 - (188.4 * scorePercent) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>

            {/* Centered Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                {user.cashflowScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">out of 900</span>
              <div className="mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  user.scoreTier === 'Prime' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  user.scoreTier === 'Near-Prime' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {user.scoreTier} Tier
                </span>
              </div>
            </div>
          </div>

          {/* Underwriting Indicators breakdown */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800/80 text-left">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Cashflow Health</div>
              <div className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                {Math.min(98, Math.round((user.monthlySurplus / Math.max(1, user.monthlyIncome)) * 100 + 45))}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Debt Burden</div>
              <div className="font-mono text-xs font-bold text-blue-400 mt-0.5">
                {100 - user.foir}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Stability</div>
              <div className="font-mono text-xs font-bold text-amber-400 mt-0.5">
                {user.incomeStability}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">UPI Regularity</div>
              <div className="font-mono text-xs font-bold text-purple-400 mt-0.5">
                {user.bounceRate < 2 ? 'Pristine' : 'Moderate'}
              </div>
            </div>
          </div>
        </div>

        {/* Income Metrics Cards */}
        <div id="income-metrics-grid" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Income */}
          <div className="glass-card p-5 border border-slate-700/60 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Monthly Income</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {formatInr(user.monthlyIncome)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Daily UPI Avg:</span>
                <span className="text-emerald-400 font-mono font-medium">₹{user.dailyAverageUpi.toLocaleString('en-IN')}/day</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
              Verified through {user.platform} earnings &amp; QR deposits
            </div>
          </div>

          {/* Monthly Expense */}
          <div className="glass-card p-5 border border-slate-700/60 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Living Expense</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PieIcon className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-200 font-mono">
                {formatInr(user.monthlyExpense)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Burn Rate:</span>
                <span className="text-blue-400 font-mono font-medium">
                  {Math.round((user.monthlyExpense / user.monthlyIncome) * 100)}% of income
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
              Fuel, vehicle maintenance, groceries &amp; essentials
            </div>
          </div>

          {/* Monthly Surplus */}
          <div className="glass-card p-5 border border-slate-700/60 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Free Cash Surplus</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className={`text-2xl font-extrabold font-mono ${user.monthlySurplus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatInr(user.monthlySurplus)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>After All EMIs:</span>
                <span className="font-mono text-slate-300">₹{user.monthlyEMI.toLocaleString('en-IN')}/mo debt</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
              Uncommitted buffer available for emergency liquidity
            </div>
          </div>

          {/* Income Stability & Longevity */}
          <div className="glass-card p-5 border border-slate-700/60 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Stability Index</span>
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-300 font-mono">
                {user.incomeStability}/100
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Platform Tenure:</span>
                <span className="text-purple-400 font-mono font-medium">{user.activeMonthsOnPlatform} months</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
              Low mandate bounce rate ({user.bounceRate}% returns)
            </div>
          </div>
        </div>
      </div>

      {/* SHAP Feature Attribution Chart */}
      <div id="shap-feature-attribution" className="glass-card p-6 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Explainable AI: SHAP Feature Attribution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Machine learning explainability: exact positive (+) and negative (-) drivers of your cashflow credit score.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Positive Impact
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Negative Impact
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={shapFactors}
              margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" domain={[-60, 60]} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v} pts`} />
              <YAxis
                type="category"
                dataKey="factor"
                stroke="#94a3b8"
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${Number(val) > 0 ? '+' : ''}${val} Points`, 'Score Impact']}
              />
              <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
                {shapFactors.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.impact >= 0 ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Explainability takeaway cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
            <span className="font-bold text-emerald-400">Top Strengths:</span> Consistent daily UPI transactions and {user.activeMonthsOnPlatform} months active verified tenure on {user.platform} anchor your score in prime standing.
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-slate-300">
            <span className="font-bold text-red-400">Areas to Improve:</span> High debt-to-income commitment ({user.foir}%) and high-rate unsecured credit pull down your score by up to 50 points.
          </div>
        </div>
      </div>

      {/* Income Forecast (90 Days P10 / P50 / P90 Bands) */}
      <div id="income-forecast-container" className="glass-card p-6 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>90-Day Stochastic Income Forecast (P10 / P50 / P90 Bands)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Projected 3-day aggregate earnings incorporating gig seasonality, festival shifts, and weather volatility.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-0.5 bg-red-400"></span> P10 (Pessimistic)
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2.5 h-1 bg-emerald-400"></span> P50 (Expected)
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2.5 h-0.5 bg-blue-400"></span> P90 (Optimistic)
            </span>
          </div>
        </div>

        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => [
                  `₹${Number(val).toLocaleString('en-IN')}`,
                  name === 'p50' ? 'P50 Expected' : name === 'p10' ? 'P10 Floor' : 'P90 Ceiling',
                ]}
              />
              <Area type="monotone" dataKey="p90" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#forecastBand)" />
              <Area type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2.5} fillOpacity={0} />
              <Area type="monotone" dataKey="p10" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monte Carlo Simulation & Daily Micro-Repayments */}
      <div id="monte-carlo-section" className="glass-card p-6 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Repeat className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">
                Monte Carlo Simulation (1,000 Stochastic Paths)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulating 90-day cashflow trajectories under random platform shocks and fuel surges.
            </p>
          </div>

          {/* Volatility Setting Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="px-2 text-slate-400">Volatility:</span>
            {[
              { label: 'Low (15%)', val: 0.15 },
              { label: 'Base (22%)', val: 0.22 },
              { label: 'Stress (35%)', val: 0.35 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => runReSimulation(preset.val)}
                className={`px-2.5 py-1 rounded-lg transition font-mono ${
                  volatilitySetting === preset.val
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {monteCarlo && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Histogram of 1000 runs */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>90-Day Cumulative Gross Earnings Distribution</span>
                <span className="font-mono text-purple-400">N=1,000 Paths</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monteCarlo.histogram} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val} simulations (${Math.round((val / 1000) * 100)}%)`, 'Frequency']}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 5 cols: Default Probability & Daily Micro-Repayment Recommendation */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Default Probability</div>
                  <div className={`text-2xl font-extrabold font-mono mt-1 ${monteCarlo.defaultProbability > 10 ? 'text-red-400' : monteCarlo.defaultProbability > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {monteCarlo.defaultProbability}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Risk of monthly EMI deficit
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Median 90D Income</div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    ₹{Math.round(monteCarlo.medianIncome90Days / 1000)}k
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Worst case: ₹{Math.round(monteCarlo.worstCaseIncome90Days / 1000)}k
                  </div>
                </div>
              </div>

              {/* Daily Micro-Repayment Highlight Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 to-blue-500/15 border border-emerald-500/30">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4" />
                    Recommended Daily Micro-Repayment
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Zero-Stress
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    ₹{monteCarlo.recommendedDailyMicroRepayment}
                  </span>
                  <span className="text-xs text-slate-300">/ working day (26 days/mo)</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Instead of paying a heavy ₹{user.monthlyEMI.toLocaleString('en-IN')} lump sum on the 5th, auto-sweep ₹{monteCarlo.recommendedDailyMicroRepayment}/day from your daily UPI aggregator settlement.
                </p>
              </div>

              <div className="text-xs text-slate-400 italic">
                {monteCarlo.insight}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column: Early-Warning Alerts & Credit-Building Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Early-Warning Alerts */}
        <div id="civil-alerts-container" className="glass-card p-6 border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>Early-Warning Financial Alerts</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {alerts.length} Active Flags
            </span>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                }`}
              >
                {alert.severity === 'critical' ? (
                  <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                ) : alert.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">
                    {alert.title}
                  </div>
                  <div className="text-xs mt-1 leading-relaxed opacity-90">
                    {alert.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit-Building Roadmap */}
        <div id="credit-roadmap-container" className="glass-card p-6 border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Credit-Building Roadmap to Prime</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              3 Phases
            </span>
          </div>

          <div className="space-y-4">
            {roadmap.map((phase, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    {phase.phase}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono font-semibold">
                    {phase.metric}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {phase.target}
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {phase.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
