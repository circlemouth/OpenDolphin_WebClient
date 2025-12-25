# ORCA wrapper 実接続 運用条件明文化
- 期間: 2026-01-10 17:00 - 2026-01-11 17:00 / 優先度: high / 緊急度: low
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_実接続_運用条件明文化.md`

## 目的
- ORCA wrapper の **stub/実接続の切替条件** と **有効化手段** を明文化する。
- 実接続時の設定手順（`ORCA_API_*` / `custom.properties` の優先順位・禁止事項）を明文化する。

## 対象範囲
- `server-modernized` の ORCA wrapper transport 層（`OrcaTransport` / `RestOrcaTransport` / `StubOrcaTransport`）。
- 実接続用の設定手順（環境変数・`custom.properties`）。
- 実接続そのものの証跡取得は **最終段階で実施**（本ドキュメントは条件の明文化のみ）。

## 現行の切替仕様（コード由来の事実）
- `OrcaWrapperService` は CDI で `RestOrcaTransport` を解決するため、**デフォルトは実接続（HTTP transport）**。
- `StubOrcaTransport` は `@Vetoed` で CDI 対象外。**テストなどで手動注入した場合のみ有効**。
- `RestOrcaTransport` は **ORCA 接続設定が不足すると例外で停止**する（`OrcaTransportSettings.isReady()` で検証）。

## Stub / 実接続の切替条件
### 実接続（RestOrcaTransport）
- **本番/検証環境の既定**。ORCA HTTP API が利用可能であることが前提。
- 切替条件（実接続を継続すべき状態）:
  - `ORCA_API_*` または `custom.properties` で **host/port/user/password が揃っている**。
  - `ORCA_API_STATUS` で該当 API が **実接続可能（POST/GET 開放）**と判断できる。

### Stub（StubOrcaTransport）
- **ユニットテスト/ローカル検証/Spec-based 検証用**。
- 切替条件（stub を使うべき状態）:
  - ORCA 側の POST 未開放などにより **実接続が禁止/不可能**である。
  - Spec-based で DTO 変換フローのみ検証し、実 API 呼び出しを避けたい。
- **重要**: 現状の運用では **stub を runtime で切替える仕組みは存在しない**（下記「有効化手段」参照）。

## 有効化手段（現行の実装準拠）
### 実接続の有効化
- CDI の既定で `RestOrcaTransport` が使われるため、**設定が揃えば常に実接続**となる。
- 追加のフラグ/トグルは不要（`ORCA_API_*` / `custom.properties` のみ）。

### Stub の有効化
- **現状は runtime での有効化手段なし**。
- 可能な手段（実装済）:
  - テストで `new OrcaWrapperService(new StubOrcaTransport(), new OrcaXmlMapper())` を使う。
- 可能な手段（未実装・設計のみ）:
  - CDI `@Alternative` で `StubOrcaTransport` を切替える。
  - 設定フラグで `OrcaTransport` の DI を切替える。

## 実接続時の設定手順（優先順位）
`RestOrcaTransport` が読み込む **設定の優先順位** は以下の通り。優先順位の上ほど強い。

### 1) 環境変数（推奨）
- `ORCA_API_HOST`
- `ORCA_API_PORT`
- `ORCA_API_SCHEME`
- `ORCA_API_USER`
- `ORCA_API_PASSWORD`
- `ORCA_API_PATH_PREFIX`
- `ORCA_API_RETRY_MAX`
- `ORCA_API_RETRY_BACKOFF_MS`

### 2) `custom.properties`（フォールバック）
- 読み込み場所: `${jboss.home.dir}/custom.properties`
- 参照キー:
  - `orca.orcaapi.ip`
  - `orca.orcaapi.port`
  - `orca.id`
  - `orca.password`
  - `claim.host`
  - `claim.send.port`
  - `claim.scheme`

### 3) ORCAConnection プロパティ（`custom.properties` 未読込時のみ）
- `ORCAConnection.getProperties()` によるフォールバック（内部で `custom.properties` を読む）。

### 優先順位の詳細（キー別）
- `host`: `ORCA_API_HOST` → `orca.orcaapi.ip` → `claim.host`
- `port`: `ORCA_API_PORT` → `orca.orcaapi.port` → `claim.send.port`
- `scheme`: `ORCA_API_SCHEME` → `claim.scheme`（未指定時は `http`）
- `user`: `ORCA_API_USER` → `orca.id`
- `password`: `ORCA_API_PASSWORD` → `orca.password`
- `pathPrefix`: `ORCA_API_PATH_PREFIX` のみ
- `retry`: `ORCA_API_RETRY_MAX` / `ORCA_API_RETRY_BACKOFF_MS` のみ

## 実接続時の設定手順（解像度）
1. **環境変数を優先して設定**する（本番/検証は必須）。
   - ORCA API の URL/認証情報は `ORCA_API_*` に集約する。
2. `custom.properties` は **ローカル/レガシー互換のフォールバック**として扱う。
3. 設定後、`RestOrcaTransport` が `isReady()` を満たすことを確認する。
   - `host/port/user/password` が揃わない場合、ORCA wrapper は例外で停止する。

## 禁止事項・注意事項
- **禁止**: `custom.properties` の `claim.jdbc.*` / `claim.user` / `claim.password` を ORCA DB 接続の情報源として使うこと。
  - これらは **JNDI DataSource に一本化**され、読み取りはブロック/警告の対象。
- **禁止**: 本番で `ORCA_API_*` を未設定のまま **`custom.properties` のデフォルト値**（例: `orca.id=ormaster`）に依存すること。
- **禁止**: `ORCA_API_*` と `custom.properties` の **ホスト/ポートを矛盾させる運用**。
  - 環境変数が優先されるため、値が混在すると誤接続の原因となる。
- **注意**: `ORCA_API_PATH_PREFIX` は **環境変数のみ**で指定可能（`custom.properties` には対応なし）。

## 参照
- `server-modernized/src/main/java/open/dolphin/orca/transport/RestOrcaTransport.java`
- `server-modernized/src/main/java/open/dolphin/orca/transport/StubOrcaTransport.java`
- `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java`
- `server-modernized/config/server-modernized.env.sample`
- `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_実接続_Transport.md`
- `src/server_modernized_gap_20251221/01_orca07_datasource/ORCA-07_設計確定.md`
- `docs/DEVELOPMENT_STATUS.md`
