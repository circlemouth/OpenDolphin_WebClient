[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#content)

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
 > 請求金額シミュレーション

API 請求金額返却  

=============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#warnmsg)
      
    

更新履歴
----

2021-01-27  「リクエスト一覧」に項目を追加。  
　　　　　　「レスポンス一覧」に項目を追加。  

2014-07-03  「エラーメッセージ一覧」を追加。  
　　　　　　「警告メッセージ一覧」を追加。  

概要
--

POSTメソッドによる請求金額の返却を行います。

日レセ Ver4.7.0\[第4回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_acsimulate\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_acsimulate\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_acsimulate\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/acsimulatev2?class=01  
    class = 01  請求金額シミュレーション  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  <acsimulatereq type\="record"\>    <Patient\_ID type\="string"\>3999</Patient\_ID>    <Perform\_Date type\="string"\>2012-12-27</Perform\_Date>    <Perform\_Time type\="string"\>15:34:12</Perform\_Time>    <Time\_Class type\="string"\>1</Time\_Class>  
<!-- ========================================================== -->  
<!--                    診療データ                              -->  
<!-- ========================================================== -->    <Diagnosis\_Information type\="record"\>      <Department\_Code type\="string"\>01</Department\_Code>      <HealthInsurance\_Information type\="record"\>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>１２３４５</HealthInsuredPerson\_Number>        <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>        <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>        <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2012-12-17</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            <Certificate\_IssuedDate type\="string"\>2012-12-17</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </PublicInsurance\_Information\_child>　　　　　　　　　　　・  
　　　　　　　　　　　・  
　　　　　　　　　　　・        </PublicInsurance\_Information>      </HealthInsurance\_Information>      <Medical\_Information type\="array"\>        <Medical\_Information\_child type\="record"\>          <Medical\_Class type\="string"\>120</Medical\_Class>          <Medical\_Class\_Name type\="string"\>再診</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_info type\="array"\>            <Medication\_info\_child type\="record"\>              <Medication\_Code type\="string"\>112007410</Medication\_Code>              <Medication\_Name type\="string"\>再診</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_info\_child>            <Medication\_info\_child type\="record"\>              <Medication\_Code type\="string"\>112016070</Medication\_Code>              <Medication\_Name type\="string"\>時間外対応加算２</Medication\_Name>              <Medication\_Number type\="string"\></Medication\_Number>            </Medication\_info\_child>            <Medication\_info\_child type\="record"\>              <Medication\_Code type\="string"\>112015770</Medication\_Code>              <Medication\_Name type\="string"\>明細書発行体制加算</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_info\_child>          </Medication\_info>        </Medical\_Information\_child>        <Medical\_Information\_child type\="record"\>          <Medical\_Class type\="string"\>210</Medical\_Class>          <Medical\_Class\_Name type\="string"\>内服薬剤</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>10</Medical\_Class\_Number>          <Medication\_info type\="array"\>            <Medication\_info\_child type\="record"\>              <Medication\_Code type\="string"\>616140105</Medication\_Code>              <Medication\_Name type\="string"\>クラリス錠２００　２００ｍｇ</Medication\_Name>              <Medication\_Number type\="string"\>2</Medication\_Number>            </Medication\_info\_child>          </Medication\_info>        </Medical\_Information\_child>        <Medical\_Information\_child type\="record"\>          <Medical\_Class type\="string"\>310</Medical\_Class>          <Medical\_Class\_Name type\="string"\>皮下筋肉注射</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_info type\="array"\>            <Medication\_info\_child type\="record"\>              <Medication\_Code type\="string"\>641210099</Medication\_Code>              <Medication\_Name type\="string"\>キシロカイン注射液１％</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_info\_child>          </Medication\_info>        </Medical\_Information\_child>　　　　　　　　　　　・  
　　　　　　　　　　　・  
　　　　　　　　　　　・      </Medical\_Information>    </Diagnosis\_Information>  </acsimulatereq>  
</data>  

### 処理概要

請求金額リクエストにより該当患者の請求金額のシミュレーションを行います。

### 処理詳細

1.  患者番号、診療科の妥当性チェック  
    
2.  保険組合せ番号が空白の時、保険・公費情報から保険組合せを決定します。  
    保険組合せ・保険・公費情報が未設定の時は、診療科の前回の保険組合せを対象とします。  
    前回の受診が無ければ、公費の多い保険組合せとなります。  
    対象が無ければエラーとなります。
3.  時間外加算区分は、環境設定の外来時間外区分（１〜８）を設定します。  
    設定した時間外区分を外来時間外区分として初診・再診料に反映します。  
    初診・再診料が無い場合は反映できません。
4.  初診・再診料の再自動算定はおこないません。  
    送信された内容で処理をおこなうため、時間外対応加算・明細書発行体制等加算・外来管理加算は送信して下さい。なお、外来管理加算は、システム管理の外来管理加算チェックが「0 チェックなし」、「1 チェックあり」であれば送信内容によって登録時に自動発生しますので、必ず送信する必要はありません。  
    時間外加算コードは、時間外加算区分の設定があれば自動で算定をおこないます。
5.  診療行為入力時と同じ処理をおこないます。  
    併用算定エラーなどエラーが一箇所でもあれば、処理を終了してエラーメッセージと診療コードを返却します。  
    警告は無視してそのまま処理をおこないます。警告メッセージの返却はおこないません。  
    乳幼児の年齢加算、検査などの月２回目の逓減などは診療行為入力と同様におこないます。
6.  診療行為の登録時に自動算定する項目はすべて自動算定をおこないます。  
    特定疾患処方管理加算など登録時に確認メッセージを表示して算定の有無を選択する場合は、すべて「OK」として自動算定します。

  

レスポンスサンプル
---------

<xmlio2>  <acsimulateres type\="record"\>    <Information\_Date type\="string"\>2012-12-27</Information\_Date>    <Information\_Time type\="string"\>20:03:33</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Perform\_Date type\="string"\>2012-12-27</Perform\_Date>    <Time\_Class type\="string"\>1</Time\_Class>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_Name type\="string"\>内科</Department\_Name>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>03999</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1970-01-01</BirthDate>      <Sex type\="string"\>1</Sex>      <HealthInsurance\_Information type\="record"\>        <Combination\_Number type\="string"\>0002</Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>１２３４５</HealthInsuredPerson\_Number>        <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>        <HealthInsuredPerson\_Assistance\_Name type\="string"\>３割</HealthInsuredPerson\_Assistance\_Name>        <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2012-12-17</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            <Rate\_Admission type\="string"\>0.05</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.05</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2012-12-17</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </HealthInsurance\_Information>      <Cd\_Information type\="record"\>        <Ac\_Money type\="string"\>      340</Ac\_Money>        <Ai\_Money type\="string"\>        0</Ai\_Money>        <Oe\_Money type\="string"\>        0</Oe\_Money>        <Pi\_Smoney type\="string"\>      340</Pi\_Smoney>      </Cd\_Information>      <Ac\_Point\_Information type\="record"\>        <Ac\_Ttl\_Point type\="string"\>      675</Ac\_Ttl\_Point>        <Ac\_Point\_Detail type\="array"\>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>初・再診料</AC\_Point\_Name>            <AC\_Point type\="string"\>      140</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>医学管理等</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>在宅療養</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>投薬</AC\_Point\_Name>            <AC\_Point type\="string"\>      234</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>注射</AC\_Point\_Name>            <AC\_Point type\="string"\>       19</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>処置</AC\_Point\_Name>            <AC\_Point type\="string"\>       58</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>手術</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>麻酔</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>検査</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>画像診断</AC\_Point\_Name>            <AC\_Point type\="string"\>      224</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>リハビリ</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>精神科専門</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>放射線治療</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>          <Ac\_Point\_Detail\_child type\="record"\>            <AC\_Point\_Name type\="string"\>病理診断</AC\_Point\_Name>            <AC\_Point type\="string"\>        0</AC\_Point>          </Ac\_Point\_Detail\_child>        </Ac\_Point\_Detail>      </Ac\_Point\_Information>    </Patient\_Information>  </acsimulateres>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 3999 | 必須  |
| 2   | Perform\_Date | 診療日 | 2012-12-27 |     |
| 3   | Time\_Class | 時間外区分 | 1   |     |
| 4   | Diagnosis\_Information | 診療情報 |     |     |
| 4-1 | Department\_Code | 診療科コード ※１  <br>（01:内科） | 01  | 必須  |
| 4-2 | Combination\_Number | 保険組合せ番号 |     |     |
| 4-3 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 4-3-1 | InsuranceProvider\_Class | 保険の種類  <br>（060:国保） | 060 | ※２  |
| 4-3-2 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※２  |
| 4-3-3 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※２  |
| 4-3-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 4-3-5 | HealthInsuredPerson\_Number | 番号  | １２３４５ |     |
| 4-3-6 | HealthInsuredPerson\_Branch\_Number | 枝番  |     | 追加  <br>(2021-01-27) |
| 4-3-7 | HealthInsuredPerson\_Continuation | 継続区分  <br>（1:継続療養、2:任意継続） | 1   |     |
| 4-3-8 | HealthInsuredPerson\_Assistance | 補助区分  <br>（詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい） | 3   |     |
| 4-3-9 | RelationToInsuredPerson | 本人家族区分  <br>（1:本人、2:家族） | 1   |     |
| 4-3-10 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 4-3-11 | Certificate\_StartDate | 適用開始日 | 2012-12-17 |     |
| 4-3-12 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 4-3-13 | PublicInsurance\_Information | 公費情報（繰り返し ４） |     |     |
| 4-3-13-1 | PublicInsurance\_Class | 公費の種類 | 010 | ※２  |
| 4-3-13-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ | ※２  |
| 4-3-13-3 | PublicInsurer\_Number | 負担者番号 | 10131142 | ※２  |
| 4-3-13-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | ※２  |
| 4-3-13-5 | Certificate\_IssuedDate | 適用開始日 | 2012-12-17 |     |
| 4-3-13-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 4-4 | Medical\_Information | 診療行為情報（繰り返し ４０） |     |     |
| 4-4-1 | Medical\_Class | 診療種別区分  <br>（詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい） | 120 |     |
| 4-4-2 | Medical\_Class\_Name | 診療種別区分名称 | 再診  |     |
| 4-4-3 | Medical\_Class\_Number | 診療回数、日数 | 1   |     |
| 4-4-4 | Medication\_info | 診療内容（繰り返し ４０） |     |     |
| 4-4-4-1 | Medication\_Code | 診療行為コード | 112007410 |     |
| 4-4-4-2 | Medication\_Name | 診療名称 | 再診  |     |
| 4-4-4-3 | Medication\_Number | 数量  | 1   |     |
| 4-4-4-4 | Medication\_Generic\_Flg | 処方せん一般名記載 |     |     |

 ※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

 ※２：一箇所でも設定されていれば、一致する保険組合せが対象に設定されます。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2012-12-27 |     |
| 2   | Information\_Time | 実施時間 | 20:03:33 |     |
| 3   | Api\_Result | 結果コード | 00  |     |
| 4   | Api\_Result\_Message | 結果メッセージ | 処理終了 |     |
| 5   | Reskey | レスポンスキー情報 | Medical Info |     |
| 6   | Perform\_Date | 診療年月日 | 2012-12-27 |     |
| 7   | Time\_Class | 時間外区分 | 1   |     |
| 8   | Department\_Code | 診療科コード | 01  |     |
| 9   | Department\_Name | 診療科名称 | 内科  |     |
| 10  | Patient\_Information | 患者情報 |     |     |
| 10-1 | Patient\_ID | 患者番号 | 03999 |     |
| 10-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 10-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 10-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 10-5 | Sex | 性別  <br>（1:男性、2:女性） | 1   |     |
| 10-6 | Dis\_Rate | 割引率  <br>　割引率 + 円（％） |     | （患者登録で設定した値） |
| 10-7 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 10-7-1 | Combination\_Number | 保険組合せ番号 | 0002 |     |
| 10-7-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 10-7-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 10-7-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 10-7-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 10-7-6 | HealthInsuredPerson\_Number | 番号  | １２３４５ |     |
| 10-7-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 10-7-8 | HealthInsuredPerson\_Continuation | 継続区分  <br>（1:継続療養、2:任意継続） |     |     |
| 10-7-9 | HealthInsuredPerson\_Assistance | 補助区分  <br>（詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい） | 3   |     |
| 10-7-10 | HealthInsuredPerson\_Assistance\_Name |     | ３割  |     |
| 10-7-11 | RelationToInsuredPerson | 本人家族区分  <br>（1:本人、2:家族） | 1   |     |
| 10-7-12 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 10-7-13 | Certificate\_StartDate | 適用開始日 | 2012-12-17 |     |
| 10-7-14 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 10-7-15 | PublicInsurance\_Information | 公費情報（繰り返し ４） |     |     |
| 10-7-15-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 10-7-15-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ |     |
| 10-7-15-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 10-7-15-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 10-7-15-5 | Rate\_Admission | 入院ー負担率（割） | 0.05 |     |
| 10-7-15-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 10-7-15-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.05 |     |
| 10-7-15-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 10-7-15-9 | Certificate\_IssuedDate | 適用開始日 | 2012-12-17 |     |
| 10-7-15-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-17 |     |
| 10-8 | Cd\_Information | 負担額情報 |     |     |
| 10-8-1 | Ac\_Money | 請求金額 | 340 |     |
| 10-8-2 | Ai\_Money | 保険適用金額  <br>　負担金額（円）の保険分 | 0   |     |
| 10-8-3 | Oe\_Money | 自費金額  <br>　負担金額（円）の自費分 + その他自費のその他計の合計 | 0   |     |
| 10-8-4 | Dg\_Smoney | 薬剤一部負担金  <br>（ゼロは非表示） |     |     |
| 10-8-5 | Om\_Smoney | 老人一部負担金  <br>（ゼロは非表示） |     |     |
| 10-8-6 | Pi\_Smoney | 公費一部負担金  <br>（ゼロは非表示） | 340 |     |
| 10-8-7 | Lsi\_Total\_Money | 労災合計金額  <br>　労災自賠責保険適用分（円）の集計値  <br>（初診 + 再診 + 指導 + その他）  <br>（ゼロは非表示） |     |     |
| 10-9 | Ac\_Point\_Information | 請求点数 |     |     |
| 10-9-1 | Ac\_Ttl\_Point | 合計点数  <br>　保険分の合計点数 | 675 |     |
| 10-9-2 | Ac\_Point\_Detail | 点数詳細 （繰り返し １６） |     |     |
| 10-9-2-1 | AC\_Point\_Name | 名称  | 初・再診料 | ※１  |
| 10-9-2-2 | AC\_Point | 点数  | 140 |     |

 ※１：入院料（15）、療養担当手当（16）は、点数ゼロは編集なし。  
　　　初診・再診料〜病理診断は、点数ゼロを編集。

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

[sample\_acsimulate\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_acsimulate_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 請求金額シミュレーション  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/acsimulatev2?class=01")  
\# class :01 請求金額シミュレーション  
#  
#BODY \= <<EOF

<data>        <acsimulatereq type\="record"\>                <Patient\_ID type\="string"\>3999</Patient\_ID>                <Perform\_Date type\="string"\>2012-12-27</Perform\_Date>                <Perform\_Time type\="string"\>15:34:12</Perform\_Time>                <Time\_Class type\="string"\>1</Time\_Class>  
<!-- ========================================================== -->  
<!--                    診療データ                              -->  
<!-- ========================================================== -->                <Diagnosis\_Information type\="record"\>                        <Department\_Code type\="string"\>01</Department\_Code>                        <HealthInsurance\_Information type\="record"\>                                <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                                <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                                <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                                <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                                <HealthInsuredPerson\_Number type\="string"\>１２３４５</HealthInsuredPerson\_Number>                                <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                                <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>                                <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>                                <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>                                <Certificate\_StartDate type\="string"\>2012-12-17</Certificate\_StartDate>                                <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                                <PublicInsurance\_Information type\="array"\>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                                <Certificate\_IssuedDate type\="string"\>2012-12-17</Certificate\_IssuedDate>                                                <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                                        </PublicInsurance\_Information\_child>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\></PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\></PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\></PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\></PublicInsuredPerson\_Number>                                                <Certificate\_IssuedDate type\="string"\></Certificate\_IssuedDate>                                                <Certificate\_ExpiredDate type\="string"\></Certificate\_ExpiredDate>                                        </PublicInsurance\_Information\_child>                                </PublicInsurance\_Information>                        </HealthInsurance\_Information>                        <Medical\_Information type\="array"\>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>120</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>再診</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>112007410</Medication\_Code>                                                        <Medication\_Name type\="string"\>再診</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>112016070</Medication\_Code>                                                        <Medication\_Name type\="string"\>時間外対応加算２</Medication\_Name>                                                        <Medication\_Number type\="string"\></Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>112015770</Medication\_Code>                                                        <Medication\_Name type\="string"\>明細書発行体制加算</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>210</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>内服薬剤</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>10</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>616140105</Medication\_Code>                                                        <Medication\_Name type\="string"\>クラリス錠２００　２００ｍｇ</Medication\_Name>                                                        <Medication\_Number type\="string"\>2</Medication\_Number>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>310</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>皮下筋肉注射</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>641210099</Medication\_Code>                                                        <Medication\_Name type\="string"\>キシロカイン注射液１％</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>400</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>処置行為</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>140022810</Medication\_Code>                                                        <Medication\_Name type\="string"\>超音波ネブライザー</Medication\_Name>                                                        <Medication\_Number type\="string"\> </Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>620003816</Medication\_Code>                                                        <Medication\_Name type\="string"\>ホスミシンＳ静注用１ｇ</Medication\_Name>                                                        <Medication\_Number type\="string"\>0.1 </Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>620002615</Medication\_Code>                                                        <Medication\_Name type\="string"\>リンデロン注２０ｍｇ</Medication\_Name>                                                        <Medication\_Number type\="string"\>0.2 </Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>620518102</Medication\_Code>                                                        <Medication\_Name type\="string"\>ボスミン外用液０．１％</Medication\_Name>                                                        <Medication\_Number type\="string"\>0.2 </Medication\_Number>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>700</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>002000001</Medication\_Code>                                                        <Medication\_Name type\="string"\>頭部</Medication\_Name>                                                        <Medication\_Number type\="string"\> </Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>170027910</Medication\_Code>                                                        <Medication\_Name type\="string"\>単純撮影（デジタル撮影）</Medication\_Name>                                                        <Medication\_Number type\="string"\>2</Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>170000510</Medication\_Code>                                                        <Medication\_Name type\="string"\>単純撮影（ロ）の写真診断</Medication\_Name>                                                        <Medication\_Number type\="string"\>2</Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>170000210</Medication\_Code>                                                        <Medication\_Name type\="string"\>電子画像管理加算（単純撮影）</Medication\_Name>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>220</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>頓服</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>621362001</Medication\_Code>                                                        <Medication\_Name type\="string"\>グリセリン</Medication\_Name>                                                        <Medication\_Number type\="string"\>5</Medication\_Number>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\> </Medication\_Code>                                                        <Medication\_Name type\="string"\>  </Medication\_Name>                                                        <Medication\_Number type\="string"\> </Medication\_Number>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                        </Medical\_Information>                </Diagnosis\_Information>        </acsimulatereq>  
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
| 01  | 患者番号の設定がありません |     |
| 02  | 診療科の設定がありません |     |
| 03  | 時間外加算区分が存在しません |     |
| 10  | 患者番号に該当する患者が存在しません |     |
| 11  | 診療日が暦日ではありません |     |
| 12  | 該当する保険組合せがありません |     |
| 13  | 診療科が存在しません |     |
| 50  | コード：112016070　診療所のコードです。病院では入力できません | 左のエラーメッセージは一例になります。  <br>  <br>このエラーに該当した場合に返却されるエラーメッセージは「エラー対象となったコード + エラー内容」になります。  <br>このエラーは主に施設（病院、診療所）では使用できない診療行為コード等を設定した場合に返却されます。 |
| 51  | 項目未設定 |     |
| 対象データなし |     |
| 回数指定エラー |     |
| 一時データ出力エラー |     |
| 89  | 職員情報が取得できません |     |
| 医療機関情報が取得できません |     |
| システム日付が取得できません |     |
| 患者番号構成情報が取得できません |     |
| グループ医療機関が不整合です。処理を終了して下さい |     |
| システム項目が設定できません |     |
| 90  | 他端末使用中 |     |
| 91  | 処理区分未設定 |     |
| 97  | 送信内容に誤りがあります |     |
| 98  | 送信内容の読込ができませんでした |     |
| 99  | ユーザID未登録 |     |

警告メッセージ一覧
---------

| エラーコード | 警告メッセージ |
| --- | --- |
| K1  | 診療日を設定しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 請求金額シミュレーション

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/acsimulate.html#wrapper)

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
