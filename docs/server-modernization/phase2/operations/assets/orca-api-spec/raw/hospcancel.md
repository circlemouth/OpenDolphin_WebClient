[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#content)

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
 > 退院登録

退院登録  

=======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#request)
    
*   [レスポンス一覧（退院登録）](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#response)
    
*   [レスポンス一覧（退院取消）](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#response2)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#errmsg)
      
    

更新履歴
----

 2018-01-23   （Ver5.0.0以降のみ）「リクエスト一覧」に項目を追加。  
 　　　　　　　（Ver5.0.0以降のみ）「レスポンス一覧（退院登録）」に項目を追加。  

 2017-03-14   「エラーメッセージ一覧」を追加。

概要
--

POSTメソッドにより入院患者の退院登録を行います。

日レセ Ver.4.7.0\[第46回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式となります。

テスト方法
-----

1.  参考提供されている sample\_hsptinfmod\_v2\_taiin.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptinfmod\_v2\_taiin.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptinfmod\_v2\_taiin.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsptinfmodv2  
  
Request\_Number:  
    02: 退院登録  
    07: 退院取消  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Request\_Number type\="string"\>02</Request\_Number>                <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>                <Discharge\_Date type\="string"\>2014-06-04</Discharge\_Date>                <Discharge\_Reason type\="string"\>01</Discharge\_Reason>        </private\_objects>  
</data>  

### 処理概要

退院登録リクエストにより入院患者の退院処理を行います。

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>　0：残さない  <br>　1：残す | 1   | 未設定時初期値\[0\]を設定  <br>(日レセにリクエストの情報を保持するか否かを指定) |
| 2   | Request\_Number | リクエスト番号  <br>　02：退院登録  <br>　07：退院取消 | 02  | 必須  |
| 3   | Force\_Update | 強制更新  <br>　False：歴月が２ヶ月を超える退院請求をエラーとする。  <br>　True：歴月が２ヶ月を超える退院請求をエラーとしない。 | False | 未設定時初期値\[False\]を設定  <br>※１  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 4   | Patient\_ID | 患者番号 | 12  | 必須（退院登録、退院取消） |
| 5   | Admission\_Date | 入院日 | 2014-06-03 | 必須（退院登録、退院取消） |
| 6   | Discharge\_Date | 退院日 | 2014-06-04 | 必須（退院登録） |
| 7   | Discharge\_Reason | 退院事由 | 01  | システム管理\[5013 退院事由情報\]に登録のある退院事由コードを設定 |

 ※１：強制更新に"True"を設定し、入院日、又は前回定期請求から歴月で２ヶ月を超える場合、退院請求では退院日の属する月の前月の1日からの退院請求を作成します。このため、_**必ずそれ以前の請求を定期請求の個別処理で行ってください。**_  
　　（例）１月１０日入院し、３月１０日に退院した場合（強制更新="True"、定期請求未実施）  
　　　　　→　退院請求期間：２月１日〜３月１０日  
　　　　　　　１月中の請求は定期請求の個別処理を実行して行う。

レスポンス一覧（退院登録）
-------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-06-04 |     |
| 2   | Information\_Time | 実施時間 | 11:04:57 |     |
| 3   | Api\_Results | 結果情報  <br>（繰り返し １０） |     |     |
| 3-1 | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 02  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 退院登録 |     |
| 5   | Start\_Date | 請求開始日  <br>（入院日または前回定期請求の翌日） | 2014-06-03 |     |
| 6   | End\_Date | 請求終了日  <br>（リクエストの退院日） | 2014-06-04 |     |
| 7   | Unbilled\_Period\_Start\_Date | 未請求期間開始日 |     | 強制更新による定期請求未実施期間開始日  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 8   | Unbilled\_Period\_End\_Date | 未請求期間終了日 |     | 強制更新による定期請求未実施期間終了日  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-01-23) |
| 9   | Patient\_Information | 患者情報 |     |     |
| 9-1 | Patient\_ID | 患者番号 | 00012 |     |
| 9-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 9-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 9-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 9-5 | Sex | 性別（1：男性、2：女性） | 1   |     |
| 10  | History\_Number | 履歴番号 | 001 |     |
| 11  | Admission\_Date | 入院日 | 2014-06-03 |     |
| 12  | Acsimulate\_Information | 請求情報  <br>（繰り返し　１３）  <br>（診療年月順） |     |     |
| 12-1 | Information\_Class | 請求情報種別 |     |     |
| 12-1-1 | Label | 内容の名称を返却 | 請求情報種別 |     |
| 12-1-2 | Data | 請求情報種別コードを返却 | 0   |     |
| 12-1-3 | Name | 請求情報種別の名称を返却  <br>　（Data：Name、  <br>　　0：明細、  <br>　　1：月毎合計、  <br>　　2：総合計 ） | 明細  |     |
| 12-2 | Perform\_Month | 診療年月  <br>（総合計は表示なし） | 2014-06 |     |
| 12-3 | Invoice\_Number | 伝票番号  <br>（月合計、総合計は表示なし） | 0000002 |     |
| 12-4 | Department\_Code | 診療科コード  <br>（月合計、総合計は表示なし） | 01  |     |
| 12-5 | Department\_Name | 診療科名称  <br>（月合計、総合計は表示なし） | 内科  |     |
| 12-6 | HealthInsurance\_Information | 保険組合せ情報  <br>（月合計、総合計は表示なし） |     |     |
| 12-6-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 |     |
| 12-6-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 12-6-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 12-6-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 12-6-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 12-6-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 12-6-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 12-6-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 12-6-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 12-6-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 12-6-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 12-7 | Cd\_Information | 負担額情報 |     |     |
| 12-7-1 | Ac\_Money | 請求金額 | 7800 |     |
| 12-7-2 | Ai\_Money | 保険適用金額  <br>　負担金額(円)の保険分 | 5800 |     |
| 12-7-3 | Oe\_Money | 負担金額(円)の保険分  <br>　負担金額(円)の自費分 + その他自費のその他の合計 | 2000 |     |
| 12-7-4 | Om\_Smoney | 老人一部負担金  <br>（ゼロは非表示） |     |     |
| 12-7-5 | Pi\_Smoney | 公費一部負担金  <br>（ゼロは非表示） |     |     |
| 12-7-6 | Ml\_Smoney | 食事・生活療養負担金 | 0   |     |
| 12-7-7 | Lsi\_Total\_Money | 労災合計金額  <br>　労災自賠責保険適用分(円)の集計値  <br>　　（初診 + 再診 + 指導 + その他）  <br>（ゼロは非表示） |     |     |
| 12-7-8 | Dis\_Money | 減免金額  <br>（ゼロは非表示） |     |     |
| 12-8 | Ac\_Point\_Information | 請求点数 |     |     |
| 12-8-1 | Ac\_Ttl\_Point | 合計点数 | 1932 |     |
| 12-8-2 | Ac\_Point\_Detail | 点数詳細  <br>（繰り返し　１６） |     |     |
| 12-8-2-1 | AC\_Point\_Name | 名称  | 初・再診料 | ※１  |
| 12-8-2-2 | AC\_Point | 点数  | 0   |     |
| 12-9 | Ml\_Cost | 食事・生活療養費 | 0   |     |

 ※：療養担当手当(16)は、点数ゼロは編集しません。  
　　　初診・再診料〜入院料は、点数ゼロを編集します。

###  レスポンスサンプル

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-06-04</Information\_Date>    <Information\_Time type\="string"\>11:04:57</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>02</Data>      <Name type\="string"\>退院登録</Name>    </Request\_Number>    <Start\_Date type\="string"\>2014-06-03</Start\_Date>    <End\_Date type\="string"\>2014-06-04</End\_Date>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <History\_Number type\="string"\>001</History\_Number>    <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>    <Acsimulate\_Information type\="array"\>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>0</Data>          <Name type\="string"\>明細</Name>        </Information\_Class>        <Perform\_Month type\="string"\>2014-06</Perform\_Month>        <Invoice\_Number type\="string"\>0000002</Invoice\_Number>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <HealthInsurance\_Information type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>        </HealthInsurance\_Information>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      7800</Ac\_Money>          <Ai\_Money type\="string"\>      5800</Ai\_Money>          <Oe\_Money type\="string"\>      2000</Oe\_Money>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      1932</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      1932</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>      </Acsimulate\_Information\_child>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>1</Data>          <Name type\="string"\>月合計</Name>        </Information\_Class>        <Perform\_Month type\="string"\>2014-06</Perform\_Month>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      7800</Ac\_Money>          <Ai\_Money type\="string"\>      5800</Ai\_Money>          <Oe\_Money type\="string"\>      2000</Oe\_Money>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      1932</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      1932</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>      </Acsimulate\_Information\_child>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>2</Data>          <Name type\="string"\>総合計</Name>        </Information\_Class>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      7800</Ac\_Money>          <Ai\_Money type\="string"\>      5800</Ai\_Money>          <Oe\_Money type\="string"\>      2000</Oe\_Money>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      1932</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      1932</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>      </Acsimulate\_Information\_child>    </Acsimulate\_Information>  </private\_objects>  
</xmlio2>

レスポンス一覧（退院取消）
-------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-06-06 |     |
| 2   | Information\_Time | 実施時間 | 11:21:55 |     |
| 3   | Api\_Results | 結果情報  <br>（繰り返し １０） |     |     |
| 3-1 | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 07  |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 退院取消 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別（1：男性、2：女性） | 1   |     |
| 6   | History\_Number | 履歴番号 | 001 |     |
| 7   | Admission\_Date | 入院日 | 2014-06-03 |     |

###  レスポンスサンプル

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-06-06</Information\_Date>    <Information\_Time type\="string"\>11:21:55</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>0000</Api\_Result>        <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>07</Data>      <Name type\="string"\>退院取消</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Hospital\_Stay\_Infomation type\="record"\>      <History\_Number type\="string"\>001</History\_Number>      <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>    </Hospital\_Stay\_Infomation>  </private\_objects>  
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

[sample\_hsptinfmod\_v2\_taiin.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptinfmod_v2_taiin.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 退院登録  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hsptinfmodv2")BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>1</Patient\_ID>                <Request\_Number type\="string"\>02</Request\_Number>                <Admission\_Date type\="string"\>2014-05-01</Admission\_Date>                <Discharge\_Date type\="string"\>2014-05-22</Discharge\_Date>                <Discharge\_Reason type\="string"\>01</Discharge\_Reason>        </private\_objects>  
</data>

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}

エラーメッセージ一覧  

-------------

入院登録([https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
)を参照。   

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 退院登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospcancel.html#wrapper)

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
