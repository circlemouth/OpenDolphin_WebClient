# 依存関係アップデート計画（更新日: 2025-11-03）
> 更新担当: Codex（2025-11-03）

本計画は server-modernized を Jakarta EE 10 / WildFly 33 で安定稼働させるための依存管理指針である。`pom.server-modernized.xml` の BOM と各モジュールの `pom.xml` を統合的に見直し、ライセンス・互換性の観点も明示する。

## 1. BOM 方針

- ルートの `pom.server-modernized.xml` に Jakarta EE 10 対応 BOM を追加し、第三者ライブラリのバージョンを集中管理する。`server-modernized/pom.xml` 側にはビルド毎に変動しない固定バージョンのみを記述する。
- OSS ライセンスは Apache License 2.0 / LGPL 2.1 / MIT 系を中心に採用し、GPL 系を避ける。LGPL 利用（OpenPDF）の場合はソース開示義務を再確認する。
- 依存追加・更新は `docs/server-modernization/library-update-plan.md` の方針と整合し、更新後はこの計画と `PHASE2_PROGRESS.md` に記録する。

## 2. 優先アップデート一覧

| ライブラリ | 現状 | 課題 | 推奨アクション | ライセンス・互換性メモ |
| --- | --- | --- | --- | --- |
| `okhttp3` | 未定義（`PlivoSender` で直参照） | WAR にバンドルされず実行時に `ClassNotFoundException` の恐れ | `com.squareup.okhttp3:okhttp:5.2.1` と `logging-interceptor` を BOM に追加し、`server-modernized` へ compile 依存として登録。Java 17 対応済み。 | Apache License 2.0。Java 11+ が必須。 |
| `com.plivo:plivo-java` | `5.46.3`（未公開バージョン） | Maven Central 公開版は `5.46.0` が最新。5.46.3 はローカル配布のみの疑いあり。 | ① 公式に公開済みの `5.46.0` へ後退。② もしくは 5.46.3 の配布元を確認し社内リポジトリに登録。 | Apache License 2.0。Java 8+ をサポート。TLS 1.2 以上が推奨。 |
| `com.yubico:webauthn-server-*` | `2.6.0` | ビルダー API が段階付きに変更され、旧 `.Builder` 参照が非互換。`com.yubico.webauthn.credential.CredentialRepository` が `com.yubico.webauthn.CredentialRepository` へ移動し、`RegistrationResult#getAttestationType()` が `Optional` ではなくなった。除外クレデンシャルはリポジトリ側で自動設定。 | コード側を新 API に追従済み（2025-11-03）。今後の 2.6.x 更新ではリグレッションテスト（登録／認証／タイムアウト／Attestation メタデータ格納）を回す。 | Apache License 2.0。Java 11+ サポート。 |
| `com.github.librepdf:openpdf` | `1.3.41`（3.0.0 受け入れ準備中） | 3.x 系で `org.openpdf.*` へ全面移行し、`PdfPKCS7(PrivateKey, Certificate[], CRL[], …)` など一部 API が追加引数を要求。Java 21 クラスファイル生成・`java.time` 対応も混在。 | `PdfSigningService` を CRL 配列付きシグネチャに追随済み。後続で import を `org.openpdf.*` へ置換し、Docker ビルドで 3.0.0（Java 21 targeting）動作を検証。 | LGPL 2.1 / MPL 1.1。ライセンス告知とソース開示手順を維持しつつ、新パッケージ配布時の差分整理が必要。 |
| `org.bouncycastle:*` | `1.82` | TLS 1.3/OCSP 修正が継続しているため四半期ごとの確認を継続。`PdfSigningService` の署名長チェックを更新済み。 | 1.82 を基準に四半期監査を行い、FIPS 対応が必要になった場合は `bctls-fips` への切替手順を検討する。 | Bouncy Castle License（MIT 互換）。ライセンス文面の同梱が必要。 |
| `jakarta.json` | 未定義 | 旧実装では `org.glassfish:javax.json` を使用。Jakarta JSON API 1.1+ を提供するランタイム依存が未整理。 | `jakarta.json:jakarta.json-api:2.1.2` を `provided` 追加し、必要に応じて Yasson などの実装を検討。 | Eclipse Public License 2.0 / GPL v2 with Classpath Exception。 |
| `jakarta.validation` | 未定義 | モデルクラスの検証アノテーションを導入する場合は Bean Validation 3.0 が必要。 | `jakarta.validation:jakarta.validation-api:3.0.2` を `provided` に登録し、WildFly モジュール利用で足りるか確認。 | Eclipse Public License 2.0 / GPL v2 with Classpath Exception。 |
| `jakarta.naming` | `server-modernized` は Jakarta BOM 依存、旧 `server` は 2.1.1 を `provided` 追加済み | 旧サーバーを WildFly 33 へ移行するまで `jakarta.naming` を提供するコンテナ設定が未整理。JBoss 7 系では Jakarta パッケージを認識しない。 | ① WildFly 33 以上へ統合移行し、`modules/system/layers/base/jakarta/naming/api/main` を有効化。② 移行前にビルドする場合は `jakarta.naming-api` をコンパイル時のみ参照し、実行環境へは WildFly モジュールとして配備する。 | Eclipse Public License 2.0 / GPL v2 with Classpath Exception。 |
| `org.hibernate` | Docker ビルドで 5.0.10 を直接参照 | Jakarta Persistence 3.1 では Hibernate 6.5+ が推奨。互換 JAR の手作り保守は避けたい。 | WildFly 33 同梱の Hibernate 6 に依存し、`StringClobType` 互換 JAR を撤廃。必要なら AttributeConverter で代替。 | LGPL 2.1。WildFly モジュール利用で個別バンドル不要。 |
| `commons-codec` | `1.10`（`common/pom.xml`） | 最新 1.17.x で CVE 修正多数。 | 共通モジュールで 1.17 系へ更新し、依存先の互換性を確認。 | Apache License 2.0。Java 8+。 |
| `junit:junit` | 未導入 | ORCA 解析の単体テストを Jakarta EE 10 / Java 17 で実行するための最小構成 | `common/pom.xml` に 4.13.2（test スコープ）を追加し、CI 環境整備後にテストを常時実行する | Eclipse Public License 1.0。test スコープのため配布物へは混入しない。 |

