# 06_WEBORCA_trial 接続性検証 ✓

- RUN_ID: `20251120T055301Z`
- 期間: 2025-11-28 09:00 〜 2025-12-02 09:00 (JST)
- 優先度: High / 緊急度: Medium
- エージェント: gemini cli
- YAML ID: `src/modernized_server/06_WEBORCA_trial接続性検証.md`

## 参照チェーン（厳守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`

## 禁止事項 / 前提
- `server/` 配下やサーバースクリプトを変更しない。Legacy 資産（`client/` `common/` `ext_lib/`）は参照のみ。
- Python スクリプトは実行禁止（明示指示がある場合のみ例外）。
- ORCA 接続は `docs/web-client/operations/mac-dev-login.local.md` に記載された開発用 ORCA サーバーのみ。P12 証明書・本番証明書・ローカル ORCA コンテナ・`curl --cert-type P12` は使用しない。
- RUN_ID は本メモ記載の `20251120T055301Z` に統一し、ログ・証跡・DOC_STATUS で同じ値を使う。

## ゴール
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` に沿って、開発用 ORCA 環境で DNS/TLS/CRUD の疎通を再検証し、成功・失敗双方の再現手順を整理する。
- タイムアウト・リトライ・TLS 設定をパラメータ化し、HTTP 40x/5xx など失敗ケースを意図的に再現できる状態を確立する。
- 取得した証跡を RUN_ID 付きでログ・アーティファクトへ保存し、DOC_STATUS とマネージャーチェックリストへ反映可能にする。

## スコープ / 非スコープ
- スコープ: 開発用 ORCA での DNS/TLS 事前確認、`curl -u user:pass --data-binary @payloads/*.xml` による CRUD 実測、タイムアウト/リトライ/TLS オプションの検証、証跡ログ整備。
- 非スコープ: 本番 ORCA へのアクセス、サーバーコードや構成ファイルの変更、Legacy 資産の更新、Docker/WildFly の再構築。

## 期待アウトプット（DoD）
1. DNS/TLS/E2E 接続チェックの結果が `artifacts/orca-connectivity/20251120T055301Z/{dns,tls}` および `docs/server-modernization/phase2/operations/logs/20251120T055301Z-orca-trial-connectivity.md` に保存されている。
2. CRUD 実測（成功・失敗の両方）とタイムアウト/リトライ/TLS パラメータの設定値・結果を表形式で整理し、ログと `artifacts/.../crud/` に XML/ログ一式が格納されている。
3. trialsite 由来の禁止機能や HTTP405 となる API が `blocked/README.md` に根拠節付きで整理され、再開条件が明記されている。
4. RUN_ID=`20251120T055301Z` を `DOC_STATUS.md`「モダナイズ/外部連携（ORCA）」行の備考へ追記できる準備が整っている（更新が発生した場合は同日付で反映）。
5. 参照チェーン順守・禁止事項違反がないことを自己確認済み。

## タスク分解
- **A. 事前確認と RUN_ID 共有**
  - 参照チェーンを再確認し、RUN_ID と証跡保存先をログ冒頭に記載。
  - DNS/TLS 事前チェック: `nslookup <HOST>` / `openssl s_client -connect <HOST>:<PORT> -servername <HOST>` を採取し `artifacts/.../{dns,tls}` へ保存（接続先は `mac-dev-login.local.md` 参照）。
- **B. タイムアウト/リトライ/TLS パラメータ設計**
  - `curl` の `--max-time`, `--connect-timeout`, `--retry`, `--retry-delay`, `--retry-all-errors`, `--ciphers` などを組み合わせ、成功/失敗を再現できるパラメータセットを設計。
  - セットごとの期待結果と実測結果を `logs/20251120T055301Z-orca-trial-connectivity.md` に表形式で記載。
- **C. CRUD 実測（成功系 + 失敗系）**
  - `ORCA_CONNECTIVITY_VALIDATION.md` の手順に従い、代表 API（例: `acceptlstv2`, `appointlstv2`, `medicalmodv2`, `acceptmodv2`, `appointmodv2`）を `curl -vv -u user:pass --data-binary @payloads/<api>_trial.xml` で送信。
  - HTTP200/Api_Result 成功ケースと、シード不足や HTTP405 を含む失敗ケースの両方を取得し、レスポンス XML・ヘッダーを `artifacts/.../crud/<api>/` へ保存。
- **D. 失敗再現手順と Blocker 整理**
  - タイムアウト/HTTP405/Api_Result=12/13/14 などの失敗を再現した手順を手順化し、リトライ条件と期待挙動を明記。
  - trialsite 禁止 API やデータシード不足を `blocked/README.md` に根拠節付きで追記。
- **E. ドキュメント/棚卸し更新準備**
  - ログ: `docs/server-modernization/phase2/operations/logs/20251120T055301Z-orca-trial-connectivity.md` を作成し、DNS/TLS/CRUD/パラメータ表/Blocker を集約。
  - DOC_STATUS 更新が必要になった場合は「モダナイズ/外部連携（ORCA）」行へ RUN_ID と証跡パスを追記し、`PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` との整合を確認。

## 証跡配置
- ログ: `docs/server-modernization/phase2/operations/logs/20251120T055301Z-orca-trial-connectivity.md`
- アーティファクト: `artifacts/orca-connectivity/20251120T055301Z/{dns,tls,crud,blocked,ui,coverage}`（必要に応じて作成）

## スケジュール目安
- 11/28 (Day1): 参照チェーン確認、RUN_ID アナウンス、DNS/TLS 採取、パラメータ設計ドラフト。
  - 11/29 (Day2): CRUD 実測（成功系・失敗系）とタイムアウト/リトライ検証。
  - 11/30 (Day3): Blocker 追記、再現手順整備、ログ初版作成。
  - 12/01 (Day4): DOC_STATUS 更新準備、マネージャーレビュー反映。
  - 12/02 09:00 まで: 未完タスク引き継ぎメモとワーカー報告作成。

## リスクと留意点
- GUI 端末が確保できない場合、UI 証跡は「未取得（CLI 制約）」としてログに明記し、API 実測を優先する。
- trialsite 禁止 API（帳票/システム管理等）や doctor/patient seed 不足による `Api_Result=12/13/14` が継続する可能性がある。再開条件（GUI seed 補完 or trialsite 側開放）を Blocker に必ず記載する。
- サーバー資産や本番証明書を触らないよう、作業コマンドはすべて README/Runbook に準拠した `curl` ベースで実施する。
## 進捗メモ（2025-11-21, RUN_ID=20251121T153100Z）
- 接続先 <DEV_ORCA_HOST> で CRUD 再採取。system01dailyv2=200/00、cceptlstv2=200/13、ppointlstv2=200/12、medicalmodv2=200/10、cceptmodv2/appointmodv2=405。
- patientmodv2 で Patient_ID=00001 を登録（RUN_ID=20251121SeedFixZ1）。doctor seed 未登録のため ccept/appoint/medical は引き続き 12/13/14/10。
- Evidence: rtifacts/orca-connectivity/20251121T153100Z/...、rtifacts/orca-connectivity/20251121SeedFixZ1/...。ログ: docs/server-modernization/phase2/operations/logs/20251121T153100Z-orca-connectivity.md / .../20251121SeedFixZ1-orca-connectivity.md。
- 残課題: doctor 0001 登録手段の特定と seed 投入、POST 405 系（/orca11 /orca14 /orca06 /orca42）の開放確認。
