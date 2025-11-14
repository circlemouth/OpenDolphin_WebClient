# 入院マスタ seed 記録（2025-11-14）

- **RUN_ID（予定）:** `20251114TorcaInpatientMatrixZ1`
- **対象 API:** `orca-api-matrix` No.19-38（入院基本/病棟/食事/ADL/ユーザー管理 など）
- **参照資料:** `docs/server-modernization/phase2/notes/orca-api-field-validation.md` §3、`assets/orca-tec-index/raw/index.md` からリンクされる `orca_hsp_spc_010.pdf`（入院基本設計書）、`orca_hsp_scr_030.pdf`（病棟画面/レイアウト）、`hospshokuji.md`（食事区分）、`hspteval.md`（医療区分・ADL）、`userkanri.md`（ユーザー管理）
- **現状:** ORCA 本番 UI/SQL へ接続するための PKCS#12（`ORCAcertification/103867__JP_u00001294_client3948.p12`）パスフレーズがレポジトリ内に存在せず、`openssl pkcs12 -in ... -passin pass:` で暗号化確認した時点で `Mac verify error: invalid password?` となった。2025-11-22 に `APIキー:1acdf9...a9ab` をパスワードとして再試行（`openssl pkcs12 -passin pass:1acdf9...a9ab`、`curl --cert-type P12 --cert "...:1acdf9...a9ab"`）したが同じ `Mac verify error` で復号できない。証明書パスを取得できるまで実投入を保留する。

> **補足:** UI 操作を前提とした入力値を下表に整理した。ORCA 本番へログインできる作業者は、本書の値をそのまま投入し、投入後 `notes/orca-api-field-validation.md` に RUN_ID と証跡（スクリーンショット または `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` の XML 応答）を追記すること。

## 1. 病棟 03A／病室 0311

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Ward_Number | `03A` | `orca_hsp_scr_030.pdf` p.14 の「病棟コード」欄に入力。 |
| Ward_Name / Short | `東棟` / `ひがし` | 画面サンプルに合わせた日本語名称。 |
| Ward_Type | `01:一般` | `Ward_Type` コード表より。 |
| Department_Code | `03（入院科）` | `api21_medical_seed.sql` で使用している科コードと揃える。 |
| Specific_Hospital_Charge | `A1` | `hosp_kaikeimod.md` の地域包括 A1。 |
| Hospital_Charge | `1350` | 1 日 1350 点の入院料。 |
| Night_Shift_Overtime | `1` | 夜勤加算あり。 |
| Room_Number | `0311`, `0312` | `Ward_Configuration.Room_Number` に登録。 |

**操作:** ORCA UI → 入院基本 → 病棟マスタ（`orca_hsp_scr_030.pdf` 図 2.3）で上記値を入力し、病室タブに `0311/0312` を追加する。`assets/orca-api-requests/xml/20_hsconfwardv2_request.xml` の `Ward_Number`/`Room_Number` と整合させる。

## 2. 食事区分

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Meal_Time | `morning` / `lunch` / `dinner` | `raw/hospshokuji.md` の Meal_Time コード。 |
| Meal_Type | `一般` / `嚥下` / `外泊` | `docs/server-modernization/phase2/operations/assets/orca-api-requests/23_hsmealv2_response.sample.json` で使用している代表 3 区分。 |
| Meal_Point | `180`（一般/朝）、`200`（嚥下/昼）, `0`（外泊/夕） | 食事加算点数または外泊フラグ。 |

**操作:** ORCA UI → 入院基本 → 食事マスタ（`hospshokuji.md` の「食事区分登録画面」）で Meal_Time/Type ごとに明細を登録し、`Meal_Point` を設定する。`23_hsmealv2` 実行時に `Meal_Time` ラベルと一致させる。

## 3. ADL／医療区分

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Medical_Condition ID | `01`（がん末期以外の状態）／`05`（ターミナル） | `raw/hspteval.md` Appendix の ID 対応。 |
| Medical_Condition Evaluation | `2`（該当）／`1`（該当せず） | `24_hsptevalv2_response.sample.json` に合わせた判定。 |
| ADL_Score ID | `A1`（食事）、`B2`（移乗） など | Appendix の ADL コード。 |
| ADL_Score Evaluation | `2`（自立）／`1`（一部介助） | Runbook のテストケース。 |
| Designr_Total_Score_Daily | `15` | `31_hsptevalmodv2_request.xml` に合わせる。 |

**操作:** ORCA UI → 入院評価 → 医療区分/ADL 入力画面（`hsptevalv2` 手順）で患者 `000019` の 2025-11 月実績を登録。`ADL_Score` の ID/評価値は `assets/orca-api-requests/xml/31_hsptevalmodv2_request.xml` と同一にする。

## 4. ユーザー権限

| 項目 | 値 | 備考 |
| --- | --- | --- |
| User_Id | `nurse01` | `32_manageusersv2_request.xml` のユーザー。 |
| Group_Number | `NURSE` | グループコード。 |
| Menu_Item_Number | `100`（患者検索）/`200`（カルテ編集） | `raw/userkanri.md` のメニュー一覧。 |
| Menu_Item_Privilege | `read`（100）/`write`（200） | `manageusersv2_response.sample.json` 参照。 |
| Administrator_Privilege | `0` | 一般ユーザー。 |
| パスワード | `pass1234` → `pass5678` へ更新 | テスト用の変更値。 |

**操作:** ORCA UI → システム管理 → ユーザー管理（`userkanri.md`）で `nurse01` を登録し、メニュー権限を設定。登録後 `/orca101/manageusersv2` から取得できることを確認する。

## 5. 依存データの確認

- `assets/seeds/api21_medical_seed.sql` で投入済みの患者（`Patient_ID=000019/000020`）、保険組合せ（`Insurance_Combination_Number=0001`）、医師コード（`Doctor_Code=2001`）はそのまま流用する。
- 入院会計関連（`Hospital_Charge=1350`, `Additional_Hospital_Charge=A1`）は `raw/hosp_kaikeimod.md` のコードと同期させる。

## ブロッカーと次アクション

1. **証明書パス取得** — `ORCAcertification/103867__JP_u00001294_client3948.p12` のパスフレーズが未提供。`APIキー` をパスとして指定しても `openssl` / `curl --cert-type P12` は `Mac verify error: invalid password?` で失敗するため、正式なパスを別途受領し `export ORCA_PROD_CERT_PASS` へ反映する。
2. **RUN_ID 採番と証跡** — 上記マスタを登録後、`RUN_ID=20251114TorcaInpatientMatrixZ1` で `19-38` の XML を順次実行し、`artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` に `request.xml` / `response.xml` / `response.headers` を保存する。
3. **ドキュメント反映** — 成功時は `notes/orca-api-field-validation.md`（各 No.19-38 節）と `ORCA_API_STATUS.md`（§2.3 入院マスタ）に `seed OK / Api_Result=00` を追記し、`DOC_STATUS.md` のステータスを Active 維持とする。

> **メモ:** 本書は ORCA 本番での seed 作業ログ台帳として `assets/seeds/` 直下に保存し、今後の RUN でも同じ形式で追記する。
