[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#content)

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
 > 入力・診療コード内容取得

API 入力・診療コード内容取得  

===================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#errmsg)
    

更新履歴
----

2024-11-26  
　新規掲載  

  

概要
--

POSTメソッドによる入力CDから診療行為コード（9桁）を取得を行います。  
診療行為コード毎に紐付く選択式コメントコードと名称の全リストを取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
   

テスト方法
-----

1.  参考提供されている sample\_medicatget\_ncode\_v2.rb、sample\_medicatget\_select\_v2.rb内の変数HOST等を接続環境に合わせます。
2.  ruby sample\_medicatget\_ncode\_v2.rb  
    ruby sample\_medicatget\_select\_v2.rb  
    により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/medicationgetv2
Content-Type : application/xml
              

application/xml の場合の文字コードは UTF-8 とします。

  
 

<data>  <medicationgetreq type\="record"\>    <Request\_Number type\="string"\>01</Request\_Number>    <Request\_Code type\="string"\>Y00001</Request\_Code>    <Base\_Date type\="string"\>2024-11-01</Base\_Date>  </medicationgetreq>  </data>              

### 処理概要

リクエスト番号＝01：リクエストコードに設定した入力コードに紐づく診療コードを取得します。  
リクエスト番号＝02：リクエストコードに設定した診療行為コードに紐づく選択式コメントを取得します。

### 処理詳細

リクエスト番号=01

1.  リクエストコードに入力コードを設定します。  
    設定した入力コードで入力コードテーブル（tbl\_inputcd）を検索し診療行為（セット）コードを取得します。
2.  診療行為（セット）コードがセットコードである時は、セットコードと表示名を返却します。  
    また、セットコードである旨を返却します。
3.  診療行為コードで点数マスタを基準日で検索し、点数マスタの内容を返却します。  
    基準日で存在しない場合は、最終履歴の内容を返却し、基準日では無効である旨を返却します。

リクエスト番号=02

1.  リクエストコードに9桁の診療コードを設定します。  
    設定した診療コードと基準日で点数マスタを検索し、基準日で無効の時はエラーとします。  
    点数マスタの内容を診療行為コード情報に編集します。
2.  診療行為が特定できない選択式コメントは、レセプト記載事項テーブルの診療行為コードを設定します。  
    現在、「199999999（医科診療行為特定不能のコメント）」、「819999999（長期収載品の選定療養コメント）」が該当します。  
    これらのコードは点数マスタに存在しませんので、診療行為コード情報は編集しません。
3.  診療コードでレセプト記載事項テーブル（tbl\_recekisai）を検索し、全件選択式コメント内容に返却します。  
    コメントコードと基準日で点数マスタ検索し、無効の時は対象外とします。  
    返却は最大２００件とします。

レスポンスサンプル
---------

リクエスト番号=01

<?xml version\="1.0" encoding\="UTF-8" ?>  
<xmlio2>  <medicationgetres type\="record"\>    <Information\_Date type\="string"\>2024-11-26</Information\_Date>    <Information\_Time type\="string"\>14:08:29</Information\_Time>    <Api\_Result type\="string"\>000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Request\_Code type\="string"\>Y00001</Request\_Code>    <Base\_Date type\="string"\>2024-11-01</Base\_Date>    <Medication\_Information type\="record"\>      <Medication\_Code type\="string"\>001000101</Medication\_Code>      <Medication\_Name type\="string"\>医師の指示通りに</Medication\_Name>      <StartDate type\="string"\>0000-00-00</StartDate>      <EndDate type\="string"\>9999-12-31</EndDate>    </Medication\_Information>  </medicationgetres>  
</xmlio2>                              

リクエスト番号=02

<?xml version\="1.0" encoding\="UTF-8" ?>  
<xmlio2>  <medicationgetres type\="record"\>    <Information\_Date type\="string"\>2024-11-26</Information\_Date>    <Information\_Time type\="string"\>14:10:34</Information\_Time>    <Api\_Result type\="string"\>000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Request\_Code type\="string"\>114030710</Request\_Code>    <Base\_Date type\="string"\>2024-11-01</Base\_Date>    <Medication\_Information type\="record"\>      <Medication\_Code type\="string"\>114030710</Medication\_Code>      <Medication\_Name type\="string"\>在医総管（機能強化在支診等・床有・難病等月２回〜１人）</Medication\_Name>      <Medication\_Name\_inKana type\="string"\>ザイイソウカン</Medication\_Name\_inKana>      <StartDate type\="string"\>2024-06-01</StartDate>      <EndDate type\="string"\>9999-12-31</EndDate>    </Medication\_Information>    <Selection\_Expression\_Information type\="array"\>      <Selection\_Expression\_Information\_child type\="record"\>        <Comment\_Code type\="string"\>850100106</Comment\_Code>        <Comment\_Name type\="string"\>往診又は訪問診療年月日（在医総管）</Comment\_Name>        <Item\_Number type\="string"\>0166</Item\_Number>        <Item\_Number\_Branch type\="string"\>01</Item\_Number\_Branch>        <Category type\="string"\>C002</Category>        <Condition\_Category type\="string"\>01</Condition\_Category>        <Not\_Use\_Comment type\="string"\>0</Not\_Use\_Comment>        <Process\_Category type\="string"\>4</Process\_Category>        <Selection\_Grep\_Name type\="string"\>在宅時医学総合管理料</Selection\_Grep\_Name>      </Selection\_Expression\_Information\_child>      <Selection\_Expression\_Information\_child type\="record"\>        <Comment\_Code type\="string"\>820100095</Comment\_Code>        <Comment\_Name type\="string"\>在宅医学管理を行う患者数が当該建築物の戸数の１０％以下</Comment\_Name>        <Item\_Number type\="string"\>0166</Item\_Number>        <Item\_Number\_Branch type\="string"\>05</Item\_Number\_Branch>        <Category type\="string"\>C002</Category>        <Condition\_Category type\="string"\>00</Condition\_Category>        <Not\_Use\_Comment type\="string"\>0</Not\_Use\_Comment>        <Process\_Category type\="string"\>1</Process\_Category>        <Selection\_Grep\_Name type\="string"\>在宅時医学総合管理料</Selection\_Grep\_Name>      </Selection\_Expression\_Information\_child>      <Selection\_Expression\_Information\_child type\="record"\>        <Comment\_Code type\="string"\>820100096</Comment\_Code>        <Comment\_Name type\="string"\>当該建築物の戸数が２０戸未満で在宅医学管理を行う患者が２人以下</Comment\_Name>        <Item\_Number type\="string"\>0166</Item\_Number>        <Item\_Number\_Branch type\="string"\>05</Item\_Number\_Branch>        <Category type\="string"\>C002</Category>        <Condition\_Category type\="string"\>00</Condition\_Category>        <Not\_Use\_Comment type\="string"\>0</Not\_Use\_Comment>        <Process\_Category type\="string"\>1</Process\_Category>        <Selection\_Grep\_Name type\="string"\>在宅時医学総合管理料</Selection\_Grep\_Name>      </Selection\_Expression\_Information\_child>    </Selection\_Expression\_Information>  </medicationgetres>  
</xmlio2>                              

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 必須  |
| 2   | Request\_Code | リクエストコード | 114030710 | 必須　※１　※２ |
| 3   | Base\_Date | リクエストコード | 基準日 | 未設定はシステム日付 |

※１　リクエスト番号＝01 ：入力コードを設定します。  
入力コードから入力コードテーブルを検索し、診療行為コードと点数マスタの内容を返却します。

※２　リクエスト番号=02：9桁の診療行為コードを設定します。  
診療行為コードに紐づくレセプト記載事項テーブル（tbl\_recekisai）のコメントコードを全件返却します。  
診療行為が特定できない選択式コメントは、レセプト記載事項テーブルの診療行為コードを設定します。※３  
（「199999999：医科診療行為特定不能」「819999999： 選定療養対象医薬品（長期収載品の選定療養）」が該当します）

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2021-11-12 |     |
| 2   | Information\_Time | 実施時間 | 13:36:47 |     |
| 3   | Api\_Result | 結果コード | 000 |     |
| 4   | Api\_Result\_Message | 処理メッセージ |     |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Request\_Code | リクエストコード | 01  | 送信内容 |
| 7   | Base\_Date | 基準日 | 2024-11-26 | 送信内容 |
| 8   | Medication\_Information | 診療行為コード情報 |     | 点数マスタの内容　※６ |
| 8-1 | Medication\_Code | 診療行為コード | 850100106 | ※４  |
| 8-2 | Medication\_Name | 名称  | 往診又は訪問診療年月日（在医総管） | ※４  |
| 8-3 | Medication\_Name\_inKana | カナ名称 |     |     |
| 8-4 | Unit\_Code | 単位コード |     | ※５  |
| 8-5 | Unit\_Name | 単位名称 |     |     |
| 8-6 | StartDate | 有効開始日 | 2024-06-01 |     |
| 8-7 | EndDate | 有効終了日 | 99999999 |     |
| 9   | Selection\_Expression\_Information | 選択式コメントリスト(繰り返し　２００) |     | レセプト記載事項テーブルの内容　※７ |
| 9-1 | Comment\_Code | コメントコード |     |     |
| 9-2 | Comment\_Name | コメントコード名称 |     | コメントコードの点数マスタ名称 |
| 9-3 | Item\_Number | 項番  |     |     |
| 9-4 | Item\_Number\_Branch | 枝番  |     |     |
| 9-5 | Category | 区分  |     |     |
| 9-6 | Condition\_Category | 条件区分 |     |     |
| 9-7 | Not\_Use\_Comment | 非算定理由コメント |     |     |
| 9-8 | Process\_Category | 処理区分 |     |     |
| 9-9 | Selection\_Grep\_Name | 診療行為名称等 |     |     |

※４　リクエスト＝01の時、入力コードテーブルの診療行為コードがセットコードの場合、セットコードと表示名を編集します。

※５　薬剤・器材コードの時は、単位コード「000」も編集します。薬剤・器材コード以外の時は単位コードの設定がある場合のみとします。

※６　リクエスト＝02の時、診療行為コードが点数マスタに存在する時のみ編集します。（※３の時は編集しません）  
　　　診療行為コードが基準日で無効の時はエラーとします。

※７　診療行為コードと紐づいているレセプト記載事項テーブルを全件編集します。  
　　　レセプト記載事項テーブルのコメントコードと基準日で点数マスタを検索し、無効の時は対象外とします。

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    
      
    

リクエスト番号＝01：[sample\_medicatget\_ncode\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicatget_ncode_v2.rb)

#!/usr/bin/ruby  
\# coding : utf-8                #------ 点数マスタ取得                require 'uri'  
require 'net/http'                Net::HTTP.version\_1\_2  
                  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"                                req \= Net::HTTP::Post.new("/api01rv2/medicationgetv2?class=01")  
\# class :01   
#  
#BODY \= <<EOF  
<data>  <medicationgetreq type\="record"\>    <Request\_Number type\="string"\>01</Request\_Number>  
    <Request\_Code type="string">Y00001</Request\_Code\>    <Base\_Date type\="string"\>2024\-11\-01</Base\_Date>  
  </medicationgetreq\>  
</data\>  
EOF  
                  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
puts req.body                Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}              

