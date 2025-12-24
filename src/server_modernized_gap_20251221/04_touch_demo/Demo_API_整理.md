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
