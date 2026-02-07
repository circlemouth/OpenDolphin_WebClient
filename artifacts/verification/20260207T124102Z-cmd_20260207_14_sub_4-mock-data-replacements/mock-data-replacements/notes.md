# cmd_20260207_14_sub_4: mock-data replacements (P0)

RUN_ID: 20260207T124102Z-cmd_20260207_14_sub_4-mock-data-replacements

## Goal
- P0の「仮データ/モック表示」を撤廃し、実データ表示 or 適切な空状態/権限不足/未登録/404/422 + 次アクションへ置換する（フロント）。
- 禁止: CLAIM 復活（未実施）。

## Replacements (>=3)

### 1) Patients: SAMPLE_PATIENTS fallback を撤廃 (P0)
- Before: `/orca/patients/local-search` が `200 + patients=[] + errorなし` の場合でも `SAMPLE_PATIENTS` を表示し得る。
- After: 常にAPI結果の `patients` のみを採用し、空配列は空状態表示へ。
- File:
  - `OpenDolphin_WebClient/web-client/src/features/patients/api.ts`

### 2) Patients: 空状態/権限不足/422 をUI統一 + 次アクション (P0)
- Before: `patients.length===0` は一律で「0件です。キーワードを見直してください。」になり、403/404/422/通信断の区別が弱い。
- After: `status`/`error`/filter有無から分類し、メッセージ + 次アクション（再取得 / Receptionへ）を表示。
  - 403: 権限不足（管理者へ）
  - 404: APIが見つからない（設定確認）
  - 422: 入力不備（条件見直し）
  - 通信断: 通信エラー（再取得）
  - 0件: 未登録 or 該当なし（Receptionへ/条件見直し）
- Files:
  - `OpenDolphin_WebClient/web-client/src/features/patients/PatientsPage.tsx`
  - `OpenDolphin_WebClient/web-client/src/features/patients/patients.css`

### 3) Charts: PatientsTab の「このデモでは…」文言を撤去し、次アクションへ (P0)
- Before: 受診履歴0件時に「このデモでは外来一覧の範囲内のみ表示」と表示。
- After: 「全期間検索/期間/キーワード見直し」を促す文言に置換（機能は変更せず、表示のみ）。
- File:
  - `OpenDolphin_WebClient/web-client/src/features/charts/PatientsTab.tsx`

## Evidence (masked screenshots + HAR)
- `screenshots/before/` / `screenshots/after/`
  - patients empty200 (sample fallback):
    - before: `patients-empty200-1366x768.png`, `patients-empty200-1440x900.png`
    - after : `patients-empty200-1366x768.png`, `patients-empty200-1440x900.png`
  - patients 403:
    - before: `patients-forbidden403-1366x768.png`, `patients-forbidden403-1440x900.png`
    - after : `patients-forbidden403-1366x768.png`, `patients-forbidden403-1440x900.png`
  - patients 422:
    - before: `patients-unprocessable422-1366x768.png`, `patients-unprocessable422-1440x900.png`
    - after : `patients-unprocessable422-1366x768.png`, `patients-unprocessable422-1440x900.png`
- `har/before/` / `har/after/`
  - `patients-*.har`（Playwright recordHar, synthetic responses; no real patient data）

## How to reproduce evidence
- Vite: `VITE_DISABLE_MSW=1 pnpm dev -- --port 5173 --strictPort`
- Playwright route interception used to force:
  - `POST /orca/patients/local-search` (+ `/mock`) -> 200(empty)/403/422
- Screenshots are masked via CSS blur.
