# Demo API 整理
- 日時: 2026-01-07 09:00 - 2026-01-09 09:00 / 優先度: low / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md`

## 目的
- Demo 系 API の棚卸しと移植状況を明文化する。
- 必要な API だけ残し、不要な API の廃止方針を決める。

## 現状整理
- JSON 版: `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java`
- XML 版: `server-modernized/src/main/java/open/dolphin/touch/DemoResource.java` / `server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java`
- 公開設定: `server-modernized/src/main/webapp/WEB-INF/web.xml` の `resteasy.resources` に 3 種が登録済み。
- 参照元: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Demo セクション。

## 利用状況（Web クライアント）
- `/demo` を直接呼び出す実装は Web クライアント側で確認できない（`web-client/` を全文検索）。
- `web-client/scripts/ui-smoke.mjs` に demo ログイン情報があるが、Demo API 呼び出しの記述はなし。

## 利用確認（RUN_ID: 20251224T160500Z）
- 検索対象: `web-client/`, `docs/`, `scripts/`（Phase2/Legacy ドキュメントは参照のみ）
- 検索方法: `rg -n "/demo" web-client scripts docs` および `rg -n "demo|Demo|デモ" docs web-client`
- 証跡:
  - `/demo` の呼び出しは `web-client/` 側で検出されず、`docs/` 内の記述は API 在庫/整理文書に限定。
  - Web クライアントは「デモシェル/Outpatient Mock」記述が中心で、Demo API の具体的利用は記載なし。
  - `web-client/scripts/ui-smoke.mjs` は demo 用のログイン情報のみ。
  - 参照ファイル: `docs/web-client/README.md`, `docs/web-client/architecture/future-web-client-design.md`, `web-client/src/AppRouter.tsx`, `web-client/scripts/ui-smoke.mjs`

## 追加調査（RUN_ID: 20251224T162000Z）
- 検索対象: `docs/`, `ops/`, `scripts/`, `tests/`, `server-modernized/`, `web-client/`
- 検索方法: `rg -n "demo|Demo|デモ|/demo|DemoResource|touch\\.demo" docs ops scripts tests server-modernized web-client`
- 証跡:
  - `/demo` の実利用を示す手順書・運用フローは非 Phase2 ドキュメントで検出されず。
  - `docs/web-client/README.md` は「デモシェル/Outpatient Mock」を記載するが `/demo` 利用の記述なし。
  - Web クライアント側コードはデモ UI 表現のみで、Demo API 呼び出しなし（`web-client/src/AppRouter.tsx` 等）。

## 追加調査（RUN_ID: 20251224T163500Z）
- 検索対象: `docs/`, `ops/`, `scripts/`, `tests/`, `web-client/`, `server-modernized/`
- 検索方法: `rg -n "demo|Demo|デモ|/demo|DemoResource|touch\\.demo" docs ops scripts tests web-client server-modernized`
- 証跡:
  - Touch/営業デモ手順に相当する一次情報は非 Phase2 ドキュメントでは検出できず。
  - `ops/postman/DemoResourceAsp.postman_collection.json` は Legacy/Modernized のパリティ確認用途（運用手順ではない）。
  - `ops/tests/storage/attachment-mode/README.md` はデモ患者記述のみで `/demo` API の利用記述なし。
  - Web クライアント/テストコードはデモ UI 表現に留まり、Demo API 呼び出しは見当たらない。

## Demo API 維持/廃止/保留 判定（RUN_ID: 20251224T163500Z）
| ID | エンドポイント | 判定 | 理由 / 根拠 |
| --- | --- | --- | --- |
| Demo-01 | `GET /demo/user/{param}` | 保留 | Web クライアント/非 Phase2 ドキュメントで利用記述なし。Touch/営業デモ手順の一次情報が未取得。 |
| Demo-02 | `GET /demo/patient/firstVisitors/{param}` | 保留 | 同上。 |
| Demo-03 | `GET /demo/patient/visit/{param}` | 保留 | 同上。 |
| Demo-04 | `GET /demo/patient/visitRange/{param}` | 保留 | 同上。 |
| Demo-05 | `GET /demo/patient/visitLast/{param}` | 保留 | 同上。 |
| Demo-06 | `GET /demo/patient/{pk}` | 保留 | 同上。 |
| Demo-07 | `GET /demo/patients/name/{param}` | 保留 | 同上。 |
| Demo-08 | `GET /demo/patientPackage/{pk}` | 保留 | 同上。 |
| Demo-09 | `GET /demo/module/{param}` | 保留 | 同上。 |
| Demo-10 | `GET /demo/module/rp/{param}` | 保留 | 同上。 |
| Demo-11 | `GET /demo/module/diagnosis/{param}` | 保留 | 同上。 |
| Demo-12 | `GET /demo/module/schema/{param}` | 保留 | 同上。 |
| Demo-13 | `GET /demo/module/laboTest/{param}` | 保留 | 同上。 |
| Demo-14 | `GET /demo/item/laboItem/{param}` | 保留 | 同上。 |
| Demo-15 | `GET /demo/document/progressCourse/{param}` | 保留 | 同上。 |

## Demo API 一覧（現行実装）
| 種別 | エンドポイント | JSON | XML | 備考 |
| --- | --- | --- | --- | --- |
| Demo-01 | `GET /demo/user/{param}` | ○ | ○ | デモログイン用ユーザー情報 |
| Demo-02 | `GET /demo/patient/firstVisitors/{param}` | ○ | ○ | 初診患者一覧 |
| Demo-03 | `GET /demo/patient/visit/{param}` | ○ | ○ | 来院履歴 |
| Demo-04 | `GET /demo/patient/visitRange/{param}` | ○ | ○ | 期間指定来院履歴 |
| Demo-05 | `GET /demo/patient/visitLast/{param}` | ○ | ○ | 最終来院情報 |
| Demo-06 | `GET /demo/patient/{pk}` | ○ | ○ | 患者基本情報 |
| Demo-07 | `GET /demo/patients/name/{param}` | ○ | ○ | 氏名検索 |
| Demo-08 | `GET /demo/patientPackage/{pk}` | ○ | ○ | 患者パッケージ |
| Demo-09 | `GET /demo/module/{param}` | ○ | ○ | 任意モジュール取得 |
| Demo-10 | `GET /demo/module/rp/{param}` | ○ | ○ | 処方モジュール |
| Demo-11 | `GET /demo/module/diagnosis/{param}` | ○ | ○ | 診断モジュール |
| Demo-12 | `GET /demo/module/schema/{param}` | ○ | ○ | スキーマ画像 |
| Demo-13 | `GET /demo/module/laboTest/{param}` | ○ | ○ | 検査結果モジュール |
| Demo-14 | `GET /demo/item/laboItem/{param}` | ○ | ○ | ラボトレンド |
| Demo-15 | `GET /demo/document/progressCourse/{param}` | ○ | ○ | 経過記録 |

## 未移植・差分
- `DemoResourceAsp` は上記 15 API を JSON 化済み。コード上の未移植 API は現状なし。
- `MODERNIZED_REST_API_INVENTORY.md` の Demo セクションに「欠落エンドポイント」として記載が残っているため、棚卸し結果と整合させる。

## 廃止方針（明文化）
- **対象**: Web クライアント側で呼び出しが確認できず、Demo 専用業務フローでも使用が確認できない API。
- **判断基準**:
  - Web クライアントおよび Touch/営業デモ手順で利用実態がない。
  - Demo 用固定データや監査イベントが維持されていない。
  - 代替 API（/touch 系）が存在し機能重複している。
- **廃止までの手順**:
  1. 利用実態の確認（Web/Touch/営業デモ）と合意形成。
  2. 廃止候補 API と移行期限をドキュメントへ明記（このファイルと API 在庫）。
  3. XML 版の公開解除（`web.xml` から DemoResource 系を整理）と JSON 版へ統一。
  4. Demo 環境での接続検証を実施し、削除または 410/404 へ移行。
- **合意待ち/未確認（RUN_ID: 20251224T160500Z）**:
  - Touch/営業デモ手順の一次情報（運用/営業側の手順書）が手元にないため、最終判断は保留。
  - 現時点の判定は「利用確認側の一次整理」であり、合意後に維持/廃止を確定する。

## 決裁待ち項目（RUN_ID: 20251224T163500Z）
- 必要な一次情報:
  - Touch/営業デモの運用手順書（担当: 事業/営業側、または現行デモ運用の一次情報保持者）
  - 実デモ環境で `/demo` を使用しているかの実測ログ or 手順書
- 決裁待ち理由:
  - Web クライアント/非 Phase2 ドキュメントから利用実態を特定できず、廃止判断の根拠が不足。
  - `ops/postman/DemoResourceAsp.postman_collection.json` はパリティ検証用途であり、運用上の利用可否を判断できない。

## 廃止対象リスト（暫定 / RUN_ID: 20251224T162000Z）
- 判定基準: 「Web クライアント/非 Phase2 ドキュメントに利用記述なし」かつ「代替 `/touch` 系が存在する」。
- 決裁状態: Touch/営業デモ手順の一次情報が未取得のため、**暫定**（保留扱い）。
- 対象エンドポイント:
  - `/demo/user/{param}`
  - `/demo/patient/firstVisitors/{param}`
  - `/demo/patient/visit/{param}`
  - `/demo/patient/visitRange/{param}`
  - `/demo/patient/visitLast/{param}`
  - `/demo/patient/{pk}`
  - `/demo/patients/name/{param}`
  - `/demo/patientPackage/{pk}`
  - `/demo/module/{param}`
  - `/demo/module/rp/{param}`
  - `/demo/module/diagnosis/{param}`
  - `/demo/module/schema/{param}`
  - `/demo/module/laboTest/{param}`
  - `/demo/item/laboItem/{param}`
  - `/demo/document/progressCourse/{param}`

## 次アクション
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Demo セクションを最新化（JSON 実装済みを明記）。
- Demo 用に残す API の最小セットを PM/Manager と合意。
- 合意後に `server-modernized/src/main/webapp/WEB-INF/web.xml` の登録整理を検討。

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java`
- `server-modernized/src/main/java/open/dolphin/touch/DemoResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java`
- `server-modernized/src/main/webapp/WEB-INF/web.xml`
