[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#content)

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
 > 初診算定日登録

初診算定日登録
=======

メニュー
----

*   [初診算定日登録機能（URL:/api21/medicalmodv23）](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#api1)
    

*   [検索機能   Request\_Number=00](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#request00)
    
*   [登録機能   Request\_Number=01](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#request01)
      
    
*   [削除機能   Request\_Number=02](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#request02)
    
*   [レイアウト資料(PDF)](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#layout)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#rubysample)
      
    

初診算定日登録（URL:/api21/medicalmodv23）
---------------------------------

初診算定日の登録がない患者に対し初診算定日の登録を可能とします。

Request\_Numberにより、検索・登録・削除の指示が可能です。

### 検索機能   Request\_Number=00  

患者番号を設定することにより、その患者の初診算定日、初回来院日（受診履歴の最初の日）、最終来院日を取得しその値を返却します。  
 (検索機能では、リクエストNo および患者番号のみの設定が必須となります。)

該当患者に初診算定日(初診料の算定履歴登録)が登録済の場合は、登録不可の旨をメッセージ設定し返却します。  

リクエストサンプル

<data>  
	<medicalv2req3 type="record">  
		<Request\_Number type="string">00</Request\_Number>  
		<Patient\_ID type="string">105</Patient\_ID>  
		<Department\_Code type="string"></Department\_Code>  
		<First\_Calculation\_Date type="string"></First\_Calculation\_Date>  
		<FirstVisit\_Date type="string"></FirstVisit\_Date>  
		<LastVisit\_Date type="string"></LastVisit\_Date>  
	</medicalv2req3>  
</data>  

レスポンスサンプル（正常終了）

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <medicalv2res3 type="record">  
    <Information\_Date type="string">2018-10-22</Information\_Date>  
    <Information\_Time type="string">14:49:22</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">検索処理終了</Api\_Result\_Message>  
    <Reskey type="string">Medical Info</Reskey>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00105</Patient\_ID>  
      <WholeName type="string">テスト　コウヒ３</WholeName>  
      <WholeName\_inKana type="string">テスト　コウヒ３</WholeName\_inKana>  
      <BirthDate type="string">1983-01-01</BirthDate>  
      <Sex type="string">1</Sex>  
    </Patient\_Information>  
  </medicalv2res3>  
</xmlio2>  

レスポンスサンプル（初診算定日が登録済の場合）  

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <medicalv2res3 type\="record"\>    <Information\_Date type\="string"\>2018-10-22</Information\_Date>    <Information\_Time type\="string"\>14:58:43</Information\_Time>    <Api\_Result type\="string"\>WK1</Api\_Result>    <Api\_Result\_Message type\="string"\>初診料が算定済みです。初診算定日の登録はできません。</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00105</Patient\_ID>      <WholeName type\="string"\>テスト　コウヒ３</WholeName>      <WholeName\_inKana type\="string"\>テスト　コウヒ３</WholeName\_inKana>      <BirthDate type\="string"\>1983-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <First\_Calculation\_Date type\="string"\>2018-08-01</First\_Calculation\_Date>    <LastVisit\_Date type\="string"\>2018-08-01</LastVisit\_Date>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_Name type\="string"\>内科</Department\_Name>  </medicalv2res3>  
</xmlio2>  

### 登録機能   Request\_Number=01

患者番号、初診算定日、診療科、最終来院日を設定します。

この時点で、他端末での使用確認のため排他チェックを行います。  

最終来院日は、初回来院日がない場合（受診履歴が1件も存在しない）のみ有効となります。  
初回来院日がなく最終来院日の送信もない時は、初診算定日を最終来院日として設定します。

診療科が必要となるのは、初回来院日・最終来院日のない場合のみとなります。  
設定されたした診療科で診療科履歴を登録します。  
初回来院日、最終来院日があれば登録済みの診療科履歴の初回算定日を変更し登録します。

初診算定日 > 初回来院日は登録できないのでエラーとします。  
(初回来院日より後の日付で初診料算定日を設定する場合は初診料ダミーのみ診療行為から登録します。）

更新処理を行います。  
初診算定日で初診料ダミーを算定履歴に登録します。  
診療科履歴の更新処理を行います。

登録後の初診算定日、最終来院日を返却します。

リクエストサンプル  

<data>  
	<medicalv2req3 type="record">  
		<Request\_Number type="string">01</Request\_Number>  
		<Patient\_ID type="string">105</Patient\_ID>  
		<Department\_Code type="string">01</Department\_Code>  
		<First\_Calculation\_Date type="string">2018-08-01</First\_Calculation\_Date>  
		<FirstVisit\_Date type="string">2018-07-10</FirstVisit\_Date>  
		<LastVisit\_Date type="string">2018-08-01</LastVisit\_Date>  
	</medicalv2req3>  
</data>  

レスポンスサンプル（正常終了）

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <medicalv2res3 type="record">  
    <Information\_Date type="string">2018-10-22</Information\_Date>  
    <Information\_Time type="string">14:57:19</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">登録処理終了</Api\_Result\_Message>  
    <Reskey type="string">Medical Info</Reskey>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00105</Patient\_ID>  
      <WholeName type="string">テスト　コウヒ３</WholeName>  
      <WholeName\_inKana type="string">テスト　コウヒ３</WholeName\_inKana>  
      <BirthDate type="string">1983-01-01</BirthDate>  
      <Sex type="string">1</Sex>  
    </Patient\_Information>  
    <First\_Calculation\_Date type="string">2018-08-01</First\_Calculation\_Date>  
    <LastVisit\_Date type="string">2018-08-01</LastVisit\_Date>  
    <Department\_Code type="string">01</Department\_Code>  
    <Department\_Name type="string">内科</Department\_Name>  
  </medicalv2res3>  
</xmlio2>  

### 削除機能   Request\_Number=02  

患者番号のみを設定します。

この時点で、他端末での使用確認のため排他チェックを行います。

初診料の算定履歴が1件しか存在しない場合のみ、初診料の削除を行います。

※　削除できるのは、Request\_Number=01で登録した初診算定日、またはデータ移行した初診算定日のみです。

算定履歴の初診料コードが診療行為情報に登録されている場合には削除できません。

削除処理を行います。  
算定履歴の初診料コードを削除後、診療科履歴の更新処理を行います。

リクエストサンプル  

<data>  
	<medicalv2req3 type="record">  
		<Request\_Number type="string">02</Request\_Number>  
		<Patient\_ID type="string">105</Patient\_ID>  
		<Department\_Code type="string"></Department\_Code>  
		<First\_Calculation\_Date type="string"></First\_Calculation\_Date>  
		<FirstVisit\_Date type="string"></FirstVisit\_Date>  
		<LastVisit\_Date type="string"></LastVisit\_Date>  
	</medicalv2req3>  
</data>  

レスポンスサンプル（正常終了）

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <medicalv2res3 type="record">  
    <Information\_Date type="string">2018-10-22</Information\_Date>  
    <Information\_Time type="string">15:00:01</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">削除処理終了</Api\_Result\_Message>  
    <Reskey type="string">Medical Info</Reskey>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00105</Patient\_ID>  
      <WholeName type="string">テスト　コウヒ３</WholeName>  
      <WholeName\_inKana type="string">テスト　コウヒ３</WholeName\_inKana>  
      <BirthDate type="string">1983-01-01</BirthDate>  
      <Sex type="string">1</Sex>  
    </Patient\_Information>  
    <Department\_Code type="string">01</Department\_Code>  
    <Department\_Name type="string">内科</Department\_Name>  
  </medicalv2res3>  
</xmlio2>  

### レイアウト資料(PDF)  

[api21\_medicalmodv23.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api21_medicalmodv23.pdf)
  
[api21\_medicalmodv23\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api21_medicalmodv23_err.pdf)

### Rubyによるリクエストサンプルソース

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    

Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
サンプルソース内に以下の一行が記述されていることを確認して下さい。

\# -\*- coding: utf-8 -\*-  

[sample\_medicalmodv23\_request00.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicalmodv23_request00.rb)
  
[sample\_medicalmodv23\_request01.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicalmodv23_request01.rb)
  
[sample\_medicalmodv23\_request02.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicalmodv23_request02.rb)
  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 初診算定日登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/first_calculation_date.html#wrapper)

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
