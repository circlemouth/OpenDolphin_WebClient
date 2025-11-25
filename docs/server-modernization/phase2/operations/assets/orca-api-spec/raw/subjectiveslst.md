[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/subjectiveslst.html#content)

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
 > 症状詳記情報取得

症状詳記情報取得
========

更新履歴
----

 2024-10-24   Request\_Number = 03 を追加。

 2021-01-27   レイアウト資料に項目を追加。

症状詳記情報取得 (URL:/api01rv2/subjectiveslstv2)
-----------------------------------------

登録されている症状詳記一覧およびその詳細情報の取得を可能とします。

Request\_Number = 01 により、全ての症状詳記区分リストを返却します。  
Request\_Number = 02 において、診療科、保険組合せ等を設定することにより該当の症状詳記区分に登録されているコメント内容を返却します。  
このリクエストで診療科等を設定しない場合は、Request\_Number = 01で返却された最初の症状詳記のコメント内容を返却します。  
Request\_Number = 03 により 症状詳記区分リスト（Subjectives\_Detail\_Information）を返却します。

リクエストサンプル

<data>  
        <subjectiveslstreq type="record">  
                <Request\_Number type="string">02</Request\_Number>  
                <Patient\_ID type="string">161</Patient\_ID>  
                <Perform\_Date type="string">2017-10</Perform\_Date>  
                <InOut type="string">O</InOut>  
                <Department\_Code type="string">02</Department\_Code>  
                <Insurance\_Combination\_Number type="string">7</Insurance\_Combination\_Number>  
                <Subjectives\_Detail\_Record type="string">02</Subjectives\_Detail\_Record>  
                <Subjectives\_Number type="string">01</Subjectives\_Number>  
        </subjectiveslstreq>  
</data>  

レスポンスサンプル

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <subjectiveslstres type="record">  
    <Information\_Date type="string">2017-10-12</Information\_Date>  
    <Information\_Time type="string">13:07:25</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">処理終了</Api\_Result\_Message>  
    <Reskey type="string">Acceptance\_Info</Reskey>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00161</Patient\_ID>  
      <WholeName type="string">羽織　てすと</WholeName>  
      <WholeName\_inKana type="string">ハオリ　テスト</WholeName\_inKana>  
      <BirthDate type="string">1971-06-04</BirthDate>  
      <Sex type="string">2</Sex>  
    </Patient\_Information>  
    <Perform\_Date type="string">2017-10</Perform\_Date>  
    <Subjectives\_Information type="array">  
      <Subjectives\_Information\_child type="record">  
        <InOut type="string">O</InOut>  
        <Department\_Code type="string">02</Department\_Code>  
        <Department\_Name type="string">精神科</Department\_Name>  
        <HealthInsurance\_Information type="record">  
          <Insurance\_Combination\_Number type="string">0007</Insurance\_Combination\_Number>  
          <Insurance\_Combination\_StartDate type="string">2016-01-12</Insurance\_Combination\_StartDate>  
          <Insurance\_Combination\_ExpiredDate type="string">9999-12-31</Insurance\_Combination\_ExpiredDate>  
          <InsuranceProvider\_Class type="string">060</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">国保</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Number type="string">320010</InsuranceProvider\_Number>  
          <HealthInsuredPerson\_Symbol type="string">１２３４５６７</HealthInsuredPerson\_Symbol>  
          <HealthInsuredPerson\_Number type="string">５５６６７７８</HealthInsuredPerson\_Number>  
          <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
          <HealthInsuredPerson\_Assistance\_WholeName type="string">３割</HealthInsuredPerson\_Assistance\_WholeName>  
          <RelationToInsuredPerson type="string">1</RelationToInsuredPerson>  
          <PublicInsurance\_Information type="array">  
            <PublicInsurance\_Information\_child type="record">  
              <PublicInsurance\_Class type="string">021</PublicInsurance\_Class>  
              <PublicInsurance\_Name type="string">精神通院</PublicInsurance\_Name>  
              <PublicInsurer\_Number type="string">21123450</PublicInsurer\_Number>  
              <PublicInsuredPerson\_Number type="string">1234566</PublicInsuredPerson\_Number>  
            </PublicInsurance\_Information\_child>  
          </PublicInsurance\_Information>  
        </HealthInsurance\_Information>  
        <Subjectives\_Detail\_Record type="string">02</Subjectives\_Detail\_Record>  
        <Subjectives\_Detail\_Record\_WholeName type="string">主たる疾患の診療・検査所見</Subjectives\_Detail\_Record\_WholeName>  
        <Subjectives\_Number type="string">01</Subjectives\_Number>  
      </Subjectives\_Information\_child>  
    </Subjectives\_Information>  
    <Subjectives\_Code\_Information type="record">  
      <Subjectives\_Code type="string">国保・精神通院保険の症状詳記</Subjectives\_Code>  
    </Subjectives\_Code\_Information>  
  </subjectiveslstres>  
</xmlio2>  

### レイアウト資料(PDF)

[api01rv2\_subjectiveslstv2.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_subjectiveslstv2.pdf)
  
[api01rv2\_subjectiveslstv2\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_subjectiveslstv2_err.pdf)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 症状詳記情報取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/subjectiveslst.html#wrapper)

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
