# Phase2 ドキュメント ロールオフ手順（RUN_ID=`20251203T203000Z`）

## 目的
- Phase2 ドキュメントを Legacy/Archive として固定し、現行作業で誤参照されないようにする。
- Phase2 以降の作業は `docs/DEVELOPMENT_STATUS.md` を起点に運用する。

## ロールオフ方針
1. **Phase2 配下の新規追加禁止**: `docs/web-client/planning/phase2/` / `docs/server-modernization/phase2/` / `docs/managerdocs/PHASE2_*` は参照専用とする。
2. **参照元の明示**: Phase2 のハブ（INDEX/README/manager overview）に Legacy 注記を付与し、現行の参照先を `docs/DEVELOPMENT_STATUS.md` に統一する。
3. **証跡ログの固定**: ロールオフの証跡は `docs/server-modernization/phase2/operations/logs/20251203T203000Z-phase2-legacy-mark.md` に集約する。
4. **アーカイブ移行**: Active ではない資料は `docs/archive/<YYYYQn>/` へ移行し、履歴管理のみ継続する。

## 補足
- 本ファイルは参照切れを防ぐために 2025-12-19 に再作成した。Phase2 の扱い（Legacy/Archive）自体は変更していない。
