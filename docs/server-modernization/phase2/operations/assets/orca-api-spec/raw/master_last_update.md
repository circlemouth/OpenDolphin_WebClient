[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/master_last_update.html#content)

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
 > マスタデータ最終更新日取得

マスタデータ最終更新日取得  

================

メニュー
----

*   [マスタデータ最終更新日取得（URL:/orca51/masterlastupdatev3）](https://www.orca.med.or.jp/receipt/tec/api/master_last_update.html#api1)
    

マスタデータ最終更新日取得（URL:/orca51/masterlastupdatev3）  

------------------------------------------------

*   以下のマスタの最終更新日の返却を行います。

*   点数マスタ  
    
*   病名マスタ  
    

*   最終更新日の一覧、個別マスタの直近５回分の更新日の返却を行います。

### サンプル１（マスタデータの最終更新日の一覧を返却）  

#### リクエスト

<data>  
  <masterlastupdatev3req type ="record">  
  </masterlastupdatev3req>  
</data>  

#### レスポンス

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <masterlastupdatev3res type="record">  
    <Information\_Date type="string">2017-11-14</Information\_Date>  
    <Information\_Time type="string">16:47:27</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">正常終了</Api\_Result\_Message>  
    <Master\_Last\_Update\_Information type="array">  
      <Master\_Last\_Update\_Information\_child type="record">  
        <Master\_Id type="string">medication\_master</Master\_Id>  
        <Last\_Update\_Date type="string">2017-10-11</Last\_Update\_Date>  
      </Master\_Last\_Update\_Information\_child>  
      <Master\_Last\_Update\_Information\_child type="record">  
        <Master\_Id type="string">disease\_master</Master\_Id>  
        <Last\_Update\_Date type="string">2017-09-23</Last\_Update\_Date>  
      </Master\_Last\_Update\_Information\_child>  
    </Master\_Last\_Update\_Information>  
  </masterlastupdatev3res>  
</xmlio2>  

### サンプル２（点数マスタの直近５回分の更新日を返却）

#### リクエスト

<data>  
<masterlastupdatev3req type ="record">  
  <Master\_Id type ="string">medication\_master</Master\_Id>  
</masterlastupdatev3req>  
</data>  

#### レスポンス

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <masterlastupdatev3res type="record">  
    <Information\_Date type="string">2017-11-14</Information\_Date>  
    <Information\_Time type="string">17:27:21</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">正常終了</Api\_Result\_Message>  
    <Master\_Id type="string">medication\_master</Master\_Id>  
    <Last\_Update\_Date type="string">2017-10-11</Last\_Update\_Date>  
    <Update\_Information type="array">  
      <Update\_Information\_child type="record">  
        <Update\_Date type="string">2017-10-11</Update\_Date>  
        <Count type="string">1</Count>  
      </Update\_Information\_child>  
      <Update\_Information\_child type="record">  
        <Update\_Date type="string">2017-09-25</Update\_Date>  
        <Count type="string">3498</Count>  
      </Update\_Information\_child>  
      <Update\_Information\_child type="record">  
        <Update\_Date type="string">2017-02-09</Update\_Date>  
        <Count type="string">394</Count>  
      </Update\_Information\_child>  
      <Update\_Information\_child type="record">  
        <Update\_Date type="string">2016-10-18</Update\_Date>  
        <Count type="string">474</Count>  
      </Update\_Information\_child>  
      <Update\_Information\_child type="record">  
        <Update\_Date type="string">2016-09-02</Update\_Date>  
        <Count type="string">68</Count>  
      </Update\_Information\_child>  
    </Update\_Information>  
  </masterlastupdatev3res>  
</xmlio2>  

### レイアウト資料(PDF)  

[orca51\_masterlastupdatev3.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/orca51_masterlastupdatev3.pdf)
[orca51\_masterlastupdatev3\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/orca51_masterlastupdatev3_err.pdf)
  

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

[sample\_masterlastupdate\_v3.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_masterlastupdate_v3.rb)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > マスタデータ最終更新日取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/master_last_update.html#wrapper)

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
