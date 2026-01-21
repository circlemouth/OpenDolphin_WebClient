# /karte/iamges 暫定サポート方針

RUN_ID: 20260121T052657Z

## 背景
- Modernized server の `KarteResource` に `GET /karte/iamges/{param}` が存在し、現行の画像一覧 API で typo が残っている。
- Web クライアント側は `/karte/images` を正としつつ、暫定で typo エンドポイントにフォールバックする。

## 暫定サポート期間
- **期間**: Modernized server が `/karte/images` を正式に提供し、実運用のアクセスが移行完了するまで。
- **運用**: フロントは `/karte/images` を優先し、失敗時のみ `/karte/iamges` を再試行する。

## 廃止条件
- `/karte/images` が本番・検証環境で安定稼働し、`/karte/iamges` へのアクセスが一定期間（例: 30日）発生しないことを確認できた場合。
- 監査ログ・アクセスログで `operation=list` の `endpoint=/karte/iamges` が連続して未出現となった場合。

## 廃止作業
- Web クライアントのフォールバックを削除する。
- MSW ハンドラの typo ルートを削除する。
- 該当テストケースを整理し、証跡に廃止日を記録する。
