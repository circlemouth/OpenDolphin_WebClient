[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#content)

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
 > 入院登録(訂正)

入院登録(訂正)  

===========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#errmsg)
      
    

更新履歴  

-------

 2021-02-09   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目および「リクエスト一覧」の注釈９を修正。

 2021-01-27   「レスポンス一覧」に項目を追加。

 2020-06-25   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目および「リクエスト一覧」の注釈９を修正。  

 2020-06-04   新型コロナウイルス感染症での入院に関する注意事項を追加（「リクエスト一覧」の注釈９）。  

 2020-05-26   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目を修正。

概要
--

POSTメソッドにより入院取消をせずに入院内容の訂正を行います。

日レセ Ver.5.0.0\[第36回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsptinfmod\_v2\_teisei.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptinfmod\_v2\_teisei.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptinfmod\_v2\_teisei.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsptinfmodv2  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  
<private\_objects type \="record"\>   <Save\_Request type \="string"\>1</Save\_Request>   <Request\_Number type \="string"\>12</Request\_Number>   <Patient\_ID type \="string"\>1</Patient\_ID>   <Admission\_Date type \="string"\>2018-11-01</Admission\_Date>   <Ward\_Number type \="string"\>01</Ward\_Number>   <Room\_Number type \="string"\>101</Room\_Number>   <Last\_Admission\_Date type \="string"\>2018-10-01</Last\_Admission\_Date>  
</private\_objects>  
</data>  

### 処理概要

#### 訂正できる範囲  

入院日以外の項目(病棟、病室、初回継続・入院料・保険組合せ・担当医など)の訂正が可能です。  

#### 訂正できる期間  

入院登録以降で転科転棟転室を行っていない状態の間リクエストが可能です。  
外泊、食事の登録内容を保持した状態で入院日から2ヶ月分の入院会計を再作成します(3ヶ月目以降の入院会計は削除されます)。  

レスポンスサンプル
---------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2018-11-21</Information\_Date>    <Information\_Time type\="string"\>06:12:41</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>12</Data>      <Name type\="string"\>入院登録(訂正)</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00001</Patient\_ID>      <WholeName type\="string"\>上尾 太郎</WholeName>      <WholeName\_inKana type\="string"\>アゲオ タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1958-01-10</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="record"\>      <History\_Number type\="string"\>002</History\_Number>      <Creation\_Type type\="record"\>        <Label type\="string"\>入院歴作成区分</Label>        <Data type\="string"\>0</Data>        <Name type\="string"\>通常登録</Name>      </Creation\_Type>      <Admission\_Date type\="string"\>2018-11-01</Admission\_Date>      <Ward\_Number type\="record"\>        <Label type\="string"\>病棟番号</Label>        <Data type\="string"\>01</Data>      </Ward\_Number>      <Ward\_Name type\="record"\>        <Label type\="string"\>病棟名</Label>        <Data type\="string"\>2階病棟</Data>      </Ward\_Name>      <Room\_Number type\="record"\>        <Label type\="string"\>病室番号</Label>        <Data type\="string"\>101</Data>      </Room\_Number>      <Department\_Code type\="record"\>        <Label type\="string"\>診療科</Label>        <Data type\="string"\>01</Data>        <Name type\="string"\>内科</Name>      </Department\_Code>      <HealthInsurance\_Information type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>01130012</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>99010101</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>990001</HealthInsuredPerson\_Number>      </HealthInsurance\_Information>      <First\_Admission\_Date type\="string"\>2018-10-01</First\_Admission\_Date>      <Moving\_From\_Nursing type\="record"\>        <Label type\="string"\>介護からの異動</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>対象外</Name>      </Moving\_From\_Nursing>      <Over\_180days\_Hospital\_Stay type\="record"\>        <Label type\="string"\>選定入院</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>選定対象</Name>      </Over\_180days\_Hospital\_Stay>      <Hospital\_Charge type\="record"\>        <Label type\="string"\>入院日の入院料</Label>        <Data type\="string"\>190200210</Data>        <Name type\="string"\>地域一般入院料1</Name>      </Hospital\_Charge>      <Editing\_Hospital\_Charge type\="record"\>        <Label type\="string"\>入院会計</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>入院料を算定する</Name>      </Editing\_Hospital\_Charge>      <Recurring\_Billing type\="record"\>        <Label type\="string"\>定期請求</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>医療機関での設定</Name>      </Recurring\_Billing>      <Search\_Function type\="record"\>        <Label type\="string"\>検索時患者表示</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>表示可</Name>      </Search\_Function>    </Hospital\_Stay\_Infomation>  </private\_objects>  
</xmlio2>  

  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>0:残さない  <br>1:残す | 1   | 未設定時初期値\[0\]を設定  <br>（日レセにリクエストの情報を保持するか否か指定）  <br>※６ |
| 2   | Request\_Number | リクエスト番号 | 12  | 必須(12) |
| 3   | Patient\_ID | 患者番号 | 12  | 必須  |
| 4   | Admission\_Date | 入院日 | 2018-11-01 | 必須  <br>  <br>入院登録時の入院日を設定すること（入院日の変更は不可） |
| 5   | Ward\_Number | 病棟番号 | 01  | 未設定時は変更なしとする  <br>病棟番号、病室番号の変更は同時に行うことを推奨（病棟のみ変更した場合、変更後の病棟に変更が行われなかった病室が存在しない場合はエラーとなるので注意が必要） |
| 6   | Room\_Number | 病室番号 | 101 | 未設定時は変更なしとする  <br>病棟番号、病室番号の変更は同時に行うことを推奨（病室のみ変更した場合、変更が行われなかった病棟に変更が行われた病室が存在しない場合はエラーとなるので注意が必要） |
| 7   | Room\_Charge | 室料差額 | 1000 | 未設定時は変更なしとする  <br>\[-\]を設定した場合、設定内容をクリアする（室料差額を取らない） |
| 8   | Over180days\_Hospital\_Stay | 選定入院  <br>1:選定対象  <br>2:選定対象外 | 1   | 未設定時は変更なしとする |
| 9   | Department\_Code | 診療科コード | 01  | 未設定時は変更なしとする |
| 10  | Last\_Admission\_Date | 前回入院日 | 2018-10-01 | 未設定時は変更なしとする  <br>\[-\]を設定した場合、設定内容をクリアする（初回入院とする） |
| 11  | From\_Nursing\_Care | 急性増悪による介護からの異動  <br>1:該当しない  <br>2:該当する | 1   | 未設定時は変更なしとする |
| 12  | Doctor\_Code | 担当医コード（最大３件） | 10001 | 未設定時は変更なしとする  <br>変更の際は、全ての担当医（最大３件）の設定が必要  <br>担当医コード１〜３の何れかに\[-\]を設定した場合、全ての担当医の設定内容をクリアする |
| 13  | HealthInsurance\_Information | 保険組合せ情報 |     | 未設定時は変更なしとする |
| 13-1 | Insurance\_Combination\_Number\_Temporary\_Set | 保険組合せ仮番号設定区分  <br>0:仮番号設定を行わない  <br>1:仮番号設定を行う | 0   | 未設定時初期値\[0\]を設定  <br>※８ |
| 13-2 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | ※１  |
| 13-3 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 | ※１  |
| 13-4 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※１  |
| 13-5 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※１  |
| 13-6 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 13-7 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 13-8 | HealthInsuredPerson\_Continuation | 継続区分 |     |     |
| 13-9 | HealthInsuredPerson\_Assistance | 補助区分 |     |     |
| 13-10 | RelationToInsuredPerson | 本人家族区分 |     |     |
| 13-11 | HealthInsuredPerson\_WholeName | 被保険者氏名 | 日医　太郎 |     |
| 13-12 | Certificate\_StartDate | 適用開始日 | 2004-04-01 |     |
| 13-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 13-14 | PublicInsurance\_Information | 公費情報(繰り返し4) |     |     |
| 13-14-1 | PublicInsurance\_Class | 公費の種類 |     | ※１  |
| 13-14-2 | PublicInsurance\_Name | 公費の制度名称 |     | ※１  |
| 13-14-3 | PublicInsurer\_Number | 負担者番号 |     | ※１  |
| 13-14-4 | PublicInsuredPerson\_Number | 受給者番号 |     | ※１  |
| 13-14-5 | Certificate\_IssuedDate | 適用開始日 |     |     |
| 13-14-6 | Certificate\_ExpiredDate | 適用終了日 |     |     |
| 14  | Hospital\_Charge\_Auto\_Set | 入院料初期値設定区分  <br>0:初期値設定を行わない  <br>1:初期値設定を行う | 0   | 未設定時初期値\[0\]を設定  <br>※２ |
| 15  | Hospital\_Charge | 入院料 | 190200210 | 未設定時は変更なしとする。  <br>ただし、病棟、病室が変更された場合、変更後の病棟、病室で入院料の算定が不可となる場合、  <br>システム管理5001 病棟管理情報］に設定のある入院基本料を算定する。  <br>※２ ※５、※９ |
| 16  | Hospital\_Charge\_NotApplicable | 算定要件非該当区分  <br>0:算定要件に該当する患者  <br>1:算定要件に該当しない患者  <br>2:新型コロナ感染症入院（２倍）  <br>3:新型コロナ感染症入院（３倍）  <br>4:新型コロナ感染症入院（２倍・上限延長）  <br>5:新型コロナ感染症入院（３倍・上限延長） | 0   | 未設定時は変更なしとする  <br>※３、※９  <br>  <br>2を追加(2020-05-26)  <br>2を変更,3を追加(2020-06-25)  <br>4,5を追加(2021-02-09) |
| 17  | Editing\_Hospital\_Charge | 入院会計  <br>1 入院料を算定しない  <br>2 入院料を算定する | 2   | 未設定時は変更なしとする |
| 18  | Additional\_Hospital\_Charge | 入院加算（最大３件） | 190142970  <br>（救急・在宅等支援病床初期加算（一般病棟入院基本料）） | 未設定時は変更なしとする  <br>ただし、病棟、病室が変更された場合、変更後の病棟、病室で入院料加算の算定が不可となる場合エラーとなるので、注意が必要  <br>変更の際は、全ての入院加算（最大３件）の設定が必要  <br>入院加算１〜３の何れかに\[-\]を設定した場合、全ての入院加算の設定内容をクリアする  <br>※４ |
| 19  | Delivery | 分娩区分  <br>0:分娩入院でない  <br>1:正常分娩  <br>2:異常分娩 |     | 未設定時は変更なしとする。  <br>ただし、他科から産婦人科または産科に転科した場合で分娩情報が未登録時の初期値は［1 正常分娩］とする。  <br>※７ |
| 20  | Direct\_Payment | 直接支払制度利用区分  <br>0:利用しない  <br>1:利用する |     | 未設定時は変更なしとする。  <br>ただし、他科から産婦人科または産科に転科した場合で分娩情報が未登録時の初期値は［1利用する］とする。  <br>※７ |
| 21  | Recurring\_Billing | 定期請求区分  <br>1:医療機関での設定  <br>2:月末時のみ請求  <br>3:定期請求しない | 1   | 未設定時は変更なしとする |
| 22  | Search\_Function | 検索時患者表示  <br>1:表示可  <br>2:表示不可 | 1   | 未設定時は変更なしとする |

※１：何れかの設定がされていることは必須です。一箇所でも設定されていれば、一致する保険組合せが対象に設定されます。  
　　　保険組合せ番号と他の情報が同時に設定されている場合、保険組合せ番号の設定が有効となります。

※２：入院料初期値設定が"1"（初期値設定を行う）の場合、入退院登録画面で初期表示される入院料を算定します（医療観察法の入院の場合を除きます）。  
　　　この際、療養病棟入院基本料、有床診療所療養病床入院基本料について初期表示されない場合、それぞれ入院料の（Ｉ）、（Ｅ）を算定します。  
　　　入院料初期値設定が"0"（初期値設定を行わない）で、特定入院基本料、特定入院料、短期滞在手術等基本料を算定する場合は入院料を必ず設定して下さい。  
　　　生活療養の区別がある入院料の場合、生活療養の判断は日レセ側で行います。  
　　　　（例）療養病棟入院料１（入院料Ａ）を算定する場合  
　　　　　　　リクエストの入院料に190121310（療養病棟入院料１（入院料Ａ））を設定  
　　　　　　　　生活療養に該当しない場合　　→　療養病棟入院料１（入院料Ａ）(190121310)を算定  
　　　　　　　　生活療養に該当する場合　　　→　療養病棟入院料１（入院料Ａ）（生活療養）（190123710）を算定  
　　　特定入院料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]、システム管理\[5002 病室管理情報\]で特定入院料の設定を行なって下さい。  
　　　栄養管理体制の減算規定に該当する場合、事前にシステム管理\[5000 医療機関情報-入院基本\]で栄養管理体制の設定を行なって下さい。  
　　　平成３０年４月１日以降で療養病棟入院基本料の経過措置１または２に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成３０年４月１日以降で結核病棟の重症患者割合特別入院基本料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２８年４月１日以降で夜勤時間特別入院基本料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２８年４月１日以降で療養病棟入院基本料２の看護職員数等経過措置に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２６年４月１日以降で夜勤時間超過減算に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で月平均夜勤時間超過の設定を行なって下さい。  
　　　平成２４年４月１日以降で短期滞在手術等基本料３を算定する場合、事前にシステム管理\[5003 短期滞在手術等基本料３情報\]の設定を行なって下さい。

※３：特定入院料の算定病棟に当該入院料の算定要件に該当しない患者が入院した場合に設定を行なって下さい。  
　　　（例）精神科救急入院料の算定を行う病棟に精神科救急入院料の算定の算定要件に該当しない患者が入院した場合、  
　　　　　　入院料（Hospital\_Charge）に"190121010"（精神科救急入院料１（３０日以内））を設定し、算定要件非該当区分（Hospital\_Charge\_NotApplicable）に"1"（算定要件に該当しない患者）を設定して下さい。

※４：現状は以下の加算を対応しています。（入院退院登録画面より設定可能な加算と同じです。）  
　　　平成30年4月以降  
　　　　190142970 　救急・在宅等支援病床初期加算（一般病棟入院基本料）  
　　　　190201870 　在宅患者支援療養病床初期加算（療養病棟入院基本料）  
　　　　190135470 　有床診療所一般病床初期加算（有床診療所入院基本料）  
　　　　190135670 　救急・在宅等支援療養病床初期加算（有床診療所療養病床入院基本料）  
　　　　190212470 　在宅患者支援病床初期加算（地域包括ケア病棟入院料）  
　　　　190152470 　救急・在宅等支援病床初期加算（特定一般病棟入院料）  
　　　平成30年3月以前  
　　　　190142970 救急・在宅等支援病床初期加算（一般病棟入院基本料）  
　　　　190134270 救急・在宅等支援療養病床初期加算  
　　　　190143370 救急・在宅等支援療養病床初期加算（療養病棟入院基本料１）  
　　　　190135470 有床診療所一般病床初期加算（有床診療所入院基本料）  
　　　　190135670 救急・在宅等支援療養病床初期加算（有床診療所療養病床入院基本料）  
　　　　190177170 救急・在宅等支援病床初期加算（地域包括ケア病棟入院料）  
　　　　190152470 救急・在宅等支援病床初期加算（特定一般病棟入院料）

※５：医療観察法の入院の場合、以下の値を設定して下さい。  
　　　　設定値　　　　　　　　(I01)入退院登録画面−入院料選択欄に表示される内容  
　　　　401　　　　　　　　　　急性期入院  
　　　　402　　　　　　　　　　急性期入院（未適合１年以内）  
　　　　403　　　　　　　　　　急性期入院（未適合１年超）  
　　　　404　　　　　　　　　　回復期入院  
　　　　411　　　　　　　　　　回復期入院（２７１日以上）  
　　　　405　　　　　　　　　　社会復帰期入院  
　　　　412　　　　　　　　　　社会復帰期入院（移行加算）  
　　　　413　　　　　　　　　　社会復帰期入院（遠隔地加算）  
　　　　414　　　　　　　　　　社会復帰期入院（移行加算・遠隔地加算）  
　　　　406　　　　　　　　　　社会復帰期入院（１８１日以上１年以内）  
　　　　415　　　　　　　　　　社会復帰期入院（１８１日以上１年以内・遠隔地加算）  
　　　　407　　　　　　　　　　社会復帰期入院（１年超１年１８０日以内）  
　　　　416　　　　　　　　　　社会復帰期入院（１年超１年１８０日以内・遠隔地加算）  
　　　　408　　　　　　　　　　社会復帰期入院（１年１８０日超）  
　　　　417　　　　　　　　　　社会復帰期入院（１年１８０日超・遠隔地加算）  
　　　　409　　　　　　　　　　社会復帰期入院（未経過１年超）  
　　　　410　　　　　　　　　　社会復帰期入院（未経過１年１８０日超）

※６：リクエスト番号に"1"を設定した場合、日レセのオーダ確認画面にて、エラーデータ修正が可能となります。  
　　　但し、食事、外泊、医療区分・ADL点数のリクエストの訂正は不可となります。  
　　　（リクエストの種類（食事、外泊等）、患者氏名、受付日時の確認のみ可能です。）

※７：システム管理 \[1005 診療科目情報\] で \[レセ電診療科コード\] に"23"（産婦人科）か"24"（産科）の設定がある診療科に入院した場合にリクエストの設定を行います。  
　　　該当の診療科に入院した場合の未設定時の初期値は \[1 正常分娩\]、\[1 利用する\] とします。

※８：保険組合せ仮番号設定区分に"1"を設定した場合、仮の保険組合せ番号(999)で入院登録を行います。  
　　　入院会計に仮の保険組合せ番号が登録されている患者についてはレセプト作成、退院登録および定期請求処理は行えません（エラーとなります）。  
　　　該当患者はデータチェックのエラー内容より確認が可能です（エラー内容「保険組合せが存在しません」）。  
　　　正しい保険組合せへの変更は、入院登録（訂正）リクエストかまたは入院日を異動日とした転科転棟転室リクエストより行うことが可能です。

※９：新型コロナ感染症による診療報酬上臨時的取り扱いに係る特定入院料は以下のいずれかの方法で算定可能です。  
　　　　・従来どおりの特定入院料の設定に加えて、算定要件非該当区分"2"〜"5"の該当するものを設定します。  
　　　　・診療報酬上臨時的取り扱いに係る特定入院料のコードを入院料に設定する。  
　　　　注意事項  
　　　　　・新型コロナ感染症患者の入院登録時の保険組み合わせは公費「028 感染症入院」を含んだもので設定を行ってください。  
　　　　　・入院登録を行うと対象の特定入院料を算定の最大上限日数となる３５日まで算定を行います。 （３６日目以降はシステム管理「5001 病棟管理情報」に設定されている入院基本料で入院料の算定を行います。） 患者状態によって２１日上限となる患者の場合は、２２日目に異動処理を行い該当入院料の算定を終了してください。   
　　　　　・「新型コロナウイルス感染症に係る診療報酬上の臨時的な取扱いについて（その 19）」により２０２０年５月２６日以降、通常の特定入院料の３倍の点数を算定できることとされましたが、５月２５日迄に入院登録済みの患者で５月２６日以降新型コロナウイルス感染症による入院で３倍の点数が算定可能な場合は、異動日に５月２６日を指定して転科転棟転室リクエストを行ってください。  
　　　　　・「新型コロナウイルス感染症に係る診療報酬上の臨時的な取扱いについて（その 34）」により２０２１年１月２２日以降、算定日数の上限を超えて算定可能な条件に該当する場合、従来の算定上限日数に到達した日を異動日として、「転科　転棟　転室」処理を行ってください。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2018-11-01 |     |
| 2   | Information\_Time | 実施時間 | 14:38:14 |     |
| 3   | Api\_Results | 結果情報(繰り返し　１０） |     |     |
| 3-1 | Api\_Result | 結果コード(ゼロ以外エラー) | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 12  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 入院登録（訂正） |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別(1:男性、2:女性） | 1   |     |
| 6   | Hospital\_Stay\_Infomation | 入退院情報 |     |     |
| 6-1 | History\_Number | 履歴番号 | 002 |     |
| 6-2 | Creation\_Type | 入院歴作成区分 |     |     |
| 6-2-1 | Label | 内容の名称を返却 | 入院歴作成区分 |     |
| 6-2-2 | Data | Data:Name | 0   |     |
| 6-2-3 | Name | 0:通常登録 | 通常登録 |     |
| 6-3 | Admission\_Date | 入院日 | 2018-11-01 |     |
| 6-4 | Ward\_Number | 病棟番号 |     |     |
| 6-4-1 | Label | 内容の名称を返却 | 病棟番号 |     |
| 6-4-2 | Data | 病棟番号を返却 | 01  |     |
| 6-5 | Ward\_Name | 病棟名 |     |     |
| 6-5-1 | Label | 内容の名称を返却 | 病棟名 |     |
| 6-5-2 | Data | 病棟名を返却 | 北病棟 |     |
| 6-6 | Room\_Number | 病室番号 |     |     |
| 6-6-1 | Label | 内容の名称を返却 | 病室番号 |     |
| 6-6-2 | Data | 病室番号を返却 | 101 |     |
| 6-7 | Department\_Code | 診療科 |     |     |
| 6-7-1 | Label | 内容の名称を返却 | 診療科 |     |
| 6-7-2 | Data | 診療科コードを返却 | 01  |     |
| 6-7-3 | Name | 診療科の名称を返却 | 内科  |     |
| 6-8 | Doctor | 担当医 繰り返し３ |     |     |
| 6-8-1 | Label | 内容の名称を返却 | 担当医 |     |
| 6-8-2 | Data | ドクターコードを返却 | 10001 |     |
| 6-8-3 | Name | 担当医の氏名を返却 | 日本　一 |     |
| 6-9 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 6-9-1 | Insurance\_Combination\_Number | 保険組合せ | 0001 |     |
| 6-9-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 6-9-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 6-9-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 6-9-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 6-9-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 6-9-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加(2021-01-27) |
| 6-9-8 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 6-9-8-1 | PublicInsurance\_Class | 公費の種類 |     |     |
| 6-9-8-2 | PublicInsurance\_Name | 公費の制度名称 |     |     |
| 6-9-8-3 | PublicInsurer\_Number | 負担者番号 |     |     |
| 6-9-8-4 | PublicInsuredPerson\_Number | 受給者番号 |     |     |
| 6-10 | First\_Admission\_Date | 初回入院日 | 2018-10-01 |     |
| 6-11 | Moving\_From\_Nursing | 介護からの異動 |     |     |
| 6-11-1 | Label | 内容の名称を返却 | 介護からの異動 |     |
| 6-11-2 | Data | Data:Name | 1   |     |
| 6-11-3 | Name | 1:対象外  <br>2:急性増悪により | 対象外 |     |
| 6-12 | Room\_Charge | 室料差額 |     |     |
| 6-12-1 | Label | 内容の名称を返却 | 室料差額 |     |
| 6-12-2 | Data | 室料差額を返却 | 1000 |     |
| 6-12-3 | Name | 単位（円） | 円   |     |
| 6-13 | Over\_180days\_Hospital\_Stay | 選定入院 |     |     |
| 6-13-1 | Label | 内容の名称を返却 | 選定入院 |     |
| 6-13-2 | Data | Data:Name | 1   |     |
| 6-13-3 | Name | 1:選定対象  <br>2:選定対象外 | 選定対象 |     |
| 6-14 | Hospital\_Charge | 入院日の入院料 |     |     |
| 6-14-1 | Label | 内容の名称を返却 | 入院日の入院料 |     |
| 6-14-2 | Data | 入院料コード | 190200210 |     |
| 6-14-3 | Name | 入院料名称 | 地域一般入院料１ |     |
| 6-15 | Editing\_Hospital\_Charge | 入院会計 |     |     |
| 6-15-1 | Label | 内容の名称を返却 | 入院会計 |     |
| 6-15-2 | Data | Data:Name | 2   |     |
| 6-15-3 | Name | 1 入院料を算定しない  <br>2 入院料を算定する | 入院料を算定する |     |
| 6-16 | Delivery | 分娩区分 |     |     |
| 6-16-1 | Label | 内容の名称を返却 |     |     |
| 6-16-2 | Data | Data:Name |     |     |
| 6-16-3 | Name | 0:分娩入院でない  <br>1:正常分娩  <br>2:異常分娩 |     |     |
| 6-17 | Direct\_Payment | 直接支払制度利用区分 |     |     |
| 6-17-1 | Label | 内容の名称を返却 |     |     |
| 6-17-2 | Data | Data:Name |     |     |
| 6-17-3 | Name | 0:利用しない  <br>1:利用する |     |     |
| 6-18 | Recurring\_Billing | 定期請求 |     |     |
| 6-18-1 | Label | 内容の名称を返却 | 定期請求 |     |
| 6-18-2 | Data | Data:Name | 1   |     |
| 6-18-3 | Name | 1:医療機関での設定  <br>2:月末時のみ請求  <br>3:定期請求しない | 医療機関での設定 |     |
| 6-19 | Search\_Function | 検索時患者表示 |     |     |
| 6-19-1 | Label | 内容の名称を返却 | 検索時患者表示 |     |
| 6-19-2 | Data | Data:Name | 1   |     |
| 6-19-3 | Name | 1:表示可  <br>2:表示不可 | 表示可 |     |

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

[sample\_hsptinfmod\_v2\_teisei.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptinfmod_v2_teisei.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院登録（訂正）  
  
require 'uri'  
require 'net/http'  
  
#-------------------------------------------------------------------------------HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"  
URL\_PATH\="/orca31/hsptinfmodv2"BODY \= <<EOF 

<data>  
<private\_objects type \="record"\>   <Save\_Request type \="string"\>1</Save\_Request>   <Request\_Number type \="string"\>12</Request\_Number>   <Patient\_ID type \="string"\>1</Patient\_ID>   <Admission\_Date type \="string"\>2018-11-01</Admission\_Date>   <Ward\_Number type \="string"\>01</Ward\_Number>   <Room\_Number type \="string"\>101</Room\_Number>   <Room\_Charge type \="string"\></Room\_Charge>   <Over180days\_Hospital\_Stay type \="string"\></Over180days\_Hospital\_Stay>   <Department\_Code type \="string"\></Department\_Code>   <Last\_Admission\_Date type \="string"\>2018-10-01</Last\_Admission\_Date>   <From\_Nursing\_Care type \="string"\></From\_Nursing\_Care>   <Doctor\_Code type\="array"\>     <Doctor\_Code\_child type\="string"\></Doctor\_Code\_child>     <Doctor\_Code\_child type\="string"\></Doctor\_Code\_child>     <Doctor\_Code\_child type\="string"\></Doctor\_Code\_child>   </Doctor\_Code>   <HealthInsurance\_Information type \="record"\>      <Insurance\_Combination\_Number\_Temporary\_Set type \="string"\></Insurance\_Combination\_Number\_Temporary\_Set>      <Insurance\_Combination\_Number type \="string"\></Insurance\_Combination\_Number>      <InsuranceProvider\_Class type \="string"\></InsuranceProvider\_Class>      <InsuranceProvider\_Number type \="string"\></InsuranceProvider\_Number>      <InsuranceProvider\_WholeName type \="string"\></InsuranceProvider\_WholeName>      <HealthInsuredPerson\_Symbol type \="string"\></HealthInsuredPerson\_Symbol>      <HealthInsuredPerson\_Number type \="string"\></HealthInsuredPerson\_Number>      <HealthInsuredPerson\_Continuation type \="string"\></HealthInsuredPerson\_Continuation>      <HealthInsuredPerson\_Assistance type \="string"\></HealthInsuredPerson\_Assistance>      <RelationToInsuredPerson type \="string"\></RelationToInsuredPerson>      <HealthInsuredPerson\_WholeName type \="string"\></HealthInsuredPerson\_WholeName>      <Certificate\_StartDate type \="string"\></Certificate\_StartDate>      <Certificate\_ExpiredDate type \="string"\></Certificate\_ExpiredDate>      <PublicInsurance\_Information type \="array"\>         <PublicInsurance\_Information\_child type \="record"\>            <PublicInsurance\_Class type \="string"\></PublicInsurance\_Class>            <PublicInsurance\_Name type \="string"\></PublicInsurance\_Name>            <PublicInsurer\_Number type \="string"\></PublicInsurer\_Number>            <PublicInsuredPerson\_Number type \="string"\></PublicInsuredPerson\_Number>            <Certificate\_IssuedDate type \="string"\></Certificate\_IssuedDate>            <Certificate\_ExpiredDate type \="string"\></Certificate\_ExpiredDate>         </PublicInsurance\_Information\_child>      </PublicInsurance\_Information>   </HealthInsurance\_Information>   <Hospital\_Charge\_Auto\_Set type \="string"\></Hospital\_Charge\_Auto\_Set>   <Hospital\_Charge type \="string"\></Hospital\_Charge>   <Hospital\_Charge\_NotApplicable type \="string"\></Hospital\_Charge\_NotApplicable>   <Editing\_Hospital\_Charge type \="string"\></Editing\_Hospital\_Charge>   <Additional\_Hospital\_Charge type \="array"\>     <Additional\_Hospital\_Charge\_child type \="string"\></Additional\_Hospital\_Charge\_child>   </Additional\_Hospital\_Charge>   <Delivery type \="string"\></Delivery>   <Direct\_Payment type \="string"\></Direct\_Payment>   <Recurring\_Billing type \="string"\></Recurring\_Billing>   <Search\_Function type \="string"\></Search\_Function>  
</private\_objects>  
</data>  

EOF  
#-------------------------------------------------------------------------------  
  
Net::HTTP.version\_1\_2  
  
req \= Net::HTTP::Post.new(URL\_PATH)  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  
  
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
 > 入院登録(訂正)

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospentry_correct.html#wrapper)

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
