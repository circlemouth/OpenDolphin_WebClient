[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#content)

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
 > 日医標準レセプトソフト API 受付

API 受付
======

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#reqsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#warnmsg)
      
    

更新履歴
----

2024-11-26    受付情報・診察料照会を追加。  

2021-01-27    「リクエスト一覧」に項目を追加。  
　　　　　　　 「レスポンス一覧」に項目を追加。  

2017-12-20 新規患者の受付対応。  

2017-04-26 「レスポンス一覧」に項目を追加。  
　　　　　　　「レスポンス一覧」の保険組合せ情報の件数を20→30に変更。  

2015-12-21  「リクエスト一覧」に項目を追加。  
　　　　　　「レスポンス一覧」に項目を追加。  
　　　　　　「Rubyによるリクエストサンプルソース」を修正。  

2014-07-24  「エラーメッセージ一覧」を追加。  
　　　　　　「警告メッセージ一覧」を追加。  
　　　　　　「レスポンス一覧」に警告メッセージ格納用項目を追加。  
　　　　　　「リクエスト(POSTリクエスト)サンプル」の処理詳細を修正。

概要
--

POSTメソッドによる受付登録/受付取消を行います。

リクエストおよびレスポンスデータはxml2形式になります。  
  

テスト方法
-----

1.  参考提供されている sample\_acceptance\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_acceptance\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_acceptance\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca11/acceptmodv2  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <acceptreq type\="record"\>                <Request\_Number type\="string"\>03</Request\_Number>                <Patient\_ID type\="string"\>00200</Patient\_ID>                <Acceptance\_Date type\="string"\>2017-11-21</Acceptance\_Date>                <Acceptance\_Time type\="string"\>13:21:41</Acceptance\_Time>                <Acceptance\_Id type\="string"\>00001</Acceptance\_Id>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\>02</Medical\_Information>                <HealthInsurance\_Information type\="record"\>                        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>                        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>                        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>                        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>                        <HealthInsuredPerson\_Symbol type\="string"\>１１２２３３４４</HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\>１２２３３４４</HealthInsuredPerson\_Number>                        <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                        <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>                        <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>                        <HealthInsuredPerson\_WholeName type\="string"\></HealthInsuredPerson\_WholeName>                        <Certificate\_StartDate type\="string"\>2009-04-01</Certificate\_StartDate>                        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                </HealthInsurance\_Information>        </acceptreq>  
</data>

### 処理概要

受付リクエストにより該当患者の受付又は取消を行います。

### 処理詳細

受付時

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  診療科の存在チェック
5.  ドクターコードの存在チェック
6.  診療内容の存在チェック
7.  同一受付日での、同一診療科・ドクターで受診済みでない場合の受付を禁止
8.  保険組合情報の妥当性チェック
9.  システム管理の情報によりclaim送信,ユーザPG起動 (ポップアップなしの場合のみ)
10.  受付登録時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却

取消時

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  受付取消時に警告が出た場合は警告メッセージを「Api\_Warning\_Message」として返却  
    

  

新規患者の受付対応について  
 新規患者の受付対応については、以下のような運用形態を想定しています。  
 1.日レセAPIによる新患者受付登録(機能追加)  
 2.日レセAPIによる患者登録処理(通常の日レセ画面を使用する場合は現状どおり)  
   受付一覧APIにより、受付登録時の受付IDを保有  
 3.2の患者情報を基に日レセAPIによる受付更新処理(新設)  
  
※リクエスト番号の追加  
  1.リクエスト番号(Request\_Number)  
      01:受付登録  
      02:受付削除  
      03:受付更新(患者番号の設定)  
　　　(CLASS=01,02は、使用可能ですが、Request\_Number を推奨します。)  
  
  
※新規患者の受付登録  
　リクエスト番号=01  
　　患者番号は空白、患者氏名を必須設定とします。  
　　診療科・ドクターコードは必須です。  
　　＃患者番号に設定があれば、患者氏名を設定しても無視します。  
  
    患者氏名（WholeName）に関しては、全角２５文字で設定します。  
　　　※外字は■変換します。エラーには出来ません。  
  
※新規患者の受付取消  
　リクエスト番号=02  
　　受付ID、受付日付、受付時間を設定します。  
　　受付日付、受付IDから削除対象の受付を決定します。  
　　決定した受付に患者番号がある時、受付時間が送信内容と一致しない時は  
    エラーとします。  
  
※新規患者の受付更新(患者番号設定)  
　リクエスト番号=03  
　　受付ID、受付日付、受付時間、患者番号、診療科、ドクター、診療内容を設定します。  
　　受付日付、受付IDから更新対象の受付を決定します。  
　　決定した受付に患者番号がある時、受付時間が送信内容と一致しない時は  
    エラーとします。  
　　排他制御中のチェックなど受付登録時と同様のチェックをします。  
  
　　受付に患者番号と患者基本情報の患者氏名を設定して更新します。  
　　診療科から診療内容も送信内容で更新します。  
　　保険組合せ情報は受付登録時と同様の処理とします。  
　　(保険組合せ情報の設定がなければ、自動設定します。)  
  
※受付情報・診察料照会  
　リクエスト番号=00  
　　Request\_Number=00　でリクエストを行った場合、指定した患者の受付情報と診察料を返却します。  
　　(今後、claimの廃止に向けて同等の機能の提供)  
  
　　１．指定した患者番号と受付日（未設定はシステム日付）で受付を検索します。  
　　　１．受付ＩＤの送信があれば、受付ＩＤで検索  
　　　２．診療科があれば、診療科で検索し、保険組合せがあれば一致する受付  
　　　３．診療科がなければ、当日の受付を検索し、保険組合せがあれば一致する受付  
　　　４．２、３は受付中を対象。受付中がない時は会計済みの受付。  
　　　５．２，３、は受付時間があれば一致する受付を優先します。  
　　２．受付がなければエラーとしその旨返却します。  
　　３．決定した受付が会計済みであれば、その旨を返却し受付情報のみを返却します。  
　　　　診察料の返却は行いません。  
　　４．診察料を返却します。  
　　　新規患者（初診算定日なし）は初診、以外は再診を返却します。  
　　　当日に受診があれば、同日再診を返却します。  
　　　受付が労災・自賠責保険であっても、健保の診察料を返却してます。  
　　　当日診察料算定不可（外来リハビリテーション料算定済みや、施設入所中、入院中など）の判断は行いません。  
　　　小児科外来診療料や小児かかりつけ診療料が当日算定済みであれば、診察料コードと名称に「・同日再診」を付加しています。  
　　　（当日算定済みなので算定不可）  
　　５．保険の出現順は、claimと同様受付された保険組合せを先頭に、それ以降残りの保健組合せを出現させます  
  
※その他の変更  
　受付取消処理で受付時間を送信しなかった場合、警告メッセージを  
  返却していましたが必要ないと考え廃止しました。  
　返却時に削除した受付の受付時間を設定します。

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 追加  <br>(2017-12-20)  <br>※８ |
| 2   | Patient\_ID | 患者番号 | 00012 | ※４ ※５ |
| 3   | WholeName | 患者氏名 | 日医　太郎 | 追加  <br>(2017-12-20)  <br>※４ |
| \>  | Acceptance\_Push | プッシュ通知 |     |     |
| 4   | Acceptance\_Date | 受付日 | 2011-03-15 | 未設定はシステム日付 |
| 5   | Acceptance\_Time | 受付時間 | 15:30:00 | 未設定はシステム日付  <br>※５ |
| 6   | Acceptance\_Id | 受付ID |     | 必須(受付取消のみ)  <br>※５ |
| 7   | Department\_Code | 診療科コード | 01  | 必須(受付登録のみ)※５ |
| 8   | Physician\_Code | ドクターコード | 10001 | 必須(受付登録のみ)※５ |
| 9   | Medical\_Information | 診療内容区分 | 01  | 未設定はシステム管理の１件目  <br>※１ ※５ |
| 10  | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 10-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 | 追加  <br>(2015-12-21) |
| 10-2 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 | ※２  |
| 10-3 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※２  |
| 10-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※２  |
| 10-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 10-6 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 10-7 | HealthInsuredPerson\_Branch\_Number | 枝番  |     | 追加  <br>(2021-01-27) |
| 10-8 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 10-9 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 10-10 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 10-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 10-12 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 10-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 10-14 | PublicInsurance\_Information | 公費情報（繰り返し4） |     |     |
| 10-14-1 | PublicInsurance\_Class | 公費の種類 | 010 | ※２  |
| 10-14-2 | PublicInsurance\_Name | 公費の制度名称 | 感37の2 | ※２  |
| 10-14-3 | PublicInsurer\_Number | 負担者番号 | 10131142 | ※２  |
| 10-14-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | ※２  |
| 10-14-5 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 10-14-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |

※１：受付登録時に未設定で、受付日で予約中であれば予約の診療内容区分を設定

※２：設定されていれば一致する保険組合せが対象。すべて設定がない時は前回の保険組合せ

※３：受付更新（０３）は必須。未設定でCLASS=０１、０２であればCLASS=Request\_Number

※４：受付登録、受付取消の時、患者番号、または患者氏名のどちらを必須とします。  
　　　患者番号が未設定の時は、患者登録なしの新規患者とします。

※５：受付更新の時は、必須です。

※８：リクエスト番号＝00 （受付・診察料照会）は、患者番号のみ必須となります。  
　　　受付ＩＤの送信があれば一致する受付とします。  
　　　診療科・保険組合せ番号の送信があれば一致する受付を対象とします。  
　　　受付時間の送信があれば一致する受付を優先します。  
　　　受付が存在しない時はエラーとします。

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-12-07 |     |
| 2   | Information\_Time | 実施時間 | 20:21:38 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | K1  | 警告メッセージが複数の場合は、最初の警告メッセージのエラーコードを返却 |
| 4   | Api\_Result\_Message | エラーメッセージ | 受付登録終了 |     |
| 5   | Api\_Warning\_Message\_Information | 警告メッセージ情報（繰り返し　５） |     | 追加  <br>(2014-07-24) |
| 5-1 | Api\_Warning\_Message | 警告メッセージ | 受付日を自動設定しました | 追加  <br>(2014-07-24) |
| 6   | Reskey |     | Acceptance\_Info |     |
| 7   | Acceptance\_Date | 受付日 | 2015-12-07 |     |
| 8   | Acceptance\_Time | 受付時間 | 20:21:38 |     |
| 9   | Acceptance\_Id | 受付ID | 00001 |     |
| 10  | Department\_Code | 診療科コード ※５  <br>(01:内科) | 01  |     |
| 11  | Department\_WholeName | 診療科名称 | 内科  |     |
| 12  | Physician\_Code | ドクターコード | 10001 |     |
| 13  | Physician\_WholeName | ドクター名 | 日本　一 |     |
| 14  | Medical\_Information | 診療内容区分 ※６  <br>(01:診察１、 02:薬のみ、 03:注射のみ、 04:検査のみ、 05:リハビリテーション、 06:健康診断、 07:予防注射、 99:該当なし) | 01  |     |
| 15  | Patient\_Information | 患者基本情報 |     |     |
| 15-1 | Patient\_ID | 患者番号 | 00012 |     |
| 15-2 | WholeName | 患者氏名 | 日医　太郎 |     |
| 15-3 | WholeName\_inKana | 患者カナ氏名 | ニチイ　タロウ |     |
| 15-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 15-5 | Sex | 性別  <br>(1:男性、2:女性) | 1   |     |
| 15-6 | Home\_Address\_Information | 自宅住所情報 |     |     |
| 15-6-1 | Address\_ZipCode | 郵便番号 | 1130021 |     |
| 15-6-2 | WholeAddress | 住所  | 東京都文京区本駒込６−１６−３ |     |
| 16  | HealthInsurance\_Information | 保険組合せ情報 (繰り返し 30） |     | (2017-04-26 パッチ適用以降 繰り返し30)  <br>※７ |
| 16-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0002 | 追加  <br>(2015-12-21) |
| 16-2 | Insurance\_Nondisplay | 保険組合せ非表示区分  <br>(O:外来非表示、I:入院非表示、N:非表示無し) | N   | 追加  <br>(2017-04-26) |
| 16-3 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 |     |
| 16-4 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 16-5 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 16-6 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 16-7 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 16-8 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 16-9 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 16-10 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 16-11 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 16-12 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 16-13 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 16-14 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 16-15 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 16-15-1 | PublicInsurance\_Class | 公費の種類 | 010 |     |
| 16-15-2 | PublicInsurance\_Name | 公費の制度名称 | 感３７の２ |     |
| 16-15-3 | PublicInsurer\_Number | 負担者番号 | 10131142 |     |
| 16-15-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 16-15-5 | Rate\_Admission | 入院ー負担率（割） | 0.05 |     |
| 16-15-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 16-15-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.05 |     |
| 16-15-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 16-15-9 | Certificate\_IssuedDate | 適用開始日 | 2011-03-14 |     |
| 16-15-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 17  | Medical\_Info | 診察料情報 |     | ※９  <br>追加(2024-11-26) |
| 17-1 | Medical\_Class | 診療種別区分 |     | 診療コードの診療種別区分  <br>追加(2024-11-26) |
| 17-2 | Medical\_Class\_Name | 診療種別区分名称 |     | 追加(2024-11-26) |
| 17-3 | Medication\_Info | 診療情報 |     | 追加(2024-11-26) |
| 17-3-1 | Medication\_Code | 診療コード |     | ※１０  <br>追加(2024-11-26) |
| 17-3-2 | Medication\_Name | 名称  |     | 追加(2024-11-26) |

※７：受付した保険組合せは、１件目に編集

※９：受付が会計済みの時は、診察料情報の返却はしません。

※１０：新規患者（初診算定日の登録なし）は初診を、以外は再診を返却します。  
　　　　受付の保険が労災・自賠責であっても健保のコードを返却します。  
　　　　当日診察料算定不可（施設入所中、入院中など）の判定は行いません。  
　　　　小児科外来診療料・小児かかりつけ診療料が当日算定済みの時は名称に「・同日再診」と追記します  
　　　　（CALIMの受付時返却の予約請求モジュールと同様）

### リクエストサンプル

<data>        <acceptreq type\="record"\>                <Patient\_ID type\="string"\>12</Patient\_ID>                <Acceptance\_Date type\="string"\></Acceptance\_Date>                <Acceptance\_Time type\="string"\></Acceptance\_Time>                <Acceptance\_Id type\="string"\></Acceptance\_Id>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\>01</Medical\_Information>                <HealthInsurance\_Information type\="record"\>                        <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>                        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                        <HealthInsuredPerson\_Symbol type\="string"\></HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\></HealthInsuredPerson\_Number>                        <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                        <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>                        <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>                        <HealthInsuredPerson\_WholeName type\="string"\></HealthInsuredPerson\_WholeName>                        <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>                        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                </HealthInsurance\_Information>        </acceptreq>  
</data> 

### レスポンスサンプル  

<xmlio2>  <acceptres type\="record"\>    <Information\_Date type\="string"\>2015-12-07</Information\_Date>    <Information\_Time type\="string"\>20:21:38</Information\_Time>    <Api\_Result type\="string"\>K1</Api\_Result>    <Api\_Result\_Message type\="string"\>受付登録終了</Api\_Result\_Message>    <Api\_Warning\_Message\_Information type\="array"\>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>受付日を自動設定しました</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>      <Api\_Warning\_Message\_Information\_child type\="record"\>        <Api\_Warning\_Message type\="string"\>受付時間を自動設定しました</Api\_Warning\_Message>      </Api\_Warning\_Message\_Information\_child>    </Api\_Warning\_Message\_Information>    <Reskey type\="string"\>Acceptance\_Info</Reskey>    <Acceptance\_Date type\="string"\>2015-12-07</Acceptance\_Date>    <Acceptance\_Time type\="string"\>20:21:38</Acceptance\_Time>    <Acceptance\_Id type\="string"\>00001</Acceptance\_Id>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_WholeName type\="string"\>内科</Department\_WholeName>    <Physician\_Code type\="string"\>10001</Physician\_Code>    <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>    <Medical\_Information type\="string"\>01</Medical\_Information>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>      <Home\_Address\_Information type\="record"\>        <Address\_ZipCode type\="string"\>1130021</Address\_ZipCode>        <WholeAddress type\="string"\>東京都文京区本駒込６−１６−３</WholeAddress>      </Home\_Address\_Information>      <HealthInsurance\_Information type\="array"\>        <HealthInsurance\_Information\_child type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0002</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          <PublicInsurance\_Information type\="array"\>            <PublicInsurance\_Information\_child type\="record"\>              <PublicInsurance\_Class type\="string"\>010</PublicInsurance\_Class>              <PublicInsurance\_Name type\="string"\>感３７の２</PublicInsurance\_Name>              <PublicInsurer\_Number type\="string"\>10131142</PublicInsurer\_Number>              <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>              <Rate\_Admission type\="string"\>0.05</Rate\_Admission>              <Money\_Admission type\="string"\>     0</Money\_Admission>              <Rate\_Outpatient type\="string"\>0.05</Rate\_Outpatient>              <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>              <Certificate\_IssuedDate type\="string"\>2011-03-14</Certificate\_IssuedDate>              <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>            </PublicInsurance\_Information\_child>          </PublicInsurance\_Information>        </HealthInsurance\_Information\_child>        <HealthInsurance\_Information\_child type\="record"\>          <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>          <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>          <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>          <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>          <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>          <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>          <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>          <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>          <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>          <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>          <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        </HealthInsurance\_Information\_child>      </HealthInsurance\_Information>    </Patient\_Information>  </acceptres>  
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

[sample\_acceptance\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_acceptance_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 受付登録  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca11/acceptmodv2")  
#  
#BODY \= <<EOF

<data>        <acceptreq type\="record"\>                <Request\_Number type\="string"\>03</Request\_Number>                <Patient\_ID type\="string"\>00200</Patient\_ID>                <Acceptance\_Date type\="string"\>2017-11-21</Acceptance\_Date>                <Acceptance\_Time type\="string"\>13:21:41</Acceptance\_Time>                <Acceptance\_Id type\="string"\>00001</Acceptance\_Id>                <Department\_Code type\="string"\>01</Department\_Code>                <Physician\_Code type\="string"\>10001</Physician\_Code>                <Medical\_Information type\="string"\>02</Medical\_Information>                <HealthInsurance\_Information type\="record"\>                        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>                        <InsuranceProvider\_Class type\="string"\>009</InsuranceProvider\_Class>                        <InsuranceProvider\_Number type\="string"\>01320019</InsuranceProvider\_Number>                        <InsuranceProvider\_WholeName type\="string"\>協会</InsuranceProvider\_WholeName>                        <HealthInsuredPerson\_Symbol type\="string"\>１１２２３３４４</HealthInsuredPerson\_Symbol>                        <HealthInsuredPerson\_Number type\="string"\>１２２３３４４</HealthInsuredPerson\_Number>                        <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                        <HealthInsuredPerson\_Assistance type\="string"\></HealthInsuredPerson\_Assistance>                        <RelationToInsuredPerson type\="string"\></RelationToInsuredPerson>                        <HealthInsuredPerson\_WholeName type\="string"\></HealthInsuredPerson\_WholeName>                        <Certificate\_StartDate type\="string"\>2009-04-01</Certificate\_StartDate>                        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                </HealthInsurance\_Information>        </acceptreq>  
</data>

EOF  
  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
}

   

エラーメッセージ一覧  

-------------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号が未設定です |
| 02  | 診療科が未設定です |
| 03  | ドクターが未設定です |
| 10  | 患者番号に該当する患者が存在しません |
| 11  | 受付日が暦日ではありません |
| 12  | 受付時間設定誤り |
| 13  | 診療科が存在しません |
| 14  | ドクターが存在しません |
| 15  | 診療内容情報が存在しません |
| 16  | 診療科・保険組合せで受付登録済みです。二重登録疑い |
| 17  | 削除対象の受付レコードが存在しません |
| 19  | 受付ID設定誤り |
| 20  | 受付IDの受付患者番号と患者番号が一致しません |
| 21  | 保険の一致する患者保険情報がありません |
| 22  | 公費の一致する患者公費情報がありません |
| 23  | 保険情報と一致する保険組合せがありません |
| 50  | 受付登録件数が上限以上となります。登録できません |
| 51  | 受付更新エラー |
| 52  | 受付登録エラー |
| 53  | 予約更新エラー |
| 54  | 受付削除エラー |
| 60  | 受付の登録がありません。 |
| 61  | 該当の受付は会計済みです。診察料の返却は行いません。 |
| 62  | 診察料が決定できませんでした。 |
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
| K1  | 受付日を自動設定しました |
| K2  | 受付時間を自動設定しました |
| K3  | 診療内容情報を自動設定しました |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト API 受付

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/acceptmod.html#wrapper)

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
