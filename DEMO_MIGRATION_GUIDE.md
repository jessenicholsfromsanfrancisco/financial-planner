# Public Demo Edition Migration Guide: Decision Log & Runbook

This document serves as the institutional memory and architectural specification for maintaining and graduating future versions (e.g. `v5`, `v6`) of the financial simulation engine into the public demo environment hosted on GitHub Pages and embedded at `jessenichols.com/financial_planner`.

---

## 1. Core Architectural Separation

```
Financial Modelling Workspace
├── dev/v4/          <-- Full personal development version (contains audited ledger & personal parameters)
├── prod/            <-- Production golden baseline
└── demo/            <-- Standalone Public Git Repository (origin: financial-planner)
    ├── index.html   <-- Root GitHub Pages redirect shell (points to active version)
    ├── v4/          <-- Public anonymized demo equivalent of dev/v4
    │   ├── index.html
    │   ├── src/ (engine.js, store.js, ui.js)
    │   ├── data/state_bundle.js
    │   ├── qa_harness.js
    │   └── run_qa.sh
    └── DEMO_MIGRATION_GUIDE.md (this document)
```

---

## 2. Institutional Decision Log (Key Architectural Decisions)

Whenever migrating a new development version (`dev/vN`) to the public demo (`demo/vN`), enforce the following 7 invariant decisions:

### Decision 1: Zero-Leak Privacy & Anonymization
- **Strict Prohibition**: Zero personal names (Jesse, Natalia, Hendrix), employer specifics (Google, Morgan Stanley), real estate addresses (Norwood, Russian River), or actual private bank balances may exist in code, comments, datasets, or exports.
- **Modest Starter Profile**: Initialize with a relatable, generic 30-year-old profile:
  - **Age**: 30.1 (birthdate `1996-01-01`) | **Target Retirement Age**: 60.0
  - **Gross Salary**: $105,000 / year
  - **Annual Spend**: $65,000 / year ($45k fixed core, $20k discretionary across 7 standard categories)
  - **Net Worth**: $115,000 across 5 standard accounts:
    - Primary Checking: $15,000
    - High-Yield Savings (Emergency Fund): $20,000
    - Employer 401(k): $40,000
    - Roth IRA (Index Fund): $20,000
    - Individual Taxable Brokerage: $20,000

### Decision 2: Professional Rebranding & Zero "FIRE" Terminology
- **Employer-Safe Branding**: Strip all user-facing references to the acronym "FIRE" from HTML, JavaScript string templates, card badges, tooltips, chart legends, and file export names.
- **Product Title**: "Financial Planner | Interactive Wealth & Retirement Simulator".
- **Header Live Banner**: "100% Private & In-Browser • Data Auto-Wipes on Tab Close".

### Decision 3: Transient Session Memory (`sessionStorage`)
- **No Long-Term Tracking**: Use `sessionStorage` (`financial_planner_session_state`) instead of permanent `localStorage`.
- **Auto-Wipe**: When a visitor tweaks sliders, edits assets, or customizes budgets, edits persist while their tab is open. The moment the browser tab or window closes, all data is automatically purged.
- **Iframe Partitioning Resilience**: In Safari/iOS where third-party iframe storage can be restricted, include an in-memory fallback dictionary (`window.__inMemorySessionStorage`) so the app never throws runtime security exceptions.
- **Reset Button**: Provide a visible "Reset to Demo Defaults" button in the header.

### Decision 4: Current Year Projection Alignment
- **Dynamic Start Year**: Set the simulation start year dynamically to `new Date().getFullYear()` (e.g. 2026).
- **No Orphaned Historical Charts**: Public visitors do not have multi-year personal transaction histories. Remove the multi-year historical asset chart and historical spending trend chart to keep the UI focused entirely on forward retirement forecasting and scenario modeling.

### Decision 5: Two-Way Editable Spending & Assets Online
- **Full In-Browser CRUD**: Public visitors must be able to customize their living expenses directly in the UI.
- **Add & Edit Spending Category Modal**:
  - Category Name & Group (Housing, Living, Lifestyle, Transport, Healthcare, Other).
  - Classification toggle: `Fixed / Non-Negotiable` vs `Discretionary (Trimmable)`.
  - Real-time two-way synchronization: typing monthly amount auto-calculates annual budget ($\text{Annual} = \text{Monthly} \times 12$), and vice versa.
  - Delete category action.
