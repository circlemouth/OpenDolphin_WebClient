[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#content)

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
 > 日医標準レセプトソフト API 点数マスタ

点数マスタ情報登録
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#rubysample)
    
*   [C#によるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#csharpsample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#errmsg)
      
    

更新履歴
----

2020-09-24 　「リクエスト一覧」、「レスポンス一覧」に項目を追加。  
　　　　　　　「エラーメッセージ一覧」にエラーコードを追加。  

2014-07-03 　「エラーメッセージ一覧」を追加。  

  

概要
--

POSTメソッドによる点数マスタの登録を行います。

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_medicatm\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_medicatm\_v2.rb 内の診療行為コード等を接続先の日レセの環境に合わせます。
3.  ruby sample\_medicatm\_v2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca102/medicatonmodv2?class=01   
    class = 01 登録処理  
    class = 02 削除処理  
    class = 03 終了日設定処理  
    class = 04 期間変更処理
  
Content-Type: application/xml 

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <medicationreq type\="record"\>                <Medication\_Code type\="string"\>001700001</Medication\_Code>                <Medication\_Name type\="string"\>朝夕　錠から</Medication\_Name>                <Medication\_Name\_inKana type\="string"\></Medication\_Name\_inKana>                <StartDate type\="string"\>2014-07-01</StartDate>                <EndDate type\="string"\>9999-12-31</EndDate>                <Amount\_Money type\="string"\></Amount\_Money>                <Content\_Amount\_Money type\="string"\></Content\_Amount\_Money>                <Total\_Destination\_Out type\="string"\></Total\_Destination\_Out>                <Total\_Destination\_In type\="string"\></Total\_Destination\_In>                <Liability\_Insurance\_Total\_Destination\_Out type\="string"\></Liability\_Insurance\_Total\_Destination\_Out>                <Liability\_Insurance\_Total\_Destination\_In type\="string"\></Liability\_Insurance\_Total\_Destination\_In>                <Location\_Category type\="string"\></Location\_Category>                <Comment\_Information type\="array"\>                        <Comment\_Information\_child type\="record"\>                                <Column\_Position type\="string"\>4</Column\_Position>                                <Digit\_Number type\="string"\></Digit\_Number>                        </Comment\_Information\_child>                </Comment\_Information>                <Medication\_Information type\="array"\>                        <Medication\_Information\_child type\="record"\>                                <Medication\_Point type\="string"\></Medication\_Point>                        </Medication\_Information\_child>                </Medication\_Information>                <Medication\_Category type\="string"\>2</Medication\_Category>                <Unit\_Code type\="string"\></Unit\_Code>                <Data\_Category type\="string"\></Data\_Category>                <CommercialName type\="string"\>機材商品名称</CommercialName>                <Specific\_Equipment\_Code type\="string"\>700590000</Specific\_Equipment\_Code>        </medicationreq>  
</data>

### 処理概要

点数マスタ登録リクエストによりマスタの登録又は取消等を行います。

### 処理詳細

class値設定内容について

*   class = 01 登録処理
    
    コード・有効開始日・有効終了日で登録します。期間が重複しているマスタがある場合は登録不可。
    
*   class = 02 削除処理
    
    コード・有効開始日・有効終了日の一致するマスタを削除します。履歴がなくなった場合、入力コードも削除します。
    
*   class = 03 終了日設定処理
    
    コードと有効開始日の一致するマスタの有効終了日が、’99999999'の場合、有効終了日を変更します。
    
*   class = 04 期間変更処理
    
    有効終了日が’99999999’のレコードの有効終了日を設定した有効開始日-1日で終了させ、有効開始日・有効終了日でマスタを追加します。
    

1.  登録時(class = 01)
    
    1.  送信されたコード(Medication\_Code)の妥当性チェック(全class共通)
    2.  送信された名称の妥当性チェック(class = 01,04 必須)
    3.  送信された開始、終了日の妥当性チェック(全class共通)
    4.  自費（095XXXXXX,096XXXXX）登録
        
        4-1.自費金額(Amount\_Money)の妥当性チェック
        
        4-2.金額内容(Content\_Amount\_Money)の妥当性チェック(096XXXXXX　のみ有効)
        
        4-3.集計先（外来）(Total\_Destination\_Out)の妥当性チェック(09500XXXXX,09600XXXXX　のみ必須)
        
        4-4.集計先（入院）(Total\_Destination\_In)の妥当性チェック(09500XXXXX,09600XXXXX　のみ必須)
        
        4-5.自賠責集計先（外来）(Liability\_Insurance\_Total\_Destination\_Out)の妥当性チェック(09593XXXXのみ有効)
        
        4-6.自賠責集計先（入院）(Liability\_Insurance\_Total\_Destination\_In)の妥当性チェック(09593XXXXのみ有効)
        
    5.  ユーザコメントコード（0082XXXXX,0083XXXXX,0084XXXXX,0085XXXXX,0086XXXXX）登録
        
        5-1.カラム位置(1)〜(4)(Column\_Position)の妥当性チェック （0084XXXXX　のみ有効）
        
        5-2.桁数(1)〜(4)(Digit\_Number)の妥当性チェック （0084XXXXX　のみ有効）
        
    6.  部位コード（002XXXXXX)登録
        
        6-1.部位区分(Location\_Category)の妥当性チェック  
        6-2.部位選択式コードの妥当性チェック
        
    7.  用法コード（001XXXXXX)登録
        
        7-1.服用時点(1)〜(5)(Medication\_Point)の妥当性チェック
        
        > Medication\_Point (1) : 起床
        > 
        > Medication\_Point (2) : 朝
        > 
        > Medication\_Point (3) : 昼
        > 
        > Medication\_Point (4) : 夕
        > 
        > Medication\_Point (5) : 寝前
        
    8.  特定器材コード（059XXXXXX)登録
        
        8-1.金額(Amount\_Money)の妥当性チェック
        
        (整数８桁、小数２桁まで可)
        
        8-2.単位コード(Unit\_Code)の妥当性チェック
        
        8-3.データ区分(Data\_Category)の妥当性チェック
        
        (3:フィルム　省略時は　0)
        
    9.  器材商品名コード(058XXXXXX)登録
        
        9-1.商品名称(CommercialName)の妥当性チェック
        
        9-2.特定器材コード(Specific\_Equipment\_Code)の妥当性チェック
        
