[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#content)

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
 > 出産育児一時金

出産育児一時金  

==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#reqsample)
    
*   [リクエスト一覧(照会)](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#request)
    
*   [リクエスト一覧(登録)](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#request1)
      
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#rubysample)
    

更新履歴
----

 2017-02-22  平成29年4月提出分以降の提出先変更に伴い、正常分娩の場合の提出先区分を変更。

概要
--

POSTメソッドにより出産育児一時金の照会、登録を行います。

日レセ Ver.4.8.0\[第26回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式となります。

出産育児一時金の登録処理は、通常退院登録後に行います。  
この時に退院登録時の情報（入院料等）を設定する必要があるので、その場合に出産育児一時金の参照機能を利用します。

テスト方法
-----

1.  参考提供されている sample\_birthdelivery\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_birthdelivery\_v2.rb 内の患者番号等を指定します。
3.  ruby sample\_birthdelivery\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/birthdeliveryv2  
  
Request\_Number:  
    01: 照会  
    02: 登録  
      
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  <private\_objects type \="record"\>    <Save\_Request type \="string"\>1</Save\_Request>    <Request\_Number type \="string"\>02</Request\_Number>    <Patient\_ID type \="string"\>00002</Patient\_ID>    <Admission\_Date type \="string"\>2015-12-15</Admission\_Date>    <Direct\_Payment type \="string"\>1</Direct\_Payment>    <Ac\_Month type \="string"\>2015-12</Ac\_Month>    <Ac\_Date\_Class type \="string"\>2</Ac\_Date\_Class>    <Ac\_Class type \="string"\>1</Ac\_Class>    <Delivery type \="string"\>1</Delivery>    <Submission\_Provider type \="string"\>2</Submission\_Provider>    <Gestation\_Period\_Passed type \="string"\>40</Gestation\_Period\_Passed>    <Delivery\_Date type \="string"\>2015-12-15</Delivery\_Date>    <Stillborn\_Children type \="string"\>2</Stillborn\_Children>    <Children\_Born\_Number type \="string"\>1</Children\_Born\_Number>    <Hospital\_Stay\_Days type \="string"\>6</Hospital\_Stay\_Days>    <Obstetric\_Compensation\_System type \="string"\>1</Obstetric\_Compensation\_System>    <Hospital\_Money type \="string"\>100000</Hospital\_Money>    <Delivery\_Money type \="string"\>300000</Delivery\_Money>    <Child\_Care\_Money type \="string"\>30000</Child\_Care\_Money>    <OCS\_Money type \="string"\>16000</OCS\_Money>    <Insurance\_Combination\_Number type \="string"\>0001</Insurance\_Combination\_Number>  </private\_objects>  
</data>  

### 処理概要

出産育児一時金の照会、登録リクエストにより指定患者の出産育児一時金情報の取得、登録を行います。

   

リクエスト一覧(照会)
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号  <br>　01：照会 | 01  | 必須  |
| 2   | Patient\_ID | 患者番号 | 00002 | 必須  |
| 3   | Admission\_Date | 入院日 | 2015-12-15 | 必須  |

リクエスト一覧(登録)
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>　0：残さない  <br>　1：残す | 1   | 未設定時初期値\[0\]を設定  <br>（日レセにリクエストの情報を保持するか否か指定）  <br>※４ |
| 2   | Request\_Number | リクエスト番号  <br>　02：登録 | 02  | 必須  |
| 3   | Patient\_ID | 患者番号 | 00002 | 必須  |
| 4   | Admission\_Date | 入院日 | 2015-12-15 | 必須  |
| 5   | Direct\_Payment | 直接支払制度利用区分  <br>　0：利用しない  <br>　1：利用する | 1   | 必須  |
| 6   | Ac\_Month | 請求年月 | 2015-12 | 必須  <br>※１ |
| 7   | Ac\_Date\_Class | 提出日区分  <br>　1：10日請求  <br>　2：25日請求 | 2   | 必須  <br>※１ |
| 8   | Ac\_Class | 請求区分  <br>　0：請求しない  <br>　1：未請求  <br>　2：請求済 | 1   | 必須  <br>※１ |
| 9   | Delivery | 分娩区分  <br>　1：正常分娩  <br>　2：異常分娩 | 1   | 必須  |
| 10  | Submission\_Provider | 提出先区分  <br>　1：支払基金  <br>　2：国保連合会 | 2   | 未設定時初期値<br><br>　(2017-02-22 パッチ適用以前)  <br>　正常分娩の場合  <br>　　「2」（国保連合会）  <br>　(2017-02-22 パッチ適用以降)  <br>　正常分娩の場合  <br>　　平成２９年３月提出分迄  <br>　　　「2」（国保連合会）  <br>　　平成２９年４月提出分以降  <br>　　　入院時に加入している保険が社保の場合  <br>　　　　「1」（支払基金）  <br>　　　国保の場合  <br>　　　　「2」（国保連合会）<br><br>　異常分娩の場合  <br>　　入院時に加入している保険が社保の場合  <br>　　　「1」（支払基金）  <br>　　国保の場合  <br>　　　「2」（国保連合会） |
| 11  | Gestation\_Period\_Passed | 在胎週数 | 40  | 必須  |
| 12  | Delivery\_Date | 出産年月日 | 2015-12-15 | 必須  |
| 13  | Stillborn\_Children | 死産有無区分  <br>　1：死産  <br>　2：死産でない  <br>　3：混在 | 2   | 必須  |
| 14  | Children\_Born\_Number | 出産数 | 1   | 必須  |
| 15  | Hospital\_Stay\_Days | 入院日数 | 6   | 必須  <br>※１、※２ |
| 16  | Obstetric\_Compensation\_System | 産科医療補償制度対象区分  <br>　1：対象分娩  <br>　2：対象分娩でない  <br>　3：混在 | 1   | 必須  |
| 17  | Hospital\_Money | 入院料 | 100000 | ※１、※２ |
| 18  | Room\_Money | 室料差額 |     | ※１、※２ |
| 19  | Delivery\_Care\_Money | 分娩介助料 |     | ※１、※２ |
| 20  | Delivery\_Money | 分娩料 | 300000 | ※１、※２ |
| 21  | Child\_Care\_Money | 新生児管理保育料 | 30000 | ※１、※２ |
| 22  | Examination\_Money | 検査・薬剤料 |     | ※１、※２ |
| 23  | Medical\_Treatment\_Money | 処置・手当料 |     | ※１、※２ |
| 24  | OCS\_Money | 産科医療補償制度掛金 | 16000 | ※１、※２ |
| 25  | Other\_Money | その他 |     | ※１、※２ |
| 26  | Copayment\_Money | 一部負担金等 |     | ※１、※２ |
| 27  | Remarks | 備考  |     |     |
| 28  | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | ※３  |
| 29  | HealthInsurance\_Information | 保険情報 |     |     |
| 29-1 | InsuranceProvider\_Number | 保険者番号 |     | ※３  |
| 29-2 | HealthInsuredPerson\_Symbol | 記号  |     | ※３  |
| 29-3 | HealthInsuredPerson\_Number | 番号  |     | ※３  |
| 29-4 | RelationToInsuredPerson | 本人家族区分  <br>　1：本人  <br>　2：家族 |     | ※３  |

※１：退院登録後に設定可能な項目です。

※２：退院登録後に照会（リクエスト番号\[01\]）で取得した内容を設定します。任意の値を設定することも可能です。

※３：保険組合せ番号か保険情報はいずれか一方を必ず設定して下さい。両方とも設定した場合は保険組合せ番号を優先します。  
　　保険情報が設定された場合、保険者番号、記号、本人家族区分は必須入力項目となります。

※４：「Save\_Request」に「1」を設定した場合、日レセの「オーダ確認画面」にて、参照のみ可能です。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2016-01-13 |     |
| 2   | Information\_Time | 実施時間 | 17:01:04 |     |
| 3   | Api\_Results | 結果情報  <br>(繰り返し １０) |     |     |
| 3-1 | Api\_Result | 結果コード(ゼロ以外エラー) | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 02  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 登録  |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00002 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　佐織 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　サオリ |     |
| 5-4 | BirthDate | 生年月日 | 1982-04-01 |     |
| 5-5 | Sex | 性別  <br>(2：女性) | 2   |     |
| 6   | Birth\_Delivery\_Infomation | 出産育児一時金情報 |     |     |
| 6-1 | History\_Number | 履歴番号 | 001 |     |
| 6-2 | Admission\_Date | 入院日 | 2015-12-15 |     |
| 6-3 | Discharge\_Date | 退院日 | 2015-12-20 |     |
| 6-4 | Direct\_Payment | 直接支払制度利用区分 | 0   |     |
| 6-4-1 | Label | 内容の名称を返却 | 直接支払制度 |     |
| 6-4-2 | Data | コードを返却 | 1   |     |
| 6-4-3 | Name | 内容を返却  <br>　0：利用しない  <br>　1：利用する | 利用する |     |
| 6-5 | Ac\_Month | 請求年月 |     | ※１  |
| 6-5-1 | Label | 内容の名称を返却 | 請求年月 |     |
| 6-5-2 | Data | 年月を返却 | 2015-12 |     |
| 6-6 | Ac\_Date\_Class | 提出日区分 |     | ※１  |
| 6-6-1 | Label | 内容の名称を返却 | 提出日 |     |
| 6-6-2 | Data | コードを返却 | 2   |     |
| 6-6-3 | Name | 内容を返却  <br>　1：10日請求  <br>　2：25日請求 | ２５日請求 |     |
| 6-7 | Ac\_Class | 請求区分 |     | ※１  |
| 6-7-1 | Label | 内容の名称を返却 | 請求区分 |     |
| 6-7-2 | Data | コードを返却 | 1   |     |
| 6-7-3 | Name | 内容を返却  <br>　0：請求しない  <br>　1：未請求  <br>　2：請求済 | 未請求 |     |
| 6-8 | Delivery | 分娩区分 |     |     |
| 6-8-1 | Label | 内容の名称を返却 | 分娩区分 |     |
| 6-8-2 | Data | コードを返却 | 1   |     |
| 6-8-3 | Name | 内容を返却 | 正常分娩 |     |
| 6-9 | Submission\_Provider | 提出先区分 |     |     |
| 6-9-1 | Label | 内容の名称を返却 | 提出先 |     |
| 6-9-2 | Data | コードを返却 | 2   |     |
| 6-9-3 | Name | 内容を返却 | 国保連合会 |     |
| 6-10 | Gestation\_Period\_Passed | 在胎週数 |     |     |
| 6-10-1 | Label | 内容の名称を返却 | 在胎週数 |     |
| 6-10-2 | Data | コードを返却 | 40  |     |
| 6-10-3 | Name | 「週」を返却 | 週   |     |
| 6-11 | Delivery\_Date | 出産年月日 |     |     |
| 6-11-1 | Label | 内容の名称を返却 | 出産年月日 |     |
| 6-11-2 | Data | 年月日を返却 | 2015-12-15 |     |
| 6-12 | Stillborn\_Children | 死産有無区分 |     |     |
| 6-12-1 | Label | 内容の名称を返却 | 死産有無 |     |
| 6-12-2 | Data | コードを返却 | 2   |     |
| 6-12-3 | Name | 内容を返却 | 死産でない |     |
| 6-13 | Children\_Born\_Number | 出産数 |     |     |
| 6-13-1 | Label | 内容の名称を返却 | 出産数 |     |
| 6-13-2 | Data | 人数を返却 | 1   |     |
| 6-13-3 | Name | 「人」を返却 | 人   |     |
| 6-14 | Hospital\_Stay\_Days | 入院日数 |     | ※１  |
| 6-14-1 | Label | 内容の名称を返却 | 入院日数 |     |
| 6-14-2 | Data | 日数を返却 | 6   |     |
| 6-14-3 | Name | 「日」を返却 | 日   |     |
| 6-15 | Obstetric\_Compensation\_System | 産科医療補償制度対象区分 |     |     |
| 6-15-1 | Label | 内容の名称を返却 | 産科医療補償制度 |     |
| 6-15-2 | Data | コードを返却 | 1   |     |
| 6-15-3 | Name | 内容を返却 | 対象分娩 |     |
| 6-16 | Hospital\_Money | 入院料 |     | ※１  |
| 6-16-1 | Label | 内容の名称を返却 | 入院料 |     |
| 6-16-2 | Data | 金額を返却 | 100000 |     |
| 6-16-3 | Name | 「円」を返却 | 円   |     |
| 6-17 | Room\_Money | 室料差額 |     | ※１  |
| 6-17-1 | Label | 内容の名称を返却 | 室料差額 |     |
| 6-17-2 | Data | 金額を返却 | 0   |     |
| 6-17-3 | Name | 「円」を返却 | 円   |     |
| 6-18 | Delivery\_Care\_Money | 分娩介助料 |     | ※１  |
| 6-18-1 | Label | 内容の名称を返却 | 分娩介助料 |     |
| 6-18-2 | Data | 金額を返却 | 0   |     |
| 6-18-3 | Name | 「円」を返却 | 円   |     |
| 6-19 | Delivery\_Money | 分娩料 |     | ※１  |
| 6-19-1 | Label | 内容の名称を返却 | 分娩料 |     |
| 6-19-2 | Data | 金額を返却 | 300000 |     |
| 6-19-3 | Name | 「円」を返却 | 円   |     |
| 6-20 | Child\_Care\_Money | 新生児管理保育料 |     | ※１  |
| 6-20-1 | Label | 内容の名称を返却 | 新生児管理保育料 |     |
| 6-20-2 | Data | 金額を返却 | 30000 |     |
| 6-20-3 | Name | 「円」を返却 | 円   |     |
| 6-21 | Examination\_Money | 検査・薬剤料 |     | ※１  |
| 6-21-1 | Label | 内容の名称を返却 | 検査・薬剤料 |     |
| 6-21-2 | Data | 金額を返却 | 0   |     |
| 6-21-3 | Name | 「円」を返却 | 円   |     |
| 6-22 | Medical\_Treatment\_Money | 処置・手当料 |     | ※１  |
| 6-22-1 | Label | 内容の名称を返却 | 処置・手当料 |     |
| 6-22-2 | Data | 金額を返却 | 0   |     |
| 6-22-3 | Name | 「円」を返却 | 円   |     |
| 6-23 | OCS\_Money | 産科医療補償制度掛金 |     | ※１  |
| 6-23-1 | Label | 内容の名称を返却 | 産科医療補償制度掛金 |     |
| 6-23-2 | Data | 金額を返却 | 16000 |     |
| 6-23-3 | Name | 「円」を返却 | 円   |     |
| 6-24 | Other\_Money | その他 |     | ※１  |
| 6-24-1 | Label | 内容の名称を返却 | その他 |     |
| 6-24-2 | Data | 金額を返却 | 0   |     |
| 6-24-3 | Name | 「円」を返却 | 円   |     |
| 6-25 | Copayment\_Money | 一部負担金等 |     | ※１  |
| 6-25-1 | Label | 内容の名称を返却 | 一部負担金等 |     |
| 6-25-2 | Data | 金額を返却 | 0   |     |
| 6-25-3 | Name | 「円」を返却 | 円   |     |
| 6-26 | Ac\_Money | 妊婦合計負担額 |     | ※１  |
| 6-26-1 | Label | 内容の名称を返却 | 妊婦合計負担額 |     |
| 6-26-2 | Data | 金額を返却 | 446000 |     |
| 6-26-3 | Name | 「円」を返却 | 円   |     |
| 6-27 | Agency\_Receipt | 代理受取額 |     | ※１  |
| 6-27-1 | Label | 内容の名称を返却 | 代理受取額 |     |
| 6-27-2 | Data | 金額を返却 | 420000 |     |
| 6-27-3 | Name | 「円」を返却 | 円   |     |
| 6-28 | Remarks | 備考  |     |     |
| 6-28-1 | Label | 内容の名称を返却 |     |     |
| 6-28-2 | Data | 内容を返却 |     |     |
| 6-29 | HealthInsurance\_Information | 保険情報 |     |     |
| 6-29-1 | InsuranceProvider\_Number | 保険者番号 | 01130012 |     |
| 6-29-2 | InsuranceProvider\_Name | 保険者名 | 全国健康保険協会東京支部 |     |
| 6-29-3 | HealthInsuredPerson\_Symbol | 記号  | ５０１０２０３ |     |
| 6-29-4 | HealthInsuredPerson\_Number | 番号  | １   |     |
| 6-29-5 | RelationToInsuredPerson | 本人家族区分  <br>　1：本人  <br>　5：家族 | 5   |     |

 ※１：退院登録後に返却を行います。

  

### レスポンスサンプル

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2016-01-13</Information\_Date>    <Information\_Time type\="string"\>17:01:04</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>02</Data>      <Name type\="string"\>登録</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00002</Patient\_ID>      <WholeName type\="string"\>日医　佐織</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　サオリ</WholeName\_inKana>      <BirthDate type\="string"\>1982-04-01</BirthDate>      <Sex type\="string"\>2</Sex>    </Patient\_Information>    <Birth\_Delivery\_Infomation type\="record"\>      <History\_Number type\="string"\>001</History\_Number>      <Admission\_Date type\="string"\>2015-12-15</Admission\_Date>      <Discharge\_Date type\="string"\>2015-12-20</Discharge\_Date>      <Direct\_Payment type\="record"\>        <Label type\="string"\>直接支払制度</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>利用する</Name>      </Direct\_Payment>      <Ac\_Month type\="record"\>        <Label type\="string"\>請求年月</Label>        <Data type\="string"\>2015-12</Data>      </Ac\_Month>      <Ac\_Date\_Class type\="record"\>        <Label type\="string"\>提出日</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>２５日請求</Name>      </Ac\_Date\_Class>      <Ac\_Class type\="record"\>        <Label type\="string"\>請求区分</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>未請求</Name>      </Ac\_Class>      <Delivery type\="record"\>        <Label type\="string"\>分娩区分</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>正常分娩</Name>      </Delivery>      <Submission\_Provider type\="record"\>        <Label type\="string"\>提出先</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>国保連合会</Name>      </Submission\_Provider>      <Gestation\_Period\_Passed type\="record"\>        <Label type\="string"\>在胎週数</Label>        <Data type\="string"\>40</Data>        <Name type\="string"\>週</Name>      </Gestation\_Period\_Passed>      <Delivery\_Date type\="record"\>        <Label type\="string"\>出産年月日</Label>        <Data type\="string"\>2015-12-15</Data>      </Delivery\_Date>      <Stillborn\_Children type\="record"\>        <Label type\="string"\>死産有無</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>死産でない</Name>      </Stillborn\_Children>      <Children\_Born\_Number type\="record"\>        <Label type\="string"\>出産数</Label>        <Data type\="string"\> 1</Data>        <Name type\="string"\>人</Name>      </Children\_Born\_Number>      <Hospital\_Stay\_Days type\="record"\>        <Label type\="string"\>入院日数</Label>        <Data type\="string"\>  6</Data>        <Name type\="string"\>日</Name>      </Hospital\_Stay\_Days>      <Obstetric\_Compensation\_System type\="record"\>        <Label type\="string"\>産科医療補償制度</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>対象分娩</Name>      </Obstetric\_Compensation\_System>      <Hospital\_Money type\="record"\>        <Label type\="string"\>入院料</Label>        <Data type\="string"\> 100000</Data>        <Name type\="string"\>円</Name>      </Hospital\_Money>      <Room\_Money type\="record"\>        <Label type\="string"\>室料差額</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Room\_Money>      <Delivery\_Care\_Money type\="record"\>        <Label type\="string"\>分娩介助料</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Delivery\_Care\_Money>      <Delivery\_Money type\="record"\>        <Label type\="string"\>分娩料</Label>        <Data type\="string"\> 300000</Data>        <Name type\="string"\>円</Name>      </Delivery\_Money>      <Child\_Care\_Money type\="record"\>        <Label type\="string"\>新生児管理保育料</Label>        <Data type\="string"\>  30000</Data>        <Name type\="string"\>円</Name>      </Child\_Care\_Money>      <Examination\_Money type\="record"\>        <Label type\="string"\>検査・薬剤料</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Examination\_Money>      <Medical\_Treatment\_Money type\="record"\>        <Label type\="string"\>処置・手当料</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Medical\_Treatment\_Money>      <OCS\_Money type\="record"\>        <Label type\="string"\>産科医療補償制度掛金</Label>        <Data type\="string"\>  16000</Data>        <Name type\="string"\>円</Name>      </OCS\_Money>      <Other\_Money type\="record"\>        <Label type\="string"\>その他</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Other\_Money>      <Copayment\_Money type\="record"\>        <Label type\="string"\>一部負担金等</Label>        <Data type\="string"\>      0</Data>        <Name type\="string"\>円</Name>      </Copayment\_Money>      <Ac\_Money type\="record"\>        <Label type\="string"\>妊婦合計負担額</Label>        <Data type\="string"\> 446000</Data>        <Name type\="string"\>円</Name>      </Ac\_Money>      <Agency\_Receipt type\="record"\>        <Label type\="string"\>代理受取額</Label>        <Data type\="string"\> 420000</Data>        <Name type\="string"\>円</Name>      </Agency\_Receipt>      <HealthInsurance\_Information type\="record"\>        <InsuranceProvider\_Number type\="string"\>01130012</InsuranceProvider\_Number>        <InsuranceProvider\_Name type\="string"\>全国健康保険協会東京支部</InsuranceProvider\_Name>        <HealthInsuredPerson\_Symbol type\="string"\>５０１０２０３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>１</HealthInsuredPerson\_Number>        <RelationToInsuredPerson type\="string"\>5</RelationToInsuredPerson>      </HealthInsurance\_Information>    </Birth\_Delivery\_Infomation>  </private\_objects>  
</xmlio2> 

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
      
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
      
    
    Net::HTTP.version\_1\_1   
    

Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
サンプルソース内に以下の一行が記述されていることを確認して下さい。

 # -\*- coding: utf-8 -\*-  

[sample\_birthdelivery\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_birthdelivery_v2.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 出産育児一時金  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/birthdeliveryv2") \# Request\_Number:  
\#   01: 照会  
\#   02: 登録  
#BODY \= <<EOF

<data>  <private\_objects type \="record"\>    <Save\_Request type \="string"\>1</Save\_Request>    <Request\_Number type \="string"\>02</Request\_Number>    <Patient\_ID type \="string"\>00002</Patient\_ID>    <Admission\_Date type \="string"\>2015-12-15</Admission\_Date>    <Direct\_Payment type \="string"\>1</Direct\_Payment>    <Ac\_Month type \="string"\>2015-12</Ac\_Month>    <Ac\_Date\_Class type \="string"\>2</Ac\_Date\_Class>    <Ac\_Class type \="string"\>1</Ac\_Class>    <Delivery type \="string"\>1</Delivery>    <Submission\_Provider type \="string"\>2</Submission\_Provider>    <Gestation\_Period\_Passed type \="string"\>40</Gestation\_Period\_Passed>    <Delivery\_Date type \="string"\>2015-12-15</Delivery\_Date>    <Stillborn\_Children type \="string"\>2</Stillborn\_Children>    <Children\_Born\_Number type \="string"\>1</Children\_Born\_Number>    <Hospital\_Stay\_Days type \="string"\>6</Hospital\_Stay\_Days>    <Obstetric\_Compensation\_System type \="string"\>1</Obstetric\_Compensation\_System>    <Hospital\_Money type \="string"\>100000</Hospital\_Money>    <Delivery\_Money type \="string"\>300000</Delivery\_Money>    <Child\_Care\_Money type \="string"\>30000</Child\_Care\_Money>    <OCS\_Money type \="string"\>16000</OCS\_Money>    <Insurance\_Combination\_Number type \="string"\>0001</Insurance\_Combination\_Number>  </private\_objects>  
</data>  

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 出産育児一時金

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/childbirth.html#wrapper)

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
