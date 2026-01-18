# ORCA レスポンスマスキング強化  
RUN_ID=20260118T103715Z  

## 背景
- ORCA API 応答の Api_Result_Message / Api_Warning_Message に患者氏名・住所・生年月日等の PHI が含まれるケースがあり、OrcaHttpClient の INFO ログで平文出力されるリスクがあった。  
- 本番運用ではメッセージ全文を残さず、必要最低限の粒度を設定可能にすることが求められた。  

## 変更概要
- OrcaHttpClient のログ出力をモード化（環境変数 `ORCA_HTTP_LOG_MODE`）。  
  - `SUMMARY`（デフォルト）: Api_Result と所要時間のみ。メッセージ/警告はハッシュのみ記録。数値のみの応答はそのまま出力。  
  - `QUIET`: ステータス＋ハッシュのみ。  
  - `DETAIL` / `DEBUG`: サニタイズ済みメッセージ/警告を FINE ログに出力し、ハッシュも併記。  
- サニタイズ仕様  
  - メッセージ/警告は改行除去・160 文字上限。  
  - 非数値テキストは日本語・英字等を `***` へ置換、4 桁以上の数値は `***` へ置換。  
  - 元文のハッシュ(SHA-256 先頭 12 桁)を付与し、詳細を残さず事象の同一性のみ追跡可能にした。  
- 付随対応: `AdminConfigResource` で欠落していた runId 解決の呼び出しを `AbstractOrcaRestResource.resolveRunIdValue` に統一（テストコンパイルを通すための修正）。  

## サンプル（SUMMARY モード, INFO ログ）
```
orca.http requestId=trace-1 method=POST path=/api/patient status=200 apiResult=00 durationMs=120 apiMessageHash=0c4c7b1c1c51 warningsHash=21c9b0d2aa9f
```
- 元メッセージ: 「患者番号0000123 山田太郎 生年月日1978-01-02 / 住所:東京都新宿区 / 電話:09012345678」→ PHI はハッシュのみで出力されない。  

## 設定方法
- `ORCA_HTTP_LOG_MODE` を起動環境変数または JVM system property で指定。未指定時は `SUMMARY`。  
- DEBUG 詳細を見たい場合はロガーレベル FINE を有効化しつつ `ORCA_HTTP_LOG_MODE=DETAIL` を設定。  

## テスト
- `mvn -pl server-modernized -Dtest=OrcaHttpClientLogTest test` 実行。  
  - 既存の deprecation warning のみでテストは全て成功。  

## 影響範囲と互換性
- ログ内容以外の ORCA API 処理フロー・レスポンスヘッダは変更なし。  
- ハッシュ出力はログ解析用の追加情報であり、外部インターフェースへの影響はない。  
