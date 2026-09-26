/**
 * Financial Planner v4.0 - Headless QA Parity & Benchmark Harness (demo/)
 * 
 * Executes mathematical simulation logic directly (via Node.js or Apple JSC)
 * with zero browser/DOM dependency, verifying against the Demo 30-Year-Old Starter Profile.
 */

// 1. Environment shim for JSC / Node
if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}

window.appState = {
  user: { birthDate: '1995-11-26', age: 30.1, retireAge: 60.0 },
  latestSnapshotDate: '2025-12-31',
  latestSnapshotYear: 2025,
  projectionStartYear: 2026,
  spending: [
    { category: 'Housing & Rent', type: 'Fixed', actual2025: 24000 },
    { category: 'Groceries & Living', type: 'Fixed', actual2025: 21000 },
    { category: 'Discretionary Lifestyle', type: 'Discretionary', actual2025: 20000 }
  ],
  assets: [
    { id: 'asset-1', name: 'Primary Checking', taxClassification: 'Cash / Other', balance: 15000, expectedReturn: 0.005, volatility: 0.01 },
    { id: 'asset-2', name: 'High-Yield Savings', taxClassification: 'Cash / Other', balance: 20000, expectedReturn: 0.040, volatility: 0.01 },
    { id: 'asset-3', name: 'Employer 401(k)', taxClassification: 'Pre-Tax', balance: 40000, expectedReturn: 0.070, volatility: 0.16 },
    { id: 'asset-4', name: 'Roth IRA (Index)', taxClassification: 'Pre-Tax', balance: 20000, expectedReturn: 0.070, volatility: 0.16 },
    { id: 'asset-5', name: 'Individual Brokerage', taxClassification: 'Taxable Equity', balance: 20000, expectedReturn: 0.070, volatility: 0.16 }
  ],
  assumptions: {
    incomes: {
      jSalary: 105000,
      nSalary: 0,
      add401k: 12000,
      addIRA: 7000,
      ssMonthly: 2200,
      ssClaimAge: 67,
      ssCutPct: 0.20
    },
    decadalDecay: {
      age50to59: 1.00,
      age60to69: 0.90,
      age70to79: 0.80,
      age80to100: 0.65
    },
    macro: {
      effectiveTax: 0.22,
      cpiInflation: 0.025,
      enableRothConversion: true
    },
    glidePath: {
      enabled: false,
      onsetAge: 50.0,
      terminalAge: 65.0,
      terminalReturn: 0.05
    },
    rsuGrants: [],
    events: []
  }
};

// 2. Load engine
if (typeof require !== 'undefined') {
  globalThis.FireEngine = require('./src/engine.js');
} else if (typeof load !== 'undefined') {
  try {
    load('src/engine.js');
  } catch (e) {
    try {
      load('./src/engine.js');
    } catch (e2) {
      load('demo/v4/src/engine.js');
    }
  }
}

const eng = globalThis.FireEngine || FireEngine;
const runMultiAssetSimulation = eng.runMultiAssetSimulation;
const calculateEarliestFireAge = eng.calculateEarliestFireAge;
const buildForecastArchiveCSVText = eng.buildForecastArchiveCSVText;
const generateRepresentativePercentileRuns = eng.generateRepresentativePercentileRuns;

