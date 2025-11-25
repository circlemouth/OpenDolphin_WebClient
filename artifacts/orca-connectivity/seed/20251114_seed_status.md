# Seed 適用前提状況（2025-11-14 22:45 JST）

- `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` は ORCA DB の `tbl_ptinf/tbl_ptnum/...` を DELETE→INSERT する SQL。`tmp/sql/api21_medical_seed.sql` と同一内容で、患者 `ptid=1 (patient_id_1=00000001)`・保険 (hknid=1)・公費 (kohid=1)・当日受付 (`tbl_uketuke`)・診療行為 (`tbl_sryact`) を初期化する。
- `docs/server-modernization/phase2/operations/assets/seeds/inpatient_master_seed_20251114.md` は入院マスタ（病棟/病室/食事区分/ADL/ユーザー権限）の UI 操作手順を記録したドキュメントで、`api21_medical_seed.sql` の患者/保険/医師データを前提とする。
- 差分: `api21_medical_seed.sql` は ORCA DB へ直接投入できる SQL、`inpatient_master_seed_20251114.md` は ORCA UI 操作と API 連携 Runbook の指針（SQL ではない）。投入順序は患者系 → 入院マスタ（medical → inpatient）で依存関係がある。
- 本番 WebORCA (`https://weborca.cloud.orcamo.jp:443`) へ接続するための PKCS#12（`ORCAcertification/103867__JP_u00001294_client3948.p12`）パスフレーズが現在も未取得。`openssl pkcs12 -in ... -passin pass:<candidate>` を `APIキー` や `jimu6482`（施設ログイン）で試行したが `Mac verify error: invalid password?` となり、証明書を復号できない。
- `ORCAcertification/README_PASSPHRASE.md` には「同ディレクトリにパスフレーズを平文保管」と記載があるが、`新規 テキスト ドキュメント.txt` には URL / port / facility login / ORCAMO ID / APIキーのみが含まれ、パスフレーズは記載されていないため Ops からの共有待ちとなっている。
- PKCS#12 パスが無いため `curl --cert-type P12` や `psql` の TLS クライアント証明認証を実施できず、`api21_medical_seed.sql` および入院マスタ seed の本番 DB 適用は保留状態。
