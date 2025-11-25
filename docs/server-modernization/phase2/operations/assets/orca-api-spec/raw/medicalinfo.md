[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#content)

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
 > 診療情報の返却

診療情報の返却
=======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#request)
    
*   [レスポンス一覧(受診履歴一覧)](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#response)
    
*   [レスポンス一覧(診療行為剤内容詳細)](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#response2)
    
*   [レスポンス一覧(診療月診療コード情報)](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#response3)
    
*   [レスポンス一覧(診療区分別剤点数)](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#response4)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#warnmsg)
    

更新履歴
----

2024-09-25   「リクエスト一覧」に項目を追加。  
　　　　　　　「レスポンス一覧(診療行為剤内容詳細取得)」に項目を追加。  

2021-01-27   「リクエスト一覧」に項目を追加。  
　　　　　　　「レスポンス一覧(受診履歴一覧)」に項目を追加。  
　　　　　　　「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。  
　　　　　　　「レスポンス一覧(診療区分別剤点数)」に項目を追加。

2020-11-25   「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。  

2020-06-25   「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。

2018-01-23   （Ver5.0.0以降のみ）「リクエスト一覧」に項目を追加。  

2017-11-27   「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。

2017-08-24   診療・収納API連携強化対応。  
　　　　　　　　「リクエスト一覧」に項目を追加。  
　　　　　　　　「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。

2015-12-21   受診履歴伝票番号追加対応。  
　　　　　　　　「レスポンス一覧(受診履歴一覧)」に項目を追加。

2015-08-26   入院患者の診療情報の返却対応。  
　　　　　　　　「リクエスト一覧」に項目を追加。  
　　　　　　　　「Rubyによるリクエストサンプルソース」を修正。  
　　　　　　　診療情報の単位返却対応。  
　　　　　　　　「レスポンス一覧(診療行為剤内容詳細)」に項目を追加。  
　　　　　　　　「レスポンス一覧(診療月診療コード情報)」に項目を追加。  
　　　　　　　　「レスポンス一覧(診療区分別剤点数)」に項目を追加。

2015-01-27   すべての来院日取得対応。  
　　　　　　　　「リクエスト(POSTリクエスト)サンプル」にすべての来院日取得対応に関する説明を追加。  
　　　　　　　　「リクエスト一覧」に項目を追加。  
　　　　　　　　「エラーメッセージ一覧」を修正。  
　　　　　　　　「Rubyによるリクエストサンプルソース」を修正。

  

概要
--

POSTメソッドによる外来分診療情報の返却を行います。

診療区分別剤点数は日レセVer4.7.0\[第25回パッチ適用\]以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_medical\_info.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_medical\_info.rb 内の患者番号等を接続先の日レセの環境に合わせ、送信したい情報を設定します。
3.  ruby sample\_medical\_info.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/medicalgetv2?class=01 
    class = 01 (受診履歴一覧取得)
        ※診療年月の受診履歴日の取得
    class = 02 (診療行為剤内容詳細取得)
        ※診療日付と診療科の診療行為内容の剤内容を取得
    class = 03 (診療月診療コード情報取得)
        ※診療年月の診療行為内容の診療コード内容を取得  
    class = 04 (診療区分別剤点数取得)(xml2のみ)  
        ※診療年月の剤点数を算定日・診療区分順に取得  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <medicalgetreq type\="record"\>                <InOut type\="string"\>I</InOut>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Perform\_Date type\="string"\>2014-01-06</Perform\_Date>                <For\_Months type\="string"\>12</For\_Months>                <Medical\_Information type\="record"\>                        <Department\_Code type\="string"\>01</Department\_Code>                        <Sequential\_Number type\="string"\></Sequential\_Number>                        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>                        <HealthInsurance\_Information type\="record"\>                                <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                                <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                                <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                                <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                                <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>                                <PublicInsurance\_Information type\="array"\>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                        </PublicInsurance\_Information\_child>                                </PublicInsurance\_Information>                        </HealthInsurance\_Information>                </Medical\_Information>        </medicalgetreq>  
</data>

### 処理概要

患者番号、診療年月等のリクエストにより診療情報を返却します。

### 処理詳細

 受診履歴一覧(class=01)、診療行為剤内容詳細(class=02)、診療月診療コード情報(class=03)

1.  機能として以下の三つを用意します。  
    ・該当患者の一ヶ月の受診日（診療科、保険情報を含む）を返却します。  
    ・該当患者の指定された受診日（診療科、保険）の詳細診療情報を返却します。  
    ・該当患者の指定された月の診療情報内容を返却します。
2.  患者番号の存在をチェックします。
3.  診療年月（日）の妥当性をチェックします。
4.  保険情報の妥当性、存在をチェックします（入力がある場合）。

 受診履歴一覧(class=01)(すべての来院日取得対応)

*   月数（For\_Months）を指定した場合は診療年月から「診療年月 − 月数」の受診履歴を降順に返却します。  
    月数は１から１２まで指定可能で、０（未設定）は１月とします。  
    なお、９９を設定した場合は全履歴を対象として診療年月から受診履歴の降順に１５０件を返却します。
*   返却件数が１５０件以上存在した場合はその旨を返却します。  
    

 診療区分別剤点数(class=04)(xml2のみ)

1.  診療年月で診療会計テーブルを検索し、算定日・診療区分順に剤点数（金額）を返却します。
2.  診療科・保険組合せ情報の設定があれば指定されたデータのみを対象とします。
3.  保険組合せ情報の設定がない場合は、労災・自賠責・自費保険以外の保険のデータのみを対象とします。  
    労災・自賠責・自費保険は保険指定を行なって下さい。

診療行為剤内容詳細(class=02) (2017-08-24 パッチ適用以降)  

*    検索条件にInvoice\_Number(伝票番号)を追加  
     患者番号、診療日付、伝票番号での検索を可能とします。
*    返却値にもInvoice\_Number を追加

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | InOut | 入外区分  <br>(I：入院) | I   | 追加  <br>(2015-08-26) |
| 2   | Patient\_ID | 患者番号 | 12  | 必須  |
| 3   | Perform\_Date | 診療日 | 2014-01-06 | 未設定時はシステム日付を設定　※１ |
| 4   | For\_Months | 月数  | 12  | 追加  <br>(2015-01-27) |
| 5   | Base\_StartDate | 対象更新日 |     | 追加  <br>(2024-09-25) ※５ |
| 6   | Base\_StartTime | 対象更新時間 |     | 追加  <br>(2024-09-25)  <br>(00:00:00 から 23:59:59の範囲内) ※５ |
| 7   | Medical\_Information | 診療情報 |     |     |
| 7-1 | Department\_Code | 診療科コード　※３  <br>(01:内科) | 01  | class=02のみ必須 |
| 7-2 | Sequential\_Number | 連番  | 2   | class=02のみ、未設定は1 |
| 7-3 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 | ※２  |
| 7-4 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 7-4-1 | InsuranceProvider\_Class | 保険の種類 | 060 | ※２  |
| 7-4-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※２  |
| 7-4-3 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※２  |
| 7-4-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 7-4-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 7-4-6 | HealthInsuredPerson\_Branch\_Number | 枝番  |     | 追加  <br>(2021-01-27) |
| 5-4-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 7-4-7-1 | PublicInsurance\_Class | 公費の種類 | 019 | ※２  |
| 7-4-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 | ※２  |
| 7-4-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 | ※２  |
| 7-4-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | ※２  |
| 7-5 | Invoice\_Number | 伝票番号 |     | 追加  <br>(2017-08-24)  <br>class=02のみ ※４ |
| 7-6 | Contain\_Migration | 含む移行(レセ電データから移行した情報を含むか否か)  <br>(False:含まない) |     | Ver5.0.0以降のみ追加  <br>(2018-01-23) |

※１：診療年月指定時は、日のチェックは行いません。暦日チェックは日＝１で行います。

※２：保険組合せ番号を優先とします。保険組合せ番号の設定がない時だけ保険組合せ情報より保険組合せ番号を決定します。

※３：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※４：伝票番号の設定があれば、患者番号・診療日付のみ必須です。

※５：class=01 の時、設定があれば対象となる受診履歴の更新日、更新時間が対象更新日、対象更新時間以降のデータを対象とします。対象更新時間のみの設定の時は、対象更新日はシステム日付とします。

  

レスポンス一覧(受診履歴一覧)
---------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-01-15 |     |
| 2   | Information\_Time | 実施時間 | 11:15:55 |     |
| 3   | Api\_Result | エラーコード | 00  |     |
| 4   | Api\_Result\_Message | メッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00012 |     |
| 6-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 6-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 7   | Medical\_List\_Information | 受診履歴情報（繰り返し　１５０） |     |     |
| 7-1 | Perform\_Date | 診療年月日 | 2014-01-06 |     |
| 7-2 | Department\_Code | 診療科コード  <br>（01：内科） | 01  | ※１  |
| 7-3 | Department\_Name | 診療科名称 | 内科  |     |
| 7-4 | Sequential\_Number | 連番  <br>（診療科毎の同日連番） | 1   |     |
| 7-5 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 7-6 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 7-6-1 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 7-6-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 7-6-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 7-6-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 7-6-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 7-6-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 7-6-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 7-6-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 7-6-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 7-6-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 7-6-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 7-7 | Invoice\_Number | 伝票番号 |     | 外来のみ  <br>追加  <br>(2015-12-21) |
| 8   | CreateDate | 登録日 |     | 追加  <br>(2024-09-25) |
| 9   | UpdateDate | 更新日 |     | 追加  <br>(2024-09-25) |
| 10  | UpdateTime | 更新時間 |     | 追加  <br>(2024-09-25) |

※診療年月の受診履歴テーブル内容を編集します。（診療行為画面の受診履歴と同様です。）

※患者番号・診療年月以外の内容は使用しません。150件以上存在したときはメッセージを返却します。

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

### レスポンスサンプル   

<xmlio2>  <medicalget01res type\="record"\>    <Information\_Date type\="string"\>2014-01-15</Information\_Date>    <Information\_Time type\="string"\>11:15:55</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Medical\_List\_Information type\="array"\>      <Medical\_List\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2014-01-06</Perform\_Date>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <Sequential\_Number type\="string"\>1</Sequential\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <HealthInsurance\_Information type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>      </Medical\_List\_Information\_child>      <Medical\_List\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2014-01-07</Perform\_Date>        <Department\_Code type\="string"\>01</Department\_Code>        <Department\_Name type\="string"\>内科</Department\_Name>        <Sequential\_Number type\="string"\>1</Sequential\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <HealthInsurance\_Information type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>      </Medical\_List\_Information\_child>    </Medical\_List\_Information>  </medicalget01res>  
</xmlio2> 

  

レスポンス一覧(診療行為剤内容詳細)
------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-08-18 |     |
| 2   | Information\_Time | 実施時間 | 18:36:51 |     |
| 3   | Api\_Result | エラーコード | 00  |     |
| 4   | Api\_Result\_Message | メッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00017 |     |
| 6-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 6-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 7   | Perform\_Date | 診療年月日 | 2015-08-18 |     |
| 8   | Department\_Code | 診療科コード  <br>（01：内科） | 10  | ※１  |
| 9   | Department\_Name | 診療科名称 | 外科  |     |
| 10  | Sequential\_Number | 連番  <br>（診療科毎の同日連番、未設定は１） | 1   |     |
| 11  | Medical\_List\_Information | 受診履歴情報（繰り返し　５） |     |     |
| 11-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 11-2 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 11-2-1 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 11-2-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 11-2-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 11-2-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 11-2-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 11-2-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 11-2-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 11-2-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 11-2-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 11-2-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 11-2-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 11-3 | Invoice\_Number | 伝票番号 |     | 追加  <br>(2017-08-24) |
| 11-4 | Medical\_Information | 診療内容剤情報（繰り返し　１３５） |     |     |
| 11-4-1 | Medical\_Class | 診療種別区分 | 400 |     |
| 11-4-2 | Medical\_Class\_Name | 診療種別区分名称 | 処置行為 |     |
| 11-4-3 | Medical\_Class\_Number | 回数  | 1   |     |
| 11-4-4 | Medical\_Class\_Point | 剤点数（マイナス編集） | 2   |     |
| 11-4-5 | Medical\_Class\_Money | 剤金額  <br>（自費金額、労災の円） | 0   |     |
| 11-4-6 | Medical\_Class\_code | 剤区分  <br>(１：包括分、２：薬評（治験）) | 1   |     |
| 11-4-7 | Medical\_Inclusion\_Class | 包括剤区分  <br>(True：包括対象) | True | 追加  <br>(2015-08-26) |
| 11-4-8 | Medical\_Examination\_Count | 包括検査項目数 | 07  | 追加  <br>(2017-11-27) |
| 11-4-9 | Patient\_Choice\_Point | 長期収載品選定療養点数 |     | 追加  <br>(2024-09-25)  <br>長期収載品選定療養の剤点数 |
| 11-4-10 | Patient\_Choice\_Money | 長期収載品選定療養特別料金(税込) |     | 追加  <br>(2024-09-25) ※６ |
| 11-4-11 | Medication\_info | 診療行為詳細（繰り返し　５０） |     |     |
| 11-4-11-1 | Medication\_Code | コード | 620811502 |     |
| 11-4-11-2 | Medication\_Name | 名称  | ワルファリンＫ錠１ｍｇ「Ｆ」 |     |
| 11-4-11-3 | Medication\_Name\_Input\_Value | コメント入力値 | 短期検査の実施 | 追加  <br>(2020-06-25) |
| 11-4-11-4 | Medication\_Number | 数量  <br>（薬剤・器材の数量、きざみ値以外は１） | 2   |     |
| 11-4-11-5 | Unit\_Code | 単位  | 016 | ※２  <br>追加  <br>(2015-08-26) |
| 11-4-11-6 | Unit\_Code\_Name | 単位名称 | 錠   | ※２  <br>追加  <br>(2015-08-26) |
| 11-4-11-7 | Medication\_Input\_Info | コメント埋め込み値内容 |     | 追加  <br>(2020-11-25) |
| 11-4-11-7-1 | Medication\_Input\_Code | コメント埋め込み値 |     | ※４  <br>追加  <br>(2020-11-25) |
| 11-4-11-8 | Medication\_Point\_Class | 点数識別 (1:金額 3:点数 etc) | 3   | ※３  <br>追加  <br>(2017-11-27) |
| 11-4-11-9 | Medication\_Point | 点数  | 97  | ※３  <br>追加  <br>(2017-11-27) |
| 11-4-11-10 | Medication\_Refer\_Point | 参考点数（点数に数量・回数を反映した値） |     | ※５  <br>追加  <br>(2020-11-25) |

※診療年月日・診療科・連番から受診履歴を決定し、登録されている剤の内容を編集します。

※保険組合せ番号が設定されていれば該当の保険組合せ番号のみ対象とします。保険組合せは保険組合せ番号を指定するようにして下さい。

※診療行為訂正時と同じ順番で編集します。

※0086〜のコメントコード以外はすべて対象とします。

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：薬剤・器材コードは、単位=000も返却しますが、診療コード、商品コード(058)、特定器材コード(059)は、単位がある時のみ返却します。

※３： 診療行為コード、薬剤、器材のみ点数識別と点数を返却します。

※４：コメントコードまたは服用コードなど、数値を入力し名称に変換するコードに数値入力があれば内容を返却します。

※５：点数マスタの金額（点数）に数量と回数を反映した点数を返却します。

※６：長期収載品選定療養特別料金（税込）金額を編集。((長期収載品選定療養点数 ×回数×１０)に消費税(10%)を加算した金額)  

### レスポンスサンプル

<xmlio2>  <medicalget02res type\="record"\>    <Information\_Date type\="string"\>2015-08-18</Information\_Date>    <Information\_Time type\="string"\>18:36:51</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00017</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Perform\_Date type\="string"\>2015-08-18</Perform\_Date>    <Department\_Code type\="string"\>10</Department\_Code>    <Department\_Name type\="string"\>外科</Department\_Name>    <Sequential\_Number type\="string"\>1</Sequential\_Number>    <Medical\_List\_Information type\="array"\>      <Medical\_List\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <HealthInsurance\_Information type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>        <Medical\_Information type\="array"\>          <Medical\_Information\_child type\="record"\>            <Medical\_Class type\="string"\>400</Medical\_Class>            <Medical\_Class\_Name type\="string"\>処置行為</Medical\_Class\_Name>            <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>            <Medical\_Class\_Point type\="string"\>2</Medical\_Class\_Point>            <Medical\_Class\_Money type\="string"\>0</Medical\_Class\_Money>            <Medical\_Class\_code type\="string"\>1</Medical\_Class\_code>            <Medical\_Inclusion\_Class type\="string"\>True</Medical\_Inclusion\_Class>            <Medication\_info type\="array"\>              <Medication\_info\_child type\="record"\>                <Medication\_Code type\="string"\>099999908</Medication\_Code>                <Medication\_Name type\="string"\>包括算定（剤）</Medication\_Name>                <Medication\_Number type\="string"\>1</Medication\_Number>              </Medication\_info\_child>              <Medication\_info\_child type\="record"\>                <Medication\_Code type\="string"\>620811502</Medication\_Code>                <Medication\_Name type\="string"\>ワルファリンＫ錠１ｍｇ「Ｆ」</Medication\_Name>                <Medication\_Number type\="string"\>2</Medication\_Number>                <Unit\_Code type\="string"\>016</Unit\_Code>                <Unit\_Code\_Name type\="string"\>錠</Unit\_Code\_Name>              </Medication\_info\_child>            </Medication\_info>          </Medical\_Information\_child>          <Medical\_Information\_child type\="record"\>            <Medical\_Class type\="string"\>700</Medical\_Class>            <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>            <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>            <Medical\_Class\_Point type\="string"\>4580</Medical\_Class\_Point>            <Medical\_Class\_Money type\="string"\>0</Medical\_Class\_Money>            <Medical\_Class\_code type\="string"\>0</Medical\_Class\_code>            <Medication\_info type\="array"\>              <Medication\_info\_child type\="record"\>                <Medication\_Code type\="string"\>728580000</Medication\_Code>                <Medication\_Name type\="string"\>血管造影用カテーテル（心臓マルチパーパス型）</Medication\_Name>                <Medication\_Number type\="string"\>2</Medication\_Number>                <Unit\_Code type\="string"\>007</Unit\_Code>                <Unit\_Code\_Name type\="string"\>本</Unit\_Code\_Name>              </Medication\_info\_child>              <Medication\_info\_child type\="record"\>                <Medication\_Code type\="string"\>170012410</Medication\_Code>                <Medication\_Name type\="string"\>造影剤注入（静脈造影カテーテル法）</Medication\_Name>                <Medication\_Number type\="string"\>1</Medication\_Number>              </Medication\_info\_child>            </Medication\_info>          </Medical\_Information\_child>        </Medical\_Information>      </Medical\_List\_Information\_child>    </Medical\_List\_Information>  </medicalget02res>  
</xmlio2> 

  

レスポンス一覧(診療月診療コード情報)
-------------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-08-18 |     |
| 2   | Information\_Time | 実施時間 | 19:15:16 |     |
| 3   | Api\_Result | エラーコード | 00  |     |
| 4   | Api\_Result\_Message | メッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00017 |     |
| 6-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 6-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 7   | Perform\_Date | 診療年月 | 2015-08 |     |
| 8   | Medical\_List\_Information | 診療行為情報（繰り返し　４００） |     |     |
| 8-1 | Medical\_Class | 診療種別区分 | 40  |     |
| 8-2 | Medical\_Class\_Name | 診療種別区分名称 | 処置行為 |     |
| 8-3 | Medication\_Code | コード | 620811502 |     |
| 8-4 | Medication\_Name | 名称  | ワルファリンＫ錠１ｍｇ「Ｆ」 |     |
| 8-5 | Unit\_Code | 単位  | 016 | ※３  <br>追加  <br>(2015-08-26) |
| 8-6 | Unit\_Code\_Name | 単位名称 | 錠   | ※３  <br>追加  <br>(2015-08-26) |
| 8-7 | Medical\_Class\_code | 包括区分  <br>（1：包括分） | 1   |     |
| 8-8 | Medical\_Inclusion\_Class | 包括剤区分  <br>(True：包括対象) | True | 追加  <br>(2015-08-26) |
| 8-9 | Perform\_Total\_Number | 算定合計数  <br>（算定した日の合計(最大３１日)） | 01  |     |
| 8-10 | Perform\_Calendar | 算定日区分 | 0000000000000000010000000000000 | ※１  |
| 8-11 | Perform\_Day\_Information | 薬剤・器材数量（繰り返し　３１） |     | ※２  |
| 8-11-1 | Perform\_Day | 算定日 | 18  |     |
| 8-11-2 | Perform\_Day\_Number | １日の合計数量 | 2   |     |

※診療年月で算定した診療行為・薬剤・器材のコード毎に算定した日を編集します。薬剤・器材は算定した日とその日の数量×回数を集計した合計数量も編集します。

※診療科・保険組合せ番号に指定があれば該当分のみ対象とします。

※保険組合せ　9999包括分入力については、保険組合せ番号を9999と指定した時のみ対象とします。

※診療コードは告示区分1=1、3、5（手技料）かつ点数識別区分=1、3、4を対象とします。

※診療区分=95、96（保険外）、薬評の剤は対象外とします。

※１：算定した日に1を、それ以外の日に0を編集します。  
(２日にのみ算定であれば　0100000000000000000000000000000)

※２：算定した日をテーブルの１番目から編集します。

※３：薬剤・器材コードは、単位=000も返却しますが、診療コード、商品コード(058)、特定器材コード(059)は、単位がある時のみ返却します。

### レスポンスサンプル

<xmlio2>  <medicalget03res type\="record"\>    <Information\_Date type\="string"\>2015-08-18</Information\_Date>    <Information\_Time type\="string"\>19:15:16</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00017</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Perform\_Date type\="string"\>2015-08</Perform\_Date>    <Medical\_List\_Information type\="array"\>      <Medical\_List\_Information\_child type\="record"\>        <Medical\_Class type\="string"\>40</Medical\_Class>        <Medical\_Class\_Name type\="string"\>処置行為</Medical\_Class\_Name>        <Medication\_Code type\="string"\>620811502</Medication\_Code>        <Medication\_Name type\="string"\>ワルファリンＫ錠１ｍｇ「Ｆ」</Medication\_Name>        <Unit\_Code type\="string"\>016</Unit\_Code>        <Unit\_Code\_Name type\="string"\>錠</Unit\_Code\_Name>        <Medical\_Class\_code type\="string"\>1</Medical\_Class\_code>        <Medical\_Inclusion\_Class type\="string"\>True</Medical\_Inclusion\_Class>        <Perform\_Total\_Number type\="string"\>01</Perform\_Total\_Number>        <Perform\_Calendar type\="string"\>0000000000000000010000000000000</Perform\_Calendar>        <Perform\_Day\_Information type\="array"\>          <Perform\_Day\_Information\_child type\="record"\>            <Perform\_Day type\="string"\>18</Perform\_Day>            <Perform\_Day\_Number type\="string"\>2</Perform\_Day\_Number>          </Perform\_Day\_Information\_child>        </Perform\_Day\_Information>      </Medical\_List\_Information\_child>      <Medical\_List\_Information\_child type\="record"\>        <Medical\_Class type\="string"\>70</Medical\_Class>        <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>        <Medication\_Code type\="string"\>728580000</Medication\_Code>        <Medication\_Name type\="string"\>血管造影用カテーテル（心臓マルチパーパス型）</Medication\_Name>        <Unit\_Code type\="string"\>007</Unit\_Code>        <Unit\_Code\_Name type\="string"\>本</Unit\_Code\_Name>        <Medical\_Class\_code type\="string"\>0</Medical\_Class\_code>        <Perform\_Total\_Number type\="string"\>01</Perform\_Total\_Number>        <Perform\_Calendar type\="string"\>0000000000000000010000000000000</Perform\_Calendar>        <Perform\_Day\_Information type\="array"\>          <Perform\_Day\_Information\_child type\="record"\>            <Perform\_Day type\="string"\>18</Perform\_Day>            <Perform\_Day\_Number type\="string"\>2</Perform\_Day\_Number>          </Perform\_Day\_Information\_child>        </Perform\_Day\_Information>      </Medical\_List\_Information\_child>      <Medical\_List\_Information\_child type\="record"\>        <Medical\_Class type\="string"\>70</Medical\_Class>        <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>        <Medication\_Code type\="string"\>170012410</Medication\_Code>        <Medication\_Name type\="string"\>造影剤注入（静脈造影カテーテル法）</Medication\_Name>        <Medical\_Class\_code type\="string"\>0</Medical\_Class\_code>        <Perform\_Total\_Number type\="string"\>01</Perform\_Total\_Number>        <Perform\_Calendar type\="string"\>0000000000000000010000000000000</Perform\_Calendar>      </Medical\_List\_Information\_child>      <Medical\_List\_Information\_child type\="record"\>        <Medical\_Class type\="string"\>70</Medical\_Class>        <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>        <Medication\_Code type\="string"\>728490000</Medication\_Code>        <Medication\_Name type\="string"\>血管内超音波プローブ（標準（１））</Medication\_Name>        <Unit\_Code type\="string"\>000</Unit\_Code>        <Medical\_Class\_code type\="string"\>0</Medical\_Class\_code>        <Perform\_Total\_Number type\="string"\>01</Perform\_Total\_Number>        <Perform\_Calendar type\="string"\>0000000000000000010000000000000</Perform\_Calendar>        <Perform\_Day\_Information type\="array"\>          <Perform\_Day\_Information\_child type\="record"\>            <Perform\_Day type\="string"\>18</Perform\_Day>            <Perform\_Day\_Number type\="string"\>1</Perform\_Day\_Number>          </Perform\_Day\_Information\_child>        </Perform\_Day\_Information>      </Medical\_List\_Information\_child>    </Medical\_List\_Information>  </medicalget03res>  
</xmlio2> 

レスポンス一覧(診療区分別剤点数)
-----------------

診療区分別剤点数はxml2のみ返却します。  

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-08-18 |     |
| 2   | Information\_Time | 実施時間 | 18:41:50 |     |
| 3   | Api\_Result | エラーコード | 00  |     |
| 4   | Api\_Result\_Message | メッセージ | 処理終了 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Patient\_Information | 患者情報 |     |     |
| 6-1 | Patient\_ID | 患者番号 | 00017 |     |
| 6-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 6-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 6-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 6-5 | Sex | 性別  | 1   |     |
| 7   | Perform\_Date | 診療年月 | 2015-08 |     |
| 8   | Department\_Code | 診療科 | 10  |     |
| 9   | Department\_Name | 診療科名称 | 外科  |     |
| 10  | Medical\_List\_Information | 保険組合せ情報（繰り返し　５） |     | ※１  |
| 10-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 10-2 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 10-2-1 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 10-2-2 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 10-2-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 10-2-4 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 10-2-5 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 10-2-6 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 10-2-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 10-2-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 10-2-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 10-2-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 10-2-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 11  | Medical\_Information | 診療行為情報（繰り返し　３１） |     |     |
| 11-1 | Medical\_Day | 算定日 | 18  | ※２  |
| 11-2 | Medical\_Information2 | 診療行為情報２（繰り返し　４０） |     |     |
| 11-2-1 | Medical\_Class | 診療区分 | 40  | ※３  |
| 11-2-2 | Medical\_Class2 | 診療種別区分 | 400 | ※４  |
| 11-2-3 | Medical\_Class\_Name | 診療種別区分名称 | 処置行為 |     |
| 11-2-4 | Medication\_info | 剤情報（繰り返し　１００） |     | ※５  |
| 11-2-4-1 | Medical\_Class\_Point | 剤点数 | 2   |     |
| 11-2-4-2 | Medical\_Class\_Money | 剤金額 |     | ※６  |
| 11-2-4-3 | Medical\_Class\_Number | 算定回数 | 1   |     |
| 11-2-4-4 | Medical\_Class\_code | 包括区分  <br>（1：包括分） | 1   |     |
| 11-2-4-5 | Medical\_Inclusion\_Class | 包括剤区分  <br> (True：包括対象) | True | 追加  <br>(2015-08-26) |

 ※診療年月で診療会計テーブルを検索し、算定日・診療区分順に剤毎の剤点数（金額）を返却します。

 ※診療科・保険の設定があれば指定されたデータのみを対象とします。

 ※保険の指定がない場合、労災・自賠責・自費保険以外の保険のデータのみを対象とします。  
 　労災・自賠責・自費保険は、保険の指定を行って下さい。

 ※１：対象となった保険組合せの情報を最大５件まで表示します。

 ※２：１から３１まで算定のある日のみ返却します。

 ※３：１１（初診）から９６（保険外(消費税あり)(診療会計テーブルの診療区分)）

 ※４：診療区分８０（その他）は診療種別区分を８００（リハビリ）から８９０（入院料(外来)）で返却します。（診療行為テーブルの診療種別区分）  
 　　　診療区分８０（その他）以外は、診療区分＋０を診療種別区分とします。（診療行為テーブルの診療種別区分ではありません）

 ※５：対象の剤点数を検索順に表示します。（診療科・診療区分・剤番号順）

 ※６：労災の金額または、自費の金額となります。

### レスポンスサンプル

<xmlio2>  <medicalget04res type\="record"\>    <Information\_Date type\="string"\>2015-08-18</Information\_Date>    <Information\_Time type\="string"\>18:41:50</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00017</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Perform\_Date type\="string"\>2015-08</Perform\_Date>    <Department\_Code type\="string"\>10</Department\_Code>    <Department\_Name type\="string"\>外科</Department\_Name>    <Medical\_List\_Information type\="array"\>      <Medical\_List\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <HealthInsurance\_Information type\="record"\>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information>      </Medical\_List\_Information\_child>    </Medical\_List\_Information>    <Medical\_Information type\="array"\>      <Medical\_Information\_child type\="record"\>        <Medical\_Day type\="string"\>18</Medical\_Day>        <Medical\_Information2 type\="array"\>          <Medical\_Information2\_child type\="record"\>            <Medical\_Class type\="string"\>40</Medical\_Class>            <Medical\_Class2 type\="string"\>400</Medical\_Class2>            <Medical\_Class\_Name type\="string"\>処置行為</Medical\_Class\_Name>            <Medication\_info type\="array"\>              <Medication\_info\_child type\="record"\>                <Medical\_Class\_Point type\="string"\>2</Medical\_Class\_Point>                <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                <Medical\_Class\_code type\="string"\>1</Medical\_Class\_code>                <Medical\_Inclusion\_Class type\="string"\>True</Medical\_Inclusion\_Class>              </Medication\_info\_child>            </Medication\_info>          </Medical\_Information2\_child>          <Medical\_Information2\_child type\="record"\>            <Medical\_Class type\="string"\>70</Medical\_Class>            <Medical\_Class2 type\="string"\>700</Medical\_Class2>            <Medical\_Class\_Name type\="string"\>画像診断</Medical\_Class\_Name>            <Medication\_info type\="array"\>              <Medication\_info\_child type\="record"\>                <Medical\_Class\_Point type\="string"\>4580</Medical\_Class\_Point>                <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>              </Medication\_info\_child>            </Medication\_info>          </Medical\_Information2\_child>        </Medical\_Information2>      </Medical\_Information\_child>    </Medical\_Information>  </medicalget04res>  
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

\# -\*- coding: utf-8 -\*- 

[sample\_medical\_info\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medical_info_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 診療行為内容取得  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/medicalgetv2?class=03")  
\# class :01 受診履歴取得  
\# class :02 日別診療情報取得  
\# class :03 月別診療情報取得  
\# class :04 区分別剤点数情報取得  
#  
\#        入外区分          InOut                           (IMPLIED)  
\#        患者番号          Patient\_ID                      (REQUIRED)  
\#        診療年月日        Perform\_Date                    (IMPLIED)  
\#        月数              For\_Months                      (IMPLIED)  
\#        診療科コード      Department\_Code                 (REQUIRED)  
\#        連番              Sequential\_Number               (IMPLIED)  
\#        保険組合せ番号    Insurance\_Combination\_Number    (IMPLIED)  
\#        保険の種類        InsuranceProvider\_Class         (IMPLIED)  
\#        保険の制度名称    InsuranceProvider\_WholeName     (IMPLIED)  
\#        保険者番号        InsuranceProvider\_Number        (IMPLIED)  
\#        公費の種類        PublicInsurance\_Class           (IMPLIED)  
\#        公費の制度名称   PublicInsurance\_Name            (IMPLIED)  
\#        負担者番号       PublicInsurer\_Number            (IMPLIED)  
\#        受給者番号       PublicInsuredPerson\_Number      (IMPLIED)  
#  
\#        REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <medicalgetreq type\="record"\>                <InOut type\="string"\>I</InOut>                <Patient\_ID type\="string"\>2</Patient\_ID>                <Perform\_Date type\="string"\>2012-06-12</Perform\_Date>                <For\_Months type\="string"\>12</For\_Months>                <Medical\_Information type\="record"\>                        <Department\_Code type\="string"\>02</Department\_Code>                        <Sequential\_Number type\="string"\>1</Sequential\_Number>                        <Insurance\_Combination\_Number type\="string"\>0015</Insurance\_Combination\_Number>                        <HealthInsurance\_Information type\="record"\>                                <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>                                <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>                                <InsuranceProvider\_Number type\="string"\> </InsuranceProvider\_Number>                                <HealthInsuredPerson\_Symbol type\="string"\> </HealthInsuredPerson\_Symbol>                                <HealthInsuredPerson\_Number type\="string"\> </HealthInsuredPerson\_Number>                                <PublicInsurance\_Information type\="array"\>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>051</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\></PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\>51020001</PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\></PublicInsuredPerson\_Number>                                        </PublicInsurance\_Information\_child>                                </PublicInsurance\_Information>                        </HealthInsurance\_Information>                </Medical\_Information>        </medicalgetreq>  
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
| 01  | 患者番号の設定がありません |
| 02  | 診療科の設定がありません |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 診療日が暦日ではありません |
| 12  | 保険組合せ番号の設定が違います |
| 13  | 診療科が存在しません |
| 14  | 対象が１５０件以上存在します |
| 15  | 対象がありません |
| 16  | 月数は０〜１２、９９を設定して下さい |
| 20  | 該当する保険組合せがありません |
| 21  | 対象の保険組合せが５件以上あります |
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
| K1  | 診療日を設定しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 診療情報の返却

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/medicalinfo.html#wrapper)

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
