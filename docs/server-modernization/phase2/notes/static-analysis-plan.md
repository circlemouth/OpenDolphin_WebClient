# 静的解析導入検討メモ（2026-06-12 更新）

## 2026-06-14 追記: Ops-Credential-Setup（担当: Codex）
- サンドボックス環境では Jenkins / GitHub の資格情報一覧へアクセスできず、実際の棚卸しは未実施。Ops は `Manage Jenkins > Credentials > System > Global credentials (unrestricted)` で既存エントリを確認し、`slack-static-analysis-webhook` / `pagerduty-static-analysis-routing-key` が未登録である場合は string 型（Secret Text）で登録する。Description に静的解析用途を明記し、登録後は更新者・時刻を取得して監査ログへ記録する。
- Jenkins 資格情報の利用範囲は静的解析ジョブ用サービスアカウントに限定する。フォルダスコープの Credentials と `Server-Modernized-Static-Analysis` パイプラインでの `withCredentials([string(credentialsId: '…')])` のみに閉じ、他ジョブでの流用を防ぐ。不要な権限が付与されていないか、`Manage Jenkins > Configure Global Security > Access Control for Builds` も合わせて確認する。
- GitHub リポジトリの `Settings > Secrets and variables > Actions` で `SLACK_STATIC_ANALYSIS_WEBHOOK` / `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY` の有無を確認し、未登録なら組織シークレットとして登録を依頼。登録後は `Settings > Audit log` で `action: secret.create` / `secret.update` をフィルタし、設定者・時刻・IP を控えて Slack Vault チケットに添付する。
- 通知テンプレート調整案: Slack メッセージに原因メモへのリンク（`docs/server-modernization/phase2/notes/static-analysis-findings.md` など）とワークフロー種別（Jenkins or GitHub Actions）を明記する。PagerDuty ペイロードには `component: server-modernized-static-analysis` と `custom_details.failure_stage` を追加し、一次対応者が確認すべきレポートへの URL を `links` に含める。
- 疎通テストは現環境から実施不可。Ops は Jenkins で `Server-Modernized-Static-Analysis` を `Replay` し、`post { failure { ... } }` 直前に一時的な `error 'notification verification'` を挿入して失敗させる。GitHub Actions は `workflow_dispatch` で手動起動し、`scripts/run-static-analysis-diff.sh` 前に `exit 1` を挿入したテストブランチで失敗を発生させる。取得したビルド番号・Run 番号・Slack メッセージ Permalink・PagerDuty インシデント ID・テンプレ調整内容を本メモおよび `PHASE2_PROGRESS.md` に追記する。
- Runbook 反映案: `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` に「静的解析通知 Webhook メンテナンス」を追加し、資格情報棚卸し（登録状況確認、更新者記録）、月次ドライラン、Webhook URL ローテーション時の影響範囲確認（Jenkinsfile / GitHub Actions / PagerDuty Integration Key）を手順化する。

## 前提
- 対象は `pom.server-modernized.xml` で束ねる `common`（Jakarta 版共通ライブラリ）と `server-modernized`（WildFly 33 / Jakarta EE 10 対応サーバー）。両モジュールとも JDK 17 / Maven 3.9 系でビルド済み。
- 既存 `pom.xml` / `pom.server-modernized.xml` に静的解析プラグインは未設定。`server` モジュール（Legacy）は適用対象外。
- CI は Jenkins / GitHub Actions いずれかを想定。ビルドエージェントは Maven ローカルリポジトリのウォームアップ済みを前提とする。
- Python スクリプト実行には承認が必要なため、自動レポート生成は Maven プラグインの XML / HTML 出力で完結させる。

## 適用前提の整理
- Jakarta EE 10 API（`jakarta.*`）を利用しており、旧 `javax.*` 向けルールは無効化または置換が必要。
- `server-modernized` には EJB / JAX-RS / JPA / Quartz / Micrometer 等が混在。シリアライズやセッション Bean 関連の誤検知が想定されるため除外フィルタ整備が必須。
- `common` モジュールは DTO が大半で、Checkstyle / PMD の命名規則違反が多数検出される可能性がある。段階導入を前提にする。

## 候補ツール比較

