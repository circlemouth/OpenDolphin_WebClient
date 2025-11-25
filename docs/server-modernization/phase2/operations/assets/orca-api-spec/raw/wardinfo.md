[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#content)

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
 > 病棟・病室情報

病棟・病室情報
=======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#reqsample)
    
*   [レスポンスサンプル(病棟情報)](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#ressample)
    
*   [レスポンスサンプル(病室情報)](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#ressample2)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#request)
    
*   [レスポンス一覧(病棟情報)](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#response)
    
*   [レスポンス一覧(病室情報)](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#response2)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#errmsg)
      
    

更新履歴
----

 2014-08-01   「エラーメッセージ一覧」を追加。

 2013-11-26   「レスポンスサンプル(病棟情報)・(病室情報)」「レスポンス一覧(病棟情報)・(病室情報)」の項目名を一部変更。

概要
--

POSTメソッドによる病棟・病室情報の取得を行います。

日レセ Ver.4.7.0\[第17回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_in\_room\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_in\_room\_v2.rb 内の基準日等を接続先の日レセの環境に合わせます。
3.  ruby sample\_in\_room\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsconfwardv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

今までのAPIではURLに引数(class)を指定することで機能の選択を行っていましたが、このAPIでは引数を受け取らない仕様に変更となりました。  
その代わりに、リクエストデータ内に「Request\_Number」の項目を追加し、「Request\_Number」にリクエスト番号を指定することで機能の選択を行います。  

  

<data>     <private\_objects type\="record"\>         <Request\_Number type\="string"\>1</Request\_Number>         <Base\_Date type\="string"\>2013-09-09</Base\_Date>         <Ward\_Number type\="string"\></Ward\_Number>         <Room\_Number type\="string"\></Room\_Number>     </private\_objects> </data> 

### 処理概要

病棟・病室情報リクエストで基準日を指定することにより病棟・病室の情報を返却します。  
  

### 処理詳細

1.  基準日の妥当性チェック（未設定の場合は、システム日付を設定）  
      
    

 返却情報について

*    病棟情報

*   病棟番号、病室番号指定なしの場合、全ての病棟情報を返却する。
*   病室番号のみ指定ありの場合、該当する病室を含む病棟情報を全て返却する。
*   病棟番号のみ指定ありの場合、指定された病棟情報を返却する。
*   病棟番号、病室番号指定ありの場合、指定された病棟情報を返却する（病室番号は無視する）。  
    

*   病室情報

*   病棟番号、病室番号指定なしの場合、エラーを返却する。
*   病室番号のみ指定ありの場合、該当する病室情報を全て返却する。
*   病棟番号のみ指定ありの場合、該当する病棟の病室情報を全て返却する。
*   病棟番号、病室番号指定ありの場合、指定された病室情報を返却する。

  

レスポンスサンプル(病棟情報)
---------------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-09-12</Information\_Date>    <Information\_Time type\="string"\>13:10:42</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Ward\_Configuration type\="array"\>      <Ward\_Configuration\_child type\="record"\>        <Start\_Date type\="string"\>2013-03-01</Start\_Date>        <End\_Date type\="string"\>9999-12-31</End\_Date>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名称</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Ward\_Short\_Name type\="record"\>          <Label type\="string"\>短縮病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Short\_Name>        <Ward\_Type type\="record"\>          <Label type\="string"\>病棟種別</Label>          <Data type\="string"\>08</Data>          <Name type\="string"\>有床診療所</Name>        </Ward\_Type>        <Hospital\_Charge type\="record"\>          <Label type\="string"\>入院基本料</Label>          <Data type\="string"\>190097010</Data>          <Name type\="string"\>有床診療所入院基本料１（１４日以内）</Name>        </Hospital\_Charge>        <Over180days\_Hospital\_Stay\_Charges type\="record"\>          <Label type\="string"\>選定入院料</Label>          <Calculation\_Type type\="record"\>            <Label type\="string"\>負担計算</Label>            <Data type\="string"\>1</Data>            <Name type\="string"\>定率設定</Name>          </Calculation\_Type>          <Consumption\_Tax type\="record"\>            <Label type\="string"\>消費税</Label>            <Data type\="string"\>0</Data>            <Name type\="string"\>なし</Name>          </Consumption\_Tax>          <Value\_Per\_Day type\="record"\>            <Label type\="string"\>一般点数単価</Label>            <Data type\="string"\>  10</Data>            <Name type\="string"\>点</Name>          </Value\_Per\_Day>          <Value\_Per\_Day\_Late\_Elderly type\="record"\>            <Label type\="string"\>後期高齢者点数単価</Label>            <Data type\="string"\>  10</Data>            <Name type\="string"\>点</Name>          </Value\_Per\_Day\_Late\_Elderly>        </Over180days\_Hospital\_Stay\_Charges>        <Room\_Number type\="array"\>          <Room\_Number\_child type\="record"\>            <Label type\="string"\>病室番号</Label>            <Data type\="string"\>101</Data>          </Room\_Number\_child>        </Room\_Number>      </Ward\_Configuration\_child>    </Ward\_Configuration>  </private\_objects>  
</xmlio2> 

レスポンスサンプル(病室情報)
---------------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-09-12</Information\_Date>    <Information\_Time type\="string"\>13:13:16</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Room\_Configuration type\="array"\>      <Room\_Configuration\_child type\="record"\>        <Start\_Date type\="string"\>2013-03-01</Start\_Date>        <End\_Date type\="string"\>9999-12-31</End\_Date>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名称</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Room\_Type type\="record"\>          <Label type\="string"\>病室種別</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>一般病室</Name>        </Room\_Type>        <Bed\_Numbers type\="record"\>          <Label type\="string"\>収容人数</Label>          <Data type\="string"\> 4</Data>          <Name type\="string"\>人</Name>        </Bed\_Numbers>      </Room\_Configuration\_child>    </Room\_Configuration>  </private\_objects>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 1   | 1: 病棟情報  <br>2: 病室情報 |
| 2   | Base\_Date | 基準日 | 2013-09-09 | 未設定はシステム日付 |
| 3   | Ward\_Number | 病棟番号 | 01  | ※１  |
| 4   | Room\_Number | 病室番号 | 101 | ※１  |

※１: 病室情報取得時には病棟番号、病室番号のどちらかを必須とします。

レスポンス一覧(病棟情報)
-------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-09-12 |     |
| 2   | Information\_Time | 実施時間 | 13:10:42 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Ward\_Configuration | 病棟情報（繰り返し５０） |     |     |
| 5-1 | Start\_Date | 設定の有効期間開始日 | 2013-03-01 |     |
| 5-2 | End\_Date | 設定の有効期間終了日 | 9999-12-31 |     |
| 5-3 | Ward\_Number | 病棟番号 |     |     |
| 5-3-1 | Label | 内容の名称 | 病棟番号 |     |
| 5-3-2 | Data | 病棟番号 | 01  |     |
| 5-4 | Ward\_Name | 病棟名称 |     |     |
| 5-4-1 | Label | 内容の名称 | 病棟名称 |     |
| 5-4-2 | Data | 病棟名 | 北病棟 |     |
| 5-5 | Ward\_Short\_Name | 短縮病棟名称 |     |     |
| 5-5-1 | Label | 内容の名称 | 短縮病棟名 |     |
| 5-5-2 | Data | 短縮病棟名称 | 北病棟 |     |
| 5-6 | Ward\_Type | 病棟種別 |     |     |
| 5-6-1 | Label | 内容の名称 | 病棟種別 |     |
| 5-6-2 | Data | 病棟種別コード  <br>（01、02、03、04、05、06、08、09、10） | 08  |     |
| 5-6-3 | Name | 病棟種別名称  <br>（一般病棟、  <br>精神病棟、  <br>結核病棟、  <br>療養病棟、  <br>障害者施設等、  <br>専門病院、  <br>有床診療所、  <br>有床診療所療養病床、  <br>医療観察病棟） | 有床診療所 |     |
| 5-7 | Department\_Code | 診療科 |     |     |
| 5-7-1 | Label | 内容の名称 |     |     |
| 5-7-2 | Data | 診療科コード |     |     |
| 5-7-3 | Name | 診療科名称 |     |     |
| 5-8 | Specific\_Hospital\_Charge | 特定入院料 |     |     |
| 5-8-1 | Label | 内容の名称 |     |     |
| 5-8-2 | Data | 特定入院料コード |     |     |
| 5-8-3 | Name | 特定入院料の内容 |     |     |
| 5-9 | Hospital\_Charge | 入院基本料 |     |     |
| 5-9-1 | Label | 内容の名称 | 入院基本料 |     |
| 5-9-2 | Data | 入院基本料コード | 190097010 |     |
| 5-9-3 | Name | 入院基本料の内容 | 有床診療所入院基本料１（１４日以内） |     |
| 5-10 | Additional\_Hospital\_Charge | 算定対象の入院料加算（システムで定められているものから選択した加算）  <br>（繰り返し２０） |     |     |
| 5-10-1 | Label | 内容の名称 |     |     |
| 5-10-2 | Data | 入院加算コード |     |     |
| 5-10-3 | Name | 入院加算の内容 |     |     |
| 5-11 | User\_Additional\_Hospital\_Charge | 算定対象の入院料加算（ユーザーが追加設定した加算）  <br>（繰り返し１０） |     |     |
| 5-11-1 | Label | 内容の名称 |     |     |
| 5-11-2 | Data | 入院加算コード |     |     |
| 5-11-3 | Name | 入院加算の内容 |     |     |
| 5-12 | Over180days\_Hospital\_Stay\_Charges | 選定入院料 |     |     |
| 5-12-1 | Label | 内容の名称 | 選定入院料 |     |
| 5-12-2 | Calculation\_Type | 負担計算 |     |     |
| 5-12-2-1 | Label | 内容の名称 | 負担計算 |     |
| 5-12-2-2 | Data | 負担計算コード | 1   |     |
| 5-12-2-3 | Name | 負担計算の内容 | 定率設定 |     |
| 5-12-3 | Consumption\_Tax | 消費税 |     | 変更  <br>(2013-11-26) |
| 5-12-3-1 | Label | 内容の名称 | 消費税 |     |
| 5-12-3-2 | Data | 消費税コード | 0   |     |
| 5-12-3-3 | Name | 消費税の有無 | なし  |     |
| 5-12-4 | Value\_Per\_Day | 定率設定 / 定額設定 / 一般点数単価 / 一般１日金額 |     |     |
| 5-12-4-1 | Label | 内容の名称 | 一般点数単価 |     |
| 5-12-4-2 | Data | 一般点数単価 / 一般１日金額 | 10  |     |
| 5-12-4-3 | Name | 単位（点 / 円） | 点   |     |
| 5-12-5 | Value\_Per\_Day\_Late\_Elderly | 定率設定 / 定額設定 / 後期高齢者点数単価 / 後期高齢者１日金額 |     |     |
| 5-12-5-1 | Label | 内容の名称 | 後期高齢者点数単価 |     |
| 5-12-5-2 | Data | 後期高齢者点数単価 / 後期高齢者１日金額 | 10  |     |
| 5-12-5-3 | Name | 単位（点 / 円） | 点   |     |
| 5-13 | Room\_Number | 病室番号（繰り返し２００） |     |     |
| 5-13-1 | Label | 内容の名称 | 病室番号 |     |
| 5-13-2 | Data | 病棟に属する病室番号 | 101 |     |

  

レスポンス一覧(病室情報)  

----------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-09-12 |     |
| 2   | Information\_Time | 実施時間 | 13:13:16 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Room\_Configuration | 病室情報（繰り返し２００） |     |     |
| 5-1 | Start\_Date | 設定の有効期間開始日 | 2013-03-01 |     |
| 5-2 | End\_Date | 設定の有効期間終了日 | 9999-12-31 |     |
| 5-3 | Ward\_Number | 病棟番号情報 |     |     |
| 5-3-1 | Label | 内容の名称 | 病棟番号 |     |
| 5-3-2 | Data | 病棟番号 | 01  |     |
| 5-4 | Ward\_Name | 病棟名称情報 |     |     |
| 5-4-1 | Label | 内容の名称 | 病棟名称 |     |
| 5-4-2 | Data | 病棟名称 | 北病棟 |     |
| 5-5 | Room\_Number | 病室番号情報 |     |     |
| 5-5-1 | Label | 内容の名称 | 病室番号 |     |
| 5-5-2 | Data | 病室番号 | 101 |     |
| 5-6 | Room\_Type | 病室種別情報 |     |     |
| 5-6-1 | Label | 内容の名称 | 病室種別 |     |
| 5-6-2 | Data | 病室種別コード  <br>（01、02、03、04、05、06、07、08、09、10、11、12、13） | 01  |     |
| 5-6-3 | Name | 病室種別名称  <br>（一般病室、  <br>ICU、  <br>CCU、  <br>NICU、  <br>リカバリ室、  <br>感染症室、  <br>ダミー室、  <br>重症者加算部屋１、  <br>重症者加算部屋２、  <br>MFICU、  <br>GCU、  <br>無菌室、  <br>精神科隔離病室） | 一般病室 |     |
| 5-7 | Bed\_Numbers | 収容人数情報 |     |     |
| 5-7-1 | Label | 内容の名称 | 収容人数 |     |
| 5-7-2 | Data | 収容人数 | 4   |     |
| 5-7-3 | Name | 単位（人） | 人   |     |
| 5-8 | Room\_Charge | 室料差額情報 |     | 変更  <br>(2013-11-26) |
| 5-8-1 | Label | 内容の名称 |     |     |
| 5-8-2 | Data | 室料差額 |     |     |
| 5-8-3 | Name | 単位（円） |     |     |
| 5-9 | Sex | 性別特定情報 |     |     |
| 5-9-1 | Label | 内容の名称 |     |     |
| 5-9-2 | Data | 性別特定コード  <br>（1、2、3） |     |     |
| 5-9-3 | Name | 性別特定名称  <br>（男部屋、女部屋、男女混合） |     |     |
| 5-10 | Extension\_Number | 内線番号情報 |     |     |
| 5-10-1 | Label | 内容の名称 |     |     |
| 5-10-2 | Data | 内線番号 |     |     |
| 5-10-3 | Name | 単位（番） |     |     |
| 5-11 | Department\_Code | 診療科情報 |     |     |
| 5-11-1 | Label | 内容の名称 |     |     |
| 5-11-2 | Data | 診療科コード |     |     |
| 5-11-3 | Name | 診療科名称 |     |     |
| 5-12 | Specific\_Hospital\_Charge | 特定入院料情報 |     |     |
| 5-12-1 | Label | 内容の名称 |     |     |
| 5-12-2 | Data | 特定入院料コード |     |     |
| 5-12-3 | Name | 特定入院料名称 |     |     |
| 5-13 | Hospital\_Charge | 入院基本料情報（療養病棟、有床診療所療養病床のみ） |     |     |
| 5-13-1 | Label | 内容の名称 |     |     |
| 5-13-2 | Data | 入院基本料コード |     |     |
| 5-13-3 | Name | 入院基本料名称 |     |     |
| 5-14 | Additional\_Hospital\_Charge | 算定対象の入院料加算（繰り返し１２） |     |     |
| 5-14-1 | Label | 内容の名称 |     |     |
| 5-14-2 | Data | 入院加算コード |     |     |
| 5-14-3 | Name | 入院加算名称 |     |     |

  

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

[sample\_in\_room\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_in_room_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 病棟・病室情報返却  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/visitptlstv2")  
\# Request\_Number :1 病棟情報  
\# Request\_Number :2 病室情報  
#  
\# 1.基準日    Base\_Date    (IMPLIED)  
\# 2.病棟番号  Ward\_Number  (IMPLIED)  
\# 3.病室番号  Room\_Number  (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Request\_Number type\="string"\>1</Request\_Number>                <Base\_Date type\="string"\>2013-09-09</Base\_Date>                <Ward\_Number type\="string"\></Ward\_Number>                <Room\_Number type\="string"\></Room\_Number>        </private\_objects>  
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
| 00  | 処理終了 |
| 01  | 基準日の設定に誤りがあります |
| 02  | 入院基本情報が取得できません |
| 03  | 病棟情報が取得できません |
| 51  | 病室情報が取得できません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 91  | リクエスト番号の指定に誤りがあります |
| 92  | 基準日は平成２０年（２００８年）４月１日以降を指定してください |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザIDが未登録です |
| それ以外 | 返却情報の編集でエラーが発生しました |

  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 病棟・病室情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/wardinfo.html#wrapper)

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
