[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#content)

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
 > 入院会計未作成チェック

入院会計未作成チェック  

==============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#ressample)
      
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#errmsg)
      
    

更新履歴
----

概要
--

 POSTメソッドにより入院患者毎の入院会計診療年月の最大値の返却を行います。

 日レセ Ver.5.0.0\[第16回パッチ適用\] 以降  
 日レセ Ver.4.8.0\[第75回パッチ適用\] 以降  

 リクエストおよびレスポンスデータはxml2形式になります。

 リクエストの患者番号、診療年月の設定有無により、以下のようにレスポンスの返却を行います。  

1.  患者番号設定なし、診療年月の設定なし  
     入院中の患者について、入院会計の診療年月の最大値を一覧で返却します。
2.  患者番号設定あり、診療年月の設定なし  
     該当患者の入院会計の診療年月の最大値を返却します。
3.  患者番号設定なし、診療年月の設定あり  
     該当診療年月の入院会計が作成されていない入院中の患者の一覧を返却します。
4.  患者番号設定あり、診療年月の設定あり  
     該当患者の入院会計の該当診療年月の作成有無をチェックします。  
    

テスト方法
-----

1.  参考提供されている sample\_hspmmv2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hspmmv2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_hspmmv2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hspmmv2  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  <hspmmv2req type \="record"\>    <Perform\_Month type \="string"\>2017-11</Perform\_Month>  </hspmmv2req>  
</data>  

###  処理概要

 入院患者毎の入院会計診療年月の最大値の返却を行います。

 レスポンスサンプル
----------

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <hspmmv2res type="record">  
    <Information\_Date type="string">2017-11-09</Information\_Date>  
    <Information\_Time type="string">15:55:19</Information\_Time>  
    <Api\_Result type="string">0000</Api\_Result>  
    <Api\_Result\_Message type="string">正常終了</Api\_Result\_Message>  
    <Perform\_Month\_Max\_Information type="array">  
      <Perform\_Month\_Max\_Information\_child type="record">  
        <Patient\_ID type="string">00001</Patient\_ID>  
        <Perform\_Month type="string">2017-10</Perform\_Month>  
      </Perform\_Month\_Max\_Information\_child>  
      <Perform\_Month\_Max\_Information\_child type="record">  
        <Patient\_ID type="string">00002</Patient\_ID>  
        <Perform\_Month type="string">2017-10</Perform\_Month>  
      </Perform\_Month\_Max\_Information\_child>  
      <Perform\_Month\_Max\_Information\_child type="record">  
        <Patient\_ID type="string">00003</Patient\_ID>  
        <Perform\_Month type="string">2017-10</Perform\_Month>  
      </Perform\_Month\_Max\_Information\_child>  
      <Perform\_Month\_Max\_Information\_child type="record">  
        <Patient\_ID type="string">00004</Patient\_ID>  
        <Perform\_Month type="string">2017-10</Perform\_Month>  
      </Perform\_Month\_Max\_Information\_child>  
      <Perform\_Month\_Max\_Information\_child type="record">  
        <Patient\_ID type="string">00005</Patient\_ID>  
        <Perform\_Month type="string">2017-10</Perform\_Month>  
      </Perform\_Month\_Max\_Information\_child>  
    </Perform\_Month\_Max\_Information>  
  </hspmmv2res>  
</xmlio2>   

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 00001 |     |
| 2   | Perform\_Month | 診療年月 | 2017-11 |     |

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2017-11-10 |     |
| 2   | Information\_Time | 実施時間 | 09:00:00 |     |
| 3   | Api\_Result | 結果コード | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Perform\_Month\_Max\_Information | 最大診療年月情報  <br>（繰り返し　最大１０００） |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00001 |     |
| 5-2 | Perform\_Month | 診療年月 | 2017-01 | 作成済み入院会計の診療年月の最大値を返却します。  <br>但し、リクエストに患者番号と診療年月の両方が設定された場合はリクエストに設定された診療年月を返却します。 |

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

[sample\_hspmmv2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hspmmv2.rb)

#!/usr/bin/ruby  
#-\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hspmmv2")  
#  
#BODY \= <<EOF  
<data>  <hspmmv2req type \="record"\>    <Perform\_Month type \="string"\>2017\-11</Perform\_Month>  
  </hspmmv2req\>  
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

| エラーコード | エラーメッセージ |
| --- | --- |
| 0000 | 正常終了 |
| 0001 | 患者番号の入力に誤りがあります。 |
| 0002 | 診療年月の入力に誤りがあります。 |
| 0101 | 入院中の患者情報が存在しません。 |
| 0102 | 入院会計が存在しません。 |
| 0103 | 未作成の入院会計は存在しませんでした。 |
| 0104 | 入院会計が存在しません。 |
| 0089 | 職員情報が取得できません。 |
| 医療機関情報が取得できません。 |
| システム日付が取得できません。 |
| 患者番号構成情報が取得できません。 |
| グループ医療機関が不整合です。処理を終了して下さい。 |
| システム項目が設定できません。 |
| 0097 | 送信内容に誤りがあります。 |
| 0098 | 送信内容の読込ができませんでした。 |
| 0099 | ユーザＩＤが未登録です。 |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院会計未作成チェック

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hosp_kaikeiinfo.html#wrapper)

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
