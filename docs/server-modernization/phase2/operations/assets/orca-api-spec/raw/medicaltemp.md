[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#content)

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
 > 中途終了患者情報一覧

中途終了患者情報一覧  

=============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#warnmsg)
      
    

更新履歴
----

2021-01-27  「レスポンス一覧」に項目を追加。  

2017-12-20  「レスポンス一覧」に項目を追加。

2014-07-03  「エラーメッセージ一覧」を追加。  
　　　　　　「警告メッセージ一覧」を追加。

概要
--

POSTメソッドによる中途終了状態の患者情報取得を行います。

日レセ Ver.4.7.0\[第19回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_tmedical\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_tmedical\_v2.rb 内の診療日等の一覧取得に必要な情報を設定します。
3.  ruby sample\_tmedical\_v2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/tmedicalgetv2 
     
Content-Type: application/xml 

application/xml の場合の文字コードは UTF-8 とします。

<data>        <tmedicalgetreq type\="record"\>                <Perform\_Date type\="string"\>2013-10-02</Perform\_Date>                <InOut type\="string"\>2</InOut>                <Department\_Code type\="string"\></Department\_Code>                <Patient\_ID type\="string"\></Patient\_ID>        </tmedicalgetreq>  
</data> 

### 処理概要

診療年月日等を指定することにより中途終了状態の患者情報の取得を行います。

### 処理詳細

1.  基準日の妥当性チェック(未設定の場合は、システム日付を設定)
2.  診療科の妥当性チェック
3.  患者番号の存在チェック
4.  返却情報は最大５００件

  

レスポンスサンプル
---------

<xmlio2>  <tmedicalgetres type\="record"\>    <Information\_Date type\="string"\>2013-10-02</Information\_Date>    <Information\_Time type\="string"\>17:33:58</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Perform\_Date type\="string"\>2013-10-02</Perform\_Date>    <InOut type\="string"\>2</InOut>    <Tmedical\_List\_Information type\="array"\>      <Tmedical\_List\_Information\_child type\="record"\>        <Patient\_Information type\="record"\>          <Patient\_ID type\="string"\>00012</Patient\_ID>          <WholeName type\="string"\>日医　太郎</WholeName>          <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>          <BirthDate type\="string"\>1975-01-01</BirthDate>          <Sex type\="string"\>1</Sex>        </Patient\_Information>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <Physician\_Code type\="string"\>10001</Physician\_Code>        <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <HealthInsurance\_Information type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>        <Medical\_Uid type\="string"\>52e4f8aa-2b3d-11e3-83c8-8c736e794c62</Medical\_Uid>        <Medical\_Time type\="string"\>17:33:33</Medical\_Time>        <Medical\_Mode type\="string"\>0</Medical\_Mode>        <Medical\_Mode2 type\="string"\>0</Medical\_Mode2>      </Tmedical\_List\_Information\_child>    </Tmedical\_List\_Information>  </tmedicalgetres>  
</xmlio2> 

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Perform\_Date | 診療日 | 2013-10-02 | 未設定はシステム日付 |
| 2   | InOut | 入院外来区分  <br>（1:入院中、2:入院外） | 2   | ※１  |
| 3   | Department\_Code | 診療科コード  <br>（01:内科） | 01  | ※２  |
| 4   | Patient\_ID | 患者番号 | 12  | ※２  |

※１：「1:入院中」以外は、入院外とします。

※２：診療科コード・患者番号は指定があれば対象とします。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-10-02 |     |
| 2   | Information\_Time | 実施時間 | 17:33:58 |     |
| 3   | Api\_Result | 結果コード | 00  |     |
| 4   | Api\_Result\_Message | 結果メッセージ | 処理終了 |     |
| 5   | Reskey | レスポンスキー情報 | Medical Info |     |
| 6   | Perform\_Date | 診療日 | 2013-10-02 |     |
| 7   | InOut | 入院外来区分 | 2   |     |
| 8   | Tmedical\_List\_Information | 中途データ一覧情報（繰り返し５００） |     |     |
| 8-1 | Patient\_Information | 患者情報 |     |     |
| 8-1-1 | Patient\_ID | 患者番号 | 00012 |     |
| 8-1-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 8-1-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 8-1-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 8-1-5 | Sex | 性別  <br>（1:男、2:女） | 1   |     |
| 8-2 | Department\_Code | 診療科コード  <br>（01:内科） | 01  |     |
| 8-3 | Department\_Name | 診療科名称 | 内科  |     |
| 8-4 | Physician\_Code | ドクターコード | 10001 |     |
| 8-5 | Physician\_WholeName | ドクター名 | 日本　一 |     |
| 8-6 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 8-7 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 8-7-1 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 8-7-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 8-7-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 8-7-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 8-7-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６ |     |
| 8-7-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 8-7-7 | PublicInsurance\_Information | 公費情報（繰り返し４） |     |     |
| 8-7-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 8-7-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 8-7-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 8-7-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 8-8 | Readmission\_Day\_In | 同日再入院区分  <br>(1:同日再入院分) |     | 追加  <br>(2017-12-20) |
| 8-9 | Medical\_Uid | API登録のUID | 52e4f8aa-2b3d-11e3-83c8-8c736e794c62 |     |
| 8-10 | Medical\_Time | 登録時間 | 17:33:33 |     |
| 8-11 | Medical\_Mode | 展開区分  <br>（1:展開中、0:以外、5:HAORI） | 0   | 値追加  <br>(2017-12-20) |
| 8-12 | Medical\_Mode2 | 登録区分  <br>（1:中途終了登録分、0:以外） | 0   | ※１  |

※１：日レセAPIで登録された場合でも、一旦日レセ画面に展開し、再度中途終了した場合（Medical\_Mode2 = 1 の状態）は、Medical\_Uidの値は消されます。  

※中途終了データを登録時間順に編集します。

※５００件以上存在した時はメッセージを返却します。

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

[sample\_tmedical\_v2.rb](http://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_tmedical_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 中途終了患者情報一覧取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/tmedicalgetv2")  
#  
\# 1.診療日          Perform\_Date        (IMPLIED)  
\# 2.入院外来区分    InOut               (IMPLIED)  
\# 3.診療科コード    Department\_Code     (IMPLIED)  
\# 4.患者番号        Patient\_ID          (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <tmedicalgetreq type\="record"\>                <Perform\_Date type\="string"\>2013-10-02</Perform\_Date>                <InOut type\="string"\>2</InOut>                <Department\_Code type\="string"\></Department\_Code>                <Patient\_ID type\="string"\></Patient\_ID>        </tmedicalgetreq>  
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
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 診療日が暦日ではありません |
| 13  | 診療科が存在しません |
| 14  | 対象が５００件以上存在します |
| 15  | 対象がありません |
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

警告メッセージ一覧
---------

| エラーコード | 警告メッセージ |
| --- | --- |
| K1  | 診療日を設定しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 中途終了患者情報一覧

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/medicaltemp.html#wrapper)

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
