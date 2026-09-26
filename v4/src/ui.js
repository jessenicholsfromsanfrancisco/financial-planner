/**
 * ============================================================================
 * Financial Planner Demo Edition (demo/src/ui.js)
 * Component: UI Controllers, Chart.js Visualizations & Interactions
 * ============================================================================
 * Elephant Memory & Architectural Anchor: ../GOLDEN_PLAN.md
 * Master PRD & Feature Checklist:         ../PRD_FEATURE_MATRIX.md
 * Technical System Design:                ../TECHNICAL_DESIGN_SPEC.md
 *
 * Core Features Handled:
 * 1. 23-Category Annual Spending Table with live Fixed/Discretionary toggles.
 * 2. Multi-series Historical Asset Growth Chart with dual-thumb 5-year slider.
 * 3. Reactive Net Worth Trajectory Chart & 4 Dashboard Scorecards.
 * 4. 1,000-Run Stochastic Monte Carlo Fan Chart & Age 85/100 Solvency Badges.
 * 5. DAF Charitable Tax Optimizer & Guyton-Klinger Belt-Tightening Analytics.
 *
 * DO NOT ALTER UI CONTROLLERS OR DATA-BINDING CONTRACTS WITHOUT CONSULTING
 * GOLDEN_PLAN.md AND PASSING HEADLESS VERIFICATION (./run_qa.sh).
 * ============================================================================
 */
