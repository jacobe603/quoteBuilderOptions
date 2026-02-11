# Quote Builder - Project Handoff Notes

Last Updated: February 9, 2026  
Primary App File: `src/App.jsx`

## 1. Project Goal

Build an internal quoting UI to replace Excel/Word/email workflow with an integrated quote builder that supports:
- Package -> Price Group -> Line Item hierarchy
- Editable pricing inputs and live totals
- Quote-ready descriptions/notes
- Optional adder/deduct scopes
- Generated quote preview

## 2. Current Implementation Status

The prototype is functional and runs as a React + Vite app.  
Flat Sheet mode has been the main focus and includes the latest UX updates.

Implemented views:
- Classic Builder
- Focused Sheet
- Flat Sheet
- Generated Quote

## 3. Run Instructions

From `quote-ui`:

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 4. Persistence and Drafts

- Quote data auto-saves to browser local storage.
- Local storage key: `svl_quote_builder_v4`.
- Draft restore and reset logic are in `src/App.jsx`.

## 5. Flat Sheet - What Exists Today

## 5.1 Structure and Editing

- Package rows with editable package name/type.
- Price group rows with editable name.
- Line rows with dense spreadsheet-style fields.
- Notes rows (`NOTES:`) with multiline entry.
- Description editors for primary lines only (supporting lines hide description editor).

## 5.2 Pricing Rules

- Quantity is informational only and does not affect pricing.
- Pricing uses:
  - `mfgNet = list * (1 + dollarUp/100) * multi`
  - `mfgComm = mfgNet * (pay/100)`
  - `totalNet = mfgNet + freight`
  - `bidPrice = totalNet * mu`
  - `comm = bidPrice - totalNet`
- Notes are non-priced rows.

## 5.3 Descriptions

- Description panels default to collapsed.
- Per-row compact icon toggle at right edge (`▸` / `▾`).
- Global expand/collapse buttons.
- Bold/underline token insertion:
  - bold: `**text**`
  - underline: `__text__`
- Textareas auto-grow with content.

## 5.4 Optional Adders/Deducts

- Buttons in price group total box:
  - `+ Adder`
  - `+ Deduct`
- Each optional scope has:
  - Description
  - Multiple nested line items
  - Roll-up signed total line beneath group total
- Optional nested lines are forced supporting/non-note behavior.

## 5.5 Movement and Drag/Drop

- Arrow move controls for lines and groups.
- Drag/drop for lines and groups.
- Visual drop targets include:
  - Package highlight
  - Group highlight
  - Insert-before line bar
  - End-of-group drop zone indicator

## 5.6 Autocomplete and Input Formatting

- `Mfr` and `Equipment` use autocomplete text-entry (`datalist`).
- Option lists are seeded with defaults and merged with existing quote values.
- Currency formatting in edit boxes is applied to:
  - `List`
  - `Freight`
  in Flat Sheet line rows and optional nested rows.

## 5.7 Auto Naming

Price group title auto-updates from **primary** equipment values:
- 1 item: `A`
- 2 items: `A and B`
- 3-4 items: `A, B, and C`
- 5+ items: `Equipment Package Below`

## 6. Key Files

- `src/App.jsx`
  - Main application and all view components (currently monolithic).
- `docs/Flat_Sheet_FRD.md`
  - Detailed functional requirements for Flat Sheet.
- `package.json`
  - Scripts (`dev`, `build`, `preview`).

## 7. Recommended Next Steps

1. Refactor `src/App.jsx` into modules:
- `components/flat-sheet/*`
- `components/preview/*`
- `lib/pricing.ts|js`
- `lib/move-helpers.ts|js`

2. Add test coverage:
- Unit tests for pricing and auto-name logic.
- Interaction tests for drag/drop and optional rollups.

3. Define backend-ready data contracts:
- DTOs for package/group/line/add-deduct entities.
- Validation rules for required fields and numeric bounds.

4. Add import/export workflow:
- Load from quote templates.
- Export normalized JSON payload for backend.

5. Add role/permission and audit trail requirements if this moves to production.

## 8. Open Product Decisions

- Final approved manufacturer/equipment autocomplete catalogs.
- Whether Classic and Focused views remain in production scope.
- Required export format and downstream integration order.
- Validation strictness for required text fields before quote output.

## 9. Resume Checklist (For Next Session)

1. Run `npm run dev` from `quote-ui`.
2. Open Flat Sheet tab and verify:
- descriptions default collapsed
- adder/deduct creation under total box
- drag/drop target highlighting
- currency input formatting
- mfr/equipment autocomplete suggestions
3. Review `docs/Flat_Sheet_FRD.md` for requirement IDs before coding new features.

