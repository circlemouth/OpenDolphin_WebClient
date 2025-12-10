# ORCAcertification情報棚卸し (RUN_ID=20251211T000000Z)
- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 JST / 優先度: high / 緊急度: high / YAML ID: `src/orca_prod_bridge/planning/ORCAcertification情報棚卸し.md`
- 目的: ORCAcertification 配下で管理する証明書・接続先・認証方式と、機微情報の保管手順を棚卸しし、RUN_ID 記録フォーマットと参照ログパスを一元化する。

## 参照チェーン
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
- 関連 Runbook: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` (ORCA_CERTIFICATION_ONLY 参照を要求)
- 資格情報メモ: `ORCAcertification/README_PASSPHRASE.md`

## 証跡・接続先・認証方式の現況
- **接続先/認証 (現存資料より)**  
  - ベース URL: `https://weborca.cloud.orcamo.jp`。`ORCAcertification/README_PASSPHRASE.md` では `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" ...` を前提とし、PKCS#12 (`103867__JP_u00001294_client3948.p12`) と Basic 認証を環境変数経由で読み込む手順のみが確認できる。
  - リポジトリには `ORCAcertification/` 配下の秘匿ファイルが `.gitignore` 済みで、値は `<MASKED>` で扱う運用になっている。
- **既存証跡**  
  - `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` / `2025-11-19-phr-seq-phaseCDE.md` にて、上記 PKCS#12 と Basic を用い `https://weborca.cloud.orcamo.jp` の PHR API へ `curl --cert-type P12` で接続した記録あり。
  - `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-cutover.md` で WebORCA トライアルへの統一運用が一度示されたが、後続で ORCAcertification-only 方針へ再集約された履歴がある。
- **現行ポリシー (要復旧)**  
  - `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` とその証跡 `docs/server-modernization/phase2/operations/logs/20251203T134014Z-orcacertification-only.md` がリポジトリ上に存在しない。`ORCA_CONNECTIVITY_VALIDATION.md` では「本番資格情報および ORCAcertification/ はアーカイブ扱い・Basic 認証のみを ORCA_CERTIFICATION_ONLY に従って使用」と記載されており、具体的な接続先 URL や Basic ユーザーが確認できない状態。

## 機微情報の保管・記録手順
- ORCAcertification 配下の PKCS#12 / Basic 情報は git 管理外とし、操作時のみ環境変数へ読み込み、作業後に `unset ORCA_PROD_*` で消去する。
- 証跡・ログには認証値を平文で残さず `<MASKED>` を用いる。httpdump などの成果物は `artifacts/orca-connectivity/<RUN_ID>/` 以下へ、Runbook ログは `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へ残す。
- ファイル権限は 600 を維持し、二次配布時は Keychain/Vault 等のセキュアストアへ退避する。

## RUN_ID とログパスのまとめ
- フォーマット: `YYYYMMDDThhmmssZ` を採番し、ドキュメント・証跡・ログで同一値を使用する。
- 本タスクの RUN_ID: `20251211T000000Z`。対応ログ/ドキュメント:
  - 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251211T000000Z-orcacertification-inventory.md`
  - 計画メモ: `src/orca_prod_bridge/planning/ORCAcertification情報棚卸し.md` (本ファイル)

## ギャップとフォローアップ
- ORCA_CERTIFICATION_ONLY.md および `20251203T134014Z-orcacertification-only.md` が欠損しており、現行の接続先 URL / Basic ユーザー / claim.host 設定を確認できない。復旧または最新の正式手順の提示が必要。
- PKCS#12 パスフレーズが未記載のままかを再確認し、ORCAcertification/ 内の秘匿ファイル所在・整合性を点検する。
- 追加の接続試験を行う際は新 RUN_ID を採番し、`artifacts/orca-connectivity/<RUN_ID>/` と operations/logs へ同一 ID で証跡を保存する。
