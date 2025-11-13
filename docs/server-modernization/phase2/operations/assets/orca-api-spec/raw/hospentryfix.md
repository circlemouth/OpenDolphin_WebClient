[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#content)

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
 > 入院登録変更

入院登録変更
======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#errmsg)
      
    

更新履歴
----

 2017-03-14   「エラーメッセージ一覧」を追加。

 2016-01-26   「リクエスト一覧」に項目を追加。  
　　　　　　　　分娩区分を追加。  
　　　　　　　　直接支払制度利用区分を追加。  
　　　　　　　「レスポンス一覧」に項目を追加。  
　　　　　　　　分娩区分を追加。  
　　　　　　　　直接支払制度利用区分を追加。

概要
--

POSTメソッドにより入院登録の変更を行います。

日レセ Ver.4.7.0\[第46回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式となります。

テスト方法
-----

1.  参考提供されている sample\_hsptinfmod\_v2\_henko.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptinfmod\_v2\_henko.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptinfmod\_v2\_henko.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsptinfmodv2  
  
Request\_Number:  
    03: 入院登録変更  
      
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

  

<data>    <private\_objects type\="record"\>        <Save\_Request type\="string"\></Save\_Request>        <Request\_Number type\="string"\>03</Request\_Number>        <Patient\_ID type\="string"\>12</Patient\_ID>        <Admission\_Date type\="string"\>2015-03-24</Admission\_Date>        <Doctor\_Code type\="array"\>            <Doctor\_Code\_child type\="string"\>10001</Doctor\_Code\_child>        </Doctor\_Code>        <Recurring\_Billing type\="string"\>3</Recurring\_Billing>    </private\_objects>  
</data>  

### 処理概要

変更リクエストにより指定患者の入院登録の変更処理を行います。

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>　0：残さない  <br>　1：残す | 1   | 未設定時初期値\[0\]を設定  <br>（日レセにリクエストの情報を保持するか否かを指定） |
| 2   | Request\_Number | リクエスト番号  <br>　03：入院登録変更 | 03  | 必須  |
| 3   | Patient\_ID | 患者番号 | 12  | 必須  |
| 4   | Admission\_Date | 入院日 | 2014-06-03 | 必須  |
| 5   | Doctor\_Code | ドクターコード  <br>(最大３件) | 10001 | 未設定時は未設定として登録 |
| 6   | Delivery | 分娩区分  <br>　0：分娩入院でない  <br>　1：正常分娩  <br>　2：異常分娩 |     | 未設定時は変更なしとする  <br>※１  <br>追加（2016-01-26） |
| 7   | Direct\_Payment | 直接支払制度利用区分  <br>　0：利用しない  <br>　1：利用する |     | 未設定時は変更なしとする  <br>※１  <br>追加（2016-01-26） |
| 8   | Recurring\_Billing | 定期請求区分  <br>　1：医療機関での設定  <br>　2：月末時のみ請求  <br>　3：定期請求しない | 3   | 未設定時は変更なしとする |
| 9   | Search\_Function | 検索時患者表示  <br>　1：表示可  <br>　2：表示不可 | 1   | 未設定時は変更なしとする |

 ※１：システム管理 \[1005 診療科目情報\] で \[レセ電診療科コード\] に"23"（産婦人科）か"24"（産科）の設定がある診療科に入院している場合に設定を行なって下さい。  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-03-24 |     |
| 2   | Information\_Time | 実施時間 | 15:16:17 |     |
| 3   | Api\_Results | 結果情報  <br>(繰り返し １０) |     |     |
| 3-1 | Api\_Result | 結果コード(ゼロ以外エラー) | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 03  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 変更  |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別  <br>(1：男性、2：女性) | 1   |     |
| 6   | Hospital\_Stay\_Infomation | 入退院情報 |     |     |
| 6-1 | History\_Number | 履歴番号 | 002 |     |
| 6-2 | Creation\_Type | 入院歴作成区分 |     |     |
| 6-2-1 | Label | 内容の名称を返却 | 入院歴作成区分 |     |
| 6-2-2 | Data | コードを返却 | 0   |     |
| 6-2-3 | Name | 内容を返却  <br>　0：通常登録 | 通常登録 |     |
| 6-3 | Admission\_Date | 入院日 | 2015-03-24 |     |
| 6-4 | Last\_Update\_Date | 前回異動日 |     |     |
| 6-5 | Ward\_Number | 病棟番号 |     |     |
| 6-5-1 | Label | 内容の名称を返却 | 病棟番号 |     |
| 6-5-2 | Data | 病棟番号を返却 | 01  |     |
| 6-6 | Ward\_Name | 病棟名 |     |     |
| 6-6-1 | Label | 内容の名称を返却 | 病棟名 |     |
| 6-6-2 | Data | 病棟名を返却 | 北病棟 |     |
| 6-7 | Room\_Number | 病室番号 |     |     |
| 6-7-1 | Label | 内容の名称を返却 | 病室番号 |     |
| 6-7-2 | Data | 病室番号を返却 | 101 |     |
| 6-8 | Department\_Code | 診療科 |     |     |
| 6-8-1 | Label | 内容の名称を返却 | 診療科 |     |
| 6-8-2 | Data | 診療科コードを返却 | 01  |     |
| 6-8-3 | Name | 診療科名称を返却 | 内科  |     |
| 6-9 | Doctor | 担当医（繰り返し　３） |     |     |
| 6-9-1 | Label | 内容の名称を返却 | 担当医 |     |
| 6-9-2 | Data | ドクターコードを返却 | 10001 |     |
| 6-9-3 | Name | 担当医の氏名を返却 | 日本　一 |     |
| 6-10 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 6-10-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 |     |
| 6-10-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 6-10-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 6-10-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 6-10-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 6-10-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 6-10-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 6-10-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 6-10-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 6-10-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 6-10-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 6-11 | First\_Admission\_Date | 初回入院日 | 2015-03-24 |     |
| 6-12 | Moving\_From\_Nursing | 介護からの異動 |     |     |
| 6-12-1 | Label | 内容の名称を返却 | 介護からの異動 |     |
| 6-12-2 | Data | コードを返却 | 1   |     |
| 6-12-3 | Name | 内容を返却  <br>　1：対象外  <br>　2：急性増悪により | 対象外 |     |
| 6-13 | Room\_Charge | 室料差額 |     |     |
| 6-13-1 | Label | 内容の名称を返却 | 室料差額 |     |
| 6-13-2 | Data | 室料差額を返却 | 1000 |     |
| 6-13-3 | Name | 単位（円） | 円   |     |
| 6-14 | Over\_180days\_Hospital\_Stay | 選定入院 |     |     |
| 6-14-1 | Label | 内容の名称を返却 | 選定入院 |     |
| 6-14-2 | Data | コードを返却 | 1   |     |
| 6-14-3 | Name | 内容を返却  <br>　1：選定対象、  <br>　2：選定対象外 | 選定対象 |     |
| 6-15 | Hospital\_Charge | 入院日の入院料 |     |     |
| 6-15-1 | Label | 内容の名称を返却 | 入院日の入院料 |     |
| 6-15-2 | Data | 入院料コード | 190117710 |     |
| 6-15-3 | Name | 入院料名称 | 一般病棟７対１入院基本料 |     |
| 6-16 | Last\_Hospital\_Charge | 前回異動日の入院料 |     |     |
| 6-16-1 | Label | 内容の名称を返却 | 前回異動日の入院料 |     |
| 6-16-2 | Data | 入院料コード | 190077410 |     |
| 6-16-3 | Name | 入院料名称 | 一般病棟１０対１入院基本料 |     |
| 6-17 | Editing\_Hospital\_Charge | 入院会計 |     |     |
| 6-17-1 | Label | 内容の名称を返却 | 入院会計 |     |
| 6-17-2 | Data | コードを返却 | 2   |     |
| 6-17-3 | Name | 内容を返却  <br>　1：入院料を算定しない、  <br>　2：入院料を算定する | 入院料を算定する |     |
| 6-18 | Delivery | 分娩区分 |     | 追加（2016-01-26） |
| 6-18-1 | Label | 内容の名称を返却 | 分娩区分 | 追加（2016-01-26） |
| 6-18-2 | Data | コードを返却 | 1   | 追加（2016-01-26） |
| 6-18-3 | Name | 内容を返却  <br>　0：分娩入院でない  <br>　1：正常分娩  <br>　2：異常分娩 | 正常分娩 | 追加（2016-01-26） |
| 6-19 | Direct\_Payment | 直接支払制度利用区分 |     | 追加（2016-01-26） |
| 6-19-1 | Label | 内容の名称を返却 | 直接支払制度 | 追加（2016-01-26） |
| 6-19-2 | Data | コードを返却 |     | 追加（2016-01-26） |
| 6-19-3 | Name | 内容を返却  <br>　0：利用しない  <br>　1：利用する |     | 追加（2016-01-26） |
| 6-20 | Recurring\_Billing | 定期請求 |     |     |
| 6-20-1 | Label | 内容の名称を返却 | 定期請求 |     |
| 6-20-2 | Data | コードを返却 | 3   |     |
| 6-20-3 | Name | 内容を返却  <br>　1：医療機関での設定  <br>　2：月末時のみ請求  <br>　3：定期請求しない | 定期請求しない |     |
| 6-21 | Search\_Function | 検索時患者表示 |     |     |
| 6-21-1 | Label | 内容の名称を返却 | 検索時患者表示 |     |
| 6-21-2 | Data | コードを返却 | 1   |     |
| 6-21-3 | Name | 内容を返却  <br>　1：表示可  <br>　2：表示不可 | 表示可 |     |

###  レスポンスサンプル  

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2015-03-24</Information\_Date>    <Information\_Time type\="string"\>15:16:17</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>03</Data>      <Name type\="string"\>変更</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="record"\>      <History\_Number type\="string"\>002</History\_Number>      <Creation\_Type type\="record"\>        <Label type\="string"\>入院歴作成区分</Label>        <Data type\="string"\>0</Data>        <Name type\="string"\>通常登録</Name>      </Creation\_Type>      <Admission\_Date type\="string"\>2015-03-24</Admission\_Date>      <Ward\_Number type\="record"\>        <Label type\="string"\>病棟番号</Label>        <Data type\="string"\>01</Data>      </Ward\_Number>      <Ward\_Name type\="record"\>        <Label type\="string"\>病棟名</Label>        <Data type\="string"\>北病棟</Data>      </Ward\_Name>      <Room\_Number type\="record"\>        <Label type\="string"\>病室番号</Label>        <Data type\="string"\>101</Data>      </Room\_Number>      <Department\_Code type\="record"\>        <Label type\="string"\>診療科</Label>        <Data type\="string"\>01</Data>        <Name type\="string"\>内科</Name>      </Department\_Code>      <Doctor type\="array"\>        <Doctor\_child type\="record"\>          <Label type\="string"\>担当医</Label>          <Data type\="string"\>10001</Data>          <Name type\="string"\>日本　一</Name>        </Doctor\_child>      </Doctor>      <HealthInsurance\_Information type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>      </HealthInsurance\_Information>      <First\_Admission\_Date type\="string"\>2015-03-24</First\_Admission\_Date>      <Moving\_From\_Nursing type\="record"\>        <Label type\="string"\>介護からの異動</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>対象外</Name>      </Moving\_From\_Nursing>      <Room\_Charge type\="record"\>        <Label type\="string"\>室料差額</Label>        <Data type\="string"\>   1000</Data>        <Name type\="string"\>円</Name>      </Room\_Charge>      <Over\_180days\_Hospital\_Stay type\="record"\>        <Label type\="string"\>選定入院</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>選定対象</Name>      </Over\_180days\_Hospital\_Stay>      <Hospital\_Charge type\="record"\>        <Label type\="string"\>入院日の入院料</Label>        <Data type\="string"\>190117710</Data>        <Name type\="string"\>一般病棟７対１入院基本料</Name>      </Hospital\_Charge>      <Editing\_Hospital\_Charge type\="record"\>        <Label type\="string"\>入院会計</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>入院料を算定する</Name>      </Editing\_Hospital\_Charge>      <Recurring\_Billing type\="record"\>        <Label type\="string"\>定期請求</Label>        <Data type\="string"\>3</Data>        <Name type\="string"\>定期請求しない</Name>      </Recurring\_Billing>      <Search\_Function type\="record"\>        <Label type\="string"\>検索時患者表示</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>表示可</Name>      </Search\_Function>    </Hospital\_Stay\_Infomation>  </private\_objects>  
</xmlio2>

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

 # -\*- coding: utf-8 -\*-    

[sample\_hsptinfmod\_v2\_henko.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptinfmod_v2_henko.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 変更  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hsptinfmodv2")BODY \= <<EOF

<data>    <private\_objects type\="record"\>        <Save\_Request type\="string"\></Save\_Request>        <Request\_Number type\="string"\>03</Request\_Number>        <Patient\_ID type\="string"\>1</Patient\_ID>        <Admission\_Date type\="string"\>2014-05-01</Admission\_Date>        <Doctor\_Code type\="array"\>            <Doctor\_Code\_child type\="string"\>10001</Doctor\_Code\_child>        </Doctor\_Code>        <Recurring\_Billing type\="string"\>3</Recurring\_Billing>    </private\_objects>  
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

入院登録([https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
)を参照。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院登録変更

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospentryfix.html#wrapper)

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
