# エラーフォーマット証跡（RUN_ID=`20240215T093000Z`、親=`20251120T193040Z`）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`
- 参照元ドキュメント: `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`, `docs/web-client/architecture/REST_API_INVENTORY.md`
- 目的: 代表 API のエラーフォーマット（`status/code/message/trackId/blocker/orca.apiResult/details[]`）を JSON で提示し、ORCA Api_Result の昇格基準と Blocker ラベル、監査ログ連携ポイントを本 RUN_ID 証跡として固定する。

## サンプル JSON（代表 API 4 件）
```json
[
  {
    "api": "PUT /orca/interaction",
    "status": 503,
    "code": "ORCA.INTERACTION.TRIAL_BLOCKED",
    "message": "ORCA Trialでは併用禁忌チェックが無効です",
    "trackId": "20240215T093000Z-01",
    "blocker": ["TrialLocalOnly"],
    "orca": {"apiResult": "79", "apiResultMessage": "Spec-based implementation / Trial未検証", "runId": "20251116T170500Z"},
    "details": [
      {"key": "endpoint", "value": "/orca/interaction"},
      {"key": "source", "value": "REST_API_INVENTORY §6 / API_PARITY_MATRIX OrcaResource"},
      {"key": "auditId", "value": "audit-20240215T093000Z-0001"}
    ]
  },
  {
    "api": "POST /20/adm/factor2/fido2/registration/finish",
    "status": 404,
    "code": "ADMISSION.FIDO2.CHALLENGE_NOT_FOUND",
    "message": "FIDO2 登録チャレンジが期限切れです",
    "trackId": "20240215T093000Z-02",
    "blocker": [],
    "orca": {"apiResult": null},
    "details": [
      {"key": "resource", "value": "AdmissionResource#finishFidoRegistration"},
      {"key": "source", "value": "API_PARITY_MATRIX AdmissionResource（2025-11-03テスト記録）"},
      {"key": "auditId", "value": "audit-20240215T093000Z-0002"}
    ]
  },
  {
    "api": "GET /patient/name/{name}",
    "status": 422,
    "code": "PATIENT.SEARCH.VALIDATION",
    "message": "name または kana が必須です",
    "trackId": "20240215T093000Z-03",
    "blocker": [],
    "orca": {"apiResult": null},
    "details": [
      {"key": "ui", "value": "PatientsPage search tab"},
      {"key": "source", "value": "REST_API_INVENTORY §2 患者検索"},
      {"key": "auditId", "value": "audit-20240215T093000Z-0003"}
    ]
  },
  {
    "api": "POST /orca/appointments/list",
    "status": 400,
    "code": "ORCA.APPOINTMENT.REQUIRED_DATE",
    "message": "appointmentDate は yyyy-MM-dd 形式で必須です",
    "trackId": "20240215T093000Z-04",
    "blocker": [],
    "orca": {"apiResult": "10"},
    "details": [
      {"key": "endpoint", "value": "/api01rv2/appointlstv2"},
      {"key": "source", "value": "API_PARITY_MATRIX OrcaResource / REST_API_INVENTORY §6"},
      {"key": "auditId", "value": "audit-20240215T093000Z-0004"}
    ]
  }
]
```

## ORCA Api_Result → HTTP ステータス/Blocker 昇格基準（本 RUN で確認）
- `Api_Result=00`: ORCA 側 2xx を維持し、`status=200/201`。監査には `trackId` と `orca.runId` を併記。
- 入力・業務バリデーション（例: `appointDate` 欠落、`Api_Result=10/12/13/21`）は HTTP 422 or 400、`code=*VALIDATION`、`blocker=[]`。
- Trial で封鎖される API（`Api_Result=79` または HTTP 404/405 が `ORCA_API_STATUS`/`API_PARITY_MATRIX` で Trial 未提供と明記）は HTTP 503、`blocker=["TrialEndpointMissing" or "TrialLocalOnly"]`。
- ORCA 側 2xx でもシステム系エラー（接続失敗・タイムアウト）は HTTP 502、`code=*UPSTREAM_ERROR`。認証エラーは HTTP 401/403 を透過。

## Blocker ラベル付与規約
- `TrialEndpointMissing`: Trial が 404/405 を返す API。Spec ベース代替を返す場合も付与。
- `TrialLocalOnly`: Trial では閉じており、ローカル ORCA/ORMaster でのみ実運用となる API（例: `/orca/interaction`, `/orca/appointments/list`）。
- `TrialSeedMissing`: Trial サンプルデータ不足が原因で 4xx/5xx となる場合。`details` に不足 seed を記載。
- Blocker 無しの通常エラーは `blocker=[]` とし、`status` と `code` で区別。

## 監査ログとの ID 連携ポイント
- `trackId` を `X-Request-Id`／`trace_http_*` の TraceId／監査 `d_audit_event.run_id` と同一にし、`details[].auditId` で監査レコードを逆引きできるようにする。
- ORCA ラッパーは `orca.runId`（例: `20251116T170500Z`）を返し、ORCA 側 CRUD 証跡と突合可能にする。
- 個人情報は監査側でマスク済みハッシュを使用（患者 ID は SHA-256→8桁短縮）。`details` にはプレーンな氏名・住所を入れない。

## 参照のしかた
- 本 README は `src/modernized_server/05_エラーハンドリングと監査ログ強化.md` §10 からリンクし、親 RUN=`20251120T193040Z` のエラーフォーマット草案を補強する証跡として扱う。
