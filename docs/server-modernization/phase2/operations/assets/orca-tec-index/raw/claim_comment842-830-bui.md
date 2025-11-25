[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/comment842-830-bui-claim.html#content)

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
 > 「842XXXXXX」「830XXXXXX」のコメントコード対応および、撮影部位コード対応について

「842XXXXXX」「830XXXXXX」のコメントコード対応および、撮影部位コード対応について
=================================================

■ claimでの中途データ登録の場合

　  1.842XXXXXX について
　　　claim:number に検査値(回数)等を数値(+,-の符合もあり)、で設定します。
　　　claim\_name　に名称を全角埋め込みしても返却時にclaim:number + コメントコードの内容を
      診療コードを設定し内容を破棄します。
      ex) 検査値 +1.25 の場合 (842100000 : ＸＸＸＸ検査値)
      <claim:item claim:subclassCodeId="Claim003" claim:code="842000000" claim:tableId="tbl\_tensu">
       <claim:number claim:numberCode="0" claim:numberCodeId="Claim004">+1.25</claim:number>

      ---------------------------------------
      画面表示
       842000000 +1.25 | ＸＸＸＸ検査値；＋１．２５
      ---------------------------------------

　  2.830XXXXXX について
　　 2-1.現状通り、他の入力コメントと同様の設定を行います。
         送信された「；」(セミコロン)までの入力値が、日レセの編集後コメントまたは
         コメントマスタの正式名称と一致する場合は、それ以降の文字を入力コメントと
         して扱います。
      (入力文字数が全角40文字を超える場合は、明細をわけて連続して設定してください。
      但し、この複数行を一つにまとめることは行いません)
　　 2-2.claim:name　にマスタのコメント文は設定せず、入力するコメント文のみ
        を設定します。
      (入力文字数が全角40文字を超える場合は、明細をわけて連続して設定してください。
      但し、この複数行を一つにまとめることは行いません)
      ex) 830100230 :急性憎悪１月以内連続７日間必要性(精神科訪問看護・指導料)；
          入力するコメント:興奮症発現が顕著であり、併用薬を含む向精神薬の合計
                           投与量の調整を行う必要がある
      <claim:item claim:subclassCodeId="Claim003" claim:code="830100230" claim:tableId="tbl\_tensu">
      <claim:name>
    興奮症発現が顕著であり、併用薬を含む向精神薬の合計投与量の調整を行う必要がある
      </claim:name>

      ---------------------------------------
      画面表示
       830100230  | 急性憎悪１月以内連続７日間必要性〜；興奮症発現が顕著であり
      ---------------------------------------

　※2.の830XXXXXXの対応は６月末のパッチ提供後、７月分診療分（予定）からとなります。


　  3.撮影部位について
      日レセの部位コードおよびそれに該当する撮影部位選択式コメントコード(コメントマスタ)
      を設定してください。
      ex) 002000099 :頭 （部位区分＝１）  170027910 :単純撮影(デジタル撮影）
          820181000 :撮影部位(単純撮影):頭部

          部位と撮影料から170000410 :単純撮影(イ)の写真診断　を自動算定します。

        <claim:item claim:subclassCodeId="Claim003" claim:code="002000099"> 
        </claim:item>
        <claim:item claim:subclassCodeId="Claim003" claim:code="170027910"> 
        </claim:item>
        <claim:item claim:subclassCodeId="Claim003" claim:code="820181000"> 
        </claim:item>


     ex) 170000410：単純撮影(イ)の写真診断　も設定する場合

        <claim:item claim:subclassCodeId="Claim003" claim:code="002000099"> 
        </claim:item>
        <claim:item claim:subclassCodeId="Claim003" claim:code="170027910"> 
        </claim:item>
        <claim:item claim:subclassCodeId="Claim003" claim:code="170000410"> 
        </claim:item>
        <claim:item claim:subclassCodeId="Claim003" claim:code="820181000"> 
        </claim:item>

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > 「842XXXXXX」「830XXXXXX」のコメントコード対応および、撮影部位コード対応について

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/comment842-830-bui-claim.html#wrapper)

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