2.  削除時(class = 02)
    
    送信されたコード、有効開始日・有効終了日による該当マスタ存在チェック
    
3.  終了日設定時(class = 03)
    
    送信されたコード、有効開始日・有効終了日(99999999)による該当マスタ存在チェック
    
4.  期間変更時(class = 04)
    
    送信されたコード、有効終了日(99999999)による該当マスタ存在チェック
    

レスポンスサンプル
---------

<xmlio2>  <medicationres type\="record"\>    <Information\_Date type\="string"\>2014-07-15</Information\_Date>    <Information\_Time type\="string"\>15:02:19</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>点数マスタ登録終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Medication\_Code type\="string"\>001700001</Medication\_Code>    <Medication\_Name type\="string"\>朝夕　錠から</Medication\_Name>    <StartDate type\="string"\>2014-07-01</StartDate>    <EndDate type\="string"\>9999-12-31</EndDate>    <Comment\_Information type\="array"\>      <Comment\_Information\_child type\="record"\>        <Column\_Position type\="string"\>4</Column\_Position>      </Comment\_Information\_child>    </Comment\_Information>    <Medication\_Category type\="string"\>2</Medication\_Category>    <CommercialName type\="string"\>機材商品名称</CommercialName>    <Specific\_Equipment\_Code type\="string"\>700590000</Specific\_Equipment\_Code>  </medicationres>  
</xmlio2>  

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Medication\_Code | コード(自費、ユーザコメントコードetc) | 001700001 | 必須  |
| 2   | Medication\_Name | コード漢字名称 | 朝夕　錠から | 必須  |
| 3   | Medication\_Name\_inKana | コードカナ名称 |     | 必須  |
| 4   | StartDate | 有効開始日 | 2014-07-01 | 必須  |
| 5   | EndDate | 有効終了日 | 9999-12-31 | 必須  |
| 6   | Amount\_Money | 自費金額 |     | 必須  |
| 7   | Content\_Amount\_Money | 金額内容  <br>(0:税抜き、4:税込み) |     | ※1  |
| 8   | Total\_Destination\_Out | 集計先（外来） |     |     |
| 9   | Total\_Destination\_In | 集計先（入院） |     |     |
| 10  | Liability\_Insurance\_Total\_Destination\_Out | 自賠責集計先（外来） |     |     |
| 11  | Liability\_Insurance\_Total\_Destination\_In | 自賠責集計先（入院） |     |     |
| 12  | Location\_Category | 部位区分  <br>(0:その他、1:頭部、2:躯幹、3:四肢、5:胸部、6:腹部、7:脊髄、8:消化管) |     |     |
| 13  | Location\_Comment\_Code | 部位選択式コメントコード |     | 追加  <br>(2020-09-24) |
| 14  | Comment\_Information | ユーザコメント情報 (繰り返し 5) |     |     |
| 14-1 | Column\_Position | カラム位置 | 4   |     |
| 14-2 | Digit\_Number | 桁数  |     |     |
| 15  | Medication\_Information | 服用情報 (繰り返し 5) |     |     |
| 15-1 | Medication\_Point | 服用時点  <br>(0:服用しない、1:服用する) |     |     |
| 16  | Medication\_Category | 用法コメント区分 | 2   |     |
| 17  | Unit\_Code | 単位コード  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) |     |     |
| 18  | Data\_Category | データ区分  <br>(0:その他、3:フィルム) |     |     |
| 19  | CommercialName | 商品名称 | 機材商品名称 |     |
| 20  | Specific\_Equipment\_Code | 特定器材コード | 700590000 |     |

