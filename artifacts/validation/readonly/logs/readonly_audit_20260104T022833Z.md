# readOnly 状態遷移確認ログ

RUN_ID: 20260104T022833Z
Facility: 1.3.6.1.4.1.9414.10.1

## 確認メモ

- scenario=patient-normal / screen=outpatient-mock
  - note: RUN_ID: 20251212T143720Z ／ dataSourceTransition: server ／ cacheHit: true ／ missingMaster: false ／ resolveMasterSource: server
- scenario=patient-normal / screen=patients
  - badges: RUN_ID
20251212T143720Z
コピー
missingMaster
false
fallbackUsed
false
cacheHit
true
dataSourceTransition
server
recordsReturned
3
  - block: none
  - audit: 監査ログビュー
履歴を更新
フィルタ初期化
キーワード
outcome
全件
success
error
warning
partial
unknown
対象
選択患者のみ
全患者
並び順
新しい順
古い順
件数
10件
20件
50件
全件
開始日
終了日
対象件数: 2
保存結果
未送信
runId=20251212T143720Z ／ status=— ／ endpoint=—
ORCA反映
未送信
保存操作がまだありません
現在の反映可否
反映可能
server ルートで ORCA 反映可能
最新 auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:01.937Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z

APPOINTMENT_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:01.024Z
endpoint: /api01rv2/appointment/outpatient/list
CLAIM_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:01.022Z
endpoint: /api01rv2/claim/outpatient
- scenario=patient-normal / screen=charts
  - badges: missingMaster
false
cacheHit
true
fallbackUsed
false
role
reception
  - guard: 閲覧モード（編集は権限とガード条件を満たす場合のみ）
  - audit: auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:01.937Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z
- scenario=patient-missing-master / screen=outpatient-mock
  - note: RUN_ID: 20251212T143720Z ／ dataSourceTransition: server ／ cacheHit: false ／ missingMaster: true ／ resolveMasterSource: mock
- scenario=patient-missing-master / screen=patients
  - badges: RUN_ID
20251212T143720Z
コピー
missingMaster
true
fallbackUsed
false
cacheHit
false
dataSourceTransition
server
recordsReturned
3
  - block: 編集をブロックしました
missingMaster=true: ORCAマスタ未取得のため編集不可

Reception で master を再取得してから再試行してください。

現在の ORCA 状態: 反映停止（missingMaster=true のため ORCA 反映を停止中）
  - audit: 監査ログビュー
履歴を更新
フィルタ初期化
キーワード
outcome
全件
success
error
warning
partial
unknown
対象
選択患者のみ
全患者
並び順
新しい順
古い順
件数
10件
20件
50件
全件
開始日
終了日
対象件数: 2
保存結果
未送信
runId=20251212T143720Z ／ status=— ／ endpoint=—
ORCA反映
未送信
保存操作がまだありません
現在の反映可否
反映停止
missingMaster=true のため ORCA 反映を停止中
最新 auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:35.967Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z

APPOINTMENT_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:35.096Z
endpoint: /api01rv2/appointment/outpatient/list
CLAIM_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:35.095Z
endpoint: /api01rv2/claim/outpatient
- scenario=patient-missing-master / screen=charts
  - badges: missingMaster
true
cacheHit
false
fallbackUsed
false
role
reception
  - guard: 編集不可（master/tone ガード）: missingMaster=true / fallbackUsed=false / dataSourceTransition=server
  - audit: auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:35.967Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z
- scenario=patient-fallback / screen=outpatient-mock
  - note: RUN_ID: 20251212T143720Z ／ dataSourceTransition: fallback ／ cacheHit: false ／ missingMaster: true ／ resolveMasterSource: mock
- scenario=patient-fallback / screen=patients
  - badges: RUN_ID
20251212T143720Z
コピー
missingMaster
true
fallbackUsed
true
cacheHit
false
dataSourceTransition
fallback
recordsReturned
3
  - block: 編集をブロックしました
missingMaster=true: ORCAマスタ未取得のため編集不可
fallbackUsed=true: フォールバックデータのため編集不可
dataSourceTransition=fallback: 非serverルートのため編集不可

Reception で master を再取得してから再試行してください。

現在の ORCA 状態: 反映停止（missingMaster=true のため ORCA 反映を停止中）
  - audit: 監査ログビュー
履歴を更新
フィルタ初期化
キーワード
outcome
全件
success
error
warning
partial
unknown
対象
選択患者のみ
全患者
並び順
新しい順
古い順
件数
10件
20件
50件
全件
開始日
終了日
対象件数: 2
保存結果
未送信
runId=20251212T143720Z ／ status=— ／ endpoint=—
ORCA反映
未送信
保存操作がまだありません
現在の反映可否
反映停止
missingMaster=true のため ORCA 反映を停止中
最新 auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:39.574Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z

CLAIM_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:38.678Z
endpoint: /api01rv2/claim/outpatient
APPOINTMENT_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:38.678Z
endpoint: /api01rv2/appointment/outpatient/list
- scenario=patient-fallback / screen=charts
  - badges: missingMaster
true
cacheHit
false
fallbackUsed
true
role
reception
  - guard: 編集不可（master/tone ガード）: missingMaster=true / fallbackUsed=true / dataSourceTransition=fallback
  - audit: auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:39.574Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z
- scenario=snapshot-missing-master / screen=outpatient-mock
  - note: RUN_ID: 20251212T143720Z ／ dataSourceTransition: snapshot ／ cacheHit: false ／ missingMaster: true ／ resolveMasterSource: mock（読込中…）
- scenario=snapshot-missing-master / screen=patients
  - badges: RUN_ID
20251212T143720Z
コピー
missingMaster
true
fallbackUsed
false
cacheHit
false
dataSourceTransition
snapshot
recordsReturned
3
  - block: 編集をブロックしました
missingMaster=true: ORCAマスタ未取得のため編集不可
dataSourceTransition=snapshot: 非serverルートのため編集不可

Reception で master を再取得してから再試行してください。

現在の ORCA 状態: 反映停止（missingMaster=true のため ORCA 反映を停止中）
  - audit: 監査ログビュー
履歴を更新
フィルタ初期化
キーワード
outcome
全件
success
error
warning
partial
unknown
対象
選択患者のみ
全患者
並び順
新しい順
古い順
件数
10件
20件
50件
全件
開始日
終了日
対象件数: 2
保存結果
未送信
runId=20251212T143720Z ／ status=— ／ endpoint=—
ORCA反映
未送信
保存操作がまだありません
現在の反映可否
反映停止
missingMaster=true のため ORCA 反映を停止中
最新 auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:43.357Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z

APPOINTMENT_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:42.483Z
endpoint: /api01rv2/appointment/outpatient/list
CLAIM_OUTPATIENT_FETCH
outcome: success
ORCA: 反映停止
patientId: 000001
runId: 20251212T143720Z
traceId: trace-20251212T143720Z
requestId: —
2026-01-04T02:54:42.482Z
endpoint: /api01rv2/claim/outpatient
- scenario=snapshot-missing-master / screen=charts
  - badges: missingMaster
true
cacheHit
false
fallbackUsed
false
role
reception
  - guard: 編集不可（master/tone ガード）: missingMaster=true / fallbackUsed=false / dataSourceTransition=snapshot
  - audit: auditEvent

action: PATIENT_OUTPATIENT_FETCH ｜ runId: 20251212T143720Z ｜ endpoint: /api01rv2/patient/outpatient ｜ recordedAt: 2026-01-04T02:54:43.357Z ｜ details: [object Object] ｜ traceId: trace-20251212T143720Z