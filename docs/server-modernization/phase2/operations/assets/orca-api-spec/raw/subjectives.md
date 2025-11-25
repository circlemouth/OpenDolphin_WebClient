[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#content)

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
 > 症状詳記

API 症状詳記  

===========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#warnmsg)
      
    

更新履歴
----

2021-01-27  「リクエスト一覧」に項目を追加。  
　　　　　　「レスポンス一覧」に項目を追加。  

2014-07-24  「エラーメッセージ一覧」を追加。  
　　　　　　「警告メッセージ一覧」を追加。  
　　　　　　「レスポンス一覧」に警告メッセージ格納用項目を追加。  
　　　　　　「リクエスト(POSTリクエスト)サンプル」の処理詳細を修正。

2014-07-23  「リクエスト(POSTリクエスト)サンプル」のリクエストサンプルを修正。  
　　　　　　「Rubyによるリクエストサンプルソース」のリクエストサンプルを修正。  
　　　　　　「リクエスト一覧」を修正。  

概要
--

POSTメソッドによる患者症状詳記の登録/削除を行います。

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_subjectmod\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_subjectmod\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_subjectmod\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca25/subjectivesv2?class=01  
    class = 01  症状詳記登録  
    class = 02  症状詳記削除  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  <subjectivesmodreq type\="record"\>    <InOut type\="string"\>O</InOut>    <Patient\_ID type\="string"\>12</Patient\_ID>    <Perform\_Date type\="string"\></Perform\_Date>    <Department\_Code type\="string"\>01</Department\_Code>    <Insurance\_Combination\_Number type\="string"\></Insurance\_Combination\_Number>    <HealthInsurance\_Information type\="record"\>      <InsuranceProvider\_Class type\="string"\></InsuranceProvider\_Class>      <InsuranceProvider\_WholeName type\="string"\></InsuranceProvider\_WholeName>      <InsuranceProvider\_Number type\="string"\></InsuranceProvider\_Number>      <HealthInsuredPerson\_Symbol type\="string"\></HealthInsuredPerson\_Symbol>      <HealthInsuredPerson\_Number type\="string"\></HealthInsuredPerson\_Number>      <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>      <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>      <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>      <HealthInsuredPerson\_WholeName type\="string"\></HealthInsuredPerson\_WholeName>      <Certificate\_StartDate type\="string"\></Certificate\_StartDate>      <Certificate\_ExpiredDate type\="string"\></Certificate\_ExpiredDate>      <PublicInsurance\_Information type\="array"\>        <PublicInsurance\_Information\_child type\="record"\>          <PublicInsurance\_Class type\="string"\></PublicInsurance\_Class>          <PublicInsurance\_Name type\="string"\></PublicInsurance\_Name>          <PublicInsurer\_Number type\="string"\></PublicInsurer\_Number>          <PublicInsuredPerson\_Number type\="string"\></PublicInsuredPerson\_Number>          <Certificate\_IssuedDate type\="string"\></Certificate\_IssuedDate>          <Certificate\_ExpiredDate type\="string"\></Certificate\_ExpiredDate>        </PublicInsurance\_Information\_child>      </PublicInsurance\_Information>    </HealthInsurance\_Information>    <Subjectives\_Detail\_Record type\="string"\>07</Subjectives\_Detail\_Record>    <Subjectives\_Code type\="string"\>その他コメント</Subjectives\_Code>  </subjectivesmodreq>  
</data>

### 処理概要

症状詳記リクエストにより、患者症状詳記の登録または削除を行います。

### 処理詳細

登録時

1.  診療日付が未設定の時は、システム日付を診療年月とします
2.  保険組合せ番号が空白の時、保険・公費情報から保険組合せを決定します。  
    保険組合せが決定できない時は、保険組合せを「0000」とします。
3.  保険組合せが「0000」以外の時、保険組合せが診療年月で有効期間外であれば警告メッセージを返却します。  
    送信された保険組合せ番号が存在しない時のみ、エラーとなります。
4.  保険組合せがアフターケアである時、診療年月日で受診履歴の登録が無ければエラーとします。  
    診療科の設定があれば、診療科も判定します。  
    アフターケア以外は受診の有無は判定しません。受診が無い保険でのレセコメントはレセプトで無視されます。
5.  詳記区分は２桁で設定します。存在しない場合はエラーとします。
6.  症状詳記内容は、半角文字、外字の全角変換を行います。  
    送信された内容と登録した内容が一致しない場合は、メッセージを返却します。
7.  患者番号、診療年月、入外区分、診療科、保険組合せ、診療日、詳記区分でレセコメントレコードが既に登録されている場合は、「連番+1」で追加登録します。  
    ※診療日はアフターケア以外は必要ありません。  
    ※置き換えはできません。
8.  登録時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却  
      
    

削除時  

1.  保険組合せ番号が空白の時、登録処理と同じように保険組合せを決定します。
2.  患者番号、診療年月、入外区分、診療科、保険組合せ、診療日、詳記区分で登録されているレセコメントレコードをすべて削除します。  
    複数の連番がある場合もすべて削除します。  
    削除した件数を連番に返却します。また、１件目の削除内容を症状詳記内容に返却します。
3.  削除時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却

  ※排他制御は、病名(C02)で行なっていますので、システム管理が排他制御しないとなっている場合は、排他チェックは行いません。  

レスポンスサンプル
---------

<xmlio2>  <subjectivesmodres type\="record"\>    <Information\_Date type\="string"\>2014-07-04</Information\_Date>    <Information\_Time type\="string"\>11:35:33</Information\_Time>    <Api\_Result type\="string"\>K1</Api\_Result>    <Api\_Result\_Message type\="string"\>レセコメント登録終了</Api\_Result\_Message>    <Api\_Warning\_Message\_Information type\="array"\>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>診療年月を設定しました。</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>保険組合せを００００で設定しました。</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>    </Api\_Warning\_Message\_Information>    <Reskey type\="string"\>Acceptance\_Info</Reskey>    <InOut type\="string"\>O</InOut>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Perform\_Date type\="string"\>2014-07</Perform\_Date>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_WholeName type\="string"\>内科</Department\_WholeName>    <Insurance\_Combination\_Number type\="string"\>0000</Insurance\_Combination\_Number>    <Subjectives\_Number type\="string"\>01</Subjectives\_Number>    <Subjectives\_Detail\_Record type\="string"\>07</Subjectives\_Detail\_Record>    <Subjectives\_Detail\_Record\_WholeName type\="string"\>その他（１）</Subjectives\_Detail\_Record\_WholeName>    <Subjectives\_Code type\="string"\>その他コメント</Subjectives\_Code>  </subjectivesmodres>  
</xmlio2>  
  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | InOut | 入外区分  <br>（I:入院、それ以外:入院外） | I   | 必須  |
| 2   | Patient\_ID | 患者番号 | 12  | 必須  |
| 3   | Perform\_Date | 診療年月 | 2012-12 | （アフターケアの場合は、受診日を入力） |
| 4   | Department\_Code | 診療科コード ※１  <br>（01:内科) | 01  | 必須  |
| 5   | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 6   | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 6-1 | InsuranceProvider\_Class | 保険の種類  <br>（060:国保） | 060 | ※２  |
| 6-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※２  |
| 6-3 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※２  |
| 6-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 6-5 | HealthInsuredPerson\_Number | 番号  | １２３４５ |     |
| 6-6 | HealthInsuredPerson\_Branch\_Number | 枝番  |     | 追加  <br>(2021-01-27) |
| 6-7 | HealthInsuredPerson\_Continuation | 継続区分  <br>（1:継続療養、2:任意継続） | 3   |     |
| 6-8 | HealthInsuredPerson\_Assistance | 補助区分  <br>（詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい） |     |     |
| 6-9 | RelationToInsuredPerson | 本人家族区分  <br>（1:本人、2:家族） | 1   |     |
| 6-10 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 6-11 | Certificate\_StartDate | 適用開始日 | 2012-12-17 |     |
| 6-12 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 6-13 | PublicInsurance\_Information | 公費情報（繰り返し ４） |     |     |
| 6-13-1 | PublicInsurance\_Class | 公費の種類 | 010 | ※２  |
| 6-13-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ | ※２  |
| 6-13-3 | PublicInsurer\_Number | 負担者番号 | 10131142 | ※２  |
| 6-13-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | ※２  |
| 6-13-5 | Certificate\_IssuedDate | 適用開始日 | 2012-12-17 |     |
| 6-13-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7   | Subjectives\_Detail\_Record | 詳記区分 | 07  | 必須  |
| 8   | Subjectives\_Code | 症状詳記内容 | その他コメント | 必須（登録時のみ） |

 ※１:システム管理マスタの診療科目情報の診療科コードを参照して下さい  
 　　 診療科の指定は、特に必要無ければ「00(全科)」を設定して下さい。  

 ※２:一箇所でも設定されていれば、一致する保険組合せが対象に設定されます。一致する保険組合せが無い(不正)場合は、0000が設定されます。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-07-04 |     |
