# 60117 タスク前提ドキュメント

- 作成日: 2026-01-18T09:36:27+09:00
- RUN_ID: 20260118T003718Z
- 参照チェーン: `docs/DEVELOPMENT_STATUS.md` → `docs/server-modernization/server-modernized-code-review-20260117.md` → 本ドキュメント → `.kamui/apps/server-modernized-hardening-60117-plan.yaml`
- 方針: 工数最小・並列ワークツリー前提。実装系は可能な限り別ワークツリーで並列化し、稼働テストは最終タスクで一括実施。

## 00_context
- 00_RUN_IDと前提確認.md  
  - 前提: 上記参照チェーンであること、RUN_ID を 20260118T003718Z に固定。追加で RUN_ID を増やす場合は本書に追記。

## 01_security
- ログフィルタヘッダ認証撤去.md  
  - 対象: `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`, `WEB-INF/web.xml` のフィルタ登録。  
  - 前提: Elytron/標準認証の有効化手段を把握（現行設定を流用）。SYSAD バイパスが残存する箇所を網羅的に検索すること（キーワード `SYSAD_PASSWORD`, `userName`, `password` ヘッダ）。
- 施設IDプリンシパル分離.md  
  - 対象: `LogFilter` 内の principal 合成ロジック。  
  - 前提: 認証済み principal から facilityId を取得できること（既存 SecurityContext を確認）。監査 details に facilityId を保持するフィールドを決定。
- TouchAuth統一.md  
  - 対象: `server-modernized/src/main/java/open/dolphin/touch/TouchAuthHandler.java`。  
  - 前提: Touch 系ルート一覧（`Touch*Resource`）を確認し、標準認証へ切替後の疎通手順を把握。

## 02_exposure_control
- DemoAPI遮断と資格情報外部化.md  
  - 対象: `server-modernized/src/main/webapp/WEB-INF/web.xml`, `DemoResourceAsp.java`。  
  - 前提: 本番/開発プロファイル切替の仕組みを確認（Maven プロファイル or 環境変数）。ハードコード認証情報の出所を確認して外部化/削除方針を決定。
- Stubエンドポイント公開範囲整理.md  
  - 対象: `OrcaMedicalAdministrationResource`, `OrcaPatientResource`, `PatientModV2OutpatientResource` ほか stub/未検証経路。  
  - 前提: 本番で必要な API 一覧と stub 想定 API を列挙し、公開/非公開の判定基準を決める。feature flag 位置を決定。

## 03_runid
- 固定RUN_ID撤去とヘッダー優先化.md  
  - 対象: `AbstractOrcaRestResource`, `OrcaApiProxySupport`, 監査 details 付与箇所。  
  - 前提: 既存の RUN_ID 固定値参照箇所を `rg "RUN_ID"` で網羅確認。X-Run-Id 未指定時の発番ユーティリティを共通化する場所を決定。

## 04_resilience
- 日付フォーマッタ刷新とKarteNullセーフ.md  
  - 対象: `OrcaMedicalResource`, `OrcaDiseaseResource`, `OrcaSubjectiveResource` など SimpleDateFormat を static 共有している箇所。  
  - 前提: 置換先の `DateTimeFormatter` パターンを API 仕様に合わせて決定。Karte 取得パスの null ハンドリングと返却コード(404/Api_Result) を仕様化。
- 予約レンジ制限とTransportキャッシュ.md  
  - 対象: `OrcaWrapperService` の予約/受付リスト取得、`RestOrcaTransport` 設定ロード。  
  - 前提: ORCA Trial が許容する日付レンジ上限を決める（例: 31日程度）。設定キャッシュのリロードトリガ（再起動/手動 API）を決定。

## 05_logging_privacy
- ORCAレスポンスマスキング強化.md  
  - 対象: `OrcaHttpClient` のログ出力部。  
  - 前提: PHI とみなす項目のマスクポリシーを決定（患者ID/氏名/住所/電話など）。本番ログレベルの既定値を INFO 以下に固定する方針を整理。
- ヘッダ資格情報キャッシュTTL追加.md  
  - 対象: `UserCache.java`。  
  - 前提: TTL の既定値（例: 10分）と設定方法、手動クリア API の公開パスを決定。スレッドセーフなデータ構造選定。

## 06_subjectives
- Subjectives既定値REAL化.md  
  - 対象: `OrcaPostFeatureFlags`, `OrcaSubjectiveResource`。  
  - 前提: 本番/開発プロファイルでのデフォルト値をどう分けるかを決定。設定ファイル位置（application.properties など）を確認。

## 07_webclient
- Webクライアント適合修正.md  
  - 対象: Webクライアントの認証・API依存部（ヘッダ認証導線が残っていないか、/demo・stub系への依存がないか）。  
  - 前提: 標準HTTP認証へ統一済みであることを確認。runId 透過/recordsReturned/dataSourceTransition=server を前提に UI が動作するか簡易チェック。開発専用デバッグ導線は feature flag や mock で代替する方針を決定。

## 08_validation
- 統合稼働テストと証跡集約.md  
  - 前提: すべての修正がマージされた単一ワークツリーを用意。  
  - 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（必要に応じてポート指定）。  
  - テスト観点: 認証（ヘッダ無効化確認）、予約/訪問 API レンジ制限、Subjectives REAL 応答、ログマスキング、RunId 透過、stub 非公開、/demo 非公開。  
  - 証跡: `artifacts/60117/<RUN_ID>/` に curl ログ・JMS ログ・レスポンス JSON を保存。

---

### RUN_ID の扱い
- 本ガント/ドキュメントは RUN_ID=20260118T003718Z を既定とする。  
- 新たに追加の検証を行う場合は UTC で採番し、当セクションと関連タスクに追記すること。
