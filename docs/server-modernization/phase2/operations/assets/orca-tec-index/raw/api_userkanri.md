[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#content)

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
 > ユーザ管理情報

ユーザ管理情報  

==========

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#reqsample)
    
*   [リクエスト一覧（一覧）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#request1)
    
*   [レスポンス一覧（一覧）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#response1)
    
*   [リクエスト一覧（登録）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#request2)
    
*   [レスポンス一覧（登録）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#response2)
    
*   [リクエスト一覧（変更）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#request3)
    
*   [レスポンス一覧（変更）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#response3)
    
*   [リクエスト一覧（削除）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#request4)
    
*   [レスポンス一覧（削除）](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#response4)
      
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#errmsg)
    

更新履歴
----

2018-10-25 　各リクエスト・レスポンス一覧に項目を追加（権限設定機能の実装）。  
　　　　　　　「エラーメッセージ一覧」にエラーコードを追加。  
　　　　　　　ユーザＩＤの登録または変更時、ＩＤに使用できる文字を半角英数字と下線符号（アンダーバー）のみに変更。 

概要
--

POSTメソッドによりユーザの管理を行います。

日レセ Ver.4.8.0\[第20回パッチ適用\] 以降

リクエストおよびレスポンスデータはxml2形式となります。

テスト方法
-----

1.  参考提供されている sample\_manageusers\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_manageusers\_v2.rb 内のユーザID等を指定します。
3.  ruby sample\_manageusers\_v2.rb により接続します。

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /orca101/manageusersv2  
  
Request\_Number:  
    01: ユーザ一覧  
    02: ユーザ登録  
    03: ユーザ変更  
    04: ユーザ削除  
  
Content-Type: application/xml

 application/xml の場合の文字コードは UTF-8 とします。

<data>  <manageusersreq type \="record"\>    <Request\_Number type \="string"\>01</Request\_Number>  </manageusersreq>  
</data>  

### 処理概要

 ユーザ情報の参照および、登録、変更、削除を行います。

### 処理詳細  

*   リクエスト番号に応じてユーザ一覧の返却、ユーザ登録、変更および削除の処理を行います。  
    
*   登録処理では日レセログインアカウントの登録およびシステム管理 \[1010 職員情報\] の登録を行います。  
    業務権限に関する設定はAPI実行ユーザがシステム管理 \[1010 職員情報\] で管理者となっている場合に可能となります。  
    
*   削除処理で医師のアカウントを削除した場合、各業務のコンボボックスで該当医師が選択できなくなりますので、注意して下さい。

リクエスト一覧（一覧）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 01  | 必須  <br>01（ユーザ一覧）を設定 |
| 2   | Base\_Date | 基準日 | 2015-09-01 | 未設定時はシステム日付 |
| 3   | User\_Information | ユーザ情報 |     | 追加(2018-10-25) |
| 3-1 | User\_Id | ユーザID | taro | 特定のユーザ情報のみ取得する場合に設定  <br>追加(2018-10-25) |

レスポンス一覧（一覧）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-09-01 |     |
| 2   | Information\_Time | 実施時間 | 17:32:34 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Request\_Number | リクエスト番号 | 01  |     |
| 6   | Base\_Date | リクエストの基準日 | 2015-09-01 |     |
| 7   | User\_Information | ユーザ情報（繰り返し　６００） |     | ユーザIDの昇順に返却。 |
| 7-1 | User\_Id | ユーザID | test |     |
| 7-2 | Hospital\_Id\_Number | 医療機関識別番号 |     | グループ診療設定が行われている場合に返却。 |
| 7-3 | Group\_Number | システム管理\[1010 職員情報\]職員区分  <br>(0：マスター、  <br>1：医師、  <br>2：看護師、  <br>3：技師、  <br>4：事務職、  <br>5：管理職) | 1   |     |
| 7-4 | User\_Number | システム管理\[1010 職員情報\] 職員番号 | 0001 | ユーザ登録時は空き番号より自動採番。 |
| 7-5 | Full\_Name | ユーザ氏名 | 日医　次郎 |     |
| 7-6 | Kana\_Name | ユーザカナ氏名 | ニチイ　ジロウ |     |
| 7-7 | Start\_Date | システム管理\[1010 職員情報\]有効開始日 | 2015-09-01 | 有効開始日≠00000000の場合に返却 |
| 7-8 | Expiry\_Date | システム管理\[1010 職員情報\]有効終了日 | 2016-08-31 | 有効終了日≠99999999の場合に返却 |
| 7-9 | Administrator\_Privilege | システム管理［1010 職員情報］管理者権限  <br>(0:管理者でない  <br>1:管理者である) | 1   | ※１  <br>追加(2018-10-25) |
| 7-10 | Menu\_Item\_Information | メニュー項目情報（繰り返し　最大５０） |     | 操作権限のある項目のみ返却　※１  <br>追加(2018-10-25) |
| 7-10-1 | Menu\_Item\_Number | メニュー項目番号 | 1   | ※１ ※２  <br>追加(2018-10-25) |
| 7-10-2 | Menu\_Item\_Privilege | メニュー項目権限  <br>(1:操作権限あり) | 1   | ※１  <br>追加(2018-10-25) |
| 8   | Menu\_Item\_Name\_Information | メニュー項目名称情報（繰り返し　最大５０） |     | ※１  <br>追加(2018-10-25) |
| 8-1 | Menu\_Item\_Number | メニュー項目番号 | 1   | ※１ ※２  <br>追加(2018-10-25) |
| 8-2 | Menu\_Item\_Name | メニュー項目名称 | 医事業務 | ※１ ※２  <br>追加(2018-10-25) |

※１　API実行ユーザが日レセの管理者である場合(Administrator\_Privilege="1")に返却を行います。

※２　以下の内容を返却します。  
　　メニュー項目番号　メニュー項目名称  
　　　　　1  　　　　　医事業務  
　　　　　3  　　　　　プログラム更新  
　　　　　29 　　　　　外来まとめ  
　　　　　11 　　　　　受付  
　　　　　12 　　　　　登録  
　　　　　13 　　　　　照会  
　　　　　14 　　　　　予約  
　　　　　21 　　　　　診療行為  
　　　　　22 　　　　　病名  
　　　　　23 　　　　　収納  
　　　　　24 　　　　　会計照会  
　　　　　31 　　　　　入退院登録  
　　　　　32 　　　　　入院会計照会  
　　　　　33 　　　　　入院定期請求  
　　　　　34 　　　　　退院時仮計算  
　　　　　36 　　　　　入院患者照会  
　　　　　41 　　　　　データチェック  
　　　　　42 　　　　　明細書  
　　　　　43 　　　　　請求管理  
　　　　　44 　　　　　総括表  
　　　　　51 　　　　　日次統計  
　　　　　52 　　　　　月次統計  
　　　　　71 　　　　　データ出力  
　　　　　82 　　　　　外部媒体  
　　　　　91 　　　　　マスタ登録  
　　　　　92 　　　　　マスタ更新  
　　　　　101　　　　　システム管理  
　　　　　102　　　　　点数マスタ  
　　　　　103　　　　　チェックマスタ  
　　　　　104　　　　　保険番号マスタ  
　　　　　105　　　　　保険者マスタ  
　　　　　106　　　　　人名辞書マスタ  
　　　　　107　　　　　薬剤情報マスタ  
　　　　　108　　　　　住所マスタ  
　　　　　109　　　　　ヘルプマスタ  

###  リクエストサンプル

<data>  <manageusersreq type \="record"\>    <Request\_Number type \="string"\>01</Request\_Number>  </manageusersreq>  
</data>  

###  レスポンスサンプル

<xmlio2>  <manageusersres type\="record"\>    <Information\_Date type\="string"\>2018-10-24</Information\_Date>    <Information\_Time type\="string"\>10:52:01</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Request\_Number type\="string"\>01</Request\_Number>    <Base\_Date type\="string"\>2018-10-24</Base\_Date>    <User\_Information type\="array"\>      <User\_Information\_child type\="record"\>        <User\_Id type\="string"\>ormaster</User\_Id>        <Group\_Number type\="string"\>0</Group\_Number>        <User\_Number type\="string"\>0001</User\_Number>        <Full\_Name type\="string"\>オルカマスター</Full\_Name>        <Kana\_Name type\="string"\>オルカマスター</Kana\_Name>        <Administrator\_Privilege type\="string"\>1</Administrator\_Privilege>        <Menu\_Item\_Information type\="array"\>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>1</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>29</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>11</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>12</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>13</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>14</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>21</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>22</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>23</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>24</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>31</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>32</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>33</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>34</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>36</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>41</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>42</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>43</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>44</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>51</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>52</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>91</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>92</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>101</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>102</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>103</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>104</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>105</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>106</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>107</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>108</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>109</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>        </Menu\_Item\_Information>      </User\_Information\_child>      <User\_Information\_child type\="record"\>        <User\_Id type\="string"\>test</User\_Id>        <Group\_Number type\="string"\>1</Group\_Number>        <User\_Number type\="string"\>0001</User\_Number>        <Full\_Name type\="string"\>日医　次郎</Full\_Name>        <Kana\_Name type\="string"\>ニチイ　ジロウ</Kana\_Name>        <Administrator\_Privilege type\="string"\>0</Administrator\_Privilege>        <Menu\_Item\_Information type\="array"\>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>1</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>21</Menu\_Item\_Number>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>        </Menu\_Item\_Information>      </User\_Information\_child>    </User\_Information>    <Menu\_Item\_Name\_Information type\="array"\>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>1</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>医事業務</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>29</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>外来まとめ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>11</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>受付</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>12</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>登録</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>13</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>照会</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>14</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>予約</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>21</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>診療行為</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>22</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>病名</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>23</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>収納</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>24</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>会計照会</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>31</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>入退院登録</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>32</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>入院会計照会</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>33</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>入院定期請求</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>34</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>退院時仮計算</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>36</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>入院患者照会</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>41</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>データチェック</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>42</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>明細書</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>43</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>請求管理</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>44</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>総括表</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>51</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>日次統計</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>52</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>月次統計</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>91</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>マスタ登録</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>92</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>マスタ更新</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>101</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>システム管理</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>102</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>点数マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>103</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>チェックマスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>104</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>保険番号マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>105</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>保険者マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>106</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>人名辞書マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>107</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>薬剤情報マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>108</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>住所マスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>      <Menu\_Item\_Name\_Information\_child type\="record"\>        <Menu\_Item\_Number type\="string"\>109</Menu\_Item\_Number>        <Menu\_Item\_Name type\="string"\>ヘルプマスタ</Menu\_Item\_Name>      </Menu\_Item\_Name\_Information\_child>    </Menu\_Item\_Name\_Information>  </manageusersres>  
</xmlio2>  

リクエスト一覧（登録）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 02  | 必須  <br>02（ユーザ登録）を設定 |
| 2   | Base\_Date | 基準日 | 2015-09-01 | 未設定時はシステム日付 |
| 3   | User\_Information | ユーザ情報 |     |     |
| 3-1 | User\_Id | ユーザＩＤ | taro | 必須  |
| 3-2 | User\_Password | ユーザパスワード | taropassword | 必須  |
| 3-3 | Group\_Number | システム管理［1010 職員情報］職員区分  <br>0:マスター  <br>1:医師  <br>2:看護師  <br>3:技師  <br>4:事務職  <br>5:管理職 | 1   | 必須  |
| 3-4 | Full\_Name | ユーザ氏名 | 日医　太郎 | 必須  |
| 3-5 | Kana\_Name | ユーザカナ氏名 | ニチイ　タロウ |     |
| 3-6 | Administrator\_Privilege | システム管理［1010 職員情報］管理者権限  <br>0:管理者でない  <br>1:管理者である | 1   | ※１ ※２  <br>追加(2018-10-25) |
| 3-7 | Menu\_Item\_Information | メニュー項目情報（繰り返し　最大５０） |     | ※１  <br>追加(2018-10-25) |
| 3-7-1 | Menu\_Item\_Number | メニュー項目番号 | 21  | ※１　設定値は一覧レスポンスを参照  <br>追加(2018-10-25) |
| 3-7-2 | Menu\_Item\_Privilege | メニュー項目権限  <br>0:操作権限なし  <br>1:操作権限あり | 1   | メニュー項目番号の設定がある場合は必須　※１  <br>追加(2018-10-25) |

※　システム管理\[1010 職員情報\]の有効期間は""00000000""〜""99999999""で作成します。

※１ API実行ユーザが日レセの管理者である場合(Administrator\_Privilege="1")に設定が可能です。  

※２ 管理者権限の有無でメニュー項目情報の設定に関わらず、以下のメニュー項目の権限の設定を行います。  
 　　管理者でない場合：プログラム更新、マスタ更新の権限を付与しません。  
 　　管理者である場合：医事業務、プログラム更新、マスタ登録、マスタ更新、システム管理の権限を付与します。  

レスポンス一覧（登録）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-09-01 |     |
| 2   | Information\_Time | 実施時間 | 17:41:56 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Request\_Number | リクエスト番号 | 02  |     |
| 6   | Base\_Date | リクエストの基準日 | 2015-09-01 |     |
| 7   | User\_Information | ユーザ情報 |     | ユーザ登録時は該当のユーザ１件を返却。 |
| 7-1 | User\_Id | ユーザID | taro |     |
| 7-2 | Hospital\_Id\_Number | 医療機関識別番号 |     | グループ診療設定が行われている場合に返却。 |
| 7-3 | Group\_Number | システム管理\[1010 職員情報\]職員区分  <br>(0：マスター、  <br>1：医師、  <br>2：看護師、  <br>3：技師、  <br>4：事務職、  <br>5：管理職) | 1   |     |
| 7-4 | User\_Number | システム管理\[1010 職員情報\] 職員番号 | 0002 | ユーザ登録時は空き番号より自動採番。 |
| 7-5 | Full\_Name | ユーザ氏名 | 日医　太郎 |     |
| 7-6 | Kana\_Name | ユーザカナ氏名 | ニチイ　タロウ |     |
| 7-7 | Administrator\_Privilege | 管理者権限  <br>0:管理者でない  <br>1:管理者である | 1   | ※１  <br>追加(2018-10-25) |
| 7-8 | Menu\_Item\_Information | メニュー項目情報（繰り返し　最大５０） |     | 操作権限のある項目のみ返却　※１  <br>追加(2018-10-25) |
| 7-8-1 | Menu\_Item\_Number | メニュー項目番号 | 1   | 返却値は一覧レスポンス参照　※１  <br>追加(2018-10-25) |
| 7-8-2 | Menu\_Item\_Name | メニュー項目名称 | 医事業務 | 返却値は一覧レスポンス参照　※１  <br>追加(2018-10-25) |
| 7-8-3 | Menu\_Item\_Privilege | メニュー項目権限  <br>1:操作権限あり | 1   | ※１  <br>追加(2018-10-25) |

 ※１　API実行ユーザが日レセの管理者である場合(Administrator\_Privilege="1")に返却を行います。

### リクエストサンプル

<data>  <manageusersreq type \="record"\>    <Request\_Number type \="string"\>02</Request\_Number>    <User\_Information type \="record"\>      <User\_Id type \="string"\>taro</User\_Id>      <User\_Password type \="string"\>passwd</User\_Password>      <Group\_Number type \="string"\>1</Group\_Number>      <Full\_Name type \="string"\>日医　太郎</Full\_Name>      <Kana\_Name type \="string"\>ニチイ　タロウ</Kana\_Name>    </User\_Information>  </manageusersreq>  
</data>  

### レスポンスサンプル

<xmlio2>  <manageusersres type\="record"\>    <Information\_Date type\="string"\>2018-10-24</Information\_Date>    <Information\_Time type\="string"\>10:58:05</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Request\_Number type\="string"\>02</Request\_Number>    <Base\_Date type\="string"\>2018-10-24</Base\_Date>    <User\_Information type\="array"\>      <User\_Information\_child type\="record"\>        <User\_Id type\="string"\>taro</User\_Id>        <Group\_Number type\="string"\>1</Group\_Number>        <User\_Number type\="string"\>0002</User\_Number>        <Full\_Name type\="string"\>日医　太郎</Full\_Name>        <Kana\_Name type\="string"\>ニチイ　タロウ</Kana\_Name>        <Administrator\_Privilege type\="string"\>0</Administrator\_Privilege>        <Menu\_Item\_Information type\="array"\>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>1</Menu\_Item\_Number>            <Menu\_Item\_Name type\="string"\>医事業務</Menu\_Item\_Name>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>21</Menu\_Item\_Number>            <Menu\_Item\_Name type\="string"\>診療行為</Menu\_Item\_Name>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>        </Menu\_Item\_Information>      </User\_Information\_child>    </User\_Information>  </manageusersres>  
</xmlio2>  

リクエスト一覧（変更）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 03  | 必須  <br>03（ユーザ変更）を設定 |
| 2   | Base\_Date | 基準日 | 2015-09-01 | 未設定時はシステム日付 |
| 3   | User\_Information | ユーザ情報 |     |     |
| 3-1 | User\_Id | ユーザＩＤ | taro | 必須  |
| 3-2 | New\_User\_Id | 新しいユーザＩＤ | jiro |     |
| 3-3 | New\_User\_Password | 新しいユーザパスワード | jiropassword |     |
| 3-4 | New\_Full\_Name | 新しいユーザ氏名 | 日医　次郎 |     |
| 3-5 | New\_Kana\_Name | 新しいユーザカナ氏名 | ニチイ　ジロウ |     |
| 3-6 | Administrator\_Privilege | システム管理［1010 職員情報］管理者権限  <br>0:管理者でない  <br>1:管理者である | 1   | ※１ ※２  <br>追加(2018-10-25) |
| 3-7 | Menu\_Item\_Information | メニュー項目情報（繰り返し　最大５０） |     | 変更を行うメニュー項目についてのみ設定　※１  <br>追加(2018-10-25) |
| 3-7-1 | Menu\_Item\_Number | メニュー項目番号 | 21  | 設定値は一覧レスポンスを参照 ※１  <br>追加(2018-10-25) |
| 3-7-2 | Menu\_Item\_Privilege | メニュー項目権限  <br>0:操作権限なし  <br>1:操作権限あり | 1   | メニュー項目番号の設定がある場合は必須　※１  <br>追加(2018-10-25) |

※１ API実行ユーザが日レセの管理者である場合(Administrator\_Privilege="1")に設定が可能です。  

※２ 管理者権限の有無でメニュー項目情報の設定に関わらず、以下のメニュー項目の権限の設定を行います。  
 　　管理者でない場合：プログラム更新、マスタ更新の権限を付与しません。  
 　　管理者である場合：医事業務、プログラム更新、マスタ登録、マスタ更新、システム管理の権限を付与します。  

レスポンス一覧（変更）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-09-01 |     |
| 2   | Information\_Time | 実施時間 | 17:49:37 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Request\_Number | リクエスト番号 | 03  |     |
| 6   | Base\_Date | リクエストの基準日 | 2015-09-01 |     |
| 7   | User\_Information | ユーザ情報 |     | ユーザ削除時は該当のユーザ１件を返却。 |
| 7-1 | User\_Id | ユーザID | taro |     |
| 7-2 | Hospital\_Id\_Number | 医療機関識別番号 |     | グループ診療設定が行われている場合に返却。 |
| 7-3 | Group\_Number | システム管理\[1010 職員情報\]職員区分  <br>(0：マスター、  <br>1：医師、  <br>2：看護師、  <br>3：技師、  <br>4：事務職、  <br>5：管理職) | 1   |     |
| 7-4 | User\_Number | システム管理\[1010 職員情報\] 職員番号 | 0002 | ユーザ登録時は空き番号より自動採番。 |
| 7-5 | Full\_Name | ユーザ氏名 | 日医　太郎 |     |
| 7-6 | Kana\_Name | ユーザカナ氏名 | ニチイ　タロウ |     |
| 7-7 | New\_User\_Id | 新しいユーザID | jiro | ※１  |
| 7-8 | New\_Hospital\_Id\_Number | 新しい医療機関識別番号 |     | グループ診療設定が行われている場合に返却。  <br>Ginbee環境では返却しない。  <br>※２ |
| 7-9 | New\_Group\_Number | 新しいシステム管理\[1010 職員情報\]職員区分  <br>(0：マスター、  <br>1：医師、  <br>2：看護師、  <br>3：技師、  <br>4：事務職、  <br>5：管理職) | 1   | ※２  |
| 7-10 | New\_User\_Number | 新しいシステム管理\[1010 職員情報\] 職員番号 | 0002 | ※２  |
| 7-11 | New\_Full\_Name | 新しいユーザ氏名 | 日医　次郎 | ※１  |
| 7-12 | New\_Kana\_Name | 新しいユーザカナ氏名 | ニチイ　ジロウ | ※１  |
| 7-13 | Administrator\_Privilege | 管理者権限  <br>0:管理者でない  <br>1:管理者である | 1   | ※３  <br>追加(2018-10-25) |
| 7-14 | Menu\_Item\_Information | メニュー項目情報（繰り返し　最大５０） |     | 操作権限のある項目のみ返却　※３  <br>追加(2018-10-25) |
| 7-14-1 | Menu\_Item\_Number | メニュー項目番号 | 1   | 返却値は一覧レスポンス参照　※３  <br>追加(2018-10-25) |
| 7-14-2 | Menu\_Item\_Name | メニュー項目名称 | 医事業務 | 返却値は一覧レスポンス参照　※３  <br>追加(2018-10-25) |
| 7-14-3 | Menu\_Item\_Privilege | メニュー項目権限  <br>1:操作権限あり | 1   | ※３  <br>追加(2018-10-25) |

 ※１：変更が無かった項目についても、同じ内容で変更されたものとみなし返却します。

 ※２：医療機関識別番号、職員区分、職員番号は変更不可ですが、便宜上同じ内容で変更されたものとして返却します。  
　　　（医療機関識別番号はグループ診療時のみ返却します）

 ※３　API実行ユーザが日レセの管理者である場合(Administrator\_Privilege="1")に返却を行います。

### リクエストサンプル

<data>  <manageusersreq type \="record"\>    <Request\_Number type \="string"\>03</Request\_Number>    <User\_Information type \="record"\>      <User\_Id type \="string"\>taro</User\_Id>      <New\_User\_Id type \="string"\>jiro</New\_User\_Id>      <New\_Full\_Name type \="string"\>日医　次郎</New\_Full\_Name>      <New\_Kana\_Name type \="string"\>ニチイ　ジロウ</New\_Kana\_Name>    </User\_Information>  </manageusersreq>  
</data> 

### レスポンスサンプル

<xmlio2>  <manageusersres type\="record"\>    <Information\_Date type\="string"\>2018-10-24</Information\_Date>    <Information\_Time type\="string"\>11:06:00</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Request\_Number type\="string"\>03</Request\_Number>    <Base\_Date type\="string"\>2018-10-24</Base\_Date>    <User\_Information type\="array"\>      <User\_Information\_child type\="record"\>        <User\_Id type\="string"\>taro</User\_Id>        <Group\_Number type\="string"\>1</Group\_Number>        <User\_Number type\="string"\>0002</User\_Number>        <Full\_Name type\="string"\>日医　太郎</Full\_Name>        <Kana\_Name type\="string"\>ニチイ　タロウ</Kana\_Name>        <New\_User\_Id type\="string"\>jiro</New\_User\_Id>        <New\_Group\_Number type\="string"\>1</New\_Group\_Number>        <New\_User\_Number type\="string"\>0002</New\_User\_Number>        <New\_Full\_Name type\="string"\>日医　次郎</New\_Full\_Name>        <New\_Kana\_Name type\="string"\>ニチイ　ジロウ</New\_Kana\_Name>        <Administrator\_Privilege type\="string"\>0</Administrator\_Privilege>        <Menu\_Item\_Information type\="array"\>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>1</Menu\_Item\_Number>            <Menu\_Item\_Name type\="string"\>医事業務</Menu\_Item\_Name>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>          <Menu\_Item\_Information\_child type\="record"\>            <Menu\_Item\_Number type\="string"\>21</Menu\_Item\_Number>            <Menu\_Item\_Name type\="string"\>診療行為</Menu\_Item\_Name>            <Menu\_Item\_Privilege type\="string"\>1</Menu\_Item\_Privilege>          </Menu\_Item\_Information\_child>        </Menu\_Item\_Information>      </User\_Information\_child>    </User\_Information>  </manageusersres>  
</xmlio2>  

リクエスト一覧（削除）  

--------------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Request\_Number | リクエスト番号 | 04  | 必須  <br>04（ユーザ削除）を設定 |
| 2   | Base\_Date | 基準日 | 2015-09-01 | 未設定時はシステム日付 |
| 3   | User\_Information | ユーザ情報 |     |     |
| 3-1 | User\_Id | ユーザＩＤ | jiro | 必須  |

レスポンス一覧（削除）
-----------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2015-09-01 |     |
| 2   | Information\_Time | 実施時間 | 17:58:02 |     |
| 3   | Api\_Result | 結果コード（ゼロ以外エラー） | 0000 |     |
| 4   | Api\_Result\_Message | エラーメッセージ | 処理終了 |     |
| 5   | Request\_Number | リクエスト番号 | 04  |     |
| 6   | Base\_Date | リクエストの基準日 | 2015-09-01 |     |
| 7   | User\_Information | ユーザ情報 |     | ユーザ削除時は該当のユーザ１件を返却。 |
| 7-1 | User\_Id | ユーザID | jiro |     |
| 7-2 | Hospital\_Id\_Number | 医療機関識別番号 |     | グループ診療設定が行われている場合に返却。 |
| 7-3 | Group\_Number | システム管理\[1010 職員情報\]職員区分  <br>(0：マスター、  <br>1：医師、  <br>2：看護師、  <br>3：技師、  <br>4：事務職、  <br>5：管理職) | 1   |     |
| 7-4 | User\_Number | システム管理\[1010 職員情報\] 職員番号 | 0002 |     |
| 7-5 | Full\_Name | ユーザ氏名 | 日医　次郎 |     |
| 7-6 | Kana\_Name | ユーザカナ氏名 | ニチイ　ジロウ |     |

### リクエストサンプル

<data>  <manageusersreq type \="record"\>    <Request\_Number type \="string"\>04</Request\_Number>    <User\_Information type \="record"\>      <User\_Id type \="string"\>jiro</User\_Id>    </User\_Information>  </manageusersreq>  
</data>  

### レスポンスサンプル

<xmlio2>  <manageusersres type\="record"\>    <Information\_Date type\="string"\>2018-10-24</Information\_Date>    <Information\_Time type\="string"\>11:10:52</Information\_Time>    <Api\_Result type\="string"\>0000</Api\_Result>    <Api\_Result\_Message type\="string"\>処理終了</Api\_Result\_Message>    <Request\_Number type\="string"\>04</Request\_Number>    <Base\_Date type\="string"\>2018-10-24</Base\_Date>    <User\_Information type\="array"\>      <User\_Information\_child type\="record"\>        <User\_Id type\="string"\>jiro</User\_Id>        <Group\_Number type\="string"\>1</Group\_Number>        <User\_Number type\="string"\>0002</User\_Number>        <Full\_Name type\="string"\>日医　次郎</Full\_Name>        <Kana\_Name type\="string"\>ニチイ　ジロウ</Kana\_Name>      </User\_Information\_child>    </User\_Information>  </manageusersres>  
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

[sample\_manageusers\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_manageusers_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
#------ ユーザ管理  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/orca101/manageusersv2")BODY \= <<EOF

<data>  
<manageusersreq type \="record"\>   <Request\_Number type \="string"\>02</Request\_Number>   <Base\_Date type \="string"\></Base\_Date>   <User\_Information type \="record"\>      <User\_Id type \="string"\>taro</User\_Id>      <User\_Password type \="string"\>passwd</User\_Password>      <Group\_Number type \="string"\>1</Group\_Number>      <Full\_Name type \="string"\>日医　太郎</Full\_Name>      <Kana\_Name type \="string"\>ニチイ　タロウ</Kana\_Name>      <Administrator\_Privilege type \="string"\>1</Administrator\_Privilege>      <Menu\_Item\_Information type \="array"\>         <Menu\_Item\_Information\_child type \="record"\>            <Menu\_Item\_Number type \="string"\>21</Menu\_Item\_Number>            <Menu\_Item\_Privilege type \="string"\>1</Menu\_Item\_Privilege>         </Menu\_Item\_Information\_child>         <Menu\_Item\_Information\_child type \="record"\>            <Menu\_Item\_Number type \="string"\>22</Menu\_Item\_Number>            <Menu\_Item\_Privilege type \="string"\>1</Menu\_Item\_Privilege>         </Menu\_Item\_Information\_child>      </Menu\_Item\_Information>   </User\_Information>  
</manageusersreq>  
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
| 0000 | 処理終了 |     |
| 0001 | 基準日の設定に誤りがあります |     |
| 0002 | リクエスト番号の設定に誤りがあります |     |
| 0003 | ユーザIDが未入力です |     |
| 0004 | ユーザIDに半角以外の文字が入力されています |     |
| 0005 | パスワードが未入力です |     |
| 0006 | パスワードに半角以外の文字が入力されています |     |
| 0007 | 職員区分の入力に誤りがあります |     |
| 0008 | 氏名が未入力です |     |
| 0009 | 氏名に全角以外の文字が入力されています |     |
| 0010 | カナ氏名に全角カタカナ以外の文字が入力されています |     |
| 0011 | 既に同じユーザIDの登録があります |     |
| 0012 | ユーザIDが未登録です |     |
| 0013 | システム管理に同じユーザIDの登録が複数あります。更新できません |     |
| 0014 | システム管理の有効期間が切れています。更新できません |     |
| 0015 | システム管理が未登録です。更新できません |     |
| 0016 | ユーザはオルカマスターです。削除できません |     |
| 0018 | ユーザＩＤに使用可能な文字は半角の英数字と下線符号（アンダーバー）のみです | 追加(2018-10-25) |
| 0019 | 管理者権限の入力に誤りがあります | 追加(2018-10-25) |
| 0020 | 権限の設定は管理者のみ可能です | 追加(2018-10-25) |
| 0021 | 該当する業務が存在しません | 追加(2018-10-25) |
| 0022 | 業務権限の入力に誤りがあります | 追加(2018-10-25) |
| 0023 | ユーザはオルカマスターです。変更できません | 追加(2018-10-25) |
| 4000〜4010 | ユーザ情報の更新に失敗しました |     |
| 8900 | システム項目が設定できません |     |
| 8901 | 職員情報が取得できません |     |
| 8902 | 医療機関情報が取得できません |     |
| 8903 | システム日付が取得できません |     |
| 8905 | 患者番号構成情報が取得できません |     |
| 8915 | グループ医療機関が不整合です。処理を終了して下さい。 |     |
| 8097 | 送信内容に誤りがあります |     |
| 8098 | 送信内容の読込ができませんでした |     |
| 8099 | ユーザIDが未登録です |     |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > ユーザ管理情報

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/userkanri.html#wrapper)

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