| 観点 | SpotBugs<br/>(`com.github.spotbugs:spotbugs-maven-plugin` 4.8.5.0 + `findsecbugs-plugin` 1.12.0) | Checkstyle<br/>(`org.apache.maven.plugins:maven-checkstyle-plugin` 3.3.1 + Checkstyle 10.12.4) | PMD<br/>(`org.apache.maven.plugins:maven-pmd-plugin` 3.21.0 + PMD 6.55.0) |
| --- | --- | --- | --- |
| 主目的 | バイトコード解析による NullPointer / リソースリーク / 直列化バグ検知 | コーディング規約・命名・フォーマットの静的検査 | コードスメル / 複雑度 / 未使用コード検知 |
| Jakarta EE 10 互換性 | Java 17 / Jakarta API で動作実績あり。EJB シリアライズ警告は除外フィルタで吸収可能 | 設定ファイルから `jakarta.*` 用 Suppression を追加すれば互換性問題なし | ルールセットによっては `jakarta.servlet` 等を旧 javax と誤認するためカスタムルール要 |
| 期待効果 | 既存モジュールの NullPointer / SQL コネクション未クローズなど実バグ検知 | コードスタイルばらつき抑制、レビュー工数削減 | 未使用 private フィールド/メソッドの削減、複雑度メトリクス可視化 |
| 初期導入コスト | 除外フィルタ（EJB, DTO 自動生成部位）作成に 0.5〜1.0 人日。レポート整備で追加 0.5 人日 | 既存違反が大量に出るため、ルール選定と段階導入ポリシー策定に 1.5〜2.0 人日 | ルールセット調整と誤検知対応に 1.0〜1.5 人日。Checkstyle と合わせて運用可 |
| ローカル運用 | `mvn -f pom.server-modernized.xml -Pstatic-analysis spotbugs:check`。HTML レポートは `target/spotbugsHtml.html` | `mvn ... checkstyle:checkstyle` で XML/HTML 出力。`check` 目標は違反時ビルド失敗 | `mvn ... pmd:pmd` / `cpd:cpd`。違反検知を `target/site/pmd.html` に出力 |
| CI 組み込み | `verify` フェーズにバインドし、重大度 High 以上で失敗。`findsecbugs` を add-on として同時実行 | 初期は `checkstyle:checkstyle` をレポート専用にし、閾値ゼロ打ち合わせ後に `check` を必須化 | `pmd:check` は段階導入（警告閾値 >0 で失敗）。重複コード（CPD）は週次ジョブで集計 |
| 備考 | レポートを SARIF に変換すれば GitHub Code Scanning 連携も可能 | 既存コードはインデント/Import 順序が混在。ルール軽量化 or 新規コード限定運用が安全 | 複雑度閾値や Dataflow ルールを絞らないと大量検知。長期的に品質ゲートとして有効 |

## 推奨導入セット
- **第1段階（必須）**: SpotBugs + FindSecBugs を `verify` フェーズに組み込み、高優先度 (`High`, `Medium`) 検知でビルド失敗。既存コードは一括 triage 用の `spotbugs-exclude.xml` を整備し、恒久対応を別チケット化。
- **第2段階（推奨）**: Checkstyle を最小ルール（インポート順序、`@Override` 必須、波括弧スタイル）で導入。既存コードには `SuppressionFilter` を適用し、増分変更ファイルを対象にする Git Diff ベースの実行（`-Dcheckstyle.includes`）を検討。
- **第3段階（任意/フォローアップ）**: PMD を `common` モジュール中心に適用。`UnusedPrivateField`, `AvoidDuplicateLiterals`, `SimplifiedTernary` など誤検知の少ないルールから開始し、週次 CI でレポート化。閾値 0 達成後に PR チェックへ昇格。

## 導入ステップ案
1. `server-modernized/config/static-analysis/` を新設し、以下ファイルを追加する:
   - `spotbugs-exclude.xml`: EJB セッション Bean のシリアライズ警告、`@Generated` クラス、`open.dolphin.touch.*` など UI レイヤー固有の警告を除外。
   - `checkstyle.xml` / `checkstyle-suppressions.xml`: 既存スタイルに合わせたルールセットと抑制設定。
   - `pmd-ruleset.xml`: 使用ルールを限定し、Jakarta API を `java.lang.UnsupportedOperationException` 等と誤認しないよう XPath 条件を調整。
