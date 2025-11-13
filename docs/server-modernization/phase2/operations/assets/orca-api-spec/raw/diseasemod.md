[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#content)

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
 > 患者病名登録

患者病名登録  

=========

_この患者病名登録は、いずれ廃止となります。[患者病名登録2](https://www.orca.med.or.jp/receipt/tec/api/diseasemod2.html)
を使用してください  
※ 補足コメント名称を統一したものとしてリリースしています。_

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#errmsg)
    
*   [警告メッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#warnmsg)
      
    

更新履歴
----

概要
--

POSTメソッドによる該当患者の病名データの追加、変更および削除を行います。

日レセ Ver.5.0.0\[第9回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_diseasev2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_diseasev2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_diseasev2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca22/diseasev2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>        <diseasereq type\="record"\>                <Patient\_ID type\="string"\>00156</Patient\_ID>                <Perform\_Date type\="string"\>2017-05-18</Perform\_Date>                <Perform\_Time type\="string"\>01:01:01</Perform\_Time>                <Diagnosis\_Information type\="record"\>                        <Department\_Code type\="string"\>01</Department\_Code>                </Diagnosis\_Information>                <Disease\_Information type\="array"\>                        <Disease\_Information\_child type\="record"\>                                <Disease\_Insurance\_Class type\="string"\></Disease\_Insurance\_Class>                                <Disease\_Single type\="array"\>                                        <Disease\_Single\_child type\="record"\>                                                <Disease\_Single\_Code type\= "string"\>8830417</Disease\_Single\_Code>                                                <Disease\_Single\_Name type\= "string"\></Disease\_Single\_Name>                                        </Disease\_Single\_child>                                        <Disease\_Single\_child type\="record"\>                                                <Disease\_Single\_Code type\= "string"\>ZZZ8002</Disease\_Single\_Code>                                                <Disease\_Single\_Name type\= "string"\></Disease\_Single\_Name>                                        </Disease\_Single\_child>                                </Disease\_Single>                                <Disease\_Supplement type\="record"\>                                        <Disease\_Scode1 type\= "string"\></Disease\_Scode1>                                        <Disease\_Scode2 type\= "string"\></Disease\_Scode2>                                        <Disease\_Scode3 type\= "string"\></Disease\_Scode3>                                        <Disease\_Sname type\= "string"\></Disease\_Sname>                                </Disease\_Supplement>                                <Disease\_InOut type\="string"\>O</Disease\_InOut>                                <Disease\_Category type\="string"\></Disease\_Category>                                <Disease\_SuspectedFlag type\="string"\></Disease\_SuspectedFlag>                                <Disease\_StartDate type\="string"\>2017-03-07</Disease\_StartDate>                                <Disease\_EndDate type\="string"\></Disease\_EndDate>                                <Disease\_OutCome type\="string"\></Disease\_OutCome>                                <Disease\_Karte\_Name type\="string"\></Disease\_Karte\_Name>                                <Disease\_Class type\="string"\></Disease\_Class>                                <Insurance\_Combination\_Number type\="string"\>None</Insurance\_Combination\_Number>                                <Disease\_Receipt\_Print type\="string"\></Disease\_Receipt\_Print>                                <Disease\_Receipt\_Print\_Period type\="string"\></Disease\_Receipt\_Print\_Period>                                <Insurance\_Disease type\="string"\></Insurance\_Disease>                                <Discharge\_Certificate type\="string"\></Discharge\_Certificate>                                <Main\_Disease\_Class type\="string"\></Main\_Disease\_Class>                                <Sub\_Disease\_Class type\="string"\></Sub\_Disease\_Class>                        </Disease\_Information\_child>                        <Disease\_Information\_child type\="record"\>                                <Disease\_Insurance\_Class type\="string"\></Disease\_Insurance\_Class>                                <Disease\_Code type\="string"\>2049.7274044.8002</Disease\_Code>                                <Disease\_Name type\="string"\>左ガングリオンの疑い</Disease\_Name>                                <Disease\_Single type\="record"\>                                        <Disease\_Single\_child type\="record"\>                                                <Disease\_Single\_Code type\= "string"\></Disease\_Single\_Code>                                                <Disease\_Single\_Name type\= "string"\></Disease\_Single\_Name>                                        </Disease\_Single\_child>                                </Disease\_Single>                                <Disease\_Supplement type\="record"\>                                        <Disease\_Scode1 type\= "string"\></Disease\_Scode1>                                        <Disease\_Scode2 type\= "string"\></Disease\_Scode2>                                        <Disease\_Scode3 type\= "string"\></Disease\_Scode3>                                        <Disease\_Sname type\= "string"\></Disease\_Sname>                                </Disease\_Supplement>                                <Disease\_InOut type\="string"\></Disease\_InOut>                                <Disease\_Category type\="string"\></Disease\_Category>                                <Disease\_SuspectedFlag type\="string"\></Disease\_SuspectedFlag>                                <Disease\_StartDate type\="string"\>2017-03-10</Disease\_StartDate>                                <Disease\_EndDate type\="string"\></Disease\_EndDate>                                <Disease\_OutCome type\="string"\></Disease\_OutCome>                                <Disease\_Karte\_Name type\="string"\></Disease\_Karte\_Name>                                <Disease\_Class type\="string"\></Disease\_Class>                                <Insurance\_Combination\_Number type\="string"\></Insurance\_Combination\_Number>                                <Disease\_Receipt\_Print type\="string"\></Disease\_Receipt\_Print>                                <Disease\_Receipt\_Print\_Period type\="string"\></Disease\_Receipt\_Print\_Period>                                <Insurance\_Disease type\="string"\></Insurance\_Disease>                                <Discharge\_Certificate type\="string"\></Discharge\_Certificate>                                <Main\_Disease\_Class type\="string"\></Main\_Disease\_Class>                                <Sub\_Disease\_Class type\="string"\></Sub\_Disease\_Class>                        </Disease\_Information\_child>                </Disease\_Information>        </diseasereq>  
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
    <Information\_Date type="string">2017-05-22</Information\_Date>  
    <Information\_Time type="string">14:30:31</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">処理実施終了</Api\_Result\_Message>  
    <Reskey type="string">Acceptance\_Info</Reskey>  
    <Perform\_Date type="string">2017-05-18</Perform\_Date>  
    <Perform\_Time type="string">01:01:01</Perform\_Time>  
    <Department\_Code type="string">01</Department\_Code>  
    <Department\_Name type="string">内科</Department\_Name>  
    <Patient\_ID type="string">00126</Patient\_ID>  
    <Base\_Month type="string">2017-05</Base\_Month>  
    <Disease\_Message\_Information type="array">  
      <Disease\_Message\_Information\_child type="record">  
        <Disease\_Result type="string">E36</Disease\_Result>  
        <Disease\_Result\_Message type="string">削除対象の病名がありません。</Disease\_Result\_Message>  
        <Disease\_Warning\_Info type="record">  
          <Disease\_Warning\_Item\_Position type="string">01</Disease\_Warning\_Item\_Position>  
          <Disease\_Warning\_StartDate type="string">2017-03-07</Disease\_Warning\_StartDate>  
          <Disease\_Warning\_Name type="string">左膝ガングリオンの疑い</Disease\_Warning\_Name>  
          <Disease\_Warning\_Code type="string">2049.7274039.8002</Disease\_Warning\_Code>  
        </Disease\_Warning\_Info>  
      </Disease\_Message\_Information\_child>  
    </Disease\_Message\_Information>  
    <Disease\_Unmatch\_Information type="record">  
      <Disease\_Unmatch\_Information\_Overflow type="string">False</Disease\_Unmatch\_Information\_Overflow>  
      <Disease\_Unmatch\_Info type="array">  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">3023.3723001</Disease\_Code>  
          <Disease\_Name type="string">感染性結膜炎</Disease\_Name>  
          <Disease\_SuspectedFlag type="string">1</Disease\_SuspectedFlag>  
          <Disease\_StartDate type="string">2009-02-16</Disease\_StartDate>  
          <Disease\_EndDate type="string">2009-04-14</Disease\_EndDate>  
          <Disease\_OutCome type="string">1</Disease\_OutCome>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">4042.4273006</Disease\_Code>  
          <Disease\_Name type="string">発作性心房細動</Disease\_Name>  
          <Disease\_Category type="string">PD</Disease\_Category>  
          <Disease\_StartDate type="string">2009-04-14</Disease\_StartDate>  
          <Disease\_Class type="string">05</Disease\_Class>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8830417.8002</Disease\_Code>  
          <Disease\_Name type="string">胃炎の疑い</Disease\_Name>  
          <Disease\_SuspectedFlag type="string">1</Disease\_SuspectedFlag>  
          <Disease\_StartDate type="string">2010-07-06</Disease\_StartDate>  
          <Disease\_EndDate type="string">2010-07-28</Disease\_EndDate>  
          <Disease\_OutCome type="string">2</Disease\_OutCome>  
          <Disease\_Class type="string">05</Disease\_Class>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8830052</Disease\_Code>  
          <Disease\_Name type="string">ＡＣバイパス術後機械的合併症</Disease\_Name>  
          <Disease\_SuspectedFlag type="string">1</Disease\_SuspectedFlag>  
          <Disease\_StartDate type="string">2010-11-23</Disease\_StartDate>  
          <Disease\_EndDate type="string">2010-11-24</Disease\_EndDate>  
          <Disease\_OutCome type="string">2</Disease\_OutCome>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">0000999</Disease\_Code>  
          <Disease\_Name type="string">ブドウ球菌食中毒</Disease\_Name>  
          <Disease\_InOut type="string">O</Disease\_InOut>  
          <Disease\_StartDate type="string">2014-09-19</Disease\_StartDate>  
          <Disease\_EndDate type="string">2014-10-02</Disease\_EndDate>  
          <Disease\_OutCome type="string">2</Disease\_OutCome>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8830052</Disease\_Code>  
          <Disease\_Name type="string">ＡＣバイパス術後機械的合併症</Disease\_Name>  
          <Disease\_StartDate type="string">2014-10-03</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">5609002</Disease\_Code>  
          <Disease\_Name type="string">亜イレウス</Disease\_Name>  
          <Disease\_Supplement type="record">  
            <Disease\_Scode1 type="string">ZZZ2056</Disease\_Scode1>  
            <Disease\_Scode3 type="string">ZZZ2054</Disease\_Scode3>  
            <Disease\_Sname type="string">右片側頭部</Disease\_Sname>  
          </Disease\_Supplement>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">0948001</Disease\_Code>  
          <Disease\_Name type="string">アーガイル・ロバートソン症候群</Disease\_Name>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8830166</Disease\_Code>  
          <Disease\_Name type="string">アカントアメーバ症</Disease\_Name>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8830167.8002</Disease\_Code>  
          <Disease\_Name type="string">アカントリーゼ性障害の疑い</Disease\_Name>  
          <Disease\_SuspectedFlag type="string">1</Disease\_SuspectedFlag>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">0069007</Disease\_Code>  
          <Disease\_Name type="string">アカントアメーバ角膜炎</Disease\_Name>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">0000999</Disease\_Code>  
          <Disease\_Name type="string">１２３４５６７８９０１２３４</Disease\_Name>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
        </Disease\_Unmatch\_Info\_child>  
        <Disease\_Unmatch\_Info\_child type="record">  
          <Disease\_Code type="string">8845154</Disease\_Code>  
          <Disease\_Name type="string">高クレアチンキナーゼ血症</Disease\_Name>  
          <Disease\_StartDate type="string">2015-01-15</Disease\_StartDate>  
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
| 6-4 | Disease\_Single | 単独病名情報(繰り返し　６) |     | 必須　※１ |
| 6-4-1 | Disease\_Single\_Code | 単独病名コード |     |     |
| 6-4-2 | Disease\_Single\_Name | 単独病名 |     |     |
| 6-5 | Disease\_Supplement | 補足コメント情報 |     | ※２  |
| 6-5-1 | Disease\_Scode1 | 補足コメントコード１ |     |     |
| 6-5-2 | Disease\_Scode2 | 補足コメントコード２ |     |     |
| 6-5-3 | Disease\_Scode3 | 補足コメントコード３ |     |     |
| 6-5-4 | Disease\_Sname | 補足コメント |     |     |
| 6-6 | Disease\_InOut | 入外区分  <br>（Ｉ：入院、Ｏ：入院外、空白：入外） | O   |     |
| 6-7 | Disease\_Category | 主病フラグ  <br>（PD：主疾患） |     |     |
| 6-8 | Disease\_SuspectedFlag | 疑いフラグ  <br>（S：疑い） |     |     |
| 6-9 | Disease\_StartDate | 開始日 | 2017-02-28 | 必須  |
| 6-10 | Disease\_EndDate | 転帰日 |     |     |
| 6-11 | Disease\_OutCome | 転帰区分 |     | ※６  |
| 6-12 | Disease\_Karte\_Name | カルテ病名 |     | ※３  |
| 6-13 | Disease\_Class | 疾患区分  <br>（０３：皮膚科特定疾患指導管理料（１）、  <br>０４：皮膚科特定疾患指導管理料（２）、  <br>０５：:特定疾患療養管理料、  <br>０７：てんかん指導料、  <br>０８：特定疾患療養管理料又はてんかん指導料、  <br>０９：難病外来指導管理料） | Auto | ※４  |
| 6-14 | Insurance\_Combination\_Number | 保険組合せ番号 | 0003 | 労災、公害、自賠責、第三者行為は必須　　　 ※５ |
| 6-15 | Disease\_Receipt\_Print | レセプト表示  <br>（１：表示しない） | 1   | ※３  |
| 6-16 | Disease\_Receipt\_Print\_Period | レセプト表示期間  <br>（００〜９９） | 99  | ※３  |
| 6-17 | Insurance\_Disease | 保険病名  <br>（１：保険病名） | 1   | ※３  |
| 6-18 | Discharge\_Certificate | 退院証明書  <br>（空白または０：記載しない、１：記載する） | 0   | ※３  |
| 6-19 | Main\_Disease\_Class | 原疾患区分  <br>（０１：原疾患ア、０２：原疾患イ、  <br>０３：原疾患ウ、０４：原疾患エ、  <br>０５：原疾患オ） | 02  | ※３  |
| 6-20 | Sub\_Disease\_Class | 合併症区分  <br>（０１：アの合併症、０２：イの合併症、  <br>０３：ウの合併症、０４：エの合併症、  <br>０５：オの合併症） | 03  | ※３  |

※１：単独病名か一連病名のいずれかの設定が必要。両方に設定がある場合は単独病名を優先する。  
　　　病名コード、病名の両方に設定がある場合は病名コードを優先する。  

※２：補足コメントコード、補足コメントの両方に設定がある場合は補足コメントコードを優先する。

※３：「None」が設定してある場合、新規時は初期値を設定、更新(削除)時は更新(削除)対象としない。

※４：「None」が設定してある場合、新規時は初期値を設定、更新時は更新対象としない。  
　　　「Auto」が設定してある場合、病名コードまたは病名から自動判定した値を設定（なければ空白と同様）。  

※５：「None」が設定してある場合、新規時は初期値を設定、更新時は更新対象としない。  
　　　設定された保険組合せ番号が削除分の場合、新規または保険組合せ番号の更新時はエラーとする。  
　　　Disease\_Insurance\_Classが「１」のとき、未設定または「None」はエラーとする。  

※６：転帰区分の取り扱いについては日レセの転帰区分にあわせて以下のように置き換える。  
　　　　O：削除　　　　　疑いフラグ、開始日、病名、補足コメント、転帰日、入外区分、保険組合せ番号等完全一致したものに対し、削除フラグを設定する。  
　　　　D：死亡　　　　　２（死亡）  
　　　　F：完治　　　　　１（治ゆ）  
　　　　N：不変　　　　　３（中止）  
　　　　R：軽快　　　　　３（中止）  
　　　　S：後遺症残　　　３（中止）  
　　　　U：不明　　　　　３（中止）  
　　　　W：悪化　　　　　３（中止）  
　　　　上記以外　　　　 １（治ゆ）  

※システム管理「9000 CLAIM」の集約、同期は対応しない。

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
| 13-2-3 | Disease\_Supplement | 補足コメント情報 |     |     |
| 13-2-3-1 | Disease\_Scode1 | 補足コメントコード１ | ZZZ2056 |     |
| 13-2-3-2 | Disease\_Scode2 | 補足コメントコード２ |     |     |
| 13-2-3-3 | Disease\_Scode3 | 補足コメントコード３ | ZZZ2054 |     |
| 13-2-3-4 | Disease\_Sname | 補足コメント | 右片側頭部 |     |
| 13-2-4 | Disease\_InOut | 入外区分 |     |     |
| 13-2-5 | Disease\_Category | 主病フラグ |     |     |
| 13-2-6 | Disease\_SuspectedFlag | 疑いフラグ |     |     |
| 13-2-7 | Disease\_StartDate | 開始日 | 2015-01-15 |     |
| 13-2-8 | Disease\_EndDate | 転帰日 |     |     |
| 13-2-9 | Disease\_OutCome | 転帰区分 |     |     |
| 13-2-10 | Disease\_Karte\_Name | カルテ病名 |     |     |
| 13-2-11 | Disease\_Class | 疾患区分 |     |     |
| 13-2-12 | Insurance\_Combination\_Number | 保険組合せ番号 |     |     |
| 13-2-13 | Disease\_Receipt\_Print | レセプト表示 |     |     |
| 13-2-14 | Disease\_Receipt\_Print\_Period | レセプト表示期間 |     |     |
| 13-2-15 | Insurance\_Disease | 保険病名 |     |     |
| 13-2-16 | Discharge\_Certificate | 退院証明書 |     |     |
| 13-2-17 | Main\_Disease\_Class | 原疾患区分 |     |     |
| 13-2-18 | Sub\_Disease\_Class | 合併症区分 |     |     |

※１　正常終了：【０００】、エラーあり：【EXX】、ワーニングあり：【WＸＸ】  

※２　エラー又は警告があった病名を返却する。  

※３　基準月に有効な病名でリクエスト内に設定されていない日レセの病名情報を返却する。  
　　　(日レセにのみ存在する病名)

※４　不一致病名が51件以上ある場合：True それ以外：False  

※５　該当があれば新規登録時のみ返却する。

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

[sample\_diseasev2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_diseasev2.rb)
  

#!/usr/bin/ruby  
#-\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca22/diseasev2")  
#  
#BODY \= <<EOF  
<data>        <diseasereq type\="record"\>                <Patient\_ID type\="string"\>00156</Patient\_ID>  
                <Perform\_Date type="string">2017-05-18</Perform\_Date\>                <Perform\_Time type\="string"\>01:01:01</Perform\_Time>  
                <Diagnosis\_Information type="record">  
                        <Department\_Code type="string">01</Department\_Code\>                </Diagnosis\_Information>  
                <Disease\_Information type="array">  
                        <Disease\_Information\_child type="record">  
                                <Disease\_Insurance\_Class type="string"></Disease\_Insurance\_Class\>                                <Disease\_Single type\="array"\>                                        <Disease\_Single\_child type\="record"\>                                                <Disease\_Single\_Code type\= "string"\>8830417</Disease\_Single\_Code>  
                                                <Disease\_Single\_Name type= "string"></Disease\_Single\_Name\>                                        </Disease\_Single\_child>  
                                        <Disease\_Single\_child type="record">  
                                                <Disease\_Single\_Code type= "string">ZZZ8002</Disease\_Single\_Code\>                                                <Disease\_Single\_Name type\= "string"\></Disease\_Single\_Name\>                                        </Disease\_Single\_child>  
                                </Disease\_Single\>                                <Disease\_Supplement type\="record"\>                                        <Disease\_Scode1 type\= "string"\></Disease\_Scode1\>                                        <Disease\_Scode2 type\= "string"\></Disease\_Scode2\>                                        <Disease\_Scode3 type\= "string"\></Disease\_Scode3\>                                        <Disease\_Sname type\= "string"\></Disease\_Sname\>                                </Disease\_Supplement>  
                                <Disease\_InOut type="string">O</Disease\_InOut\>                                <Disease\_Category type\="string"\></Disease\_Category\>                                <Disease\_SuspectedFlag type\="string"\></Disease\_SuspectedFlag\>                                <Disease\_StartDate type\="string"\>2017\-03\-07</Disease\_StartDate>  
                                <Disease\_EndDate type="string"></Disease\_EndDate\>                                <Disease\_OutCome type\="string"\></Disease\_OutCome\>                                <Disease\_Karte\_Name type\="string"\></Disease\_Karte\_Name\>                                <Disease\_Class type\="string"\></Disease\_Class\>                                <Insurance\_Combination\_Number type\="string"\>None</Insurance\_Combination\_Number>  
                                <Disease\_Receipt\_Print type="string"></Disease\_Receipt\_Print\>                                <Disease\_Receipt\_Print\_Period type\="string"\></Disease\_Receipt\_Print\_Period\>                                <Insurance\_Disease type\="string"\></Insurance\_Disease\>                                <Discharge\_Certificate type\="string"\></Discharge\_Certificate\>                                <Main\_Disease\_Class type\="string"\></Main\_Disease\_Class\>                                <Sub\_Disease\_Class type\="string"\></Sub\_Disease\_Class\>                        </Disease\_Information\_child>  
                        <Disease\_Information\_child type="record">  
                                <Disease\_Insurance\_Class type="string"></Disease\_Insurance\_Class\>                                <Disease\_Code type\="string"\>2049.7274044.8002</Disease\_Code>  
                                <Disease\_Name type="string">左ガングリオンの疑い</Disease\_Name\>                                <Disease\_Single type\="record"\>                                        <Disease\_Single\_child type\="record"\>                                                <Disease\_Single\_Code type\= "string"\></Disease\_Single\_Code\>                                                <Disease\_Single\_Name type\= "string"\></Disease\_Single\_Name\>                                        </Disease\_Single\_child>  
                                </Disease\_Single\>                                <Disease\_Supplement type\="record"\>                                        <Disease\_Scode1 type\= "string"\></Disease\_Scode1\>                                        <Disease\_Scode2 type\= "string"\></Disease\_Scode2\>                                        <Disease\_Scode3 type\= "string"\></Disease\_Scode3\>                                        <Disease\_Sname type\= "string"\></Disease\_Sname\>                                </Disease\_Supplement>  
                                <Disease\_InOut type="string"></Disease\_InOut\>                                <Disease\_Category type\="string"\></Disease\_Category\>                                <Disease\_SuspectedFlag type\="string"\></Disease\_SuspectedFlag\>                                <Disease\_StartDate type\="string"\>2017\-03\-10</Disease\_StartDate>  
                                <Disease\_EndDate type="string"></Disease\_EndDate\>                                <Disease\_OutCome type\="string"\></Disease\_OutCome\>                                <Disease\_Karte\_Name type\="string"\></Disease\_Karte\_Name\>                                <Disease\_Class type\="string"\></Disease\_Class\>                                <Insurance\_Combination\_Number type\="string"\></Insurance\_Combination\_Number\>                                <Disease\_Receipt\_Print type\="string"\></Disease\_Receipt\_Print\>                                <Disease\_Receipt\_Print\_Period type\="string"\></Disease\_Receipt\_Print\_Period\>                                <Insurance\_Disease type\="string"\></Insurance\_Disease\>                                <Discharge\_Certificate type\="string"\></Discharge\_Certificate\>                                <Main\_Disease\_Class type\="string"\></Main\_Disease\_Class\>                                <Sub\_Disease\_Class type\="string"\></Sub\_Disease\_Class\>                        </Disease\_Information\_child>  
                </Disease\_Information\>        </diseasereq>  
</data\>  
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
 > 患者病名登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/diseasemod.html#wrapper)

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
