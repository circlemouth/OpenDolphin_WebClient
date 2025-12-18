# 33 ORCA 送信フロー（送信前チェック）（RUN_ID=`20251217T233430Z`）

## 目的
- “送信不可” の条件（`missingMaster=true`/権限不足/未保存ドラフト/通信不安定など）を **列挙して UI で明確にブロック**する。
- 送信開始→進行中→成功/失敗を **一貫した状態モデル**で表示し、再試行・中断・証跡（`traceId`/`runId`）を残す。
- 送信失敗時は “次にやること（受付へ戻る/再取得/設定確認）” を提示する。

## 前提
- 本フローはモダナイズ版サーバー連携を前提とする（`WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`）。
- 送信 API 呼び出しは `ORCA queue` を起点に実施し、結果の詳細は claim/outpatient 再取得で可視化する。

## UI の責務（送信前チェック）
Charts の “送信系操作” は、送信前チェックでブロック理由を **複数同時に**表示し、ボタン disable と読み上げを一致させる。

### ブロック条件（例）
| 条件 | ブロック理由（UI） | 次にやること（UI が提示する導線） |
| --- | --- | --- |
| `missingMaster=true` | マスタ欠損のため送信不可 | Reception で master 再取得 → 再送 |
| `fallbackUsed=true` | フォールバック経路のため送信不可 | Reception で再取得 → 再送 |
| 未保存ドラフトあり | 送信前にドラフト保存が必要 | ドラフト保存 / 不要なら入力を戻す |
| offline | ブラウザが offline | 通信回復を待つ / 設定確認 |
| 通信不安定（直近の取得エラー） | 直近の外来取得が不安定 | 再取得してから再送 / Reception へ戻る |
| 権限不足（401/403） | 認証/権限が不足 | 再ログイン / 設定確認 |
| UI ロック中 | 他操作が進行中 | ロック解除 / 処理完了待ち |

## 状態モデル（送信操作）
送信ボタン押下からの状態を 1 つの UI コンポーネントで一貫表示する。

1. **開始**: トーストに `runId`/`traceId`/`dataSourceTransition` を表示し、監査/テレメトリに `outcome=started` を記録。
2. **進行中**: スケルトン＋トーストで進行中を表示。送信中断（Abort）を提供。
3. **成功**: トーストに `runId`/`traceId`/`requestId` を表示。必要に応じて claim/summary を再取得して画面の状態（キュー/請求）を更新。
4. **失敗**: トーストに証跡を表示し、`次にやること`（再ログイン/再取得/Receptionへ戻る）を固定文言で提示。再試行（Retry）を提供。

## 実装マッピング（現行）
- 送信前チェックと状態表示: `web-client/src/features/charts/ChartsActionBar.tsx`
  - ガード表示: `role="note"` の領域に理由+次アクションを列挙し、送信ボタン `aria-describedby` で紐付け。
  - 送信中断: `AbortController` により “送信を中断” を実装。
  - 証跡表示: `runId`/`traceId`/`requestId` をトーストに併記。
- 未保存ドラフト検知: `web-client/src/features/charts/PatientsTab.tsx` → `web-client/src/features/charts/pages/ChartsPage.tsx`
- 権限判定補助: `web-client/src/libs/http/httpClient.ts`（`hasStoredAuth()`）

## 証跡
- 実装ログ: `docs/web-client/planning/phase2/logs/20251217T233430Z-charts-orca-send-precheck.md`