2. `pom.server-modernized.xml` に `static-analysis` プロファイルを追加し、`spotbugs`, `checkstyle`, `pmd`, `cpd` プラグインを `reporting` と `verify` フェーズへバインド。既定ではプロファイル OFF、CI で `-Pstatic-analysis` を有効化。
3. 初回実行で SpotBugs レポートを採取し、High/Medium のうち即時修正が難しい項目を `docs/server-modernization/phase2/notes/static-analysis-findings.md`（新規）へ蓄積。除外理由を記録し、3 ヶ月以内の解消目標を設定。
4. Checkstyle/PMD は「レポートのみ」運用から開始し、検出数が減少したら `check` ゴールを必須化。ルール増強は四半期レビューで決定する。
5. SARIF 変換が必要な場合は `spotbugs:gui` ではなく `spotbugs:spotbugs` で XML 出力し、CI で `spotbugs-json-report`（別プラグイン）を利用する。Python 禁止制約を満たすため、Maven プラグインのみで完結させる。

## ローカル/CI ワークフロー案
- **ローカル**:
  - SpotBugs 単体実行: `mvn -f pom.server-modernized.xml -Pstatic-analysis spotbugs:check`
  - Checkstyle レポート: `mvn -f pom.server-modernized.xml -Pstatic-analysis checkstyle:checkstyle`
  - PMD/CPD レポート: `mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:pmd cpd:cpd`
  - レポート出力先はすべて `server-modernized/target/static-analysis/` 配下へ集約（`pom` に `outputDirectory` を指定）。
- **CI**:
  - Jenkins: `Server-Modernized-Static-Analysis`（マルチブランチパイプライン）でリポジトリ直下の `Jenkinsfile` を使用。ステージ構成は「Static Analysis - Full」→「Static Analysis - Diff Gate」。前者で `mvn -f pom.server-modernized.xml -Pstatic-analysis verify -DskipTests -B` を実行し、`server-modernized/target/static-analysis/**/*` をアーティファクト化。後者で `scripts/run-static-analysis-diff.sh --base origin/<ベースブランチ> --target HEAD` を実行し、差分の Checkstyle / PMD をゲートする。
  - GitHub Actions: Workflow 名 `Server Static Analysis`、ジョブ ID `static-analysis`。プルリクエスト／`main` への push をトリガーし、Jenkins と同じ二段構成で静的解析を実行。PR 時のみ diff ゲートを有効化し、レポートを `static-analysis-reports` としてアップロード。
  - Nightly: `mvn ... -Pstatic-analysis pmd:cpd` を追加予定（未着手）。重複コードレポート蓄積と週次レビュー枠は Phase2 backlog に残置。

## 通知・シークレット設定
- Jenkins:
  - Slack 通知は `string` 型の資格情報 `slack-static-analysis-webhook`（Webhook URL）を `withCredentials` で読み出し、失敗時のみメッセージを送付する。本文は `${JOB_NAME} #${BUILD_NUMBER}` と `BUILD_URL` を含める。
  - PagerDuty は `string` 型資格情報 `pagerduty-static-analysis-routing-key` を使用。`routing_key`・`event_action: trigger`・`dedup_key: static-analysis-<job>-<build>` の JSON を `https://events.pagerduty.com/v2/enqueue` へ送信し、カスタムフィールドに `git_branch` / `git_commit` / `build_url` を付与する。
  - いずれの資格情報も未設定時は通知スキップとなる。セットアップ後にジョブの `Configure` 画面から `Use Groovy Sandbox` を有効化し、シークレット漏洩防止のためコンソールログ出力を `curl -s` で抑制する。
- GitHub Actions:
  - Slack 用シークレット `SLACK_STATIC_ANALYSIS_WEBHOOK`、PagerDuty 用 `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY` をリポジトリまたは組織シークレットに登録。設定が無い場合は各ステップが `Skipping notification` ログを残して終了する。
  - Slack/PagerDuty いずれも `jq` で JSON を組み立て、失敗時のみ通知。ワークフロー／Run 番号／実行 URL を本文へ埋め込み、PagerDuty 側は `dedup_key = static-analysis-<commit sha>` として重複トリガーを抑制する。
