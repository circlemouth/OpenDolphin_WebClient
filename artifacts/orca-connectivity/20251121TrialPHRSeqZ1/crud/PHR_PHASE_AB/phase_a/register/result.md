# Phase-A Register (PHR-02)
- コマンド: `curl -u trial:weborcatrial -X PUT https://weborca-trial.orca.med.or.jp/20/adm/phr/accessKey`
- リクエスト: `phr-seq/10_key-management/PHR-02_request.json`
- HTTP ステータス: `405 Method Not Allowed`
- レスポンス: `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/httpdump/phr02_accessKey/response.json`
- ヘッダー: `.../response.headers`
- トレース: `trace/phr02_accessKey.trace`
- 所見: トライアルサイト側で PUT が許可されておらず `Method Not Allowed`。`trialsite.md`「お使いいただけない機能」節に従い Blocker=`TrialLocalOnly` 扱い。
