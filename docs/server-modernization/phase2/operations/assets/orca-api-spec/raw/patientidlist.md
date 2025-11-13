[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#content)

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
 > 患者番号一覧の取得

患者番号一覧の取得
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#errmsg)
      
    

更新履歴
----

 2017-12-20  「レスポンス一覧」に項目を追加。

 2014-07-03  「エラーメッセージ一覧」を追加。

概要
--

基準日以降に登録・更新された患者情報を返却します。

リクエストおよびレスポンスデータはxml2形式になります。

  

テスト方法
-----

1.  参考提供されている sample\_patient\_id\_list\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_patient\_id\_list\_v2.rb 内の開始日等を接続先の日レセの環境に合わせます。
3.  ruby sample\_patient\_id\_list\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/patientlst1v2?class=01
    class=01 (新規・更新対象)
        ※患者番号テーブルの更新日・登録日が、開始日〜終了日の範囲内であれば対象とします。
    class=02 (新規対象)
        ※患者番号テーブルの登録日が、開始日〜終了日の範囲内であれば対象とします。
          期間内に新規登録した患者のみ対象となります。  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>        <patientlst1req type\="record"\>                <Base\_StartDate type\="string"\>2014-05-01</Base\_StartDate>                <Base\_EndDate type\="string"\>2014-07-01</Base\_EndDate>                <Contain\_TestPatient\_Flag type\="string"\>1</Contain\_TestPatient\_Flag>        </patientlst1req>  
</data>

### 処理概要

指定された日付等のリクエストにより、それ以降に追加更新された患者番号の一覧を返却します。

### 処理詳細

1.  基準開始、終了日の歴日チェック
2.  class値により新規患者のみ対象、または新規及び更新患者を対象とします。
3.  返却maxは1000人とし、それ以上存在する場合はその旨を返却します。
4.  テスト患者を「含む・含まない」の選択を可能とします。
5.  終了日に設定がない時は、開始日以降をすべて対象とし、開始日に設定がない時は、開始日=システム日付として処理します。
6.  対象が1000件を超える場合は、メッセージにその旨を返却します。
7.  レスポンスデータは以下の順番で返却します。  
    class=01は、更新日、更新時間、登録日、患者番号順  
    class=02は、登録日、患者番号順

※ここでの「更新」とは、「12 登録」で「登録」ボタンを押下ことを指します。何も修正することなく「登録」ボタンを押しても対象となります。

※データ移行したデータの場合、登録日・更新日が設定されていないことがあります。

レスポンスサンプル
---------

<xmlio2>  <patientlst1res type\="record"\>    <Information\_Date type\="string"\>2014-07-15</Information\_Date>    <Information\_Time type\="string"\>15:35:04</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Target\_Patient\_Count type\="string"\>0002</Target\_Patient\_Count>    <Patient\_Information type\="array"\>      <Patient\_Information\_child type\="record"\>        <Patient\_ID type\="string"\>00011</Patient\_ID>        <WholeName type\="string"\>日医　一郎</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　イチロウ</WholeName\_inKana>        <BirthDate type\="string"\>1975-01-01</BirthDate>        <Sex type\="string"\>1</Sex>        <CreateDate type\="string"\>2011-09-07</CreateDate>        <UpdateDate type\="string"\>2014-05-13</UpdateDate>        <TestPatient\_Flag type\="string"\>0</TestPatient\_Flag>      </Patient\_Information\_child>      <Patient\_Information\_child type\="record"\>        <Patient\_ID type\="string"\>00012</Patient\_ID>        <WholeName type\="string"\>日医　太郎</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>        <BirthDate type\="string"\>1975-01-01</BirthDate>        <Sex type\="string"\>1</Sex>        <CreateDate type\="string"\>2014-01-06</CreateDate>        <UpdateDate type\="string"\>2014-07-14</UpdateDate>        <TestPatient\_Flag type\="string"\>0</TestPatient\_Flag>      </Patient\_Information\_child>    </Patient\_Information>  </patientlst1res>  
</xmlio2>  

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Base\_StartDate | 開始日 | 2014-05-01 | 省略可(処理日付) |
| 2   | Base\_EndDate | 終了日 | 2014-07-01 | 省略可(99999999) |
| 3   | Contain\_TestPatient\_Flag | テスト患者区分 | 1   | １:テスト患者対象外 |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-15 |     |
| 2   | Information\_Time | 実施時間 | 15:35:04 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Target\_Patient\_Count | 対象件数 | 0002 |     |
| 7   | Patient\_Information | 患者情報 (繰り返し 1000) |     |     |
| 7-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 7-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 7-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 7-5 | Sex | 性別  <br>(1 :男性、2 :女性) | 1   |     |
| 7-6 | CreateDate | 登録日付 | 2014-01-06 |     |
| 7-7 | UpdateDate | 更新日付 | 2014-07-14 |     |
| 7-8 | UpdateTime | 更新時間 |     | 追加  <br>(2017-12-20) |
| 7-9 | TestPatient\_Flag | テスト患者区分(0 :テスト患者でない、1 :テスト患者である) | 0   |     |

  

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

[sample\_patient\_id\_list\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patient_id_list_v2.rb)
 (xml2)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 患者番号一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/patientlst1v2?class=01")  
\# class :01 新規・更新対象  
\# class :02 新規対象  
#  
#BODY \= <<EOF

<data>        <patientlst1req type\="record"\>                <Base\_StartDate type\="string"\>2012-06-01</Base\_StartDate>                <Base\_EndDate type\="string"\>2012-06-30</Base\_EndDate>                <Contain\_TestPatient\_Flag type\="string"\>1</Contain\_TestPatient\_Flag>        </patientlst1req>  
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

[sample\_patient\_id\_list\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patient_id_list_v2.cs)
  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace PatientIdList  
{  class MainClass  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/patientlst1v2?class=01";      /\*  
       class :01 新規・更新対象  
       class :02 新規対象  
  
       1.開始日           Base\_StartDate              (IMPLIED)  
       2.終了日           Base\_EndDate                (IMPLIED)  
       3.テスト患者区分   Contain\_TestPatient\_Flag    (IMPLIED)  
  
       REQUIRED : 必須   IMPLIED : 任意  
      \*/      string BODY \= @"

<data>        <patientlst1req type\=""record""\>                <Base\_StartDate type\=""string""\>2012-06-01</Base\_StartDate>                <Base\_EndDate type\=""string""\>2012-06-30</Base\_EndDate>                <Contain\_TestPatient\_Flag type\=""string""\>1</Contain\_TestPatient\_Flag>        </patientlst1req>  
</data>      ";

      byte\[\] BODY\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= BODY\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(BODY\_byte, 0, BODY\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch(WebException wex)      {        if(wex.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) wex.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(wex.Message);        }      }      if(res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        Console.WriteLine(strread.ReadToEnd());        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 開始日付＞終了日付です |
| 02  | テスト患者区分がありません |
| 10  | 該当患者が１０００件以上となります |
| 20  | 該当患者がありません |
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
 > 患者番号一覧の取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patientidlist.html#wrapper)

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