※1:(4:税込み)は有効開始日が2007-04-01 (H19.4.1) 以降の場合のみ有効になります。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-15 |     |
| 2   | Information\_Time | 実施時間 | 15:02:19 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 点数マスタ登録終了 |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Medication\_Code | コード(自費、ユーザコメントコードetc) | 001700001 |     |
| 7   | Medication\_Name | コード漢字名称 | 朝夕　錠から |     |
| 8   | Medication\_Name\_inKana | コードカナ名称 |     |     |
| 9   | StartDate | 有効開始日 | 2014-07-01 |     |
| 10  | EndDate | 有効終了日 | 9999-12-31 |     |
| 11  | Amount\_Money | 自費金額 |     |     |
| 12  | Content\_Amount\_Money | 金額内容 (0:税抜き、4:税込み) |     |     |
| 13  | Total\_Destination\_Out | 集計先（外来） |     |     |
| 14  | Total\_Destination\_In | 集計先（入院） |     |     |
| 15  | Liability\_Insurance\_Total\_Destination\_Out | 自賠責集計先（外来） |     |     |
| 16  | Liability\_Insurance\_Total\_Destination\_In | 自賠責集計先（入院） |     |     |
| 17  | Location\_Category | 部位区分  <br>(0:その他、1:頭部、2:躯幹、3:四肢、5:胸部、6:腹部、7:脊髄、8:消化管) |     |     |
| 18  | Location\_Comment\_Code | 部位選択式コメントコード |     | 追加  <br>(2020-09-24) |
| 19  | Comment\_Information | ユーザコメント情報 (繰り返し 5) |     |     |
| 19-1 | Column\_Position | カラム位置 | 4   |     |
| 19-2 | Digit\_Number | 桁数  |     |     |
| 20  | Medication\_Information | 服用情報 (繰り返し 5) |     |     |
| 20-1 | Medication\_Point | 服用時点  <br>(0:服用しない、1:服用する) |     |     |
| 21  | Medication\_Category | 用法コメント区分 | 2   |     |
| 22  | Unit\_Code | 単位コード  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) |     |     |
| 23  | Data\_Category | データ区分  <br>(0:その他、3:フィルム) |     |     |
| 24  | CommercialName | 商品名称 | 機材商品名称 |     |
| 25  | Specific\_Equipment\_Code | 特定器材コード | 700590000 |     |

  

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

