[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/comment85-831-claim.html#content)

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
 > 「85XXXXXXX」「831XXXXXX」のコメントコード対応について

「85XXXXXXX」「831XXXXXX」のコメントコード対応について
====================================

■ claimでの中途データ登録の場合

　  1.8501XXXXX について
　　　claim:number　に年月日を「502-02-01」で設定します。
　　　月日の前ゼロは省略可能です。
　　　年の元号を省略した場合は、5（令和）とします。
　　　年は西暦４桁も可能ですが、展開時に和暦変換します。
      ex) 令和2年1月2日の場合 (850100000 : ＸＸ算定日付)
      <claim:item claim:subclassCodeId="Claim003" claim:code="850100000" claim:tableId="tbl\_tensu">
      <claim:number claim:numberCode="0" claim:numberCodeId="Claim004">502-01-02</claim:number>
      ---------------------------------------
      画面表示
       850100000 502 01 02 | ＸＸ算定日付：令和　２年　１月　２日
      ---------------------------------------

　  2.8511XXXXX について
　　　claim:number　に時分を「12-02」で設定します。
　　　00時00分は「00-00」と設定してください。
      ex) 12時2分の場合 (851100000 : ＸＸＸ算定開始時間)
      <claim:item claim:subclassCodeId="Claim003" claim:code="851100000" claim:tableId="tbl\_tensu">
      <claim:number claim:numberCode="0" claim:numberCodeId="Claim004">12-02</claim:number>
      ---------------------------------------
      画面表示
       851100000 12 02  | ＸＸＸ算定開始時間：１２時　２分
      ---------------------------------------

　  3.8521XXXXX について
　　　claim:number　に時間を「120」で設定します。
      ex) 120分の場合  (852100000 : ＸＸＸ処置時間)
      <claim:item claim:subclassCodeId="Claim003" claim:code="852100000" claim:tableId="tbl\_tensu">
      <claim:number claim:numberCode="0" claim:numberCodeId="Claim004">120</claim:number>
      ---------------------------------------
      画面表示
       852100000 00120   | ＸＸＸ処置時間：　１２０分
      ---------------------------------------

　  4.831XXXXXX について
　　　claim:number　に診療コードを数値9桁で設定します。
　　　claim:name　に名称を全角埋め込みしても展開時にMedication\_Numberの診療コードを
      展開しますので名称の内容は、破棄します。
      ex) 160000310(尿一般)の場合 (831000000 : ＸＸＸＸ前に実施した検査等)
      <claim:item claim:subclassCodeId="Claim003" claim:code="831000000" claim:tableId="tbl\_tensu">
      <claim:number claim:numberCode="0" claim:numberCodeId="Claim004">160000310</claim:number>
      ---------------------------------------
      画面表示
       831000000 160000310 | ＸＸＸＸ前に実施した検査等：尿一般
      ---------------------------------------

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > 「85XXXXXXX」「831XXXXXX」のコメントコード対応について

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/comment85-831-claim.html#wrapper)

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
