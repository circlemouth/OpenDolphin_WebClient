# トランザクション境界と整合性（preprod 実装課題インベントリ）

- RUN_ID: 20260122T184143Z
- 作業日: 2026-01-22
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/02_トランザクション境界と整合性.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769107216118-849c4d
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `src/validation/E2E_統合テスト実施.md`
- `docs/server-modernization/phase2/notes/domain-transaction-parity.md`（Legacy/Archive）
- `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md`（Legacy/Archive）

## 対象フロー（確認スコープ）
- 患者作成 → Karte 自動生成 → 病名/処方/オーダー反映
- ORCA 連携 API（/orca/patient/mutation, /orca/disease, /orca/medical/records 等）と local DB 書き込みの整合性
- 監査ログ/トレースの整合（失敗時に 500 へ昇格しないか）

## 事実整理（既存資料から読み取れること）
- ORCA Trial では `/orca/patient/mutation` の患者作成時に Karte 自動生成を実測し、正常レスポンスが得られている。`d_karte_seq` 不在時は 500 で失敗し、シーケンス追加後に成功している。患者作成と Karte 生成は DB の前提（シーケンス）に依存し、欠落時にロールバックされる。
- `domain-transaction-parity.md` の Trace/JPQL 確認では、入力エラーや認証エラー時に Audit 記録と同一トランザクションで例外を投げると 500 に昇格しうることが示されている（BadRequest でも rollbackOnly）。監査と業務処理の境界が曖昧な場合、失敗時の監査欠落やレスポンスの不一致が起きる。
- E2E 統合テストは主に非カルテ領域での UI/監査イベント連携を確認しており、患者作成〜カルテ生成の複合更新を直接検証していない。したがって、E2E 証跡のみでは複合更新の一貫性を保証できない。

## トランザクション境界の想定とリスク整理
| # | 境界/更新単位 | 失敗時の懸念 | 影響 | 既存証跡/参照 |
| --- | --- | --- | --- | --- |
| 1 | `/orca/patient/mutation`（患者作成 + Karte 自動生成） | DB シーケンス未作成時に患者作成が 500 で失敗。患者が作成されず Karte も生成されないが、再試行時に重複登録の懸念がある（外部 ORCA 側の ID 採番と local の採番が一致しない可能性）。 | 患者登録の重複/欠落、後続の病名/処方 API で 404/500 が発生。 | `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md` |
| 2 | `/orca/disease` / `/orca/disease/v3`（病名反映） | 患者作成と Karte 自動生成が完了していない場合、病名反映は 500/NoResult になる可能性。患者作成と病名反映が別トランザクションであるため、部分成功（患者作成のみ成功）が発生しうる。 | ORCA 側は病名登録成功、local 側は Karte 未生成で反映不可などの非整合。 | `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md`（患者作成後の連鎖成功が前提） |
| 3 | 監査記録（AuditTrail）と業務処理の境界 | 入力エラー時に監査書き込みと同一トランザクションで例外を投げると rollbackOnly になり、HTTP 500 に昇格・監査欠落が発生する。 | 失敗原因の監査欠落/誤った HTTP ステータスで再試行誘発。 | `docs/server-modernization/phase2/notes/domain-transaction-parity.md` |
| 4 | UI/E2E 確認範囲と患者作成フローの乖離 | E2E 実行は非カルテ領域に集中し、患者作成〜Karte 生成〜病名/処方/オーダーの複合更新を担保していない。 | preprod で複合更新の整合性が未検証のまま残る。 | `src/validation/E2E_統合テスト実施.md` |

## 追加で懸念される整合性リスク
- **部分成功のロールバック不足**: 患者作成と Karte 生成、病名/処方/オーダー反映が別トランザクションの場合、先行処理の成功が残り後続が失敗する可能性がある。ORCA 側/ローカル DB のどちらに成功が残ったかを追跡できないと再試行で重複登録が発生する。
- **重複登録リスク**: 患者作成 API の再試行時に、外部 ORCA 側で同一患者が二重に作成されるか、local で既存患者と結び付かない ID が生成される懸念がある。
- **監査証跡の欠落**: 監査記録が業務処理と同一トランザクションにある場合、失敗時に監査レコードがロールバックされ、原因追跡が困難になる。

## 影響整理（preprod での実務影響）
- 患者作成〜Karte 生成に失敗すると、病名/処方/オーダー反映が連鎖的に失敗し、診療フローの再試行で重複登録が発生する。
- 監査ログが欠落すると、E2E で UI 操作を確認しても DB 上の整合性が検証できず、原因切り分けが困難になる。

## 追加確認が必要なポイント（未実施）
1. 患者作成 → Karte 自動生成 → 病名/処方/オーダー反映を同一 RUN_ID で連続実行し、失敗時にロールバックされる対象（local/orca）を明文化する。
2. 患者作成失敗時に ORCA 側・local 側の採番差分が残るかを検証し、再試行手順と重複回避ルールを整理する。
3. 監査記録の書き込み境界が業務処理と分離されているか、400/500 境界の再確認を行う。

## まとめ（整合性リスクと影響）
- 複合更新（患者作成→Karte→病名/処方/オーダー）は複数トランザクションに跨る可能性が高く、部分成功時のロールバック不足と重複登録リスクが残る。
- 監査記録が業務処理と同一トランザクションの場合、失敗時に監査欠落と HTTP 500 昇格が発生し、運用上の再試行判断を誤らせる。
- E2E 統合テストの範囲は非カルテ領域が中心であり、複合更新の整合性は別途検証が必要。
