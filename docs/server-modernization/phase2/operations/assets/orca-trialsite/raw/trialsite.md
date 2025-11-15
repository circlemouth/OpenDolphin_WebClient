<!-- Snapshot summary inserted 2025-11-19 to help Runbook 引用. 以下に firecrawl 原文が続きます。 -->
## Snapshot Summary (2025-11-19)
- 接続先: `https://weborca-trial.orca.med.or.jp/` / ユーザー `trial` / パスワード `weborcatrial`（本文「お試しサーバの接続法 §3」に準拠）。
- 利用方針: Chrome + 1024x768 以上を前提に「どなたでも自由にお使いいただけます」と記載。業務メニューは「一部の管理業務を除き自由にお使いいただけます」ため、新規登録／更新／削除 OK（トライアル環境でのみ）。
- データ汚染注意: 「登録なさった情報は誰でも参照でき」「管理者によって定期的にすべて消去」と明示。実在情報の投入は禁止。
- 利用不可機能: プログラム・マスタ更新、CLAIM通信、プリンタ出力、レセプト一括/電算/CSV などの一括処理が無効化（本文「お使いいただけない機能等」参照）。
- 初期データ: 医療機関コード `1234567`、医療法人オルカクリニック、患者番号桁数 5、`doctor1` 他の職員 ID などが `システムの設定情報` に列挙される。

