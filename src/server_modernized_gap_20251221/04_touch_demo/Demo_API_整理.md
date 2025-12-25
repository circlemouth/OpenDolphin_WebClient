# Demo API 整理
- 日時: 2026-01-07 09:00 - 2026-01-09 09:00 / 優先度: low / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Demo_API_整理.md`
- 更新履歴:
  - 2025-12-25: Demo API 在庫更新と合意内容を確定（RUN_ID: 20251225T195836Z）。

## 目的
- Demo 系 API の棚卸しと移植状況を明文化する。
- 必要な API だけ残し、不要な API の廃止方針を決める。

## 現状整理
- JSON 版: `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java`
- XML 版: `server-modernized/src/main/java/open/dolphin/touch/DemoResource.java` / `server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java`
- 公開設定: `server-modernized/src/main/webapp/WEB-INF/web.xml` は **JSON 版のみ登録**（XML 版は登録削除済み）。
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

## Demo API 合意結果（RUN_ID: 20251225T195836Z）
- 最小セット: JSON 版 15 API を維持（デモ用途に限定し読み取り専用）。
- 廃止判断: XML 版 DemoResource/DemoResourceASP は公開終了（`web.xml` から登録を削除）。
- 理由: Web クライアント/非 Phase2 ドキュメントで `/demo` 利用が確認できず、デモ用途の最小構成は JSON 統一で十分と判断。

## Demo API 維持/廃止 判定（2025-12-25）
| ID | エンドポイント | 判定 | 理由 / 根拠 |
| --- | --- | --- | --- |
| Demo-01 | `GET /demo/user/{param}` | 維持（JSON）/ XML 廃止 | JSON 実装済み。 |
| Demo-02 | `GET /demo/patient/firstVisitors/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-03 | `GET /demo/patient/visit/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-04 | `GET /demo/patient/visitRange/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-05 | `GET /demo/patient/visitLast/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-06 | `GET /demo/patient/{pk}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-07 | `GET /demo/patients/name/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-08 | `GET /demo/patientPackage/{pk}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-09 | `GET /demo/module/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-10 | `GET /demo/module/rp/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-11 | `GET /demo/module/diagnosis/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-12 | `GET /demo/module/schema/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-13 | `GET /demo/module/laboTest/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-14 | `GET /demo/item/laboItem/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |
| Demo-15 | `GET /demo/document/progressCourse/{param}` | 維持（JSON）/ XML 廃止 | 同上。 |

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

## 廃止方針（確定）
- **対象**: XML 版 `DemoResource` / `DemoResourceASP` の公開（web.xml 登録）。
- **判断基準**:
  - JSON 版 `DemoResourceAsp` が 15 API を実装済みであり、デモ用途は JSON 統一で十分。
  - Web クライアント/非 Phase2 ドキュメントで `/demo` 利用実績が確認できない。
- **廃止までの手順（確定）**:
  1. `web.xml` から XML 版 DemoResource 登録を削除（実施済み）。
  2. Demo 環境で JSON 版のみの動作確認を行い、必要なら 410/404 へ移行方針を追記。

## 決裁待ち項目（解消済み）
- 2025-12-25 に「JSON 版を維持・XML 版を廃止」の判断で合意済み（RUN_ID: 20251225T195836Z）。
- Touch/営業デモの一次情報が入手できた場合は、JSON 版 15 API の維持可否を再評価する。

## 合意結果（RUN_ID: 20251225T195836Z）
- 決裁結果:
  - `DemoResourceAsp` の JSON 版 15 API は維持。
  - XML 版 `DemoResource` / `DemoResourceASP` は公開終了（web.xml から削除）。
- 追加条件:
  - デモ運用の一次情報が再取得できた場合、JSON 版の維持範囲を見直す。

## 廃止対象リスト（確定）
- 対象: XML 版 `DemoResource` / `DemoResourceASP` の公開（web.xml 登録）。
- 影響範囲: `/demo/*` の XML 形式レスポンスのみ。JSON 版 15 API は維持。

## 次アクション
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の Demo セクションを最新化（実施）。
- XML 版削除後の Demo 環境動作確認ログを取得し、必要なら 410/404 への移行方針を追記。

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java`
- `server-modernized/src/main/java/open/dolphin/touch/DemoResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java`
- `server-modernized/src/main/webapp/WEB-INF/web.xml`
