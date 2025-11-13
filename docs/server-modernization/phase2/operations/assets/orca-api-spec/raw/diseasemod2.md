[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#content)

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
 > 患者病名登録２

患者病名登録２  

==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#warnmsg)
      
    

更新履歴
----

 2018-10-25 転帰区分に「P:中止」を追加、削除条件から疑いフラグ、急性フラグを除外。 

 2018-05-28 「リクエスト一覧」に項目を追加、変更。  
 　　　　　　「レスポンス一覧」に項目を追加。  

概要
--

POSTメソッドによる該当患者の病名データの追加、変更および削除を行います。

日レセ Ver.5.0.0\[第14回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_diseasev3.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_diseasev3.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_diseasev3.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca22/diseasev3  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  
	<diseasereq type="record">  
		<Patient\_ID type="string">07009</Patient\_ID>  
		<Base\_Month type="string">2017-03</Base\_Month>  
		<Perform\_Date type="string">2016-02-11</Perform\_Date>  
		<Perform\_Time type="string"></Perform\_Time>  
		<Diagnosis\_Information type="record">  
			<Department\_Code type="string">01</Department\_Code>  
		</Diagnosis\_Information>  
		<Disease\_Information type="array">  
			<Disease\_Information\_child type="record">  
				<Disease\_Insurance\_Class type="string"></Disease\_Insurance\_Class>  
				<Disease\_Code type="string">3089002</Disease\_Code>  
				<Disease\_Name type="string"></Disease\_Name>  
				<Disease\_Single type="array">  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string"></Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
				</Disease\_Single>  
				<Disease\_Supplement\_Name type= "string">不安、緊張</Disease\_Supplement\_Name>  
				<Disease\_Supplement\_Single type="array">  
					<Disease\_Supplement\_Single\_child type="record">  
						<Disease\_Supplement\_Single\_Code type= "string"></Disease\_Supplement\_Single\_Code>  
					</Disease\_Supplement\_Single\_child>  
				</Disease\_Supplement\_Single>  
				<Disease\_InOut type="string">O</Disease\_InOut>  
				<Disease\_Category type="string"></Disease\_Category>  
				<Disease\_SuspectedFlag type="string"></Disease\_SuspectedFlag>  
				<Disease\_StartDate type="string">2017-08-21</Disease\_StartDate>  
				<Disease\_EndDate type="string"></Disease\_EndDate>  
				<Disease\_OutCome type="string"></Disease\_OutCome>  
				<Disease\_Karte\_Name type="string"></Disease\_Karte\_Name>  
				<Disease\_Class type="string"></Disease\_Class>  
				<Insurance\_Combination\_Number type="string"></Insurance\_Combination\_Number>  
				<Disease\_Receipt\_Print type="string"></Disease\_Receipt\_Print>  
				<Disease\_Receipt\_Print\_Period type="string"></Disease\_Receipt\_Print\_Period>  
				<Insurance\_Disease type="string"></Insurance\_Disease>  
				<Discharge\_Certificate type="string"></Discharge\_Certificate>  
				<Main\_Disease\_Class type="string"></Main\_Disease\_Class>  
				<Sub\_Disease\_Class type="string"></Sub\_Disease\_Class>  
			</Disease\_Information\_child>  
		</Disease\_Information>  
	</diseasereq>  
</data>   

### 処理概要

該当患者の病名データの追加、変更および削除を行います。

### 処理詳細

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  診療科の存在チェック
5.  補足コメントコードおよび文字列の妥当性チェック
6.  システム管理「9000 CLAIM」の集約、同期は対応しない
7.  入外の更新については、  
    入院A病名に対し、外来A病名を送信した場合は、外来A病名を追加  
    外来A病名に対し、入外空白A病名を送信した場合は、A病名を入外空白で更新  
    

レスポンスサンプル
---------

<xmlio2>  
  <diseaseres type="record">  
    <Information\_Date type="string">2017-08-31</Information\_Date>  
    <Information\_Time type="string">11:59:44</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">処理実施終了</Api\_Result\_Message>  
    <Reskey type="string">Acceptance\_Info</Reskey>  
    <Perform\_Date type="string">2016-02-11</Perform\_Date>  
    <Perform\_Time type="string">11:59:44</Perform\_Time>  
    <Department\_Code type="string">01</Department\_Code>  
    <Department\_Name type="string">第一内科</Department\_Name>  
    <Patient\_ID type="string">07009</Patient\_ID>  
    <Base\_Month type="string">2017-03</Base\_Month>  
    <Disease\_Unmatch\_Information type="record">  
      <Disease\_Unmatch\_Information\_Overflow type="string">False</Disease\_Unmatch\_Information\_Overflow>  
      <Disease\_Unmatch\_Info type="array">  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">0000999</Disease\_Code>  
          <Disease\_Name type="string">かぜ</Disease\_Name>  
          <Disease\_Supplement\_Name type="string">右片側</Disease\_Supplement\_Name>  
          <Disease\_Supplement\_Single type="array">  
            <Disease\_Supplement\_Single\_child type="record">  
              <Disease\_Supplement\_Single\_Code type="string">ZZZ2056</Disease\_Supplement\_Single\_Code>  
              <Disease\_Supplement\_Single\_Name type="string">右</Disease\_Supplement\_Single\_Name>  
            </Disease\_Supplement\_Single\_child>  
            <Disease\_Supplement\_Single\_child type="record">  
              <Disease\_Supplement\_Single\_Code type="string">ZZZ2054</Disease\_Supplement\_Single\_Code>  
              <Disease\_Supplement\_Single\_Name type="string">片側</Disease\_Supplement\_Single\_Name>  
            </Disease\_Supplement\_Single\_child>  
          </Disease\_Supplement\_Single>  
          <Disease\_Category type="string">PD</Disease\_Category>  
          <Disease\_StartDate type="string">2002-02-01</Disease\_StartDate>  
          <Disease\_EndDate type="string">2017-05-19</Disease\_EndDate>  
          <Disease\_OutCome type="string">1</Disease\_OutCome>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">7840024</Disease\_Code>  
          <Disease\_Name type="string">頭痛</Disease\_Name>  
          <Disease\_StartDate type="string">2014-10-01</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">2049.7274039.8002</Disease\_Code>  
          <Disease\_Name type="string">左膝ガングリオンの疑い</Disease\_Name>  
          <Disease\_Supplement\_Name type="string">左膝ガングリオン鼻アレルギー胃ＣＡ</Disease\_Supplement\_Name>  
          <Disease\_Supplement\_Single type="array">  
            <Disease\_Supplement\_Single\_child type="record">  
              <Disease\_Supplement\_Single\_Code type="string">11111</Disease\_Supplement\_Single\_Code>  
              <Disease\_Supplement\_Single\_Name type="string">左膝ガングリオン</Disease\_Supplement\_Single\_Name>  
            </Disease\_Supplement\_Single\_child>  
            <Disease\_Supplement\_Single\_child type="record">  
              <Disease\_Supplement\_Single\_Code type="string">22222</Disease\_Supplement\_Single\_Code>  
              <Disease\_Supplement\_Single\_Name type="string">鼻アレルギー</Disease\_Supplement\_Single\_Name>  
            </Disease\_Supplement\_Single\_child>  
            <Disease\_Supplement\_Single\_child type="record">  
              <Disease\_Supplement\_Single\_Code type="string">33333</Disease\_Supplement\_Single\_Code>  
              <Disease\_Supplement\_Single\_Name type="string">胃ＣＡ</Disease\_Supplement\_Single\_Name>  
            </Disease\_Supplement\_Single\_child>  
          </Disease\_Supplement\_Single>  
          <Disease\_SuspectedFlag type="string">1</Disease\_SuspectedFlag>  
          <Disease\_StartDate type="string">2017-03-10</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
      </Disease\_Unmatch\_Info>  
    </Disease\_Unmatch\_Information>  
  </diseaseres>  
</xmlio2>  
 

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 07009 | 必須  |
| 2   | Base\_Month | 基準月  <br>（空白時はシステム日の属する月） |     | レスポンス※３ 参照 |
| 3   | Perform\_Date | 実施年月日 | 2017-03-01 |     |
| 4   | Perform\_Time | 実施時間 | 01:01:01 |     |
| 5   | Diagnosis\_Information | 診療科情報 |     |     |
| 5-1 | Department\_Code | 診療科 | 01  |     |
| 6   | Disease\_Information | 病名情報(繰り返し　５０) |     | 必須  |
| 6-1 | Disease\_Insurance\_Class | 保険区分  <br>(１：医保(自費)以外、  <br>１以外：医保(自費)) | 1   |     |
| 6-2 | Disease\_Code | 一連病名コード | 2500014 | 必須　※１ |
| 6-3 | Disease\_Name | 一連病名 |     | 必須　※１ |
| 6-4 | Disease\_Single | 単独病名情報(繰り返し　２１) |     | 必須　※１  <br>  <br>変更(最大 ６ → ２１)  <br>(2018-05-28) |
| 6-4-1 | Disease\_Single\_Code | 単独病名コード |     |     |
| 6-4-2 | Disease\_Single\_Name | 単独病名 |     |     |
| 6-5 | Disease\_Supplement\_Name | 補足コメント情報 |     | ※２  |
| 6-6 | Disease\_Supplement\_Single | 補足コメントコード情報(繰り返し　３) |     | ※２  |
| 6-6-1 | Disease\_Supplement\_Single\_Code | 補足コメントコード |     |     |
| 6-7 | Disease\_InOut | 入外区分  <br>（Ｉ：入院、Ｏ：入院外、空白：入外） | O   |     |
| 6-8 | Disease\_Category | 主病フラグ  <br>（PD：主疾患） |     |     |
| 6-9 | Disease\_SuspectedFlag | 疑いフラグ  <br>（S：疑い） |     |     |
| 6-10 | Disease\_AcuteFlag | 急性フラグ  <br>（A：急性） |     | 追加  <br>(2018-05-28) |
| 6-11 | Disease\_StartDate | 開始日 | 2017-02-28 | 必須  |
| 6-12 | Disease\_EndDate | 転帰日 |     |     |
| 6-13 | Disease\_OutCome | 転帰区分 |     | ※６  |
| 6-14 | Disease\_Karte\_Name | カルテ病名 |     | ※３  |
| 6-15 | Disease\_Class | 疾患区分  <br>（０３：皮膚科特定疾患指導管理料（１）、  <br>０４：皮膚科特定疾患指導管理料（２）、  <br>０５：:特定疾患療養管理料、  <br>０７：てんかん指導料、  <br>０８：特定疾患療養管理料又はてんかん指導料、  <br>０９：難病外来指導管理料） | Auto | ※４  |
| 6-16 | Insurance\_Combination\_Number | 保険組合せ番号 | 0003 | 労災、公害、自賠責、第三者行為は必須　　　 ※５ |
| 6-17 | Disease\_Receipt\_Print | レセプト表示  <br>（１：表示しない） | 1   | ※３  |
| 6-18 | Disease\_Receipt\_Print\_Period | レセプト表示期間  <br>（００〜９９） | 99  | ※３  |
| 6-19 | Insurance\_Disease | 保険病名  <br>（１：保険病名） | 1   | ※３  |
| 6-20 | Discharge\_Certificate | 退院証明書  <br>（空白または０：記載しない、１：記載する） | 0   | ※３  |
| 6-21 | Main\_Disease\_Class | 原疾患区分  <br>（０１：原疾患ア、０２：原疾患イ、  <br>０３：原疾患ウ、０４：原疾患エ、  <br>０５：原疾患オ） | 02  | ※３  |
| 6-22 | Sub\_Disease\_Class | 合併症区分  <br>（０１：アの合併症、０２：イの合併症、  <br>０３：ウの合併症、０４：エの合併症、  <br>０５：オの合併症） | 03  | ※３  |

※１：単独病名か一連病名のいずれかの設定が必要です。両方に設定がある場合は単独病名を優先します。  
　　　病名コード、病名の両方に設定がある場合は病名コードを優先します。  

※２：補足コメントコード、補足コメント名称の両方に設定がある場合は補足コメントコードを優先します。

※３：「None」が設定してある場合、新規時は初期値を設定、更新(削除)時は更新(削除)対象としません。

※４：「None」が設定してある場合、新規時は初期値を設定、更新時は更新対象としません。  
　　　「Auto」が設定してある場合、病名コードまたは病名から自動判定した値を設定します（なければ空白と同様）。  

※５：「None」が設定してある場合、新規時は初期値を設定、更新時は更新対象としません。  
　　　設定された保険組合せ番号が削除分の場合、新規または保険組合せ番号の更新時はエラーとします。  
　　　Disease\_Insurance\_Classが「１」のとき、未設定または「None」はエラーとします。  

※６：転帰区分の取り扱いについては日レセの転帰区分にあわせて以下のように置き換えます。  
　　　　O：削除　　　　　開始日、病名、補足コメント名称、転帰日、入外区分、保険組合せ番号等完全一致したものに対し、削除フラグを設定します。(但し、疑いフラグ、急性フラグの値は一致条件から外します(2018-10-25))  
　　　　D：死亡　　　　　２（死亡）  
　　　　F：完治　　　　　１（治ゆ）  
　　　　N：不変　　　　　３（中止）  
　　　　R：軽快　　　　　３（中止）  
　　　　S：後遺症残　　　３（中止）  
　　　　U：不明　　　　　３（中止）  
　　　　W：悪化　　　　　３（中止）  
　　　　P：中止　　　　　３（中止）  
　　　　上記以外　　　　 １（治ゆ）  
　　　　(※P：中止は、J-MIXの転記区分には定義されていません。本システム固有の定義となります。)  

※システム管理「9000 CLAIM」の集約、同期は対応しません。

※「の疑い」(コードでの設定も同様)は、該当病名に対する更新処理となります。  
　胃炎に対し「胃炎の疑い」を送信した場合、胃炎を胃炎の疑いとして更新します。  
　胃炎の疑いに対し、胃炎を送信した場合、胃炎の疑いを胃炎として更新します。  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 処理日付 | 2017-05-18 |     |
| 2   | Information\_Time | 処理時間 | 14:35:31 |     |
| 3   | Api\_Result | 処理区分 | 000 | ※１  |
| 4   | Api\_Result\_Message | 処理メッセージ | 処理実施終了 |     |
| 5   | Reskey |     | Acceptance\_Info |     |
| 6   | Perform\_Date | 実施日付 | 2017-05-18 |     |
| 7   | Perform\_Time | 実施時間 | 01:01:01 |     |
| 8   | Department\_Code | 診療科コード | 01  |     |
| 9   | Department\_Name | 診療科名 | 内科  |     |
| 10  | Patient\_ID | 患者番号 | 00126 |     |
| 11  | Base\_Month | 基準月  <br>（空白時はシステム日の属する月） | 2017-05 | ※３ 参照 |
| 12  | Disease\_Message\_Information | 病名登録結果(繰り返し　５０) |     | ※２  |
| 12-1 | Disease\_Result | 病名結果コード |     |     |
| 12-2 | Disease\_Result\_Message | 病名結果メッセージ | 廃止・移行先・推奨のある病名が存在します。 |     |
| 12-3 | Disease\_Warning\_Info | 病名警告情報 |     |     |
| 12-3-1 | Disease\_Warning | 病名警告コード | W01 |     |
| 12-3-2 | Disease\_Warning\_Message | 病名警告メッセージ | 廃止・移行先・推奨のある病名が存在します。 |     |
| 12-3-3 | Disease\_Warning\_Item\_Position | 連番  | 02  |     |
| 12-3-4 | Disease\_Warning\_StartDate | 警告対象の開始日 | 2017-03-10 |     |
| 12-3-5 | Disease\_Warning\_Name | 警告対象の病名 | 左膝ガングリオンの疑い |     |
| 12-3-6 | Disease\_Warning\_Code | 警告対象の病名コード | 2049.7274039.8002 |     |
| 12-3-7 | Disease\_Warning\_Change | 廃止、移行先、推奨  <br>（０１：移行先、０２：廃止、０３：推奨） | 01  | ※５  |
| 13  | Disease\_Unmatch\_Information | 不一致病名情報 |     | ※３  |
| 13-1 | Disease\_Unmatch\_Information\_Overflow | 不一致病名情報オーバーフラグ |     | ※４  |
| 13-2 | Disease\_Unmatch\_Info | 不一致病名一覧(繰り返し　５０) |     |     |
| 13-2-1 | Disease\_Code | 一連病名コード | 5609002 |     |
| 13-2-2 | Disease\_Name | 一連病名 | 亜イレウス |     |
| 13-2-3 | Disease\_Supplement\_Name | 補足コメント名称 |     |     |
| 13-2-4 | Disease\_Supplement\_Single | 補足コメントコード情報(繰り返し　３) | ZZZ2056 |     |
| 13-2-4-1 | Disease\_Supplement\_Single\_Code | 補足コメントコード |     |     |
| 13-2-4-2 | Disease\_Supplement\_Single\_Name | 補足コメント | ZZZ2054 |     |
| 13-2-5 | Disease\_InOut | 入外区分  <br>（Ｉ：入院、Ｏ：入院外、空白：入外） |     |     |
| 13-2-6 | Disease\_Category | 主病フラグ  <br>（PD：主疾患） |     |     |
| 13-2-7 | Disease\_SuspectedFlag | 疑いフラグ |     |     |
| 13-2-8 | Disease\_AcuteFlag | 急性フラグ  <br>（A：急性） |     | ※６  <br>  <br>追加  <br>(2018-05-28) |
| 13-2-9 | Disease\_StartDate | 開始日 | 2015-01-15 |     |
| 13-2-10 | Disease\_EndDate | 転帰日 |     |     |
| 13-2-11 | Disease\_OutCome | 転帰区分 |     |     |
| 13-2-12 | Disease\_Karte\_Name | カルテ病名 |     |     |
| 13-2-13 | Disease\_Class | 疾患区分 |     |     |
| 13-2-14 | Insurance\_Combination\_Number | 保険組合せ番号 |     |     |
| 13-2-15 | Disease\_Receipt\_Print | レセプト表示 |     |     |
| 13-2-16 | Disease\_Receipt\_Print\_Period | レセプト表示期間 |     |     |
| 13-2-17 | Insurance\_Disease | 保険病名 |     |     |
| 13-2-18 | Discharge\_Certificate | 退院証明書 |     |     |
| 13-2-19 | Main\_Disease\_Class | 原疾患区分 |     |     |
| 13-2-20 | Sub\_Disease\_Class | 合併症区分 |     |     |

※１　正常終了：【０００】、エラーあり：【EXX】、ワーニングあり：【WＸＸ】  

※２　エラー又は警告があった病名を返却します。  

※３　基準月に有効な病名でリクエスト内に設定されていない日レセの病名情報を返却します。  
　　　(日レセにのみ存在する病名)

※４　不一致病名が51件以上ある場合：True それ以外：False

※５　該当があれば新規登録時のみ返却します。

※６　日レセ上で、疑いフラグの値が「２」または「３」のときは「A」(急性)を返却します。  

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

[sample\_diseasev3.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_diseasev3.rb)

#!/usr/bin/ruby  
#-\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST = "localhost"  
PORT = "8000"  
USER = "ormaster"  
PASSWD = "ormaster"  
CONTENT\_TYPE = "application/xml"  
  
req = Net::HTTP::Post.new("/orca22/diseasev3?class=01")  
\# class :01 患者病名登録  
#				<Disease\_Code type="string">7808004.(101.2057.1045.C001.2057.1066.C001.7207.(201</Disease\_Code>  
#  
#  
BODY = <<EOF  
<data>  
	<diseasereq type="record">  
		<Patient\_ID type="string">07009</Patient\_ID>  
		<Base\_Month type="string"></Base\_Month>  
		<Perform\_Date type="string">2018-05-01</Perform\_Date>  
		<Perform\_Time type="string">01:01:01</Perform\_Time>  
		<Diagnosis\_Information type="record">  
			<Department\_Code type="string">27</Department\_Code>  
		</Diagnosis\_Information>  
		<Disease\_Information type="array">  
			<Disease\_Information\_child type="record">  
				<Disease\_Insurance\_Class type="string"></Disease\_Insurance\_Class>  
				<Disease\_Name type="string"></Disease\_Name>  
				<Disease\_Single type="array">  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">7808004</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">(101</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">2057</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">1045</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">C001</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">2057</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">1066</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">C001</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">7207</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
					<Disease\_Single\_child type="record">  
						<Disease\_Single\_Code type= "string">(201</Disease\_Single\_Code>  
						<Disease\_Single\_Name type= "string"></Disease\_Single\_Name>  
					</Disease\_Single\_child>  
				</Disease\_Single>  
				<Disease\_Supplement\_Name type="string"></Disease\_Supplement\_Name>  
				<Disease\_Supplement\_Single type="array">  
					<Disease\_Supplement\_Single\_child type="record">  
						<Disease\_Supplement\_Single\_Code type= "string"></Disease\_Supplement\_Single\_Code>  
					</Disease\_Supplement\_Single\_child>  
				</Disease\_Supplement\_Single>  
				<Disease\_InOut type="string"></Disease\_InOut>  
				<Disease\_Category type="string"></Disease\_Category>  
				<Disease\_SuspectedFlag type="string"></Disease\_SuspectedFlag>  
				<Disease\_AcuteFlag type="string">A</Disease\_AcuteFlag>  
				<Disease\_StartDate type="string">2018-05-01</Disease\_StartDate>  
				<Disease\_EndDate type="string"></Disease\_EndDate>  
				<Disease\_OutCome type="string"></Disease\_OutCome>  
				<Disease\_Karte\_Name type="string"></Disease\_Karte\_Name>  
				<Disease\_Class type="string"></Disease\_Class>  
				<Insurance\_Combination\_Number type="string"></Insurance\_Combination\_Number>  
				<Disease\_Receipt\_Print type="string"></Disease\_Receipt\_Print>  
				<Disease\_Receipt\_Print\_Period type="string"></Disease\_Receipt\_Print\_Period>  
				<Insurance\_Disease type="string"></Insurance\_Disease>  
				<Discharge\_Certificate type="string"></Discharge\_Certificate>  
				<Main\_Disease\_Class type="string"></Main\_Disease\_Class>  
				<Sub\_Disease\_Class type="string"></Sub\_Disease\_Class>  
			</Disease\_Information\_child>  
		</Disease\_Information>  
  
	</diseasereq>  
</data>  
EOF  
  
  
req.content\_length = BODY.size  
req.content\_type = CONTENT\_TYPE  
req.body = BODY  
req.basic\_auth(USER, PASSWD)  
  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  
  res = http.request(req)  
  puts res.body  
}   

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| E01 | 患者番号が未設定です。 |
| E04 | 電子カルテＵＩＤが未設定です。 |
| E05 | オルカＵＩＤが未設定です。 |
| E10 | 患者番号に該当する患者が存在しません。 |
| E13 | 診療科が存在しません。 |
| E16 | 開始日が暦日ではありません。 |
| E17 | 転帰日が暦日ではありません。 |
| E18 | 医保分でしか設定できない値です。 |
| E19 | 保険組合せ番号が存在しません。 |
| E20 | 保険区分の設定と異なる保険組合せ番号です。 |
| E21 | 保険区分の設定と異なる保険組合せ番号です。 |
| E22 | 保険組合せ番号の設定に誤りがあります。(数値以外他) |
| E23 | 同名の病名がXXXに複数存在します。 |
| E24 | 同名の病名がXXXに３件以上存在します。 |
| E25 | 第三者行為が存在しません。 |
| E26 | 開始日が第三者行為の適用日の範囲外です。 |
| E27 | 開始日が保険組合せ番号の適用日の範囲外です。 |
| E28 | 保険組合せ番号が存在しません。 |
| E29 | 第三者行為が存在しません。 |
| E31 | 同名の病名がXXXXXXXXXXXに存在します。（転帰日等を確認して下さい）。 |
| E33 | 病名コードが不正です。 |
| E34 | 補足コメントコードが不正です。 |
| E36 | 削除対象の病名がありません。 |
| E40 | 警告がある病名が存在します。 |
| E41 | 病名の設定がありません。 |
| E42 | 登録出来ない病名が存在します。 |
| E89 | 職員情報が取得できません。 |
| 医療機関情報が取得できません。 |
| システム日付が取得できません。 |
| 患者番号構成情報が取得できません。 |
| グループ医療機関が不整合です。処理を終了して下さい。 |
| システム項目が設定できません。 |
| E90 | 他端末で使用中です。 |
| E91 | リクエスト番号が不正です。 |
| E97 | 送信内容に誤りがあります。 |
| E98 | 送信内容の読込ができませんでした。 |
| E99 | ユーザＩＤが未登録です。 |

警告メッセージ一覧
---------

| エラーコード | 警告メッセージ |
| --- | --- |
| W01 | 廃止・移行先・推奨のある病名が存在します。 |
| W02 | 単独使用禁止病名です。 |
| W03 | 全角チェックでエラーとなる文字が病名に存在します。 |
| W04 | 病名に改行コードが存在します。 |
| W05 | 全角チェックでエラーとなる文字が補足コメントに存在します。 |
| W06 | 補足コメントに改行コードが存在します。 |
| W07 | 全角チェックでエラーとなる文字がカルテ病名に存在します。 |
| W08 | カルテ病名に改行コードが存在します。 |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 患者病名登録２

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html#wrapper)

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
