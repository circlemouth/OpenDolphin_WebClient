# Elytron / Jakarta Security 統合方針（Phase 2 草案）

更新日: 2025-11-02

## 目的
- WildFly 33 標準の Elytron HTTP 認証と Jakarta Security API を採用し、フィルタ実装に残るヘッダ直読みを段階的に排除する。
- モダナイズ済みサーバー全体で Micrometer ベースのトレース情報を共通化し、監査ログとアプリログの紐付けを確実にする。

## 現状整理
- `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java` が `userName` / `password` ヘッダを直接参照し、`UserServiceBean` で認証している。
- WildFly 33 では Elytron の `security-domain` / `http-authentication-factory` を構成することで、`jakarta.security.enterprise.SecurityContext` から `Principal` が取得可能になる。
- Micrometer へ計測基盤を移行したことで、REST リクエスト単位のトレース ID を MDC に格納し、`AuditTrailService` や `SessionTraceManager` と連携する仕組みが必要。

## Phase 2 対応方針
1. `LogFilter` で `SecurityContext` をインジェクトし、`resolvePrincipalUser()` を介して Elytron が提供する `Principal` を優先利用する。
   - `SecurityContext` が利用不可（Elytron 未設定）な場合はヘッダ認証へフォールバックするが、WARNING ログと TODO を残し早期解消を促す。
   - Elytron 有効化後は REST 呼び出し時にヘッダ値なしでも `remoteUser` が設定される。
2. リクエストヘッダ `X-Trace-Id` を MDC キー `traceId` に格納し、未指定の場合はフィルタで UUID を生成する。
   - フィルタ完了時に MDC を確実にクリアし、スレッド再利用時の汚染を防止。
3. WildFly 構成タスク
   - `elytron` サブシステムで LDAP/DB 認証をマッピングする `security-domain` を作成。
   - `http-authentication-factory` を Undertow のアプリケーションセキュリティドメインに割り当て、`security-constraint` で `/resources/*` を保護。
   - `X-Trace-Id` を上流（API Gateway / LB）で付与し、未付与時はサーバー側で生成された値をレスポンスヘッダに反映することを検討。
4. 段階的移行計画
   - Phase 2: サーバーコードが Elytron から Principal を受け取れるようフックを実装（完了）。
   - Phase 3: WildFly 設定 CLIs と Secrets 管理手順を整備し、ヘッダベース認証を廃止。
   - Phase 4: 監査ログ基盤（Micrometer + AuditTrailService）が MDC の `traceId` を引き継ぎ、SIEM 連携に必要な JSON 出力を整備。

## 次のアクション
- `docs/server-modernization/operations/TEST_SERVER_DEPLOY.md` に Elytron 設定の検証項目を追加する。
- `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md` の認証比較表を更新し、ヘッダ認証から Elytron への移行方針と MDC 連携を明記する。
- Secrets 管理チームと連携し、Elytron 利用時の資格情報（例: LDAP / DB パスワード）の Vault 保管方法を決定。
