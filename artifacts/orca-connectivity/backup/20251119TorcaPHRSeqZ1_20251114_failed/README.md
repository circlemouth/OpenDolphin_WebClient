# RUN_ID=20251119TorcaPHRSeqZ1 概要
- Task: PHR Phase-C/D/E（PHR-06/07/11）実測証跡取得 / RUN_ID=20251119TorcaPHRSeqZ1
- 実施日時: 2025-11-14 23:22 JST（UTC 2025-11-14T14:22:33Z）
- 結果: `curl --cert-type P12` がすべて `curl exit=58 (could not parse PKCS12 file)` で失敗し、HTTP レイヤー以前で停止。`ORCAcertification/新規 テキスト ドキュメント.txt` 5 行目の PKCS#12 パスが空／旧値のままで、Secrets 承認済みの前提が崩れている。
- 取得状況: `httpdump/phr06_identityToken|phr07_image|phr11_container` に PKCS#12 失敗ログと `trace/phr-0X_*.log` を保存。`ServerInfoResource` は `server-modernized-dev` が解決できず `curl: (6) Could not resolve host`。WildFly ログは未取得（`wildfly/phr_20251119TorcaPHRSeqZ1.log` に理由を記録）。スクリーンショットは placeholder で保管。
- TODO: (1) Ops へ PKCS#12 passphrase 再発行を依頼し、再取得後に Phase-C/D/E を再実行。(2) `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md`／`2025-11-13-orca-connectivity.md` へ失敗理由と再実施計画を記録。(3) Secrets 認証結果を `wildfly/identityToken.log` へ残す仕組みと `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行の次アクションを更新。
