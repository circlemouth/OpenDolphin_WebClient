# 01_API互換レイヤー再確認とギャップ整理

- RUN_ID: `20251123T130134Z`
- 期間: 2025-11-25 09:00 〜 2025-11-27 09:00 (JST)
- 優先度: High / 緊急度: High
- エージェント: claude code
- YAML ID: `src/webclient_modernized_bridge/01_API互換レイヤー再確認とギャップ整理.md`

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## ゴールとスコープ
- `src/modernized_server/08_Webクライアント向けAPI安定化.md` の互換方針を再確認し、破壊的変更を吸収するパラメータ/レスポンス変換・feature flag の現状を明文化する。
- `docs/web-client/architecture/REST_API_INVENTORY.md` と `docs/web-client/process/API_UI_GAP_ANALYSIS.md` の差分（型・値域・エラーコード・未移植 UI）を列挙し、DoD を提示する。
- `artifacts/api-stability/20251120T191203Z` 既存モックの再利用可否を判断し、追加で必要なケースの作成方針を決める。

## 今日の整理結果（2025-11-23, RUN_ID=20251123T130134Z）
- 互換フラグと変換方針は 08 章のドラフトをベースに継続。`X-Client-Compat` で切り替える 5 本（doc update, LP only, ORCA trial 正規化, delete strict, roles/facility 補完）をそのまま維持する方針で合意。
- `REST_API_INVENTORY` と `API_UI_GAP_ANALYSIS` を突き合わせ、未吸収 or UI 未移植の差分を 6 項目に整理（下表）。DoD は「互換マッピング仕様をログに記載し、必要モック/期待値を追加してクライアントが即時検証できる状態」に設定。
- `artifacts/api-stability/20251120T191203Z` の MSW/期待値/ベンチマークは再利用可と判断。追加すべきモックは `/karte/modules`, `/karte/images`, `/chartEvent/dispatch`（LP/SSE デグレ再現）, `/stamp/tree/sync` の 4 ケース。新規アーティファクトは本 RUN_ID で `artifacts/api-stability/20251123T130134Z/` を掘り、必要分のみ追加する計画。

## 差分と吸収策（最新版ギャップ表）
| 領域 | ギャップ内容 | 必要な互換レイヤー/flag | DoD |
| --- | --- | --- | --- |
| カルテ更新 | Modernized は `PUT /karte/document/{id}`（タイトル限定）。Web クライアントは本文更新 `PUT /karte/document` を前提。 | `X-Client-Compat: legacy-doc-update` でボディから id を解決し本文更新を許可。デフォルトは Modernized 挙動を透過。 | 互換マッピングをログに明記し、doc update 期待 JSON（docinfo/documents）を `artifacts/api-stability/20251123T130134Z/schemas/` へ追加。 |
| ChartEvent | SSE `/chart-events` と LP `/chartEvent/subscribe` の併存。Legacy では LP のみ、Modernized は SSE 優先。 | `X-Client-Compat: lp-only` で LP を強制、SSE はフォールバック扱い。`Last-Event-ID` 欠落時に 0 補完。 | LP/SSE 切替のモックと 55s×5 タイムアウト再現を MSW に追加し、挙動を `logs/20251123T130134Z-webclient-api-compat.md` へ記録。 |
| ORCA wrapper | Trial 404/405 や `Api_Result` 欠落を Web 側で扱いにくい。 | `X-Client-Compat: orca-trial` で HTTP 404/405 を `200 + apiResult=79 + warning` へ正規化し、`apiResult` 無しは `00` で補完。 | tensu/disease 期待レスポンスに `apiResult` と warning header を追加した JSON を用意。 |
| 受付削除 | Legacy はボディ無し 204、Modernized は JSON 0/1 を返す場合がある。 | `X-Client-Compat: strict-delete` で 204 または空 JSON を強制。 | `/pvt` と `/pvt2` の delete 応答期待値を artifacts に追加し、MSW でも 204/空 JSON パスを再現。 |
| 添付/モジュール API | `REST_API_INVENTORY` で `/karte/modules/*` `/karte/images/*` が ⚠/未移植（UI も未移植）。 | 互換レイヤーは透過。MSW で placeholder 応答（空 list と必須メタ）を返し、UI 実装前でもクラッシュしない状態を保証。 | 空レスポンス期待値と MSW ハンドラを本 RUN_ID で追加。DoD=UI 実装前でも 200 + 空 list で通る。 |
| スタンプ同期 | `/stamp/tree/sync` は旧クライアント依存、UI 未実装。 | 互換層は 200 + no-op レスポンス（現行 tree をそのまま返す）を提供し、flag で OFF も可能にする。 | no-op 応答スキーマと MSW mock を追加し、README に flag 設定を追記。 |

## モック・計測資産の扱い
- **再利用**: `artifacts/api-stability/20251120T191203Z` の `msw-handlers.ts` と既存 4 シナリオ（docinfo/pvtList/user/tensu）はそのまま流用可。
- **追加（本 RUN_ID で作成予定）**: `/karte/modules`, `/karte/images`, `/chartEvent/dispatch`（LP/SSE 切替）, `/stamp/tree/sync`, `/pvt{,2}` delete 応答、ORCA warning 付きレスポンス。作成先は `artifacts/api-stability/20251123T130134Z/{mocks,schemas}/`。
- **ベンチマーク**: 11/25 以降に modernized-dev で `send_parallel_request.sh` を再実行し、pvtList seed 順序（seed→再起動 or `/pvt2` POST）を踏襲。結果は `artifacts/api-stability/20251123T130134Z/benchmarks/` に保存する。

## 次アクション（期限: 2025-11-27 09:00 JST）
1. 互換フラグ別の期待レスポンス JSON と MSW ハンドラを本 RUN_ID 配下に追加（上記 4 ケース＋delete/ORCA warning）。
2. `docs/server-modernization/phase2/operations/logs/20251123T130134Z-webclient-api-compat.md` にギャップ表とモック/計測計画を追記。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` に本ドキュメント行を追加し、備考へ RUN_ID・ログ・アーティファクトパスを記載。