function formatMoney(num) {
  if (num === null || num === undefined) return '$0.00M';
  if (Math.abs(num) >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
  return '$' + Math.round(num).toLocaleString();
}

function runBenchmarkQA() {
  const log = (typeof console !== 'undefined' && console.log) ? console.log : print;
  let allPassed = true;

  log('======================================================================');
  log('   Financial Planner v4.0 (Demo) - Headless QA Benchmark Harness');
  log('======================================================================\n');

  // Vector 1: Early Retirement Stress Test @ Age 40 (Depletion expected)
  const v1 = runMultiAssetSimulation({ retireAge: 40.0 });
  log('--- Benchmark Vector 1: Early Retirement Stress Test @ Age 40 ---');
  log(`  Retirement Net Worth (Age 40): ${formatMoney(v1.nwAtRetire)}`);
  log(`  Terminal Wealth @ Age 100:     ${formatMoney(v1.terminalNW)}`);
  log(`  Depletion Age:                 ${v1.depletionAge ? 'Age ' + v1.depletionAge : 'NEVER (Solvent)'}`);
  const v1Pass = (v1.depletionAge !== null && v1.depletionAge <= 65);
  log(`  >> Status: [${v1Pass ? 'PASS' : 'FAIL'}]\n`);
  if (!v1Pass) allPassed = false;

  // Vector 2: Baseline Target Retirement @ Age 60 (Solvent)
  const v2 = runMultiAssetSimulation({ retireAge: 60.0 });
  log('--- Benchmark Vector 2: Baseline Retirement @ Age 60 ---');
  log(`  Retirement Net Worth (Age 60): ${formatMoney(v2.nwAtRetire)}`);
  log(`  Terminal Wealth @ Age 100:     ${formatMoney(v2.terminalNW)}`);
  log(`  Depletion Age:                 ${v2.depletionAge ? 'Age ' + v2.depletionAge : 'Never (Fully Solvent)'}`);
  const v2Pass = (v2.terminalNW > 500000 && v2.depletionAge === null);
  log(`  >> Status: [${v2Pass ? 'PASS' : 'FAIL'}]\n`);
  if (!v2Pass) allPassed = false;

  // Vector 3: Directional Sanity (Higher savings -> Higher wealth)
  log('--- Benchmark Vector 3: Directional Sanity Invariant ---');
  const simBase = runMultiAssetSimulation({ retireAge: 60.0 });
  const higherState = JSON.parse(JSON.stringify(window.appState));
  higherState.assumptions.incomes.jSalary = 120000; // +$15k salary
  const simHigher = runMultiAssetSimulation({ retireAge: 60.0 }, higherState);
  const v3Pass = simHigher.terminalNW > simBase.terminalNW;
  log(`  Base Terminal NW:   ${formatMoney(simBase.terminalNW)}`);
  log(`  Higher Terminal NW: ${formatMoney(simHigher.terminalNW)}`);
  log(`  >> Status: [${v3Pass ? 'PASS' : 'FAIL - REGRESSION'}]\n`);
  if (!v3Pass) allPassed = false;

  // Vector 4: Monte Carlo Percentile Ordering
  log('--- Benchmark Vector 4: Monte Carlo Percentile Monotonicity ---');
  const mcRuns = generateRepresentativePercentileRuns(window.appState);
  const p10_term = mcRuns.p10.rows[mcRuns.p10.rows.length - 1].rawNW;
  const p25_term = mcRuns.p25.rows[mcRuns.p25.rows.length - 1].rawNW;
  const p50_term = mcRuns.p50.rows[mcRuns.p50.rows.length - 1].rawNW;
  const p75_term = mcRuns.p75.rows[mcRuns.p75.rows.length - 1].rawNW;
  const p90_term = mcRuns.p90.rows[mcRuns.p90.rows.length - 1].rawNW;

  log(`  p10: ${formatMoney(p10_term)} | p25: ${formatMoney(p25_term)} | p50: ${formatMoney(p50_term)} | p75: ${formatMoney(p75_term)} | p90: ${formatMoney(p90_term)}`);
  const v4Pass = (p10_term <= p25_term && p25_term <= p50_term && p50_term <= p75_term && p75_term <= p90_term);
  log(`  >> Status: [${v4Pass ? 'PASS' : 'FAIL - PERCENTILE INVERSION'}]\n`);
  if (!v4Pass) allPassed = false;

  // Vector 5: Cash Reserve Buffer Invariant
  log('--- Benchmark Vector 5: Cash Reserve Buffer & Reinvestment Invariant ---');
  const simBuffer = runMultiAssetSimulation({ retireAge: 60.0 });
  let bufferOk = true;
  simBuffer.rows.forEach(row => {
    // If excess cash plowed > 0, curCash should equal maxCashTarget
    if (row.excessCashPlowed > 0 && Math.abs(row.curCash - row.maxCashTarget) > 1.0) {
      bufferOk = false;
    }
  });
  log(`  Cash Reserve Invariant Verified Across ${simBuffer.rows.length} Projection Years.`);
  log(`  >> Status: [${bufferOk ? 'PASS' : 'FAIL'}]\n`);
  if (!bufferOk) allPassed = false;

  // Vector 6: Forecast CSV Archive Generation
  log('--- Benchmark Vector 6: Forecast CSV Archive Generation ---');
  const csvOutput = buildForecastArchiveCSVText(window.appState, mcRuns);
  const csvLines = csvOutput.trim().split('\n');
  const hasMetadata = csvLines.some(l => l.includes('FINANCIAL PLANNER - ANNUAL FORECAST & ASSUMPTIONS ARCHIVE'));
  const hasHeaders = csvLines.some(l => l.includes('Percentile,Age,Year,Status,EOY Net Worth'));
  const totalRows = csvLines.filter(l => !l.startsWith('#')).length;
  log(`  Total Lines: ${csvLines.length}, Data Rows: ${totalRows - 1}`);
  const v6Pass = hasMetadata && hasHeaders && totalRows > 100;
  log(`  >> Status: [${v6Pass ? 'PASS' : 'FAIL'}]\n`);
  if (!v6Pass) allPassed = false;

  log('======================================================================');
  if (allPassed) {
    log('   >>> ALL BENCHMARK VECTORS PASSED (EXIT CODE 0) <<<');
    log('======================================================================\n');
    return 0;
  } else {
    log('   >>> QA REGRESSION DETECTED (EXIT CODE 1) <<<');
    log('======================================================================\n');
    return 1;
  }
}

const exitCode = runBenchmarkQA();
if (typeof process !== 'undefined' && process.exit) {
  process.exit(exitCode);
}
