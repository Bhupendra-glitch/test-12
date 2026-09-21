import fs from 'fs';
import path from 'path';

// Helper to generate 100 rich gig worker profiles
const occupations = [
  { role: 'Cab Driver', platform: 'Uber & Ola', minInc: 32000, maxInc: 52000, expRate: 0.58 },
  { role: 'Food Delivery Partner', platform: 'Swiggy & Zomato', minInc: 24000, maxInc: 42000, expRate: 0.52 },
  { role: 'Quick-Commerce Rider', platform: 'Blinkit & Zepto', minInc: 26000, maxInc: 44000, expRate: 0.54 },
  { role: 'Freelance Web Designer', platform: 'Upwork & Direct UPI', minInc: 45000, maxInc: 95000, expRate: 0.42 },
  { role: 'Kirana / Chai Merchant', platform: 'PhonePe & Paytm QR', minInc: 35000, maxInc: 70000, expRate: 0.62 },
  { role: 'Home Salon Specialist', platform: 'Urban Company', minInc: 30000, maxInc: 58000, expRate: 0.48 },
  { role: 'Bike Taxi Captain', platform: 'Rapido & Uber Moto', minInc: 20000, maxInc: 36000, expRate: 0.55 },
  { role: 'Appliance Technician', platform: 'Urban Company & Local', minInc: 28000, maxInc: 48000, expRate: 0.50 }
];

const indianNames = [
  'Ramesh Kumar', 'Pooja Sharma', 'Sunil Verma', 'Amina Begum', 'Deepak Patil',
  'Vikram Singh', 'Kavita Nair', 'Mohd. Rizwan', 'Arun Swaminathan', 'Neha Gupta',
  'Sanjay Yadav', 'Rekha Joshi', 'Anil Deshmukh', 'Farhan Akhtar', 'Manoj Tiwari',
  'Priya Pillai', 'Suresh Rathore', 'Jyoti Maurya', 'Bikash Mondal', 'Gurpreet Singh',
  'Dinesh Reddy', 'Shweta Kulkarni', 'Harish Rawat', 'Nasreen Bano', 'Kiran Patel',
  'Santosh Sawant', 'Divya Chauhan', 'Amitabh Roy', 'Sunita Mahajan', 'Vijay Choudhary'
];

const loanTemplates = [
  { name: 'Bajaj Two-Wheeler EMI', type: 'Vehicle', defaultBal: 38000, rate: 16.5, tenure: 14, fee: 2.0, penalty: 24 },
  { name: 'TVS Credit Bike Loan', type: 'Vehicle', defaultBal: 45000, rate: 17.0, tenure: 18, fee: 2.5, penalty: 28 },
  { name: 'LazyPay PayLater Balance', type: 'BNPL', defaultBal: 12500, rate: 26.0, tenure: 6, fee: 3.0, penalty: 36 },
  { name: 'Simpl BNPL Khata', type: 'BNPL', defaultBal: 8400, rate: 24.0, tenure: 4, fee: 2.0, penalty: 30 },
  { name: 'KreditBee Instant Loan', type: 'Micro Loan', defaultBal: 22000, rate: 28.5, tenure: 9, fee: 4.5, penalty: 42 },
  { name: 'OneCard Credit Card Outstanding', type: 'Credit Card', defaultBal: 31000, rate: 38.0, tenure: 12, fee: 3.5, penalty: 42 },
  { name: 'MoneyView Personal Loan', type: 'Personal', defaultBal: 65000, rate: 21.0, tenure: 24, fee: 3.0, penalty: 30 },
  { name: 'Muthoot Gold Loan Top-Up', type: 'Micro Loan', defaultBal: 50000, rate: 13.5, tenure: 12, fee: 1.0, penalty: 18 },
  { name: 'HDFC Micro Business Loan', type: 'Personal', defaultBal: 90000, rate: 15.5, tenure: 30, fee: 1.5, penalty: 20 },
  { name: 'CASHe Short-Term Cash', type: 'BNPL', defaultBal: 15000, rate: 29.0, tenure: 6, fee: 4.0, penalty: 38 }
];