リクエスト番号＝02：[sample\_medicatget\_select\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicatget_select_v2.rb)

#!/usr/bin/ruby  
\# coding : utf-8                #------ 点数マスタ取得                require 'uri'  
require 'net/http'                Net::HTTP.version\_1\_2  
                  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"                                req \= Net::HTTP::Post.new("/api01rv2/medicationgetv2?class=01")  
\# class :01   
#  
#BODY \= <<EOF  
<data>  <medicationgetreq type\="record"\>    <Request\_Number type\="string"\>02</Request\_Number>  
    <Request\_Code type="string">199999999</Request\_Code\>    <Base\_Date type\="string"\>2024\-11\-01</Base\_Date>  
  </medicationgetreq\>  
</data\>  
EOF  
                  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
puts req.body                Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}              

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| E01 | リクエストコードの設定がありません。 |
| E02 | 基準日が暦日ではありません。 |
| E10 | 入力コードではありません。 |
| E11 | 入力コードの登録はありません。 |
| E12 | 入力コードに設定されている診療コードは点数マスタに登録されていません。 |
| W13 | セットコードです。セット名称を返却します。 |
| W14 | 警告！診療コードは基準日で有効期間外です。 |
| E20 | 診療行為コードは数値９桁で設定して下さい。 |
| E21 | 診療行為コードは点数マスタ、レセプト特記事項テーブルに存在しません。 |
| E22 | 診療行為コードは基準日で有効期間外です。 |
| E23 | 選択式コメントが存在しません。 |
| W24 | 警告！対象の選択式コメントが２００件以上存在します。 |
| E89 | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい。 |
| システム項目が設定できません |
| E90 | 他端末使用中 |
| E91 | リクエスト番号がありません |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入力・診療コード内容取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/medicationgetv2.html#wrapper)

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
