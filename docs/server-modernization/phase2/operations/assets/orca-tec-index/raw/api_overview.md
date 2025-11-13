[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/overview.html#content)

|     |     |
| --- | --- |
|     | [×](javascript:void(0) "検索ボックスをクリア") |

検索

カスタム検索

|     |     |
| --- | --- |
|     | 表示順:<br><br>日付<br><br>日付<br><br>関連性 |

*   [![お問い合わせ](https://www.orca.med.or.jp/images/common/hm_contact.gif)](https://www.orca.med.or.jp/contact/index.html)
    

*   [![ORCAとは](https://www.orca.med.or.jp/images/common/hml_01.gif)](https://www.orca.med.or.jp/orca/index.html)
    
*   [![ORCAサーベイランス](https://www.orca.med.or.jp/images/common/hml_02.gif)](http://infect.orca.med.or.jp/)
    
*   [![日医IT認定制度](https://www.orca.med.or.jp/images/common/hml_03.gif)](https://www.orca.med.or.jp/nintei/)
    

*   [![ホーム](https://www.orca.med.or.jp/images/common/gm_01_rot.gif)](https://www.orca.med.or.jp/index.html)
    
*   [![お知らせ](https://www.orca.med.or.jp/images/common/gm_02_rot.gif)](https://www.orca.med.or.jp/news/index.html)
    
*   [![日レセご紹介サイト](https://www.orca.med.or.jp/images/common/gm_03_rot.gif)](http://www.jma-receipt.jp/index.html)
    
*   [![日レセユーザサイト](https://www.orca.med.or.jp/images/common/gm_04_rot.gif)](https://www.orca.med.or.jp/receipt/index.html)
    
*   [![介護・特定検診](https://www.orca.med.or.jp/images/common/gm_05_rot.gif)](https://www.orca.med.or.jp/care.html)
    *   [![医見書](https://www.orca.med.or.jp/images/common/gm_05d_01_rot.gif)](https://www.orca.med.or.jp/ikensyo/index.html)
        
    *   [![WebQKANクラウド](https://www.orca.med.or.jp/images/common/gm_05d_07_rot.gif)](https://www.orca.med.or.jp/qkan-cloud/index.html)
        
    *   [![特定健診システム](https://www.orca.med.or.jp/images/common/gm_05d_04_rot.gif)](https://www.orca.med.or.jp/tokutei/index.html)
        
    *   [![MI_CAN](https://www.orca.med.or.jp/images/common/gm_05d_05_rot.gif)](https://www.orca.med.or.jp/mican/index.html)
        
    *   [![DiedAi](https://www.orca.med.or.jp/images/common/gm_05d_06_rot.gif)](https://www.orca.med.or.jp/diedai/index.html)
        
*   [![サポート・コミュニティ](https://www.orca.med.or.jp/images/common/gm_06_rot.gif)](https://www.orca.med.or.jp/support/index.html)
    

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API仕様

API 仕様
======

※仕様の変更、機能追加等は、通常の要望受付よりお願いします。「[日医標準レセプトソフトに関する改善要望](https://www.orca.med.or.jp/contact/)
」

| 項番  | 業務  | URL | 引数  | 機能  | メソッド | 詳細  |
| --- | --- | --- | --- | --- | --- | --- |
| 1   | 患者基本情報 | /api01rv2/patientgetv2 | id=? | 患者基本情報取得 | GET | [患者基本情報の取得](https://www.orca.med.or.jp/receipt/tec/api/patientget.html) |
| 2   | 予約  | /orca14/appointmodv2 | class=01 | 予約受付 | POST | [予約の登録、取り消し](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html) |
| class=02 | 予約取消 |
| 3   | 診療行為 | /api21/medicalmodv2 | class=01 | 中途データ登録 | POST | [中途終了データ作成](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html) |
| class=02 | 中途データ削除 |
| class=03 | 中途データ変更 |
| 4   | 受付  | /orca11/acceptmodv2 | class=01 | 受付登録 | POST | [指定された患者の受付、取り消し](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html) |
| class=02 | 受付取消 |
| 5   | 受付一覧 | /api01rv2/acceptlstv2 | class=01 | 受付中取得 | POST | [指定された日付の受付一覧返却](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html) |
| class=02 | 受付済み取得 |
| class=03 | 全受付取得 |
| 6   | 予約一覧 | /api01rv2/appointlstv2 | class=01 | 予約一覧取得 | POST | [指定された日付の予約一覧返却](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html) |
| 7   | 点数マスタ | /orca102/medicatonmodv2 | class=01 | 登録  | POST | [点数マスタ情報登録](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html) |
| class=02 | 削除  |
| class=03 | 終了日設定 |
| class=04 | 期間変更 |
| 8   | 患者情報 | /api01rv2/patientlst1v2 | class=01 | 新規・更新対象 | POST | [患者番号一覧の取得](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html) |
| class=02 | 新規対象 |
| 9   | 患者情報 | /api01rv2/patientlst2v2 | class=01 | 指定患者情報取得 | POST | [複数の患者情報取得](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html) |
| 10  | 患者情報 | /api01rv2/patientlst3v2 | class=01 | 指定患者情報取得 | POST | [患者情報取得(氏名検索)](https://www.orca.med.or.jp/receipt/tec/api/patientshimei.html) |
| 11  | システム管理情報 | /api01rv2/system01lstv2 | class=01 | 診療科対象 | POST | [システム管理情報の取得](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html) |
| class=02 | ドクター対象 |
| class=03 | ドクター以外の職員対象 |
| class=04 | 医療機関基本情報 |
| class=05 | 入金方法情報 |
| class=06 | 診療内容情報 |
| class=07 | 患者状態コメント情報 |
| 12  | 診療行為 | /api01rv2/medicalgetv2 | class=01 | 受診履歴取得 | POST | [診療情報の返却](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html) |
| class=02 | 受診履歴診療行為内容 |
| class=03 | 診療月診療行為取得 |
| class=04 | 診療区分別剤点数 |
| 13  | 病名  | /api01rv2/diseasegetv2 | class=01 | 患者病名情報の取得 | POST | [患者病名情報の返却](https://www.orca.med.or.jp/receipt/tec/api/disease.html) |
| 14  | 患者登録 | /orca12/patientmodv2 | class=01 | 患者登録 | POST | [患者登録](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html) |
| class=02 | 患者情報更新 |
| class=03 | 患者情報削除 |
| class=04 | 保険情報追加 |
| 15  | 患者予約情報 | /api01rv2/appointlst2v2 | class=01 | 患者予約情報取得 | POST | [患者予約情報](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html) |
| 16  | 請求金額返却 | /api01rv2/acsimulatev2 | class=01 | 請求金額シミュレーション | POST | [請求金額返却](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html) |
| 17  | 症状詳記 | /orca25/subjectivesv2 | class=01 | 症状詳記登録 | POST | [症状詳記](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html) |
| class=02 | 症状詳記削除 |
| 18  | 来院患者一覧 | /api01rv2/visitptlstv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 来院日の受診履歴返却 | POST | [来院患者一覧](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html) |
| [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 来院年月の受診履歴返却 |
| 19  | 入院基本情報 | /api01rv2/hsconfbasev2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院基本情報設定内容返却 | POST | [入院基本情報](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html) |
| 20  | 病棟・病室情報 | /api01rv2/hsconfwardv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 病棟情報返却 | POST | [病棟・病室情報](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html) |
| [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 病室情報返却 |
| 21  | 患者情報 | /api01rv2/tmedicalgetv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 中途終了患者情報一覧返却 | POST | [中途終了患者情報一覧](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html) |
| 22  | 保険者一覧情報 | /api01rv2/insprogetv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 保険者一覧返却 | POST | [保険者一覧情報](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html) |
| 23  | 入院患者食事情報 | /api01rv2/hsmealv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院患者食事等情報返却 | POST | [入院患者食事等情報](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html) |
| 24  | 入院患者医療区分・ADL点数情報 | /api01rv2/hsptevalv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院患者医療区分・ADL点数情報返却 | POST | [入院患者医療区分・ADL点数情報](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html) |
| 25  | 入院患者基本情報 | /api01rv2/hsptinfv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院患者基本情報返却 | POST | [入院患者基本情報](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html) |
| 26  | 退院時仮計算情報 | /api01rv2/hsacsimulatev2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 仮計算情報返却 | POST | [仮計算情報](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html) |
| 27  | 収納情報 | /api01rv2/incomeinfv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 収納情報返却 | POST | [収納情報返却](https://www.orca.med.or.jp/receipt/tec/api/shunou.html) |
| 28  | システム情報 | /api01rv2/systeminfv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | システム情報の返却 | POST | [システム情報の取得](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html) |
| 29  | 入退院登録 | /orca31/hsptinfmodv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院登録 | POST | [入院登録](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html) |
| 入院登録(訂正) | [入院登録(訂正)](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html) |
| 退院登録 | [退院登録](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html) |
| 入院登録変更 | [入院登録変更](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html) |
| 転科転棟転室 | [転科転棟転室](https://www.orca.med.or.jp/receipt/tec/api/hospido.html) |
| 30  | 入院会計照会 | /orca31/hsacctmodv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 外泊等登録 | POST | [外泊等登録](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html) |
| 食事登録 | [食事登録](https://www.orca.med.or.jp/receipt/tec/api/hospshokuji.html) |
| 31  | 入院会計照会 | /orca32/hsptevalmodv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院患者医療区分・ADL点数登録 | POST | [入院患者医療区分・ADL点数登録](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html) |
| 32  | システム管理情報 | /orca101/manageusersv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | ユーザー一覧 | POST | [ユーザー管理情報](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html) |
| ユーザー登録 |
| ユーザー変更 |
| ユーザー削除 |
| 33  | 診療行為 | /orca21/medicalsetv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 新規登録 | POST | [セット登録](https://www.orca.med.or.jp/receipt/tec/api/setcode.html) |
| 削除  |
| 最終終了日更新 |
| セット内容取得 |
| 34  | 入退院登録 | /orca31/birthdeliveryv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 照会  | POST | [出産育児一時金](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html) |
| 登録  |
| 35  | 全保険組合せ一覧取得 | /api01rv2/patientlst6v2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 全保険組合せ一覧取得 | POST | [全保険組合せ一覧取得](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html) |
| 36  | 患者病名登録 | /orca22/diseasev2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 患者病名登録 | POST | [患者病名登録](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html) |
| 37  | 患者病名登録２ | /orca22/diseasev3 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 患者病名登録２ | POST | [患者病名登録２](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html) |
| 38  | 入院会計照会 | /orca31/hsacctmodv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院会計作成 | POST | [入院会計作成](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html) |
| 39  | 入院会計照会  <br>（未作成チェック） | /orca31/hspmmv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院会計未作成チェック | POST | [入院会計未作成チェック](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html) |
| 40  | 室料差額登録 | /orca31/hsacctmodv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 室料差額登録 | POST | [室料差額登録](https://www.orca.med.or.jp/receipt/tec/api/hospsagaku.html) |
| 41  | その他 | /api01rv2/pusheventgetv2, json | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | PUSH通知一括取得 | POST | [PUSH通知一括取得](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html) |
| 42  | 帳票印刷 |     | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 帳票印刷 | POST | [帳票印刷](https://www.orca.med.or.jp/receipt/tec/api/report_print/) |
| 43  | マスタデータ最終更新日取得 | /orca51/masterlastupdatev3 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | マスタデータ最終更新日取得 | POST | [マスタデータ最終更新日取得](https://www.orca.med.or.jp/receipt/tec/api/master_last_update.html) |
| 44  | 基本情報取得 | /api01rv2/system01dailyv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 基本情報取得 | POST | [基本情報取得](https://www.orca.med.or.jp/receipt/tec/api/system_daily.html) |
| 45  | 患者メモ取得 | /api01rv2/patientlst7v2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 患者メモ取得 | POST | [患者メモ取得](https://www.orca.med.or.jp/receipt/tec/api/patient_memo_list.html) |
| 46  | 初診算定日登録 | /api21/medicalmodv23 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 初診算定日登録 | POST | [初診算定日登録](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html) |
| 47  | 入院患者照会 | /orca36/hsfindv3 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 入院患者照会 | POST | [入院患者照会](https://www.orca.med.or.jp/receipt/tec/api/hospfind.html) |
| 48  | 薬剤併用禁忌チェック | /api01rv2/contraindicationcheckv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 薬剤併用禁忌チェック | POST | [薬剤併用禁忌チェック](https://www.orca.med.or.jp/receipt/tec/api/contraindication_check.html) |
| 49  | 保険・公費一覧取得 | /api01rv2/insuranceinf1v2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 保険・公費一覧取得 | POST | [保険・公費一覧取得](https://www.orca.med.or.jp/receipt/tec/api/insurance_list.html) |
| 50  | 症状詳記情報取得 | /api01rv2/subjectiveslstv2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 症状詳記情報取得 | POST | [症状詳記情報取得](https://www.orca.med.or.jp/receipt/tec/api/subjectiveslst.html) |
| 51  | 旧姓履歴情報取得 | /api01rv2/patientlst8v2 | [※１](https://www.orca.med.or.jp/receipt/tec/api/overview.html#note1) | 旧姓履歴情報取得 | POST | [旧姓履歴情報取得](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html) |
| 52  | 入力・診療コード内容取得 | /api01rv2/medicationgetv2 |     | 入力・診療コード内容取得 | POST | [入力・診療コード内容取得](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html) |
| 53  | 患者メモ登録 | /orca06/patientmemomodv2 |     | 患者メモ登録/更新/削除 | POST | [患者メモ登録](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html) |

 ※1：引数(class)を受け取らない仕様となっています。  
   　　機能が複数あるAPIについては、リクエストデータ内の「Request\_Number」にリクエスト番号を指定することで機能の選択を行います。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API仕様

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/overview.html#wrapper)

[![ORCAプロジェクト](https://www.orca.med.or.jp/images/common/orca_project_logo.gif)](http://www.orca.med.or.jp/)
  
  
[![日本医師会](https://www.orca.med.or.jp/images/top/jma-s.png)](http://www.med.or.jp/)
  

ORCAについて

[ORCAとは](https://www.orca.med.or.jp/orca/index.html)

[医療機関ID申請](https://www.orca.med.or.jp/receipt/id/)

[定点調査研究事業](https://www.orca.med.or.jp/das/index.html)

[日医IT認定制度](https://www.orca.med.or.jp/nintei/)

[日本医師会](http://www.med.or.jp/)

[日本医師会ORCA管理機構](https://www.orcamo.co.jp/)

[日本医師会電子認証センター](http://www.jmaca.med.or.jp/)

日レセご紹介サイト

[ソフトの特長](http://www.jma-receipt.jp/merit/index.html)

[ユーザ事例](http://www.jma-receipt.jp/case/hokkaido/index.html)

[展示・説明会](http://www.jma-receipt.jp/trial/index.html)

[導入までの流れ](http://www.jma-receipt.jp/step/index.html)

[日レセを体験](http://www.jma-receipt.jp/trialsite/index.html)

[サポート事業所検索](http://search.orca.med.or.jp/support/)

[稼働状況](http://www.jma-receipt.jp/operation/)

日レセユーザサイト

[更新情報](https://www.orca.med.or.jp/receipt/index.html#koushin)

[開発計画](https://www.orca.med.or.jp/receipt/index.html#kaihatu)

[操作ガイド](https://www.orca.med.or.jp/receipt/index.html#manual)

[改正対応](https://www.orca.med.or.jp/receipt/index.html#kaisei)

[ダウンロード](https://www.orca.med.or.jp/receipt/index.html#dl)

[各種設定](https://www.orca.med.or.jp/receipt/index.html#unyo)

[技術情報](https://www.orca.med.or.jp/receipt/tec/)

介護・特定健診関連

[医見書](https://www.orca.med.or.jp/ikensyo/index.html)

[WebQKAN](https://www.orca.med.or.jp/qkan-cloud/index.html)

[特定健康診査システム](https://www.orca.med.or.jp/tokutei/index.html)

サポート

[サポート・コミュニティ](https://www.orca.med.or.jp/support/index.html)

[OSCについて](https://www.orca.med.or.jp/osc/index.html)

[お問い合わせ一覧](https://www.orca.med.or.jp/contact/index.html)

[リンク集](https://www.orca.med.or.jp/support/index.html#link)

|     |     |
| --- | --- |
|     |     |
