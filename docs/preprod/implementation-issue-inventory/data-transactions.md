# トランザクション境界と整合性（preprod 実装課題インベントリ）

- RUN_ID: 20260122T193404Z
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

## 実測ログ（実行証跡）
### 成功ケース（RUN_ID=20260122T192701Z）
- 患者作成: `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-patient-mutation.json` / `.../response-patient-mutation.json` / `.../headers-patient-mutation.txt`
- 病名反映: `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-disease-mutation.json` / `.../response-disease-mutation.json` / `.../headers-disease-mutation.txt`
- 処方/オーダー反映: `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-order-bundle-mutation.json` / `.../response-order-bundle-mutation.json` / `.../headers-order-bundle-mutation.txt`
- 診療履歴取得: `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/request-medical-records.json` / `.../response-medical-records.json` / `.../headers-medical-records.txt`
- DB 差分: `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/db-before.txt` → `.../db-after.txt`

### 失敗ケース（RUN_ID=20260122T192940Z / 患者ID不整合）
- 患者作成成功（以降の API で異なる patientId を使用）
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/request-patient-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/response-patient-mutation.json`
- 病名/処方/診療履歴: patient_not_found（404）
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/response-disease-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/response-order-bundle-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/response-medical-records.json`
- DB 差分: `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/db-before.txt` → `.../db-after.txt`

### 付随観測（Order bundle 500 / schema mismatch）
- RUN_ID=20260122T192145Z: `/orca/order/bundles` が `bean_json` 欠落により RollbackException で 500
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192145Z/success/response-order-bundle-mutation.json`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192145Z/success/order-bundle-error.log`
- その後 `d_module.bean_json` を追加し、成功ケース（RUN_ID=20260122T192701Z）を再測定。

## 監査トランザクション境界の根拠（コード参照）
- `server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java`
  - `@Transactional(Transactional.TxType.REQUIRES_NEW)` で監査書き込みは独立トランザクション。
- `server-modernized/src/main/java/open/dolphin/security/audit/SessionAuditDispatcher.java`
  - `@Transactional(Transactional.TxType.NOT_SUPPORTED)` で業務トランザクションと分離して監査 + JMS 送信。
- `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java`
  - `recordAudit(...)` が `SessionAuditDispatcher` を経由して traceId/runId を付与して記録。
- `server-modernized/src/main/java/open/dolphin/session/PatientServiceBean.java`
  - `@Transactional` の中で `addPatient` → `ensureKarte` が実行され、患者と Karte 生成は同一トランザクション。
- `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaOrderBundleResource.java`
  - `karteServiceBean.addDocument(...)` で DB 書き込み。SQL 例外時は JTA が rollbackOnly となり 500 へ昇格（実測: bean_json 欠落）。

## 重複登録リスクと再試行条件
- `OrcaPatientResource` の `create` は事前の既存患者チェックがなく、`PatientServiceBean#addPatient` が `em.merge` → `ensureKarte` を実行するのみ。
- DB には `d_patient(facilityid, patientid)` の UNIQUE 制約があるため、同一 patientId の再試行は DB 例外となる可能性が高い（API 側で idempotent 応答に変換していない）。
- 再試行時は **既存患者の照合（GET or /orca/patient 検索）で重複回避** する必要がある。

