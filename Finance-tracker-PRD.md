# Finance Tracker — Product Requirements Document (PRD)
### A Privacy-First, Browser-Only Personal Finance & Investment Tracker for India
**Version:** 1.0  
**Date:** June 2026  
**Status:** Ready for Development  
**Target Platform:** Web (Desktop-first, Mobile-responsive)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Privacy & Data Architecture](#3-privacy--data-architecture)
4. [Design System](#4-design-system)
5. [Indian Financial Context & Rules Engine](#5-indian-financial-context--rules-engine)
6. [Information Architecture & Navigation](#6-information-architecture--navigation)
7. [Phase 1 — Core Income & Expense Tracking](#7-phase-1--core-income--expense-tracking)
8. [Phase 2 — Investment Tracking](#8-phase-2--investment-tracking)
9. [Phase 3 — Tax Estimation Engine](#9-phase-3--tax-estimation-engine)
10. [Phase 4 — Insights Dashboard](#10-phase-4--insights-dashboard)
11. [Phase 5 — Data Management & Export](#11-phase-5--data-management--export)
12. [Edge Cases & Validations (Global)](#12-edge-cases--validations-global)
13. [Accessibility & Internationalisation](#13-accessibility--internationalisation)
14. [Testing Checklist](#14-testing-checklist)
15. [Phased Rollout Plan](#15-phased-rollout-plan)

---

## 1. Executive Summary

**Finance Tracker** is a zero-server, privacy-first personal finance web application built entirely in the browser. No account creation. No data leaves the device. It helps Indian salaried and self-employed individuals:

- Track monthly income from all sources (salary, freelance, rental, dividends, interest)
- Categorise and monitor day-to-day expenses with default Indian spending categories plus user-defined custom ones
- Track a diversified investment portfolio: Indian equity, US stocks, mutual funds (equity and debt), bonds, PPF/NPS, crypto/VDA, gold
- Estimate income tax liability under both Old and New Tax Regimes (FY 2025-26, AY 2026-27) and project capital gains tax
- Get clear, actionable monthly and annual insights — spending patterns, savings rate, investment allocation, and tax-saving headroom

All data is stored in the browser's `localStorage` (or IndexedDB for larger datasets) with optional export to encrypted JSON or CSV.

---

## 2. Product Vision & Goals

### 2.1 Problem Statements

| Problem | Current Pain |
|---|---|
| Monthly income tracking | Users add income ad-hoc; no structure for multiple income types |
| Expense tracking | No Indian-specific default categories (e.g., vegetables, kirana, EMIs) |
| Insights | No aggregation; users can't see where money is going month-over-month |
| Investment tracking | No single place to see Indian + US equity, MF, crypto, bonds together |
| Tax estimation | Users only find out tax liability in March; no year-round projection |

### 2.2 Goals (P0 = must-have, P1 = should-have, P2 = nice-to-have)

| Priority | Goal |
|---|---|
| P0 | Record income and categorised expenses per month |
| P0 | Default Indian expense categories + custom categories |
| P0 | Investment tracking across all asset classes |
| P0 | Monthly + annual consolidated insights dashboard |
| P0 | Fully client-side; no data leaves the browser |
| P1 | Income tax estimation (Old vs New Regime) |
| P1 | Capital gains tracker with tax computation |
| P1 | Export to CSV / JSON |
| P2 | Budget targets per category |
| P2 | Recurring expense templates |
| P2 | Dark/light mode toggle |

### 2.3 Out of Scope (v1.0)

- Bank account sync / Open Banking API
- UPI / bill integration
- Shared / family accounts
- iOS/Android native apps
- Server-side AI categorisation
- Real-time stock price feed

---

## 3. Privacy & Data Architecture

### 3.1 Core Principle

**"Your data never leaves your browser."**  
There is no backend, no database, no analytics SDK, no third-party script that transmits user data. The app is a pure static site (HTML + CSS + JS or React SPA).

### 3.2 Storage Strategy

```
Primary Store:    localStorage  (< 5 MB per origin, suitable for most users)
Overflow Store:   IndexedDB     (activated automatically when data > 3 MB)
```

**Storage Key Schema:**

```
paisa_meta          → { version, createdAt, lastModified, currency }
paisa_profile       → { name?, taxRegime, age, employmentType, financialYearStart }
paisa_income_{YYYY_MM}  → [ ...IncomeEntry ]
paisa_expense_{YYYY_MM} → [ ...ExpenseEntry ]
paisa_categories    → { expense: [...], income: [...], investment: [...] }
paisa_investments   → { holdings: [...], transactions: [...] }
paisa_budgets       → { monthly: { categoryId: amount }, annual: { categoryId: amount } }
paisa_settings      → { theme, locale, currencyFormat, financialYearStart }
```

### 3.3 Data Versioning & Migration

- Every data object carries a `schemaVersion` field (starts at `1`)
- On app load, check `paisa_meta.version` against the current app version
- If schema has changed, run a migration function before rendering
- Migrations are pure functions: `migrate_v1_to_v2(oldData) → newData`
- Never destructively overwrite without migration

### 3.4 Export & Import

- **Export:** Full JSON backup (all stores), CSV per section (income, expenses, investments)
- **Import:** Accept previously exported JSON; validate schema version; merge or replace modes
- **Encryption (optional):** AES-256 via Web Crypto API; user sets passphrase; prompt on import

### 3.5 Data Loss Prevention

- Auto-save every edit (debounced 500ms) — no explicit Save button needed
- Show last-saved timestamp in the top-right corner of every screen
- On import/overwrite, always offer a "Download current backup first" step before proceeding

---

## 4. Design System

### 4.1 Aesthetic Direction

**"Modern Indian Ledger"** — Inspired by the precision of accounting combined with Indian visual warmth. Clean, airy, data-first. Not cluttered. Heavy use of whitespace. Numbers are the hero.

### 4.2 Color Palette

```css
/* Light Mode (default) */
--bg-primary:    #FAFAF8;      /* warm off-white */
--bg-surface:    #FFFFFF;
--bg-subtle:     #F4F3EE;      /* warm gray tint */
--border:        #E8E6DF;
--text-primary:  #1A1A18;
--text-secondary:#6B6B5F;
--text-tertiary: #A09E94;
--accent-primary:#1C6B3A;      /* deep forest green — money/growth */
--accent-warm:   #E8612A;      /* Indian saffron-orange — alerts/overspend */
--accent-blue:   #1E4FA8;      /* for investments/equity */
--accent-gold:   #C4922A;      /* for savings/wealth */
--income-color:  #1C6B3A;      /* green */
--expense-color: #E8612A;      /* orange-red */
--invest-color:  #1E4FA8;      /* blue */
--success:       #2E7D32;
--warning:       #E65100;
--error:         #C62828;
--info:          #1565C0;

/* Dark Mode */
--bg-primary:    #141412;
--bg-surface:    #1E1E1C;
--bg-subtle:     #262623;
--border:        #333330;
--text-primary:  #F0EFE8;
--text-secondary:#9E9C90;
--accent-primary:#4CAF72;
--accent-warm:   #FF7043;
```

### 4.3 Typography

```css
/* Font Stack */
--font-display: 'Sora', sans-serif;         /* headings, big numbers */
--font-body:    'DM Sans', sans-serif;      /* body text, labels */
--font-mono:    'JetBrains Mono', monospace; /* amounts, account numbers */

/* Type Scale */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-md:   17px;
--text-lg:   21px;
--text-xl:   28px;
--text-2xl:  36px;
--text-3xl:  48px;
```

Load fonts from Google Fonts CDN. Fallbacks: `system-ui, -apple-system, sans-serif`.

### 4.4 Spacing & Layout

```
Base unit: 4px
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

Layout:
  Sidebar width:       240px (collapsible to 64px icon rail on small screens)
  Content max-width:   1200px
  Card border-radius:  12px
  Input border-radius: 8px
  Button border-radius: 8px
  Shadow-sm:  0 1px 3px rgba(0,0,0,0.06)
  Shadow-md:  0 4px 16px rgba(0,0,0,0.08)
  Shadow-lg:  0 8px 32px rgba(0,0,0,0.12)
```

### 4.5 Component Library (Build from scratch or use Radix UI primitives)

| Component | Notes |
|---|---|
| AmountInput | Right-align, monospace font, auto-format with Indian numbering (1,00,000 style), ₹ prefix, no negative |
| MonthPicker | Horizontal scrollable month strip; current month highlighted |
| CategoryBadge | Pill with category icon + name + color |
| TransactionRow | Amount right-aligned, category left, date secondary |
| ProgressBar | Used for budget vs. actual; animated fill |
| TaxGauge | Half-donut chart showing tax estimate |
| InsightCard | KPI with trend indicator (▲▼ vs. last month) |
| PortfolioDonut | Investment allocation pie chart |
| EmptyState | Friendly illustration + CTA; no condescending copy |

### 4.6 Iconography

Use **Phosphor Icons** (MIT license). Avoid Heroicons/Feather — too generic.

### 4.7 Microinteractions

- Number inputs: count-up animation when value is first set
- New entry added: row slides in from the right
- Delete: row slides left with fade, with a 3-second Undo snackbar
- Dashboard values: animate on load (number tick-up effect, max 600ms)
- Month change: cards fade-swap (crossfade, 200ms)

---

## 5. Indian Financial Context & Rules Engine

This section documents every formula and rule the app must implement. Developers must implement these exactly as specified.

### 5.1 Financial Year

Indian financial year runs **April 1 to March 31**.

```
FY 2025-26 = April 1, 2025 → March 31, 2026
AY 2026-27 = Assessment Year for FY 2025-26 income
```

- Default financial year start: April (configurable to January in settings for those who prefer calendar year tracking)
- Monthly rollover happens on the 1st of each month
- "Current Financial Year" = the FY that contains today's date

### 5.2 Income Categories

```
SALARY_INCOME           → "Salary / CTC Component"
BONUS_INCOME            → "Bonus / Variable Pay"
FREELANCE_INCOME        → "Freelance / Consulting"
RENTAL_INCOME           → "Rental Income"
INTEREST_INCOME         → "Interest Income (FD, Savings)"
DIVIDEND_INCOME         → "Dividend Income"
CAPITAL_GAINS_STCG      → "Short-Term Capital Gains"
CAPITAL_GAINS_LTCG      → "Long-Term Capital Gains"
CRYPTO_INCOME           → "Crypto / VDA Gains"
BUSINESS_INCOME         → "Business / Profession Income"
AGRICULTURE_INCOME      → "Agricultural Income (exempt)"
GIFT_INCOME             → "Gifts Received"
OTHER_INCOME            → "Other Income"
```

### 5.3 Income Tax Slabs — FY 2025-26 (AY 2026-27)

#### New Tax Regime (Default from FY 2023-24 onwards)

| Income Slab (₹) | Tax Rate |
|---|---|
| 0 – 4,00,000 | Nil |
| 4,00,001 – 8,00,000 | 5% |
| 8,00,001 – 12,00,000 | 10% |
| 12,00,001 – 16,00,000 | 15% |
| 16,00,001 – 20,00,000 | 20% |
| 20,00,001 – 24,00,000 | 25% |
| Above 24,00,000 | 30% |

**Standard Deduction (New Regime):** ₹75,000 for salaried / pensioners  
**Section 87A Rebate (New Regime):** Full rebate if net taxable income ≤ ₹12,00,000 (rebate up to ₹60,000). Marginal relief applies.  
**Note:** Section 87A rebate does NOT apply to special-rate incomes (LTCG 112A, STCG 111A, VDA gains).

#### Old Tax Regime

| Category | Slab | Rate |
|---|---|---|
| Below 60 yrs | 0 – 2,50,000 | Nil |
| | 2,50,001 – 5,00,000 | 5% |
| | 5,00,001 – 10,00,000 | 20% |
| | Above 10,00,000 | 30% |
| Senior (60-79) | 0 – 3,00,000 | Nil |
| | 3,00,001 – 5,00,000 | 5% |
| | 5,00,001 – 10,00,000 | 20% |
| | Above 10,00,000 | 30% |
| Super Senior (80+) | 0 – 5,00,000 | Nil |
| | 5,00,001 – 10,00,000 | 20% |
| | Above 10,00,000 | 30% |

**Standard Deduction (Old Regime):** ₹50,000 for salaried  
**Section 87A Rebate (Old Regime):** Full rebate if net taxable income ≤ ₹5,00,000 (rebate up to ₹12,500)

#### Surcharge (both regimes)

| Income Range | Surcharge |
|---|---|
| ₹50L – ₹1Cr | 10% |
| ₹1Cr – ₹2Cr | 15% |
| ₹2Cr – ₹5Cr | 25% |
| Above ₹5Cr | 25% (capped at 25% under new regime) |

**Marginal relief on surcharge:** Tax + surcharge cannot exceed the incremental income that pushes the total past the threshold.

#### Health & Education Cess
**4%** on (Tax + Surcharge). Applied always.

### 5.4 Old Regime Deductions (Only applicable if user opts for Old Regime)

The app tracks these as inputs and uses them to compute taxable income under old regime.

| Section | Deduction | Limit | Notes |
|---|---|---|---|
| 80C | PPF, ELSS, EPF, NSC, Tax-saving FD (5yr), LIC premium, Home loan principal, Tuition fees | ₹1,50,000 combined | Most common |
| 80CCC | Pension fund contribution | Within 80C limit | |
| 80CCD(1) | NPS employee contribution | Within 80C limit (10% of salary) | |
| 80CCD(1B) | Additional NPS contribution | ₹50,000 (EXTRA, over 80C) | Stack with 80C |
| 80CCD(2) | Employer NPS contribution | Up to 10% of salary (no monetary cap) | Not taxable as perq |
| 80D | Health insurance – self/spouse/kids | ₹25,000 (₹50,000 if self/spouse is senior citizen) | |
| 80D | Health insurance – parents | ₹25,000 (₹50,000 if parents are senior citizen) | Cumulative max ₹1L |
| 80D | Preventive health check-up | ₹5,000 within 80D limit | |
| 24(b) | Home loan interest (self-occupied) | ₹2,00,000 | Let-out: no limit (but loss cap at ₹2L) |
| 80E | Education loan interest | No cap | 8 years from start of repayment |
| 80EEA | First home loan interest (affordable housing) | ₹1,50,000 extra | Conditions apply |
| 80G | Donations to eligible institutions | 50% or 100% of donated amount; within 10% of gross income | |
| 80GG | Rent paid (no HRA) | Least of: (a) ₹5,000/month (b) 25% of total income (c) Actual rent – 10% of income | |
| 80TTA | Savings account interest (below 60yr) | ₹10,000 | |
| 80TTB | Interest on savings + FD (senior citizen) | ₹50,000 | Replaces 80TTA for 60+ |
| 80U | Self with disability | ₹75,000 (₹1,25,000 severe) | |
| 80DD | Dependent with disability | ₹75,000 (₹1,25,000 severe) | |
| HRA | Least of: (a) Actual HRA received (b) 50% basic salary (metro) / 40% (non-metro) (c) Actual rent – 10% basic | Varies | Metro = Delhi, Mumbai, Chennai, Kolkata |
| LTA | Actual travel cost, 2 trips in 4 years | Economy rail/flight | Domestic only |

### 5.5 HRA Calculation Formula

```
HRA_Exemption = MIN(
  actual_HRA_received,
  50_or_40_percent_of_basic_salary,   // 50% metro, 40% non-metro
  actual_rent_paid - (10% * basic_salary)
)
```

If any of the three values is negative or zero, HRA exemption = 0.

**Metro cities for HRA:** Delhi (and NCR), Mumbai, Chennai, Kolkata.

### 5.6 Capital Gains Tax Rules

#### 5.6.1 Equity Shares & Equity Mutual Funds (≥ 65% equity)

| Holding Period | Classification | Tax Rate | Section | Exemption |
|---|---|---|---|---|
| ≤ 12 months | STCG | 20% | 111A | None |
| > 12 months | LTCG | 12.5% | 112A | First ₹1,25,000/year exempt |

STT (Securities Transaction Tax) must have been paid on both purchase and sale for Section 111A/112A to apply. Without STT: taxed at applicable slab rate.

#### 5.6.2 Debt Mutual Funds

| Purchase Date | Holding | Tax Treatment |
|---|---|---|
| Before April 1, 2023 | > 36 months | LTCG at 12.5% (no indexation post July 23, 2024) |
| Before April 1, 2023 | ≤ 36 months | Slab rate |
| On/after April 1, 2023 | Any | Always taxed at slab rate (no LTCG benefit) |

#### 5.6.3 Real Estate

| Holding Period | Classification | Tax (post July 23, 2024 transfer) |
|---|---|---|
| ≤ 24 months | STCG | Slab rate |
| > 24 months | LTCG | 12.5% (no indexation) |

**Grandfather clause:** Property acquired before July 23, 2024 — taxpayer can choose between:
- 12.5% without indexation, OR
- 20% with indexation (using CII — Cost Inflation Index)

The app should compute both and show which is lower.

#### 5.6.4 Gold & Gold ETFs / Gold MF

| Holding | Tax |
|---|---|
| ≤ 24 months | STCG at slab rate |
| > 24 months | LTCG at 12.5% (no indexation, post July 23, 2024 transfers) |

#### 5.6.5 Bonds & NCDs (Non-Convertible Debentures)

| Holding | Tax |
|---|---|
| ≤ 12 months (listed bonds) | STCG at slab rate |
| > 12 months (listed bonds) | LTCG at 12.5% |
| Unlisted bonds ≤ 24 months | Slab rate |
| Unlisted bonds > 24 months | 12.5% |

**Exception:** Tax-free bonds (NHAI, REC, PFC, IRFC) — interest is exempt from tax.

#### 5.6.6 US Stocks (via LRS / GIFT City / F&O platforms)

Indian residents investing in US equities through LRS (Liberalised Remittance Scheme):

| Holding | Classification | Tax |
|---|---|---|
| ≤ 24 months | STCG | Slab rate |
| > 24 months | LTCG | 12.5% (no indexation) |

**Important:** US stocks are treated as foreign unlisted assets. The 12-month rule (for equity LTCG) does NOT apply. The 24-month rule applies.

**LRS Limit:** USD 2,50,000 per financial year per individual.  
**TCS on LRS:** 20% TCS on remittances over ₹7 lakh for investment purposes (claimable as tax credit).  
**DTAA Note:** India–USA DTAA exists; in practice most Indian retail investors simply pay Indian tax. The app will note DTAA but not compute it (out of scope for v1).

#### 5.6.7 Crypto / Virtual Digital Assets (VDA)

| Rule | Detail |
|---|---|
| Tax Rate | 30% flat (Section 115BBH) |
| Cess | 4% on 30% = effective 31.2% |
| Surcharge | Applicable on tax |
| Deduction allowed | Only cost of acquisition |
| Deduction NOT allowed | Transfer fees, gas fees, exchange commissions |
| Loss set-off | NOT allowed against any other income or VDA gain |
| Loss carry-forward | NOT allowed |
| Holding period | Irrelevant — no LTCG/STCG distinction |
| TDS | 1% on transfer consideration (Section 194S) |
| TDS threshold | ₹50,000/year for specified persons; ₹10,000/year for others |
| Mining / Staking income | Taxed at slab rate as "Income from Other Sources" first; cost basis for future VDA disposal = amount taxed |

#### 5.6.8 Capital Gains Set-off Rules

```
STCL can offset: STCG (same or different assets) AND LTCG
LTCL can offset: LTCG only (NOT STCG)
VDA losses: cannot offset anything
Carry forward: allowed for 8 years (non-VDA capital losses), only if ITR filed on time
```

### 5.7 Other Tax Notes

**Advance Tax Schedule** (if total tax > ₹10,000/year):

| Due Date | Cumulative % |
|---|---|
| June 15 | 15% |
| September 15 | 45% |
| December 15 | 75% |
| March 15 | 100% |

**Presumptive Taxation (Section 44AD):** Self-employed with business turnover up to ₹3 crore can declare 8% (or 6% for digital receipts) as income without detailed books. App should flag this for users who mark employment type as "Self-Employed."

**Agricultural Income:** Exempt from income tax but used for rate determination (slab computation). The app tracks this but excludes it from taxable income in the slab calculator.

---

## 6. Information Architecture & Navigation

### 6.1 App Sections

```
/                   → Dashboard (Insights)
/income             → Income Tracker
/expenses           → Expense Tracker
/investments        → Investment Portfolio
/tax                → Tax Estimator
/settings           → Settings & Data Management
```

### 6.2 Persistent Sidebar (Desktop) / Bottom Nav (Mobile)

Desktop sidebar (240px) contains:
- App logo / name "Paisa" top-left
- Navigation links with icons
- Current Month + FY indicator (e.g., "May 2026 · FY 2025-26")
- Quick-add FAB (Floating Action Button) for fast expense entry
- Last saved timestamp at bottom

Mobile (< 768px): Collapse sidebar into bottom navigation bar with 5 icons.

### 6.3 Top Bar (every page)

- Page title
- Month/Period selector (left/right arrows + month name + year)
- Dark/Light mode toggle
- Export button (downloads JSON backup)

### 6.4 Month Context

The app is month-centric. The **active month** is displayed at the top and all views (Income, Expenses) show data for that month. The Dashboard shows the active month plus FY-to-date totals.

Changing the month using the top bar updates all views simultaneously (via global state).

---

## 7. Phase 1 — Core Income & Expense Tracking

### 7.1 Income Tracker (`/income`)

#### 7.1.1 Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Income  ·  May 2026             [← Apr]  [May]  [Jun →]   │
├─────────────────────────────────────────────────────────────┤
│  Monthly Total                  ₹ 1,42,500                  │
│  ────────────────────────────────────────────               │
│  [+ Add Income Entry]                                        │
│                                                              │
│  SOURCE              AMOUNT        DATE      NOTES          │
│  ────────────────────────────────────────────               │
│  Salary              ₹1,20,000    01 May    Infosys Ltd     │
│  Freelance           ₹18,000      15 May    Toptal project  │
│  Interest – SBI FD   ₹ 4,500      31 May    Q4 interest    │
│  ─────────────────────────────────────────────              │
│  [← Previous months summary bar]                            │
└─────────────────────────────────────────────────────────────┘
```

#### 7.1.2 Income Entry Form Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| Source / Type | Dropdown | Yes | From `INCOME_CATEGORIES`; shows icon |
| Amount (₹) | Number | Yes | > 0, ≤ 9,99,99,999; formatted Indian style |
| Date | Date picker | Yes | Cannot be in future month (warn; allow) |
| Description / Notes | Text | No | Max 200 chars |
| Employer / Payer | Text | No | Max 100 chars |
| TDS Deducted | Number | No | ≥ 0; auto-shows for salary/professional income |
| Is Recurring? | Toggle | No | If yes, show Recurring Frequency |
| Recurring Frequency | Dropdown | If recurring | Monthly / Quarterly / Annually |

#### 7.1.3 Recurring Income Logic

- When a recurring income entry is created, it auto-populates future months (up to the end of the financial year) with a copy of the entry
- Future auto-populated entries are marked with a `(recurring)` badge and a different row background
- User can edit or delete any individual month's recurring entry without affecting others
- User can "Edit All Future" to update the template going forward

#### 7.1.4 Income Data Model

```typescript
interface IncomeEntry {
  id: string;           // uuid v4
  month: string;        // "YYYY-MM"
  type: IncomeCategory;
  amount: number;       // in paise (integer) — avoid float arithmetic
  date: string;         // "YYYY-MM-DD"
  description?: string;
  payer?: string;
  tdsDeducted?: number; // in paise
  isRecurring: boolean;
  recurringId?: string; // links entries in a recurring series
  createdAt: string;    // ISO timestamp
  updatedAt: string;
}
```

**Why paise (integer)?** To avoid floating-point rounding errors in financial calculations. All display logic divides by 100; all arithmetic keeps values as integers.

#### 7.1.5 Income Summary Panel (right panel / bottom on mobile)

- Total income this month
- Breakdown by category (bar chart, horizontal)
- MOM (Month-over-Month) change vs. previous month
- YTD (Year-to-Date) total income

### 7.2 Expense Tracker (`/expenses`)

#### 7.2.1 Default Expense Categories

These are pre-loaded on first launch. Each has an icon, color, and parent group.

**FOOD & GROCERIES**
- 🛒 Kirana / Grocery Store
- 🥬 Vegetables & Fruits
- 🥛 Dairy & Eggs
- 🍱 Restaurants / Eating Out
- 🧃 Food Delivery (Zomato / Swiggy)
- ☕ Tea & Coffee

**HOUSEHOLD**
- 🏠 Rent / Housing EMI
- 💧 Electricity Bill
- 💧 Water Bill / Society Charges
- 🌐 Internet / Broadband / WiFi
- 📱 Mobile Recharge / Postpaid Bill
- 🧹 House Help / Maid / Cook
- 🪑 Furniture & Home Decor
- 🔧 Home Maintenance / Repairs

**TRANSPORT**
- ⛽ Petrol / Diesel
- 🚇 Metro / Bus / Auto / Cab
- 🚖 Ola / Uber / Rapido
- ✈️ Flights / Trains / Long Distance
- 🛵 Vehicle Maintenance

**HEALTH & WELLNESS**
- 💊 Medicines / Pharmacy
- 🏥 Doctor / Hospital / Lab Tests
- 🏋️ Gym / Fitness / Yoga
- 🧘 Wellness / Mental Health

**EDUCATION & KIDS**
- 📚 School / College Fees
- 📖 Books & Stationery
- 🎒 Tuition / Coaching
- 🎮 Kids Activities / Toys

**SHOPPING & LIFESTYLE**
- 👕 Clothing & Footwear
- 📱 Electronics & Gadgets
- 🛍️ Online Shopping (Amazon / Flipkart)
- 💄 Personal Care & Beauty

**ENTERTAINMENT & SUBSCRIPTIONS**
- 🎬 OTT Subscriptions (Netflix, Prime, Hotstar)
- 🎵 Music (Spotify, Gaana, etc.)
- 🎮 Gaming
- 📰 News / Magazine Subscriptions

**FINANCIAL OBLIGATIONS**
- 🏦 Home Loan EMI
- 🚗 Car / Vehicle Loan EMI
- 💳 Credit Card Bill
- 📋 Personal Loan EMI
- 💰 Insurance Premium (Life)
- 🏥 Insurance Premium (Health)

**SAVINGS & INVESTMENTS** *(tracked here but also mirrored to Investments module)*
- 📈 SIP – Mutual Fund
- 🏦 PPF / NPS Contribution
- 🏠 RD / FD
- 📊 Stocks / Direct Equity

**SOCIAL & GIVING**
- 🎁 Gifts & Celebrations
- 💒 Religious / Pooja / Temple
- 🫶 Donations / Charity
- 👨‍👩‍👦 Family Transfers (sent money to family)

**TAXES & COMPLIANCE**
- 💸 Advance Tax
- 📋 Professional Tax
- 📑 CA / Tax Filing Fees

**CUSTOM** *(user-created — see 7.2.3)*

#### 7.2.2 Expense Entry Form Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| Category | Dropdown + search | Yes | From category tree; supports type-ahead |
| Amount (₹) | Number | Yes | > 0, ≤ 9,99,99,999 |
| Date | Date picker | Yes | Within ±3 months of current month (warn for older) |
| Description / Merchant | Text | No | Max 200 chars |
| Payment Method | Dropdown | No | Cash / UPI / Debit Card / Credit Card / Net Banking / EMI |
| Is Recurring? | Toggle | No | — |
| Recurring Frequency | Dropdown | If recurring | Monthly / Quarterly / Annual |
| Notes | Textarea | No | Max 500 chars |

#### 7.2.3 Custom Category Management

**Location:** Settings → Categories → "+ New Category"

**Custom Category Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| Category Name | Text | Yes | 2–50 chars; no duplicates (case-insensitive) |
| Parent Group | Dropdown | Yes | Choose from existing groups or "Create New Group" |
| Icon | Emoji picker | Yes | Select from emoji picker (Unicode, no SVG required) |
| Color | Color picker | Yes | Hex color; shows preview |
| Type | Radio | Yes | Expense / Income / Both |

**Rules:**
- Default categories cannot be deleted (only hidden via a toggle)
- Custom categories can be renamed, recolored, or deleted
- Deleting a custom category: all existing entries with that category are moved to "Uncategorised" (not deleted); show a confirmation with count of affected entries
- Max 50 custom categories (system limit to prevent storage bloat)

#### 7.2.4 Expense Entry Data Model

```typescript
interface ExpenseEntry {
  id: string;
  month: string;           // "YYYY-MM"
  categoryId: string;
  amount: number;          // paise
  date: string;            // "YYYY-MM-DD"
  description?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  isRecurring: boolean;
  recurringId?: string;
  isTransfer: boolean;     // true for inter-account transfers (neutral)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type PaymentMethod = 'CASH' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'EMI' | 'OTHER';
```

#### 7.2.5 Expense Screen Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Expenses · May 2026          Total Spent: ₹52,340  [+ Add]     │
├──────────────────────────────────────────────────────────────────┤
│  [All] [Food] [Household] [Transport] [Health] [Shopping] [More] │
├──────────────────────────────────────────────────────────────────┤
│  DATE      DESCRIPTION           CATEGORY         AMOUNT         │
│  01 May    Reliance Fresh        🛒 Kirana         ₹ 3,450       │
│  02 May    Electricity Bill      💡 Electricity    ₹ 2,800       │
│  05 May    Swiggy – Dinner       🍱 Food Delivery  ₹   680  [🗑]  │
│  ...                                                              │
├──────────────────────────────────────────────────────────────────┤
│  CATEGORY BREAKDOWN (horizontal bar chart)                        │
│  🏠 Household  ████████████ ₹18,200 (35%)                        │
│  🛒 Food       ████████     ₹12,800 (24%)                        │
│  ...                                                              │
└──────────────────────────────────────────────────────────────────┘
```

#### 7.2.6 Budget vs. Actual Tracking

- User can set a monthly budget per category (in Settings → Budgets)
- On the expense screen, categories with a budget show a thin progress bar under the category name
- Color coding: ≤ 70% green, 70–90% amber, > 90% orange, > 100% red
- A "Budget Overview" panel (collapsible) at the top shows all categories in a compact grid with their progress

**Budget Data Model:**
```typescript
interface Budget {
  categoryId: string;
  monthlyLimit: number;    // paise
  annualLimit?: number;    // paise (optional override)
}
```

#### 7.2.7 Quick Add (Global FAB)

A floating "+" button available on all screens. Clicking opens a bottom sheet (mobile) or a compact modal (desktop) with:
- Amount field (auto-focused, numeric keyboard)
- Category selector (shows last 5 used categories first)
- Date (defaults to today)
- Optional description

Keyboard shortcut: `N` opens the Quick Add modal.

---

## 8. Phase 2 — Investment Tracking

### 8.1 Investment Portfolio Screen (`/investments`)

#### 8.1.1 Overview Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  TOTAL PORTFOLIO VALUE                                           │
│  ₹ 24,85,320   ↑ ₹1,24,560 (5.3%) since start                  │
├──────────────┬───────────────────────────────────────────────────┤
│  INVESTED    │  CURRENT VALUE  │  GAIN/LOSS  │  XIRR (est.)     │
│  ₹23,60,760  │  ₹24,85,320    │  +₹1,24,560 │  12.4% p.a.     │
├──────────────┴───────────────────────────────────────────────────┤
│  [Allocation Donut] [Asset Class Breakdown Bar]                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.1.2 Asset Classes Tracked

| Asset Class | Sub-types | Notes |
|---|---|---|
| **Indian Equity – Stocks** | NSE/BSE listed shares | ISIN or symbol-based |
| **Indian Equity – Mutual Funds** | Equity MF, ELSS | Equity-oriented (≥65%) |
| **Debt Mutual Funds** | Debt MF, FoF | Tax rules differ by purchase date |
| **Hybrid / Index Funds** | Index, balanced | Equity or debt classification based on allocation |
| **PPF (Public Provident Fund)** | Fixed | 15-year lock-in; exempt at all three stages (EEE) |
| **NPS (National Pension System)** | Tier 1, Tier 2 | Tier 1: lock-in till 60; partial 80% withdrawal at 60 |
| **EPF (Employee Provident Fund)** | Employer + employee | Auto-computed if salary and percentage entered |
| **Fixed Deposits (FD)** | Bank FD, Corporate FD | Interest taxable as "Other Income" at slab rate |
| **Recurring Deposits (RD)** | Bank RD | Interest taxable as "Other Income" |
| **Bonds** | Govt Bonds, SGBs, NCDs, 54EC Bonds | Sovereign Gold Bonds have special rules |
| **US Stocks** | NYSE / NASDAQ listed | Amounts in USD; app converts at user-entered rate |
| **US ETFs** | S&P 500 ETF, QQQ, etc. | Same tax rules as US stocks |
| **International MF** | Feeder funds, FOF investing abroad | Debt MF tax rules apply (FY 2023-24 onwards) |
| **Gold – Physical** | Gold jewellery, coins, bars | 24-month holding for LTCG |
| **Gold ETF / Gold MF** | Paper gold | Listed gold: 12-month? → Actually treated as non-equity: 24-month LTCG |
| **Sovereign Gold Bonds (SGB)** | RBI issued | Special: 8-year maturity redemption is EXEMPT; premature: 12.5% LTCG |
| **Crypto / VDA** | Bitcoin, Ethereum, Altcoins | 30% flat; no set-off |
| **Real Estate** | Residential, commercial | Price tracking only; no EMI amortisation (v1) |
| **Other** | Startup equity, unlisted shares, P2P | Custom; manual valuation only |

#### 8.1.3 Investment Entry Form

**Step 1: Select Asset Class** (visual card grid, one click to select)

**Step 2: Asset Details** (fields vary by asset class)

##### Common Fields (all asset classes)

| Field | Type | Required | Notes |
|---|---|---|---|
| Asset Name / Fund Name | Text / Searchable | Yes | For stocks: enter symbol; for MF: fund name |
| Investment Date | Date | Yes | Date of purchase |
| Units / Quantity | Number | Yes | For stocks: shares; for MF: units; for PPF/FD: use Amount field |
| Buy Price per Unit | Number | Conditional | Skip for PPF/NPS/FD — use amount instead |
| Total Invested Amount | Number | Yes (auto = units × price) | In ₹; or USD for US stocks |
| ISIN | Text | Optional | For stocks/MF; useful for identification |
| Broker / Platform | Dropdown | No | Zerodha, Groww, Kuvera, Coin, Angel, etc. + Custom |
| Notes | Text | No | — |

##### Additional Fields by Asset Type

**Mutual Fund (all types):**
- Fund Type: Equity / Debt / Hybrid / Index / ELSS / Liquid
- SIP: Toggle "Is this a SIP?" → If yes, prompt for SIP amount, start date, frequency, number of instalments. Each instalment is saved as a separate transaction (different purchase dates = different holding periods = different capital gains)
- SIP Auto-Populate: When SIP is set up, future SIP entries are created for remaining months with a reminder badge

**PPF:**
- Account opened date
- Annual contribution amount
- Current balance (manually entered; app tracks contributions forward)
- Maturity date (auto-calculated: 15 years from open date; extendable in 5-year blocks)
- PPF interest rate tracking (currently 7.1% p.a., set historically)

**NPS:**
- Tier 1 or Tier 2
- Asset allocation: E (equity), C (corporate bonds), G (govt bonds) percentages
- Current NAV (manual)
- Contribution: monthly employee + employer

**EPF:**
- Employee contribution %: 12% of basic (default)
- Employer contribution %: 12% of basic (employer's share: 3.67% EPF + 8.33% EPS in practice; simplify to 12% total for tracking)
- Basic salary (auto-populated from income entries if available)
- EPF interest rate: 8.25% for FY 2024-25 (manually updatable)

**Fixed Deposit:**
- Bank / NBFC name
- Principal amount
- Interest rate (% p.a.)
- FD type: Cumulative / Non-cumulative
- Tenure: months
- Start date (auto-calculate maturity date)
- Maturity amount (auto-calculated for cumulative: `P × (1 + r/n)^(nt)`)
- Interest income: auto-calculated per financial year (prorated) and added to "Other Income" in the tax estimator

**Bonds:**
- Bond type: Government / Corporate / Tax-free / SGB / 54EC
- Face value, purchase price (may differ — bonds can trade at premium/discount)
- Coupon rate (% p.a.) and frequency (annual / semi-annual / monthly)
- Maturity date
- Is tax-free bond?: Toggle (interest exempt from tax)
- 54EC bond: Investment purpose (to claim LTCG exemption from property sale); link to a real estate LTCG transaction if desired

**US Stocks:**
- Stock symbol (e.g., AAPL, MSFT)
- Exchange: NYSE / NASDAQ
- Quantity (shares)
- Purchase price per share (USD)
- USD/INR exchange rate at purchase (manual)
- Current price (USD) — manual update
- Current USD/INR rate (manual update for current value)
- Cost basis in INR = `quantity × purchase_price_usd × purchase_usd_inr_rate`
- Current value in INR = `quantity × current_price_usd × current_usd_inr_rate`

**Crypto / VDA:**
- Asset: Bitcoin / Ethereum / Other (text input)
- Exchange: WazirX / CoinDCX / Binance / Other
- Quantity (can be decimal, up to 8 decimal places)
- Purchase price per unit (₹ or USD)
- Currency of purchase: INR / USD
- If USD: exchange rate at purchase
- TDS deducted (1%): toggle + amount field
- Note: VDA losses cannot offset gains — the app flags this clearly

**Sovereign Gold Bond (SGB):**
- Issue series (e.g., "2021-22 Series X")
- Units (grams of gold represented)
- Issue price (₹/gram)
- Current gold price (₹/gram) — manual
- Maturity date (8 years from issue)
- Premature redemption flag: If redeeming before 8 years → LTCG at 12.5% applies. If at maturity → EXEMPT.

**Real Estate:**
- Property type: Residential / Commercial / Plot
- Purchase date
- Purchase price (₹)
- Registration / Stamp duty cost (₹) — added to cost basis
- Loan outstanding (optional; for LTV tracking)
- Current estimated value (manually updated)
- Improvement costs (₹) — added to cost basis

#### 8.1.4 Investment Transaction History

Every buy, sell, or redemption is a transaction. The portfolio holdings are computed from all transactions.

```typescript
interface InvestmentTransaction {
  id: string;
  assetId: string;           // parent asset record
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'BONUS' | 'SPLIT' | 'MERGER';
  date: string;
  units: number;             // positive for BUY; negative for SELL
  pricePerUnit: number;      // paise (or USD cents for US stocks, converted)
  totalAmount: number;       // paise
  tdsDeducted?: number;
  brokerage?: number;
  notes?: string;
  createdAt: string;
}
```

**Sell Transaction — Capital Gains Computation:**

When user enters a SELL transaction:
1. Show which BUY transactions this sell is attributed to (FIFO by default; LIFO as option in settings)
2. For each lot being sold, compute:
   - Hold period = sell date – buy date
   - Classification (STCG / LTCG) based on asset type rules
   - Gain = (sell price – cost per unit) × units sold
3. Show a gains summary card:
   - Equity LTCG (12.5%): ₹X (of which ₹1,25,000 exempt)
   - Equity STCG (20%): ₹Y
   - Other LTCG (12.5%): ₹Z
   - VDA Gains (30%): ₹W
   - Debt / Slab rate gains: ₹V
4. Estimated tax on this sell: shown immediately, in a "Tax Impact" card

**Cost Basis Method:** FIFO (First In, First Out) by default. User can switch to LIFO in settings. Crypto allows Specific Identification (user chooses which lot to sell).

#### 8.1.5 Portfolio Holdings View

```
┌────────────────────────────────────────────────────────────────────┐
│  ASSET          CLASS      INVESTED    CURRENT     GAIN    RETURN  │
│  ─────────────────────────────────────────────────────────────     │
│  HDFC Bank      IN Equity  ₹1,20,000  ₹1,48,200  +₹28,200  23.5% │
│  Nifty 50 ETF   Index MF   ₹80,000    ₹96,400    +₹16,400  20.5% │
│  HDFC MF ELSS   ELSS MF    ₹45,000    ₹52,800    +₹7,800   17.3% │
│  Apple (AAPL)   US Stock   ₹32,000    ₹38,400    +₹6,400   20.0% │
│  Bitcoin        Crypto     ₹50,000    ₹72,000    +₹22,000  44.0% │
│  PPF            PPF        ₹1,50,000  ₹1,66,500  +₹16,500  11.0% │
│  SBI FD         FD         ₹2,00,000  ₹2,14,000  +₹14,000   7.0% │
└────────────────────────────────────────────────────────────────────┘
```

**Sorting:** Click any column header to sort (ascending / descending).  
**Filtering:** Filter by asset class, broker, or tax classification (LTCG-eligible, etc.).

#### 8.1.6 Asset Class Allocation Panel

A donut chart showing % allocation across:
- Indian Equity (Direct + MF)
- Debt (FD, RD, Bonds, Debt MF)
- Real Estate
- Gold (Physical + ETF + SGB)
- US / International Equity
- Crypto / VDA
- Cash-equivalent (Liquid Funds, Savings)
- Others

Below the donut: a recommended allocation slider (based on user's age) using the classic "100 minus age" heuristic (displayed as a guide, not enforced).

---

## 9. Phase 3 — Tax Estimation Engine

### 9.1 Tax Estimator Screen (`/tax`)

This screen projects the user's tax liability for the current financial year, updated in real time as income, expenses, and investment data is entered elsewhere.

#### 9.1.1 Screen Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  TAX ESTIMATOR · FY 2025-26  (AY 2026-27)                        │
│                                                                   │
│  REGIME: [New Regime ●] [Old Regime ○]      Switch Regime        │
├──────────────────────────────────────────────────────────────────┤
│  INCOME SUMMARY                              DEDUCTIONS (Old)    │
│  Salary Income         ₹14,40,000           80C       ₹1,50,000  │
│  Freelance Income         ₹72,000           80CCD(1B)    ₹50,000  │
│  Interest Income          ₹18,000           80D         ₹30,000  │
│  Capital Gains (Equity LTCG)  ₹45,000       HRA         ₹96,000  │
│  Crypto Gains             ₹22,000           Home Loan   ₹80,000  │
│  ────────────────────                       ────────────          │
│  Gross Total          ₹15,97,000            Total     ₹4,06,000  │
├──────────────────────────────────────────────────────────────────┤
│  TAXABLE INCOME BREAKDOWN                                         │
│  Regular Income (at slab): ₹11,61,000                            │
│  LTCG @ 12.5% (above ₹1.25L): ₹45,000                           │
│  VDA / Crypto @ 30%:  ₹22,000                                    │
├──────────────────────────────────────────────────────────────────┤
│  TAX CALCULATION                                                  │
│  Tax on regular income:   ₹98,250                                 │
│  Tax on LTCG:             ₹ 5,625                                 │
│  Tax on VDA:              ₹ 6,600                                 │
│  Subtotal tax:           ₹1,10,475                                │
│  Surcharge (if any):     ₹       0                                │
│  Health & Education Cess (4%): ₹4,419                            │
│  ─────────────────────────                                        │
│  ESTIMATED TAX:          ₹1,14,894                                │
│  Less: TDS Deducted:    -₹1,08,000                                │
│  ─────────────────────────                                        │
│  TAX PAYABLE / (REFUND): ₹6,894 (payable)                        │
├──────────────────────────────────────────────────────────────────┤
│  ADVANCE TAX SCHEDULE (if > ₹10,000)                             │
│  Jun 15 (15%):  ₹17,234  [paid ₹15,000] — ₹2,234 pending       │
│  Sep 15 (30% more): ₹34,468                                      │
│  Dec 15 (30% more): ₹34,468                                      │
│  Mar 15 (25% more): ₹28,724                                      │
└──────────────────────────────────────────────────────────────────┘
```

#### 9.1.2 Regime Comparison Mode

A "Compare Regimes" button opens a side-by-side split view:
- Left: New Regime calculation
- Right: Old Regime calculation (with deduction inputs)
- A highlighted banner shows "New Regime saves you ₹X" or "Old Regime saves you ₹X" depending on which is lower

#### 9.1.3 Deduction Inputs (Old Regime)

Only shown when Old Regime is selected. Each deduction has:
- Label, section reference, description tooltip on hover
- Amount input
- Max limit indicator
- "Currently utilised: ₹X of ₹Y limit" progress bar

Auto-populated deductions (from other data in the app):
- 80C: Sum of `ELSS MF contributions + PPF contributions + NSC entries + 5-yr FD entries` (from investment tracker) — capped at ₹1.5L
- 80CCD(1B): NPS Tier 1 contributions over and above 80C limit
- EPF employee contribution: Fetched from EPF investment entries
- Home loan principal: From real estate investment entries (if principal is recorded)
- Home loan interest (Section 24b): Must be entered manually (not in investments — interest is an expense)
- Health insurance premiums (80D): Pre-populated if user has "Insurance Premium (Health)" expense entries; user confirms

#### 9.1.4 Tax Calculation Algorithm

```pseudocode
function computeTax(profile, income, deductions, capitalGains, vdaGains):

  // Step 1: Compute gross total income
  grossIncome = sum(all income entries for FY) - agricultureIncome

  // Step 2: Apply standard deduction
  if (regime == NEW):
    stdDeduction = min(75000, grossSalaryIncome)
  else:
    stdDeduction = min(50000, grossSalaryIncome)

  // Step 3: Compute special rate incomes (separate from slab income)
  equityLTCG = sum(LTCG on equity and equity MF > 12 months)
  equitySTCG = sum(STCG on equity and equity MF ≤ 12 months)
  vdaGain = sum(all crypto/VDA gains)
  otherLTCG = sum(LTCG on real estate, gold, debt MF pre-2023, bonds > 24m)

  // Step 4: Segregate regular income
  regularIncome = grossIncome - stdDeduction - equityLTCG - equitySTCG - vdaGain - otherLTCG

  // Step 5: Apply deductions (old regime only)
  if (regime == OLD):
    totalDeductions = computeDeductions(deductions)
    regularTaxableIncome = regularIncome - totalDeductions
  else:
    regularTaxableIncome = regularIncome
  regularTaxableIncome = max(0, regularTaxableIncome)

  // Step 6: Check 87A rebate applicability
  // Note: 87A applies only to regular income component; special rate incomes do NOT benefit
  rebateApplicable = false
  if (regime == NEW and regularTaxableIncome <= 1200000):
    rebateApplicable = true
  if (regime == OLD and regularTaxableIncome <= 500000):
    rebateApplicable = true

  // Step 7: Compute slab tax on regular income
  slabTax = computeSlabTax(regularTaxableIncome, regime, age)

  // Step 8: Apply 87A rebate
  if (rebateApplicable):
    rebateMax = (regime == NEW) ? 60000 : 12500
    rebate = min(slabTax, rebateMax)
    slabTax = max(0, slabTax - rebate)
  // IMPORTANT: rebate does NOT reduce special-rate taxes

  // Step 9: Compute special rate taxes
  ltcgExemption = 125000  // equity LTCG annual exemption
  taxableEquityLTCG = max(0, equityLTCG - ltcgExemption)
  taxOnEquityLTCG = taxableEquityLTCG * 0.125
  taxOnEquitySTCG = equitySTCG * 0.20
  taxOnVDA = vdaGain * 0.30
  taxOnOtherLTCG = otherLTCG * 0.125

  // Step 10: Total tax before cess
  totalTaxBeforeCess = slabTax + taxOnEquityLTCG + taxOnEquitySTCG + taxOnVDA + taxOnOtherLTCG

  // Step 11: Surcharge
  totalIncome = regularTaxableIncome + equityLTCG + equitySTCG + vdaGain + otherLTCG
  surcharge = computeSurcharge(totalIncome, totalTaxBeforeCess, regime)
  // Apply marginal relief as applicable

  // Step 12: Health & Education Cess
  cess = (totalTaxBeforeCess + surcharge) * 0.04

  // Step 13: Net tax
  grossTax = totalTaxBeforeCess + surcharge + cess

  // Step 14: TDS credit
  totalTDS = sum(tdsDeducted from all income entries for FY)
  advanceTaxPaid = sum(advance tax payments entered by user)
  netTaxPayable = grossTax - totalTDS - advanceTaxPaid

  return {
    grossIncome, regularTaxableIncome, slabTax,
    taxOnEquityLTCG, taxOnEquitySTCG, taxOnVDA, taxOnOtherLTCG,
    surcharge, cess, grossTax,
    totalTDS, advanceTaxPaid, netTaxPayable,
    effectiveTaxRate: grossTax / grossIncome
  }
```

#### 9.1.5 Marginal Relief Computation

Marginal relief ensures that when income crosses a surcharge threshold (e.g., ₹50L), the additional tax + surcharge does not exceed the incremental income.

```pseudocode
function computeMarginalRelief(income, tax, surchargeRate):
  thresholdIncome = prevThreshold  // e.g., 5000000 for 50L threshold
  taxAtThreshold = slabTaxOn(thresholdIncome)  + cess at threshold
  normalSurchargedTax = tax * (1 + surchargeRate)
  maxTax = taxAtThreshold + (income - thresholdIncome)
  
  if (normalSurchargedTax > maxTax):
    return normalSurchargedTax - maxTax  // relief amount
  return 0
```

#### 9.1.6 Section 87A Marginal Relief

If income is between ₹12,00,001 and ~₹12,75,000 in new regime, regular tax after rebate might still exceed the income above ₹12L. The system must check this and apply marginal relief so the tax on income above ₹12L doesn't exceed income above ₹12L.

#### 9.1.7 Tax-Saving Recommendations Panel

Below the main tax calculation, a "Tax Saving Opportunities" panel lists:

| Recommendation | Potential Saving | Action |
|---|---|---|
| Maximize 80C (currently ₹90,000 of ₹1,50,000 used) | Up to ₹18,000 saved | View Options |
| NPS 80CCD(1B) — ₹50,000 available | Up to ₹15,000 saved | Learn More |
| Health insurance premium — 80D unused | Up to ₹7,500 saved | Learn More |
| Tax-loss harvesting — sell underperforming equity before March | Reduces LTCG | Calculate |

*Note: These are educational/informational only. The app does not give personalised financial advice.*

---

## 10. Phase 4 — Insights Dashboard

### 10.1 Dashboard Screen (`/`)

The main insights hub. Shows the current month and FY-to-date overview.

#### 10.1.1 Top KPI Strip (5 cards)

| Card | Value | Sub-text |
|---|---|---|
| Monthly Income | ₹X | ▲/▼ vs. last month |
| Monthly Expenses | ₹X | ▲/▼ vs. last month |
| Monthly Savings | ₹X (Y%) | "Savings Rate" |
| Portfolio Value | ₹X | ▲/▼ unrealised gain |
| Estimated Tax (FY) | ₹X | Based on current trajectory |

#### 10.1.2 Savings Rate Indicator

```
Savings Rate = (Monthly Income - Monthly Expenses) / Monthly Income × 100

Target zones:
  < 10%    : Red    — "Below recommended. Aim for 20%+"
  10–20%   : Amber  — "Developing. You're building a habit."
  20–40%   : Green  — "Healthy. Keep going."
  > 40%    : Blue   — "Excellent saver."
```

The indicator is a horizontal gauge with a moving needle. The monthly savings rate is shown as a large number with the zone label.

#### 10.1.3 Income vs. Expense Chart

A combo chart (bar + line):
- Bars: Monthly expense total (by category, stacked)
- Line: Monthly income total
- Area between line and top of bar: Savings (shaded green)
- X-axis: Last 6 months (scrollable to 12 months)
- Hovering a bar month shows: Income ₹X | Expenses ₹Y | Saved ₹Z

#### 10.1.4 Expense Breakdown – Current Month

A sunburst or treemap showing expenses by category group > category. Clicking a group drills down to show individual categories within that group.

Alternative compact view: a horizontal bar chart with each bar showing category name, amount, percentage of total.

#### 10.1.5 Expense Trends – Top 5 Categories

Line chart, 6-month trend for the top 5 expense categories by YTD spend. Each category has its own line in the category's assigned color.

#### 10.1.6 Spending Anomaly Detection

Client-side rule-based alerts (no ML needed):

| Rule | Alert Text |
|---|---|
| Expense category > 150% of 3-month average | "Your [Dining Out] spend this month is 60% above your usual" |
| Single transaction > 20% of monthly income | "Large transaction: ₹X on [Category]" |
| Total expenses > 90% of monthly income | "You've spent 92% of this month's income" |
| No income entered for current month by the 7th | "Don't forget to log this month's income" |
| Capital gains accumulated approaching ₹1.25L LTCG exemption | "LTCG approaching annual exemption limit (₹1.12L of ₹1.25L used)" |

Alerts appear as a collapsible notification panel at the top of the dashboard.

#### 10.1.7 Investment Portfolio Summary (Dashboard mini-view)

A compact view of the investment portfolio:
- Total invested vs. current value
- Gain/loss with % return
- Allocation donut chart (5 asset class colours)
- "View Full Portfolio" link

#### 10.1.8 Annual Financial Year Summary Panel

At the bottom of the dashboard, a "FY Summary" section:

```
FY 2025-26 SUMMARY (April 2025 – present)

Total Income       ₹ 9,80,000    (₹2,45,000/month avg)
Total Expenses     ₹ 5,24,000    (₹1,31,000/month avg)
Total Invested     ₹ 2,40,000    (₹60,000/month avg)
Net Savings        ₹ 2,16,000

Income Breakdown:
  Salary          88%  ████████████████████
  Freelance        7%  █░░
  Interest         5%  ██░

Expense Breakdown:
  Household       34%  ████████
  Food & Groceries 23% █████░
  Transport        11% ██░
  ...

Tax Estimate      ₹1,14,894
  New vs Old Regime → New saves ₹8,240
```

#### 10.1.9 Month Navigator

A horizontal strip of month buttons (Apr → Mar) for the current FY at the top of the dashboard. Clicking any month makes it the "active month" context.

Months with no data are grayed. Future months in the FY show projection estimates (dotted outline).

#### 10.1.10 Net Worth Tracker (Phase 4 enhancement)

```
NET WORTH = Total Assets – Total Liabilities

Assets:
  Investment Portfolio Value
  + Cash / Savings (manually entered monthly)
  + Real Estate Current Value
  + Other Assets

Liabilities:
  Home Loan Outstanding
  Car Loan Outstanding
  Personal Loan Outstanding
  Credit Card Outstanding (monthly)

Net Worth trend: Line chart by month (as data accumulates)
```

Net worth is an optional section; user can skip it. If partial data, show only what's available with a "Complete your profile for full Net Worth" prompt.

---

## 11. Phase 5 — Data Management & Export

### 11.1 Settings Screen (`/settings`)

#### 11.1.1 Profile Tab

| Field | Type | Notes |
|---|---|---|
| Name (optional) | Text | Display only; never sent anywhere |
| Date of Birth | Date | Used for senior citizen slab rates; if not entered, assume below 60 |
| Employment Type | Dropdown | Salaried / Self-Employed / Both |
| City | Dropdown | Metro / Non-Metro (for HRA calculation) |
| Preferred Tax Regime | Radio | New / Old (can be overridden per year in Tax screen) |
| Financial Year Start | Radio | April (Indian FY) / January (Calendar year) |
| Currency Display Format | Radio | Indian (₹1,00,000) / International (₹100,000) |

#### 11.1.2 Categories Tab

- List of all expense, income, and investment categories
- Default categories: visible by default; can be hidden (not deleted)
- Custom categories: can be created, edited, recolored, reordered, deleted
- "Restore Defaults" button: re-shows hidden default categories

#### 11.1.3 Budgets Tab

Table of all expense categories with:
- Monthly budget input (₹)
- Annual budget input (₹, optional override)
- "Copy from last month's actuals" button — one-click to set budgets = last month's spend

#### 11.1.4 Data Management Tab

**Export Options:**
- Full Backup (JSON) — all data, schema version, exported timestamp
- Income CSV — one row per income entry
- Expenses CSV — one row per expense entry, with category path
- Investments CSV — holdings and transactions
- Tax Summary PDF — one-page tax estimate (Phase 5 enhancement)

**Import:**
- Upload a previously exported JSON file
- App validates: schema version, field completeness
- Choose: Merge (add new entries, preserve existing) or Replace (overwrite all)
- Preview: "You are importing X income entries, Y expense entries, Z investment transactions. Existing data will be [merged/replaced]."
- "Download backup of current data before importing" — always shown as a pre-step

**Clear Data:**
- "Clear Current Month's Expenses" — scoped delete
- "Clear Financial Year [select]" — FY-scoped delete
- "Reset Everything" — nuclear option; requires typing "RESET" to confirm

#### 11.1.5 Appearance Tab

- Theme: Light / Dark / System (follows OS preference)
- Compact Mode: Reduces row heights and font sizes (for power users with lots of data)
- Show cents (paise): Toggle to show/hide paise in all amount displays

---

## 12. Edge Cases & Validations (Global)

### 12.1 Amount Input Edge Cases

| Scenario | Handling |
|---|---|
| User types "1,50,000" (with commas) | Strip commas, parse as 150000 |
| User types "1.5L" or "1.5 lakh" | Parse shorthand: 1.5L → 150000 |
| Amount = 0 | Block submission; "Amount must be greater than zero" |
| Amount > ₹9,99,99,999 | Warn: "Amount exceeds ₹10 crore — are you sure?" (allow after confirm) |
| Decimal input (e.g., ₹1234.56) | Allow; store as 123456 paise |
| Negative amount | Block; show "Use the 'credit' or 'refund' feature instead" |

### 12.2 Date Edge Cases

| Scenario | Handling |
|---|---|
| Expense date in future | Warn: "You're logging a future expense. Is this correct?" Allow. |
| Expense date > 3 months ago | Warn: "This date is over 3 months ago. Did you miss it earlier?" Allow. |
| SIP date before fund launch | Warn; allow. |
| Investment buy date after sell date | Block: "Purchase date must be before sale date." |
| FD start date + tenure = past maturity | Show maturity as past; note it's matured |

### 12.3 Category Edge Cases

| Scenario | Handling |
|---|---|
| Deleting a category with entries | Warn: "X entries use this category. They will be moved to Uncategorised." Confirm required. |
| Renaming a category | All entries update their categoryId reference automatically. |
| Duplicate category name (case-insensitive) | Block: "A category named [X] already exists." |
| Import with unknown categoryIds | Create an "Imported – Unknown" category; assign orphaned entries there |

### 12.4 Financial Year Boundary

| Scenario | Handling |
|---|---|
| User adds income on March 31 | Belongs to FY ending March 31 |
| User adds income on April 1 | Belongs to NEW financial year |
| App launched for first time in October | Pre-create empty month records from April to September; show them as "no data" in charts |
| User changes financial year start setting (April → January) | Warn: "This will change how your yearly summaries are computed. Historical data will be re-aggregated." |

### 12.5 Investment Edge Cases

| Scenario | Handling |
|---|---|
| Sell more units than held | Block: "You're selling X units but only hold Y. Check your buy transactions." |
| SIP entry for a month that already has a manual entry for same fund | Create both; sum them in the portfolio |
| US stock: USD/INR rate not entered | Default to 0; show a red badge "Exchange rate missing"; XIRR shows as "-" |
| PPF maturity: withdraw or extend? | At maturity date, show an action card: "Your PPF has matured. Withdraw or extend by 5 years?" |
| Crypto with zero cost basis (received as gift/airdrop) | Cost basis = 0; entire sale proceeds = VDA income; taxed at 30% |
| ELSS lock-in violation | ELSS has 3-year lock-in; if user tries to add a SELL before 3 years, warn: "ELSS has a 3-year mandatory lock-in. This unit is locked until [date]." |
| 54EC bond — time limit | Allow investment; show a warning badge if > 6 months have passed since the property LTCG event |

### 12.6 Tax Engine Edge Cases

| Scenario | Handling |
|---|---|
| No income entered | Tax = 0; show prompt "Add your income to estimate tax" |
| Mixed old and new regime across months | The tax screen always computes for the full FY under the currently selected regime |
| Section 87A rebate + VDA gains | Rebate does NOT apply to VDA gains; slab income rebate is computed separately |
| LTCG < ₹1,25,000 | Entire LTCG is exempt; no 12.5% tax |
| LTCG exact ₹1,25,000 | Exactly at exemption; ₹0 tax on LTCG |
| Marginal relief (₹50L surcharge) | Compute as per formula; show the relief amount in the breakdown |
| Home loan interest on a let-out property | If rent income > 0 for property, classify interest as let-out property interest (no ₹2L cap); allow full deduction — but total loss from house property can only set off ₹2L against other income (carry forward rest) |
| Debt MF bought Feb 2023 (pre-Apr-2023) | If held > 36 months, LTCG at 12.5% (no indexation). If held < 36 months, slab rate |
| SGB redemption at maturity (8 years) | Mark as EXEMPT; ₹0 capital gains tax; app shows green "Tax Exempt at Maturity" badge |
| Agricultural income entered | Exclude from taxable income; use for partial integration method if other taxable income > basic exemption (note in UI: "Agricultural income is used for rate determination") |
| Super senior citizen (80+) | Use the 0-5L: Nil slab; note that super senior citizens cannot file ITR-1 (informational only) |

### 12.7 Data Integrity

| Scenario | Handling |
|---|---|
| localStorage quota exceeded | Auto-switch to IndexedDB; notify user: "You have a lot of data. We've moved to extended storage." |
| Corrupted data on load | Show error: "Some data could not be loaded. Export a backup and re-import." Isolate corrupted key; load rest of app. |
| Import file: wrong schema version | Show version mismatch warning; offer to run migration or cancel |
| Export while editing | Export saves the last auto-saved state; in-progress edits (mid-form) are not included |

---

## 13. Accessibility & Internationalisation

### 13.1 Accessibility (WCAG 2.1 AA)

- All interactive elements have focus states (visible ring, not just color)
- All icons have `aria-label` or adjacent visible label
- Color is never the sole indicator of meaning (always paired with text or icon)
- Amount inputs announce their values in screen-reader mode (`aria-live` on totals)
- Keyboard navigation: all actions accessible via keyboard
  - `Tab` / `Shift+Tab` through all interactive elements
  - `Enter` or `Space` to activate buttons
  - `Escape` to close modals
  - `N` = New entry quick-add
  - `←` / `→` = Previous / next month
  - `D` = Go to Dashboard
  - `I` = Go to Income
  - `E` = Go to Expenses
  - `P` = Go to Portfolio (Investments)
  - `T` = Go to Tax

### 13.2 Internationalisation

**Currency formatting (Indian numbering system):**

```javascript
function formatINR(paise, showPaise = false) {
  const amount = paise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : 0,
  }).format(amount);
  return formatted;
}
// Produces: ₹1,42,500 (Indian style)
```

**Date formatting:**
- Display: "1 May 2026" or "01/05/2026" (user preference)
- Internal storage: ISO 8601 ("2026-05-01")

**Language:** English only in v1.0.

---

## 14. Testing Checklist

### 14.1 Unit Tests (Tax Engine — Critical)

- [ ] New regime tax: income exactly at slab boundaries (₹4L, ₹8L, ₹12L, ₹16L, ₹20L, ₹24L)
- [ ] New regime 87A rebate: income ₹11,99,999 (full rebate), ₹12,00,000 (full rebate), ₹12,00,001 (no rebate)
- [ ] New regime marginal relief at ₹12,00,001 edge case
- [ ] Old regime 87A rebate: income ₹5,00,000 (rebate), ₹5,00,001 (no rebate)
- [ ] Surcharge: income ₹50,00,000 (10% surcharge) with marginal relief
- [ ] Cess: 4% computed on tax + surcharge correctly
- [ ] LTCG exemption: ₹1,24,999 (all exempt), ₹1,25,000 (all exempt), ₹1,25,001 (₹1 taxable)
- [ ] VDA gains: cost basis only deductible; loss not set-off; 30% + 4% cess
- [ ] HRA metro: 50% of basic vs. HRA received vs. rent – 10% basic
- [ ] HRA non-metro: 40% of basic
- [ ] Section 80C capped at ₹1.5L even if entries sum to more
- [ ] 80CCD(1B): adds ₹50K OVER the ₹1.5L 80C cap
- [ ] Home loan interest: self-occupied capped at ₹2L
- [ ] Agricultural income: excluded from taxable income

### 14.2 Integration Tests

- [ ] Adding income entry reflects immediately in Tax Estimator
- [ ] Selling investment triggers capital gains calculation
- [ ] Monthly budget bars update on expense entry
- [ ] Recurring income auto-populates future months
- [ ] Custom category creation appears in expense form dropdown immediately
- [ ] Deleting category moves entries to Uncategorised
- [ ] Export → Import round-trip: all data survives exactly
- [ ] FY rollover: April 1 creates new FY context; old data accessible

### 14.3 UI / UX Tests

- [ ] Month navigation changes all views simultaneously
- [ ] Quick-add form submits and shows entry in list
- [ ] Undo after delete works within 3 seconds
- [ ] Large dataset (500+ entries per month) renders without lag
- [ ] Mobile bottom nav correctly switches screens
- [ ] Dark mode: all text legible, all charts visible
- [ ] Empty states show on first launch (no data)
- [ ] Amount input: "1.5L" parses to ₹1,50,000 correctly

---

## 15. Phased Rollout Plan

### Phase 1 — Foundation (Weeks 1–4)
**Goal:** Core income + expense tracking functional

- [ ] App shell: routing, sidebar/nav, month context, theme system
- [ ] localStorage adapter with IndexedDB fallback
- [ ] Income tracker CRUD (add, edit, delete, view by month)
- [ ] Default expense categories loaded
- [ ] Expense tracker CRUD
- [ ] Quick-add FAB
- [ ] Basic monthly totals display
- [ ] Export to CSV (income + expenses)

**Deliverable:** User can log income and expenses for any month, view totals.

---

### Phase 2 — Insights (Weeks 5–7)
**Goal:** Dashboard with charts and patterns

- [ ] Dashboard KPI strip (5 cards)
- [ ] Income vs. Expense bar+line chart (6 months)
- [ ] Expense category breakdown donut/bar
- [ ] Savings rate gauge
- [ ] Budget vs. actual progress bars
- [ ] Budget entry in settings
- [ ] Spending anomaly alerts
- [ ] FY Summary panel
- [ ] Month navigator strip

**Deliverable:** User can see trends, spending patterns, and savings rate.

---

### Phase 3 — Investment Portfolio (Weeks 8–12)
**Goal:** Multi-asset investment tracking

- [ ] Investment data models and storage
- [ ] Asset class entry forms (all types documented above)
- [ ] Portfolio holdings table
- [ ] Buy/sell transaction history
- [ ] Capital gains computation per sell (FIFO)
- [ ] Portfolio allocation donut
- [ ] SIP tracking and auto-populate
- [ ] US stocks with USD/INR conversion
- [ ] Crypto/VDA tracking with 30% tax tagging
- [ ] PPF, NPS, EPF, FD trackers

**Deliverable:** User can track all investments and see unrealised/realised gains.

---

### Phase 4 — Tax Engine (Weeks 13–16)
**Goal:** Full FY tax estimation

- [ ] Tax estimator screen
- [ ] New regime slab computation
- [ ] Old regime slab + deductions computation
- [ ] Regime comparison side-by-side
- [ ] 87A rebate + marginal relief
- [ ] Surcharge + cess
- [ ] LTCG, STCG, VDA tax integration
- [ ] TDS credit tracking
- [ ] Advance tax schedule
- [ ] Tax-saving recommendations panel

**Deliverable:** User sees accurate projected tax liability and knows how much to pay in advance tax.

---

### Phase 5 — Polish & Power Features (Weeks 17–20)
**Goal:** Data resilience, net worth, advanced settings

- [ ] Full JSON export / import with encryption
- [ ] Data migration framework (v1 → v2 etc.)
- [ ] Net worth tracker
- [ ] Recurring income/expense templates
- [ ] Category management (hide/show default, full custom CRUD)
- [ ] Keyboard shortcuts
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Mobile responsive polish
- [ ] Performance: virtual scroll for large lists
- [ ] Onboarding flow (first launch wizard)

**Deliverable:** Production-ready, fully accessible, fast app with all features.

---

## Appendix A — Glossary

| Term | Definition |
|---|---|
| FY | Financial Year (India: April 1 – March 31) |
| AY | Assessment Year (the year following FY; when ITR is filed) |
| ITR | Income Tax Return |
| TDS | Tax Deducted at Source |
| TCS | Tax Collected at Source |
| LTCG | Long-Term Capital Gains |
| STCG | Short-Term Capital Gains |
| VDA | Virtual Digital Asset (includes crypto) |
| ELSS | Equity Linked Savings Scheme (tax-saving MF) |
| PPF | Public Provident Fund |
| NPS | National Pension System |
| EPF | Employees' Provident Fund |
| SGB | Sovereign Gold Bond |
| SIP | Systematic Investment Plan |
| HRA | House Rent Allowance |
| LTA | Leave Travel Allowance |
| LRS | Liberalised Remittance Scheme |
| DTAA | Double Taxation Avoidance Agreement |
| FIFO | First In, First Out (cost basis method) |
| LIFO | Last In, First Out |
| XIRR | Extended Internal Rate of Return (annualised return for irregular cashflows) |
| Paise | 1/100th of a Rupee; all amounts stored as integers in paise |

---

## Appendix B — API / External Dependencies

This app uses **no external APIs** in v1.0. All data is user-entered and client-side.

Future integrations to consider (v2.0):
- MF NAV data: AMFI public API (free) for mutual fund NAV lookup
- Stock price: NSE/BSE free delayed data or Yahoo Finance API (requires CORS proxy)
- Crypto price: CoinGecko public API (free tier)
- Currency rate: ExchangeRate-API (free tier) for USD/INR
- RBI CII (Cost Inflation Index): Publicly available, can be hardcoded annually

---

## Appendix C — Cost Inflation Index (CII) — FY Reference

Used for indexation under old tax regime property calculations.

| FY | CII |
|---|---|
| 2001-02 (base year) | 100 |
| 2010-11 | 167 |
| 2015-16 | 254 |
| 2020-21 | 301 |
| 2021-22 | 317 |
| 2022-23 | 331 |
| 2023-24 | 348 |
| 2024-25 | 363 |
| 2025-26 | TBD (est. ~376) |

**Indexed cost formula:**
```
Indexed Cost = Actual Cost × (CII of Year of Sale / CII of Year of Purchase)
Taxable Gain with Indexation = Sale Value – Indexed Cost
```

Only applicable for property acquired before July 23, 2024, and the taxpayer chooses the indexed route (whichever is more beneficial).

---

*Document prepared for development handoff. Every screen, calculation, formula, and edge case has been documented. Developers should implement phase by phase, with each phase shippable as a usable increment.*

*For questions on Indian tax rules, cross-reference with income-tax.gov.in and official Finance Act notifications.*
