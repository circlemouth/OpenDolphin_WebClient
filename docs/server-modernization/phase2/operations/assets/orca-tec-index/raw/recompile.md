[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/recompile.html#content)

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
 > 自動リコンパイル

自動リコンパイル
========

ユーザカスタマイズおよび県単独モジュールの配置については次のとおりとします。

/usr/lib/jma-receipt/bin
                    / ・
                    / ・
                    /cobol/copy ←　パッケージにより最新のCOPY句をインストールします。
                    / ・
                    /scripts/allways/site-upgrade.sh ←　パッケージにより作成します。
                    / ・
                    /site-lib （※1）
                             /data
                             /doc
                             /form
                             /init
                             /lddef
                             /record
                             /screen
                             /scripts/allways
                             /scripts/daily
                             /scripts/kaisei
                             /scripts/kentan
                             /scripts/monthly

（※1）  
site-lib/ 以下のディレクトリについてはカスタマイズされたファイルが配置される場所です。  
以下のディレクトリにモジュール等を配置しないとプログラムは実行できません。

各ディレクトリの概要

site-lib/
       /data・・・・・・・データファイルを格納
       /doc ・・・・・・・ドキュメントファイルを格納
       /form・・・・・・・帳票定義ファイル（?.dia）を格納
       /init・・・・・・・ORCAインストール、アップグレード時設定用ファイルを格納
       /lddef ・・・・・・MONTSUQI接続用定義体ファイルを格納
       /record・・・・・・画面、ＤＢ定義等を格納
       /screen・・・・・・画面定義（?.glade）を格納
       /scripts/allways ・随時起動用シェルを格納
       /scripts/daily ・・日次起動用シェルを格納
       /scripts/kaisei・・改正時起動用シェルを格納
       /scripts/kentan・・県単独起動用シェルを格納
       /scripts/monthly ・月次起動用シェルを格納  

以下のディレクトリにカスタマイズの使用したファイルを格納することにより、パッケージバージョンアップ時、自動的にファイルを/usr/lib/jma-receipt/site-libディレクトリにコピーします。  
(CBLファイルはコンパイル後、モジュールを/usr/lib/jma-receipt/site-libへコピーします。)

各ディレクトリの概要

/usr/local/site-jma-receipt/
                           /cobol ・・・・・・カスタマイズプログラムを格納
                           /cobol/copy・・・・カスタマイズプログラムで使用するCOPY句を格納
                           /data・・・・・・・データファイルを格納
                           /doc ・・・・・・・ドキュメントファイルを格納
                           /etc ・・・・・・・県単独bind用インクルードファイル等を格納
                           /form・・・・・・・帳票定義ファイル（?.dia）を格納
                           /init・・・・・・・ORCAインストール、アップグレード時設定用ファイルを格納
                           /lddef ・・・・・・MONTSUQI接続用定義体ファイルを格納
                           /record・・・・・・画面、ＤＢ定義等を格納
                           /screen・・・・・・画面定義（?.glade）を格納
                           /scripts/allways ・随時起動用シェルを格納
                           /scripts/daily ・・日次起動用シェルを格納
                           /scripts/kaisei・・改正時起動用シェルを格納
                           /scripts/kentan・・県単独起動用シェルを格納
                           /scripts/monthly ・月次起動用シェルを格納

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > 自動リコンパイル

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/recompile.html#wrapper)

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
