# REST API モダナイズ設計メモ（Phase 3.2）

## 1. OpenAPI ドキュメント整備
- `docs/server-modernization/server-api-inventory.yaml` に旧サーバーの REST エンドポイントを OpenAPI 3.0.3 形式で整理。
- `components.schemas` にレガシー DTO（`open.dolphin.infomodel.*`）を参照できるダミースキーマを設け、仕様追跡時に対象クラスへジャンプできるようにした。
- `paths` セクションは `server-modernized/tools/api-smoke-test/api_inventory.yaml` をソースに自動生成し、既存スモークテストとの整合性を保つ。

## 2. Jakarta RESTful Web Services への移行
- `server-modernized/src/main/java/open/dolphin/rest/` および `open/dolphin/adm*/rest` 配下の `@Path` リソースで `javax.ws.rs.*` を `jakarta.ws.rs.*` へ置換。
- 依存インジェクションは `jakarta.inject.Inject`、Servlet API は `jakarta.servlet.http.HttpServletRequest` を利用。
- `AbstractResource#getSerializeMapper` で Jackson 設定を Jakarta/Jackson2 系に合わせて再初期化（Null 抑制・空 Bean 許容を継承）。

## 3. レスポンスシリアライザの更新と互換性
- `jackson-databind 2.17.x` を導入し、旧 `org.codehaus.jackson` 依存を排除。
- `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES` など旧オプションを新 API へ移し替え、既存 JSON との後方互換を維持。
- 既存クライアントへの影響を抑えるため、出力オブジェクトは従来どおり UTF-8 JSON を `application/octet-stream` ヘッダーで返却。

## 4. リアルタイム配信チャネル移行方針
- 旧 `/chartEvent/subscribe` は長輪講ポーリング同等の仕組み。モダナイズ後は WildFly 26 の `Server-Sent Events (SSE)` を採用。
- 実装案:
  1. `jakarta.ws.rs.sse.Sse` を用いたブロードキャストエンドポイント（`/chart-events`）。
  2. イベント ID を `ChartEventModel` の更新トークンとして払い出し、再接続時は `Last-Event-ID` ヘッダーで差分配信。
  3. 認証は Bearer トークン + 2FA セッション確認を必須化。
- 旧クライアント互換のため、SSE 実装と並行して既存 REST pull API (`/chartEvent/dispatch`) を一定期間提供し、OpenAPI 内で Deprecated マークを付与予定。

## 5. 認証ヘッダと 2FA セキュリティ要件
- **共通ヘッダ設計**: `Authorization: Bearer <JWT>` に統一。JWT には `fid`, `uid`, `sessionId`, `factor2` クレームを含める。
- **多要素認証 API**:
  - TOTP: `POST /20/adm/factor2/totp/registration` → `POST /20/adm/factor2/totp/verification`。シークレットは AES-GCM で暗号化保管し、バックアップコードは `SHA-256` でハッシュ化。
  - FIDO2: `POST /20/adm/factor2/fido2/registration/options` / `finish`、`/assertion/options` / `finish`。`Factor2Credential` へ公開鍵・署名カウンタを保存し、`Factor2Challenge` でチャレンジを追跡。
- **レート制限**: `/20/adm/factor2/code`（SMS）、新設 TOTP/FIDO2 エンドポイントとも 5 リクエスト/分（ユーザー単位）を上限とし、API Gateway で制御する。
- **監査ログ**: TOTP/FIDO2 の登録・認証成功/失敗、バックアップコード発行を `AuditTrailService` 経由で `d_audit_event` に永続化。JWT の `jti` とクライアント IP を必須記録。
- **署名検証**: TOTP 応答は `OTPHelper` の `verifyCurrentWindow` を使用し、タイムスキュー ±90 秒を許容。FIDO2 は Yubico WebAuthn Server を利用し署名カウンタを検証。
- **移行措置**: 既存ユーザーは初回ログイン時にバックアップコード再発行を強制し、新方式登録後に旧 Basic 認証ヘッダを無効化。`d_factor2_backupkey` の旧データは Flyway で削除済み。

## 6. 今後の課題
- OpenAPI スキーマを InfoModel の実フィールド定義へリッチ化する自動生成パイプラインの構築。
- SSE 化に伴うブラウザ互換性検証と、クライアント側の再接続ロジック実装。
- レート制限・監査ログ実装を WildFly MicroProfile Metrics/Health と連動させ、運用監視に活用する。
