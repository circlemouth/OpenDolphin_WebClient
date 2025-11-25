# RUN_ID=20251115TorcaPHRSeqZ1 概要
- Task: PHR Phase-A/B 実測（PHR-02/03/10 + PHR-01/04/05/08/09）
- 実施日時: 2025-11-15 09:15 JST（推定）
- 結果: PKCS#12 パスフレーズ未共有のため 8 API すべて `curl exit=58 (could not parse PKCS12 file)`。
- 対応: `trace/` に DNS/TLS までのログを保存、`httpdump/*/error.log` に `mac verify failure` を記録。`screenshots/` には 1x1 PNG placeholder を配置し、パス受領後に実データへ差し替える。
- Blocker: `ORCAcertification/103867__JP_u00001294_client3948.p12` の pass が不明。Ops へ依頼中（`todo/PHR_OPEN_ITEMS.md`）。
