[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/disease.html#content)

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
 > 患者病名情報の返却

患者病名情報の返却
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/disease.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/disease.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/disease.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/disease.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/disease.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/disease.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/disease.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/disease.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/disease.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/disease.html#errmsg)
    

更新履歴
----

2019-07-29   「レスポンス一覧」に項目を追加

2019-05-28   「レスポンス一覧」に項目を追加

2017-05-25   「レスポンス一覧」に項目を追加

2016-09-26   全ての患者病名情報の取得対応。  
　　　　　　　　「リクエスト(POSTリクエスト)サンプル」の処理詳細に説明を追加。  
　　　　　　　　「レスポンスサンプル」に項目を追加。  
　　　　　　　　「リクエスト一覧」「レスポンス一覧」に項目を追加。

2016-04-18   合併症に係わる情報追加対応。  
　　　　　　　　「レスポンス一覧」に項目を追加。  

概要
--

POSTメソッドによる患者病名情報の返却を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
   

テスト方法
-----

1.  参考提供されている sample\_disease\_info.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_disease\_info.rb 内の患者番号等を接続先の日レセの環境に合わせ、送信したい情報を設定します。
3.  ruby sample\_disease\_info.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/diseasegetv2?class=01 
    class = 01 (患者病名情報の取得)  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>     <disease\_inforeq type\="record"\>         <Patient\_ID type\="string"\>00012</Patient\_ID>                                    <Base\_Date type\="string"\>2012-05</Base\_Date>    </disease\_inforeq> </data> 

### 処理概要

指定された患者番号、基準月のリクエストにより、該当患者の病名情報を返却します。

### 処理詳細

1.  該当患者の返却病名設定のmaxは、200とします。
2.  送信された患者番号による患者の存在をチェックします。
3.  送信された基準月の妥当性をチェックします。
4.  返却順は、開始日の古いものからとします。  
    (Select\_Mode=Allの場合は開始日の降順、表示連番、診療科、登録順)  
    
5.  Select\_Mode=Allの場合は基準日の含む月から、遡って転帰済も含め全ての病名も対象とします。  
    (上限を越えた場合は、その前月までを返却します。All以外の値は全て、指定月で有効な病名を返却します。)  
    

レスポンスサンプル
---------

<xmlio2>  <disease\_infores type\="record"\>    <Information\_Date type\="string"\>2012-05-29</Information\_Date>    <Information\_Time type\="string"\>17:11:59</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Information\_Overflow type\="string"\>False</Information\_Overflow>    <Disease\_Infores type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　一郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　イチロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Disease\_Infores>    <Base\_Date type\="string"\>2012-05</Base\_Date>    <Disease\_Information type\="array"\>      <Disease\_Information\_child type\="record"\>        <Disease\_InOut type\="string"\>I</Disease\_InOut>        <Department\_Code type\="string"\>01</Department\_Code>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Disease\_Name type\="string"\>胃炎</Disease\_Name>        <Disease\_Single type\="array"\>          <Disease\_Single\_child type\="record"\>            <Disease\_Single\_Code type\="string"\>8830417</Disease\_Single\_Code>            <Disease\_Single\_Name type\="string"\>胃炎</Disease\_Single\_Name>          </Disease\_Single\_child>        </Disease\_Single>        <Disease\_Category type\="string"\>PD</Disease\_Category>        <Disease\_StartDate type\="string"\>2012-05-04</Disease\_StartDate>        <Disease\_EndDate type\="string"\>2012-09-04</Disease\_EndDate>        <Disease\_OutCome type\="string"\>F</Disease\_OutCome>        <Disease\_Class type\="string"\>05</Disease\_Class>        <Disease\_Receipt\_Print type\="string"\>1</Disease\_Receipt\_Print>        <Insurance\_Disease type\="string"\>False</Insurance\_Disease>      </Disease\_Information\_child>      <Disease\_Information\_child type\="record"\>        <Disease\_InOut type\="string"\>I</Disease\_InOut>        <Department\_Code type\="string"\>01</Department\_Code>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Disease\_Name type\="string"\>急性くも膜下出血の疑い</Disease\_Name>        <Disease\_Single type\="array"\>          <Disease\_Single\_child type\="record"\>            <Disease\_Single\_Code type\="string"\>ZZZ4012</Disease\_Single\_Code>            <Disease\_Single\_Name type\="string"\>急性</Disease\_Single\_Name>          </Disease\_Single\_child>          <Disease\_Single\_child type\="record"\>            <Disease\_Single\_Code type\="string"\>4309001</Disease\_Single\_Code>            <Disease\_Single\_Name type\="string"\>くも膜下出血</Disease\_Single\_Name>          </Disease\_Single\_child>          <Disease\_Single\_child type\="record"\>            <Disease\_Single\_Code type\="string"\>ZZZ8002</Disease\_Single\_Code>            <Disease\_Single\_Name type\="string"\>の疑い</Disease\_Single\_Name>          </Disease\_Single\_child>        </Disease\_Single>        <Disease\_SuspectedFlag type\="string"\>SA</Disease\_SuspectedFlag>        <Disease\_StartDate type\="string"\>2012-05-06</Disease\_StartDate>        <Disease\_EndDate type\="string"\>2012-09-04</Disease\_EndDate>        <Disease\_OutCome type\="string"\>F</Disease\_OutCome>        <Disease\_Class type\="string"\>05</Disease\_Class>        <Insurance\_Disease type\="string"\>False</Insurance\_Disease>        <Classification\_Number\_Servant type\="string"\>02</Classification\_Number\_Servant>        <Discharge\_Certificate type\="string"\>1</Discharge\_Certificate>      </Disease\_Information\_child>    </Disease\_Information>  </disease\_infores>  
</xmlio2>

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 00012 | 必須  |
| 2   | Base\_Date | 基準月 | 2012-05 | 未設定時はシステム日付を設定 |
| 3   | Select\_Mode | 転帰済選択区分 | All | 追加  <br>(2016-09-26) |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2012-05-29 |     |
| 2   | Information\_Time | 実施時間 | 17:11:59 |     |
| 3   | Api\_Result | 結果コード(ゼロ以外エラー) | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Information\_Overflow | 病名情報オーバーフラグ  <br>（True:返却対象の病名が200件を越えている） | False | 追加  <br>(2016-09-26) |
| 7   | Disease\_Infores | 患者病名情報 |     |     |
| 7-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 7-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 7-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 7-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 8   | Base\_Date | 基準月 | 2012-05 |     |
| 9   | Disease\_Information | 病名情報（繰り返し　２００） |     |     |
| 9-1 | Disease\_InOut | 入外区分  <br>(I:入院、O:入院外) | I   |     |
| 9-2 | Department\_Code | 診療科コード　※１  <br>(01:内科) | 01  |     |
| 9-3 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 9-4 | Third\_Party\_Mark | 第三者行為区分  <br>(True:対象の保険組合せが第三者行為である) | True | 追加(2019-07-29) |
| 9-5 | Disease\_Name | 病名  | 急性くも膜下出血の疑い |     |
| 9-6 | Disease\_Single | 単独病名情報（繰り返し　２１） |     |     |
| 9-6-1 | Disease\_Single\_Code | 病名コード | 4309001 |     |
| 9-6-2 | Disease\_Single\_Name | 単独病名 | くも膜下出血 |     |
| 9-6-3 | Disease\_Single\_Condition | 単独病名状態  <br>(空白:通常、1:削除、2:廃止(実施日時点での)) |     |     |
| 9-7 | Disease\_Category | 主病フラグ(PD:主病名) | PD  |     |
| 9-8 | Disease\_SuspectedFlag | 疑い、急性フラグ  <br>(S:疑い、A:急性、SA:急性かつ疑い) | SA  |     |
| 9-9 | Disease\_StartDate | 病名開始日 | 2012-05-06 |     |
| 9-10 | Disease\_EndDate | 転帰日 | 2012-09-04 |     |
| 9-11 | Disease\_OutCome | 転帰フラグ  <br>(F:治癒、D:死亡、C:中止、S:移行) | F   |     |
| 9-12 | Disease\_Supplement\_Name | 補足コメント |     |     |
| 9-13 | Disease\_Supplement\_Single | 単独補足コメント欄（繰り返し　３） |     | 追加  <br>(2017-05-25) |
| 9-13-1 | Disease\_Supplement\_Single\_Code | 単独補足コメントコード |     | 追加  <br>(2017-05-25) |
| 9-13-2 | Disease\_Supplement\_Single\_Name | 単独補足コメント名称 |     | 追加  <br>(2017-05-25) |
| 9-14 | Disease\_Karte\_Name | カルテ病名 |     |     |
| 9-15 | Disease\_Class | 疾患区分  <br>(03:皮膚科特定疾患指導管理料(１)、  <br>04:皮膚科特定疾患指導管理料(２)、  <br>05:特定疾患療養管理料、  <br>07:てんかん指導料、  <br>08:特定疾患療養管理料又はてんかん指導料、  <br>09:難病外来指導管理料) | 05  |     |
| 9-16 | Disease\_Receipt\_Print | レセプト表示有無(1:表示しない、空白:表示する) | 1   |     |
| 9-17 | Disease\_Receipt\_Print\_Period | レセプト表示期間 |     |     |
| 9-18 | Insurance\_Disease | 保険病名  <br>(True:保険病名である、False:以外) | False |     |
| 9-19 | Classification\_Number\_Mater | 分類番号（主） |     | 追加(2016-04-18)  <br>※２ |
| 9-20 | Classification\_Number\_Servant | 分類番号（従） |     | 追加(2016-04-18)  <br>※２ |
| 9-21 | Discharge\_Certificate | 退院証明書  <br>(返却値なしまたは0:記載しない、  <br>1:記載する) | 1   | 追加(2019-05-28) |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：分類番号（主）と（従）が同一数字（数字２桁）である場合は結合を示します。

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

[sample\_disease\_info\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_disease_info_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 患者病名取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/diseasegetv2?class=01")  
\# class :01 患者病名情報取得  
#  
#BODY \= <<EOF

<data>        <disease\_inforeq type\="record"\>                <Patient\_ID type\="string"\>44444</Patient\_ID>                <Base\_Date type\="string"\>2012-06-12</Base\_Date>        </disease\_inforeq>  
</data>

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
puts req.body  
  
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

[sample\_disease\_info\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_disease_info_v2.cs)
  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace DiseaseInfo  
{  class MainClass  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/api01rv2/diseasegetv2?class=01";      /\*  
        class :01   
  
        1.患者番号         Patient\_ID                  (REQUIRED)  
        2.基準月           Base\_Date                   (IMPLIED)  
  
        REQUIRED : 必須   IMPLIED : 任意  
      \*/      string BODY \= @"

<data>        <disease\_inforeq type\=""record""\>                <Patient\_ID type\=""string""\>44444</Patient\_ID>                <Base\_Date type\=""string""\>2012-06-12</Base\_Date>        </disease\_inforeq>  
</data>      ";

      byte\[\] BODY\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= BODY\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(BODY\_byte, 0, BODY\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch(WebException wex)      {        if(wex.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) wex.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);        }        else        {          Console.WriteLine(wex.Message);        }      }      if(res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        Console.WriteLine(strread.ReadToEnd());        strread.Close();        str.Close();        res.Close();      }    }  }  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号の設定がありません |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 基準日が暦日ではありません |
| 20  | 対象病名が２００件以上存在します |
| 21  | 対象病名がありません |
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
 > 患者病名情報の返却

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/disease.html#wrapper)

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
