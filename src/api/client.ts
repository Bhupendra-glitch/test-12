import { UserProfile, Loan, ConsolidationResult, StressTestResult, ShapFactor, IncomeForecastPoint, MonteCarloResult, AlertItem, RoadmapPhase } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gigcred_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  async login(userId: string, password: string):Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });
    return handleResponse<{ token: string; user: UserProfile }>(res);
  },

  async getUser(id: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/${encodeURIComponent(id)}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<UserProfile>(res);
  },

  async calculateEmi(principal: number, rate: number, tenure: number) {
    const res = await fetch(`${API_BASE}/emi/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ principal, rate, tenure }),
    });
    return handleResponse<{ principal: number; rate: number; tenure: number; emi: number; totalPayment: number; totalInterest: number }>(res);
  },

  async consolidateLoans(loans: Loan[], newRate: number, newTenure: number): Promise<ConsolidationResult> {
    const res = await fetch(`${API_BASE}/emi/consolidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ loans, newRate, newTenure }),
    });
    return handleResponse<ConsolidationResult>(res);
  },

  async stressTestLoan(params: {
    principal: number;
    rate: number;
    tenure: number;
    feePercent: number;
    penaltyPercent: number;
    userMonthlyIncome: number;
    currentTotalEmi: number;
  }): Promise<StressTestResult> {
    const res = await fetch(`${API_BASE}/emi/stress-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse<StressTestResult>(res);
  },

  async getCashflowScore(params: { userId: string; income: number; loans: Loan[]; bounceRate: number }): Promise<any> {
    const res = await fetch(`${API_BASE}/score/cashflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse<any>(res);
  },

  async getShapFactors(userId: string): Promise<ShapFactor[]> {
    const res = await fetch(`${API_BASE}/score/shap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ userId }),
    });
    return handleResponse<ShapFactor[]>(res);
  },

  async getIncomeForecast(monthlyIncome: number): Promise<IncomeForecastPoint[]> {
    const res = await fetch(`${API_BASE}/forecast/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ monthlyIncome }),
    });
    return handleResponse<IncomeForecastPoint[]>(res);
  },

  async getMonteCarlo(monthlyIncome: number, monthlyEmi: number, volatility: number = 0.22): Promise<MonteCarloResult> {
    const res = await fetch(`${API_BASE}/montecarlo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ monthlyIncome, monthlyEmi, volatility }),
    });
    return handleResponse<MonteCarloResult>(res);
  },

  async getAlerts(userId: string): Promise<AlertItem[]> {
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ userId }),
    });
    return handleResponse<AlertItem[]>(res);
  },

  async getRoadmap(userId: string): Promise<RoadmapPhase[]> {
    const res = await fetch(`${API_BASE}/roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ userId }),
    });
    return handleResponse<RoadmapPhase[]>(res);
  },

  async sendAiChat(userId: string, message: string, history: Array<{ sender: string; text: string }>): Promise<{ reply: string }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ userId, message, history }),
    });
    return handleResponse<{ reply: string }>(res);
  },
};
