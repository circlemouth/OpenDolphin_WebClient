[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#content)

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
 > 入院患者食事等情報

入院患者食事等情報
=========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#errmsg)
      
    

更新履歴
----

 2018-03-26   「レスポンス一覧」の項目を修正。  

 2018-02-26   （Ver5.0.0以降のみ）「レスポンス一覧」に項目を追加。  

 2016-04-18   「レスポンス一覧」の項目を修正。  

概要
--

POSTメソッドによる入院患者の食事等の情報取得を行います。

日レセ Ver.4.7.0\[第19回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsmeal\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsmeal\_v2.rb 内の患者番号等の必要な情報を設定します。
3.  ruby sample\_hsmeal\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsmealv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Perform\_Month type\="string"\></Perform\_Month>        </private\_objects>  
</data>  

### 処理概要

患者番号や診療年月を元に日レセに登録されている該当患者の該当月の食事、外泊、室料差額等のひと月分の情報を返却します。

  

### 処理詳細

1.  患者番号の存在チェック  
    
2.  診療年月日の妥当性チェック（未設定の場合は、システム日付を設定）  
    

 日々の保険組合せ情報は、組合せ番号を設定しています。  
 対応する保険組合せ情報は、最後に出現させています。

レスポンスサンプル
---------

<?xml version\="1.0" encoding\="UTF-8"?>  
<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2018-01-31</Information\_Date>    <Information\_Time type\="string"\>09:21:52</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1958-01-10</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Admission\_Discharge\_Date type\="array"\>      <Admission\_Discharge\_Date\_child type\="record"\>        <Admission\_Date type\="string"\>2018-01-10</Admission\_Date>        <Discharge\_Date type\="string"\>2018-01-11</Discharge\_Date>      </Admission\_Discharge\_Date\_child>    </Admission\_Discharge\_Date>    <Perform\_Month type\="string"\>2018-01</Perform\_Month>    <Monthly\_Information type\="array"\>      <Monthly\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2018-01-10</Perform\_Date>        <Department\_Code type\="record"\>          <Label type\="string"\>診療科</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>内科</Name>        </Department\_Code>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <Patient\_Status type\="record"\>          <Label type\="string"\>外泊・他医療機関受診情報等</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>入院中</Name>        </Patient\_Status>        <Morning\_Meal type\="record"\>          <Label type\="string"\>朝食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Morning\_Meal>        <Lunch\_Meal type\="record"\>          <Label type\="string"\>昼食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Lunch\_Meal>        <Evening\_Meal type\="record"\>          <Label type\="string"\>夕食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Evening\_Meal>        <Room\_Charge type\="record"\>          <Label type\="string"\>室料差額</Label>          <Data type\="string"\>      0</Data>          <Name type\="string"\>円</Name>        </Room\_Charge>        <Hospital\_Charge\_Information type\="record"\>          <Label type\="string"\>入院基本料等</Label>          <Hospital\_Charge type\="array"\>            <Hospital\_Charge\_child type\="record"\>              <Data type\="string"\>190077410</Data>              <Name type\="string"\>一般病棟１０対１入院基本料</Name>            </Hospital\_Charge\_child>            <Hospital\_Charge\_child type\="record"\>              <Data type\="string"\>190079470</Data>              <Name type\="string"\>一般病棟入院期間加算（１４日以内）</Name>            </Hospital\_Charge\_child>          </Hospital\_Charge>        </Hospital\_Charge\_Information>        <Additional\_Hospital\_Charge type\="array"\>          <Additional\_Hospital\_Charge\_child type\="record"\>            <Label type\="string"\>入院加算</Label>            <Data type\="string"\>190120510</Data>            <Name type\="string"\>医療安全対策加算１</Name>          </Additional\_Hospital\_Charge\_child>          <Additional\_Hospital\_Charge\_child type\="record"\>            <Label type\="string"\>入院加算</Label>            <Data type\="string"\>190147510</Data>            <Name type\="string"\>患者サポート体制充実加算</Name>          </Additional\_Hospital\_Charge\_child>        </Additional\_Hospital\_Charge>      </Monthly\_Information\_child>      <Monthly\_Information\_child type\="record"\>        <Perform\_Date type\="string"\>2018-01-11</Perform\_Date>        <Department\_Code type\="record"\>          <Label type\="string"\>診療科</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>内科</Name>        </Department\_Code>        <Ward\_Number type\="record"\>          <Label type\="string"\>病棟番号</Label>          <Data type\="string"\>01</Data>        </Ward\_Number>        <Ward\_Name type\="record"\>          <Label type\="string"\>病棟名</Label>          <Data type\="string"\>北病棟</Data>        </Ward\_Name>        <Room\_Number type\="record"\>          <Label type\="string"\>病室番号</Label>          <Data type\="string"\>101</Data>        </Room\_Number>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <Patient\_Status type\="record"\>          <Label type\="string"\>外泊・他医療機関受診情報等</Label>          <Data type\="string"\>00</Data>          <Name type\="string"\>入院中</Name>        </Patient\_Status>        <Morning\_Meal type\="record"\>          <Label type\="string"\>朝食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Morning\_Meal>        <Lunch\_Meal type\="record"\>          <Label type\="string"\>昼食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Lunch\_Meal>        <Evening\_Meal type\="record"\>          <Label type\="string"\>夕食</Label>          <Data type\="string"\>01</Data>          <Name type\="string"\>食事あり</Name>        </Evening\_Meal>        <Room\_Charge type\="record"\>          <Label type\="string"\>室料差額</Label>          <Data type\="string"\>      0</Data>          <Name type\="string"\>円</Name>        </Room\_Charge>        <Hospital\_Charge\_Information type\="record"\>          <Label type\="string"\>入院基本料等</Label>          <Hospital\_Charge type\="array"\>            <Hospital\_Charge\_child type\="record"\>              <Data type\="string"\>190077410</Data>              <Name type\="string"\>一般病棟１０対１入院基本料</Name>            </Hospital\_Charge\_child>            <Hospital\_Charge\_child type\="record"\>              <Data type\="string"\>190079470</Data>              <Name type\="string"\>一般病棟入院期間加算（１４日以内）</Name>            </Hospital\_Charge\_child>          </Hospital\_Charge>        </Hospital\_Charge\_Information>      </Monthly\_Information\_child>    </Monthly\_Information>    <Insurance\_Information type\="array"\>      <Insurance\_Information\_child type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>９９０１０１０１</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>９９０００１</HealthInsuredPerson\_Number>      </Insurance\_Information\_child>    </Insurance\_Information>  </private\_objects>  
</xmlio2>  

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 12  |     |
| 2   | Perform\_Month | 診療年月 | 2003-01 | 未設定はシステム日付（年月のみ） |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-10-09 |     |
| 2   | Information\_Time | 実施時間 | 11:34:22 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 00012 |     |
| 5-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 5-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 5-5 | Sex | 性別  <br>（1:男性、2:女性） | 1   |     |
| 6   | Admission\_Discharge\_Date | 診療年月にかかる入退院日情報（繰り返し ５） |     |     |
| 6-1 | Admission\_Date | 入院日 | 2013-10-08 |     |
| 6-2 | Discharge\_Date | 退院日 | 2013-10-09 |     |
| 7   | Perform\_Month | 診療年月 | 2013-10 |     |
| 8   | Monthly\_Information | カレンダー情報（繰り返し ３１） |     |     |
| 8-1 | Perform\_Date | 診療日 | 2013-10-08 |     |
| 8-2 | Department\_Code | 診療科情報 |     |     |
| 8-2-1 | Label | 内容の名称 | 診療科 |     |
| 8-2-2 | Data | 診療科コード ※１  <br>（01:内科） | 01  |     |
| 8-2-3 | Name | 診療科名称 | 内科  |     |
| 8-3 | Ward\_Number | 病棟番号情報 |     |     |
| 8-3-1 | Label | 内容の名称 | 病棟番号 |     |
| 8-3-2 | Data | 病棟番号 | 01  |     |
| 8-4 | Ward\_Name | 病棟名情報 |     |     |
| 8-4-1 | Label | 内容の名称 | 病棟名 |     |
| 8-4-2 | Data | 病棟名 | 北病棟 |     |
| 8-5 | Room\_Number | 病室番号情報 |     |     |
| 8-5-1 | Label | 内容の名称 | 病室番号 |     |
| 8-5-2 | Data | 病室番号 | 101 |     |
| 8-6 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 8-7 | Patient\_Status | 外泊・他医療機関受診情報等 |     |     |
| 8-7-1 | Label | 内容の名称 | 外泊・他医療機関受診情報等 |     |
| 8-7-2 | Data | コード | 00  |     |
| 8-7-3 | Name | 名称  <br>  <br>（コード:名称）   <br>（Data:Name）   <br>診療年月が平成30年4月以降の場合     <br>　00:入院中   <br>　01:外泊   <br>　02:治療の為の外泊   <br>　03:選定入院中の外泊   <br>　04:他医療機関受診４０％減算   <br>　05:他医療機関受診１０％減算   <br>　06:他医療機関受診２０％減算   <br>　08:特定時間退院減算   <br>　09:特定曜日入退院減算   <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算   <br>　14:他医療機関受診５％減算   <br>　15:他医療機関受診３５％減算   <br>　16:他医療機関受診１５％減算   <br>　17:特定曜日入退院減算＋他医療機関受診５％減算   <br>  <br>診療年月が平成30年3月以前の場合   <br>　00:入院中   <br>　01:外泊   <br>　02:治療の為の外泊   <br>　03:選定入院中の外泊   <br>　04:他医療機関受診４０％減算   <br>　05:他医療機関受診１０％減算   <br>　06:他医療機関受診２０％減算   <br>　08:特定時間退院減算   <br>　09:特定曜日入退院減算   <br>　13:特定曜日入退院減算＋他医療機関受診１０％減算 | 入院中 | 変更(2018-03-26) |
| 8-8 | Morning\_Meal | 朝食  |     |     |
| 8-8-1 | Label | 内容の名称 | 朝食  |     |
| 8-8-2 | Data | コード | 01  |     |
| 8-8-3 | Name | 名称  <br>（コード:名称)  <br>00:食事なし  <br>01:食事あり  <br>02:食事あり(特別食)  <br>03:食事あり(流動食) | 食事あり | 変更(2016-04-18) |
| 8-9 | Lunch\_Meal | 昼食  |     |     |
| 8-9-1 | Label | 内容の名称 | 昼食  |     |
| 8-9-2 | Data | コード | 01  |     |
| 8-9-3 | Name | 名称  <br>（コード:名称)  <br>00:食事なし  <br>01:食事あり  <br>02:食事あり(特別食)  <br>03:食事あり(流動食) | 食事あり | 変更(2016-04-18) |
| 8-10 | Evening\_Meal | 夕食  |     |     |
| 8-10-1 | Label | 内容の名称 | 夕食  |     |
| 8-10-2 | Data | コード | 01  |     |
| 8-10-3 | Name | 名称  <br>（コード:名称)  <br>00:食事なし  <br>01:食事あり  <br>02:食事あり(特別食)  <br>03:食事あり(流動食) | 食事あり | 変更(2016-04-18) |
| 8-11 | Room\_Charge | 室料差額情報 |     |     |
| 8-11-1 | Label | 内容の名称 | 室料差額 |     |
| 8-11-2 | Data | 室料差額 | 1000 |     |
| 8-11-3 | Name | 単位（円） | 円   |     |
| 8-12 | Hospital\_Charge\_Information | 入院基本料等情報 |     | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-12-1 | Label | 内容の名称を返却 | 入院基本料等 | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-12-2 | Hospital\_Charge | 入院基本料等（繰り返し　最大２０） |     | 初期加算等の注加算も併せて返却します。  <br>  <br>Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-12-2-1 | Data | 入院基本料等の診療コードを返却 | 190077410 | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-12-2-2 | Name | 入院基本料等の名称を返却 | 一般病棟１０対１入院基本料 | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-13 | Additional\_Hospital\_Charge | 入院加算（繰り返し　最大２０） |     | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-13-1 | Label | 内容の名称を返却 | 入院加算 | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-13-2 | Data | 入院加算の診療コードを返却 | 190172170 | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 8-13-3 | Name | 入院加算の名称を返却 | 診療録管理体制加算１ | Ver5.0.0以降のみ追加  <br>(2018-02-26) |
| 9   | Insurance\_Information | 診療年月の保険組合せ詳細情報（繰り返し １０） |     |     |
| 9-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 |     |
| 9-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 9-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 9-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 9-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 9-6 | HealthInsuredPerson\_Number | 番号  | １２３４５６ |     |
| 9-7 | PublicInsurance\_Information | 公費情報（繰り返し ４） |     |     |
| 9-7-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 9-7-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 9-7-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 9-7-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |

  ※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

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

[sample\_hsmeal\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsmeal_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院患者食事等情報返却  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/hsmealv2")  
#  
\# 1.患者番号    Patient\_ID      (REQUIRED)  
\# 2.診療年月    Perform\_Month   (IMPLIED)  
#  
\# REQUIRED : 必須   IMPLIED : 任意  
#BODY \= <<EOF 

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Perform\_Month type\="string"\></Perform\_Month>        </private\_objects>  
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
| 01  | 診療年月の設定に誤りがあります |
| 02  | 患者番号の設定に誤りがあります |
| 03  | 入退院情報の取得に失敗しました |
| 04  <br> 05 | 入院会計情報の取得に失敗しました |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 92  | 診療年月は平成２０年（２００８年）４月以降を指定してください |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザIDが未登録です |
| それ以外 | 返却情報の編集でエラーが発生しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院患者食事等情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospfood.html#wrapper)

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
