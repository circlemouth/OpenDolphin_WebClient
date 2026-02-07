# オーダー画面（薬剤/処置マスタ）検証 - 実施不可ログ

- RUN_ID: 20260204T155140Z-order-master-blocked
- 日時: 2026-02-04 15:51 JST
- 対象: オーダー画面での薬剤/処置マスタ表示・検索・入力（ORCA 連携）

## 実施結果
- 判定: 実施不可

## ブロッカー
- 実行環境の web-client / server-modernized 実体が未配置（リポジトリ未展開）。
- ORCA 接続先/認証情報/Facility ID が未共有。
- ORCA 実データの有無が未確認（/orca/appointments/list, /orca/visits/list 未検証）。

## 必要な準備
- web-client / server-modernized の作業ディレクトリを配置し、起動可能にする。
- ORCA 認証情報（Basic + X-Facility-Id）を共有。
- ORCA 接続先の到達性を確認（VPN/FW/稼働）。
- MSW 無効で web-client を起動し、ORCA 系 API が 200 であることを確認。

## 証跡
- 本ログのみ（スクリーンショット/Network/ORCA 応答は未取得）
