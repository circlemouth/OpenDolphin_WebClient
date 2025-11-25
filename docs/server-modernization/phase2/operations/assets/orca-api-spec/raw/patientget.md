[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#content)

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
 > 日医標準レセプトソフト API 患者基本情報

患者基本情報の取得
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#test)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#ressample)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#response)
    
*   [Rubyによる患者基本情報の取得サンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#rubysample)
    
*   [C#による患者基本情報の取得サンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#errmsg)
      
    

  

更新履歴
----

2025-01-28   「レスポンス一覧」に項目を追加。

2024-01-31   「レスポンス一覧」に項目を追加。

2020-04-22   「レスポンス一覧」に項目を追加。

2019-06-25   「レスポンス一覧」に項目を追加。

2018-10-25   「レスポンス一覧」に項目を追加。

2018-03-26   （Ver5.0.0以降のみ）「レスポンス一覧」に項目を追加。

2017-05-25   「レスポンス一覧」に項目を追加。  

2017-04-26   「レスポンス一覧」に項目を追加。  
　　　　　　　「レスポンス一覧」の保険組合せ情報の件数を20→30に変更。  

2017-03-27   引数（format）を追加。 

2017-01-26   「レスポンス一覧」に項目を追加。  

2016-10-20   「レスポンス一覧」に項目を追加。  
　　　　　　　「レスポンス一覧」の介護認定情報の件数を10→50に変更。

2015-01-27   労災（自賠、アフターケア）情報を追加。  
　　　　　　　「レスポンス一覧」に項目を追加。  

2014-11-25  　「レスポンス一覧」に項目を追加。  
　　　　　　　 「レスポンスサンプル」に「初来院日、最終来院日の情報について」を追加。  
　　　　　　　「レスポンスサンプル」に「保険組合せの負担割合情報、保険の最終確認日について」を追加。

2014-07-14  「エラーメッセージ一覧」を追加。  

2014-05-20  「レスポンス一覧」に項目を追加。  

2013-12-24  「レスポンス一覧」に項目を追加。

  

概要
--

GETメソッドによる患者基本情報の取得を行います。

レスポンスデータはxml2形式になります。  

  

テスト方法
-----

以下のURLにアクセスするとAPIとして処理され患者基本情報が返却されます。

http://ホスト名:ポート番号(デフォルト8000)/api01rv2/patientgetv2?id=xxxx　(xxxx:患者番号）

ex)

http://localhost:8000/api01rv2/patientgetv2?id=1233    

ver 5.0以降では引数のformatによってJSON形式でも返却を可能とします。

ex)

http://localhost:8000/api01rv2/patientgetv2?id=1233&format=json

  

レスポンスサンプル
---------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <patientinfores type\="record"\>    <Information\_Date type\="string"\>2018-10-02</Information\_Date>    <Information\_Time type\="string"\>11:25:31</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00200</Patient\_ID>      <WholeName type\="string"\>てすと　受付</WholeName>      <WholeName\_inKana type\="string"\>テスト　ウケツケ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>2</Sex>      <HouseHolder\_WholeName type\="string"\>てすと　受付</HouseHolder\_WholeName>      <TestPatient\_Flag type\="string"\>0</TestPatient\_Flag>      <Reduction\_Reason type\="string"\>00</Reduction\_Reason>      <Reduction\_Reason\_Name type\="string"\>該当なし</Reduction\_Reason\_Name>      <Discount type\="string"\>00</Discount>      <Discount\_Name type\="string"\>該当なし</Discount\_Name>      <Condition1 type\="string"\>00</Condition1>      <Condition1\_Name type\="string"\>該当なし</Condition1\_Name>      <Condition2 type\="string"\>00</Condition2>      <Condition2\_Name type\="string"\>該当なし</Condition2\_Name>      <Condition3 type\="string"\>00</Condition3>      <Condition3\_Name type\="string"\>該当なし</Condition3\_Name>      <Ic\_Code type\="string"\>01</Ic\_Code>      <Ic\_Code\_Name type\="string"\>現金</Ic\_Code\_Name>      <Community\_Cid\_Agree type\="string"\>False</Community\_Cid\_Agree>      <FirstVisit\_Date type\="string"\>2017-12-13</FirstVisit\_Date>      <LastVisit\_Date type\="string"\>2018-01-15</LastVisit\_Date>      <HealthInsurance\_Information type\="array"\>        <HealthInsurance\_Information\_child type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>          <InsuranceCombination\_Rate\_Admission type\="string"\>0.30</InsuranceCombination\_Rate\_Admission>          <InsuranceCombination\_Rate\_Outpatient type\="string"\>0.30</InsuranceCombination\_Rate\_Outpatient>          <Insurance\_Nondisplay type\="string"\>N</Insurance\_Nondisplay>          <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>01320027</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>てすと　受付</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2017-11-21</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          <Certificate\_GetDate type\="string"\>2010-10-10</Certificate\_GetDate>          <Insurance\_CheckDate type\="string"\>2017-11-21</Insurance\_CheckDate>        </HealthInsurance\_Information\_child>      </HealthInsurance\_Information>      <Care\_Information type\="record"\>        <Community\_Disease type\="array"\>          <Community\_Disease\_child type\="record"\>            <Target\_Disease type\="string"\>True</Target\_Disease>          </Community\_Disease\_child>          <Community\_Disease\_child type\="record"\>            <Target\_Disease type\="string"\>True</Target\_Disease>          </Community\_Disease\_child>          <Community\_Disease\_child type\="record"\>            <Target\_Disease type\="string"\>True</Target\_Disease>          </Community\_Disease\_child>          <Community\_Disease\_child type\="record"\>            <Target\_Disease type\="string"\>True</Target\_Disease>          </Community\_Disease\_child>        </Community\_Disease>      </Care\_Information>      <Personally\_Information type\="record"\>        <Pregnant\_Class type\="string"\>True</Pregnant\_Class>        <Community\_Disease2 type\="string"\>True</Community\_Disease2>        <Community\_Disease3 type\="string"\>True</Community\_Disease3>      </Personally\_Information>      <Auto\_Management\_Information type\="array"\>        <Auto\_Management\_Information\_child type\="record"\>          <Medication\_Code type\="string"\>113002850</Medication\_Code>          <Medication\_Name type\="string"\>てんかん指導料</Medication\_Name>          <Medication\_EndDate type\="string"\>9999-12-31</Medication\_EndDate>        </Auto\_Management\_Information\_child>        <Auto\_Management\_Information\_child type\="record"\>          <Medication\_Code type\="string"\>113002910</Medication\_Code>          <Medication\_Name type\="string"\>難病外来指導管理料</Medication\_Name>          <Medication\_EndDate type\="string"\>9999-12-31</Medication\_EndDate>        </Auto\_Management\_Information\_child>      </Auto\_Management\_Information>      <Patient\_Contra\_Information type\="record"\>        <Patient\_Contra\_Info type\="array"\>          <Patient\_Contra\_Info\_child type\="record"\>            <Medication\_Code type\="string"\>610406079</Medication\_Code>            <Medication\_Name type\="string"\>ガスター散２％</Medication\_Name>            <Medication\_EndDate type\="string"\>9999-12-31</Medication\_EndDate>            <Contra\_StartDate type\="string"\>2018-05-03</Contra\_StartDate>          </Patient\_Contra\_Info\_child>          <Patient\_Contra\_Info\_child type\="record"\>            <Medication\_Code type\="string"\>610406047</Medication\_Code>            <Medication\_Name type\="string"\>ウテロン錠５ｍｇ</Medication\_Name>            <Medication\_EndDate type\="string"\>9999-12-31</Medication\_EndDate>          </Patient\_Contra\_Info\_child>        </Patient\_Contra\_Info>      </Patient\_Contra\_Information>    </Patient\_Information>  </patientinfores>  
</xmlio2>

  

### 処理概要

引数(id)により該当患者の基本情報取得を行います。

  

### 処理詳細

送信された患者番号による患者の存在チェック。

  

### 初来院日、最終来院日の情報について

*   返却項目として初来院日、最終来院日を返却します。
*   当日が退院日の場合のみ、退院日を設定します。
*   但し以下の場合は、初回、最終来院日は設定しません。  
    初回は受診履歴の登録が１件もない場合は設定しません。  
    最終来院日は、入院日・退院日の設定がある場合は設定しません。  
    該当患者が入院中の場合は、入院日および入外区分を入院中として返却します。

  

### 保険組合せの負担割合情報、保険の最終確認日について

*   返却項目として保険組合せの負担割合情報を返却します。  
    設定する内容は、日レセの「21 診療行為」と同等のものとします。  
    
*   返却項目として保険の最終確認日を返却します。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-01-16 |     |
| 2   | Information\_Time | 実施時間 | 12:12:42 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Patient\_Information | 患者基本情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00017 |     |
| 6-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 6-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 6-6 | HouseHolder\_WholeName | 世帯主名 | 日医　太郎 |     |
| 6-7 | Relationship | 続柄  | 本人  |     |
| 6-8 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 6-8-1 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 6-8-2 | WholeAddress1 | 住所1 | 東京都文京区本駒込 |     |
| 6-8-3 | WholeAddress2 | 住所2 | ６−１６−３ |     |
| 6-8-4 | PhoneNumber1 | 自宅電話番号 | 03-3333-2222 |     |
| 6-8-5 | PhoneNumber2 | 連絡先電話番号 | 03-3333-1133 |     |
| 6-9 | WorkPlace\_Information | 勤務先情報 |     | 追加  <br>(2016-10-20) |
| 6-9-1 | WholeName | 勤務先名 | てすと　株式会社 | 追加  <br>(2016-10-20) |
| 6-9-2 | Address\_ZipCode | 郵便番号 | 1130022 | 追加  <br>(2016-10-20) |
| 6-9-3 | WholeAddress1 | 住所  | 東京都文京区本駒込 | 追加  <br>(2016-10-20) |
| 6-9-4 | WholeAddress2 | 番地番号 | ５−１２−１１ | 追加  <br>(2016-10-20) |
| 6-9-5 | PhoneNumber | 電話番号 | 03-3333-2211 | 追加  <br>(2016-10-20) |
| 6-10 | Contact\_Information | 連絡先情報 |     | 追加  <br>(2016-10-20) |
| 6-10-1 | WholeName | 連絡先名称 | 日医　太郎 | 追加  <br>(2016-10-20) |
| 6-10-2 | Relationship | 続柄  | 本人  | 追加  <br>(2016-10-20) |
| 6-10-3 | Address\_ZipCode | 郵便番号 | 1130021 | 追加  <br>(2016-10-20) |
| 6-10-4 | WholeAddress1 | 住所  | 東京都文京区本駒込 | 追加  <br>(2016-10-20) |
| 6-10-5 | WholeAddress2 | 番地番号 | ６−１６−３ | 追加  <br>(2016-10-20) |
| 6-10-6 | PhoneNumber1 | 電話番号（昼） | 03-3333-2222 | 追加  <br>(2016-10-20) |
| 6-10-7 | PhoneNumber2 | 電話番号（夜） | 03-3333-1133 | 追加  <br>(2016-10-20) |
| 6-11 | Home2\_Information | 帰省先情報 |     | 追加  <br>(2016-10-20) |
| 6-11-1 | WholeName | 帰省先名称 | 実家  | 追加  <br>(2016-10-20) |
| 6-11-2 | Address\_ZipCode | 郵便番号 | 6900051 | 追加  <br>(2016-10-20) |
| 6-11-3 | WholeAddress1 | 住所  | 島根県松江市横浜町 | 追加  <br>(2016-10-20) |
| 6-11-4 | WholeAddress2 | 番地番号 | １１５５ | 追加  <br>(2016-10-20) |
| 6-11-5 | PhoneNumber | 電話番号 | 0852-22-2222 | 追加  <br>(2016-10-20) |
| 6-12 | Contraindication1 | 禁忌１ | 禁忌  |     |
| 6-13 | Contraindication2 | 禁忌２ |     |     |
| 6-14 | Allergy1 | アレルギー１ | アレルギー |     |
| 6-15 | Allergy2 | アレルギー２ |     |     |
| 6-16 | Infection1 | 感染症１ | 感染症 |     |
| 6-17 | Infection2 | 感染症２ |     |     |
| 6-18 | Comment1 | コメント１ | コメント |     |
| 6-19 | Comment2 | コメント２ |     |     |
| 6-20 | TestPatient\_Flag | テスト患者区分  <br>(0:患者、1:テスト患者) | 0   | 追加  <br>(2017-05-25) |
| 6-21 | Death\_Flag | 死亡区分  <br>(1:死亡) |     | 追加  <br>(2017-05-25) |
| 6-22 | Occupation | 職業  |     | 追加  <br>(2017-04-26) |
| 6-23 | NickName | 通称名 |     | 追加  <br>(2017-04-26) |
| 6-24 | CellularNumber | 携帯電話番号 |     | 追加  <br>(2017-04-26) |
| 6-25 | FaxNumber | ＦＡＸ番号 |     | 追加  <br>(2017-04-26) |
| 6-26 | EmailAddress | 電子メールアドレス |     | 追加  <br>(2017-04-26) |
| 6-27 | Reduction\_Reason | 減免事由番号 |     | 追加  <br>(2017-04-26) |
| 6-28 | Reduction\_Reason\_Name | 減免事由 |     | 追加  <br>(2017-04-26) |
| 6-29 | Discount | 割引率 |     | 追加  <br>(2017-04-26) |
| 6-30 | Discount\_Name | 割引率 |     | 追加  <br>(2017-04-26) |
| 6-31 | Condition1 | 状態番号１ |     | 追加  <br>(2017-04-26) |
| 6-32 | Condition1\_Name | 状態１ |     | 追加  <br>(2017-04-26) |
| 6-33 | Condition2 | 状態番号２ |     | 追加  <br>(2017-04-26) |
| 6-34 | Condition2\_Name | 状態２ |     | 追加  <br>(2017-04-26) |
| 6-35 | Condition3 | 状態番号３ |     | 追加  <br>(2017-04-26) |
| 6-36 | Condition3\_Name | 状態３ |     | 追加  <br>(2017-04-26) |
| 6-37 | Ic\_Code | 入金方法区分 |     | 追加  <br>(2017-04-26) |
| 6-38 | Ic\_Code\_Name | 入金方法 |     | 追加  <br>(2017-04-26) |
| 6-39 | Community\_Cid | 地域連携ID |     | 追加  <br>(2013-12-24) |
| 6-40 | Community\_Cid\_Agree | 同意フラグ  <br>（True：同意する、False：それ以外） | False | 追加  <br>(2013-12-24) |
| 6-41 | FirstVisit\_Date | 初回受診日 | 2014-01-06 | 追加  <br>(2014-11-25) |
| 6-42 | LastVisit\_Date | 最終受診日 |     | 追加  <br>(2014-11-25) |
| 6-43 | Outpatient\_Class | 入院中 | 1   | 追加  <br>(2014-11-25) |
| 6-44 | Admission\_Date | 入院日 | 2014-06-03 | 追加  <br>(2014-11-25) |
| 6-45 | Discharge\_Date | 退院日 |     | 追加  <br>(2014-11-25) |
| 6-46 | HealthInsurance\_Information | 保険組合せ情報(繰り返し　２０） |     | (2017-04-26 パッチ適用以降 繰り返し ３０) |
| 6-46-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 |     |
| 6-46-2 | InsuranceCombination\_Rate\_Admission | 入院負担割合 | 0.30 | 追加  <br>(2014-11-25) |
| 6-46-3 | InsuranceCombination\_Rate\_Outpatient | 外来負担割合 | 0.30 | 追加  <br>(2014-11-25) |
| 6-46-4 | Insurance\_Nondisplay | 保険組合せ非表示区分  <br>(O:外来非表示、I:入院非表示、N:非表示無し) |     | 追加  <br>(2017-04-26) |
| 6-46-5 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 |     |
| 6-46-6 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 6-46-7 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 6-46-8 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 6-46-9 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 6-46-10 | HealthInsuredPerson\_Branch\_Number | 枝番  | 01  | 追加  <br>(2020-04-22) |
| 6-46-11 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 6-46-12 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 6-46-13 | HealthInsuredPerson\_Assistance\_Name | 補助区分名称 | ３割  |     |
| 6-46-14 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 6-46-15 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 6-46-16 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 6-46-17 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 6-46-18 | Certificate\_GetDate | 資格取得日 | 2010-10-10 | 追加  <br>(2019-06-25) |
| 6-46-19 | Insurance\_CheckDate | 最終確認日 | 2014-01-06 | 追加  <br>(2014-11-25) |
| 6-46-20 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 6-46-20-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 6-46-20-2 | PublicInsurance\_Name | 公費の種類名称 | 原爆一般 |     |
| 6-46-20-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 6-46-20-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 6-46-20-5 | Rate\_Admission | 入院ー負担率(割) | 0.00 |     |
| 6-46-20-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 6-46-20-7 | Rate\_Outpatient | 外来ー負担率(割) | 0.00 |     |
| 6-46-20-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 6-46-20-9 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 6-46-20-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 6-46-20-11 | Certificate\_CheckDate | 確認日付(公費) | 2016-06-12 | 追加  <br>(2019-06-25) |
| 6-46-21 | Accident\_Insurance\_Information | 労災情報 |     | 追加  <br>(2015-01-27) |
| 6-46-21-1 | Accident\_Insurance\_WholeName | 労災自賠保険区分 | 短期給付 | 追加  <br>(2015-01-27) |
| 6-46-21-2 | Disease\_Location | 傷病の部位 | 右手指 | 追加  <br>(2015-01-27) |
| 6-46-21-3 | Disease\_Date | 傷病年月日 | 2014-08-12 | 追加  <br>(2015-01-27) |
| 6-46-21-4 | Accident\_Insurance\_Number | 労働保険番号 | 12345678901 | 追加  <br>(2015-01-27) |
| 6-46-21-5 | PensionCertificate\_Number | 年金証書番号 | 123456789 | 追加  <br>(2015-01-27) |
| 6-46-21-6 | Accident\_Class | 災害区分 | 業務中の災害 | 追加  <br>(2015-01-27) |
| 6-46-21-7 | Labor\_Station\_Code | 労働基準監督署コード | 32101 | 追加  <br>(2015-01-27) |
| 6-46-21-8 | Labor\_Station\_Code\_Name | 労働基準監督署 | 松江  | 追加  <br>(2015-01-27) |
| 6-46-21-9 | Liability\_Office\_Information | 事業所情報 |     | 追加  <br>(2015-01-27) |
| 6-46-21-9-1 | L\_WholeName | 事業所名称 | オルカ建設 | 追加  <br>(2015-01-27) |
| 6-46-21-9-2 | Prefecture\_Information | 所在地都道府県情報 |     | 追加  <br>(2015-01-27) |
| 6-46-21-9-2-1 | P\_WholeName | 都道府県名 | 島根  | 追加  <br>(2015-01-27) |
| 6-46-21-9-2-2 | P\_Class | 都道府県コード | 4   | 追加  <br>(2015-01-27) |
| 6-46-21-9-2-3 | P\_Class\_Name | 都道府県の区分 | 県   | 追加  <br>(2015-01-27) |
| 6-46-21-9-3 | City\_Information | 所在地郡市区情報 |     | 追加  <br>(2015-01-27) |
| 6-46-21-9-3-1 | C\_WholeName | 郡市区名 | 松江  | 追加  <br>(2015-01-27) |
| 6-46-21-9-3-2 | C\_Class | 郡市区コード | 2   | 追加  <br>(2015-01-27) |
| 6-46-21-9-3-3 | C\_Class\_Name | 郡市の区分 | 市   | 追加  <br>(2015-01-27) |
| 6-46-21-10 | Liability\_Insurance\_Office\_Name | 自賠責保険会社名 | オルカ自賠責保険 | 追加  <br>(2015-01-27) |
| 6-46-21-11 | PersonalHealthRecord\_Number | アフターケア　健康管理手帳番号 | 1234567890123 | 追加  <br>(2015-01-27) |
| 6-46-21-12 | Damage\_Class | アフターケア　損傷区分情報 |     | 追加  <br>(2015-01-27) |
| 6-46-21-12-1 | D\_Code | 損傷区分コード | 14  | 追加  <br>(2015-01-27) |
| 6-46-21-12-2 | D\_WholeName | 損傷区分 | 外傷による末梢神経損傷 | 追加  <br>(2015-01-27) |
| 6-47 | Care\_Information | 介護情報 |     | 追加  <br>(2014-05-20) |
| 6-47-1 | Insurance | 介護保険情報（繰り返し　１０） |     | 追加  <br>(2014-05-20) |
| 6-47-1-1 | InsuranceProvider\_Number | 保険者番号 | 123456 | 追加  <br>(2014-05-20) |
| 6-47-1-2 | HealthInsuredPerson\_Number | 被保険者番号 | 098765 | 追加  <br>(2014-05-20) |
| 6-47-1-3 | Certificate\_StartDate | 開始  | 2014-05-13 | 追加  <br>(2014-05-20) |
| 6-47-1-4 | Certificate\_ExpiredDate | 終了  | 2015-12-31 | 追加  <br>(2014-05-20) |
| 6-47-2 | Certification | 介護認定情報（繰り返し　５０） |     | 追加  <br>(2014-05-20)変更  <br>(2016-10-20) |
| 6-47-2-1 | Need\_Care\_State\_Code | 要介護状態コード | 11  | 追加  <br>(2014-05-20) |
| 6-47-2-2 | Need\_Care\_State | 要介護状態 | 要支援 | 追加  <br>(2014-05-20) |
| 6-47-2-3 | Certification\_Date | 認定日 | 2014-05-13 | 追加  <br>(2014-05-20) |
| 6-47-2-4 | Certificate\_StartDate | 開始  | 2014-05-13 | 追加  <br>(2014-05-20) |
| 6-47-2-5 | Certificate\_ExpiredDate | 終了  | 2015-05-12 | 追加  <br>(2014-05-20) |
| 6-47-3 | Community\_Disease | 地域包括診療対象疾病（繰り返し　４） |     | 追加  <br>(2014-05-20) |
| 6-47-3-1 | Target\_Disease | 高血圧症、糖尿病、脂質異常症、認知症の順に内容を表示  <br>（True：対象病名である、False：対象でない） | False | 追加  <br>(2014-05-20)  <br>※１ |
| 6-48 | Personally\_Information | 患者個別情報 |     | Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 6-48-1 | Pregnant\_Class | 妊婦区分 |     | Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 6-48-2 | Community\_Disease2 | 認知症地域包括診療加算算定  <br>（True：該当である） |     | 追加  <br>(2018-10-25) |
| 6-48-3 | Community\_Disease3 | 小児かかりつけ診療料算定  <br>（True：該当である） |     | 追加  <br>(2018-10-25) |
| 6-49 | Individual\_Number | 個人番号情報（繰り返し　２０） |     | 追加  <br>(2017-01-26) |
| 6-49-1 | In\_Id | Id\_key |     | 追加  <br>(2017-01-26) |
| 6-49-2 | In\_Number | 個人番号 |     | 追加  <br>(2017-01-26) |
| 6-49-3 | In\_Description | 備考（説明） |     | 追加  <br>(2017-01-26) |
| 6-50 | Auto\_Management\_Information | 管理料等自動算定情報（繰り返し　３） |     | 追加  <br>(2018-10-25) |
| 6-50-1 | Medication\_Code | 管理料コード |     | 追加  <br>(2018-10-25) |
| 6-50-2 | Medication\_Name | 管理料名称 |     | 追加  <br>(2018-10-25) |
| 6-50-3 | Medication\_EndDate | 有効終了日 |     | 追加  <br>(2018-10-25) |
| 6-51 | Patient\_Contra\_Information | 患者禁忌薬剤情報 |     | 追加  <br>(2018-10-25) |
| 6-51-1 | Patient\_Contra\_Info | 患者禁忌薬剤情報（繰り返し　１００） |     | 追加  <br>(2018-10-25) |
| 6-51-1-1 | Medication\_Code | 薬剤コード |     | 追加  <br>(2018-10-25) |
| 6-51-1-2 | Medication\_Name | 薬剤名称 |     | 追加  <br>(2018-10-25) |
| 6-51-1-3 | Medication\_EndDate | 有効終了日 |     | 追加  <br>(2018-10-25) |
| 6-51-1-4 | Contra\_StartDate | 禁忌開始日 |     | 追加  <br>(2018-10-25) |
| 6-52 | ResultOfQualificationConfirmation | 資格確認結果 |     | 追加  <br>(2024-01-31) |
| 6-52-1 | FaceInfExistence | 資格確認有無 | True：有　False：無 | 追加  <br>(2024-01-31) |
| 6-52-2 | PrescriptionIssueSelect | 処方箋発行形態 |     | 追加  <br>(2024-01-31) |
| 6-52-3 | QualificationValidity | 資格有効性 |     | 追加  <br>(2024-01-31) |
| 6-52-4 | LimitApplicationCertificateRelatedConsFlg | 限度額適用認定証提供同意フラグ |     | 追加  <br>(2024-01-31) |
| 6-52-5 | SpecificHealthCheckupsInfoConsFlg | 特定健診情報閲覧同意フラグ |     | 追加  <br>(2024-01-31) |
| 6-52-6 | SpecificHealthCheckupsInfoAvailableTime | 特定健診情報閲覧有効期限 |     | 追加  <br>(2024-01-31) |
| 6-52-7 | PharmacistsInfoConsFlg | 薬剤情報閲覧同意フラグ |     | 追加  <br>(2024-01-31) |
| 6-52-8 | PharmacistsInfoAvailableTime | 薬剤情報閲覧有効期限 |     | 追加  <br>(2024-01-31) |
| 6-52-9 | DiagnosisInfoConsFlg | 診療情報閲覧同意フラグ |     | 追加  <br>(2024-01-31) |
| 6-52-10 | DiagnosisInfoAvailableTime | 診療情報閲覧有効期限 |     | 追加  <br>(2024-01-31) |
| 6-52-11 | OperationInfoConsFlg | 手術情報閲覧同意フラグ |     | 追加  <br>(2024-01-31) |
| 6-52-12 | OperationInfoAvailableTime | 手術情報閲覧有効期限 |     | 追加  <br>(2024-01-31) |
| 6-52-13 | DiagnosisNameConsFlg | 傷病名閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-14 | DiagnosisNameConsTime | 傷病名閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-15 | DiagnosisNameAvailableTime | 傷病名閲覧有効期限 |     | 追加  <br>(2025-01-28) |
| 6-52-16 | InfectiousInfoConsFlg | 感染症情報閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-17 | InfectiousInfoConsTime | 感染症情報閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-18 | InfectiousInfoAvailableTime | 感染症情報閲覧有効期限 |     | 追加  <br>(2025-01-28) |
| 6-52-19 | AllergyInfoConsFlg | その他アレルギー等情報閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-20 | AllergyInfoConsTime | その他アレルギー等情報閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-21 | AllergyInfoAvailableTime | その他アレルギー等情報閲覧有効期限 |     | 追加  <br>(2025-01-28) |
| 6-52-22 | ContraindicationInfoConsFlg | 薬剤アレルギー等情報閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-23 | ContraindicationInfoConsTime | 薬剤アレルギー等情報閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-24 | ContraindicationInfoAvailableTime | 薬剤アレルギー等情報閲覧有効期限 |     | 追加  <br>(2025-01-28) |
| 6-52-25 | TestInfoConsFlg | 検査情報閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-26 | TestInfoConsTime | 検査情報閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-27 | TestInfoAvailableTime | 検査情報閲覧有効期限 |     | 追加  <br>(2025-01-28) |
| 6-52-28 | PrescriptionInfoConsFlg | 処方情報閲覧同意フラグ |     | 追加  <br>(2025-01-28) |
| 6-52-29 | PrescriptionInfoConsTime | 処方情報閲覧同意日時 |     | 追加  <br>(2025-01-28) |
| 6-52-30 | PrescriptionInfoAvailableTime | 処方情報閲覧有効期限 |     | 追加  <br>(2025-01-28) |

 ※１：高血圧症、糖尿病、脂質異常症、認知症のいずれかにTrueが存在する場合のみ表示します。

  

Rubyによる患者基本情報の取得サンプルソース
-----------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    
      
    

[sample\_patientget\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientget_v2.rb)
 (xml2)  

#!/usr/bin/ruby  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"ID \= ARGV\[0\]req \= Net::HTTP::Get.new("/api01rv2/patientgetv2?id=#{ID}")  
  
req.basic\_auth(USER, PASSWD)  
  
Net::HTTP.start(HOST, PORT) { |http|  res \= http.request(req)  puts res.body  
}  

  

C#による患者基本情報の取得サンプルソース
---------------------

Windowsでの実行環境

*   Microsoft Visual Studio 2008以降
*   .NET Framework 2.0 SDK(C#コンパイラを含む.NET Frameworkの開発ツール)  
    (Microsoft Visual Studioに含まれています)

Ubuntuでの実行環境

*   MonoDevelop 2.2(1.0でも実行可能)
*   mono-gmcs(C#コンパイラ)  
    (MonoDevelopと一緒にインストールされます)

[sample\_patientget\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientget_v2.cs)
 (xml2)  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace Patientget  
{        class MainClass        {                public static void Main (string\[\] args)                {                        string HOST \= "localhost";                        string PORT \= "8000";                        string USER \= "ormaster";                        string PASSWD \= "ormaster";                        string ID \= "0";                                                if (args.Length \> 0)                        {                                ID \= args\[0\];                        }                        // Version4.7                        string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/patientgetv2?id=" + ID;                                                HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);                        //req.ProtocolVersion = HttpVersion.Version11;                                                req.Method \= "GET";                        req.Credentials \= new NetworkCredential(USER, PASSWD);                                                HttpWebResponse res \= null;                        try                        {                                res \= (HttpWebResponse) req.GetResponse();                                                                Console.WriteLine(res.ResponseUri);                                Console.WriteLine("Response server => {0}", res.Server);                                Console.WriteLine(res.StatusDescription);                        }                        catch(WebException wex)                        {                                if (wex.Status \== WebExceptionStatus.ProtocolError)                                {                                        HttpWebResponse err \= (HttpWebResponse) wex.Response;                                                                                int errcode \= (int) err.StatusCode;                                                                                Console.WriteLine(err.ResponseUri);                                        Console.WriteLine("Response server => {0}", err.Server);                                        Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);                                                                                err.Close();                                }                                else                                {                                        Console.WriteLine(wex.Message);                                }                        }                                                        if (res != null)                        {                                Stream str \= res.GetResponseStream();                                StreamReader strread \= new StreamReader(str);                                                        string FILE\_NAME \= "foo.xml";                                File.WriteAllText(FILE\_NAME, strread.ReadToEnd());                                                                        strread.Close();                                str.Close();                                res.Close();                        }                }        }  
}  

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号の設定がありません |
| 10  | 患者番号に該当する患者が存在しません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 90  | 他端末使用中 |
| 91  | 処理区分未設定 |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザID未登録 |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API 患者基本情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patientget.html#wrapper)

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
