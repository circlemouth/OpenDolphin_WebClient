# 監査・ログAPI補完（predeploy readiness）

- RUN_ID: `20251220T151222Z`
- 期間: 2025-12-24 09:00 - 2025-12-26 09:00 (JST)
- 優先度: medium / 緊急度: medium
- YAML ID: `src/predeploy_readiness/01_api_implementation/監査・ログAPI補完.md`

## 目的
- 監査ログ未整備の操作（文書削除/スタンプ削除/Touch・PHR系）を補完する。
- 2FA/Touch/PHR の監査メタと失敗時ログ形式を統一する。
- 文書削除の requestId/traceId 生成・伝播と errorMessage 記録ルールを是正する。

## 対応内容
- 文書削除:
  - `KarteResource` の監査 payload で requestId/traceId を分離し、traceId 未取得時のみ requestId をフォールバック。
  - 失敗時に `errorMessage` を必ず監査詳細へ格納するよう補完。
  - `EHTResource` の文書削除で成功/失敗の `status` を付与し、失敗時は `errorMessage` を必須記録。
- スタンプ削除:
  - 監査 payload の requestId/traceId を分離し、要件ドキュメントの必須フィールドと整合する相関 ID の生成規則へ寄せる。
- Touch/PHR/2FA:
  - Touch に requestId を導入し、監査 payload の requestId/traceId を分離。
  - Touch/PHR/2FA の失敗ログに `errorCode`/`exceptionClass` を補完し、`errorMessage` を統一キーで保持。
  - Touch 成功監査で `status=success` を付与。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/StampResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/support/PhrAuditHelper.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContext.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchAuditHelper.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchFailureAuditLogger.java`

## 留意点
- Legacy / Phase2 ドキュメントは参照のみとし、更新対象外。
- ORCA 実環境接続や Stage/Preview 検証は本タスクでは未実施。
