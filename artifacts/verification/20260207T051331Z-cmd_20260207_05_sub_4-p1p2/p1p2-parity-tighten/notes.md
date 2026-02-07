# P1/P2 Parity Tightening Notes

RUN_ID: 20260207T051331Z-cmd_20260207_05_sub_4-p1p2

## Goal

Tighten ambiguous P1/P2 rows with evidence and converge Status; concretize Backlog Top10 items 4-10 into operation units.

## Key Evidence (Web)

- `web-client/src/features` contains the main surfaces: `administration/`, `charts/`, `patients/`, `reception/`.
- No `web-client/src/features/schedule` directory found; no facility schedule page implementation found.
- No appointment mutation flow found (no `appointments/mutation`, `appointmodv2`, etc.).
- Lab and schema/image features are not present as first-class Web surfaces; legacy REST can be probed via debug/admin tools.

Relevant files:
- Administration config/delivery and ORCA probes: `web-client/src/features/administration/AdministrationPage.tsx`, `web-client/src/features/administration/api.ts`
- Legacy REST probes:
  - Debug console: `web-client/src/features/debug/LegacyRestConsolePage.tsx`
  - Admin panel: `web-client/src/features/administration/LegacyRestPanel.tsx`
  - Endpoint list includes `/schedule`, `/lab`, etc: `web-client/src/features/debug/legacyRestApi.ts`

## Key Evidence (Legacy)

- User/facility admin and project settings:
  - `client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java`
  - `client/src/main/java/open/dolphin/impl/profile/ChangePasswordImpl.java`
  - `client/src/main/java/open/dolphin/project/ProjectSettingDialog.java`
- Schedule (planned chart) plugin:
  - `client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java`
- Lab:
  - `client/src/main/java/open/dolphin/impl/lbtest/LaboTestPanel.java`
  - `client/src/main/java/open/dolphin/impl/lbtest/LaboTestOutputPDF.java`
- Schema/image:
  - `client/src/main/java/open/dolphin/impl/schema/SchemaEditorImpl.java`
  - `client/src/main/java/open/dolphin/impl/img/ImageBrowserProxy.java`

## Parity Row Decisions

- AUTH-010 -> `未実装` (no Dolphin user CRUD UI in Web; Web admin is primarily delivery/config and probes)
- AUTH-020 -> `一部` (config/delivery visibility exists; license/activity via legacy REST probes only; project settings parity missing)
- SCHED-001/SCHED-010 -> `未実装` (no schedule surface / appointment mutation)
- LAB-001 -> `未実装` (legacy has lab panels; Web lacks lab surface)
- IMG-010/IMG-020 -> `未実装`

## Backlog Rewrite (4-10)

Rewrote items 4-10 as operation-level actions (MVP definition, implementation, verification), removing "要調査" placeholders.

