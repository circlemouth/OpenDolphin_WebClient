# RUN_ID=20251115TrialConnectivityCodexZ1 data-check

- 2025-11-15 22:47 JST (CLI / Codex sandbox) に WebORCA トライアル UI を開こうとしたが、GUI ブラウザがないため `https://weborca-trial.orca.med.or.jp/` の画面確認・スクリーンショット取得は実施不可。`assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` を参照し、次回 GUI 端末で実施する TODO を残した。
- 代替として公開 API を実行し、seed に記載の患者番号（5 桁 `00001`）、医師コード `0001`、保険情報を `patientgetv2` で確認。
  - `patientgetv2?id=00000001` は `Api_Result=10`（存在せず）。trialsite では患者番号桁数=5 のため `00001` を指定し、`Api_Result=00`（氏名=事例　一、保険=国保 060/任意自費 980 等）を取得。
  - 証跡: `patientgetv2_2025-11-15T13-47-46Z.xml`（失敗例）/`patientgetv2_00001_2025-11-15T13-47-55Z.xml`（成功例）。
- Physicians/Insurance seed は trialsite「システムの設定情報」および `patientgetv2` レスポンスから確認済み。次回 GUI 端末確保時に 01 医事業務→受付画面スクリーンショットを取得する。
