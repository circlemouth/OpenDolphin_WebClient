# module_json docPk正数化調査

- RUN_ID: `20251214T132016Z`
- 期間: 2025-12-15 10:00 〜 2025-12-17 10:00 (JST)
- 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/modernization/module_json/docPk正数化調査.md`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本書

## ゴール
- addDocument が負の docPk を返す経路を特定し、正の PK を強制採番する。
- updateDocument の id<=0 ガードと UI 側採番の整合を揃え、負数 PK で 500 となる事象を解消する。
- add→update→GET の再発防止テスト方針を整理する。

## 実施内容（今回）
- `KarteEntryBean` の PK 採番を明示的に `opendolphin.hibernate_sequence` シーケンスへ固定（`@SequenceGenerator` 追加）。
- `KarteServiceBean#addDocument` で負の `document.id` を無条件にシーケンス採番へ上書きし、`DocInfoModel.docPk` と同期させてレスポンス整合を保証。
- `updateDocument` の負数防御を維持しつつ、正の PK が必ず入る前提へ合わせた。
- テストダブル（`DolphinResourceDocumentTest.StubKarteService`）を正の採番模倣へ更新。

## 観測/決定
- UI から負の docPk が送られても addDocument で正の PK を採番するため、レスポンス/DB は正数で返る。
- updateDocument は従来通り id<=0 を拒否するが、UI には addDocument 応答をそのまま再利用すればよくなる。

## 残タスク
- add→update→GET の再発防止 E2E/IT を server-modernized 側に追加（順次対応）。
- UI 側の docPk 再利用手順を module_json UX/実装ドキュメントへ反映。
- DOC_STATUS/README を RUN_ID 同期し、証跡ログを作成する。
