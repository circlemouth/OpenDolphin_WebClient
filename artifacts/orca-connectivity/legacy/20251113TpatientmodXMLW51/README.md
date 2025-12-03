# RUN_ID: 20251113TpatientmodXMLW51

- 対象: `/orca12/patientmodv2` XML テンプレ整備（Request_Number/Perform_Mode/Mod_Key 必須化、Patient_ID 桁数ルール注記）。
- 変更内容:
  - `docs/server-modernization/phase2/operations/assets/orca-api-requests/14_patientmodv2_request.xml` を UTF-8 XML で新規作成し、公式サンプル値とコメントを追記。
  - `scripts/tools/orca-curl-snippets.js` へ XML テンプレ検出・`Content-Type: application/xml; charset=UTF-8`・`--data-binary` をサポートする処理を追加。
  - Runbook §5 と Evidence Index を更新し、patientmodv2 行から XML テンプレへ直接リンク。
- テスト: `node scripts/tools/orca-curl-snippets.js --dry-run` で patientmodv2 行が `--data-binary @...14_patientmodv2_request.xml` になることを確認。（実行テスト不要指示のため送信は省略。）
