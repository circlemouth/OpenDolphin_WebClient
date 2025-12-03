# Phase-B Overview (`GET /20/adm/phr/phaseB`)
- コマンド: `curl -v -u trial:weborcatrial -H "Accept: application/json" https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseB`
- HTTP ステータス: `404 Not Found`
- リクエスト: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseB_overview/request.http`
- レスポンス: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseB_overview/response.json`（ヘッダー=`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseB_overview/response.headers`, ステータス=`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseB_overview/status.txt`）
- トレース: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/trace/phaseB_overview.trace`
- 所見: Snapshot 行2-7（「一部の管理業務を除き自由にお使いいただけます」「登録なさった情報は誰でも参照でき」「管理者によって定期的にすべて消去」「利用不可機能: ...一括処理が無効化」）を根拠に `/20/adm/phr/phaseB` は Trial で無効となり HTTP404。Blocker=`TrialEndpointMissing` を維持し、Modernized REST で 200/403 ガードを先行実装する。引用元: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` Snapshot Summary。
