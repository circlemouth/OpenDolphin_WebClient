# PHR-03 lookup memo (RUN_ID=20251115TorcaPHRSeqZ1)
- accessKey=`PHR-DUMMY-LOOKUP-9999` / patient=`WEB1001` を対象。
- 期待: Facility mismatch 403 または PKCS#12 認証失敗ログ。
## 2025-11-15 Attempt
- `curl` exit=58（PKCS#12 mac verify failure）。`trace/phr03_accessKey_lookup_trace.log` に DNS/Conn 成功→PKCS12 読み込みで失敗した履歴を保存。
