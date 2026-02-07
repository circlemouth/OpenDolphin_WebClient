# Mock Visibility Smoke (MSW ON/OFF)

## Metadata

- RUN_ID: 20260207T124047Z-cmd_20260207_14_sub_2-mock-visibility-smoke
- Started at (UTC): 2026-02-07T12:40:47Z
- Repo: OpenDolphin_WebClient master @ bb4d26377
- Goal: 画面別に「仮データ/モック表示」を実操作ベースで発見し、MSW ON/OFF で切り分け、P0/P1/P2化する。

## Summary

- P0 (prod混入で致命):
  - **MSW OFF（VITE_DISABLE_MSW=1）では、点検対象画面で「モック/仮データ」明示表示や seed/fixture 常時表示は確認できず**（証跡あり）。
- P1 (ユーザー混乱/軽微な誤誘導):
  - なし（本RUN範囲）
- P2 (debug専用/開発時のみ問題):
  - **MSW ON（VITE_DISABLE_MSW=0）では Reception/Charts に `電子カルテデモシェル` が表示され、Reception の行が seed で出現**（開発用途としては妥当。ただし誤設定でMSW ONになると混入するため運用注意）。

## Screens Covered (required)

- Reception
- Charts
- Patients
- Administration
- Print
- Images
- Mobile

## Evidence

- screenshots: `screenshots/`
- HAR: `har/`
- Run JSON (scan logs): `run-msw-on.json` / `run-msw-off.json`

## Findings

### MSW OFF (VITE_DISABLE_MSW=1)

- Reception:
  - receptionRowCount=0（seed行は出現せず）
  - Evidence: `screenshots/msw-off/reception.png`
- Charts:
  - Chartsは表示できるが、デモ/モック明示文言は検出されず
  - Evidence: `screenshots/msw-off/charts.png`, `screenshots/msw-off/charts-docked.png`, `screenshots/msw-off/charts-docked-imaging.png`
- Patients:
  - モック明示文言は検出されず
  - Evidence: `screenshots/msw-off/patients.png`
- Administration:
  - doctor role のため gate 表示（system_admin専用）になる可能性あり。モック明示文言は検出されず
  - Evidence: `screenshots/msw-off/administration.png`
- Print:
  - モック明示文言は検出されず
  - Evidence: `screenshots/msw-off/print-outpatient.png`
- Images (Charts docked imaging):
  - モック明示文言は検出されず（UIは表示）
  - Evidence: `screenshots/msw-off/charts-docked-imaging.png`
- Mobile:
  - MobileImages UI は表示（VITE_PATIENT_IMAGES_MOBILE_UI=1）。モック明示文言は検出されず
  - Evidence: `screenshots/msw-off/mobile-images.png`
- Network evidence:
  - `har/network-msw-off.har`

### MSW ON (VITE_DISABLE_MSW=0)

- Reception:
  - **`電子カルテデモシェル` が表示**（デモ明示）
  - receptionRowCount=5（seed行が出現）
  - Evidence: `screenshots/msw-on/reception.png`
- Charts:
  - **`電子カルテデモシェル` が表示**（デモ明示）
  - Charts URLに seed由来の query が含まれる（例: `patientId=000001` / `appointmentId=APT-2401` 等）
  - Evidence: `screenshots/msw-on/charts.png`, `screenshots/msw-on/charts-docked.png`, `screenshots/msw-on/charts-docked-imaging.png`
- Patients:
  - モック明示文言は検出されず（ただしMSW ONでのデータはモック応答の可能性あり）
  - Evidence: `screenshots/msw-on/patients.png`
- Administration:
  - doctor role のため gate 表示（system_admin専用）になる可能性あり。モック明示文言は検出されず
  - Evidence: `screenshots/msw-on/administration.png`
- Print:
  - モック明示文言は検出されず
  - Evidence: `screenshots/msw-on/print-outpatient.png`
- Images (Charts docked imaging):
  - `電子カルテデモシェル` 表示（上部シェル共通）
  - Evidence: `screenshots/msw-on/charts-docked-imaging.png`
- Mobile:
  - MobileImages UI は表示（VITE_PATIENT_IMAGES_MOBILE_UI=1）。モック明示文言は検出されず
  - Evidence: `screenshots/msw-on/mobile-images.png`
- Network evidence:
  - `har/network-msw-on.har`

## P0/P1/P2 Policy (working)

- P0: 本番相当に見える画面で dummy/sample/lorem 等が常時表示、または gate無しでMSW/fixtureが混入。
- P1: 説明文/placeholder/empty state にテスト語彙が残る、誤解を招くが実データとは区別できる。
- P2: debugページ/明示的な開発フラグON時のみ露出。