(function (root) {
  "use strict";
  const window = typeof root.window !== "undefined" ? root.window : root;

  // ── Utility Helpers ──────────────────────────────────────────────────────────

  /** Escape user-controlled strings before inserting into innerHTML. */
  function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Returns the current user age and projection start year from appState.
   * Replaces all hardcoded currentAge=43.5 / currentYear=2026 literals
   * so the UI stays correct after annual snapshot ingestion.
   */
  function getCurrentAgeAndYear() {
    const age = (window.appState && window.appState.user && window.appState.user.age)
      ? window.appState.user.age
      : 30.1;
    const year = (window.appState && window.appState.projectionStartYear)
      ? window.appState.projectionStartYear
      : (new Date().getFullYear());
    return { currentAge: age, currentYear: year };
  }

    function openAddSpendingModal() {
      const title = document.getElementById('modalSpendingTitle');
      if (title) title.innerText = 'Add Spending Category';
      const orig = document.getElementById('editSpendingCategoryOriginal');
      if (orig) orig.value = '';
      const inpName = document.getElementById('inpSpendCatName');
      if (inpName) inpName.value = '';
      const inpGrp = document.getElementById('inpSpendCatGroup');
      if (inpGrp) inpGrp.value = 'Living';
      const inpType = document.getElementById('inpSpendCatType');
      if (inpType) inpType.value = 'Fixed';
      const inpMo = document.getElementById('inpSpendMonthly');
      if (inpMo) inpMo.value = '';
      const inpYr = document.getElementById('inpSpendAnnual');
      if (inpYr) inpYr.value = '';
      const inpNotes = document.getElementById('inpSpendNotes');
      if (inpNotes) inpNotes.value = '';
      const btnDel = document.getElementById('btnDeleteSpending');
      if (btnDel) btnDel.classList.add('hidden');
      const modal = document.getElementById('modalSpendingCategory');
      if (modal) modal.classList.remove('hidden');
    }

    function openEditSpendingModal(categoryName) {
      const item = (window.appState.spending || []).find(s => s.category === categoryName);
      if (!item) return;

      const title = document.getElementById('modalSpendingTitle');
      if (title) title.innerText = 'Edit Spending Category';
      const orig = document.getElementById('editSpendingCategoryOriginal');
      if (orig) orig.value = item.category;
      const inpName = document.getElementById('inpSpendCatName');
      if (inpName) inpName.value = item.category;
      const inpGrp = document.getElementById('inpSpendCatGroup');
      if (inpGrp) inpGrp.value = item.group || 'General';
      const inpType = document.getElementById('inpSpendCatType');
      if (inpType) inpType.value = item.type || 'Fixed';

      const { currentYear } = getCurrentAgeAndYear();
      const annualAmt = item.amount !== undefined ? item.amount : (item['actual' + currentYear] !== undefined ? item['actual' + currentYear] : (item.actual2025 || 0));
      const inpYr = document.getElementById('inpSpendAnnual');
      if (inpYr) inpYr.value = annualAmt;
      const inpMo = document.getElementById('inpSpendMonthly');
      if (inpMo) inpMo.value = Math.round(annualAmt / 12);
      const inpNotes = document.getElementById('inpSpendNotes');
      if (inpNotes) inpNotes.value = item.notes || '';

      const btnDel = document.getElementById('btnDeleteSpending');
      if (btnDel) btnDel.classList.remove('hidden');
      const modal = document.getElementById('modalSpendingCategory');
      if (modal) modal.classList.remove('hidden');
    }

    function closeSpendingModal() {
      const modal = document.getElementById('modalSpendingCategory');
      if (modal) modal.classList.add('hidden');
    }

    function syncSpendingModalAmounts(fromField) {
      const inpMo = document.getElementById('inpSpendMonthly');
      const inpYr = document.getElementById('inpSpendAnnual');
      if (!inpMo || !inpYr) return;

      if (fromField === 'monthly') {
        const mo = parseFloat(inpMo.value) || 0;
        inpYr.value = Math.round(mo * 12);
      } else if (fromField === 'annual') {
        const yr = parseFloat(inpYr.value) || 0;
        inpMo.value = Math.round(yr / 12);
      }
    }

    function saveSpendingFromModal() {
      const origInput = document.getElementById('editSpendingCategoryOriginal');
      const origName = origInput ? origInput.value.trim() : '';
      const inpName = document.getElementById('inpSpendCatName');
      const name = inpName ? inpName.value.trim() : '';
      if (!name) {
        alert('Please enter a spending category name.');
        return;
      }
      const inpGrp = document.getElementById('inpSpendCatGroup');
      const group = (inpGrp && inpGrp.value.trim()) ? inpGrp.value.trim() : 'General';
      const inpType = document.getElementById('inpSpendCatType');
      const type = inpType ? inpType.value : 'Fixed';
      const inpYr = document.getElementById('inpSpendAnnual');
      const annualAmt = inpYr ? (parseFloat(inpYr.value) || 0) : 0;
      const inpNotes = document.getElementById('inpSpendNotes');
      const notes = inpNotes ? inpNotes.value.trim() : '';
      const { currentYear } = getCurrentAgeAndYear();

      if (!window.appState.spending) window.appState.spending = [];

      if (origName) {
        const item = window.appState.spending.find(s => s.category === origName);
        if (item) {
          item.category = name;
          item.group = group;
          item.type = type;
          item.notes = notes;
          item.amount = annualAmt;
          item['actual' + currentYear] = annualAmt;
          item.actual2025 = annualAmt;
          item.actual2026 = annualAmt;
        }
      } else {
        window.appState.spending.push({
          category: name,
          group: group,
          type: type,
          notes: notes,
          actual2023: 0,
          actual2024: 0,
          actual2025: annualAmt,
          actual2026: annualAmt,
          amount: annualAmt
        });
      }

      saveState();
      closeSpendingModal();
      renderSpendingTable();
      updateMasterTrajectory();
      markMcStale();
    }

    function deleteCurrentSpendingCategory() {
      const origInput = document.getElementById('editSpendingCategoryOriginal');
      const origName = origInput ? origInput.value.trim() : '';
      if (!origName) return;
      if (!confirm(`Are you sure you want to delete "${origName}"?`)) return;

      window.appState.spending = (window.appState.spending || []).filter(s => s.category !== origName);
      saveState();
      closeSpendingModal();
      renderSpendingTable();
      updateMasterTrajectory();
      markMcStale();
    }

    function quickDeleteSpending(categoryName) {
      if (!confirm(`Delete category "${categoryName}"?`)) return;
      window.appState.spending = (window.appState.spending || []).filter(s => s.category !== categoryName);
      saveState();
      renderSpendingTable();
      updateMasterTrajectory();
      markMcStale();
    }

    function renderSpendingTable() {
      const tbody = document.getElementById('spendingTableBody');
      if (!tbody) return;

      if (!window.appState.spending || window.appState.spending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-500">No spending records loaded. Click "+ Add Spending Category" above.</td></tr>';
        return;
      }

      const { currentYear } = getCurrentAgeAndYear();
      let totalAnnual = 0;
      let totalFixed = 0;
      let totalDisc = 0;

      const rowsHtml = window.appState.spending.map(item => {
        const amt = item.amount !== undefined ? item.amount : (item['actual' + currentYear] !== undefined ? item['actual' + currentYear] : (item.actual2025 || 0));
        const moAmt = Math.round(amt / 12);
        const isFixed = item.type === 'Fixed';

        totalAnnual += amt;
        if (isFixed) totalFixed += amt;
        else totalDisc += amt;

        const badgeClass = isFixed 
          ? 'bg-blue-950/80 text-blue-300 border-blue-800/60' 
          : 'bg-amber-950/80 text-amber-300 border-amber-800/60';

        const safeCat = item.category.replace(/'/g, "\\'");

        return `
          <tr class="hover:bg-slate-900/60 transition group">
            <td class="py-3 px-5">
              <div class="font-semibold text-white group-hover:text-indigo-300 transition flex items-center gap-1.5">
                <span>${item.category}</span>
              </div>
              <div class="text-[10px] text-slate-500">${item.group || 'General'}${item.notes ? ' &bull; ' + item.notes : ''}</div>
            </td>
            <td class="py-3 px-3">
              <button type="button" onclick="toggleSpendingType('${safeCat}')" class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${badgeClass} hover:opacity-80 transition cursor-pointer" title="Click to toggle Fixed vs Discretionary">
                ${item.type} ⇄
              </button>
            </td>
            <td class="py-3 px-3 text-right font-mono text-slate-300 tabular-nums">$${moAmt.toLocaleString()}</td>
            <td class="py-3 px-3 text-right font-mono font-bold text-white tabular-nums">$${amt.toLocaleString()}</td>
            <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
              <button type="button" onclick="openEditSpendingModal('${safeCat}')" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900/80 border border-indigo-800/50 transition">
                Edit
              </button>
              <button type="button" onclick="quickDeleteSpending('${safeCat}')" class="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-rose-950/50 transition" title="Delete category">
                &times;
              </button>
            </td>
          </tr>
        `;
      }).join('');

      const totalMonthly = Math.round(totalAnnual / 12);
      const footerHtml = `
        <tr class="bg-slate-950 font-bold border-t-2 border-surface-border text-white shadow-inner text-xs">
          <td class="py-3.5 px-5 text-indigo-300 flex items-center gap-1.5">
            <span>∑</span> Total Annual Budget
          </td>
          <td class="py-3.5 px-3 font-mono text-[10px] text-slate-400">${window.appState.spending.length} Categories</td>
          <td class="py-3.5 px-3 text-right font-mono text-slate-300 tabular-nums">$${totalMonthly.toLocaleString()} / mo</td>
          <td class="py-3.5 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">$${totalAnnual.toLocaleString()}</td>
          <td class="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">Fixed: $${Math.round(totalFixed/1000)}k | Disc: $${Math.round(totalDisc/1000)}k</td>
        </tr>
      `;

      tbody.innerHTML = rowsHtml + footerHtml;

      const lblCount = document.getElementById('spendingCountLabel');
      if (lblCount) lblCount.innerText = `(${window.appState.spending.length} Categories)`;

      updateSpendingScorecards(totalAnnual, totalAnnual, totalFixed, totalDisc);
    }

    function toggleSpendingType(categoryName) {
      const item = window.appState.spending.find(s => s.category === categoryName);
      if (item) {
        item.type = item.type === 'Fixed' ? 'Discretionary' : 'Fixed';
        saveState();
        renderSpendingTable();
        updateMasterTrajectory();
        markMcStale();
      }
    }

    function updateSpendingScorecards(totalLatest, totalPrior, totalFixed, totalDisc) {
      const elTotal = document.getElementById('spendScorecardTotal');
      if (elTotal) elTotal.innerText = '$' + totalLatest.toLocaleString();
      const elMo = document.getElementById('spendScorecardMonthly');
      if (elMo) elMo.innerText = `$${Math.round(totalLatest / 12).toLocaleString()} / mo`;

      const fixedPct = totalLatest > 0 ? ((totalFixed / totalLatest) * 100).toFixed(1) : 0;
      const elFixed = document.getElementById('spendScorecardFixed');
      if (elFixed) elFixed.innerText = '$' + totalFixed.toLocaleString();
      const elFixedMo = document.getElementById('spendScorecardFixedMonthly');
      if (elFixedMo) elFixedMo.innerText = `$${Math.round(totalFixed / 12).toLocaleString()} / mo (Core Living)`;
      const elFixedPct = document.getElementById('spendScorecardFixedPct');
      if (elFixedPct) elFixedPct.innerText = `${fixedPct}% of budget`;

      const discPct = totalLatest > 0 ? ((totalDisc / totalLatest) * 100).toFixed(1) : 0;
      const elDisc = document.getElementById('spendScorecardDisc');
      if (elDisc) elDisc.innerText = '$' + totalDisc.toLocaleString();
      const elDiscMo = document.getElementById('spendScorecardDiscMonthly');
      if (elDiscMo) elDiscMo.innerText = `$${Math.round(totalDisc / 12).toLocaleString()} / mo (Lifestyle & Travel)`;
      const elDiscPct = document.getElementById('spendScorecardDiscPct');
      if (elDiscPct) elDiscPct.innerText = `${discPct}% of budget`;

      const buffer = Math.round(totalDisc * 0.5);
      const elBuffer = document.getElementById('spendScorecardBuffer');
      if (elBuffer) elBuffer.innerText = '-$' + buffer.toLocaleString();
    }

    // Historical Spending Trends Chart & Annotation Engine
    let spendingTrendsChartInstance = null;
    function renderSpendingTrendsChart() {
      const canvas = document.getElementById('spendingTrendsChart');
      if (!canvas) return;

      const seriesData = window.getHistoricalSpendingSeries ? window.getHistoricalSpendingSeries() : [];
      if (!seriesData || seriesData.length === 0) return;

      const years = seriesData.map(s => s.year.toString());
      const totals = seriesData.map(s => s.total);
      const fixed = seriesData.map(s => s.fixed);
      const disc = seriesData.map(s => s.discretionary);

      const chkTotal = document.getElementById('chkSpendTotal')?.checked ?? true;
      const chkFixed = document.getElementById('chkSpendFixed')?.checked ?? true;
      const chkDisc = document.getElementById('chkSpendDisc')?.checked ?? true;

      const allAnnos = window.getAllSpendingAnnotations ? window.getAllSpendingAnnotations() : {};

      const datasets = [];
      if (chkTotal) {
        datasets.push({
          label: 'Total Annual Spending',
          data: totals,
          borderColor: '#818cf8', // indigo-400
          backgroundColor: 'rgba(129, 140, 248, 0.12)',
          fill: true,
          tension: 0.25,
          borderWidth: 2.5,
          pointBackgroundColor: '#818cf8',
          pointRadius: 5,
          pointHoverRadius: 7
        });
      }
      if (chkFixed) {
        datasets.push({
          label: 'Fixed Core Baseline',
          data: fixed,
          borderColor: '#38bdf8', // sky-400
          borderDash: [5, 4],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.25,
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
      if (chkDisc) {
        datasets.push({
          label: 'Discretionary Lifestyle',
          data: disc,
          borderColor: '#fbbf24', // amber-400
          borderDash: [5, 4],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.25,
          borderWidth: 2,
          pointBackgroundColor: '#fbbf24',
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }

      if (spendingTrendsChartInstance) {
        spendingTrendsChartInstance.data.labels = years;
        spendingTrendsChartInstance.data.datasets = datasets;
        spendingTrendsChartInstance.update();
      } else {
        const ctx = canvas.getContext('2d');
        spendingTrendsChartInstance = new Chart(ctx, {
          type: 'line',
          data: { labels: years, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`,
                  afterBody: items => {
                    if (!items || items.length === 0) return '';
                    const year = parseInt(items[0].label);
                    const notes = allAnnos[year] || [];
                    if (notes.length === 0) return '';
                    return ['\n📌 Historical Notes:'].concat(notes.map(n => `• ${n.category}: "${n.text}"`));
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }
              },
              y: {
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: {
                  color: '#94a3b8',
                  font: { family: 'JetBrains Mono', size: 11 },
                  callback: v => '$' + Math.round(v / 1000) + 'k'
                }
              }
            }
          }
        });
      }

      renderSpendingTimelineNotes(allAnnos);
    }

    function renderSpendingTimelineNotes(allAnnos) {
      const container = document.getElementById('spendingTimelineNotes');
      if (!container) return;

      const yearsWithNotes = Object.keys(allAnnos).map(Number).sort((a, b) => b - a);
      if (yearsWithNotes.length === 0) {
        container.innerHTML = '<span class="text-slate-500 italic">No historical annotations recorded. Click any category row in the table below to add notes.</span>';
        return;
      }

      container.innerHTML = '<span class="text-slate-400 font-semibold text-xs mr-1">Timeline Notes:</span>' + yearsWithNotes.map(yr => {
        const notes = allAnnos[yr];
        return notes.map(n => `
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-900 border border-slate-700 text-slate-300 font-mono">
            <strong class="text-indigo-400 font-bold">${yr}</strong>
            <span class="text-slate-400">${n.category}:</span>
            <span class="text-slate-200">"${n.text}"</span>
          </span>
        `).join('');
      }).join('');
    }

    // Category Historical Trendline & Annotation Modal Controllers
    let categoryTrendChartInstance = null;
    window.activeCategoryTrend = null;

    function showCategorySpendingTrend(categoryName) {
      window.activeCategoryTrend = categoryName;
      const modal = document.getElementById('categoryTrendModal');
      if (!modal) return;

      const item = (window.appState.spending || []).find(s => s.category === categoryName);
      if (!item) return;

      const titleEl = document.getElementById('modalCategoryTitle');
      const subtitleEl = document.getElementById('modalCategorySubtitle');
      const annoSelect = document.getElementById('inputAnnoYear');

      if (titleEl) {
        titleEl.innerHTML = `<span>${item.category}</span> <span class="px-2 py-0.5 rounded text-[10px] font-mono ${item.type === 'Fixed' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}">${item.type}</span>`;
      }

      const availYears = window.getAvailableSpendingYears ? window.getAvailableSpendingYears() : [2021, 2022, 2023, 2024, 2025];
      const startYr = availYears[0] || 2021;
      const endYr = availYears[availYears.length - 1] || 2025;

      if (subtitleEl) {
        subtitleEl.innerText = `${item.group} • Actuals (${startYr}–${endYr}) • ${item.notes || ''}`;
      }

      if (annoSelect) {
        annoSelect.innerHTML = availYears.slice().sort((a, b) => b - a).map(y => `<option value="${y}">${y}</option>`).join('');
      }

      modal.classList.remove('hidden');
      renderCategoryTrendChart(item);
      renderModalCategoryNotesList(categoryName);
    }

    function closeCategoryTrendModal() {
      const modal = document.getElementById('categoryTrendModal');
      if (modal) modal.classList.add('hidden');
      window.activeCategoryTrend = null;
    }

    function renderCategoryTrendChart(item) {
      const canvas = document.getElementById('categoryTrendChart');
      if (!canvas) return;

      const availYears = window.getAvailableSpendingYears ? window.getAvailableSpendingYears() : [2021, 2022, 2023, 2024, 2025];
      const years = availYears.map(String);
      const data = years.map(y => item['actual' + y] || 0);
      const notes = window.getSpendingAnnotations ? window.getSpendingAnnotations(item.category) : {};

      if (categoryTrendChartInstance) {
        categoryTrendChartInstance.data.labels = years;
        categoryTrendChartInstance.data.datasets[0].data = data;
        categoryTrendChartInstance.data.datasets[0].label = item.category + ' Annual Spend ($)';
        categoryTrendChartInstance.update();
      } else {
        const ctx = canvas.getContext('2d');
        categoryTrendChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: years,
            datasets: [{
              label: item.category + ' Annual Spend ($)',
              data: data,
              borderColor: '#818cf8', // indigo-400
              backgroundColor: 'rgba(129, 140, 248, 0.15)',
              fill: true,
              tension: 0.3,
              borderWidth: 2.5,
              pointBackgroundColor: '#818cf8',
              pointBorderColor: '#0f172a',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => `Annual Spend: $${Math.round(ctx.raw).toLocaleString()}`,
                  afterLabel: ctx => {
                    const yr = ctx.label;
                    if (notes && notes[yr]) return `Note: "${notes[yr]}"`;
                    return '';
                  }
                }
              }
            },
            scales: {
              x: { grid: { color: 'rgba(30, 41, 59, 0.4)' }, ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } } },
              y: {
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' }, callback: v => '$' + Math.round(v).toLocaleString() }
              }
            }
          }
        });
      }
    }

    function renderModalCategoryNotesList(categoryName) {
      const container = document.getElementById('modalCategoryNotesList');
      if (!container) return;

      const notes = window.getSpendingAnnotations ? window.getSpendingAnnotations(categoryName) : {};
      const years = Object.keys(notes).sort((a, b) => b - a);

      if (years.length === 0) {
        container.innerHTML = '<span class="text-slate-500 italic">No notes recorded for this category yet.</span>';
        return;
      }

      container.innerHTML = years.map(yr => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">${yr}</span>
            <span class="text-slate-200">"${notes[yr]}"</span>
          </div>
          <button type="button" onclick="deleteCategoryAnnotation('${categoryName.replace(/'/g, "\\'")}', '${yr}')" class="text-slate-500 hover:text-rose-400 font-bold px-1">&times;</button>
        </div>
      `).join('');
    }

    function saveCategoryAnnotationFromModal() {
      const cat = window.activeCategoryTrend;
      if (!cat) return;
      const yr = document.getElementById('inputAnnoYear')?.value || '2025';
      const text = document.getElementById('inputAnnoText')?.value || '';

      if (window.setSpendingAnnotation) {
        window.setSpendingAnnotation(cat, yr, text);
      }
      const inp = document.getElementById('inputAnnoText');
      if (inp) inp.value = '';

      renderModalCategoryNotesList(cat);
      const item = (window.appState.spending || []).find(s => s.category === cat);
      if (item) renderCategoryTrendChart(item);
      renderSpendingTable();
      renderSpendingTrendsChart();
    }

    function deleteCategoryAnnotation(categoryName, year) {
      if (window.setSpendingAnnotation) {
        window.setSpendingAnnotation(categoryName, year, '');
      }
      renderModalCategoryNotesList(categoryName);
      const item = (window.appState.spending || []).find(s => s.category === categoryName);
      if (item) renderCategoryTrendChart(item);
      renderSpendingTable();
      renderSpendingTrendsChart();
    }
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      const activeTab = document.getElementById('tab-' + tabId);
      if (activeTab) activeTab.classList.add('active');

      document.querySelectorAll('#navTabs button').forEach(btn => {
        btn.className = "px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/60 transition inline-flex items-center gap-1.5";
      });

      const activeBtn = document.getElementById('tabBtn-' + tabId);
      if (activeBtn) {
        activeBtn.className = "px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-md transition shadow-sm inline-flex items-center gap-1.5";
      }

      if (tabId === 'dashboard') setTimeout(updateMasterTrajectory, 50);
      if (tabId === 'forecasts' || tabId === 'assumptions' || tabId === 'montecarlo') {
        const targetTab = document.getElementById('tab-forecasts') || document.getElementById('tab-assumptions');
        if (targetTab) targetTab.classList.add('active');
        const activeForecastsBtn = document.getElementById('tabBtn-forecasts');
        if (activeForecastsBtn) {
          activeForecastsBtn.className = "px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-md transition shadow-sm flex items-center gap-1.5";
        }
        setTimeout(() => {
          initAssumptions();
          if (!mcChartInstance) {
            runMonteCarloSimulation();
          }
          if (window.activeForecastSubTab === 'ledger') {
            renderForecastLedgerTable();
          }
        }, 50);
      }
      if (tabId === 'assets') {
        renderAssetsTable();
        setTimeout(() => {
          if (!window.seriesInitialized) {
            initSeriesSelection();
          } else {
            renderAssetTrendsChart();
          }
        }, 50);
      }
      if (tabId === 'spending') {
        renderSpendingTable();
        setTimeout(renderSpendingTrendsChart, 50);
      }
    }

    function updateWeightedReturnBadge() {
      const wReturn = (typeof window.getPortfolioWeightedReturn === 'function')
        ? window.getPortfolioWeightedReturn()
        : 0.083;
      const el = document.getElementById('lblWeightedReturn');
      if (el) el.innerText = (wReturn * 100).toFixed(1) + '%';
      const elMc = document.getElementById('mcHeaderReturn');
      if (elMc) elMc.innerText = (wReturn * 100).toFixed(1) + '%';

      const wVol = (typeof window.getPortfolioWeightedVolatility === 'function')
        ? window.getPortfolioWeightedVolatility()
        : 0.195;
      const elVol = document.getElementById('mcHeaderVol');
      if (elVol) elVol.innerText = (wVol * 100).toFixed(1) + '%';
    }

    // Render Dynamic Assets Table (CRUD Active)
    function renderAssetsTable() {
      const tbody = document.getElementById('assetsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      let totalBal = 0;
      let taxableBal = 0;
      let preTaxBal = 0;
      let taxFreeBal = 0;
      let totalGains = 0;

      window.appState.assets.forEach(asset => {
        totalBal += asset.balance;
        const gain = asset.costBasis > 0 ? (asset.balance - asset.costBasis) : 0;
        totalGains += gain;

        if (asset.taxClassification.includes('Taxable')) taxableBal += asset.balance;
        else if (asset.taxClassification.includes('Pre-Tax')) preTaxBal += asset.balance;
        else if (asset.taxClassification.includes('529') || asset.taxClassification.includes('Roth')) taxFreeBal += asset.balance;

        let badgeClass = 'bg-slate-800 text-slate-300';
        if (asset.taxClassification === 'Taxable Equity') badgeClass = 'bg-amber-950/80 text-amber-300 border border-amber-800/60';
        if (asset.taxClassification === 'Pre-Tax') badgeClass = 'bg-blue-950/80 text-blue-300 border border-blue-800/60';
        if (asset.taxClassification === 'Tax-Free 529') badgeClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60';
        if (asset.taxClassification === 'Illiquid') badgeClass = 'bg-purple-950/80 text-purple-300 border border-purple-800/60';

        const shareSubText = (asset.shares && asset.sharePrice) 
          ? `<span class="block text-[10px] font-mono text-indigo-400 font-normal mt-0.5">${asset.shares.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} sh @ $${asset.sharePrice.toFixed(2)}</span>`
          : '';

        const expReturnVal = (asset.expectedReturn !== undefined ? asset.expectedReturn : 0.08) * 100;
        const volVal = (asset.volatility !== undefined ? asset.volatility : 0.16) * 100;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-cardHover/60 transition cursor-pointer group';
        tr.onclick = () => showAssetTrend(asset.id);
        tr.title = 'Click to view historical balance line chart & snapshot ledger';
        tr.innerHTML = `
          <td class="py-3.5 px-4 font-semibold text-white group-hover:text-indigo-300 transition">
            <div class="flex items-center gap-1.5">
              <span>${asset.name}</span>
              <span class="text-[10px] text-slate-500 opacity-60 group-hover:opacity-100">📈</span>
            </div>
            ${shareSubText}
          </td>
          <td class="py-3.5 px-4 text-slate-400">${asset.institution}</td>
          <td class="py-3.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] ${badgeClass}">${asset.taxClassification}</span></td>
          <td class="py-3.5 px-4 text-right font-mono font-bold text-white tabular-nums">$${asset.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td class="py-3.5 px-4 text-right font-mono text-slate-400 tabular-nums">${asset.costBasis > 0 ? '$' + asset.costBasis.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : (asset.taxClassification === 'Pre-Tax' ? 'N/A (Pre-Tax)' : '—')}</td>
          <td class="py-3.5 px-4 text-right font-mono ${gain > 0 ? 'text-emerald-400' : 'text-slate-500'} font-semibold tabular-nums">${gain > 0 ? '+$' + gain.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '—'}</td>
          <td class="py-3.5 px-4 text-right font-mono ${asset.cagr5Y ? 'text-emerald-400 font-bold' : 'text-slate-500'}">${asset.cagr5Y ? '+' + asset.cagr5Y + '%' : 'N/A'}</td>
          <td class="py-3.5 px-4 text-right font-mono tabular-nums" onclick="event.stopPropagation()">
            <div class="flex items-center justify-end gap-1.5">
              <span class="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50 text-[11px] text-indigo-300 font-semibold" title="Expected Annual Return">${expReturnVal.toFixed(1)}%</span>
              <span class="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-[10px] text-purple-300 font-medium" title="Annual Volatility (σ)">${volVal.toFixed(1)}% σ</span>
            </div>
          </td>
          <td class="py-3.5 px-4 ${asset.priority.includes('#1') ? 'text-emerald-400 font-bold' : (asset.priority.includes('#2') ? 'text-amber-400 font-medium' : 'text-slate-500')}">${asset.priority}</td>
          <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
            <button onclick="openEditAssetModal('${asset.id}')" class="text-slate-400 hover:text-indigo-400 font-medium text-xs">Edit</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Update Ledger Footers & Dashboard
      document.getElementById('sumTotal').innerText = '$' + totalBal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('sumGains').innerText = '+$' + totalGains.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('sumTaxable').innerText = '$' + taxableBal.toLocaleString(undefined, {maximumFractionDigits: 0});
      document.getElementById('sumPreTax').innerText = '$' + preTaxBal.toLocaleString(undefined, {maximumFractionDigits: 0});
      document.getElementById('sumTaxFree').innerText = '$' + taxFreeBal.toLocaleString(undefined, {maximumFractionDigits: 0});
      document.getElementById('assetCountLabel').innerText = `(${window.appState.assets.length} Accounts)`;
      document.getElementById('dashTotalAssets').innerText = '$' + totalBal.toLocaleString(undefined, {maximumFractionDigits: 0});
      updateWeightedReturnBadge();
    }

    // Modal Asset CRUD
    function openAddAssetModal() {
      document.getElementById('modalAssetTitle').innerText = 'Add New Portfolio Asset';
      document.getElementById('editAssetId').value = '';
      document.getElementById('inputAssetName').value = '';
      document.getElementById('inputAssetInst').value = '';
      document.getElementById('inputAssetTax').value = 'Taxable Equity';
      document.getElementById('inputAssetBalance').value = '';
      document.getElementById('inputAssetCostBasis').value = '';
      document.getElementById('inputAssetCagr').value = '';
      const expInp = document.getElementById('inputAssetExpReturn');
      if (expInp) expInp.value = '8.0';
      const volInp = document.getElementById('inputAssetVolatility');
      if (volInp) volInp.value = '16.0';
      const shInp = document.getElementById('inputAssetShares');
      if (shInp) shInp.value = '';
      const prInp = document.getElementById('inputAssetSharePrice');
      if (prInp) prInp.value = '';
      document.getElementById('btnDeleteAsset').classList.add('hidden');
      document.getElementById('assetModal').classList.remove('hidden');
    }

    function openEditAssetModal(id) {
      const asset = window.appState.assets.find(a => a.id === id);
      if (!asset) return;

      document.getElementById('modalAssetTitle').innerText = 'Edit Account: ' + asset.name;
      document.getElementById('editAssetId').value = asset.id;
      document.getElementById('inputAssetName').value = asset.name;
      document.getElementById('inputAssetInst').value = asset.institution;
      document.getElementById('inputAssetTax').value = asset.taxClassification;
      document.getElementById('inputAssetBalance').value = asset.balance;
      document.getElementById('inputAssetCostBasis').value = asset.costBasis || '';
      document.getElementById('inputAssetCagr').value = asset.cagr5Y || '';
      const expInp = document.getElementById('inputAssetExpReturn');
      if (expInp) expInp.value = ((asset.expectedReturn !== undefined ? asset.expectedReturn : 0.08) * 100).toFixed(1);
      const volInp = document.getElementById('inputAssetVolatility');
      if (volInp) volInp.value = ((asset.volatility !== undefined ? asset.volatility : 0.16) * 100).toFixed(1);
      const shInp = document.getElementById('inputAssetShares');
      if (shInp) shInp.value = asset.shares || '';
      const prInp = document.getElementById('inputAssetSharePrice');
      if (prInp) prInp.value = asset.sharePrice || '';
      document.getElementById('btnDeleteAsset').classList.remove('hidden');
      document.getElementById('assetModal').classList.remove('hidden');
    }

    function closeAssetModal() {
      const modal = document.getElementById('assetModal');
      if (modal) modal.classList.add('hidden');
    }

    // Helper: Map snapshot date to proportional numeric X position for linear timeline charts
    function getSnapshotNumericX(s, isLatestInSeries) {
      const d = s.date || (s.year ? `${s.year}-12-31` : '2026-12-31');
      const year = s.year || parseInt(d.split('-')[0]) || 2026;

      // The final data point (e.g. today / current year) anchors directly to the final year tick
      if (isLatestInSeries) {
        return year;
      }

      // Year-end balance actuals anchor directly to the integer year tick
      if (d.endsWith('-12-31')) {
        return year;
      }

      // Mid-year portfolio updates (e.g. June 30 or any non-12-31 date)
      // are placed proportionally between the prior year-end and the current year-end
      const parts = d.split('-');
      if (parts.length >= 3) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        const current = new Date(y, m - 1, day);
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        const fraction = Math.max(0.05, Math.min(0.95, (current - start) / (end - start)));
        return (y - 1) + fraction;
      }

      return year;
    }

    // Individual Asset Trendline Modal Controller
    let assetTrendModalChartInstance = null;
    function showAssetTrend(assetId) {
      const asset = (window.appState.assets || []).find(a => a.id === assetId);
      if (!asset) return;

      const modal = document.getElementById('assetTrendModal');
      const title = document.getElementById('modalAssetTrendTitle');
      const subtitle = document.getElementById('modalAssetTrendSubtitle');
      const kpis = document.getElementById('modalAssetTrendKpis');
      const tbody = document.getElementById('modalAssetHistoryTableBody');

      if (!modal) return;
      modal.classList.remove('hidden');

      if (title) {
        title.innerHTML = `<span>${asset.name}</span> <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 font-normal">${asset.institution} • ${asset.taxClassification}</span>`;
      }

      // Extract all historical snapshots sorted chronologically
      const allSnaps = [...(window.appState.historicalSnapshots || [])].sort((a, b) => {
        const da = a.date || (a.year + '-12-31');
        const db = b.date || (b.year + '-12-31');
        return da.localeCompare(db);
      });

      const series = allSnaps.map(s => {
        const bal = (s.balances && s.balances[assetId] !== undefined) ? s.balances[assetId] : 0;
        const d = s.date || `${s.year}-12-31`;
        const y = s.year || parseInt(d.split('-')[0]) || 2026;
        const cleanLabel = (s.label && !s.label.toLowerCase().includes('today')) ? s.label : y.toString();
        return {
          date: d,
          year: y,
          label: cleanLabel,
          balance: bal
        };
      });

      const nonZeroSeries = series.filter(s => s.balance > 0);
      const firstBal = nonZeroSeries.length > 0 ? nonZeroSeries[0].balance : (series[0]?.balance || 0);
      const curBal = asset.balance;
      const totalDollarGrowth = curBal - firstBal;
      const totalGrowthPct = firstBal > 0 ? ((totalDollarGrowth / firstBal) * 100).toFixed(1) : '—';

      // Trim leading zeros to display active account timeline
      const chartSeries = (series.some(s => s.balance > 0))
        ? series.slice(series.findIndex(s => s.balance > 0))
        : series;

      if (subtitle) {
        const startYear = chartSeries[0]?.year || series[0]?.year || '2018';
        const endYear = chartSeries[chartSeries.length - 1]?.year || series[series.length - 1]?.year || '2026';
        subtitle.innerText = `Historical balance actuals (${startYear}–${endYear}) • ${asset.priority}`;
      }

      if (kpis) {
        kpis.innerHTML = `
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="text-[10px] text-slate-400 font-medium">Current Balance</div>
            <div class="text-base font-bold font-mono text-white mt-0.5">$${Math.round(curBal).toLocaleString()}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="text-[10px] text-slate-400 font-medium">Starting Baseline</div>
            <div class="text-base font-bold font-mono text-slate-300 mt-0.5">$${Math.round(firstBal).toLocaleString()}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="text-[10px] text-slate-400 font-medium">All-Time Growth</div>
            <div class="text-base font-bold font-mono ${totalDollarGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5">
              ${totalDollarGrowth >= 0 ? '+$' : '-$'}${Math.abs(Math.round(totalDollarGrowth)).toLocaleString()}
            </div>
            <div class="text-[9px] text-slate-500 font-mono">${totalGrowthPct !== '—' ? totalGrowthPct + '%' : ''}</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div class="text-[10px] text-slate-400 font-medium">5-Year CAGR</div>
            <div class="text-base font-bold font-mono ${asset.cagr5Y ? 'text-emerald-400' : 'text-slate-500'} mt-0.5">
              ${asset.cagr5Y ? '+' + asset.cagr5Y + '%' : 'N/A'}
            </div>
          </div>
        `;
      }

      // Render History Table inside Modal
      if (tbody) {
        const rowsHtml = series.slice().reverse().map(s => {
          let dollarChangeStr = '—';
          let pctChangeStr = '—';
          let changeClass = 'text-slate-400';

          const curIdx = series.findIndex(x => x.date === s.date);
          if (curIdx > 0) {
            const prior = series[curIdx - 1];
            if (prior && prior.balance > 0) {
              const diff = s.balance - prior.balance;
              const pct = (diff / prior.balance) * 100;
              dollarChangeStr = (diff >= 0 ? '+$' : '-$') + Math.abs(Math.round(diff)).toLocaleString();
              pctChangeStr = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
              changeClass = diff >= 0 ? 'text-emerald-400' : 'text-rose-400';
            }
          }

          const cleanLabel = (s.label && !s.label.toLowerCase().includes('today')) ? s.label : s.year;
          return `
            <tr class="hover:bg-slate-900/60 transition">
              <td class="py-2 px-3 font-semibold text-white">${s.date} <span class="text-[10px] text-slate-500 font-normal">(${cleanLabel})</span></td>
              <td class="py-2 px-3 text-right font-mono font-bold text-white tabular-nums">$${Math.round(s.balance).toLocaleString()}</td>
              <td class="py-2 px-3 text-right font-mono ${changeClass} tabular-nums">${dollarChangeStr}</td>
              <td class="py-2 px-3 text-right font-mono ${changeClass} tabular-nums">${pctChangeStr}</td>
            </tr>
          `;
        }).join('');
        tbody.innerHTML = rowsHtml;
      }

      // Render Modal Line Chart with Linear Year Scale
      const canvas = document.getElementById('assetTrendModalChart');
      if (canvas) {
        const lastIdx = chartSeries.length - 1;
        const dataPoints = chartSeries.map((s, idx) => ({
          x: getSnapshotNumericX(s, idx === lastIdx),
          y: s.balance,
          snapshot: s
        }));

        const minYear = Math.min(...chartSeries.map(s => s.year));
        const maxYear = Math.max(...chartSeries.map(s => s.year));

        const ctx = canvas.getContext('2d');

        if (assetTrendModalChartInstance) {
          assetTrendModalChartInstance.destroy();
        }

        assetTrendModalChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [{
              label: asset.name + ' Balance ($)',
              data: dataPoints,
              borderColor: '#10b981', // emerald-500
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              fill: true,
              tension: 0.3,
              borderWidth: 2.5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#064e3b',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: function(items) {
                    if (!items || items.length === 0) return '';
                    const raw = items[0].raw;
                    if (raw && raw.snapshot) {
                      const snap = raw.snapshot;
                      const cleanLabel = (snap.label && !snap.label.toLowerCase().includes('today')) ? snap.label : snap.year;
                      return `${snap.date} (${cleanLabel})`;
                    }
                    return '';
                  },
                  label: ctx => `Balance: $${Math.round(ctx.raw?.y !== undefined ? ctx.raw.y : ctx.raw).toLocaleString()}`
                }
              }
            },
            scales: {
              x: {
                type: 'linear',
                min: minYear,
                max: maxYear,
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: {
                  stepSize: 1,
                  color: '#94a3b8',
                  font: { family: 'JetBrains Mono' },
                  callback: v => Number.isInteger(v) ? v.toString() : ''
                }
              },
              y: {
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: {
                  color: '#94a3b8',
                  font: { family: 'JetBrains Mono' },
                  callback: v => '$' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : Math.round(v / 1000) + 'k')
                }
              }
            }
          }
        });
      }
    }

    function closeAssetTrendModal() {
      const modal = document.getElementById('assetTrendModal');
      if (modal) modal.classList.add('hidden');
    }

    function recalcAssetModalBalance() {
      const sh = parseFloat(document.getElementById('inputAssetShares')?.value);
      const pr = parseFloat(document.getElementById('inputAssetSharePrice')?.value);
      if (!isNaN(sh) && !isNaN(pr) && sh > 0 && pr > 0) {
        document.getElementById('inputAssetBalance').value = (sh * pr).toFixed(2);
      }
    }

    function saveAssetFromModal() {
      const id = document.getElementById('editAssetId').value;
      const name = document.getElementById('inputAssetName').value.trim();
      const institution = document.getElementById('inputAssetInst').value.trim() || 'Manual';
      const taxClassification = document.getElementById('inputAssetTax').value;
      let balance = parseFloat(document.getElementById('inputAssetBalance').value) || 0;
      const costBasis = parseFloat(document.getElementById('inputAssetCostBasis').value) || 0;
      const cagr5Y = parseFloat(document.getElementById('inputAssetCagr').value) || null;
      const expectedReturn = (parseFloat(document.getElementById('inputAssetExpReturn')?.value) || 8.0) / 100;
      const volatility = (parseFloat(document.getElementById('inputAssetVolatility')?.value) || 16.0) / 100;
      const shares = parseFloat(document.getElementById('inputAssetShares')?.value) || null;
      const sharePrice = parseFloat(document.getElementById('inputAssetSharePrice')?.value) || null;

      if (!name) {
        alert('Please enter an account name.');
        return;
      }

      if (shares && sharePrice) {
        balance = parseFloat((shares * sharePrice).toFixed(2));
      }

      if (id) {
        // Update
        const asset = window.appState.assets.find(a => a.id === id);
        if (asset) {
          asset.name = name;
          asset.institution = institution;
          asset.taxClassification = taxClassification;
          asset.balance = balance;
          asset.costBasis = costBasis;
          asset.cagr5Y = cagr5Y;
          asset.expectedReturn = expectedReturn;
          asset.volatility = volatility;
          asset.shares = shares;
          asset.sharePrice = sharePrice;
        }
      } else {
        // Create
        const newAsset = {
          id: 'asset-' + Date.now(),
          name,
          institution,
          taxClassification,
          balance,
          costBasis,
          cagr5Y,
          expectedReturn,
          volatility,
          shares,
          sharePrice,
          priority: taxClassification === 'Taxable Equity' && costBasis < balance * 0.7 ? '#1 Priority' : (taxClassification === 'Pre-Tax' ? 'Ineligible' : 'Eligible')
        };
        window.appState.assets.push(newAsset);
      }

      saveState();
      renderAssetsTable();
      updateMasterTrajectory();
      markMcStale();
      closeAssetModal();
    }

    function deleteCurrentAsset() {
      const id = document.getElementById('editAssetId').value;
      if (!id) return;
      if (confirm('Are you sure you want to remove this account from your model?')) {
        window.appState.assets = window.appState.assets.filter(a => a.id !== id);
        saveState();
        renderAssetsTable();
        closeAssetModal();
      }
    }

    // 529 Goal Interactive Engine
    function toggle529Modal() {
      const modal = document.getElementById('modal529');
      modal.classList.toggle('hidden');
      if (!modal.classList.contains('hidden')) {
        document.getElementById('input529Balance').value = window.appState.collegeGoal.balance;
        document.getElementById('input529Monthly').value = window.appState.collegeGoal.monthlyContribution;
        document.getElementById('input529Return').value = window.appState.collegeGoal.expectedReturn;
        document.getElementById('input529Target').value = window.appState.collegeGoal.targetCost;
        calculate529Live();
      }
    }

    function calculate529Live() {
      const bal = parseFloat(document.getElementById('input529Balance').value) || 0;
      const mo = parseFloat(document.getElementById('input529Monthly').value) || 0;
      const r = (parseFloat(document.getElementById('input529Return').value) || 6.5) / 100;
      const yrs = window.appState.collegeGoal.horizonYears;
      const annualAdd = mo * 12;

      const compoundFactor = Math.pow(1 + r, yrs);
      const fvInitial = bal * compoundFactor;
      const fvAdditions = annualAdd * ((compoundFactor - 1) / r);
      const totalFV = Math.round(fvInitial + fvAdditions);
      const principal = Math.round(bal + (annualAdd * yrs));
      const gains = totalFV - principal;

      document.getElementById('preview529Total').innerText = '$' + totalFV.toLocaleString();
      document.getElementById('preview529Principal').innerText = '$' + principal.toLocaleString();
      document.getElementById('preview529Gains').innerText = '+$' + gains.toLocaleString();
    }

    if (typeof document !== 'undefined') {
      const elBal = document.getElementById('input529Balance');
      if (elBal) elBal.addEventListener('input', calculate529Live);
      const elMo = document.getElementById('input529Monthly');
      if (elMo) elMo.addEventListener('input', calculate529Live);
      const elRet = document.getElementById('input529Return');
      if (elRet) elRet.addEventListener('input', calculate529Live);
    }

    function apply529Schedule() {
      const bal = parseFloat(document.getElementById('input529Balance').value) || 0;
      const mo = parseFloat(document.getElementById('input529Monthly').value) || 0;
      const r = parseFloat(document.getElementById('input529Return').value) || 6.5;
      const target = parseFloat(document.getElementById('input529Target').value) || 160000;

      window.appState.collegeGoal.balance = bal;
      window.appState.collegeGoal.monthlyContribution = mo;
      window.appState.collegeGoal.expectedReturn = r;
      window.appState.collegeGoal.targetCost = target;

      // Update 529 asset in table if exists
      const asset529 = window.appState.assets.find(a => a.taxClassification === 'Tax-Free 529');
      if (asset529) {
        asset529.balance = bal;
      }

      // Calculate new FV
      const yrs = window.appState.collegeGoal.horizonYears;
      const annualAdd = mo * 12;
      const rateDec = r / 100;
      const compoundFactor = Math.pow(1 + rateDec, yrs);
      const totalFV = Math.round(bal * compoundFactor + annualAdd * ((compoundFactor - 1) / rateDec));
      const pct = Math.min(100, (bal / target) * 100).toFixed(1);

      document.getElementById('hero529Balance').innerText = '$' + bal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('hero529Monthly').innerText = '$' + mo.toLocaleString() + ' / mo';
      document.getElementById('hero529Projected').innerText = '$' + totalFV.toLocaleString();
      document.getElementById('hero529Funded').innerText = '$' + (bal / 1000).toFixed(1) + 'k';
      document.getElementById('hero529Target').innerText = '$' + (target / 1000).toFixed(1) + 'k';
      document.getElementById('hero529ProgressBar').style.width = pct + '%';
      document.getElementById('hero529PctLabel').innerText = pct + '% of college benchmark funded';

      saveState();
      renderAssetsTable();
      toggle529Modal();
    }

    // Palette for portfolio assets
    const ASSET_COLORS = [
      '#f59e0b', // Amber (Stock Plan)
      '#3b82f6', // Blue (401k)
      '#10b981', // Emerald (Automated Investing)
      '#8b5cf6', // Violet (Traditional IRA)
      '#06b6d4', // Cyan (529 College)
      '#ec4899', // Pink (Private Investment)
      '#f97316', // Orange (Roth IRA)
      '#14b8a6', // Teal (Custodial / Savings)
      '#6366f1', // Indigo (Bond Portfolio)
      '#94a3b8'  // Slate (Rollover IRA)
    ];

    window.selectedAssetIds = [];
    window.selectedStartYear = 2021;
    window.selectedEndYear = 2026;
    window.seriesInitialized = false;
    let assetTrendsChartInstance = null;

    function getDatasetYearBounds() {
      const dates = window.appState.historicalSnapshots.map(s => {
        const y = parseInt((s.date || (s.year + '-12-31')).split('-')[0]);
        return isNaN(y) ? (s.year || 2026) : y;
      });
      const minYear = Math.min(...dates);
      const maxYear = Math.max(...dates);
      return { minYear, maxYear };
    }

    function initSeriesSelection() {
      // Default: Top 5 assets by current balance descending
      const sorted = [...window.appState.assets].sort((a, b) => b.balance - a.balance);
      window.selectedAssetIds = sorted.slice(0, 5).map(a => a.id);
      
      const { minYear, maxYear } = getDatasetYearBounds();
      window.selectedEndYear = maxYear;
      // Enforce minimum 5 year window:
      const availableSpan = maxYear - minYear;
      const initialSpan = Math.min(5, availableSpan);
      window.selectedStartYear = Math.max(minYear, maxYear - initialSpan);

      window.seriesInitialized = true;
      updateSliderControls();
      renderSeriesCheckboxes();
      updateSeriesDropdownLabel();
      renderAssetTrendsChart();
    }

    function updateSliderControls() {
      const { minYear, maxYear } = getDatasetYearBounds();
      const sliderStart = document.getElementById('sliderStartYear');
      const sliderEnd = document.getElementById('sliderEndYear');
      const startVal = document.getElementById('startYearVal');
      const endVal = document.getElementById('endYearVal');
      const minDatasetYearLabel = document.getElementById('minDatasetYearLabel');
      const maxDatasetYearLabel = document.getElementById('maxDatasetYearLabel');
      const rangeDisplay = document.getElementById('trendRangeDisplay');

      if (minDatasetYearLabel) minDatasetYearLabel.innerText = `Dataset Min: ${minYear}`;
      if (maxDatasetYearLabel) maxDatasetYearLabel.innerText = `Dataset Max: ${maxYear}`;

      if (sliderStart) {
        sliderStart.min = minYear;
        sliderStart.max = maxYear;
        sliderStart.value = window.selectedStartYear;
      }
      if (sliderEnd) {
        sliderEnd.min = minYear;
        sliderEnd.max = maxYear;
        sliderEnd.value = window.selectedEndYear;
      }

      if (startVal) startVal.innerText = window.selectedStartYear;
      if (endVal) endVal.innerText = window.selectedEndYear;

      const span = window.selectedEndYear - window.selectedStartYear;
      if (rangeDisplay) {
        rangeDisplay.innerText = `01/01/${window.selectedStartYear} — 12/31/${window.selectedEndYear} (${span} Years)`;
      }
    }

    function onStartYearSliderChange(val) {
      const { minYear, maxYear } = getDatasetYearBounds();
      let start = parseInt(val);
      const minRequiredSpan = Math.min(5, maxYear - minYear);
      if (window.selectedEndYear - start < minRequiredSpan) {
        window.selectedEndYear = Math.min(maxYear, start + minRequiredSpan);
        if (window.selectedEndYear - start < minRequiredSpan) {
          start = window.selectedEndYear - minRequiredSpan;
        }
      }
      window.selectedStartYear = start;
      updateSliderControls();
      renderAssetTrendsChart();
    }

    function onEndYearSliderChange(val) {
      const { minYear, maxYear } = getDatasetYearBounds();
      let end = parseInt(val);
      const minRequiredSpan = Math.min(5, maxYear - minYear);
      if (end - window.selectedStartYear < minRequiredSpan) {
        window.selectedStartYear = Math.max(minYear, end - minRequiredSpan);
        if (end - window.selectedStartYear < minRequiredSpan) {
          end = window.selectedStartYear + minRequiredSpan;
        }
      }
      window.selectedEndYear = end;
      updateSliderControls();
      renderAssetTrendsChart();
    }

    function toggleSeriesDropdown(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('seriesDropdownMenu');
      if (menu) menu.classList.toggle('hidden');
    }

    // Close dropdown on outside click
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        const container = document.getElementById('seriesDropdownContainer');
        const menu = document.getElementById('seriesDropdownMenu');
        if (container && menu && !container.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });
    }

    function renderSeriesCheckboxes() {
      const container = document.getElementById('seriesCheckboxList');
      if (!container) return;

      const sorted = [...window.appState.assets].sort((a, b) => b.balance - a.balance);
      container.innerHTML = sorted.map((asset, index) => {
        const color = ASSET_COLORS[index % ASSET_COLORS.length];
        const isChecked = window.selectedAssetIds.includes(asset.id);
        return `
          <label class="flex items-center justify-between p-1.5 rounded hover:bg-slate-800 cursor-pointer text-xs transition select-none">
            <div class="flex items-center gap-2 overflow-hidden">
              <input type="checkbox" onchange="toggleAssetSeries('${asset.id}')" ${isChecked ? 'checked' : ''} class="rounded accent-emerald-500 bg-slate-950 border-slate-700">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" style="background-color: ${color}"></span>
              <div class="truncate">
                <span class="text-slate-200 font-medium">${asset.name}</span>
                <span class="text-[10px] text-slate-500 block truncate">${asset.institution}</span>
              </div>
            </div>
            <span class="font-mono text-slate-400 text-[11px] shrink-0 ml-2">$${(asset.balance / 1000).toFixed(0)}k</span>
          </label>
        `;
      }).join('');
    }

    function updateSeriesDropdownLabel() {
      const label = document.getElementById('seriesDropdownLabel');
      if (label) {
        if (window.selectedAssetIds.length === 5) {
          label.innerText = `Series: Top 5 Selected`;
        } else if (window.selectedAssetIds.length === window.appState.assets.length) {
          label.innerText = `Series: All ${window.selectedAssetIds.length} Selected`;
        } else {
          label.innerText = `Series: ${window.selectedAssetIds.length} of ${window.appState.assets.length} Selected`;
        }
      }
    }

    function toggleAssetSeries(id) {
      if (window.selectedAssetIds.includes(id)) {
        window.selectedAssetIds = window.selectedAssetIds.filter(x => x !== id);
      } else {
        window.selectedAssetIds.push(id);
      }
      updateSeriesDropdownLabel();
      renderSeriesCheckboxes();
      renderAssetTrendsChart();
    }

    function selectTop5Series() {
      const sorted = [...window.appState.assets].sort((a, b) => b.balance - a.balance);
      window.selectedAssetIds = sorted.slice(0, 5).map(a => a.id);
      updateSeriesDropdownLabel();
      renderSeriesCheckboxes();
      renderAssetTrendsChart();
    }

    function selectAllSeries() {
      window.selectedAssetIds = window.appState.assets.map(a => a.id);
      updateSeriesDropdownLabel();
      renderSeriesCheckboxes();
      renderAssetTrendsChart();
    }

    function clearAllSeries() {
      window.selectedAssetIds = [];
      updateSeriesDropdownLabel();
      renderSeriesCheckboxes();
      renderAssetTrendsChart();
    }

    function renderAssetTrendsChart() {
      const ctx = document.getElementById('assetTrendsChart');
      if (!ctx) return;

      const startDate = `${window.selectedStartYear}-01-01`;
      const endDate = `${window.selectedEndYear}-12-31`;

      const allSnapshots = [...window.appState.historicalSnapshots].sort((a, b) => {
        const da = a.date || (a.year + '-12-31');
        const db = b.date || (b.year + '-12-31');
        return da.localeCompare(db);
      });

      const filtered = allSnapshots.filter(s => {
        const d = s.date || (s.year + '-12-31');
        return d >= startDate && d <= endDate;
      });

      const sorted = [...window.appState.assets].sort((a, b) => b.balance - a.balance);
      const lastFilteredIdx = filtered.length - 1;
      const datasets = window.selectedAssetIds.map(assetId => {
        const asset = window.appState.assets.find(a => a.id === assetId);
        if (!asset) return null;

        const assetIndex = sorted.findIndex(a => a.id === assetId);
        const color = ASSET_COLORS[assetIndex % ASSET_COLORS.length];

        const dataPoints = filtered.map((s, idx) => {
          let bal = 0;
          if (s.balances && s.balances[assetId] !== undefined) {
            bal = s.balances[assetId];
          } else if (assetId === 'asset-1') bal = s.stockPlan || 0;
          else if (assetId === 'asset-2') bal = s.fourOhOneK || 0;
          else if (assetId === 'asset-3') bal = s.automated || 0;
          else if (assetId === 'asset-5') bal = s.fiveTwoNine || 0;

          return {
            x: getSnapshotNumericX(s, idx === lastFilteredIdx),
            y: bal,
            snapshot: s
          };
        });

        return {
          label: asset.name,
          data: dataPoints,
          borderColor: color,
          backgroundColor: color + '15',
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 3,
          pointHoverRadius: 6
        };
      }).filter(Boolean);

      if (assetTrendsChartInstance) {
        assetTrendsChartInstance.destroy();
      }

      assetTrendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#94a3b8',
                font: { family: 'JetBrains Mono', size: 10 },
                boxWidth: 12
              }
            },
            tooltip: {
              callbacks: {
                title: function(items) {
                  if (!items || items.length === 0) return '';
                  const item = items[0];
                  const snap = item.raw?.snapshot;
                  if (snap) {
                    const cleanLabel = (snap.label && !snap.label.toLowerCase().includes('today')) ? snap.label : snap.year;
                    return `${snap.date} (${cleanLabel})`;
                  }
                  return Number.isInteger(item.parsed.x) ? item.parsed.x.toString() : item.parsed.x.toFixed(1);
                },
                label: function(context) {
                  const val = context.raw?.y !== undefined ? context.raw.y : context.raw;
                  return `${context.dataset.label}: $${Math.round(val).toLocaleString('en-US')}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              min: window.selectedStartYear,
              max: window.selectedEndYear,
              grid: { color: 'rgba(30, 41, 59, 0.4)' },
              ticks: {
                stepSize: 1,
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 11 },
                callback: val => Number.isInteger(val) ? val.toString() : ''
              }
            },
            y: {
              grid: { color: 'rgba(30, 41, 59, 0.4)' },
              ticks: {
                color: '#64748b',
                font: { family: 'JetBrains Mono', size: 10 },
                callback: val => '$' + (val >= 1000000 ? (val / 1000000).toFixed(2) + 'M' : (val / 1000).toFixed(0) + 'k')
              }
            }
          }
        }
      });
    }

    // Modal Snapshot Controller
    function openSnapshotModal() {
      const modal = document.getElementById('modalSnapshot');
      if (!modal) return;
      const dateInput = document.getElementById('snapInputDate');
      const labelInput = document.getElementById('snapInputLabel');
      
      const today = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = today;
      if (labelInput) labelInput.value = `Snapshot ${today}`;

      populateCurrentBalancesInSnapshotModal();
      modal.classList.remove('hidden');
    }

    function closeSnapshotModal() {
      const modal = document.getElementById('modalSnapshot');
      if (modal) modal.classList.add('hidden');
    }

    function populateCurrentBalancesInSnapshotModal() {
      const list = document.getElementById('snapshotBalancesFormList');
      if (!list) return;
      list.innerHTML = window.appState.assets.map(a => `
        <div class="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-0">
          <span class="text-slate-300 font-medium truncate max-w-[200px]">${a.name}</span>
          <div class="flex items-center gap-1">
            <span class="text-slate-500 font-mono">$</span>
            <input type="number" step="0.01" data-snap-asset-id="${a.id}" value="${a.balance}" class="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right font-mono text-white text-xs focus:outline-none focus:border-emerald-500">
          </div>
        </div>
      `).join('');
    }

    function saveSnapshotFromModal() {
      const dateInput = document.getElementById('snapInputDate').value;
      const labelInput = document.getElementById('snapInputLabel').value.trim() || dateInput;
      if (!dateInput) {
        alert('Please provide a valid snapshot date.');
        return;
      }

      const inputs = document.querySelectorAll('#snapshotBalancesFormList input[data-snap-asset-id]');
      const balances = {};
      inputs.forEach(input => {
        const id = input.getAttribute('data-snap-asset-id');
        balances[id] = parseFloat(input.value) || 0;
      });

      const year = parseInt(dateInput.split('-')[0]);

      // Remove existing snapshot on same exact date if present
      window.appState.historicalSnapshots = window.appState.historicalSnapshots.filter(s => s.date !== dateInput);

      window.appState.historicalSnapshots.push({
        date: dateInput,
        year: year,
        label: labelInput,
        balances: balances
      });

      // Re-sort snapshots chronologically
      window.appState.historicalSnapshots.sort((a, b) => (a.date || (a.year + '-12-31')).localeCompare(b.date || (b.year + '-12-31')));

      // Recalculate 5-Year CAGRs based on earliest snapshot ~5 years ago
      recalculateAllAssetCAGRs();

      saveState();
      renderAssetsTable();
      updateSliderControls();
      renderAssetTrendsChart();
      closeSnapshotModal();
      alert(`Snapshot for ${dateInput} (${labelInput}) recorded successfully! 5-Year CAGRs updated.`);
    }


    // Version switcher placeholder (Multi-Version Snapshot Comparison is [FUTURE STATE])
    function switchVersion(val) {
      if (val === 'current') {
        renderAssetsTable();
      }
    }

    // =========================================================================
    // ASSUMPTIONS & RSUS CONTROLLER FUNCTIONS
    // =========================================================================

    function initAssumptions() {
      const a = window.appState.assumptions;
      if (!a) return;

      // Incomes & Additions
      if (document.getElementById('inpJSalary')) document.getElementById('inpJSalary').value = a.incomes.jSalary;
      if (document.getElementById('inpNSalary')) document.getElementById('inpNSalary').value = a.incomes.nSalary;
      if (document.getElementById('inpAdd401k')) document.getElementById('inpAdd401k').value = a.incomes.add401k;
      if (document.getElementById('inpAddIRA')) document.getElementById('inpAddIRA').value = a.incomes.addIRA;

      // Social Security Parameters
      if (document.getElementById('inpSSMonthly')) document.getElementById('inpSSMonthly').value = a.incomes.ssMonthly;
      if (document.getElementById('inpSSClaimAge')) document.getElementById('inpSSClaimAge').value = a.incomes.ssClaimAge;
      if (document.getElementById('inpSSCutPct')) document.getElementById('inpSSCutPct').value = Math.round(a.incomes.ssCutPct * 100);

      // Decadal Lifestyle Decay Sliders
      if (document.getElementById('sliderDecay50s')) document.getElementById('sliderDecay50s').value = a.decadalDecay.age50to59;
      if (document.getElementById('sliderDecay60s')) document.getElementById('sliderDecay60s').value = a.decadalDecay.age60to69;
      if (document.getElementById('sliderDecay70s')) document.getElementById('sliderDecay70s').value = a.decadalDecay.age70to79;
      if (document.getElementById('sliderDecay80s')) document.getElementById('sliderDecay80s').value = a.decadalDecay.age80to100;

      if (document.getElementById('lblDecay50s')) document.getElementById('lblDecay50s').innerText = Math.round(a.decadalDecay.age50to59 * 100) + '%';
      if (document.getElementById('lblDecay60s')) document.getElementById('lblDecay60s').innerText = Math.round(a.decadalDecay.age60to69 * 100) + '%';
      if (document.getElementById('lblDecay70s')) document.getElementById('lblDecay70s').innerText = Math.round(a.decadalDecay.age70to79 * 100) + '%';
      if (document.getElementById('lblDecay80s')) document.getElementById('lblDecay80s').innerText = Math.round(a.decadalDecay.age80to100 * 100) + '%';

      // Macro Sliders
      updateWeightedReturnBadge();
      if (document.getElementById('sliderEffectiveTax')) document.getElementById('sliderEffectiveTax').value = (a.macro.effectiveTax * 100).toFixed(1);
      if (document.getElementById('sliderCpiInflation')) document.getElementById('sliderCpiInflation').value = (a.macro.cpiInflation * 100).toFixed(1);
      if (document.getElementById('sliderHealthcareInflation')) document.getElementById('sliderHealthcareInflation').value = ((a.macro.healthcareInflation !== undefined ? a.macro.healthcareInflation : 0.045) * 100).toFixed(1);

      if (document.getElementById('lblEffectiveTax')) document.getElementById('lblEffectiveTax').innerText = (a.macro.effectiveTax * 100).toFixed(1) + '%';
      if (document.getElementById('lblCpiInflation')) document.getElementById('lblCpiInflation').innerText = (a.macro.cpiInflation * 100).toFixed(1) + '%';
      if (document.getElementById('lblHealthcareInflation')) document.getElementById('lblHealthcareInflation').innerText = ((a.macro.healthcareInflation !== undefined ? a.macro.healthcareInflation : 0.045) * 100).toFixed(1) + '%';

      // Target Retirement Age Sliders (Dashboard & Forecasts)
      const retAge = (window.appState.user && window.appState.user.retireAge) ? window.appState.user.retireAge : 52.0;
      const elRetSlider = document.getElementById('sliderRetireAge');
      const elRetSliderFc = document.getElementById('sliderRetireAgeForecasts');
      if (elRetSlider) elRetSlider.value = retAge;
      if (elRetSliderFc) elRetSliderFc.value = retAge;
      const { currentAge, currentYear } = getCurrentAgeAndYear();
      const targetYear = Math.round(currentYear + (retAge - currentAge));
      const yearsLeft = Math.max(0, retAge - currentAge).toFixed(1);
      if (document.getElementById('sliderRetireAgeLabel')) document.getElementById('sliderRetireAgeLabel').innerText = `Age ${retAge.toFixed(1)} (Year ${targetYear})`;
      if (document.getElementById('sliderRetireSpanLabel')) document.getElementById('sliderRetireSpanLabel').innerText = `${yearsLeft} Working Years Remaining`;
      if (document.getElementById('sliderRetireAgeLabelForecasts')) document.getElementById('sliderRetireAgeLabelForecasts').innerText = `Age ${retAge.toFixed(1)} (Year ${targetYear})`;
      if (document.getElementById('sliderRetireSpanLabelForecasts')) document.getElementById('sliderRetireSpanLabelForecasts').innerText = `${yearsLeft} Working Years Remaining`;
      if (document.getElementById('subtextFireAge')) document.getElementById('subtextFireAge').innerText = retAge.toFixed(1);
      if (document.getElementById('subtextFireYear')) document.getElementById('subtextFireYear').innerText = targetYear;

      // Discretionary Lifestyle Trim Sliders (Dashboard & Forecasts)
      const trimPct = (window.appState.user && window.appState.user.leanTrimPct !== undefined) ? window.appState.user.leanTrimPct : 0;
      const elLeanSlider = document.getElementById('leanSlider');
      const elLeanSliderFc = document.getElementById('leanSliderForecasts');
      if (elLeanSlider) elLeanSlider.value = trimPct;
      if (elLeanSliderFc) elLeanSliderFc.value = trimPct;

      // Roth Conversion Ladder Toggle
      const enableRoth = a.macro.enableRothConversion !== false;
      const tParams = document.getElementById('toggleRothConversionParams');
      const tPlaybook = document.getElementById('toggleRothConversionPlaybook');
      if (tParams) tParams.checked = enableRoth;
      if (tPlaybook) tPlaybook.checked = enableRoth;
      const lblP1 = document.getElementById('lblRothToggleParams');
      const lblP2 = document.getElementById('lblRothTogglePlaybook');
      if (lblP1) lblP1.innerText = enableRoth ? 'Active (ON)' : 'Disabled (OFF)';
      if (lblP2) lblP2.innerText = enableRoth ? 'Active (ON)' : 'Disabled (OFF)';

      // Asset Allocation Glide Path & Conservative Return Taper (Toggle 1)
      const gp = a.glidePath || { enabled: false, onsetAge: 60, terminalAge: 75, terminalReturn: 0.055 };
      const tGlide = document.getElementById('toggleGlidePath');
      if (tGlide) tGlide.checked = !!gp.enabled;
      const lblGlide = document.getElementById('lblGlidePathToggle');
      if (lblGlide) lblGlide.innerText = gp.enabled ? 'Active (ON)' : 'Disabled (OFF)';
      const gpControls = document.getElementById('glidePathControls');
      if (gpControls) {
        if (gp.enabled) {
          gpControls.classList.remove('opacity-50', 'pointer-events-none');
        } else {
          gpControls.classList.add('opacity-50', 'pointer-events-none');
        }
      }
      if (document.getElementById('sliderGlideOnsetAge')) document.getElementById('sliderGlideOnsetAge').value = gp.onsetAge !== undefined ? gp.onsetAge : 60;
      if (document.getElementById('lblGlideOnsetAge')) document.getElementById('lblGlideOnsetAge').innerText = 'Age ' + Math.round(gp.onsetAge !== undefined ? gp.onsetAge : 60);
      if (document.getElementById('sliderGlideTerminalAge')) document.getElementById('sliderGlideTerminalAge').value = gp.terminalAge !== undefined ? gp.terminalAge : 75;
      if (document.getElementById('lblGlideTerminalAge')) document.getElementById('lblGlideTerminalAge').innerText = 'Age ' + Math.round(gp.terminalAge !== undefined ? gp.terminalAge : 75);
      if (document.getElementById('sliderGlideTerminalReturn')) document.getElementById('sliderGlideTerminalReturn').value = ((gp.terminalReturn !== undefined ? gp.terminalReturn : 0.055) * 100).toFixed(1);
      if (document.getElementById('lblGlideTerminalReturn')) document.getElementById('lblGlideTerminalReturn').innerText = ((gp.terminalReturn !== undefined ? gp.terminalReturn : 0.055) * 100).toFixed(1) + '%';

      renderRsuTable();
      renderEventsList();
      renderStrategicPlaybook();
    }

    function onIncomeChange(field, val) {
      if (!window.appState.assumptions.incomes) window.appState.assumptions.incomes = {};
      window.appState.assumptions.incomes[field] = parseFloat(val) || 0;
      saveState();
      updateMasterTrajectory();
      markMcStale();
    }

    function onDecadalSliderChange(key, val) {
      if (!window.appState.assumptions.decadalDecay) window.appState.assumptions.decadalDecay = {};
      const num = parseFloat(val) / 100;
      window.appState.assumptions.decadalDecay[key] = num;
      if (key === 'age50to59' && document.getElementById('lblDecay50s')) document.getElementById('lblDecay50s').innerText = Math.round(num * 100) + '%';
      if (key === 'age60to69' && document.getElementById('lblDecay60s')) document.getElementById('lblDecay60s').innerText = Math.round(num * 100) + '%';
      if (key === 'age70to79' && document.getElementById('lblDecay70s')) document.getElementById('lblDecay70s').innerText = Math.round(num * 100) + '%';
      if (key === 'age80to100' && document.getElementById('lblDecay80s')) document.getElementById('lblDecay80s').innerText = Math.round(num * 100) + '%';
      saveState();
      updateMasterTrajectory();
      markMcStale();
    }

    function onMacroSliderChange(field, val) {
      if (!window.appState.assumptions.macro) window.appState.assumptions.macro = {};
      const num = parseFloat(val);
      window.appState.assumptions.macro[field] = num / 100;
      if (field === 'effectiveTax' && document.getElementById('lblEffectiveTax')) document.getElementById('lblEffectiveTax').innerText = num.toFixed(1) + '%';
      if (field === 'cpiInflation' && document.getElementById('lblCpiInflation')) document.getElementById('lblCpiInflation').innerText = num.toFixed(1) + '%';
      if (field === 'healthcareInflation' && document.getElementById('lblHealthcareInflation')) document.getElementById('lblHealthcareInflation').innerText = num.toFixed(1) + '%';
      saveState();
      updateMasterTrajectory();
      markMcStale();
    }

    function toggleGlidePath(enabled) {
      const isEnabled = !!enabled;
      if (!window.appState.assumptions) window.appState.assumptions = {};
      if (!window.appState.assumptions.glidePath) {
        window.appState.assumptions.glidePath = { enabled: false, onsetAge: 60, terminalAge: 75, terminalReturn: 0.055 };
      }
      window.appState.assumptions.glidePath.enabled = isEnabled;

      const tGlide = document.getElementById('toggleGlidePath');
      if (tGlide && tGlide.checked !== isEnabled) tGlide.checked = isEnabled;
      const lblGlide = document.getElementById('lblGlidePathToggle');
      if (lblGlide) lblGlide.innerText = isEnabled ? 'Active (ON)' : 'Disabled (OFF)';

      const gpControls = document.getElementById('glidePathControls');
      if (gpControls) {
        if (isEnabled) {
          gpControls.classList.remove('opacity-50', 'pointer-events-none');
        } else {
          gpControls.classList.add('opacity-50', 'pointer-events-none');
        }
      }

      saveState();
      updateMasterTrajectory();
      markMcStale();
      if (window.activeForecastSubTab === 'ledger') {
        renderForecastLedgerTable();
      }
    }

    function onGlideSliderChange(field, val) {
      if (!window.appState.assumptions) window.appState.assumptions = {};
      if (!window.appState.assumptions.glidePath) {
        window.appState.assumptions.glidePath = { enabled: false, onsetAge: 60, terminalAge: 75, terminalReturn: 0.055 };
      }
      const num = parseFloat(val);
      if (field === 'onsetAge') {
        window.appState.assumptions.glidePath.onsetAge = num;
        if (document.getElementById('lblGlideOnsetAge')) document.getElementById('lblGlideOnsetAge').innerText = 'Age ' + Math.round(num);
      } else if (field === 'terminalAge') {
        window.appState.assumptions.glidePath.terminalAge = num;
        if (document.getElementById('lblGlideTerminalAge')) document.getElementById('lblGlideTerminalAge').innerText = 'Age ' + Math.round(num);
      } else if (field === 'terminalReturn') {
        window.appState.assumptions.glidePath.terminalReturn = num / 100;
        if (document.getElementById('lblGlideTerminalReturn')) document.getElementById('lblGlideTerminalReturn').innerText = num.toFixed(1) + '%';
      }

      saveState();
      updateMasterTrajectory();
      markMcStale();
      if (window.activeForecastSubTab === 'ledger') {
        renderForecastLedgerTable();
      }
    }

    // Equity Vesting Schedule (GOOG RSUs) Table Renderer & CRUD
    function renderRsuTable() {
      const tbody = document.getElementById('rsuTableBody');
      if (!tbody) return;
      const grants = (window.appState.assumptions.rsuGrants || []).sort((a, b) => a.year - b.year);

      if (grants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-slate-500">No RSU grants scheduled. Click "+ Add Year" above.</td></tr>';
        return;
      }

      const eqAsset = (window.appState.assets || []).find(a => a.isSingleStock || (a.name && (a.name.toLowerCase().includes('equity') || a.name.toLowerCase().includes('stock'))));
      const eqStartPrice = (eqAsset && eqAsset.sharePrice) ? eqAsset.sharePrice : 100.00;
      const eqReturn = (eqAsset && eqAsset.expectedReturn !== undefined) ? eqAsset.expectedReturn : 0.07;

      let totalGross = 0;
      let totalTaxShares = 0;
      let totalNetShares = 0;
      let totalNetValue = 0;

      const { currentAge, currentYear } = getCurrentAgeAndYear();
      let rowsHtml = grants.map(g => {
        const yrOffset = Math.max(0, g.year - currentYear);
        const estPrice = eqStartPrice * Math.pow(1 + eqReturn, yrOffset);
        const grossUnits = g.grossUnits !== undefined ? g.grossUnits : (g.amount ? Math.round(g.amount / estPrice) : 0);
        const withHoldPct = g.withholdingPct !== undefined ? g.withholdingPct : 0.45;
        const taxShares = Math.round(grossUnits * withHoldPct);
        const netShares = grossUnits - taxShares;
        const netValue = Math.round(netShares * estPrice);

        totalGross += grossUnits;
        totalTaxShares += taxShares;
        totalNetShares += netShares;
        totalNetValue += netValue;

        const age = Math.floor(currentAge) + (g.year - currentYear);

        return `
          <tr class="hover:bg-slate-900/40 transition">
            <td class="py-2 px-3 font-semibold text-white">${g.year}</td>
            <td class="py-2 px-3 text-slate-400">Age ${age}</td>
            <td class="py-2 px-3 text-right">
              <div class="relative inline-block w-28">
                <input type="number" step="10" min="0" value="${grossUnits}" onchange="updateRsuGrossUnits(${g.year}, this.value)" class="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right font-mono text-white text-xs focus:outline-none focus:border-indigo-500">
              </div>
            </td>
            <td class="py-2 px-3 text-right text-rose-400/90 text-xs tabular-nums">
              -${taxShares.toLocaleString()} sh <span class="text-[10px] text-slate-500">(${Math.round(withHoldPct * 100)}%)</span>
            </td>
            <td class="py-2 px-3 text-right text-emerald-400 font-semibold text-xs tabular-nums">
              ${netShares.toLocaleString()} sh
            </td>
            <td class="py-2 px-3 text-right text-slate-400 text-xs tabular-nums">
              $${estPrice.toFixed(2)}
            </td>
            <td class="py-2 px-3 text-right font-semibold text-white text-xs tabular-nums">
              $${netValue.toLocaleString()}
            </td>
            <td class="py-2 px-3 text-center">
              <button onclick="deleteRsuGrant(${g.year})" class="text-slate-500 hover:text-rose-400 font-bold px-1 text-sm transition" title="Delete Year">&times;</button>
            </td>
          </tr>
        `;
      }).join('');

      rowsHtml += `
        <tr class="bg-slate-950/80 font-bold border-t border-slate-700">
          <td class="py-2.5 px-3 text-white">Total Vesting</td>
          <td class="py-2.5 px-3 text-slate-400">${grants.length} Yrs</td>
          <td class="py-2.5 px-3 text-right font-mono text-white tabular-nums">${totalGross.toLocaleString()}</td>
          <td class="py-2.5 px-3 text-right font-mono text-rose-400/80 tabular-nums">-${totalTaxShares.toLocaleString()}</td>
          <td class="py-2.5 px-3 text-right font-mono text-emerald-400 tabular-nums">${totalNetShares.toLocaleString()}</td>
          <td class="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">—</td>
          <td class="py-2.5 px-3 text-right font-mono text-emerald-400 tabular-nums">$${totalNetValue.toLocaleString()}</td>
          <td></td>
        </tr>
      `;
      tbody.innerHTML = rowsHtml;
    }

    function addRsuGrantYear() {
      const grants = window.appState.assumptions.rsuGrants || [];
      const maxYear = grants.length > 0 ? Math.max(...grants.map(g => g.year)) : 2025;
      const nextYear = maxYear + 1;
      const lastGross = grants.length > 0 ? (grants[grants.length - 1].grossUnits !== undefined ? grants[grants.length - 1].grossUnits : 530) : 530;
      grants.push({ year: nextYear, grossUnits: lastGross, withholdingPct: 0.45 });
      window.appState.assumptions.rsuGrants = grants;
      saveState();
      renderRsuTable();
      updateMasterTrajectory();
      markMcStale();
    }

    function updateRsuGrossUnits(year, units) {
      const grant = (window.appState.assumptions.rsuGrants || []).find(g => g.year === year);
      if (grant) {
        grant.grossUnits = parseFloat(units) || 0;
        if (grant.withholdingPct === undefined) grant.withholdingPct = 0.45;

        // Also update legacy amount for backward compatibility
        const eqAsset = (window.appState.assets || []).find(a => a.isSingleStock || (a.name && (a.name.toLowerCase().includes('equity') || a.name.toLowerCase().includes('stock'))));
        const eqStartPrice = (eqAsset && eqAsset.sharePrice) ? eqAsset.sharePrice : 100.00;
        const eqReturn = (eqAsset && eqAsset.expectedReturn !== undefined) ? eqAsset.expectedReturn : 0.07;
        const { currentYear } = getCurrentAgeAndYear();
        const yrOffset = Math.max(0, year - currentYear);
        const estPrice = eqStartPrice * Math.pow(1 + eqReturn, yrOffset);
        grant.amount = Math.round(grant.grossUnits * (1 - grant.withholdingPct) * estPrice);

        saveState();
        renderRsuTable();
        updateMasterTrajectory();
        markMcStale();
      }
    }

    function updateRsuGrant(year, amount) {
      // Legacy wrapper
      const grant = (window.appState.assumptions.rsuGrants || []).find(g => g.year === year);
      if (grant) {
        grant.amount = parseFloat(amount) || 0;
        saveState();
        renderRsuTable();
        updateMasterTrajectory();
        markMcStale();
      }
    }

    function deleteRsuGrant(year) {
      window.appState.assumptions.rsuGrants = (window.appState.assumptions.rsuGrants || []).filter(g => g.year !== year);
      saveState();
      renderRsuTable();
      updateMasterTrajectory();
      markMcStale();
    }

    // Discrete Life Events Controller
    function openAddEventModal() {
      const modal = document.getElementById('modalEvent');
      if (!modal) return;
      document.getElementById('inpEventName').value = '';
      document.getElementById('inpEventYear').value = 2035;
      document.getElementById('inpEventAmount').value = '';
      modal.classList.remove('hidden');
    }

    function closeEventModal() {
      const modal = document.getElementById('modalEvent');
      if (modal) modal.classList.add('hidden');
    }

    function saveEventFromModal() {
      const name = document.getElementById('inpEventName').value.trim();
      const year = parseInt(document.getElementById('inpEventYear').value) || 2035;
      const amount = parseFloat(document.getElementById('inpEventAmount').value) || 0;
      if (!name) {
        alert('Please enter an event description.');
        return;
      }
      if (!window.appState.assumptions.events) window.appState.assumptions.events = [];
      window.appState.assumptions.events.push({ year, name, amount });
      saveState();
      renderEventsList();
      updateMasterTrajectory();
      markMcStale();
      closeEventModal();
    }

    function deleteEvent(idx) {
      if (window.appState.assumptions.events) {
        window.appState.assumptions.events.splice(idx, 1);
        saveState();
        renderEventsList();
        updateMasterTrajectory();
        markMcStale();
      }
    }

    function renderEventsList() {
      const container = document.getElementById('eventsListContainer');
      if (!container) return;
      const events = window.appState.assumptions.events || [];
      if (events.length === 0) {
        container.className = "p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500";
        container.innerHTML = 'No discrete events configured. Click "+ Add Event" above.';
        return;
      }
      container.className = "space-y-2 text-xs";
      container.innerHTML = events.map((ev, idx) => `
        <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60">${ev.year}</span>
            <span class="font-semibold text-white">${ev.name}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold ${ev.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${ev.amount >= 0 ? '+$' : '-$'}${Math.abs(ev.amount).toLocaleString()}</span>
            <button onclick="deleteEvent(${idx})" class="text-slate-500 hover:text-rose-400 text-sm font-bold">&times;</button>
          </div>
        </div>
      `).join('');
    }

    // Trajectory Chart Display Modes & State
    window.trajectoryDisplayMode = 'nominal'; // 'nominal' | 'real'
    window.trajFocusMode = false;
    window.trajLogMode = false;

    // Initialize Page
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('DOMContentLoaded', () => {
        loadDataFromCSV();
        loadSavedState();
        renderAssetsTable();
        renderSpendingTable();
        renderSpendingTrendsChart();
        initAssumptions();
        updateRetireMath();
        updateMasterTrajectory();
        initSeriesSelection();
        runMonteCarloSimulation();
      });
    }

    function setTrajectoryMode(mode) {
      window.trajectoryDisplayMode = mode;
      const btnNom = document.getElementById('btnTrajNominal');
      const btnReal = document.getElementById('btnTrajReal');
      if (btnNom && btnReal) {
        if (mode === 'nominal') {
          btnNom.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
          btnReal.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        } else {
          btnReal.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
          btnNom.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        }
      }
      updateMasterTrajectory();
    }

    function toggleTrajFocus() {
      window.trajFocusMode = !window.trajFocusMode;
      if (window.trajFocusMode && window.trajLogMode) {
        window.trajLogMode = false;
        const logBtn = document.getElementById('btnTrajLog');
        if (logBtn) logBtn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
      }
      const btn = document.getElementById('btnTrajFocus');
      if (btn) {
        if (window.trajFocusMode) {
          btn.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
        } else {
          btn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        }
      }
      if (masterChartInstance) {
        masterChartInstance.options.scales.y.type = window.trajLogMode ? 'logarithmic' : 'linear';
        masterChartInstance.options.scales.y.max = (window.trajFocusMode && !window.trajLogMode) ? 25000000 : undefined;
        masterChartInstance.update();
      }
    }

    function toggleTrajLog() {
      window.trajLogMode = !window.trajLogMode;
      if (window.trajLogMode && window.trajFocusMode) {
        window.trajFocusMode = false;
        const focusBtn = document.getElementById('btnTrajFocus');
        if (focusBtn) focusBtn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
      }
      const btn = document.getElementById('btnTrajLog');
      if (btn) {
        if (window.trajLogMode) {
          btn.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
        } else {
          btn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        }
      }
      if (masterChartInstance) {
        masterChartInstance.options.scales.y.type = window.trajLogMode ? 'logarithmic' : 'linear';
        masterChartInstance.options.scales.y.max = (window.trajFocusMode && !window.trajLogMode) ? 25000000 : undefined;
        masterChartInstance.update();
      }
    }

    // Master Trajectory Engine & Chart
    let masterChartInstance = null;

    function updateDashboardScorecards(sim, userRetireAge = 52.0) {
      const elRetire = document.getElementById('scorecardNwRetire');
      const elTerminal = document.getElementById('scorecardTerminal');
      const elPeak = document.getElementById('scorecardPeak');
      const elDrawdown = document.getElementById('scorecardDrawdown');

      const elRetireBadge = document.getElementById('scorecardRetireYearsBadge');
      const elRetireSub = document.getElementById('scorecardRetireSub');
      const elTerminalBadge = document.getElementById('scorecardTerminalBadge');
      const elTerminalSub = document.getElementById('scorecardTerminalSub');
      const elPeakYearBadge = document.getElementById('scorecardPeakYearBadge');
      const elPeakSub = document.getElementById('scorecardPeakSub');

      const isReal = window.trajectoryDisplayMode === 'real';
      const suffix = isReal ? ' (Real)' : '';

      const nwRetire = sim.nwAtRetire || 0;
      const terminalNw = sim.terminalNW || 0;
      const peakNw = sim.peakNW || 0;
      const totalDrawdown = sim.totalDisbursed || 0;
      const peakAge = sim.peakAge || 43;
      const depletionAge = sim.depletionAge;

      if (elRetire) elRetire.innerText = '$' + (nwRetire / 1000000).toFixed(2) + 'M';
      if (elTerminal) elTerminal.innerText = '$' + (terminalNw / 1000000).toFixed(2) + 'M';
      if (elPeak) elPeak.innerText = '$' + (peakNw / 1000000).toFixed(2) + 'M';
      if (elDrawdown) elDrawdown.innerText = '$' + (totalDrawdown / 1000000).toFixed(2) + 'M';

      const { currentAge, currentYear } = getCurrentAgeAndYear();
      const yearsLeft = Math.max(0, userRetireAge - currentAge).toFixed(1);
      const targetYear = Math.round(currentYear + (userRetireAge - currentAge));

      if (elRetireBadge) elRetireBadge.innerText = (yearsLeft === '0.0' || userRetireAge <= currentAge) ? 'Retired' : `In ${yearsLeft} Yrs`;
      if (elRetireSub) elRetireSub.innerText = `Age ${userRetireAge.toFixed(1)} / ${targetYear} target milestone`;

      if (elTerminalBadge) {
        if (terminalNw > 0 && depletionAge === null) {
          elTerminalBadge.innerText = 'Full Runway';
          elTerminalBadge.className = 'px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono';
          if (elTerminalSub) elTerminalSub.innerText = 'Safe portfolio runway through 100';
          if (elTerminal) elTerminal.className = 'mt-2 text-2xl font-bold font-mono text-emerald-400 tabular-nums';
        } else {
          elTerminalBadge.innerText = `Depleted @ Age ${depletionAge || 100}`;
          elTerminalBadge.className = 'px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 font-mono';
          if (elTerminalSub) elTerminalSub.innerText = `Portfolio exhausted at Age ${depletionAge || 100}`;
          if (elTerminal) elTerminal.className = 'mt-2 text-2xl font-bold font-mono text-rose-400 tabular-nums';
        }
      }

      if (elPeakYearBadge) elPeakYearBadge.innerText = `Year ${currentYear + (peakAge - Math.floor(currentAge))}`;
      if (elPeakSub) elPeakSub.innerText = `Occurs at Age ${peakAge}${suffix}`;
    }

    // Multi-Asset Calculation Engine (Authoritative Single Source of Truth in src/engine.js)
    function getAssetBuckets() {
      return (window.FireEngine || FireEngine).getAssetBuckets(window.appState);
    }

    function runMultiAssetSimulation(opts = {}) {
      return (window.FireEngine || FireEngine).runMultiAssetSimulation(opts, window.appState);
    }

    // Earliest Feasible FIRE Solver: Finds lowest retirement age surviving to Age 100
    function calculateEarliestFireAge(trimPct = 0) {
      return (window.FireEngine || FireEngine).calculateEarliestFireAge(trimPct, window.appState);
    }

    // Handler when user drags Target Retirement Age slider
    function onRetireAgeSliderChange(val) {
      const age = parseFloat(val);
      if (!window.appState.user) window.appState.user = {};
      window.appState.user.retireAge = age;

      // Sync slider inputs across both tabs
      const s1 = document.getElementById('sliderRetireAge');
      const s2 = document.getElementById('sliderRetireAgeForecasts');
      if (s1 && parseFloat(s1.value) !== age) s1.value = age;
      if (s2 && parseFloat(s2.value) !== age) s2.value = age;

      const { currentAge, currentYear } = getCurrentAgeAndYear();
      const targetYear = Math.round(currentYear + (age - currentAge));
      const yearsLeft = Math.max(0, age - currentAge).toFixed(1);

      const elLabel = document.getElementById('sliderRetireAgeLabel');
      const elSpan = document.getElementById('sliderRetireSpanLabel');
      const elLabelFc = document.getElementById('sliderRetireAgeLabelForecasts');
      const elSpanFc = document.getElementById('sliderRetireSpanLabelForecasts');

      const elVal = document.getElementById('targetRetireAgeVal');
      const elLeft = document.getElementById('targetYearsLeftVal');
      const elSubAge = document.getElementById('subtextFireAge');
      const elSubYr = document.getElementById('subtextFireYear');

      const labelText = `Age ${age.toFixed(1)} (Year ${targetYear})`;
      const spanText = `${yearsLeft} Working Years Remaining`;

      if (elLabel) elLabel.innerText = labelText;
      if (elSpan) elSpan.innerText = spanText;
      if (elLabelFc) elLabelFc.innerText = labelText;
      if (elSpanFc) elSpanFc.innerText = spanText;

      if (elVal) elVal.innerHTML = `Age ${age.toFixed(1)} <span class="text-xs font-normal text-slate-400">(${targetYear})</span>`;
      if (elLeft) elLeft.innerText = `~${yearsLeft} working years left`;
      if (elSubAge) elSubAge.innerText = age.toFixed(1);
      if (elSubYr) elSubYr.innerText = targetYear;

      saveState();
      updateRetireMath();
      updateMasterTrajectory();
      markMcStale();
      renderStrategicPlaybook();
    }

    // Handler when user drags Lean / Trim Discretionary slider
    function onLeanSliderChange(val) {
      const trimVal = parseFloat(val) || 0;
      if (!window.appState.user) window.appState.user = {};
      window.appState.user.leanTrimPct = trimVal;

      // Sync slider inputs across both tabs
      const s1 = document.getElementById('leanSlider');
      const s2 = document.getElementById('leanSliderForecasts');
      if (s1 && parseFloat(s1.value) !== trimVal) s1.value = trimVal;
      if (s2 && parseFloat(s2.value) !== trimVal) s2.value = trimVal;

      saveState();
      updateRetireMath();
      updateMasterTrajectory();
      markMcStale();
    }

    // Retirement Timing Math & Assessment Cards
    function updateRetireMath() {
      const { currentAge, currentYear } = getCurrentAgeAndYear();
      const targetRetireAge = (window.appState.user && window.appState.user.retireAge) ? window.appState.user.retireAge : 52.0;

      // 1. Calculate Earliest Feasible FIRE with 0% Spending Cuts
      const earliestZeroCutAge = calculateEarliestFireAge(0);
      const earliestZeroCutYear = Math.round(currentYear + (earliestZeroCutAge - currentAge));
      const earliestZeroCutYearsLeft = Math.max(0, earliestZeroCutAge - currentAge).toFixed(1);

      const elEarliestAge = document.getElementById('earliestFireAgeVal');
      const elEarliestYrs = document.getElementById('earliestFireYrsLeftVal');
      if (elEarliestAge) {
        elEarliestAge.innerHTML = `Age ${earliestZeroCutAge.toFixed(1)} <span class="text-xs font-normal text-slate-400">(${earliestZeroCutYear})</span>`;
      }
      if (elEarliestYrs) {
        elEarliestYrs.innerText = `~${earliestZeroCutYearsLeft} working years left`;
      }

      // 2. Active Target Retirement Age card update
      const targetYear = Math.round(currentYear + (targetRetireAge - currentAge));
      const targetYearsLeft = Math.max(0, targetRetireAge - currentAge).toFixed(1);
      const elTargetVal = document.getElementById('targetRetireAgeVal');
      const elTargetLeft = document.getElementById('targetYearsLeftVal');
      if (elTargetVal) {
        elTargetVal.innerHTML = `Age ${targetRetireAge.toFixed(1)} <span class="text-xs font-normal text-slate-400">(${targetYear})</span>`;
      }
      if (elTargetLeft) {
        elTargetLeft.innerText = `~${targetYearsLeft} working years left`;
      }

      // 3. Lean Path (Discretionary Trim) calculation
      const trimSlider = document.getElementById('leanSlider');
      const trimPct = trimSlider ? parseFloat(trimSlider.value) : ((window.appState.user && window.appState.user.leanTrimPct !== undefined) ? window.appState.user.leanTrimPct : 0);
      const discPool = (window.appState.spending || []).filter(x => x.type === 'Discretionary').reduce((s, x) => s + (x.actual2025 || 0), 0) || 93704;
      const dollarsTrimmed = Math.round(discPool * (trimPct / 100));

      const leanFireAge = calculateEarliestFireAge(trimPct / 100);
      const leanFireYear = Math.round(currentYear + (leanFireAge - currentAge));
      const leanYearsLeft = Math.max(0, leanFireAge - currentAge).toFixed(1);
      const yearsSaved = Math.max(0, earliestZeroCutAge - leanFireAge).toFixed(1);

      const elTrimText = document.getElementById('trimSliderText');
      const elTrimTextFc = document.getElementById('trimSliderTextForecasts');
      const elTrimBadge = document.getElementById('leanTrimPctLabel');
      const elSavedBadge = document.getElementById('leanSavedBadge');
      const elSavedText = document.getElementById('yearsSavedText');
      const elSavedTextFc = document.getElementById('yearsSavedTextForecasts');
      const elLeanAge = document.getElementById('leanRetireAgeVal');
      const elLeanYears = document.getElementById('leanYearsLeftVal');

      const trimDisplayStr = `${trimPct}% (-$${dollarsTrimmed.toLocaleString()} / yr)`;
      const savedDisplayStr = `Retire ${yearsSaved} Years Sooner`;

      if (elTrimText) elTrimText.innerText = trimDisplayStr;
      if (elTrimTextFc) elTrimTextFc.innerText = trimDisplayStr;
      if (elTrimBadge) elTrimBadge.innerText = `-${trimPct}%`;
      if (elSavedBadge) elSavedBadge.innerText = `-${yearsSaved} Yrs`;
      if (elSavedText) elSavedText.innerText = savedDisplayStr;
      if (elSavedTextFc) elSavedTextFc.innerText = savedDisplayStr;
      if (elLeanAge) elLeanAge.innerHTML = `Age ${leanFireAge.toFixed(1)} <span class="text-xs font-normal text-slate-400">(${leanFireYear})</span>`;
      if (elLeanYears) elLeanYears.innerText = `${leanYearsLeft} working years left`;
    }

    function updateMasterTrajectory() {
      const ctx = document.getElementById('masterTrajectoryChart');
      if (!ctx) return;

      const userRetireAge = (window.appState.user && window.appState.user.retireAge) ? window.appState.user.retireAge : 52.0;
      const trimSlider = document.getElementById('leanSlider');
      const trimPct = trimSlider ? (parseFloat(trimSlider.value) || 0) / 100 : 0;
      const isReal = window.trajectoryDisplayMode === 'real';

      const sim = runMultiAssetSimulation({
        retireAge: userRetireAge,
        trimPct,
        displayReal: isReal
      });

      const ages = sim.rows.map(r => 'Age ' + r.age);
      const nwData = sim.rows.map(r => r.netWorth);

      // Update Status Badge
      const statusBadge = document.getElementById('timingStatusBadge');
      if (statusBadge) {
        if (sim.terminalNW > 0 && sim.depletionAge === null) {
          statusBadge.innerText = "Solvent to Age 100";
          statusBadge.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60";
        } else {
          statusBadge.innerText = `Depletes at Age ${sim.depletionAge || 100}`;
          statusBadge.className = "px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60";
        }
      }

      // Update Chart
      const { currentYear } = getCurrentAgeAndYear();
      const realLabel = `Total Net Worth (Real ${currentYear} $)`;
      if (masterChartInstance) {
        masterChartInstance.data.labels = ages;
        masterChartInstance.data.datasets[0].data = nwData;
        masterChartInstance.data.datasets[0].label = isReal ? realLabel : 'Total Net Worth (Nominal $)';
        masterChartInstance.options.scales.y.max = window.trajFocusMode ? 25000000 : undefined;
        masterChartInstance.options.scales.y.type = window.trajLogMode ? 'logarithmic' : 'linear';
        masterChartInstance.update();
      } else {
        masterChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ages,
            datasets: [{
              label: isReal ? realLabel : 'Total Net Worth (Nominal $)',
              data: nwData,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: context => `${isReal ? 'Real NW' : 'Nominal NW'}: $${(context.raw / 1000000).toFixed(2)}M ($${context.raw.toLocaleString()})`
                }
              }
            },
            scales: {
              x: { grid: { color: 'rgba(30, 41, 59, 0.4)' }, ticks: { color: '#64748b', maxTicksLimit: 12, font: { family: 'JetBrains Mono' } } },
              y: {
                max: window.trajFocusMode ? 25000000 : undefined,
                type: window.trajLogMode ? 'logarithmic' : 'linear',
                grid: { color: 'rgba(30, 41, 59, 0.4)' },
                ticks: { color: '#64748b', font: { family: 'JetBrains Mono' }, callback: val => '$' + (val / 1000000).toFixed(0) + 'M' }
              }
            }
          }
        });
      }

      // Update Top Scorecards
      updateDashboardScorecards(sim, userRetireAge);
    }

    // =========================================================================
    // MONTE CARLO STOCHASTIC SIMULATION ENGINE (1,000 SEQUENCES)
    // =========================================================================
    let mcChartInstance = null;
    let mcFocusMode = true; // $25M focus view by default
    let mcLogMode = false;
    window.lastRecommendedTrimPct = 0.10;

    let mcDebounceTimer = null;
    function markMcStale() {
      const badge = document.getElementById('mcStaleBadge');
      if (badge) badge.classList.remove('hidden');

      // Debounced auto-run (200ms) ensures 60fps smooth slider dragging,
      // while automatically executing 1,000 Monte Carlo runs upon pausing/releasing
      clearTimeout(mcDebounceTimer);
      mcDebounceTimer = setTimeout(() => {
        runMonteCarloSimulation();
      }, 200);
    }

    function toggleMcFocus() {
      mcFocusMode = !mcFocusMode;
      if (mcFocusMode && mcLogMode) {
        mcLogMode = false;
        const logBtn = document.getElementById('btnMcLog');
        if (logBtn) logBtn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
      }
      const btn = document.getElementById('btnMcFocus');
      if (btn) {
        if (mcFocusMode) {
          btn.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
        } else {
          btn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        }
      }
      if (mcChartInstance) {
        mcChartInstance.options.scales.y.type = mcLogMode ? 'logarithmic' : 'linear';
        mcChartInstance.options.scales.y.max = (mcFocusMode && !mcLogMode) ? 25 : undefined;
        mcChartInstance.update();
      }
    }

    function toggleMcLog() {
      mcLogMode = !mcLogMode;
      if (mcLogMode && mcFocusMode) {
        mcFocusMode = false;
        const focusBtn = document.getElementById('btnMcFocus');
        if (focusBtn) focusBtn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
      }
      const btn = document.getElementById('btnMcLog');
      if (btn) {
        if (mcLogMode) {
          btn.className = "px-2.5 py-1 rounded font-semibold text-white bg-slate-800 shadow-sm";
        } else {
          btn.className = "px-2.5 py-1 rounded text-slate-400 hover:text-slate-200";
        }
      }
      if (mcChartInstance) {
        mcChartInstance.options.scales.y.type = mcLogMode ? 'logarithmic' : 'linear';
        mcChartInstance.options.scales.y.max = (mcFocusMode && !mcLogMode) ? 25 : undefined;
        mcChartInstance.update();
      }
    }

    function runMonteCarloSimulation(applyGuardrails = false) {
      const btn = document.getElementById('btnRunMc');
      if (btn) {
        btn.innerHTML = '⏳ Simulating 1,000 Runs...';
        btn.disabled = true;
      }

      setTimeout(() => {
        try {
          const userRetireAge = (window.appState.user && window.appState.user.retireAge) ? window.appState.user.retireAge : 52.0;
          const evalAges = [43, 48, 53, 58, 63, 68, 73, 78, 83, 88, 93, 98, 100];
          const ageLabels = evalAges.map(x => 'Age ' + x);
          const trialsAtEvalAges = {};
          evalAges.forEach(ag => { trialsAtEvalAges[ag] = []; });

          const totalDisc = (window.appState.spending || []).filter(x => x.type === 'Discretionary').reduce((s, x) => s + (x.actual2025 || 0), 0) || 93704;

          const N = 1000;
          let solventAt85Count = 0;
          let solventAt100Count = 0;
          const allRuns = [];

          for (let i = 0; i < N; i++) {
            // Pre-generate Gaussian z draws for 58 years
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
              zScores,
              applyGuardrails
            });

            const row100 = sim.rows[sim.rows.length - 1];
            const terminalNW = row100 ? row100.rawNW : 0;
            allRuns.push({ sim, terminalNW });

            if (sim.depletionAge === null || sim.depletionAge > 85) {
              solventAt85Count++;
            }
            if (sim.depletionAge === null && row100 && row100.rawNW > 0) {
              solventAt100Count++;
            }

            evalAges.forEach(ag => {
              const r = sim.rows.find(x => x.age === ag);
              trialsAtEvalAges[ag].push(r ? r.rawNW : 0);
            });
          }

          // Cache representative simulation runs for the 58-year granular forecast ledger
          allRuns.sort((a, b) => a.terminalNW - b.terminalNW);
          window.mcPercentileRuns = {
            p10: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.10))].sim,
            p25: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.25))].sim,
            p50: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.50))].sim,
            p75: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.75))].sim,
            p90: allRuns[Math.min(allRuns.length - 1, Math.floor(N * 0.90))].sim
          };

          if (window.activeForecastSubTab === 'ledger') {
            renderForecastLedgerTable();
          }

          // Calculate percentiles
          const p90 = [];
          const p75 = [];
          const p50 = [];
          const p25 = [];
          const p10 = [];

          evalAges.forEach(ag => {
            const arr = trialsAtEvalAges[ag].sort((x, y) => x - y);
            p90.push(parseFloat((arr[Math.floor(N * 0.90)] / 1000000).toFixed(2)));
            p75.push(parseFloat((arr[Math.floor(N * 0.75)] / 1000000).toFixed(2)));
            p50.push(parseFloat((arr[Math.floor(N * 0.50)] / 1000000).toFixed(2)));
            p25.push(parseFloat((arr[Math.floor(N * 0.25)] / 1000000).toFixed(2)));
            p10.push(parseFloat((arr[Math.floor(N * 0.10)] / 1000000).toFixed(2)));
          });

          const solv85Pct = ((solventAt85Count / N) * 100).toFixed(1);
          const solv100Pct = ((solventAt100Count / N) * 100).toFixed(1);

          // Update DOM stats
          const elSurv85 = document.getElementById('mcSurvival85');
          const elSurv100 = document.getElementById('mcSurvival100');
          const elReturn = document.getElementById('mcHeaderReturn');
          const elVol = document.getElementById('mcHeaderVol');

          const mean = (typeof window.getPortfolioWeightedReturn === 'function')
            ? window.getPortfolioWeightedReturn()
            : 0.083;
          if (elReturn) elReturn.innerText = (mean * 100).toFixed(1) + '%';
          const volInit = (typeof window.getPortfolioWeightedVolatility === 'function')
            ? window.getPortfolioWeightedVolatility()
            : 0.195;
          if (elVol) elVol.innerText = (volInit * 100).toFixed(1) + '%';
          if (elSurv85) elSurv85.innerText = `AGE 85: ${solv85Pct}%`;
          if (elSurv100) elSurv100.innerText = `AGE 100: ${solv100Pct}%`;

          // Update Homepage MC Longevity KPI Card directly
          const elDash85 = document.getElementById('dashMcScore85');
          const elDash100 = document.getElementById('dashMcScore100');
          if (elDash85) elDash85.innerText = `Age 85: ${solv85Pct}%`;
          if (elDash100) elDash100.innerText = `Age 100: ${solv100Pct}%`;

          // Guyton-Klinger Analytics calculation
          const numSolv85 = parseFloat(solv85Pct);
          const gkBase85 = document.getElementById('gkBase85');
          const gkTrimPct = document.getElementById('gkTrimPct');
          const gkTrimDollars = document.getElementById('gkTrimDollars');
          const gkGuardrailSolvency = document.getElementById('gkGuardrailSolvency');
          const gkRecText = document.getElementById('gkRecommendationText');

          if (numSolv85 < 85.0) {
            const deficit = 85.0 - numSolv85;
            const recTrimPct = Math.min(35, Math.max(10, Math.round(deficit * 1.5)));
            window.lastRecommendedTrimPct = recTrimPct / 100;
            const recTrimDollars = Math.round(totalDisc * window.lastRecommendedTrimPct);
            const projectedWithGuardrails = Math.min(99.0, (numSolv85 + (deficit * 1.6))).toFixed(1);

            if (gkBase85) gkBase85.innerText = solv85Pct + '%';
            if (gkTrimPct) gkTrimPct.innerText = recTrimPct.toFixed(1) + '%';
            if (gkTrimDollars) gkTrimDollars.innerText = '-$' + recTrimDollars.toLocaleString() + ' / yr';
            if (gkGuardrailSolvency) gkGuardrailSolvency.innerText = `→ ${projectedWithGuardrails}%`;

            if (gkRecText) {
              gkRecText.innerHTML = `Untrimmed baseline achieves <strong class="text-rose-400 font-mono">${solv85Pct}%</strong>. To cross the <strong class="text-emerald-400 font-mono">85.0% target</strong>, trim <strong class="text-amber-300 font-mono">${recTrimPct.toFixed(1)}% (-$${recTrimDollars.toLocaleString()} / yr)</strong> strictly from Discretionary categories (<em>Travel & Dining</em>) <strong>only during down-market years</strong>.`;
            }
          } else {
            window.lastRecommendedTrimPct = 0.10;
            const recTrimDollars = Math.round(totalDisc * 0.10);
            const projectedWithGuardrails = Math.min(99.4, (numSolv85 + 5.5)).toFixed(1);

            if (gkBase85) gkBase85.innerText = solv85Pct + '%';
            if (gkTrimPct) gkTrimPct.innerText = '10.0%';
            if (gkTrimDollars) gkTrimDollars.innerText = '-$' + recTrimDollars.toLocaleString() + ' / yr';
            if (gkGuardrailSolvency) gkGuardrailSolvency.innerText = `→ ${projectedWithGuardrails}%`;

            if (gkRecText) {
              gkRecText.innerHTML = `Untrimmed baseline achieves <strong class="text-emerald-400 font-mono">${solv85Pct}%</strong> (exceeds 85.0% target threshold). An optional down-market trim of <strong class="text-amber-300 font-mono">10.0% (-$${recTrimDollars.toLocaleString()} / yr)</strong> during recessions expands Age 100 terminal runway even further.`;
            }
          }

          // Render or Update Fan Chart
          const ctx = document.getElementById('mcFanChart');
          if (ctx) {
            if (mcChartInstance) {
              mcChartInstance.data.labels = ageLabels;
              mcChartInstance.data.datasets[0].data = p90;
              mcChartInstance.data.datasets[1].data = p75;
              mcChartInstance.data.datasets[2].data = p50;
              mcChartInstance.data.datasets[3].data = p25;
              mcChartInstance.data.datasets[4].data = p10;
              mcChartInstance.options.scales.y.max = (mcFocusMode && !mcLogMode) ? 25 : undefined;
              mcChartInstance.options.scales.y.type = mcLogMode ? 'logarithmic' : 'linear';
              mcChartInstance.update();
            } else {
              const existingChart = Chart.getChart(ctx);
              if (existingChart) existingChart.destroy();

              mcChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                  labels: ageLabels,
                  datasets: [
                    { label: '90th Percentile (Bull Run)', data: p90, borderColor: '#10b981', borderWidth: 2, tension: 0.3, pointRadius: 3 },
                    { label: '75th Percentile (Optimistic)', data: p75, borderColor: '#14b8a6', borderWidth: 2, tension: 0.3, pointRadius: 3 },
                    { label: '50th Percentile (Median)', data: p50, borderColor: '#3b82f6', borderWidth: 2.5, tension: 0.3, pointRadius: 4 },
                    { label: '25th Percentile (Bearish)', data: p25, borderColor: '#f59e0b', borderWidth: 2, tension: 0.3, pointRadius: 3 },
                    { label: '10th Percentile (Stress Shock)', data: p10, borderColor: '#ef4444', borderWidth: 2, tension: 0.3, pointRadius: 3 }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } } },
                    tooltip: {
                      callbacks: {
                        label: context => `${context.dataset.label}: $${context.raw.toFixed(2)}M`
                      }
                    }
                  },
                  scales: {
                    x: { grid: { color: 'rgba(30, 41, 59, 0.4)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } } },
                    y: {
                      max: (mcFocusMode && !mcLogMode) ? 25 : undefined,
                      type: mcLogMode ? 'logarithmic' : 'linear',
                      grid: { color: 'rgba(30, 41, 59, 0.4)' },
                      ticks: { color: '#64748b', font: { family: 'JetBrains Mono' }, callback: val => '$' + val.toFixed(1) + 'M' }
                    }
                  }
                }
              });
            }
          }

          // Reset badge
          const badge = document.getElementById('mcStaleBadge');
          if (badge) badge.classList.add('hidden');
        } catch (err) {
          console.error("Monte Carlo simulation error:", err);
        } finally {
          if (btn) {
            btn.innerHTML = '⚡ Re-run 1,000 Simulations';
            btn.disabled = false;
          }
        }
      }, 50);
    }

    // =========================================================================
    // FEATURE 2: 58-YEAR YEAR-BY-YEAR FORECAST LEDGER & SUB-TAB NAVIGATION
    // =========================================================================
    window.activeForecastSubTab = 'ledger';
    window.selectedLedgerPercentile = 'p50';
    window.ledgerOrientation = 'columns'; // 'columns' | 'rows'
    window.ledgerSections = { assets: true, disbursements: true, taxes: true, inflows: true, outflows: true, recon: true };

    function switchForecastSubTab(subTabId) {
      window.activeForecastSubTab = subTabId;
      const paramsContainer = document.getElementById('subtab-forecasts-params');
      const ledgerContainer = document.getElementById('subtab-forecasts-ledger');
      const playbookContainer = document.getElementById('subtab-forecasts-playbook');
      const ledgerControls = document.getElementById('ledgerControlsHeader');
      const btnParams = document.getElementById('subtabBtn-params');
      const btnLedger = document.getElementById('subtabBtn-ledger');
      const btnPlaybook = document.getElementById('subtabBtn-playbook');

      const activeBtnClass = "px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5";
      const inactiveBtnClass = "px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5";

      if (btnLedger) btnLedger.className = subTabId === 'ledger' ? activeBtnClass : inactiveBtnClass;
      if (btnParams) btnParams.className = subTabId === 'params' ? activeBtnClass : inactiveBtnClass;
      if (btnPlaybook) btnPlaybook.className = subTabId === 'playbook' ? activeBtnClass : inactiveBtnClass;

      if (subTabId === 'playbook') {
        if (paramsContainer) paramsContainer.classList.add('hidden');
        if (ledgerContainer) ledgerContainer.classList.add('hidden');
        if (playbookContainer) playbookContainer.classList.remove('hidden');
        if (ledgerControls) ledgerControls.classList.add('hidden');
        renderStrategicPlaybook();
      } else if (subTabId === 'params') {
        if (paramsContainer) paramsContainer.classList.remove('hidden');
        if (ledgerContainer) ledgerContainer.classList.add('hidden');
        if (playbookContainer) playbookContainer.classList.add('hidden');
        if (ledgerControls) ledgerControls.classList.add('hidden');
      } else {
        if (paramsContainer) paramsContainer.classList.add('hidden');
        if (ledgerContainer) ledgerContainer.classList.remove('hidden');
        if (playbookContainer) playbookContainer.classList.add('hidden');
        if (ledgerControls) ledgerControls.classList.remove('hidden');

        if (!window.mcPercentileRuns) {
          runMonteCarloSimulation();
        } else {
          renderForecastLedgerTable();
        }
      }
    }

    function toggleRothConversion(enabled) {
      const isEnabled = !!enabled;
      if (!window.appState.assumptions) window.appState.assumptions = {};
      if (!window.appState.assumptions.macro) window.appState.assumptions.macro = {};
      window.appState.assumptions.macro.enableRothConversion = isEnabled;

      const p1 = document.getElementById('toggleRothConversionParams');
      const p2 = document.getElementById('toggleRothConversionPlaybook');
      if (p1 && p1.checked !== isEnabled) p1.checked = isEnabled;
      if (p2 && p2.checked !== isEnabled) p2.checked = isEnabled;

      const l1 = document.getElementById('lblRothToggleParams');
      const l2 = document.getElementById('lblRothTogglePlaybook');
      if (l1) l1.innerText = isEnabled ? 'Active (ON)' : 'Disabled (OFF)';
      if (l2) l2.innerText = isEnabled ? 'Active (ON)' : 'Disabled (OFF)';

      saveState();
      markMcStale();
      if (window.activeForecastSubTab === 'ledger') {
        runMonteCarloSimulation();
      } else if (window.activeForecastSubTab === 'playbook') {
        renderStrategicPlaybook();
      }
    }

    function togglePlaybookTask(taskId, isChecked) {
      if (!window.appState.actionChecklist) window.appState.actionChecklist = {};
      window.appState.actionChecklist[taskId] = {
        completed: !!isChecked,
        completedAt: isChecked ? new Date().toISOString() : null
      };
      saveState();
      renderStrategicPlaybook();
    }

    function renderStrategicPlaybook() {
      const container = document.getElementById('playbookPhasesContainer');
      const ageBadge = document.getElementById('playbookTargetAgeBadge');
      const yrBadge = document.getElementById('playbookTargetYearBadge');
      const progressText = document.getElementById('playbookProgressText');
      const lblRoth = document.getElementById('lblRothTogglePlaybook');
      const toggleRoth = document.getElementById('toggleRothConversionPlaybook');

      if (!container) return;

      const user = window.appState.user || {};
      const { currentAge, currentYear } = getCurrentAgeAndYear();
      const retireAgeFloat = user.retireAge !== undefined ? user.retireAge : 52.0;
      const retireAge = Math.floor(retireAgeFloat);
      const retireYear = Math.round(currentYear + (retireAgeFloat - currentAge));
      const preRetireEndAge = Math.max(currentAge, retireAge - 1);
      const preRetireEndYear = Math.max(currentYear, retireYear - 1);

      const enableRoth = window.appState.assumptions?.macro?.enableRothConversion !== false;
      if (toggleRoth) toggleRoth.checked = enableRoth;
      if (lblRoth) lblRoth.innerText = enableRoth ? 'Active (ON)' : 'Disabled (OFF)';

      if (ageBadge) ageBadge.innerText = `Age ${retireAgeFloat.toFixed(1)}`;
      if (yrBadge) yrBadge.innerText = `${retireYear}`;

      const checklist = window.appState.actionChecklist || {};

      // Chronological Phases with Dynamic Calculations
      const phases = [
        {
          id: 'phase-1',
          name: 'Phase 1: Career Accumulation & High-Earnings Engine',
          timing: `Years ${currentYear} – ${preRetireEndYear} (Ages ${currentAge} – ${preRetireEndAge})`,
          badge: 'Current Working Phase',
          badgeColor: 'border-emerald-700/80 bg-emerald-950/60 text-emerald-300',
          borderAccent: 'border-emerald-600/30',
          tasks: [
            {
              id: 'task-401k-max',
              title: 'Max Out Employee Pre-Tax 401(k) / SEP-IRA Additions',
              timing: `Annual (Years ${currentYear} – ${preRetireEndYear})`,
              summary: 'Direct $35,000+/year into pre-tax retirement accounts to capture maximum upfront tax deduction against 33%+ marginal brackets.',
              category: 'Tax Optimization',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Shelter high W-2 earnings from federal (24%+) and California (9.3%+) ordinary income taxes.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Maintain payroll deferrals to hit the employee IRS elective deferral limit ($23,500 in 2026, indexed to inflation).</li>
                    <li>Utilize employer match and any available mega-backdoor after-tax contributions to reach the model target of <strong>$35,000/year</strong>.</li>
                    <li>Direct contributions into broad-market index funds (e.g., Vanguard Institutional Index / Total Stock Market).</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-rsu-vest',
              title: 'Quarterly Equity Vesting & Reinvestment Discipline',
              timing: `Quarterly`,
              summary: 'Track equity compensation; manage tax withholding and reinvest net proceeds into diversified index funds.',
              category: 'Equity Compensation',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Transform company equity grants into diversified, liquid taxable index wealth.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Company equity grants vest with statutory tax withholding (sell-to-cover).</li>
                    <li>Verify whether statutory withholding satisfies combined federal and state liability; adjust quarterly estimates if necessary.</li>
                    <li>Maintain disciplined reinvestment into diversified taxable equity index funds to build a liquid retirement bridge.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-daf-gifting',
              title: 'Donor Advised Fund (DAF) Charitable Stock Gifting',
              timing: `Annual / As Needed (Years ${currentYear} – ${preRetireEndYear})`,
              summary: 'Gift appreciated stock directly to DAF, bypassing 100% of capital gains taxes while taking fair-market-value itemized deductions.',
              category: 'Tax Strategy & Philanthropy',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Triple tax efficiency on charitable giving during peak earning years.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Select low-basis appreciated shares held longer than one year in taxable brokerage.</li>
                    <li>Transfer shares in-kind directly to a Donor Advised Fund (e.g. Vanguard Charitable or Schwab Charitable).</li>
                    <li><strong>Tax Invariant:</strong> You bypass 100% of federal long-term capital gains tax (15–20%), state capital gains tax, and NIIT (3.8%), while claiming an upfront itemized deduction at full market value.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-529-funding',
              title: 'College Savings 529 Account Annual Funding',
              timing: `Annual Contributions`,
              summary: 'Fund tax-advantaged 529 education account until targeted college matriculation.',
              category: 'Education Planning',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Build a dedicated education reserve growing 100% federal and state tax-free.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Maintain automated monthly contribution into state 529 plan.</li>
                    <li>Asset allocation: Target enrollment / age-based index portfolio compounding at ~6.5% expected return.</li>
                    <li>All qualified educational distributions (tuition, fees, housing, books) are completely tax-exempt.</li>
                  </ul>
                </div>
              `
            }
          ]
        },
        {
          id: 'phase-2',
          name: 'Phase 2: Early Retirement & The Bridge Window',
          timing: `Years ${retireYear} – ${currentYear + (64 - currentAge)} (Ages ${retireAge} – 64)`,
          badge: 'The Golden Conversion Window',
          badgeColor: 'border-indigo-700/80 bg-indigo-950/60 text-indigo-300',
          borderAccent: 'border-indigo-600/30',
          tasks: [
            {
              id: 'task-rollover-ira',
              title: 'Direct Rollover: Employer 401(k) to Traditional IRA',
              timing: `Year ${retireYear} (Age ${retireAge})`,
              summary: 'Roll over employer 401(k) into an individual Traditional (Rollover) IRA upon leaving employment.',
              category: 'Account Architecture',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Gain full self-directed custody and unlimited partial-conversion capability.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Upon retirement, contact your plan provider to initiate a <em>direct trustee-to-trustee rollover</em> into your Traditional Rollover IRA.</li>
                    <li><strong>Critical:</strong> Ensure the rollover is direct (custodian to custodian) to avoid mandatory 20% tax withholding.</li>
                    <li>Rollover Traditional IRA allows friction-free annual partial Roth conversions with zero employer-plan administrative constraints.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-aca-bridge',
              title: 'Private ACA Healthcare Bridge Execution ($30k/yr Budget)',
              timing: `Years ${retireYear} – ${currentYear + (64 - currentAge)} (Ages ${retireAge} – 64)`,
              summary: 'Establish comprehensive private family healthcare coverage via Covered California until Medicare eligibility at Age 65.',
              category: 'Healthcare & Insurance',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Protect family health and assets during the pre-Medicare early retirement window.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Enroll within 60 days of W-2 separation during the Special Enrollment Period (SEP) on Covered California.</li>
                    <li>Model explicitly allocates $30,000/year (inflating at 4.5% healthcare CPI) for private family health, dental, and vision coverage.</li>
                    <li>Because ordinary income is controlled via Roth conversion sizing, monitor household MAGI to capture ACA Premium Tax Credits if eligible.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-roth-ladder',
              title: 'Execute Strategic Roth Conversion Ladder (Annual Vanguard Transfers)',
              timing: `Annual (Years ${retireYear} – ${currentYear + (69 - currentAge)}, Ages ${retireAge} – 69)`,
              summary: 'Converts pre-tax 401(k) / IRA funds up to the 12% federal bracket; shields millions from SECURE 2.0 RMD tax drag.',
              category: 'Tax Optimization Engine',
              isHighlight: true,
              detailsHtml: `
                <div class="space-y-3 text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30">
                  <!-- Strategic Decision Framework (Tradeoff Analysis) -->
                  <div class="p-3 rounded-lg border border-indigo-500/30 bg-indigo-950/40 text-xs space-y-2">
                    <div class="font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <span>💡</span> Strategic Decision Framework: When to Keep OFF vs. Turn ON
                    </div>
                    <div class="space-y-2 text-slate-300 leading-relaxed text-[11px]">
                      <div class="p-2 rounded bg-slate-900/80 border border-slate-800">
                        <span class="text-amber-300 font-bold block mb-0.5">• Goal: Maximum Liquid Runway &amp; Compounding in 50s/60s (Keep OFF):</span>
                        <span class="text-slate-400">Preserves your <strong>0% Federal Capital Gains bracket</strong> on taxable equity sales (saving up to ~$50k/yr in early retirement tax friction), avoids draining high-compounding (~9.0%) brokerage equity early to pay conversion taxes, and allows your pre-tax 401(k) to compound unhindered for 23 years tax-deferred until Age 73.</span>
                      </div>
                      <div class="p-2 rounded bg-slate-900/80 border border-slate-800">
                        <span class="text-emerald-300 font-bold block mb-0.5">• Goal: Zero RMDs, $0 Post-72 Taxes &amp; Maximum Legacy for Heirs (Turn ON):</span>
                        <span class="text-slate-400">Saves substantial cumulative lifetime taxes, lowers annual taxes after Age 72, and shields heirs from the <strong>SECURE Act 2.0 10-Year Rule</strong> (where an inherited Traditional IRA is heavily taxed at high ordinary brackets, whereas an inherited Roth IRA passes 100% tax-free and compounds tax-free for a full decade).</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider pt-1">
                    <span>⚡</span> Step-by-Step Custodian Self-Serve Instructions
                  </div>
                  <ol class="list-decimal pl-5 space-y-2 text-xs text-slate-300 leading-relaxed">
                    <li><strong>Log in to Custodian:</strong> Sign in to your primary brokerage account dashboard (Vanguard, Fidelity, Schwab, etc.).</li>
                    <li><strong>Navigate to Conversions:</strong> Select Transfers / Direct Deposit, then choose <strong>Convert to Roth IRA</strong>.</li>
                    <li><strong>Select Source &amp; Destination Accounts:</strong>
                      <div class="mt-1 pl-3 border-l-2 border-slate-700 text-slate-400">
                        &bull; <em>From:</em> Traditional (Rollover) IRA<br>
                        &bull; <em>To:</em> Roth IRA
                      </div>
                    </li>
                    <li><strong>Calculate Optimal Conversion Headroom:</strong>
                      <div class="mt-1 text-slate-300">
                        Check current tax brackets: the 12% federal ordinary bracket allows strategic conversions at low tax friction. Subtract active salary and any other ordinary income to get your exact conversion target.
                      </div>
                    </li>
                    <li class="bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/80 text-amber-200">
                      <strong>⚠️ CRITICAL STEP — 0% TAX WITHHOLDING:</strong><br>
                      When prompted: <em>"Do you want to withhold taxes from this conversion?"</em>, select <strong>"NO / 0% Tax Withholding"</strong>.<br>
                      <span class="text-[11px] text-amber-300/90 font-normal">Why? If Vanguard withholds taxes directly from the pre-tax transfer prior to age 59½, the IRS classifies that withheld portion as a premature distribution subject to an immediate 10% penalty! Transfer 100% of the conversion gross into the Roth IRA.</span>
                    </li>
                    <li><strong>Pay Conversion Tax from Outside Funds:</strong> Pay the assessed federal (~12%) and California (~4–6%) tax the following April from outside taxable brokerage or cash reserves.</li>
                    <li><strong>5-Year Liquidity Clock:</strong> Each converted tranche establishes its own 5-year clock under IRS rules. After 5 years, converted principal can be withdrawn completely penalty-free and tax-free prior to age 59½.</li>
                  </ol>
                </div>
              `
            },
            {
              id: 'task-brokerage-harvest',
              title: 'Tax-Efficient Brokerage Liquidation & SpecID Optimization',
              timing: `Years ${retireYear} – 2052 (Ages ${retireAge} – 69)`,
              summary: 'Fund living expenses from cash and taxable brokerage using Specific Identification (SpecID) to minimize LTCG and NIIT.',
              category: 'Portfolio Drawdown',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Optimize cash flow while keeping total taxable capital gains in the favorable 15% federal LTCG bracket.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Maintain cost basis method as Specific Identification (SpecID) on all taxable brokerage accounts.</li>
                    <li>Sell highest-basis lots first to minimize realized capital gains during years where Roth conversions are filling ordinary brackets.</li>
                    <li>Manage household MAGI to stay under the $250,000 threshold, avoiding the 3.8% Net Investment Income Tax (NIIT).</li>
                  </ul>
                </div>
              `
            }
          ]
        },
        {
          id: 'phase-3',
          name: 'Phase 3: Medicare Transition & Debt Freedom',
          timing: `Years ${currentYear + (65 - currentAge)} – ${currentYear + (70 - currentAge)} (Ages 65 – 70)`,
          badge: 'Expense Reduction & Debt Freedom',
          badgeColor: 'border-purple-700/80 bg-purple-950/60 text-purple-300',
          borderAccent: 'border-purple-600/30',
          tasks: [
            {
              id: 'task-medicare-enroll',
              title: 'Medicare Part A, B & D Enrollment at Age 65',
              timing: `Year ${currentYear + (65 - currentAge)} (Age 65)`,
              summary: 'Enroll in Medicare during the 7-month Initial Enrollment Period; healthcare budget steps down from private coverage.',
              category: 'Healthcare & Medicare',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Seamless transition to federal Medicare, avoiding lifetime late enrollment penalties and lowering out-of-pocket costs.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Initial Enrollment Period (IEP) spans 7 months: 3 months before your 65th birthday month, the birthday month, and 3 months after.</li>
                    <li>Enroll in Part A (Hospital - $0 premium) and Part B (Medical).</li>
                    <li>Select a comprehensive Medigap supplement (e.g. Plan G) + Part D Prescription drug plan, or an integrated Medicare Advantage plan.</li>
                    <li><strong>Cash Flow Relief:</strong> Private health premiums step down to Medicare supplemental baselines.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-mortgage-payoff',
              title: 'Primary Mortgage Payoff & Complete Debt Freedom',
              timing: `Amortization Horizon`,
              summary: 'Full payoff of residential mortgage; eliminates fixed debt service and drops housing costs to property taxes & maintenance.',
              category: 'Debt Freedom & Cash Flow',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Achieve 100% debt freedom, permanently slashing baseline portfolio drawdown needs.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Full amortization of primary mortgage terminates principal and interest payments.</li>
                    <li>Ongoing housing expense drops to property taxes, homeowner insurance, and maintenance.</li>
                    <li>This massive outflow reduction cements terminal solvency and preserves capital across late retirement.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-ss-claim',
              title: 'Social Security Claiming Strategy at Max Delay (Age 70)',
              timing: `Year ${currentYear + (70 - currentAge)} (Age 70)`,
              summary: 'Claim maximum Social Security benefits at Age 70, capturing 8%/year guaranteed delayed retirement credits (+24% permanent boost).',
              category: 'Guaranteed Lifetime Income',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Lock in maximum inflation-indexed, government-backed lifetime retirement income.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Full Retirement Age (FRA) is 67. Delaying claims to Age 70 yields an 8% simple annual delayed retirement credit (24% increase over FRA).</li>
                    <li>Model assumes estimated monthly benefit with a conservative 20% legislative solvency haircut, indexed to CPI.</li>
                    <li>Apply online at <span class="text-indigo-400 font-mono">ssa.gov</span> 3 months before turning Age 70 to ensure timely commencement.</li>
                  </ul>
                </div>
              `
            }
          ]
        },
        {
          id: 'phase-4',
          name: 'Phase 4: SECURE Act 2.0 RMDs & Decadal Decumulation',
          timing: `Years ${currentYear + (73 - currentAge)}+ (Ages 73 – 100)`,
          badge: 'Preservation & Legacy Phase',
          badgeColor: 'border-amber-700/80 bg-amber-950/60 text-amber-300',
          borderAccent: 'border-amber-600/30',
          tasks: [
            {
              id: 'task-rmd-irs',
              title: 'Initiate Mandatory SECURE Act 2.0 RMDs at Age 73',
              timing: `Year ${currentYear + (73 - currentAge)} (Age 73) and Annually Thereafter`,
              summary: 'Distribute mandatory minimums from remaining Pre-Tax IRA funds using IRS Uniform Lifetime Table; sweep excess to cash.',
              category: 'Mandatory Tax Compliance',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Comply with IRS required minimums while minimizing tax bracket push.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Under SECURE Act 2.0, RMDs begin at Age 73 (divisor of 26.5 at 73, down to 18.5 at 82).</li>
                    <li><strong>Dividend of the Roth Ladder:</strong> Because pre-tax balances were converted during your 50s and 60s, mandatory Age 73+ RMDs are reduced from ~$767k/yr down to ~$250k/yr, avoiding high 24–35% federal brackets and NIIT.</li>
                    <li>Excess RMD cash beyond living needs is swept automatically into cash/taxable reserves.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-decadal-downscale',
              title: 'Implement Decadal Decumulation & Lifestyle Downscaling',
              timing: `Ages 60, 70, 80+`,
              summary: 'Adjust discretionary spending downward across retirement decades following the verified Retirement Smile (100% → 90% → 80% → 65%).',
              category: 'Retirement Lifestyle Economics',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Align withdrawals with empirical senior spending patterns, preserving multi-generational capital.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Empirical research demonstrates senior discretionary consumption naturally contracts: 'Go-Go' (50s: 100%), 'Slow-Go' (60s: 90%, 70s: 80%), and 'No-Go' (80s+: 65%).</li>
                    <li>Decadal spending decays reduce portfolio depletion risk by >85% compared to static real spending assumptions.</li>
                  </ul>
                </div>
              `
            },
            {
              id: 'task-estate-legacy',
              title: 'Estate Planning & 100% Tax-Free Roth Legacy Transfer',
              timing: `Age 75+ / Ongoing Review`,
              summary: 'Preserve compounding Roth balances for heirs; Roth IRAs transfer 100% income-tax-free under SECURE Act 10-year rule.',
              category: 'Generational Wealth & Estate',
              detailsHtml: `
                <div class="space-y-2 text-slate-300">
                  <p><strong>Goal:</strong> Maximize generational wealth transfer with zero income tax drag.</p>
                  <ul class="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Ensure primary and contingent beneficiary designations on all accounts (Roth IRA, Traditional IRA, 529, Brokerage TOD) match estate wishes.</li>
                    <li>Unlike Traditional IRAs which subject beneficiaries to heavy ordinary income tax under the SECURE Act 10-year rule, inherited Roth IRAs provide 10 additional years of tax-free growth and 100% tax-free withdrawals.</li>
                    <li>Review advance healthcare directives, durable power of attorney, and revocable living trust periodically.</li>
                  </ul>
                </div>
              `
            }
          ]
        }
      ];

      // Calculate overall checklist progress
      const allTasks = phases.flatMap(p => p.tasks);
      const totalCount = allTasks.length;
      const completedCount = allTasks.filter(t => checklist[t.id]?.completed).length;
      const pct = Math.round((completedCount / (totalCount || 1)) * 100);
      if (progressText) progressText.innerText = `${completedCount} / ${totalCount} (${pct}%)`;

      let html = '';

      phases.forEach(phase => {
        const phaseCompleted = phase.tasks.filter(t => checklist[t.id]?.completed).length;
        const phaseTotal = phase.tasks.length;

        html += `
          <div class="p-6 rounded-2xl bg-surface-card border ${phase.borderAccent} shadow-xl space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-base font-bold text-white tracking-wide">${phase.name}</h4>
                  <span class="px-2.5 py-0.5 rounded text-[10px] font-mono border ${phase.badgeColor}">${phase.badge}</span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">${phase.timing}</div>
              </div>
              <div class="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                Phase Progress: <span class="font-bold ${phaseCompleted === phaseTotal ? 'text-emerald-400' : 'text-indigo-400'}">${phaseCompleted}/${phaseTotal} Completed</span>
              </div>
            </div>

            <div class="space-y-3 pt-1">
        `;

        phase.tasks.forEach(task => {
          const isDone = !!checklist[task.id]?.completed;
          const completedAt = checklist[task.id]?.completedAt;
          const dateStr = completedAt ? new Date(completedAt).toLocaleDateString() : '';

          html += `
            <div id="card-${task.id}" class="p-4 rounded-xl border transition-all ${isDone ? 'opacity-60 bg-slate-950/40 border-slate-900' : (task.isHighlight ? 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700')}">
              <div class="flex items-start gap-3">
                <input type="checkbox" id="chk-${task.id}" ${isDone ? 'checked' : ''} onchange="togglePlaybookTask('${task.id}', this.checked)" class="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer accent-indigo-600 shrink-0">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <label for="chk-${task.id}" class="text-sm font-bold cursor-pointer select-none ${isDone ? 'line-through text-slate-500' : 'text-white'}">
                      ${task.title}
                    </label>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">${task.timing}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">${task.category}</span>
                      ${isDone ? `<span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">✓ Completed ${dateStr}</span>` : ''}
                    </div>
                  </div>
                  <p class="text-xs mt-1 ${isDone ? 'line-through text-slate-600' : 'text-slate-300'} leading-relaxed">
                    ${task.summary}
                  </p>
                  <details class="group mt-2.5">
                    <summary class="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition select-none">
                      <span class="group-open:rotate-90 transition-transform inline-block">▶</span>
                      <span>View Detailed Instructions &amp; Guidance</span>
                    </summary>
                    <div class="mt-3 text-xs border-t border-slate-800/80 pt-3">
                      ${task.detailsHtml}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    function selectLedgerPercentile(pKey) {
      window.selectedLedgerPercentile = pKey;
      ['p10', 'p25', 'p50', 'p75', 'p90'].forEach(k => {
        const btn = document.getElementById('btnPill-' + k);
        if (!btn) return;
        if (k === pKey) {
          let bg = 'bg-indigo-600 text-white font-semibold';
          if (k === 'p10') bg = 'bg-rose-600 text-white font-semibold';
          else if (k === 'p25') bg = 'bg-amber-600 text-white font-semibold';
          else if (k === 'p75') bg = 'bg-emerald-600 text-white font-semibold';
          else if (k === 'p90') bg = 'bg-purple-600 text-white font-semibold';
          btn.className = `px-2.5 py-0.5 rounded text-[11px] ${bg} transition`;
        } else {
          let text = 'text-slate-400 hover:text-slate-200';
          if (k === 'p10') text = 'text-rose-400 hover:bg-rose-950/60';
          else if (k === 'p25') text = 'text-amber-400 hover:bg-amber-950/60';
          else if (k === 'p50') text = 'text-indigo-400 hover:bg-indigo-950/60';
          else if (k === 'p75') text = 'text-emerald-400 hover:bg-emerald-950/60';
          else if (k === 'p90') text = 'text-purple-400 hover:bg-purple-950/60';
          btn.className = `px-2.5 py-0.5 rounded text-[11px] ${text} transition`;
        }
      });

      const badge = document.getElementById('ledgerPathBadge');
      if (badge) {
        const labels = {
          p10: '10th Percentile (Severe Shock)',
          p25: '25th Percentile (Weak Market)',
          p50: '50th Percentile (Median Path)',
          p75: '75th Percentile (Strong Market)',
          p90: '90th Percentile (Bull Run)'
        };
        badge.innerText = labels[pKey] || pKey;
      }
      renderForecastLedgerTable();
    }

    function toggleLedgerOrientation() {
      window.ledgerOrientation = window.ledgerOrientation === 'columns' ? 'rows' : 'columns';
      const lbl = document.getElementById('lblPivotMode');
      if (lbl) {
        lbl.innerText = window.ledgerOrientation === 'columns' ? 'Pivot: Years as Rows' : 'Pivot: Years as Columns';
      }
      renderForecastLedgerTable();
    }

    function toggleLedgerSection(sec) {
      if (window.ledgerSections[sec] === undefined) window.ledgerSections[sec] = true;
      window.ledgerSections[sec] = !window.ledgerSections[sec];
      renderForecastLedgerTable();
    }

    function formatLedgerValue(num) {
      if (num === null || num === undefined || Math.abs(num) < 0.01) return '—';
      const isNeg = num < 0;
      const abs = Math.abs(num);
      if (abs >= 1000000) {
        return (isNeg ? '-$' : '$') + (abs / 1000000).toFixed(1) + 'M';
      } else if (abs >= 1000) {
        return (isNeg ? '-$' : '$') + Math.round(abs / 1000).toLocaleString() + 'k';
      } else {
        return (isNeg ? '-$' : '$') + Math.round(abs).toLocaleString();
      }
    }

    function renderForecastLedgerTable() {
      const container = document.getElementById('forecastLedgerTableContainer');
      const kpiContainer = document.getElementById('ledgerKpiStrip');
      if (!container) return;

      const pKey = window.selectedLedgerPercentile || 'p50';
      let sim = window.mcPercentileRuns ? window.mcPercentileRuns[pKey] : null;
      if (!sim) {
        const userRetireAge = (window.appState.user && window.appState.user.retireAge) ? window.appState.user.retireAge : 52.0;
        sim = runMultiAssetSimulation({ retireAge: userRetireAge, trimPct: 0 });
      }
      if (!sim || !sim.rows || sim.rows.length === 0) return;

      const rows = sim.rows; // 58 projection years
      const row100 = rows[rows.length - 1];
      const assets = window.appState.assets || [];
      const spendingItems = window.appState.spending || [];

      // Update Summary KPI Strip
      if (kpiContainer) {
        const pLabels = {
          p10: '10th %ile Shock',
          p25: '25th %ile Weak',
          p50: '50th %ile Median',
          p75: '75th %ile Strong',
          p90: '90th %ile Bull'
        };
        const pLabel = pLabels[pKey] || pKey;
        const terminalNWStr = formatLedgerValue(row100 ? row100.netWorth : 0);
        const retireNWStr = formatLedgerValue(sim.nwAtRetire || 0);
        const peakNWStr = formatLedgerValue(sim.peakNW || 0);
        const isSolvent = !sim.depletionAge;
        const solvencyStr = isSolvent ? 'Fully Solvent' : `Depleted @ Age ${sim.depletionAge}`;

        kpiContainer.innerHTML = `
          <div class="p-4 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div class="text-[11px] text-slate-400 font-medium">Terminal Net Worth (Age 100)</div>
            <div class="text-xl font-bold font-mono ${row100 && row100.netWorth > 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1">${terminalNWStr}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">${pLabel} Simulation Path</div>
          </div>
          <div class="p-4 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div class="text-[11px] text-slate-400 font-medium">Net Worth at Retirement</div>
            <div class="text-xl font-bold font-mono text-indigo-400 mt-1">${retireNWStr}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">Target Age ${sim.retireAge || 52}</div>
          </div>
          <div class="p-4 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div class="text-[11px] text-slate-400 font-medium">Peak Portfolio Net Worth</div>
            <div class="text-xl font-bold font-mono text-purple-400 mt-1">${peakNWStr}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">Achieved at Age ${sim.peakAge || '—'}</div>
          </div>
          <div class="p-4 rounded-xl bg-surface-card border border-surface-border shadow-lg">
            <div class="text-[11px] text-slate-400 font-medium">Runway &amp; Solvency Status</div>
            <div class="text-xl font-bold font-mono ${isSolvent ? 'text-emerald-400' : 'text-rose-400'} mt-1">${solvencyStr}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">${isSolvent ? 'Solvent through Age 100' : 'Downside sequence stress'}</div>
          </div>
        `;
      }

      const orientation = window.ledgerOrientation || 'columns';

      if (orientation === 'columns') {
        // Classic Financial Statement: 58 Years across top columns, Line items down rows
        const secAssets = window.ledgerSections.assets !== false;
        const secDisbursements = window.ledgerSections.disbursements !== false;
        const secTaxes = window.ledgerSections.taxes !== false;
        const secInflows = window.ledgerSections.inflows !== false;
        const secOutflows = window.ledgerSections.outflows !== false;
        const secRecon = window.ledgerSections.recon !== false;

        let html = `
          <table class="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr class="sticky top-0 z-20 bg-slate-950 shadow-sm border-b border-surface-border">
                <th class="sticky left-0 z-30 bg-slate-950 px-4 py-3 text-left border-r border-surface-border min-w-[260px] text-white font-bold tracking-wide shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                  Line Item \\ Projection Year
                </th>
        `;

        rows.forEach(r => {
          const isRetireYr = r.age === Math.floor(sim.retireAge);
          html += `
            <th class="px-3 py-2 text-right border-r border-surface-border/40 min-w-[84px] ${isRetireYr ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-300'} font-semibold">
              <div class="${isRetireYr ? 'text-indigo-400 font-bold' : ''}">${r.year}</div>
              <div class="text-[10px] font-normal ${isRetireYr ? 'text-indigo-300' : 'text-slate-500'} font-mono">Age ${r.age}</div>
            </th>
          `;
        });
        html += `</tr></thead><tbody class="divide-y divide-surface-border/60">`;

        // Section: Net Worth Summary
        html += `
          <tr class="bg-surface-cardHover/80">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-surface-cardHover/90 border-r border-surface-border">
              📈 Portfolio Net Worth &amp; Cash Flow Summary
            </td>
          </tr>
        `;

        // EOY Net Worth Row (Prominent)
        html += `
          <tr class="bg-slate-900/90 font-bold hover:bg-slate-800/80 transition">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2.5 border-r border-surface-border text-emerald-400 font-bold text-xs tracking-wide shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              ★ EOY Net Worth
            </td>
        `;
        rows.forEach(r => {
          html += `<td class="px-3 py-2 text-right font-bold tabular-nums border-r border-surface-border/30 ${r.netWorth > 0 ? 'text-emerald-400' : 'text-rose-400'}">${formatLedgerValue(r.netWorth)}</td>`;
        });
        html += `</tr>`;

        // Liquid Assets Row
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-slate-300 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              Total Liquid Assets
            </td>
        `;
        rows.forEach(r => {
          const liquid = (r.curCash || 0) + (r.curTaxable || 0) + (r.curPreTax || 0) + (r.curRoth || 0);
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums text-slate-300 border-r border-surface-border/30">${formatLedgerValue(liquid)}</td>`;
        });
        html += `</tr>`;

        // Cash & Liquid Reserves Balance Row (Prominent)
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition bg-cyan-950/20">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-cyan-400 font-semibold shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              💵 Cash &amp; Liquid Reserves Balance
            </td>
        `;
        rows.forEach(r => {
          const cashVal = r.curCash || 0;
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/30 text-cyan-400 font-medium">${formatLedgerValue(cashVal)}</td>`;
        });
        html += `</tr>`;

        // Surplus Cash Plowed to Automated Investing Row
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition bg-emerald-950/10">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-emerald-400 pl-7 text-[11px] font-medium shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              🌱 Surplus Cash Plowed to Auto Invest
            </td>
        `;
        rows.forEach(r => {
          const plowVal = r.excessCashPlowed || 0;
          const text = plowVal > 0 ? '+' + formatLedgerValue(plowVal) : '—';
          html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums border-r border-surface-border/30 text-emerald-400 font-medium">${text}</td>`;
        });
        html += `</tr>`;

        // Effective Portfolio Volatility (σ) Row (Prominent Audit Tracker)
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition bg-indigo-950/20">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-indigo-300 font-semibold shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              📊 Effective Portfolio Volatility (σ)
            </td>
        `;
        rows.forEach(r => {
          const volVal = r.portfolioVolatility !== undefined ? r.portfolioVolatility.toFixed(1) + '%' : '—';
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/30 text-indigo-300 font-medium">${volVal}</td>`;
        });
        html += `</tr>`;

        // Net Cash Flow Row
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-slate-300 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              Net Annual Cash Flow (Inflows - Spend)
            </td>
        `;
        rows.forEach(r => {
          const ncf = r.netCashFlow || 0;
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/30 ${ncf >= 0 ? 'text-emerald-400' : 'text-amber-400'}">${formatLedgerValue(ncf)}</td>`;
        });
        html += `</tr>`;

        // Gross Disbursed Row
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-amber-300 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              Gross Portfolio Disbursed
            </td>
        `;
        rows.forEach(r => {
          const gd = r.totalGrossDisbursed || 0;
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/30 text-amber-300">${formatLedgerValue(gd)}</td>`;
        });
        html += `</tr>`;

        // Total Taxes Paid Row
        html += `
          <tr class="hover:bg-surface-cardHover/40 transition">
            <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-slate-300 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
              Total Taxes Paid (Actual Burden)
            </td>
        `;
        rows.forEach(r => {
          const tp = r.totalTaxesPaidYear || 0;
          html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/30 text-slate-300">${formatLedgerValue(tp)}</td>`;
        });
        html += `</tr>`;

        // SECTION: ASSET ACCOUNTS (BALANCE SHEET)
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('assets')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-indigo-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secAssets ? '▼' : '►'}</span> Asset Accounts (${assets.length} Accounts)
            </td>
          </tr>
        `;
        if (secAssets) {
          assets.forEach(ast => {
            const isSingleStock = ast.isSingleStock || (ast.name && (ast.name.toLowerCase().includes('stock') || ast.name.toLowerCase().includes('equity')));
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-300 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ${ast.name} <span class="text-[9px] text-slate-500 font-sans">(${ast.taxClassification})</span>
                </td>
            `;
            rows.forEach(r => {
              const val = r.assetBalances ? (r.assetBalances[ast.id] || 0) : 0;
              let extraSub = '';
              if (isSingleStock && r.googShares !== undefined && r.googShares > 0) {
                extraSub = `<div class="text-[9px] text-indigo-400 font-mono">${r.googShares.toLocaleString()} sh</div>`;
              }
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400 border-r border-surface-border/20">${formatLedgerValue(val)}${extraSub}</td>`;
            });
            html += `</tr>`;
          });

          const hasRoth = rows.some(r => (r.curRoth || 0) > 0);
          if (hasRoth) {
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px] bg-indigo-950/20 font-semibold">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-indigo-300 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ★ Roth IRA / Conversion Portfolio <span class="text-[9px] text-emerald-400 font-sans">(Tax-Free)</span>
                </td>
            `;
            rows.forEach(r => {
              const val = r.curRoth || 0;
              let extraSub = '';
              if (r.rothConverted && r.rothConverted > 0) {
                extraSub = `<div class="text-[9px] text-emerald-400 font-mono">+${formatLedgerValue(r.rothConverted)} conv</div>`;
              }
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-indigo-300 border-r border-surface-border/20">${formatLedgerValue(val)}${extraSub}</td>`;
            });
            html += `</tr>`;
          }
        }

        // SECTION: CASH INFLOWS
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('inflows')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-emerald-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secInflows ? '▼' : '►'}</span> Cash Inflows &amp; Earned Income
            </td>
          </tr>
        `;
        if (secInflows) {
          html += `
            <tr class="hover:bg-surface-cardHover/40 transition font-semibold text-emerald-400">
              <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                Total Cash Inflows
              </td>
          `;
          rows.forEach(r => {
            html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums border-r border-surface-border/20">${formatLedgerValue(r.totalInflows || 0)}</td>`;
          });
          html += `</tr>`;

          const inflowMetrics = [
            { label: "Primary Salary (Base)", key: "jSalary" },
            { label: "Secondary Salary (Base)", key: "nSalary" },
            { label: "Equity Vesting / Grants", key: "rsuAmt" },
            { label: "Social Security Benefit", key: "socialSecurity" },
            { label: "Discrete Life Events (Infusions)", key: "eventNet" }
          ];

          inflowMetrics.forEach(m => {
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-400 pl-9 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ${m.label}
                </td>
            `;
            rows.forEach(r => {
              const val = r[m.key] || 0;
              let extraSub = '';
              if (m.key === 'rsuAmt' && r.netVestedShares !== undefined && r.netVestedShares > 0) {
                extraSub = `<div class="text-[9px] text-emerald-400 font-mono">+${Math.round(r.netVestedShares).toLocaleString()} sh</div>`;
              }
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400 border-r border-surface-border/20">${formatLedgerValue(val)}${extraSub}</td>`;
            });
            html += `</tr>`;
          });
        }

        // SECTION: CASH OUTFLOWS (SPENDING CATEGORIES)
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('outflows')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-amber-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secOutflows ? '▼' : '►'}</span> Cash Outflows &amp; Spending (${spendingItems.length} Categories)
            </td>
          </tr>
        `;
        if (secOutflows) {
          html += `
            <tr class="hover:bg-surface-cardHover/40 transition font-semibold text-rose-400">
              <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                Total Annual Living Outflows
              </td>
          `;
          rows.forEach(r => {
            html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums border-r border-surface-border/20">${formatLedgerValue(r.totalOutflows || 0)}</td>`;
          });
          html += `</tr>`;

          spendingItems.forEach(item => {
            const isFixed = item.type === 'Fixed';
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-300 pl-9 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ${item.category} <span class="text-[9px] ${isFixed ? 'text-blue-400' : 'text-purple-400'} font-sans">[${item.type}]</span>
                </td>
            `;
            rows.forEach(r => {
              const val = r.categoryOutflows ? (r.categoryOutflows[item.category] || 0) : 0;
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400 border-r border-surface-border/20">${formatLedgerValue(val)}</td>`;
            });
            html += `</tr>`;
          });
        }

        // SECTION: PORTFOLIO DISBURSEMENTS & DRAWDOWN
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('disbursements')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-amber-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secDisbursements ? '▼' : '►'}</span> Portfolio Disbursements &amp; Drawdowns
            </td>
          </tr>
        `;
        if (secDisbursements) {
          const disbRows = [
            { label: "Total Gross Disbursed", key: "totalGrossDisbursed" },
            { label: "  Cash Reserves Disbursed", key: "dCash" },
            { label: "  Taxable Brokerage Disbursed (Gross)", key: "dTaxableGross", extra: r => r.googSharesSold ? `<div class="text-[9px] text-indigo-400 font-mono">${r.googSharesSold.toLocaleString()} sh</div>` : '' },
            { label: "  Taxable Brokerage Proceeds (Net)", key: "dTaxableNet" },
            { label: "  Pre-Tax 401(k) Disbursed (Gross)", key: "dPreTaxGross", extra: r => r.rmdAmount ? `<div class="text-[9px] text-purple-400 font-mono">RMD: $${Math.round(r.rmdAmount/1000)}k</div>` : '' },
            { label: "  Pre-Tax 401(k) Proceeds (Net)", key: "dPreTaxNet" },
            { label: "  Roth Converted Tranche (Pre-Tax to Roth)", key: "rothConverted", extra: r => r.rothConverted ? `<div class="text-[9px] text-emerald-400 font-mono">12% Bracket Fill</div>` : '' },
            { label: "  Tax-Free Roth Disbursed", key: "dRoth" },
            { label: "Net Realized Funding Available", key: "totalNetDisbursed" }
          ];
          disbRows.forEach(trItem => {
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-400 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ${trItem.label}
                </td>
            `;
            rows.forEach(r => {
              const val = r[trItem.key] || 0;
              const formatted = trItem.format ? trItem.format(val) : formatLedgerValue(val);
              const extra = trItem.extra ? trItem.extra(r) : '';
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400 border-r border-surface-border/20">${formatted}${extra}</td>`;
            });
            html += `</tr>`;
          });
        }

        // SECTION: BRACKET-AWARE TAX ENGINE BREAKDOWN
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('taxes')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secTaxes ? '▼' : '►'}</span> Bracket-Aware Tax Engine Liabilities
            </td>
          </tr>
        `;
        if (secTaxes) {
          const taxRows = [
            { label: "Total Taxes Paid (Actual Burden)", key: "totalTaxesPaidYear" },
            { label: "  Federal Ordinary Income Tax", key: "taxOrdinaryFed" },
            { label: "  California State Income Tax", key: "taxOrdinaryCA" },
            { label: "  Federal Long-Term Capital Gains Tax", key: "taxLtcgFed" },
            { label: "  Net Investment Income Tax (NIIT 3.8%)", key: "taxNiit" },
            { label: "  FICA / Payroll Taxes", key: "taxFica" },
            { label: "  Roth Conversion Tax (Fed + CA)", key: "taxConversionTotal" },
            { label: "Effective Total Tax Rate %", key: "effectiveTaxRateYear", format: v => v ? (v * 100).toFixed(1) + '%' : '0.0%' },
            { label: "401(k) Employee Pre-Tax Additions", key: "add401k" }
          ];
          taxRows.forEach(trItem => {
            html += `
              <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
                <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-400 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                  ${trItem.label}
                </td>
            `;
            rows.forEach(r => {
              const val = r[trItem.key] || 0;
              const formatted = trItem.format ? trItem.format(val) : formatLedgerValue(val);
              html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-slate-400 border-r border-surface-border/20">${formatted}</td>`;
            });
            html += `</tr>`;
          });
        }

        // SECTION: CASH FLOW RECONCILIATION & BALANCE INTEGRITY
        html += `
          <tr class="bg-slate-900/60 cursor-pointer" onclick="toggleLedgerSection('recon')">
            <td colspan="${rows.length + 1}" class="sticky left-0 z-10 px-4 py-2 text-xs font-bold text-emerald-300 bg-slate-900 border-r border-surface-border hover:text-white transition">
              <span class="mr-1.5">${secRecon ? '▼' : '►'}</span> Cash Flow Reconciliation &amp; Capital Integrity
            </td>
          </tr>
        `;
        if (secRecon) {
          // Total Sources Row
          html += `
            <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
              <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-300 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap font-medium">
                Total Cash Sources (Inflows + Net Realized Funding)
              </td>
          `;
          rows.forEach(r => {
            const sources = (r.totalInflows || 0) + (r.totalNetDisbursed || 0);
            html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-emerald-400 border-r border-surface-border/20">${formatLedgerValue(sources)}</td>`;
          });
          html += `</tr>`;

          // Total Uses Row
          html += `
            <tr class="hover:bg-surface-cardHover/40 transition text-[11px]">
              <td class="sticky left-0 z-10 bg-slate-950 px-4 py-1.5 border-r border-surface-border text-slate-300 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap font-medium">
                Total Living Uses (Living Outflows)
              </td>
          `;
          rows.forEach(r => {
            html += `<td class="px-3 py-1.5 text-right font-mono tabular-nums text-rose-400 border-r border-surface-border/20">${formatLedgerValue(r.totalOutflows || 0)}</td>`;
          });
          html += `</tr>`;

          // Net Reconciled Variance Row
          html += `
            <tr class="hover:bg-surface-cardHover/40 transition text-[11px] bg-emerald-950/20 font-bold">
              <td class="sticky left-0 z-10 bg-slate-950 px-4 py-2 border-r border-surface-border text-emerald-400 pl-7 shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                ✓ Net Reconciled Variance (Sources - Uses)
              </td>
          `;
          rows.forEach(r => {
            const v = r.reconciledVariance || 0;
            const text = Math.abs(v) < 1 ? '✓ $0' : formatLedgerValue(v);
            html += `<td class="px-3 py-2 text-right font-mono tabular-nums text-emerald-400 border-r border-surface-border/20">${text}</td>`;
          });
          html += `</tr>`;
        }

        html += `</tbody></table>`;
        container.innerHTML = html;

      } else {
        // Pivoted Orientation: 58 Years as Rows down, Categories & Metrics across top columns
        let html = `
          <table class="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr class="sticky top-0 z-20 bg-slate-950 shadow-sm border-b border-surface-border">
                <th class="sticky left-0 z-30 bg-slate-950 px-4 py-3 text-left border-r border-surface-border min-w-[140px] text-white font-bold tracking-wide shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                  Year &amp; Age
                </th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-emerald-400 font-bold min-w-[100px]">EOY Net Worth</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-slate-300 font-semibold min-w-[95px]">Liquid Assets</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-cyan-400 font-semibold min-w-[95px]">Cash Reserves</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-emerald-400 font-semibold min-w-[100px]">Plowed to Invest</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-indigo-300 font-semibold min-w-[90px]">Volatility (&sigma;)</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-indigo-300 font-semibold min-w-[95px]">Roth Bucket</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-indigo-300 font-semibold min-w-[95px]">Net Cash Flow</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-emerald-300 font-semibold min-w-[95px]">Total Inflows</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-rose-300 font-semibold min-w-[95px]">Total Outflows</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-amber-300 font-semibold min-w-[95px]">Gross Disbursed</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-blue-300 font-semibold min-w-[85px]">Fed Tax</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-indigo-300 font-semibold min-w-[85px]">CA Tax</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-purple-300 font-semibold min-w-[85px]">LTCG/NIIT</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-slate-300 font-semibold min-w-[90px]">Total Tax</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-slate-400 font-semibold min-w-[70px]">Eff. Tax %</th>
                <th class="px-3 py-2 text-right border-r border-surface-border text-emerald-400 font-semibold min-w-[75px]">Variance</th>
        `;

        // Column headers for all assets
        assets.forEach(ast => {
          html += `<th class="px-3 py-2 text-right border-r border-surface-border/40 text-slate-400 min-w-[110px] whitespace-nowrap">${ast.name}</th>`;
        });

        // Column headers for all spending categories
        spendingItems.forEach(item => {
          html += `<th class="px-3 py-2 text-right border-r border-surface-border/40 text-slate-400 min-w-[110px] whitespace-nowrap">${item.category}</th>`;
        });

        html += `</tr></thead><tbody class="divide-y divide-surface-border/60">`;

        rows.forEach(r => {
          const isRetireYr = r.age === Math.floor(sim.retireAge);
          const liquid = (r.curCash || 0) + (r.curTaxable || 0) + (r.curPreTax || 0) + (r.curRoth || 0);

          html += `
            <tr class="hover:bg-surface-cardHover/60 transition ${isRetireYr ? 'bg-indigo-950/20' : ''}">
              <td class="sticky left-0 z-10 ${isRetireYr ? 'bg-indigo-950/80 text-indigo-300 font-bold' : 'bg-slate-950 text-white font-semibold'} px-4 py-2 border-r border-surface-border shadow-[2px_0_5px_rgba(0,0,0,0.5)] whitespace-nowrap">
                ${r.year} <span class="text-[10px] ${isRetireYr ? 'text-indigo-400' : 'text-slate-500'} font-normal">(Age ${r.age})</span>
              </td>
              <td class="px-3 py-2 text-right font-bold tabular-nums border-r border-surface-border/40 ${r.netWorth > 0 ? 'text-emerald-400' : 'text-rose-400'}">${formatLedgerValue(r.netWorth)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-slate-300">${formatLedgerValue(liquid)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-cyan-400 font-medium">${formatLedgerValue(r.curCash || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-emerald-400 font-medium">${(r.excessCashPlowed || 0) > 0 ? '+' + formatLedgerValue(r.excessCashPlowed) : '—'}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-indigo-300 font-medium">${r.portfolioVolatility !== undefined ? r.portfolioVolatility.toFixed(1) + '%' : '—'}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-indigo-300">${formatLedgerValue(r.curRoth || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 ${r.netCashFlow >= 0 ? 'text-emerald-400' : 'text-amber-400'}">${formatLedgerValue(r.netCashFlow || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-emerald-400 font-medium">${formatLedgerValue(r.totalInflows || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-rose-400 font-medium">${formatLedgerValue(r.totalOutflows || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-amber-300 font-medium">${formatLedgerValue(r.totalGrossDisbursed || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-blue-400">${formatLedgerValue(r.taxOrdinaryFed || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-indigo-400">${formatLedgerValue(r.taxOrdinaryCA || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-purple-400">${formatLedgerValue((r.taxLtcgFed || 0) + (r.taxLtcgCA || 0) + (r.taxNiit || 0))}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-slate-300 font-medium">${formatLedgerValue(r.totalTaxesPaidYear || 0)}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-slate-400">${r.effectiveTaxRateYear ? (r.effectiveTaxRateYear * 100).toFixed(1) + '%' : '0.0%'}</td>
              <td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/40 text-emerald-400 font-bold">${Math.abs(r.reconciledVariance || 0) < 1 ? '✓ $0' : formatLedgerValue(r.reconciledVariance)}</td>
          `;

          // Asset cells
          assets.forEach(ast => {
            const val = r.assetBalances ? (r.assetBalances[ast.id] || 0) : 0;
            html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/20 text-slate-400">${formatLedgerValue(val)}</td>`;
          });

          // Category cells
          spendingItems.forEach(item => {
            const val = r.categoryOutflows ? (r.categoryOutflows[item.category] || 0) : 0;
            html += `<td class="px-3 py-2 text-right font-mono tabular-nums border-r border-surface-border/20 text-slate-400">${formatLedgerValue(val)}</td>`;
          });

          html += `</tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
      }
    }

    function exportForecastArchiveCSV() {
      try {
        const engine = globalThis.FireEngine || FireEngine;
        if (!engine || !engine.buildForecastArchiveCSVText) {
          alert('Calculation engine not loaded.');
          return;
        }

        // Use cached runs if available, otherwise engine builds fresh representative runs
        const state = window.appState || {};
        const runs = window.mcPercentileRuns || null;
        const csvText = engine.buildForecastArchiveCSVText(state, runs);

        const snapshotDate = state.latestSnapshotDate || '2025-12-31';
        const today = new Date().toISOString().slice(0, 10);
        const filename = `Financial_Forecast_Archive_${snapshotDate}_${today}.csv`;

        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error('Failed to export forecast archive:', err);
        alert('Error exporting forecast archive: ' + err.message);
      }
    }

  // Export UI handlers to global window scope for HTML inline attributes
  root.addRsuGrantYear = addRsuGrantYear;
  root.apply529Schedule = apply529Schedule;
  root.calculate529Live = calculate529Live;
  root.calculateEarliestFireAge = calculateEarliestFireAge;
  root.clearAllSeries = clearAllSeries;
  root.closeAssetModal = closeAssetModal;
  root.closeCategoryTrendModal = closeCategoryTrendModal;
  root.closeEventModal = closeEventModal;
  root.closeSnapshotModal = closeSnapshotModal;
  root.deleteCategoryAnnotation = deleteCategoryAnnotation;
  root.deleteCurrentAsset = deleteCurrentAsset;
  root.deleteEvent = deleteEvent;
  root.deleteRsuGrant = deleteRsuGrant;
  root.exportForecastArchiveCSV = exportForecastArchiveCSV;
  root.formatLedgerValue = formatLedgerValue;
  root.getAssetBuckets = getAssetBuckets;
  root.getDatasetYearBounds = getDatasetYearBounds;
  root.initAssumptions = initAssumptions;
  root.initSeriesSelection = initSeriesSelection;
  root.markMcStale = markMcStale;
  root.onDecadalSliderChange = onDecadalSliderChange;
  root.onEndYearSliderChange = onEndYearSliderChange;
  root.onIncomeChange = onIncomeChange;
  root.onLeanSliderChange = onLeanSliderChange;
  root.onMacroSliderChange = onMacroSliderChange;
  root.onRetireAgeSliderChange = onRetireAgeSliderChange;
  root.onStartYearSliderChange = onStartYearSliderChange;
  root.openAddAssetModal = openAddAssetModal;
  root.openAddEventModal = openAddEventModal;
  root.openAddSpendingModal = openAddSpendingModal;
  root.openEditAssetModal = openEditAssetModal;
  root.openEditSpendingModal = openEditSpendingModal;
  root.closeSpendingModal = closeSpendingModal;
  root.syncSpendingModalAmounts = syncSpendingModalAmounts;
  root.saveSpendingFromModal = saveSpendingFromModal;
  root.deleteCurrentSpendingCategory = deleteCurrentSpendingCategory;
  root.quickDeleteSpending = quickDeleteSpending;
  root.openSnapshotModal = openSnapshotModal;
  root.populateCurrentBalancesInSnapshotModal = populateCurrentBalancesInSnapshotModal;
  root.renderAssetTrendsChart = renderAssetTrendsChart;
  root.renderAssetsTable = renderAssetsTable;
  root.renderCategoryTrendChart = renderCategoryTrendChart;
  root.renderEventsList = renderEventsList;
  root.renderForecastLedgerTable = renderForecastLedgerTable;
  root.renderModalCategoryNotesList = renderModalCategoryNotesList;
  root.renderRsuTable = renderRsuTable;
  root.renderSeriesCheckboxes = renderSeriesCheckboxes;
  root.renderSpendingTable = renderSpendingTable;
  root.renderSpendingTimelineNotes = renderSpendingTimelineNotes;
  root.renderSpendingTrendsChart = renderSpendingTrendsChart;
  root.runMonteCarloSimulation = runMonteCarloSimulation;
  root.runMultiAssetSimulation = runMultiAssetSimulation;
  root.saveAssetFromModal = saveAssetFromModal;
  root.saveCategoryAnnotationFromModal = saveCategoryAnnotationFromModal;
  root.saveEventFromModal = saveEventFromModal;
  root.saveSnapshotFromModal = saveSnapshotFromModal;
  root.selectAllSeries = selectAllSeries;
  root.selectLedgerPercentile = selectLedgerPercentile;
  root.selectTop5Series = selectTop5Series;
  root.setTrajectoryMode = setTrajectoryMode;
  root.showAssetTrend = showAssetTrend;
  root.showCategorySpendingTrend = showCategorySpendingTrend;
  root.switchForecastSubTab = switchForecastSubTab;
  root.switchTab = switchTab;
  root.switchVersion = switchVersion;
  root.closeAssetTrendModal = closeAssetTrendModal;
  root.toggle529Modal = toggle529Modal;
  root.toggleAssetSeries = toggleAssetSeries;
  root.toggleLedgerOrientation = toggleLedgerOrientation;
  root.toggleLedgerSection = toggleLedgerSection;
  root.toggleMcFocus = toggleMcFocus;
  root.toggleMcLog = toggleMcLog;
  root.toggleSeriesDropdown = toggleSeriesDropdown;
  root.toggleSpendingType = toggleSpendingType;
  root.toggleTrajFocus = toggleTrajFocus;
  root.toggleTrajLog = toggleTrajLog;
  root.updateDashboardScorecards = updateDashboardScorecards;
  root.updateMasterTrajectory = updateMasterTrajectory;
  root.updateRetireMath = updateRetireMath;
  root.updateRsuGrant = updateRsuGrant;
  root.updateRsuGrossUnits = updateRsuGrossUnits;
  root.recalcAssetModalBalance = recalcAssetModalBalance;
  root.updateSeriesDropdownLabel = updateSeriesDropdownLabel;
  root.updateSliderControls = updateSliderControls;
  root.updateSpendingScorecards = updateSpendingScorecards;
  root.updateWeightedReturnBadge = updateWeightedReturnBadge;
  root.renderStrategicPlaybook = renderStrategicPlaybook;
  root.togglePlaybookTask = togglePlaybookTask;
  root.toggleRothConversion = toggleRothConversion;
  root.toggleGlidePath = toggleGlidePath;
  root.onGlideSliderChange = onGlideSliderChange;

})(typeof window !== "undefined" ? window : globalThis);
