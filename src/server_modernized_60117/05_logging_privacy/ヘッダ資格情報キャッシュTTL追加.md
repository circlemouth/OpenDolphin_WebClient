# ヘッダ資格情報キャッシュ TTL 追加（RUN_ID=20260118T121411Z）

## 目的
ヘッダベース認証キャッシュ（UserCache）の無期限保持を解消し、パスワードローテーション時に古い資格情報が残らないよう TTL と手動クリア手段を追加する。

## 実施内容
- `UserCache` に TTL を導入（既定 10 分、`open.dolphin.security.headerCredentialCache.ttlMinutes` / `OPEN_DOLPHIN_HEADER_CREDENTIAL_CACHE_TTL_MINUTES` で上書き可）。
- 期限切れはアクセス時に自動削除。手動クリア API を新設。
- 管理 API `/api/admin/security/header-credentials/cache` を追加。
  - `GET`: キャッシュ件数と TTL を返す（パスワード値は返さず、ユーザー名はマスク表示）。
  - `DELETE`: 全クリアまたは `?userName=` 指定で個別削除。監査ログを送出。

## 完了条件の確認
- TTL 経過後に `findPassword` が空を返し、キャッシュから削除されることをユニットテストで確認。
- `DELETE /api/admin/security/header-credentials/cache` 実行後にキャッシュ件数が 0（または対象ユーザーのみ削除）になることをテストで確認。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/mbean/UserCache.java`
- `server-modernized/src/main/java/open/dolphin/rest/AdminSecurityResource.java`
- テスト: `server-modernized/src/test/java/open/dolphin/mbean/UserCacheTest.java`, `server-modernized/src/test/java/open/dolphin/rest/AdminSecurityResourceTest.java`

## メモ
- API は管理者のみ想定。パスワード値は返さず、監査ログにマスク済みユーザー名を記録する。
