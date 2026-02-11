# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SVL ONE Quote Builder — a React + Vite client-side web app that replaces manual Excel/Word quoting workflows for a mechanical contracting company. Users build structured equipment quotations with hierarchical pricing, live calculations, and a generated quote preview.

**Status**: Functional prototype (v5). Flat Sheet view is the primary active surface. All logic lives in a single monolithic file (`quote-ui/src/App.jsx`, ~1800 lines).

## Commands

All commands run from `quote-ui/`:

```bash
npm run dev       # Start Vite dev server (localhost:5173, HMR enabled)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

No test framework is configured yet.

## Architecture

### Data Hierarchy

```
Quote Data (persisted to localStorage key: svl_quote_builder_v4)
├── Project Metadata (projectName, location, bidDate, quoteNumber, etc.)
└── Packages[] (type: Building/Phase/Alternate/Custom)
    └── priceGroups[]
        ├── lineItems[] (role: primary/supporting, or isNote for notes rows)
        └── addDeducts[] (type: ADD/DEDUCT, each with nested lineItems[])
```

### Pricing Engine (deterministic, client-side only)

```
mfgNet   = list × (1 + dollarUp/100) × multi
mfgComm  = mfgNet × (pay/100)
totalNet = mfgNet + freight
bidPrice = totalNet × mu
comm     = bidPrice - totalNet
```

**Critical rule**: `qty` is metadata only — it does NOT affect price calculations.

### View Modes (tab-based switching)

1. **Flat Sheet** — Excel-like dense spreadsheet (primary focus, most complete)
2. **Classic Builder** — Hierarchical card layout
3. **Focused Sheet** — Compact focused view
4. **Generated Quote** — PDF-ready preview consuming Flat Sheet data

### Key Components (all in App.jsx)

- `App` — Main orchestrator, state management, view routing
- `FlatSheetBuilderView` / `FlatSheetLineRow` — Flat Sheet entry point and rows
- `BuilderView` / `LineRow` — Classic builder
- `FocusedBuilderView` / `FocusedLineRow` — Focused view
- `PreviewView` — Generated quote output
- `PriceGroup` — Price group container with totals
- `AddDeductSection` / `AddDeductLineRow` — Optional adder/deduct scopes
- `ActionBar` — Sticky bottom bar for bulk delete
- `PackageBatchMU` — Batch markup utility

### State Management

- React hooks (useState, useCallback, useEffect, useMemo) for all state
- Custom `useSelection()` hook for multi-select across packages, price groups, lines, and add/deducts
- Auto-save to localStorage with 900ms debounce via `persistDraft()`
- `loadDraft()` / `saveDraft()` / `restoreSavedDraft()` for persistence lifecycle

### Styling

Inline CSS-in-JS via a centralized `S` style object. No external CSS framework. Key brand colors:
- Primary blue: `#0058A4`
- Accent orange: `#E46B03`

### Utilities

- `gid()` — random 9-char ID generator
- `toNum(v)` — coerce to number (fallback 0)
- `fmt(n)` — USD currency formatter
- `fmtPct(n)` — percentage formatter
- `cloneQuoteData(v)` — structured clone with JSON fallback
- `moveItem(arr, idx, dir)` — array reordering

## Key Files

| File | Purpose |
|------|---------|
| `quote-ui/src/App.jsx` | All application logic and components |
| `quote-ui/src/main.jsx` | React entry point |
| `docs/Flat_Sheet_FRD.md` | Detailed functional requirements (50+ FRs with acceptance criteria) |
| `docs/PROJECT_HANDOFF.md` | Dev handoff notes and resume checklist |

## Important Patterns

- **Auto-naming**: Price group names auto-generate from primary line equipment values (1 item: `A`, 2: `A and B`, 3-4: `A, B, and C`, 5+: `Equipment Package Below`)
- **Currency inputs**: List and Freight fields use in-field currency formatting with sanitization
- **Autocomplete**: Mfr and Equipment fields use `<datalist>` with seeded defaults merged with existing quote values
- **Descriptions**: Bold (`**text**`) and underline (`__text__`) token markup, with per-row and global expand/collapse
- **Drag-and-drop**: Lines and groups support DnD with visual drop indicators (package highlight, group highlight, insert-before bar, end-of-group zone)
- **Orphan handling**: Deleting a package moves its price groups to an "Unassigned" package
- **Note rows**: Non-priced rows associated to primaries via `groupId`; render as bold bullets in generated quote
