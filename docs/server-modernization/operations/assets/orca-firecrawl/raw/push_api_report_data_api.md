[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/push-api/report_data_api.html#content)

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
 > [日医標準レセプトソフトPUSH通知](https://www.orca.med.or.jp/receipt/tec/push-api/index.html)
 > 帳票データ取得API

概要
--

ginbee環境においてカルテ等の窓口業務より印刷を行うカスタマイズ帳票プログラムは、画面プログラムから直接参照される実装となっているため使用することができません。  
  
窓口帳票のカスタマイズはAPIより帳票データを取得して行う方式に変更となります。

仕様詳細
----

*   [帳票データ取得APIについて](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/1.api_information.pdf)
     \[PDF\]
*   [帳票データを作成するための日レセの設定について](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/2.jma-receipt_config.pdf)
     \[PDF\]
*   [push-exchangerの設定について](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/3.push-exchanger_config.pdf)
     \[PDF\]
*   [画像データ取得API](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/imageget.pdf)
     \[PDF\]
*   [print001\_plugin-20230407.zip](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/print001_plugin-20230407.zip)
    （帳票プラグイン）(2023-04-07) ![NEW](https://www.orca.med.or.jp/javascripts/tiny_mce/plugins/newmark/images/newmark.png)  
    

### 帳票データレイアウト

#### 更新履歴

2023-04-07 処方箋のページ替えの処理に不具合がありましたので修正しました。  

2023-03-10 Content-Typeの指定に誤りがありましたので修正しました。

2022-04-07 リフィル処方箋に対応しました。

2022-02-28 WebORCAでエラーとなる不具合を修正しました。

2021-02-25 以下の帳票APIの返却項目にバーコード取得用ＩＤを追加しました。  
　　　　　　　\* 請求書兼領収書（外来）  
　　　　　　　\* 請求書兼領収書（入院）  

2020-04-27  以下の帳票APIの返却項目に被保険者証の枝番の追加しました。  
　　　　　　　\* カルテ１号紙（外来）([karte\_no1.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no1.pdf)
)  
　　　　　　　\* カルテ１号紙（入院）([karte\_no1\_n.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no1_n.pdf)
)  
　　　　　　　\* 処方箋(診療日が2020年5月１日以降のものより）([shohosen.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shohosen.pdf)
)  

2019-08-28  Windows版のpush-exchangerでQRコード等の画像を含む帳票の印刷が行われない不具合を修正しました。  
　　　　　　　\* 対象帳票  
　　　　　　　　　\* 処方せん(院外)  
　　　　　　　　　\* 外来お薬情報  
　　　　　　　　　\* 外来お薬手帳  
　　　　　　　　　\* 入院お薬情報  
　　　　　　　　　\* 入院お薬手帳  

2019-04-19  退院証明書の改元対応を行いました。  
　　　　　　生年月日の元号表記を従来の丸囲みから、直接印字に変更しました。  
　　　　　　（パッチ適用前）生年月日（　明・大・昭・平　）○○年○○月○○日  
　　　　　　（パッチ適用後）生年月日　令和〇〇年○○月○○日

2019-04-08  和暦変換用のスクリプトに新元号の考慮を追加。  
　　　　　　2019年5月1日以降の日付はパッチ適用後に令和又はＲ等の表示に変わります。  
　　　　　　（帳票プラグインで予約票、請求書兼領収書、診療費明細書、お薬手帳、薬剤情報など 元号を編集している帳票は  
　　　　　　新元号の編集が可能となります。）  
　　　　　　オンプレミスの帳票と同様に診療録（カルテ）、処方せんのフォームの変更。

2018-03-26   「処方箋(院外)」に分割数、分割回数、分割調剤総投与日数を追加。

2018-02-26   「支払証明書」を追加。  
　　　　　　　「診療録（カルテ３号紙）」を追加。  
　　　　　　　「入院診療録（カルテ１号紙）」を追加。  
　　　　　　　「退院証明書」を追加。  
　　　　　　　「入院請求書兼領収書」を追加。  
　　　　　　　「入院診療費明細書」を追加。  
　　　　　　　「入院お薬情報」を追加。  
　　　　　　　「入院お薬手帳」を追加。  
　　　　　　　「入院注射処方箋」を追加。  
　　　　　　　「入院処方箋」を追加。  
　　　　　　　「入院指示箋」を追加。  
　　　　　　　「入院診療録（カルテ３号紙）」を追加。

2017-08-24   「処方せん(院外)」にQr\_ID追加。  
　　　　　　　「処方せん(院外)」の残薬確認区分に「3:1と2の両方に該当」を追加。  
　　　　　　　「お薬情報」にImage\_IDより取得する画像ファイルのファイル名の説明を追加。  
　　　　　　　「お薬手帳」にQr\_ID追加。

*   [診療録(カルテ1号紙)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no1.pdf)
     \[PDF\]
*   [処方箋(院外)](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shohosen.pdf)
     \[PDF\]
*   [請求書兼領収書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/seikyusho.pdf)
     \[PDF\]
*   [診療費明細書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/meisaisho.pdf)
     \[PDF\]
*   [お薬情報](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/okusuri_joho.pdf)
     \[PDF\]
*   [お薬手帳](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/okusuri_techo.pdf)
     \[PDF\]
*   [予約票](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/yoyakuhyo.pdf)
     \[PDF\]
*   [予約一覧](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/yoyakulist.pdf)
     \[PDF\]
*   [予約患者一覧](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/yoyakukanjalist.pdf)
     \[PDF\]
*   [支払証明書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shiharai_shomeisho.pdf)
     \[PDF\]
*   [診療録（カルテ３号紙）](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no3.pdf)
     \[PDF\]
*   [入院診療録（カルテ１号紙）](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no1_n.pdf)
     \[PDF\]
*   [退院証明書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/taiin_shomeisho.pdf)
     \[PDF\]
*   [入院請求書兼領収書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/seikyusho_n.pdf)
     \[PDF\]
*   [入院診療費明細書](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/meisaisho_n.pdf)
     \[PDF\]
*   [入院お薬情報](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/okusuri_joho_n.pdf)
     \[PDF\]
*   [入院お薬手帳](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/okusuri_techo_n.pdf)
     \[PDF\]
*   [入院注射処方箋](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/chushasen_n.pdf)
     \[PDF\]
*   [入院処方箋](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shohosen_n.pdf)
     \[PDF\]
*   [入院指示箋](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shijisen_n.pdf)
     \[PDF\]
*   [入院診療録（カルテ３号紙）](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/karte_no3_n.pdf)
     \[PDF\]

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフトPUSH通知](https://www.orca.med.or.jp/receipt/tec/push-api/index.html)
 > 帳票データ取得API

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/push-api/report_data_api.html#wrapper)

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
