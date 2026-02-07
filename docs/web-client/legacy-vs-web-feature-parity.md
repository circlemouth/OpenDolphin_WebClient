# Legacy vs Web Feature Parity (Working Canon)

Purpose: maintain a single source of truth for feature parity between the legacy (on-prem/Swing) client and the Web client.

Last merge: RUN_ID=`20260207T043544Z-cmd_20260207_03_sub_6-parity-merge`

Status taxonomy:
- 完了: Web covers the legacy use-case without material gaps.
- 一部: Web covers the use-case partially; remaining gaps are defined.
- 未実装: legacy feature is not available in Web.
- 仕様差: Web intentionally differs (constraints/design); impact must be stated.
- 不明: not yet verified (needs evidence).

Evidence pointers should reference one of:
- `docs/verification-plan.md`
- `docs/weborca-reception-checklist.md`
- `docs/web-client/architecture/*`
- Code paths under `web-client/src/...` (as a weak evidence fallback)
- Legacy artifact(s) under `docs/archive/...` (reference only; do not treat as current without verification)

## Parity Table

Columns:
- `ID`: hierarchical feature id (domain prefix + number)
- `Legacy`: what exists in the legacy client
- `Web`: what exists in the Web client today
- `Status`: 完了/一部/未実装/仕様差/不明
- `Impact`: business impact / migration risk (short)
- `Evidence`: canonical docs / code pointers

### AUTH (Authentication / Admin)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| AUTH-001 | Login (facility+user+password) | Login flow + session storage | 完了 | P0: cannot operate without login | `artifacts/verification/20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1/web-client-feature-inventory/web-features.md`, `web-client/src/LoginScreen.tsx`, `web-client/src/AppRouter.tsx` |
| AUTH-010 | User/facility admin (create users, assign roles, facility settings, password change) | system_admin tooling (delivery/config/ORCA probes) but no Dolphin user CRUD UI | 未実装 | P1: ops/admin migration may require: user create/disable, role assignment, facility info edit, password reset/change | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java`, `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/profile/ChangePasswordImpl.java`, `web-client/src/features/administration/AdministrationPage.tsx`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |
| AUTH-020 | System settings + license/activity check (project settings + system endpoints) | Administration: config/delivery visibility + debug probes to legacy/system endpoints | 一部 | P2: can observe delivery/config + probe legacy REST; missing: full ProjectSettingDialog parity UI and dedicated license/activity UX | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/project/ProjectSettingDialog.java`, `web-client/src/features/administration/api.ts`, `docs/web-client-unused-features.md`, `web-client/src/features/administration/LegacyRestPanel.tsx`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |

### PAT (Patients)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| PAT-001 | Patient search (name/kana/id/digit) | Patients page + search + saved views | 一部 | P0: must confirm advanced legacy filters/copy/export needs | `artifacts/verification/20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1/web-client-feature-inventory/web-features.md`, `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/psearch/PatientSearchImpl.java` |
| PAT-010 | Patient CRUD (create/update) | Patient create/update flows | 一部 | P1: confirm delete/merge and operational constraints | `artifacts/verification/20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1/web-client-feature-inventory/web-features.md` |
| PAT-900 | Bulk export APIs (legacy-only) | Not exposed in standard user flow | 仕様差 | P2: decide target-out vs admin tooling; do not block clinical flow | `docs/archive/2025Q4/web-client/process/SWING_PARITY_CHECKLIST.md` (reference) |

