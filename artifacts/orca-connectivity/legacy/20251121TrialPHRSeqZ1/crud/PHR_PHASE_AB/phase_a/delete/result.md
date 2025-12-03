# Phase-A Delete (PHR-02 DELETE + patient lookup)
- コマンド: `curl -u trial:weborcatrial -X DELETE https://weborca-trial.orca.med.or.jp/20/adm/phr/accessKey/PHR-WEB1001-20251115`
- HTTP ステータス: `405 Method Not Allowed`
- 補助確認: `GET /20/adm/phr/patient/WEB1001` も 404 (`httpdump/phr10_patient/response.json`)
- トレース: `trace/phr02_accessKey_delete.trace`, `trace/phr10_patient.trace`
- 所見: Trial では delete/patient 関連 API が閉鎖されているため削除検証不可。Blocker=`TrialEndpointMissing`。
