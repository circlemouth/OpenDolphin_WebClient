# Blocked summary (RUN_ID=20251121T231000Z)

## 現状
- 患者 `00001`: GET `/api/api01rv2/patientgetv2?id=00001` で HTTP200 / Api_Result=00（`crud/patientgetv2/response_api_*.xml`）。登録済み。
- Dr一覧: POST `/api/api01rv2/system01lstv2?class=02` (Request_Number=02) で Api_Result=00。Drコード `10000`, `10001` を取得（`crud/system01lstv2/response_class02_20251121T153320Z.xml`）。
- 受付/予約/診療行為（型属性付きXML、Patient_ID無しで受付・予約）  
  - acceptlstv2 `/api/api01rv2/acceptlstv2?class=01`: Dr=10000 → Api_Result=00、Dr=10001 → Api_Result=21（受付なし）  
  - appointlstv2 `/api/api01rv2/appointlstv2?class=01`: Dr=10000/10001 → Api_Result=21（予約なし）  
  - medicalmodv2 `/api/api21/medicalmodv2?class=01`: Dr=10000/10001 → Api_Result=22（登録対象なし）  
    Evidence: `crud/*/response_typed_*_20251121T222556Z.xml`, trace `trace/*typed_*_20251121T222556Z.trace`
- 以前の `curl: (52) Empty reply from server` は、XML2 の型属性欠落＋不要フィールド挿入（Patient_ID を受付/予約に含めたこと）が原因と判明。正しいXMLに修正後は解消。
- `/orca11/acceptmodv2` `/orca14/appointmodv2` は依然 POST 405 (Allow=OPTIONS, GET)。ルート未開放。

## 正解手順（後続向け）
1) patientgetv2: **GET** `/api/api01rv2/patientgetv2?id=00001`
2) system01lstv2: **POST** `/api/api01rv2/system01lstv2?class=02` (Request_Number=02) で Dr を取得
3) acceptlstv2 / appointlstv2: **POST** `/api/api01rv2/<api>?class=01`  
   - XML2形式、各要素に `type="string"`、配列/recordに `type="record"` を付与  
   - Patient_ID は入れない（スキーマ外）  
   - Medical_Information は `01`（外来）でOK
4) medicalmodv2: **POST** `/api/api21/medicalmodv2?class=01`、XML2形式で型属性必須
5) 全保存物は `artifacts/orca-connectivity/20251121T231000Z/crud|trace` に置き、Authorization は `<MASKED>`。

## 残課題 / seed
- 診療行為で Api_Result=22（登録対象なし）のため、受付・オーダ等のデータ投入後に再測し 00 を取得する。
- acceptmodv2 / appointmodv2 の POST 解放は未対応。route / API_ENABLE を開放後に再測。

