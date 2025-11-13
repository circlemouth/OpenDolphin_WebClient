[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#content)

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
 > 日医標準レセプトソフト API 予約

API 予約
======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#warnmsg)
      
    

更新履歴
----

2014-07-24   「エラーメッセージ一覧」を追加。  
　　　　　　「警告メッセージ一覧」を追加。  
　　　　　　「レスポンス一覧」に警告メッセージ格納用項目を追加。  
　　　　　　「リクエスト(POSTリクエスト)サンプル」の処理詳細を修正。  

  

概要
--

POSTメソッドによる予約登録/予約取消を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
   

テスト方法
-----

1.  参考提供されている sample\_appoint\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_appoint\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_appoint\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca14/appointmodv2?class=01  
    class = 01  予約受付  
    class = 02  予約取消
  
Content-Type : application/xml

application/xml の場合の文字コードは UTF-8 とします。

  
 

<data>        <appointreq type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <WholeName type\="string"\></WholeName>                <WholeName\_inKana type\="string"\></WholeName\_inKana>                <Appointment\_Date type\="string"\>2014-07-02</Appointment\_Date>                <Appointment\_Time type\="string"\>12:10:00</Appointment\_Time>                <Appointment\_Id type\="string"\></Appointment\_Id>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\></Medical\_Information>                <Appointment\_Information type\="string"\></Appointment\_Information>                <Appointment\_Note type\="string"\>予約めもです</Appointment\_Note>        </appointreq>  
</data>

### 処理概要

予約リクエストにより該当患者の予約又は取消を行います。

### 処理詳細

予約時

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  診療科の存在チェック
5.  ドクターコードの存在チェック
6.  診療内容の存在チェック
7.  予約内容の存在チェック
8.  予約日・予約時間・ドクター・診療内容で同一患者が予約済みかチェック
9.  予約登録時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却

取消時

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  送信された予約IDと患者番号または予約氏名とのチェック
5.  予約取消時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却

レスポンスサンプル
---------

<xmlio2>  <appointres type\="record"\>    <Information\_Date type\="string"\>2014-07-04</Information\_Date>    <Information\_Time type\="string"\>11:07:20</Information\_Time>    <Api\_Result type\="string"\>K3</Api\_Result>    <Api\_Result\_Message type\="string"\>予約登録終了</Api\_Result\_Message>    <Api\_Warning\_Message\_Information type\="array"\>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>診療内容情報を自動設定しました</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>予約日＜システム日付です。過去日の予約です</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>    </Api\_Warning\_Message\_Information>    <Reskey type\="string"\>Patient Info</Reskey>    <Appointment\_Date type\="string"\>2014-07-02</Appointment\_Date>    <Appointment\_Time type\="string"\>12:10:00</Appointment\_Time>    <Appointment\_Id type\="string"\>00001</Appointment\_Id>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_WholeName type\="string"\>内科</Department\_WholeName>    <Physician\_Code type\="string"\>10001</Physician\_Code>    <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>    <Medical\_Information type\="string"\>01</Medical\_Information>    <Appointment\_Information type\="string"\>00</Appointment\_Information>    <Appointment\_Note type\="string"\>予約めもです</Appointment\_Note>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>      <Home\_Address\_Information type\="record"\>        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>        <WholeAddress type\="string"\>東京都文京区本駒込６−１６−３</WholeAddress>      </Home\_Address\_Information>      <HealthInsurance\_Information type\="array"\>        <HealthInsurance\_Information\_child type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>              <Rate\_Admission type\="string"\>0.00</Rate\_Admission>              <Money\_Admission type\="string"\>     0</Money\_Admission>              <Rate\_Outpatient type\="string"\>0.00</Rate\_Outpatient>              <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>              <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>              <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information\_child>        <HealthInsurance\_Information\_child type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        </HealthInsurance\_Information\_child>      </HealthInsurance\_Information>    </Patient\_Information>  </appointres>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 00012 | ※１  |
| 2   | WholeName | 予約氏名(患者氏名) | 日医　太郎 | ※２  |
| 3   | WholeName\_inKana | カナ氏名 | ニチイ　タロウ | ※２  |
| 4   | Appointment\_Date | 予約日 | 2014-07-02 | 必須  |
| 5   | Appointment\_Time | 予約時間 | 12:10:00 | 必須  |
| 6   | Appointment\_Id | 予約ID |     | 予約取消のみ※３ |
| 7   | Department\_Code | 診療科コード ※４  <br>(01:内科) | 01  | 必須(予約登録のみ) |
| 8   | Physician\_Code | ドクターコード | 10001 | 必須  |
| 9   | Medical\_Information | 診療内容区分 ※５  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  |     |
| 10  | Appointment\_Information | 予約内容区分  <br>(01:患者による予約、 02:医師による予約) | 01  |     |
| 11  | Appointment\_Note | 予約メモ内容 | 予約めもです | ※６  |

※１：新規患者(患者登録なし)以外は必須とします。

※２：新規患者はどちらかを必須とし、予約氏名に設定がなければカナ氏名を予約氏名とします

※３：予約取消で予約ID未設定のときは、患者番号か予約氏名が必須となります。

※４：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※５：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

※６：半角文字は全角文字へ変換します。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-04 |     |
| 2   | Information\_Time | 実施時間 | 11:07:20 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | K3  | 警告メッセージが複数の場合は、最初の警告メッセージのエラーコードを返却 |
| 4   | Api\_Result\_Message | エラーメッセージ | 予約登録終了 |     |
| 5   | Api\_Warning\_Message\_Information | 警告メッセージ情報（繰り返し　５） |     | 追加  <br>(2014-07-24) |
| 5-1 | Api\_Warning\_Message | 警告メッセージ | 診療内容情報を自動設定しました | 追加  <br>(2014-07-24) |
| 6   | Reskey |     | Patient Info |     |
| 7   | Appointment\_Date | 予約日 | 2014-07-02 |     |
| 8   | Appointment\_Time | 予約時間 | 12:10:00 |     |
| 9   | Appointment\_Id | 予約ID | 00001 |     |
| 10  | Department\_Code | 予約診療科コード ※７  <br>(01:内科) | 01  |     |
| 11  | Department\_WholeName | 予約診療科名称 | 内科  |     |
| 12  | Physician\_Code | 予約ドクターコード | 10001 |     |
| 13  | Physician\_WholeName | 予約ドクター名 | 日本　一 |     |
| 14  | Medical\_Information | 診療内容区分 ※８  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  |     |
| 15  | Appointment\_Information | 予約内容区分  <br>(01:患者による予約、 02:医師による予約) | 00  |     |
| 16  | Appointment\_Note | 予約メモ内容 | 予約めもです |     |
| 17  | Patient\_Information | 患者基本情報 |     |     |
| 17-1 | Patient\_ID | 患者番号 | 00012 |     |
| 17-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 17-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 17-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 17-5 | Sex | 性別  <br>(1:男性、 2:女性) | 1   |     |
| 17-6 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 17-6-1 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 17-6-2 | WholeAddress | 住所  | 東京都文京区本駒込６−１６−３ |     |
| 17-7 | HealthInsurance\_Information | 保険組合せ情報 (繰り返し　4） |     |     |
| 17-7-1 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 |     |
| 17-7-2 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 17-7-3 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 17-7-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 17-7-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 17-7-6 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 17-7-7 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 17-7-8 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 17-7-9 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 17-7-10 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 17-7-11 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 17-7-12 | PublicInsurance\_Information | 公費情報（繰り返し 3） |     |     |
| 17-7-12-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 17-7-12-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 17-7-12-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 17-7-12-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 17-7-12-5 | Rate\_Admission | 入院ー負担率(割) | 0.00 |     |
| 17-7-12-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 17-7-12-7 | Rate\_Outpatient | 外来ー負担率(割) | 0.00 |     |
| 17-7-12-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 17-7-12-9 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 17-7-12-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |

※７：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※８：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    
      
    

[sample\_appoint\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_appoint_v2.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 予約登録  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca14/appointmodv2?class=01")  
\# class :01 (予約)  
\# class :02 (取消)  
#  
#BODY \= <<EOF

<data>        <appointreq type\="record"\>                <Patient\_ID type\="string"\>44444</Patient\_ID>                <Appointment\_Date type\="string"\>2012-07-19</Appointment\_Date>                <Appointment\_Time type\="string"\>12:10:00</Appointment\_Time>                <Appointment\_Id type\="string"\></Appointment\_Id>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\>01</Medical\_Information>                <Appointment\_Information type\="string"\></Appointment\_Information>                <Appointment\_Note type\="string"\>予約めもです </Appointment\_Note>        </appointreq>  
</data>

EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|res \= http.request(req)  
puts res.body  
  
} 

C#による予約登録リクエストサンプルソース
---------------------

Windowsでの実行環境

*   Microsoft Visual Studio 2008以降
*   .NET Framework 2.0 SDK(C#コンパイラを含む.NET Frameworkの開発ツール)  
    (Microsoft Visual Studioに含まれています)

Ubuntuでの実行環境

*   MonoDevelop 2.2(1.0でも実行可能)
*   mono-gmcs(C#コンパイラ)  
    (MonoDevelopと一緒にインストールされます)

[sample\_appoint\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_appoint_v2.cs)
   

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace Appoint  
{  class AppointMain  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/orca14/appointmodv2?class=01";  
/\*  
      class :01 予約  
            :02 取消  
  
      1.患者番号         Patient\_ID              (REQUIRED)  
      2.予約氏名         WholeName               (REQUIRED)  
      3.カナ氏名         WholeName\_inKane        (REQUIRED)  
      4.予約日           Appointment\_Date        (REQUIRED)  
      5.予約時間         Appointment\_Time        (REQUIRED)  
      6.予約ID           Appointment\_Id          (IMPLIED)  
      7.診療科           Department\_Code         (REQUIRED)  
      8.ドクターコード   Physician\_Code          (REQUIRED)  
      9.診療内容区分     Medical\_Information     (IMPLIED)  
      10.予約内容区分    Appointment\_Information (IMPLIED)  
      11.予約コメント    Appointment\_Note        (IMPLIED)  
  
      REQUIRED : 必須   IMPLIED : 任意  
\*/      string BODY \= @"

<data>        <appointreq type\=""record""\>                <Patient\_ID type\=""string""\>44444</Patient\_ID>                <Appointment\_Date type\=""string""\>2012-07-19</Appointment\_Date>                <Appointment\_Time type\=""string""\>12:10:00</Appointment\_Time>                <Appointment\_Id type\=""string""\></Appointment\_Id>                <Department\_Code type\=""string""\>01</Department\_Code>                <Physician\_Code type\=""string""\>10001</Physician\_Code>                <Medical\_Information type\=""string""\>01</Medical\_Information>                <Appointment\_Information type\=""string""\></Appointment\_Information>                <Appointment\_Note type\=""string""\>予約めもです </Appointment\_Note>        </appointreq>  
</data>      ";

      byte\[\] record\_in\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      //req.ProtocolVersion = HttpVersion.Version11;      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= record\_in\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(record\_in\_byte, 0, record\_in\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch (WebException exc)      {        if (exc.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) exc.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(exc.Message);        }      }      if (res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        string FOO \= strread.ReadToEnd();        string FILE\_NAME \= "foo.xml";        File.WriteAllText(FILE\_NAME, FOO);        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号・予約氏名・予約カナ氏名のいずれかを設定して下さい |
| 02  | 予約日が未設定です |
| 03  | 予約時間が未設定です |
| 04  | 診療科が未設定です |
| 05  | ドクターが未設定です |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 予約日が暦日ではありません |
| 12  | 予約時間設定誤り |
| 13  | 診療科が存在しません |
| 14  | ドクターが存在しません |
| 15  | 診療内容情報が存在しません |
| 16  | 予約内容が存在しません |
| 17  | 予約メモに登録できない文字があります |
| 18  | 予約氏名に登録できない文字があります |
| 19  | 予約カナ氏名に登録できない文字があります |
| 20  | 診療内容・ドクター・予約時間帯で予約登録済みです |
| 25  | 削除対象の予約レコードが存在しません |
| 26  | 予約ID設定誤り |
| 27  | 予約IDの予約情報と患者情報が一致しません |
| 50  | 予約IDが９９まで登録済みです。これ以上予約できません |
| 51  | 予約登録エラー |
| 52  | 予約メモ登録エラー |
| 53  | 予約更新エラー |
| 54  | 予約削除エラー |
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

警告メッセージ一覧
---------

| エラーコード | 警告メッセージ |
| --- | --- |
| K3  | 診療内容情報を自動設定しました |
| K4  | 予約枠の最大件数以上の登録です　予約件数がオーバーしています |
| K5  | 予約日＜システム日付です　過去日の予約です |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API 予約

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/appointmod.html#wrapper)

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
