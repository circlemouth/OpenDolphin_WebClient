# CareMap 添付ファイル移行手順

CareMap の画像・添付イベントを Web クライアントへ移行する際に必要な、`image-browser.properties` の設定値と患者別ファイルを `AttachmentModel` へ登録する手順をまとめる。

## 1. 目的
- オンプレ版 ImageBrowser が参照していた患者ディレクトリ（`image-browser.properties` の `baseDir`）を Web クライアントの CareMap でも参照できるようにする。
- 既存の画像・PDF ファイルを WildFly サーバーの `AttachmentModel` に格納し、`/karte/documents` と `/karte/attachment` API から取得できる状態にする。

## 2. 前提条件
- 移行対象施設の WildFly サーバーが停止可能なメンテナンス時間帯を確保していること。
- Swing クライアントから `image-browser.properties` を取得済みで、患者画像ベースディレクトリの実態が把握できていること。
- サーバー側に十分なディスク容量とバックアップが確保されていること。

## 3. 作業手順
1. **設定ファイルの収集と確認**
   - 既存端末の `USER_HOME/.open_dolphin/image-browser.properties` を収集し、`baseDir` が施設内で統一されているか確認する。
   - 複数値が存在する場合は、最も新しい設定を正とし、残りは差分を精査する。
2. **ファイルのミラーリング**
   - `baseDir/{patientId}` 形式で保存されている画像・PDF をサーバー側共有ストレージ（例: `/srv/opendolphin/attachments`）へ同期する。
   - rsync 等でコピー後、`sha256sum` を用いたハッシュチェックを行い、破損や取りこぼしがないことを確認する。
3. **AttachmentModel への一括登録**
   - WildFly 配布物に同梱した `bin/attachment-import.sh`（運用チーム配布物）を使用し、以下のように実行する。
     ```bash
     $ ./bin/attachment-import.sh \
         --facility FID1234 \
         --property /path/to/image-browser.properties \
         --storage /srv/opendolphin/attachments \
         --dry-run
     ```
   - ドライラン結果に問題がなければ `--dry-run` を外し本番実行する。処理ログと文書 ID/添付ファイル名の対応表を保存し、監査用に保管する。
4. **Web クライアントでの確認**
   - 任意の患者カルテを Web クライアントで開き、CareMap の「画像」「添付」フィルタと右ペイン「関連画像 / 検査」ギャラリーに移行したファイルが表示されることを確認する。
   - 画像はプレビュー表示され、PDF/その他ファイルはダウンロード導線から開けることを確認する。

## 4. トラブルシューティング
- **ファイルが表示されない場合**: `attachment-import.sh` のログに失敗ファイルが記録されていないか確認し、文書 ID の整合性を再チェックする。
- **大容量ファイルでタイムアウトする場合**: バッチ実行時に `--chunk-size` オプションで登録単位を小さくする、またはファイル分割を検討する。
- **Web クライアントでダウンロードできない場合**: WildFly の MIME 設定と `Content-Type` が正しいか確認する（例: `application/pdf`）。

## 5. 移行完了後の運用
- 以降はシェーマ保存や画像取り込み時に自動で `AttachmentModel` が更新されるため、`image-browser.properties` の `baseDir` は参照専用設定となる。
- 新規にファイルサーバー構成を変更する場合は、本手順を再実施するか、AttachmentModel への追加登録スクリプトを運用チームへ依頼する。