## トランザクション境界の想定とリスク整理
| # | 境界/更新単位 | 失敗時の懸念 | 影響 | 既存証跡/参照 |
| --- | --- | --- | --- | --- |
| 1 | `/orca/patient/mutation`（患者作成 + Karte 自動生成） | DB シーケンス未作成時に患者作成が 500 で失敗。患者が作成されず Karte も生成されないが、再試行時に重複登録の懸念がある（外部 ORCA 側の ID 採番と local の採番が一致しない可能性）。 | 患者登録の重複/欠落、後続の病名/処方 API で 404/500 が発生。 | `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md` |
| 2 | `/orca/disease` / `/orca/disease/v3`（病名反映） | 患者作成と Karte 自動生成が完了していない場合、病名反映は 500/NoResult になる可能性。患者作成と病名反映が別トランザクションであるため、部分成功（患者作成のみ成功）が発生しうる。 | ORCA 側は病名登録成功、local 側は Karte 未生成で反映不可などの非整合。 | `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md`（患者作成後の連鎖成功が前提） |
| 3 | 監査記録（AuditTrail）と業務処理の境界 | 入力エラー時に監査書き込みと同一トランザクションで例外を投げると rollbackOnly になり、HTTP 500 に昇格・監査欠落が発生する。 | 失敗原因の監査欠落/誤った HTTP ステータスで再試行誘発。 | `docs/server-modernization/phase2/notes/domain-transaction-parity.md` |
| 4 | UI/E2E 確認範囲と患者作成フローの乖離 | E2E 実行は非カルテ領域に集中し、患者作成〜Karte 生成〜病名/処方/オーダーの複合更新を担保していない。 | preprod で複合更新の整合性が未検証のまま残る。 | `src/validation/E2E_統合テスト実施.md` |
| 5 | `/orca/order/bundles`（処方/オーダー束） | `d_module.bean_json` 欠落時に SQL 例外 → RollbackException → 500。患者作成や病名は成功済みでもオーダーだけ失敗する。 | 部分成功が残り、診療行為の反映漏れ・再試行判断ミスが発生。 | `docs/preprod/implementation-issue-inventory/evidence/20260122T192145Z/success/order-bundle-error.log` |

## 追加で懸念される整合性リスク
- **部分成功のロールバック不足**: 患者作成と Karte 生成、病名/処方/オーダー反映が別トランザクションの場合、先行処理の成功が残り後続が失敗する可能性がある。ORCA 側/ローカル DB のどちらに成功が残ったかを追跡できないと再試行で重複登録が発生する。
- **重複登録リスク**: 患者作成 API の再試行時に、外部 ORCA 側で同一患者が二重に作成されるか、local で既存患者と結び付かない ID が生成される懸念がある。
- **監査証跡の欠落**: 監査記録が業務処理と同一トランザクションにある場合、失敗時に監査レコードがロールバックされ、原因追跡が困難になる。

## 影響整理（preprod での実務影響）
- 患者作成〜Karte 生成に失敗すると、病名/処方/オーダー反映が連鎖的に失敗し、診療フローの再試行で重複登録が発生する。
- 監査ログが欠落すると、E2E で UI 操作を確認しても DB 上の整合性が検証できず、原因切り分けが困難になる。
- `/orca/order/bundles` の schema 不整合（`bean_json` 欠落）は、処方/オーダーだけ 500 となる部分成功を発生させ、現場で「患者は作成できたがオーダーが残らない」状態を引き起こす。

## 検証結果（実測ベース）
- 成功ケースでは患者 1 / Karte 1 / 病名 1 / ドキュメント 2 が追加され、`/orca/medical/records` の records に 2 件が返却された。
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/db-before.txt`
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192701Z/success/db-after.txt`
- 失敗ケース（患者ID不整合）では患者作成のみ成功し、病名/オーダー/診療履歴は 404 で失敗。DB は患者+Karte が残る部分成功となった。
  - `docs/preprod/implementation-issue-inventory/evidence/20260122T192940Z/failure/db-after.txt`
- Order bundle は `d_module.bean_json` 欠落時に JTA が rollbackOnly となり 500（実測ログ参照）。

## 追加確認が必要なポイント（未実施）
1. ORCA 実環境（WebORCA Trial 以外）で同一 RUN_ID の複合更新を再走し、ORCA 側の採番/反映状況と local DB の差分を突合する。
2. `d_module.bean_json` を含む schema 差分の恒久マイグレーション手順を整理し、preprod 起動時に自動適用する。
3. 患者作成の再試行時に既存患者を返すか、重複作成を防ぐ idempotency 対応を API 側で実装するか方針決定。

## まとめ（整合性リスクと影響）
- 複合更新（患者作成→Karte→病名/処方/オーダー）は複数トランザクションに跨る可能性が高く、部分成功時のロールバック不足と重複登録リスクが残る。
- 監査記録が業務処理と同一トランザクションの場合、失敗時に監査欠落と HTTP 500 昇格が発生し、運用上の再試行判断を誤らせる。
- E2E 統合テストの範囲は非カルテ領域が中心であり、複合更新の整合性は別途検証が必要。
- 実測では患者作成のみ成功し病名/処方/オーダーが失敗する部分成功が確認でき、再試行時の重複・欠落リスクが顕在化した。