function calculateEmi(p: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return 0;
  const r = (annualRate / 12) / 100;
  if (r === 0) return Math.round(p / tenureMonths);
  const emi = (p * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

const users = [];

for (let i = 1001; i <= 1100; i++) {
  const userId = `GIG${i}`;
  const name = indianNames[(i - 1001) % indianNames.length] + ((i > 1030) ? ` ${String.fromCharCode(65 + (i % 26))}.` : '');
  const occ = occupations[(i - 1001) % occupations.length];

  // Specific profiles for demo clarity
  let riskProfile = 'Moderate Risk';
  let loanCount = 2;

  if (i === 1001) {
    riskProfile = 'Low Risk';
    loanCount = 1;
  } else if (i === 1002) {
    riskProfile = 'Moderate Risk';
    loanCount = 3;
  } else if (i === 1003) {
    riskProfile = 'Low Risk';
    loanCount = 4; // Low Risk, 4 loans as stated in prompt!
  } else if (i % 5 === 0) {
    riskProfile = 'High Risk';
    loanCount = 4;
  } else if (i % 2 === 0) {
    riskProfile = 'Low Risk';
    loanCount = 2;
  } else {
    riskProfile = 'Moderate Risk';
    loanCount = 3;
  }

  // Monthly income range
  const incomeVariation = ((i * 491) % 15) * 1000;
  const monthlyIncome = occ.minInc + incomeVariation;
  const monthlyExpense = Math.round(monthlyIncome * occ.expRate);

  // Pick loans
  const userLoans = [];
  for (let l = 0; l < loanCount; l++) {
    const template = loanTemplates[(i * 3 + l * 2) % loanTemplates.length];
    const balance = template.defaultBal + ((i * 73 + l * 500) % 8000) - 4000;
    const emi = calculateEmi(balance, template.rate, template.tenure);
    userLoans.push({
      id: `LN-${i}-${l + 1}`,
      name: template.name,
      type: template.type,
      outstanding: Math.max(5000, balance),
      rate: template.rate,
      tenure: template.tenure,
      emi: emi,
      hiddenFeePercent: template.fee,
      penaltyRatePercent: template.penalty
    });
  }

  const totalEMI = userLoans.reduce((sum, item) => sum + item.emi, 0);
  const totalOutstanding = userLoans.reduce((sum, item) => sum + item.outstanding, 0);
  const foir = Math.round((totalEMI / monthlyIncome) * 100);

  // Cashflow score: 0 - 900 scale
  let baseScore = 720;
  if (riskProfile === 'Low Risk') baseScore = 760 + ((i % 8) * 12);
  else if (riskProfile === 'Moderate Risk') baseScore = 650 + ((i % 10) * 8);
  else baseScore = 540 + ((i % 12) * 8);

  // Clamp 300 to 885
  const cashflowScore = Math.max(320, Math.min(880, baseScore - (foir > 50 ? 50 : 0)));
  const scoreTier = cashflowScore >= 750 ? 'Prime' : cashflowScore >= 640 ? 'Near-Prime' : 'Subprime';
  const confidence = 88 + (i % 11);

  users.push({
    userId,
    name,
    occupation: occ.role,
    platform: occ.platform,
    monthlyIncome,
    monthlyExpense,
    monthlySurplus: monthlyIncome - monthlyExpense - totalEMI,
    incomeStability: 75 + (i % 22),
    riskProfile,
    cashflowScore,
    scoreTier,
    confidence,
    totalOutstanding,
    monthlyEMI: totalEMI,
    foir,
    upiMonthlyVolume: Math.round(monthlyIncome * 1.15),
    dailyAverageUpi: Math.round((monthlyIncome * 1.15) / 30),
    bounceRate: riskProfile === 'Low Risk' ? 0.8 : riskProfile === 'Moderate Risk' ? 2.4 : 5.8,
    activeMonthsOnPlatform: 12 + (i % 36),
    loans: userLoans,
    shapFactors: [
      { factor: 'Daily UPI Inflow Regularity', impact: riskProfile === 'Low Risk' ? 52 : 32, type: 'positive', detail: 'Consistent daily customer & platform payouts' },
      { factor: 'Platform Tenacity & Longevity', impact: 28, type: 'positive', detail: 'Over 18 months verified on gig aggregators' },
      { factor: 'Low Auto-Debit Bounce Ratio', impact: riskProfile === 'High Risk' ? -46 : 24, type: riskProfile === 'High Risk' ? 'negative' : 'positive', detail: 'Under 2% mandate returns in last 6 months' },
      { factor: 'Debt-to-Income (FOIR) Burden', impact: foir > 45 ? -48 : -14, type: 'negative', detail: `Current debt commitments at ${foir}% of monthly income` },
      { factor: 'Unsecured BNPL / Card Exposure', impact: userLoans.some(l => l.type === 'BNPL' || l.type === 'Credit Card') ? -32 : 16, type: userLoans.some(l => l.type === 'BNPL' || l.type === 'Credit Card') ? 'negative' : 'positive', detail: 'Short-term high interest revolving lines' }
    ],
    alerts: [
      ...(foir > 50 ? [{ id: 'alt-1', severity: 'critical', title: 'High FOIR Alert (>50%)', message: `Your EMIs consume ${foir}% of your monthly earnings. Recommended threshold for gig workers is under 40%.` }] : []),
      ...(userLoans.some(l => l.rate > 24) ? [{ id: 'alt-2', severity: 'warning', title: 'Predatory Interest Rate Detected', message: 'You have active loans charging 24%+ interest. Debt consolidation could reduce this to 12-14%.' }] : []),
      { id: 'alt-3', severity: 'info', title: 'Income Seasonality Peak Ahead', message: 'Upcoming festive quarter historical analysis shows expected 22% surge in daily gig incentives.' }
    ],
    roadmap: [
      { phase: 'Phase 1: Days 1–30 (Immediate Relief)', target: 'Clear Highest-Rate Micro Loan', action: 'Direct ₹3,500 monthly surplus to eliminate 28%+ APR micro line first.', metric: 'FOIR drops by 6-9%' },
      { phase: 'Phase 2: Days 31–90 (Debt Consolidation)', target: 'Consolidate 2-3 High-Interest Debts', action: 'Refinance multiple fragmented EMIs into one single low-cost loan at 13-15%.', metric: 'Cashflow Score +45 pts' },
      { phase: 'Phase 3: Days 91–180 (Prime Tier Unlock)', target: 'Establish Auto-Sweep Micro-Repayment', action: 'Enable daily ₹150 automatic UPI sweep from aggregator wallet to build pristine civil history.', metric: 'Unlock Prime Bank Loan at 10.5%' }
    ]
  });
}

const outputPath = path.join(process.cwd(), 'src', 'data', 'users.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(users, null, 2), 'utf-8');
console.log(`Generated ${users.length} users in ${outputPath}`);
