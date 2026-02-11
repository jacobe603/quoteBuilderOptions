# Flat Sheet View - Functional Requirements Document (FRD)

Document Owner: SVL ONE Product Team  
Prepared For: Software Engineering Handoff  
Source of Truth for Current Behavior: `quote-ui/src/App.jsx`  
Last Updated: February 9, 2026

## 1. Purpose

Define the functional requirements for the **Flat Sheet** quote-building view so a software developer can implement the same behavior in production.

The Flat Sheet view is an Excel-like quoting interface for:
- Package and price group structuring
- Line-item pricing entry
- Quote descriptions and notes
- Optional adder/deduct structures
- Reordering via buttons and drag-and-drop

## 2. Scope

In scope:
- Flat Sheet screen behavior and UI elements
- Data entry and calculations used in Flat Sheet
- Interaction behavior (move, drag/drop, expand/collapse, filtering)
- Required outputs consumed by Generated Quote view

Out of scope:
- Classic Builder and Focused Sheet UX details
- Backend APIs, persistence service, authentication, permissions
- PDF/DOCX generation engine implementation

## 3. Business Rules

BR-1 Quantity does not affect price math.  
- `qty` is display/output metadata only.

BR-2 Line-item price calculation:
- `mfgNet = list * (1 + dollarUp/100) * multi`
- `mfgComm = mfgNet * (pay/100)`
- `totalNet = mfgNet + freight`
- `bidPrice = totalNet * mu`
- `comm = bidPrice - totalNet`

BR-3 Note rows are non-priced.
- Note rows must always calculate as zero.

BR-4 Optional adders/deducts roll up by line-item bid price totals.

BR-5 Supporting lines do not show quote bullet description editors.

## 4. Data Model (Flat Sheet Relevant)

### 4.1 Package
- `id`
- `name`
- `type` (Building, Phase, Alternate, Custom)
- `priceGroups[]`

### 4.2 Price Group
- `id`
- `name`
- `lineItems[]`
- `addDeducts[]`

### 4.3 Line Item
- `id`
- `role` (`primary` or `supporting`)
- `groupId` (used to associate notes to a primary scope block)
- `qty`
- `manufacturer`
- `equipment`
- `model`
- `tag`
- `list`
- `dollarUp`
- `multi`
- `pay`
- `freight`
- `mu`
- `description`
- `category`, `notes`, `status` (currently available fields)
- `isNote` (boolean)
- `noteText`

### 4.4 Optional (Adder/Deduct) Group
- `id`
- `type` (`ADD` or `DEDUCT`)
- `description`
- `lineItems[]`

## 5. Functional Requirements

## 5.1 Navigation and Header

FR-1 The application must provide a tab entry point labeled **Flat Sheet**.

FR-2 Flat Sheet must display top-level totals:
- Total Net
- Profit
- Total Bid

FR-3 Flat Sheet toolbar must include:
- `+ Package Row`
- Filter input
- `Expand Descriptions`
- `Collapse Descriptions`

FR-4 Description panels must default to **collapsed** when Flat Sheet loads.

## 5.2 Table Layout

FR-5 Flat Sheet row/header columns must share one aligned grid definition to keep headers lined up with rows.

FR-6 Flat Sheet must use a full-width, spreadsheet-like layout with flexible manufacturer/equipment/model/tag columns.

FR-7 The right-most column must contain compact description toggle icons (not large text buttons).

## 5.3 Package Rows

FR-8 Each package row must support inline editing:
- Package `name`
- Package `type`

FR-9 Each package row must show rolled-up package bid total.

FR-10 Each package row must include `+ Price Group Row`.

## 5.4 Price Group Rows

FR-11 Each price group row must support inline editing of group `name`.

FR-12 Each price group row must include action buttons:
- `+ Primary`
- `+ Supporting`
- `+ Notes`

FR-13 Price groups must show a bottom total container:
- Left label text: `Total Net Price, Freight Included`
- Right value: summed group bid total

FR-14 The total container must include:
- `+ Adder`
- `+ Deduct`

## 5.5 Line Item Editing

FR-15 Each line row must support editing for:
- Role, Qty, Mfr, Equipment, Model, Tag, List, $Up, Multi, Pay, Freight, MU

FR-16 `List` and `Freight` edit inputs must display currency formatting in the input box.

FR-17 Manufacturer and Equipment inputs must support text-entry autocomplete dropdowns.

FR-18 Autocomplete options must come from:
- Seeded defaults
- Existing values in current quote data (line items + optional lines)

FR-19 Bid price must update live per row based on calculation rules.

FR-20 Supporting rows must not show quote description editors.

## 5.6 Description Behavior (Primary Lines)

FR-21 Primary lines must provide per-row description toggle control.

FR-22 Description editor must support multiline text.

FR-23 Description editor must support bold and underline token insertion:
- Bold token wrapper: `**text**`
- Underline token wrapper: `__text__`

FR-24 Description textareas must auto-grow to content.

FR-25 Global controls must expand/collapse all descriptions.

## 5.7 Notes Behavior

