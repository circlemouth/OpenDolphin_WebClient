[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#content)

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
 > 入院患者医療区分・ADL点数登録

入院患者医療区分・ADL点数登録
================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#response)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#errmsg)
      
    

更新履歴
----

 2020-03-24   「リクエスト一覧」の項目を修正。

 2018-09-25   「リクエスト一覧」に項目を追加。  
 　　　　　　　「レスポンス一覧」に項目を追加。

 2018-03-26   「リクエスト一覧」の項目を修正。  
 　　　　　　　「レスポンス一覧」の項目を修正。  

 2017-03-14   「エラーメッセージ一覧」を追加。

 2016-04-18   「リクエスト一覧」の項目を修正。  
 　　　　　　　「レスポンス一覧」の項目を修正。  

概要
--

POSTメソッドによる入院患者医療区分およびADL点数の登録を行います。

日レセ Ver.4.7.0\[第\*\*回パッチ適用\] 以降  

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_hsptevalmod\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_hsptevalmod\_v2.rb 内の患者番号等を指定します。
3.  ruby sample\_hsptevalmod\_v2.rb により接続。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca32/hsptevalmodv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>    <private\_objects type\="record"\>        <Save\_Request type\="string"\>0</Save\_Request>        <Patient\_ID type\="string"\>12</Patient\_ID>        <Admission\_Date type\="string"\>2014-06-10</Admission\_Date>        <Perform\_Date type\="string"\>2014-06-26</Perform\_Date>        <Medical\_Condition type\="array"\>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>1</ID>                <Evaluation type\="string"\>1</Evaluation>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>2</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>3</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>4</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>5</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>6</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>7</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>8</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>9</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>10</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>11</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>12</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>13</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>14</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>15</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>16</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>17</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>18</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>19</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>20</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>21</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>22</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>23</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>24</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>25</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>26</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>27</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>28</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>29</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>30</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>31</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>32</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>33</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>34</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>35</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>36</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>37</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>91</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>        </Medical\_Condition>        <ADL\_Score type\="array"\>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>a</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>b</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>c</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>d</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>        </ADL\_Score>    </private\_objects>  
</data>  

### 処理概要

日レセに設定されている入院患者の医療区分、ADL点数の登録を行います。  

### 処理詳細

レスポンスサンプル
---------

<xmlio2>  <private\_objects type\="record"\>    <Information\_Date type\="string"\>2014-06-26</Information\_Date>    <Information\_Time type\="string"\>13:45:59</Information\_Time>    <Api\_Results type\="array"\>      <Api\_Results\_child type\="record"\>        <Api\_Result type\="string"\>00</Api\_Result>      </Api\_Results\_child>    </Api\_Results>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00012</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>    </Patient\_Information>    <Admission\_Discharge\_Date type\="array"\>      <Admission\_Discharge\_Date\_child type\="record"\>        <Admission\_Date type\="string"\>2014-06-03</Admission\_Date>        <Discharge\_Date type\="string"\>9999-12-31</Discharge\_Date>      </Admission\_Discharge\_Date\_child>    </Admission\_Discharge\_Date>    <Perform\_Month type\="string"\>2014-06</Perform\_Month>    <ADL\_Score type\="array"\>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>a</ID>        <Name type\="string"\>ａ　ベッドの可動性</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>b</ID>        <Name type\="string"\>ｂ　移乗</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>c</ID>        <Name type\="string"\>ｃ　食事</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Evaluation\_Daily>      </ADL\_Score\_child>      <ADL\_Score\_child type\="record"\>        <ID type\="string"\>d</ID>        <Name type\="string"\>ｄ　トイレの使用</Name>        <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Evaluation\_Daily>      </ADL\_Score\_child>    </ADL\_Score>    <Medical\_Condition\_Level\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Medical\_Condition\_Level\_Daily>    <ADL\_Total\_Score\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</ADL\_Total\_Score\_Daily>    <Patient\_Condition type\="record"\>      <Evaluation\_Daily type\="string"\>,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,</Evaluation\_Daily>    </Patient\_Condition>  </private\_objects>  
</xmlio2>

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Save\_Request | リクエスト保持区分(日レセにリクエストの情報を保持するか否かを指定)  <br>（0：残さない、1：残す） | 1   | 未設定時は初期値\[0\]を設定 |
| 2   | Patient\_ID | 患者番号 | 12  | 必須  |
| 3   | Admission\_Date | 入院日 | 2014-06-10 | 必須  |
| 4   | Perform\_Date | 診療日 | 2014-06-26 | 省略時はシステム日付の属する年月日を設定 |
| 5   | Medical\_Condition | 医療区分情報  <br>（繰り返し　５０） |     | 変更(2018-03-26) |
| 5-1 | ID  | 医療区分項目の番号   <br>　1：２４時間持続して点滴を実施している状態   <br>　2：尿路感染症に対する治療を実施している状態   <br>　.   <br>　.   <br>　38：酸素療法を実施している状態(17を除く。)   <br>　39:86に該当、かつ、1〜38（12を除く。）に該当しない場合  <br>　81:脱水に対する治療を実施している状態  <br>　82:頻回の嘔吐に対する治療をしている状態  <br>　83:発熱がある状態  <br>　84:経鼻胃管や胃瘻等の経腸栄養が行われている状態  <br>　85:気管切開又は気管内挿管が行われている状態  <br>　86:医師及び看護職員により、常時、監視及び管理を実施している状態  <br>　87:中心静脈カテーテル関連血流感染症に対して治療を実施している状態  <br>　91:身体抑制を実施している状態 | 1   | 必須  <br>  <br>変更(2018-03-26)  <br>  <br>87を追加(2020-03-24) |
| 5-2 | Evaluation | 医療区分項目状態  <br>（0：該当しない、1：該当する） | 1   | 頻回が定められていない項目は必ず設定すること。  <br>頻回が定められていない項目以外の項目については\[状態\]若しくは\[複数日指定\]の項目のいずれかを必ず設定すること。 |
| 5-3 | Evaluation\_Daily | 医療区分項目複数日設定　※1 | ,,,,,,,,,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, | 頻度が定められていない項目は未使用とする |
| 6   | ADL\_Score | ADL点数情報  <br>（繰り返し　４） |     |     |
| 6-1 | ID  | "a"、"b"、"c"、"d" | a   | 必須  |
| 6-2 | Evaluation | ADL項目点数  <br>（0〜6点） | 1   | 必須  <br>ADL点数、複数日指定のいずれかを必ず指定すること |
| 6-3 | Evaluation\_Daily | ADL項目複数日設定　※1 | ,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2, |     |
| 7   | Designr\_Total\_Score\_Daily | DESIGN-Rの合計点（深さの点数は加えない）  <br>※２ | ,,,,,,,,,,,,,,,,0,-,2,,,,,,,,,,,, | 追加(2018-09-25) |

※１：カンマ区切りで３１日分設定します。  
　　　値が設定されていない日にちの内容の変更は行いません（既に設定されている内容を保持します）。  
　　　月の日にちが３１日に満たない場合でも３１日分として設定します（満たない部分はカンマのみの編集を行います）。

※２　カンマ区切りで31日分設定します。  
　　　値が設定されていない日にちの内容の変更は行いません（既に設定されている内容を保持します）。  
　　　値が設定されている日にちの内容を未設定とする場合、半角マイナス(“-”)を設定します。  
　　　月の日にちが31日に満たない場合でも31日分として設定します（満たない部分はカンマのみの編集を行います）。

※入院会計の療養病棟入院基本料（有床診療所療養病床入院基本料）は医療区分及びADL区分に従って更新されます。

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-06-26 |     |
| 2   | Information\_Time | 実施時間 | 13:45:59 |     |
| 3   | Api\_Results | 結果情報（繰り返し　１０） |     |     |
| 3-1 | Api\_Result | 結果コード（ゼロ以外エラー） | 00  |     |
| 3-2 | Api\_Result\_Message | エラーメッセージ |     |     |
| 4   | Patient\_Information | 患者情報 |     |     |
| 4-1 | Patient\_ID | 患者番号 | 00012 |     |
| 4-2 | WholeName | 漢字氏名 | 日医　太郎 |     |
| 4-3 | WholeName\_inKana | カナ氏名 | ニチイ　タロウ |     |
| 4-4 | BirthDate | 生年月日 | 1975-01-01 |     |
| 4-5 | Sex | 性別（1:男性、2:女性） | 1   |     |
| 5   | Admission\_Discharge\_Date | 診療年月にかかる入退院日情報（繰り返し　５） |     |     |
| 5-1 | Admission\_Date | 入院日 | 2014-06-10 |     |
| 5-2 | Discharge\_Date | 退院日 | 9999-12-31 |     |
| 6   | Perform\_Month | 診療年月 | 2014-06 |     |
| 7   | Medical\_Condition | 医療区分情報（繰り返し　５０） |     | 変更(2018-03-26) |
| 7-1 | Level | 医療区分コード  <br>（3:医療区分３、  <br>　2:医療区分２、  <br>　1:医療区分３・２に該当しない場合） | 2   |     |
| 7-2 | ID  | 医療区分の項目番号  <br>（M3:医療区分３の該当有無、  <br>　M2:医療区分２の該当有無、  <br>　M1:医療区分１、  <br>　他...） | 2   |     |
| 7-3 | Name | 医療区分の項目名称 | ２　尿路感染症に対する治療を実施 |     |
| 7-4 | Evaluation\_Month | 頻度が定められていない項目の状態該当有無を"1"、"0"で返却 |     |     |
| 7-5 | Evaluation\_Daily | 各日の評価をカンマ区切りで返却  <br>（該当する場合は"1"、該当しない場合は"0"） | ,,,,,,,,,,,,,,1,1,,,,,,,,,,,,,,, |     |
| 8   | ADL\_Score | ADL点数情報（繰り返し　４） |     |     |
| 8-1 | ID  | "a"、"b"、"c"、"d" | a   |     |
| 8-2 | Name | 評価項目の名称 | a　ベッドの可動性 |     |
| 8-3 | Evaluation\_Daily | 各日の点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,1,1,1,,1,1,1,1,0,0,0,0,0,0,0,0,0 |     |
| 9   | Medical\_Condition\_Level\_Daily | 日毎の医療区分をカンマ区切りで返却 | ,,,,,,,,,,,,,,2,2,1,,2,2,2,1,1,1,1,1,1,1,1,1,1 |     |
| 10  | ADL\_Total\_Score\_Daily | 日毎のADLの合計点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,2,2,2,,2,2,2,2,1,1,1,1,1,1,1,1,1 |     |
| 11  | Patient\_Condition | 患者の状態評価 |     |     |
| 11-1 | Evaluation\_Daily | 日毎の患者の状態評価をカンマ区切りで返却 | ,,,,,,,,,,,,,,C,C,E,,C,C,C,E,E,E,E,E,E,E,E,E,E |     |
| 12  | Designr\_Total\_Score\_Daily | DESIGN-Rの合計点（深さの点数は加えない）  <br>日毎の点数をカンマ区切りで返却 | ,,,,,,,,,,,,,,,,0,,2,,,,,,,,,,,, | 追加(2018-09-25) |

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
      
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    

[sample\_hsptevalmod\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_hsptevalmod_v2.rb)

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ 医療区分・ＡＤＬ点数登録  
  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca32/hsptevalmodv2")BODY \= <<EOF

<data>    <private\_objects type\="record"\>        <Save\_Request type\="string"\>1</Save\_Request>        <Patient\_ID type\="string"\>1</Patient\_ID>        <Admission\_Date type\="string"\>2014-06-10</Admission\_Date>        <Perform\_Date type\="string"\>2014-06-10</Perform\_Date>        <Medical\_Condition type\="array"\>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>1</ID>                <Evaluation type\="string"\>1</Evaluation>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>2</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>3</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>4</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>5</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>6</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>7</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>8</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>9</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>10</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>11</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>12</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>13</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>14</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>15</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>16</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>17</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>18</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>19</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>20</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>21</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>22</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>23</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>24</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>25</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>26</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>27</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>28</ID>                <Evaluation type\="string"\>0</Evaluation>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>29</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>30</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>31</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>32</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>33</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>34</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>35</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>36</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>37</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>            <Medical\_Condition\_child type\="record"\>                <ID type\="string"\>91</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,</Evaluation\_Daily>            </Medical\_Condition\_child>        </Medical\_Condition>        <ADL\_Score type\="array"\>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>a</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>b</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>c</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>            <ADL\_Score\_child type\="record"\>                <ID type\="string"\>d</ID>                <Evaluation\_Daily type\="string"\>,,,,,,,,,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,6,4,2,</Evaluation\_Daily>            </ADL\_Score\_child>        </ADL\_Score>    </private\_objects>  
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

入院登録([https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg](https://www.orca.med.or.jp/receipt/tec/api/hospentry.html#errmsg)
)を参照。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 入院患者医療区分・ADL点数登録

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/hospadlentry.html#wrapper)

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