| 2   | Information\_Time | 実施時間 | 11:35:33 |     |
| 3   | Api\_Result | 結果コード | K1  | 警告メッセージが複数の場合は、最初の警告メッセージのエラーコードを返却 |
| 4   | Api\_Result\_Message | 結果メッセージ | レセコメント登録終了 |     |
| 5   | Api\_Warning\_Message\_Information | 警告メッセージ情報（繰り返し　５） |     | 追加  <br>(2014-07-24) |
| 5-1 | Api\_Warning\_Message | 警告メッセージ | 診療年月を設定しました | 追加  <br>(2014-07-24) |
| 6   | Reskey | レスポンスキー情報 | Acceptance\_Info |     |
| 7   | InOut | 入外区分  <br>（I:入院、それ以外:入院外） | O   |     |
| 8   | Patient\_Information | 患者情報 |     |     |
| 8-1 | Patient\_ID | 患者番号 | 00012 |     |
| 8-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 8-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 8-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 8-5 | Sex | 性別  <br>（1:男性、2:女性） | 1   |     |
| 9   | Perform\_Date | 診療年月 | 2014-07 |     |
| 10  | Department\_Code | 診療科コード ※１  <br>（01:内科） | 01  |     |
| 11  | Department\_WholeName | 診療科名称 | 内科  |     |
| 12  | Insurance\_Combination\_Number | 保険組合せ番号 | 0000 |     |
| 13  | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 13-1 | InsuranceProvider\_Class | 保険の種類  <br>（060:国保） | 060 |     |
| 13-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 13-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 13-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 13-5 | HealthInsuredPerson\_Number | 番号  | １２３４５ |     |
| 13-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 13-7 | HealthInsuredPerson\_Continuation | 継続区分  <br>（1:継続療養、2:任意継続） |     |     |
| 13-8 | HealthInsuredPerson\_Assistance | 補助区分  <br>（詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい） | 3   |     |
| 13-9 | HealthInsuredPerson\_Assistance\_WholeName | 補助区分名称 ※２ | ３割  |     |
| 13-10 | RelationToInsuredPerson | 本人家族区分  <br>（1:本人、2:家族） | 1   |     |
| 13-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 13-12 | Certificate\_StartDate | 適用開始日 | 2012-12-17 |     |
| 13-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 13-14 | PublicInsurance\_Information | 公費情報 （繰り返し ４） |     |     |
| 13-14-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 13-14-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ |     |
| 13-14-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 13-14-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 13-14-5 | Rate\_Admission | 入院ー負担率（割） | 0.05 |     |
| 13-14-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 13-14-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.05 |     |
| 13-14-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 13-14-9 | Certificate\_IssuedDate | 適用開始日 | 2012-12-17 |     |
| 13-14-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 14  | Subjectives\_Number | 連番  | 01  |     |
| 15  | Subjectives\_Detail\_Record | 詳記区分 | 07  |     |
| 16  | Subjectives\_Detail\_Record\_WholeName | 詳記区分名称 | その他（１） |     |
| 17  | Subjectives\_Code | 症状詳記内容 | その他コメント |     |

 ※１:システム管理マスタの診療科目情報の診療科コードを参照して下さい。

 ※２:患者登録画面で表示する補助区分の名称。自費保険は表示しません（課税・非課税のため）。

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