FR-26 Users must be able to add note rows via `+ Notes`.

FR-27 Notes row must render as:
- Label: `NOTES:`
- Multiline text area

FR-28 Notes rows must:
- Have no pricing contribution
- Not display quote bullet description editor

FR-29 Notes must be associated to primary lines by `groupId`.

## 5.8 Optional Adders/Deducts

FR-30 Users must be able to add multiple optional groups per price group:
- Type `ADD`
- Type `DEDUCT`

FR-31 Each optional group must show a collapsed summary line with:
- Type badge (Adder or Deduct)
- Description
- Signed total
- Edit/Hide toggle

FR-32 Each optional group must support expanded editing:
- Editable description
- `+ Line` for nested line items
- Delete optional group

FR-33 Optional nested lines must support editing for:
- Qty, Mfr, Equipment, Model, List, $Up, Multi, Freight, MU

FR-34 Optional nested lines must be forced to supporting/non-note behavior.

FR-35 Optional group totals must roll up from nested line bid totals.

FR-36 Optional group lines must appear under the price group total container.

## 5.9 Auto-Naming Rules

FR-37 Price group name auto-generation must use only **primary** lines.

FR-38 Auto-name rules:
- 0 equipment names: `New Price Group`
- 1 equipment name: `A`
- 2 equipment names: `A and B`
- 3 to 4 equipment names: `A, B, and C`
- 5 or more: `Equipment Package Below`

FR-39 Auto-name must update after line add/edit/delete/move operations.

FR-40 User can manually edit price group name inline at any time.

## 5.10 Reordering and Drag-and-Drop

FR-41 Rows and groups must support arrow-button movement.

FR-42 Line movement must support:
- Intra-group reorder
- Cross-group move
- Cross-package transitions when moving past boundaries

FR-43 Group movement must support:
- Intra-package reorder
- Cross-package move

FR-44 Drag-and-drop must be supported for:
- Lines
- Price groups

FR-45 Drag handles (`::`) must exist on line rows and group rows.

FR-46 Visual drop indicators must clearly show target:
- Package drop highlight
- Group drop highlight
- Insert-before-line highlight bar
- End-of-group drop zone indicator

## 5.11 Filter Behavior

FR-47 Filter must match against:
- Package name
- Price group name
- Line fields (manufacturer, equipment, model, tag, description, note text, notes)
- Optional group description and optional nested line text fields

FR-48 Filtered view must preserve editable behavior for visible rows.

## 5.12 Generated Quote Integration (Output Expectations)

FR-49 Primary line descriptions must output as quote bullets.

FR-50 Notes rows (same `groupId`) must render under matching primary as:
- `NOTES:`
- Bulleted note lines in bold

FR-51 Optional adders/deducts with non-empty description and at least one line item must render as roll-up lines under group total in the generated quote.

## 6. Validation and Error Handling

FR-52 Numeric edits must coerce invalid values to `0`.

FR-53 Currency input parser must accept common user entry characters and sanitize to numeric value.

FR-54 Deleting rows/groups must immediately recalculate totals and refresh dependent names.

## 7. UX and Visual Requirements

FR-55 Package rows use medium gray styling.

FR-56 Price group rows use blue styling.

FR-57 Total Net area must be white/neutral bordered box with left label and right amount.

FR-58 Flat Sheet should optimize for dense, spreadsheet-like editing (reduced row height and compact controls).

## 8. Non-Functional Requirements

NFR-1 UI updates should feel immediate for typical quote sizes (client-side state updates).

NFR-2 All Flat Sheet calculations must be deterministic and client-side.

NFR-3 Layout should remain usable on standard desktop widths and scale down for narrower viewports.

## 9. Acceptance Criteria (Developer Test Checklist)

AC-1 New Flat Sheet session loads with description panels collapsed.

AC-2 Editing `qty` does not change bid totals.

AC-3 Editing `list`/`freight` shows currency formatting in-field and updates totals correctly.

AC-4 `Mfr` and `Equipment` inputs provide autocomplete suggestions and allow free text.

AC-5 Adding `+ Notes` creates a non-priced notes row; notes appear in generated quote under matching primary.

AC-6 Supporting lines never show the quote description editor.

AC-7 `+ Adder`/`+ Deduct` create optional groups beneath total; nested lines roll up to one signed total line.

AC-8 Multiple optional groups can coexist in one price group.

AC-9 Drag/drop shows visible target indicators before drop.

AC-10 Line and group moves work across group/package boundaries and keep totals accurate.

AC-11 Auto-name rule changes when primary equipment set changes.

AC-12 Filter returns matching package/group/line/optional rows.

## 10. Implementation Notes for Engineering

- Current implementation is fully client-side React state in `quote-ui/src/App.jsx`.
- Flat Sheet feature entry point: `FlatSheetBuilderView`.
- Recommended refactor for production:
  - Extract Flat Sheet into dedicated module files
  - Add unit tests for calculations and auto-name logic
  - Add integration tests for drag/drop and optional group rollups
  - Introduce backend-compatible DTOs and validation layer

