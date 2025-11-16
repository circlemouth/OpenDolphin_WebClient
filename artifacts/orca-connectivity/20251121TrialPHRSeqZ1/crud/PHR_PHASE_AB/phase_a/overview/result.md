# Phase-A Overview (`GET /20/adm/phr/phaseA`)
- コマンド: `curl -v -u trial:weborcatrial -H "Accept: application/json" https://weborca-trial.orca.med.or.jp/20/adm/phr/phaseA`
- HTTP ステータス: `404 Not Found`
- リクエスト: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseA_overview/request.http`
- レスポンス: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseA_overview/response.json`（ヘッダー=`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseA_overview/response.headers`, ステータス=`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phaseA_overview/status.txt`）
- トレース: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/trace/phaseA_overview.trace`
- 所見: Trial サイトは Snapshot 行2-7 にある「一部の管理業務を除き自由にお使いいただけます」「登録なさった情報は誰でも参照でき」「管理者によって定期的にすべて消去」方針に従い、管理系 API `/20/adm/phr/phaseA` を公開しておらず HTTP404。Blocker=`TrialEndpointMissing` とし、Modernized REST 経路での UI ガード実装のみ進める。引用元: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` Snapshot Summary。
