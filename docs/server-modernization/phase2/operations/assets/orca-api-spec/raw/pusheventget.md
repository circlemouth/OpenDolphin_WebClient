[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#content)

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
 > PUSH通知一括取得

PUSH通知一括取得
==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#errmsg)
      
    

更新履歴
----

  

概要
--

POSTメソッドにより、送信済みPUSH通知の一括取得を行います。  
  
日レセ Ver.5.0.0\[第21回パッチ適用\] 以降  
※　現在はクラウド版のみ提供しています。

リクエストおよびレスポンスデータはJSON形式になります。  
  
リクエストの設定内容より、条件に該当する送信済みPUSH通知一括取得を行います。

※　基本的に７日以上前に送信されたPUSH通知は取得できません。（PUSH通知の際に過去の通知情報は自動的に削除されます。）  

テスト方法
-----

1.  参考提供されている sample\_pusheventget\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_pusheventget\_v2.rb 内のイベント名等を設定します。
3.  ruby sample\_pusheventget\_v2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/pusheventgetv2  
  
Content-Type: application/json

 application/json の場合の文字コードは UTF-8 とします。  

{  "pusheventgetv2req": {    "event": "patient\_accept",    "user": "ormaster",    "start\_time": "2018-01-24 13:00",    "end\_time": "2018-01-25 12:59"  }  
}  

### 処理概要

 条件に該当する送信済みPUSH通知の一括取得を行います。  
  

レスポンスサンプル
---------

\[  {    "data": {      "uuid": "2df2ef80-8978-4817-b929-c07e4ba39e6f",      "id": 1,      "event": "patient\_accept",      "user": "ormaster",      "body": {        "Patient\_Mode": "add",        "Patient\_ID": "00001",        "Accept\_Date": "2018-01-24",        "Accept\_Time": "16:02:53",        "Accept\_Id": "00001",        "Department\_Code": "01",        "Physician\_Code": "10001",        "Insurance\_Combination\_Number": "0001"      },      "time": "2018-01-24T16:02:53+0900"    }  },  {    "data": {      "uuid": "b5efc60a-bfa9-4c27-b0e1-85802b097cb6",      "id": 10,      "event": "patient\_accept",      "user": "ormaster",      "body": {        "Patient\_Mode": "add",        "Patient\_ID": "00005",        "Accept\_Date": "2018-01-24",        "Accept\_Time": "16:09:32",        "Accept\_Id": "00004",        "Department\_Code": "01",        "Physician\_Code": "10001",        "Insurance\_Combination\_Number": "0001"      },      "time": "2018-01-24T16:09:32+0900"    }  }  \
\]  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | イベント名 | patient\_accept | 省略可能 |
| 2   | user | ユーザＩＤ | ormaster | 省略可能 |
| 3   | start\_time | 範囲指定の開始日時 | 2017-01-24 13:00 | 省略可能  <br>日付のみの指定も可能です。 |
| 4   | end\_time | 範囲指定の終了日時 | 2017-01-25 12:59 | 省略可能  <br>日付のみの指定も可能です。 |

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   |     | push通知情報（繰り返し　上限なし） |     |     |
| 1-1 | data | 通知内容 |     |     |
| 2   | error | エラー情報 |     |     |
| 2-1 | code | エラーコード | 0001 |     |
| 2-2 | message | エラーメッセージ | イベント名に半角以外の文字が入力されています。 |     |

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

[sample\_pusheventgetv\_2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_pusheventgetv_2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ push通知一括取得  
  
  
require 'uri'  
require 'net/http'  
require 'json'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/json"req \= Net::HTTP::Post.new("/api01rv2/pusheventgetv2")BODY \= <<EOF 

{  "pusheventgetv2req": {    "event": "patient\_accept",    "user": "ormaster",    "start\_time": "2018-01-25 13:00",    "end\_time": "2018-01-26 12:59"  }  
}  

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts JSON.pretty\_generate(JSON(res.body))  
}  

  

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 0001 | イベント名に半角以外の文字が入力されています。 |
| 0002 | ユーザ名に半角以外の文字が入力されています。 |
| 0003 | 期間開始日時の日付の入力に誤りがあります。 |
| 0004 | 期間開始日時の時刻の入力に誤りがあります。 |
| 0005 | 期間終了日時の日付の入力に誤りがあります。 |
| 0006 | 期間終了日時の時刻の入力に誤りがあります。 |
| 0007 | 対象となるＰＵＳＨ通知が存在しませんでした。 |
| 0008 | 期間開始日時＞期間終了日時です。 |
| 4001 | 更新処理に失敗しました。 |
| 4002 | 更新処理に失敗しました。 |
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
 > PUSH通知一括取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/pusheventget.html#wrapper)

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
