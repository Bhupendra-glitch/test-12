export interface Loan {
  id: string;
  name: string;
  type: 'Vehicle' | 'BNPL' | 'Personal' | 'Credit Card' | 'Micro Loan';
  outstanding: number;
  rate: number; // annual percentage e.g. 18.5
  tenure: number; // in months
  emi: number;
  hiddenFeePercent?: number;
  penaltyRatePercent?: number;
}

export interface ShapFactor {
  factor: string;
  impact: number;
  type: 'positive' | 'negative';
  detail: string;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface RoadmapPhase {
  phase: string;
  target: string;
  action: string;
  metric: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  occupation: string;
  platform: string;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySurplus: number;
  incomeStability: number;
  riskProfile: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  cashflowScore: number;
  scoreTier: 'Prime' | 'Near-Prime' | 'Subprime';
  confidence: number;
  totalOutstanding: number;
  monthlyEMI: number;
  foir: number;
  upiMonthlyVolume: number;
  dailyAverageUpi: number;
  bounceRate: number;
  activeMonthsOnPlatform: number;
  loans: Loan[];
  shapFactors: ShapFactor[];
  alerts: AlertItem[];
  roadmap: RoadmapPhase[];
}

export interface ConsolidationResult {
  currentTotalOutstanding: number;
  currentTotalEmi: number;
  currentEstInterest: number;
  newRate: number;
  newTenure: number;
  newEmi: number;
  newTotalInterest: number;
  interestDelta: number; // positive = savings
  monthlyCashflowRelief: number; // positive = monthly savings
  verdict: 'Recommended' | 'Caution' | 'Not Recommended';
  verdictMessage: string;
}

export interface StressTestResult {
  principal: number;
  nominalRate: number;
  effectiveApr: number;
  monthlyEmi: number;
  currentFoir: number;
  newFoir: number;
  foirSurge: number;
  stressFoirDrop20: number; // FOIR if income drops 20%
  riskLevel: 'Low Risk (Green)' | 'Moderate Risk (Yellow)' | 'High Risk (Red)';
  predatoryFlags: {
    title: string;
    description: string;
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
  }[];
  verdict: string;
}

export interface IncomeForecastPoint {
  day: number;
  date: string;
  p10: number; // pessimistic (10th percentile)
  p50: number; // expected median (50th percentile)
  p90: number; // optimistic (90th percentile)
}

export interface MonteCarloHistogramBin {
  range: string;
  count: number;
  percentage: number;
}

export interface MonteCarloResult {
  simulationsRun: number;
  defaultProbability: number;
  medianIncome90Days: number;
  worstCaseIncome90Days: number;
  bestCaseIncome90Days: number;
  recommendedDailyMicroRepayment: number;
  monthlyEmiRequirement: number;
  histogram: MonteCarloHistogramBin[];
  insight: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
