[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/#content)

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
 > 日医標準レセプトソフト API

日医標準レセプトソフト API
===============

### メニュー

*   [概要](https://www.orca.med.or.jp/receipt/tec/api/#outline)
    
*   [詳細仕様](https://www.orca.med.or.jp/receipt/tec/api/#spec)
      
    
*   [改定内容](https://www.orca.med.or.jp/receipt/tec/api/#api_kaitei)
    

概要
--

日レセAPIは電子カルテ等の日レセ連携機器から日レセデータベースを参照・更新するためのインターフェースです。   

日レセAPIはWEB APIとなっており、日レセサーバにHTTPリクエストを送信すると、処理結果をHTTPレスポンスの形で受信することが出来ます。

日レセAPIのリクエストはミドルウェアを通してAPS=COBOLモジュールで処理されるため、他の日レセクライアント(glclient、monsiaj)が接続中であっても整合性を保持することができます。またCLAIMと同様にリクエストの内容をCOBOLモジュールでチェックすることができるので論理的な信頼性があります。  

![概要](https://ftp.orca.med.or.jp/pub/data/receipt/images/api/abstruct.png "概要")

日レセAPIはglserverで処理されます。そのためURLは以下のようになります。

http://日レセサーバホスト名:8000/APIURLのパス?パラメータ1=値1&パラメータ2=値2

患者情報取得APIの例

http://localhost:8000/api01rv2/patientgetv2?id=000001  

WebORCAを対象にリクエストする場合、APIURLの頭に「/api」の付与が必要となります。

http://localhost:8000/api/api01rv2/patientgetv2?id=000001  

各処理のAPIによってパスやパラメータの部分は変わります。

### 認証

デフォルトではBASIC認証が使用されます。  
BASIC認証で使うユーザ・パスワードは、日レセクライアントと同様で職員情報に設定されたオペレータIDとパスワードです。

またglserverにSSLクライアント認証を設定している場合は、SSLクライアント認証になります。(日レセAPIクライアントに証明書を設定する必要があります）

詳細仕様
----

*   [日医標準レセプトソフトAPI仕様](https://www.orca.med.or.jp/receipt/tec/api/overview.html)
      
    

改定内容
----

*   処方箋使用期間について
    *   [処方箋使用期間を対象としたHAORI,日レセAPIの対応について](https://www.orca.med.or.jp/receipt/tec/api/syoho-period-api.html)
         (2025-05-26)  
        

*   令和6年6月診療報酬改定
    *   [2024年6月改定対応(HAORI,日レセAPI,claim他変更点)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/202406-kaisei-taiou-apihaoriclaim_20240523.pdf)
         \[PDF\] (2024-05-23)  
        

*   コメントコード対応
    *   [「85XXXXXXX」「831XXXXXX」のコメントコード対応について](https://www.orca.med.or.jp/receipt/tec/api/comment85-831-api.html)
         (2020-06-04) 
    *   [「842XXXXXX」「830XXXXXX」のコメントコード対応および、撮影部位コード対応について](https://www.orca.med.or.jp/receipt/tec/api/comment842-830-bui-api.html)
         (2020-06-04) 

*   新型コロナウイルス感染症入院対応
    *   [新型コロナウイルス感染症入院対応](https://www.orca.med.or.jp/receipt/tec/api/covid19-api.html)
         (2020-06-04) 

*   平成30年4月診療報酬改定
    *   [2018年4月API改正対応](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/201804-kaisei-taiou-api_20180403.pdf)
         \[PDF\] (2018-04-03)  
        

*   平成28年4月診療報酬改定
    *   [入院関係API修正内容(抜粋)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-20160311.pdf)
         \[PDF\]  
        
    *   [入院患者医療区分・ADL点数情報返却PAI](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospadlinfo-20160311.pdf)
         \[PDF\]  
        
    *   [入院患者医療区分・ADL点数登録API](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospadlentry-20160311.pdf)
         \[PDF\]  
        
    *   [入退院登録API(入院登録)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospentry-20160311.pdf)
         \[PDF\]  
        
    *   [入退院登録API(転科転棟転室)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospido-20160311.pdf)
         \[PDF\]  
        
    *   [入院会計照会API(外泊等登録)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospgaihaku-20160311.pdf)
         \[PDF\]  
        
    *   [入院会計照会API(食事登録)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospshokuji-20160311.pdf)
         \[PDF\]  
        
    *   [入院患者食事等情報返却API](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/kaitei-nyuinapi-hospfood-20160311.pdf)
         \[PDF\]

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > 日医標準レセプトソフト API

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/#wrapper)

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
