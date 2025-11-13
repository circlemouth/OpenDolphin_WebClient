[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#content)

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
 > 入院患者基本情報

入院患者基本情報（履歴を含む）  

==================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#response)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#errmsg)
      
    

更新履歴
----

 2018-05-28   （Ver5.0.0以降のみ）「レスポンス一覧」に項目を追加。

 2014-08-01   「レスポンス一覧」に項目を追加。  
 　　　　　　  「エラーメッセージ一覧」を追加。  

 2013-11-26   「レスポンス一覧」の項目名を一部変更。

概要
--

POSTメソッドにより入院患者の基本情報の取得を行います。

日レセ Ver.4.7.0\[第19回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsptinf\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptinf\_v2.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptinf\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsptinfv2  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Admission\_Date type\="string"\></Admission\_Date>        </private\_objects>  
</data>

### 処理概要

日レセに設定されている入院患者の基本情報の内容を返却します。

  

### 処理詳細

1.  患者番号の存在チェック
2.  入院日の妥当性チェック（未設定の場合は、システム日付を設定）
3.  返却情報は、入退院基本情報の場合最大１００件

*   基本的に入退院登録業務の登録内容をそのまま返却します。
*   １レコードは１回の入退歴（入院期間）となります。
*   複数の入院歴の登録がある場合、新しいものから順に返却を行います。
*   １回の入院期間中に転科・転棟・転室があった場合、最後の異動分を返却します。
*   自院歴・他院歴の登録は入院日・退院日・病棟名・初回入院日のみ返却します。
*   初回入院日は、継続入院の場合に先の入院日を設定します。  
    

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-10-24</Information\_Date>    <Information\_Time type\="string"\>15:09:43</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="array"\>      <Hospital\_Stay\_Infomation\_child type\="record"\>        <History\_Number type\="string"\>001</History\_Number>        <Creation\_Type type\="record"\>          <Label type\="string"\>入院歴作成区分</Label>          <Data type\="string"\>0</Data>          <Name type\="string"\>通常登録</Name>        </Creation\_Type>        <Admission\_Date type\="string"\>2013-10-08</Admission\_Date>        <Discharge\_Date type\="string"\>2013-10-12</Discharge\_Date>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Department\_Code type\="record"\>          <Label type\="string"\>診療科</Label>          <Data type\="string"\>10</Data>          <Name type\="string"\>外科</Name>        </Department\_Code>        <Doctor type\="array"\>          <Doctor\_child type\="record"\>            <Label type\="string"\>担当医</Label>            <Data type\="string"\>10001</Data>            <Name type\="string"\>日本　一</Name>          </Doctor\_child>        </Doctor>        <HealthInsurance\_Information type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234567</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>        <First\_Admission\_Date type\="string"\>2013-10-08</First\_Admission\_Date>        <Moving\_From\_Nursing type\="record"\>          <Label type\="string"\>介護からの異動</Label>          <Data type\="string"\>1</Data>          <Name type\="string"\>対象外</Name>        </Moving\_From\_Nursing>        <Room\_Charge type\="record"\>          <Label type\="string"\>室料差額</Label>          <Data type\="string"\>   1000</Data>          <Name type\="string"\>円</Name>        </Room\_Charge>        <Over\_180days\_Hospital\_Stay type\="record"\>          <Label type\="string"\>選定入院</Label>          <Data type\="string"\>1</Data>          <Name type\="string"\>選定対象</Name>        </Over\_180days\_Hospital\_Stay>        <Hospital\_Charge type\="record"\>          <Label type\="string"\>入院日の入院料</Label>          <Data type\="string"\>190117710</Data>          <Name type\="string"\>一般病棟７対１入院基本料</Name>        </Hospital\_Charge>        <Editing\_Hospital\_Charge type\="record"\>          <Label type\="string"\>入院会計</Label>          <Data type\="string"\>2</Data>          <Name type\="string"\>入院料を算定する</Name>        </Editing\_Hospital\_Charge>        <Recurring\_Billing type\="record"\>          <Label type\="string"\>定期請求</Label>          <Data type\="string"\>1</Data>          <Name type\="string"\>医療機関での設定</Name>        </Recurring\_Billing>      </Hospital\_Stay\_Infomation\_child>    </Hospital\_Stay\_Infomation>  </private\_objects>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 12  |     |
| 2   | Admission\_Date | 入院日 | 2013-10-08 | ※１  |

※１：設定がある場合は、入院日に関する入退院情報および継続入院の情報を返却し、  
　　未設定の場合は全ての入退院情報を返却します。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-10-24 |     |
| 2   | Information\_Time | 実施時間 | 15:09:43 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別（1：男性、2：女性） | 1   |     |
| 6   | Hospital\_Stay\_Infomation | 入退院情報（繰り返し　１００） |     |     |
| 6-1 | History\_Number | 履歴番号 | 001 | 追加  <br>(2014-08-01) |
| 6-2 | Creation\_Type | 入院歴作成区分 |     |     |
| 6-2-1 | Label | 内容の名称 | 入院歴作成区分 |     |
| 6-2-2 | Data | 入院歴作成区分コード | 0   |     |
| 6-2-3 | Name | 入院歴作成区分の内容  <br>（Data：Name、  <br>0：通常登録、  <br>1：自院歴、  <br>2：他院歴、  <br>3：他院歴(特別な関係にある医療機関)） | 通常登録 |     |
| 6-3 | Admission\_Date | 入院日 | 2013-10-08 |     |
| 6-4 | Admission\_Meal\_Start | 入院日の食事開始時間 |     | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-4-1 | Label | 内容の名称 | 入院日の食事開始時間 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-4-2 | Data | 入院日の食事開始時間コード | 1   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-4-3 | Name | 内容  <br>（Data：Name  <br>0:食事なし  <br>1:朝食から  <br>2:昼食から  <br>3:夕食から） | 朝食から | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-5 | Discharge\_Date | 退院日 | 2013-10-12 |     |
| 6-6 | Discharge\_Type | 退院事由 |     |     |
| 6-6-1 | Label | 内容の名称 | 退院事由 |     |
| 6-6-2 | Data | 退院事由の区分番号 | 02  |     |
| 6-6-3 | Name | 退院事由の名称 | 完治  |     |
| 6-7 | Ward\_Number | 病棟番号 |     |     |
| 6-7-1 | Label | 内容の名称 | 病棟番号 |     |
| 6-7-2 | Data | 病棟番号情報 | 01  |     |
| 6-8 | Ward\_Name | 病棟名 |     |     |
| 6-8-1 | Label | 内容の名称 | 病棟名 |     |
| 6-8-2 | Data | 病棟名 | 北病棟 |     |
| 6-9 | Room\_Number | 病室番号 |     |     |
| 6-9-1 | Label | 内容の名称 | 病室番号 |     |
| 6-9-2 | Data | 病室番号 | 101 |     |
| 6-10 | Department\_Code | 診療科 |     |     |
| 6-10-1 | Label | 内容の名称 | 診療科 |     |
| 6-10-2 | Data | 診療科コード | 10  |     |
| 6-10-3 | Name | 診療科名称 | 外科  |     |
| 6-11 | Doctor | 担当医（繰り返し　３） |     |     |
| 6-11-1 | Label | 内容の名称 | 担当医 |     |
| 6-11-2 | Data | ドクターコード | 10001 |     |
| 6-11-3 | Name | 担当医の氏名 | 日本　一 |     |
| 6-12 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 6-12-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 6-12-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 6-12-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 6-12-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 6-12-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 6-12-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 6-12-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 6-12-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 6-12-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 6-12-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 6-12-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 6-13 | First\_Admission\_Date | 初回入院日 | 2013-10-08 |     |
| 6-14 | Moving\_From\_Nursing | 介護からの異動 |     |     |
| 6-14-1 | Label | 内容の名称 | 介護からの異動 |     |
| 6-14-2 | Data | コード | 1   |     |
| 6-14-3 | Name | 内容  <br>（Data：Name、  <br>1：対象外、  <br>2：急性増悪により） | 対象外 |     |
| 6-15 | Room\_Charge | 室料差額 |     | 変更  <br>(2013-11-26) |
| 6-15-1 | Label | 内容の名称 | 室料差額 |     |
| 6-15-2 | Data | 室料差額 | 1000 |     |
| 6-15-3 | Name | 単位（円） | 円   |     |
| 6-16 | Over\_180days\_Hospital\_Stay | 選定入院 |     |     |
| 6-16-1 | Label | 内容の名称 | 選定入院 |     |
| 6-16-2 | Data | コード | 1   |     |
| 6-16-3 | Name | 内容  <br>（Data：Name、  <br>1：選定対象、  <br>2：選定対象外） | 選定対象 |     |
| 6-17 | Hospital\_Charge | 入院日の入院料 |     | ※２  |
| 6-17-1 | Label | 内容の名称 | 入院日の入院料 |     |
| 6-17-2 | Data | 入院料コード | 190117710 |     |
| 6-17-3 | Name | 入院料名称 | 一般病棟７対１入院基本料 |     |
| 6-18 | Hospital\_Charge\_NotApplicable | 算定要件非該当区分 |     | 特定入院料のみ返却　※２  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-18-1 | Label | 内容の名称 | 算定要件非該当区分 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-18-2 | Data | 算定要件非該当区分 | 0   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-18-3 | Name | 内容  <br>（Data：Name  <br>0:算定要件に該当する患者  <br>1:算定要件に該当しない患者） | 算定要件に該当する患者 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-19 | Additional\_Hospital\_Charge | 入院日の入院加算（繰り返し　最大３） |     | ※３  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-19-1 | Label | 内容の名称 | 入院日の入院加算 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-19-2 | Data | 入院加算コード | 190142970 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-19-3 | Name | 入院加算名称 | 救急・在宅等支援病床初期加算（地域一般入院基本料） | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-20 | Editing\_Hospital\_Charge | 入院会計 |     |     |
| 6-20-1 | Label | 内容の名称 | 入院会計 |     |
| 6-20-2 | Data | コード | 2   |     |
| 6-20-3 | Name | 内容  <br>（Data：Name、  <br>1：入院料を算定しない、  <br>2：入院料を算定する） | 入院料を算定する |     |
| 6-21 | Delivery | 分娩区分 |     | ※１  |
| 6-21-1 | Label | 内容の名称 | 分娩区分 |     |
| 6-21-2 | Data | コード | 0   |     |
| 6-21-3 | Name | 内容  <br>（Data：Name、  <br>0：分娩入院でない、  <br>1：正常分娩、  <br>2：異常分娩） | 分娩入院でない |     |
| 6-22 | Direct\_Payment | 直接支払制度 |     | ※１  |
| 6-22-1 | Label | 内容の名称 | 直接支払制度 |     |
| 6-22-2 | Data | コード | 1   |     |
| 6-22-3 | Name | 内容  <br>（Data：Name、  <br>0：利用しない、  <br>1：利用する） | 利用する |     |
| 6-23 | Recurring\_Billing | 定期請求 |     |     |
| 6-23-1 | Label | 内容の名称 | 定期請求 |     |
| 6-23-2 | Data | コード | 1   |     |
| 6-23-3 | Name | 内容  <br>（Data：Name、  <br>1：医療機関での設定、  <br>2：月末時のみ請求、  <br>3：定期請求しない） | 医療機関での設定 |     |
| 6-24 | Search\_Function | 検索時患者表示 |     | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-24-1 | Label | 内容の名称 | 検索時患者表示 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-24-2 | Data | 検索時患者表示区分 | 1   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-24-3 | Name | 内容  <br>（Data：Name  <br>1：表示可  <br>2：表示不可） | 表示可 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-25 | Meal\_Type | 食事の種類 |     | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-25-1 | Label | 内容の名称 | 食事の種類 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-25-2 | Data | 食事の種類区分 | C   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-25-3 | Name | 内容  <br>（Data：Name  <br>0:食事なし  <br>1:食事あり  <br>2:食事あり（特別食）  <br>3:食事あり（流動食）  <br>A:変更なし  <br>B:変更なし（個別指示）  <br>C:個別指示） | 個別指示 | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-26 | Morning\_Meal | 食事の種類（朝） |     | ※４  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-26-1 | Label | 内容の名称 | 食事の種類（朝） | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-26-2 | Data | 食事の種類区分 | 1   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-26-3 | Name | 内容  <br>（Data：Name  <br>0:食事なし  <br>1:食事あり  <br>2:食事あり（特別食）  <br>3:食事あり（流動食）） | 食事あり | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-27 | Lunch\_Meal | 食事の種類（昼） |     | ※４  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-27-1 | Label | 内容の名称 | 食事の種類（昼） | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-27-2 | Data | 食事の種類区分 | 1   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-27-3 | Name | 内容  <br>（Data：Name  <br>0:食事なし  <br>1:食事あり  <br>2:食事あり（特別食）  <br>3:食事あり（流動食）） | 食事あり | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-28 | Evening\_Meal | 食事の種類（夕） |     | ※４  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-28-1 | Label | 内容の名称 | 食事の種類（夕） | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-28-2 | Data | 食事の種類区分 | 1   | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 6-28-3 | Name | 内容  <br>（Data：Name  <br>0:食事なし  <br>1:食事あり  <br>2:食事あり（特別食）  <br>3:食事あり（流動食）） | 食事あり | Ver5.0.0以降のみ追加  <br>(2018-05-28) |

 ※１：分娩区分と直接支払制度の項目は産科または産婦人科に入院している女性の患者のみ返却します。

 ※２：該当患者が特定入院料(a)の算定要件に該当しない場合、算定要件非該当区分に"1”、入院日の入院料には特定入院料(a)を返却します。

 ※３：入退院登録APIの入院登録リクエスト又は入退院登録画面の入院登録処理で算定した入院加算を返却します。  

 ※４：Meal\_Typeの食事の種類区分が”B:変更なし（個別指示）"または"C:個別指示"の場合に返却を行います。

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

[sample\_hsptinf\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptinf_v2.rb)
 

 #!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院患者基本情報取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/hsptinfv2")  
#  
\# 1.患者番号    Patient\_ID      (REQUIRED)  
\# 2.入院日      Admission\_Date  (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Admission\_Date type\="string"\></Admission\_Date>        </private\_objects>  
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
| 00  | 処理終了 |
| 01  | 診療年月の設定に誤りがあります |
| 02  | 患者番号の設定に誤りがあります |
| 03  | 入退院情報の取得に失敗しました |
| 04  | 指定された入院日の入院情報が存在しません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 92  | 診療年月は平成２０年（２００８年）４月以降を指定してください |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザIDが未登録です |
| それ以外 | 返却情報の編集でエラーが発生しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院患者基本情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hosppatientinfo.html#wrapper)

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
