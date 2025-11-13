[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#content)

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
 > API 患者登録

API 患者登録
========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#warnmsg)
      
    

更新履歴
----

2020-12-23   「リクエスト一覧」「レスポンス一覧」に項目を追加。  
　　　　　  　「エラーメッセージ一覧」にメッセージを追加。  
　　　　　  　PUSH通知対応。

2020-04-22   「リクエスト一覧」「レスポンス一覧」に項目を追加。

2019-06-25   「リクエスト一覧」「レスポンス一覧」に項目を追加。  
　　　　　  　「エラーメッセージ一覧」にメッセージを追加。  

2018-03-26   （Ver5.0.0以降のみ）「リクエスト一覧」に項目を追加。  
　　　　　　　（Ver5.0.0以降のみ）「レスポンス一覧」に項目を追加。

2015-01-27   患者登録での生年月日更新に対応。  
　　　　　　　　患者情報更新（class=02）の仕様変更。  
　　　　　　　　「リクエスト(POSTリクエスト)サンプル」の「更新処理(class=02)」の説明文を修正。  
　　　　　　　　「リクエスト一覧」に項目を追加。  
　　　　　　　　「Rubyによるリクエストサンプルソース」を修正。  
　　　　　　　　「エラーメッセージ一覧」にメッセージを追加。  

2014-08-01   「エラーメッセージ一覧」を追加。  
　　　　　  　「警告メッセージ一覧」を追加。  

2013-11-26    機能の追加（class=04、保険追加）

  

概要
--

POSTメソッドによる患者登録/更新/削除/保険追加を行います。

保険追加機能は日レセ Ver4.7.0\[第21回パッチ適用\]以降

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_patientadd\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_patientadd\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_patientadd\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca12/patientmodv2?class=01   
    class = 01  患者登録  
    class = 02  患者情報更新  
    class = 03  患者情報削除  
    class = 04  保険追加(xml2のみ)  
Content-Type : application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <patientmodreq type\="record"\>                <Mod\_Key type\="string"\>2</Mod\_Key>                <Patient\_ID type\="string"\>\*</Patient\_ID>                <WholeName type\="string"\>日医　太郎</WholeName>                <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>                <BirthDate type\="string"\>1970-01-01</BirthDate>                <Sex type\="string"\>1</Sex>                <HouseHolder\_WholeName type\="string"\>日医　太郎</HouseHolder\_WholeName>                <Relationship type\="string"\>本人</Relationship>                <Occupation type\="string"\>会社員</Occupation>                <CellularNumber type\="string"\>09011112222</CellularNumber>                <FaxNumber type\="string"\>03-0011-2233</FaxNumber>                <EmailAddress type\="string"\>test@tt.dot.jp</EmailAddress>                <Home\_Address\_Information type\="record"\>                        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>                        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>                        <WholeAddress2 type\="string"\>６−１６−３</WholeAddress2>                        <PhoneNumber1 type\="string"\>03-3333-2222</PhoneNumber1>                        <PhoneNumber2 type\="string"\>03-3333-1133</PhoneNumber2>                </Home\_Address\_Information>                <WorkPlace\_Information type\="record"\>                        <WholeName type\="string"\>てすと　株式会社</WholeName>                        <Address\_ZipCode type\="string"\>1130022</Address\_ZipCode>                        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>                        <WholeAddress2 type\="string"\>５−１２−１１</WholeAddress2>                        <PhoneNumber type\="string"\>03-3333-2211</PhoneNumber>                </WorkPlace\_Information>                <Contraindication1 type\="string"\>状態</Contraindication1>                <Allergy1 type\="string"\>アレルギ</Allergy1>                <Infection1 type\="string"\>感染症</Infection1>                <Comment1 type\="string"\>コメント</Comment1>                <HealthInsurance\_Information type\="record"\>                        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>                        <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>                        <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>                        <PublicInsurance\_Information type\="array"\>                                <PublicInsurance\_Information\_child type\="record"\>                                        <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>                                        <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>                                        <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>                                        <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                        <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>                                </PublicInsurance\_Information\_child>                        </PublicInsurance\_Information>                </HealthInsurance\_Information>                <Payment\_Information type\="record"\>                        <Reduction\_Reason type\="string"\>01</Reduction\_Reason>                        <Discount type\="string"\>01</Discount>                        <Ic\_Code type\="string"\>02</Ic\_Code>                </Payment\_Information>        </patientmodreq>  
</data>

### 処理概要

患者登録リクエストにより新規患者の登録、又は該当患者情報の更新、削除を行います。

日レセVer4.7.0(xml2)では該当患者に対して保険の追加が可能です。

### 処理詳細

新規登録(class=01)

*   設定されている患者番号で患者を新規登録します。
*   患者番号構成が標準構成の時のみ患者番号＝’＊’の設定で患者番号を自動採番します。  
    拡張構成では自動採番できません。自由構成に変更するか、システム管理の連番号を設定して空き番号を作成後、全桁設定をして下さい。
*   患者情報、患者保険情報、患者公費情報（最大４件）を設定内容から登録し、保険・公費から保険組合せを自動作成します。  
    （※１）  
    
*   氏名・性別・生年月日の一致する患者情報が既に登録済みであれば、’同一患者登録あり’のメッセージを返却します。

更新処理(class=02)

*   Mod\_Keyが１または設定無しの場合、患者番号・性別・生年月日が一致する患者を対象として更新します。  
    Mod\_Keyが２の場合、患者番号・漢字氏名・カナ氏名が一致する患者を対象として更新します。
*   氏名〜コメントを設定内容に置き換えて更新します。保険・公費は更新できません。  
    Mod\_Keyが１または設定無しの場合、性別・生年月日は更新できません。  
    Mod\_Keyが２の場合、漢字氏名・カナ氏名は更新できません。  
    
*   カナ氏名、漢字氏名に変更があれば、旧姓履歴を登録します。

削除処理(class=03)

*   患者番号・氏名・性別・生年月日が一致する患者を対象とします。  
    対象となった患者番号で受診履歴・病名・入退院登録が登録されていない場合のみ、削除を行います。
*   オンラインの患者削除と同様の処理を行い、全てのデータを削除します。（処理時間が掛かります。）

保険追加(class=04)

*   患者の保険・公費の追加を行います。  
    登録した保険・公費から保険組合せを自動作成します。  
    保険追加は、保険無し又は自費保険のみの患者に対して正規の保険・公費登録を目的とし、保険・公費の更新等は不可能です。  
    
*   患者基本情報と患者番号・漢字氏名・性別・生年月日が一致する患者を対象とします。
*   保険・公費の送信内容が無い場合はエラーとします。
*   保険・公費以外の項目に設定があっても更新対象としません。  
    返却情報は、患者マスタの登録内容の患者住所等の日レセの登録内容を返却します。  
    但し、保険・公費の項目チェックでエラーがある場合は、送信情報をそのまま返却します。
*   保険・公費の追加処理でエラーメッセージ・確認メッセージが発生する場合はエラーとします。  
    (期間重複、前期高齢者開始日付等)
*   保険者番号・本人家族・補助区分・継続区分・記号・番号・被保険者名が一致する保険が既に登録済みであればエラーとします。  
    (期間が重複しなくても同じ保険の登録はエラーとします。)
*   負担者番号・受給者番号・開始日付・終了日付の一致する公費が複数あればエラーとします。  
    (重複可の公費であっても同じ内容の公費はエラーとします。)
*   登録後の返却内容の保険組合せ情報は、登録済みの全ての保険組合せ情報を返却します。  
    但し、保険組合せが２０件以上存在する場合は、最大保険組合せ番号が２０件目になるように編集します(最新のものから２０件を返却)。
*   設定情報に警告となる情報が含まれる場合はワーニングメッセージ(警告メッセージ)をApi\_Warning\_Message1からApi\_Warning\_Message5にメッセージを編集し、保険を追加します。

※１：保険(公費も含む)に関しては、日レセの画面では警告画面を出力するもの(受給者番号違い等)は全て許可するものとして登録しています。

レスポンスサンプル
---------

<xmlio2>  <patientmodres type\="record"\>    <Information\_Date type\="string"\>2014-07-17</Information\_Date>    <Information\_Time type\="string"\>10:38:30</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>登録終了</Api\_Result\_Message>    <Reskey type\="string"\>Acceptance\_Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00036</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1970-01-01</BirthDate>      <Sex type\="string"\>1</Sex>      <HouseHolder\_WholeName type\="string"\>日医　太郎</HouseHolder\_WholeName>      <Relationship type\="string"\>本人</Relationship>      <Occupation type\="string"\>会社員</Occupation>      <CellularNumber type\="string"\>09011112222</CellularNumber>      <FaxNumber type\="string"\>03-0011-2233</FaxNumber>      <EmailAddress type\="string"\>test@tt.dot.jp</EmailAddress>      <Home\_Address\_Information type\="record"\>        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>        <WholeAddress2 type\="string"\>６−１６−３</WholeAddress2>        <PhoneNumber1 type\="string"\>03-3333-2222</PhoneNumber1>        <PhoneNumber2 type\="string"\>03-3333-1133</PhoneNumber2>      </Home\_Address\_Information>      <WorkPlace\_Information type\="record"\>        <WholeName type\="string"\>てすと　株式会社</WholeName>        <Address\_ZipCode type\="string"\>1130022</Address\_ZipCode>        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>        <WholeAddress2 type\="string"\>５−１２−１１</WholeAddress2>        <PhoneNumber type\="string"\>03-3333-2211</PhoneNumber>      </WorkPlace\_Information>      <Contraindication1 type\="string"\>状態</Contraindication1>      <Allergy1 type\="string"\>アレルギ</Allergy1>      <Infection1 type\="string"\>感染症</Infection1>      <Comment1 type\="string"\>コメント</Comment1>      <HealthInsurance\_Information type\="array"\>        <HealthInsurance\_Information\_child type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        </HealthInsurance\_Information\_child>        <HealthInsurance\_Information\_child type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>              <Rate\_Admission type\="string"\>0.05</Rate\_Admission>              <Money\_Admission type\="string"\>     0</Money\_Admission>              <Rate\_Outpatient type\="string"\>0.05</Rate\_Outpatient>              <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>              <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>              <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information\_child>      </HealthInsurance\_Information>      <Payment\_Information type\="record"\>        <Reduction\_Reason type\="string"\>01</Reduction\_Reason>        <Reduction\_Reason\_Name type\="string"\>低所得</Reduction\_Reason\_Name>        <Discount type\="string"\>01</Discount>        <Discount\_Name type\="string"\>10(%)</Discount\_Name>        <Ic\_Code type\="string"\>02</Ic\_Code>        <Ic\_Code\_Name type\="string"\>振込</Ic\_Code\_Name>      </Payment\_Information>    </Patient\_Information>  </patientmodres>  
</xmlio2>

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Mod\_Key | 変更キー | 2   | 追加  <br>(2015-01-27) |
| 2   | Patient\_ID | 患者番号 | ＊   | 必須  <br>（新規患者の自動採番は ＊） |
| 3   | WholeName | 患者氏名 | 日医　太郎 | 必須  <br>※１ |
| 4   | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ | 必須  <br>※２ |
| 5   | BirthDate | 生年月日 | 1970-01-01 | 必須  <br>（システム日付より未来日はエラー） |
| 6   | Sex | 性別  <br>(1: 男、2: 女) | 1   | 必須  |
| 7   | HouseHolder\_WholeName | 世帯主名 | 日医　太郎 | ※１、※３ |
| 8   | Relationship | 続柄  | 本人  | ※１、※３ |
| 9   | Occupation | 職業  | 会社員 | ※１、※３ |
| 10  | CellularNumber | 携帯番号 | 09011112222 | ※４  |
| 11  | FaxNumber | FAX番号 | 03-0011-2233 | ※４  |
| 12  | EmailAddress | 電子メールアドレス | test@tt.dot.jp | ※４  |
| 13  | Home\_Address\_Information | 自宅情報 |     |     |
| 13-1 | Address\_ZipCode | 郵便番号 | 1130021 | 空白の時、住所から郵便番号設定を行います。  <br>（システム管理設定があり、対象が１件の時）  <br>※４ |
| 13-2 | WholeAddress1 | 住所  | 東京都文京区本駒込 | 空白の時、郵便番号より住所編集を行います。  <br>（対象の住所が１件の時のみ編集）  <br>※２ |
| 13-3 | WholeAddress2 | 番地番号 | ６−１６−３ | ※２  |
| 13-4 | PhoneNumber1 | 自宅電話番号 | 03-3333-2222 | ※４  |
| 13-5 | PhoneNumber2 | 連絡先電話番号 | 03-3333-1133 | ※４  |
| 14  | WorkPlace\_Information | 勤務先情報 |     |     |
| 14-1 | WholeName | 勤務先名 | てすと　株式会社 | ※２  |
| 14-2 | Address\_ZipCode | 郵便番号 | 1130022 | ※４  |
| 14-3 | WholeAddress1 | 住所  | 東京都文京区本駒込 | 空白の時、郵便番号より住所編集を行います。  <br>（対象の住所が１件の時のみ編集）  <br>※２ |
| 14-4 | WholeAddress2 | 番地番号 | ５−１２−１１ | ※２  |
| 14-5 | PhoneNumber | 電話番号 | 03-3333-2211 | ※２  |
| 15  | Contraindication1 | 禁忌１ | 状態  | ※２  |
| 16  | Contraindication2 | 禁忌２ |     | ※２  |
| 17  | Allergy1 | アレルギー１ | アレルギ | ※２  |
| 18  | Allergy2 | アレルギー２ |     | ※２  |
| 19  | Infection1 | 感染症１ | 感染症 | ※２  |
| 20  | Infection2 | 感染症２ |     | ※２  |
| 21  | Comment1 | コメント１ | コメント | ※２  |
| 22  | Comment2 | コメント２ |     | ※２  |
| 23  | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 23-1 | InsuranceProvider\_Class | 保険の種類 | 060 | 保険者番号から編集します。  <br>設定内容と違った時は、警告メッセージを編集します。  <br>保険者番号が設定されていない時は、必須になります。  <br>労災・自賠責（971、973）は登録できません。 |
| 23-2 | InsuranceProvider\_Number | 保険者番号 | 138057 | 桁数チェックを行います。 |
| 23-3 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 23-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  | ※２  |
| 23-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ | ※２  |
| 23-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 01  | 数値以外は入力できません。  <br>後期高齢者は入力できません。  <br>  <br>追加  <br>(2020-04-22) |
| 23-7 | HealthInsuredPerson\_Continuation | 継続区分  <br>（１：継続、２：任継、３：特別） | 1   | 設定できない保険の場合は空白に変更します。 |
| 23-8 | HealthInsuredPerson\_Assistance | 補助区分 |     | 年齢・保険により自動設定します。  <br>前期高齢者・後期高齢者は高齢者負担割より設定します。  <br>（設定は可能ですが、登録できない区分は自動設定内容へ変更します。） |
| 23-9 | RelationToInsuredPerson | 本人家族区分  <br>（１：本人、２：家族） | 1   | 未設定は年齢・保険により自動設定します。家族のない保険はすべて本人に設定します。 |
| 23-10 | Rate\_Class | 高齢者負担割  <br>（１０：１割、３０：３割） | 30  | 高齢者の負担割を％で設定します。  <br>未設定または、１０、３０以外は１割負担とします。 |
| 23-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 | ※１  |
| 23-12 | Certificate\_StartDate | 有効年月日 | 2010-05-01 | 未設定はシステム日付を編集します。 |
| 23-13 | Certificate\_ExpiredDate | 終了年月日 | 9999-12-31 | 未設定は「99999999」を編集します。 |
| 23-14 | Certificate\_GetDate | 資格取得日 |     | 暦日チェックを行います。 |
| 23-15 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 23-15-1 | PublicInsurance\_Class | 公費の種類 | 010 | 空白の時は、負担者番号から編集します。  <br>負担者番号が設定されていない時は、必須になります。 |
| 23-15-2 | PublicInsurance\_Name | 公費の種類名称 | 感３７の２ |     |
| 23-15-3 | PublicInsurer\_Number | 負担者番号 | 10131142 | 桁数チェックを行います。 |
| 23-15-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | 桁数チェックを行います。 |
| 23-15-5 | Certificate\_IssuedDate | 有効年月日 | 2010-05-01 | 未設定はシステム日付を編集します。 |
| 23-15-6 | Certificate\_ExpiredDate | 終了年月日 | 9999-12-31 | 未設定は「99999999」を編集します。 |
| 24  | Personally\_Information | 患者個別情報 |     | Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 24-1 | Pregnant\_Class | 妊婦区分  <br>(True：妊婦である  <br>True以外：妊婦でない) |     | 空白の時も妊婦でないと登録します。  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 25  | Payment\_Information | 支払情報 |     | 追加  <br>(2019-06-25) |
| 25-1 | Reduction\_Reason | 減免事由 | 01  | 追加  <br>(2019-06-25) |
| 25-2 | Discount | 割引率 | 01  | 追加  <br>(2019-06-25) |
| 25-3 | Ic\_Code | 入金方法区分 | 02  | 追加  <br>(2019-06-25) |
| 26  | Condition\_Information | 状態情報 |     | 追加  <br>(2020-12-23) |
| 26-1 | Condition1 | 状態１ |     | 追加  <br>(2020-12-23) |
| 26-2 | Condition2 | 状態２ |     | 追加  <br>(2020-12-23) |
| 26-3 | Condition3 | 状態３ |     | 追加  <br>(2020-12-23) |

※１：半角空白は全角空白へ変換します。

※２：半角文字は全角文字へ変換します。

※３：半角はエラー

※４：全角はエラー

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-17 |     |
| 2   | Information\_Time | 実施時間 | 10:38:30 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 登録終了 |     |
| 5   | Api\_Warning\_Message1 | 警告メッセージ１ | 警告！同一患者の登録があります。 | xml2のみ |
| 6   | Api\_Warning\_Message2 | 警告メッセージ２ |     | xml2のみ |
| 7   | Api\_Warning\_Message3 | 警告メッセージ３ |     | xml2のみ |
| 8   | Api\_Warning\_Message4 | 警告メッセージ４ |     | xml2のみ |
| 9   | Api\_Warning\_Message5 | 警告メッセージ５ |     | xml2のみ |
| 10  | Reskey |     | Acceptance\_Info |     |
| 11  | Patient\_Information | 患者基本情報 |     |     |
| 11-1 | Patient\_ID | 患者番号 | 00036 |     |
| 11-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 11-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 11-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 11-5 | Sex | 性別  | 1   |     |
| 11-6 | HouseHolder\_WholeName | 世帯主名 | 日医　太郎 |     |
| 11-7 | Relationship | 続柄  | 本人  |     |
| 11-8 | Occupation | 職業  | 会社員 |     |
| 11-9 | CellularNumber | 携帯番号 | 09011112222 |     |
| 11-10 | FaxNumber | FAX番号 | 03-0011-2233 |     |
| 11-11 | EmailAddress | 電子メールアドレス | test@tt.dot.jp |     |
| 11-12 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 11-12-1 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 11-12-2 | WholeAddress1 | 住所  | 東京都文京区本駒込 |     |
| 11-12-3 | WholeAddress2 | 番地番号 | ６−１６−３ |     |
| 11-12-4 | PhoneNumber1 | 自宅電話番号 | 03-3333-2222 |     |
| 11-12-5 | PhoneNumber2 | 連絡先電話番号 | 03-3333-1133 |     |
| 11-13 | WorkPlace\_Information | 勤務先情報 |     |     |
| 11-13-1 | WholeName | 勤務先名 | てすと　株式会社 |     |
| 11-13-2 | Address\_ZipCode | 郵便番号 | 1130022 |     |
| 11-13-3 | WholeAddress1 | 住所  | 東京都文京区本駒込 |     |
| 11-13-4 | WholeAddress2 | 番地番号 | ５−１２−１１ |     |
| 11-13-5 | PhoneNumber | 電話番号 | 03-3333-2211 |     |
| 11-14 | Contraindication1 | 禁忌１ | 状態  |     |
| 11-15 | Contraindication2 | 禁忌２ |     |     |
| 11-16 | Allergy1 | アレルギー１ | アレルギ |     |
| 11-17 | Allergy2 | アレルギー２ |     |     |
| 11-18 | Infection1 | 感染症１ | 感染症 |     |
| 11-19 | Infection2 | 感染症２ |     |     |
| 11-20 | Comment1 | コメント１ | コメント |     |
| 11-21 | Comment2 | コメント２ |     |     |
| 11-22 | HealthInsurance\_Information | 保険組合せ情報（繰り返し　２０） |     |     |
| 11-22-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 | xml2のみ |
| 11-22-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 11-22-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 11-22-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 11-22-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 11-22-6 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 11-22-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 01  | 追加  <br>(2020-04-22) |
| 11-22-8 | HealthInsuredPerson\_Continuation | 継続区分 |     |     |
| 11-22-9 | HealthInsuredPerson\_Assistance | 補助区分 | 3   |     |
| 11-22-10 | RelationToInsuredPerson | 本人家族区分 | 1   |     |
| 11-22-11 | HealthInsuredPerson\_WholeName | 被保険者名 |     |     |
| 11-22-12 | Certificate\_StartDate | 有効年月日 | 2010-05-01 |     |
| 11-22-13 | Certificate\_ExpiredDate | 終了年月日 | 9999-12-31 |     |
| 11-22-14 | Certificate\_GetDate | 資格取得日 |     |     |
| 11-22-15 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 11-22-15-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 11-22-15-2 | PublicInsurance\_Name | 公費の種類名称 | 感３７の２ |     |
| 11-22-15-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 11-22-15-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 11-22-15-5 | Rate\_Admission | 入院ー負担率（割） | 0.05 |     |
| 11-22-15-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 11-22-15-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.05 |     |
| 11-22-15-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 11-22-15-9 | Certificate\_IssuedDate | 有効年月日 | 2010-05-01 |     |
| 11-22-15-10 | Certificate\_ExpiredDate | 終了年月日 | 9999-12-31 |     |
| 11-23 | Personally\_Information | 患者個別情報 |     | Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 11-23-1 | Pregnant\_Class | 妊婦区分 |     | ※１  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-03-26) |
| 11-24 | Payment\_Information | 支払情報 |     | 追加  <br>(2019-06-25) |
| 11-24-1 | Reduction\_Reason | 減免事由 | 01  | 追加  <br>(2019-06-25) |
| 11-24-2 | Reduction\_Reason\_Name | 減免事由 | 低所得 | 追加  <br>(2019-06-25) |
| 11-24-3 | Discount | 割引率 | 01  | 追加  <br>(2019-06-25) |
| 11-24-4 | Discount\_Name | 割引率 | 10(%) | 追加  <br>(2019-06-25) |
| 11-24-5 | Ic\_Code | 入金方法区分 | 02  | 追加  <br>(2019-06-25) |
| 11-24-6 | Ic\_Code\_Name | 入金方法名称 | 振込  | 追加  <br>(2019-06-25) |
| 11-25 | Condition\_Information | 状態情報 |     | 追加  <br>(2020-12-23) |
| 11-25-1 | Condition1 | 状態１ | 00  | 追加  <br>(2020-12-23) |
| 11-25-2 | Condition1\_name | 状態１名称 | 該当なし | 追加  <br>(2020-12-23) |
| 11-25-3 | Condition2 | 状態２ | 00  | 追加  <br>(2020-12-23) |
| 11-25-4 | Condition2\_name | 状態２名称 | 該当なし | 追加  <br>(2020-12-23) |
| 11-25-5 | Condition3 | 状態３ | 00  | 追加  <br>(2020-12-23) |
| 11-25-6 | Condition3\_name | 状態３名称 | 該当なし | 追加  <br>(2020-12-23) |

 ※１：リクエストの設定内容がTrue以外の場合は妊婦でないと登録し、リクエストの設定内容をそのまま返却します。  

  

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

