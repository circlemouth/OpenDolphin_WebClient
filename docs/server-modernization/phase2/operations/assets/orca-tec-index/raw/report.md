[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/report.html#content)

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
 > オンライン帳票ユーザカスタマイズについて

**オンライン帳票ユーザカスタマイズについて**
========================

オンライン帳票については、ユーザにより独自の帳票を作成することができます。  
なお、このオンライン帳票類は日医標準レセプトソフトパッケージのバージョンアップを行っても入れ替わることはありません。  
注意事項）  
パッケージのバージョンアップを行った際には、独自に作成したCOBOLプログラムのコンパイルを行ってください。

1．帳票種類
------

以下の5種類の帳票が対象です。

1.  診療録（カルテ1号紙）
2.  処方せん（院外）
3.  請求書兼領収書
4.  薬剤情報提供書
5.  診療録（カルテ３号用紙）

2．モジュールの命名規約
------------

**各モジュールの先頭1文字を必ず "A" として下さい。**  
この文字を使用することによりユーザプログラムであることを表し標準モジュールと入れ替えが行われないようになります。  
  
**※モジュール命名の指針**  
ユーザがカスタマイズするモジュール名は上記命名規約と合わせ規則を作り、管理しやすいようになります。  
（サポート事業所にて複数の医療機関のカスタマイズを行う場合など有効となります）  
  
以下にモジュールの命名による管理方法を例として記述します。

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| **A**＋県番号（2桁）＋サポート番号（3桁）＋プログラム種別（1桁）＋プログラム番号（2桁） |     |     |     |     |
|     | 桁数  | 種類  | 固定  <br>文字 | 内容  |
| 固定コード | 1   | 英字  | **A** | 固定文字とします |
| 県番号 | 2   | 数字  |     | 都道府県番号とします  <br>例）東京都：13、広島県：34 |
| サポート  <br>番号 | 3   | 英数字 |     | サポート医療機関を任意の番号またはコードで識別します |
| プログラム  <br>種別 | 1   | 英字  | H   | 標準では、帳票は"H"、オンラインは"G"となっています |
| プログラム  <br>番号 | 2   | 英数字 |     | 任意の番号またはコードで構いませんが、番号に意味を持たせることにより管理しやすくなります  <br>例）01：診療録、02：処方箋、など |

設定例）  
例1：東京都のABC医院向けの診療録  
A13001H01  
例2：広島県の○□▲医院向けの処方箋  
A34002H02

3．モジュールの作成手順
------------

オンライン帳票の作成は以下の順番で作成します。

1.  (1).帳票作成  
    「開発者向け情報」→「[ツール：帳票作成](https://www.orca.med.or.jp/receipt/tec/monpe.html)
    」に記載されている手順に従がって、MonpeのXMLデータを作成します。
2.  (2).プログラム作成  
    帳票編集用プログラムを作成します。monpeファイルに対応するコピー句も作成してください。 red2incコマンドにて作成することができます。
3.  (3).システム管理マスタへの登録

ORCA業務画面から［マスタ登録］→［101 システム管理マスタ］→［1031 出力先プリンタ割り当て情報］で「独自開発プログラム名」を指定します。  
![業務画面](https://ftp.orca.med.or.jp/pub/data/receipt/tec/report/syskanri.png)

4．モジュールの格納場所
------------

作成した各モジュールについては/usr/local/site-jma-receiptの所定の場所にコピーしてください。  
（正しいフォルダに存在しないと動作しません）  
詳細については「[自動リコンパイル](https://www.orca.med.or.jp/receipt/tec/recompile.html)
」を参照してください。  
  
/usr/local/site-jma-receipt配下のカスタマイズモジュールを修正された場合、  
/usr/lib/jma-receipt/bin/scripts/allways/site-upgrade.shをroot権限にて実行しますと、  
修正後のモジュールが/usr/lib/jma-receipt/site-libの所定の場所にコピーされます。  

|     |     |
| --- | --- |
| defファイル | /usr/lib/jma-receipt/site-lib/record |
| diaファイル | /usr/lib/jma-receipt/site-lib/form |
| redファイル | /usr/lib/jma-receipt/site-lib/form |
| soファイル（cobol） | /usr/lib/jma-receipt/site-lib |

5．出力先プリンタ指定機能について
-----------------

「日レセ」バージョン1.1.1(H15.8.29リリース)より職員毎に出力先プリンタの指定が可能になります。  
ただし、帳票等カスタマイズされたプログラムもこれに対応させませんと標準設定にしたがいデフォルトの出力先が決定されてしまいます。  
  
提供したサブルーチンプログラム（ORCSPRTNM.CBL）をカスタマイズされたプログラムに組み込む必要があります。  
  
サブルーチンプログラムの仕様については[PDFファイル](https://ftp.orca.med.or.jp/pub/data/receipt/tec/orcsprtnm_03-08-29.pdf)
を参考にしてください。  
  
参考プログラムとして"cobol/orca21/ORCGK03.CBL"のソースをキーワード"ORCSPRTNM"で検索してください。  
  
帳票プログラムでは"cobol/common/ORCHCM19.CBL"のソースをキーワード"ORCSPRTNM"で検索してください。  

６．印刷用シェルのパラメータについて　　　
---------------------

"HC01.sh"あるいは、"HCALL2.sh"をコボルプログラムより実行し、実際に印刷処理を行います。  
"HC01.sh"は１回の実行で１枚の帳票を印刷します。  
標準のプログラムでは診療録（カルテ１号紙）、処方せん（院外）等で使用しています。  
"HCALL2.sh"は１回の実行で複数枚の帳票を印刷します。  
標準のプログラムでは入院請求書兼領収書で使用しています。  
  
シェルを実行する前に必要な手順について説明します。

・HC01.sh

サブプロ"ORCSMKPRTSITE"を使用してシェルを実行します。  
  

・HCALL2.sh

(１)印刷用データの先頭に以下の項目を設定します。  

| Ｎｏ  | 項　目　名 | 項目長 | 説　　　　　明 |
| --- | --- | --- | --- |
| １   | 帳票名　(PRT-PRTID) | X(30) | 帳票レイアウトファイル名（HCN0.red等）を設定します。  <br>帳票レイアウトをdiaで作成している場合は拡張子( .dia)  <br>を除いて設定してください。  <br>帳票レイアウトをmonpeで作成している場合は拡張子( .red)  <br>まで設定してください。 |
| ２   | プリンタ名（PRT-PRTNM） | X(20) | 出力先プリンタ名を設定します。 |
| ３   | サイト区分（PRT-SITEKBN） | X(01) | 日レセ標準の帳票か、カスタマイズ帳票かを識別するための区分です。  <br>カスタマイズ帳票では"2"を設定してください。 |

コーディング例

\* 印刷用データ出力  
MOVE SPACE TO PRT-REC  
MOVE "AXX001H03．red" TO PRT-PRTID  
MOVE WRK-PRTNM TO PRT-PRTNM  
MOVE "2" TO PRT-SITEKBN  
MOVE HCN03 TO PRT-PRTDATA  
WRITE PRT-REC  
　　

(２)シェルの起動は以下のようにして行います。

MOVE SPACE TO SHELLTBL  
\* ファイルデイレクトリ位置指定  
INITIALIZE ORCSMKPASSAREA  
MOVE "scripts/daily/HCALL2.sh"  
TO MKPASS-IN-01  
CALL "ORCSMKPASS"  
USING ORCSMKPASSAREA  
MOVE MKPASS-OT-01 TO SHELLTBL-NAME  
\*  
MOVE HC01PARA TO SHELLTBL-ARG1  
MOVE SHELLTBL TO MCPDATA-REC  
MOVE "SHELL" TO MCP-FUNC  
MOVE "shell" TO MCP-TABLE  
MOVE "shell" TO MCP-PATHNAME  
CALL "MONFUNC" USING  
MCPAREA MCPDATA-REC

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > オンライン帳票ユーザカスタマイズについて

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/report.html#wrapper)

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