### REC (Reception / Visits)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| REC-001 | Reception list (today) + open a visit | Reception page with visits list + open Charts | 完了 | P0: core flow + list-level status/exception/retry MVP is ORCA-queue centric; CLAIM-centric operations are out-of-scope/spec-diff by deprecation policy | `artifacts/verification/20260207T044349Z-cmd_20260207_03_sub_9-rec-001-parity/rec-001-parity/notes.md`, `artifacts/verification/20260207T070200Z-cmd_20260207_08_sub_3-rec-001-mvp/rec-001-mvp/notes.md`, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network-summary.json`（CLAIM不発）, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network.har`, `docs/weborca-reception-checklist.md` |
| REC-010 | Appointment list | `/orca/appointments/list` integration | 完了 | P0 | `docs/verification-plan.md`, `docs/weborca-reception-checklist.md` |
| REC-020 | Visit list | `/orca/visits/list` integration | 完了 | P0 | `docs/verification-plan.md`, `docs/weborca-reception-checklist.md` |
| REC-030 | Accept/send visit to ORCA (受付送信) | `/orca/visits/mutation` (acceptmodv2) | 完了 | P0: success requires prod-like ORCA connectivity + correct seed/doctorCode/insurance; Trial failures (upstream 502/405) are env issues, not a Web functional gap | `docs/verification-plan.md`, `docs/weborca-reception-checklist.md`, `artifacts/verification/20260207T042411Z-cmd_20260207_03_sub_4-rec-030-acceptmodv2-parity/rec-030-acceptmodv2-parity/notes.md` |
| REC-040 | ORCA queue status visibility | `/api/orca/queue` + UI reflection | 完了 | P0 | `docs/verification-plan.md` |
| REC-050 | CLAIM outpatient call (legacy dependency) | Must NOT call `/orca/claim/outpatient` | 完了 | P0: modernization contract | `docs/verification-plan.md` |

### FLOW (Business flow: Reception -> Charts -> Finish -> Billing)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| FLOW-001 | Reception list -> open chart -> return to reception | Reception row double click opens Charts with encounter context; Charts/OrcaSummary can navigate back to Reception | 完了 | P0: daily operation needs fast switching | `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md`, `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/charts/OrcaSummary.tsx`, `web-client/src/features/charts/encounterContext.ts` |
| FLOW-010 | Walk-in reception accept/cancel -> appears in list -> chart can open | Reception accept form -> `/orca/visits/mutation` + list refresh; open Charts from the generated entry | 完了 | P0 | `docs/verification-plan.md`, `docs/weborca-reception-checklist.md`, `docs/web-client/operations/reception-billing-flow-status-20260120.md`, `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md` |
| FLOW-020 | Chart documentation -> send -> finish/close | Charts ActionBar: draft/save + `ORCA送信` (`/api21/medicalmodv2`) + best-effort `medicalmodv23` / explicit `診療終了` action with guards | 一部 | P0: must define what "finish" means operationally and what state transitions it guarantees | `docs/verification-plan.md`, `docs/web-client/operations/reception-billing-flow-status-20260120.md`, `web-client/src/features/charts/ChartsActionBar.tsx`, `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md` |
| FLOW-030 | Billing visibility -> accounting confirmation | OrcaSummary/Reception: invoiceNumber + billing status; incomeinfv2 refresh for paid/unpaid visibility; report print (receipt/statement) is available but needs real-ORCA verification | 一部 | P0: migration risk if accounting confirmation is ambiguous | `docs/web-client/operations/reception-billing-flow-status-20260120.md`, `web-client/src/features/charts/OrcaSummary.tsx`, `web-client/src/features/charts/orcaReportApi.ts`, `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md` |
| FLOW-040 | Exceptions -> resend/retry/discard guidance | ORCA queue warnings (Reception/Charts) + retry/discard actions (Reception/Administration) + next-action copy; needs policy for roles and "what to do next" | 一部 | P0: operational downtime if resend path is unclear | `web-client/src/features/reception/pages/ReceptionPage.tsx`, `web-client/src/features/administration/AdministrationPage.tsx`, `docs/weborca-reception-checklist.md`, `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md` |

### SCHED (Schedule)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| SCHED-001 | Facility schedule view (予定カルテの一覧/表示/選択) | No dedicated schedule surface in Web (appointments list is in Reception scope) | 未実装 | P1: if \"予定カルテ\" is required, define whether Reception appointment list is sufficient or new schedule UI is needed | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java`, `docs/verification-plan.md`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |
| SCHED-010 | Reservation create/cancel + applyRp / claim hooks | No appointment mutation UI/flow found in Web | 未実装 | P1: reservation mutation is not present; applyRp/CLAIM hooks are legacy-specific and must be redefined | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |

