[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#content)

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
 > 日医標準レセプトソフト PushAPI

日医標準レセプトソフト PushAPI  

======================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#about)
    
*   [業務一覧](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#list)
    

更新履歴
----

2021-01-27   「業務一覧」に入院診療行為通知を追加。

2018-11-27   「業務一覧」にメモ登録通知を追加。

2018-02-26   「業務一覧」に入退院登録通知を追加。

概要
--

PushAPIは受付や診療行為登録などのイベント発生のトリガーを連携アプリケーションに通知するための仕組みです。  
通知を受け取った連携ソフトは通知の内容を解析して対応するアクション(例 受付APIを叩いて詳細な受付情報を取得して画面表示するなど)を行います。  
  
WebSocketサーバとの接続などの詳細は、\[[日医標準レセプトソフトPUSH通知](https://www.orca.med.or.jp/receipt/tec/push-api/)\
\]をご参照ください。

・WebSocket接続先は以下のとおりです。  
・サーバがUbuntu20.04 日レセ5.2.0の場合：ws://localhost:9400/ws ※localhostは日レセサーバのIPアドレスを指定  
・サーバがUbuntu22.04 WebORCAオンプレの場合：ws://localhost:8000/ws ※localhostは日レセサーバのIPアドレスを指定  
・サーバがWebORCAクラウド本番環境の場合：wss://weborca.cloud.orcamo.jp/ws  
・サーバがWebORCAクラウドデモ環境の場合：wss://demo-weborca.cloud.orcamo.jp/ws

補足：  
Ubuntu20.04までは日レセサーバに「jma-receipt-pusher」のインストールが必要でしたが、Ubuntu22.04以降(WebORCAオンプレ版)はミドルウェアに組み込まれているためインストールは不要です。

業務一覧  

-------

*   [受付通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api1)
    
*   [患者登録通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api2)
    
*   [診療行為通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api3)
    
*   [入退院登録通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api4)
    
*   [メモ登録通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api5)
    
*   [入院診療行為通知](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#api6)
    

受付通知
----

### 概要

患者受付時、受付取消、変更時にPUSH通知を行います。

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | 業務キー | patient\_accept | 固定  |
| 2   | user | 接続ユーザ | ormaster |     |
| 3   | body | 明細  |     |     |
| 3-1 | Patient\_Mode | 受付更新モード  <br>（add：登録、  <br>modify：更新、  <br>delete：削除） | add |     |
| 3-2 | Patient\_ID | 受付患者番号 | 00123 |     |
| 3-3 | Accept\_Date | 受付年月日 | 2016-12-02 |     |
| 3-4 | Accept\_Time | 受付時間 | 16:03:38 |     |
| 3-5 | Accept\_Id | 受付ID | 00003 |     |
| 3-6 | Department\_Code | 診療科コード | 01  |     |
| 3-7 | Physician\_Code | ドクターコード | 10001 |     |
| 3-8 | Insurance\_Combination\_Number | 保険組合せ番号 | 0010 |     |
| 4   | time | 通知時間 | 2016-12-20T13:30:07+0900 |     |

  

### 通知サンプル

{  
  "event": "patient\_accept",  
  "user": "ormaster",  
  "body": {  
    "Patient\_Mode": "add",  
    "Patient\_ID": "00161",  
    "Accept\_Date": "2016-12-15",  
    "Accept\_Time": "16:03:38",  
    "Accept\_Id": "00003",  
    "Department\_Code": "10",  
    "Physician\_Code": "10001",
    "Insurance\_Combination\_Number": "0008"  
  },  
  "time": "2016-12-15T16:42:15+0900"  
}

患者登録通知
------

### 概要

患者登録時、訂正時、取消時にPUSH通知を行います。

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | 業務キー | patient\_infomation | 固定  |
| 2   | user | 接続ユーザ | ormaster |     |
| 3   | body | 明細  |     |     |
| 3-1 | Patient\_Mode | 患者登録更新モード  <br>（add：登録、  <br>modify：更新、  <br>delete：取消） | add |     |
| 3-2 | Patient\_ID | 患者番号 | 00198 |     |
| 3-3 | Information\_Date | 登録(更新)日 | 2017-07-07 |     |
| 3-4 | Information\_Time | 登録(更新)時間 | 11:31:46 |     |
| 4   | time | 通知時間 | 2017-07-07T11:31:46+0900 |     |

  

### 通知サンプル  

{  
  "event": "patient\_infomation",  
  "user": "ormaster",   
  "body": {  
    "Patient\_Mode": "add",  
    "Patient\_ID": "00198",  
    "Information\_Date": "2017-07-07",   
    "Information\_Time": "11:31:46"  
  },   
  "time": "2017-07-07T11:31:46+0900"  
}  

診療行為通知
------

### 概要

診療行為登録時、取消、変更時にPUSH通知を行います。

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | 業務キー | patient\_account | 固定  |
| 2   | user | 接続ユーザ | ormaster |     |
| 3   | body | 明細  |     |     |
| 3-1 | Patient\_Mode | 診療行為更新モード  <br>（add：登録、  <br>modify：訂正、  <br>delete：削除） | add |     |
| 3-2 | Patient\_ID | 患者番号 | 00161 |     |
| 3-3 | Information\_Date | 登録(訂正)日 | 2017-07-10 |     |
| 3-4 | Information\_Time | 登録(訂正)時間 | 15:09:41 |     |
| 3-5 | Perform\_Date | 診療年月日 | 2017-07-10 |     |
| 3-6 | Medical\_Information | (繰り返し　１５) |     |     |
| 3-6-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0006 |     |
| 3-6-2 | Department\_Code | 診療科 | 01  |     |
| 3-6-3 | Physician\_Code | ドクタコード | 10001 |     |
| 3-6-4 | Invoice\_Number | 伝票番号 | 0000895 |     |
| 4   | time | 通知時間 | 2017-07-10T16:42:15+0900 |     |

  

### 通知サンプル

{  
  "event": "patient\_account",  
  "user": "ormaster",  
  "body": {  
    "Patient\_Mode": "add",  
    "Patient\_ID": "00161",  
    "Information\_Date": "2017-07-10",  
    "Information\_Time": "15:09:41",  
    "Perform\_Date": "2017-07-10",  
    "Medical\_Information": \[  \
      {  \
        "Insurance\_Combination\_Number": "0006",  \
        "Department\_Code": "01",  \
        "Physician\_Code": "10001",  \
        "Invoice\_Number": "0000895"  \
      },  \
      {  \
        "Insurance\_Combination\_Number": "0006",  \
        "Department\_Code": "10",  \
        "Physician\_Code": "10001",  \
        "Invoice\_Number": "0000896"  \
      },  \
    \]  
   }  
  "time": "2017-07-10T16:42:15+0900"  
}  

入退院登録通知
-------

### 概要

日レセ画面およびAPIからの入退院登録時にPUSH通知を行います。  
※ CLAIM接続からの登録分はPUSH通知されません。

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | 業務キー | patient\_hospital\_stay | 固定  |
| 2   | user | 接続ユーザ | ormaster |     |
| 3   | body | 明細  |     |     |
| 3-1 | Request\_Number | リクエスト番号  <br>  <br>01：入院登録  <br>02：退院登録  <br>03：変更  <br>05：入院取消  <br>06：入院取消（会計含む）  <br>07：退院取消  <br>08：転科転棟転室  <br>09：異動取消  <br>10：退院再計算  <br>11：退院登録（診療保存） | 02  |     |
| 3-2 | Patient\_ID | 患者番号 | 00001 |     |
| 3-3 | Admission\_Date | 入院日 | 2018-01-05 |     |
| 3-4 | Discharge\_Date | 退院日 | 2018-01-10 |     |
| 4   | time | 通知時間 | 2018-01-10T15:12:15+0900 |     |

  

### 通知サンプル

{  
  "event": "patient\_hospital\_stay",  
  "user": "ormaster",  
  "body": {  
    "Request\_Number": "02",  
    "Patient\_ID": "00001",  
    "Admission\_Date": "2018-01-05",  
    "Discharge\_Date": "2018-01-10",  
  },  
  "time": "2018-01-21T14:20:13+0900"  
}  

メモ登録通知
------

### 概要

メモ２登録時にPUSH通知を行います。

「F12 登録」「F8 メモ２登録」「Shift+F8 メモ２削除」押下時にメモ２の登録時にPUSH通知を行います。  
通知内容はメモ２の診療科と患者番号、PUSH時のシステム日付(時間)になります。  
「メモ２削除」押下時は、削除するメモの診療日付がシステム日付の時のみPUSH通知を行います。  

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | uuid | 通知UUID | 86bcfafd-18b3-4a3d-931c-29dc250141ad |     |
| 2   | id  | 通知ID | 53  |     |
| 3   | event | 業務キー | patient\_memo |     |
| 4   | user | 接続ユーザ | ormaster |     |
| 5   | body | 明細  |     |     |
| 5-1 | Patient\_Mode | メモ登録更新モード  <br>（add：登録、  <br>delete：削除） | add |     |
| 5-2 | Patient\_ID | 患者番号 | 00161 |     |
| 5-3 | Accept\_Date | 受付年月日(メモ登録年月日) | 2018-11-13 |     |
| 5-4 | Accept\_Time | 受付時間(メモ登録時間) | 14:44:25 |     |
| 5-5 | Accept\_Id | 受付ID |     |     |
| 5-6 | Department\_Code | 診療科コード | 01  |     |
| 5-7 | Physician\_Code | ドクターコード |     |     |
| 5-8 | Insurance\_Combination\_Number | 保険組合せ番号 |     |     |
| 6   | time | 通知時間 | 2018-11-13T14:44:25+0900 |     |

### 通知サンプル  

{  
  "uuid":"86bcfafd-18b3-4a3d-931c-29dc250141ad",  
  "id":53,  
  "event":"patient\_memo",  
  "user":"ormaster",  
  "body":{  
    "Patient\_Mode":"add",  
    "Patient\_ID":"00161",  
    "Accept\_Date":"2018-11-13",  
    "Accept\_Time":"14:44:25",  
    "Accept\_Id":"",  
    "Department\_Code":"01",  
    "Physician\_Code":"",  
    "Insurance\_Combination\_Number":""  
  },  
  "time":"2018-11-13T14:44:25+0900"  
}   

入院診療行為通知
--------

### 概要

入院診療行為登録時、取消、変更時にPUSH通知を行います。

### 通知項目一覧

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | event | 業務キー | patient\_admission | 固定  |
| 2   | user | 接続ユーザ | ormaster |     |
| 3   | body | 明細  |     |     |
| 3-1 | Patient\_Mode | 診療行為更新モード  <br>（add：登録、  <br>modify：訂正、  <br>delete：削除） | add |     |
| 3-2 | Patient\_ID | 患者番号 | 00161 |     |
| 3-3 | Information\_Date | 登録(訂正)日 | 2017-07-10 |     |
| 3-4 | Information\_Time | 登録(訂正)時間 | 15:09:41 |     |
| 3-5 | Perform\_Date | 診療年月日 | 2017-07-10 |     |
| 3-6 | Medical\_Information | (繰り返し　１５) |     |     |
| 3-6-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0006 |     |
| 3-6-2 | Department\_Code | 診療科 | 01  |     |
| 3-6-3 | Physician\_Code | ドクタコード |     |     |
| 3-6-4 | Invoice\_Number | 伝票番号 |     |     |
| 4   | time | 通知時間 | 2017-07-10T16:42:15+0900 |     |

  

### 通知サンプル

{  
  "event": "patient\_admission",  
  "user": "ormaster",  
  "body": {  
    "Patient\_Mode": "add",  
    "Patient\_ID": "00161",  
    "Information\_Date": "2017-07-10",  
    "Information\_Time": "15:09:41",  
    "Perform\_Date": "2017-07-10",  
    "Medical\_Information": \[  \
      {  \
        "Insurance\_Combination\_Number": "0006",  \
        "Department\_Code": "01",  \
        "Physician\_Code": "",  \
        "Invoice\_Number": ""  \
      },  \
    \]  
   }  
  "time": "2017-07-10T16:42:15+0900"  
}  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 日医標準レセプトソフト PushAPI

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/pushapi.html#wrapper)

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
