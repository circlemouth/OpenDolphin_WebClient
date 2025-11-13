# Reporting headers

`ops/tests/reporting/karte_cli.sh` から `PARITY_HEADER_FILE` に渡すヘッダーテンプレート群。
helper コンテナで実行する場合は `-v "$PWD/tmp/reporting-headers":/workspace/tmp/reporting-headers` のようにマウントし、
`PARITY_HEADER_FILE=/workspace/tmp/reporting-headers/doctor.headers` を指定する。