### CHART (Charts core)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| CHART-001 | Open charts for a visit | Charts page + encounter context guard | 完了 | P0 | `docs/web-client/README.md` (legacy hub), `docs/verification-plan.md` |
| CHART-010 | Central SOAP editor visible/usable | SOAP note panel | 完了 | P0: compact-header/compact-ui flagsでも 1366x768 初期表示で SOAP textarea がviewport内 | `tests/charts/e2e-compact-visibility.spec.ts`, `artifacts/verification/20260207T042527Z-cmd_20260207_03_sub_5-chart-010-020/chart-010-020-compact-visibility/` |
| CHART-020 | Draft save (ドラフト保存) | Draft save action | 完了 | P0: compact-header/compact-ui flagsでも 1366x768 初期表示で #charts-action-draft がviewport内 + クリック可能 | `tests/charts/e2e-compact-visibility.spec.ts`, `artifacts/verification/20260207T042527Z-cmd_20260207_03_sub_5-chart-010-020/chart-010-020-compact-visibility/` |
| CHART-030 | ORCA send (送信前チェック + 実行) | Charts ActionBar send flow | 完了 | P0 | `docs/verification-plan.md` |
| CHART-040 | Print/export outpatient | `/charts/print/outpatient` flow | 完了 | P1 | `docs/web-client/README.md` (legacy hub), `docs/verification-plan.md` |
| CHART-050 | Document create (文書作成) | Utility panel + odletter integration | 完了 | P1 | `docs/verification-plan.md` (document modal / odletter sections) |
| CHART-060 | Left/center/right columns and docked utility | Workbench layout + utility tabs | 完了 | P1 | `docs/web-client/README.md` (legacy hub), `web-client/src/features/charts/pages/ChartsPage.tsx` |
| CHART-070 | CLAIM outpatient call (legacy dependency) | Must NOT call `/orca/claim/outpatient` | 完了 | P0 | `docs/verification-plan.md` |

### ORDER (Orders / Bundles)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| ORDER-001 | Order bundle edit (処方/オーダー編集) | Docked utility: order-edit / prescription-edit（MVP: order-edit の editor 切替 + bundleName 自動補完は `VITE_ORDER_EDIT_MVP=1`） | 一部 | P0/P1: legacy had StampBox-based rapid entry and broader editor set | `artifacts/verification/20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1/order-001-mvp/summary.md`, `artifacts/verification/20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1/order-001-mvp/orca-order-bundles.network.memo.md`, `artifacts/verification/20260207T060355Z-cmd_20260207_05_sub_1-order-001-parity11/order-001-parity/order-001-operation-breakdown.md`, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network-summary.json`（`/orca/order/bundles` 観測 + CLAIM不発）, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network.har`, `OpenDolphin_WebClient/client/src/main/java/open/dolphin/order/EditorSetPanel.java`, `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/charts/OrderBundleEditPanel.tsx` |
| ORDER-010 | Procedure usage (器材/薬品使用量) send correctness | `/api21/medicalmodv2` payload correctness | 完了 | P0 | `docs/verification-plan.md` (残件 P0 完了), RUN evidence paths in that doc |
| ORDER-020 | Materials master search | `GET /orca/master/material` integration | 完了 | P1 | `docs/verification-plan.md` (材料マスタ 503 再検証) |

### LAB (Lab)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| LAB-001 | Lab: import + browse + trend graph + PDF | No lab surface in Web (legacy REST can be probed for `/lab` only) | 未実装 | P1/P2: if lab is required, decide whether to implement UI or keep as legacy-only; legacy supports import + chart + PDF | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/lbtest/LaboTestPanel.java`, `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/lbtest/LaboTestOutputPDF.java`, `docs/web-client-unused-features.md`, `web-client/src/features/debug/legacyRestApi.ts`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |

### DOC (Letters / Certificates / Schema)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| DOC-001 | Letter create/update/list/delete | `/odletter/*` integration | 完了 | P1 | `docs/verification-plan.md` (/odletter section) |
| DOC-010 | Order-row document modal | Document modal from order bundle | 完了 | P1 | `docs/verification-plan.md` (文書項目モーダル section) |

