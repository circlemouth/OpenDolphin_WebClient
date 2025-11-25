[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#content)

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
 > 収納情報

API 収納情報返却  

=============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#errmsg)
      
    

更新履歴
----

2024-11-26  「レスポンス一覧」に項目を追加。  

2021-01-27  「レスポンス一覧」に項目を追加。  

2017-05-25  「レスポンス一覧」に項目を追加。

2014-07-03  「エラーメッセージ一覧」を追加。

概要
--

POSTメソッドによる収納情報の返却を行います。

日レセ Ver4.7.0\[第23回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_incomeinf\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_incomeinf\_v2.rb 内の患者番号、診療年月日を接続先の日レセの環境に合わせます。
3.  ruby sample\_incomeinf\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/incomeinfv2  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Perform\_Month type\="string"\>2013-10</Perform\_Month>        </private\_objects>  
</data>  

### 処理概要

リクエストにより該当患者の収納情報の返却を行います。

### 処理詳細

1.  基準日(月または年)の妥当性チェック
2.  患者番号の存在チェック

*   指定した患者の診療日または診療月、診療年の収納情報（点数、負担金額等）が取得可能であること。
*   点数は基本診療料、特掲診療料（医学管理、在宅医療等）毎に返却を行う。
*   未収金または、過入金の収納が存在する場合、その情報（診療日、未収額等）の返却を行う。
*   連携相手側でこの情報及び実装済みの日レセAPIを利用して、請求書、カルテ３号紙等と同様の情報が取得可能であること。

   

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-12-11</Information\_Date>    <Information\_Time type\="string"\>12:21:52</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Income\_Information\_Overflow type\="string"\>false</Income\_Information\_Overflow>    <Income\_Information type\="array"\>      <Income\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2013-10-01</Perform\_Date>        <InOut type\="string"\>2</InOut>        <Invoice\_Number type\="string"\>0000053</Invoice\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Rate\_Cd type\="string"\>  0</Rate\_Cd>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>         0</Ac\_Money>          <Ic\_Money type\="string"\>         0</Ic\_Money>          <Ai\_Money type\="string"\>         0</Ai\_Money>          <Oe\_Money type\="string"\>         0</Oe\_Money>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      1800</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>A00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>        69</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>B00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>C00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>F00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>        68</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>G00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>J00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>K00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>      1663</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>L00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>D00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>E00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>H00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>I00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>M00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>N00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>A10</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>      </Income\_Information\_child>      <Income\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2013-10-08</Perform\_Date>        <Perform\_End\_Date type\="string"\>2013-10-09</Perform\_End\_Date>        <InOut type\="string"\>1</InOut>        <Invoice\_Number type\="string"\>0000001</Invoice\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Rate\_Cd type\="string"\>  0</Rate\_Cd>        <Department\_Code type\="string"\>10</Department\_Code>        <Department\_Name type\="string"\>外科</Department\_Name>        <Cd\_Information type\="record"\>          <Ac\_Money type\="string"\>      2000</Ac\_Money>          <Ic\_Money type\="string"\>      2000</Ic\_Money>          <Ai\_Money type\="string"\>         0</Ai\_Money>          <Oe\_Money type\="string"\>      2000</Oe\_Money>          <Ml\_Smoney type\="string"\>         0</Ml\_Smoney>        </Cd\_Information>        <Ac\_Point\_Information type\="record"\>          <Ac\_Ttl\_Point type\="string"\>      4032</Ac\_Ttl\_Point>          <Ac\_Point\_Detail type\="array"\>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>A00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>B00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>C00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>F00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>G00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>J00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>K00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>L00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>D00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>E00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>H00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>I00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>M00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>N00</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>              <AC\_Point type\="string"\>         0</AC\_Point>            </Ac\_Point\_Detail\_child>            <Ac\_Point\_Detail\_child type\="record"\>              <AC\_Point\_Code type\="string"\>A10</AC\_Point\_Code>              <AC\_Point\_Name type\="string"\>入院料</AC\_Point\_Name>              <AC\_Point type\="string"\>      4032</AC\_Point>            </Ac\_Point\_Detail\_child>          </Ac\_Point\_Detail>        </Ac\_Point\_Information>        <Ml\_Cost type\="string"\>         0</Ml\_Cost>      </Income\_Information\_child>    </Income\_Information>    <Insurance\_Information type\="array"\>      <Insurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>１２３</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>４５６</HealthInsuredPerson\_Number>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234567</PublicInsuredPerson\_Number>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </Insurance\_Information\_child>    </Insurance\_Information>  </private\_objects>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 12  | 必須  |
| 2   | Perform\_Date | 診療日 | 2013-10-10 | 省略時はシステム日付  <br>※１ |
| 3   | Perform\_Month | 診療月 | 2013-10 | ※１  |
| 4   | Perform\_Year | 診療年 | 2013 | ※１  |

 ※１：　診療日、診療月、診療年のいずれかを指定。複数指定があった場合は診療日、診療月、診療年の順で指定があったものとみなします。  
　　　　いずれも未指定の場合は診療日（システム日付）が設定されます。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-12-11 |     |
| 2   | Information\_Time | 実施時間 | 12:21:52 |     |
| 3   | Api\_Result | 結果コード | 0000 |     |
| 4   | Api\_Result\_Message | 結果メッセージ | 処理終了 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 5-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 6   | Income\_Information\_Overflow | 請求情報オーバーフラグ | false |     |
| 7   | Income\_Information | 請求情報（繰り返し　２００）  <br>（並び順は診療日の古い順） |     |     |
| 7-1 | Perform\_Date | 外来：診療日/入院：請求開始日 | 2013-10-01 |     |
| 7-2 | Perform\_End\_Date | 請求終了日（入院のみ。外来は非表示） |     |     |
| 7-3 | IssuedDate | 伝票発行日 | 2013-12-15 | 追加  <br>(2017-05-25) |
| 7-4 | InOut | 入外区分  <br>（1：入院、2：入院外） | 1   |     |
| 7-5 | Invoice\_Number | 伝票番号 | 0000053 |     |
| 7-6 | Group\_Invoice\_Number | まとめ伝票番号  <br>複数保険(診療科)入力時、それぞれの伝票番号を紐付ける伝 票番号 | 0000053 | 追加(2024-11-26) |
| 7-7 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 7-8 | Rate\_Cd | 負担割合（%） | 0   |     |
| 7-9 | Department\_Code | 診療科コード | 01  |     |
| 7-10 | Department\_Name | 診療科名称 | 内科  |     |
| 7-11 | Cd\_Information | 負担額情報 |     |     |
| 7-11-1 | Ac\_Money | 請求金額 | 0   |     |
| 7-11-2 | Tax\_In\_Ac\_Money | 請求金額消費税再掲（ゼロは非表示） | 960 | 追加  <br>(2017-05-25) |
| 7-11-3 | Ic\_Money | 入金額 | 0   |     |
| 7-11-4 | Ai\_Money | 保険適用金額  <br>　負担金額（円）の保険分 | 0   |     |
| 7-11-5 | Oe\_Money | 自費金額  <br>　保険適用外合計金額  <br>　＋その他自費（非課税分）合計金額  <br>　＋その他自費（課税分）合計金額  <br>　＋食事療養負担金（自費）  <br>　＋生活療養負担金（自費）  <br>　＋室料差額 | 0   |     |
| 7-11-6 | Dg\_Smoney | 薬剤一部負担金（ゼロは非表示） |     |     |
| 7-11-7 | Om\_Smoney | 老人一部負担金（ゼロは非表示） |     |     |
| 7-11-8 | Pi\_Smoney | 公費一部負担金（ゼロは非表示） |     |     |
| 7-11-9 | Ml\_Smoney | 食事・生活療養負担金（外来またはゼロは非表示）  <br>（食事療養負担金＋生活療養負担金） |     |     |
| 7-11-10 | Meal\_Smoney | 食事療養負担金（外来またはゼロは非表示） | 5460 | 追加  <br>(2017-05-25) |
| 7-11-11 | Living\_Smoney | 生活療養負担金（外来またはゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-11-12 | Lsi\_Total\_Money\_In\_Ai\_Money | 保険適用金額内労災診察等合計金額（ゼロは非表示。患者が負担する場合編集）  <br>　労災自賠責保険適用分（円）の集計値  <br>　（初診＋再診＋指導＋その他） |     | 追加  <br>(2017-05-25) |
| 7-11-13 | Lsi\_Total\_Money | 労災合計金額（患者負担の有無にかかわらず、集計値を編集）  <br>　労災自賠責保険適用分（円）の集計値  <br>（初診 + 再診 + 指導 + その他）  <br>（ゼロは非表示） |     |     |
| 7-11-14 | Dis\_Money | 減免金額（ゼロは非表示） |     |     |
| 7-11-15 | Ad\_Money1 | 調整金１（ゼロは非表示） |     |     |
| 7-11-16 | Ad\_Money2 | 調整金２（ゼロは非表示） |     |     |
| 7-12 | Ac\_Point\_Information | 請求点数 |     |     |
| 7-12-1 | Ac\_Ttl\_Point | 合計点数 | 1800 |     |
| 7-12-2 | Me\_Ttl\_Money | 保険適用外合計金額（ゼロは非表示）  <br>　負担金額（円）の自費分 | 1080 | 追加  <br>(2017-05-25) |
| 7-12-3 | Tax\_In\_Me\_Ttl\_Money | 保険適用外合計金額消費税再掲（ゼロは非表示） | 80  | 追加  <br>(2017-05-25) |
| 7-12-4 | Ac\_Point\_Detail | 点数詳細 （繰り返し １６） |     |     |
| 7-12-4-1 | AC\_Point\_Code | 識別コード  <br>（識別コード：名称、  <br>A00：初・再診料、  <br>B00：医学管理等、  <br>C00：在宅療養、  <br>F00：投薬、  <br>G00：注射、  <br>J00：処置、  <br>K00：手術、  <br>L00：麻酔、  <br>D00：検査、  <br>E00：画像診断、  <br>H00：リハビリ、  <br>I00：精神科専門、  <br>M00：放射線治療、  <br>N00：病理診断、  <br>A10：入院料、  <br>001：療養担当手当） | A00 | ※１  |
| 7-12-4-2 | AC\_Point\_Name | 名称  | 初・再診料 |     |
| 7-12-4-3 | AC\_Point | 点数  | 69  | ※１  |
| 7-12-4-4 | Me\_Money | 保険適用外金額（ゼロは非表示） | 1080 | 追加  <br>(2017-05-25) |
| 7-13 | Oe\_Etc\_Information | その他自費情報 |     | 追加  <br>(2017-05-25) |
| 7-13-1 | Oe\_Etc\_Ttl\_Money\_Non\_Taxable | その他自費（非課税分）合計金額(ゼロは非表示） | 1000 | 追加  <br>(2017-05-25) |
| 7-13-2 | Oe\_Etc\_Ttl\_Money\_Taxable | その他自費（課税分）合計金額(ゼロは非表示） | 1080 | 追加  <br>(2017-05-25) |
| 7-13-3 | Tax\_In\_Oe\_Etc\_Ttl\_Money\_Taxable | その他自費（課税分）合計金額消費税再掲(ゼロは非表示） | 80  | 追加  <br>(2017-05-25) |
| 7-13-4 | Oe\_Etc\_Detail | その他自費詳細（繰り返し　１０） |     | 追加  <br>(2017-05-25) |
| 7-13-4-1 | Oe\_Etc\_Number | 番号  | 1   | 追加  <br>(2017-05-25) |
| 7-13-4-2 | Oe\_Etc\_Name | 項目名 | 文書料 | 追加  <br>(2017-05-25) |
| 7-13-4-3 | Oe\_Etc\_Money\_Non\_Taxable | 非課税金額(ゼロは非表示） | 1000 | 追加  <br>(2017-05-25) |
| 7-13-4-4 | Oe\_Etc\_Money\_Taxable | 課税金額(ゼロは非表示） | 1080 | 追加  <br>(2017-05-25) |
| 7-14 | Lsi\_Information | 労災自賠責保険適用分（円） |     | 追加  <br>(2017-05-25) |
| 7-14-1 | Lsi\_Fv\_Money | 初診(ゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-14-2 | Lsi\_Sv\_Money | 再診(ゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-14-3 | Lsi\_Mm\_Money | 指導(ゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-14-4 | Lsi\_Other\_Money | その他(ゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-15 | Ml\_Cost | 食事・生活療養費（外来は非表示）  <br>（食事療養費＋生活療養費＋食事療養費（自費）＋生活療養費（自費）） |     |     |
| 7-16 | Meal\_Cost | 食事療養費（外来またはゼロは非表示） | 19200 | 追加  <br>(2017-05-25) |
| 7-17 | Living\_Cost | 生活療養費（外来またはゼロは非表示） |     | 追加  <br>(2017-05-25) |
| 7-18 | Oe\_Meal\_Cost | 食事療養費（自費）（外来またはゼロは非表示） |     | ※２  <br>  <br>追加  <br>(2017-05-25) |
| 7-19 | Oe\_Meal\_Smoney | 生活療養費（自費）（外来またはゼロは非表示） |     | ※２  <br>  <br>追加  <br>(2017-05-25) |
| 7-20 | Oe\_Living\_Cost | 食事療養負担金（自費）（外来またはゼロは非表示） |     | ※２  <br>  <br>追加  <br>(2017-05-25) |
| 7-21 | Oe\_Living\_Smoney | 生活療養負担金（自費）（外来またはゼロは非表示） |     | ※２  <br>  <br>追加  <br>(2017-05-25) |
| 7-22 | Room\_Charge | 室料差額（外来またはゼロは非表示） | 10800 | 追加  <br>(2017-05-25) |
| 7-23 | Tax\_In\_Room\_Charge | 室料差額消費税再掲（外来またはゼロは非表示） | 800 | 追加  <br>(2017-05-25) |
| 8   | Insurance\_Information | 保険組合せ詳細（繰り返し　２０） |     |     |
| 8-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 8-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 8-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 8-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 8-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 8-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 8-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 8-8 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 8-8-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 8-8-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 8-8-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 8-8-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |
| 9   | Unpaid\_Money\_Total | 未収金額合計（０件の場合は非表示） |     | ※３  |
| 10  | Unpaid\_Money\_Information\_Overflow | 未収金情報オーバーフラグ  <br>（０件：非表示、１〜５０件：false、５０件超：true） |     | ※４  |
| 11  | Unpaid\_Money\_Information | 個別の未収金情報（繰り返し　５０）  <br>（診療日の新しい順） |     |     |
| 11-1 | Perform\_Date | 診療日 |     |     |
| 11-2 | InOut | 入外区分  <br>（1：入院、2：入院外） |     |     |
| 11-3 | Invoice\_Number | 伝票番号 |     |     |
| 11-4 | Unpaid\_Money | 未収金額 |     |     |

※１：療養担当手当（１６）は、点数ゼロは編集なし。  
　　　初診・再診料〜入院料は、点数ゼロを編集。

※２　特別食加算を入院基本料とは異なる保険組合せで算定する際に、診療行為より".950"の診療種別で以下コードの入力が行われた場合に設定を行います。  
　　　197001210 食事療養標準負担額（他法等入院中）  
　　　197000470 特別食加算（食事療養）  
　　　197001570 特別食加算（生活療養）  

※３：未収金合計はマイナス未収（過入金）も集計に含めて返却します。

※４：未収金情報が５０件を超えた場合でも未収金額合計は超えた分も含めて計算を行います。

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

[sample\_incomeinf\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_incomeinf_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 収納情報取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/incomeinfv2")  
#  
\# 1.患者番号    Patient\_ID      (REQUIRED)  
\# 2.診療日      Perform\_Date    (IMPLIED)  
\# 3.診療月      Perform\_Month   (IMPLIED)  
\# 4.診療年      Perform\_Year    (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Perform\_Month type\="string"\>2013-12</Perform\_Month>        </private\_objects>  
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
| 0000 | 処理終了 |
| 0001 | 診療日の設定に誤りがあります |
| 0002 | 診療月の設定に誤りがあります |
| 0003 | 診療年の設定に誤りがあります |
| 0004 | 患者番号の設定に誤りがあります |
| 0089 | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 0097 | 送信内容に誤りがあります |
| 0098 | 送信内容の読込ができませんでした |
| 0099 | ユーザIDが未登録です |
| それ以外 | 返却情報の編集でエラーが発生しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 収納情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/shunou.html#wrapper)

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
