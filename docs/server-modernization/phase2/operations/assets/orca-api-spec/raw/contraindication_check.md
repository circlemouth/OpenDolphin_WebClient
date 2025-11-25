[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/contraindication_check.html#content)

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
 > 薬剤併用禁忌チェック

薬剤併用禁忌チェック  

=============

薬剤併用禁忌チェックAPI（URL:/api01rv2/contraindicationcheckv2）
----------------------------------------------------

「診療年月−チェック月数」を開始年月として診療年月までの期間に投与した薬剤と、リクエストした薬剤コードで併用禁忌をチェックします。  

設定された内容に問題がなければ、送信された薬剤コード、薬剤コードのエラーがあればエラーコードとメッセージ、薬剤コードに対して禁忌薬剤コード、最終投与日または今回送信区分を返却します。  

症状詳記区分は同じコードが複数存在する可能性があるため、症状詳記区分毎に詳細を返却します。

方向性(Context\_Class)  
薬剤コード入力後に禁忌薬剤の入力を行った場合は「before（→）」を返却し、  
薬剤コードより前に禁忌薬剤の入力を行った場合は「after（←）」を返却します。  

症状詳記内容は禁忌情報の症状詳記区分の詳細を最大５０件返却します。  
症状詳記区分が５０件以上存在した場合、その旨を返却します。

### リクエストサンプル  

<data>  
  <contraindication\_checkreq type ="record">  
    <Request\_Number type ="string">01</Request\_Number>  
    <Patient\_ID type ="string">1</Patient\_ID>  
    <Perform\_Month type ="string">2018-12</Perform\_Month>  
    <Check\_Term type ="string">1</Check\_Term>  
    <Medical\_Information type ="array">  
      <Medical\_Information\_child type ="record">  
        <Medication\_Code type ="string">620008439</Medication\_Code>  
        <Medication\_Name type ="string"></Medication\_Name>  
      </Medical\_Information\_child>  
    </Medical\_Information>  
  </contraindication\_checkreq>  
</data>  

### レスポンスサンプル

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <contraindication\_checkres type="record">  
    <Information\_Date type="string">2018-12-26</Information\_Date>  
    <Information\_Time type="string">13:42:24</Information\_Time>  
    <Api\_Result type="string">00</Api\_Result>  
    <Api\_Result\_Message type="string">処理終了</Api\_Result\_Message>  
    <Reskey type="string">Medical Info</Reskey>  
    <Perform\_Month type="string">2018-12</Perform\_Month>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00001</Patient\_ID>  
      <WholeName type="string">日医　太郎</WholeName>  
      <WholeName\_inKana type="string">ニチイ　タロウ</WholeName\_inKana>  
      <BirthDate type="string">1958-01-10</BirthDate>  
      <Sex type="string">1</Sex>  
    </Patient\_Information>  
    <Medical\_Information type="array">  
      <Medical\_Information\_child type="record">  
        <Medication\_Code type="string">620008439</Medication\_Code>  
        <Medication\_Name type="string">グラセプターカプセル５ｍｇ</Medication\_Name>  
        <Medical\_Info type="array">  
          <Medical\_Info\_child type="record">  
            <Contra\_Code type="string">621674701</Contra\_Code>  
            <Contra\_Name type="string">シクロスポリンカプセル２５ｍｇ「日医工」</Contra\_Name>  
            <Interact\_Code type="string">S000328</Interact\_Code>  
            <Administer\_Date type="string">2018-12-01</Administer\_Date>  
            <Context\_Class type="string">after</Context\_Class>  
          </Medical\_Info\_child>  
          <Medical\_Info\_child type="record">  
            <Contra\_Code type="string">621674701</Contra\_Code>  
            <Contra\_Name type="string">シクロスポリンカプセル２５ｍｇ「日医工」</Contra\_Name>  
            <Interact\_Code type="string">S000364</Interact\_Code>  
            <Administer\_Date type="string">2018-12-01</Administer\_Date>  
            <Context\_Class type="string">before</Context\_Class>  
          </Medical\_Info\_child>  
        </Medical\_Info>  
      </Medical\_Information\_child>  
    </Medical\_Information>  
    <Symptom\_Information type="array">  
      <Symptom\_Information\_child type="record">  
        <Symptom\_Code type="string">S000328</Symptom\_Code>  
        <Symptom\_Content type="string">本剤の血中濃度が上昇、腎障害等の副作用</Symptom\_Content>  
        <Symptom\_Detail type="string">本剤の代謝が阻害、副作用が相互に増強</Symptom\_Detail>  
      </Symptom\_Information\_child>  
      <Symptom\_Information\_child type="record">  
        <Symptom\_Code type="string">S000364</Symptom\_Code>  
        <Symptom\_Content type="string">同一成分を含むプログラフにてシクロスポリンの血中濃度が上昇し副作用が増強</Symptom\_Content>  
        <Symptom\_Detail type="string">本剤とシクロスポリンは薬物代謝酵素ＣＹＰ３Ａ４で代謝されるため、併用した場合、競合的に拮抗しシクロスポリンの代謝が阻害</Symptom\_Detail>  
      </Symptom\_Information\_child>  
    </Symptom\_Information>  
  </contraindication\_checkres>  
</xmlio2>  

### レイアウト資料(PDF)  

[api01rv2\_contraindicationcheckv2.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_contraindicationcheckv2.pdf)

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

[sample\_contraindicationcheckv2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_contraindicationcheckv2.rb)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 薬剤併用禁忌チェック

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/contraindication_check.html#wrapper)

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
