[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#content)

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
 > 入院基本情報

入院基本情報  

=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#req)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#errmsg)
      
    

更新履歴
----

2014-08-01   「エラーメッセージ一覧」を追加。  

2013-11-26   「レスポンスサンプル」「レスポンス一覧」の項目名を一部変更。

概要
--

POSTメソッドによる入院基本情報の取得を行います。

日レセ Ver.4.7.0\[第17回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsconf\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsconf\_v2.rb 内の基準日等を接続先の日レセの環境に合わせます。
3.  ruby sample\_hsconf\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsconfbasev2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>　　<private\_objects type\="record"\>　　　　<Base\_Date type\="string"\>2003-01-14</Base\_Date>　　</private\_objects>  
</data>   

### 処理概要

入院基本情報リクエストで基準日を指定することにより入院基本情報内容を返却します。

  

### 処理詳細

1.  基準日の妥当性チェック（未設定の場合は、システム日付を設定）

返却内容はシステム管理「5000 医療機関情報ー入院基本」の情報から編集。

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-09-11</Information\_Date>    <Information\_Time type\="string"\>14:56:23</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Meal\_Cost\_Class type\="record"\>      <Label type\="string"\>食事療養費</Label>    </Meal\_Cost\_Class>    <Evaluation\_Nutrition\_Administration type\="record"\>      <Label type\="string"\>栄養管理経過措置</Label>      <Data type\="string"\>0</Data>      <Name type\="string"\>栄養管理体制基準適合</Name>    </Evaluation\_Nutrition\_Administration>    <Charge\_Sales\_Tax\_Special\_Rooms type\="record"\>      <Label type\="string"\>室料差額消費税</Label>      <Data type\="string"\>0</Data>      <Name type\="string"\>なし</Name>    </Charge\_Sales\_Tax\_Special\_Rooms>    <Insufficient\_Doctors type\="record"\>      <Label type\="string"\>標欠による減額</Label>      <Data type\="string"\>0</Data>      <Name type\="string"\>減額なし</Name>    </Insufficient\_Doctors>    <Constant\_Overhead type\="record"\>      <Label type\="string"\>定数超過</Label>      <Data type\="string"\>0</Data>      <Name type\="string"\>定数超過なし</Name>    </Constant\_Overhead>    <Over180days\_Default type\="record"\>      <Label type\="string"\>入院時の選定入院</Label>      <Data type\="string"\>1</Data>      <Name type\="string"\>選定対象</Name>    </Over180days\_Default>  </private\_objects>  
</xmlio2>

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Base\_Date | 基準日 | 2003-01-14 | 未設定はシステム日付 |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-09-11 |     |
| 2   | Information\_Time | 実施時間 | 14:56:23 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Meal\_Cost\_Class | 入院時食事療養費 |     | 変更  <br>(2013-11-26) |
| 5-1 | Label | 内容の名称 | 食事療養費 |     |
| 5-2 | Data | 入院時食事療養費の診療コード |     |     |
| 5-3 | Name | 入院時食事療養費の名称 |     |     |
| 6   | Evaluation\_Nutrition\_Administration | 栄養管理経過措置（基準日≥平成２４年４月１日以降時に返却） |     |     |
| 6-1 | Label | 内容の名称 | 栄養管理経過措置 |     |
| 6-2 | Data | 栄養管理経過措置コード  <br>（0、1） | 0   |     |
| 6-3 | Name | 栄養管理経過措置の内容  <br>（栄養管理体制基準適合、  <br>栄養管理体制基準未適合） | 栄養管理体制基準適合 |     |
| 7   | Consumption\_Tax\_Room\_Charge | 室料差額消費税 |     | 変更  <br>(2013-11-26) |
| 7-1 | Label | 内容の名称 | 室料差額消費税 |     |
| 7-2 | Data | 室料差額消費税コード  <br>（0、1） | 0   |     |
| 7-3 | Name | 室料差額消費税の内容  <br>（あり、なし） | なし  |     |
| 8   | Insufficient\_Doctors | 標欠による減額 |     |     |
| 8-1 | Label | 内容の名称 | 標欠による減額 |     |
| 8-2 | Data | 標欠による減額コード  <br>（0、1、2、3、4） | 0   |     |
| 8-3 | Name | 標欠による減額の内容  <br>（減額なし、  <br>１００分の１０減額、  <br>１００分の１５減額、  <br>１００分の２減額、  <br>１００分の３減額） | 減額なし |     |
| 9   | Constant\_Overhead | 定数超過 |     |     |
| 9-1 | Label | 内容の名称 | 定数超過 |     |
| 9-2 | Data | 定数超過コード  <br>（0、1） | 0   |     |
| 9-3 | Name | 定数超過の内容  <br>（定数超過なし、定数超過あり） | 定数超過なし |     |
| 10  | Additional\_Hospital\_Charge | 入院加算情報（地域加算を含む）（繰り返し 21） |     |     |
| 10-1 | Label | 内容の名称 |     |     |
| 10-2 | Data | 入院加算コード |     |     |
| 10-3 | Name | 入院加算の内容 |     |     |
| 11  | Over180days\_Default | 選定入院料 |     |     |
| 11-1 | Label | 内容の名称 | 入院時の選定入院 |     |
| 11-2 | Data | 選定入院料コード  <br>（1、2） | 1   |     |
| 11-3 | Name | 選定入院料の内容  <br>（選定対象、選定対象外） | 選定対象 |     |

 

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

[sample\_hsconf\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsconf_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院基本情報設定内容返却  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/hsconfbasev2")  
#  
\# 1.基準日        Base\_Date      (IMPLIED)  
#  
\# REQUIRED : 必須  IMPLIED : 任意  
#BODY \= <<EOF

<data>     <private\_objects type\="record"\>         <Base\_Date type\="string"\>2003-01-14</Base\_Date>     </private\_objects> </data> 

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
} 

  

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 00  | 処理終了 |
| 01  | 基準日の設定に誤りがあります |
| 02  | 入院基本情報が取得できません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 92  | 基準日は平成２０年（２００８年）４月１日以降を指定してください |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザIDが未登録です |
| それ以外 | 返却情報の編集でエラーが発生しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院基本情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospbase.html#wrapper)

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
