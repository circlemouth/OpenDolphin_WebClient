# 問題点カタログ統合（ORCA preprod 実装課題）

- RUN_ID: 20260123T132959Z
- 作業日: 2026-01-23
- 目的: 各棚卸し結果の重複を統合し、単一の課題カタログとして一元管理する。
- 対象: Webクライアント / server-modernized / ORCA連携 / データ品質 / テスト
- 参照（正本）:
  - `docs/preprod/implementation-issue-inventory/gantt-existing-docs-evidence-20260122.md`
  - `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- 参照（補助）:
  - `docs/preprod/implementation-issue-inventory/*.md`

## 統合方針
- 同一事象は **1件のカタログ項目** に統合し、`統合元ID/根拠` に元IDと根拠ファイルを明記。
- 再現条件・影響・依存関係は **代表的な最小ケース** を記載し、必要に応じて補足を併記。
- 優先度は元ドキュメントの最大値（P0>P1>P2>P3）を採用。

---

## 課題カタログ

### IC-01: DB 初期化欠落（legacy schema dump 未適用）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / DB初期化
- 影響: `/api/*` が 500。`d_audit_event` 等が欠落し監査書き込み失敗。
- 影響範囲: 画面=ログイン/全体, API=/api/*, 運用=初期化手順, データ=監査/基盤テーブル
- 再現手順: `OPENDOLPHIN_SCHEMA_ACTION=create WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し `/api/user` 等にアクセス。
- 修正の依存関係: DB 初期化の必須化、初期化ログ/ヘルスチェックの整備。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: data-migration#1（schema dump未適用）, server-data-model（監査テーブル欠落）

### IC-02: search_path 未固定で監査シーケンス参照不可
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / DB初期化
- 影響: `d_audit_event_id_seq` 参照不可で 500。
- 影響範囲: 画面=全体, API=監査書込系, 運用=DB設定, データ=監査シーケンス
- 再現手順: `ALTER ROLE opendolphin SET search_path TO opendolphin;` の状態で API 実行。
- 修正の依存関係: `search_path=opendolphin,public` の起動時固定化、初期化手順明記。
- 依存関係: IC-01
- ブロッカー: IC-01
- 統合元ID/根拠: data-migration#3, data-referential#3, server-data-model

### IC-03: 必須シーケンス/スキーマ不足（d_karte_seq/hibernate_sequence/opendolphin）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / DB初期化
- 影響: `/orca/patient/mutation` などで 500。診療連鎖が失敗。
- 影響範囲: 画面=Patients/Charts, API=/orca/patient/mutation, 運用=初期化漏れ, データ=シーケンス/スキーマ
- 再現手順: schema dump のみで起動し患者登録。
- 修正の依存関係: 起動時に必須シーケンス作成を保証、欠落時の自動修復。
- 依存関係: IC-01
- ブロッカー: IC-01
- 統合元ID/根拠: data-migration#2, data-referential#1/#2, server-data-model

### IC-04: 初期 seed 不足（facility/user/patient/karte）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / テストデータ
- 影響: ログイン/患者系 API が 500/404、`/orca/disease` 等が失敗。
- 影響範囲: 画面=ログイン/Patients/Charts, API=患者・診療系, 運用=seed準備, データ=facility/user/patient/karte
- 再現手順: seed なしで患者作成→病名/診療履歴 API 実行。
- 修正の依存関係: seed を患者/karte まで拡張、facility/user との紐付けを必須化。
- 依存関係: IC-01, IC-03
- ブロッカー: IC-01, IC-03
- 統合元ID/根拠: data-migration#4/#5, data-referential#7

### IC-05: Karte 未生成時の病名/診療履歴 500（NULL制約/NPE）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / APIバリデーション
- 影響: `/orca/disease`・`/orca/medical/records` が 500。
- 影響範囲: 画面=Charts, API=/orca/disease,/orca/medical/records, 運用=診療フロー, データ=karte参照
- 再現手順: Karte 未生成の患者で病名/診療履歴 API を実行。
- 修正の依存関係: Karte 前提を API で明示（404/400）、Karte 生成失敗時のエラー変換。
- 依存関係: IC-03, IC-04
- ブロッカー: IC-03, IC-04
- 統合元ID/根拠: data-referential#4/#5, server-data-model

### IC-06: 患者作成の冪等性不足（重複/不整合）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / ORCA連携
- 影響: 再試行で重複登録・不整合が発生。
- 影響範囲: 画面=Patients, API=/orca/patient/mutation, 運用=再試行手順, データ=患者重複
- 再現手順: `/orca/patient/mutation` を同一 patientId で再試行。
- 修正の依存関係: 既存患者照会を前提に idempotent 応答（200/409 等）方針決定。
- 依存関係: IC-03
- ブロッカー: IC-03
- 統合元ID/根拠: data-referential#6, data-transactions（再試行リスク）

### IC-07: `/orca/order/bundles` の schema 不整合（bean_json 欠落）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / DBマイグレーション
- 影響: オーダー保存が 500、部分成功が残る。
- 影響範囲: 画面=Charts, API=/orca/order/bundles, 運用=マイグレーション, データ=d_module
- 再現手順: `d_module.bean_json` が無い状態で `/orca/order/bundles` 実行。
- 修正の依存関係: `V0225__alter_module_add_json.sql` の適用保証。
- 依存関係: IC-08
- ブロッカー: IC-08
- 統合元ID/根拠: data-transactions（order-bundle 500）, server-data-model

### IC-08: Flyway マイグレーション欠落/未適用
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / DBマイグレーション
- 影響: `d_patient_visit`/`d_appo`/`d_document`/`d_module` 等が未作成。
- 影響範囲: 画面=Reception/Charts, API=/schedule/*,/appo/*,/orca/*, 運用=マイグレーション適用, データ=主要テーブル
- 再現手順: 新規スキーマ環境で API 実行するとテーブル欠落。
- 修正の依存関係: `server-modernized/tools/flyway/sql` と `resources/db/migration` の同期。
- 依存関係: IC-01
- ブロッカー: IC-01
- 統合元ID/根拠: server-data-model

### IC-09: 監査 payload 型不整合（OID→text）
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / DBマイグレーション
- 影響: 監査ログ検索やパースが失敗。
- 影響範囲: 画面=監査検索, API=監査取得, 運用=監査運用, データ=d_audit_event.payload
- 再現手順: Legacy 由来の OID 型 payload を持つ DB で監査検索。
- 修正の依存関係: `V0227__audit_event_payload_text.sql` の適用。
- 依存関係: IC-01
- ブロッカー: IC-01
- 統合元ID/根拠: server-data-model

### IC-10: CLAIM 送信状態の永続化仕様が未確定
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / 仕様整理
- 影響: 送信状態の監査・再送制御が困難。
- 影響範囲: 画面=Charts/Reception, API=/orca/claim/outpatient, 運用=再送判断, データ=送信履歴
- 再現手順: 送信状態の永続化が無い環境で再送/検索を試行。
- 修正の依存関係: 仕様決定（永続化の要否と格納先）。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: server-data-model

### IC-11: 複合更新の部分成功リスク（患者→Karte→病名/処方/オーダー）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / トランザクション設計
- 影響: 一部のみ成功し再試行で重複/欠落。
- 影響範囲: 画面=Charts/Patients, API=患者/診療系, 運用=再試行/復旧, データ=患者/診療の部分成功
- 再現手順: 患者作成後に別 patientId で病名/処方を送信。
- 修正の依存関係: 冪等性設計、失敗時のロールバック/補正方針。
- 依存関係: IC-06
- ブロッカー: IC-06
- 統合元ID/根拠: data-transactions

---

### IC-12: ORCA 接続情報の既定が Legacy Trial
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: 接続設定 / 運用ドキュメント
- 影響: Preprod/本番への切替ミスで誤接続。
- 影響範囲: 画面=全体, API=全ORCA, 運用=接続先切替, データ=接続設定
- 再現手順: `setup-modernized-env.sh` を既定値で起動。
- 修正の依存関係: 接続先ごとの env セット明文化、ログ出力。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: orca-auth-config#AC-01

### IC-13: WebORCA 判定がホスト名依存で `/api` 付与漏れ
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / 接続設定
- 影響: `/api` プレフィックス欠落で 404/405。
- 影響範囲: 画面=ORCA関連全般, API=WebORCA, 運用=接続判定, データ=パスプレフィックス
- 再現手順: WebORCA を IP/DNS で指定し `ORCA_MODE` 未設定で起動。
- 修正の依存関係: `ORCA_MODE=weborca` など明示設定の必須化。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-auth-config#AC-02

### IC-14: dev proxy の `/api` rewrite と WebORCA 直結の不整合
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / 開発設定
- 影響: `/api` 欠落で 404、Basic/経路の切り分け困難。
- 影響範囲: 画面=開発環境全般, API=dev proxy, 運用=開発切替, データ=プロキシ設定
- 再現手順: `VITE_DEV_PROXY_TARGET` を WebORCA ベースで設定。
- 修正の依存関係: `/api` 付与のルール明文化。
- 依存関係: IC-13
- ブロッカー: IC-13
- 統合元ID/根拠: orca-auth-config#AC-03

### IC-15: Basic 認証設定が複数系統に分散
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: 接続設定 / 運用
- 影響: 401/404 の原因切り分けが困難。
- 影響範囲: 画面=全体, API=ORCA/proxy, 運用=認証設定, データ=認証情報
- 再現手順: server と dev proxy の片側のみ認証設定。
- 修正の依存関係: 参照元の整理と手順化。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-auth-config#AC-04

### IC-16: ORCA ポート 8000 強制置換
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: 接続設定 / 運用
- 影響: Stage/Preview で疎通失敗。
- 影響範囲: 画面=全体, API=ORCA接続, 運用=ポート設定, データ=接続設定
- 再現手順: `ORCA_API_PORT=8000` で起動。
- 修正の依存関係: 置換理由/回避策の明記。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-auth-config#AC-05

### IC-17: 証明書/Basic 切替の導線不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: 接続設定 / 運用
- 影響: 本番環境で認証方式を誤設定。
- 影響範囲: 画面=全体, API=ORCA接続, 運用=証明書切替, データ=証明書/鍵
- 再現手順: 証明書必須環境で Basic のみ設定。
- 修正の依存関係: 手順書へ追記。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-auth-config#AC-06

### IC-18: 設定反映の痕跡（ログ）不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: 接続設定 / 運用
- 影響: どの設定で起動したか追跡不能。
- 影響範囲: 画面=全体, API=全ORCA, 運用=設定追跡, データ=起動ログ
- 再現手順: `.env.local` 上書き後に値確認が残らない。
- 修正の依存関係: 起動ログ/保存先の統一。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-auth-config#AC-07

---

### IC-19: ORCA マスタ提供範囲不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / ORCAマスタ
- 影響: 薬剤/保険系マスタ欠落で UI が readOnly になる可能性。
- 影響範囲: 画面=Charts/Patients, API=/orca/master/*, 運用=マスタ運用, データ=未提供マスタ
- 再現手順: 未提供マスタ参照時に missingMaster 発火。
- 修正の依存関係: マスタ提供範囲の追加実装。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: orca-master-sync#MS-01

### IC-20: ORCA マスタキャッシュの実データ検証不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / ORCAマスタ
- 影響: cacheHit/ETag の実挙動が不明。
- 影響範囲: 画面=Charts/Patients, API=/orca/master/*, 運用=キャッシュ検証, データ=ETag/Cache-Control
- 再現手順: ORCA DB 未接続で 503 応答のみ。
- 修正の依存関係: 実環境での 200/304 検証。
- 依存関係: IC-12, IC-13, IC-15
- ブロッカー: IC-12, IC-13, IC-15
- 統合元ID/根拠: orca-master-sync#MS-02

### IC-21: マスタ更新トリガ未整備
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / ORCAマスタ
- 影響: 改定反映が遅延。
- 影響範囲: 画面=Charts/Patients, API=/orca/master/*, 運用=更新運用, データ=マスタ更新時刻
- 再現手順: TTL 期間内の更新が UI に反映されない。
- 修正の依存関係: 手動リフレッシュ/通知設計。
- 依存関係: IC-20
- ブロッカー: IC-20
- 統合元ID/根拠: orca-master-sync#MS-03

### IC-22: 空結果/404 の missingMaster 判定未検証
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / Webクライアント
- 影響: UI の readOnly ブロック誤作動。
- 影響範囲: 画面=Charts/Patients, API=/orca/master/*, 運用=判定ルール, データ=missingMaster判定
- 再現手順: 空結果を返すマスタ取得。
- 修正の依存関係: 404/空結果の扱い仕様化。
- 依存関係: IC-20
- ブロッカー: IC-20
- 統合元ID/根拠: orca-master-sync#MS-04

### IC-23: ORCA マスタ経路の不一致
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / server-modernized
- 影響: `/api/orca/master/etensu` の 404 許容で同期漏れ。
- 影響範囲: 画面=Administration/Charts, API=/orca/tensu/etensu, 運用=経路統一, データ=点数マスタ
- 再現手順: クライアントが誤経路を参照。
- 修正の依存関係: 経路統一/リダイレクト。
- 依存関係: IC-19
- ブロッカー: IC-19
- 統合元ID/根拠: orca-master-sync#MS-05

### IC-24: 実環境でのフォールバック表示検証不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / ORCAマスタ
- 影響: missingMaster/fallbackUsed 表示が本番で不整合。
- 影響範囲: 画面=Charts/Patients/Reception, API=ORCA master, 運用=実環境検証, データ=fallbackフラグ
- 再現手順: ORCA 実接続で missingMaster を再現。
- 修正の依存関係: 実環境検証ログの取得。
- 依存関係: IC-20, IC-22
- ブロッカー: IC-20, IC-22
- 統合元ID/根拠: orca-master-sync#MS-06

---

### IC-25: 監査イベント schema 統一不足（runId/screen/uiAction）
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / 監査ログ
- 影響: 監査検索が payload 依存で高コスト。
- 影響範囲: 画面=監査検索, API=監査取得, 運用=監査調査, データ=監査payload
- 再現手順: runId で検索すると JSON 文字列検索が必要。
- 修正の依存関係: schema 拡張と top-level 反映。
- 依存関係: IC-01
- ブロッカー: IC-01
- 統合元ID/根拠: server-audit-logging#AL-01/#AL-04

### IC-26: ORCA以外の runId 連携不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / 監査ログ
- 影響: UI runId と監査の突合ができない。
- 影響範囲: 画面=Administration/監査検索, API=ADM/EHT, 運用=監査突合, データ=runId
- 再現手順: ADM/EHT で監査を出し runId が入らない。
- 修正の依存関係: 共通 runId 付与。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: server-audit-logging#AL-02

### IC-27: action 名の不一致（patientmodv2）
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / 監査ログ
- 影響: 監査集計が分断。
- 影響範囲: 画面=監査検索, API=/orca12/patientmodv2/outpatient, 運用=監査集計, データ=action名
- 再現手順: `/orca12/patientmodv2/outpatient` の監査 action を確認。
- 修正の依存関係: 命名統一。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: server-audit-logging#AL-03

### IC-28: 監査送出経路のばらつき（JMS未送出）
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / 監査ログ
- 影響: 外部監視への可観測性不足。
- 影響範囲: 画面=監査監視, API=ADM/EHT, 運用=監視連携, データ=監査送出経路
- 再現手順: ADM/EHT 系で JMS 送信が走らない。
- 修正の依存関係: SessionAuditDispatcher への統一。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: server-audit-logging#AL-05

### IC-29: 監査 outcome の不整合
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / 監査ログ
- 影響: MISSING/BLOCKED が成功扱いで検知漏れ。
- 影響範囲: 画面=監査検索/ダッシュボード, API=ORCA系, 運用=監査検知, データ=outcome
- 再現手順: `details.outcome=MISSING` でも top-level が SUCCESS。
- 修正の依存関係: outcome 正規化。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: server-audit-logging#AL-06

---

### IC-30: ORCA 送信キュー live 未実装
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / キュー
- 影響: 実キュー状態が取得できない。
- 影響範囲: 画面=Reception/Charts/Administration, API=/api/orca/queue, 運用=送信監視, データ=送信キュー
- 再現手順: `x-orca-queue-mode=live` でも `queue=[]`。
- 修正の依存関係: 送信キューの永続化/取得実装。
- 依存関係: IC-10
- ブロッカー: IC-10
- 統合元ID/根拠: server-jobs-queue#BQ-01

### IC-31: ORCA キュー retry/DELETE 未実装
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / キュー
- 影響: 再送・破棄が機能しない。
- 影響範囲: 画面=Reception/Administration, API=/api/orca/queue, 運用=再送/破棄, データ=キュー状態
- 再現手順: `retry=1` / `DELETE /api/orca/queue` を実行。
- 修正の依存関係: 再送/破棄の実装と監査。
- 依存関係: IC-30
- ブロッカー: IC-30
- 統合元ID/根拠: server-jobs-queue#BQ-02

### IC-32: キュー送信履歴の永続化不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / キュー
- 影響: 送信失敗の追跡不能。
- 影響範囲: 画面=Reception/Charts, API=/orca/claim/outpatient, 運用=履歴監査, データ=queueEntries
- 再現手順: ClaimOutpatientResponse.queueEntries が常に空。
- 修正の依存関係: queueEntries の保存/返却。
- 依存関係: IC-30
- ブロッカー: IC-30
- 統合元ID/根拠: server-jobs-queue#BQ-03

### IC-33: PHR ジョブの復旧・再起動不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: server-modernized / 非同期ジョブ
- 影響: 再起動後に RUNNING が残留。
- 影響範囲: 画面=Administration, API=/20/adm/phr/*, 運用=ジョブ復旧, データ=PHRAsyncJob
- 再現手順: 実行中に再起動し、再開できない。
- 修正の依存関係: 再キュー/再実行ポリシー。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: server-jobs-queue#BQ-04

### IC-34: PHR ジョブの retry/backoff/冪等性不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / 非同期ジョブ
- 影響: 失敗時に手動復旧、重複実行。
- 影響範囲: 画面=Administration, API=/20/adm/phr/*, 運用=再試行, データ=retryCount
- 再現手順: 失敗時に retryCount が更新されない。
- 修正の依存関係: 再試行ポリシーと冪等性キー。
- 依存関係: IC-33
- ブロッカー: IC-33
- 統合元ID/根拠: server-jobs-queue#BQ-05

### IC-35: PHR ジョブの監視/タイムアウト不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / 非同期ジョブ
- 影響: スタック検知が遅延。
- 影響範囲: 画面=Administration, API=/20/adm/phr/status, 運用=監視/アラート, データ=heartbeat
- 再現手順: heartbeat 更新停止でもアラートなし。
- 修正の依存関係: 監視メトリクス/アラート。
- 依存関係: IC-33
- ブロッカー: IC-33
- 統合元ID/根拠: server-jobs-queue#BQ-06

### IC-36: ChartEvent SSE 履歴が in-memory のみ
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: server-modernized / リアルタイム通知
- 影響: 再起動でイベント欠損。
- 影響範囲: 画面=Charts/Reception, API=/chart-events, 運用=通知復旧, データ=イベント履歴
- 再現手順: サーバ再起動後の gap で復元不可。
- 修正の依存関係: 永続化/リプレイ設計。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: server-jobs-queue#BQ-07

---

### IC-37: Administration 直アクセスの権限制御が UI のみ
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / 認可
- 影響: system_admin 以外でも閲覧可能。
- 影響範囲: 画面=Administration, API=該当なし, 運用=権限運用, データ=設定情報
- 再現手順: system_admin 以外で `/f/:facilityId/administration` に直アクセス。
- 修正の依存関係: Route レベルのガード追加。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: webclient-audit-guard#AG-01

### IC-38: system_admin ロール判定の不一致
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 認可
- 影響: 本来の管理者がナビから到達できない。
- 影響範囲: 画面=Navigation/Administration, API=該当なし, 運用=権限運用, データ=ロール判定
- 再現手順: `admin/system-admin` ロールでナビが非表示。
- 修正の依存関係: `NAV_LINKS` 判定の統一。
- 依存関係: IC-37
- ブロッカー: IC-37
- 統合元ID/根拠: webclient-audit-guard#AG-02

### IC-39: Patients 保存ブロックの監査イベント不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / 監査
- 影響: 監査証跡が UI ログ止まり。
- 影響範囲: 画面=Patients, API=監査送出, 運用=監査調査, データ=監査イベント
- 再現手順: Patients 保存ブロック時に logAuditEvent が出ない。
- 修正の依存関係: blocked 理由の auditEvent 追加。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: webclient-audit-guard#AG-03

### IC-40: Charts PatientsTab のブロック理由が監査に残らない
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / 監査
- 影響: 画面ガードの追跡が困難。
- 影響範囲: 画面=Charts, API=監査送出, 運用=監査調査, データ=監査イベント
- 再現手順: role/status/master/tone ブロック時に auditEvent が無い。
- 修正の依存関係: blocked auditEvent 追加。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: webclient-audit-guard#AG-04

### IC-41: Reception 新規タブ遷移失敗の通知/監査不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 監査
- 影響: 受付の失敗理由が可視化されない。
- 影響範囲: 画面=Reception, API=該当なし, 運用=問い合わせ対応, データ=監査イベント
- 再現手順: patientId 欠損で新規タブ遷移失敗。
- 修正の依存関係: UI 通知と auditEvent 追加。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: webclient-audit-guard#AG-05

### IC-42: AuditSummaryInline の画面間不統一
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 監査
- 影響: 最新監査状態の把握が画面で差分。
- 影響範囲: 画面=Reception/Administration/Debug, API=該当なし, 運用=監査運用, データ=監査要約
- 再現手順: Administration/Reception に要約が無い。
- 修正の依存関係: 画面ヘッダへの共通配置。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: webclient-audit-guard#AG-06

---

### IC-43: 5xx 時の復旧導線・文言不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 再試行判断がユーザー任せ。
- 影響範囲: 画面=Reception/Charts/Patients, API=ORCA/REST, 運用=障害対応, データ=障害報告
- 再現手順: ORCA 502 を発生させる。
- 修正の依存関係: 5xx 専用バナー/文言/冷却時間表示。
- 依存関係: IC-48
- ブロッカー: IC-48
- 統合元ID/根拠: webclient-error-recovery#ER-01

### IC-44: 401/403 の再ログイン導線不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 失敗原因が不明確。
- 影響範囲: 画面=全般, API=全般, 運用=再ログイン対応, データ=セッション
- 再現手順: 401/403 を返す API を実行。
- 修正の依存関係: 再ログイン CTA と理由表示の統一。
- 依存関係: IC-48
- ブロッカー: IC-48
- 統合元ID/根拠: webclient-error-recovery#ER-02

### IC-45: 404 空状態/戻る導線の統一不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 「データなし」と「失敗」の混同。
- 影響範囲: 画面=Patients/Charts, API=取得系, 運用=問い合わせ対応, データ=空結果
- 再現手順: 404 を返す API を実行。
- 修正の依存関係: 空状態 UI と導線の標準化。
- 依存関係: IC-48
- ブロッカー: IC-48
- 統合元ID/根拠: webclient-error-recovery#ER-03

### IC-46: network failure の再取得/リトライ統一不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 再取得が過剰/不足。
- 影響範囲: 画面=全般, API=全般, 運用=障害対応, データ=ネットワーク失敗
- 再現手順: offline/timeout を再現。
- 修正の依存関係: 再試行ルールと UI 表示統一。
- 依存関係: IC-48
- ブロッカー: IC-48
- 統合元ID/根拠: webclient-error-recovery#ER-04

### IC-47: missingMaster/fallbackUsed の 3導線不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 復旧手順が画面間で不一致。
- 影響範囲: 画面=Reception/Charts/Patients, API=ORCA master, 運用=復旧手順, データ=fallbackフラグ
- 再現手順: missingMaster を発生させる。
- 修正の依存関係: 「再取得/Reception/管理者共有」の標準化。
- 依存関係: IC-24
- ブロッカー: IC-24
- 統合元ID/根拠: webclient-error-recovery#ER-05

### IC-48: runId/traceId 可視化・ログ共有導線不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / エラーハンドリング
- 影響: 障害報告の証跡が不足。
- 影響範囲: 画面=全般, API=全般, 運用=障害報告, データ=runId/traceId
- 再現手順: エラーバナー表示時に traceId が出ない。
- 修正の依存関係: バナー内表示とログ保存 CTA。
- 依存関係: IC-25
- ブロッカー: IC-25
- 統合元ID/根拠: webclient-error-recovery#ER-06

---

### IC-49: AdminBroadcast の TTL/施設ユーザー整合不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 同期
- 影響: 別施設で古い配信バナーが表示。
- 影響範囲: 画面=Reception/Charts/Patients, API=該当なし, 運用=配信運用, データ=localStorage
- 再現手順: 管理配信後に別ユーザーでログイン。
- 修正の依存関係: TTL と facility/user の整合チェック。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: webclient-sync-cache#SC-01

### IC-50: Reception 受付一覧の自動更新不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 同期
- 影響: 受付状態が stale。
- 影響範囲: 画面=Reception, API=/orca/appointments/list,/orca/visits/list, 運用=受付運用, データ=受付一覧
- 再現手順: 別端末で受付登録後、Reception を放置。
- 修正の依存関係: refetchInterval/通知の統一。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: webclient-sync-cache#SC-02

### IC-51: Patients 一覧の自動更新不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 同期
- 影響: 患者情報の更新が反映されない。
- 影響範囲: 画面=Patients, API=患者検索系, 運用=患者運用, データ=患者一覧
- 再現手順: 別画面で患者更新後、Patients を放置。
- 修正の依存関係: refetchInterval/ブロードキャスト設計。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: webclient-sync-cache#SC-03

### IC-52: Charts masterSource 切替時にキャッシュが更新されない
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / 同期
- 影響: dataSourceTransition と表示が不整合。
- 影響範囲: 画面=Charts, API=claim/summary/appointment, 運用=配信切替, データ=キャッシュ
- 再現手順: Administration で masterSource 切替後、Charts の claim/summary が旧データ。
- 修正の依存関係: queryKey 変更/明示的 invalidate。
- 依存関係: IC-49
- ブロッカー: IC-49
- 統合元ID/根拠: webclient-sync-cache#SC-04

### IC-53: queueStatus が画面間で不整合
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: Webクライアント / ORCA連携
- 影響: 送信状態の判断が画面でズレる。
- 影響範囲: 画面=Reception/Charts/Administration, API=/api/orca/queue,/orca/claim/outpatient, 運用=送信判断, データ=queueStatus
- 再現手順: Charts で更新後、Reception 表示が古いまま。
- 修正の依存関係: 取得経路の統一/配信。
- 依存関係: IC-30
- ブロッカー: IC-30
- 統合元ID/根拠: webclient-sync-cache#SC-05

### IC-54: Broadcast による Charts 再描画不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: Webクライアント / 同期
- 影響: 配信変更が即時反映されない。
- 影響範囲: 画面=Charts, API=claim/summary/appointment, 運用=配信運用, データ=キャッシュ
- 再現手順: Admin 配信変更後に Charts を開き直す。
- 修正の依存関係: broadcast ハンドリング強化。
- 依存関係: IC-49
- ブロッカー: IC-49
- 統合元ID/根拠: webclient-sync-cache#SC-06

---

### IC-55: ORCA 追加APIの実環境テスト未実施
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / ORCA連携
- 影響: 実 API の動作未検証。
- 影響範囲: 画面=Debug/Charts/Patients, API=追加API全般, 運用=検証運用, データ=実API応答
- 再現手順: 該当 API を実環境で未実行。
- 修正の依存関係: ORCA Trial/実環境 + 監査ログ保存。
- 依存関係: IC-12, IC-13, IC-15, IC-62, IC-63
- ブロッカー: IC-12, IC-13, IC-15, IC-62, IC-63
- 統合元ID/根拠: test-coverage（patientgetv2, patientmodv2, medicalmodv2, tmedicalgetv2, medicalgetv2, medicalmodv23, diseasegetv2, diseasev3, incomeinfv2, subjectiveslstv2, subjectivesv2, contraindicationcheckv2, medicationgetv2, medicatonmodv2, masterlastupdatev3, systeminfv2, system01dailyv2, insuranceinf1v2, medicalsetv2, patientlst7v2, patientmemomodv2, pusheventgetv2, prescriptionv2, medicinenotebookv2, karteno1v2, karteno3v2, invoicereceiptv2, statementv2）

### IC-56: ORCA 公式 XML プロキシの実環境テスト未実施
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / ORCA連携
- 影響: XML 送受信の実動作未検証。
- 影響範囲: 画面=Administration/Debug, API=XMLプロキシ, 運用=検証運用, データ=XML2ペイロード
- 再現手順: 該当 API を実環境で未実行。
- 修正の依存関係: ORCA Trial 接続 + XML2 実データ。
- 依存関係: IC-12, IC-13, IC-15, IC-62, IC-63
- ブロッカー: IC-12, IC-13, IC-15, IC-62, IC-63
- 統合元ID/根拠: test-coverage（acceptlstv2, system01lstv2, manageusersv2, insprogetv2）

### IC-57: JSON ラッパー/内製ラッパーの実環境テスト不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / ORCA連携
- 影響: mock/実データ差分が未検証。
- 影響範囲: 画面=Reception/Patients/Charts/Administration, API=JSON/内製ラッパー, 運用=検証運用, データ=実API応答
- 再現手順: 予約/患者検索/内製ラッパー API を実環境で未実行。
- 修正の依存関係: 実データ準備 + 監査ログ保存。
- 依存関係: IC-12, IC-13, IC-15, IC-62, IC-63
- ブロッカー: IC-12, IC-13, IC-15, IC-62, IC-63
- 統合元ID/根拠: test-coverage（appointments/list, patients/local-search, patientmodv2/outpatient, medical-sets, tensu/sync, birth-delivery, medical/records, patient/mutation, chart/subjectives ほか）

### IC-58: 受付→診療→請求→帳票の一連 E2E 証跡不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / E2E
- 影響: 実運用フローの網羅性が不足。
- 影響範囲: 画面=Reception/Charts/Administration, API=主要フロー全般, 運用=受入判断, データ=E2E証跡
- 再現手順: 受付登録→Charts遷移→診療送信→会計→帳票の連結証跡が無い。
- 修正の依存関係: 実環境での連結シナリオ実行。
- 依存関係: IC-62, IC-63
- ブロッカー: IC-62, IC-63
- 統合元ID/根拠: test-e2e-scenarios

### IC-59: 病名/処方/オーダーの CRUD 実反映証跡不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / E2E
- 影響: 診療反映の実動作が未確認。
- 影響範囲: 画面=Charts, API=/orca/disease,/orca/order/bundles, 運用=診療検証, データ=診療反映
- 再現手順: 病名/処方/オーダー CRUD の実行証跡が無い。
- 修正の依存関係: ORCA Trial/実環境での検証。
- 依存関係: IC-62, IC-63
- ブロッカー: IC-62, IC-63
- 統合元ID/根拠: test-e2e-scenarios

### IC-60: 会計/帳票 Data_Id 取得と PDF 表示の証跡不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / E2E
- 影響: 帳票経路の実動作未検証。
- 影響範囲: 画面=Charts/Administration, API=帳票API, 運用=帳票検証, データ=Data_Id/PDF
- 再現手順: prescriptionv2 等で Data_Id 取得→blobapi 表示のログが無い。
- 修正の依存関係: 帳票対象患者の準備。
- 依存関係: IC-62, IC-63
- ブロッカー: IC-62, IC-63
- 統合元ID/根拠: test-e2e-scenarios

### IC-61: 例外系フロー（再送/復旧）証跡不足
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / E2E
- 影響: 失敗時の運用導線が未検証。
- 影響範囲: 画面=Reception/Charts/Administration, API=再送/復旧系, 運用=復旧判断, データ=失敗証跡
- 再現手順: Api_Result!=0/5xx などの復旧導線ログが無い。
- 修正の依存関係: 失敗再現シナリオの確立。
- 依存関係: IC-30, IC-31, IC-62, IC-63
- ブロッカー: IC-30, IC-31, IC-62, IC-63
- 統合元ID/根拠: test-e2e-scenarios

### IC-62: 再現用 seed データ未整備
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テストデータ
- 影響: E2E が属人化。
- 影響範囲: 画面=全般, API=全般, 運用=再現性, データ=テストデータ
- 再現手順: 受付/診療/会計/帳票の再現用データが無い。
- 修正の依存関係: シナリオ別 seed 定義と投入スクリプト。
- 依存関係: IC-04
- ブロッカー: IC-04
- 統合元ID/根拠: test-data-automation#TD-01

### IC-63: ORCA Trial/実環境データ準備・リセット手順未整備
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テストデータ / 運用
- 影響: 実環境検証が再現不能。
- 影響範囲: 画面=全般, API=ORCA全般, 運用=検証運用, データ=試験データ
- 再現手順: 手動 SQL 補正が前提。
- 修正の依存関係: データ準備/リセットのドキュメント化。
- 依存関係: IC-12
- ブロッカー: IC-12
- 統合元ID/根拠: test-data-automation#TD-02

### IC-64: MSW と実データの差分吸収不足
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: テストデータ / MSW
- 影響: 実データとの差分が検知しづらい。
- 影響範囲: 画面=E2E, API=MSW, 運用=検証運用, データ=モック差分
- 再現手順: MSW で通るが実データで失敗する。
- 修正の依存関係: シナリオ定義の整合。
- 依存関係: IC-62
- ブロッカー: IC-62
- 統合元ID/根拠: test-data-automation#TD-03

### IC-65: E2E/CI 自動化手順未整備
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: テスト基盤
- 影響: 回帰検証が継続できない。
- 影響範囲: 画面=E2E, API=全般, 運用=CI運用, データ=証跡
- 再現手順: 実行手順が手動記録のみ。
- 修正の依存関係: 起動/seed/実行/証跡保存の標準化。
- 依存関係: IC-62, IC-66
- ブロッカー: IC-62, IC-66
- 統合元ID/根拠: test-data-automation#TD-04

### IC-66: 証跡保存フォーマット未統一
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: テスト基盤
- 影響: 証跡検索コストが増大。
- 影響範囲: 画面=E2E, API=全般, 運用=証跡管理, データ=artifacts
- 再現手順: artifacts の保存先/命名が不統一。
- 修正の依存関係: runId ベースの保存ルール策定。
- 依存関係: なし
- ブロッカー: なし
- 統合元ID/根拠: test-data-automation#TD-05

### IC-67: 性能/負荷の実測不足・指標未定義
- 優先度: P2
- 優先度理由: 影響は限定的だが品質/運用リスク低減に有効。
- 担当領域: テスト / パフォーマンス
- 影響: 本番負荷への耐性が不明。
- 影響範囲: 画面=全般, API=主要API, 運用=SLA判断, データ=メトリクス
- 再現手順: 同時アクセス/レート制限の測定がない。
- 修正の依存関係: p95/p99 指標と負荷試験計画。
- 依存関係: IC-65
- ブロッカー: IC-65
- 統合元ID/根拠: test-performance-resilience#PR-01/#PR-02/#PR-03/#PR-06

### IC-68: 依存サービス障害/ネットワーク断の回復性テスト未実施
- 優先度: P1
- 優先度理由: 主要フローに直結し、障害・運用停止リスクが高い。
- 担当領域: テスト / 回復性
- 影響: 障害時の復旧手順が未検証。
- 影響範囲: 画面=全般, API=全般, 運用=障害復旧, データ=障害証跡
- 再現手順: DB/ORCA/MinIO 停止やネットワーク断の試験が無い。
- 修正の依存関係: 障害注入シナリオの実行計画。
- 依存関係: IC-65
- ブロッカー: IC-65
- 統合元ID/根拠: test-performance-resilience#PR-04/#PR-05

---

## 重複統合メモ（代表）
- 統合ルール1: 同一の現象・再現条件が一致する場合は **1件化** し、影響/再現/依存を代表ケースで整理。
- 統合ルール2: DB初期化・シーケンス・search_path のような **起動前提** は、最も上流の課題に集約し、下流の症状は影響として記載。
- 統合ルール3: UI/監査/運用で同一の欠落を指摘している場合は **監査/運用観点を補足** として統合。
- 代表例: `d_karte_seq` 欠落は data-migration / data-referential / server-data-model で重複 → IC-03 に統合。
- 代表例: `search_path` 不整合は data-migration / data-referential / server-data-model で重複 → IC-02 に統合。
- 代表例: Karte 未生成による病名/診療履歴 500 は data-referential / server-data-model で重複 → IC-05 に統合。
- 代表例: `bean_json` 欠落で /orca/order/bundles 500 は data-transactions / server-data-model で重複 → IC-07 に統合。
- 代表例: seed 不足（facility/user/patient/karte）は data-migration / data-referential で重複 → IC-04 に統合。