> 本 Snapshot Summary は `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §0-§1 から参照されるため、接続情報や CRUD 方針を更新する場合は本節を先に編集してから Playbook を同期する。

---

![ORCA PROJECT 日本医師会総合政策研究機構／日レセご紹介サイト](https://jma-receipt.jp/img/common/head_logo.gif)

[![supported by ORCA PROJECT](https://jma-receipt.jp/img/common/head_btn.gif)](http://www.orca.med.or.jp/)

*   [![ご紹介トップ](https://jma-receipt.jp/img/common/menu_01.gif)](https://jma-receipt.jp/index.html)
    
*   [![ソフトの特長](https://jma-receipt.jp/img/common/menu_02.gif)](https://jma-receipt.jp/merit/index.html)
    
*   [![ユーザ事例](https://jma-receipt.jp/img/common/menu_03.gif)](https://jma-receipt.jp/case/hokkaido/index.html)
    
*   [![展示・説明会](https://jma-receipt.jp/img/common/menu_04.gif)](https://jma-receipt.jp/trial/index.html)
    
*   [![導入までの流れ](https://jma-receipt.jp/img/common/menu_05.gif)](https://jma-receipt.jp/step/index.html)
    
*   ![日レセを体験](https://jma-receipt.jp/img/common/menu_06o.gif)
*   [![サポート事業所検索](https://jma-receipt.jp/img/common/menu_07.gif)](http://search.orca.med.or.jp/support/)
    

日医標準レセプトソフトがどのようなソフトなのかを体験できます。

* * *

[ホーム](https://jma-receipt.jp/index.html)
 > 日レセを体験

日医標準レセプトソフトお試しサーバのご案内
=====================

日医標準レセプトソフトを実際に操作して、日常業務をお試しいただくことが可能です。  
ユーザ登録等の操作は不要ですので、どなたでも自由にお使いいただけます。  
（原則24時間365日稼働しますが、メンテナンス時にはお使いいただけない場合があります）  

お使いいただける環境
----------

お試しサーバは以下の環境で動作確認が行われています。

*   ディスプレイ解像度が1024×768以上である事
*   Google Chromeブラウザがインストール済みである事
*   動作確認済みのオペレーティングシステム一覧
    *   Windows 11
    *   Windows 10
    *   macOS 15(Sequoia)
    *   macOS 14(Sonoma)
    *   macOS 13(Ventura)
    *   macOS 12(Monterey)
    *   macOS 11(Big Sur)

注意事項

お試しサーバは公開されていますので、登録なさった情報は誰でも参照できてしまいます。実在の医療機関や患者情報の登録は行わないよう、お願い致します。  
また、登録なさった内容につきましては、管理者によって定期的にすべて消去される仕様としております。

本番稼働時にはクライアントにOSネイティブアプリ・Chrome拡張をインストールすることで、日本語自動ON/OFF、ダイレクトプリントが利用できるようになりますが、お試しサーバでは日本語自動ON/OFF、ダイレクトプリントは利用できません。

  

お試しサーバの接続法
----------

### 1.

Google Chromeブラウザを起動します。

### 2.

アドレスバーに https://weborca-trial.orca.med.or.jp/ を入力してEnterキーを押下します。

### 3.

以下の内容を入力し、「ログイン」をクリックしてください。  
ユーザー　：trial  
パスワード：weborcatrial

![ログイン画面](https://jma-receipt.jp/trialsite/img/weborcalogin.png)

### 4.

日医標準レセプトソフトのマスターメニューが開きます。あらかじめテスト用のデータが入力されています。  
入力内容は[システムの設定情報](https://jma-receipt.jp/trialsite/index.html#system)
で確認できます。  
日次業務をお試しいただくには、「01 医事業務」をクリックして下さい。

![マスターメニュー画面](https://jma-receipt.jp/trialsite/img/weborcam00.png)

### 4.

業務メニューが開きます。一部の管理業務を除き自由にお使いいただけます。

*   [お使いいただけない機能一覧](https://jma-receipt.jp/trialsite/index.html#limit)
    

詳しい操作はオンラインマニュアルで確認できます。

*   [日医標準レセプトソフトのオンラインマニュアル](http://www.orca.med.or.jp/receipt/index.html#manual)
    

初期ユーザに登録されている患者の一覧は以下からご確認いただけます。

*   [登録されている初期データ](https://jma-receipt.jp/trialsite/index.html#sample)
    

![業務メニュー](https://jma-receipt.jp/trialsite/img/weborcam01)

お使いいただけない機能等
------------

### 1\. 次の業務は使用できません

*   プログラム更新
*   マスタ更新
*   システム管理マスタ登録

### 2\. 次の処理を実行することはできません

*   レセプト一括作成  
    （レセプト作成では個別作成のみとします。ただし、レセプト作成処理が終了し印刷指示画面より発行指示するまでに、他の端末よりレセプト作成処理が行われた場合はデータがクリアされプレビューで表示できない場合があります。ご了承ください。）
*   レセプト電算データ作成
*   月次統計データファイル作成
*   データ出力業務でのデータファイル作成
*   外部媒体業務でのデータファイル作成
*   照会業務でのCSVファイル作成

### 3\. 電子カルテ連携（CLAIM通信）はできません

通信の為の CLAIMサーバは起動していませんので接続できません。

### 4\. 帳票印刷関連についてはプリンタ出力できません

印刷処理を行った後で再印刷処理等によりプレビュー表示で確認できるものはあります。

システムの設定情報
---------

以下の設定以外はすべて日医標準レセプトソフトの初期値となっております。

| 1001  <br>医療機関情報－基本 |     |
| --- | --- |
| 都道府県 | 東京  |
| 医療機関コード | 1234567 |
| 医療機関種別 | 診療所 |
| 医療機関名称 | 医療法人　オルカクリニック |
| 院外処方区分 | 院内  |
| 請求額端数区分（減免有） | 10円未満四捨五入 |
| 請求額端数区分  <br>　医保（減免無・保険分）  <br>　労災（減免無・保険分）  <br>　自賠責（減免無・保険分）  <br>　公害（減免無・自費分） | 10円未満端数処理無し |
| 消費税端数区分 | 1円未満切り捨て |
| 請求書発行フラグ | 発行しない |
| 院外処方せん発行フラグ | 発行しない |
| 薬剤情報発行フラグ | 発行しない |
| 前回処方箋発行フラグ | 発行しない |

| 1002  <br>医療機関情報-所在地、連絡先 |     |
| --- | --- |
| 郵便番号 | 1130021 |
| 所在地 | 東京都文京区本駒込２－２８－１６ |
| 電話番号 | xx-xxxx-xxxx |

| 1005  <br>診療科目情報 |     |
| --- | --- |
| 01  | 内科  |
| 02  | 精神科 |
| 10  | 外科  |
| 11  | 整形外科 |
| 26  | 眼科  |

| 1006  <br>施設基準情報 |     |
| --- | --- |
| 0023 | 精神科 |
| 0721 | 在宅時医学総合管理料及び特定施設入居時等医学総合管理料 |
| 0755 | 明細書発行体制等加算 |
| 3168 | 在宅療養支援診療所（３） |

| 1007  <br>自動算定・チェック機能制御情報 |     |
| --- | --- |
| 外来初診・再診料 | 算定する |
| 病名疾患区分からの自動算定 | 算定する |
| 中途終了展開時の自動発生 | 算定する |
| 時間外加算（小児特例） | 算定する |
| 特定薬剤治療管理料 | 算定する |
| 画像診断管理加算 | 算定する |
| 訂正時の自動発生  <br>　（外来）  <br>　（入院） | 算定する |
| 相互作用チェック（月数） | 1   |
| 外来管理加算チェック | チェックあり |

| 1009  <br>患者番号構成管理情報 |     |
| --- | --- |
| 標準構成　連番号桁数 | 5   |

| 1010  <br>職員情報 |     |     |     |     |
| --- | --- | --- | --- | --- |
| 事務職 | 0001 | guest | ゲスト ユーザ | 管理者ではない |
| 医師  | 0001 | doctor1 | 内科 太郎 | 専門科：内科 |
| 医師  | 0003 | doctor3 | 精神科　二郎 | 専門科：精神科 |
| 医師  | 0005 | doctor5 | 整形外科　四郎 | 専門科：整形外科 |
| 医師  | 0006 | doctor6 | 外科　五郎 | 専門科：外科 |
| 医師  | 0010 | doctor10 | 眼科　六郎 | 専門科：眼科 |

| 1038  <br>診療行為機能情報 |     |
| --- | --- |
| 入金の取り扱い | 今回分・伝票の古い未収順に入金 |
| 複数科まとめ集計 | 複数科まとめ集計をする |
| 請求書発行方法 | 全体をまとめて発行 |

| 1039  <br>収納機能情報 |     |
| --- | --- |
| 入金の取り扱い | 伝票の古い未収順に入金 |

| 2005  <br>レセプト・総括印刷情報 |     |
| --- | --- |
| レセプト・基本1　傷病名編集区分 | 連結表示  <br>受診科のみ表示  <br>主病名の編集を行う（区切り有） |
| 労災・自賠責　自賠責・様式選択  <br>　（入院外）  <br>　（入院） | 平成１９年４月改正様式 |

| 4001  <br>労災自賠医療機関情報 |     |
| --- | --- |
| 労災指定医療機関 | 指定あり |
| 点数単価 | １２円 |

登録されている初期データ
------------

公開時（あるいはリセット時）にあらかじめ登録されている初期データは以下のとおりです。  
データは、カルテ事例集(外来版11例)を登録ありますので、併せてご確認ください。  
  
[日レセユーザサイト 操作ガイド カルテ事例集(外来版11例)](http://www.orca.med.or.jp/receipt/manual/karte/)

|     |     |     |
| --- | --- | --- |
| 患者番号 | 患者氏名 | 内容  |
| 00001 | 事例　一 | 国保　整形外科 |
| 00002 | 事例　二 | 社保→国保　内科 |
| 00003 | 事例　三 | 社保　内科 |
| 00004 | 事例　四 | 社保　内科 |
| 00005 | 事例　五 | 国保　整形外科 |
| 00006 | 事例　六 | 後期高齢者　内科 |
| 00007 | 事例　七 | 生活保護　精神科　眼科 |
| 00008 | 事例　八 | 自賠責　整形外科 |
| 00009 | 事例　九 | 労災　整形外科 |
| 00010 | 事例　十 | 自費　外科 |
| 00011 | 事例　十一 | 後期高齢者　内科 |

その他
---

お試しサーバに登録なさった情報は、週に1回程度、登録されている初期データの状態にリセット（消去）いたします。また、状況により不定期にリセットする場合があります。

操作については[日医標準レセプトソフトのマニュアル](http://www.orca.med.or.jp/receipt/index.html#manual)
をご参照ください。

本ソフトウェアを利用するにあたって
-----------------

ORCAMOクライアント（以下、「本ソフトウェア」といいます）は無償で配布されるものですので、本ソフトウェアをダウンロードする利用者は、 日本医師会ORCA管理機構株式会社に対して、本ソフトウェアの動作又は不具合によって生じたあらゆる損失（直接的、間接的、付随的、懲罰的又は 結果的な損害で、これには、損害復旧のためのすべての費用、報酬・信用・見込み利益若しくは代替製品・サービスの逸失、データ若しくは 情報の逸失又はこれらの事象から生じるすべての損害を含みますが、これらに限定されません）について免責し、一切の訴訟上又は訴訟外の請求は しないものとします。この免責は、日本医師会ORCA管理機構株式会社が本ソフトウェアに関連して配布する証明書及び署名の信頼性に関しても同様とします。

[![このページのトップへ](https://jma-receipt.jp/img/common/to_page_top.gif)](https://jma-receipt.jp/trialsite/index.html#wrapper)

* * *

[![ORCAプロジェクト](https://jma-receipt.jp/img/common/orca_project_logo.gif)](http://www.orca.med.or.jp/)
  
  
[![日本医師会](https://jma-receipt.jp/img/common/jma-s.png)](http://www.med.or.jp/)
  

ORCAについて

[ORCAとは](https://www.orca.med.or.jp/orca/index.html)

[医療機関ID申請](https://www.orca.med.or.jp/receipt/id/)

[定点調査研究事業](https://www.orca.med.or.jp/das/index.html)

[日医IT認定制度](https://www.orca.med.or.jp/nintei/)

[日本医師会](http://www.med.or.jp/)

[日本医師会ORCA管理機構](http://www.orcamo.co.jp/)

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

[給管鳥](https://www.orca.med.or.jp/kyukantyo/index.html)

[訪看鳥](https://www.orca.med.or.jp/houkan/index.html)

[特定健康診査システム](https://www.orca.med.or.jp/tokutei/index.html)

サポート

[サポート・コミュニティ](https://www.orca.med.or.jp/support/index.html)

[OSCについて](https://www.orca.med.or.jp/osc/index.html)

[お問い合わせ一覧](https://www.orca.med.or.jp/contact/index.html)

[リンク集](https://www.orca.med.or.jp/support/index.html#link)

* * *
