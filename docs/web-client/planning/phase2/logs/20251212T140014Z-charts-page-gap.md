# ChartsPage 現状棚卸しとギャップ（RUN_ID=`20251212T140014Z`）

- 目的: `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md`（2.4 Charts）と `web-client/src/features/charts/*` を突き合わせ、未実装/未統合の UI・フロー・監査項目を列挙して P0/P1/P2 を確定する。
- 成果物: `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md`

## 突き合わせ対象（主要ファイル）
- 計画: `docs/web-client/planning/phase2/WEB_CLIENT_IMPLEMENTATION_PLAN.md`
- 実装:
  - `web-client/src/features/charts/pages/ChartsPage.tsx`
  - `web-client/src/features/charts/ChartsActionBar.tsx`
  - `web-client/src/features/charts/DocumentTimeline.tsx`
  - `web-client/src/features/charts/OrcaSummary.tsx`
  - `web-client/src/features/charts/PatientsTab.tsx`
  - `web-client/src/features/charts/api.ts`
  - `web-client/src/features/reception/api.ts`（Charts が流用する API 実装）
  - `web-client/src/AppRouter.tsx`（Reception→Charts の入口）

## 手順（棚卸し）
1. 計画書 2.4（Charts）の UI/フロー/監査/テレメトリ項目を箇条書き抽出。
2. 上記の項目に対し、実装側で “存在するコンポーネント/データ取得/監査ログ/通知” を対応付け。
3. 未統合箇所を “運用不可(P0) / 運用に支障(P1) / 品質改善(P2)” に分類。
4. Charts に閉じない依存（Reception/Patients/Administration）を入口/出口として整理し、責務分離の決定案を作成。

## 主要な判断
- 現状の Charts は “デモシェル” として価値がある一方、本番運用の DoD（業務結果 + 監査 + 復旧導線）を満たすには P0 が多い。
- “患者コンテキスト” は `location.state` ではなく URL / 再取得で復元できる形に寄せる（再読込耐性を最優先）。

