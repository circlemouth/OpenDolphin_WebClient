[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#content)

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
 > 全保険組合せ一覧取得

全保険組合せ一覧取得
==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#errmsg)
      
    

更新履歴
----

 2021-01-27   「レスポンス一覧」に項目を追加。  

 2019-06-25   「レスポンス一覧」に項目を追加。

概要
--

POSTメソッドによる全保険組合せ一覧取得を行います。

日レセVer4.8.0\[第67回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。  

テスト方法
-----

1.  参考提供されている sample\_patientlst6\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_patientlst6\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_patientlst6\_v2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/patientlst6v2  
  
Content\-Type: application/xml 

application/xml の場合の文字コードは UTF-8 とします。

<data>        <patientlst6req type\="record"\>                <Reqest\_Number type\="string"\>01</Reqest\_Number>                <Patient\_ID type\="string"\>166</Patient\_ID>                <Base\_Date type\="string"\></Base\_Date>                <Start\_Date type\="string"\></Start\_Date>                <End\_Date type\="string"\></End\_Date>        </patientlst6req>  
</data> 

### 処理概要

全保険組合わせ一覧リクエストにより指定患者の全保険組合わせ情報を返却します。

レスポンスサンプル
---------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <patientlst2res type\="record"\>    <Information\_Date type\="string"\>2017-04-28</Information\_Date>    <Information\_Time type\="string"\>15:24:45</Information\_Time>    <Api\_Result type\="string"\>000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00166</Patient\_ID>      <WholeName type\="string"\>テスト　チョウキ</WholeName>      <WholeName\_inKana type\="string"\>テスト　チョウキ</WholeName\_inKana>      <BirthDate type\="string"\>1956-05-05</BirthDate>      <Sex type\="string"\>2</Sex>    </Patient\_Information>    <HealthInsurance\_Information type\="array"\>      <HealthInsurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceCombination\_Rate\_Admission type\="string"\>0.30</InsuranceCombination\_Rate\_Admission>        <InsuranceCombination\_Rate\_Outpatient type\="string"\>0.30</InsuranceCombination\_Rate\_Outpatient>        <InsuranceCombination\_StartDate type\="string"\>2013-01-01</InsuranceCombination\_StartDate>        <InsuranceCombination\_ExpiredDate type\="string"\>9999-12-31</InsuranceCombination\_ExpiredDate>        <Insurance\_Nondisplay type\="string"\>N</Insurance\_Nondisplay>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６４５６</HealthInsuredPerson\_Number>        <RelationToInsuredPerson type\="string"\>2</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>テスト</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2013-01-01</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <Insurance\_CheckDate type\="string"\>2014-06-02</Insurance\_CheckDate>      </HealthInsurance\_Information\_child>      <HealthInsurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <InsuranceCombination\_Rate\_Admission type\="string"\>0.30</InsuranceCombination\_Rate\_Admission>        <InsuranceCombination\_Rate\_Outpatient type\="string"\>0.30</InsuranceCombination\_Rate\_Outpatient>        <InsuranceCombination\_StartDate type\="string"\>2013-01-01</InsuranceCombination\_StartDate>        <InsuranceCombination\_ExpiredDate type\="string"\>9999-12-31</InsuranceCombination\_ExpiredDate>        <Insurance\_Nondisplay type\="string"\>N</Insurance\_Nondisplay>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６４５６</HealthInsuredPerson\_Number>        <RelationToInsuredPerson type\="string"\>2</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>テスト</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2013-01-01</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <Insurance\_CheckDate type\="string"\>2014-06-02</Insurance\_CheckDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>972</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>長期</PublicInsurance\_Name>            <Rate\_Admission type\="string"\>0.00</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.00</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2013-01-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            <Certificate\_CheckDate type\="string"\>2016-06-12</Certificate\_CheckDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </HealthInsurance\_Information\_child>      <HealthInsurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0003</Insurance\_Combination\_Number>        <InsuranceCombination\_Rate\_Admission type\="string"\>0.10</InsuranceCombination\_Rate\_Admission>        <InsuranceCombination\_Rate\_Outpatient type\="string"\>0.10</InsuranceCombination\_Rate\_Outpatient>        <InsuranceCombination\_StartDate type\="string"\>2013-01-01</InsuranceCombination\_StartDate>        <InsuranceCombination\_ExpiredDate type\="string"\>9999-12-31</InsuranceCombination\_ExpiredDate>        <Insurance\_Nondisplay type\="string"\>N</Insurance\_Nondisplay>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６４５６</HealthInsuredPerson\_Number>        <RelationToInsuredPerson type\="string"\>2</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>テスト</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2013-01-01</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <Insurance\_CheckDate type\="string"\>2014-06-02</Insurance\_CheckDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>015</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>更生</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>15320013</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>0000000</PublicInsuredPerson\_Number>            <Rate\_Admission type\="string"\>0.10</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.10</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2013-01-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            <Certificate\_CheckDate type\="string"\>2016-06-12</Certificate\_CheckDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </HealthInsurance\_Information\_child>      <HealthInsurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0004</Insurance\_Combination\_Number>        <InsuranceCombination\_Rate\_Admission type\="string"\>0.10</InsuranceCombination\_Rate\_Admission>        <InsuranceCombination\_Rate\_Outpatient type\="string"\>0.10</InsuranceCombination\_Rate\_Outpatient>        <InsuranceCombination\_StartDate type\="string"\>2013-01-01</InsuranceCombination\_StartDate>        <InsuranceCombination\_ExpiredDate type\="string"\>9999-12-31</InsuranceCombination\_ExpiredDate>        <Insurance\_Nondisplay type\="string"\>N</Insurance\_Nondisplay>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６４５６</HealthInsuredPerson\_Number>        <RelationToInsuredPerson type\="string"\>2</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>テスト</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2013-01-01</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <Insurance\_CheckDate type\="string"\>2014-06-02</Insurance\_CheckDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>015</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>更生</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>15320013</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>0000000</PublicInsuredPerson\_Number>            <Rate\_Admission type\="string"\>0.10</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.10</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2013-01-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            <Certificate\_CheckDate type\="string"\>2016-06-12</Certificate\_CheckDate>          </PublicInsurance\_Information\_child>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>972</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>長期</PublicInsurance\_Name>            <Rate\_Admission type\="string"\>0.00</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.00</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2013-01-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            <Certificate\_CheckDate type\="string"\>2016-06-12</Certificate\_CheckDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </HealthInsurance\_Information\_child>    </HealthInsurance\_Information>  </patientlst2res>  
</xmlio2> 

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Reqest\_Number | 処理区分 | 01  | 必須  |
| 2   | Patient\_ID | 患者番号 | 166 | 必須  |
| 3   | Base\_Date | 基準日 |     | ※１  |
| 4   | Start\_Date | 開始年月 |     | ※２  |
| 5   | End\_Date | 終了年月 |     | ※２  |

※１：設定があれば、基準日で有効な保険組合せのみ返却します。

※２：どちらかに設定があれば、開始年月・終了年月の期間で有効な保険組合せを返却します。  
　　　この時、開始年月が未設定は0000/00、終了年月が未設定は9999/12とします。  

※基準日、開始年月、終了年月がすべて未設定の場合、すべての保険組合せを返却します。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2017-04-28 |     |
| 2   | Information\_Time | 実施時間 | 15:24:45 |     |
| 3   | Api\_Result | エラーコード | 000 | ※１  |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00166 |     |
| 6-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1956-05-05 |     |
| 6-5 | Sex | 性別  | 2   |     |
| 7   | HealthInsurance\_Information | 保険組合せ情報（繰り返し　２００） |     |     |
| 7-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 |     |
| 7-2 | InsuranceCombination\_Rate\_Admission | 保険組合せ入院負担割合 | 0.30 | ※２  |
| 7-3 | InsuranceCombination\_Rate\_Outpatient | 保険組合せ外来負担割合 | 0.30 | ※２  |
| 7-4 | InsuranceCombination\_StartDate | 保険組合せ有効開始日 | 2013-01-01 |     |
| 7-5 | InsuranceCombination\_ExpiredDate | 保険組合せ有効終了日 | 9999-12-31 |     |
| 7-6 | Insurance\_Nondisplay | 非表示区分 | N   |     |
| 7-7 | InsuranceProvider\_Class | 保険の種類 | 009 |     |
| 7-8 | InsuranceProvider\_Number | 保険者番号 | 01320019 |     |
| 7-9 | InsuranceProvider\_WholeName | 保険の制度名称 | 協会  |     |
| 7-10 | HealthInsuredPerson\_Symbol | 記号  | １２３１２３ |     |
| 7-11 | HealthInsuredPerson\_Number | 番号  | ４５６４５６ |     |
| 7-12 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 7-13 | HealthInsuredPerson\_Continuation | 継続区分 |     |     |
| 7-14 | HealthInsuredPerson\_Assistance | 補助区分 |     |     |
| 7-15 | HealthInsuredPerson\_Assistance\_Name | 補助区分名称 |     |     |
| 7-16 | RelationToInsuredPerson | 本人家族区分 | 2   |     |
| 7-17 | HealthInsuredPerson\_WholeName | 被保険者名 | テスト |     |
| 7-18 | Certificate\_StartDate | 適用開始日 | 2013-01-01 |     |
| 7-19 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-20 | Certificate\_GetDate | 資格取得日 |     |     |
| 7-21 | Insurance\_CheckDate | 確認日付 | 2014-06-02 |     |
| 7-22 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 7-22-1 | PublicInsurance\_Class | 公費の種類 | 972 |     |
| 7-22-2 | PublicInsurance\_Name | 公費の制度名称 | 長期  |     |
| 7-22-3 | PublicInsurer\_Number | 負担者番号 |     |     |
| 7-22-4 | PublicInsuredPerson\_Number | 受給者番号 |     |     |
| 7-22-5 | Rate\_Admission | 入院−負担率（割） | 0.00 |     |
| 7-22-6 | Money\_Admission | 入院−固定額 | 0   |     |
| 7-22-7 | Rate\_Outpatient | 外来−負担率（割） | 0.00 |     |
| 7-22-8 | Money\_Outpatient | 外来−固定額 | 0   |     |
| 7-22-9 | Certificate\_IssuedDate | 適用開始日 | 2013-01-01 |     |
| 7-22-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-22-11 | Certificate\_CheckDate | 確認日付 | 2016-06-12 | 追加  <br>(2019-06-25) |
| 7-23 | Accident\_Insurance\_Information | 労災保険情報 |     |     |
| 7-23-1 | Accident\_Insurance\_WholeName | 労災保険名称 |     |     |
| 7-23-2 | Disease\_Location | 傷病の部位 |     |     |
| 7-23-3 | Disease\_Date | 傷病年月日 |     |     |
| 7-23-4 | Accident\_Insurance\_Number | 労働保険番号 |     |     |
| 7-23-5 | PensionCertificate\_Number | 年金証書番号 |     |     |
| 7-23-6 | Accident\_Class | 災害区分 |     |     |
| 7-23-7 | Accident\_Class\_Name | 災害区分名称 |     |     |
| 7-23-8 | Labor\_Station\_Code | 労働基準監督署コード |     |     |
| 7-23-9 | Labor\_Station\_Code\_Name | 労働基準監督署名称 |     |     |
| 7-23-10 | Accident\_Continuous | 新規継続区分 |     |     |
| 7-23-11 | Accident\_Continuous\_Name | 新規継続区分名称 |     |     |
| 7-23-12 | Outcome\_Reason | 転帰事由 |     |     |
| 7-23-13 | Outcome\_Reason\_Name | 転帰事由名称 |     |     |
| 7-23-14 | Limbs\_Exception | 四肢特例区分 |     |     |
| 7-23-15 | Limbs\_Exception\_Name | 四肢特例区分名称 |     |     |
| 7-23-16 | Liability\_Office\_Information | 事業所情報 |     |     |
| 7-23-16-1 | L\_WholeName | 事業所名称 |     |     |
| 7-23-16-2 | Prefecture\_Information | 所在地都道府県 |     |     |
| 7-23-16-2-1 | P\_WholeName | 都道府県名称 |     |     |
| 7-23-16-2-2 | P\_Class | 都道府県区分 |     |     |
| 7-23-16-2-3 | P\_Class\_Name | 都道府県区分名称 |     |     |
| 7-23-16-3 | City\_Information | 所在地郡市 |     |     |
| 7-23-16-3-1 | C\_WholeName | 郡市区名称 |     |     |
| 7-23-16-3-2 | C\_Class | 郡市区区分 |     |     |
| 7-23-16-3-3 | C\_Class\_Name | 郡市区区分名称 |     |     |
| 7-23-17 | Accident\_Base\_Month | 労災レセ回数記載 基準年月 |     |     |
| 7-23-18 | Accident\_Receipt\_Count | 労災レセ回数記載 回数 |     |     |
| 7-23-19 | Liability\_Insurance | 自賠責請求区分 |     |     |
| 7-23-20 | Liability\_Insurance\_Name | 自賠責請求区分名称 |     |     |
| 7-23-21 | Liability\_Insurance\_Office\_Name | 自賠責保険会社名 |     |     |
| 7-23-22 | Liability\_Physician\_Code | 自賠責担当医コード |     |     |
| 7-23-23 | Liability\_Physician\_Code\_Name | 自賠責担当医名称 |     |     |
| 7-23-24 | PersonalHealthRecord\_Number | アフターケア  健康管理手帳番号 |     |     |
| 7-23-25 | Damage\_Class | アフターケア  損傷区分 |     |     |
| 7-23-25-1 | D\_Code | 損傷区分 |     |     |
| 7-23-25-2 | D\_WholeName | 損傷区分名称 |     |     |
| 7-24 | Third\_Party\_Supply | 第三者行為  現物支給区分 |     |     |
| 7-25 | Third\_Party\_Supply\_Name | 第三者行為  現物支給名称 |     |     |
| 7-26 | Third\_Party\_Report | 第三者行為  特記事項区分 |     |     |
| 7-27 | Third\_Party\_Report\_Name | 第三者行為  特記事項名称 |     |     |

※１：対象が２００件以上の時は、警告メッセージを表示します。

※２：基準日の設定があれば、基準日での負担割合を編集します。  
　　　　設定がない場合は、保険組合せの負担割合を編集します。（３歳未満の３割、労災・自賠責の１０割）  

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

[sample\_patientlst6\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientlst6_v2.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 請求金額シュミレーション  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"  
#HOST = "192.168.1.140"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/patientlst6v2")  
#req = Net::HTTP::Post.new("/api01rv2/visitptlstv2?class=02")  
\# 保険組合せ取得API(期間指定etc)  
#  
#BODY \= <<EOF  
<data>        <patientlst6req type\="record"\>                <Reqest\_Number type\="string"\>01</Reqest\_Number>  
                <Patient\_ID type="string">166</Patient\_ID\>                <Base\_Date type\="string"\></Base\_Date\>                <Start\_Date type\="string"\></Start\_Date\>                <End\_Date type\="string"\></End\_Date\>        </patientlst6req>  
</data\>  
EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
  
}

   

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号の設定がありません |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 基準日が暦日ではありません |
| 12  | 開始年月が暦日ではありません |
| 13  | 終了年月が暦日ではありません |
| 14  | 開始年月＞終了年月です |
| 20  | 対象の保険組合せが存在しません |
| 21  | 対象の保険組合せが２００件以上となります |
| 1001 | 職員情報が取得できません |
| 1002 | 医療機関情報が取得できません |
| 1003 | システム日付が取得できません |
| 1005 | 患者番号構成情報が取得できません |
| 1015 | グループ医療機関が不整合です |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 全保険組合せ一覧取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/insurancecombi.html#wrapper)

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