- **Reactive Chain**: Any change to spending or assets immediately updates `window.appState`, re-runs retirement solvencies and Monte Carlo percentiles, and saves to `sessionStorage`.

### Decision 6: Single-Stock Decoupling & Cash Surplus Reinvestment
- **Decoupled Engine**: Replace hardcoded Google equity references with generic properties (`isSingleStock: true`).
- **Working-Year Savings Sweep**: During active career years, surplus earnings above annual spending and the 2-year emergency cash reserve are automatically swept into taxable investments (`curTaxable`), guaranteeing the directional invariant that earning more strictly increases terminal wealth.

### Decision 7: Simplified Feature Scope
- **Omit Niche Modules**: Child 529 college savings planning and specialized DAF charitable appreciated stock gifting modules are removed from the demo interface to keep the initial user experience streamlined and universally applicable.

### Decision 8: Interactive "How to Use" & Methodology Guide Tab
- **Onboarding & Methodology Tab**: Include a dedicated top navigation tab (`#tabBtn-guide` and `#tab-guide`) labeled **"How to Use"** with a `?` icon, plus a companion link in the top privacy banner.
- **Visitor Onboarding**:
  - Step 1: Calibrate accounts and balances in *Assets & Ledger* across Cash, Pre-Tax, Tax-Free (Roth), and Taxable Brokerage.
  - Step 2: Define living expenses in *Annual Spending* with *Fixed* vs. *Discretionary* toggles.
  - Step 3: Set timeline, career earnings, 401(k) contributions, inflation, and milestone events in *Forecasts & Assumptions*.
  - Step 4: Analyze solvency and 1,000-run stochastic Monte Carlo risk on the *Dashboard*.
- **Quantitative Transparency**: Clearly document the career cash surplus sweep into taxable investments, the multi-tier retirement tax decumulation waterfall, the 1,000-path geometric Brownian motion Monte Carlo engine with sequence-of-returns percentiles (p10/p25/p50/p75/p90), and strategic Roth conversion / RMD defense logic.
- **Privacy Reassurance**: Explicitly document client-side in-memory `sessionStorage` execution, JSON local disk backup, and CSV archive export.

---

## 3. Step-by-Step Runbook: Migrating Future Versions (e.g. dev/v5 to demo/v5)

When a new version `dev/v(N)` is completed and ready to be ported to `demo/`:

1. **Create Target Directory**:
   ```bash
   mkdir -p "demo/v(N)/src" "demo/v(N)/data"
   ```
2. **Copy Core Logic**:
   Copy `engine.js`, `store.js`, `ui.js`, `index.html`, `qa_harness.js`, and `run_qa.sh` from `dev/v(N)/` into `demo/v(N)/`.
3. **Replace Datasets**:
   Ensure `demo/v(N)/data/state_bundle.js` contains the synthetic 30-year-old starter profile ($115k assets, $65k expenses).
4. **Apply Storage & Decoupling**:
   - In `store.js`: Ensure storage engine points to `sessionStorage` with in-memory fallback.
   - In `engine.js`: Verify dynamic spending fallback (`item.amount || item.actual2026 || item.actual2025`).
   - In `ui.js`: Ensure Add/Edit spending modal handlers and `sessionStorage` reset buttons are connected.
5. **Headless Verification Gate**:
   Execute the invariant test runner:
   ```bash
   ./demo/v(N)/run_qa.sh
   ```
   *Requirement: Must exit with code 0 across all benchmark vectors before staging.*
6. **Update Root Redirect**:
   In `demo/index.html`, update the meta-refresh URL and script redirect to point to `v(N)/`:
   ```html
   <meta http-equiv="refresh" content="0; url=v5/">
   <script>window.location.replace("v5/");</script>
   ```
7. **Commit & Deploy**:
   Commit changes and push to GitHub (see Section 4).

---

## 4. Git Deployment Commands

To push updates from your local workspace to your live GitHub demo repository:

```bash
# Navigate to the demo Git directory
cd "/Users/jessenichols/Documents/Antigravity/Financial Modelling/demo"

# Stage all files
git add .

# Commit with descriptive milestone message
git commit -m "feat(v4): add in-browser spending CRUD, remove historical charts, reorganize to v4"

# Push directly to GitHub Pages
git push origin main
```
