[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#content)

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
 > 来院患者一覧

受診日指定による来院患者一覧  

=================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#reqsample)
    
*   [レスポンスサンプル(来院日一覧)](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#ressample)
    
*   [レスポンスサンプル(来院年月一覧)](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#ressample2)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#request)
    
*   [レスポンス一覧(来院日一覧)](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#response)
    
*   [レスポンス一覧(来院年月一覧)](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#response2)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#errmsg)
      
    

更新履歴
----

 2021-01-27  「レスポンス一覧(来院日一覧)」に項目を追加。  

 2017-12-20  「レスポンス一覧」に項目を追加。

 2017-04-26  「レスポンス一覧(来院日一覧)」に項目を追加。  
 　　　　　　　受診日指定の返却情報の最大件数を５００件から１０００件に変更。

 2014-06-23  「エラーメッセージ一覧」を追加。  

  

概要
--

POSTメソッドによる来院患者一覧の取得を行います。

日レセ Ver.4.7.0\[第17回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_visitpt\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_visitpt\_v2.rb 内の来院日付等を接続先の日レセの環境に合わせます。
3.  ruby sample\_visitpt\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/visitptlstv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

今までのAPIではURLに引数(class)を指定することで機能の選択を行っていましたが、このAPIでは引数を受け取らない仕様に変更となりました。  
その代わりに、リクエストデータ内に「Request\_Number」の項目を追加し、「Request\_Number」にリクエスト番号を指定することで機能の選択を行います。  

  

<data>　　<visitptlstreq type\="record"\>　　　　<Request\_Number type\="string"\>01</Request\_Number>　　　　<Visit\_Date type\="string"\>2003-01-14</Visit\_Date>　　　　<Department\_Code type\="string"\>01</Department\_Code>　　</visitptlstreq>  
</data>   

### 処理概要

来院患者一覧リクエストで受診日を指定することにより来院患者の情報を返却します。  
機能として以下の２つを提供します。  
  

1.  受診日指定による来院患者の返却
2.  受診月、診療科指定による来院患者の返却  
    

### 処理詳細

1.  基準日の妥当性チェック（未設定の場合は、システム日付を設定）  
    
2.  診療科の妥当性チェック  
    
3.  返却情報は、受診日指定の場合は最大５００件。(2017-04-26 パッチ適用以降１０００件)  
    受診月指定の場合は最大２０００件。

レスポンスサンプル(来院日一覧)
----------------

<xmlio2>  <visitptlst01res type\="record"\>     <Information\_Date type\="string"\>2013-09-06</Information\_Date>     <Information\_Time type\="string"\>13:29:09</Information\_Time>     <Api\_Result type\="string"\>00</Api\_Result>     <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>     <Reskey type\="string"\>Medical Info</Reskey>     <Visit\_Date type\="string"\>2003-01-14</Visit\_Date>     <Visit\_List\_Information type\="array"\>       <Visit\_List\_Information\_child type\="record"\>         <Patient\_Information type\="record"\>           <Patient\_ID type\="string"\>00012</Patient\_ID>          <WholeName type\="string"\>日医　太郎</WholeName>          <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>          <BirthDate type\="string"\>1975-01-01</BirthDate>          <Sex type\="string"\>1</Sex>        </Patient\_Information>        <Department\_Code type\="string"\>01</Department\_Code>         <Department\_Name type\="string"\>内科</Department\_Name>         <Physician\_Code type\="string"\>10001</Physician\_Code>         <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>         <Voucher\_Number type\="string"\>0020672</Voucher\_Number>         <Sequential\_Number type\="string"\>1</Sequential\_Number>         <Insurance\_Combination\_Number type\="string"\>0003</Insurance\_Combination\_Number>         <HealthInsurance\_Information type\="record"\>           <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>           <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>           <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>           <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>           <HealthInsuredPerson\_Number type\="string"\>１２３４５</HealthInsuredPerson\_Number>           <PublicInsurance\_Information type\="array"\>             <PublicInsurance\_Information\_child type\="record"\>               <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>               <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>               <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>               <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>             </PublicInsurance\_Information\_child>           </PublicInsurance\_Information>         </HealthInsurance\_Information>       </Visit\_List\_Information\_child>    </Visit\_List\_Information>  </visitptlst01res>  
</xmlio2>

レスポンスサンプル(来院年月一覧)
-----------------

<xmlio2>  <visitptlst02res type\="record"\>    <Information\_Date type\="string"\>2013-09-06</Information\_Date>    <Information\_Time type\="string"\>13:45:09</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Visit\_Date type\="string"\>2003-01</Visit\_Date>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_Name type\="string"\>内科</Department\_Name>    <Visit\_List\_Information type\="array"\>      <Visit\_List\_Information\_child type\="record"\>        <Patient\_Information type\="record"\>          <Patient\_ID type\="string"\>00012</Patient\_ID>          <WholeName type\="string"\>日医　太郎</WholeName>          <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>          <BirthDate type\="string"\>1975-01-01</BirthDate>          <Sex type\="string"\>1</Sex>        </Patient\_Information>        <Visit\_Calendar type\="string"\>0000000100000001000000000000000</Visit\_Calendar>      </Visit\_List\_Information\_child>    </Visit\_List\_Information>   </visitptlst02res> </xmlio2> 

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 01: 来院日の受診履歴取得  <br>02: 来院年月の受診履歴取得 |
| 2   | Visit\_Date | 来院日付 | 2003-01-14 | 未設定はシステム日付  <br>※２ |
| 3   | Department\_Code | 診療科コード ※１  <br>(01:内科) | 01  | class=02のみ必須  <br>※３ |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：来院年月指定時は、日のチェックは行いません。暦日チェックは日=1で行います。

※３：指定された診療科を対象とします。

  

レスポンス一覧(来院日一覧)
--------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-09-06 |     |
| 2   | Information\_Time | 実施時間 | 13:29:09 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Visit\_Date | 来院日付 | 2003-01-14 |     |
| 7   | Visit\_List\_Information | 来院一覧情報 (繰り返し 500) |     | (2017-04-26 パッチ適用以降 繰り返し1000) |
| 7-1 | Patient\_Information | 患者情報 |     |     |
| 7-1-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-1-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 7-1-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 7-1-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 7-1-5 | Sex | 性別  <br>(1:男、2:女) | 1   |     |
| 7-2 | Department\_Code | 診療科コード　※１  <br>(01:内科) | 01  |     |
| 7-3 | Department\_Name | 診療科名称 | 内科  |     |
| 7-4 | Physician\_Code | ドクターコード | 10001 |     |
| 7-5 | Physician\_WholeName | ドクター名 | 日本　一 |     |
| 7-6 | Voucher\_Number | 伝票番号 | 0020672 |     |
| 7-7 | Sequential\_Number | 連番  | 1   | 診療科毎の同日連番 |
| 7-8 | Insurance\_Combination\_Number | 保険組合せ番号 | 0003 |     |
| 7-9 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 7-9-1 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 7-9-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 7-9-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 7-9-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 7-9-5 | HealthInsuredPerson\_Number | 番号  | １２３４５ |     |
| 7-9-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 7-9-7 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 7-9-7-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 7-9-7-2 | PublicInsurance\_Name | 公費の制度名称 | 感37の2 |     |
| 7-9-7-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 7-9-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 7-10 | Update\_Date | 更新日付 |     | 追加  <br>(2017-04-26) |
| 7-11 | Update\_Time | 更新時間 |     | 追加  <br>(2017-04-26) |
| 7-12 | Patient\_Update\_Date | 患者情報更新日 |     | 追加  <br>(2017-12-20) |
| 7-13 | Patient\_Update\_Time | 患者情報更新時間 |     | 追加  <br>(2017-12-20) |

※来院日付の受診履歴テーブル内容を伝票番号順に編集します。  
　包括保険（9999）は対象外となります。  

※伝票番号は受診履歴を削除後、再度登録した場合は新しい番号となります。  
　また、会計照会・外来まとめで一括して入力した場合も伝票番号を一括で採番します。  

※５００件以上存在した時はメッセージを返却します。(2017-04-26 パッチ適用以降１０００件)  

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

レスポンス一覧(来院年月一覧)  

------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-09-06 |     |
| 2   | Information\_Time | 実施時間 | 13:45:09 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Visit\_Date | 来院日付 | 2003-01 |     |
| 7   | Department\_Code | 診療科コード ※１  <br>(01:内科) | 01  |     |
| 8   | Department\_Name | 診療科名称 | 内科  |     |
| 9   | Visit\_List\_Information | 来院一覧情報 (繰り返し 2000) |     |     |
| 9-1 | Patient\_Information | 患者情報 |     |     |
| 9-1-1 | Patient\_ID | 患者番号 | 00012 |     |
| 9-1-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 9-1-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 9-1-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 9-1-5 | Sex | 性別  <br>(1:男、2:女) | 1   |     |
| 9-2 | Visit\_Calendar | 来院日カレンダー | 0000000100000001000000000000000 | ※２  |

※来院年月・診療科から受診履歴を決定し、患者番号順に来院日を編集します。  
　包括保険（9999）は対象外となります。  

※２０００件以上存在した時はメッセージを返却します。

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：来院した日に1を、以外に0を編集します。  
　　　例：（２日・４日に来院があれば　0101000000000000000000000000000）

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

[sample\_visitpt\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_visitpt_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/visitptlstv2")  
\# Request\_Number :01 来院日の受診履歴取得  
\# Request\_Number :02 来院年月の受診履歴取得  
#  
\# 1.来院日付        Visit\_Date      (IMPLIED)  
\# 2.診療科コード    Department\_Code (REQUIRED class=02のみ)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <visitptlstreq type\="record"\>                <Request\_Number type\="string"\>01</Request\_Number>                <Visit\_Date type\="string"\>2003-01-14</Visit\_Date>                <Department\_Code type\="string"\>01</Department\_Code>        </visitptlstreq>  
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
| 01  | 診療科未設定 |
| 10  | 診療日設定誤り |
| 11  | 診療科コード誤り |
| 12  | 対象が５００件以上存在します。(2017-04-26 パッチ適用以降１０００件) |
| 13  | 対象がありません |
| 14  | 対象が２０００件以上存在します。 |
| K1  | 診療日を設定しました |
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
 > 来院患者一覧

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/visitpatient.html#wrapper)

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
