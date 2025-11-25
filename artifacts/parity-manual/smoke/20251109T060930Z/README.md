# 2025-11-09 API スモーク (base_readonly)

## 実行概要
- コマンド: `ops/tests/api-smoke-test/run.sh --scenario base_readonly --run-id 20251109T060930Z --dual --profile compose`
- 対象: `/dolphin`, `/serverinfo/jamri`, `/mml/patient/list/1.3.6.1.4.1.9414.72.103`
- 成果物: `legacy/` と `modernized/` 以下にレスポンス、`metadata.json` に実行メタ。

## 結果サマリ
| ケース | Legacy | Modernized | 備考 |
| --- | --- | --- | --- |
| `base_readonly_dolphin` | 200 OK | 200 OK | 本文 `Hellow, Dolphin` 一致。 |
| `base_readonly_serverinfo` | 200 OK | 200 OK | Jamri コードは両系統とも空文字。 |
| `base_readonly_patient_list` | 200 OK | **500** | Modernized 側で `String index out of range: -1`。ログは `logs/modern_server.log` に保存。 |

## フォローアップ
1. Modernized の `/mml/patient/list` 500 は `open.dolphin.medicine.MedicineServiceBean#getActivity` でパラメータ解析に失敗している模様。該当ログ (line `String index out of range`) を `docs/server-modernization/phase2/notes/touch-api-parity.md` に転記済み。修正後、同ディレクトリで再実行する。
2. Legacy 側 `/serverinfo/jamri` が 200 を返せない場合は `docker logs opendolphin-server | tail` を参照して JAMRI 設定を確認すること。

## 追加ログ
`logs/legacy_server.log` / `logs/modern_server.log` に直近 5 分の Docker ログを取得済み。HTTP 500 原因の追跡や JMS 連携確認に利用できる。
