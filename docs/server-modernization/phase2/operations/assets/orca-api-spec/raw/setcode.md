[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#content)

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
 > セット登録

セット登録  

========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#rubysample)
    

更新履歴
----

概要
--

POSTメソッドにより診療情報のセット登録等を行います。

日レセ Ver.4.8.0\[第25回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式となります。

テスト方法
-----

1.  参考提供されている sample\_medicalset\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_medicalset\_v2.rb 内のセットコード等を指定します。
3.  ruby sample\_medicalset\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca21/medicalsetv2  
  
Request\_Number:  
    01: 新規登録  
    02: 削除  
    03: 最終終了日更新  
    04: セット内容取得  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  <medicalsetreq type\="record"\>    <Request\_Number type\="string"\>01</Request\_Number>    <Base\_Date type\="string"/>    <Set\_Code type\="string"\>PAI004</Set\_Code>    <Set\_Code\_Name type\="string"\>ＡＰＩセット３</Set\_Code\_Name>    <Start\_Date type\="string"\>2013-04-01</Start\_Date>    <Ende\_Date type\="string"\>9999-12-31</Ende\_Date>    <InOut type\="string"/>    <!-- ========================================================== -->    <!--                    診療データ                              -->    <!-- ========================================================== -->    <Medical\_Information type\="record"\>      <Medical\_Info type\="array"\>        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>210</Medical\_Class>          <Medical\_Class\_Name type\="string"\>内服</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>3</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>612320391</Medication\_Code>              <Medication\_Name type\="string"\>イサロン顆粒２５％</Medication\_Name>              <Medication\_Number type\="string"\>0.5</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611170791</Medication\_Code>              <Medication\_Name type\="string"\>イミドール糖衣錠</Medication\_Name>              <Medication\_Number type\="string"\>2</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611120080</Medication\_Code>              <Medication\_Name type\="string"\>ユーロジン１ｍｇ錠</Medication\_Name>              <Medication\_Number type\="string"\>1.6</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>001000106</Medication\_Code>              <Medication\_Name type\="string"\>１日１回朝食後に</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160023410</Medication\_Code>              <Medication\_Name type\="string"\>ＨＤＬ−コレステロール</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019310</Medication\_Code>              <Medication\_Name type\="string"\>ＵＡ</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160020910</Medication\_Code>              <Medication\_Name type\="string"\>ＴＧ</Medication\_Name>              <Medication\_Number type\="string"\> </Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019210</Medication\_Code>              <Medication\_Name type\="string"\>クレアチニン</Medication\_Name>              <Medication\_Number type\="string"\> </Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>960</Medical\_Class>          <Medical\_Class\_Name type\="string"\>保険外（消費税あり）</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>096000002</Medication\_Code>              <Medication\_Name type\="string"\>自費その２</Medication\_Name>              <Medication\_Number type\="string"/>              <Medication\_Money type\="string"\>12945</Medication\_Money>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>095930000</Medication\_Code>              <Medication\_Name type\="string"\>自賠責器材Ａ</Medication\_Name>              <Medication\_Number type\="string"/>              <Medication\_Money type\="string"\>10</Medication\_Money>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->      </Medical\_Info>    </Medical\_Information>  </medicalsetreq>  
</data>  

### 処理概要

 診療情報のセットの登録、削除、有効期間の変更、登録内容の参照を行います。

### 処理詳細

1.  リクエスト番号の妥当性チェック  
    

#### 新規登録処理(リクエスト番号＝01)

　リクエスト内容で入力セット・入力コードを新規に追加登録します。  
　約束セット（SXXXXX）の登録はできません。

#### 削除処理(リクエスト番号＝02)

　セットコード・開始日・終了日の一致する入力セットを削除します。  
　開始日＝00000000、終了日＝99999999の時は、すべての履歴を削除します。  

#### 最終終了日更新(リクエスト番号＝03)

　セットコード・開始日の一致する入力セットが最終履歴の時、終了日を変更します。  
　最終履歴以外は変更できません。  

#### セット内容取得(リクエスト番号＝04)

　セットコード・開始日・終了日の期間内の入力セット内容を返却します。  
　開始日＝00000000、終了日＝99999999の時は、システム日付（基準日）で有効な履歴を返却します。  
　システム日付で有効な履歴がない時は、最終履歴を返却します。

 ※基準日（システム日付）時点で点数マスタの検索を行います。  
 　開始日＞基準日の時は、開始日＝基準日  
 　終了日＜基準日の時は、終了日＝基準日  
 　とします。  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号  <br>　01：新規登録  <br>　02：削除  <br>　03：最終終了日更新  <br>　04：セット内容取得 | 01  | 必須  |
| 2   | Base\_Date | 基準日 |     | 未設定時はシステム日付を設定 |
| 3   | Set\_Code | セットコード | PAI004 | 必須　  <br>※１ |
| 4   | Set\_Code\_Name | セット名称 | APIセット３ | 必須(新規登録) |
| 5   | Start\_Date | 開始日付 | 2013-04-01 | 未設定時は00000000を設定 |
| 6   | Ende\_Date | 終了日付 | 9999-12-31 | 未設定時は99999999を設定 |
| 7   | InOut | 入外区分  <br>（I：入院分） | I   |     |
| 8   | Medical\_Information | 診療行為情報 |     | ※２  |
| 8-1 | Medical\_Info | 診療行為剤内容（繰り返し　４０） |     |     |
| 8-1-1 | Medical\_Class | 診療種別区分 | 960 | 必須  |
| 8-1-2 | Medical\_Class\_Name | 診療種別区分名称 | 保険外（消費税あり） |     |
| 8-1-3 | Medical\_Class\_Number | 回数  | 1   | 未設定時は1、0はエラー |
| 8-1-4 | Medication\_Info | 診療剤明細（繰り返し　４０） |     |     |
| 8-1-4-1 | Medication\_Code | 診療行為コード | 096000002 | 約束セット(SXXXXX)は使用できない(エラーになります) |
| 8-1-4-2 | Medication\_Name | 名称  | 自費その２ | ※３  |
| 8-1-4-3 | Medication\_Number | 数量  |     | ※４  |
| 8-1-4-4 | Medication\_Money | 自費金額 | 12945 | 金額ゼロで登録してある自費コードの金額(消費税込) |
| 8-1-4-5 | Medication\_Input\_Info | コメント埋め込み数値（繰り返し　５） |     | 84XXXXXXX,0084XXXXX,001XXXXXX(カラム位置あり)のみ |
| 8-1-4-5-1 | Medication\_Input\_Code | コメント埋め込み数値 |     | １番目から順に数値を編集 |
| 8-1-4-6 | Medication\_Continue | 継続コメント指示区分  <br>（1：継続のコメントコードである） | 1   |     |
| 8-1-4-7 | Medication\_Internal\_Kinds | 内服種類数指示区分  <br>（1：内服種類数を１とする） | 1   |     |

 ※１：１桁目はP、  
 　　　２，３桁目は英数値、  
 　　　４，５，６桁目は数値  
 　　　新規以外は１桁目がS（約束セット）も可能となります。

 ※２：リクエスト番号=01（新規）のみ設定します。

 ※３：名称を入力するコメントコード（81XXXXXXX,83XXXXXXX,0083XXXXX,0085〜）は全内容（点数マスタの名称＋入力内容）

 ※４：システム管理の数量ゼロ入力が「１　入力エラーとする」の時、薬剤・器材の数量、診療行為のきざみ値数量のゼロを可能とします。  
 　　　それ以外の数量ゼロはエラーとなります。  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-12-08 |     |
| 2   | Information\_Time | 実施時間 | 15:15:43 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | E21 | ※１  |
| 4   | Api\_Result\_Message | エラーメッセージ | セット内容に誤りがあります。 |     |
| 5   | Reskey |     | Medical Info |     |
| 6   | Base\_Date | 基準日 | 2015-12-08 |     |
| 7   | Set\_Code | セットコード | PAI004 | 送信内容 |
| 8   | Set\_Code\_Name | セット名称 | APIセット３ |     |
| 9   | Start\_Date | 開始日付 | 2013-04-01 |     |
| 10  | Ende\_Date | 終了日付 | 9999-12-31 |     |
| 11  | Medical\_Information | 診療行為登録内容 |     | ※２  |
| 11-1 | Medical\_Info | 診療行為剤内容（繰り返し　４０） |     |     |
| 11-1-1 | Medical\_Class | 診療種別区分 | 960 |     |
| 11-1-2 | Medical\_Class\_Name | 診療種別区分名称 | 保険外（消費税あり） |     |
| 11-1-3 | Medical\_Class\_Number | 回数  | 1   |     |
| 11-1-4 | Medication\_Info | 診療剤明細（繰り返し　４０） |     |     |
| 11-1-4-1 | Medication\_Code | 診療行為コード | 096000002 |     |
| 11-1-4-2 | Medication\_Name | 名称  |     | ※３  |
| 11-1-4-3 | Medication\_Number | 数量  | 1   |     |
| 11-1-4-4 | Medication\_Money | 自費金額 | 12945 |     |
| 11-1-4-5 | Medication\_Input\_Info | コメント埋め込み数値（繰り返し　５） |     |     |
| 11-1-4-5-1 | Medication\_Input\_Code | コメント埋め込み数値 |     |     |
| 11-1-4-6 | Medication\_Continue | 継続コメント指示区分 |     |     |
| 11-1-4-7 | Medication\_Internal\_Kinds | 内服種類数指示区分 |     |     |
| 12  | Medical\_Message\_Information | メッセージ内容 |     |     |
| 12-1 | Medical\_Message\_Info | エラーメッセージ内容（繰り返し　５０） |     |     |
| 12-1-1 | Medical\_Result | エラーコード | 0001 | ※５  |
| 12-1-2 | Medical\_Result\_Message1 | エラーメッセージ１ | 該当する点数マスターが存在しません | ※５  |
| 12-1-3 | Medical\_Result\_Message2 | エラーメッセージ２ |     | ※５  |
| 12-1-4 | Medical\_Position | エラー剤位置 | 6   | 診療行為内容（Medical\_Info）の位置 |
| 12-1-5 | Medical\_Item\_Position | エラー行位置 | 1   | 診療剤明細（Medication\_Info）の位置 |
| 12-1-6 | Medical\_Result\_Code | エラー診療コード | 096000002 |     |
| 12-2 | Medical\_Warning\_Info | ワーニングメッセージ内容（繰り返し　５０） |     |     |
| 12-2-1 | Medical\_Warning | ワーニングコード |     | ※５  |
| 12-2-2 | Medical\_Warning\_Message1 | ワーニングメッセージ１ |     | ※５  |
| 12-2-3 | Medical\_Warning\_Message2 | ワーニングメッセージ２ |     | ※５  |
| 12-2-4 | Medical\_Warning\_Position | ワーニング剤位置 |     | 診療行為内容（Medical\_Info）の位置 |
| 12-2-5 | Medical\_Warning\_Item\_Position | ワーニング行位置 |     | 診療剤明細（Medication\_Info）の位置 |
| 12-2-6 | Medical\_Warning\_Code | ワーニング診療コード |     |     |

 ※１：正常終了：【000】、ワーニングあり：【W00】、エラーあり：【EXX】

 ※２：リクエスト番号＝04（セット内容取得）でセットコードが約束セット（SXXXXX）の時、診療種別区分を追加記載します。

 ※３：名称を入力するコメントコードで内容を送信された場合は、送信内容。  
 　　　コメント埋め込み数値があれば反映した名称を編集  
 　　　それ以外は、点数マスタの名称（用法コード（001XXXXX）は【】をつける）

 ※４：画面展開時の剤単位で返却します。  
 　　　剤に検査が複数存在し展開で剤分離となった場合、展開後の剤毎に返却するが、セット登録では診療種別区分の登録はない。

 ※５：診療行為内容のエラー・ワーニングメッセージを編集します。  
 　　　エラー・ワーニングコードはセット登録画面と同様とします。  
 　　　但し、【APXX】は、API独自のコード・メッセージになります。  
 　　　エラーメッセージ１、エラーメッセージ２、ワーニングメッセージ１、ワーニングメッセージ２は画面の（KERR2）の上下のメッセージとなります。  
 　　　エラーメッセージ、ワーニングメッセージが１つの時は、１に編集します。

###  レスポンスサンプル

<xmlio2>  <medicalsetres type\="record"\>    <Information\_Date type\="string"\>2015-12-08</Information\_Date>    <Information\_Time type\="string"\>15:15:43</Information\_Time>    <Api\_Result type\="string"\>E21</Api\_Result>    <Api\_Result\_Message type\="string"\>セット内容に誤りがあります。</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Base\_Date type\="string"\>2015-12-08</Base\_Date>    <Set\_Code type\="string"\>PAI004</Set\_Code>    <Set\_Code\_Name type\="string"\>ＡＰＩセット３</Set\_Code\_Name>    <Start\_Date type\="string"\>2013-04-01</Start\_Date>    <Ende\_Date type\="string"\>9999-12-31</Ende\_Date>    <Medical\_Information type\="record"\>      <Medical\_Info type\="array"\>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>210</Medical\_Class>          <Medical\_Class\_Name type\="string"\>内服薬剤</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>3</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>612320391</Medication\_Code>              <Medication\_Name type\="string"\>イサロン顆粒２５％</Medication\_Name>              <Medication\_Number type\="string"\>0.5</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611170791</Medication\_Code>              <Medication\_Name type\="string"\>イミドール糖衣錠（２５）　２５ｍｇ</Medication\_Name>              <Medication\_Number type\="string"\>2</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611120080</Medication\_Code>              <Medication\_Name type\="string"\>ユーロジン１ｍｇ錠</Medication\_Name>              <Medication\_Number type\="string"\>1.6</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>001000106</Medication\_Code>              <Medication\_Name type\="string"\>【１日１回朝食後に】</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160023410</Medication\_Code>              <Medication\_Name type\="string"\>ＨＤＬ−コレステロール</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019310</Medication\_Code>              <Medication\_Name type\="string"\>ＵＡ</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160020910</Medication\_Code>              <Medication\_Name type\="string"\>ＴＧ</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019210</Medication\_Code>              <Medication\_Name type\="string"\>クレアチニン</Medication\_Name>              <Medication\_Number type\="string"\>1</Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>960</Medical\_Class>          <Medical\_Class\_Name type\="string"\>保険外（消費税あり）</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>096000002</Medication\_Code>              <Medication\_Number type\="string"\>1</Medication\_Number>              <Medication\_Money type\="string"\>12945</Medication\_Money>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>950</Medical\_Class>          <Medical\_Class\_Name type\="string"\>保険外（消費税なし）</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>095930000</Medication\_Code>              <Medication\_Number type\="string"\>1</Medication\_Number>              <Medication\_Money type\="string"\>10</Medication\_Money>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>      </Medical\_Info>    </Medical\_Information>    <Medical\_Message\_Information type\="record"\>      <Medical\_Message\_Info type\="array"\>        <Medical\_Message\_Info\_child type\="record"\>          <Medical\_Result type\="string"\>0001</Medical\_Result>          <Medical\_Result\_Message1 type\="string"\>該当する点数マスターが存在しません</Medical\_Result\_Message1>          <Medical\_Position type\="string"\>6</Medical\_Position>          <Medical\_Item\_Position type\="string"\>1</Medical\_Item\_Position>          <Medical\_Result\_Code type\="string"\>096000002</Medical\_Result\_Code>        </Medical\_Message\_Info\_child>        <Medical\_Message\_Info\_child type\="record"\>          <Medical\_Result type\="string"\>0001</Medical\_Result>          <Medical\_Result\_Message1 type\="string"\>該当する点数マスターが存在しません</Medical\_Result\_Message1>          <Medical\_Position type\="string"\>7</Medical\_Position>          <Medical\_Item\_Position type\="string"\>1</Medical\_Item\_Position>          <Medical\_Result\_Code type\="string"\>095930000</Medical\_Result\_Code>        </Medical\_Message\_Info\_child>      </Medical\_Message\_Info>    </Medical\_Message\_Information>  </medicalsetres>  
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

[sample\_medicalset\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medicalset_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ セット登録  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca21/medicalsetv2")  
\# Request\_Number:  
\#   01: 新規登録  
\#   02: 削除  
\#   03: 最終終了日変更  
\#   04: セット内容取得  
#BODY \= <<EOF  

<data>  <medicalsetreq type\="record"\>    <Request\_Number type\="string"\>01</Request\_Number>    <Base\_Date type\="string"/>    <Set\_Code type\="string"\>PAI004</Set\_Code>    <Set\_Code\_Name type\="string"\>ＡＰＩセット３</Set\_Code\_Name>    <Start\_Date type\="string"\>2013-04-01</Start\_Date>    <Ende\_Date type\="string"\>9999-12-31</Ende\_Date>    <InOut type\="string"/>    <!-- ========================================================== -->    <!--                    診療データ                              -->    <!-- ========================================================== -->    <Medical\_Information type\="record"\>      <Medical\_Info type\="array"\>        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>210</Medical\_Class>          <Medical\_Class\_Name type\="string"\>内服</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>3</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>612320391</Medication\_Code>              <Medication\_Name type\="string"\>イサロン顆粒２５％</Medication\_Name>              <Medication\_Number type\="string"\>0.5</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611170791</Medication\_Code>              <Medication\_Name type\="string"\>イミドール糖衣錠</Medication\_Name>              <Medication\_Number type\="string"\>2</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>611120080</Medication\_Code>              <Medication\_Name type\="string"\>ユーロジン１ｍｇ錠</Medication\_Name>              <Medication\_Number type\="string"\>1.6</Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>001000106</Medication\_Code>              <Medication\_Name type\="string"\>１日１回朝食後に</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>600</Medical\_Class>          <Medical\_Class\_Name type\="string"\>検査</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160023410</Medication\_Code>              <Medication\_Name type\="string"\>ＨＤＬ−コレステロール</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019310</Medication\_Code>              <Medication\_Name type\="string"\>ＵＡ</Medication\_Name>              <Medication\_Number type\="string"/>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160020910</Medication\_Code>              <Medication\_Name type\="string"\>ＴＧ</Medication\_Name>              <Medication\_Number type\="string"\> </Medication\_Number>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>160019210</Medication\_Code>              <Medication\_Name type\="string"\>クレアチニン</Medication\_Name>              <Medication\_Number type\="string"\> </Medication\_Number>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->        <!-- ========================================================== -->        <Medical\_Info\_child type\="record"\>          <Medical\_Class type\="string"\>960</Medical\_Class>          <Medical\_Class\_Name type\="string"\>保険外（消費税あり）</Medical\_Class\_Name>          <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>          <Medication\_Info type\="array"\>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>096000002</Medication\_Code>              <Medication\_Name type\="string"\>自費その２</Medication\_Name>              <Medication\_Number type\="string"/>              <Medication\_Money type\="string"\>12945</Medication\_Money>            </Medication\_Info\_child>            <Medication\_Info\_child type\="record"\>              <Medication\_Code type\="string"\>095930000</Medication\_Code>              <Medication\_Name type\="string"\>自賠責器材Ａ</Medication\_Name>              <Medication\_Number type\="string"/>              <Medication\_Money type\="string"\>10</Medication\_Money>            </Medication\_Info\_child>          </Medication\_Info>        </Medical\_Info\_child>        <!-- ========================================================== -->      </Medical\_Info>    </Medical\_Information>  </medicalsetreq>  
</data>  

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > セット登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/setcode.html#wrapper)

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
