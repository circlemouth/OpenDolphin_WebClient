# RUN_ID=20251217T120220Z / Charts 診療終了ガード・キュー再取得 UX 具体化

- 親 RUN_ID: `20251217T114331Z`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`。
- 対象: 診療終了のガード条件に READY_TO_CLOSE を分離し、ORCA キュー再取得の回数・バックオフ・UX を具体化。

## 追加で決めたこと
1. 状態に `READY_TO_CLOSE` を追加し、未保存/送信待ちが解消した瞬間に success (subtle) ピル＋info バナーで「終了可能」を 1 回だけ告知。DIRTY/QUEUE_PENDING が復活したら自動で OPEN に戻す。
2. ORCAキュー再取得は自動バックオフ 5s→15s→45s（最大3回）。全失敗時のみ CTA「キューを再取得」を残し、成功して `pending=0` を確認したら自動で READY_TO_CLOSE へ遷移し、ToneBanner を info に切替える。
3. 終了ボタン disable 理由を `data-disabled-reason` に `dirty|queue_pending|missing_master|fallback_used|session_invalid` で固定し、同じ文字列を tooltip/監査(reason) に再利用。ActionBar は disable するだけでリクエストを送らない。

## 変更ファイル
- `src/charts_production_outpatient/workflow/31_診療開始終了の状態遷移.md`

## 未実装メモ
- キュー再取得のバックオフ実装、READY_TO_CLOSE ピル表示、`queue_refresh_failed` tooltip は次タスクで実装・E2E 追加。