[sample\_medicatm\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicatm_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca102/medicatonmodv2?class=01")  
\# class :01 (登録)  
\# class :02 (削除)  
\# class :03 (終了日設定)  
\# class :04 (期間変更)  
#  
#BODY \= <<EOF

<data>        <medicationreq type\="record"\>                <Medication\_Code type\="string"\>001700001</Medication\_Code>                <Medication\_Name type\="string"\>朝夕　錠から</Medication\_Name>                <Medication\_Name\_inKana type\="string"\></Medication\_Name\_inKana>                <StartDate type\="string"\>2012-07-01</StartDate>                <EndDate type\="string"\>9999-12-31</EndDate>                <Amount\_Money type\="string"\></Amount\_Money>                <Content\_Amount\_Money type\="string"\></Content\_Amount\_Money>                <Total\_Destination\_Out type\="string"\></Total\_Destination\_Out>                <Total\_Destination\_In type\="string"\></Total\_Destination\_In>                <Liability\_Insurance\_Total\_Destination\_Out type\="string"\></Liability\_Insurance\_Total\_Destination\_Out>                <Liability\_Insurance\_Total\_Destination\_In type\="string"\></Liability\_Insurance\_Total\_Destination\_In>                <Location\_Category type\="string"\></Location\_Category>                <Comment\_Information type\="array"\>                        <Comment\_Information\_child type\="record"\>                                <Column\_Position type\="string"\>4</Column\_Position>                                <Digit\_Number type\="string"\></Digit\_Number>                        </Comment\_Information\_child>                </Comment\_Information>                <Medication\_Information type\="array"\>                        <Medication\_Information\_child type\="record"\>                                <Medication\_Point type\="string"\></Medication\_Point>                        </Medication\_Information\_child>                </Medication\_Information>                <Medication\_Category type\="string"\>2</Medication\_Category>                <Unit\_Code type\="string"\></Unit\_Code>                <Data\_Category type\="string"\></Data\_Category>                <CommercialName type\="string"\>機材商品名称</CommercialName>                <Specific\_Equipment\_Code type\="string"\>700590000</Specific\_Equipment\_Code>        </medicationreq>  
</data>

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}  

C#による点数マスタ登録リクエストサンプルソース
------------------------

Windowsでの実行環境

