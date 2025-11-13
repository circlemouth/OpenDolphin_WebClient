[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#content)

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
 > 入院登録

入院登録  

=======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#reqsample)
    
*   [レスポンスサンプル（入院登録）](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#ressample)
    
*   [レスポンスサンプル（入院取消）](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#ressample2)
      
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#request)
    
*   [レスポンス一覧（入院登録）](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#response)
    
*   [レスポンス一覧（入院取消）](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#response2)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
      
    

更新履歴  

-------

 2021-02-09   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目および「リクエスト一覧」の注釈１１を修正。

 2021-01-27   「レスポンス一覧（入院登録）」に項目を追加。  

 2020-06-25   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目および「リクエスト一覧」の注釈１１を修正。

 2020-06-04   新型コロナウイルス感染症での入院に関する注意事項を追加（「リクエスト一覧」の注釈１１）。

 2020-05-26   新型コロナウイルス感染症に係る入院対応のため、「リクエスト一覧」の項目を修正。

 2019-01-28   「エラーメッセージ一覧」にエラーコードを追加。  

 2018-11-27   「エラーメッセージ一覧」にエラーコードを追加。  

 2018-09-25   「エラーメッセージ一覧」にエラーコードを追加。 

 2018-05-28   （Ver5.0.0以降のみ）「リクエスト一覧」に項目を追加。  
 　　　　　　　（Ver5.0.0以降のみ）「エラーメッセージ一覧」にエラーコードを追加。  

 2018-03-26   「リクエスト一覧」の注釈を修正。

 2018-01-23   （Ver5.0.0以降のみ）「リクエスト一覧」に項目を追加。  
 　　　　　　　（Ver5.0.0以降のみ）「エラーメッセージ一覧」にエラーコードを追加。

 2017-12-20   「エラーメッセージ一覧」にエラーコードを追加。  

 2017-11-27   「エラーメッセージ一覧」にエラーコードを追加。  
 　　　　　　　「リクエスト一覧」に項目を追加、修正。

 2016-04-18   「リクエスト一覧」の注釈を修正。  

 2016-01-26   「リクエスト一覧」に項目を追加、修正。  
　　　　　　　　診療科コードを任意入力から必須入力に変更。  
　　　　　　　　分娩区分を追加。  
　　　　　　　　直接支払制度利用区分を追加。  
　　　　　　　「レスポンス一覧」に項目を追加、修正。  
　　　　　　　　分娩区分を追加。  
　　　　　　　　直接支払制度利用区分を追加。

概要
--

POSTメソッドにより入院の登録を行います。

日レセ Ver.4.7.0\[第46回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式となります。

テスト方法
-----

1.  参考提供されている sample\_hsptinfmod\_v2\_nyuin.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptinfmod\_v2\_nyuin.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptinfmod\_v2\_nyuin.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsptinfmodv2  
  
Request\_Number:  
    01: 入院登録  
    05: 入院取消（診療会計の入力を残す）  
    06: 入院取消（診療会計の入力も取り消す）  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Request\_Number type\="string"\>01</Request\_Number>                <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>                <Ward\_Number type\="string"\>01</Ward\_Number>                <Room\_Number type\="string"\>101</Room\_Number>                <Room\_Charge type\="string"\>1000</Room\_Charge>                <Department\_Code type\="string"\>01</Department\_Code>                <Doctor\_Code type\="array"\>                        <Doctor\_Code\_child type\="string"\>10001</Doctor\_Code\_child>                </Doctor\_Code>                <HealthInsurance\_Information type\="record"\>                        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                </HealthInsurance\_Information>                <Hospital\_Charge type\="string"\>190799410</Hospital\_Charge>                      <Recurring\_Billing type\="string"\>1</Recurring\_Billing>        </private\_objects>  
</data>

### 処理概要

入院登録リクエストにより指定患者の入院登録処理を行います。

  
  

レスポンスサンプル（入院登録）
---------------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2015-03-24</Information\_Date>    <Information\_Time type\="string"\>14:38:14</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>01</Data>      <Name type\="string"\>入院登録</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="record"\>      <History\_Number type\="string"\>002</History\_Number>      <Creation\_Type type\="record"\>        <Label type\="string"\>入院歴作成区分</Label>        <Data type\="string"\>0</Data>        <Name type\="string"\>通常登録</Name>      </Creation\_Type>      <Admission\_Date type\="string"\>2015-03-24</Admission\_Date>      <Ward\_Number type\="record"\>        <Label type\="string"\>病棟番号</Label>        <Data type\="string"\>01</Data>      </Ward\_Number>      <Ward\_Name type\="record"\>        <Label type\="string"\>病棟名</Label>        <Data type\="string"\>北病棟</Data>      </Ward\_Name>      <Room\_Number type\="record"\>        <Label type\="string"\>病室番号</Label>        <Data type\="string"\>101</Data>      </Room\_Number>      <Department\_Code type\="record"\>        <Label type\="string"\>診療科</Label>        <Data type\="string"\>01</Data>        <Name type\="string"\>内科</Name>      </Department\_Code>      <Doctor type\="array"\>        <Doctor\_child type\="record"\>          <Label type\="string"\>担当医</Label>          <Data type\="string"\>10001</Data>          <Name type\="string"\>日本　一</Name>        </Doctor\_child>      </Doctor>      <HealthInsurance\_Information type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>      </HealthInsurance\_Information>      <First\_Admission\_Date type\="string"\>2015-03-24</First\_Admission\_Date>      <Moving\_From\_Nursing type\="record"\>        <Label type\="string"\>介護からの異動</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>対象外</Name>      </Moving\_From\_Nursing>      <Room\_Charge type\="record"\>        <Label type\="string"\>室料差額</Label>        <Data type\="string"\>   1000</Data>        <Name type\="string"\>円</Name>      </Room\_Charge>      <Over\_180days\_Hospital\_Stay type\="record"\>        <Label type\="string"\>選定入院</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>選定対象</Name>      </Over\_180days\_Hospital\_Stay>      <Hospital\_Charge type\="record"\>        <Label type\="string"\>入院日の入院料</Label>        <Data type\="string"\>190117710</Data>        <Name type\="string"\>一般病棟７対１入院基本料</Name>      </Hospital\_Charge>      <Editing\_Hospital\_Charge type\="record"\>        <Label type\="string"\>入院会計</Label>        <Data type\="string"\>2</Data>        <Name type\="string"\>入院料を算定する</Name>      </Editing\_Hospital\_Charge>      <Recurring\_Billing type\="record"\>        <Label type\="string"\>定期請求</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>医療機関での設定</Name>      </Recurring\_Billing>      <Search\_Function type\="record"\>        <Label type\="string"\>検索時患者表示</Label>        <Data type\="string"\>1</Data>        <Name type\="string"\>表示可</Name>      </Search\_Function>    </Hospital\_Stay\_Infomation>  </private\_objects>  
</xmlio2>  

レスポンスサンプル（入院取消）
---------------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-06-06</Information\_Date>    <Information\_Time type\="string"\>10:56:06</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>06</Data>      <Name type\="string"\>入院取消（会計含む）</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="record"\>      <History\_Number type\="string"\>002</History\_Number>      <Admission\_Date type\="string"\>2014-06-04</Admission\_Date>    </Hospital\_Stay\_Infomation>  </private\_objects>  
</xmlio2> 

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>　0：残さない  <br>　1：残す | 1   | 未設定時初期値\[0\]を設定  <br>（日レセにリクエストの情報を保持するか否か指定）  <br>※８ |
| 2   | Request\_Number | リクエスト番号  <br>　01：入院登録  <br>　05：診療会計の入力を残す  <br>　06：診療会計の入力も取り消す | 01  | 必須  |
| 3   | Patient\_ID | 患者番号 | 12  | 必須（入院登録、入院取消） |
| 4   | Admission\_Date | 入院日 | 2014-06-03 | 必須（入院登録、入院取消） |
| 5   | Ward\_Number | 病棟番号 | 01  | 必須（入院登録） |
| 6   | Room\_Number | 病室番号 | 101 | 必須（入院登録） |
| 7   | Room\_Charge | 室料差額 | 1000 | システム管理  <br>\[5005 室料差額設定\]  <br>に登録されている室料差額を設定すること |
| 8   | Over180days\_Hospital\_Stay | 選定入院  <br>1：選定対象  <br>2：選定対象外 | 1   | 未設定時初期値\[1\]を設定 |
| 9   | Department\_Code | 診療科コード | 01  | 必須（入院登録） |
| 10  | Last\_Admission\_Date | 前回入院日 |     | 継続入院の場合必須  <br>(継続する入院歴が複数存在する場合は何れかの入院日でも可) |
| 11  | From\_Nursing\_Care | 急性増悪による介護からの異動  <br>　1：該当しない  <br>　2：該当する | 1   | 継続入院の場合設定  <br>(未設定時初期値\[1\]を設定) |
| 12  | Doctor\_Code | ドクターコード  <br>(最大３件) | 10001 |     |
| 13  | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 13-1 | Insurance\_Combination\_Number\_Temporary\_Set | 保険組合せ仮番号設定区分  <br>0:仮番号設定を行わない  <br>1:仮番号設定を行う | 0   | 未設定時初期値\[0\]を設定  <br>※１０  <br>  <br>Ver5.0.0以降のみ追加  <br>（2018-05-28） |
| 13-2 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | ※１  <br>追加（2017-11-27） |
| 13-3 | InsuranceProvider\_Class | 保険の種類  <br>(060：国保) | 060 | ※１  <br>任意項目に変更（2017-11-27） |
| 13-4 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※１  <br>任意項目に変更（2017-11-27） |
| 13-5 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※１  <br>任意項目に変更（2017-11-27） |
| 13-6 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 13-7 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 13-8 | HealthInsuredPerson\_Continuation | 継続区分 |     |     |
| 13-9 | HealthInsuredPerson\_Assistance | 補助区分 |     |     |
| 13-10 | RelationToInsuredPerson | 本人家族区分 |     |     |
| 13-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 13-12 | Certificate\_StartDate | 適用開始日 | 2004-04-01 |     |
| 13-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 13-14 | PublicInsurance\_Information | 公費情報  <br>(繰り返し４) |     |     |
| 13-14-1 | PublicInsurance\_Class | 公費の種類 | 019 | ※１  <br>任意項目に変更（2017-11-27） |
| 13-14-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 | ※１  <br>任意項目に変更（2017-11-27） |
| 13-14-3 | PublicInsurer\_Number | 負担者番号 |     | ※１  <br>任意項目に変更（2017-11-27） |
| 13-14-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 | ※１  <br>任意項目に変更（2017-11-27） |
| 13-14-5 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 13-14-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 14  | Hospital\_Charge\_Auto\_Set | 入院料初期値設定区分  <br>　0：初期値設定を行わない  <br>　1：初期値設定を行う | 0   | 未設定時初期値\[0\]を設定  <br>※２、※４  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 15  | Hospital\_Charge | 入院料 | 190177610 | 未設定時はシステム管理\[5001 病棟管理情報\]に設定のある入院基本料を算定  <br>  <br>※３、※４、※７、※１１ |
| 16  | Hospital\_Charge\_NotApplicable | 算定要件非該当区分  <br>0：算定要件に該当する患者  <br>1：算定要件に該当しない患者  <br>2:新型コロナ感染症入院（２倍）  <br>3:新型コロナ感染症入院（３倍）  <br>4:新型コロナ感染症入院（２倍・上限延長）  <br>5:新型コロナ感染症入院（３倍・上限延長） | 0   | 未設定時初期値\[0\]を設定  <br>※５、※１１  <br>  <br>2を追加(2020-05-26)  <br>2を変更,3を追加(2020-06-25)  <br>4,5を追加(2021-02-09) |
| 17  | Editing\_Hospital\_Charge | 入院会計  <br>1：入院料を算定しない  <br>2：入院料を算定する |     | 未設定時初期値\[2\] |
| 18  | Additional\_Hospital\_Charge | 入院加算（最大３件） | 190142970  <br>（救急・在宅等支援病床初期加算（一般病棟入院基本料）） | ※６  |
| 19  | Delivery | 分娩区分  <br>　0：分娩入院でない  <br>　1：正常分娩  <br>　2：異常分娩 |     | ※９  <br>追加（2016-01-26） |
| 20  | Direct\_Payment | 直接支払制度利用区分  <br>　0：利用しない  <br>　1：利用する |     | ※９  <br>追加（2016-01-26） |
| 21  | Recurring\_Billing | 定期請求区分  <br>　1：医療機関での設定  <br>　2：月末時のみ請求  <br>　3：定期請求しない | 1   | 未設定時初期値\[1\]を設定 |
| 22  | Search\_Function | 検索時患者表示  <br>1：表示可  <br>2：表示不可 | 1   | 未設定時初期値\[1\]を設定 |

※１：何れかの設定がされていることは必須です。一箇所でも設定されていれば、一致する保険組合せが対象に設定されます。  
　　　保険組合せ番号と他の情報が同時に設定されている場合、保険組合せ番号の設定が有効となります。

※２：（Ver5.0.0以降）  
　入院料初期値設定が"1"（初期値設定を行う）の場合、入退院登録画面で初期表示される入院料を算定します（医療観察法の入院の場合を除きます）。  
　この際、療養病棟入院基本料、有床診療所療養病床入院基本料について初期表示されない場合、それぞれ入院料の（Ｉ）、（Ｅ）を算定します。  
　入院料初期値設定が"0"（初期値設定を行わない）で、特定入院基本料、特定入院料、短期滞在手術等基本料を算定する場合は入院料を必ず設定して下さい。  
　生活療養の区別がある入院料の場合、生活療養の判断は日レセ側で行います。  
　　（例）療養病棟入院基本料１（入院基本料A）を算定する場合  
　　　　　リクエストの入院料に190121310（療養病棟入院基本料１（入院基本料A））を設定  
　　　　　生活療養に該当しない場合　　→　療養病棟入院基本料１（入院基本料A）(190121310)を算定  
　　　　　生活療養に該当する場合　　　→　療養病棟入院基本料１（入院基本料A）（生活療養）（190123710）を算定  

※３：（Ver4.8.0）  
　特定入院基本料、療養病棟入院基本料、療養病床入院基本料、特定入院料、短期滞在手術等基本料を算定する場合は必ず設定して下さい。  
　生活療養の区別がある入院料の場合、生活療養の該当有無を区別して設定して下さい。  
　　（例）療養病棟入院基本料１（入院基本料A）を算定する場合  
　　　　　生活療養に該当しない場合　→　190121310（療養病棟入院基本料１（入院基本料A））を設定  
　　　　　生活療養に該当する場合　　→　190123710（療養病棟入院基本料１（入院基本料A）（生活療養））を設定

※４：特定入院料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]、システム管理\[5002 病室管理情報\]で特定入院料の設定を行なって下さい。  
　　　栄養管理体制の減算規定に該当する場合、事前にシステム管理\[5000 医療機関情報-入院基本\]で栄養管理体制の設定を行なって下さい。  
　　　平成３０年４月１日以降で療養病棟入院基本料の経過措置１または２に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成３０年４月１日以降で結核病棟の重症患者割合特別入院基本料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２８年４月１日以降で夜勤時間特別入院基本料を算定する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２８年４月１日以降で療養病棟入院基本料２の看護職員数等経過措置に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で設定を行なって下さい。  
　　　平成２６年４月１日以降で夜勤時間超過減算に該当する場合、事前にシステム管理\[5001 病棟管理情報\]で月平均夜勤時間超過の設定を行なって下さい。  
　　　平成２４年４月１日以降で短期滞在手術等基本料３を算定する場合、事前にシステム管理\[5003 短期滞在手術等基本料３情報\]の設定を行なって下さい。

※５：特定入院料の算定病棟に当該入院料の算定要件に該当しない患者が入院した場合に設定を行なって下さい。  
　　　　（例）精神科救急入院料の算定を行う病棟に精神科救急入院料の算定の算定要件に該当しない患者が入院した場合、  
　　　　入院料（Hospital\_Charge）に\[190121010\]（精神科救急入院料１（３０日以内））を設定し、算定要件非該当区分（Hospital\_Charge\_NotApplicable）に\[1\]（算定要件に該当しない患者）を設定して下さい。

※６：現状は以下の加算を対応しています。（入院退院登録画面より設定可能な加算と同じです。）  
　　　　平成30年4月以降  
　　　　　190142970　救急・在宅等支援病床初期加算（一般病棟入院基本料）  
　　　　　190201870　在宅患者支援療養病床初期加算（療養病棟入院基本料）  
　　　　　190135470　有床診療所一般病床初期加算（有床診療所入院基本料）  
　　　　　190135670　救急・在宅等支援療養病床初期加算（有床診療所療養病床入院基本料）  
　　　　　190212470　在宅患者支援病床初期加算（地域包括ケア病棟入院料）  
　　　　　190152470　救急・在宅等支援病床初期加算（特定一般病棟入院料）  
　　　　平成30年3月以前  
　　　　　190142970　救急・在宅等支援病床初期加算（一般病棟入院基本料）  
　　　　　190134270　救急・在宅等支援療養病床初期加算  
　　　　　190143370　救急・在宅等支援療養病床初期加算（療養病棟入院基本料１）  
　　　　　190135470　有床診療所一般病床初期加算（有床診療所入院基本料）  
　　　　　190135670　救急・在宅等支援療養病床初期加算（有床診療所療養病床入院基本料）  
　　　　　190177170　救急・在宅等支援病床初期加算（地域包括ケア病棟入院料）  
　　　　　190152470　救急・在宅等支援病床初期加算（特定一般病棟入院料）  

※７：医療観察法の入院の場合、以下の値を設定して下さい。  
　　　　設定値　　(I01)入退院登録画面−入院料選択欄に表示される内容  
　　　　401　　　　急性期入院  
　　　　402　　　　急性期入院（未適合１年以内）  
　　　　403　　　　急性期入院（未適合１年超）  
　　　　404　　　　回復期入院  
　　　　411　　　　回復期入院（２７１日以上）  
　　　　405　　　　社会復帰期入院  
　　　　412　　　　社会復帰期入院（移行加算）  
　　　　413　　　　社会復帰期入院（遠隔地加算）  
　　　　414　　　　社会復帰期入院（移行加算・遠隔地加算）  
　　　　406　　　　社会復帰期入院（１８１日以上１年以内）  
　　　　415　　　　社会復帰期入院（１８１日以上１年以内・遠隔地加算）  
　　　　407　　　　社会復帰期入院（１年超１年１８０日以内）  
　　　　416　　　　社会復帰期入院（１年超１年１８０日以内・遠隔地加算）  
　　　　408　　　　社会復帰期入院（１年１８０日超）  
　　　　417　　　　社会復帰期入院（１年１８０日超・遠隔地加算）  
　　　　409　　　　社会復帰期入院（未経過１年超）  
　　　　410　　　　社会復帰期入院（未経過１年１８０日超）  

※８：「Save\_Request」に「１」を設定した場合、日レセの「オーダ確認画面」にて、エラーデータ修正が可能となります。  
　　　但し、食事、外泊、医療区分・ADL点数のリクエストの訂正は不可となります。  
　　　（リクエストの種類(食事、外泊等)、患者氏名、受付日時の確認のみ可能です。）

※９：システム管理 \[1005 診療科目情報\] で \[レセ電診療科コード\] に"23"（産婦人科）か"24"（産科）の設定がある診療科に入院した場合にリクエストの設定を行なって下さい。  
　　　該当の診療科に入院した場合の未設定時の初期値は \[1 正常分娩\]、\[1 利用する\]とします。

※１０：保険組合せ仮番号設定区分に"1"を設定した場合、仮の保険組合せ番号(999)で入院登録を行います。  
　　　　入院会計に仮の保険組合せ番号が登録されている患者についてはレセプト作成、退院登録および定期請求処理は行えません（エラーとなります）。  
　　　　該当患者はデータチェックのエラー内容より確認が可能です（エラー内容「保険組合せが存在しません」）。  
　　　　正しい保険組合せへの変更は、入院登録（訂正）リクエストかまたは入院日を異動日とした転科転棟転室リクエストより行うことが可能です。  

※１１：新型コロナ感染症による診療報酬上臨時的取り扱いに係る特定入院料は以下のいずれかの方法で算定可能です。  
　　　　・従来どおりの特定入院料の設定に加えて、算定要件非該当区分"2"〜"5"の該当するものを設定する。  
　　　　・診療報酬上臨時的取り扱いに係る特定入院料のコードを入院料に設定する。  
　　　　注意事項  
　　　　　・新型コロナ感染症患者の入院登録時の保険組み合わせは公費「028 感染症入院」を含んだもので設定を行ってください。  
　　　　　・入院登録を行うと対象の特定入院料を算定の最大上限日数となる３５日まで算定を行います。 （３６日目以降はシステム管理「5001 病棟管理情報」に設定されている入院基本料で入院料の算定を行います。） 患者状態によって２１日上限となる患者の場合は、２２日目に異動処理を行い該当入院料の算定を終了してください。  
　　　　　・「新型コロナウイルス感染症に係る診療報酬上の臨時的な取扱いについて（その 19）」により２０２０年５月２６日以降、通常の特定入院料の３倍の点数を算定できることとされましたが、５月２５日迄に入院登録済みの患者で５月２６日以降新型コロナウイルス感染症による入院で３倍の点数が算定可能な場合は、異動日に５月２６日を指定して転科転棟転室リクエストを行ってください。  
　　　　　・「新型コロナウイルス感染症に係る診療報酬上の臨時的な取扱いについて（その 34）」により２０２１年１月２２日以降、算定日数の上限を超えて算定可能な条件に該当する場合、従来の算定上限日数に到達した日を異動日として、「転科　転棟　転室」処理を行ってください。  

レスポンス一覧（入院登録）
-------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-03-24 |     |
| 2   | Information\_Time | 実施時間 | 14:38:14 |     |
| 3   | Api\_Results | 結果情報  <br>(繰り返し １０) |     |     |
| 3-1 | Api\_Result | 結果コード(ゼロ以外エラー) | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 01  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 入院登録 |     |
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
| 6-2-3 | Name | 内容を返却  <br>（0：通常登録） | 通常登録 |     |
| 6-3 | Admission\_Date | 入院日 | 2015-03-24 |     |
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
| 6-7-3 | Name | 診療科名称を返却 | 内科  |     |
| 6-8 | Doctor | 担当医（繰り返し　３） |     |     |
| 6-8-1 | Label | 内容の名称を返却 | 担当医 |     |
| 6-8-2 | Data | ドクターコードを返却 | 10001 |     |
| 6-8-3 | Name | 担当医の氏名を返却 | 日本　一 |     |
| 6-9 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 6-9-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 |     |
| 6-9-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 6-9-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 6-9-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 6-9-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 6-9-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 6-9-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加(2021-01-27) |
| 6-9-8 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 6-9-8-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 6-9-8-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 6-9-8-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 6-9-8-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 6-10 | First\_Admission\_Date | 初回入院日 | 2015-03-24 |     |
| 6-11 | Moving\_From\_Nursing | 介護からの異動 |     |     |
| 6-11-1 | Label | 内容の名称を返却 | 介護からの異動 |     |
| 6-11-2 | Data | コードを返却 | 1   |     |
| 6-11-3 | Name | 内容を返却  <br>（Data：Name、  <br>　1：対象外、  <br>　2：急性増悪により） | 対象外 |     |
| 6-12 | Room\_Charge | 室料差額 |     |     |
| 6-12-1 | Label | 内容の名称を返却 | 室料差額 |     |
| 6-12-2 | Data | 室料差額を返却 | 1000 |     |
| 6-12-3 | Name | 単位（円） | 円   |     |
| 6-13 | Over\_180days\_Hospital\_Stay | 選定入院 |     |     |
| 6-13-1 | Label | 内容の名称を返却 | 選定入院 |     |
| 6-13-2 | Data | コードを返却 | 1   |     |
| 6-13-3 | Name | 内容を返却  <br>（Data：Name、  <br>　1：選定対象、  <br>　2：選定対象外） | 選定対象 |     |
| 6-14 | Hospital\_Charge | 入院日の入院料 |     |     |
| 6-14-1 | Label | 内容の名称を返却 | 入院日の入院料 |     |
| 6-14-2 | Data | 入院料コードを返却 | 190117710 |     |
| 6-14-3 | Name | 入院料名称を返却 | 一般病棟７対１入院基本料 |     |
| 6-15 | Editing\_Hospital\_Charge | 入院会計 |     |     |
| 6-15-1 | Label | 内容の名称を返却 | 入院会計 |     |
| 6-15-2 | Data | コードを返却 | 2   |     |
| 6-15-3 | Name | 内容を返却  <br>（Data：Name、  <br>　1：入院料を算定しない、  <br>　2：入院料を算定する） | 入院料を算定する |     |
| 6-16 | Delivery | 分娩区分 |     | 追加（2016-01-26） |
| 6-16-1 | Label | 内容の名称を返却 |     | 追加（2016-01-26） |
| 6-16-2 | Data | コードを返却 |     | 追加（2016-01-26） |
| 6-16-3 | Name | 内容を返却  <br>（Data：Name、  <br>　0：分娩入院でない  <br>　1：正常分娩  <br>　2：異常分娩） |     | 追加（2016-01-26） |
| 6-17 | Direct\_Payment | 直接支払制度利用区分 |     | 追加（2016-01-26） |
| 6-17-1 | Label | 内容の名称を返却 |     | 追加（2016-01-26） |
| 6-17-2 | Data | コードを返却 |     | 追加（2016-01-26） |
| 6-17-3 | Name | 内容を返却  <br>（Data：Name、  <br>　0：利用しない  <br>　1：利用する） |     | 追加（2016-01-26） |
| 6-18 | Recurring\_Billing | 定期請求 |     |     |
| 6-18-1 | Label | 内容の名称を返却 | 定期請求 |     |
| 6-18-2 | Data | コードを返却 | 1   |     |
| 6-18-3 | Name | 内容を返却  <br>（Data：Name、  <br>　1：医療機関での設定、  <br>　2：月末時のみ請求、  <br>　3：定期請求しない） | 医療機関での設定 |     |
| 6-19 | Search\_Function | 検索時患者表示 |     |     |
| 6-19-1 | Label | 内容の名称を返却 | 検索時患者表示 |     |
| 6-19-2 | Data | Data:Name | 1   |     |
| 6-19-3 | Name | 1：表示可  <br>2：表示不可 | 表示可 |     |

レスポンス一覧（入院取消）
-------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-06-06 |     |
| 2   | Information\_Time | 実施時間 | 10:56:06 |     |
| 3   | Api\_Results | 結果情報  <br>(繰り返し １０) |     |     |
| 3-1 | Api\_Result | 結果コード(ゼロ以外エラー) | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 06  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 入院取消（会計含む） |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別  <br>(1：男性、2：女性) | 1   |     |
| 6   | History\_Number | 履歴番号 | 002 |     |
| 7   | Admission\_Date | 入院日 | 2014-06-04 |     |

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

[sample\_hsptinfmod\_v2\_nyuin.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptinfmod_v2_nyuin.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院登録  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hsptinfmodv2")BODY \= <<EOF

<data>    <private\_objects type\="record"\>        <Save\_Request type\="string"\></Save\_Request>        <Request\_Number type\="string"\>01</Request\_Number>        <Patient\_ID type\="string"\>1</Patient\_ID>        <Admission\_Date type\="string"\>2014-05-01</Admission\_Date>        <Ward\_Number type\="string"\>01</Ward\_Number>        <Room\_Number type\="string"\>101</Room\_Number>        <Room\_Charge type\="string"\>1000</Room\_Charge>        <Over180days\_Hospital\_Stay type\="string"\></Over180days\_Hospital\_Stay>        <Department\_Code type\="string"\>01</Department\_Code>        <Last\_Admission\_Date type\="string"\></Last\_Admission\_Date>        <Doctor\_Code type\="array"\>            <Doctor\_Code\_child type\="string"\>10001</Doctor\_Code\_child>        </Doctor\_Code>        <HealthInsurance\_Information type\="record"\>            <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>            <InsuranceProvider\_Number type\="string"\></InsuranceProvider\_Number>            <InsuranceProvider\_WholeName type\="string"\></InsuranceProvider\_WholeName>            <PublicInsurance\_Information type\="array"\>                <PublicInsurance\_Information\_child type\="record"\>                    <PublicInsurance\_Class type\="string"\></PublicInsurance\_Class>                    <PublicInsurance\_Name type\="string"\></PublicInsurance\_Name>                    <PublicInsurer\_Number type\="string"\></PublicInsurer\_Number>                    <PublicInsuredPerson\_Number type\="string"\></PublicInsuredPerson\_Number>                </PublicInsurance\_Information\_child>            </PublicInsurance\_Information>        </HealthInsurance\_Information>        <Hospital\_Charge type\="string"\>190799410</Hospital\_Charge>        <Recurring\_Billing type\="string"\>1</Recurring\_Billing>    </private\_objects>  
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

このエラーメッセージ一覧は他の入院異動系のエラーメッセージを全て含みます。  

|     |     |     |
| --- | --- | --- |
| エラーコード | エラーメッセージ | 備考  |
| 0001 | 医療機関コードの入力に誤りがあります |     |
| 0002 | 入院科の入力に誤りがあります |     |
| 0003 | 患者ＩＤの入力に誤りがあります |     |
| 0004 | 患者番号の入力に誤りがあります |     |
| 0005 | 保険組合せの入力に誤りがあります |     |
| 0006 | 入外区分の入力に誤りがあります |     |
| 0007 | 診療年月日の入力に誤りがあります |     |
| 0008 | 入退院・給食情報区分の入力に誤りがあります |     |
| 0009 | 入退院・給食情報が未設定です |     |
| 0011 | 入退院・給食情報が二重に送信されています |     |
| 0012 | 入退院・給食情報区分が二重送信されています |     |
| 0013 | オーダーＩＤの入力に誤りがあります |     |
| 0014 | 入院区分の入力に誤りがあります |     |
| 0015 | 入院区分が二重送信されています |     |
| 0016 | 継続区分の入力に誤りがあります |     |
| 0017 | 継続区分が二重送信されています |     |
| 0018 | 病棟番号の入力に誤りがあります |     |
| 0019 | 病棟番号が二重送信されています |     |
| 0020 | 病室番号の入力に誤りがあります |     |
| 0021 | 病室番号が二重送信されています |     |
| 0022 | 室料差額が二重送信されています |     |
| 0024 | 室料差額の入力に誤りがあります |     |
| 0025 | 担当医の入力に誤りがあります |     |
| 0026 | 担当医が規定件数を超えて送信されています |     |
| 0028 | 入院中の患者に対して入院登録が送信されています |     |
| 0029 | 入院日≦前回退院日です |     |
| 0030 | 入院料が算定できません |     |
| 0032 | 入力内容に該当する保険組合せがありません |     |
| 0033 | 前回入院日の入力に誤りがあります |     |
| 0034 | 特定入院料が二重送信されています |     |
| 0035 | 特定入院料の入力に誤りがあります |     |
| 0036 | 前回入院日に該当する入院履歴がありません |     |
| 0037 | 自院歴が［入院中］です。継続入院としてください |     |
| 0038 | 自院歴が［入院中］です。退院日の翌日を入院日にしてください |     |
| 0039 | 入院日＜前回退院日です |     |
| 0040 | 入院科が二重送信されています |     |
| 0041 | 保険組合せが二重送信されています |     |
| 0042 | 特定入院料が未設定です |     |
| 0043 | 継続入院ではない同日再入院です |     |
| 0044 | 他院歴との同日再入院です |     |
| 0046 | 退院事由の入力に誤りがあります |     |
| 0047 | 退院事由が二重送信されています |     |
| 0048 | 定期請求が実行中の為、退院登録できません |     |
| 0049 | 定期請求の請求期間変更による収納があります |     |
| 0050 | 退院日後の診療行為の入力があります |     |
| 0051 | 入院履歴が未登録です |     |
| 0052 | 既に退院済みです |     |
| 0053 | 入院日＞退院日です |     |
| 0054 | 前回異動日＞退院日です |     |
| 0055 | 定期請求済み期間にかかる退院登録です |     |
| 0056 | 退院登録月の入院会計が存在しません |     |
| 0058 | 定期請求の請求期間変更による入金済収納があります |     |
| 0059 | 診療科の取得に失敗しました |     |
| 0060 | 請求期間の取得に失敗しました |     |
| 0061 | 負担金の計算に失敗しました |     |
| 0064 | 同日再入院で同日の退院はできません |     |
| 0069 | 転科処理以外での入院科の変更はできません |     |
| 0070 | 転科・転棟・転室以外での保険組合せの変更はできません |     |
| 0075 | 入院期間外です |     |
| 0076 | 入院会計が存在しません |     |
| 0085 | 食事時間の入力に誤りがあります |     |
| 0086 | 食事時間入力が二重送信されています |     |
| 0097 | 入院日＞異動日です |     |
| 0098 | 前回異動日＞異動日です |     |
| 0099 | 担当医が未設定です |     |
| 0133 | 入院日の日付が異なります |     |
| 0134 | 異動日が受付範囲外（前々月以前）です |     |
| 0135 | 選択食は入力できません |     |
| 0136 | 食事日の複数日指定の入力に誤りがあります |     |
| 0137 | 食事日数が入力されていません |     |
| 0138 | 一括入力で入院期間外の日付が指定されています |     |
| 0140 | 介護からの異動の入力に誤りがあります |     |
| 0141 | 定期請求区分の入力に誤りがあります |     |
| 0142 | 異動歴がありません |     |
| 0143 | 入院中の患者に対して退院取消が送信されています |     |
| 0145 | 食事の種類の入力に誤りがあります |     |
| 0146 | 医療区分項目番号の入力に誤りがあります |     |
| 0147 | ＡＤＬ区分項目番号の入力に誤りがあります |     |
| 0148 | 医療区分項目状態の入力に誤りがあります |     |
| 0149 | 医療区分項目複数日設定の入力に誤りがあります |     |
| 0150 | 医療区分項目複数日設定のカンマの数に誤りがあります |     |
| 0151 | 連続して算定可能な日数を超えています |     |
| 0152 | ＡＤＬ項目点数の入力に誤りがあります |     |
| 0153 | ＡＤＬ項目複数日設定の入力に誤りがあります |     |
| 0154 | ＡＤＬ項目複数日設定のカンマの数に誤りがあります |     |
| 0155 | 算定要件非該当区分の入力に誤りがあります |     |
| 0156 | 選定入院の入力に誤りがあります |     |
| 0157 | 入院会計入院料算定区分の入力に誤りがあります |     |
| 0158 | 入院患者照会時表示区分の入力に誤りがあります |     |
| 0159 | 入院加算の入力に誤りがあります |     |
| 0160 | 食事療養（２）で特別食は算定できません |     |
| 0161 | 特定曜日入退院減算は土曜、日曜のみ入力可能です |     |
| 0162 | 分娩区分の入力に誤りがあります |     |
| 0163 | 直接支払制度利用区分の入力に誤りがあります |     |
| 0164 | 社保または国保の保険組合せを入力してください |     |
| 0165 | 入院日数の入力に誤りがあります |     |
| 0166 | 入院料の入力に誤りがあります |     |
| 0167 | 分娩介助料の入力に誤りがあります |     |
| 0168 | 分娩料の入力に誤りがあります |     |
| 0169 | 新生児管理保育料の入力に誤りがあります |     |
| 0170 | 検査・薬剤料の入力に誤りがあります |     |
| 0171 | 処置・手当料の入力に誤りがあります |     |
| 0172 | 産科医療補償制度掛金の入力に誤りがあります |     |
| 0173 | その他の入力に誤りがあります |     |
| 0174 | 一部負担金等の入力に誤りがあります |     |
| 0175 | 請求年月の入力に誤りがあります |     |
| 0176 | 提出日区分の入力に誤りがあります |     |
| 0177 | 請求区分の入力に誤りがあります |     |
| 0178 | 提出先区分の入力に誤りがあります |     |
| 0179 | 在胎週数が１２週未満です |     |
| 0180 | 在胎週数の入力に誤りがあります |     |
| 0181 | 出産年月日の入力に誤りがあります |     |
| 0182 | 死産有無区分の入力に誤りがあります |     |
| 0183 | 出産数の入力に誤りがあります |     |
| 0184 | 産科医療補償制度対象区分の入力に誤りがあります |     |
| 0185 | 備考の入力に誤りがあります |     |
| 0186 | 保険者番号の入力に誤りがあります |     |
| 0187 | 後期高齢者の保険は指定できません |     |
| 0188 | 本人家族区分の入力に誤りがあります |     |
| 0189 | 被保険者証記号の入力に誤りがあります |     |
| 0190 | 被保険者証番号の入力に誤りがあります |     |
| 0191 | 被保険者証記号はすべて全角で入力してください |     |
| 0192 | 被保険者証番号はすべて全角で入力してください |     |
| 0193 | 経管栄養は平成２８年４月以降に入力してください |     |
| 0194 | 入院会計が作成できません | 追加  <br>(2017-11-27) |
| 0195 | 既に退院済みか入院履歴が存在しません | 追加  <br>(2017-11-27) |
| 0196 | 入院料初期値設定区分の入力に誤りがあります | Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 0197 | 強制更新の入力に誤りがあります | Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 0198 | 定期請求が行われていないため、退院登録はできません | Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 0199 | 更新対象の入院会計が１２ヶ月を超えています | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 0200 | 保険組合せ仮番号設定区分の入力に誤りがあります | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 0201 | 食事継続区分の入力に誤りがあります | Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 0202 | ＤＥＳＩＧＮ−Ｒ合計点のカンマの数に誤りがあります | 追加  <br>(2018-09-25) |
| 0203 | ＤＥＳＩＧＮ−Ｒ合計点の入力に誤りがあります | 追加  <br>(2018-09-25) |
| 0204 | 転科・転棟・転室が既に行われています。訂正はできません | 追加  <br>(2018-11-27) |
| 0205 | 同日再入院の入院登録です。訂正はできません | 追加  <br>(2018-11-27) |
| 0206 | 異動日を含む診療年月の入院会計が存在しません | 追加  <br>(2019-01-28) |
| 7001 | 負担金計算に失敗しました。保険組合せが存在しません | ※１  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-05-28) |
| 8001 | 入院日の入力に誤りがあります |     |
| 8002 | 入院日は平成２４年（２０１２年）４月以降を指定してください |     |
| 8003 | リクエスト番号の入力に誤りがあります |     |
| 8005 | 処理対象の入院履歴が存在しません |     |
| 8006 | 過去の入院履歴の更新はできません |     |
| 8007 | 異動日の入力に誤りがあります |     |
| 8008 | 異動日は平成２４年（２０１２年）４月以降を指定してください |     |
| 8009 | 診療日の入力に誤りがあります |     |
| 8010 | 診療日の入院履歴がありません |     |
| 8011 | 外泊等区分の入力に誤りがあります |     |
| 8012 | 診療日は平成２４年（２０１２年）４月以降を指定してください |     |
| 8013 | 終了日の入力に誤りがあります |     |
| 8014 | 終了日は診療日と同じ月の日付を指定してください |     |
| 8015 | 請求日＜退院日となっています |     |
| 8016 | 請求年月≦退院月となっています |     |
| 8017 | 妊婦負担額の計算上限をオーバーしています |     |
| 8018 | 保険者番号を入力してください |     |
| 8019 | 本人家族区分を入力してください |     |
| 8020 | 被保険者証番号を入力してください |     |
| 8021 | 記号と番号は合わせて１９文字以内で入力してください |     |
| 8022 | 出産年月日を入力してください |     |
| 8023 | 死産有無区分を入力してください |     |
| 8024 | 出産数を入力してください |     |
| 8025 | 直接支払制度利用区分を入力してください |     |
| 8026 | 請求年月を入力してください |     |
| 8027 | 提出日区分を入力してください |     |
| 8028 | 請求区分を入力してください |     |
| 8029 | 分娩区分を入力してください |     |
| 8030 | 正常分娩で分娩介助料が入力されています |     |
| 8031 | 異常分娩で分娩料が入力されています |     |
| 8032 | 提出先区分を入力してください |     |
| 8033 | 正常分娩の場合、提出先区分は国保連合会を入力してください |     |
| 8034 | 提出先区分に支払基金を入力してください |     |
| 8035 | 提出先区分に国保連合会を入力してください |     |
| 8036 | 出産数が１人で死産有無区分に混在が入力されています |     |
| 8037 | 出産数が１人で産科医療保障制度対象区分に"混在が入力されています |     |
| 8038 | 直接支払制度対象区分を入力してください |     |
| 8039 | 産科医療保障制度の対象外で掛金が入力されています |     |
| 8040 | 分娩機関管理番号がシステム管理（１００１）に設定されていません |     |
| 8041 | 在胎週数が２２週未満です |     |
| 8043 | 出産年月日の同じデータが既に登録されています |     |
| 8044 | 在胎週数を入力してください |     |
| 8045 | 入院日数を入力してください |     |
| 8046 | 異常分娩は２５日請求できません |     |
| 8047 | 室料差額がシステム管理（５００５）に設定されていません | 追加  <br>(2017-12-20) |
| 8051 | 更新処理に失敗しました |     |
| 8097 | 送信内容に誤りがあります |     |
| 8098 | 送信内容の読込ができませんでした |     |
| 8099 | ユーザＩＤが未登録です |     |
| 8900 | システム項目が設定できません |     |
| 8901 | 職員情報が取得できません |     |
| 8902 | 医療機関情報が取得できません |     |
| 8903 | システム日付が取得できません |     |
| 8905 | 患者番号構成情報が取得できません |     |
| 8915 | グループ医療機関が不整合です。処理を終了して下さい |     |
| 8916 | 出産育児一時金の情報は登録されていません |     |
| 9999 | 他端末で使用中です |     |

  ※１：このエラーメッセージは一例になります。  
 　　　このエラーに該当した場合に返却されるエラーメッセージは「負担金計算に失敗しました。 + 詳細なエラー内容」になります。  
 　　　詳細なエラー内容が無い場合は「負担金計算に失敗しました」のエラーメッセージを返却します。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#wrapper)

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
