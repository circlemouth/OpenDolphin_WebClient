[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/monpe.html#content)

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
 > 帳票設計(MONPE: MONTSUQI Printing Environment)開発支援ツール

帳票設計
====

帳票開発ツール
-------

日医標準レセプトソフト(以下、日レセ)の帳票設計・印刷は、MONPEとdia-orcaというオープンソースの帳票開発ツールを用いて実現している。

dia-orcaは、Ubuntu 12.04 LTS(Lucid Lynx)からサポートされません。monpeへの変換・移行をお願いします。

MONPE概要
-------

[](https://ftp.orca.med.or.jp/pub/data/receipt/tec/monpe/dev.png)
帳票印刷処理開発の流れは以下のようになる。

1.  帳票デザインツールであるmonpe(以下、monpe)を使用して帳票を設計する。設計した帳票のことを「帳票テンプレート」と呼ぶ。
2.  帳票テンプレートから日レセ(COBOL)で利用できるデータ構造(COPY句)を自動生成する。
3.  日レセが提供しているORCSMKPRTというサブプロと、(2)で自動生成したCOPY句を利用して帳票印刷処理を開発する。

2.で自動生成したCOPY句を以下に示す。

プログラムリスト1.(2)で自動生成したデータ構造の例

        01  HCM06V02.
            02  HCM06V02-TEISYUTUSAKI   PIC X(6).
            02  HCM06V02-PTNUM  PIC X(20).
            02  HCM06V02-SRYY   PIC X(2).
            02  HCM06V02-SRYM   PIC X(2).
            02  HCM06V02-PREFNUM    PIC X(2).
        (省略)
    

3.のプログラム例を以下に示す。

プログラムリスト2.帳票印刷処理の例

      (省略)
       WORKING-STORAGE             SECTION.
      \*    2.で自動生成したCOPY句
           COPY    "COPY.INC".
      \*    印刷パラメタ
           COPY    "CPORCSMKPRT.INC".
      \*
      (省略)
      \*
           INITIALIZE                 ORCSMKPRTAREA
           MOVE   "HC01.sh"           TO  MKPRT-ID
      \*    帳票テンプレート名
           MOVE   "HCM06V02.red"      TO  MKPRT-DIA
           MOVE   SPACE               TO  MKPRT-DEF
      \*    2.で自動生成したCOPY句のデータ構造名
           MOVE   HCM06V02            TO  MKPRT-DAT
           MOVE   SYS-1031-PRTNM(2)   TO  MKPRT-PRTNM
           CALL   "ORCSMKPRT"         USING
                                      ORCSMKPRTAREA
    

[](https://ftp.orca.med.or.jp/pub/data/receipt/tec/monpe/run.png)
帳票印刷の流れは以下のようになる。

1.  帳票印刷の要求があると、日レセが提供しているサブプロにより以下を行う。
    1.  帳票テンプレートに入力するデータをファイルに書き出す。
    2.  帳票テンプレートのパスと、データファイルのパスを与えて、帳票印刷ツールであるred2psを実行。
2.  帳票テンプレートとデータファイルを合成して、PostScript形式の印刷イメージを生成。
3.  プリンタスプールソフトウェア(lpr、lprngなど)が、印刷イメージをプリンタに送る。

操作方法などの情報
---------

monpeの操作方法などの詳しい情報は、MONPEのプロジェクトページを参照して下さい。

[MONPEのプロジェクトページ](http://www.montsuqi.org/monpe/)

dia-orcaで設計した帳票の移行
------------------

MONPEで設計した帳票とdia-orcaのものとは互換性がない。しかしながら、dia-orcaで設計した帳票をMONPEの形式に変換するツールがある。このため、近い将来、日レセの帳票は全てMONPEで設計したものになるだろう。

それでは、dia-orcaで設計した帳票をMONPEの形式に変換する方法について説明する。

まず，dia-orcaで設計した帳票に関係する以下の3つのファイルを用意する。

1.  DiaのXMLデータ(\*.dia)
2.  COBOLデータフォーマット規定ファイル(\*.def)
3.  COPY句(\*.INC)

以下のコマンドにより、dia-orcaで設計した帳票をMONPE形式に変換する。

$ dia2red -f (1) -d (2) -i (3) -o <MONPE形式ファイル名>

1〜3は、上記のファイルに対応する。<MONPE形式ファイル名>は、MONPE形式に変換後のファイル名である。MONPE形式の帳票は拡張子は、.redである。しかし、この変換ツールだけでは不完全で、変換後のファイルをmonpeで開き、保存し直す必要がある。

多くの場合、dia-orcaで設計した帳票に関係するファイルは一箇所に固まっているので、スクリプトを用いて一括変換できる。以下に，一括変換を行うrubyスクリプトを挙げる．

プログラムリスト3.一括変換スクリプト: dia2reds.rb

#!/usr/bin/ruby -Ke

############################################################
# パス設定 - 環境に合わせる。
ORCA\_DIR = "/usr/local/orca/"
FORM\_DIR = ORCA\_DIR + "form/"
DEF\_DIR  = ORCA\_DIR + "record/"
INC\_DIR  = ORCA\_DIR + "cobol/copy/"
OUT\_DIR  = "/tmp/dia2red/" # 予め作成しておく

############################################################
# 処理
TMP\_FILE = "/tmp/dia2reds.tmp"

DIA\_EXT = ".dia"
DEF\_EXT = ".def"
INC\_EXT = ".INC"
RED\_EXT = ".red"

CONVERT = "dia2red"

form\_list = Dir::glob(FORM\_DIR + "\*" + DIA\_EXT)

form\_list.each do |form\_path|
  form\_id = File.basename(form\_path, DIA\_EXT)
  def\_path = DEF\_DIR + form\_id + DEF\_EXT
  inc\_path = INC\_DIR + form\_id + INC\_EXT

  print form\_id

  msg = ""
  if FileTest.exist?(def\_path) and FileTest.exist?(inc\_path)
    out\_path = OUT\_DIR + form\_id + RED\_EXT
    system("#{CONVERT} -f #{form\_path} -i #{inc\_path} -d #{def\_path} -o #{out\_path} > #{TMP\_FILE}")
    if FileTest.zero?(TMP\_FILE)
      msg << " - Ok"
    else
      msg << " - Error : convert failed."
    end
    File.unlink(TMP\_FILE)
  else
    msg << " - Error : can't find "
    if !FileTest.exist?(def\_path)
      msg << def\_path + " "
    end
    if !FileTest.exist?(inc\_path)
      msg << inc\_path + " "
    end
    msg.chop! # Delete last space.
  end
  print msg + ".¥n"
end

    

MONPEでは、dia-orcaからの以下の変更点により、dia-orcaで設計した通りに帳票が印刷できない。

*   右寄せの文字位置が設計時と印刷時で誤差があるバグを修正
*   埋め込み時の半角ASCIIを全角に変換する機能の廃止

このため、MONPE形式に変換後の帳票をdia-orcaで設計した通りに印刷するには、monpeを使用して以下の修正が必要になる。

### (1) 右寄せを指定している文字オブジェクトの位置を修正

MONPEでは，帳票の設計時と印刷時の印刷結果が等しくできている。しかし、dia-orcaで設計した帳票は、右寄せの文字位置が設計時と印刷時で異なる。このため、dia-orcaで設計した帳票は、それを考慮して、設計時は右寄せ文字を少しずらして配置し、印刷時に予定通りになるように設計してある。

このような帳票をMONPE形式に変換後、MONPEで印刷した場合、設計した通り、文字位置がずれたまま印刷されるので、右寄せの文字位置を適宜修正する必要がある。

この際、red2testというテスト印刷ツールを使用すれば、仮データを帳票に入力して印刷でき、完成イメージを手軽に確認できるので便利である。

### (2) 半角ASCIIを全角に変換する処理の実装

dia-orcaでは、帳票テンプレートとCOBOLデータの合成の際に、ORCAテキストオブジェクトの「ORCA半角」のプロパティを「いいえ」にすれば、COBOLデータ中の半角ASCII文字を全角文字に変換する機能を持っていた。

しかし、MONPEはこの機能を廃止した。このため、COBOLデータ中の半角ASCII文字を全角文字に変換したければ、日レセ(COBOL)で、その処理を行わなければならない。日レセでは、半角文字を全角文字に変換するサブプロを用意してあるので、それを用いれば容易に実現できる。関連ファイル名を以下にあげる。

*   ORCSKANACHK.CBL
*   CPORCSKANACHK.INC

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > 帳票設計(MONPE: MONTSUQI Printing Environment)開発支援ツール

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/monpe.html#wrapper)

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
