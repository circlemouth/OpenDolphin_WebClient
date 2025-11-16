# MML Letter/Labtest Diff Evidence (RUN_ID=20251116T210500Z-E3)

## 1. 参照チェーン / 入力ソース
- AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md
- 追加参照: `server/src/main/java/open/dolphin/rest/MmlResource.java`, `server-modernized/src/main/java/open/dolphin/rest/MmlResource.java`, `tmp/parity-letter/letter_get_legacy.json`, `artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/{legacy,modern}/response.json`

## 2. エンドポイント別差分ログ

| Endpoint | Legacy Evidence | Modernized Evidence | 差分所見 | TODO |
| --- | --- | --- | --- | --- |
| `GET /mml/letter/list/{facilityId}` | `server/.../MmlResource.java:285-307` → `MmlServiceBean#getFacilityLetterList` → CSV (`StringBuilder` join). | `server-modernized/.../MmlResource.java:288-310`（同実装）。 | コード差分なし。ランタイム証跡未取得（CSV 例なし）。 | Legacy/Modern それぞれで `curl` 実行し、CSV を `artifacts/.../letter_list/{legacy,modern}.txt` に保存。 |
| `GET /mml/letter/json/{pk}` | `server/.../MmlResource.java:309-323` + `tmp/parity-letter/letter_get_legacy.json`（`LetterModuleConverter` 由来の JSON）。 | `server-modernized/.../MmlResource.java:312-326`（同実装、`LetterModuleConverter` 再利用）。 | JSON モデル項目は一致。Modernized 実測 JSON が未採取。 | WildFly で `curl -u doctor2025:... /mml/letter/json/8` を実行し、`diff -u legacy.json modern.json` を作成。 |
| `GET /mml/labtest/list/{facilityId}` | `server/.../MmlResource.java:330-352`（CSV 生成）。Legacy ラボ一覧は `artifacts/parity-manual/lab/20251112TlabReportZ1/.../response.json` が近い（`/lab/module` 由来）。 | `server-modernized/.../MmlResource.java:333-355`（同実装）。 | 実装差分なし。`/mml/labtest/list` の実際の CSV が未採取。 | レガシー／モダナイズ両方で `curl /mml/labtest/list/<fid>` を実行して比較する。 |
| `GET /mml/labtest/json/{pk}` | `server/.../MmlResource.java:354-368` + 参照データ: `ops/tests/fixtures/adm/adm10/labo_item.json`（`NLaboModule` の JSON サンプル）。 | `server-modernized/.../MmlResource.java:357-371`。 | 返却モデル（`NLaboModuleConverter`）は同一。Modernized 応答ログなし。 | `curl /mml/labtest/json/<pk>` の `legacy.json` / `modern.json` を取得し diff。 |

## 3. 調査メモ
- Legacy/Modernized の `MmlResource` は同一ファイル構成であり、これら 4 エンドポイントについてはメソッドが 1:1 で移植済み。`git diff` でも差分は出力されなかった。
- Legacy の JSON 実績として `tmp/parity-letter/letter_get_legacy.json` と `ops/tests/fixtures/adm/adm10/labo_item.json` を参照。後者は `/lab/module` の結果だが `NLaboModule`→`NLaboModuleConverter` のフィールド構成確認に利用。
- `artifacts/parity-manual/lab/20251112TlabReportZ1/` では `/lab/module` の Legacy/Modern JSON が一致することを確認済み。`/mml/labtest/json` の上位互換となるため、レスポンス項目差分は出ない見込み。
- ランタイム証跡不足が EXT-03 の Blocker となっているため、本 RUN ではコードレベルの比較手順と既存サンプルのひも付けのみを証跡化した。次 RUN で実測 `curl` を取得する。

## 4. 証跡ファイル
- 本 README
- 参照サンプル:
  - `tmp/parity-letter/letter_get_legacy.json`
  - `artifacts/parity-manual/lab/20251112TlabReportZ1/lab_module_fetch/{legacy,modern}/response.json`
  - `ops/tests/fixtures/adm/adm10/labo_item.json`

## 5. 次アクション
1. `/mml/letter/list`：Legacy/Modernized それぞれの CSV を採取し、`artifacts/external-interface/mml/20251116T210500Z-E3/letter_list/` に保管する。
2. `/mml/letter/json`：`letter_get_legacy.json` を基準に、Modernized 側の 200 応答を取得して `diff -u` を生成。差分が無ければ `== MATCH` としてログ化。
3. `/mml/labtest/list,json`：`ops/tests/fixtures/adm/adm10/labo_item.json` を `legacy.json` に昇格させ、Modernized 応答と diff。ラボ ID シードを固定し、`MmlServiceBean#getFacilityLabtestList` の戻り値順序も確認する。
4. Runbook / Gap ノート / DOC_STATUS 更新（本 RUN で実施）。
