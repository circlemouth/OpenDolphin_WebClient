# 2025 Q4 アーカイブ

Web クライアントおよびサーバーモダナイズ資料のうち、直近 180 日間参照予定のないものを退避するためのフォルダ。原則として以下の運用に従う。

1. アーカイブ前に `docs/web-client/planning/phase2/DOC_STATUS.md` の対象行へ「Archive 移動日」「復活条件」を記載する。
2. 元ファイル側にはスタブを残し、アーカイブ先（本フォルダ）へのリンクと移動理由を明記する。
3. 参照が必要になった場合はアーカイブ先を更新するのではなく、新規ドキュメントとして `docs/` 直下に作成し、必要箇所を抜粋して戻す。

## 初期移動候補
- `docs/server-modernization/phase2/notes/common-dto-diff-A-M.md` / `...N-Z.md`: 差分表を CSV 化して `dto-diff/` に保存予定。
- `docs/server-modernization/phase2/notes/static-analysis-plan.md`: Ops Runbook へ移管後に本文をこちらへ退避予定。
- `docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`: 本編へ統合済みのため、証跡説明のみ保存予定。

`dto-diff/` 配下には `README.md` と CSV を格納し、Legacy 互換確認時のみ参照する。

## 2025-11-15 追記
- `docs/server-modernization/phase2/notes/common-dto-diff-A-M.md` / `common-dto-diff-N-Z.md`: DTO 差分のメンテ先を Archive に寄せ、今後は CSV 化・Evidence 参照時のみ利用。
- `docs/server-modernization/phase2/operations/WORKER0_MESSAGING_BACKLOG.md`: JMS backlog は `domains/RESERVATION_BATCH_MIGRATION_NOTES.md` へ統合済みのため参照頻度が無くなった。
- `docs/web-client/process/SWING_PARITY_CHECKLIST.md`: Swing との parity 管理は PHASE2_PROGRESS へ集約し、旧チェックリストはアーカイブ保管。
- `docs/server-modernization/legacy-server-modernization-checklist.md`: Legacy サーバー向け計画書は Phase2 Modernized Runbook に吸収されたため退避。
- `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`（および同日以前の ORCA/Observability ログ）: トライアル切替後の参照頻度が低いため、長期保管用として移動。
