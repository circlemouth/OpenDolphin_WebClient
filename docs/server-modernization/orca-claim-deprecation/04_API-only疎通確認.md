# API-only疎通確認（前提ドキュメント）

## 目的
- ローカル環境で API-only の ORCA 連携が成立することを確認する。

## 参照
- `docs/server-modernization/orca-claim-deprecation/03_CLAIM設定と環境変数の整理.md`
- `setup-modernized-env.sh`

## 前提
- CLAIM 設定が撤去され、API-only で起動できる状態である。

## 作業内容
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動。
- API-only で主要ユースケースの疎通確認。
- CLAIM 由来の警告やログが出ないことを確認。

## 完了条件
- API-only で主要ユースケースが成功する。

## 成果物
- 疎通確認のログ抜粋

## 実施状況（RUN_ID=20260124T053606Z）
- 状態: 未実施
- 理由: 指示によりコンテナ起動/疎通確認は実施せず、CLAIM 撤去完了後に再実施する方針とした。
