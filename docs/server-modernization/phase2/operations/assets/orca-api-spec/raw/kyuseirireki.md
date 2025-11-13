[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#content)

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
 > 旧姓履歴情報取得

API 旧姓履歴情報取得  

===============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#errmsg)
    

更新履歴
----

2021-11-24  
　新規掲載  

  

概要
--

POSTメソッドによる旧姓履歴情報の取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
   

テスト方法
-----

1.  参考提供されている ssample\_patientlst8\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_patientlst8\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby ssample\_patientlst8\_v2.rbにより接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/patientlst8v2  
  
Content-Type : application/xml

application/xml の場合の文字コードは UTF-8 とします。

  
 

<data>        <patientlst8req type\="record"\>                <Request\_Number type\="string"\>01</Request\_Number>                <Patient\_ID type\="string"\>216</Patient\_ID>        </patientlst8req>  
</data>

### 処理概要

患者番号を指定することにより、その患者の旧姓の履歴情報の取得を可能とする。

### 処理詳細

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック

レスポンスサンプル
---------

<xmlio2>  <patientlst8res type\="record"\>    <Information\_Date type\="string"\>2021-11-12</Information\_Date>    <Information\_Time type\="string"\>13:36:47</Information\_Time>    <Api\_Result type\="string"\>000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00216</Patient\_ID>      <WholeName type\="string"\>日医　有資格</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　ユウシカク</WholeName\_inKana>      <NickName type\="string"\>有ちゃん</NickName>      <BirthDate type\="string"\>1990-08-10</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Former\_Name\_Information type\="array"\>      <Former\_Name\_Information\_child type\="record"\>        <ChangeDate type\="string"\>2021-11-12</ChangeDate>        <WholeName type\="string"\>日医　無資格</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　ムシカク</WholeName\_inKana>      </Former\_Name\_Information\_child>      <Former\_Name\_Information\_child type\="record"\>        <ChangeDate type\="string"\>2021-11-13</ChangeDate>        <WholeName type\="string"\>日医　有有資格</WholeName>        <WholeName\_inKana type\="string"\>ニチイ　ユウユウシカク</WholeName\_inKana>        <NickName type\="string"\>有有ちゃん</NickName>      </Former\_Name\_Information\_child>    </Former\_Name\_Information>  </patientlst8res>  
</xmlio2>

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 必須  |
| 2   | Patient\_ID | 患者番号 | 00001 | 必須  |

 

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2021-11-12 |     |
| 2   | Information\_Time | 実施時間 | 13:36:47 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 000 | ※１  |
| 4   | Api\_Result\_Message | 処理メッセージ |     |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00001 |     |
| 6-2 | WholeName | 患者漢字氏名 | 日医　有資格 |     |
| 6-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　ユウシカク |     |
| 6-4 | NickName | 通称名 | 有ちゃん |     |
| 6-5 | BirthDate | 生年月日 | 1990-08-10 |     |
| 6-6 | Sex | 性別  <br>(1:男性、 2:女性) | 1   |     |
| 7   | Former\_Name\_Information | 旧姓履歴情報 |     | ※２  |
| 7-1 | ChangeDate | 変更年月日 | 2021-11-12 |     |
| 7-2 | WholeName | 患者漢字氏名 | 日医　無資格 |     |
| 7-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　ムシカク |     |
| 7-4 | NickName | 通称名 | 無ちゃん |     |

※１　正常終了：【０００】、エラーあり：【EXX】

※２　旧姓履歴情報を変更年月日の昇順に最大２０件返却します。  

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    
      
    

[sample\_patientlst8\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientlst8_v2.rb)

#!/usr/bin/ruby  
\# coding : utf-8  
  
#------ 患者旧姓履歴取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/patientlst8v2?class=01")  
\# class :01   
#  
#BODY \= <<EOF  
<data>        <patientlst8req type\="record"\>                <Request\_Number type\="string"\>01</Request\_Number>  
                <Patient\_ID type="string">216</Patient\_ID\>        </patientlst8req>  
</data\>  
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
| 01  | 患者番号が未設定です |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 旧姓履歴はありませんでした。 |
| 12  | 旧姓履歴が２０件以上存在します。 |
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
 > 旧姓履歴情報取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/kyuseirireki.html#wrapper)

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
