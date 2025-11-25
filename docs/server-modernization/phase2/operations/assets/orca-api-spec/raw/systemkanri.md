[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#content)

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
 > システム管理情報の取得

システム管理情報の取得
===========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#reqsample)
    
*   [レスポンスサンプル(診療科コード一覧)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample)
    
*   [レスポンスサンプル(ドクター・職員コード一覧)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample2)
    
*   [レスポンスサンプル(医療機関基本情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample3)
    
*   [レスポンスサンプル(入金方法情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample4)
    
*   [レスポンスサンプル(診療内容情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample5)
    
*   [レスポンスサンプル(患者状態コメント情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#ressample6)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#request)
    
*   [レスポンス一覧(診療科コード一覧)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response)
    
*   [レスポンス一覧(ドクター・職員コード一覧)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response2)
    
*   [レスポンス一覧(医療機関基本情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response3)
    
*   [レスポンス一覧(入金方法情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response4)
    
*   [レスポンス一覧(診療内容情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response5)
    
*   [レスポンス一覧(患者状態コメント情報)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#response6)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#errmsg)
      
    

更新履歴
----

2024-12-23　class=06「診療内容情報」、class=07「患者状態コメント情報」を追加。  

2022-12-26　class=05「入金方法情報」を追加。  

2018-11-27  「レスポンス一覧(医療機関基本情報)」に項目を追加。  

2014-07-03  「エラーメッセージ一覧」を追加。  

2014-05-27  レスポンスサンプル(医療機関基本情報)を追加。  
　　　　　　レスポンス一覧(医療機関基本情報)を追加。  
　　　　　　リクエストデータに「Request\_Number」を追加。

  

概要
--

POSTメソッドによるシステム管理情報の取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。

  

テスト方法
-----

1.  参考提供されている sample\_system\_info\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_system\_info\_v2.rb 内の基準日を接続先の日レセの環境に合わせます。
3.  ruby sample\_system\_info\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/system01lstv2?class=01
    class =
        01 : (システム管理に登録されている診療科コード)
        02 : (システム管理に登録されているドクターコード)
        03 : (システム管理に登録されているドクターコード以外の職員コード)
        04 : (医療機関基本情報)
        05 : (入金方法情報)
        06 : (診療内容情報)
        07 : (患者状態コメント情報)
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

リクエストデータ内に「Request\_Number」の項目を追加したことにより、引数(class)と「Request\_Number」のどちらかで機能の選択が行えます。  
機能の選択は「Request\_Number」で行なうことを推奨します。

<data>        <system01\_managereq type\="record"\>                <Request\_Number type\="string"\>04</Request\_Number>                <Base\_Date type\="string"\>2012-06-01</Base\_Date>        </system01\_managereq>  
</data>

### 処理概要

指定された日付で有効な診療科、ドクター、職員情報、医療機関基本情報、入金方法情報、診療内容情報、患者状態コメント情報を返却します。

### 処理詳細

1.  Request\_Number値により、以下のように処理します。  
    01 :診療科情報  
    02 :ドクター情報  
    03 :職員情報  
    04 :医療機関基本情報  
    05 :入金方法情報  
    06 :診療内容情報  
    07 :患者状態コメント情報  
    
2.  基準日の歴日チェック  
    
3.  返却maxは100とします。

レスポンスサンプル(診療科コード一覧)
-------------------

<xmlio2>  <departmentres type\="record"\>    <Information\_Date type\="string"\>2013-03-13</Information\_Date>    <Information\_Time type\="string"\>10:50:00</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Base\_Date type\="string"\>2012-06-01</Base\_Date>    <Department\_Information type\="array"\>      <Department\_Information\_child type\="record"\>        <Code type\="string"\>01</Code>        <WholeName type\="string"\>内科</WholeName>        <Name1 type\="string"\>内科</Name1>        <Name2 type\="string"\>内科</Name2>        <Name3 type\="string"\>内</Name3>        <Receipt\_Code type\="string"\>01</Receipt\_Code>      </Department\_Information\_child>      <Department\_Information\_child type\="record"\>        <Code type\="string"\>02</Code>        <WholeName type\="string"\>精神科</WholeName>        <Name1 type\="string"\>精神科</Name1>        <Name2 type\="string"\>精神</Name2>        <Name3 type\="string"\>精</Name3>        <Receipt\_Code type\="string"\>02</Receipt\_Code>      </Department\_Information\_child>    </Department\_Information>  </departmentres>  
</xmlio2>

  

レスポンスサンプル(ドクター・職員コード一覧)
-----------------------

<xmlio2>  <physicianres type\="record"\>    <Information\_Date type\="string"\>2013-03-13</Information\_Date>    <Information\_Time type\="string"\>10:50:00</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Base\_Date type\="string"\>2012-06-01</Base\_Date>    <Physician\_Information type\="array"\>      <Physician\_Information\_child type\="record"\>        <Code type\="string"\>10001</Code>        <WholeName type\="string"\>日本　一</WholeName>        <WholeName\_inKana type\="string"\>ニホン　ハジメ</WholeName\_inKana>        <Physician\_Permission\_Id type\="string"\>ISEKI001</Physician\_Permission\_Id>        <Drug\_Permission\_Id type\="string"\>001234</Drug\_Permission\_Id>        <Department\_Code1 type\="string"\>01</Department\_Code1>        <Department\_Code2 type\="string"\>02</Department\_Code2>      </Physician\_Information\_child>      <Physician\_Information\_child type\="record"\>        <Code type\="string"\>10002</Code>        <WholeName type\="string"\>日医　太郎</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      </Physician\_Information\_child>    </Physician\_Information>  </physicianres>  
</xmlio2>

  

レスポンスサンプル(医療機関基本情報)
-------------------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <system1001res type\="record"\>    <Information\_Date type\="string"\>2018-11-15</Information\_Date>    <Information\_Time type\="string"\>15:02:25</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Base\_Date type\="string"\>2018-11-13</Base\_Date>    <Medical\_Information type\="record"\>      <Prefectures\_Number type\="string"\>13</Prefectures\_Number>      <Point\_list type\="string"\>1</Point\_list>      <Institution\_Code type\="string"\>1234567</Institution\_Code>      <Institution\_Speciation type\="string"\>1</Institution\_Speciation>      <Institution\_Id type\="string"\>JPN000000000000</Institution\_Id>      <Institution\_WholeName type\="string"\>医療法人　オルカ</Institution\_WholeName>      <Short\_Institution\_WholeName type\="string"\>オルカ</Short\_Institution\_WholeName>      <Establisher\_WholeName type\="string"\>日本　一</Establisher\_WholeName>      <Administrator\_WholeName type\="string"\>日本　一</Administrator\_WholeName>      <Hospital\_bed\_Capacity type\="string"\>0020</Hospital\_bed\_Capacity>      <Hospital\_bed\_Capacity\_General type\="string"\>0020</Hospital\_bed\_Capacity\_General>      <Om\_Payment\_Class type\="string"\>1</Om\_Payment\_Class>      <Om\_Payment\_Class\_Name type\="string"\>定率</Om\_Payment\_Class\_Name>      <Old\_General\_Hospital\_Class type\="string"\>0</Old\_General\_Hospital\_Class>      <Old\_General\_Hospital\_Class\_Name type\="string"\>旧総合病院でない</Old\_General\_Hospital\_Class\_Name>      <Outside\_Class type\="string"\>1</Outside\_Class>      <Outside\_Class\_Name type\="string"\>院外</Outside\_Class\_Name>      <Institution\_Code\_Kanji type\="string"\>１２１２１２１</Institution\_Code\_Kanji>      <Delivery\_Organization\_Control\_Number type\="string"\>1234567890</Delivery\_Organization\_Control\_Number>      <Print\_Invoice\_Receipt\_Class type\="string"\>2</Print\_Invoice\_Receipt\_Class>      <Print\_Invoice\_Receipt\_Class\_Name type\="string"\>発行する（請求あり）</Print\_Invoice\_Receipt\_Class\_Name>      <Print\_Prescription\_Class type\="string"\>2</Print\_Prescription\_Class>      <Print\_Prescription\_Class\_Name type\="string"\>院内処方発行</Print\_Prescription\_Class\_Name>      <Last\_Prescription\_Display\_Class type\="string"\>1</Last\_Prescription\_Display\_Class>      <Last\_Prescription\_Display\_Class\_Name type\="string"\>表示しない</Last\_Prescription\_Display\_Class\_Name>      <Print\_Medicine\_Information\_Class type\="string"\>0</Print\_Medicine\_Information\_Class>      <Print\_Medicine\_Information\_Class\_Name type\="string"\>発行しない</Print\_Medicine\_Information\_Class\_Name>      <Print\_Statement\_Class type\="string"\>2</Print\_Statement\_Class>      <Print\_Statement\_Class\_Name type\="string"\>発行する（請求あり）</Print\_Statement\_Class\_Name>      <Print\_Medication\_Note\_Class type\="string"\>1</Print\_Medication\_Note\_Class>      <Print\_Medication\_Note\_Class\_Name type\="string"\>発行する（後期高齢）</Print\_Medication\_Note\_Class\_Name>      <Print\_Appointment\_Form\_Class type\="string"\>0</Print\_Appointment\_Form\_Class>      <Print\_Appointment\_Form\_Class\_Name type\="string"\>発行しない</Print\_Appointment\_Form\_Class\_Name>      <Data\_Collection\_Creation\_Class type\="string"\>1</Data\_Collection\_Creation\_Class>      <Data\_Collection\_Creation\_Class\_Name type\="string"\>作成する</Data\_Collection\_Creation\_Class\_Name>      <Data\_Collection\_Submission\_Method\_Class type\="string"\>1</Data\_Collection\_Submission\_Method\_Class>      <Data\_Collection\_Submission\_Method\_Class\_Name type\="string"\>自動で送信</Data\_Collection\_Submission\_Method\_Class\_Name>      <Orca\_Surveillance\_Class type\="string"\>2</Orca\_Surveillance\_Class>      <Orca\_Surveillance\_Class\_Name type\="string"\>作成する／日</Orca\_Surveillance\_Class\_Name>      <Reduction\_Calculation\_Object\_Class type\="string"\>3</Reduction\_Calculation\_Object\_Class>      <Reduction\_Calculation\_Object\_Class\_Name type\="string"\>自費分のみ</Reduction\_Calculation\_Object\_Class\_Name>      <Ac\_Money\_Rounding\_Reduction\_Class type\="string"\>2</Ac\_Money\_Rounding\_Reduction\_Class>      <Ac\_Money\_Rounding\_Reduction\_Class\_Name type\="string"\>１０円未満切り捨て</Ac\_Money\_Rounding\_Reduction\_Class\_Name>      <Ac\_Money\_Rounding\_No\_Reduction\_Information type\="record"\>        <Medical\_Insurance\_Class type\="string"\>1</Medical\_Insurance\_Class>        <Medical\_Insurance\_Class\_Name type\="string"\>１０円未満四捨五入</Medical\_Insurance\_Class\_Name>        <Medical\_Insurance\_Oe\_Class type\="string"\>0</Medical\_Insurance\_Oe\_Class>        <Medical\_Insurance\_Oe\_Class\_Name type\="string"\>保険分に準ずる</Medical\_Insurance\_Oe\_Class\_Name>        <Accident\_Insurance\_Class type\="string"\>4</Accident\_Insurance\_Class>        <Accident\_Insurance\_Class\_Name type\="string"\>１０円未満端数処理なし</Accident\_Insurance\_Class\_Name>        <Accident\_Insurance\_Oe\_Class type\="string"\>3</Accident\_Insurance\_Oe\_Class>        <Accident\_Insurance\_Oe\_Class\_Name type\="string"\>１０円未満切り上げ</Accident\_Insurance\_Oe\_Class\_Name>        <Liability\_Insurance\_Class type\="string"\>2</Liability\_Insurance\_Class>        <Liability\_Insurance\_Class\_Name type\="string"\>１０円未満切り捨て</Liability\_Insurance\_Class\_Name>        <Liability\_Insurance\_Oe\_Class type\="string"\>1</Liability\_Insurance\_Oe\_Class>        <Liability\_Insurance\_Oe\_Class\_Name type\="string"\>１０円未満四捨五入</Liability\_Insurance\_Oe\_Class\_Name>        <Pollution\_Oe\_Class type\="string"\>1</Pollution\_Oe\_Class>        <Pollution\_Oe\_Class\_Name type\="string"\>１０円未満四捨五入</Pollution\_Oe\_Class\_Name>        <Third\_Party\_Class type\="string"\>2</Third\_Party\_Class>        <Third\_Party\_Class\_Name type\="string"\>１０円未満切り捨て</Third\_Party\_Class\_Name>        <Third\_Party\_Oe\_Class type\="string"\>3</Third\_Party\_Oe\_Class>        <Third\_Party\_Oe\_Class\_Name type\="string"\>１０円未満切り上げ</Third\_Party\_Oe\_Class\_Name>      </Ac\_Money\_Rounding\_No\_Reduction\_Information>      <Third\_Party\_Money\_Calculation\_Class type\="string"\>2</Third\_Party\_Money\_Calculation\_Class>      <Third\_Party\_Money\_Calculation\_Class\_Name type\="string"\>負担金額１０円未満端数処理なし</Third\_Party\_Money\_Calculation\_Class\_Name>      <Tax\_Rounding\_Class type\="string"\>1</Tax\_Rounding\_Class>      <Tax\_Rounding\_Class\_Name type\="string"\>１円未満四捨五入</Tax\_Rounding\_Class\_Name>      <Self\_Insurance\_Total\_Class type\="string"\>2</Self\_Insurance\_Total\_Class>      <Self\_Insurance\_Total\_Class\_Name type\="string"\>自費分欄</Self\_Insurance\_Total\_Class\_Name>      <Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class type\="string"\>1</Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class>      <Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class\_Name type\="string"\>有効</Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class\_Name>      <Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class type\="string"\>1</Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class>      <Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class\_Name type\="string"\>日割計算しない</Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class\_Name>      <Oe\_Rounding\_Class type\="string"\>2</Oe\_Rounding\_Class>      <Oe\_Rounding\_Class\_Name type\="string"\>１円未満切り捨て</Oe\_Rounding\_Class\_Name>      <Address\_Information type\="record"\>        <WholeAddress type\="string"\>東京都文京区駒込２−２８−１０</WholeAddress>        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>        <PhoneNumber type\="string"\>03-3333-0001</PhoneNumber>        <FaxNumber type\="string"\>03-3333-0002</FaxNumber>        <E\_mail\_Address type\="string"\>test@orca.ne.jp</E\_mail\_Address>        <Homepage\_Address type\="string"\>http://www.orca.med.or.jp/</Homepage\_Address>      </Address\_Information>    </Medical\_Information>  </system1001res>  
</xmlio2>  

  

レスポンスサンプル(入金方法情報)
-----------------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <incomeres type\="record"\>    <Information\_Date type\="string"\>2022-12-13</Information\_Date>    <Information\_Time type\="string"\>19:03:01</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Base\_Date type\="string"\>2022-12-13</Base\_Date>    <income\_Information type\="array"\>      <income\_Information\_child type\="record"\>        <Ic\_Code type\="string"\>01</Ic\_Code>        <Ic\_Code\_Name type\="string"\>現金</Ic\_Code\_Name>        <Ic\_Code\_Abbreviation\_Name type\="string"\>現金</Ic\_Code\_Abbreviation\_Name>        <Ic\_Code\_Class type\="string"\>01</Ic\_Code\_Class>      </income\_Information\_child>      <income\_Information\_child type\="record"\>        <Ic\_Code type\="string"\>02</Ic\_Code>        <Ic\_Code\_Name type\="string"\>クレジットカード</Ic\_Code\_Name>        <Ic\_Code\_Abbreviation\_Name type\="string"\>クレジット</Ic\_Code\_Abbreviation\_Name>        <Ic\_Code\_Class type\="string"\>99</Ic\_Code\_Class>        <Ic\_Condition type\="string"\>1</Ic\_Condition>        <Ic\_Discharge\_Condition type\="string"\>2</Ic\_Discharge\_Condition>        <Ic\_Recurring\_Billing\_Condition type\="string"\>3</Ic\_Recurring\_Billing\_Condition>      </income\_Information\_child>      <income\_Information\_child type\="record"\>        <Ic\_Code type\="string"\>03</Ic\_Code>        <Ic\_Code\_Name type\="string"\>電子マネー</Ic\_Code\_Name>        <Ic\_Code\_Abbreviation\_Name type\="string"\>電子</Ic\_Code\_Abbreviation\_Name>        <Ic\_Code\_Class type\="string"\>01</Ic\_Code\_Class>        <Ic\_Condition type\="string"\>1</Ic\_Condition>        <Ic\_Discharge\_Condition type\="string"\>2</Ic\_Discharge\_Condition>        <Ic\_Recurring\_Billing\_Condition type\="string"\>3</Ic\_Recurring\_Billing\_Condition>      </income\_Information\_child>    </income\_Information>  </incomeres>  
</xmlio2>

  

レスポンスサンプル(診療内容情報)
-----------------

  <?xml version\="1.0" encoding\="UTF-8" ?>  <xmlio2>      <medicalinfres type\="record"\>          <Information\_Date type\="string"\>2025-01-08</Information\_Date>          <Information\_Time type\="string"\>16:48:23</Information\_Time>          <Api\_Result type\="string"\>00</Api\_Result>          <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>          <Reskey type\="string"\>Patient Info</Reskey>          <Base\_Date type\="string"\>2025-01-08</Base\_Date>          <Medicalinf\_Information type\="array"\>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>01</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>診察</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>診察１</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>02</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>薬のみ</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>診察２</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>03</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>注射のみ</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>診察３</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>04</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>検査のみ</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>検査</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>05</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>リハビリテーション</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>リハビリ</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>06</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>健康診断</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>健康診断</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>07</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>予防注射</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>予防注射</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>08</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>補聴器外来</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>補聴器外来</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>09</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>めまい外来　</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>めまい</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>              <Medicalinf\_Information\_child type\="record"\>                  <Medical\_Information type\="string"\>99</Medical\_Information>                  <Medical\_Information\_Name type\="string"\>該当なし</Medical\_Information\_Name>                  <Medical\_Information\_Name2 type\="string"\>（該当なし）</Medical\_Information\_Name2>              </Medicalinf\_Information\_child>          </Medicalinf\_Information>      </medicalinfres>  </xmlio2>  

  

レスポンスサンプル(患者状態コメント情報)
---------------------

  <?xml version\="1.0" encoding\="UTF-8" ?>  <xmlio2>      <ptconditionres type\="record"\>          <Information\_Date type\="string"\>2025-01-08</Information\_Date>          <Information\_Time type\="string"\>16:56:37</Information\_Time>          <Api\_Result type\="string"\>00</Api\_Result>          <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>          <Reskey type\="string"\>Patient Info</Reskey>          <Base\_Date type\="string"\>2025-01-08</Base\_Date>          <Condition1\_Information type\="array"\>              <Condition1\_Information\_child type\="record"\>                  <Condition1 type\="string"\>00</Condition1>                  <Condition1\_Name type\="string"\>該当なし</Condition1\_Name>              </Condition1\_Information\_child>          </Condition1\_Information>          <Condition2\_Information type\="array"\>              <Condition2\_Information\_child type\="record"\>                  <Condition2 type\="string"\>00</Condition2>                  <Condition2\_Name type\="string"\>該当なし</Condition2\_Name>              </Condition2\_Information\_child>          </Condition2\_Information>          <Condition3\_Information type\="array"\>              <Condition3\_Information\_child type\="record"\>                  <Condition3 type\="string"\>00</Condition3>                  <Condition3\_Name type\="string"\>該当なし</Condition3\_Name>              </Condition3\_Information\_child>          </Condition3\_Information>      </ptconditionres>  </xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 01:診療科情報  <br>02:ドクター情報  <br>03:職員情報  <br>04:医療機関基本情報  <br>05:入金方法情報  <br>06:診療内容情報  <br>07:患者状態コメント情報 |
| 2   | Base\_Date | 基準日 | 2012-06-01 | 省略時はシステム日付 |

  

レスポンス一覧(診療科コード一覧)
-----------------

| 番号  | 項目名 | 内容  | 例   |
| --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-03-13 |
| 2   | Information\_Time | 実施時間 | 10:50:00 |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |
| 5   | Reskey |     | Patient Info |
| 6   | Base\_Date | 基準日 | 2012-06-01 |
| 7   | Department\_Information | 診療科情報 (繰り返し 100) |     |
| 7-1 | Code | 診療科コード ※１  <br>(01:内科) | 01  |
| 7-2 | WholeName | 診療科名称 | 内科  |
| 7-3 | Name1 | 短縮名称1 | 内科  |
| 7-4 | Name2 | 短縮名称2 | 内科  |
| 7-5 | Name3 | 短縮名称3 | 内   |
| 7-6 | Receipt\_Code | レセ電診療科 | 01  |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

  

レスポンス一覧(ドクター・職員コード一覧)
---------------------

| 番号  | 項目名 | 内容  | 例   |
| --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-03-13 |
| 2   | Information\_Time | 実施時間 | 10:50:00 |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |
| 5   | Reskey |     | Patient Info |
| 6   | Base\_Date | 基準日 | 2012-06-01 |
| 7   | Physician\_Information | ドクター情報 (繰り返し 300) |     |
| 7-1 | Code | ドクターコード | 10001 |
| 7-2 | WholeName | 氏名  | 日本　一 |
| 7-3 | WholeName\_inKana | カナ氏名 | ニホン　ハジメ |
| 7-4 | Physician\_Permission\_Id | 医療登録番号 | ISEKI001 |
| 7-5 | Drug\_Permission\_Id | 麻薬施用者免許証番号 | 001234 |
| 7-6 | Department\_Code1 | 専門科コード1 | 01  |
| 7-7 | Department\_Code2 | 専門科コード2 | 02  |
| 7-8 | Department\_Code3 | 専門科コード3 |     |
| 7-9 | Department\_Code4 | 専門科コード4 |     |
| 7-10 | Department\_Code5 | 専門科コード5 |     |

  

レスポンス一覧(医療機関基本情報)  

--------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-05-20 |     |
| 2   | Information\_Time | 実施時間 | 11:08:59 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Base\_Date | 基準日 | 2012-06-01 |     |
| 7   | Medical\_Information | 医療機関基本情報 |     |     |
| 7-1 | Prefectures\_Number | 都道府県番号 | 13  |     |
| 7-2 | Point\_list | 点数表  <br>(1：医科) | 1   |     |
| 7-3 | Institution\_Code | 医療機関コード | 1234567 |     |
| 7-4 | Institution\_Speciation | 医療機関種別  <br>(1：病院、  <br>2：診療所) | 1   |     |
| 7-5 | Institution\_Id | 医療機関ID | JPN000000000000 |     |
| 7-6 | Institution\_WholeName | 医療機関名称 | 医療法人　オルカ |     |
| 7-7 | Short\_Institution\_WholeName | 短縮医療機関名称 | オルカ | 追加  <br>(2018-11-27) |
| 7-8 | Establisher\_WholeName | 開設者名称 | 日本　一 |     |
| 7-9 | Administrator\_WholeName | 管理者名称 | 日本　一 |     |
| 7-10 | Hospital\_bed\_Capacity | 病床数（許可） | 0020 | 追加  <br>(2018-11-27) |
| 7-11 | Hospital\_bed\_Capacity\_General | 病床数（一般） | 0020 | 追加  <br>(2018-11-27) |
| 7-12 | Om\_Payment\_Class | 老人支払区分 | 1   | 追加  <br>(2018-11-27) |
| 7-13 | Om\_Payment\_Class\_Name | 老人支払区分名称 | 定率  | 追加  <br>(2018-11-27) |
| 7-14 | Old\_General\_Hospital\_Class | 旧総合病院フラグ | 0   | 追加  <br>(2018-11-27) |
| 7-15 | Old\_General\_Hospital\_Class\_Name | 旧総合病院フラグ名称 | 旧総合病院でない | 追加  <br>(2018-11-27) |
| 7-16 | Outside\_Class | 院外処方区分 | 1   | 追加  <br>(2018-11-27) |
| 7-17 | Outside\_Class\_Name | 院外処方区分名称 | 院外  | 追加  <br>(2018-11-27) |
| 7-18 | Institution\_Code\_Kanji | 医療機関コード（漢字） | １２１２１２１ | 追加  <br>(2018-11-27) |
| 7-19 | Delivery\_Organization\_Control\_Number | 分娩機関管理番号 | 1234567890 | 追加  <br>(2018-11-27) |
| 7-20 | Print\_Invoice\_Receipt\_Class | 請求書発行フラグ | 2   | 追加  <br>(2018-11-27) |
| 7-21 | Print\_Invoice\_Receipt\_Class\_Name | 請求書発行フラグ名称 | 発行する（請求あり） | 追加  <br>(2018-11-27) |
| 7-22 | Print\_Prescription\_Class | 院外処方せん発行フラグ | 2   | 追加  <br>(2018-11-27) |
| 7-23 | Print\_Prescription\_Class\_Name | 院外処方せん発行フラグ名称 | 院内処方発行 | 追加  <br>(2018-11-27) |
| 7-24 | Last\_Prescription\_Display\_Class | 前回処方表示フラグ | 1   | 追加  <br>(2018-11-27) |
| 7-25 | Last\_Prescription\_Display\_Class\_Name | 前回処方表示フラグ名称 | 表示しない | 追加  <br>(2018-11-27) |
| 7-26 | Print\_Medicine\_Information\_Class | 薬剤情報発行フラグ | 0   | 追加  <br>(2018-11-27) |
| 7-27 | Print\_Medicine\_Information\_Class\_Name | 薬剤情報発行フラグ名称 | 発行しない | 追加  <br>(2018-11-27) |
| 7-28 | Print\_Statement\_Class | 診療費明細書発行フラグ | 2   | 追加  <br>(2018-11-27) |
| 7-29 | Print\_Statement\_Class\_Name | 診療費明細書発行フラグ名称 | 発行する（請求あり） | 追加  <br>(2018-11-27) |
| 7-30 | Print\_Medication\_Note\_Class | お薬手帳発行フラグ | 1   | 追加  <br>(2018-11-27) |
| 7-31 | Print\_Medication\_Note\_Class\_Name | お薬手帳発行フラグ名称 | 発行する（後期高齢） | 追加  <br>(2018-11-27) |
| 7-32 | Print\_Appointment\_Form\_Class | 予約票発行フラグ | 0   | 追加  <br>(2018-11-27) |
| 7-33 | Print\_Appointment\_Form\_Class\_Name | 予約票発行フラグ名称 | 発行しない | 追加  <br>(2018-11-27) |
| 7-34 | Data\_Collection\_Creation\_Class | データ収集作成フラグ | 1   | 追加  <br>(2018-11-27) |
| 7-35 | Data\_Collection\_Creation\_Class\_Name | データ収集作成フラグ名称 | 作成する | 追加  <br>(2018-11-27) |
| 7-36 | Data\_Collection\_Submission\_Method\_Class | データ収集提出方法区分 | 1   | 追加  <br>(2018-11-27) |
| 7-37 | Data\_Collection\_Submission\_Method\_Class\_Name | データ収集提出方法区分名称 | 自動で送信 | 追加  <br>(2018-11-27) |
| 7-38 | Orca\_Surveillance\_Class | ORCAサーベイランス区分 | 2   | 追加  <br>(2018-11-27) |
| 7-39 | Orca\_Surveillance\_Class\_Name | ORCAサーベイランス区分名称 | 作成する／日 | 追加  <br>(2018-11-27) |
| 7-40 | Reduction\_Calculation\_Object\_Class | 減免計算対象区分 | 3   | 追加  <br>(2018-11-27) |
| 7-41 | Reduction\_Calculation\_Object\_Class\_Name | 減免計算対象区分名称 | 自費分のみ | 追加  <br>(2018-11-27) |
| 7-42 | Ac\_Money\_Rounding\_Reduction\_Class | 請求額端数区分（減免有） | 2   | 追加  <br>(2018-11-27) |
| 7-43 | Ac\_Money\_Rounding\_Reduction\_Class\_Name | 請求額端数区分（減免有）名称 | １０円未満切り捨て | 追加  <br>(2018-11-27) |
| 7-44 | Ac\_Money\_Rounding\_No\_Reduction\_Information | 請求額端数区分（減免無）情報 |     | 追加  <br>(2018-11-27) |
| 7-44-1 | Medical\_Insurance\_Class | 請求額端数区分医保（減免無・保険分） | 1   | 追加  <br>(2018-11-27) |
| 7-44-2 | Medical\_Insurance\_Class\_Name | 請求額端数区分医保（減免無・保険分）名称 | １０円未満四捨五入 | 追加  <br>(2018-11-27) |
| 7-44-3 | Medical\_Insurance\_Oe\_Class | 請求額端数区分医保（減免無・自費分） | 0   | 追加  <br>(2018-11-27) |
| 7-44-4 | Medical\_Insurance\_Oe\_Class\_Name | 請求額端数区分医保（減免無・自費分）名称 | 保険分に準ずる | 追加  <br>(2018-11-27) |
| 7-44-5 | Accident\_Insurance\_Class | 請求額端数区分労災（減免無・保険分） | 4   | 追加  <br>(2018-11-27) |
| 7-44-6 | Accident\_Insurance\_Class\_Name | 請求額端数区分労災（減免無・保険分）名称 | １０円未満端数処理なし | 追加  <br>(2018-11-27) |
| 7-44-7 | Accident\_Insurance\_Oe\_Class | 請求額端数区分労災（減免無・自費分） | 3   | 追加  <br>(2018-11-27) |
| 7-44-8 | Accident\_Insurance\_Oe\_Class\_Name | 請求額端数区分労災（減免無・自費分）名称 | １０円未満切り上げ | 追加  <br>(2018-11-27) |
| 7-44-9 | Liability\_Insurance\_Class | 請求額端数区分自賠責（減免無・保険分） | 2   | 追加  <br>(2018-11-27) |
| 7-44-10 | Liability\_Insurance\_Class\_Name | 請求額端数区分自賠責（減免無・保険分）名称 | １０円未満切り捨て | 追加  <br>(2018-11-27) |
| 7-44-11 | Liability\_Insurance\_Oe\_Class | 請求額端数区分自賠責（減免無・自費分） | 1   | 追加  <br>(2018-11-27) |
| 7-44-12 | Liability\_Insurance\_Oe\_Class\_Name | 請求額端数区分自賠責（減免無・自費分）名称 | １０円未満四捨五入 | 追加  <br>(2018-11-27) |
| 7-44-13 | Pollution\_Oe\_Class | 請求額端数区分公害（減免無・自費分） | 1   | 追加  <br>(2018-11-27) |
| 7-44-14 | Pollution\_Oe\_Class\_Name | 請求額端数区分公害（減免無・自費分）名称 | １０円未満四捨五入 | 追加  <br>(2018-11-27) |
| 7-44-15 | Third\_Party\_Class | 請求額端数区分第三者行為（減免無・保険分） | 2   | 追加  <br>(2018-11-27) |
| 7-44-16 | Third\_Party\_Class\_Name | 請求額端数区分第三者行為（減免無・保険分）名称 | １０円未満切り捨て | 追加  <br>(2018-11-27) |
| 7-44-17 | Third\_Party\_Oe\_Class | 請求額端数区分第三者行為（減免無・自費分） | 3   | 追加  <br>(2018-11-27) |
| 7-44-18 | Third\_Party\_Oe\_Class\_Name | 請求額端数区分第三者行為（減免無・自費分）名称 | １０円未満切り上げ | 追加  <br>(2018-11-27) |
| 7-45 | Third\_Party\_Money\_Calculation\_Class | 第三者行為（医療費）負担金額計算区分 | 2   | 追加  <br>(2018-11-27) |
| 7-46 | Third\_Party\_Money\_Calculation\_Class\_Name | 第三者行為（医療費）負担金額計算区分名称 | 負担金額１０円未満端数処理なし | 追加  <br>(2018-11-27) |
| 7-47 | Tax\_Rounding\_Class | 消費税端数区分 | 1   | 追加  <br>(2018-11-27) |
| 7-48 | Tax\_Rounding\_Class\_Name | 消費税端数区分名称 | １円未満四捨五入 | 追加  <br>(2018-11-27) |
| 7-49 | Self\_Insurance\_Total\_Class | 自費保険集計先区分 | 2   | 追加  <br>(2018-11-27) |
| 7-50 | Self\_Insurance\_Total\_Class\_Name | 自費保険集計先区分名称 | 自費分欄 | 追加  <br>(2018-11-27) |
| 7-51 | Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class | 地方公費保険番号タブ区分 | 1   | 追加  <br>(2018-11-27) |
| 7-52 | Local\_Public\_Expenses\_Insurance\_Number\_Tab\_Class\_Name | 地方公費保険番号タブ区分名称 | 有効  | 追加  <br>(2018-11-27) |
| 7-53 | Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class | 更正・育成限度額日割計算区分 | 1   | 追加  <br>(2018-11-27) |
| 7-54 | Rehabilitation\_Nurture\_Credit\_Limit\_Calculate\_Daily\_Rate\_Class\_Name | 更正・育成限度額日割計算区分名称 | 日割計算しない | 追加  <br>(2018-11-27) |
| 7-55 | Oe\_Rounding\_Class | 自費コード数量計算端数区分 | 2   | 追加  <br>(2018-11-27) |
| 7-56 | Oe\_Rounding\_Class\_Name | 自費コード数量計算端数区分名称 | １円未満切り捨て | 追加  <br>(2018-11-27) |
| 7-57 | Address\_Information | 連絡先・広告情報 |     |     |
| 7-57-1 | WholeAddress | 所在地 | 東京都文京区本駒込２−２８−１０ |     |
| 7-57-2 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 7-57-3 | PhoneNumber | 電話番号 | 03-3333-0001 |     |
| 7-57-4 | FaxNumber | FAX番号 | 03-3333-0002 |     |
| 7-57-5 | E\_mail\_Address | eメールアドレス | test@orca.ne.jp |     |
| 7-57-6 | Homepage\_Address | ホームページアドレス | http://www.orca.med.or.jp/ |     |

  

レスポンス一覧(入金方法情報)  

------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2022-12-26 |     |
| 2   | Information\_Time | 実施時間 | 10:00:00 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Base\_Date | 基準日 | 2022-12-26 |     |
| 7   | income\_Information | 入金方法情報 (繰り返し 100) |     |     |
| 7-1 | Ic\_Code | 入金方法コード | 01  |     |
| 7-2 | Ic\_Code\_Name | 入金方法名称 | 現金  |     |
| 7-3 | Ic\_Code\_Abbreviation\_Name | 入金方法略称 | 現金  |     |
| 7-4 | Ic\_Code\_Class | 入金方法分類区分 | 01  |     |
| 7-5 | Ic\_Condition | 入金状態 | 1   |     |
| 7-6 | Ic\_Discharge\_Condition | 入金状態（退院時） | 2   |     |
| 7-7 | Ic\_Recurring\_Billing\_Condition | 入金状態（定期請求） | 3   |     |

  

レスポンス一覧(診療内容情報)
---------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2024-12-23 |     |
| 2   | Information\_Time | 実施時間 | 10:00:00 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Base\_Date | 基準日 | 2024-12-23 |     |
| 7   | Medicalinf\_Information | 診療内容情報 (繰り返し 100) |     | システム管理「1012 診療内容情報」 |
| 7-1 | Medical\_Information | 診療内容区分 |     |     |
| 7-2 | Medical\_Information\_Name | 診療内容 |     |     |
| 7-3 | Medical\_Information\_Name2 | 診療内容表示用 |     |     |

  

レスポンス一覧(患者状態コメント情報)
-------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2024-12-23 |     |
| 2   | Information\_Time | 実施時間 | 10:00:00 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Base\_Date | 基準日 | 2024-12-23 |     |
| 7   | Condition1\_Information | 患者状態コメント情報１ (繰り返し 100) |     | システム管理「1018 患者状態コメント情報」 |
| 7-1 | Condition1 | 患者状態コメント区分１ |     |     |
| 7-2 | Condition1\_Name | 状態内容１ |     |     |
| 7-3 | Condition1\_Word | 比喩単語１ |     |     |
| 7-4 | Condition1\_Icon | アイコンファイル名１ |     |     |
| 8   | Condition2\_Information | 患者状態コメント情報２ (繰り返し 100) |     | システム管理「1019 患者状態コメント情報」 |
| 8-1 | Condition2 | 患者状態コメント区分２ |     |     |
| 8-2 | Condition2\_Name | 状態内容２ |     |     |
| 8-3 | Condition2\_Word | 比喩単語２ |     |     |
| 8-4 | Condition2\_Icon | アイコンファイル名２ |     |     |
| 9   | Condition3\_Information | 患者状態コメント情報３ (繰り返し 100) |     | システム管理「1020 患者状態コメント情報」 |
| 9-1 | Condition3 | 患者状態コメント区分３ |     |     |
| 9-2 | Condition3\_Name | 状態内容３ |     |     |
| 9-3 | Condition3\_Word | 比喩単語３ |     |     |
| 9-4 | Condition3\_Icon | アイコンファイル名３ |     |     |

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

[sample\_system\_info\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_system_info_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ システム管理一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/system01lstv2")  
\# Request\_Number :01 診療科対象  
\#                :02 ドクター対象  
\#                :03 ドクター以外の職員対象  
\#                :04 医療機関基本情報  
\#                :05 入金方法情報  
\#                :06 診療内容情報  
\#                :07 患者状態コメント情報  
#  
\# 1.リクエスト番号  Request\_Number  (REQUIRED)  
\# 2.基準日          Base\_Date       (IMPLIED)  
#  
\# REQUIRED : 必須  IMPLIED : 任意  
#BODY \= <<EOF

<data>        <system01\_managereq type\="record"\>                <Request\_Number type\="string"\>04</Request\_Number>                <Base\_Date type\="string"\>2012-06-01</Base\_Date>        </system01\_managereq>  
</data>  

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= "application/xml"  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
  
}

C#によるリクエストサンプルソース
-----------------

Windowsでの実行環境

*   Microsoft Visual Studio 2008以降
*   .NET Framework 2.0 SDK(C#コンパイラを含む.NET Frameworkの開発ツール)  
    (Microsoft Visual Studioに含まれています)

Ubuntuでの実行環境

*   MonoDevelop 2.2(1.0でも実行可能)
*   mono-gmcs(C#コンパイラ)  
    (MonoDevelopと一緒にインストールされます)

[sample\_system\_info\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_system_info_v2.cs)
 (xml2)  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace MedicalInfo  
{  class MainClass  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/system01lstv2";      /\*  
         Request\_Number :01 診療科対象  
                        :02 ドクター対象  
                        :03 ドクター以外の職員対象  
                        :04 医療機関基本情報  
                        :05 入金方法情報  
                        :06 診療内容情報  
                        :07 患者状態コメント情報  
  
        1.リクエスト番号    Request\_Number  (REQUIRED)  
        2.基準日            Base\_Date       (IMPLIED)  
  
         REQUIRED : 必須   IMPLIED : 任意  
      \*/      string BODY \= @"

      <data>        <system01\_managereq type\=""record""\>          <Request\_Number type\=""string""\>04</Request\_Number>          <Base\_Date type\=""string""\>2012-06-01</Base\_Date>        </system01\_managereq>      </data>      ";

      byte\[\] BODY\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= BODY\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(BODY\_byte, 0, BODY\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch(WebException wex)      {        if(wex.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) wex.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(wex.Message);        }      }      if(res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        Console.WriteLine(strread.ReadToEnd());        strread.Close();        str.Close();        res.Close();      }    }  }  
}  
  

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 10  | 対象が１００件以上となります |
| 11  | 対象がありません |
| 12  | 対象が３００件以上となります。  <br>リクエスト＝02,03 |
| 13  | 対象が１０００件以上となります  <br>リクエスト＝02,03(WebORCA) |
| 14  | 対象が１００件以上となる患者状態コメント情報があります。  <br>リクエスト＝07 |
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
 > システム管理情報の取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/systemkanri.html#wrapper)

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