\# -\*- coding: utf-8 -\*-    

[sample\_patientadd\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientadd_v2.rb)
 (xml2)  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST   \= "localhost"PORT   \= "8000"USER   \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca12/patientmodv2?class=01")  
\# class  :01  登録  
\# class  :02  更新  
\# class  :03  削除  
\# class  :04  保険追加  
#  
#BODY \= <<EOF

<data>        <patientmodreq type\="record"\>                <Mod\_Key type\="string"\>2</Mod\_Key>                <Patient\_ID type\="string"\>\*</Patient\_ID>                <WholeName type\="string"\>日医　太郎</WholeName>                <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>                <BirthDate type\="string"\>1970-01-01</BirthDate>                <Sex type\="string"\>1</Sex>                <HouseHolder\_WholeName type\="string"\>日医　太郎</HouseHolder\_WholeName>                <Relationship type\="string"\>本人</Relationship>                <Occupation type\="string"\>会社員</Occupation>                <CellularNumber type\="string"\>09011112222</CellularNumber>                <FaxNumber type\="string"\>03-0011-2233</FaxNumber>                <EmailAddress type\="string"\>test@tt.dot.jp</EmailAddress>                <Home\_Address\_Information type\="record"\>                        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>                        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>                        <WholeAddress2 type\="string"\>６−１６−３</WholeAddress2>                        <PhoneNumber1 type\="string"\>03-3333-2222</PhoneNumber1>                        <PhoneNumber2 type\="string"\>03-3333-1133</PhoneNumber2>                </Home\_Address\_Information>                <WorkPlace\_Information type\="record"\>                        <WholeName type\="string"\>てすと　株式会社</WholeName>                        <Address\_ZipCode type\="string"\>1130022</Address\_ZipCode>                        <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>                        <WholeAddress2 type\="string"\>５−１２−１１</WholeAddress2>                        <PhoneNumber type\="string"\>03-3333-2211</PhoneNumber>                </WorkPlace\_Information>                <Contraindication1 type\="string"\>状態</Contraindication1>                <Allergy1 type\="string"\>アレルギ</Allergy1>                <Infection1 type\="string"\>感染症</Infection1>                <Comment1 type\="string"\>コメント</Comment1>                <HealthInsurance\_Information type\="record"\>                        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>                        <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>                        <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>                        <PublicInsurance\_Information type\="array"\>                                <PublicInsurance\_Information\_child type\="record"\>                                        <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>                                        <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>                                        <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>                                        <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                        <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>                                </PublicInsurance\_Information\_child>                        </PublicInsurance\_Information>                </HealthInsurance\_Information>                <Payment\_Information type\="record"\>                        <Reduction\_Reason type\="string"\>01</Reduction\_Reason>                        <Discount type\="string"\>01</Discount>                        <Ic\_Code type\="string"\>02</Ic\_Code>                </Payment\_Information>        </patientmodreq>  
</data>

EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ | 備考  |
| --- | --- | --- |
| 01  | 患者番号未設定 |     |
| 02  | 患者氏名未設定 |     |
| 03  | 患者カナ氏名未設定 |     |
| 04  | 生年月日未設定 |     |
| 05  | 性別未設定 |     |
| 10  | 該当患者番号なし |     |
| 11  | 患者番号の自動採番はできません |     |
| 12  | 患者番号構成誤り |     |
| 13  | 患者番号登録済み |     |
| 14  | 漢字氏名は全角で入力して下さい |     |
| 15  | カナ氏名は全角で入力して下さい |     |
| 16  | 性別は１：男２：女で入力して下さい |     |
| 17  | 生年月日暦日エラー |     |
| 18  | 患者番号採番エラー |     |
| 20  | 郵便番号エラー |     |
| 21  | 勤務先郵便番号エラー |     |
| 22  | 自宅電話番号エラー |     |
| 23  | 連絡先電話番号エラー |     |
| 24  | 勤務先電話番号エラー |     |
| 25  | 携帯電話番号エラー |     |
| 26  | FAX番号エラー |     |
| 27  | 電子メールアドレスエラー |     |
| 28  | 職業エラー |     |
| 29  | 禁忌全角エラー |     |
| 30  | アレルギー全角エラー |     |
| 31  | 感染症全角エラー |     |
| 32  | 記号全角エラー |     |
| 33  | 番号全角エラー |     |
| 34  | 妊婦設定はできません。 |     |
| 35  | コメント文字エラー |     |
| 36  | 減免事由入力エラー | 追加(2019-06-25) |
| 37  | 割引率入力エラー | 追加(2019-06-25) |
| 38  | 入金方法入力エラー | 追加(2019-06-25) |
| 39  | 労災・自賠責保険は登録できません |     |
| 40  | 患者番号採番ができません |     |
| 41  | システム管理更新エラー |     |
| 42  | 患者番号登録エラー |     |
| 43  | 患者番号登録済みエラー |     |
| 44  | 患者情報登録エラー |     |
| 45  | 患者個別情報登録エラー |     |
| 50  | 患者登録内容が一致しません。更新できません |     |
| 51  | 患者情報更新エラー |     |
| 52  | 旧姓履歴登録エラー |     |
| 53  | 更新区分エラー |     |
| 54  | 患者個別情報更新エラー |     |
| 60  | 患者登録内容が一致しません。処理できません |     |
| 61  | 保険・公費の設定がありません |     |
| 62  | 同じ内容の保険が登録済みです。処理できません |     |
| 63  | 「公費種類番号」　「公費名称」　同じ内容の公費があります。処理できません |     |
| 64  | 保険が４０件以上となります。登録できません。 |     |
| 65  | 公費が６０件以上となります。登録できません。 |     |
| 70  | 状態１エラー | 追加(2020-12-23) |
| 71  | 状態２エラー | 追加(2020-12-23) |
| 72  | 状態３エラー | 追加(2020-12-23) |
| 81  | 患者登録内容が一致しません。削除できません |     |
| 82  | 患者情報以外のデータが登録済みです。削除できません |     |
| 83  | 削除処理エラー |     |
| 89  | 職員情報が取得できません |     |
| 医療機関情報が取得できません |     |
| システム日付が取得できません |     |
| 患者番号構成情報が取得できません |     |
| グループ医療機関が不整合です。処理を終了して下さい |     |
| システム項目が設定できません |     |
| 90  | 他端末使用中 |     |
| 91  | 処理区分未設定 |     |
| 97  | 送信内容に誤りがあります |     |
| 98  | 送信内容の読込ができませんでした |     |
| 99  | ユーザID未登録 |     |
| H1  | 060　国保　後期高齢者に到達しました。後期高齢者の保険を登録して下さい | 左のエラーメッセージは一例になります。  <br>  <br> このエラーは患者保険・公費に関するエラーが発生した場合に返却されます。  <br>（保険者番号がエラー、本人家族区分がエラー等） |
| P1  | 生年月日に未来日が入力されました | 左のエラーメッセージは一例になります。  <br>  <br> このエラーは患者基本情報に関するエラーが発生した場合に返却されます。  <br>（患者番号が不適切等） |
| P2  | 「SPA-PIDMSG」開始日が前期高齢者の適応開始日以前です | このエラーは患者保険・公費に関するエラーが発生した場合に返却されます。  <br>（保険番号マスタの期間と保険の期間が一致していない等） |
| 「SPA-PIDMSG」と保険の期間が重複します |
| 公費の期間が重複します |
| 保険番号マスタとの期間が違います |
| 保険が終了しています。終了日を設定して下さい |
| 保険番号マスタとの期間が違います |
| 継続は平成１５年３月末で終了しています |
| 任継の終了日が違います |
| 前期高齢者は２割ではありません |
| 保険組合せ更新で期間外の診療が発生します |
| 保険組合せ更新で期間外の病名が発生します |
| 保険組合せ更新で期間外の診療と病名が発生します |
| 保険・公費がエラーです |

警告メッセージ一覧  

------------

| エラーコード | 警告メッセージ | 備考  |
| --- | --- | --- |
| K0  | 警告！同一患者の登録があります |     |
| K1  | 警告！自動採番の患者番号が最大値です。初期番号から採番しました |     |
| K2  | 警告！郵便番号は存在しません | 左の警告メッセージは一例になります。  <br>  <br> この警告は保険・公費でオンライン入力時に警告が出た場合に返却されます。  <br>（開始日が不適切による年齢エラー、負担者番号・受給者番号の警告等） |
| K3  | 警告！保険の種類を変更しました |     |
| K4  | 保険組合せが２０件以上存在します |     |
| K5  | 警告！１６歳未満です。 |     |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > API 患者登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patientmod.html#wrapper)

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
