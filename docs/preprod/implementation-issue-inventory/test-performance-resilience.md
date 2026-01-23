# 性能・負荷と回復性テスト（preprod 実装課題インベントリ）

- RUN_ID: 20260123T053000Z
- 作業日: 2026-01-23
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/03_性能負荷と回復性テスト.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769143735707-734647
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 目的
- 性能/負荷/回復性のテスト不足を明文化し、preprod 移行前に必要な検証観点を整理する。

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/preprod/implementation-issue-inventory/test-coverage.md`
- `docs/preprod/implementation-issue-inventory/test-e2e-scenarios.md`
- `docs/preprod/implementation-issue-inventory/server-jobs-queue.md`
- `docs/preprod/implementation-issue-inventory/webclient-error-recovery.md`
- `src/charts_production_outpatient/quality/53_障害注入_タイムアウト_スキーマ不一致.md`
- `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`

## YAML ID の位置づけ
- 本ドキュメントは計画 YAML（orca preprod implementation issue inventory plan 20260122）に紐づく実施記録であり、YAML ID は該当タスクのトレーサビリティを示す識別子である。

## 確認スコープ
- 同時アクセス（受付/Charts/Patients/Administration）
- API レート制限・キュー詰まり
- 障害復旧シナリオ（依存サービス/ネットワーク/再起動）

## 現状の整理（性能・回復性の実測不足）
- E2E は MSW 前提が中心で、実環境レートや同時アクセスの負荷指標が未測定。
- ORCA Trial/実環境での API 連携は疎通証跡中心で、性能 SLA を測るためのログ設計が不足。
- 再送/復旧導線の UI は整備途上で、障害注入・耐障害の検証は未実施。

## 未定義・不足している計測指標
- API レスポンス時間（p50/p95/p99）と UI 反映時間の定義がない。
- 受付・診療・会計・帳票の主要 API の許容レイテンシが未定義。
- エラー率（HTTP 5xx/4xx/timeout）と再試行回数の許容値が未定義。
- バックグラウンドキュー（ORCA queue / 配信キュー）の遅延許容値が未設定。

## 試験環境の不足点
- 同時アクセス（複数端末/ユーザー）の負荷を再現する環境・スクリプトが未整備。
- ORCA Trial の API 制約により、実負荷や高頻度呼び出しの検証が難しい。
- 監査ログ/traceId の集約先が分散し、性能測定用の一元ログが未整備。

## 課題一覧（性能・負荷・回復性）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 項目 | 現状 | 課題/不足 | 影響 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| PR-01 | 同時アクセス負荷 | 実測なし | Reception/Charts/Patients の同時アクセス時の UI/API レイテンシ測定がない。 | 本番時のピーク負荷に耐えられるか不明。 | P2 |
| PR-02 | API レート制限 | 設計未定義 | 連続送信/再送の上限、バックオフ規約が未定義。 | 連続送信で ORCA/自前 API が不安定になる。 | P2 |
| PR-03 | キュー遅延 | 閾値未定義 | ORCA queue / 配信キューの遅延閾値・再試行ポリシーが未確定。 | 配信遅延の検知が遅れ、診療フローが停止する。 | P2 |
| PR-04 | 依存サービス障害 | テスト未実施 | DB/ORCA/MinIO 停止時の復旧テストがない。 | 障害時の復旧手順と UI 表示が確認できない。 | P1 |
| PR-05 | ネットワーク断 | テスト未実施 | offline/timeout/再接続の負荷・復旧試験が未実施。 | 現場ネットワーク障害時の動作保証がない。 | P2 |
| PR-06 | 監査ログ性能 | 指標未定義 | 監査ログ書き込み負荷と可観測性の指標がない。 | 高負荷時に監査ログ欠落の可能性。 | P2 |

## 追加で必要なテスト観点（候補）
- 受付/診療/会計の主要 API を対象に、同時アクセス（5/10/30 ユーザー）で p95 を計測。
- 送信/再送のバックオフ規約と連続送信上限の検証（Api_Result!=0 を含む）。
- ORCA queue / 配信キューの遅延検知（閾値越えで UI バナー/監査ログの確認）。
- DB/ORCA/MinIO の停止・再起動を行い、復旧時の UI/監査ログが整合するか確認。
- ネットワーク断→復帰時の再取得導線・再送キューの整合検証。

## 測定設計メモ（最低限）
### 同時アクセス
- 指標: API p95/p99、画面反映までの UI p95。
- 条件: 受付/Charts/Patients/Administration を 5/10/30 同時セッションで実行し、同一操作のレイテンシを比較。

### API レート
- 指標: 連続送信時の p95、エラー率（5xx/timeout）、再試行回数。
- 条件: 同一 API を 1 分あたり一定回数で送信し、バックオフ有無での差分を記録。

### 障害復旧
- 指標: 復旧時間（サービス復帰から UI 復旧まで）、再送成功率、監査ログ欠落率。
- 条件: DB/ORCA/MinIO 停止→再起動、ネットワーク断→復帰のシナリオで復旧手順を実行。

## 完了条件（このドキュメントの範囲）
- 性能・負荷・回復性の課題が明文化され、計測指標と試験環境の不足点が整理されていること。

## 備考
- 具体的なベンチマーク値と SLA は未合意のため、数値は本ドキュメントでは未設定。
- 実 ORCA 連携での負荷検証は機微情報を含む可能性があるため、実施時は運用手順の指示が必要。
