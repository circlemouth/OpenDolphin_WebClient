[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html#content)

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
 > 帳票印刷

帳票印刷API  

==========

更新履歴
----

2019-10-28   各帳票印刷APIに帳票のPDF作成機能を追加。  

2019-07-29   「請求書兼領収書（外来）印刷API」を追加。  
　　　　　　　「請求書兼領収書（入院）印刷API」を追加。  
　　　　　　　「診療費明細書（外来）印刷API」を追加。  
　　　　　　　「診療費明細書（入院）印刷API」を追加。  
　　　　　　　帳票印刷APIエラーメッセージ一覧にエラーコードを追加。

2018-08-27   「カルテ１号紙（外来）印刷API」を追加。  
　　　　　　　「カルテ１号紙（入院）印刷API」を追加。  
　　　　　　　「カルテ３号紙（外来）印刷API」を追加。  
　　　　　　　「カルテ３号紙（入院）印刷API」を追加。  

概要
--

POSTメソッドにより帳票印刷リクエストを行います。  
日レセでは帳票編集処理を行うとともに、レスポンスとして帳票データまたは帳票のPDF取得用のキー情報を返却します。  
リクエストデータはxml2形式、レスポンスデータはJSON形式になります。  

印刷処理の流れ
-------

### リクエストの印刷モードが未設定の場合

1.  クライアント端末から日レセサーバに対して帳票印刷リクエストを行います。
2.  日レセサーバは帳票データを作成し、帳票データ取得用のキー情報をPUSH通知します。また、レスポンスとして、帳票データの電文をJSON形式で返却します。
3.  push-exchangerよりPUSH通知の受け取りと帳票印刷を行います。  
    

帳票印刷にはpush-exchangerのインストールが必要です。[push-exchangerの設定について](http://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/3.push-exchanger_config.pdf)
 \[PDF\]

### リクエストの印刷モードに"PDF"を設定した場合

1.   クライアント端末から日レセサーバに対して帳票印刷リクエストを行います。
2.  日レセサーバは帳票のPDFを作成し、レスポンスにPDF取得用のキー情報(Data\_Id)をJSON形式で返却します。  
    
    {  
      "Information\_Date": "2019-09-27",  
      "Information\_Time": "10:38:32",  
      "Api\_Result": "0000",  
      "Api\_Result\_Message": "処理終了",  
      "Form\_ID": "shohosen",  
      "Form\_Name": "処方箋",  
      "Print\_Date": "20190927",  
      "Print\_Time": "103832",  
      "Patient": {  
        "ID": "00001",  
        "Name": "日医　太郎",  
        "KanaName": "ニチイ　タロウ",  
        "BirthDate": "1958-01-10",  
        "Sex": "1"  
      },  
      "Data\_Id\_Information": {  
        "Data\_Id": "be51440b-6e95-43b2-8e5b-86cc5f0aeb65"  
      }  
    }   
    
    PDF取得用のキー情報は以下のようにPUSH通知も行います。  
    
    {  
    	"event": "print002",  
    	"user": "ormaster",  
    	"body": {  
    		"Data\_Id": "be51440b-6e95-43b2-8e5b-86cc5f0aeb65",  
    		"Orca\_Uid": ""  
    	}  
    }   
    
3.  上記Data\_Idを使用して、連携側で以下のURLより帳票のPDF(zip圧縮)を取得します。  
    http://<日レセサーバのホスト名>:8000/blobapi/<Data\_Id>  
    
    （例）http://localhost:8000/blobapi/be51440b-6e95-43b2-8e5b-86cc5f0aeb65   
    

#### 注意事項

*   レスポンス返却からURLより帳票のPDFが受け取れるようになるまでに待ち時間が発生します。
*   日レセ5.0でミドルウェアバージョンが古い場合、印刷モードに"PDF"を指定するとエラーになります。

帳票印刷API一覧
---------

1.  [処方せん印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html)
    
2.  [お薬手帳印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/okusuri_techo.html)
    
3.  [カルテ１号紙（外来）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/karte_no1.html)
    
4.  [カルテ１号紙（入院）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/karte_no1_n.html)
    
5.  [カルテ３号紙（外来）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/karte_no3.html)
    
6.  [カルテ３号紙（入院）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/karte_no3_n.html)
    
7.  [請求書兼領収書（外来）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/seikyusho.html)
      
    
8.  [請求書兼領収書（入院）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/seikyusho_n.html)
      
    
9.  [診療費明細書（外来）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html)
      
    
10.  [診療費明細書（入院）印刷API](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho_n.html)
    

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 帳票印刷

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html#wrapper)

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
