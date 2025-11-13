[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#content)

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
 > 入院会計作成

入院会計作成  

=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#ressample)
      
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#errmsg)
      
    

更新履歴
----

 2017-12-20   サンプルスクリプト名を変更。

概要
--

 POSTメソッドにより入院患者の入院会計の作成を行います。  

 日レセ Ver.5.0.0\[第16回パッチ適用\] 以降  
 日レセ Ver.4.8.0\[第75回パッチ適用\] 以降  

 リクエストおよびレスポンスデータはxml2形式になります。

 既に作成済みの入院会計の翌月より６ヶ月分の入院会計の作成を行います（システム日付の属する月の３か月後が上限となります）。  
 食事、外泊が未設定の入院会計を作成します。  

テスト方法
-----

1.  参考提供されている sample\_hsacctmodv2\_kaikei\_sakusei.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsacctmodv2\_kaikei\_sakusei.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_hsacctmodv2\_kaikei\_sakusei.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsacctmodv2  
  
Request\_Number:  
    9: 入院会計作成  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  
<private\_objects type \="record"\>   <Save\_Request type \="string"\>1</Save\_Request>   <Request\_Number type \="string"\>9</Request\_Number>   <Patient\_ID type \="string"\>1</Patient\_ID>   <Admission\_Date type \="string"\>2017-01-09</Admission\_Date>  
</private\_objects>  
</data>  

###  処理概要

 該当入院患者の入院会計の作成を行います。

 レスポンスサンプル
----------

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <private\_objects type="record">  
    <Information\_Date type="string">2017-11-09</Information\_Date>  
    <Information\_Time type="string">13:48:19</Information\_Time>  
    <Api\_Results type="array">  
      <Api\_Results\_child type="record">  
        <Api\_Result type="string">00</Api\_Result>  
      </Api\_Results\_child>  
    </Api\_Results>  
    <Request\_Number type="record">  
      <Label type="string">リクエスト番号</Label>  
      <Data type="string">9</Data>  
      <Name type="string">入院会計作成</Name>  
    </Request\_Number>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00001</Patient\_ID>  
      <WholeName type="string">日医　太郎</WholeName>  
      <WholeName\_inKana type="string">ニチイ　タロウ</WholeName\_inKana>  
      <BirthDate type="string">1958-01-10</BirthDate>  
      <Sex type="string">1</Sex>  
    </Patient\_Information>  
    <Perform\_Month type="string">2017-08</Perform\_Month>  
  </private\_objects>  
</xmlio2>   

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>（日レセにリクエストの情報を保持するか否かを指定）  <br>0:残さない  <br>1:残す | 1   | 未設定時初期値\[0\] |
| 2   | Request\_Number | リクエスト番号 | 9   | 必須(9) |
| 3   | Patient\_ID | 患者番号 | 00001 | 必須  |
| 4   | Admission\_Date | 入院日 | 2017-11-01 | 必須  |

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 |     |     |
| 2   | Information\_Time | 実施時間 |     |     |
| 3   | Api\_Results | 結果情報  <br>（繰り返し １０） |     |     |
| 3-1 | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ |     |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 9   |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 入院会計作成 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 |     |     |
| 5-2 | WholeName | 漢字名称 |     |     |
| 5-3 | WholeName\_inKana | カナ氏名 |     |     |
| 5-4 | BirthDate | 生年月日 |     |     |
| 5-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 6   | Perform\_Month | 診療年月 |     | 作成済み入院会計の最大診療年月 |

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

[sample\_hsacctmodv2\_kaikei\_sakusei.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsacctmodv2_kaikei_sakusei.rb)

#!/usr/bin/ruby  
#-\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hsacctmodv2")  
#  
#BODY \= <<EOF  
<data>  
<private\_objects type \="record"\>   <Save\_Request type \="string"\>1</Save\_Request>  
   <Request\_Number type ="string">9</Request\_Number\>   <Patient\_ID type \="string"\>1</Patient\_ID>  
   <Admission\_Date type ="string">2017-01-09</Admission\_Date\>  
</private\_objects>  
</data\>  
EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
  
}  

 エラーメッセージ一覧
-----------

 入院登録([https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
)を参照。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院会計作成

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeimod.html#wrapper)

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
