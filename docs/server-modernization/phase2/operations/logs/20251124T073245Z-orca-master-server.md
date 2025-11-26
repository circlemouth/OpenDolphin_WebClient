# 20251124T073245Z ORCAマスターAPI サーバー実装状況ログ

- RUN_ID: `20251124T073245Z`
- 対象: `/api/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address}`（GET/JSON, Basic ヘッダー認証）
- 参照: `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`、`docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md#43-orca-マスター-api-api-orca-master-進捗run_id20251124t073245z`

## 実施概要
- 環境: `docker-compose.modernized.dev`（`ORCA_MASTER_BRIDGE_ENABLED=true`, `ORCA_MASTER_AUTH_MODE=basic`, `MODERNIZED_APP_HTTP_PORT=8000`）。
- 認証: ヘッダー `userName: 1.3.6.1.4.1.9414.70.1:admin`、`password: 21232f297a57a5a743894a0e4a801fc3`。
- 目的: ORCA マスター API が 404 となっている状況を記録し、200/JSON で返却するための期待スキーマと次アクションを整理する。

## 手順と結果
- 2025-11-26 進捗: `curl -s --max-time 5 -H "userName: 1.3.6.1.4.1.9414.70.1:admin" -H "password: 21232f297a57a5a743894a0e4a801fc3" http://localhost:8000/openDolphin/resources/api/orca/master/generic-class` を実行し HTTP404（空ボディ）を確認。`/openDolphin/resources/orca/master/*` 系も過去ログと同様に未公開のため再試行は見送り。
- 2025-11-26 12:24 JST: `docker compose -f docker-compose.modernized.dev.yml build server-modernized-dev` → `MODERNIZED_APP_HTTP_PORT=8000 docker compose ... up -d server-modernized-dev` で再デプロイ。Basic ヘッダー付きで `/api/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address,etensu}` を再実行し、全て HTTP200 / JSON（`dataSource=server`、`runId=20251124T073245Z`、`version=20251124`）を返却することを確認。レスポンス例: generic-class totalCount=2（code=211/21101）、generic-price minPrice=12.5（srycd=610008123）、hokenja payerRatio=0.7、address zip=1000001、etensu points=288。ボディ確認: `/tmp/generic-class.json` ほか。

## 期待スキーマ（200/JSON）
- 共通フィールド: `code`/`name`/区分ラベル/`validFrom`/`validTo`/`version`。
- 薬剤系（generic-class, generic-price, youhou, material, kensa-sort）: 最低薬価(`minPrice`)、用法コード(`youhouCode`)、特定器材区分(`materialCategory`)、検査区分(`kensaSort`) を含める。
- 保険者: `payerCode`/`payerName`/`payerType`/`payerRatio` と有効期間・`version`。
- 住所: `prefCode`/`cityCode`/`zip`/`addressLine` と有効期間・`version`。

## 次アクション
1. モダナイズ側で `/api/orca/master/*` を REST 公開し、上記スキーマで 200/JSON を返すようルーティングと DTO を実装する（認証ヘッダーは現行踏襲）。
2. 実装後に全エンドポイントを再度 curl し、HTTP200/期待フィールドが揃うことを確認して本ログと `ORCA_API_STATUS.md` を更新する。
3. Web クライアント側ブリッジが `dataSource=server` で取得できることを `artifacts/e2e/20251124T073245Z/` のシナリオで再検証し、監査メタ（`version`/`dataSource`/`missingMaster`/`fallbackUsed`）が出力されることを確認する。
