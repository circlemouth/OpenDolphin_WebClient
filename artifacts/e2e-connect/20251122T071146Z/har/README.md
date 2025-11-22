# HAR 採取テンプレート（RUN_ID=20251122T071146Z）

- ステータス: Stage 接続先未定のため実測 HAR は未取得。接続先確定後に下記手順で採取する。

## 1. 事前準備（ブラウザ設定）
- ブラウザ: Chrome/Edge 最新版のシークレットウィンドウを使用（拡張機能無効化）。
- DevTools: Network パネルを開き、`Preserve log` と `Disable cache` を両方 ON。
- サービスワーカー: `Application > Service Workers` で `Bypass for network` を ON（MSW/Service Worker を無効化）。
- 通信先: `.env.stage` などで Stage URL を設定し、MSW 無効環境でページを再読込してから計測を開始する。

## 2. フィルタ設定
- Network パネルのフィルタを `-font -image` に設定し、対象は `Fetch/XHR` のみ表示。
- 必要に応じて `domain:<stage-host>` で Stage 宛てリクエストを絞り込む。

## 3. 採取手順
1. 計測対象画面を開く前に Network ログを `Clear`。
2. 対象操作（認証/受付/カルテ/CLAIM など）を実行。
3. 操作が完了したら Network パネル右上メニュー `Export HAR...` を選択し、`Save all as HAR with content` で保存。
4. ファイル名規約: `har/<scenario>_<YYYYMMDDThhmmssZ>.har`（例: `har/auth_login_20251122T150000Z.har`）。
5. 保存前に患者 ID・トークン・Cookie が含まれていないか HAR 内を確認し、必要に応じて手動マスクする。

## 4. 追記すべきメモ
- 実施日時（UTC/JST 両方あるとベター）
- 使用ブラウザとバージョン
- 接続先 Stage URL / アカウント種別（資格情報は記載しない）
- 取得できなかった場合の理由と次回の試行条件

## 5. 次アクション
- Stage 接続先が決まり次第、このテンプレートに従い HAR を採取し、本ディレクトリへ保存する。
