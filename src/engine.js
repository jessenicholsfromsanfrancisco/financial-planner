/**
 * ============================================================================
 * Financial Planner v4.0 - Public Demo Edition (demo/src/engine.js)
 * Component: Pure Mathematical & Simulation Engine
 * ============================================================================
 * Clean, anonymized public demo edition for interactive wealth simulation.
 * Pure JavaScript, decoupled from DOM and external libraries.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const eng = factory();
    root.FireEngine = eng;
    root.FinancialEngine = eng;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getState(providedState) {
    if (providedState) return providedState;
    if (typeof window !== 'undefined' && window.appState) return window.appState;
    if (typeof globalThis !== 'undefined' && globalThis.appState) return globalThis.appState;
    return {};
  }

  function getAssetBuckets(customState) {
    const state = getState(customState);
    const assets = state.assets || [];
    let curCash = assets.filter(x => x.taxClassification === 'Cash / Other').reduce((s, x) => s + (x.balance || 0), 0);
    let curTaxable = assets.filter(x => x.taxClassification === 'Taxable Equity').reduce((s, x) => s + (x.balance || 0), 0);
    let curPreTax = assets.filter(x => x.taxClassification === 'Pre-Tax').reduce((s, x) => s + (x.balance || 0), 0);
    let curRoth = assets.filter(x => x.taxClassification === 'Tax-Free Roth' || x.taxClassification === 'Roth IRA' || (x.name && x.name.toLowerCase().includes('roth'))).reduce((s, x) => s + (x.balance || 0), 0);

    // Clean baseline fallback only if state has no assets at all
    if (curCash + curTaxable + curPreTax + curRoth === 0) {
      curCash = 20177;
      curTaxable = 2253396;
      curPreTax = 1477149;
      curRoth = 0;
    }
    return { curCash, curTaxable, curPreTax, curRoth };
  }

  // IRS Publication 590-B Uniform Lifetime Table (SECURE Act 2.0: RMDs start at Age 73)
  const RMD_TABLE = {
    73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
    80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
    87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1,
    94: 9.5,  95: 8.9,  96: 8.4,  97: 7.8,  98: 7.3,  99: 6.8,  100: 6.4
  };

  /**
   * Progressive Federal Ordinary Income Tax (2026 MFJ Baseline, CPI-indexed)
   */
  function calcFederalOrdinaryTax(taxableIncome, cpiFactor = 1.0) {
    const stdDeduction = 30000 * cpiFactor;
    const net = Math.max(0, taxableIncome - stdDeduction);
    if (net <= 0) return 0;
    const b = [
      { cap: 23850 * cpiFactor, rate: 0.10 },
      { cap: 96950 * cpiFactor, rate: 0.12 },
      { cap: 206700 * cpiFactor, rate: 0.22 },
      { cap: 394600 * cpiFactor, rate: 0.24 },
      { cap: 501050 * cpiFactor, rate: 0.32 },
      { cap: 751600 * cpiFactor, rate: 0.35 },
      { cap: Infinity, rate: 0.37 }
    ];
    let tax = 0, prev = 0;
    for (let i = 0; i < b.length; i++) {
      if (net > prev) {
        const chunk = Math.min(net, b[i].cap) - prev;
        tax += chunk * b[i].rate;
        prev = b[i].cap;
      } else break;
    }
    return tax;
  }

  /**
   * Progressive California State Income Tax (2026 MFJ Baseline, CPI-indexed)
   */
  function calcCaliforniaTax(taxableIncome, cpiFactor = 1.0) {
    const caStdDeduction = 11000 * cpiFactor;
    const net = Math.max(0, taxableIncome - caStdDeduction);
    if (net <= 0) return 0;
    const b = [
      { cap: 20824 * cpiFactor, rate: 0.01 },
      { cap: 49368 * cpiFactor, rate: 0.02 },
      { cap: 77918 * cpiFactor, rate: 0.04 },
      { cap: 108162 * cpiFactor, rate: 0.06 },
      { cap: 136700 * cpiFactor, rate: 0.08 },
      { cap: 698274 * cpiFactor, rate: 0.093 },
      { cap: 837922 * cpiFactor, rate: 0.103 },
      { cap: 1396542 * cpiFactor, rate: 0.113 },
      { cap: Infinity, rate: 0.123 }
    ];
    let tax = 0, prev = 0;
    for (let i = 0; i < b.length; i++) {
      if (net > prev) {
        const chunk = Math.min(net, b[i].cap) - prev;
        tax += chunk * b[i].rate;
        prev = b[i].cap;
      } else break;
    }
    if (net > 1000000 * cpiFactor) {
      tax += (net - 1000000 * cpiFactor) * 0.01;
    }
    return tax;
  }

  /**
   * Federal Long-Term Capital Gains Tax (2026 MFJ Baseline, stacked on ordinary income)
   */
  function calcFederalLtcgTax(ordinaryTaxableIncome, capitalGain, cpiFactor = 1.0) {
    if (capitalGain <= 0) return 0;
    const cap0 = 96700 * cpiFactor;
    const cap15 = 600050 * cpiFactor;
    const start = Math.max(0, ordinaryTaxableIncome);
    const end = start + capitalGain;
    const gain0 = Math.max(0, Math.min(end, cap0) - Math.min(start, cap0));
    const gain15 = Math.max(0, Math.min(end, cap15) - Math.max(start, cap0));
    const gain20 = Math.max(0, end - Math.max(start, cap15));
    return (gain0 * 0.0) + (gain15 * 0.15) + (gain20 * 0.20);
  }

  /**
   * Net Investment Income Tax (NIIT 3.8% on MFJ > $250k statutory threshold)
   */
  function calcNiit(magi, netInvestmentIncome) {
    if (netInvestmentIncome <= 0) return 0;
    const excess = Math.max(0, magi - 250000);
    const niitBase = Math.min(netInvestmentIncome, excess);
    return niitBase * 0.038;
  }

  function runMultiAssetSimulation(opts = {}, customState) {
    const state = getState(customState);
    const a = state.assumptions || {};
    const retireAge = opts.retireAge !== undefined ? opts.retireAge : ((state.user && state.user.retireAge) || 52.0);
    const trimPct = opts.trimPct || 0;
    const isStochastic = !!opts.isStochastic;
    const zScores = opts.zScores || null;
    const applyGuardrails = !!opts.applyGuardrails;
    const displayReal = !!opts.displayReal;

    const buckets = opts.buckets || getAssetBuckets(state);
    let curCash = buckets.curCash;
    let curTaxable = buckets.curTaxable;
    let curPreTax = buckets.curPreTax;
    let curRoth = buckets.curRoth || 0;

    const baseSpend = (state.spending || []).reduce((s, x) => s + (x.actual2025 || 0), 0) || 65000;
    const discItems = (state.spending || []).filter(x => x.type === 'Discretionary');
    const totalDisc = discItems.length > 0 ? discItems.reduce((s, x) => s + (x.actual2025 || 0), 0) : 20000;
    const discTrimDollars = totalDisc * trimPct;

    const macro = a.macro || {};
    const incomes = a.incomes || {};
    const decadalDecay = a.decadalDecay || {};

    const enableRoth = opts.enableRothConversion !== undefined ? opts.enableRothConversion : (macro.enableRothConversion !== undefined ? macro.enableRothConversion : true);
    const glidePath = opts.glidePath !== undefined ? opts.glidePath : (a.glidePath || { enabled: false });
    const gpEnabled = !!glidePath.enabled;
    const gpOnset = glidePath.onsetAge !== undefined ? glidePath.onsetAge : 60.0;
    const gpTerminalAge = glidePath.terminalAge !== undefined ? glidePath.terminalAge : 75.0;
    const gpTerminalReturn = glidePath.terminalReturn !== undefined ? glidePath.terminalReturn : 0.055;

    const taxRate = macro.effectiveTax !== undefined ? macro.effectiveTax : 0.33;
    const cpi = macro.cpiInflation !== undefined ? macro.cpiInflation : 0.03;
    const healthCpi = macro.healthcareInflation !== undefined ? macro.healthcareInflation : 0.045;
    const effGoogTax = 0.24 * 0.75; // ~18% effective on gross sale of low-basis taxable stock

    // Compute asset-weighted expected returns from individual assets
    let wSumTaxable = 0, balTaxable = 0;
    let wSumPreTax = 0, balPreTax = 0;
    let wSumCash = 0, balCash = 0;
    let googExpectedReturn = 0.07;
    let googStartShares = 0;
    let googStartPrice = 100.00;
    let volGoog = 0.240;
    let volTaxable = 0.160;
    let volPreTax = 0.160;
    let volRoth = 0.160;
    let volCash = 0.010;

    (state.assets || []).forEach(ast => {
      const cls = ast.taxClassification;
      const b = ast.balance || 0;
      const isSingleStock = cls === 'Single Stock Equity' || (ast.name && (ast.name.toLowerCase().includes('company stock') || ast.name.toLowerCase().includes('single stock')));
      const isCash = cls === 'Cash / Other' || (ast.name && (ast.name.toLowerCase().includes('checking') || ast.name.toLowerCase().includes('savings')));
      const is529 = cls === 'Tax-Free 529' || (ast.name && ast.name.toLowerCase().includes('529'));
      const isIlliquid = cls === 'Illiquid';

      const r = ast.expectedReturn !== undefined ? ast.expectedReturn : (
        cls === 'Cash / Other' ? 0.04 :
        cls === 'Tax-Free 529' ? 0.065 :
        cls === 'Illiquid' ? 0.00 :
        0.070
      );

      const v = ast.volatility !== undefined ? ast.volatility : (
        isSingleStock ? 0.240 :
        cls === 'Taxable Equity' ? 0.160 :
        isCash ? 0.010 :
        is529 ? 0.120 :
        cls === 'Pre-Tax' ? 0.160 :
        isIlliquid ? 0.000 :
        0.160
      );

      if (isSingleStock) {
        googExpectedReturn = r;
        volGoog = v;
        if (ast.shares) googStartShares = ast.shares;
        if (ast.sharePrice) googStartPrice = ast.sharePrice;
      } else if (cls === 'Taxable Equity') {
        volTaxable = v;
      } else if (cls === 'Pre-Tax') {
        volPreTax = v;
      } else if (isCash) {
        volCash = v;
      }

      if (cls === 'Taxable Equity') {
        wSumTaxable += b * r;
        balTaxable += b;
      } else if (cls === 'Pre-Tax') {
        wSumPreTax += b * r;
        balPreTax += b;
      } else if (cls === 'Cash / Other') {
        wSumCash += b * r;
        balCash += b;
      }
    });

    const baseRateTaxable = balTaxable > 0 ? (wSumTaxable / balTaxable) : 0.070;
    const baseRatePreTax = balPreTax > 0 ? (wSumPreTax / balPreTax) : 0.070;
    const baseRateCash = balCash > 0 ? (wSumCash / balCash) : 0.030;

    const mortgageItem = (state.spending || []).find(x => x.category && x.category.toLowerCase().includes('mortgage'));
    const annualMortgage = mortgageItem ? (mortgageItem.actual2025 || 0) : 0;
    const fixedItems = (state.spending || []).filter(x => x.type === 'Fixed');
    const totalFixed = fixedItems.length > 0 ? fixedItems.reduce((s, x) => s + (x.actual2025 || 0), 0) : 45000;
    const fixedLivingBaseline = Math.max(0, totalFixed - annualMortgage);

    const startAge = (state.user && state.user.age !== undefined) ? Math.floor(state.user.age) : 30;
    const startYear = state.projectionStartYear || 2026;

    const rows = [];
    let peakNW = curCash + curTaxable + curPreTax + curRoth;
    let peakAge = startAge;
    let nwAtRetire = 0;
    let totalDisbursed = 0;
    let depletionAge = null;
    let curGoogShares = googStartShares;

    for (let age = startAge; age <= 100; age++) {
      const i = age - startAge;
      const currentYear = startYear + i;
      const isWorking = age < retireAge;
      const cpiFactor = Math.pow(1 + cpi, i);
      const healthFactor = Math.pow(1 + healthCpi, i);

      let rateCash = baseRateCash;
      let rateTaxable = baseRateTaxable;
      let ratePreTax = baseRatePreTax;

      // Asset Allocation Glide Path & Conservative Return Taper (Toggle 1)
      if (gpEnabled && age >= gpOnset) {
        let progress = 1.0;
        if (gpTerminalAge > gpOnset) {
          progress = Math.min(1.0, Math.max(0.0, (age - gpOnset) / (gpTerminalAge - gpOnset)));
        }
        rateTaxable = rateTaxable * (1 - progress) + gpTerminalReturn * progress;
        ratePreTax = ratePreTax * (1 - progress) + gpTerminalReturn * progress;
      }

      // Dynamic Per-Asset Portfolio Volatility (recalculated annually as GOOG divests and balances shift)
      const googPriceYear = googStartPrice * Math.pow(1 + googExpectedReturn, i);
      const bGoog = Math.min(curTaxable, Math.max(0, curGoogShares * googPriceYear));
      const bTaxOther = Math.max(0, curTaxable - bGoog);
      const bPreTax = Math.max(0, curPreTax);
      const bRoth = Math.max(0, curRoth);
      const bCash = Math.max(0, curCash);
      const totalInvestable = bGoog + bTaxOther + bPreTax + bRoth + bCash;

      let sigmaRaw = 0.140;
      if (totalInvestable > 0) {
        sigmaRaw = (bGoog * volGoog + bTaxOther * volTaxable + bPreTax * volPreTax + bRoth * volRoth + bCash * volCash) / totalInvestable;
      }

      // Couple dynamic portfolio volatility with Glide Path risk taper to 8.0% conservative target
      let sigmaEff = sigmaRaw;
      if (gpEnabled && age >= gpOnset) {
        let progress = 1.0;
        if (gpTerminalAge > gpOnset) {
          progress = Math.min(1.0, Math.max(0.0, (age - gpOnset) / (gpTerminalAge - gpOnset)));
        }
        sigmaEff = sigmaRaw * (1 - progress) + 0.080 * progress;
      }

      if (isStochastic && zScores && zScores[i] !== undefined) {
        const zShock = sigmaEff * zScores[i];
        rateTaxable = Math.max(0, rateTaxable + zShock);
        ratePreTax = Math.max(0, ratePreTax + zShock);
      }

      // RSU Grant & Share Calculation
      const rsuGrant = (a.rsuGrants || []).find(g => g.year === currentYear);
      let rsuAmt = 0;
      let netVestedShares = 0;

      if (rsuGrant) {
        if (rsuGrant.grossUnits !== undefined) {
          const withHold = rsuGrant.withholdingPct !== undefined ? rsuGrant.withholdingPct : 0.45;
          netVestedShares = rsuGrant.grossUnits * (1 - withHold);
          rsuAmt = netVestedShares * googPriceYear;
        } else {
          rsuAmt = rsuGrant.amount || 0;
          netVestedShares = googPriceYear > 0 ? (rsuAmt / googPriceYear) : 0;
        }
      }

      if (isWorking) {
        curGoogShares += netVestedShares;
      }

      const jIncome = isWorking ? ((incomes.jSalary !== undefined ? incomes.jSalary : 105000) * cpiFactor) : 0;
      const nIncome = (incomes.nSalary !== undefined ? incomes.nSalary : 0) * cpiFactor;
      const grossWages = jIncome + nIncome;

      let socialSecurity = 0;
      if (age >= (incomes.ssClaimAge || 67)) {
        const claimAge = incomes.ssClaimAge || 67;
        let delayedMultiplier = 1.0;
        if (claimAge > 67) delayedMultiplier += (claimAge - 67) * 0.08;
        else if (claimAge < 67) delayedMultiplier -= (67 - claimAge) * 0.0667;

        const baseSS = ((incomes.ssMonthly || 3500) * 12) * Math.max(0.5, delayedMultiplier) * (1 - (incomes.ssCutPct || 0.20));
        socialSecurity = baseSS * cpiFactor;
      }

      // Pre-retirement taxes on earned income (honors macro.effectiveTax slider)
      const effectiveTaxSlider = macro.effectiveTax !== undefined ? macro.effectiveTax : 0.33;
      const wageTax = isWorking ? (grossWages * effectiveTaxSlider) : 0;
      const fedWageTax = wageTax * 0.65;
      const caWageTax = wageTax * 0.25;
      const ficaTax = wageTax * 0.10;
      const postTaxInflow = (isWorking ? (grossWages - wageTax) : nIncome) + socialSecurity;
      const add401k = isWorking ? ((incomes.add401k !== undefined ? incomes.add401k : 12000) * cpiFactor) : 0;
      const addStock = isWorking ? rsuAmt : 0;

      let eventNet = 0;
      if (a.events && a.events.length > 0) {
        a.events.filter(e => e.year === currentYear).forEach(e => { eventNet += (e.amount || 0); });
      }

      let housing = annualMortgage;
      if (annualMortgage > 0 && currentYear >= 2052) {
        housing = (annualMortgage * 0.5) * Math.pow(1.02, i);
      }

      let decay = 1.00;
      if (age < 50) decay = 1.00;
      else if (age < 60) decay = decadalDecay.age50to59 !== undefined ? decadalDecay.age50to59 : 1.00;
      else if (age < 70) decay = decadalDecay.age60to69 !== undefined ? decadalDecay.age60to69 : 0.90;
      else if (age < 80) decay = decadalDecay.age70to79 !== undefined ? decadalDecay.age70to79 : 0.80;
      else decay = decadalDecay.age80to100 !== undefined ? decadalDecay.age80to100 : 0.65;

      const effectiveDisc = Math.max(0, totalDisc - discTrimDollars);
      const foodAndLiving = (fixedLivingBaseline + (effectiveDisc * decay)) * cpiFactor;

      const healthCost = isWorking ? 0 : (age < 65 ? (4000 * healthFactor) : (2000 * healthFactor));
      let activeSpend = housing + foodAndLiving + healthCost;

      if (applyGuardrails && isStochastic && zScores && zScores[i] < 0 && !isWorking) {
        const trimRate = (typeof window !== 'undefined' && window.lastRecommendedTrimPct) ? window.lastRecommendedTrimPct : 0.15;
        activeSpend = Math.max(30000 * cpiFactor, activeSpend - (totalDisc * trimRate * cpiFactor));
      }

      // Strategic Roth Conversion Ladder (between retirement and Age 70)
      let rothConverted = 0;
      let taxConversionFed = 0;
      let taxConversionCA = 0;
      let taxConversionTotal = 0;

      const baseOrdIncome = (isWorking ? (grossWages * 0.8) : nIncome) + (socialSecurity * 0.85);

      if (enableRoth && !isWorking && age < 70 && curPreTax > 0) {
        // Target filling the 12% federal tax bracket ($30,000 std deduction + $96,950 12% bracket cap)
        const targetCeiling = (30000 + 96950) * cpiFactor;
        const rothSpace = Math.max(0, targetCeiling - baseOrdIncome);
        rothConverted = Math.min(curPreTax, Math.round(rothSpace));

        if (rothConverted > 0) {
          const testOrdIncome = baseOrdIncome + rothConverted;
          taxConversionFed = calcFederalOrdinaryTax(testOrdIncome, cpiFactor) - calcFederalOrdinaryTax(baseOrdIncome, cpiFactor);
          taxConversionCA = calcCaliforniaTax(testOrdIncome, cpiFactor) - calcCaliforniaTax(baseOrdIncome, cpiFactor);
          taxConversionTotal = taxConversionFed + taxConversionCA;

          curPreTax -= rothConverted;
          curRoth += rothConverted;
        }
      }

      const netShortfall = Math.max(0, (activeSpend + taxConversionTotal) - postTaxInflow - eventNet);
      let remNet = netShortfall;

      // 4-Stage Liquidation Waterfall with Progressive Bracket-Aware Tax Engine & RMDs
      let dCash = 0;
      if (remNet > 0 && curCash > 0) {
        dCash = Math.min(curCash, remNet);
        remNet -= dCash;
      }

      let dTaxable = 0;
      let taxLtcgFed = 0;
      let taxLtcgCA = 0;
      let taxNiit = 0;
      let googSharesSold = 0;

      const gainRatio = Math.max(0.60, Math.min(0.95, (curTaxable - 500000) / (curTaxable || 1)));

      if (remNet > 0 && curTaxable > 0) {
        const baseOrd = baseOrdIncome + rothConverted;
        let g = remNet;
        for (let iter = 0; iter < 8; iter++) {
          const testG = Math.min(curTaxable, g);
          const cg = testG * gainRatio;
          const fed = calcFederalLtcgTax(baseOrd, cg, cpiFactor);
          const ca = calcCaliforniaTax(baseOrd + cg, cpiFactor) - calcCaliforniaTax(baseOrd, cpiFactor);
          const niit = calcNiit(baseOrd + cg, cg);
          const totalTax = fed + ca + niit;
          const netYield = testG - totalTax;
          const diff = remNet - netYield;
          if (Math.abs(diff) < 5 || (g >= curTaxable && netYield <= remNet)) {
            dTaxable = testG;
            taxLtcgFed = fed;
            taxLtcgCA = ca;
            taxNiit = niit;
            break;
          }
          const eff = testG > 0 ? (totalTax / testG) : 0.12;
          g += diff / Math.max(0.10, 1 - eff);
        }
        if (dTaxable === 0) {
          dTaxable = Math.min(curTaxable, g);
          const cg = dTaxable * gainRatio;
          taxLtcgFed = calcFederalLtcgTax(baseOrd, cg, cpiFactor);
          taxLtcgCA = calcCaliforniaTax(baseOrd + cg, cpiFactor) - calcCaliforniaTax(baseOrd, cpiFactor);
          taxNiit = calcNiit(baseOrd + cg, cg);
        }
        const netTaxableYield = dTaxable - (taxLtcgFed + taxLtcgCA + taxNiit);
        remNet = Math.max(0, remNet - netTaxableYield);

        if (dTaxable > 0 && curGoogShares > 0) {
          const googRatio = Math.min(1, Math.max(0.1, (curGoogShares * googPriceYear) / (curTaxable || 1)));
          const googSoldDollars = dTaxable * googRatio;
          googSharesSold = googPriceYear > 0 ? (googSoldDollars / googPriceYear) : 0;
          curGoogShares = Math.max(0, curGoogShares - googSharesSold);
        }
      }

      let dPreTax = 0;
      let taxPreTaxFed = 0;
      let taxPreTaxCA = 0;
      let rmdMandatory = 0;
      let excessRmdSwept = 0;

      // Required Minimum Distributions (RMDs) starting at Age 73
      const rmdFactor = age >= 73 ? (RMD_TABLE[age] || 6.4) : 0;
      if (rmdFactor > 0 && curPreTax > 0) {
        rmdMandatory = curPreTax / rmdFactor;
      }

      let grossPreTaxNeeded = 0;
      if (remNet > 0 && curPreTax > 0) {
        const baseOrd = (isWorking ? (grossWages * 0.8) : 0) + (socialSecurity * 0.85);
        let g = remNet;
        for (let iter = 0; iter < 8; iter++) {
          const testG = Math.min(curPreTax, g);
          const testOrd = baseOrd + testG;
          const fed = calcFederalOrdinaryTax(testOrd, cpiFactor) - calcFederalOrdinaryTax(baseOrd, cpiFactor);
          const ca = calcCaliforniaTax(testOrd, cpiFactor) - calcCaliforniaTax(baseOrd, cpiFactor);
          const totalTax = fed + ca;
          const netYield = testG - totalTax;
          const diff = remNet - netYield;
          if (Math.abs(diff) < 5 || (g >= curPreTax && netYield <= remNet)) {
            grossPreTaxNeeded = testG;
            break;
          }
          const eff = testG > 0 ? (totalTax / testG) : 0.25;
          g += diff / Math.max(0.10, 1 - eff);
        }
        if (grossPreTaxNeeded === 0) grossPreTaxNeeded = Math.min(curPreTax, g);
      }

      dPreTax = Math.min(curPreTax, Math.max(rmdMandatory, grossPreTaxNeeded));
      if (dPreTax > 0) {
        const baseOrd = (isWorking ? (grossWages * 0.8) : 0) + (socialSecurity * 0.85);
        const testOrd = baseOrd + dPreTax;
        taxPreTaxFed = calcFederalOrdinaryTax(testOrd, cpiFactor) - calcFederalOrdinaryTax(baseOrd, cpiFactor);
        taxPreTaxCA = calcCaliforniaTax(testOrd, cpiFactor) - calcCaliforniaTax(baseOrd, cpiFactor);
        const netPreTaxYield = dPreTax - (taxPreTaxFed + taxPreTaxCA);
        const neededForPreTax = remNet;
        remNet = Math.max(0, remNet - Math.min(remNet, netPreTaxYield));

        // Excess RMD cash reinvested in cash
        excessRmdSwept = Math.max(0, netPreTaxYield - neededForPreTax);
        if (excessRmdSwept > 0 && remNet === 0) {
          curCash += excessRmdSwept;
        }
      }

      let dRoth = 0;
      if (remNet > 0 && curRoth > 0) {
        dRoth = Math.min(curRoth, remNet);
        curRoth -= dRoth;
        remNet -= dRoth;
      }

      // Dynamic Cash Reserve Buffer & Automated Taxable Reinvestment
      // Maintain 2-year forward living spend reserve + 1-year estimated forward taxes in cash
      const currentYearTotalTax = wageTax + taxLtcgFed + taxLtcgCA + taxNiit + taxPreTaxFed + taxPreTaxCA + taxConversionTotal;
      const targetSpendReserve = 2 * activeSpend;
      const targetTaxReserve = currentYearTotalTax * (1 + cpi);
      const targetCashBuffer = Math.round(targetSpendReserve + targetTaxReserve);

      let excessCashPlowed = 0;
      // During working years, surplus net earnings are added to cash and swept to taxable brokerage
      if (isWorking) {
        const careerSurplus = Math.max(0, (postTaxInflow + eventNet) - (activeSpend + taxConversionTotal));
        if (careerSurplus > 0) {
          curCash += careerSurplus;
        }
      }

      // Plow any remaining cash above target reserve buffer back into taxable brokerage (curTaxable)
      if ((curCash - dCash) > targetCashBuffer) {
        excessCashPlowed = (curCash - dCash) - targetCashBuffer;
        curCash = targetCashBuffer + dCash;
        curTaxable += excessCashPlowed;
      }

      if (!isWorking) {
        totalDisbursed += (dCash + dTaxable + dPreTax + dRoth);
      }

      const currentTotalNW = curCash + curTaxable + curPreTax + curRoth;
      if (age === Math.floor(retireAge)) {
        nwAtRetire = currentTotalNW;
      }

      // Granular category breakdown for forecast ledger
      const categoryOutflows = {};
      (state.spending || []).forEach(item => {
        const base25 = item.actual2025 || 0;
        const isFixed = item.type === 'Fixed';
        let yrVal = base25 * cpiFactor;

        if (item.category && item.category.toLowerCase().includes('mortgage')) {
          yrVal = currentYear >= 2052 ? 0 : housing;
        } else if (item.category && item.category.toLowerCase().includes('healthcare')) {
          yrVal = healthCost;
        } else if (item.category && (item.category.toLowerCase().includes('childcare') || item.category.toLowerCase().includes('dependent care') || item.category.toLowerCase().includes('hendrix'))) {
          yrVal = currentYear > 2035 ? 0 : yrVal;
        } else if (!isFixed) {
          yrVal = Math.max(0, yrVal * (1 - trimPct) * decay);
        }
        categoryOutflows[item.category] = Math.round(yrVal);
      });

      // Granular asset balances for forecast ledger
      const assetBalances = {};
      (state.assets || []).forEach(ast => {
        const cls = ast.taxClassification;
        let bal = 0;
        if (cls === 'Cash / Other') {
          bal = buckets.curCash > 0 ? (ast.balance / buckets.curCash) * curCash : curCash;
        } else if (cls === 'Taxable Equity') {
          bal = buckets.curTaxable > 0 ? (ast.balance / buckets.curTaxable) * curTaxable : curTaxable;
        } else if (cls === 'Pre-Tax') {
          bal = buckets.curPreTax > 0 ? (ast.balance / buckets.curPreTax) * curPreTax : curPreTax;
        } else if (cls === 'Tax-Free 529') {
          if (currentYear <= 2035) {
            const yrOffset = currentYear - startYear;
            const r = 0.065;
            bal = (ast.balance || 18924) * Math.pow(1 + r, yrOffset) + (500 * 12) * ((Math.pow(1 + r, yrOffset) - 1) / r);
          } else {
            bal = 0;
          }
        } else {
          bal = ast.balance || 0;
        }
        assetBalances[ast.id] = Math.round(bal);
      });

      const displayNW = displayReal ? Math.round(currentTotalNW / cpiFactor) : Math.round(currentTotalNW);
      rows.push({
        age,
        year: currentYear,
        isWorking,
        netWorth: displayNW,
        rawNW: currentTotalNW,
        portfolioVolatility: parseFloat((sigmaEff * 100).toFixed(1)),
        curCash: Math.round(curCash),
        targetCashBuffer: Math.round(targetCashBuffer),
        excessCashPlowed: Math.round(excessCashPlowed),
        curTaxable: Math.round(curTaxable),
        curPreTax: Math.round(curPreTax),
        curRoth: Math.round(curRoth),
        rothConverted: Math.round(rothConverted),
        taxConversionFed: Math.round(taxConversionFed),
        taxConversionCA: Math.round(taxConversionCA),
        taxConversionTotal: Math.round(taxConversionTotal),
        activeSpend: Math.round(activeSpend),
        postTaxInflow: Math.round(postTaxInflow),
        jSalary: Math.round(jIncome),
        nSalary: Math.round(nIncome),
        rsuAmt: Math.round(addStock),
        googShares: Math.round(curGoogShares),
        googPrice: parseFloat(googPriceYear.toFixed(2)),
        netVestedShares: Math.round(netVestedShares),
        socialSecurity: Math.round(socialSecurity),
        add401k: Math.round(add401k),
        eventNet: Math.round(eventNet),
        totalInflows: Math.round(postTaxInflow + add401k + addStock + eventNet),
        mortgage: Math.round(housing),
        foodAndLiving: Math.round(foodAndLiving),
        healthCost: Math.round(healthCost),
        totalOutflows: Math.round(activeSpend),
        netCashFlow: Math.round(postTaxInflow + eventNet - activeSpend),
        dCash: Math.round(dCash),
        dTaxable: Math.round(dTaxable),
        dTaxableGross: Math.round(dTaxable),
        dTaxableNet: Math.round(dTaxable - (taxLtcgFed + taxLtcgCA + taxNiit)),
        googSharesSold: Math.round(googSharesSold),
        dPreTax: Math.round(dPreTax),
        dPreTaxGross: Math.round(dPreTax),
        dPreTaxNet: Math.round(dPreTax - (taxPreTaxFed + taxPreTaxCA)),
        dRoth: Math.round(dRoth),
        rmdAmount: Math.round(rmdMandatory),
        totalDisbursedYear: Math.round(dCash + dTaxable + dPreTax + dRoth),
        totalGrossDisbursed: Math.round(dCash + dTaxable + dPreTax + dRoth),
        totalNetDisbursed: Math.round(dCash + (dTaxable - (taxLtcgFed + taxLtcgCA + taxNiit)) + (dPreTax - (taxPreTaxFed + taxPreTaxCA)) + dRoth),
        taxOrdinaryFed: Math.round(fedWageTax + taxPreTaxFed + taxConversionFed),
        taxOrdinaryCA: Math.round(caWageTax + taxPreTaxCA + taxConversionCA),
        taxLtcgFed: Math.round(taxLtcgFed),
        taxLtcgCA: Math.round(taxLtcgCA),
        taxNiit: Math.round(taxNiit),
        taxFica: Math.round(ficaTax),
        totalTaxesPaidYear: Math.round(wageTax + taxLtcgFed + taxLtcgCA + taxNiit + taxPreTaxFed + taxPreTaxCA + taxConversionTotal),
        effectiveTaxRateYear: (grossWages + socialSecurity + dTaxable + dPreTax + rothConverted + eventNet) > 0 ? 
          ((wageTax + taxLtcgFed + taxLtcgCA + taxNiit + taxPreTaxFed + taxPreTaxCA + taxConversionTotal) / (grossWages + socialSecurity + dTaxable + dPreTax + rothConverted + eventNet)) : 0,
        reconciledVariance: isWorking ?
          Math.round(Math.max(0, (postTaxInflow + eventNet) - activeSpend) > 0 ? 0 : ((postTaxInflow + eventNet + dCash + (dTaxable - (taxLtcgFed + taxLtcgCA + taxNiit)) + (dPreTax - (taxPreTaxFed + taxPreTaxCA)) + dRoth) - (activeSpend + taxConversionTotal))) :
          Math.round((postTaxInflow + eventNet + dCash + (dTaxable - (taxLtcgFed + taxLtcgCA + taxNiit)) + (dPreTax - (taxPreTaxFed + taxPreTaxCA)) + dRoth) - (activeSpend + taxConversionTotal + excessRmdSwept)),
        shortfall: Math.round(remNet),
        categoryOutflows,
        assetBalances
      });

      if (displayNW > peakNW) {
        peakNW = displayNW;
        peakAge = age;
      }

      if ((currentTotalNW <= 0 || remNet > 500) && depletionAge === null) {
        depletionAge = age;
      }

      curCash = Math.max(0, (curCash - dCash) * (1 + rateCash));
      curTaxable = Math.max(0, (curTaxable + addStock - dTaxable) * (1 + rateTaxable));
      curPreTax = Math.max(0, (curPreTax + add401k - dPreTax) * (1 + ratePreTax));
      curRoth = Math.max(0, curRoth * (1 + ratePreTax));
    }

    if (nwAtRetire === 0 && rows.length > 0) {
      nwAtRetire = rows[Math.min(rows.length - 1, Math.max(0, Math.round(retireAge - startAge)))].rawNW;
    }

    const terminalNW = rows[rows.length - 1].netWorth;
    const terminalRawNW = rows[rows.length - 1].rawNW;

    return {
      rows,
      nwAtRetire,
      terminalNW,
      terminalRawNW,
      peakNW,
      peakAge,
      totalDisbursed,
      depletionAge
    };
  }

  function calculateEarliestFireAge(trimPct = 0, customState) {
    const state = getState(customState);
    for (let testAge = 45.0; testAge <= 65.0; testAge += 0.5) {
      const res = runMultiAssetSimulation({ retireAge: testAge, trimPct }, state);
      if (res.terminalRawNW > 0 && res.depletionAge === null) {
        return testAge;
      }
    }
    return 65.0;
  }

  /**
   * Generates 1,000 Monte Carlo runs and extracts representative simulation runs
   * for the 10th, 25th, 50th, 75th, and 90th terminal wealth percentiles.
   */
  function generateRepresentativePercentileRuns(customState) {
    const state = getState(customState);
    const userRetireAge = (state.user && state.user.retireAge !== undefined) ? state.user.retireAge : 52.0;
    const N = 1000;
    const allRuns = [];

    for (let i = 0; i < N; i++) {
      const zScores = [];
      for (let y = 0; y <= 57; y++) {
        const u1 = Math.random() || 0.0001;
        const u2 = Math.random() || 0.0001;
        zScores.push(Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2));
      }

      const sim = runMultiAssetSimulation({
        retireAge: userRetireAge,
        trimPct: 0,
        isStochastic: true,
        zScores
      }, state);

      const row100 = sim.rows[sim.rows.length - 1];
      const terminalNW = row100 ? row100.rawNW : 0;
      allRuns.push({ sim, terminalNW });
    }

    allRuns.sort((a, b) => a.terminalNW - b.terminalNW);
    return {
      p10: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.10))].sim,
      p25: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.25))].sim,
      p50: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.50))].sim,
      p75: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.75))].sim,
      p90: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.90))].sim
    };
  }

  /**
   * Builds an immutable, comprehensive CSV archive capturing all active model parameters,
   * growth assumptions, and the full 58-year Forecast Ledger across 5 stacked percentiles.
   */
  function buildForecastArchiveCSVText(customState, customRuns) {
    const state = getState(customState);
    const runs = customRuns || generateRepresentativePercentileRuns(state);

    const a = state.assumptions || {};
    const macro = a.macro || {};
    const incomes = a.incomes || {};
    const glidePath = a.glidePath || {};
    const user = state.user || {};

    const snapshotDate = state.latestSnapshotDate || '2025-12-31';
    const birthDate = user.birthDate || '1982-11-26';
    const ageNow = user.age !== undefined ? user.age : 43.1;
    const retireAge = user.retireAge !== undefined ? user.retireAge : 52.0;

    const assets = state.assets || [];
    const baselineNW = assets.reduce((s, x) => s + (x.balance || 0), 0);
    const spending = state.spending || [];
    const baselineSpend = spending.reduce((s, x) => s + (x.actual2025 || 0), 0);
    const fixedSpend = spending.filter(x => x.type === 'Fixed').reduce((s, x) => s + (x.actual2025 || 0), 0);
    const discSpend = spending.filter(x => x.type === 'Discretionary').reduce((s, x) => s + (x.actual2025 || 0), 0);

    const rsuGrants = a.rsuGrants || [];
    const totalRsu = rsuGrants.reduce((s, x) => s + (x.amount || 0), 0);

    const cpi = macro.cpiInflation !== undefined ? (macro.cpiInflation * 100).toFixed(1) + '%' : '3.0%';
    const effTax = macro.effectiveTax !== undefined ? (macro.effectiveTax * 100).toFixed(1) + '%' : '33.0%';

    const assetSummary = assets.map(x => `${x.name || x.id} ($${Math.round((x.balance || 0)/1000)}k, ${(x.volatility !== undefined ? (x.volatility * 100).toFixed(1) : '16.0')}% vol)`).join('; ');

    const gpStr = glidePath.enabled ?
      `Enabled (Onset: Age ${glidePath.onsetAge || 60}, Terminal: Age ${glidePath.terminalAge || 75}, Terminal Return: ${((glidePath.terminalReturn || 0.055)*100).toFixed(1)}%, Terminal Vol: 8.0%)` :
      'Disabled';

    const rothStr = (macro.enableRothConversion !== false) ? 'Enabled (Age 52-70, 12% Fed Bracket Cap)' : 'Disabled';

    const timestamp = (typeof Date !== 'undefined') ? new Date().toISOString() : '2026-09-25';

    // 1. Metadata Comment Block
    const lines = [
      '# ============================================================================== ',
      '# FINANCIAL PLANNER - ANNUAL FORECAST & ASSUMPTIONS ARCHIVE',
      '# ==============================================================================',
      `# Snapshot Date: ${snapshotDate}`,
      `# Archive Export Timestamp: ${timestamp}`,
      `# User Birth Date: ${birthDate} (Age ${ageNow} at snapshot)`,
      `# Baseline Net Worth: $${Math.round(baselineNW).toLocaleString()}`,
      `# Target Retirement Age: ${retireAge.toFixed(1)}`,
      '# ------------------------------------------------------------------------------',
      '# INCOMES & EARNINGS:',
      `# Primary Salary: $${(incomes.jSalary || 105000).toLocaleString()} | Secondary Salary: $${(incomes.nSalary || 0).toLocaleString()} | Annual 401(k) Addition: $${(incomes.add401k || 12000).toLocaleString()}`,
      `# Social Security: $${(incomes.ssMonthly || 2200).toLocaleString()}/mo claimed at Age ${incomes.ssClaimAge || 67} (${((incomes.ssCutPct || 0.20)*100).toFixed(0)}% statutory haircut)`,
      `# Equity Grants Total: $${Math.round(totalRsu).toLocaleString()} (${rsuGrants.length} tranches scheduled)`,
      '# ------------------------------------------------------------------------------',
      '# SPENDING BASELINE (2025 Actuals):',
      `# Total Annual Living Spend: $${Math.round(baselineSpend).toLocaleString()} (Fixed: $${Math.round(fixedSpend).toLocaleString()} | Discretionary: $${Math.round(discSpend).toLocaleString()})`,
      '# ------------------------------------------------------------------------------',
      '# MACRO & PLANNING PARAMETERS:',
      `# CPI Inflation: ${cpi} | Effective Wage Tax: ${effTax}`,
      `# Asset Allocation Glide Path: ${gpStr}`,
      `# Strategic Roth Conversion Ladder: ${rothStr}`,
      '# Liquidity Reserve Management: 2-Year Living Expense Reserve + 1-Year Forward Tax Reserve',
      '# Surplus Reinvestment Policy: Auto-Reinvested into Individual Brokerage Account (curTaxable)',
      `# Assets & Risk Breakdown: ${assetSummary}`,
      '# =============================================================================='
    ];

    // 2. CSV Column Headers
    const headers = [
      'Percentile',
      'Age',
      'Year',
      'Status',
      'EOY Net Worth',
      'Total Liquid Assets',
      'Cash Reserves',
      'Surplus Reinvested to Taxable',
      'Portfolio Volatility',
      'Taxable Accounts',
      'Pre-Tax Accounts',
      'Roth Bucket',
      'College Savings (529)',
      'Active Living Spend',
      'Total Inflows',
      'Total Gross Disbursed',
      'Total Net Disbursed',
      'RMD Mandatory',
      'Federal Ordinary Tax',
      'California Ordinary Tax',
      'Federal LTCG Tax',
      'California LTCG Tax',
      'NIIT',
      'Total Taxes Paid',
      'Effective Tax Rate',
      'Reconciled Variance'
    ];
    lines.push(headers.join(','));

    // 3. Stacked Percentile Runs
    const pOrder = [
      { key: 'p50', label: '50th Percentile (Median)' },
      { key: 'p25', label: '25th Percentile (Conservative)' },
      { key: 'p10', label: '10th Percentile (Stress Test)' },
      { key: 'p75', label: '75th Percentile (Optimistic)' },
      { key: 'p90', label: '90th Percentile (Bull Market)' }
    ];

    pOrder.forEach(pItem => {
      const sim = runs[pItem.key] || runs.p50;
      if (!sim || !sim.rows) return;

      sim.rows.forEach(r => {
        const liquid = (r.curCash || 0) + (r.curTaxable || 0) + (r.curPreTax || 0) + (r.curRoth || 0);
        const effVol = (r.portfolioVolatility !== undefined ? r.portfolioVolatility.toFixed(1) : '16.0') + '%';
        const effTaxYear = (r.effectiveTaxRateYear !== undefined ? (r.effectiveTaxRateYear * 100).toFixed(1) : '0.0') + '%';
        const b529 = (r.assetBalances && r.assetBalances['asset-5'] !== undefined) ? r.assetBalances['asset-5'] : 0;
        const status = r.isWorking ? 'Working' : 'Retired';

        const rowValues = [
          `"${pItem.label}"`,
          r.age,
          r.year,
          `"${status}"`,
          r.netWorth || 0,
          liquid,
          r.curCash || 0,
          r.excessCashPlowed || 0,
          `"${effVol}"`,
          r.curTaxable || 0,
          r.curPreTax || 0,
          r.curRoth || 0,
          b529,
          r.activeSpend || 0,
          r.totalInflows || r.postTaxInflow || 0,
          r.totalGrossDisbursed || 0,
          r.totalNetDisbursed || 0,
          r.rmdAmount || 0,
          r.taxOrdinaryFed || 0,
          r.taxOrdinaryCA || 0,
          r.taxLtcgFed || 0,
          r.taxLtcgCA || 0,
          r.taxNiit || 0,
          r.totalTaxesPaidYear || 0,
          `"${effTaxYear}"`,
          r.reconciledVariance || 0
        ];
        lines.push(rowValues.join(','));
      });
    });

    return lines.join('\n');
  }

  return {
    getAssetBuckets,
    runMultiAssetSimulation,
    calculateEarliestFireAge,
    calculateEarliestRetirementAge: calculateEarliestFireAge,
    generateRepresentativePercentileRuns,
    buildForecastArchiveCSVText,
    RMD_TABLE,
    calcFederalOrdinaryTax,
    calcCaliforniaTax,
    calcFederalLtcgTax,
    calcNiit
  };
}));
