[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#content)

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
 > 外泊等登録

外泊等登録  

========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#errmsg)
      
    

更新履歴
----

 2018-03-26   「リクエスト一覧」の項目を修正。  
 　　　　　　　「レスポンス一覧」の項目を修正。  

 2017-12-20   「レスポンス一覧」を入院患者食事等情報（2017-12-20時点）と同じレイアウトとなるように修正。

 2017-11-27   「概要」に入院会計が作成されていない診療日のリクエストが送信された場合の説明を追加。

 2017-03-14   「エラーメッセージ一覧」を追加。

 2016-04-18   「リクエスト一覧」の項目を修正。  
 　　　　　　　「レスポンス一覧」の項目を修正。

 2016-01-26   「リクエスト一覧」に項目を追加、修正。  
　　　　　　　　終了日を追加。  
　　　　　　　　外泊等区分に以下の区分を追加。  
　　　　　　　　　02:治療の為の外泊  
　　　　　　　　　03:選定入院中の外泊  
　　　　　　　　　04:他医療機関受診７０％減算  
　　　　　　　　　05:他医療機関受診３０％減算  
　　　　　　　　　06:他医療機関受診５５％減算  
　　　　　　　　　07:他医療機関受診１５％減算  
　　　　　　　　　08:特定時間退院減算  
　　　　　　　　　09:特定曜日入退院減算  
　　　　　　　　　13:特定曜日入退院減算＋他医療機関受診３０％減  
　　　　　　　　　99:取消

概要
--

 POSTメソッドにより入院患者の外泊等の登録を行います。

 日レセ Ver.4.7.0\[第46回パッチ適用\] 以降  

 リクエストおよびレスポンスデータはxml2形式となります。

 入院会計が作成されていない診療日のリクエストが送信された場合、入院会計を作成後登録を行います。

 　※　リクエストの診療日がシステム日付の属する診療年月からその３ヶ月後の診療年月の間に含まれる場合に限ります。  
  
 　　　例）　入院日　　　　　　：平成２９年８月２０日  
 　　　　　　作成済み入院会計　：平成２９年８月〜平成２９年１０月  
 　　　　　　システム日付　　　：平成２９年１１月１日  
  
 　　　　　　登録可能期間　平成２９年８月２０日〜平成３０年２月２８日  
 　　　　　　　　　　　　　（１１月から２月はリクエスト時に診療日の属する診療年月の入院会計を作成）  
  
 　※　外泊、食事が未設定の入院会計を作成します。  
 　※　前月以前の入院会計が未作成の場合、入院会計作成APIより入院会計の作成を行ってください。  
 　※　入院会計の作成状況は入院会計未作成チェックAPIより確認が可能です。  

テスト方法
-----

1.  参考提供されている sample\_hsacctmod\_v2\_gaihaku.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsacctmod\_v2\_gaihaku.rb 内の患者番号等を指定します。
3.  ruby sample\_hsacctmod\_v2\_gaihaku.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca31/hsacctmodv2  
  
Request\_Number:  
    2:外泊等登録  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>        <private\_objects type\="record"\>                <Request\_Number type\="string"\>2</Request\_Number>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>                <Perform\_Date type\="string"\>2014-06-03</Perform\_Date>                <Patient\_Status type\="string"\>01</Patient\_Status>        </private\_objects>  
</data>  

###  処理概要

 外泊等登録リクエストにより指定患者の外泊等登録処理を行います。

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分  <br>　0：残さない  <br>　1：残す | 1   | 未設定時初期値\[0\]を設定  <br>（日レセにリクエストの情報を保持するか否か指定） |
| 2   | Request\_Number | リクエスト番号  <br>　2：外泊等登録 | 2   | 必須  |
| 3   | Patient\_ID | 患者番号 | 12  | 必須  |
| 4   | Admission\_Date | 入院日 | 2014-06-03 | 必須  |
| 5   | Perform\_Date | 診療日 | 2014-06-03 | 未設定時はシステム日付の属する年月を設定 |
| 6   | End\_Date | 終了日 |     | 設定がある場合、外泊等区分を診療日から終了日までの間設定する  <br>  <br>追加（2016-01-26） |
| 7   | Patient\_Status | 外泊等区分  <br>  <br>診療日が平成30年4月1日以降の場合  <br>　00:入院中  <br>　01:外泊  <br>　02:治療の為の外泊  <br>　03:選定入院中の外泊  <br>　04:他医療機関受診４０％減算  <br>　05:他医療機関受診１０％減算  <br>　06:他医療機関受診２０％減算  <br>　08:特定時間退院減算  <br>　09:特定曜日入退院減算  <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算  <br>　14:他医療機関受診５％減算  <br>　15:他医療機関受診３５％減算  <br>　16:他医療機関受診１５％減算  <br>　17:特定曜日入退院減算＋他医療機関受診５％減算  <br>　99:取消  <br>  <br>診療日が平成30年3月31日以前の場合  <br>　00:入院中  <br>　01:外泊  <br>　02:治療の為の外泊  <br>　03:選定入院中の外泊  <br>　04:他医療機関受診４０％減算  <br>　05:他医療機関受診１０％減算  <br>　06:他医療機関受診２０％減算  <br>　08:特定時間退院減算  <br>　09:特定曜日入退院減算  <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算  <br>　99:取消 | 01  | 必須  <br>  <br>帰院、外泊、治療の為の外泊、選定入院中の外泊は診療日以降（終了日の指定があれば終了日まで）の日にちを設定内容で更新  <br>  <br>変更(2018-03-26) |

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-06-10 |     |
| 2   | Information\_Time | 実施時間 | 18:04:10 |     |
| 3   | Api\_Results | 結果情報  <br>（繰り返し １０） |     |     |
| 3-1 | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ |     |     |
| 4   | Request\_Number | リクエスト番号 |     |     |
| 4-1 | Label | 内容の名称を返却 | リクエスト番号 |     |
| 4-2 | Data | リクエスト番号を返却 | 2   |     |
| 4-3 | Name | リクエスト番号の名称を返却 | 外泊  |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別  <br>（1：男性、2：女性） | 1   |     |
| 6   | Admission\_Discharge\_Date | 診療年月にかかる入退院日情報  <br>（繰り返し　５） |     |     |
| 6-1 | Admission\_Date | 入院日 | 2014-06-03 |     |
| 6-2 | Discharge\_Date | 退院日 | 2014-06-10 |     |
| 7   | Perform\_Month | 診療年月 | 2014-06 |     |
| 8   | Monthly\_Information | カレンダー情報  <br>（繰り返し　３１） |     |     |
| 8-1 | Perform\_Date | 診療日 | 2014-06-03 |     |
| 8-2 | Department\_Code | 診療科 |     |     |
| 8-2-1 | Label | 内容の名称を返却 | 診療科 |     |
| 8-2-2 | Data | 診療科コードを返却 | 10  |     |
| 8-2-3 | Name | 診療科の名称を返却 | 外科  |     |
| 8-3 | Ward\_Number | 病棟番号 |     |     |
| 8-3-1 | Label | 内容の名称を返却 | 病棟番号 |     |
| 8-3-2 | Data | 病棟番号を返却 | 01  |     |
| 8-4 | Ward\_Name | 病棟名 |     |     |
| 8-4-1 | Label | 内容の名称を返却 | 病棟名 |     |
| 8-4-2 | Data | 病棟名を返却 | 北病棟 |     |
| 8-5 | Room\_Number | 病室番号 |     |     |
| 8-5-1 | Label | 内容の名称を返却 | 病室番号 |     |
| 8-5-2 | Data | 病室番号を返却 | 101 |     |
| 8-6 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 8-7 | Patient\_Status | 外泊・他医療機関受診情報等 |     |     |
| 8-7-1 | Label | 内容の名称を返却 | 外泊・他医療機関受診情報等 |     |
| 8-7-2 | Data | コード | 01  |     |
| 8-7-3 | Name | 名称   <br>  <br>（コード:名称）    <br>（Data:Name）   <br>診療年月が平成30年4月以降の場合  <br>　00:入院中    <br>　01:外泊    <br>　02:治療の為の外泊    <br>　03:選定入院中の外泊    <br>　04:他医療機関受診４０％減算    <br>　05:他医療機関受診１０％減算    <br>　06:他医療機関受診２０％減算    <br>　08:特定時間退院減算    <br>　09:特定曜日入退院減算    <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算    <br>　14:他医療機関受診５％減算    <br>　15:他医療機関受診３５％減算    <br>　16:他医療機関受診１５％減算    <br>　17:特定曜日入退院減算＋他医療機関受診５％減算   <br>  <br>診療年月が平成30年3月以前の場合    <br>　00:入院中    <br>　01:外泊    <br>　02:治療の為の外泊    <br>　03:選定入院中の外泊    <br>　04:他医療機関受診４０％減算    <br>　05:他医療機関受診１０％減算    <br>　06:他医療機関受診２０％減算    <br>　08:特定時間退院減算    <br>　09:特定曜日入退院減算    <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算 | 外泊  | 変更(2018-03-26) |
| 8-8 | Morning\_Meal | 朝食  |     |     |
| 8-8-1 | Label | 内容の名称を返却 | 朝食  |     |
| 8-8-2 | Data | コードを返却 | 00  |     |
| 8-8-3 | Name | 内容を返却  <br>　00：食事なし  <br>　01：食事あり  <br>　02：食事あり（特別食）  <br>　03：食事あり（流動食） | 食事なし | 変更(2016-04-18) |
| 8-9 | Lunch\_Meal | 昼食  |     |     |
| 8-9-1 | Label | 内容の名称を返却 | 昼食  |     |
| 8-9-2 | Data | コードを返却 | 00  |     |
| 8-9-3 | Name | 内容を返却  <br>　00：食事なし  <br>　01：食事あり  <br>　02：食事あり（特別食）  <br>　03：食事あり（流動食） | 食事なし | 変更(2016-04-18) |
| 8-10 | Evening\_Meal | 夕食  |     |     |
| 8-10-1 | Label | 内容の名称を返却 | 夕食  |     |
| 8-10-2 | Data | コードを返却 | 00  |     |
| 8-10-3 | Name | 内容を返却  <br>　00：食事なし  <br>　01：食事あり  <br>　02：食事あり（特別食）  <br>　03：食事あり（流動食） | 食事なし | 変更(2016-04-18) |
| 8-11 | Room\_Charge | 室料差額 |     |     |
| 8-11-1 | Label | 内容の名称を返却 | 室料差額 |     |
| 8-11-2 | Data | 室料差額を返却 | 1000 |     |
| 8-11-3 | Name | 単位を返却  <br>（円） | 円   |     |
| 9   | Insurance\_Information | 保険組合せ詳細  <br>（繰り返し　１０） |     |     |
| 9-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 9-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 9-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 9-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 9-5 | HealthInsuredPerson\_Symbol | 記号  | １２３ |     |
| 9-6 | HealthInsuredPerson\_Number | 番号  | ４５６ |     |
| 9-7 | PublicInsurance\_Information | 公費情報（繰り返し　４） |     |     |
| 9-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 9-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 9-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 9-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234567 |     |

  

###  レスポンスサンプル

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-06-10</Information\_Date>    <Information\_Time type\="string"\>18:04:10</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>00</Api\_Result>      </Api\_Results\_child>    </Api\_Results>    <Request\_Number type\="record"\>      <Label type\="string"\>リクエスト番号</Label>      <Data type\="string"\>2</Data>      <Name type\="string"\>外泊</Name>    </Request\_Number>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Admission\_Discharge\_Date type\="array"\>      <Admission\_Discharge\_Date\_child type\="record"\>        <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>        <Discharge\_Date type\="string"\>2014-06-10</Discharge\_Date>      </Admission\_Discharge\_Date\_child>    </Admission\_Discharge\_Date>    <Perform\_Month type\="string"\>2014-06</Perform\_Month>    <Monthly\_Information type\="array"\>      <Monthly\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2014-06-03</Perform\_Date>        <Department\_Code type\="record"\>          <Label type\="string"\>診療科</Label>          <Data type\="string"\>10</Data>          <Name type\="string"\>外科</Name>        </Department\_Code>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Patient\_Status type\="record"\>          <Label type\="string"\>外泊・他医療機関受診情報等</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>外泊</Name>        </Patient\_Status>        <Morning\_Meal type\="record"\>          <Label type\="string"\>朝食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Morning\_Meal>        <Lunch\_Meal type\="record"\>          <Label type\="string"\>昼食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Lunch\_Meal>        <Evening\_Meal type\="record"\>          <Label type\="string"\>夕食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Evening\_Meal>        <Room\_Charge type\="record"\>          <Label type\="string"\>室料差額</Label>          <Data type\="string"\>   1000</Data>          <Name type\="string"\>円</Name>        </Room\_Charge>      </Monthly\_Information\_child>      <Monthly\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2014-06-04</Perform\_Date>        <Department\_Code type\="record"\>          <Label type\="string"\>診療科</Label>          <Data type\="string"\>10</Data>          <Name type\="string"\>外科</Name>        </Department\_Code>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <Patient\_Status type\="record"\>          <Label type\="string"\>外泊・他医療機関受診情報等</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>外泊</Name>        </Patient\_Status>        <Morning\_Meal type\="record"\>          <Label type\="string"\>朝食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Morning\_Meal>        <Lunch\_Meal type\="record"\>          <Label type\="string"\>昼食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Lunch\_Meal>        <Evening\_Meal type\="record"\>          <Label type\="string"\>夕食</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>食事なし</Name>        </Evening\_Meal>        <Room\_Charge type\="record"\>          <Label type\="string"\>室料差額</Label>          <Data type\="string"\>   1000</Data>          <Name type\="string"\>円</Name>        </Room\_Charge>      </Monthly\_Information\_child>      ・  
      ・  
      ・    </Monthly\_Information>    <Insurance\_Information type\="array"\>      <Insurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>１２３４５６</HealthInsuredPerson\_Number>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </Insurance\_Information\_child>    </Insurance\_Information>  </private\_objects>  
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

[sample\_hsacctmod\_v2\_gaihaku.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsacctmod_v2_gaihaku.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 外泊  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca31/hsacctmodv2")BODY \= <<EOF

<data>        <private\_objects type\="record"\>                <Request\_Number type\="string"\>2</Request\_Number>                <Patient\_ID type\="string"\>1</Patient\_ID>                <Admission\_Date type\="string"\>2014-05-01</Admission\_Date>                <Perform\_Date type\="string"\>2014-05-03</Perform\_Date>                <Patient\_Status type\="string"\>01</Patient\_Status>        </private\_objects>  
</data>

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
} 

 エラーメッセージ一覧
-----------

 入院登録([https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
)を参照。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 外泊等登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospgaihaku.html#wrapper)

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
