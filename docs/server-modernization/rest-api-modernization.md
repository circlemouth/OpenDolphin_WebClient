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
- **レート制限**: `/20/adm/factor2/code`・`/20/adm/factor2/device` など OTP 再発行系エンドポイントは 5 リクエスト/分（ユーザー単位）で制限し、429 応答にリトライ情報を付与。
- **監査ログ**: OTP 認証成功/失敗、デバイス登録、バックアップコード照会を `AuditEvent` エンティティで永続化。JWT の `jti` とクライアント IP を必須記録。
- **署名検証**: OTP 応答は HMAC-SHA256（`OTPHelper`）でサーバー署名済みコードと比較し、タイムスキュー ±90 秒を許容。
- **移行措置**: 既存ユーザーは初回ログイン時にバックアップコード再発行を強制し、新 JWT 配布後に旧 Basic 認証ヘッダを無効化。

## 6. 今後の課題
- OpenAPI スキーマを InfoModel の実フィールド定義へリッチ化する自動生成パイプラインの構築。
- SSE 化に伴うブラウザ互換性検証と、クライアント側の再接続ロジック実装。
- レート制限・監査ログ実装を WildFly MicroProfile Metrics/Health と連動させ、運用監視に活用する。
