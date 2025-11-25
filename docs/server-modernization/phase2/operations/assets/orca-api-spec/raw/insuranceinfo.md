[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#content)

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
 > 保険者一覧情報

保険者一覧情報
=======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#errmsg)
      
    

更新履歴
----

 2014-06-23  「エラーメッセージ一覧」を追加。

概要
--

POSTメソッドによる保険者一覧情報の取得を行います。

日レセ Ver.4.7.0\[第19回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_InsuranceProvider\_Info\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_InsuranceProvider\_Info\_v2.rb 内の保険者番号等を設定します。
3.  ruby sample\_InsuranceProvider\_Info\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/insprogetv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <insprogetreq type\="record"\>                <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                <Insurance\_Number type\="string"\></Insurance\_Number>        </insprogetreq>  
</data>   

### 処理概要

日レセAPIを使用して保険者番号（保険番号）を指定することにより該当の保険者情報を返却します。  
返却される情報は以下になります。  
  

*   保険者番号指定による該当の保険者情報の返却
*   保険番号（060:国保）指定による該当保険者の一括取得  
    

### 処理詳細

1.  保険者番号の妥当性チェック  
    
2.  保険番号の妥当性チェック  
    
3.  返却情報は保険番号指定の場合、最大２５００件

レスポンスサンプル
---------

<xmlio2>  <insprogetres type\="record"\>    <Information\_Date type\="string"\>2013-10-11</Information\_Date>    <Information\_Time type\="string"\>10:20:23</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <TInsuranceProvider\_Information type\="array"\>      <TInsuranceProvider\_Information\_child type\="record"\>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>文京区</InsuranceProvider\_WholeName>        <Insurance\_Number type\="string"\>060</Insurance\_Number>        <Insurance\_Number\_Name type\="string"\>国保</Insurance\_Number\_Name>        <InsuranceProvider\_Address\_ZipCode type\="string"\>1120003</InsuranceProvider\_Address\_ZipCode>        <InsuranceProvider\_WholeAddress1 type\="string"\>東京都文京区春日</InsuranceProvider\_WholeAddress1>        <InsuranceProvider\_WholeAddress2 type\="string"\>１‐１６‐２１</InsuranceProvider\_WholeAddress2>        <InsuranceProvider\_PhoneNumber type\="string"\>03-3812-7111</InsuranceProvider\_PhoneNumber>      </TInsuranceProvider\_Information\_child>    </TInsuranceProvider\_Information>  </insprogetres>  
</xmlio2>

 

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | InsuranceProvider\_Number | 保険者番号 | 138057 | ※１  |
| 2   | Insurance\_Number | 保険番号 | 060 | ※１  |

※１： 保険者番号か保険番号のどちらかの設定が必須です。  
       両方の設定があった場合は、保険者番号を優先します。  

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   |
| --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-10-11 |
| 2   | Information\_Time | 実施時間 | 10:20:23 |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |
| 5   | Reskey |     | Medical Info |
| 6   | TInsuranceProvider\_Information | 保険者一覧情報（繰り返し ２５００） |     |
| 6-1 | InsuranceProvider\_Number | 保険者番号 | 138057 |
| 6-2 | InsuranceProvider\_WholeName | 保険者名称 | 文京区 |
| 6-3 | InsuranceProvider\_Name1 | 保険者名称（短縮１） |     |
| 6-4 | InsuranceProvider\_Name2 | 保険者名称（短縮２） |     |
| 6-5 | InsuranceProvider\_Name3 | 保険者名称（短縮３） |     |
| 6-6 | Insurance\_Number | 保険番号 | 060 |
| 6-7 | Insurance\_Number\_Name | 保険番号名称 | 国保  |
| 6-8 | InsuranceProvider\_Address\_ZipCode | 郵便番号 | 1120003 |
| 6-9 | InsuranceProvider\_WholeAddress1 | 住所  | 東京都文京区春日 |
| 6-10 | InsuranceProvider\_WholeAddress2 | 番地方書 | １−１６−２１ |
| 6-11 | InsuranceProvider\_PhoneNumber | 電話番号 | 03-3812-7111 |
| 6-12 | InsuranceProvider\_Symbol | 記号  |     |
| 6-13 | Rate\_Outpatient | 給付割合（本人外来） |     |
| 6-14 | Rate\_Inpatient | 給付割合（本人入院） |     |
| 6-15 | Rate\_Outpatient\_F | 給付割合（家族外来） |     |
| 6-16 | Rate\_Inpatient\_F | 給付割合（家族入院） |     |
| 6-17 | Change\_Memo | 異動内容 |     |
| 6-18 | Change\_Date | 異動年月日 |     |

※保険番号設定の場合、保険者番号順に編集します。

※２５００件以上存在したときはメッセージを返却します。

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

[sample\_InsuranceProvider\_Info\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_InsuranceProvider_Info_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 保険者情報返却  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/insprogetv2")  
#  
\# 1.保険者番号  InsuranceProvider\_Number    (REQUIRED)  
\# 2.保険番号    Insurance\_Number            (REQUIRED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <insprogetreq type\="record"\>                <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                <Insurance\_Number type\="string"\>060</Insurance\_Number>        </insprogetreq>  
</data>

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
| 10  | 保険者番号・保険番号の指定がありません。 |
| 14  | 対象が２５００件以上存在します。 |
| 15  | 対象がありません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい。 |
| システム項目が設定できません |
| 90  | 他端末使用中 |
| 91  | 処理区分未設定 |
| 97  | 送信内容に誤りがあります。 |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザID未登録。 |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 保険者一覧情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/insuranceinfo.html#wrapper)

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
