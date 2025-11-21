# ORCA POST 開放チェック (RUN_ID=20251121PostOpenCheckZ1)

- 目的: 100.102.17.40:8000 側で `/orca11/acceptmodv2` ほか 3 API の POST が開放されたかを再確認。
- 手順: Basic 認証 `ormaster/change_me` で `curl --data-binary @request_*` を送信。設定変更は未実施。
- 結果: 4 API すべて `HTTP 405`（Allow=`OPTIONS, GET`）で前回 RUN (`20251121T153200Z`) から変化なし。
- 証跡: `crud/<api>/` にリクエスト／レスポンス／ヘッダーを保存。まとめは `blocked/README.md` 参照。