### STAMP (Stamp library)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| STAMP-001 | Stamp tree browse (StampBox) | Charts utility: `StampLibraryPanel` (treeName browse + search + selection preview; Phase2 clipboard copy) behind `VITE_STAMPBOX_MVP=1/2` + existing OrderBundle edit: stamp select/import/copy/paste + local save (server: `/touch/stampTree/:userPk` + `/touch/stamp/:stampId`) | 一部 | P0: MVP gaps are closed when flag is enabled; remaining: stamp curation workflows (edit/sync/publish) and UX refinements (one-click apply, DnD, etc.) | `docs/verification-plan.md` (STAMP-001), `artifacts/verification/20260207T065531Z-cmd_20260207_08_sub_1-stamp-001-mvp/stamp-001-mvp/notes.md`, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network-summary.json`（`/touch/stampTree`/`/touch/stamp` 観測 + CLAIM不発）, `artifacts/verification/20260207T083550Z-cmd_20260207_10_sub_1-manual-smoke/manual-smoke/mvp2/network.har`, `web-client/src/features/charts/StampLibraryPanel.tsx`, `web-client/src/features/charts/pages/ChartsPage.tsx`, `web-client/src/features/charts/OrderBundleEditPanel.tsx` |
| STAMP-010 | Stamp tree edit/sync/publish | Web UI for edit/sync | 未実装 | P1/P2: stamp curation workflows may block adoption depending on site | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/stampbox/UserStampBoxExportImporter.java` |

### INTEG (Integrations / Background Services)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| INTEG-010 | CLAIM send (socket, ACK/NAK, retries) | Web: does not implement CLAIM; modernization uses ORCA routes | 仕様差 | P0: must confirm accounting integration plan for migration | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/claim/SendClaimImpl.java`, `docs/verification-plan.md` |
| INTEG-020 | MML send | Web: not implemented | 仕様差 | P2: depends on site; confirm target-out or replacement | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/mml/SendMmlImpl.java` |
| INTEG-030 | PVT server / relay (client background services) | Web: not implemented (server-side responsibility) | 仕様差 | P1: operational parity depends on deployment topology | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/client/Dolphin.java` |

