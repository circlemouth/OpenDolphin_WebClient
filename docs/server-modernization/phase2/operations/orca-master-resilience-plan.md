# ORCA-05/06/08 フォールトインジェクション／レジリエンス試験計画（RUN_ID=`20251124T174500Z`, 親=`20251124T000000Z`）

目的: ORCA マスター REST（ORCA-05/06/08）の可用性・回復力を検証するため、MSW と curl を用いたフォールトインジェクション手順、期待挙動、証跡取得要件を定義する。リリース計画・A/B 比較・スキーマドリフト検知と併せて、障害時も UI が安全にフォールバックすることを保証する。

## 1. シナリオと期待挙動
| 想定障害 | 注入手段 | リトライ/バックオフ | fallbackUsed | missingMaster | validationError | UI 表示/ガイド |
| --- | --- | --- | --- | --- | --- | --- |
| ORCA DB ダウン / ネットワーク遮断 | MSW: `abort(0)` / `status=503`、curl: `--connect-to 100.102.17.40:8000:127.0.0.1` | 3 回指数バックオフ (0.5s,1s,2s) 後に諦め | true | false (snapshot あり) | false | バナー「ORCA マスター取得に失敗→スナップショットで表示」。再試行ボタン。 |
| スロークエリ >3s | MSW: `delay(4000)`、curl: `--max-time 2` | 2 回（2s,3s）でタイムアウト判定 | true | false | false | バナー「タイムアウト→キャッシュ/スナップショットに切替」。自動再試行 1 回。 |
| 500 / 503 連発 | MSW: `status=500|503`、curl: `-w '%{http_code}'` | 2 回リトライ（0.5s,1s）。3 回目以降はフォールバック固定 | true | false | false | 赤バッジ＋警告バナー。`retry-after` があれば UI に表示。 |
| 429 (レート制限) | MSW: `status=429` + `Retry-After`、curl: `-H "Retry-After: 5"` | `Retry-After` 秒待機→再試行 1 回。その後 snapshot へ | true | false | false | バナーに「N 秒後に再試行」カウントダウン。 |
| DNS 失敗 | curl: `--resolve api.orca.invalid:8000:0.0.0.0` | リトライなし（即フォールバック） | true | true (応答なし) | false | バナー「名前解決失敗」。再試行ボタンのみ。 |
| TLS 失敗（証明書エラー） | curl: `--cacert invalid.crt` / omit `-k` | リトライなし（即フォールバック） | true | false | false | バナー「TLS 検証失敗」。ガイドで dev 証明書再取得を案内。 |

- 監査メタ期待値: `runId=20251124T174500Z`, `dataSource=snapshot|mock`, `cacheHit=false`, `fallbackUsed` は上表どおり、`missingMaster` は DNS 失敗時のみ true。`validationError` はすべて false（必須フィールド欠損が発生した場合のみ true とし、今回の障害試験では発火しない前提）。
- UI バナー文言は CHART_UI_GUIDE の warning トーンを使用し、再試行リンクは fetch フックの `refetch()` を呼び出す。

## 2. MSW フォールトインジェクション手順
1. `web-client` で MSW を有効化（デフォルト）。
2. `artifacts/api-stability/20251124T174500Z/resilience/templates/msw-faults.example.ts` を `web-client/src/mocks/handlers/orcaMasterFaults.ts` にコピーし、必要に応じてステータス・遅延を調整。
3. `npm run dev` 起動後、ブラウザで `window.__mswSetFault('db-down')` などを実行してシナリオ切替（例はテンプレート内の `scenarioId` を使用）。
4. 試験後は `window.__mswClearFault()` を実行し、標準レスポンスへ戻す。MSW の unregister は不要。

## 3. curl 疑似障害再現テンプレ
- テンプレ: `artifacts/api-stability/20251124T174500Z/resilience/templates/curl-faults.example.sh`
- 実行例（DB ダウン想定）:
  ```bash
  RUN_ID=20251124T174500Z
  BASE=http://100.102.17.40:8000
  curl --connect-to 100.102.17.40:8000:127.0.0.1 -m 2 -s -D - "${BASE}/orca/master/address?zip=0600000" \
    -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code} time_total=%{time_total}\n'
  ```
- TLS 失敗確認: `curl --cacert artifacts/api-stability/20251124T174500Z/resilience/templates/invalid-ca.crt "${BASE}/orca/master/address?zip=0600000"`
- 429 想定: `curl -s -D - -o /dev/null -H "Retry-After: 5" "${BASE}/orca/master/generic-price"`

## 4. 証跡・監査メタ チェックリスト
| 項目 | 期待値 | 保存先 | 判定 |
| --- | --- | --- | --- |
| HAR | 全リクエスト/レスポンスを保存、status/latency を含む | `artifacts/api-stability/20251124T174500Z/resilience/<date>/har/` | PASS/FAIL |
| Console/Network log | バナー表示・retry/backoff メッセージを含む | `.../console/` | PASS/FAIL |
| Audit log | `runId/dataSource/cacheHit/missingMaster/fallbackUsed/validationError/traceId` が空でない | `.../audit/` | PASS/FAIL |
| Metrics | P99/5xx/429 が閾値内（release plan §4 と整合） | `.../metrics/` | PASS/FAIL |
| 再試行誘導 | UI バナーに再試行/手動ガイドが表示 | スクショ or HAR | PASS/FAIL |

- 判定結果は `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run-20251124T174500Z` に貼り付ける。

## 5. 成果物・命名規約
- テンプレ配置: `artifacts/api-stability/20251124T174500Z/resilience/templates/`
  - `msw-faults.example.ts`: MSW 用 fault 定義サンプル（scenarioId/handler）。
  - `curl-faults.example.sh`: curl での疑似障害再現サンプル。
  - `invalid-ca.crt`: TLS 失敗再現用のダミー CA（任意差し替え可）。
- 実測ログ: `artifacts/api-stability/20251124T174500Z/resilience/<UTC>/` 配下に `har/`, `console/`, `audit/`, `metrics/`, `notes.md` を作成。
- ファイル命名: `<scenarioId>-<timestamp>-{har|console|audit|metrics}.ext`。例: `db-down-20251124T180500Z-har.har`。

## 6. 参照
- `docs/server-modernization/phase2/operations/orca-master-release-plan.md`（閾値とロールバック手順）
- `docs/server-modernization/phase2/operations/orca-master-ab-compare-plan.md`（A/B 比較の検証入力を再利用）
- `docs/server-modernization/phase2/operations/assets/openapi/README.md`（正式 OpenAPI と型生成）
- `src/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md`（クライアント側フォールバック設計）