*   Microsoft Visual Studio 2008以降
*   .NET Framework 2.0 SDK(C#コンパイラを含む.NET Frameworkの開発ツール)  
    (Microsoft Visual Studioに含まれています)

Ubuntuでの実行環境

*   MonoDevelop 2.2(1.0でも実行可能)
*   mono-gmcs(C#コンパイラ)  
    (MonoDevelopと一緒にインストールされます)

[sample\_medicatm\_v2.cs](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicatm_v2.cs)
  

using System;  
using System.IO;  
using System.Net;  
using System.Text;  
  
namespace Medicatm  
{  class Medicatm  {    public static void Main(string\[\] args)    {      string HOST \= "localhost";      string PORT \= "8000";      string USER \= "ormaster";      string PASSWD \= "ormaster";      string CONTENT\_TYPE \= "application/xml";      string URL \= "http://" + HOST + ":" + PORT + "/orca102/medicatonmodv2?class=01";  /\*  
      class :01 登録  
            :02 削除  
            :03 終了日設定  
            :04 期間変更  
  
      1.診療コード     Medication\_Code         (REQUIRED)  
      2.名称           Medication\_Name         (REQUIRED)  
      3.カナ名称       Medication\_Name\_inKana  (REQUIRED)  
      4.有効開始日     StartDate               (REQUIRED)  
      5.有効終了日     EndDate                 (REQUIRED)  
      6.金額           Amount\_Money            (REQUIRED)  
  
      REQUIRED : 必須   IMPLIED : 任意  
  \*/      string BODY \= @"

<data>        <medicationreq type\=""record""\>                <Medication\_Code type\=""string""\>001700001</Medication\_Code>                <Medication\_Name type\=""string""\>朝夕　錠から</Medication\_Name>                <Medication\_Name\_inKana type\=""string""\></Medication\_Name\_inKana>                <StartDate type\=""string""\>2012-07-01</StartDate>                <EndDate type\=""string""\>9999-12-31</EndDate>                <Amount\_Money type\=""string""\></Amount\_Money>                <Content\_Amount\_Money type\=""string""\></Content\_Amount\_Money>                <Total\_Destination\_Out type\=""string""\></Total\_Destination\_Out>                <Total\_Destination\_In type\=""string""\></Total\_Destination\_In>                <Liability\_Insurance\_Total\_Destination\_Out type\=""string""\></Liability\_Insurance\_Total\_Destination\_Out>                <Liability\_Insurance\_Total\_Destination\_In type\=""string""\></Liability\_Insurance\_Total\_Destination\_In>                <Location\_Category type\=""string""\></Location\_Category>                <Comment\_Information type\=""array""\>                        <Comment\_Information\_child type\=""record""\>                                <Column\_Position type\=""string""\>4</Column\_Position>                                <Digit\_Number type\=""string""\></Digit\_Number>                        </Comment\_Information\_child>                </Comment\_Information>                <Medication\_Information type\=""array""\>                        <Medication\_Information\_child type\=""record""\>                                <Medication\_Point type\=""string""\></Medication\_Point>                        </Medication\_Information\_child>                </Medication\_Information>                <Medication\_Category type\=""string""\>2</Medication\_Category>                <Unit\_Code type\=""string""\></Unit\_Code>                <Data\_Category type\=""string""\></Data\_Category>                <CommercialName type\=""string""\>機材商品名称</CommercialName>                <Specific\_Equipment\_Code type\=""string""\>700590000</Specific\_Equipment\_Code>        </medicationreq>  
</data>      ";

      byte\[\] record\_in\_byte \= Encoding.UTF8.GetBytes(BODY);      HttpWebRequest req \= (HttpWebRequest) HttpWebRequest.Create(URL);      //req.ProtocolVersion = HttpVersion.Version11;      req.Method \= "POST";      req.ContentType \= CONTENT\_TYPE;      req.ContentLength \= record\_in\_byte.Length;      req.Credentials \= new NetworkCredential(USER, PASSWD);      Console.WriteLine(BODY);      HttpWebResponse res \= null;      try      {        Stream reqstream \= req.GetRequestStream();        reqstream.Write(record\_in\_byte, 0, record\_in\_byte.Length);        reqstream.Close();        res \= (HttpWebResponse) req.GetResponse();        Console.WriteLine(res.ResponseUri);        Console.WriteLine(res.StatusDescription);      }      catch (WebException exc)      {        if (exc.Status \== WebExceptionStatus.ProtocolError)        {          HttpWebResponse err \= (HttpWebResponse) exc.Response;          int errcode \= (int) err.StatusCode;          Console.WriteLine(err.ResponseUri);          Console.WriteLine("{0}:{1}", errcode, err.StatusDescription);          err.Close();        }        else        {          Console.WriteLine(exc.Message);        }      }      if (res != null)      {        Stream str \= res.GetResponseStream();        StreamReader strread \= new StreamReader(str);        string FOO \= strread.ReadToEnd();        string FILE\_NAME \= "foo.xml";        File.WriteAllText(FILE\_NAME, FOO);        strread.Close();        str.Close();        res.Close();      }    }  }  
}

  

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ | 備考  |
| --- | --- | --- |
| 01  | コード未設定 |     |
| 11  | 登録できるコードではありません |     |
| 12  | 漢字名称がエラーです |     |
| 13  | カナ名称がエラーです |     |
| 14  | 開始日暦日エラー |     |
| 15  | 終了日暦日エラー |     |
| 16  | 金額は整数９桁です |     |
| 17  | 自費金額内容区分設定誤り |     |
| 18  | 点数欄集計先識別（外来）設定誤り |     |
| 19  | 点数欄集計先識別（入院）設定誤り |     |
| 20  | 自賠責集計等取扱（外来）設定誤り |     |
| 21  | 自賠責集計等取扱（入院）設定誤り |     |
| 22  | 部位コード設定誤り |     |
| 23  | コメントのカラム位置・桁数設定誤り |     |
| 24  | 服用時点区分設定誤り |     |
| 25  | 単位区分設定誤り |     |
| 26  | データ区分設定誤り |     |
| 27  | 商品名称設定誤り |     |
| 28  | 算定特定器材コード設定誤り |     |
| 29  | 点数は整数８桁・少数２桁です |     |
| 30  | 開始日≧終了日です |     |
| 31  | 点数マスタが登録済みです |     |
| 32  | 削除対象の点数マスタがありません |     |
| 33  | 終了日設定対象の点数マスタがありません |     |
| 34  | 更新対象の点数マスタがありません |     |
| 35  | 開始日+１日の設定ができません |     |
| 36  | 服用コメント区分設定誤り |     |
| 37  | 部位の選択式コメントコードではありません。 | 追加  <br>(2020-09-24) |
| 38  | 部位の選択式コメントコードが登録されていません。 | 追加  <br>(2020-09-24) |
| 51  | 点数マスタ登録エラー |     |
| 52  | 点数マスタ更新エラー |     |
| 53  | 点数マスタ削除エラー |     |
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

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API 点数マスタ

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/medicatonmod.html#wrapper)

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