### IMG (Schema / Image)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| IMG-001 | Patient images (import/capture -> list/browse -> attach/link to chart/doc as needed) | Charts utility: patient images panel (upload -> list -> insert link into SOAP Free). Gate: `VITE_PATIENT_IMAGES_MVP=1` (UI PhaseA is MSW-backed). Server PhaseA provides upload/list/download with feature gate + audit operation (`image_upload`/`image_download`) + sha check. Mobile Phase1 adds a dedicated entrypoint `/f/:facilityId/m/images` behind `VITE_PATIENT_IMAGES_MOBILE_UI=1`, and a patient identification UI (picker + manual input + existence check) as a merge point for mobile upload. Server hardening verifies gate/auth/error matrix + audit presence (success only). Device-like verification confirms mobile UI works on iPhone/Android/iPad viewports with HAR+screenshots and 413+Retry. | 一部 | P1: UI PhaseA is MSW-backed; must wire UI -> server API end-to-end and verify persistence/authorization/thumbnail pipeline before production readiness. | `docs/verification-plan.md` (cmd_20260207_10 画像PhaseA, cmd_20260207_11 Phase1), `artifacts/verification/20260207T084506Z-cmd_20260207_10_sub_3-images-phaseA-web/images-phaseA-web/notes.md`, `artifacts/verification/20260207T085759Z-cmd_20260207_10_sub_2-images-phaseA-server/images-phaseA-server/notes.txt`, `artifacts/verification/20260207T085759Z-cmd_20260207_10_sub_2-images-phaseA-server/images-phaseA-server/http_codes.summary.txt`, `artifacts/verification/20260207T085759Z-cmd_20260207_10_sub_2-images-phaseA-server/images-phaseA-server/sha256.match.txt`, `artifacts/verification/20260207T085759Z-cmd_20260207_10_sub_2-images-phaseA-server/images-phaseA-server/05_audit_latest.txt`, `artifacts/verification/20260207T092856Z-cmd_20260207_11_sub_2-mobile-patient-pick-phase1/mobile-patient-pick-phase1/notes.md`, `artifacts/verification/20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1/mobile-images-ui-phase1/notes.md`, `artifacts/verification/20260207T094618Z-cmd_20260207_11_sub_1-mobile-images-ui-phase1/mobile-images-ui-phase1/network.json`, `artifacts/verification/20260207T094018Z-cmd_20260207_11_sub_3-img-hard/images-mobile-server-hardening/http_codes.summary.txt`, `artifacts/verification/20260207T094018Z-cmd_20260207_11_sub_3-img-hard/images-mobile-server-hardening/02_404_feature_off.body.json`, `artifacts/verification/20260207T094018Z-cmd_20260207_11_sub_3-img-hard/images-mobile-server-hardening/04_415_unsupported.body.json`, `artifacts/verification/20260207T094018Z-cmd_20260207_11_sub_3-img-hard/images-mobile-server-hardening/05_413_too_large.body.json`, `artifacts/verification/20260207T094018Z-cmd_20260207_11_sub_3-img-hard/images-mobile-server-hardening/12_audit_lookup_by_request_ids.txt`, `artifacts/verification/20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify/mobile-images-ui-verify/notes.md`, `artifacts/verification/20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify/mobile-images-ui-verify/summary.json`, `artifacts/verification/20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify/mobile-images-ui-verify/network.har`, `artifacts/verification/20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify/mobile-images-ui-verify/network-android.har`, `artifacts/verification/20260207T095205Z-cmd_20260207_11_sub_4-mobile-images-ui-verify/mobile-images-ui-verify/network-ipad.har`, `web-client/src/features/images/components/MobilePatientPicker.tsx`, `web-client/src/AppRouter.tsx`, `web-client/src/features/images/components/ImageDockedPanel.tsx` |
| IMG-010 | Schema editor (draw/undo/text) | Web: no Schema editor surface found | 未実装 | P1: blocks if schema is mandatory; define minimal parity (view/create/save/print) vs target-out | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/schema/SchemaEditorImpl.java`, `docs/web-client-unused-features.md`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |
| IMG-020 | Image browser proxy (TFS/Unitea/FCR) | Web: no image browser proxy surface found | 未実装 | P2: site dependent | `OpenDolphin_WebClient/client/src/main/java/open/dolphin/impl/img/ImageBrowserProxy.java`, `artifacts/verification/20260207T051331Z-cmd_20260207_05_sub_4-p1p2/p1p2-parity-tighten/notes.md` |

### DEBUG (Legacy REST / diagnostics)

| ID | Legacy | Web | Status | Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| DEBUG-001 | (No dedicated REST console UI; diagnostics are indirect via settings/logs) | Debug: legacy-rest console + Administration: legacy-rest panel | 仕様差 | P2: Web provides additional system_admin diagnostic tooling; keep debug-scoped | `docs/web-client-unused-features.md`, `web-client/src/features/debug/LegacyRestConsolePage.tsx`, `web-client/src/features/administration/LegacyRestPanel.tsx`, `artifacts/verification/20260207T044334Z-cmd_20260207_03_sub_10-debug-001/debug-001-parity/notes.md` |

## Backlog (Top 10)

Prioritization:
- P0: blocks migration or daily clinical flow
- P1: needed for broader parity or reduces operational risk
- P2: nice-to-have / site-dependent

Each item references a Parity `ID`.

1. P0 `FLOW-030` 会計確定の「業務合格」定義を明文化し、実 ORCA で invoiceNumber / incomeinfv2（収納）/ 領収書・明細の最低限突合せを RUN 証跡で追加する（会計待ち/会計済みの判定根拠を固定）。
   - Evidence seed: `docs/web-client/operations/reception-billing-flow-status-20260120.md`, `artifacts/verification/20260207T051441Z-cmd_20260207_06_sub_1-flow-parity/flow-parity/notes.md`
2. P0 `FLOW-040` 例外時の再送/破棄導線を運用として収束（Reception からの誘導、system_admin 依存の可否、権限不足時の次の一手、再送の成功判定と証跡）。
   - 現状: Reception/Charts は queue 状態を表示し、Reception/Administration で retry/discard が存在する（ただし運用合格の定義が未固定）。
3. P0 `STAMP-001`（スタンプ閲覧）最小MVPを feature flag で段階導入し、閲覧ギャップを閉じる（証跡: `20260207T065531Z-cmd_20260207_08_sub_1-stamp-001-mvp`）。
   - 対応（MVP）:
     - Charts ユーティリティに `スタンプ` タブ追加（OrderBundleEditPanel 以外から開ける入口）
     - ツリーUI: `treeName` 分類での閲覧（折りたたみ）
     - 検索UI: 名称/memo での絞り込み
     - 詳細プレビュー: 選択時点で memo/代表アイテムを確認
     - Phase2: クリップボードへコピー（既存の OrderBundleEditPanel のペーストで反映）
   - 残件（次の打ち手）:
     - `STAMP-010`（スタンプ編集/sync/publish）ワークフローの要否判断と実装方針
     - UX改善: 現在開いている OrderBundleEditPanel への「1クリック適用」、DnD/コンテキストメニュー等の操作短縮
4. P0 `ORDER-001` 旧来の EditorSet/スタンプ中心入力と Web の order-edit/prescription-edit のギャップを操作単位へ分解し、優先順に埋める（短期回避/恒久実装/対象外の判定）。
   - Webで成立（実証）: 最小操作セット（処方/オーダーの手入力→保存→一覧反映→GET確認、送信/診療終了のダイアログ導線）: `artifacts/verification/20260207T060355Z-cmd_20260207_05_sub_1-order-001-parity11/order-001-parity/summary.md`
   - MVP Phase1（flag導入）: order-edit の editor 切替（generalOrder/treatmentOrder/testOrder）+ bundleName 自動補完（空なら先頭項目名）を `VITE_ORDER_EDIT_MVP=1` で段階導入: `artifacts/verification/20260207T065042Z-cmd_20260207_08_sub_2-order-001-mvp1/order-001-mvp/summary.md`
   - 操作単位の不足候補（Backlog化対象）:
     - EditorSet parity: medOrder/generalOrder 以外の entity を「flagなし標準UI」で編集できる入口（MVPでは `VITE_ORDER_EDIT_MVP=1` の範囲で order-edit 内の切替として追加済み）
     - StampBox parity: 大量スタンプの探索（ツリー/検索/プレビュー）と「どこからでも呼べる」入口（`STAMP-001` と連動）
     - 送信/診療終了の業務合格: 送信前チェックの運用（ガード理由/再送）と「診療終了」の意味（`FLOW-020` と連動）
5. P0 `REC-001` 受付一覧の status/例外/再送 MVP を feature flag で段階導入（CLAIM 前提操作は廃止方針により対象外/仕様差として明記）。
   - 実装（MVP）: `VITE_RECEPTION_STATUS_MVP=1/2`（一覧上の状態ドット + ORCA queue 状態 + 次アクション + 再送ボタン）
   - 実証: `20260207T070200Z-cmd_20260207_08_sub_3-rec-001-mvp`
   - 残: flag を既定ONにするタイミング、表示文言/色の最終レビュー、再送ボタンのロール制御（adminのみ等）の運用判断。
6. P1 `FLOW-020` 「診療終了（finish）」の意味（状態遷移と保証範囲）を定義し、Reception 反映までを検証して Evidence を追加する。
7. P1 `IMG-010` Schema parity decision and MVP: (1) decide target-in vs target-out, (2) if target-in, implement minimum operations: view existing schema, create new schema, draw/text/undo basic set, save, print/export, (3) add audit tags + verification steps.
8. P1 `LAB-001` Lab parity decision and MVP: (1) decide required use-cases (browse, trend, print, import), (2) if target-in, define data source (legacy REST vs modernized endpoint) and implement read-only panels first (list + detail + trend), (3) add print/PDF and verification artifacts.
9. P1 `AUTH-010` Admin CRUD gap closure: (1) list required ops from legacy (create/disable user, assign roles, facility info, password reset/change), (2) map to server endpoints/ownership, (3) implement minimal admin UI or explicitly target-out in docs with alternatives.
10. P1 `SCHED-001` Schedule scope closure: (1) define whether Reception appointment list replaces legacy schedule, (2) if not, implement schedule surface operations (view by date/provider, search, open Charts, create/cancel reservations), (3) explicitly drop legacy-only applyRp/CLAIM hooks or define replacements.

## Update Rules

- New evidence should add a short note and a pointer (RUN_ID + artifact path if available).
- If a row is `不明`, prefer converting it to `一部` with a concrete missing piece rather than keeping it unknown.
- When ashigaru6/8 inventory reports arrive, incorporate them and update counts (P0/P1/P2 and `不明`).
