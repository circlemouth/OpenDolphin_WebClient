[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#content)

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
 > 日医標準レセプトソフト API 受付一覧

指定された日付の受付一覧返却
==============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#errmsg)
      
    

更新履歴
----

2023-02-27    「リクエスト一覧」に項目(Sel\_Offset)を追加。

2021-01-27    「レスポンス一覧」に項目を追加。

2019-06-25   「リクエスト一覧」「レスポンス一覧」に項目を追加

2018-11-27   「レスポンス一覧」に項目を追加

2017-04-26   「レスポンス一覧」に項目を追加

2016-10-20   「レスポンスサンプル」に項目を追加  
　　　　　　　「レスポンス一覧」に項目を追加  

2014-06-02   「エラーメッセージ一覧」を追加  

2013-08-27   「レスポンス一覧」に項目(Acceptance\_Id)を追加

  

概要
--

POSTメソッドによる受付一覧取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
  

テスト方法
-----

1.  参考提供されている sample\_acceptlst\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_acceptlst\_v2.rb 内の受付日等を接続先の日レセの環境に合わせます。
3.  ruby sample\_acceptlst\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/acceptlstv2?class=01  
    class = 01　は受付中（会計待ち対象）  
    class = 02　は会計済（会計済み対象）  
    class = 03  は全受付対象  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <acceptlstreq type\="record"\>                <Acceptance\_Date type\="string"\>2012-12-05</Acceptance\_Date>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\></Medical\_Information>  
                <Display\_Order\_Sort type\="string"\>True</Display\_Order\_Sort>        </acceptlstreq>  
</data>

### 処理概要

受付一覧リクエストにより指定日の受付一覧の情報を返却します。

### 処理詳細

1.  受付日妥当性チェック
2.  診療科コードの存在チェック(※)
3.  ドクターコードの存在チェック(※)
4.  診療内容区分の存在チェック(※)
    
    (※2,3,4の条件については、設定されていれば対象のもののみ返却します)
    

レスポンスサンプル
---------

<xmlio2>  <acceptlstres type\="record"\>    <Information\_Date type\="string"\>2011-03-13</Information\_Date>    <Information\_Time type\="string"\>10:50:00</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Acceptance\_Date type\="string"\>2011-03-15</Acceptance\_Date>    <Acceptlst\_Information type\="array"\>      <Acceptlst\_Information\_child type\="record"\>        <Acceptance\_Time type\="string"\>15:30:00</Acceptance\_Time>        <Acceptance\_Id type\="string"\>00001</Acceptance\_Id>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_WholeName type\="string"\>内科</Department\_WholeName>        <Physician\_Code type\="string"\>10001</Physician\_Code>        <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>        <Medical\_Information type\="string"\>01</Medical\_Information>        <Claim\_Infometion type\="string"\>0</Claim\_Infometion>        <Patient\_Information type\="record"\>          <Patient\_ID type\="string"\>00012</Patient\_ID>          <WholeName type\="string"\>日医　太郎</WholeName>          <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>          <BirthDate type\="string"\>1975-01-01</BirthDate>          <Sex type\="string"\>1</Sex>        </Patient\_Information>        <HealthInsurance\_Information type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>              <Rate\_Admission type\="string"\>0.05</Rate\_Admission>              <Money\_Admission type\="string"\>     0</Money\_Admission>              <Rate\_Outpatient type\="string"\>0.05</Rate\_Outpatient>              <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>              <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>              <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>        <Patient\_Memo\_Information type\="record"\>          <Patient\_Memo\_Department\_00 type\="string"\>3</Patient\_Memo\_Department\_00>          <Patient\_Memo\_Department type\="string"\>2</Patient\_Memo\_Department>        </Patient\_Memo\_Information>        <Display\_Order type\="record"\>          <Display\_Order\_Number type\="string"\>9999</Display\_Order\_Number>        </Display\_Order>      </Acceptlst\_Information\_child>    </Acceptlst\_Information>  </acceptlstres>  
</xmlio2>

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Acceptance\_Date | 受付日 | 2010-12-20 |     |
| 2   | Department\_Code | 診療科コード ※１  <br>(01:内科) | 01  | ※２  |
| 3   | Physician\_Code | ドクターコード | 10001 | ※２  |
| 4   | Medical\_Information | 診療内容区分 ※３  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  | ※２  |
| 5   | Display\_Order\_Sort | 受付画面順指示 | True | ※４  <br>  <br>追加  <br>(2019-06-25) |
| 6   | Sel\_Offset | 開始位置 | 1500 | ※５  <br>WebORCAのみ  <br>追加  <br>(2023-02-27) |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：設定があれば一致する受付を対象とし、未設定であれば全てを対象とします。

※３：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

※４：class=01 の時のみ有効、この値をTrue とした場合、受付画面(受付一覧)にて並びを変更した場合に、その並びで情報を返却します。

※５：class=03 の時のみ有効。  

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2011-03-13 |     |
| 2   | Information\_Time | 実施時間 | 10:50:00 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Acceptance\_Date | 受付日 | 2011-03-15 |     |
| 7   | Acceptlst\_Information | 受付一覧情報 (繰り返し 1000)  <br>※WebORCAは1500 |     |     |
| 7-1 | Acceptance\_Time | 受付時間 | 15:30:00 |     |
| 7-2 | Acceptance\_Id | 受付ID | 00001 |     |
| 7-3 | Department\_Code | 診療科コード ※４  <br>(01:内科) | 01  |     |
| 7-4 | Department\_WholeName | 診療科名称 | 内科  |     |
| 7-5 | Physician\_Code | ドクターコード | 10001 |     |
| 7-6 | Physician\_WholeName | ドクター名 | 日本　一 |     |
| 7-7 | Medical\_Information | 診療内容区分 ※５  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  |     |
| 7-8 | Claim\_Infometion | claim情報 | 0   |     |
| 7-9 | Account\_Time | 会計時間 ※６ | 15:50:00 |     |
| 7-10 | Appointment\_Time | 予約時間 | 11:00:00 | 追加  <br>(2017-04-26) |
| 7-11 | Appointment\_Id | 予約ID | 02  | 追加  <br>(2017-04-26) |
| 7-12 | Patient\_Information | 患者基本情報 |     |     |
| 7-12-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-12-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 7-12-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 7-12-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 7-12-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 7-13 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 7-13-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | 追加  <br>(2016-10-20) |
| 7-13-2 | Insurance\_Nondisplay | 保険組合せ非表示区分  <br>(O:外来非表示、I:入院非表示、N:非表示無し) | O   | 追加  <br>(2017-04-26) |
| 7-13-3 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 7-13-4 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 7-13-5 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 7-13-6 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 7-13-7 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 7-13-8 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 7-13-9 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 7-13-10 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 7-13-11 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 7-13-12 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 7-13-13 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 7-13-14 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-13-15 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 7-13-15-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 7-13-15-2 | PublicInsurance\_Name | 公費の制度名称 | 感37の2 |     |
| 7-13-15-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 7-13-15-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 7-13-15-5 | Rate\_Admission | 入院ー負担率（割） | 0.05 |     |
| 7-13-15-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 7-13-15-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.05 |     |
| 7-13-15-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 7-13-15-9 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 7-13-15-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-14 | Patient\_Memo\_Information | メモ登録情報 |     | 追加  <br>(2018-11-27) |
| 7-14-1 | Patient\_Memo\_Department\_00 | メモ登録区分(診療科=00)  <br>（1：メモ1のみの登録、  <br>2：メモ2のみの登録、  <br>3：メモ1，メモ2の登録） |     | 追加  <br>(2018-11-27) |
| 7-14-2 | Patient\_Memo\_Department | メモ登録区分  <br>（1：メモ1のみの登録、  <br>2：メモ2のみの登録、  <br>3：メモ1，メモ2の登録） |     | 追加  <br>(2018-11-27) |
| 7-15 | Display\_Order | 並び順情報 |     | 追加  <br>(2019-06-25) |
| 7-15-1 | Display\_Order\_Number | 画面上の並び順の値 |     | ※７、※８  <br>  <br>追加  <br>(2019-06-25) |
| 7-15-2 | Display\_Order\_Mark | 並びを変更した場合は、「True」を設定 |     | ※７、※８  <br>  <br>追加  <br>(2019-06-25) |

※４：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※５：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

※６：class = 02：会計済(会計済み対象)、class = 03：全受付対象を指定時に返却

※７：当日、並びをまったく変更していない場合、各受付一覧情報にDisplay\_Order\_Numberは9999を返却し、Display\_Order\_Markは値なしのため返却しません。

※８：Display\_Order\_Mark＝Trueとなるのは画面で並び順を変えた患者のみであり、例えば3番目の患者を1番目に移動した場合、その患者のみがDisplay\_Order\_Mark＝True となり、以下を返却します。

> <Display\_Order type="record">  
>   <Display\_Order\_Number type="string">1</Display\_Order\_Number>  
>   <Display\_Order\_Mark type="string">True</Display\_Order\_Mark>  
> </Display\_Order>   

並びを変更していない患者は、Display\_Order\_Number のみ返却します。上の例の時、2番目の患者は以下を返却します。

<Display\_Order type="record">  
  <Display\_Order\_Number type="string">2</Display\_Order\_Number>  
</Display\_Order>

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

[sample\_acceptlst\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_acceptlst_v2.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 受付一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/acceptlstv2?class=01")  
\# class :01 受付中（会計待ち対象）  
\# class :02 会計済（会計済み対象）  
\# class :03 全受付対象  
#  
#BODY \= <<EOF

<data>        <acceptlstreq type\="record"\>                <Acceptance\_Date type\="string"\>2012-12-05</Acceptance\_Date>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\></Medical\_Information>        </acceptlstreq>  
</data>

EOF  
   
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body } 

  

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

[sample\_acceptlst\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_acceptlst_v2.cs)

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace Acceptlst  
{  class AcceptlstMain  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/acceptlstv2?class=01";  /\*  
       class = 01　は受付中（会計待ち対象）  
       class = 02　は会計済（会計済み対象）  
       class = 03  は全受付対象  
  
      1.受付日         Acceptance\_Date     (IMPLIED)  
      2.診療科コード   Department\_Code     (IMPLIED)  
      3.ドクターコード Physician\_Code      (IMPLIED)  
      4.診療内容区分   Medical\_Information (IMPLIED)  
  
        REQUIRED : 必須   IMPLIED : 任意  
  \*/      DateTime dtime \= DateTime.Now;      string BODY \= @"

<data>        <acceptlstreq type\=""record""\>                <Acceptance\_Date type\=""string""\>" + dtime.ToString("yyyy-MM-dd") + @"</Acceptance\_Date>                <Department\_Code type\=""string""\>01</Department\_Code>                <Physician\_Code type\=""string""\>10001</Physician\_Code>                <Medical\_Information type\=""string""\></Medical\_Information>        </acceptlstreq>  
</data>      ";

      byte\[\] record\_in\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      //req.ProtocolVersion = HttpVersion.Version11;      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= record\_in\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(record\_in\_byte, 0, record\_in\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch (WebException exc)      {        if (exc.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) exc.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(exc.Message);        }      }      if (res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        string FOO \= strread.ReadToEnd();        string FILE\_NAME \= "foo.xml";        File.WriteAllText(FILE\_NAME, FOO);        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 11  | 受付日が暦日ではありません |
| 12  | 診療科が存在しません |
| 13  | ドクターが存在しません |
| 14  | 診療内容情報がありません |
| 20  | 受付対象件数が５００件以上あります |
| 21  | 対象の受付はありませんでした |
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
 > 日医標準レセプトソフト API 受付一覧

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/acceptancelst.html#wrapper)

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
