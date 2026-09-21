import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, Loan, ConsolidationResult, StressTestResult, MonteCarloResult, IncomeForecastPoint } from './src/types';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gigcred_secure_jwt_secret_2026';

// Load 100 users data
const usersFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');
let usersData: UserProfile[] = [];

try {
  if (fs.existsSync(usersFilePath)) {
    const raw = fs.readFileSync(usersFilePath, 'utf-8');
    usersData = JSON.parse(raw);
  }
} catch (e) {
  console.error('Error loading users.json:', e);
}

// Financial Helper: Reducing balance EMI
function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principal <= 0) return 0;
  const monthlyRate = (annualRatePercent / 12) / 100;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

// AI Helper with resilient fallback
async function generateAiAdvice(user: UserProfile, question: string, history: Array<{ sender: string; text: string }>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are "GigCred AI", a top-tier financial intelligence counselor specially built for Indian gig workers, delivery riders, cab drivers, micro-merchants, and freelancers.
User Context:
- ID: ${user.userId}, Name: ${user.name}, Role: ${user.occupation} (${user.platform})
- Monthly Income: ₹${user.monthlyIncome.toLocaleString('en-IN')}, Monthly Expense: ₹${user.monthlyExpense.toLocaleString('en-IN')}
- Current Total EMI: ₹${user.monthlyEMI.toLocaleString('en-IN')}, FOIR (Debt-to-income): ${user.foir}%
- Cashflow Score: ${user.cashflowScore}/900 (${user.scoreTier}), Risk Profile: ${user.riskProfile}
- Active Loans (${user.loans.length}): ${user.loans.map(l => `${l.name} (₹${l.outstanding.toLocaleString('en-IN')}, ${l.rate}% p.a., EMI ₹${l.emi})`).join(', ')}

Tone & Rules:
1. Explain clearly in friendly English or Hinglish (as user prompts).
2. Ground all advice in their actual numbers (FOIR, income, surplus).
3. Warn against predatory loans (rate > 24% or upfront fees > 3%).
4. Suggest practical steps: micro-repayments, debt consolidation, emergency buffer, reducing BNPL.
5. Keep answers concise, actionable, and structured with bullet points.`;

      const prompt = `User question: "${question}"\nRecent conversation: ${JSON.stringify(history.slice(-3))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn('Gemini API call warning, falling back to rule engine:', err?.message || err);
    }
  }

  // Smart Context-Aware Fallback Engine
  const q = question.toLowerCase();
  const foir = user.foir;
  const surplus = user.monthlySurplus;

  if (q.includes('afford') || q.includes('phone') || q.includes('new loan') || q.includes('buy')) {
    if (foir > 50) {
      return `⚠️ **Affordability Assessment for ${user.name}: Caution Advised**\n\n- **Current Debt Burden:** Your current FOIR is already at **${foir}%** (EMI of ₹${user.monthlyEMI.toLocaleString('en-IN')}/mo), leaving only ₹${surplus.toLocaleString('en-IN')} monthly buffer.\n- **Recommended Threshold:** For gig workers, financial institutions recommend keeping total EMIs under **40%** to absorb seasonal drops or app downtime.\n- **Verdict:** We strongly advise against taking an additional new loan or BNPL gadget right now. Instead, prioritize clearing your high-interest short term loans first.`;
    } else {
      const safeEmi = Math.max(0, Math.round(user.monthlyIncome * 0.40 - user.monthlyEMI));
      return `✅ **Affordability Analysis for ${user.name}:**\n\n- **Safe Monthly EMI Capacity:** Up to **₹${safeEmi.toLocaleString('en-IN')}/month**.\n- **Current FOIR:** You are currently at a healthy **${foir}%**.\n- **Tip:** If purchasing a device, opt for zero-cost or sub-14% interest plans with zero prepayment penalties. Avoid high-fee instant apps charging 28%+ APR.`;
    }
  }

  if (q.includes('consolidat') || q.includes('merge') || q.includes('save')) {
    const highInterestLoans = user.loans.filter(l => l.rate > 18);
    const totalHighIntBal = highInterestLoans.reduce((s, l) => s + l.outstanding, 0);
    return `🏦 **Debt Consolidation Recommendation:**\n\n- You currently have **${user.loans.length} active loan accounts** with a total outstanding of **₹${user.totalOutstanding.toLocaleString('en-IN')}**.\n- ${highInterestLoans.length} of your loans have interest rates above 18% p.a.\n- By consolidating into a single structured loan at **13.5% p.a.** for 24 months, your monthly EMI can drop significantly, freeing up working capital for vehicle maintenance and fuel.`;
  }

  if (q.includes('score') || q.includes('improve') || q.includes('civil') || q.includes('cashflow')) {
    return `📊 **How to Boost Your GigCred Cashflow Score (${user.cashflowScore}/900):**\n\n1. **Route all daily gig receipts through UPI:** Consistent daily inflows boost your Cashflow Regularity index by +40 points.\n2. **Eliminate BNPL and Instant Cash Lines:** Retiring high-rate micro credit reduces credit utilization risk.\n3. **Zero Mandate Bounces:** Ensure your repayment account has ₹1,000 buffer 24 hours before auto-debit dates.\n4. **Adopt Daily Micro-Repayments:** Paying ₹${Math.round(user.monthlyEMI / 26)} daily instead of monthly lump-sum prevents end-of-month liquidity shocks.`;
  }

  return `Hello ${user.name}! Based on your GigCred profile:\n\n- **Role:** ${user.occupation} on ${user.platform}\n- **Monthly Net:** ₹${user.monthlyIncome.toLocaleString('en-IN')} with FOIR at **${user.foir}%**\n- **Cashflow Score:** **${user.cashflowScore}/900** (${user.scoreTier})\n- **Active EMIs:** ₹${user.monthlyEMI.toLocaleString('en-IN')}/month across ${user.loans.length} facilities.\n\nYou can ask me: *"Can I afford a new loan?"*, *"How do I consolidate my loans?"*, *"How to improve my score?"*, or test scenarios in the EMI & CIVIL tabs!`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS headers for flexibility
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // 1. POST /api/login
  app.post('/api/login', (req, res) => {
    const { userId, password } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const cleanId = String(userId).trim().toUpperCase();
    const user = usersData.find(u => u.userId === cleanId);

    if (!user) {
      return res.status(401).json({ error: `User ${cleanId} not found in database (Valid range: GIG1001–GIG1100)` });
    }

    // Demo password check
    if (password !== 'password123' && password !== 'admin' && password.length < 4) {
      return res.status(401).json({ error: 'Invalid password. (Demo password: password123)' });
    }

    const token = jwt.sign(
      { userId: user.userId, name: user.name, role: user.occupation },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user,
    });
  });

  // 2. GET /api/user/:id
  app.get('/api/user/:id', (req, res) => {
    const cleanId = req.params.id.trim().toUpperCase();
    const user = usersData.find(u => u.userId === cleanId);
    if (!user) {
      return res.status(404).json({ error: `User ${cleanId} not found` });
    }
    return res.json(user);
  });

  // 3. POST /api/emi/calculate
  app.post('/api/emi/calculate', (req, res) => {
    const { principal, rate, tenure } = req.body;
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const n = parseInt(tenure) || 1;

    const emi = calculateEmi(p, r, n);
    const totalPayment = emi * n;
    const totalInterest = Math.max(0, totalPayment - p);

    res.json({
      principal: p,
      rate: r,
      tenure: n,
      emi,
      totalPayment,
      totalInterest,
    });
  });

  // 4. POST /api/emi/consolidate
  app.post('/api/emi/consolidate', (req, res) => {
    const { loans, newRate = 14, newTenure = 24 } = req.body;
    const loanList: Loan[] = Array.isArray(loans) ? loans : [];

    const currentTotalOutstanding = loanList.reduce((sum, l) => sum + (l.outstanding || 0), 0);
    const currentTotalEmi = loanList.reduce((sum, l) => sum + (l.emi || 0), 0);

    // Estimate current remaining interest across all loans
    const currentEstInterest = loanList.reduce((sum, l) => {
      const totalPay = (l.emi || 0) * (l.tenure || 12);
      return sum + Math.max(0, totalPay - (l.outstanding || 0));
    }, 0);

    const rateNum = Math.max(6, Math.min(30, parseFloat(newRate) || 14));
    const tenureNum = Math.max(6, Math.min(84, parseInt(newTenure) || 24));

    const newEmi = calculateEmi(currentTotalOutstanding, rateNum, tenureNum);
    const newTotalPayment = newEmi * tenureNum;
    const newTotalInterest = Math.max(0, newTotalPayment - currentTotalOutstanding);

    const interestDelta = currentEstInterest - newTotalInterest; // positive = savings
    const monthlyCashflowRelief = currentTotalEmi - newEmi; // positive = lower monthly outgoing

    let verdict: 'Recommended' | 'Caution' | 'Not Recommended' = 'Recommended';
    let verdictMessage = 'Consolidation reduces your total interest and lowers monthly EMI burden!';

    if (interestDelta < 0 && monthlyCashflowRelief > 0) {
      verdict = 'Caution';
      verdictMessage = `Monthly EMI reduces by ₹${monthlyCashflowRelief.toLocaleString('en-IN')}, but extended tenure adds ₹${Math.abs(interestDelta).toLocaleString('en-IN')} in total interest.`;
    } else if (interestDelta < 0 && monthlyCashflowRelief <= 0) {
      verdict = 'Not Recommended';
      verdictMessage = 'This configuration increases both your monthly EMI and overall interest cost.';
    } else {
      verdict = 'Recommended';
      verdictMessage = `Net interest savings of ₹${interestDelta.toLocaleString('en-IN')} with ₹${Math.max(0, monthlyCashflowRelief).toLocaleString('en-IN')}/mo extra cash in hand!`;
    }

    const result: ConsolidationResult = {
      currentTotalOutstanding,
      currentTotalEmi,
      currentEstInterest,
      newRate: rateNum,
      newTenure: tenureNum,
      newEmi,
      newTotalInterest,
      interestDelta,
      monthlyCashflowRelief,
      verdict,
      verdictMessage,
    };

    res.json(result);
  });

  // 5. POST /api/emi/stress-test
  app.post('/api/emi/stress-test', (req, res) => {
    const {
      principal = 50000,
      rate = 22,
      tenure = 12,
      feePercent = 3.5,
      penaltyPercent = 36,
      userMonthlyIncome = 40000,
      currentTotalEmi = 8000,
    } = req.body;

    const p = parseFloat(principal) || 50000;
    const r = parseFloat(rate) || 22;
    const n = parseInt(tenure) || 12;
    const fee = parseFloat(feePercent) || 0;
    const penalty = parseFloat(penaltyPercent) || 0;
    const income = parseFloat(userMonthlyIncome) || 40000;
    const currEmi = parseFloat(currentTotalEmi) || 0;

    const monthlyEmi = calculateEmi(p, r, n);
    const upfrontFeeAmount = Math.round(p * (fee / 100));

    // Approximate Effective APR (annualized cost including upfront deduction)
    const effectiveApr = Math.round((r + (fee * 12) / Math.max(1, n * 0.58)) * 10) / 10;

    const currentFoir = Math.round((currEmi / Math.max(1, income)) * 100);
    const newTotalEmi = currEmi + monthlyEmi;
    const newFoir = Math.round((newTotalEmi / Math.max(1, income)) * 100);
    const foirSurge = newFoir - currentFoir;
    const stressFoirDrop20 = Math.round((newTotalEmi / Math.max(1, income * 0.8)) * 100);

    const predatoryFlags = [
      {
        title: 'Hidden Upfront Processing Deduction',
        description: `Processing fee is ${fee}% (₹${upfrontFeeAmount.toLocaleString('en-IN')}). Industry safe norm for gig credit is ≤ 2%.`,
        detected: fee > 3.0,
        severity: (fee > 4.5 ? 'high' : 'medium') as 'high' | 'medium',
      },
      {
        title: 'Usurious Nominal Interest Rate',
        description: `Nominal interest rate is ${r}% p.a. Rates exceeding 24% create compounding interest traps for daily earners.`,
        detected: r > 24,
        severity: (r > 32 ? 'high' : 'medium') as 'high' | 'medium',
      },
      {
        title: 'Harsh Bounce & Penalty Trap',
        description: `Late payment & penalty rate is ${penalty}% p.a. High penalties punish gig workers during rainy days or bike breakdown.`,
        detected: penalty > 30,
        severity: 'high' as 'high',
      },
      {
        title: 'Critical Debt-to-Income (FOIR) Surge',
        description: `Your FOIR will jump to ${newFoir}%. A 20% income dip will elevate debt burden to an unsustainable ${stressFoirDrop20}%.`,
        detected: newFoir > 50 || stressFoirDrop20 > 65,
        severity: (stressFoirDrop20 > 70 ? 'high' : 'medium') as 'high' | 'medium',
      },
    ];

    const detectedHighFlags = predatoryFlags.filter(f => f.detected && f.severity === 'high').length;
    const detectedTotalFlags = predatoryFlags.filter(f => f.detected).length;

    let riskLevel: 'Low Risk (Green)' | 'Moderate Risk (Yellow)' | 'High Risk (Red)' = 'Low Risk (Green)';
    let verdict = 'This loan structure appears clean with manageable debt impact and standard commercial terms.';

    if (detectedHighFlags >= 2 || detectedTotalFlags >= 3 || newFoir > 60) {
      riskLevel = 'High Risk (Red)';
      verdict = 'CRITICAL PREDATORY RISK: This loan features severe fees or will dangerously over-leverage your gig income.';
    } else if (detectedTotalFlags >= 1 || newFoir > 45) {
      riskLevel = 'Moderate Risk (Yellow)';
      verdict = 'MODERATE RISK: Noticeable fee friction or tight debt service ratio. Proceed with caution or negotiate lower APR.';
    }

    const result: StressTestResult = {
      principal: p,
      nominalRate: r,
      effectiveApr,
      monthlyEmi,
      currentFoir,
      newFoir,
      foirSurge,
      stressFoirDrop20,
      riskLevel,
      predatoryFlags,
      verdict,
    };

    res.json(result);
  });

  // 6. POST /api/score/cashflow
  app.post('/api/score/cashflow', (req, res) => {
    const { userId, income, loans = [], bounceRate = 1.5, activeMonths = 18 } = req.body;
    let score = 730;

    const monthlyIncome = parseFloat(income) || 38000;
    const totalEmi = loans.reduce((s: number, l: any) => s + (parseFloat(l.emi) || 0), 0);
    const foir = (totalEmi / Math.max(1, monthlyIncome)) * 100;

    if (foir > 60) score -= 90;
    else if (foir > 45) score -= 45;
    else if (foir < 30) score += 35;

    if (bounceRate > 4) score -= 65;
    else if (bounceRate < 1) score += 40;

    if (activeMonths >= 24) score += 45;
    else if (activeMonths < 6) score -= 30;

    score = Math.max(300, Math.min(890, Math.round(score)));
    const tier = score >= 750 ? 'Prime' : score >= 650 ? 'Near-Prime' : 'Subprime';

    res.json({
      score,
      tier,
      confidence: 93,
      breakdown: {
        cashflowHealth: Math.min(100, Math.round((monthlyIncome - totalEmi) / 400)),
        debtBurden: Math.max(10, Math.round(100 - foir)),
        earningsStability: 84,
        platformReputation: 92,
      },
    });
  });

  // 7. POST /api/score/shap
  app.post('/api/score/shap', (req, res) => {
    const { userId } = req.body;
    const user = usersData.find(u => u.userId === userId) || usersData[0];
    res.json(user.shapFactors);
  });

  // 8. POST /api/forecast/income
  app.post('/api/forecast/income', (req, res) => {
    const { monthlyIncome = 38000 } = req.body;
    const baseDaily = (parseFloat(monthlyIncome) || 38000) / 30;

    const points: IncomeForecastPoint[] = [];
    const today = new Date();

    for (let day = 1; day <= 90; day += 3) {
      const forecastDate = new Date(today.getTime() + day * 24 * 60 * 60 * 1000);
      const dateStr = forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Daily seasonality simulation (weekend uplift, festive period surge around day 35-50)
      const dayOfWeek = forecastDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const seasonalMultiplier = 1.0 + (isWeekend ? 0.28 : 0.0) + (day > 30 && day < 55 ? 0.18 : 0.0);

      const median = Math.round(baseDaily * seasonalMultiplier * 3); // 3-day aggregate
      const p10 = Math.round(median * 0.76);
      const p90 = Math.round(median * 1.34);

      points.push({
        day,
        date: dateStr,
        p10,
        p50: median,
        p90,
      });
    }

    res.json(points);
  });

  // 9. POST /api/montecarlo
  app.post('/api/montecarlo', (req, res) => {
    const { monthlyIncome = 38000, monthlyEmi = 9000, volatility = 0.22 } = req.body;
    const inc = parseFloat(monthlyIncome) || 38000;
    const emi = parseFloat(monthlyEmi) || 9000;
    const vol = parseFloat(volatility) || 0.22;

    const numSimulations = 1000;
    const outcomes90Days: number[] = [];
    let defaultCount = 0;
    const threeMonthEmiCommitment = emi * 3;

    for (let i = 0; i < numSimulations; i++) {
      let simQuarterIncome = 0;
      for (let m = 0; m < 3; m++) {
        // Log-normal shock
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
        const shock = Math.exp((z * vol) - (0.5 * vol * vol));
        simQuarterIncome += inc * shock;
      }
      outcomes90Days.push(simQuarterIncome);

      // Default threshold: income drops so low that living expenses + EMI exceed total income
      const livingCost90 = inc * 0.60 * 3;
      if (simQuarterIncome - livingCost90 < threeMonthEmiCommitment * 0.75) {
        defaultCount++;
      }
    }

    outcomes90Days.sort((a, b) => a - b);
    const minVal = outcomes90Days[0];
    const maxVal = outcomes90Days[numSimulations - 1];
    const p10Val = outcomes90Days[Math.floor(numSimulations * 0.10)];
    const p50Val = outcomes90Days[Math.floor(numSimulations * 0.50)];
    const p90Val = outcomes90Days[Math.floor(numSimulations * 0.90)];

    // Create 8 histogram bins
    const binCount = 8;
    const binWidth = (maxVal - minVal) / binCount;
    const histogram = [];

    for (let b = 0; b < binCount; b++) {
      const bLow = minVal + b * binWidth;
      const bHigh = bLow + binWidth;
      const count = outcomes90Days.filter(val => val >= bLow && (b === binCount - 1 ? val <= bHigh : val < bHigh)).length;
      histogram.push({
        range: `₹${Math.round(bLow / 1000)}k–${Math.round(bHigh / 1000)}k`,
        count,
        percentage: Math.round((count / numSimulations) * 100),
      });
    }

    const defaultProbability = Math.round((defaultCount / numSimulations) * 1000) / 10;
    // Daily micro-repayment logic: spread monthly EMI over 26 working days with 5% safety buffer
    const recommendedDailyMicroRepayment = Math.round((emi * 1.05) / 26);

    const result: MonteCarloResult = {
      simulationsRun: numSimulations,
      defaultProbability,
      medianIncome90Days: Math.round(p50Val),
      worstCaseIncome90Days: Math.round(p10Val),
      bestCaseIncome90Days: Math.round(p90Val),
      recommendedDailyMicroRepayment,
      monthlyEmiRequirement: Math.round(emi),
      histogram,
      insight: defaultProbability < 5
        ? 'High Cashflow Resilience: Your gig earnings reliably withstand volatility with <5% default probability.'
        : defaultProbability < 15
        ? 'Moderate Buffer: Manageable risk under normal conditions, but sudden platform algorithm shifts may squeeze margins.'
        : 'Elevated Risk: Sizable chance of cashflow crunch. Automating daily micro-sweeps is strongly advised.',
    };

    res.json(result);
  });

  // 10. POST /api/alerts
  app.post('/api/alerts', (req, res) => {
    const { userId } = req.body;
    const user = usersData.find(u => u.userId === userId) || usersData[0];
    res.json(user.alerts);
  });

  // 11. POST /api/roadmap
  app.post('/api/roadmap', (req, res) => {
    const { userId } = req.body;
    const user = usersData.find(u => u.userId === userId) || usersData[0];
    res.json(user.roadmap);
  });

  // 12. POST /api/ai/chat
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { userId, message, history = [] } = req.body;
      const user = usersData.find(u => u.userId === userId) || usersData[0];
      const reply = await generateAiAdvice(user, message, history);
      res.json({ reply });
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({ error: 'Failed to generate financial advice' });
    }
  });

  // Vite middleware in dev; static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GigCred backend & frontend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
