# ORDER-001 Operation Breakdown (Legacy -> Web)

- RUN_ID (evidence run): 20260207T060355Z-cmd_20260207_05_sub_1-order-001-parity11
- Evidence bundle:
  - artifacts/verification/20260207T060355Z-cmd_20260207_05_sub_1-order-001-parity11/order-001-parity/summary.md
  - artifacts/verification/20260207T060355Z-cmd_20260207_05_sub_1-order-001-parity11/order-001-parity/orca-order-bundles.network.memo.md

This note decomposes ORDER-001 into operator-sized steps and maps each step to the current Web implementation.

## 0. Scope

- Target parity ID: `ORDER-001` (order bundle edit)
- Web entry points:
  - Charts utility drawer: `処方編集` -> `entity=medOrder`
  - Charts utility drawer: `オーダー編集` -> `entity=generalOrder`

Primary code pointers:
- Web: web-client/src/features/charts/pages/ChartsPage.tsx
- Web: web-client/src/features/charts/OrderBundleEditPanel.tsx
- Legacy reference: OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/EditorSetPanel.java

## 1. Operation Units (with Web mapping)

### 1) Open editor (patient context required)

- Legacy: open EditorSet / select editor for the current patient encounter.
- Web: open Charts -> utility drawer tab.
  - Requires `encounterContext.patientId` (patient selected) and not read-only.
  - Evidence: `00-utility-tabs.png` in the RUN bundle.
  - Code: `ChartsPage.tsx` (utility items + disable reason: "患者が未選択のため利用できません").

Status: Web OK (medOrder/generalOrder only), verified.

Gap / Backlog candidate:
- Legacy EditorSet covers broader entities (treatment/test/etc). Web utility currently exposes only medOrder/generalOrder.

### 2) Add a new bundle (手入力)

- Legacy: add new bundle / add item rows.
- Web:
  - Bundle name input (`<entity>-bundle-name`)
  - For medOrder: usage/admin is required (`<entity>-admin`) by validation.
  - Item rows: name/quantity/unit inputs, add/delete, drag reorder.
  - Evidence: `01-medOrder-filled.png`, `03-generalOrder-filled.png`.
  - Code: `OrderBundleEditPanel.tsx` (form + validation + row UI).

Status: Web OK, verified for 1-row bundle.

### 3) Save bundle (persistence)

- Legacy: save bundle; appear in list; persisted to server.
- Web:
  - Click `保存して追加` (submit) -> `POST /orca/order/bundles`.
  - UI list updates (`登録済み...` list + entry buttons).
  - Evidence: network memo includes POST payloads and 200 responses.
  - Evidence: `02-medOrder-after-save.png`, `04-generalOrder-after-save.png`.

Status: Web OK, verified.

### 4) Re-open existing bundle (edit)

- Legacy: open existing bundle and edit fields/items.
- Web:
  - Each list entry has `編集` button which loads bundle into the form.
  - Code: `OrderBundleEditPanel.tsx` (list item actions -> setForm(toFormState(...))).

Status: Web available, not verified in RUN_ID=...11.

### 5) Delete bundle

- Legacy: delete bundle.
- Web:
  - Each list entry has `削除` button -> `POST /orca/order/bundles` operation=delete.
  - Code: `OrderBundleEditPanel.tsx` (deleteMutation).

Status: Web available, not verified in RUN_ID=...11.

### 6) Copy bundle (from history)

- Legacy: duplicate/copy an existing bundle.
- Web:
  - Each list entry has `コピー` button.
  - Code: `OrderBundleEditPanel.tsx` (copyFromHistory).

Status: Web available, not verified in RUN_ID=...11.

### 7) Expand (apply to chart) / Expand-continue

- Legacy: apply orders to chart modules.
- Web:
  - Buttons: `展開する` / `展開継続する`.
  - Code: `OrderBundleEditPanel.tsx` submitAction('expand'|'expand_continue').

Status: Web available, not verified in RUN_ID=...11.

### 8) Master search (order item lookup)

- Legacy: master search and item pick.
- Web:
  - Order master search UI exists (keyword + type) and material/usage search subpanels.
  - Code: `OrderBundleEditPanel.tsx` (master/usage/material sections).

Status: Web available, not verified in RUN_ID=...11 (this RUN uses hand input).

### 9) Stamp-driven entry (StampBox parity)

- Legacy: StampBox browse/search/preview -> insert stamp.
- Web:
  - Local stamp save/copy/paste, server stamp tree fetch + import.
  - Evidence for MVP gap is tracked under `STAMP-001`.
  - Code: `OrderBundleEditPanel.tsx`, `stampApi.ts`, `stampStorage.ts`.

Status: Web partial (limited entry-point and browse UX).

### 10) Downstream flow (send/finish)

- Legacy: send claim/finish workflows are tightly coupled to on-prem.
- Web:
  - ActionBar exposes `ORCA送信` / `診療終了` actions with guards.
  - Evidence: `05-send-dialog.png` (send dialog opened), `06-finish-no-dialog.png` (finish click captured).

Status: Web partial at workflow-definition level (see FLOW-020).

## 2. Concrete Backlog Items (operation-level)

- Add UI entry points for additional order entities (legacy EditorSet coverage): treatment/test/etc.
- Define and verify the operational contract for `診療終了` (FLOW-020) and exception handling (FLOW-040).
- Stamp browse UX (STAMP-001): tree/search/preview/cross-surface entry.
- Verify remaining operations end-to-end with RUN evidence:
  - edit existing bundle
  - copy bundle
  - delete bundle
  - expand / expand_continue
  - master search -> select -> save
