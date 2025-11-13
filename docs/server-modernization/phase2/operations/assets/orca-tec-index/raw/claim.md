[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/claim.html#content)

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
 > ORCA ProjectにおけるCLAIM実装

ORCA ProjectにおけるCLAIM実装
=======================

【重要】日医標準レセプトソフトCLAIM通信機能廃止のお知らせ
-------------------------------

電子カルテ等システムとの連携おいてCLAIM通信を実装しておりますが、本機能を廃止することになりました。  
  
廃止日：2026年3月末  
  
CLAIM通信で実現できていた機能は、API/PushAPIで利用可能となっていますので、CLAIM通信をご利用の場合、APIへ切り替えをお願いします。  
  
なお、廃止日以降、即時CLAIM通信機能を停止することはおこないませんが、不具合や機能追加はおこないませんのでご留意ください。

メニュー
----

*   [1\. 日レセCLAIM通信について](https://www.orca.med.or.jp/receipt/tec/claim.html#1)
    

*   [1-1. 通信](https://www.orca.med.or.jp/receipt/tec/claim.html#1-1)
    
*   [1-2. 通信の流れ](https://www.orca.med.or.jp/receipt/tec/claim.html#1-2)
    
*   [1-3. 運用形態](https://www.orca.med.or.jp/receipt/tec/claim.html#1-3)
    
*   [1-4. 制限事項](https://www.orca.med.or.jp/receipt/tec/claim.html#1-4)
    
*   [1-5. 日レセとCLAIM通信を行うために](https://www.orca.med.or.jp/receipt/tec/claim.html#1-5)
    
[](https://www.orca.med.or.jp/receipt/tec/claim.html#1-5)

[](https://www.orca.med.or.jp/receipt/tec/claim.html#1-5)
*   [2\. 処理別送受信モジュール説明](https://www.orca.med.or.jp/receipt/tec/claim.html#2)
    

*   [2-1. 日レセ送信時](https://www.orca.med.or.jp/receipt/tec/claim.html#2-1)
    

*   [2-1-1. 受付時](https://www.orca.med.or.jp/receipt/tec/claim.html#2-1-1)
    
*   [2-1-2. 患者登録](https://www.orca.med.or.jp/receipt/tec/claim.html#2-1-2)
    

*   [2-2. 日レセ受信時](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2)
    ([サンプルダウンロード](https://www.orca.med.or.jp/receipt/tec/claim.html#sample)
    )

*   [2-2-1. 共通項目について](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-1)
    
*   [2-2-2. 『診断履歴情報モジュール』について](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-2)
    
*   [2-2-3. 『予約請求モジュール』について](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-3)
    

*   [2-2-3-1. ドクターコードの取り込みについて](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-3-1)
    
*   [2-2-3-2. 予約請求モジュールヘッダ情報(claim:information)の取り込みについて](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-3-2)
    
*   [2-2-3-3. 処方情報(claim:bundle以降)の取り込みについて](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-3-3)
    
*   [2-2-3-4. その他](https://www.orca.med.or.jp/receipt/tec/claim.html#2-2-3-4)
    

*   [3\. 『入院オーダ取り込み(参考提供)』について](https://www.orca.med.or.jp/receipt/tec/claim.html#3)
    

*   [3-1. はじめに](https://www.orca.med.or.jp/receipt/tec/claim.html#3-1)
    
*   [3-2. 通信等について](https://www.orca.med.or.jp/receipt/tec/claim.html#3-2)
    
*   [3-3. 運用について](https://www.orca.med.or.jp/receipt/tec/claim.html#3-3)
    
*   [3-4. 日レセでの設定について(外来設定済の場合)](https://www.orca.med.or.jp/receipt/tec/claim.html#3-4)
    
*   [3-5. その他](https://www.orca.med.or.jp/receipt/tec/claim.html#3-5)
    
*   [3-6. サンプルインスタンス(抜粋)](https://www.orca.med.or.jp/receipt/tec/claim.html#3-6)
    

*   [4\. 『点数金額モジュール(参考提供)送信内容変更について』](https://www.orca.med.or.jp/receipt/tec/claim.html#4)
    

*   [4-1. 自費項目について](https://www.orca.med.or.jp/receipt/tec/claim.html#4-1)
    
*   [4-2. 請求金額等金額情報について](https://www.orca.med.or.jp/receipt/tec/claim.html#4-2)
    
*   [4-3. 保険情報の追加について](https://www.orca.med.or.jp/receipt/tec/claim.html#4-3)
    

*   [5\. 『改定内容』について](https://www.orca.med.or.jp/receipt/tec/claim.html#5)
    

1\. 日レセCLAIM通信について
------------------

### 1-1. 通信

MedXMLコンソーシアムが管理するデータ交換仕様CLAIMを使用するにあたり、日レセとの接続は、TCPソケット通信にておこなうこととします。  
(FTP等のやり取りは、実装していません)  
尚、日レセで使用しているMML,CLAIMのバージョンは以下のとおりです。  
　MML・・・・Version2.3  
　CLAIM・・・Version 2.1 Type B  

### 1-2. 通信の流れ

|     |     |     |
| --- | --- | --- |
| (受付時等)日レセ　→　電子カルテ |     |     |
| 日レセ |     | 電子カルテ |
| soket open | →   |     |
| データ送信 | →   |     |
| EOT(0x04)送信 | →   |     |
|     | ←   | 応答受信ACK(0×06)／NAK(0×15)送信 |
| soket close |     |     |

  

|     |     |     |
| --- | --- | --- |
| (処方、病名)日レセ　←　電子カルテ |     |     |
| 日レセ |     | 電子カルテ |
|     | ←   | soket open |
|     | ←   | データ送信 |
|     | ←   | EOT(0x04)送信 |
| 応答受信ACK(0×06)／NAK(0×15)送信 | →   |     |
|     |     | soket close |

### 1-3. 運用形態

(1) 受付、患者登録処理は、日レセでの処理となります。  
　　日レセから電子カルテへ、患者基本情報等を送信します。  
  
(2) 病名、処方オーダ等の入力は、電子カルテでの処理となります。  
　　電子カルテから日レセへ、診断履歴情報等を送信します。  
  
(3) 電子カルテから送信された情報を基に日レセでの会計処理を行います。  
　　電子カルテから送信された情報は、中途終了データに一旦格納されます。  
　　「21 診療行為」の「中途表示」ボタンを押下することで、送信した患者一覧が表示されます。  
　　この一覧より患者を選択し、会計処理をおこなっていきます。  
  
　　会計終了後、点数金額情報を電子カルテへ送信します。(試用版)  
　　(ver 2.9.1で一部送信項目を追加した。後述『点数金額モジュール(参考提供)送信内容変更について』参照)  
　　これ以外の情報の送受信(電子カルテから患者情報の受取り、予約等)は対応していません。  
　　また現在、本運用として対応しているのは、外来のみです。

### 1-4. 制限事項

予約請求モジュールのclaim:bundleおよびclaim:bundle 内のclaim:itemの日レセ側での受取りはそれぞれ20個がmax となっています。  
診断履歴モジュールによる傷病名の受取りは1度に50病名までです。  
　(ver 4.4.0までは、20病名までです。)  

### 1-5. 日レセとCLAIM通信を行うために

#### 日レセ5.1以前  

端末から sudo dpkg-reconfigure jma-receipt を実行します。  
  
「jma-receipt 用に claim server をスタートしますか?」というメッセージが表示されるので、<Yes>にカーソルをあわせて、「Enter」キーを押してください。  
この設定によりマシン起動時に日レセ側のCLAIM受信サーバが起動します。

#### 日レセ5.2以降

端末から以下のコマンドを実行し、claim.serviceの有効化と起動を行います。  

$ sudo systemctl enable claim.service
$ sudo systemctl start claim.service 

claimの待受ポートを変更する場合は/etc/jma-receipt/jma-receipt.envに以下のように'CLAIM\_PORT=ポート番号'を追記してください。  

CLAIM\_PORT=9000 

日レセCLAIM送信設定については「システム管理」-「CLAIM接続情報」のマニュアルをご覧ください。

2\. 処理別送受信モジュール説明
-----------------

CLAIMで特に詳細な規定がない部分で日レセ←→電子カルテでの情報のやり取りが行いやすいよう日レセ側で設定をお願いしている部分があります。  
以降、処理別、モジュール別に説明していきます。  
(なお日レセver 4.0.0 以降では、医療機関IDが必須設定となりますので、[CLIAMインスタンスのグループ診療対応](https://ftp.orca.med.or.jp/pub/data/receipt/tec/claim-400-2007-11-21.pdf)
 \[PDF\]をご確認ください。)

### 2-1. 日レセ送信時

#### 2-1-1. 受付時

受付時には、日レセから  
・患者情報モジュール  
・健康保険情報モジュール  
・予約請求モジュール(初再診の情報、メモ登録内容)  
の送信を行います。  
  
このとき「健康保険情報モジュール」の「mmlHi:ClassCode」については、保険の種類、組合せによって以下のように設定しています。  

|     |     |
| --- | --- |
| mmlHi:ClassCode | 保険の種類 |
| Rx  | 労災・自賠(x：該当の保険番号マスタの保険番号の3桁目) |
| Zx  | 自費(xは同上) |
| Ax  | 治験 90x(xは同上)　　(ver 4.5.0以降) |
| Bx  | 治験 91x(xは同上)　　(ver 4.5.0以降) |
| K5  | 公害  |
| 39  | 後期高齢者 |
| 40  | 後期特療費(後期高齢者医療特別療養費) |
| 09  | 協会けんぽ |
| XX  | 公費単独 |
| 99  | 包括入力(※) |

労災自倍、および包括入力を電子カルテから設定された場合、公費は無視します。  
労災・自賠責は対象の保険が最初に一致した保険組合せを受取り対象とします。  
  
(※）  
包括入力については、電子カルテからの戻りのみ設定可能です。  
包括入力は、システム管理のチェックはしていないので、システム管理を包括入力すると設定して下さい。  
設定をおこなわないと保険対象なしとなります。  
また、包括入力は、診察料を除き入力内容をすべて対象します。  
  
受付時に選択した保険は、健康保険情報モジュールの先頭に出現させ claim:insuranceUid にそのuidを設定します。  
  
受付時の「診療内容」は、claim:appoint 内のclaim:memoに設定し、受付および診療行為にて該当患者の「メモ2」を登録している場合、その内容をclaim:memoに設定して送信します。(点数金額モジュールも同様)  
  
<claim:memo>検診にて鉄欠乏性貧血を認め来院</claim:memo>  
この場合、予約請求モジュールのclaim:status はclaim:status="memo"とします。  

#### 2-1-2. 患者登録

患者登録時の送信内容は、受付時とほぼ同様です。  
  
この機能は、運用として受付をおこなわない医療機関に対してCLAIMによるデータの送受信を可能とする為に設けた機能です。  
(患者の基本情報を電子カルテに送信する)  
  
システム管理のオプションの設定により、患者登録時に患者基本情報および健康保険情報等の送信が可能となります。  
仕様は次のとおりです。  
  
・システム管理の設定により患者登録時に相手先に向け各モジュールを送信します。  
(ただし、受付処理ではないので、診療科、受付時間、初再診情報は正しい情報を送れません。  
あくまで患者情報、健康保険情報のみ最新の内容として扱っていただきます)  
  
・<claim:information claim:status="regist" を受付と識別可能とする為claim:status="info"に設定して送信します。

### 2-2. 日レセ受信時

日レセで受信したインスタンスの内、取り込みを行うのは、診断履歴情報、予約請求モジュール(処方データ)なのでモジュール別での説明をおこないます。  
  
全体のコメント付きサンプルは以下をご確認ください。  
[サンプルダウンロード](https://ftp.orca.med.or.jp/pub/data/receipt/tec/claim_rcv_samplw01_euc.zip)
  

#### 2-2-1. 共通項目について

以下の項目を受取ります。(設定方法の詳細は、サンプルをご覧ください)  

|     |     |     |
| --- | --- | --- |
| a.  | 医療機関ID | MmlHeaderの施設情報の施設ID(mmlCm:Id)に設定します。 |
| b.  | 診療科 | MmlHeaderの診療科情報の診療科ID(mmlCm:Id)に設定します。 |
| c.  | 患者番号 | MmlHeaderのmasterIdに設定します。 |

  

#### 2-2-2. 『診断履歴情報モジュール』について

上記モジュールより、患者の傷病名の取り込みをおこないます。  
受け取る項目は下記の内容です。

|     |     |
| --- | --- |
| a.  | 分類(categories)(主病名、と疑い病名のみ) |
| b.  | 疾患開始日(startDate) |
| c.  | 疾患終了日(endDate) |
| d.  | 転帰(outcome) |
| e.  | 疾患名(diagnosis,diagnosisContentsどちらも可) |
| f.  | 入外区分(InOutPatient) |

患者病名に対して更新可能なものは以下のとおりです。

|     |     |
| --- | --- |
| 1.  | 疾患終了日 |
| 2.  | 転帰情報 |
| 3.  | 分類(categories)の情報  <br>  <br>「胃炎」(疑いフラグ設定なし)の状態で"MML0015"suspectedDiagnosis を設定して送信すると「胃炎」に対して疑いフラグが設定されます。  <br>また「胃炎」 疑いフラグ設定あり又は「胃炎の疑い」に対して"MML0015"suspectedDiagnosis を設定せずに送信すると「胃炎」 疑いフラグ設定なしの状態で設定されます。  <br>主病名(mainDiagnosis)も同様の動作となります。 |
| 4.  | 「の疑い」修飾語文字(修飾語病名コード)の情報「の疑い」に関しては上記3と同様の動作となります。(付け外しが可能) |

また傷病名に対して健康保険情報モジュールの設定はおこないません。  
  
転帰については、日レセの転帰区分にあわせ以下のように置換しています。  

|     |     |
| --- | --- |
| 日レセ転帰区分 |     |
| 1   | 治ゆ  |
| 2   | 死亡  |
| 3   | 中止  |
| 4   | 移行  |

  

|     |     |
| --- | --- |
| 置換内容 |     |
| died | 2   |
| worsening | 3   |
| unchanged | 3   |
| recovering | 3   |
| fullRecoverd | 1   |
| sequelae | 3   |
| end | 1   |
| pause | 3   |
| continued | 3   |
| transfer | 3   |
| transferAcute | 3   |
| transferChronic | 3   |
| home | 3   |
| unknown | 3   |

これ以外は、すべて1：治ゆ　の扱いとしています  
  
delete 疑い、急性、開始日、病名コード、転帰日等完全一致したものに対し、削除フラッグを設定します。(ver 4.7.0以降)  
  
疾患名については、基本的に疾患コードを優先します。  
疾患コードとして取り込めるのは、レセプト電算処理システムの傷病名マスターの傷病名コード(7桁コード)のみです。  
疾患コードが不正な場合、疾患名より疾患コードが設定できるものは、疾患コードを疾患名より編集します。  
共に不正の場合は、未コード化とし疾患名に「？？？？？」を設定します。  
また、疾患名を「diagnosis」で設定した場合の疾患コードは、ピリオドで区切って設定します。  
  
診断履歴情報モジュールサンプル  
・「diagnosis」の場合  
　疾患名：発作性心房細動  
<mmlRd:RegisteredDiagnosisModule>  
<mmlRd:diagnosis mmlRd:code = "4042.4273006" mmlRd:system = "Diagnosis" >  
　発作性心房細動  
</mmlRd:diagnosisv>  
  
4042：発作性(修飾語は、ZZZ4042も可)  
4273006：心房細動  
  
・「diagnosis」の場合  
<mmlRd:RegisteredDiagnosisModule>  
　<mmlRd:diagnosisContents>  
　　<mmlRd:dxItem>  
　　　<mmlRd:name mmlRd:code = "ZZZ4042" mmlRd:system = "Diagnosis" >  
　　　　発作性  
　　　</mmlRd:name>  
　　</mmlRd:dxItem>  
　　<mmlRd:dxItem>  
　　　<mmlRd:name mmlRd:code = "4273006" mmlRd:system = "Diagnosis" >  
　　　　心房細動  
　　　</mmlRd:name>  
　　</mmlRd:dxItem>  
　</mmlRd:diagnosisContents>  
　<mmlRd:startDate>2003-08-07</mmlRd:startDate>  
　<mmlRd:endDate>2003-10-17</mmlRd:endDate>  
　<mmlRd:categories>  
　　<mmlRd:category mmlRd:tableId = "MML0012">mainDiagnosis</mmlRd:category>  
　</mmlRd:categories>  
</mmlRd:RegisteredDiagnosisModule>  
  
入外区分の設定について(ver4.7以降)

|     |     |
| --- | --- |
| mmlRd:InOutPatient |     |
| outpatient | 外来  |
| inpatient | 入院  |

※　但し、日レセ側に、同一内容で入外それぞれに病名が存在している場合に 空白を設定しても、対象の病名が確定できないため更新はしません。  
  
サンプル  
<mmlRd:endDate>2009-04-14</mmlRd:endDate>  
<mmlRd:outcome >fullRecoverd</mmlRd:outcome>  
<mmlRd:InOutPatient>outpatient</mmlRd:InOutPatient>  
  
同一病名の取扱いについて(2014/10/27提供 パッチ取り込み以降)  
開始日の異なる同一病名を送信する場合、転帰情報を含む病名を先に出現させてください。  
今回、日レセと同様のチェックを追加したことにより、上記逆のケースでは、転帰情報のない病名は、追加不可となります。(病名エラーチェック追加)  

#### 2-2-3. 『予約請求モジュール』について

上記モジュールより、患者の処方等のオーダの取り込みをおこないます。  
患者番号、診療科の決定は、診断履歴情報モジュールと同様です。  

#### 2-2-3-1. ドクターコードの取り込みについて

ドクターコードは、予約請求モジュールの作成者情報の個人情報の個人ID(mmlCm:Id)に設定します。  
但し、先頭に「1」を付与して5桁で設定してください。  

#### 2-2-3-2. 予約請求モジュールヘッダ情報(claim:information)の取り込みについて

受け取る項目は下記の内容です。

|     |     |
| --- | --- |
| a.  | 診療年月日(performTime) |
| b.  | 入外区分(admitFlag) |
| c.  | 健康保険情報(insuranceUid) |
| d.  | 時間外区分(timeClass)  <br>※予約等の情報は、受け取りません。 |

  

#### 2-2-3-2-1. 保険の決定について

該当保険の決定は、以下の仕様としています。  
日レセに送信されてきたインスタンスの「insuranceUid」が受付時に日レセから送信したインスタンスの健康保険情報モジュールの「uid\]と一致した場合は、その保険の組合せを対象とします。  
UID による保険組合せ取得に失敗した場合、送信された健康保険情報モジュールより保険情報の取得をおこないます。  
  
これにより保険組合せが確定できない場合は、保険組合せ番号にゼロを設定し診療行為画面での呼び出し後に保険組合せの変更を促すメッセージを表示しますので、該当の保険組合せに変更して下さい。  
※insuranceUidを使用する場合、日レセ側では、診療科、患者単位に最終送信情報しか保有していないので、予約請求情報送信前に同一患者で同時に複数回受付を行った場合等には、最後に受け取った保険のuidを設定して送信してください。  

#### 2-2-3-2-2. 時間外区分について

日レセで取り扱える時間外区分(timeClass)は以下のとおりです。

|     |     |
| --- | --- |
| 乳幼児時間外特例 |
| 5   | 乳幼児夜間加算 |
| 6   | 乳幼児休日加算 |
| 7   | 乳幼児深夜加算 |
| 8   | 夜間・早朝加算 |

  

#### 2-2-3-3. 処方情報(claim:bundle以降)の取り込みについて

受け取る項目は下記の内容です。  

|     |     |
| --- | --- |
| a.  | 診療行為区分名(classCode) |
| b.  | 用法(adminCode)後述の用法設定を推奨します。 |
| c.  | 回数(日数)(bundleNumber) |
| d.  | 請求コード(code) |
| e.  | 数量(number) |

現在claim:bundle、claim:itemのmaxが20となっていますが包括検査の場合に限り別bundleに設定されても1つに纏めます。  

#### 2-2-3-3-1. 日レセ固有設定方法について

以下の項目については、固有の設定方法により情報を取り込みます。  
  
1.撮影部位、フィルム、分画数の設定  
2.差し込みコメントの設定  
3.セットコードの設定  
4.その他  

#### 2-2-3-3-2. 撮影部位、フィルム、分画数の設定について

撮影部位、フィルム等についての設定は、CLAIMの規約(location等)を使用せず、請求コード(code)を使用しています。  
これは、日レセと電子カルテでコードを合わせる必要がありますが、各医療機関で自由にコードが設定可能となるよう対応したものです。  
また分画数については、フィルムのclaim:numberにフィルム枚数\*分画数をx-yと設定することで取り込みます。  
  
部位の設定については、locationによる指定ではなく、汎用性を持たせる為、通常のclaim:codeに設定することで対応しています。  
但し、日レセで提供している撮影部位コードは参考のためのコードですのでユーザーにおいて、必要な撮影部位は、日レセおよび電子カルテで同一のコードを作成してください。  
設定サンプル  
(部位：胸部)  
<claim:bundle claim:classCode = "700" claim:classCodeId = "ORCA" >  
　<claim:className>画像診断料</claim:className>  
　 <claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:subclassCode = "0" claim:subclassCodeId = "Claim003" claim:code = "002000004" claim:tableId = "ORCA" >  
　　<claim:name>胸部</claim:name>  
　</claim:item>  
　<claim:item claim:subclassCode = "0" claim:subclassCodeId = "Claim003" claim:code = "170000410" claim:tableId = "ORCA" >  
　　<claim:name>単純撮影(イ)の写真診断</claim:name>  
　</claim:item>  
※フィルム、用法も同様の設定です。  

コメントその他について一部年月等受取れるよう対応しているものもあります。これ以降サンプルを基にいくつか説明します。  
  
設定サンプル  
(コメント：フリー、83系コメント)  
コメントコード(810000001及び83xxxxxxx)に限りclaim:item内のclaim:nameの内容を不正なコード等なければそのまま取り込みます。  
最大80バイト  
(但し、83系のコメントの先頭固定文字は、日レセにあわせる必要があります。レセ電データが不正となる可能性があります。  
830000014　血中濃度測定薬剤名：ネオフィリン　の「血中濃度測定薬剤名：」の部分)  
  
(コメント：84系コメント)  
84xxxxxxxの回数、年月等をclaim:numberに設定することで日レセに取り込みます。  
  
<claim:item claim:subclassCode = "2" claim:subclassCodeId = "Claim003" claim:code = "840000003" claim:tableId = "mstClaim" >  
　<claim:name>ＸＸ月ＸＸ日まで乳幼児</claim:name>  
　<claim:number claim:numberCode = "10" claim:numberCodeId ="Claim004" claim:unit = "日" >  
　　01-08 ←この部分  
　</claim:number>  
</claim:item>  
  
01-08が年月日の場合は、16-3-3のようにハイフンで連結して下さい。  
上記の場合「０１月０８日まで乳幼児」と展開されます。  

#### 2-2-3-3-4. セットコードの設定について

日レセで作成したセットコードと同じ内容で電子カルテ等で管理をおこなっている場合、セットコードを設定することでそれに設定された内容で展開することが可能です。  
(itemが20行を超える包括検査等でも1つのitemで設定することも可能です。)  
なお、セットコードに診療種別区分を設定することを推奨します。  
  
設定サンプル  
(セットコード：P01022)  
  
<claim:item claim:subclassCodeId="Claim003" claim:code="P01022" claim:tableId="tbl\_tensu">  
　<claim:name>花粉症セット</claim:name>  
　<claim:number claim:numberCode = "10" claim:numberCodeId ="Claim004" claim:unit = "日" >  
　　01-08  
　</claim:number>  
</claim:item>  

#### 2-2-3-3-5. 自動発生コードの受取について(ver 4.5.0以降)

基本的に自動発生するコードの受取は、おこないませんがシステム管理「1007 自動算定・チェック機能制御情報」で薬剤情報提供料の自動発生を全て「0 算定しない」とした場合に限って受け取りをおこなうよう変更しました。  
また、調剤技術基本料についても同様とします。  

#### 2-2-3-3-6. 拡張漢字の取扱について(ver 4.5.0以降)

現状の日レセ側のclaim処理では、拡張漢字の変換処理に問題があるため、拡張漢字は「■」に置換して送信します。  

#### 2-2-3-3-7. 治験の取扱について(ver 4.5.0以降)

治験保険を設定した場合は、診察料の発生はおこないません。  
治験減点分、薬評・器評のコード等は、claim:item の先頭に設定する必要があり、この claim:bundle 内には、コメントのみ設定可能です。  
(詳細については、診療行為入力のマニュアルの内容に従います)  
  
設定サンプル  
(治験減点分 減点点数 200)  
  
<claim:bundle claim:classCode = "120" claim:classCodeId = "ORCA" >  
　<claim:className>再診</claim:className>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:subclassCode = "0" claim:subclassCodeId = "Claim003" claim:code = "199000210" claim:tableId = "ORCA" >  
　　<claim:name>包括点数の治験減点分</claim:name>  
　　<claim:number claim:numberCode = "10" claim:numberCodeId ="Claim004" claim:unit = "点" >  
　　　200 ←減点点数  
　　</claim:number>  
　</claim:item>  
</claim:bundle>  

#### 2-2-3-3-8. 一般名処方の設定について(H24.3.21リリース)

電子カルテ等から、医薬品に対し一般名指示等をおこないたい場合には、以下の設定により送信してください。  
※　上記設定が有効となるのは、内服、外用、頓服のみです。  
　　但し、加算には関係ありませんが、注射でも一般名記載指示を許可します。  
  
一般名指示の情報として数量コード( claim:numberCode="xx") を使用する。  
claim:numberCode="90" :一般名指示  
claim:numberCode="91" :銘柄指示  
上記以外 :日レセの設定指示に従う  
  
設定サンプル  
一般名指示の場合  
<claim:item claim:subclassCodeId="Claim003" claim:code="612140711" claim:tableId="tbl\_tensu">  
　<claim:name>タナトリル錠２．５ｍｇ</claim:name>  
　<claim:number claim:numberCode="90" claim:numberCodeId="Claim004">1</claim:number>  
</claim:item>  
  
また、医薬品の直下にclaim:item により日レセのシステム予約コード(一般名記載:099209908)等の設定も可能ですが、claim:numberCodeによる指示がある場合は、そちらを優先します。  

#### 2-2-3-4. その他

入院用処方インスタンスの取り込み(試用版)  
現在の仕様は、次のとおりです。  
  
・複数処方データ受信機能  
入院患者に対し、同一日、同一保険で複数送信された場合、中途終了状態であっても全て受取ることが可能 (例えば、検査処方を送信し日レセで中途終了のままで再度同一患者に向け薬剤の情報を送信しても全て受信し１つにまとめます。  
ただし、同一データを重複送信しても受取る等問題があるので注意が必要です)  
  
・bundle(剤)分解処理  
点滴注射等一部日レセの入力形態にあわせ剤を分離して取り込みます。  
  
・複数診療日の受取について(ver 4.5.0以降)  
診療データおよび異動データの一部(食事)の複数診療日付の受取を可能としました。  
  
設定形式は、以下のとおりとします。  
<claim:bundleNumber>\*n/xx1,xx2-xx3,xx4</claim>　:「n:回数 xxi:日付」  
例) 1日、3日、5日〜10日に診療がある場合は  
\*1/1,3,5-10  
となります。  
  

### 3\. 『入院オーダ取り込み(参考提供)』について

#### 3-1. はじめに

当面この入院オーダ取り込み機能は、入院版CLAIM規格(案)を基に実装を進めることとします。  
入院版CLAIM規格(案)… [http://www.medxml.net/](http://www.medxml.net/)
 の入院版CLAIM規格(案)を参照  
なお、入院オーダ取り込みについては、日レセ ver 3.2.0以降での対応となります。  

#### 3-2. 通信等について

外来版日レセCLAIM通信と同様とします。  

#### 3-3. 運用について

相手システム->日レセインスタンス送信->日レセ画面修正、登録(必要時のみ)  

#### 3-4. 日レセでの設定について(外来設定済の場合)

#### 3-4-1. 訂正確認画面表示について

日レセ「91 マスタ登録」->「101 システム管理マスタ」->「9000 CLAIM接続情報」のオプション「入院オーダ取込」を「有」とすることで「31 入退院登録」の「オーダ」ボタンよりオーダ確認画面へ遷移が可能となります。  

#### 3-4-2. 入院オーダ確認リストについて

日次統計より参考提供の「入院オーダ確認リスト」を出力することが可能となります。  
日レセ「91 マスタ登録」->「101 システム管理マスタ」->「3001 統計帳票出力情報(日次)」の「複写」ボタンにより参考提供帳票の印刷が可能となります。  

#### 3-4-3. 入院会計データの作成について(入院会計一括作成処理)

入院登録時の入院会計データについてはオンラインで処理した場合と同様に入院月を含めて2ヶ月分作成します。  
入院が長期となる患者については、月次統計業務より入院会計データを作成する必要があります。  
日レセ「91 マスタ登録」->「101 システム管理マスタ」->「3002 統計帳票出力情報(月次)」の「複写」ボタンにより入院会計の一括作成が可能となります。  

#### 3-5. その他

#### 3-5-1. 共通事項

異動日については、外来同様インスタンス上の「claim:performTime」とします。  
その他、保険等については外来同様の位置から取得することとします。  

#### 3-5-2. 制限事項

#### 3-5-1-1. 訂正項目について(共通)

以下の項目については、送信後エラーとなった場合でも日レセでの修正を認めません。  
・異動日  
・患者番号  
・Claim010(入退院、給食区分コード)  
・Claim011(入退院、給食区分コード)  

#### 3-5-1-2. 過去分異動日の取扱

異動日の属する診療年月が前々月以前の場合はエラーとします。  
(改正対応前のデータの処理不可のため)  

#### 3-5-1-3. 異動別(入院登録)

「入院登録」事由の「特定入院」については、一旦、日レセで受信した時点でエラーとします。  
これは、特定入院料コードの設定方法についての取り決めが不明のためです。  
(療養病棟入院基本料２・有床診療所療養病床入院基本料２については特定入院料ではありませんが、この入院料は患者の状態によって入院基本料Ａ〜Ｅが決定する為、病棟・病室設定はできません。  
よって特定入院料と同様に受信した時点でエラーの扱いとします)  
  
また「継続入院」の場合も、継続前の情報のやりとりが確定していないため受信した時点でエラーの扱いとします。  

#### 3-6. サンプルインスタンス(抜粋)

基本的にClaim010(入退院、給食区分コード)からClaim013(継続入院区分コード)までとClaim018(食事時間コード)は、入院版CLAIM規格(案)に従います。  
  
Claim014(病棟コード) …日レセシステム管理情報「病棟管理情報設定」画面の病棟名称コードに従うこととします  
Claim015(病室コード) …日レセシステム管理情報「病棟管理情報設定」画面の病室番号に従うこととします  
Claim016(室料差額) …日レセに設定されている室料差額(金額)を設定することとします  
Claim017(担当医コード)…日レセに設定されている担当医コードを設定することとします (外来と同様)  

#### 3-6-1. 入院登録サンプル

通常の日レセオンラインの入院登録と異なるのは食事の状態はすべて「食事なし」として登録することです。  
<claim:bundle claim:classCode="01" claim:classCodeId="Claim010">  
　<claim:className>入退院異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>31</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="001">  
　　<claim:name>入院</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim012" claim:code="01">  
　　<claim:name>一般入院</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim014" claim:code="01">  
　　<claim:name>南病棟</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim015" claim:code="101">  
　　<claim:name>１０１号室</claim:name>  
　</claim:item>  
　<!-- ここまで必須項目 -->  
　<claim:item claim:tableId="MML0028" claim:code="02">  
　　<claim:name>小児科</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim016" claim:code="4000">  
　　<claim:name>４０００円</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim017" claim:code="10001">  
　　<claim:name>太郎</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim017" claim:code="0002">  
　　<claim:name>花子</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-2. 退院登録サンプル

退院事由については、現状日レセではシステム管理「5013 退院事由情報」の内容を設定する仕様となっています。  
退院登録インスタンスからの退院事由の設定は、tableId="MML0016"に設定されているname(この例では「死亡による」)の内容と上記システム管理の内容を比較し一致すればそれを設定すます。  
<claim:bundle claim:classCode="01" claim:classCodeId="Claim010">  
　<claim:className>入退院異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>31</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="002">  
　　<claim:name>退院</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="MML0016" claim:code="02">  
　　<claim:name>死亡による</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-3. 転棟転室サンプル

<claim:bundle claim:classCode="01" claim:classCodeId="Claim010">  
　<claim:className>入退院情報</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="003">  
　　<claim:name>転棟</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim012" claim:code="02">  
　　<claim:name>特別入院</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim014" claim:code="02">  
　　<claim:name>南病棟</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim015" claim:code="201">  
　　<claim:name>２０１号室</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="MML0028" claim:code="02">  
　　<claim:name>小児科</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-4. 転科サンプル

設定内容は 6-3.転棟転室 と同様です。  

#### 3-6-5. 外泊サンプル

外泊インスタンスが登録されると一旦それ以降全て外泊状態とし食事については「食事なし」の状態とします。  
また外泊中に外泊のインスタンスを送信されてもそのまま受け取ります。  
  
例)4日外泊 -> 6日帰院 -> 5日外泊は4日からの外泊となります。  
<claim:bundle claim:classCode="01" claim:classCodeId="Claim010">  
　<claim:className>入退院異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="006">  
　　<claim:name>外泊</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-6. 帰院サンプル

<claim:bundle claim:classCode="01" claim:classCodeId="Claim010">  
　<claim:className>入退院異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="007">  
　　<claim:name>帰院</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-7. 給食サンプル

給食(食事)インスタンスについては再送を認めます。  
<claim:bundle claim:classCode="02" claim:classCodeId="Claim010">  
　<claim:className>食事異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="010">  
　　<claim:name>特食</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim018" claim:code="02">  
　　<claim:name>昼</claim:name>  
　</claim:item>  
</claim:bundle>  
<claim:bundle claim:classCode="02" claim:classCodeId="Claim010">  
　<claim:className>食事異動</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="012">  
　　<claim:name>食止め</claim:name>  
　</claim:item>  
　<claim:item claim:tableId="Claim018" claim:code="03">  
　　<claim:name>夜</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-8. 入院取消サンプル

<claim:bundle claim:classCode="11" claim:classCodeId="Claim010">  
　<claim:className>入院取消</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="001">  
　　<claim:name>入院</claim:name>  
　</claim:item>  
</claim:bundle>  

#### 3-6-9. 入院取消(会計含む)サンプル

<claim:bundle claim:classCode="12" claim:classCodeId="Claim010">  
　<claim:className>入院取消</claim:className>  
　<claim:administration></claim:administration>  
　<claim:bundleNumber>1</claim:bundleNumber>  
　<claim:item claim:tableId="Claim011" claim:code="001">  
　　<claim:name>入院</claim:name>  
　</claim:item>  
</claim:bundle>  

### 4\. 『点数金額モジュール(参考提供)送信内容変更について』

点数金額モジュールの送信内容に以下を追加しました。  
  
・自費項目追加  
・請求金額等金額情報の追加  
・保険情報の追加  
以上三点について内容を追加して送信することとします。  

#### 4-1. 自費項目について

自費項目については、消費税なしを診療行為区分コード(claimA:classCode="014")とし消費税有りを(016)に設定し送信します。  
  
設定内容については

|     |     |
| --- | --- |
| claimA:className | 「自費(消費税あり)」 or 「自費(消費税なし)」 |
| claimA:claimBundleRate | 合計金額を設定 |
| claimA:code | 自費1〜10の該当する番号を4桁で設定 |
| claimA:name | 自費1〜10の該当する名称(文書料等)を設定 |
| claimA:claimRate | 自費1〜10の該当する金額を設定 |

※消費税ありの場合は、claimA:code="0099"に消費税計を設定します。  
　投薬等の自費分についても同様です。  

#### 4-2. 請求金額等金額情報について

請求金額等金額情報については、診療行為区分コード(claimA:classCode="000")に設定し送信します。  
  
設定内容については  

|     |     |
| --- | --- |
| claimA:className | 「その他」 |
| claimA:claimBundlePoint | 診察料等の合計点数 |
| claimA:claimBundleRate | 伝票番号を設定 |
| claimA:code | 1からの連番を4桁で設定  <br>0001 〜 0010については「初・再診料」、「医学管理等」等を設定(これらについては、claimA:claimRateに各点数を設定)  <br>0011 〜については「負担金額」等設定(これらについてはclaimA:claimRateに各金額を設定)  <br>※訂正時にはclaimA:code="0018"に「訂正分請求金額」を設定し、claimA:claimRateに前回請求額との差分を+-で設定します。 |

また請求金額については、複数科入力を行った場合には、それぞれの科での点数、金額の設定とします。  

#### 4-3. 保険情報の追加について

点数金額モジュールのmmlHi:insuranceClass以降に主保険の情報を設定しました。  
(最終的には、健康保険情報モジュールを設定予定)

### 5\. 『改定内容』について

*   コメントコード対応  
    *   [「85XXXXXXX」「831XXXXXX」のコメントコード対応について](https://www.orca.med.or.jp/receipt/tec/comment85-831-claim.html)
         (2020-06-04) 
    *   [「842XXXXXX」「830XXXXXX」のコメントコード対応および、撮影部位コード対応について](https://www.orca.med.or.jp/receipt/tec/comment842-830-bui-claim.html)
         (2020-06-04)  
        
*   平成30年4月診療報酬改定

*   [2018年4月CLAIM改正対応](https://ftp.orca.med.or.jp/pub/data/receipt/tec/claim/201804-kaisei-taiou-claim_20180403.pdf)
     \[PDF\] (2018-04-03)  
    

### 更新履歴

*   2016-10-26：労災・自賠責のときは本人家族区分を本人にする  
    　　　　　　　　　健康保険情報モジュールの本人家族区分に関して、労災、自賠責の場合は  
    　　　　　　　　　(mmlHi:familyClass)を本人(true)として送信するよう変更しました。
*   2016-06-27：自費金額の桁数を 5 -> 7 桁に拡張  
    　　　　　　　　　入院の剤の日付指定の桁数を 20 -> 50桁に拡張
*   2014-11-10：病名エラーチェック追加
*   2013-06-04：傷病名入外区分設定対応
*   2012-12-03：傷病名削除対応
*   2012-03-08：一般名処方指示対応(H24改定対応)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > ORCA ProjectにおけるCLAIM実装

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/claim.html#wrapper)

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
