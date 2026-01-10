# WebORCA Trial visitptlstv2 curl (RUN_ID=20260110T194349Z)

## Request (masked)
```
curl -u '<MASKED>' \
  -H 'Content-Type: application/xml; charset=UTF-8' \
  -H 'Accept: application/xml' \
  --data-binary $'<data>\n  <visitptlstreq type="record">\n    <Request_Number type="string">01</Request_Number>\n    <Visit_Date type="string">2026-01-11</Visit_Date>\n  </visitptlstreq>\n</data>\n' \
  'https://weborca-trial.orca.med.or.jp/api/api01rv2/visitptlstv2'
```

## Response
- status: $(cat "$OUT_DIR/visitptlstv2_status.txt")
- headers: $OUT_DIR/visitptlstv2_headers.txt
- body: $OUT_DIR/visitptlstv2_response.xml
