/**
 * ============================================================================
 * Financial Planner v4.0 - Public Demo Edition (demo/src/store.js)
 * Component: Store, Session State Management & Synthetic Ingestion
 * ============================================================================
 * Clean, anonymized public demo edition for interactive wealth simulation.
 *
 * Privacy & Session Guarantee:
 * 1. ZERO personal data or employer records.
 * 2. Session-Only Storage: State persists in sessionStorage and is completely
 *    wiped the moment the user closes the browser tab or window.
 * 3. 100% In-Browser Execution: Zero network transmission of financial figures.
 * ============================================================================
 */
(function (root) {
  'use strict';

  const SCHEMA_VERSION = 1;
  const STORAGE_KEY = 'financial_planner_session_state';

  function getSessionStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('__test_storage__', '1');
        window.sessionStorage.removeItem('__test_storage__');
        return window.sessionStorage;
      }
    } catch (e) {}
    return null;
  }

  function getDefaultDemoState() {
    return {
      user: {
        birthDate: '1995-11-26',
        age: 30.1,
        retireAge: 60.0
      },
      latestSnapshotDate: '2025-12-31',
      latestSnapshotYear: 2025,
      projectionStartYear: 2026,
      collegeGoal: { balance: 0, monthlyContribution: 0, expectedReturn: 0.065, targetCost: 100000, horizonYears: 18 },
      assets: [],
      historicalSnapshots: [],
      spending: [],
      spendingAnnotations: {},
      actionChecklist: {
        'task-emergency-fund': { completed: true, completedAt: '2025-12-31' },
        'task-401k-match': { completed: true, completedAt: '2025-12-31' },
        'task-roth-ira': { completed: false, completedAt: null },
        'task-auto-invest': { completed: false, completedAt: null }
      },
      forecastLedgerView: {
        selectedPercentile: 'p50',
        expandedSections: { assets: true, inflows: true, outflows: false }
      },
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
  }

  // Master State Store
  root.appState = getDefaultDemoState();

  function loadDataFromCSV() {
    // 1. Process Assets History Event Ledger
    if (root.RAW_CSV_ASSETS && typeof Papa !== 'undefined') {
      const parsedAssets = Papa.parse(root.RAW_CSV_ASSETS.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (parsedAssets.data && parsedAssets.data.length > 0) {
        processAssetHistoryRows(parsedAssets.data);
      }
    }

    // 2. Process Spending History Event Ledger
    if (root.RAW_CSV_SPENDING && typeof Papa !== 'undefined') {
      const parsedSpending = Papa.parse(root.RAW_CSV_SPENDING.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (parsedSpending.data && parsedSpending.data.length > 0) {
        processSpendingHistoryRows(parsedSpending.data);
      }
    }
  }

  function processAssetHistoryRows(rows) {
    const validRows = rows.filter(r => r.snapshot_date && r.asset_id).sort((a, b) => {
      return (a.snapshot_date || '').toString().localeCompare((b.snapshot_date || '').toString());
    });

    const snapshotsMap = {};
    validRows.forEach(r => {
      const d = r.snapshot_date.toString().trim();
      const year = parseInt(d.split('-')[0]) || 2025;
      if (!snapshotsMap[d]) {
        snapshotsMap[d] = {
          date: d,
          year: year,
          label: `${year}`,
          balances: {}
        };
      }
      snapshotsMap[d].balances[r.asset_id] = parseFloat(r.balance) || 0;
    });
    root.appState.historicalSnapshots = Object.values(snapshotsMap);

    const latestPerAsset = {};
    validRows.forEach(r => {
      latestPerAsset[r.asset_id] = r;
    });

    root.appState.assets = Object.values(latestPerAsset).map(r => {
      const isCash = r.tax_classification === 'Cash / Other' || (r.name && (r.name.toLowerCase().includes('checking') || r.name.toLowerCase().includes('savings')));
      const is529 = r.tax_classification === 'Tax-Free 529';
      const isIlliquid = r.tax_classification === 'Illiquid';

      // Benchmark Market Rates for Demo:
      // Cash: 0.5% (checking) or 4.0% (HYSA)
      // Broad Market Index / 401k / Roth / Taxable Brokerage: 7.0%
      let defReturn = 0.070;
      if (isCash) {
        defReturn = (r.name && r.name.toLowerCase().includes('checking')) ? 0.005 : 0.040;
      } else if (is529) {
        defReturn = 0.065;
      } else if (isIlliquid) {
        defReturn = 0.00;
      }

      let defVol = 0.160; // 16.0% default broad market volatility
      if (isCash) {
        defVol = 0.010; // 1.0% cash volatility
      } else if (is529) {
        defVol = 0.120;
      } else if (isIlliquid) {
        defVol = 0.000;
      }

      const assetObj = {
        id: r.asset_id,
        name: r.name,
        institution: r.institution,
        taxClassification: r.tax_classification,
        balance: parseFloat(r.balance) || 0,
        costBasis: parseFloat(r.cost_basis) || 0,
        priority: r.priority || 'Ineligible',
        cagr5Y: null,
        expectedReturn: defReturn,
        volatility: defVol
      };

      return assetObj;
    });

    // Dynamic Snapshot Anchoring: bind projection start to max(snapshot_date)
    const dates = Object.keys(snapshotsMap).sort();
    if (dates.length > 0) {
      const maxDate = dates[dates.length - 1];
      const maxYear = parseInt(maxDate.split('-')[0]);
      root.appState.latestSnapshotDate = maxDate;
      root.appState.latestSnapshotYear = maxYear;
      root.appState.projectionStartYear = maxYear + 1; // 2026

      if (root.appState.user && root.appState.user.birthDate) {
        const b = new Date(root.appState.user.birthDate);
        const anchor = new Date(maxDate);
        const diffYears = (anchor - b) / (365.2425 * 24 * 3600 * 1000);
        root.appState.user.age = parseFloat(diffYears.toFixed(1));
      }
    }

    recalculateAllAssetCAGRs();
  }

  function processSpendingHistoryRows(rows) {
    const catMap = {};
    rows.filter(r => r.category).forEach(r => {
      const cat = r.category.toString().trim();
      if (!catMap[cat]) {
        catMap[cat] = {
          category: cat,
          group: r.group || 'General',
          type: r.type || 'Fixed',
          notes: r.notes || '',
          actual2023: 0,
          actual2024: 0,
          actual2025: 0
        };
      }
      const period = parseInt(r.snapshot_period);
      const amt = parseFloat(r.amount) || 0;
      if (period === 2023) catMap[cat].actual2023 = amt;
      if (period === 2024) catMap[cat].actual2024 = amt;
      if (period === 2025) catMap[cat].actual2025 = amt;
    });

    root.appState.spending = Object.values(catMap);
  }

  function recalculateAllAssetCAGRs() {
    const snapshots = root.appState.historicalSnapshots || [];
    if (snapshots.length < 2) return;

    const sortedSnaps = [...snapshots].sort((a, b) => {
      const dateA = a.date || (a.year + '-12-31');
      const dateB = b.date || (b.year + '-12-31');
      return dateA.localeCompare(dateB);
    });

    const latest = sortedSnaps[sortedSnaps.length - 1];
    const latestYear = parseInt((latest.date || (latest.year + '-12-31')).split('-')[0]);

    root.appState.assets.forEach(asset => {
      let baseline = null;
      for (let i = sortedSnaps.length - 1; i >= 0; i--) {
        const snap = sortedSnaps[i];
        const snapYear = parseInt((snap.date || (snap.year + '-12-31')).split('-')[0]);
        if (latestYear - snapYear >= 2) {
          baseline = snap;
          break;
        }
      }
      if (!baseline && sortedSnaps.length > 0) {
        baseline = sortedSnaps[0];
      }
      if (baseline && baseline !== latest) {
        const baseYear = parseInt((baseline.date || (baseline.year + '-12-31')).split('-')[0]);
        const yearsDiff = latestYear - baseYear;
        if (yearsDiff >= 1) {
          const startVal = baseline.balances ? (baseline.balances[asset.id] || 0) : 0;
          const endVal = asset.balance;
          if (startVal > 0 && endVal > 0) {
            const cagr = (Math.pow(endVal / startVal, 1 / yearsDiff) - 1) * 100;
            asset.cagr5Y = parseFloat(cagr.toFixed(1));
          }
        }
      }
    });
  }

  // Load from sessionStorage (User edits within this browser session)
  function loadSavedState() {
    const storage = getSessionStorage();
    if (!storage) return;

    const saved = storage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion < SCHEMA_VERSION) {
          storage.removeItem(STORAGE_KEY);
          return;
        }

        if (parsed.user) {
          root.appState.user = { ...root.appState.user, ...parsed.user };
        }
        if (parsed.assets && parsed.assets.length > 0) {
          const defMap = {};
          (root.appState.assets || []).forEach(a => { defMap[a.id] = a; });
          root.appState.assets = parsed.assets.map(savedAsset => {
            const def = defMap[savedAsset.id] || {};
            return {
              ...def,
              ...savedAsset,
              expectedReturn: (savedAsset.expectedReturn !== undefined && savedAsset.expectedReturn !== null) ? savedAsset.expectedReturn : (def.expectedReturn !== undefined ? def.expectedReturn : 0.070),
              volatility: (savedAsset.volatility !== undefined && savedAsset.volatility !== null) ? savedAsset.volatility : (def.volatility !== undefined ? def.volatility : 0.160)
            };
          });
        }
        if (parsed.spending && parsed.spending.length > 0) {
          const csvMap = {};
          (root.appState.spending || []).forEach(item => {
            csvMap[item.category] = item;
          });
          root.appState.spending = parsed.spending.map(savedItem => {
            const csvItem = csvMap[savedItem.category];
            if (!csvItem) return savedItem;
            return {
              ...savedItem,
              notes: savedItem.notes || csvItem.notes || '',
              group: csvItem.group || savedItem.group,
              actual2023: csvItem.actual2023 || 0,
              actual2024: (savedItem.actual2024 !== undefined && savedItem.actual2024 !== null) ? savedItem.actual2024 : (csvItem.actual2024 || 0),
              actual2025: (savedItem.actual2025 !== undefined && savedItem.actual2025 !== null) ? savedItem.actual2025 : (csvItem.actual2025 || 0),
            };
          });
        }
        if (parsed.spendingAnnotations) {
          root.appState.spendingAnnotations = parsed.spendingAnnotations;
        }
        if (parsed.actionChecklist) {
          root.appState.actionChecklist = parsed.actionChecklist;
        }
        if (parsed.forecastLedgerView) {
          root.appState.forecastLedgerView = { ...root.appState.forecastLedgerView, ...parsed.forecastLedgerView };
        }
        if (parsed.assumptions) {
          root.appState.assumptions = {
            ...root.appState.assumptions,
            ...parsed.assumptions,
            incomes: { ...root.appState.assumptions.incomes, ...(parsed.assumptions.incomes || {}) },
            decadalDecay: { ...root.appState.assumptions.decadalDecay, ...(parsed.assumptions.decadalDecay || {}) },
            macro: { ...root.appState.assumptions.macro, ...(parsed.assumptions.macro || {}) },
            glidePath: { ...root.appState.assumptions.glidePath, ...(parsed.assumptions.glidePath || {}) },
            rsuGrants: parsed.assumptions.rsuGrants || root.appState.assumptions.rsuGrants,
            events: parsed.assumptions.events || root.appState.assumptions.events
          };
        }
      } catch (e) {
        console.error('[Session Storage] Error restoring state:', e);
      }
    }
  }

  // Save to sessionStorage
  function saveState() {
    const storage = getSessionStorage();
    if (!storage) return;

    try {
      const payload = {
        schemaVersion: SCHEMA_VERSION,
        user: root.appState.user,
        assets: root.appState.assets,
        spending: root.appState.spending,
        spendingAnnotations: root.appState.spendingAnnotations,
        actionChecklist: root.appState.actionChecklist,
        forecastLedgerView: root.appState.forecastLedgerView,
        assumptions: root.appState.assumptions
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[Session Storage] Save failed (quota or disabled):', e);
    }
  }

  function getSpendingAnnotations(category) {
    if (!root.appState.spendingAnnotations) return {};
    return root.appState.spendingAnnotations[category] || {};
  }

  function setSpendingAnnotation(category, year, text) {
    if (!root.appState.spendingAnnotations) {
      root.appState.spendingAnnotations = {};
    }
    if (!root.appState.spendingAnnotations[category]) {
      root.appState.spendingAnnotations[category] = {};
    }
    if (text && text.trim().length > 0) {
      root.appState.spendingAnnotations[category][year] = text.trim();
    } else {
      delete root.appState.spendingAnnotations[category][year];
    }
    saveState();
  }

  function getAllSpendingAnnotations() {
    return root.appState.spendingAnnotations || {};
  }

  function getAvailableSpendingYears() {
    return [2023, 2024, 2025];
  }

  function getHistoricalSpendingSeries(category) {
    const item = (root.appState.spending || []).find(s => s.category === category);
    if (!item) return [];
    return [
      { year: 2023, amount: item.actual2023 || 0 },
      { year: 2024, amount: item.actual2024 || 0 },
      { year: 2025, amount: item.actual2025 || 0 }
    ];
  }

  function resetToDefaults() {
    const storage = getSessionStorage();
    if (storage) {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
    root.appState = getDefaultDemoState();
    loadDataFromCSV();
    if (typeof window !== 'undefined') {
      if (typeof root.renderAll === 'function') {
        root.renderAll();
      } else if (typeof window.location !== 'undefined') {
        window.location.reload();
      }
    }
  }

  async function saveToDisk() {
    const exportPayload = {
      schemaVersion: SCHEMA_VERSION,
      ...root.appState
    };
    const exportData = JSON.stringify(exportPayload, null, 2);
    if ('showSaveFilePicker' in root) {
      try {
        const handle = await root.showSaveFilePicker({
          suggestedName: 'financial_plan_state.json',
          types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(exportData);
        await writable.close();
        alert('Saved successfully to disk!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
    }
    // Fallback
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_plan_state.json';
    a.click();
  }

  function getPortfolioWeightedReturn(customState) {
    const assets = (customState || root.appState).assets || [];
    let totalBal = 0;
    let weightedSum = 0;
    assets.forEach(a => {
      const b = a.balance || 0;
      const r = a.expectedReturn !== undefined ? a.expectedReturn : (
        a.taxClassification === 'Cash / Other' ? 0.03 :
        a.taxClassification === 'Tax-Free 529' ? 0.065 :
        a.taxClassification === 'Illiquid' ? 0.00 :
        0.070
      );
      if (b > 0) {
        totalBal += b;
        weightedSum += b * r;
      }
    });
    return totalBal > 0 ? (weightedSum / totalBal) : 0.070;
  }

  function getPortfolioWeightedVolatility(customState) {
    const assets = (customState || root.appState).assets || [];
    let totalBal = 0;
    let weightedSum = 0;
    assets.forEach(a => {
      const b = a.balance || 0;
      const isCash = a.taxClassification === 'Cash / Other' || (a.name && (a.name.toLowerCase().includes('checking') || a.name.toLowerCase().includes('savings')));
      const isIlliquid = a.taxClassification === 'Illiquid';
      const v = a.volatility !== undefined ? a.volatility : (
        isCash ? 0.010 :
        isIlliquid ? 0.000 :
        0.160
      );
      if (b > 0 && !isIlliquid) {
        totalBal += b;
        weightedSum += b * v;
      }
    });
    return totalBal > 0 ? (weightedSum / totalBal) : 0.160;
  }

  // Export to global scope
  root.SCHEMA_VERSION = SCHEMA_VERSION;
  root.STORAGE_KEY = STORAGE_KEY;
  root.getDefaultDemoState = getDefaultDemoState;
  root.getPortfolioWeightedReturn = getPortfolioWeightedReturn;
  root.getPortfolioWeightedVolatility = getPortfolioWeightedVolatility;
  root.loadDataFromCSV = loadDataFromCSV;
  root.processAssetHistoryRows = processAssetHistoryRows;
  root.processSpendingHistoryRows = processSpendingHistoryRows;
  root.recalculateAllAssetCAGRs = recalculateAllAssetCAGRs;
  root.loadSavedState = loadSavedState;
  root.saveState = saveState;
  root.getSpendingAnnotations = getSpendingAnnotations;
  root.setSpendingAnnotation = setSpendingAnnotation;
  root.getAllSpendingAnnotations = getAllSpendingAnnotations;
  root.getAvailableSpendingYears = getAvailableSpendingYears;
  root.getHistoricalSpendingSeries = getHistoricalSpendingSeries;
  root.resetToDefaults = resetToDefaults;
  root.saveToDisk = saveToDisk;

})(typeof window !== 'undefined' ? window : globalThis);
