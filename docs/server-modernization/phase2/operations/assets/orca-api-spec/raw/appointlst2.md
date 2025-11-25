[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#content)

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
 > 患者予約情報

API 患者予約情報
==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#errmsg)
      
    

更新履歴
----

 2017-11-27  「レスポンス一覧」に項目を追加。  

 2014-06-02  「エラーメッセージ一覧」を追加。  

概要
--

POSTメソッドによる指定患者の基準日以降の予約情報の返却を行います。

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_appointlst2\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_appointlst2\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_appointlst2\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/appointlst2v2?class=01  
    class = 01  患者予約情報取得  
Content-Type : application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  <appointlst2req type\="record"\>    <Patient\_ID type\="string"\>1</Patient\_ID>    <Base\_Date type\="string"\>2012-12-18</Base\_Date>  </appointlst2req> </data> 

### 処理概要

患者予約情報リクエストにより、指定した患者の基準日以降の予約情報の返却を行います。

### 処理詳細

1.  送信された患者番号による患者の存在チェック
2.  基準日の妥当性チェック（未設定の場合は、システム日付を設定）
3.  返却情報は最大５０件まで（返却情報の表示順は、予約画面の予約日検索と同じで予約日の降順となります）

レスポンスサンプル
---------

<xmlio2>  <appointlst2res type\="record"\>    <Information\_Date type\="string"\>2012-12-17</Information\_Date>    <Information\_Time type\="string"\>14:09:44</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Patient Info</Reskey>    <Base\_Date type\="string"\>2012-12-18</Base\_Date>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00001</Patient\_ID>      <WholeName type\="string"\>テスト　患者</WholeName>      <WholeName\_inKana type\="string"\>テスト　カンジャ</WholeName\_inKana>      <BirthDate type\="string"\>1970-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Appointlst\_Information type\="array"\>      <Appointlst\_Information\_child type\="record"\>        <Appointment\_Date type\="string"\>2012-12-22</Appointment\_Date>        <Appointment\_Time type\="string"\>11:00:00</Appointment\_Time>        <Medical\_Information type\="string"\>01</Medical\_Information>        <Medical\_Information\_WholeName type\="string"\>診察１</Medical\_Information\_WholeName>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_WholeName type\="string"\>内科</Department\_WholeName>        <Physician\_Code type\="string"\>10001</Physician\_Code>        <Physician\_WholeName type\="string"\>おるか</Physician\_WholeName>      </Appointlst\_Information\_child>      <Appointlst\_Information\_child type\="record"\>        <Appointment\_Date type\="string"\>2012-12-19</Appointment\_Date>        <Appointment\_Time type\="string"\>15:30:00</Appointment\_Time>        <Medical\_Information type\="string"\>01</Medical\_Information>        <Medical\_Information\_WholeName type\="string"\>診察１</Medical\_Information\_WholeName>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_WholeName type\="string"\>内科</Department\_WholeName>        <Physician\_Code type\="string"\>10001</Physician\_Code>        <Physician\_WholeName type\="string"\>おるか</Physician\_WholeName>      </Appointlst\_Information\_child>    </Appointlst\_Information>  </appointlst2res>  
</xmlio2>

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 1   | 必須  |
| 2   | Base\_Date | 基準日 | 2012-12-18 | （未設定の場合はシステム日付を設定） |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2012-12-17 |     |
| 2   | Information\_Time | 実施時間 | 14:09:44 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey | レスポンスキー情報 | Patient Info |     |
| 6   | Base\_Date | 基準日 | 2012-12-18 |     |
| 7   | Patient\_Information | 患者基本情報 |     |     |
| 7-1 | Patient\_ID | 患者番号 | 00001 |     |
| 7-2 | WholeName | 患者氏名 | テスト　患者 |     |
| 7-3 | WholeName\_inKana | 患者カナ氏名 | テスト　カンジャ |     |
| 7-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 7-5 | Sex | 性別  <br>（1:男性、2:女性） | 1   |     |
| 8   | Appointlst\_Information | 予約情報（繰り返し ５０） |     |     |
| 8-1 | Appointment\_Date | 予約日 | 2012-12-22 |     |
| 8-2 | Appointment\_Time | 予約時間 | 11:00:00 |     |
| 8-3 | Medical\_Information | 診療内容区分 ※１  <br>（01:診察１、02:薬のみ、03:注射のみ、04:検査のみ、05:リハビリテーション、06:健康診断、07:予防注射、99:該当なし） | 01  |     |
| 8-4 | Medical\_Information\_WholeName | 診療内容名称 | 診察１ |     |
| 8-5 | Department\_Code | 予約診療科コード ※２  <br>（01:内科） | 01  |     |
| 8-6 | Department\_WholeName | 予約診療科名称 | 内科  |     |
| 8-7 | Physician\_Code | 予約ドクターコード | 10001 |     |
| 8-8 | Physician\_WholeName | 予約ドクター名 | おるか |     |
| 8-9 | Visit\_Information | 来院情報  <br>（１：来院済） | 1   |     |
| 8-10 | Appointment\_Id | 予約ID | 01  | 追加  <br>(2017-11-27) |
| 8-11 | Appointment\_Note | 予約メモ内容 | 予約メモテスト |     |

 ※１:システム管理マスタの診療内容情報の診療内容コードを参照して下さい。

 ※２:システム管理マスタの診療科目情報の診療科コードを参照して下さい。

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

[sample\_appointlst2\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_appointlst2_v2.rb)
 (xml2)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 予約一覧取得  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/appointlst2v2?class=01")  
\# class :01 患者予約情報取得  
#  
#BODY \= <<EOF

<data>        <appointlst2req type\="record"\>                <Patient\_ID type\="string"\>1</Patient\_ID>                <Base\_Date type\="string"\>2012-12-20</Base\_Date>        </appointlst2req>  
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
| 01  | 患者番号の設定がありません |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 予約日が暦日ではありません |
| 20  | 予約対象件数が５０件以上あります |
| 21  | 対象の予約はありませんでした |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です　処理を終了して下さい |
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
 > 患者予約情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/appointlst2.html#wrapper)

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
