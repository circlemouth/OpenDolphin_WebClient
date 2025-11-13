[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#content)

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
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 中途終了データ作成

中途終了データ作成
=========

メニュー
----

参考: [ORCA\_ProjectにおけるCLAIM実装](https://www.orca.med.or.jp/receipt/tec/claim.html)

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#history)
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#reqsample)
    
*   [PUSH通知サンプル](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#pushsample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#rubysample)
    
*   [エラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#errmsg)
    
*   [エラーメッセージ一覧(診療行為)](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#errmsg2)
    
*   [エラーメッセージ一覧(病名)](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#errmsg3)
    
*   [警告メッセージ一覧(診療行為)](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#warnmsg)
      
    
*   [警告メッセージ一覧(病名)](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#warnmsg2)
      
    

更新履歴
----

2025-05-02    「リクエスト一覧」にAdmission\_Dateを追加。  
　　　　　　 「レスポンス一覧」にAdmission\_Dateを追加。  

2023-06-26    「リクエスト一覧」にMedical\_Pushを追加。  

2021-01-27    「リクエスト一覧」に項目を追加。  
　　　　　　　 「レスポンス一覧」に項目を追加。  

2017-04-26    「リクエスト一覧」に項目を追加。

2016-11-28    「レスポンス一覧」の項目名を変更。  
                    Medical\_Warning\_Inf → Medical\_Warning\_Info  
                    Disease\_Warning\_Inf → Disease\_Warning\_Info  

2016-06-29    入院日付まとめ入力対応  
                    Medical\_Class\_Number（入力桁数拡張 20→50桁に変更）  
                    自費金額対応  
                    Medication\_Number（入力桁数拡張 5→7桁に変更）

2015-12-21   「リクエスト一覧」に項目を追加。  
　　　　　　　「Rubyによるリクエストサンプルソース」を修正。

2015-02-27   「リクエスト一覧」の転帰区分の説明を一部修正。  

  

概要
--

POSTメソッドによる中途終了データの登録、変更、削除を行います。

また、中途データ追記機能を外来でも可能とします。(Ver4.7.0\[第59回パッチ適用\]以降)

(claimの日レセで受信する機能とほぼ同等の機能を持ったAPIになります。)

リクエストおよびレスポンスデータはxml2形式になります。

テスト方法
-----

1.  参考提供されている sample\_medical\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_medical\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせ、送信したい情報を設定します。
3.  ruby sample\_medical\_v2.rb により接続します。
4.  claim接続との仕様の違い
    
    4-1.claim:insuranceUid に対応する項目は設けておりません(UIDによる保険情報の取得は行いません。)
    
    4-2.claim:administration 等に対応する項目は設けておりません。
    
    (この項目を使用したコードの設定ではなく全て claim:item に対応するMedication\_Code による設定とします。)　
    
5.  claim:timeClass に対応する項目は設けておりません(上記4-3と同様)
6.  Medical\_Information の最大設定数を20から40に変更
7.  Medication\_info の最大設定数を20から40に変更

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api21/medicalmodv2?class=01 
    class=01（登録）
    class=02（削除）
    class=03（変更）  
    class=04 (外来追加)  
  
Content-Type: application/xml  
  
※class=01 (登録) の場合は、診療データ、病名データともに設定可能です。  
　但し、必要に応じて診療データ、病名データのみでの送信も受け取り可能です。  
　(病名の個別追加、変更、削除は、このclass値で行なって下さい)  
  
※class=02,03,04 (削除、変更、外来追加) の場合は、診療データのみに対するclass値です。  
　こちらの場合は、病名データを設定しても無効となります。

application/xml の場合の文字コードは UTF-8 とします。

<data>        <medicalreq type\="record"\>                <InOut type\="string"\></InOut>                <Patient\_ID type\="string"\>17</Patient\_ID>                <Perform\_Date type\="string"\>2014-10-17</Perform\_Date>                <Perform\_Time type\="string"\>14:10:12</Perform\_Time>                <Medical\_Uid type\="string"\></Medical\_Uid>                <Admission\_Date type\="string"\>2014-10-01</Admission\_Date>  
<!-- ========================================================== -->  
<!--                    診療データ                              -->  
<!-- ========================================================== -->                <Diagnosis\_Information type\="record"\>                        <Department\_Code type\="string"\>01</Department\_Code>                        <Physician\_Code type\="string"\>10001</Physician\_Code>                        <HealthInsurance\_Information type\="record"\>                                <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>                                <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                                <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>                                <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                                <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>                                <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>                                <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                                <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>                                <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>                                <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>                                <Certificate\_StartDate type\="string"\></Certificate\_StartDate>                                <Certificate\_ExpiredDate type\="string"\></Certificate\_ExpiredDate>                                <PublicInsurance\_Information type\="array"\>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>                                                <Certificate\_IssuedDate type\="string"\></Certificate\_IssuedDate>                                                <Certificate\_ExpiredDate type\="string"\></Certificate\_ExpiredDate>                                        </PublicInsurance\_Information\_child>                                </PublicInsurance\_Information>                        </HealthInsurance\_Information>                        <Medical\_Information type\="array"\>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>120</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>再診</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>112007410</Medication\_Code>                                                        <Medication\_Name type\="string"\>再診</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>210</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>内服薬剤</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>620001402</Medication\_Code>                                                        <Medication\_Name type\="string"\>グリセリン</Medication\_Name>                                                        <Medication\_Number type\="string"\>2</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\>yes</Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>500</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>手術</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>150003110</Medication\_Code>                                                        <Medication\_Name type\="string"\>皮膚、皮下腫瘍摘出術（露出部）（長径２ｃｍ未満）</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>641210099</Medication\_Code>                                                        <Medication\_Name type\="string"\>キシロカイン注射液１％</Medication\_Name>                                                        <Medication\_Number type\="string"\>3</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>840000042</Medication\_Code>                                                        <Medication\_Name type\="string"\>手術○日</Medication\_Name>                                                        <Medication\_Number type\="string"\>15</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                        </Medical\_Information>                        <Disease\_Information type\="array"\>                                <Disease\_Information\_child type\="record"\>                                        <Disease\_Code type\="string"\>8830052</Disease\_Code>                                        <Disease\_Name type\="string"\>ＡＣバイパス術後機械的合併症</Disease\_Name>                                        <Disease\_SuspectedFlag type\="string"\>S</Disease\_SuspectedFlag>                                        <Disease\_StartDate type\="string"\>2010-11-23</Disease\_StartDate>                                        <Disease\_EndDate type\="string"\>2010-11-24</Disease\_EndDate>                                        <Disease\_OutCome type\="string"\>D</Disease\_OutCome>                                </Disease\_Information\_child>                                <Disease\_Information\_child type\="record"\>                                        <Disease\_InOut type\="string"\>O</Disease\_InOut>                                        <Disease\_Single type\="array"\>                                                <Disease\_Single\_child type\="record"\>                                                        <Disease\_Single\_Code type\="string"\>830417</Disease\_Single\_Code>                                                </Disease\_Single\_child>                                                <Disease\_Single\_child type\="record"\>                                                        <Disease\_Single\_Code type\="string"\>ZZZ8002</Disease\_Single\_Code>                                                        <Disease\_Single\_Name type\="string"\>の疑い</Disease\_Single\_Name>                                                </Disease\_Single\_child>                                        </Disease\_Single>                                        <Disease\_StartDate type\="string"\>2010-07-06</Disease\_StartDate>                                        <Disease\_EndDate type\="string"\>2010-07-28</Disease\_EndDate>                                        <Disease\_OutCome type\="string"\>D</Disease\_OutCome>                                </Disease\_Information\_child>                        </Disease\_Information>                </Diagnosis\_Information>                <Medical\_Push type\="string"\>Yes</Medical\_Push>        </medicalreq>  
</data>  

(今回より名称については、「財団法人医療情報システム開発センター」様の電子保存された診療録情報の交換のためのデータ項目セット(Ｊ-ＭＩＸ)を参考にさせて頂いています)

### 処理概要

該当患者の中途終了データ登録や、日レセに登録した中途終了データの変更および削除を行います。

### 処理詳細

1.  送信されたユーザID(職員情報)の妥当性チェック
2.  送信された患者番号による患者の存在チェック
3.  該当患者の排他チェック(他端末で展開中の有無)
4.  診療科の存在チェック
5.  ドクターコードの存在チェック
6.  補足コメントコードおよび文字列の妥当性チェック
7.  保険組合せごとの公費情報を保険組合せの登録順で返却

*    保険組合せの決定方法を変更しました。  
    現在、claim、xmlでは、保険情報がない場合での生保への自動変換等の処理を行なっているが、xml2に関してはこれを廃止し、全ての保険情報(公費は設定内容を全てチェック)が正しい場合のみ保険組合せの設定を行います。
*   xml2でのシステム管理によるレセ電診療科への変換処理を廃止しました。

### 送信済み中途終了データの削除、更新について

*   データ登録時(class=01)のレスポンスにuid(Medical\_Uid)を設定し返却します。
*   データ削除時(class=02)のリクエストに、データ登録時に返却されたuid(Medical\_Uid)を設定し該当データを削除します。
*   データ変更時(class=03)のリクエストに、データ登録時に返却されたuid(Medical\_Uid)を設定し該当データを削除し、リクエストされた内容で置換します。  
    (この場合、登録後は新たなuidを返却します。)  
    ※ データ削除、変更については、日レセにて送信したデータを展開および内容変更していない場合に限り可能とします。  
    　 また変更、削除の場合、病名情報については設定していても無効となります。
*   データ削除、変更の一致条件は、診療年月日、患者番号、診療科、Medical\_Uidの等しいものとします。
*   ~入院外(外来)に関しては、削除のみ可能となります。~
*   データ変更時(class=03)の場合、システム的には削除→追加の順で行うため変更前の保険組合せと変更後の保険組合せが異なる場合は、後の保険組合せで新たにデータが登録されます。
*   外来データ登録、追記(class=04)で外来データの追記が可能です。  
    (詳細は、下記「外来での中途データ追記機能(外来追加)について」参照)

例) 返却されるMedical\_Uid

    <Perform\_Time type\="string"\>17:34:12</Perform\_Time>    <Medical\_Uid type\="string"\>f1457254-dff1-11e3-96c0-8c736e794c62</Medical\_Uid>  

### 病名データについて

*   データ登録(class=01)で診療データ、病名データ、あるいは両方のデータを登録します。
*   データ削除(class=02)、データ変更(class=03)では診療データのみを対象とするため、病名データを設定しても無効となります。
*   病名の個別追加、変更、削除はデータ登録(class=01)で行います。  
    病名データの送信に関しては、一回の送信で新規の複数病名を送信することも、その中に変更(転帰等)の病名を含めることも、変更分だけの病名を送信することも可能です。
*   エラー(もしくはエラーを含む警告)となった病名の返却に関しては、単独、一連いずれの設定の場合も「Disease\_Warning\_Name」、「Disease\_Warning\_Code」に一連病名の形式で設定します。
*   転帰していない病名に開始日が異なる同一病名を送信した場合、エラー病名として取り込みを行いません。
*   廃止・移行先・推奨対象病名の警告は初回追加時のみ警告設定を行います。
*   「の疑い」(コードでの設定も同様)は、該当病名に対する更新処理となります。  
     胃炎に対し「胃炎の疑い」を送信した場合、胃炎を胃炎の疑いとして更新します。  
     胃炎の疑いに対し、胃炎を送信した場合、胃炎の疑いを胃炎として更新します。  
    

### 病名補足コメントについて

*   補足コメントの取り込み順はコード優先とします。但し、病名とは異なり名称からコードの組み立ては行いません。
*   補足コメントの内容を変更したい場合は、一旦該当の病名を削除した後新たに登録します。  
    

### 一般名処方の設定について

 電子カルテ等から、医薬品に対し一般名指示等をおこないたい場合には、以下の設定により送信して下さい。  
 ※上記設定が有効となるのは、内服、外用、頓服のみです。但し、加算には関係ありませんが、注射でも一般名記載指示を許可します。

Medication\_Generic\_Flg : yes   一般名を使用する  
                       : no    銘柄指示  
                       : 以外  日レセの設定指示に従う   

 又、医薬品の直下にMedication\_Codeにより日レセのシステム予約コード（一般名記載：099209908）等の設定も可能ですが、Medication\_Generic\_Flgによる指示がある場合は、そちらを優先します。

### 外来での中途データ追記機能(外来追加)について

*   患者番号、診療日付、診療科、保険組合せが一致する中途データに診療内容を追加します。
*   ドクターコードが一致しない時、中途データが診療行為の中途終了登録で作成したデータの場合、中途データの最大剤番号が最大値(99999999)の場合はエラーになります。
*   外来データ登録時(class=04)のレスポンスにデータ追記登録を行いuid(Medical\_Uid)を設定し返却します。（新規時はそのまま登録）  
    ※入院データの場合、このclassは使用できません。  
    
*   データ削除時(class=02)のリクエストは入院と同様の仕様になります。  
    
*   診察料の二重チェックおよび送信途中に日レセで展開された場合のチェックは行えないため運用で対応してください。  
    
*   初診・再診料等の診察料が１件目の１行目になるように送信します（診察料に含まれる時間外コードはこれ以降に送信されたものに対してのみ反映されそれ以前のものには反映されないため）。  
    それ以外の場所に設定した場合は正しい処理ができないことがあります。また、診察料は複数送信しないで下さい。  
    ※展開時に診察料を自動発生しない場合の注意です。  
    

PUSH通知サンプル
----------

{
  "event": "receive\_medicalreq",
  "user":"ormaster",
  "body": {
    "Request\_Number": "1",
    "InOut": "2",
    "Patient\_ID": "00123",
    "Information\_Date": "2023-06-01",
    "Information\_Time": "09:38:05",
    "Perform\_Date": "2023-06-01",
    "Perform\_Time": "09:37:55",
    "Insurance\_Combination\_Number":"0006",
    "Department\_Code":"01",
    "Physician\_Code":"10001"
  }
  "time": "2023-06-01T09:38:07+0900"
}

リクエスト一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | InOut | 入外区分(I:入院、 それ以外:入院外) |     |     |
| 2   | Patient\_ID | 患者番号 | 17  | 必須  |
| 3   | Perform\_Date | 診療日 | 2014-10-17 |     |
| 4   | Perform\_Time | 診療時間 | 14:10:12 |     |
| 5   | Medical\_Uid |     |     | 変更、削除のみ必須 |
| 6   | Admission\_Date | 入院年月日 | 2014-10-01 | 追加  <br>(2025-05-02) |
| 7   | Diagnosis\_Information | 診療情報 |     |     |
| 7-1 | Department\_Code | 診療科コード ※１  <br>(01:内科) | 01  | 必須  |
| 7-2 | Physician\_Code | ドクタコード | 10001 | 必須  |
| 7-3 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 7-3-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | 追加  <br>(2015-12-21)  <br>※５ |
| 7-3-2 | InsuranceProvider\_Class | 保険の種類(060:国保) | 060 | ※２  |
| 7-3-3 | InsuranceProvider\_Number | 保険者番号 | 138057 | ※２  |
| 7-3-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  | ※２  |
| 7-3-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 7-3-6 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 7-3-7 | HealthInsuredPerson\_Branch\_Number | 枝番  |     | 追加  <br>(2021-01-27) |
| 7-3-8 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 7-3-9 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 7-3-10 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 7-3-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 7-3-12 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 7-3-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-3-14 | PublicInsurance\_Information | 公費情報(繰り返し4) |     |     |
| 7-3-14-1 | PublicInsurance\_Class | 公費の種類 | 019 | ※２  |
| 7-3-14-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 | ※２  |
| 7-3-14-3 | PublicInsurer\_Number | 負担者番号 | 19113760 | ※２  |
| 7-3-14-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 | ※２  |
| 7-3-14-5 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 7-3-14-6 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 7-4 | Medical\_Information | 診療行為情報(繰り返し40) |     |     |
| 7-4-1 | Medical\_Class | 診療種別区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 210 |     |
| 7-4-2 | Medical\_Class\_Name | 診療種別区分名称 | 内服薬剤 |     |
| 7-4-3 | Medical\_Class\_Number | 回数、日数 | 1   |     |
| 7-4-4 | Medication\_info | 診療内容(繰り返し40) |     |     |
| 7-4-4-1 | Medication\_Code | 診療行為コード | 620001402 | ※３  |
| 7-4-4-2 | Medication\_Name | 名称  | グリセリン |     |
| 7-4-4-3 | Medication\_Number | 数量  | 2   | ※４  |
| 7-4-4-4 | Medication\_Generic\_Flg | 一般処方指示  <br>(yes：一般名を使用する、  <br>no：銘柄指示、  <br>以外：日レセの設定指示に従う) | yes | 追加  <br>(2014-05-22) |
| 7-4-4-5 | Medication\_Continue | 継続コメント区分  <br>(1：継続コメント) |     | 追加  <br>(2017-04-26) |
| 7-4-4-6 | Medication\_Internal\_Kinds | 内服１種類区分  <br>(1：内服１種類) |     | 追加  <br>(2017-04-26) |
| 7-5 | Disease\_Information | 病名情報(繰り返し50) |     |     |
| 7-5-1 | Disease\_Code | 一連病名コード | 8830052 |     |
| 7-5-2 | Disease\_InOut | 入外区分  <br>(O:外来、I:入院)(半角大文字) |     |     |
| 7-5-3 | Disease\_Name | 一連病名名称(全角40文字まで) | ACバイパス術後機械的合併症 |     |
| 7-5-4 | Disease\_Single | 単独病名情報(繰り返し6) |     |     |
| 7-5-4-1 | Disease\_Single\_Code | 単独病名コード | 4309001 |     |
| 7-5-4-2 | Disease\_Single\_Name | 単独病名 | くも膜下出血 |     |
| 7-5-5 | Disease\_Supplement | 病名補足コメント情報 |     |     |
| 7-5-5-1 | Disease\_Scode1 | 補足コメントコード１ | 2056 |     |
| 7-5-5-2 | Disease\_Scode2 | 補足コメントコード２ | 1053 |     |
| 7-5-5-3 | Disease\_Scode3 | 補足コメントコード３ |     |     |
| 7-5-5-4 | Disease\_Sname | 補足コメント | 補足コメント |     |
| 7-5-6 | Disease\_Category | 主病フラグ（PD:主病名） |     |     |
| 7-5-7 | Disease\_SuspectedFlag | 疑いフラグ | S   |     |
| 7-5-8 | Disease\_StartDate | 病名開始日 | 2010-11-23 |     |
| 7-5-9 | Disease\_EndDate | 転帰日 | 2010-11-24 |     |
| 7-5-10 | Disease\_OutCome | 転帰区分 | D   |     |
| 8   | Medical\_Push | Push通知指示 | Yes | 追加  <br>(2023-06-26)  <br>※６ |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：一箇所でも設定されていれば、一致する保険組合せが対象に設定されます  
　　　公費単独の場合は、主保険情報は設定する必要はありません。  

※３：入力コードは不可

※４：数量、埋め込み数値

※５：保険組合せ番号不正の場合は、組合せZEROで登録します。

※６：リクエストによる処理がエラーとなる場合はPush通知指示があってもPush通知は行わない。  

  

※病名については、一連病名か単独病名のいずれかの設定と開始日が必須となります。
 
  1.転帰区分
    D 死亡      Died
    F 完治      Fully recovered
    N 不変      Not recovering/unchanged
    R 軽快      Recovering
    S 後遺症残  Sequelae
    U 不明      Unknown
    W 悪化      Worsening  
    O 削除      Omit  
  （疑い、急性、開始日、病名コード、転帰日、入外区分等完全一致したものに対し、削除フラグを設定します。）
 
  2.主病名区分
    PD 主疾患   Primary Disease
 
  3.疑いフラグ
    S 疑い      SuspectedFlag   

レスポンス一覧
-------

| 番号  | 項目名 | 内容  | 例   | 備考  |
| --- | --- | --- | --- | --- |
| 1   | Information\_Date | 実施日 | 2014-10-17 |     |
| 2   | Information\_Time | 実施時間 | 14:15:00 |     |
| 3   | Api\_Result | 結果コード | 00  |     |
| 4   | Api\_Result\_Message | 結果メッセージ | 登録処理終了 |     |
| 5   | Reskey | レスポンスキー情報 | Medical Info |     |
| 6   | Perform\_Date | 診療日 | 2014-10-17 |     |
| 7   | Perform\_Time | 診療時間 | 14:10:12 |     |
| 8   | Medical\_Uid |     | 64d3e23a-40b5-4aa8-90d4-ab7fd48a2322 |     |
| 9   | Admission\_Date | 入院年月日 | 2014-10-01 | 追加  <br>(2025-05-02) |
| 10  | Department\_Code | 診療科コード ※１  <br>(01:内科) | 01  |     |
| 11  | Department\_Name | 診療科名称 | 内科  |     |
| 12  | Physician\_Code | ドクターコード | 10001 |     |
| 13  | Physician\_WholeName | ドクター名 | 日本　一 |     |
| 14  | Patient\_Information | 患者情報 |     |     |
| 14-1 | Patient\_ID | 患者番号 | 000017 |     |
| 14-2 | WholeName | 患者氏名(漢字) | 日医　太郎 |     |
| 14-3 | WholeName\_inKana | 患者氏名(カナ) | ニチイ　タロウ |     |
| 14-4 | BirthDate | 生年月日 | 1970-01-01 |     |
| 14-5 | Sex | 性別  <br>(1:男性、 2:女性) | 1   |     |
| 14-6 | HealthInsurance\_Information | 保険組合せ情報 |     |     |
| 14-6-1 | Insurance\_Combination\_Number | 保険組合せ番号 | 0001 | 追加  <br>(2014-11-25) |
| 14-6-2 | InsuranceProvider\_Class | 保険の種類 | 060 |     |
| 14-6-3 | InsuranceProvider\_Number | 保険者番号 | 138057 |     |
| 14-6-4 | InsuranceProvider\_WholeName | 保険の制度名称 | 国保  |     |
| 14-6-5 | HealthInsuredPerson\_Symbol | 記号  | ０１  |     |
| 14-6-6 | HealthInsuredPerson\_Number | 番号  | １２３４５６７ |     |
| 14-6-7 | HealthInsuredPerson\_Branch\_Number | 枝番  | 00  | 追加  <br>(2021-01-27) |
| 14-6-8 | HealthInsuredPerson\_Continuation | 継続区分  <br>(1:継続療養、 2:任意継続) |     |     |
| 14-6-9 | HealthInsuredPerson\_Assistance | 補助区分  <br>(詳細については、「日医標準レセプトソフトデータベーステーブル定義書」を参照して下さい。) | 3   |     |
| 14-6-10 | RelationToInsuredPerson | 本人家族区分  <br>(1:本人、 2:家族) | 1   |     |
| 14-6-11 | HealthInsuredPerson\_WholeName | 被保険者名 | 日医　太郎 |     |
| 14-6-12 | Certificate\_StartDate | 適用開始日 | 2010-05-01 |     |
| 14-6-13 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 14-6-14 | PublicInsurance\_Information | 公費情報（繰り返し 4） |     |     |
| 14-6-14-1 | PublicInsurance\_Class | 公費の種類 | 019 |     |
| 14-6-14-2 | PublicInsurance\_Name | 公費の制度名称 | 原爆一般 |     |
| 14-6-14-3 | PublicInsurer\_Number | 負担者番号 | 19113760 |     |
| 14-6-14-4 | PublicInsuredPerson\_Number | 受給者番号 | 1234566 |     |
| 14-6-14-5 | Rate\_Admission | 入院ー負担率（割） | 0.00 |     |
| 14-6-14-6 | Money\_Admission | 入院ー固定額 | 0   |     |
| 14-6-14-7 | Rate\_Outpatient | 外来ー負担率（割） | 0.00 |     |
| 14-6-14-8 | Money\_Outpatient | 外来ー固定額 | 0   |     |
| 14-6-14-9 | Certificate\_IssuedDate | 適用開始日 | 2010-05-01 |     |
| 14-6-14-10 | Certificate\_ExpiredDate | 適用終了日 | 9999-12-31 |     |
| 15  | Medical\_Message\_Information | 診療行為登録結果 |     | 追加  <br>(2014-10-27) |
| 15-1 | Medical\_Result | 診療行為結果コード | 03  | 追加  <br>(2014-10-27) |
| 15-2 | Medical\_Result\_Message | 診療行為結果メッセージ | 既に同日の診療データが登録されています | 追加  <br>(2014-10-27) |
| 15-3 | Medical\_Warning\_Info | 診療行為警告情報（繰り返し 50） |     | 追加  <br>(2014-10-27)  <br>変更  <br>(2016-11-28) |
| 15-3-1 | Medical\_Warning | 診療行為警告コード | M01 | 追加  <br>(2014-10-27) |
| 15-3-2 | Medical\_Warning\_Message | 診療行為警告メッセージ | 点数マスタに登録がありません | 追加  <br>(2014-10-27) |
| 15-3-3 | Medical\_Warning\_Position | エラーとなった診療行為情報が何番目の「Medical\_Information\_child」に記述されているかを表します。  <br>※２ | 01  | 追加  <br>(2014-10-27) |
| 15-3-4 | Medical\_Warning\_Item\_Position | エラーとなった診療内容が何番目の「Medication\_info\_child」に記述されているかを表します。  <br>※２ | 01  | 追加  <br>(2014-10-27) |
| 15-3-5 | Medical\_Warning\_Code | 警告対象の診療行為コード | 012007410 | 追加  <br>(2014-10-27) |
| 16  | Disease\_Message\_Information | 病名登録結果 |     | 追加  <br>(2014-10-27) |
| 16-1 | Disease\_Result | 病名結果コード | 02  | 追加  <br>(2014-10-27) |
| 16-2 | Disease\_Result\_Message | 病名結果メッセージ | 警告がある病名が存在します | 追加  <br>(2014-10-27) |
| 16-3 | Disease\_Warning\_Info | 病名警告情報（繰り返し 50） |     | 追加  <br>(2014-10-27)  <br>変更(2016-11-28) |
| 16-3-1 | Disease\_Warning | 病名警告コード | W01 | 追加  <br>(2014-10-27) |
| 16-3-2 | Disease\_Warning\_Message | 病名警告メッセージ | 廃止・移行先・推奨のある病名が存在します | 追加  <br>(2014-10-27) |
| 16-3-3 | Disease\_Warning\_Item\_Position | エラー(警告)となった病名情報が何番目の「Disease\_Information\_child」に記述されているかを表します。 | 02  | 追加  <br>(2014-10-27) |
| 16-3-4 | Disease\_Warning\_Name | 警告対象の病名 | 喘息  | 追加  <br>(2014-10-27) |
| 16-3-5 | Disease\_Warning\_Code | 警告対象の病名コード | 4939020 | 追加  <br>(2014-10-27) |
| 16-3-6 | Disease\_Warning\_Change | 廃止、移行先、推奨  <br>(01:廃止、  <br>02:移行先、  <br>03:推奨) | 01  | 追加  <br>(2014-10-27) |

※１：システム管理マスタの診療科目情報の診療科コードを参照して下さい。

※２：これらは、位置に関係のないエラー（入院期間中等のエラー）の場合は省略されます。

### レスポンスサンプル  

<xmlio2>  <medicalres type\="record"\>    <Information\_Date type\="string"\>2014-10-17</Information\_Date>    <Information\_Time type\="string"\>14:15:00</Information\_Time>    <Api\_Result type\="string"\>00</Api\_Result>    <Api\_Result\_Message type\="string"\>登録処理終了</Api\_Result\_Message>    <Reskey type\="string"\>Medical Info</Reskey>    <Perform\_Date type\="string"\>2014-10-17</Perform\_Date>    <Perform\_Time type\="string"\>14:10:12</Perform\_Time>    <Medical\_Uid type\="string"\>64d3e23a-40b5-4aa8-90d4-ab7fd48a2322</Medical\_Uid>    <Admission\_Date type\="string"\>2014-10-01</Admission\_Date>    <Department\_Code type\="string"\>01</Department\_Code>    <Department\_Name type\="string"\>内科</Department\_Name>    <Physician\_Code type\="string"\>10001</Physician\_Code>    <Physician\_WholeName type\="string"\>日本　一</Physician\_WholeName>    <Patient\_Information type\="record"\>      <Patient\_ID type\="string"\>00017</Patient\_ID>      <WholeName type\="string"\>日医　太郎</WholeName>      <WholeName\_inKana type\="string"\>ニチイ　タロウ</WholeName\_inKana>      <BirthDate type\="string"\>1975-01-01</BirthDate>      <Sex type\="string"\>1</Sex>      <HealthInsurance\_Information type\="record"\>        <Insurance\_Combination\_Number type\="string"\>0001</Insurance\_Combination\_Number>        <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>        <InsuranceProvider\_Number type\="string"\>138057</InsuranceProvider\_Number>        <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>        <HealthInsuredPerson\_Symbol type\="string"\>０１</HealthInsuredPerson\_Symbol>        <HealthInsuredPerson\_Number type\="string"\>１２３４５６７</HealthInsuredPerson\_Number>        <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>        <RelationToInsuredPerson type\="string"\>1</RelationToInsuredPerson>        <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>        <Certificate\_StartDate type\="string"\>2010-05-01</Certificate\_StartDate>        <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>        <PublicInsurance\_Information type\="array"\>          <PublicInsurance\_Information\_child type\="record"\>            <PublicInsurance\_Class type\="string"\>019</PublicInsurance\_Class>            <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>            <PublicInsurer\_Number type\="string"\>19113760</PublicInsurer\_Number>            <PublicInsuredPerson\_Number type\="string"\>1234566</PublicInsuredPerson\_Number>            <Rate\_Admission type\="string"\>0.00</Rate\_Admission>            <Money\_Admission type\="string"\>     0</Money\_Admission>            <Rate\_Outpatient type\="string"\>0.00</Rate\_Outpatient>            <Money\_Outpatient type\="string"\>     0</Money\_Outpatient>            <Certificate\_IssuedDate type\="string"\>2010-05-01</Certificate\_IssuedDate>            <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>          </PublicInsurance\_Information\_child>        </PublicInsurance\_Information>      </HealthInsurance\_Information>    </Patient\_Information>    <Medical\_Message\_Information type\="record"\>      <Medical\_Warning\_Info type\="array"\>        <Medical\_Warning\_Info\_child type\="record"\>          <Medical\_Warning type\="string"\>W04</Medical\_Warning>          <Medical\_Warning\_Message type\="string"\>入院期間中です。外来で展開できない保険組合せです。</Medical\_Warning\_Message>        </Medical\_Warning\_Info\_child>      </Medical\_Warning\_Info>    </Medical\_Message\_Information>    <Disease\_Message\_Information type\="record"\>      <Disease\_Result type\="string"\>01</Disease\_Result>      <Disease\_Result\_Message type\="string"\>登録出来ない病名が存在します</Disease\_Result\_Message>      <Disease\_Warning\_Info type\="array"\>        <Disease\_Warning\_Info\_child type\="record"\>          <Disease\_Warning type\="string"\>E03</Disease\_Warning>          <Disease\_Warning\_Message type\="string"\>病名コードが不正です</Disease\_Warning\_Message>          <Disease\_Warning\_Item\_Position type\="string"\>02</Disease\_Warning\_Item\_Position>        </Disease\_Warning\_Info\_child>      </Disease\_Warning\_Info>    </Disease\_Message\_Information>  </medicalres>  
</xmlio2>  

Rubyによるリクエストサンプルソース
-------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    

 Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
 サンプルソース内に以下の一行が記述されていることを確認して下さい。

\# -\*- coding: utf-8 -\*-   

[sample\_medical\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_medical_v2.rb)
  

#!/usr/bin/ruby  
\# -\*- coding: utf-8 -\*-  
  
require 'uri'  
require 'net/http'  
  
Net::HTTP.version\_1\_2  
  
HOST \= "localhost"PORT \= "8000"USER \= "ormaster"PASSWD \= "ormaster"CONTENT\_TYPE \= "application/xml"req \= Net::HTTP::Post.new("/api21/medicalmodv2?class=01")  
\# class :01 中途データ登録  
\# class :02 中途データ削除  
\# class :03 中途データ変更  
\# class :04 中途データ外来追加  
#  
#BODY \= <<EOF

<data>        <medicalreq type\="record"\>                <InOut type\="string"\></InOut>                <Patient\_ID type\="string"\>44444</Patient\_ID>                <Perform\_Date type\="string"\>2012-06-24</Perform\_Date>                <Perform\_Time type\="string"\>15:34:12</Perform\_Time>                <Medical\_Uid type\="string"\></Medical\_Uid>  
<!-- ========================================================== -->  
<!--                    診療データ                              -->  
<!-- ========================================================== -->                <Diagnosis\_Information type\="record"\>                        <Department\_Code type\="string"\>01</Department\_Code>                        <Physician\_Code type\="string"\>10001</Physician\_Code>                        <HealthInsurance\_Information type\="record"\>                                <Insurance\_Combination\_Number type\="string"\></Insurance\_Combination\_Number>                                <InsuranceProvider\_Class type\="string"\>060</InsuranceProvider\_Class>                                <InsuranceProvider\_Number type\="string"\>320010</InsuranceProvider\_Number>                                <InsuranceProvider\_WholeName type\="string"\>国保</InsuranceProvider\_WholeName>                                <HealthInsuredPerson\_Symbol type\="string"\>併用</HealthInsuredPerson\_Symbol>                                <HealthInsuredPerson\_Number type\="string"\>２</HealthInsuredPerson\_Number>                                <HealthInsuredPerson\_Continuation type\="string"\></HealthInsuredPerson\_Continuation>                                <HealthInsuredPerson\_Assistance type\="string"\>3</HealthInsuredPerson\_Assistance>                                <RelationToInsuredPerson type\="string"\>2</RelationToInsuredPerson>                                <HealthInsuredPerson\_WholeName type\="string"\>日医　太郎</HealthInsuredPerson\_WholeName>                                <Certificate\_StartDate type\="string"\>2004-04-01</Certificate\_StartDate>                                <Certificate\_ExpiredDate type\="string"\>9999-12-31</Certificate\_ExpiredDate>                                <PublicInsurance\_Information type\="array"\>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>91</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\>原爆一般</PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\>91320010</PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\>9702390</PublicInsuredPerson\_Number>                                                <Certificate\_IssuedDate type\="string"\>2008-10-10</Certificate\_IssuedDate>                                                <Certificate\_ExpiredDate type\="string"\>2010-10-10</Certificate\_ExpiredDate>                                        </PublicInsurance\_Information\_child>                                        <PublicInsurance\_Information\_child type\="record"\>                                                <PublicInsurance\_Class type\="string"\>10</PublicInsurance\_Class>                                                <PublicInsurance\_Name type\="string"\></PublicInsurance\_Name>                                                <PublicInsurer\_Number type\="string"\></PublicInsurer\_Number>                                                <PublicInsuredPerson\_Number type\="string"\></PublicInsuredPerson\_Number>                                                <Certificate\_IssuedDate type\="string"\>2008-10-10</Certificate\_IssuedDate>                                                <Certificate\_ExpiredDate type\="string"\>2010-10-10</Certificate\_ExpiredDate>                                        </PublicInsurance\_Information\_child>                                </PublicInsurance\_Information>                        </HealthInsurance\_Information>                        <Medical\_Information type\="array"\>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>120</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>再診</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>112007410</Medication\_Code>                                                        <Medication\_Name type\="string"\>再診</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>210</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>内服薬剤</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>620001402</Medication\_Code>                                                        <Medication\_Name type\="string"\>グリセリン</Medication\_Name>                                                        <Medication\_Number type\="string"\>2</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\>yes</Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                                <Medical\_Information\_child type\="record"\>                                        <Medical\_Class type\="string"\>500</Medical\_Class>                                        <Medical\_Class\_Name type\="string"\>手術</Medical\_Class\_Name>                                        <Medical\_Class\_Number type\="string"\>1</Medical\_Class\_Number>                                        <Medication\_info type\="array"\>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>150003110</Medication\_Code>                                                        <Medication\_Name type\="string"\>皮膚、皮下腫瘍摘出術（露出部）（長径２ｃｍ未満）</Medication\_Name>                                                        <Medication\_Number type\="string"\>1</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>641210099</Medication\_Code>                                                        <Medication\_Name type\="string"\>キシロカイン注射液１％</Medication\_Name>                                                        <Medication\_Number type\="string"\>3</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                                <Medication\_info\_child type\="record"\>                                                        <Medication\_Code type\="string"\>840000042</Medication\_Code>                                                        <Medication\_Name type\="string"\>手術○日</Medication\_Name>                                                        <Medication\_Number type\="string"\>15</Medication\_Number>                                                        <Medication\_Generic\_Flg type\="string"\></Medication\_Generic\_Flg>                                                </Medication\_info\_child>                                        </Medication\_info>                                </Medical\_Information\_child>                        </Medical\_Information>                        <Disease\_Information type\="array"\>                                <Disease\_Information\_child type\="record"\>                                        <Disease\_Code type\="string"\>8830052</Disease\_Code>                                        <Disease\_Name type\="string"\>ＡＣバイパス術後機械的合併症</Disease\_Name>                                        <Disease\_SuspectedFlag type\="string"\>S</Disease\_SuspectedFlag>                                        <Disease\_StartDate type\="string"\>2010-11-23</Disease\_StartDate>                                        <Disease\_EndDate type\="string"\>2010-11-24</Disease\_EndDate>                                        <Disease\_OutCome type\="string"\>D</Disease\_OutCome>                                </Disease\_Information\_child>                                <Disease\_Information\_child type\="record"\>                                        <Disease\_InOut type\="string"\>O</Disease\_InOut>                                        <Disease\_Single type\="array"\>                                                <Disease\_Single\_child type\="record"\>                                                        <Disease\_Single\_Code type\="string"\>8830417</Disease\_Single\_Code>                                                        <Disease\_Single\_Name type\="string"\>胃炎</Disease\_Single\_Name>                                                </Disease\_Single\_child>                                                <Disease\_Single\_child type\="record"\>                                                        <Disease\_Single\_Code type\="string"\>ZZZ8002</Disease\_Single\_Code>                                                        <Disease\_Single\_Name type\="string"\>の疑い</Disease\_Single\_Name>                                                </Disease\_Single\_child>                                        </Disease\_Single>                                        <Disease\_StartDate type\="string"\>2010-07-06</Disease\_StartDate>                                        <Disease\_EndDate type\="string"\>2010-07-28</Disease\_EndDate>                                        <Disease\_OutCome type\="string"\>D</Disease\_OutCome>                                </Disease\_Information\_child>                        </Disease\_Information>                </Diagnosis\_Information>        </medicalreq>  
</data>

EOF  
  
req.content\_length \= BODY.size  
req.content\_type \= CONTENT\_TYPE  
req.body \= BODY  
req.basic\_auth(USER, PASSWD)  puts req.body  
  
Net::HTTP.start(HOST, PORT) {|http|  res \= http.request(req)  puts res.body  
  
}

エラーメッセージ一覧
----------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 患者番号未設定 |
| 02  | 診療科未設定 |
| 03  | ドクター未設定 |
| 04  | UID未設定 |
| 05  | 置換処理は、入院のみ可能です |
| 10  | 該当患者番号なし |
| 11  | 診療日設定誤り |
| 13  | 診療科が存在しません |
| 14  | ドクターが存在しません |
| 17  | 病名開始日付が暦日エラーです |
| 18  | 病名転帰日付が暦日エラーです |
| 19  | 病名開始日付＞転帰日付です |
| 20  | 病名登録処理終了。中途データが登録できませんでした |
| 21  | 中途データ登録処理終了。病名の登録ができませんでした |
| 22  | 登録対象のデータがありません |
| 23  | 入院日付が暦日エラーです |
| 24  | 入院日付が入院日ではありません |
| 30  | 削除対象の中途終了データがありません |
| 31  | 削除対象の中途終了データがありません。内容が更新されている可能性があります |
| 32  | 置換対象の中途終了データがありません |
| 33  | 置換対象の中途終了データがありません。内容が更新されている可能性があります |
| 34  | 中途終了データ削除エラー |
| 40  | 追加処理は、外来のみ可能です |
| 41  | 追加対象の中途終了データとドクターコードが違います |
| 42  | 追加対象の中途終了データの登録方法が違います |
| 43  | 中途終了データの剤番号が最大です。追加できません |
| 80  | 中途終了データ登録エラー |
| 内容が変更されているため置換できませんでした |
| 内容を置き換えました |
| 既に同日の診療データが登録されています |
| 患者病名登録エラー |
| 病名の登録ができません |
| 89  | 職員情報が取得できません |
| 医療機関情報が取得できません |
| システム日付が取得できません |
| 患者番号構成情報が取得できません |
| グループ医療機関が不整合です。処理を終了して下さい |
| システム項目が設定できません |
| 90  | 他端末使用中 |
| 91  | 処理区分未設定 |
| 97  | 送信内容に誤りがあります |
| 98  | 送信内容の読込ができませんでした |
| 99  | ユーザID未登録 |

エラーメッセージ一覧(診療行為「Medical\_Result,Medical\_Result\_Message」)
----------------------------------------------------------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 内容が変更されているため置換できませんでした |
| 03  | 既に同日の診療データが登録されています |
| 10  | 中途終了データ登録エラー |

エラーメッセージ一覧(病名「Disease\_Result,Disease\_Result\_Message」)
--------------------------------------------------------

| エラーコード | エラーメッセージ |
| --- | --- |
| 01  | 登録出来ない病名が存在します |
| 02  | 警告がある病名が存在します |
| 11  | 全ての病名の更新に失敗しました（追加時にエラー） |
| 12  | 全ての病名の更新に失敗しました（更新時にエラー） |
| 13  | 全ての病名の更新に失敗しました（入外区分更新時にエラー） |

警告メッセージ一覧(診療行為「Medical\_Warning,Medical\_Warning\_Message」)
-----------------------------------------------------------

| エラーコード | 警告メッセージ |
| --- | --- |
| W01 | 診療日を設定しました |
| W02 | 保険組合せをゼロで登録しました |
| W03 | 内容を置き換えました |
| W04 | 入院期間中です。外来で展開できない保険組合せです |
| W05 | 入院中ではありません。入院で展開できません |
| M01 | 点数マスタに登録がありません |
| M02 | セットテーブルに登録がありません |
| M03 | 名称の全角変換エラーです |
| M04 | 入力対象外のコードです |
| M05 | 診療種別区分がありません |

警告メッセージ一覧(病名「Disease\_Warning,Disease\_Warning」)
------------------------------------------------

| エラーコード | 警告メッセージ |
| --- | --- |
| E01 | 同名の病名が平成26年10月17日に存在します（転帰等を確認して下さい） |
| E03 | 病名コードが不正です |
| E04 | 補足コメントコードが不正です |
| E05 | 同名の病名がxxに複数存在します (xx:診療科) |
| E06 | 削除対象の病名がありません |
| E07 | 同名の病名が内科に平成26年10月17日に存在します |
| W01 | 廃止・移行先・推奨のある病名が存在します |
| W02 | 単独使用禁止病名です |
| W03 | 全角チェックでエラーとなる文字が病名に存在します |
| W04 | 病名に改行コードが存在します |
| W05 | 全角チェックでエラーとなる文字が補足コメントに存在します |
| W06 | 補足コメントに改行コードが存在します |

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 中途終了データ作成

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/medicalmod.html#wrapper)

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