- 資格情報登録・疎通テスト手順:
  1. Jenkins (`Manage Jenkins > Credentials`) で「Global scope / (global)」に string 資格情報を作成。
     - ID: `slack-static-analysis-webhook`、Description に「Static Analysis failure channel」。Secret に Slack Incoming Webhook URL を格納。
     - ID: `pagerduty-static-analysis-routing-key`、Description に「Static Analysis incident routing key」。Secret に PagerDuty Events API v2 の Integration Key を格納。
  2. GitHub のリポジトリ設定 `Settings > Secrets and variables > Actions` で下記を登録。
     - `SLACK_STATIC_ANALYSIS_WEBHOOK`: Slack の Incoming Webhook URL。
     - `PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY`: PagerDuty Integration Key。
  3. 疎通テスト（Slack / PagerDuty 共通）:
     - Jenkins: 任意ブランチで `Static Analysis - Diff Gate` を失敗させる（例: Checkstyle 違反を含むダミーファイルをコミット）か、`Replay` で `post { failure { ... } }` ブロック直後に `error 'manual failure for notification test'` を挿入して一度だけ実行。Slack ≪PagerDuty≫ 通知を確認後、コードを元に戻す。
     - GitHub Actions: `workflow_dispatch` を利用し、`scripts/run-static-analysis-diff.sh --base origin/main --target HEAD` 直前で `exit 1` を追加したテストブランチを push。通知確認後に変更を revert。
  4. Slack 通知テンプレート（想定メッセージ）:
     ```text
     静的解析ジョブが失敗しました: Server-Modernized-Static-Analysis #<BUILD_NUMBER>
     https://jenkins.example.com/job/Server-Modernized-Static-Analysis/<BUILD_NUMBER>/
     ```
     GitHub Actions 版は `Server Static Analysis #<RUN_NUMBER> (<RUN_URL>)` を利用。
  5. PagerDuty イベントペイロード（JSON 雛形）:
     ```json
     {
       "routing_key": "<PAGERDUTY_STATIC_ANALYSIS_ROUTING_KEY>",
       "event_action": "trigger",
       "dedup_key": "static-analysis-<context>",
       "payload": {
         "summary": "静的解析ジョブ失敗: <job/run label>",
         "severity": "error",
         "source": "jenkins|github-actions",
         "component": "server-modernized",
         "group": "static-analysis",
         "custom_details": {
           "build_url": "<BUILD_URL>",
           "head_ref": "<branch>",
           "commit": "<sha>"
         }
       },
       "links": [
         {
           "href": "<BUILD_URL>",
           "text": "CI Run"
         }
       ]
     }
     ```
  6. Runbook 追記: `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の CI チェック節に「Static Analysis failure 時は Slack #ops-alert / PagerDuty Modernized Server サービスへ即時通知される」旨と確認手順を追加（Ops 担当）。

## 運用ルール（差分ゲート前提）
- **新規／更新 Java ファイルは Checkstyle / PMD 警告 0 件を必須条件**とする。`scripts/run-static-analysis-diff.sh --base origin/main --target HEAD` を PR 作成前にローカルで実行し、警告が出た場合は修正またはルール例外申請を行う。
- 既存ファイルの既知警告は Phase2 の技術負債として記録し、レガシー修正に合わせて段階的に解消する。差分スクリプト実行時は `git diff` に含まれないためビルド失敗要因としない。
- 例外を申請する場合は `docs/server-modernization/phase2/notes/static-analysis-findings.md` に「警告ID / ファイル / 理由 / 暫定対応期限」を追記し、抑制コメントやルール除外を安易に追加しない。恒久対応チケット番号も合わせて記載する。
- レビューでは `server-modernized/target/static-analysis/(checkstyle|pmd)` の XML を参照し、警告 0 を確認してからマージ可否を判断する。CI ではワーニング発生時にジョブを失敗させ、PR にアーティファクトでレポートを共有する。
- PMD の長期例外（例: 自動生成コードや JavaBeans パターンによる `AvoidInstantiatingObjectsInLoops`）は `pmd-ruleset.xml` 側での一括除外を避け、`static-analysis-findings.md` に記録した期限付きタスクとして扱う。除外が必要な場合もコメントで理由と解除予定を明示する。

## 想定リスクとフォローアップ
- SpotBugs の `RC_REF_COMPARISON_BAD_PRACTICE_BOOLEAN` など Legacy 由来パターンが大量検出される見込み。除外理由をドキュメント化し、修正困難な場合はフェーズ3以降で技術的負債チケット化。
- Checkstyle 導入時に既存ファイルへの大量整形が発生するとレビュー負荷が増す。まずは「変更差分のみ解析」戦略（`git diff --name-only origin/main` を `-Dcheckstyle.includes` に渡すラッパースクリプト）を採用。
- PMD 7.x 系への移行は互換性破壊が予想されるため、当面は 6.x 系で固定しつつ、公式の Jakarta 対応状況を四半期レビューで確認。
- CI 実行時間は SpotBugs 約 +4 分、Checkstyle/PMD 合計 +3 分を見込む。エージェント CPU 4 コア / RAM 4GB を推奨。
- レポート保管とアクションログは `docs/server-modernization/phase2/notes/static-analysis-findings.md`（新設予定）で一元管理し、PHASE2 チームの定例でレビューする。
