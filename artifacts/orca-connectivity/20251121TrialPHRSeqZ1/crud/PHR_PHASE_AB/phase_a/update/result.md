# Phase-A Update (PHR-03)
- コマンド: `curl -u trial:weborcatrial GET /20/adm/phr/accessKey/PHR-WEB1001-20251115`
- HTTP ステータス: `404 Not Found`
- レスポンス: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr03_accessKey_lookup/response.json`
- トレース: `trace/phr03_accessKey_lookup.trace`
- 所見: トライアルサーバーには `/20/adm/phr/accessKey/*` が存在せず 404 を返却。`trialsite.md` サマリにある「一部の管理業務を除き自由にお使い頂けます」但し書きと突合し Blocker=`TrialEndpointMissing` を付与。
