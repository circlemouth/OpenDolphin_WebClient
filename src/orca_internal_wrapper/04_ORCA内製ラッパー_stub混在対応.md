# 04 ORCA内製ラッパー（stub混在）Webクライアント対応

## 前提ドキュメント
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`（C）
- `docs/web-client/ux/ux-documentation-plan.md`

## 対象API
- `/orca/medical-sets`
- `/orca/tensu/sync`
- `/orca/birth-delivery`
- `/orca/medical/records`
- `/orca/patient/mutation`
- `/orca/chart/subjectives`

## 実装範囲
- Webクライアントの API モジュールと UI 導線を追加。
- stub 固定（Api_Result=79）と実データの判別表示。
- `runId/traceId` と `missingMaster/fallbackUsed` を UI/監査に透過。

## 受け入れ条件
- stub/実データ切替が UI と監査ログで判別できる。
- 例外系で UI が判断できるメッセージが表示される。
