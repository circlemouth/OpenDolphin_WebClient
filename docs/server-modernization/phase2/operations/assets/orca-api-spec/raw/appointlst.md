[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#content)

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
 > 日医標準レセプトソフト API 予約一覧

予約一覧
====

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#errmsg)
      
    

更新履歴
----

2023-12-25   「レスポンス一覧」に項目を追加。  

2017-11-27   「レスポンス一覧」に項目を追加。  

2014-07-03  「エラーメッセージ一覧」を追加。  

  

概要
--

POSTメソッドによる予約一覧取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_appointlst.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_appointlst.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_appointlst.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/appointlstv2?class=01  
     class = 01  予約一覧取得
  
Content-Type: application/xml

文字コードは UTF-8 とします。

  

<data>     <appointlstreq type\="record"\>         <Appointment\_Date type\="string"\>2011-03-15</Appointment\_Date>         <Medical\_Information type\="string"\>01</Medical\_Information>         <Physician\_Code type\="string"\>10001</Physician\_Code>     </appointlstreq> </data> 

### 処理概要

予約一覧リクエストにより指定日の予約一覧の情報を返却します。

### 処理詳細

1.  予約日妥当性チェック
2.  診療科の存在チェック(※)
3.  ドクターコードの存在チェック(※)

(※2,3の条件については、設定されていれば対象のもののみ返却します。)

レスポンスサンプル
---------

<xmlio2>  <appointlstres type\="record"\>    <Information\_Date type\="string"\>2011-03-13</Information\_Date>    <Information\_Time type\="string"\>10:59:22</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Appointment\_Date type\="string"\>2011-03-15</Appointment\_Date>    <Appointlst\_Information type\="array"\>      <Appointlst\_Information\_child type\="record"\>        <Appointment\_Time type\="string"\>15:30:00</Appointment\_Time>        <Medical\_Information type\="string"\>01</Medical\_Information>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_WholeName type\="string"\>内科</Department\_WholeName>        <Physician\_Code type\="string"\>10001</Physician\_Code>        <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>        <Patient\_Information type\="record"\>          <Patient\_ID type\="string"\>00012</Patient\_ID>          <WholeName type\="string"\>日医　太郎</WholeName>          <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>          <BirthDate type\="string"\>1975-01-01</BirthDate>          <Sex type\="string"\>1</Sex>          <Home\_Address\_Information type\="record"\>            <PhoneNumber1 type\="string"\>03-8888-9999</PhoneNumber1>          </Home\_Address\_Information>        </Patient\_Information>      </Appointlst\_Information\_child>    </Appointlst\_Information>  </appointlstres>  
</xmlio2>  

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Appointment\_Date | 予約日 | 2011-03-15 |     |
| 2   | Medical\_Information | 診療内容区分 ※１  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  | ※２  |
| 3   | Physician\_Code | ドクターコード | 10001 | ※２  |

※１：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

※２：設定があれば一致する予約を対象とし、未設定であれば全てを対象とします。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2011-03-13 |     |
| 2   | Information\_Time | 実施時間 | 10:50:00 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Appointment\_Date | 予約日 | 2011-03-15 |     |
| 7   | Appointlst\_Information | 予約情報 (繰り返し500) |     |     |
| 7-1 | Appointment\_Time | 予約時間 | 15:30:00 |     |
| 7-2 | Medical\_Information | 診療内容区分 ※３  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  |     |
| 7-3 | Department\_Code | 予約診療科コード ※４  <br>(01:内科) | 01  |     |
| 7-4 | Department\_WholeName | 予約診療科名称 | 内科  |     |
| 7-5 | Physician\_Code | 予約ドクタコード | 10001 |     |
| 7-6 | Physician\_WholeName | 予約ドクター名 | 日本　一 |     |
| 7-7 | Visit\_Information | 来院情報 (1:来院済) |     |     |
| 7-8 | Appointment\_Id | 予約ID | 02  | 追加  <br>(2017-11-27) |
| 7-9 | Patient\_Information | 患者情報 |     |     |
| 7-9-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-9-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 7-9-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 7-9-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 7-9-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 7-9-6 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 7-9-6-1 | PhoneNumber1 | 自宅電話番号 | 03-8888-9999 |     |
| 7-9-7 | HealthInsurance\_Information | 保険組合せ情報 |     | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1 | HealthInsurance\_Info |     |     | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-1 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-2 | InsuranceProvider\_Number | 保険者番号 | 138057 | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-3 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 01  | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-7 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-8 | HealthInsuredPerson\_Assistance\_Name | 補助区分名称 | ３割  | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-9 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-10 | Certificate\_StartDate | 適用開始日 | 2010-05-01 | 追加  <br>(2023-12-25)  <br>※５ |
| 7-9-7-1-11 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 | 追加  <br>(2023-12-25)  <br>※５ |

※３：システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

※４：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※５：オンライン資格確認用情報として自費、労災、自賠を除く該当患者の主保険情報を取得する。

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

[sample\_appointlst\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_appointlst_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 予約一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/appointlstv2?class=01")  
\# class :01 予約一覧  
#  
#BODY \= <<EOF

<data>        <appointlstreq type\="record"\>                <Appointment\_Date type\="string"\>2011-03-15</Appointment\_Date>                <Medical\_Information type\="string"\>01</Medical\_Information>                <Physician\_Code type\="string"\>10001</Physician\_Code>        </appointlstreq>  
</data>

EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= "application/xml"  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PASSWD) {|http|  res \= http.request(req)  puts res.body  
  
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

[sample\_appointlst\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_appointlst_v2.cs)
  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace Appointlst  
{  class AppointlstMain  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/appointlstv2?class=01";  /\*  
       class :01 予約一覧  
  
      1.予約日         Appointment\_Date    (IMPLIED)  
      2.診療内容区分   Medical\_Information (IMPLIED)  
      3.ドクターコード Physician\_Code      (IMPLIED)  
  
        REQUIRED : 必須   IMPLIED : 任意  
  \*/      string BODY \= @"

<data>        <appointlstreq type\=""record""\>                <Appointment\_Date type\=""string""\>2012-07-02</Appointment\_Date>                <Medical\_Information type\=""string""\>01</Medical\_Information>                <Physician\_Code type\=""string""\></Physician\_Code>        </appointlstreq>  
</data>      ";

      byte\[\] record\_in\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      //req.ProtocolVersion = HttpVersion.Version11;      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= record\_in\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(record\_in\_byte, 0, record\_in\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch (WebException exc)      {        if (exc.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) exc.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(exc.Message);        }      }      if (res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        string FOO \= strread.ReadToEnd();        string FILE\_NAME \= "foo.xml";        File.WriteAllText(FILE\_NAME, FOO);        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 11  | 予約日が暦日ではありません |
| 12  | ドクターが存在しません |
| 13  | 診療内容情報が存在しません |
| 20  | 予約対象件数が５００件以上あります |
| 21  | 対象の予約はありませんでした |
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
 > 日医標準レセプトソフト API 予約一覧

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/appointlst.html#wrapper)

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
