# PHR シーケンス証跡テンプレート

`RUN_ID={{RUN_ID}}` を差し込んで `scripts/orca_prepare_next_run.sh {{RUN_ID}}` 実行後、本テンプレートを `artifacts/orca-connectivity/{{RUN_ID}}/` 配下にコピーする。Task-C（RUN_ID=20251114TphrEvidenceZ1）ではこのテンプレを初期化し、PHR-01〜11 の証跡保存ルールを Runbook §4.3.1 と同期した。

## ディレクトリ構成
```
artifacts/orca-connectivity/{{RUN_ID}}/
├── httpdump/                      # cURL -D/-o 出力（共通）
├── trace/                         # --trace-ascii 出力
├── serverinfo/claim_conn.json     # ServerInfoResource (Modernized)
├── logs/                          # PHR サマリメモ（labtest, accessKey 等）
├── wildfly/                       # server.log 抜粋 / identityToken 例外
├── screenshots/                   # `phr-0X_response.png` / UI プレビュー
├── todo/PHR_OPEN_ITEMS.md         # 未完タスク・seed 作業メモ
└── phr-seq/
    ├── 10_key-management/PHR-0{2,3,10}_*.http
    ├── 20_view-text/{abnormal,allergy,disease,labtest,medication}/
    ├── 30_layer-id/identityToken/
    ├── 40_image/image/
    ├── 50_container/container/
    └── 60_export-track/README.md
```

## RUN_ID 差し替え手順
1. `export RUN_ID=20251114TphrEvidenceZ1`（テンプレ）または `RUN_ID=YYYYMMDDTorcaPHRSeqZ#`（本番）。
2. `scripts/orca_prepare_next_run.sh ${RUN_ID}` を実行し、`artifacts/orca-connectivity/${RUN_ID}/` を生成。
3. `cp -R artifacts/orca-connectivity/TEMPLATE/phr-seq/* artifacts/orca-connectivity/${RUN_ID}/` で雛形を展開。
4. `echo "PHR template initialized" > artifacts/orca-connectivity/${RUN_ID}/README.md` に初期化ログを残す。

## cURL 雛形
```
API_PATH="/20/adm/phr/accessKey"
REQUEST=phr-seq/10_key-management/PHR-02_request.json
curl --silent --show-error --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H "Content-Type: application/json; charset=UTF-8" \
     -H "Accept: application/json" \
     -H "X-Facility-Id: ${TOUCH_FACILITY_ID}" \
     -H "X-Touch-TraceId: ${RUN_ID}" \
     -H "X-Access-Reason: phr-evidence" \
     --data-binary @"${REQUEST}" \
     "https://weborca.cloud.orcamo.jp${API_PATH}" \
     -D "httpdump${API_PATH//\//_}.headers" \
     -o "httpdump${API_PATH//\//_}.json" \
     --trace-ascii "trace${API_PATH//\//_}_trace.log"
```
※ Layer ID（PHR-06）は `-H "X-Consent-Token: ..."` を追加する。画像 API（PHR-07）は `-o httpdump/.../response.bin` に保存し、`screenshots/phr-07_image.png` へビューワのスクリーンショットを残す。

## ServerInfo / WildFly 記録
- `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u <admin>` → `serverinfo/claim_conn.json`。
- `tail -n 200 server/standalone/log/server.log | tee wildfly/phr_${RUN_ID}.log` で RESTEasy 例外を併記。

## スクリーンショット要件
- `screenshots/phr-0X_response.png`: cURL レスポンス or SystemPreferencesPage の PHR タブプレビュー。
- `screenshots/layer-id/token-issue.png`: PHR-06 実施時に Layer ID 発行画面キャプチャ。
- `screenshots/container/legacy-diff.png`: PHR-11 で Legacy vs Modernized diff。

## TODO テンプレ
`todo/PHR_OPEN_ITEMS.md` に以下フォーマットで追記する。
```
- [ ] PHR-09 medication: TouchMedicationFormatter 置換待ち （担当: ___ / 期限: ___ / 参照 RUN_ID）
```

更新したら `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#phr-連携テンプレ` と `docs/web-client/planning/phase2/DOC_STATUS.md` へ RUN_ID・証跡パスを共有する。
