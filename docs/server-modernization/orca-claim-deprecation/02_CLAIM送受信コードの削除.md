# CLAIM送受信コードの削除（前提ドキュメント）

## RUN_ID
- 20260105T113324Z

## 目的
- server-modernized から CLAIM 送受信処理を削除し、API 経路に一本化する。

## 参照
- `docs/server-modernization/orca-claim-deprecation/01_API専用化方針の確定.md`

## 前提
- CLAIM 送受信は 2026年3月末廃止予定。
- API/PushAPI が代替手段として利用可能。

## 作業内容
- CLAIM 通信クラス/ハンドラ/設定の削除計画を確認する。
- API 連携が残るよう分岐の整理を行う。
- ビルド/テストに影響する参照を削除する。

## 完了条件
- CLAIM 送受信の実装が除去され、API 経路のみが残る。

## 成果物
- 変更差分のレビュー結果

## 実施メモ（RUN_ID=20260105T113324Z）
- 2026-01-05 のコミット `062296eea` で CLAIM 送受信経路（ClaimSender/DiagnosisSender/MessagingGateway/claimHelper.vm/diseaseHelper.vm 等）を削除済み。
- 2026-01-05 のコミット `3c72ef099` で JMS 経由の CLAIM 処理も削除済み。
