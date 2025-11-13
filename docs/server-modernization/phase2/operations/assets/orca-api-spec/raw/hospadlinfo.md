[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#content)

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
 > 入院患者医療区分・ADL点数情報

入院患者医療区分・ADL点数情報  

===================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#response)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#errmsg)
      
    

更新履歴
----

 2023-10-26   「レスポンス一覧」に項目を追加。

 2018-09-25   「レスポンス一覧」に項目を追加。

 2018-03-26   「レスポンス一覧」の項目を修正。

 2016-04-18   「レスポンス一覧」の項目を修正。  

概要
--

POSTメソッドによる入院患者医療区分およびADL点数情報の取得を行います。

日レセ Ver.4.7.0\[第19回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hspteval\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hspteval\_v2.rb 内の患者番号等を指定します。
3.  ruby sample\_hspteval\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/hsptevalv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

  

<data>        <private\_objects type\="record"\>                <Patient\_ID type\="string"\>40024</Patient\_ID>                <Perform\_Month type\="string"\>2013-10</Perform\_Month>        </private\_objects>  
</data>

### 処理概要

日レセに設定されている入院患者の医療区分、ADLの詳細内容を返却します。  

  

### 処理詳細

1.  診療年月の妥当性チェック（未設定の場合は、システム日付を設定）
2.  患者番号の存在チェック  
    

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2013-10-23</Information\_Date>    <Information\_Time type\="string"\>15:46:54</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>40024</Patient\_ID>      <WholeName type\="string"\>テスト　一郎</WholeName>      <WholeName\_inKana type\="string"\>テスト　イチロウ</WholeName\_inKana>      <BirthDate type\="string"\>1925-03-10</BirthDate>      <Sex type\="string"\>2</Sex>    </Patient\_Information>    <Admission\_Discharge\_Date type\="array"\>      <Admission\_Discharge\_Date\_child type\="record"\>        <Admission\_Date type\="string"\>2013-10-15</Admission\_Date>        <Discharge\_Date type\="string"\>2013-10-17</Discharge\_Date>      </Admission\_Discharge\_Date\_child>      <Admission\_Discharge\_Date\_child type\="record"\>        <Admission\_Date type\="string"\>2013-10-19</Admission\_Date>        <Discharge\_Date type\="string"\>9999-12-31</Discharge\_Date>      </Admission\_Discharge\_Date\_child>    </Admission\_Discharge\_Date>    <Perform\_Month type\="string"\>2013-10</Perform\_Month>    <Medical\_Condition type\="array"\>      <Medical\_Condition\_child type\="record"\>        <Level type\="string"\>2</Level>        <ID type\="string"\> 2</ID>        <Name type\="string"\>　２　尿路感染症に対する治療を実施</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,1,1,,,,,,,,,,,,,,,</Evaluation\_Daily>      </Medical\_Condition\_child>      <Medical\_Condition\_child type\="record"\>        <Level type\="string"\>2</Level>        <ID type\="string"\> 3</ID>        <Name type\="string"\>　３　傷病等によりリハビリテーションが必要な状態</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,1,1,1,,,,,,,,,,</Evaluation\_Daily>      </Medical\_Condition\_child>      <Medical\_Condition\_child type\="record"\>        <Level type\="string"\>2</Level>        <ID type\="string"\>M2</ID>        <Name type\="string"\>医療区分２の該当有無</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,1,1,,,1,1,1,,,,,,,,,,</Evaluation\_Daily>      </Medical\_Condition\_child>      <Medical\_Condition\_child type\="record"\>        <Level type\="string"\>1</Level>        <ID type\="string"\>M1</ID>        <Name type\="string"\>医療区分３・２いずれも０（医療区分１）</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,1,,,,,1,1,1,1,1,1,1,1,1,1</Evaluation\_Daily>      </Medical\_Condition\_child>    </Medical\_Condition>    <ADL\_Score type\="array"\>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>a</ID>        <Name type\="string"\>ａ　ベッドの可動性</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,1,1,1,,1,1,1,1,0,0,0,0,0,0,0,0,0</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>b</ID>        <Name type\="string"\>ｂ　移乗</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,0,0,0,,0,0,0,0,0,0,0,0,0,0,0,0,0</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>c</ID>        <Name type\="string"\>ｃ　食事</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,1,1,1,,1,1,1,1,1,1,1,1,1,1,1,1,1</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>d</ID>        <Name type\="string"\>ｄ　トイレの使用</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,0,0,0,,0,0,0,0,0,0,0,0,0,0,0,0,0</Evaluation\_Daily>      </ADL\_Score\_child>    </ADL\_Score>    <Medical\_Condition\_Level\_Daily type\="string"\>,,,,,,,,,,,,,,2,2,1,,2,2,2,1,1,1,1,1,1,1,1,1,1</Medical\_Condition\_Level\_Daily>    <ADL\_Total\_Score\_Daily type\="string"\>,,,,,,,,,,,,,,2,2,2,,2,2,2,2,1,1,1,1,1,1,1,1,1</ADL\_Total\_Score\_Daily>    <Patient\_Condition type\="record"\>      <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,C,C,E,,C,C,C,E,E,E,E,E,E,E,E,E,E</Evaluation\_Daily>      <Evaluation\_Difference type\="string"\>,,,,,,,,,,,,,,C,C,C,,B,B,B,B,B,B,B,B,B,B,B,B,B</Evaluation\_Difference>      <Evaluation\_Class type\="string"\>,,,,,,,,,,,,,,C,C,C,,B,B,B,B,B,B,B,B,B,B,B,B,B</Evaluation\_Class>    </Patient\_Condition>  </private\_objects>  
</xmlio2>

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Patient\_ID | 患者番号 | 40024 |     |
| 2   | Perform\_Month | 診療年月 | 2013-10 | 未設定時はシステム日付を設定 |

  

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2013-10-23 |     |
| 2   | Information\_Time | 実施時間 | 15:46:54 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Patient\_Information | 患者情報 |     |     |
| 5-1 | Patient\_ID | 患者番号 | 40024 |     |
| 5-2 | WholeName | 漢字氏名 | テスト　一郎 |     |
| 5-3 | WholeName\_inKana | カナ氏名 | テスト　イチロウ |     |
| 5-4 | BirthDate | 生年月日 | 1925-03-10 |     |
| 5-5 | Sex | 性別（1:男性、2:女性） | 2   |     |
| 6   | Admission\_Discharge\_Date | 診療年月にかかる入退院日情報（繰り返し　５） |     |     |
| 6-1 | Admission\_Date | 入院日 | 2013-10-15 |     |
| 6-2 | Discharge\_Date | 退院日 | 2013-10-17 |     |
| 7   | Perform\_Month | 診療年月 | 2013-10 |     |
| 8   | Medical\_Condition | 医療区分情報（繰り返し　５０） |     | 変更(2018-03-26) |
| 8-1 | Level | 医療区分コード  <br>（3:医療区分３、  <br>2:医療区分２、  <br>1:医療区分３・２に該当しない場合） | 2   |     |
| 8-2 | ID  | 医療区分の項目番号  <br>（M3:医療区分３の該当有無、  <br>M2:医療区分２の該当有無、  <br>M1:医療区分１、  <br>他...） | 2   |     |
| 8-3 | Name | 医療区分の項目名称 | ２　尿路感染症に対する治療を実施 |     |
| 8-4 | Evaluation\_Month | 頻度が定められていない項目の状態該当有無を"1"、"0"で返却 |     |     |
| 8-5 | Evaluation\_Daily | 各日の評価をカンマ区切りで返却  <br>（該当する場合は"1"、該当しない場合は"0"） | ,,,,,,,,,,,,,,1,1,,,,,,,,,,,,,,, |     |
| 9   | ADL\_Score | ADL点数情報（繰り返し　４） |     |     |
| 9-1 | ID  | "a"、"b"、"c"、"d" | a   |     |
| 9-2 | Name | 評価項目の名称 | a　ベッドの可動性 |     |
| 9-3 | Evaluation\_Daily | 各日の点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,1,1,1,,1,1,1,1,0,0,0,0,0,0,0,0,0 |     |
| 10  | Medical\_Condition\_Level\_Daily | 日毎の医療区分をカンマ区切りで返却 | ,,,,,,,,,,,,,,2,2,1,,2,2,2,1,1,1,1,1,1,1,1,1,1 |     |
| 11  | ADL\_Total\_Score\_Daily | 日毎のADLの合計点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,2,2,2,,2,2,2,2,1,1,1,1,1,1,1,1,1 |     |
| 12  | Patient\_Condition | 患者の状態評価 |     |     |
| 12-1 | Evaluation\_Daily | 日毎の患者の状態評価をカンマ区切りで返却 | ,,,,,,,,,,,,,,C,C,E,,C,C,C,E,E,E,E,E,E,E,E,E,E |     |
| 12-2 | Evaluation\_Difference | 日レセの入院基本料の区分が患者の状態評価と一致しない場合、日レセの入院基本料の区分をカンマ区切りで返却 | ,,,,,,,,,,,,,,C,C,C,,B,B,B,B,B,B,B,B,B,B,B,B,B |     |
| 12-3 | Evaluation\_Difference | 日レセで算定されている入院料の区分を返却 | ,,,,,,,,,,,,,,C,C,C,,B,B,B,B,B,B,B,B,B,B,B,B,B | 追加(2023-10-26) |
| 13  | Designr\_Total\_Score\_Daily | DESIGN-Rの合計点（深さの点数は加えない）  <br>日毎の点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,,,0,1,2,,,,,,,,,,,, | 追加(2018-09-25) |

 

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

[sample\_hspteval\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hspteval_v2.rb)
 

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 入院患者基本区分・ADL点数情報返却  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api01rv2/hsptevalv2")  
#  
\# 1.患者番号        Patient\_ID      (REQUIRED)  
\# 2.診療年月        Perform\_Month   (IMPLIED)  
#  
\# REQUIRED : 必須  IMPLIED : 任意  
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

| エラーコード | エラーメッセージ | 備考  |
| --- | --- | --- |
| 00  | 処理終了 |     |
| 01  | 診療年月の設定に誤りがあります |     |
| 02  | 患者番号の設定に誤りがあります |     |
| 03  | 入退院情報の取得に失敗しました |     |
| 04  | 入院会計情報の取得に失敗しました |     |
| 05  | 医療区分・ADL点数情報の取得に失敗しました |     |
| 06  | 療養病棟入院基本料が算定されていません | 病院の場合 |
| 有床診療所療養病床入院基本料が算定されていません | 有床診療所の場合 |
| 89  | 職員情報が取得できません |     |
| 医療機関情報が取得できません |     |
| システム日付が取得できません |     |
| 患者番号構成情報が取得できません |     |
| グループ医療機関が不整合です。処理を終了して下さい |     |
| システム項目が設定できません |     |
| 92  | 診療年月は平成２４年（２０１２年）４月以降を指定してください |     |
| 97  | 送信内容に誤りがあります |     |
| 98  | 送信内容の読込ができませんでした |     |
| 99  | ユーザIDが未登録です |     |
| それ以外 | 返却情報の編集でエラーが発生しました |     |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院患者医療区分・ADL点数情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospadlinfo.html#wrapper)

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