### 2.1 OkHttp 5.2.1 運用パラメータ

- `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java` の `OkHttpClient.Builder` は以下の標準値を設定する。
  - 接続タイムアウト: 10 秒
  - 読み取りタイムアウト: 30 秒
  - 書き込みタイムアウト: 30 秒
  - 呼び出し全体のタイムアウト (`callTimeout`): 45 秒
- TLS は `ConnectionSpec` を `TLS 1.2 / 1.3` のみ許可し、`allEnabledCipherSuites()` を利用。
- これらの値は Plivo 連携の最小要件として運用チームへ共有し、必要に応じて環境変数や `custom.properties` で上書きできるよう次フェーズで拡張する。

## 3. 実施手順（ドラフト）

1. BOM/バージョン調整  
   - `pom.server-modernized.xml` に `dependencyManagement` を追加し、上記推奨バージョンを列挙。  
   - `common/pom.xml` と `server-modernized/pom.xml` から固定バージョンを削除し BOM 参照へ切り替える。
2. ライセンス確認  
   - `third-party-licenses/`（未整備）の新設を検討し、LGPL など追加ライセンスの告知文書を格納。  
   - 法務・運用チームと情報共有し、配布ポリシーをアップデート。
3. ビルド検証  
   - `mvn -Pdependency-updates-report` を Kokoro CI で実行し、依存差分の自動レポートを出す。  
   - Jakarta 変換後は `mvn -Djakarta.transform` 等の自動テストを追加検討。
4. リリース手順更新  
   - `docs/server-modernization/library-update-plan.md` と本ドキュメントを同期し、バージョン更新時には双方を更新。  
   - Docker ビルドで不要となる互換 JAR（`string-clob-type-compat.jar`）の削除に合わせ、CI のキャッシュ再構築手順を追記。

## 4. 他ワーカーへの依頼

- ライセンス確認担当: 法務チーム（連絡先 TBD）との調整をアサインする必要がある。
- Plivo SDK のバージョン出所確認は外部連携チームに確認を依頼すること。
- OkHttp 追加後は TLS 1.3 強制設定がインフラポリシーと整合するかをセキュリティチームへ確認する。