[sample\_subjectmod\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_subjectmod_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 症状詳記  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca25/subjectivesv2?class=01")  
\# class :01 症状詳記登録  
\# class :02 症状詳記削除  
#  
#BODY \= <<EOF

<data>        <subjectivesmodreq type\="record"\>                <InOut type\="string"\>O</InOut>                <Patient\_ID type\="string"\>3999</Patient\_ID>                <Perform\_Date type\="string"\>2012-12</Perform\_Date>                <Department\_Code type\="string"\>01</Department\_Code>                <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>                <HealthInsurance\_Information type\="record"\>                        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\>１２３４５</HealthInsuredPerson\_Number>                        <HealthInsuredPerson\_Continuation type\="string"\>3</HealthInsuredPerson\_Continuation>                        <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>                        <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>                        <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>                        <Certificate\_StartDate type\="string"\>2012-12-17</Certificate\_StartDate>                        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                        <PublicInsurance\_Information type\="array"\>                                <PublicInsurance\_Information\_child type\="record"\>                                        <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>                                        <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>                                        <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>                                        <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                        <Certificate\_IssuedDate type\="string"\>2012-12-17</Certificate\_IssuedDate>                                        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                                </PublicInsurance\_Information\_child>                        </PublicInsurance\_Information>                </HealthInsurance\_Information>                <Subjectives\_Detail\_Record type\="string"\>07</Subjectives\_Detail\_Record>                <Subjectives\_Code type\="string"\>その他コメント</Subjectives\_Code>        </subjectivesmodreq>  
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
| 01  | 患者番号が未設定です |
| 02  | 診療科が未設定です |
| 03  | 症状詳記区分が未設定です |
| 04  | 症状詳記内容が未設定です |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 診療日付が暦日ではありません |
| 12  | 診療科が存在しません |
| 13  | 症状詳記区分が存在しません |
| 17  | 削除対象の症状詳記がありません |
| 20  | アフターケアは診療日付を設定して下さい |
| 25  | 保険組合せが存在しません |
| 26  | 該当の受診履歴がありません。アフターケアの登録はできません |
| 30  | 症状詳記の連番が９９件以上となります。登録できません |
| 51  | 症状詳記登録エラー |
| 52  | 症状詳記削除エラー |
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
| K1  | 診療年月を設定しました |
| K2  | 保険組合せを００００で設定しました |
| K3  | 期間外の保険組合せで登録しました |
| K4  | 症状詳記内容を変更しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 症状詳記

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/subjectives.html#wrapper)

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
