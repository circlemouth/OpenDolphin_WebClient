[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospfind.html#content)

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
 > 入院患者照会

入院患者照会
======

各検索項目より検索条件に該当する入院患者情報の返却を行います。

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospfind.html#history)
    
*   [入院患者照会API(URL:/orca36/hsfindv3)](https://www.orca.med.or.jp/receipt/tec/api/hospfind.html#api1)
      
    

更新履歴  

-------

*   2018-05-28

*   不具合修正

*   リクエスト項目［範囲指定の終了値］の設定が有効とならない不具合を修正

*   機能追加

*   リクエスト項目［入院状態］ に"5"（仮保険組合せ登録）を追加
*   レスポンス項目に［保険組合せ番号］を追加  
    

入院患者照会処理  

-----------

### 入院患者照会API（URL:/orca36/hsfindv3）

#### Request\_Number=01

患者氏名、住所、入院日、退院日、病棟番号等の検索項目を設定し、入院患者の検索を行います。

リクエストサンプル  
2017-09-01に入院した患者を検索  

<data>  
<hsfindv3req type ="record">  
  <Request\_Number type ="string">01</Request\_Number>  
  <Patient\_Information type ="record">  
    <Admission\_Date type ="record">  
      <First type ="string">2017-09-01</First>  
      <Last type ="string">2017-09-01</Last>  
    </Admission\_Date>  
  </Patient\_Information>  
</hsfindv3req>  
</data>  

レスポンスサンプル  

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <hsfindv3res type="record">  
    <Information\_Date type="string">2017-09-22</Information\_Date>  
    <Information\_Time type="string">10:26:27</Information\_Time>  
    <Api\_Result type="string">00000</Api\_Result>  
    <Api\_Result\_Message type="string">正常終了</Api\_Result\_Message>  
    <Count type="string">4</Count>  
    <Selection type="record">  
      <First type="string">1</First>  
      <Last type="string">4</Last>  
    </Selection>  
    <Result type="array">  
      <Result\_child type="record">  
        <Number type="string">1</Number>  
        <Patient\_ID type="string">00005</Patient\_ID>  
        <WholeName\_inKana type="string">ニチイ　オキナ</WholeName\_inKana>  
        <WholeName type="string">日医　翁</WholeName>  
        <Sex type="string">1</Sex>  
        <Birth\_Date type="string">1937-01-10</Birth\_Date>  
        <Ward\_Number type="string">02</Ward\_Number>  
        <Ward\_Name type="string">療養</Ward\_Name>  
        <HealthInsurance\_Information type="record">  
          <InsuranceProvider\_Class type="string">039</InsuranceProvider\_Class>  
          <InsuranceProvider\_Number type="string">39131057</InsuranceProvider\_Number>  
          <InsuranceProvider\_WholeName type="string">後期高齢者</InsuranceProvider\_WholeName>  
          <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
          <RelationToInsuredPerson type="string">1</RelationToInsuredPerson>  
          <HealthInsuredPerson\_WholeName type="string">日医　翁</HealthInsuredPerson\_WholeName>  
          <Certificate\_StartDate type="string">2012-04-01</Certificate\_StartDate>  
          <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
        </HealthInsurance\_Information>  
        <Admission\_Date type="string">2017-09-01</Admission\_Date>  
        <Discharge\_Date type="string">9999-12-31</Discharge\_Date>  
        <Department\_Name type="string">内科</Department\_Name>  
      </Result\_child>  
      <Result\_child type="record">  
        <Number type="string">2</Number>  
        <Patient\_ID type="string">00001</Patient\_ID>  
        <WholeName\_inKana type="string">ニチイ　タロウ</WholeName\_inKana>  
        <WholeName type="string">日医　太郎</WholeName>  
        <Sex type="string">1</Sex>  
        <Birth\_Date type="string">1975-01-01</Birth\_Date>  
        <Ward\_Number type="string">01</Ward\_Number>  
        <Ward\_Name type="string">一般</Ward\_Name>  
        <PhoneNumber type="string">090-0001-0001</PhoneNumber>  
        <HealthInsurance\_Information type="record">  
          <InsuranceProvider\_Class type="string">009</InsuranceProvider\_Class>  
          <InsuranceProvider\_Number type="string">01130012</InsuranceProvider\_Number>  
          <InsuranceProvider\_WholeName type="string">協会</InsuranceProvider\_WholeName>  
          <RelationToInsuredPerson type="string">1</RelationToInsuredPerson>  
          <HealthInsuredPerson\_WholeName type="string">日医　太郎</HealthInsuredPerson\_WholeName>  
          <Certificate\_StartDate type="string">2008-04-01</Certificate\_StartDate>  
          <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
        </HealthInsurance\_Information>  
        <Admission\_Date type="string">2017-09-01</Admission\_Date>  
        <Discharge\_Date type="string">9999-12-31</Discharge\_Date>  
        <Department\_Name type="string">内科</Department\_Name>  
      </Result\_child>  
      <Result\_child type="record">  
        <Number type="string">3</Number>  
        <Patient\_ID type="string">00002</Patient\_ID>  
        <WholeName\_inKana type="string">ニチイ　マミ</WholeName\_inKana>  
        <WholeName type="string">日医　真美</WholeName>  
        <Sex type="string">2</Sex>  
        <Birth\_Date type="string">1981-09-01</Birth\_Date>  
        <Ward\_Number type="string">02</Ward\_Number>  
        <Ward\_Name type="string">療養</Ward\_Name>  
        <HealthInsurance\_Information type="record">  
          <InsuranceProvider\_Class type="string">009</InsuranceProvider\_Class>  
          <InsuranceProvider\_Number type="string">01130012</InsuranceProvider\_Number>  
          <InsuranceProvider\_WholeName type="string">協会</InsuranceProvider\_WholeName>  
          <RelationToInsuredPerson type="string">2</RelationToInsuredPerson>  
          <HealthInsuredPerson\_WholeName type="string">日医　太郎</HealthInsuredPerson\_WholeName>  
          <Certificate\_StartDate type="string">2016-04-01</Certificate\_StartDate>  
          <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
        </HealthInsurance\_Information>  
        <Admission\_Date type="string">2017-09-01</Admission\_Date>  
        <Discharge\_Date type="string">9999-12-31</Discharge\_Date>  
        <Department\_Name type="string">内科</Department\_Name>  
      </Result\_child>  
      <Result\_child type="record">  
        <Number type="string">4</Number>  
        <Patient\_ID type="string">00003</Patient\_ID>  
        <WholeName\_inKana type="string">ニチイ　イチロウ</WholeName\_inKana>  
        <WholeName type="string">日医　一郎</WholeName>  
        <Sex type="string">1</Sex>  
        <Birth\_Date type="string">2015-08-01</Birth\_Date>  
        <Ward\_Number type="string">01</Ward\_Number>  
        <Ward\_Name type="string">一般</Ward\_Name>  
        <HealthInsurance\_Information type="record">  
          <InsuranceProvider\_Class type="string">009</InsuranceProvider\_Class>  
          <InsuranceProvider\_Number type="string">01130012</InsuranceProvider\_Number>  
          <InsuranceProvider\_WholeName type="string">協会</InsuranceProvider\_WholeName>  
          <RelationToInsuredPerson type="string">2</RelationToInsuredPerson>  
          <HealthInsuredPerson\_WholeName type="string">日医　太郎</HealthInsuredPerson\_WholeName>  
          <Certificate\_StartDate type="string">2015-08-01</Certificate\_StartDate>  
          <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
        </HealthInsurance\_Information>  
        <Admission\_Date type="string">2017-09-01</Admission\_Date>  
        <Discharge\_Date type="string">9999-12-31</Discharge\_Date>  
        <Department\_Name type="string">内科</Department\_Name>  
      </Result\_child>  
    </Result>  
  </hsfindv3res>  
</xmlio2>  

### レイアウト資料(PDF)

[orca36\_hsfindv3.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/orca36_hsfindv3.pdf)
[orca36\_hsfindv3\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/orca36_hsfindv3_err.pdf)

### Rubyによるリクエストサンプルソース

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2  
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1  
    

Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
サンプルソース内に以下の一行が記述されていることを確認して下さい。

\# -\*- coding: utf-8 -\*-     

[sample\_hsfind\_v3.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsfind_v3.rb)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院患者照会

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospfind.html#wrapper)

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
