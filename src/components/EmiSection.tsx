import React, { useState, useEffect } from 'react';
import { UserProfile, Loan, ConsolidationResult, StressTestResult } from '../types';
import { api } from '../api/client';
import {
  DollarSign,
  TrendingDown,
  Percent,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Sliders,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface EmiSectionProps {
  user: UserProfile;
  onUpdateLoans: (updatedLoans: Loan[]) => void;
}

export const EmiSection: React.FC<EmiSectionProps> = ({ user, onUpdateLoans }) => {
  // Consolidation Slider states
  const [newRate, setNewRate] = useState<number>(13.5);
  const [newTenure, setNewTenure] = useState<number>(24);
  const [consolidationData, setConsolidationData] = useState<ConsolidationResult | null>(null);
  const [loadingConsolidation, setLoadingConsolidation] = useState<boolean>(false);

  // Stress Test states
  const [stressPrincipal, setStressPrincipal] = useState<number>(60000);
  const [stressRate, setStressRate] = useState<number>(24);
  const [stressTenure, setStressTenure] = useState<number>(12);
  const [stressFeePercent, setStressFeePercent] = useState<number>(4.0);
  const [stressPenaltyPercent, setStressPenaltyPercent] = useState<number>(36);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [loadingStress, setLoadingStress] = useState<boolean>(false);

  // Add Custom Loan state
  const [showAddLoan, setShowAddLoan] = useState<boolean>(false);
  const [newLoanName, setNewLoanName] = useState<string>('ZestMoney Gadget Loan');
  const [newLoanType, setNewLoanType] = useState<Loan['type']>('BNPL');
  const [newLoanBal, setNewLoanBal] = useState<number>(25000);
  const [newLoanRate, setNewLoanRate] = useState<number>(22.0);
  const [newLoanTenure, setNewLoanTenure] = useState<number>(12);

  // Fetch consolidation live on slider changes
  useEffect(() => {
    let isCurrent = true;
    async function runConsolidation() {
      if (!user.loans || user.loans.length === 0) return;
      setLoadingConsolidation(true);
      try {
        const result = await api.consolidateLoans(user.loans, newRate, newTenure);
        if (isCurrent) setConsolidationData(result);
      } catch (err) {
        console.error('Consolidation calculation error:', err);
      } finally {
        if (isCurrent) setLoadingConsolidation(false);
      }
    }
    runConsolidation();
    return () => {
      isCurrent = false;
    };
  }, [user.loans, newRate, newTenure]);

  // Fetch stress test
  useEffect(() => {
    let isCurrent = true;
    async function runStressTest() {
      setLoadingStress(true);
      try {
        const res = await api.stressTestLoan({
          principal: stressPrincipal,
          rate: stressRate,
          tenure: stressTenure,
          feePercent: stressFeePercent,
          penaltyPercent: stressPenaltyPercent,
          userMonthlyIncome: user.monthlyIncome,
          currentTotalEmi: user.monthlyEMI,
        });
        if (isCurrent) setStressResult(res);
      } catch (err) {
        console.error('Stress test error:', err);
      } finally {
        if (isCurrent) setLoadingStress(false);
      }
    }
    const timer = setTimeout(runStressTest, 120);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [stressPrincipal, stressRate, stressTenure, stressFeePercent, stressPenaltyPercent, user.monthlyIncome, user.monthlyEMI]);

  // KPI Calculations
  const estTotalRemainingInterest = user.loans.reduce((acc, l) => {
    const totalPayments = l.emi * l.tenure;
    return acc + Math.max(0, totalPayments - l.outstanding);
  }, 0);

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const emiCalc = await api.calculateEmi(newLoanBal, newLoanRate, newLoanTenure);
    const newLoanObj: Loan = {
      id: `LN-CUSTOM-${Date.now().toString().slice(-4)}`,
      name: newLoanName,
      type: newLoanType,
      outstanding: Number(newLoanBal),
      rate: Number(newLoanRate),
      tenure: Number(newLoanTenure),
      emi: emiCalc.emi,
    };
    const updated = [...user.loans, newLoanObj];
    onUpdateLoans(updated);
    setShowAddLoan(false);
  };

  const handleDeleteLoan = (loanId: string) => {
    const updated = user.loans.filter((l) => l.id !== loanId);
    onUpdateLoans(updated);
  };

  return (
    <div id="emi-section" className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outstanding */}
        <div id="kpi-total-outstanding" className="glass-card p-5 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight">
            ₹{user.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Across {user.loans.length} active credit facilities
          </div>
        </div>

        {/* Card 2: Monthly EMI */}
        <div id="kpi-monthly-emi" className="glass-card p-5 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly EMI</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            ₹{user.monthlyEMI.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Net Monthly Outflow</span>
            <span className="text-emerald-400 font-mono font-medium">₹{Math.round(user.monthlyEMI / 30)}/day</span>
          </div>
        </div>

        {/* Card 3: Debt-to-Income (FOIR) */}
        <div id="kpi-foir" className="glass-card p-5 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Debt-to-Income (FOIR)</span>
            <div className={`p-2 rounded-xl border ${user.foir > 50 ? 'bg-red-500/10 text-red-400 border-red-500/20' : user.foir > 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${user.foir > 50 ? 'text-red-400' : user.foir > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {user.foir}%
            </span>
            <span className="text-xs text-slate-400">of monthly income</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-400">Safe Target: &le;40%</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${user.foir > 50 ? 'bg-red-500/20 text-red-300' : user.foir > 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {user.foir > 50 ? 'High Burden' : user.foir > 40 ? 'Moderate' : 'Optimal'}
            </span>
          </div>
        </div>

        {/* Card 4: Est. Remaining Interest */}
        <div id="kpi-est-interest" className="glass-card p-5 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Remaining Interest</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-purple-300 font-mono tracking-tight">
            ₹{estTotalRemainingInterest.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Interest Cost Ratio</span>
            <span className="text-purple-400 font-mono font-medium">
              {Math.round((estTotalRemainingInterest / Math.max(1, user.totalOutstanding)) * 100)}% of principal
            </span>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div id="loans-table-container" className="glass-card p-5 lg:p-6 border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Current Loans &amp; Facilities</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {user.loans.length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed breakdown of vehicles, personal credit, cards, and BNPL lines
            </p>
          </div>
          <button
            id="add-loan-toggle-btn"
            type="button"
            onClick={() => setShowAddLoan(!showAddLoan)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddLoan ? 'Close Form' : 'Add Loan for Testing'}</span>
          </button>
        </div>

        {/* Add Loan Expandable Form */}
        {showAddLoan && (
          <form onSubmit={handleAddLoan} className="mb-5 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="block text-slate-400 mb-1">Loan Name</label>
              <input
                type="text"
                required
                value={newLoanName}
                onChange={(e) => setNewLoanName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:border-emerald-500"
                placeholder="e.g. Kissht Instant Cash"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Type</label>
              <select
                value={newLoanType}
                onChange={(e) => setNewLoanType(e.target.value as Loan['type'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-emerald-500"
              >
                <option value="Vehicle">Vehicle</option>
                <option value="BNPL">BNPL</option>
                <option value="Personal">Personal</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Micro Loan">Micro Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Outstanding (₹)</label>
              <input
                type="number"
                min="1000"
                required
                value={newLoanBal}
                onChange={(e) => setNewLoanBal(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Rate (% p.a.)</label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="50"
                required
                value={newLoanRate}
                onChange={(e) => setNewLoanRate(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-400 mb-1">Tenure (mo)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={newLoanTenure}
                  onChange={(e) => setNewLoanTenure(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition cursor-pointer shrink-0"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Loan Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Rate %</th>
                <th className="py-3 px-4 text-right">Tenure</th>
                <th className="py-3 px-4 text-right">Monthly EMI</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {user.loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No active loans found. Use &quot;Add Loan for Testing&quot; above to simulate debt!
                  </td>
                </tr>
              ) : (
                user.loans.map((loan) => {
                  const isHighRate = loan.rate > 24;
                  return (
                    <tr key={loan.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                        <span>{loan.name}</span>
                        {isHighRate && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-sans font-semibold">
                            High Rate
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          loan.type === 'Vehicle' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                          loan.type === 'BNPL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          loan.type === 'Credit Card' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          loan.type === 'Micro Loan' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {loan.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-white">
                        ₹{loan.outstanding.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isHighRate ? 'text-red-400' : 'text-slate-200'}`}>
                        {loan.rate}%
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {loan.tenure} mo
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        ₹{loan.emi.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLoan(loan.id)}
                          title="Remove loan from profile"
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Column Section: Consolidation Simulator & Loan Stress Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consolidation Simulator */}
        <div id="consolidation-simulator" className="glass-card p-5 lg:p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Consolidation Simulator</h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Simulate rolling all {user.loans.length} active loans into a single prime structured debt.
            </p>

            {/* Slider 1: New Rate (6–30%) */}
            <div className="mb-5 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-300">Proposed Consolidation Rate (% p.a.)</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{newRate}%</span>
              </div>
              <input
                id="consolidation-rate-slider"
                type="range"
                min="6"
                max="30"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>6% (Prime Bank)</span>
                <span>14% (NBFC Avg)</span>
                <span>30% (High Risk)</span>
              </div>
            </div>

            {/* Slider 2: New Tenure (6–84 months) */}
            <div className="mb-6 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-300">Consolidated Tenure (Months)</span>
                <span className="font-mono text-blue-400 font-bold text-sm">{newTenure} months ({Math.round((newTenure / 12) * 10) / 10} yrs)</span>
              </div>
              <input
                id="consolidation-tenure-slider"
                type="range"
                min="6"
                max="84"
                step="6"
                value={newTenure}
                onChange={(e) => setNewTenure(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer bg-slate-800 h-2 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>6 mo</span>
                <span>24 mo</span>
                <span>48 mo</span>
                <span>84 mo</span>
              </div>
            </div>

            {/* Live Outputs */}
            {consolidationData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">New Consolidated EMI</div>
                    <div className="text-xl font-extrabold text-white font-mono mt-1">
                      ₹{consolidationData.newEmi.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Current: ₹{consolidationData.currentTotalEmi.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Interest Delta</div>
                    <div className={`text-xl font-extrabold font-mono mt-1 ${consolidationData.interestDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {consolidationData.interestDelta >= 0 ? '+' : ''}₹{consolidationData.interestDelta.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {consolidationData.interestDelta >= 0 ? 'Total Savings' : 'Extra Interest Added'}
                    </div>
                  </div>
                </div>

                {/* Verdict Box */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  consolidationData.verdict === 'Recommended'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : consolidationData.verdict === 'Caution'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {consolidationData.verdict === 'Recommended' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  ) : consolidationData.verdict === 'Caution' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span>Verdict: {consolidationData.verdict}</span>
                      {consolidationData.monthlyCashflowRelief > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                          +₹{consolidationData.monthlyCashflowRelief.toLocaleString('en-IN')}/mo cash in hand
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-1 leading-relaxed opacity-90">
                      {consolidationData.verdictMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loan Stress Test & Predatory Loan Detector */}
        <div id="stress-test-section" className="glass-card p-5 lg:p-6 border border-slate-700/60 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Loan Stress Test &amp; Predatory Detector</h3>
              </div>
              {stressResult && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  stressResult.riskLevel.includes('Low')
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : stressResult.riskLevel.includes('Moderate')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {stressResult.riskLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Test any new loan offer before signing. Checks hidden fees, APR surge, and repayment shocks.
            </p>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Principal (₹)</label>
                <input
                  id="stress-principal-input"
                  type="number"
                  step="5000"
                  value={stressPrincipal}
                  onChange={(e) => setStressPrincipal(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nominal Rate (%)</label>
                <input
                  id="stress-rate-input"
                  type="number"
                  step="1"
                  value={stressRate}
                  onChange={(e) => setStressRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tenure (mo)</label>
                <input
                  id="stress-tenure-input"
                  type="number"
                  value={stressTenure}
                  onChange={(e) => setStressTenure(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Processing Fee (%)</label>
                <input
                  id="stress-fee-input"
                  type="number"
                  step="0.5"
                  value={stressFeePercent}
                  onChange={(e) => setStressFeePercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Late Penalty (%)</label>
                <input
                  id="stress-penalty-input"
                  type="number"
                  step="2"
                  value={stressPenaltyPercent}
                  onChange={(e) => setStressPenaltyPercent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-red-500"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-500 mb-1">Net Disbursed</span>
                <span className="font-mono text-xs text-white font-bold py-1.5">
                  ₹{Math.round(stressPrincipal * (1 - stressFeePercent / 100)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Stress Test Live Output Metrics */}
            {stressResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Effective APR</div>
                    <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
                      {stressResult.effectiveApr}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">New Total FOIR</div>
                    <div className={`text-base font-extrabold font-mono mt-0.5 ${stressResult.newFoir > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {stressResult.newFoir}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase">Stressed FOIR (-20%)</div>
                    <div className={`text-base font-extrabold font-mono mt-0.5 ${stressResult.stressFoirDrop20 > 60 ? 'text-red-400' : 'text-amber-400'}`}>
                      {stressResult.stressFoirDrop20}%
                    </div>
                  </div>
                </div>

                {/* Predatory Audit Flags List */}
                <div className="space-y-2 mt-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Predatory Clauses Audit:
                  </div>
                  {stressResult.predatoryFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                        flag.detected
                          ? flag.severity === 'high'
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {flag.detected ? (
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${flag.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                      ) : (
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      )}
                      <div>
                        <span className="font-semibold text-white mr-1.5">{flag.title}:</span>
                        <span className="opacity-90">{flag.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
