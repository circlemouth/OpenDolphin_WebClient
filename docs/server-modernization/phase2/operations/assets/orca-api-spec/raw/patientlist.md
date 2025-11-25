[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#content)

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
 > 複数の患者情報取得

複数の患者情報取得
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#errmsg)
      
    

更新履歴
----

2021-01-27  「レスポンス一覧」に項目を追加。

2014-07-03  「エラーメッセージ一覧」を追加。  

  

概要
--

複数患者の基本情報を返却します。

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_patient\_list\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_patient\_list\_v2.rb 内の患者番号を接続先の日レセの環境に合わせます。
3.  ruby sample\_patient\_list\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/patientlst2v2?class=01 
    class = 01
        ※指定した患者番号の情報を返却します。
        ※患者番号が検索できない時は、氏名に【患者番号がありません】とメッセージを編集して返却します。
          また、設定した患者番号の件数分返却します。  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>        <patientlst2req type\="record"\>                <Patient\_ID\_Information type\="array"\>                        <Patient\_ID\_Information\_child type\="record"\>                                <Patient\_ID type\="string"\>13</Patient\_ID>                        </Patient\_ID\_Information\_child>                        <Patient\_ID\_Information\_child type\="record"\>                                <Patient\_ID type\="string"\>12</Patient\_ID>                        </Patient\_ID\_Information\_child>                </Patient\_ID\_Information>        </patientlst2req>  
</data>

### 処理概要

指定された複数患者番号のリクエストにより、対応する患者の基本情報を返却します。

### 処理詳細

1.  患者番号は必須入力とします。
2.  患者番号の設定maxは、１００人とします。

レスポンスサンプル
---------

<xmlio2>  <patientlst2res type\="record"\>    <Information\_Date type\="string"\>2014-07-15</Information\_Date>    <Information\_Time type\="string"\>16:01:18</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Target\_Patient\_Count type\="string"\>002</Target\_Patient\_Count>    <No\_Target\_Patient\_Count type\="string"\>000</No\_Target\_Patient\_Count>    <Patient\_Information type\="array"\>      <Patient\_Information\_child type\="record"\>        <Patient\_ID type\="string"\>00013</Patient\_ID>        <WholeName type\="string"\>日医　次郎</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　ジロウ</WholeName\_inKana>        <BirthDate type\="string"\>1978-02-02</BirthDate>        <Sex type\="string"\>1</Sex>        <Home\_Address\_Information type\="record"\>          <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>          <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>          <WholeAddress2 type\="string"\>６−１６−３</WholeAddress2>        </Home\_Address\_Information>        <HealthInsurance\_Information type\="array"\>          <HealthInsurance\_Information\_child type\="record"\>            <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>            <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>            <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>            <HealthInsuredPerson\_Symbol type\="string"\>０１０</HealthInsuredPerson\_Symbol>            <HealthInsuredPerson\_Number type\="string"\>８９０１２</HealthInsuredPerson\_Number>            <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>            <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>            <HealthInsuredPerson\_WholeName type\="string"\>日医　次郎</HealthInsuredPerson\_WholeName>            <Certificate\_StartDate type\="string"\>2010-08-10</Certificate\_StartDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </HealthInsurance\_Information\_child>        </HealthInsurance\_Information>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            <Certificate\_IssuedDate type\="string"\>2010-08-10</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </Patient\_Information\_child>      <Patient\_Information\_child type\="record"\>        <Patient\_ID type\="string"\>00012</Patient\_ID>        <WholeName type\="string"\>日医　太郎</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>        <BirthDate type\="string"\>1975-01-01</BirthDate>        <Sex type\="string"\>1</Sex>        <Home\_Address\_Information type\="record"\>          <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>          <WholeAddress1 type\="string"\>東京都文京区本駒込</WholeAddress1>          <WholeAddress2 type\="string"\>６−１６−３</WholeAddress2>          <PhoneNumber1 type\="string"\>03-3333-2222</PhoneNumber1>          <PhoneNumber2 type\="string"\>03-3333-1133</PhoneNumber2>        </Home\_Address\_Information>        <Outpatient\_Class type\="string"\>1</Outpatient\_Class>        <HealthInsurance\_Information type\="array"\>          <HealthInsurance\_Information\_child type\="record"\>            <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>            <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>            <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>            <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>            <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>            <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>            <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>            <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>            <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </HealthInsurance\_Information\_child>        </HealthInsurance\_Information>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </Patient\_Information\_child>    </Patient\_Information>  </patientlst2res>  
</xmlio2>  

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID\_Information | 患者番号情報 (繰り返し 100) |     | 必須  |
| 1-1 | Patient\_ID | 患者番号 | 12  | 必須  |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-15 |     |
| 2   | Information\_Time | 実施時間 | 16:01:18 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Target\_Patient\_Count | 対象件数 | 002 |     |
| 7   | No\_Target\_Patient\_Count | エラー件数 | 000 |     |
| 8   | Patient\_Information | 患者情報 (繰り返し 100) |     |     |
| 8-1 | Patient\_ID | 患者番号 | 00012 |     |
| 8-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 8-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 8-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 8-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 8-6 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 8-6-1 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 8-6-2 | WholeAddress1 | 住所  | 東京都文京区本駒込 |     |
| 8-6-3 | WholeAddress2 | 番地番号 | ６−１６−３ |     |
| 8-6-4 | PhoneNumber1 | 自宅電話番号 | 03-3333-2222 |     |
| 8-6-5 | PhoneNumber2 | 連絡先電話番号 | 03-3333-1133 |     |
| 8-7 | Outpatient\_Class | 入外区分  <br>(1:入院、2:入院外) | 1   |     |
| 8-8 | HealthInsurance\_Information | 保険情報 (繰り返し 3) |     |     |
| 8-8-1 | InsuranceProvider\_Class | 保険の種類(060 :国保) | 060 |     |
| 8-8-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 8-8-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 8-8-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 8-8-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 8-8-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 8-8-7 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 8-8-8 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 8-8-9 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 8-8-10 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 8-8-11 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 8-8-12 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 8-9 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 8-9-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 8-9-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 8-9-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 8-9-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 8-9-5 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 8-9-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |

※保険情報・公費情報はそれぞれの情報になります。(保険組合せ内容ではありません)

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

[sample\_patient\_list\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patient_list_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 患者情報一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/patientlst2v2?class=01")  
\# class :01 指定患者情報取得  
#  
#BODY \= <<EOF

<data>        <patientlst2req type\="record"\>                <Patient\_ID\_Information type\="array"\>                        <Patient\_ID\_Information\_child type\="record"\>                                <Patient\_ID type\="string"\>2</Patient\_ID>                        </Patient\_ID\_Information\_child>                        <Patient\_ID\_Information\_child type\="record"\>                                <Patient\_ID type\="string"\>3</Patient\_ID>                        </Patient\_ID\_Information\_child>                        <Patient\_ID\_Information\_child type\="record"\>                                <Patient\_ID type\="string"\>4</Patient\_ID>                        </Patient\_ID\_Information\_child>                </Patient\_ID\_Information>        </patientlst2req>  
</data>

EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
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

[sample\_patient\_list\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patient_list_v2.cs)
  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace PatientList  
{  class MainClass  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/patientlst2v2?class=01";      /\*  
         class :01 指定した患者番号と一致する患者情報を返却  
  
        1.患者番号情報     Patient\_ID\_Information      (REQUIRED)  
        2.患者番号         Patient\_ID                  (REQUIRED)  
  
          REQUIRED : 必須   IMPLIED : 任意  
      \*/      string BODY \= @"

<data>        <patientlst2req type\=""record""\>                <Patient\_ID\_Information type\=""array""\>                        <Patient\_ID\_Information\_child type\=""record""\>                                <Patient\_ID type\=""string""\>2</Patient\_ID>                        </Patient\_ID\_Information\_child>                        <Patient\_ID\_Information\_child type\=""record""\>                                <Patient\_ID type\=""string""\>3</Patient\_ID>                        </Patient\_ID\_Information\_child>                        <Patient\_ID\_Information\_child type\=""record""\>                                <Patient\_ID type\=""string""\>4</Patient\_ID>                        </Patient\_ID\_Information\_child>                </Patient\_ID\_Information>        </patientlst2req>  
</data>      ";

      byte\[\] BODY\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= BODY\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(BODY\_byte, 0, BODY\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch(WebException wex)      {        if(wex.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) wex.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(wex.Message);        }      }      if(res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        Console.WriteLine(strread.ReadToEnd());        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
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
 > 複数の患者情報取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patientlist.html#wrapper)

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
