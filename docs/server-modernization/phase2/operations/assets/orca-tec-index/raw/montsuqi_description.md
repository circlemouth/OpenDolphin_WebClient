[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/montsuqi/description.html#content)

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
 > [MONTSUQIについて](https://www.orca.med.or.jp/receipt/tec/montsuqi/index.html)
 > MONTSUQI 各モジュールの説明

各モジュールの説明
=========

### glclient

glclient と glserver はソケット通信で接続します。  
glclient から送られたイベントの信号を glserver へ送ります。  
キャッシュ機能を持っており、一度表示された画面を XML で保存しておき次回からはそのキャッシュを使用して画面を生成します。

### glserver

glserver はアプリケーションの処理で得た結果を glclient に返し、 glclient はその内容を表示します。  
glclient が接続すると、最初に立ち上げたglserver（親プロセス）がglclient （子プロセス）を fork して立ち上げ、複数の glclient が接続しても同時にリクエストを処理できる仕組みになっています。

### glauth

glclient が glserver に接続する段階で、glserver からの問い合わせに対し glauth は接続してきたユーザが正規のユーザかどうかの認証を行い、結果を glserver に返します。  
認証後、glauth を使用することはありません。  
  
※現在の認証ファイルはデフォルトで /etc/jma-receipt/passwd

### WFC (Work Flow Controler)

glserver と接続してデータを受け取り、データのキューイングとキューの管理を行います。  
分散処理に必要な処理もここで行います。

  
**wfcの処理・データの流れ**  
wfcは、クライアント通信の窓口となる glserver と、業務アプリケーショの窓口となる apsCOBOL の間を取り持つ、中核部分を担っています。  
そのため、画面での処理が発生すると、かならず wfc を回するため、とても重要なモジュールとなります。  
wfcは、複数のglserverと、複数のapsCOBOLとやりとりを行い、その受け渡しについて、内部的に保持するキューを経由し、加えて、スレッドの生成と組み合わせることで、効率よく実行します。  

### apsCOBOL（MCPMAIN）

apsCOBOL は、WFC と各言語の業務アプリケーションとやりとりを行うインターフェイスモジュールです。  
WFC と通信を行い、キューから一つずつメッセージを読み出し、一つずつ結果を返します。  
メッセージによりイベントの発生したウィンドウに対応したアプリケーションを検索し、対応した業務アプリケーションをサブルーチンとして呼び出します。  
呼び出す業務アプリケーションの言語によるデータ形式の違いを吸収するために言語毎にラッパーが存在します。

**apsCOBOLの処理・データの流れ**  
上記の図を見ていただくと、apsCOBOLとMCPMAIN・MCPSUBとの関係が密であるのがわかると思います。  
apsCOBOLは、MCPMAIN・MCPSUBとパイプファイルでやりとりを行います。そして、パイプファイルを常時監視し、何らかの書き込みの発生に伴って、処理を行います。

### COBOLプログラム

イベントに対応した処理を行う、業務アプリケーションです。

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [MONTSUQIについて](https://www.orca.med.or.jp/receipt/tec/montsuqi/index.html)
 > MONTSUQI 各モジュールの説明

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/montsuqi/description.html#wrapper)

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
