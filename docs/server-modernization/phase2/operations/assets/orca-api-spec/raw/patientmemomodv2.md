[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#content)

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
 > API患者メモ登録

API患者メモ登録
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#errmsg)
    

更新履歴
----

2025-08-26  
　新規掲載  

  

概要
--

POSTメソッドによる患者番号、登録日、診療科でメモ２またはメモ１の登録・更新・削除を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
   

テスト方法
-----

1.  参考提供されている sample\_patientmemomodv2.rb 内の変数HOST等を接続環境に合わせます。
2.  ruby sample\_patientmemomodv2.rb

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca06/patientmemomodv2
Content-Type : application/xml
              

application/xml の場合の文字コードは UTF-8 とします。

  
 

<data>        <patient\_memomodreq type\="record"\>                <Request\_Number type\="string"\>01</Request\_Number>                <Patient\_ID type\="string"\>1</Patient\_ID>                <Perform\_Date type\="string"\>2025-08-25</Perform\_Date>        <Department\_Code type\="string"\>01</Department\_Code>        <Memo\_Class type\="string"\>2</Memo\_Class>        <Patient\_Memo type\="string"\>テストメモ</Patient\_Memo>    </patient\_memomodreq>  
</data>              

### 処理概要

リクエスト番号＝01：登録  
リクエスト番号＝02：更新  
リクエスト番号＝03：削除

レスポンスサンプル
---------

<?xml version\="1.0" encoding\="UTF-8" ?>  
<xmlio2>    <patient\_memomodres type\="record"\>        <Information\_Date type\="string"\>2025-08-26</Information\_Date>        <Information\_Time type\="string"\>19:16:17</Information\_Time>        <Api\_Result type\="string"\>000</Api\_Result>        <Api\_Result\_Message type\="string"\>メモ登録終了</Api\_Result\_Message>        <Reskey type\="string"\>Patient Info</Reskey>        <Patient\_Information type\="record"\>            <Patient\_ID type\="string"\>00001</Patient\_ID>            <WholeName type\="string"\>テスト　１</WholeName>            <WholeName\_inKana type\="string"\>テスト　１</WholeName\_inKana>            <BirthDate type\="string"\>1998-12-13</BirthDate>            <Sex type\="string"\>1</Sex>        </Patient\_Information>        <Patient\_Memo\_Information type\="record"\>            <Perform\_Date type\="string"\>2025-08-25</Perform\_Date>            <Department\_Code type\="string"\>01</Department\_Code>            <Department\_Name type\="string"\>内科</Department\_Name>            <Memo\_Class type\="string"\>2</Memo\_Class>        </Patient\_Memo\_Information>    </patient\_memomodres>  
</xmlio2>              

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 必須  |
| 2   | Patient\_ID | 患者番号 | 1   | 必須  |
| 3   | Perform\_Date | 登録日 | 2025-08-25 | 未設定はシステム日付 |
| 4   | Department\_Code | 診療科コード | 01  | 必須（登録・更新）　00:全科　※１ |
| 5   | Memo\_Class | メモ区分 | 1   | 1：メモ１、2：メモ２（未設定はメモ２）※２ |
| 6   | Patient\_Memo | メモ内容 | テストメモ | 必須（登録・更新）※３ |

※１　登録・更新は必須とします。  
削除は診療科が未設定の時はすべての診療科のメモ２またはメモ１を削除します。

※２　メモ１を処理する時に「１」を設定します。  
「１」以外はメモ２とします。

※３　半角文字は全角変換、拡張文字は■変換します。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2021-11-12 |     |
| 2   | Information\_Time | 実施時間 | 13:36:47 |     |
| 3   | Api\_Result | 結果コード | 000 |     |
| 4   | Api\_Result\_Message | 処理メッセージ |     |     |
| 5   | Reskey |     | Patient Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 1   |     |
| 6-2 | WholeName | 患者漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1998-12-13 |     |
| 6-5 | Sex | 性別  | 1   |     |
| 7   | Patient\_Memo\_Information | メモ情報 |     | 送信内容 |
| 7-1 | Perform\_Date | 登録日 | 2025-08-25 |     |
| 7-2 | Department\_Code | 診療科コード | 01  |     |
| 7-3 | Department\_Name | 診療科名称 | 内科  |     |
| 7-4 | Memo\_Class | メモ区分 | 1   | 1：メモ１，2:メモ２ |

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    
      
    

[sample\_patientmemomodv2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientmemomodv2.rb)

#!/usr/bin/ruby  
\# coding : utf-8  
  
#------ 患者メモ登録  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca06/patientmemomodv2")  
\# class :01   
#  
#BODY \= <<EOF  
<data>        <patient\_memomodreq type\="record"\>                <Request\_Number type\="string"\>01</Request\_Number>  
                <Patient\_ID type="string">1</Patient\_ID\>                <Perform\_Date type\="string"\>2025\-08\-26</Perform\_Date>  
        <Department\_Code type="string">01</Department\_Code\>        <Memo\_Class type\="string"\>2</Memo\_Class>  
        <Patient\_Memo type="string">テストメモ</Patient\_Memo\>    </patient\_memomodreq>  
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
| E01 | リクエストコードの設定がありません。 |
| E02 | 基準日が暦日ではありません。 |
| E03 | メモ内容が空白です |
| E10 | 入力コードではありません。 |
| E11 | 登録日が暦日ではありません |
| E12 | 診療科が存在しません |
| E13 | メモ２は登録済みです。登録できません。 |
| E14 | メモ１は登録済みです。登録できません。 |
| E15 | 更新対象のメモがありません。 |
| E16 | 削除対象のメモがありません。 |
| E20 | メモ登録エラー |
| E21 | メモ更新エラー |
| E22 | メモ削除エラー |
| E89 | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい。 |
| システム項目が設定できません |
| E90 | 他端末使用中 |
| E91 | リクエスト番号がありません |
| E97 | 送信内容に誤りがあります。 |
| E89 | 送信内容の読込ができませんでした |
| E99 | ユーザＩＤ未登録。 |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > API患者メモ登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html#wrapper)

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
