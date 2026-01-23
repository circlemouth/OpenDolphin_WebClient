# テストデータと自動化基盤（preprod 実装課題インベントリ）

- RUN_ID: 20260123T104148Z
- 作業日: 2026-01-23
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/04_テストデータと自動化基盤.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769164820300-8e7ada
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 目的
- テストデータ/自動化基盤（seed, mock, E2E, 証跡保存）の不足点を明文化し、preprod 移行前の整備対象を整理する。

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `src/validation/E2E_統合テスト実施.md`
- `docs/preprod/implementation-issue-inventory/test-coverage.md`
- `docs/preprod/implementation-issue-inventory/test-e2e-scenarios.md`
- `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
- `ops/db/local-baseline/local_synthetic_seed.sql`

## YAML ID の位置づけ
- 本ドキュメントは計画 YAML（orca preprod implementation issue inventory plan 20260122）に紐づく実施記録であり、YAML ID は該当タスクのトレーサビリティを示す識別子である。
- `src/orca_preprod_implementation_issue_inventory_20260122/05_testing_review/04_テストデータと自動化基盤.md` はリポジトリ内に実体がないため、計画 YAML の ID のみを参照している。

## 確認スコープ
- 再現可能な seed データ
- Mock データ（MSW）
- E2E 自動化の前提と実行手順
- 証跡保存（ログ/スクリーンショット/実行メタ）

## 現状整理（テストデータと自動化のギャップ）
- E2E 実施手順は存在するが、前提として「患者/受付/印刷対象の事前準備」を要求しており、再現用データの具体セットが定義されていない。
- 既存の E2E 証跡は MSW ON を前提とした UI/監査中心で、実データ連携の自動化は未整備。
- ローカル合成 seed は `local_synthetic_seed.sql` で facility/user を供給するが、実運用シナリオ（受付→診療→会計→帳票）を再現する患者データは手動補正に依存している。
- ORCA 互換テストでは、患者/カルテ/受付の補正 SQL を都度投入しており、自動化されたデータ準備フローが存在しない。

## 課題一覧（テストデータと自動化）

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 項目 | 現状 | 課題/不足 | 影響 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| TD-01 | 再現用 seed データ | ローカル seed で facility/user を提供 | 受付/診療/会計/帳票の E2E に必要な患者・診療データセットが未定義。 | 再現性のないテストになり、検証が属人化する。 | P1 |
| TD-02 | ORCA 連携データ準備 | 手動 SQL で患者/カルテ補正 | ORCA Trial/実環境向けに、再現可能なデータ準備手順（投入/リセット）が整備されていない。 | Trial/本番相当の再検証が困難。 | P1 |
| TD-03 | MSW モック整合 | MSW 前提の UI 確認が中心 | MSW モックと ORCA 実応答の差分を吸収するテストデータ定義がなく、シナリオ間の整合が保証されない。 | 実データとの差分が検知しづらい。 | P2 |
| TD-04 | E2E 自動化手順 | 手動実行の記録のみ | CI 実行や再現スクリプトの標準化が未整備。runId ベースの手動記録に依存。 | 回帰検証の継続性が担保できない。 | P2 |
| TD-05 | 証跡保存の標準化 | artifacts 配下に手動保存 | ログ/スクリーンショット/メタ情報の集約フォーマットが未定義で、保管/検索が属人化。 | 監査・再現時の証跡探索コストが増大。 | P2 |

## 追加で必要な整備（候補）
- seed データの「シナリオ別データセット」（受付/診療/会計/帳票）の定義と投入スクリプト化。
- ORCA Trial/実環境のデータ準備・リセット手順をドキュメント化し、runId で追跡可能にする。
- MSW モックのシナリオ定義を実データの最小要件と一致させ、差分検証用のテストケースを追加。
- E2E 自動化の CI 手順（起動/データ投入/テスト実行/証跡保存）を標準化。
- 証跡保存フォーマット（runId/環境/データセット/結果）を統一し、検索可能な索引を作成。

## 完了条件（このドキュメントの範囲）
- テストデータ/自動化基盤に関する未整備点が明文化されていること。

## 備考
- ORCA 実環境のデータ準備は機微情報を含む可能性があるため、実施時は運用手順・アクセス制限を別途確認する。
