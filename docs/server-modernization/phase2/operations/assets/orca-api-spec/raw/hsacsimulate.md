[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#content)

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
 > 仮計算情報

API 仮計算情報返却  

==============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#errmsg)
      
    

更新履歴
----

2022-08-29　「室料差額（Ml\_Room\_Charge）」「室料差額消費税−再掲（Ml\_Tax\_In\_Room\_Charge）」を追加。  

2014-08-01  「エラーメッセージ一覧」を追加。

概要
--

POSTメソッドによる仮計算情報の返却を行います。

日レセ Ver4.7.0\[第21回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsacsimulate\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsacsimulate\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_hsacsimulate\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsacsimulatev2  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Discharge\_Date type\="string"\>2013-11-20</Discharge\_Date>        </private\_objects>  
</data>  

### 処理概要

リクエストにより入院中患者の退院時の請求額等の仮計算情報の返却を行います。

### 処理詳細

1.  仮退院年月日の妥当性チェック
2.  患者番号の存在チェック

*   請求期間（入院日または前回請求期間後から退院日まで）の点数、患者負担額、食事療養費、自費金額を返却します。  
    また、請求期間に複数の保険組合せの入力がある場合、保険組合せ毎の計算結果及び合計の返却を行います。
*   患者負担額の計算については、患者情報に登録されている保険、公費（全国公費、地方公費）、高額療養費、低所得等の設定を元に計算を行います。また、計算結果に端数が生じる場合、システム管理「1001 医療機関情報ー基本」の設定に応じて端数調整を行います。
*   請求期間は最大２ヶ月指定可能で、指定した仮退院日での請求情報を返却します。

   

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-11-20</Information\_Date>    <Information\_Time type\="string"\>15:25:12</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Start\_Date type\="string"\>20131120</Start\_Date>    <End\_Date type\="string"\>20131120</End\_Date>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Admission\_Date type\="string"\>2013-11-20</Admission\_Date>    <Acsimulate\_Information type\="array"\>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>0</Data>          <Name type\="string"\>明細</Name>        </Information\_Class>        <Perform\_Month type\="string"\>2013-11</Perform\_Month>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <HealthInsurance\_Information type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0003</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234567</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      3410</Ac\_Money>          <Ai\_Money type\="string"\>         0</Ai\_Money>          <Oe\_Money type\="string"\>      1000</Oe\_Money>          <Pi\_Smoney type\="string"\>      2410</Pi\_Smoney>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      4822</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      4822</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>        <Ml\_Room\_Charge type\="string"\>     21000</Ml\_Room\_Charge>        <Ml\_Tax\_In\_Room\_Charge type\="string"\>         0</Ml\_Tax\_In\_Room\_Charge>      </Acsimulate\_Information\_child>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>1</Data>          <Name type\="string"\>月合計</Name>        </Information\_Class>        <Perform\_Month type\="string"\>2013-11</Perform\_Month>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      3410</Ac\_Money>          <Ai\_Money type\="string"\>         0</Ai\_Money>          <Oe\_Money type\="string"\>      1000</Oe\_Money>          <Pi\_Smoney type\="string"\>      2410</Pi\_Smoney>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      4822</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      4822</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>        <Ml\_Room\_Charge type\="string"\>     21000</Ml\_Room\_Charge>        <Ml\_Tax\_In\_Room\_Charge type\="string"\>         0</Ml\_Tax\_In\_Room\_Charge>      </Acsimulate\_Information\_child>      <Acsimulate\_Information\_child type\="record"\>        <Information\_Class type\="record"\>          <Label type\="string"\>請求情報種別</Label>          <Data type\="string"\>2</Data>          <Name type\="string"\>総合計</Name>        </Information\_Class>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      3410</Ac\_Money>          <Ai\_Money type\="string"\>         0</Ai\_Money>          <Oe\_Money type\="string"\>      1000</Oe\_Money>          <Pi\_Smoney type\="string"\>      2410</Pi\_Smoney>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      4822</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      4822</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>        <Ml\_Room\_Charge type\="string"\>     21000</Ml\_Room\_Charge>        <Ml\_Tax\_In\_Room\_Charge type\="string"\>         0</Ml\_Tax\_In\_Room\_Charge>      </Acsimulate\_Information\_child>    </Acsimulate\_Information>  </private\_objects>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 12  | 必須  |
| 2   | Discharge\_Date | 退院日 | 2013-11-20 | 省略時はシステム日付 |

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-11-20 |     |
| 2   | Information\_Time | 実施時間 | 15:25:12 |     |
| 3   | Api\_Result | 結果コード | 00  |     |
| 4   | Api\_Result\_Message | 結果メッセージ | 処理終了 |     |
| 5   | Start\_Date | 請求開始日 | 20131120 |     |
| 6   | End\_Date | 請求終了日 | 20131120 |     |
| 7   | Patient\_Information | 患者情報 |     |     |
| 7-1 | Patient\_ID | 患者番号 | 00012 |     |
| 7-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 7-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 7-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 7-5 | Sex | 性別  <br>（1:男性、2:女性） | 1   |     |
| 8   | Admission\_Date | 入院日 | 2013-11-20 |     |
| 9   | Acsimulate\_Information | 請求情報（繰り返し　１３） |     |     |
| 9-1 | Information\_Class | 請求情報種別 |     |     |
| 9-1-1 | Label | 内容の名称 | 請求情報種別 |     |
| 9-1-2 | Data | コード | 0   |     |
| 9-1-3 | Name | 内容  <br>（Data:name、  <br>0:明細、  <br>1:月合計、  <br>2:総合計） | 明細  |     |
| 9-2 | Perform\_Month | 診療年月  <br>（総合計は表示なし） | 2013-11 |     |
| 9-3 | Department\_Code | 診療科コード  <br>（月合計、総合計は表示なし） | 01  |     |
| 9-4 | Department\_Name | 診療科名称  <br>（月合計、総合計は表示なし） | 内科  |     |
| 9-5 | HealthInsurance\_Information | 保険組合せ情報  <br>（月合計、総合計は表示なし） |     |     |
| 9-5-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0003 |     |
| 9-5-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 9-5-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 9-5-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 9-5-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 9-5-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 9-5-7 | PublicInsurance\_Information | 公費情報（繰り返し ４） |     |     |
| 9-5-7-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 9-5-7-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ |     |
| 9-5-7-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 9-5-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 9-6 | Cd\_Information | 負担額情報 |     |     |
| 9-6-1 | Ac\_Money | 請求金額 | 3410 |     |
| 9-6-2 | Ai\_Money | 保険適用金額  <br>　負担金額（円）の保険分 | 0   |     |
| 9-6-3 | Oe\_Money | 自費金額  <br>　負担金額（円）の自費分  <br>　+ その他自費のその他計の合計 | 1000 |     |
| 9-6-4 | Om\_Smoney | 老人一部負担金  <br>（ゼロは非表示） |     |     |
| 9-6-5 | Pi\_Smoney | 公費一部負担金  <br>（ゼロは非表示） | 2410 |     |
| 9-6-6 | Ml\_Smoney | 食事・生活療養負担金 | 0   |     |
| 9-6-7 | Lsi\_Total\_Money | 労災合計金額  <br>　労災自賠責保険適用分（円）の集計値  <br>（初診 + 再診 + 指導 + その他）  <br>（ゼロは非表示） |     |     |
| 9-6-8 | Dis\_Money | 減免金額（ゼロは非表示） |     |     |
| 9-7 | Ac\_Point\_Information | 請求点数 |     |     |
| 9-7-1 | Ac\_Ttl\_Point | 合計点数  <br>　保険分の合計点数 | 4822 |     |
| 9-7-2 | Ac\_Point\_Detail | 点数詳細 （繰り返し １６） |     |     |
| 9-7-2-1 | AC\_Point\_Name | 名称  | 初・再診料 | ※１  |
| 9-7-2-2 | AC\_Point | 点数  | 0   |     |
| 9-8 | Ml\_Cost | 食事・生活療養費 | 0   |     |
| 9-9 | Ml\_Room\_Charge | 室料差額 |     | 追加  <br>(2022-08-29) |
| 9-10 | Ml\_Tax\_In\_Room\_Charge | 室料差額消費税−再掲 |     | 追加  <br>(2022-08-29) |

 ※１：療養担当手当（16）は、点数ゼロは編集なし。  
　　　初診・再診料〜入院料は、点数ゼロを編集。

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

[sample\_hsacsimulate\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsacsimulate_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 仮計算情報返却   
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/hsacsimulatev2")  
#  
\# 1.患者番号    Patient\_ID      (REQUIRED)  
\# 2.退院日      Discharge\_Date  (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Discharge\_Date type\="string"\>2013-11-20</Discharge\_Date>        </private\_objects>  
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

| エラーコード | エラーメッセージ | 備考  |
| --- | --- | --- |
| 00  | 処理終了 |     |
| 01  | 退院日の設定に誤りがあります |     |
| 02  | 患者番号の設定に誤りがあります |     |
| 03  | 入院情報が取得できません |     |
| 04  | 退院登録済みの患者です |     |
| 05  | 請求開始日＞退院日です |     |
| 06  | 請求期間の月数が２か月を超えています |     |
| 07  | 負担金計算に失敗しました。保険組合せの有効期間が切れています | 左のエラーメッセージは一例になります。  <br>  <br>このエラーに該当した場合に返却されるエラーメッセージは「負担金計算に失敗しました。 + 詳細なエラー内容」になります。  <br>詳細なエラー内容が無い場合は「負担金計算に失敗しました」のエラーメッセージを返却します。 |
| 89  | 職員情報が取得できません |     |
| 医療機関情報が取得できません |     |
| システム日付が取得できません |     |
| 患者番号構成情報が取得できません |     |
| グループ医療機関が不整合です。処理を終了して下さい |     |
| システム項目が設定できません |     |
| 92  | 診療年月は平成２０年（２００８年）４月以降を指定してください |     |
| 97  | 送信内容に誤りがあります |     |
| 98  | 送信内容の読込ができませんでした |     |
| 99  | ユーザIDが未登録です |     |
| それ以外 | 返却情報の編集でエラーが発生しました |     |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 仮計算情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hsacsimulate.html#wrapper)

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
