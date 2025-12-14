# 証跡ログ: module_json docPk正数化調査（RUN_ID=`20251214T132016Z`）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/modernization/module_json/docPk正数化調査.md`
- 対象期間: 2025-12-15 10:00 〜 2025-12-17 10:00 (JST)

## 作業ログ
1. PK 採番の強制正数化
   - `common/src/main/java/open/dolphin/infomodel/KarteEntryBean.java` に `@SequenceGenerator`（`opendolphin.hibernate_sequence`）を追加し、`@GeneratedValue` を SEQUENCE 指定に変更。
   - 目的: JPA/Hibernate の AUTO で負数が混入する経路を排除し、シーケンス採番を明示する。
2. addDocument の正数固定
   - `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java` で `document.id<=0` を検知したらシーケンスで上書き採番し、`DocInfoModel.docPk` にも同期。
   - 目的: UI から負の id が渡ってもレスポンス/DB が正数になるようにする。レスポンス整合で UI 側 updateDocument が通る前提を保証。
3. テストダブル調整
   - `server-modernized/src/test/java/open/dolphin/touch/DolphinResourceDocumentTest.java` の Stub をシーケンス正数採番に合わせて上書き。
4. add→update→GET 再発防止テスト
   - `server-modernized/src/test/java/open/dolphin/session/KarteServiceBeanDocPkTest.java` を追加。addDocument で負の id を正数に上書きし docPk を同期すること、同じ PK を使った updateDocument が成功することを検証。
5. updateDocument ガード
   - id<=0 ガードは維持。addDocument 側で正数化されるため UI は応答 PK をそのまま PUT すれば良い状態へ揃えた。

## 観測
- addDocument ログは `addDocument assigned seq id=<正の値>` で返却 PK と一致する想定。
- updateDocument で負数 500 が再現しないよう、UI 側は addDocument 応答の docPk を再利用する。

## TODO
- add→update→GET の再発防止テスト（modernized サーバー側）を追加。
- UI ドキュメントへ正数 PK 再利用手順を追記。
- Stage/Preview 実 API での確認は本 RUN_ID で記録予定。
