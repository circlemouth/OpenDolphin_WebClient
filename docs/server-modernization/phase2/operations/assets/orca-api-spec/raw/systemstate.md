[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#content)

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
 > システム状態の取得

システム状態の取得
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#response)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#errmsg)
    

更新履歴
----

  

概要
--

POSTメソッドによりシステム状態の取得を行います。

リクエストおよびレスポンスデータはxml2形式になります。

  

テスト方法
-----

1.  参考提供されている sample\_system\_state\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_system\_state\_v2.rb 内のリクエスト日時を接続先の日レセの環境に合わせます。
3.  ruby sample\_system\_state\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/systeminfv2
       
Content-Type: application/xml  

application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Request\_Date type\="string"\>2014-10-23</Request\_Date>                <Request\_Time type\="string"\>16:52:00</Request\_Time>        </private\_objects>  
</data>

### 処理概要

日レセのデータベース構造バージョン、マスタ更新情報、プログラム更新情報を返却します。  

### 処理詳細

1.  基準日の歴日チェック  
    

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-10-23</Information\_Date>    <Information\_Time type\="string"\>16:59:11</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Jma\_Receipt\_Version type\="string"\>040700-1</Jma\_Receipt\_Version>    <Database\_Information type\="record"\>      <Local\_Version type\="string"\>S-040700-1-20140527-2</Local\_Version>      <New\_Version type\="string"\>S-040700-1-20140527-2</New\_Version>    </Database\_Information>    <Master\_Update\_Information type\="record"\>      <Last\_Update\_Date type\="string"\>2014-10-02</Last\_Update\_Date>      <Master\_Version\_Information type\="array"\>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>点数マスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20140930-1</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20140930-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>保険番号マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140128-1</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140128-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>システム管理マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140724-1</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140724-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>病名マスタ</Name>          <Local\_Version type\="string"\>R-040600-1-20140611-2</Local\_Version>          <New\_Version type\="string"\>R-040600-1-20140611-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>チェックマスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140410-2</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140410-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>一般老人置換マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140919-1</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140919-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>検査分類マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140905-2</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140905-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>相互作用マスタ</Name>          <Local\_Version type\="string"\>R-020200-3-20060217-3</Local\_Version>          <New\_Version type\="string"\>R-020200-3-20060217-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>症状措置マスタ</Name>          <Local\_Version type\="string"\>R-020200-3-20060217-4</Local\_Version>          <New\_Version type\="string"\>R-020200-3-20060217-4</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>保険者マスタ</Name>          <Local\_Version type\="string"\>R-020200-3-20041025-1</Local\_Version>          <New\_Version type\="string"\>R-020200-3-20041025-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>住所マスタ</Name>          <Local\_Version type\="string"\>R-040600-1-20140911-1</Local\_Version>          <New\_Version type\="string"\>R-040600-1-20140911-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>適応病名マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140701-2</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140701-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>一般名マスタ</Name>          <Local\_Version type\="string"\>R-040200-1-20140902-2</Local\_Version>          <New\_Version type\="string"\>R-040200-1-20140902-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>包括チェックマスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20121012-5</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20121012-5</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>包括診療コードマスタ</Name>          <Local\_Version type\="string"\>R-040600-1-20140718-3</Local\_Version>          <New\_Version type\="string"\>R-040600-1-20140718-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>統計メモマスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20140625-3</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20140625-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>オプションマスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20140307-3</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20140307-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>感染症判定マスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20120706-1</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20120706-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>入院基本料マスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20140307-2</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20140307-2</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>入院料加算チェックマスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20140923-1</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20140923-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>入院レセプト記載略称マスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20140728-1</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20140728-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>同義語マスタ</Name>          <Local\_Version type\="string"\>R-040600-1-20101027-1</Local\_Version>          <New\_Version type\="string"\>R-040600-1-20101027-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>電子点数表マスタ</Name>          <Local\_Version type\="string"\>R-040600-1-20140924-6</Local\_Version>          <New\_Version type\="string"\>R-040600-1-20140924-6</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>労働基準監督署マスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20111001-1</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20111001-1</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>最低薬価マスタ</Name>          <Local\_Version type\="string"\>R-040500-1-20140902-3</Local\_Version>          <New\_Version type\="string"\>R-040500-1-20140902-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>介護保険者マスタ</Name>          <Local\_Version type\="string"\>R-040700-1-00000000-0</Local\_Version>          <New\_Version type\="string"\>R-040700-1-00000000-0</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>選定療養費一般コード振替マスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20140316-3</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20140316-3</New\_Version>        </Master\_Version\_Information\_child>        <Master\_Version\_Information\_child type\="record"\>          <Name type\="string"\>入院料置換マスタ</Name>          <Local\_Version type\="string"\>R-040700-1-20140924-7</Local\_Version>          <New\_Version type\="string"\>R-040700-1-20140924-7</New\_Version>        </Master\_Version\_Information\_child>      </Master\_Version\_Information>    </Master\_Update\_Information>    <Program\_Update\_Information type\="array"\>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-10-02</Date>        <Comment type\="string"\>提供されている最新の状態でした。</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-09-29</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第５４回　平成２６年　９月２９日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-09-24</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第５３回　平成２６年　９月２４日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-09-01</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第５２回　平成２６年　９月　１日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-08-27</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第５１回　平成２６年　８月２７日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-08-01</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第５０回　平成２６年　８月　１日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-07-29</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第４９回　平成２６年　７月２９日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-07-24</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第４８回　平成２６年　７月２４日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-06-25</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第４７回　平成２６年　６月２５日</Comment>      </Program\_Update\_Information\_child>      <Program\_Update\_Information\_child type\="record"\>        <Date type\="string"\>2014-06-04</Date>        <State type\="string"\>済</State>        <Comment type\="string"\>第４６回　平成２６年　６月　４日</Comment>      </Program\_Update\_Information\_child>    </Program\_Update\_Information>  </private\_objects>  
</xmlio2>  

   

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Date | リクエスト日 | 2014-10-23 | 必須  |
| 2   | Request\_Time | リクエスト時間  <br>(時:分:秒) | 16:52:00 | 必須  <br>(24時間制で設定) |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-10-23 |     |
| 2   | Information\_Time | 実施時間 | 16:59:11 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Jma\_Receipt\_Version | 日レセバージョン  <br>((M96)マスタ更新管理一覧画面のDB管理情報 ORCAver) | 040700-1 |     |
| 6   | Database\_Information | データベース情報 |     |     |
| 6-1 | Local\_Version | (M96)マスタ更新管理一覧画面のDB更新管理情報 構造Ver(自) | S-040700-1-20140527-2 |     |
| 6-2 | New\_Version | (M96)マスタ更新管理一覧画面のDB更新管理情報 構造Ver(ORCA) | S-040700-1-20140527-2 |     |
| 7   | Master\_Update\_Information | マスタ更新情報 |     |     |
| 7-1 | Last\_Update\_Date | 直近のマスタ更新実施日 | 2014-10-02 | 取得出来ない場合は「0000-00-00」を設定 |
| 7-2 | Master\_Version\_Information | マスタ構造情報  <br>(繰り返し 99) |     |     |
| 7-2-1 | Name | (M96)マスタ更新管理一覧画面のマスタ更新管理情報 マスタ | 点数マスタ |     |
| 7-2-2 | Local\_Version | (M96)マスタ更新管理一覧画面のマスタ更新管理情報 レコードver(自) | R-040700-1-20140930-1 |     |
| 7-2-3 | New\_Version | (M96)マスタ更新管理一覧画面のマスタ更新管理情報 レコードver(ORCA) | R-040700-1-20140930-1 |     |
| 8   | Program\_Update\_Information | プログラム更新情報  <br>(繰り返し 10) |     | ※１  |
| 8-1 | Date | (M97)プログラム更新管理一覧 提供日 | 2014-10-02 |     |
| 8-2 | State | (M97)プログラム更新管理一覧 処理状態 | 済   |     |
| 8-3 | Comment | (M97)プログラム更新管理一覧 内容 | 提供されている最新の状態でした。 |     |

※１：(M97)プログラム更新管理一覧 コラムリストより最大１０件返却します。

  

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

[sample\_system\_state\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_system_state_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ システム情報取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/systeminfv2")BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Request\_Date type\="string"\>2014-10-20</Request\_Date>                <Request\_Time type\="string"\>17:43:00</Request\_Time>        </private\_objects>  
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
| 0001 | リクエスト日付の設定に誤りがあります |
| 0002 | リクエスト時間の設定に誤りがあります |
| 0003 | DB管理情報が取得できません |
| 0004 | マスタ更新情報が取得できません |
| 0005 | リクエスト時間が受付時間より進んでいます |
| 0006 | リクエスト時間と受付時間に３０分以上のずれがあります |
| 0089 | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 0097 | 送信内容に誤りがあります |
| 0098 | 送信内容の読込ができませんでした |
| 0099 | ユーザIDが未登録です |
| その他 | 返却情報の編集でエラーが発生しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > システム状態の取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/systemstate.html#wrapper)

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
