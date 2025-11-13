[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/system_daily.html#content)

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
 > 基本情報取得

基本情報取得
======

更新履歴
----

2018-09-25   レイアウト資料の項目名を一部変更。

基本情報取得（URL:/api01rv2/system01dailyv2）
-------------------------------------

日レセと連携する場合において、必要となり得る日レセのデフォルトの値(処方が院内なのか院外なのか etc)を返却します。  

リクエストサンプル

<data>  
	<system01\_dailyreq type="record">  
		<Request\_Number type="string">01</Request\_Number>  
		<Base\_Date type="string"></Base\_Date>  
	</system01\_dailyreq>  
</data>  

レスポンスサンプル

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <system01\_dailyres type="record">  
    <Information\_Date type="string">2017-12-18</Information\_Date>  
    <Information\_Time type="string">14:21:43</Information\_Time>  
    <Api\_Result type="string">00</Api\_Result>  
    <Api\_Result\_Message type="string">処理終了</Api\_Result\_Message>  
    <Reskey type="string">Patient Info</Reskey>  
    <Base\_Date type="string">2017-12-18</Base\_Date>  
    <Patient\_Information type="record">  
      <Duplication\_Class type="string">2</Duplication\_Class>  
      <Duplication\_Class\_Name type="string">性別＋生年月日</Duplication\_Class\_Name>  
      <ZipCode\_Auto\_Class type="string">2</ZipCode\_Auto\_Class>  
      <ZipCode\_Auto\_Class\_Name type="string">自動記載する（郵便番号未設定）</ZipCode\_Auto\_Class\_Name>  
      <P\_WholeName\_Auto\_Class type="string">1</P\_WholeName\_Auto\_Class>  
      <P\_WholeName\_Auto\_Class\_Name type="string">記載する</P\_WholeName\_Auto\_Class\_Name>  
    </Patient\_Information>  
    <Medical\_Information type="record">  
      <Medical\_Set01\_Information type="record">  
        <Outside\_Class type="string">1</Outside\_Class>  
        <Outside\_Class\_Name type="string">院外</Outside\_Class\_Name>  
        <Tax\_Rounding\_Class type="string">2</Tax\_Rounding\_Class>  
        <Tax\_Rounding\_Class\_Name type="string">１円未満切り捨て</Tax\_Rounding\_Class\_Name>  
        <Oe\_Rounding\_Class type="string">2</Oe\_Rounding\_Class>  
        <Oe\_Rounding\_Class\_Name type="string">１円未満切り捨て</Oe\_Rounding\_Class\_Name>  
        <Medical\_Change\_Class type="string">0</Medical\_Change\_Class>  
        <Medical\_Change\_Class\_Name type="string">変換する</Medical\_Change\_Class\_Name>  
        <Class\_Change\_Class type="string">0</Class\_Change\_Class>  
        <Class\_Change\_Class\_Name type="string">変換する</Class\_Change\_Class\_Name>  
        <Set\_Mode\_Class type="string">0</Set\_Mode\_Class>  
        <Set\_Mode\_Class\_Name type="string">通常展開</Set\_Mode\_Class\_Name>  
      </Medical\_Set01\_Information>  
      <Medical\_Set02\_Information type="record">  
        <Medical\_Auto\_Class type="string">1</Medical\_Auto\_Class>  
        <Medical\_Auto\_Class\_Name type="string">算定する</Medical\_Auto\_Class\_Name>  
        <Child\_Med\_Auto\_Class type="string">0</Child\_Med\_Auto\_Class>  
        <Child\_Med\_Auto\_Class\_Name type="string">算定しない</Child\_Med\_Auto\_Class\_Name>  
        <Disease\_Med\_Auto\_Class type="string">1</Disease\_Med\_Auto\_Class>  
        <Disease\_Med\_Auto\_Class\_Name type="string">算定する</Disease\_Med\_Auto\_Class\_Name>  
        <MeTeratment\_Auto\_Class type="string">0</MeTeratment\_Auto\_Class>  
        <MeTeratment\_Auto\_Class\_Name type="string">算定しない</MeTeratment\_Auto\_Class\_Name>  
        <Outpatient\_Med\_Chk\_Class type="string">2</Outpatient\_Med\_Chk\_Class>  
        <Outpatient\_Med\_Chk\_Class\_Name type="string">削除後の自動発生なし</Outpatient\_Med\_Chk\_Class\_Name>  
        <Child\_Time\_Class type="string">1</Child\_Time\_Class>  
        <Child\_Time\_Class\_Name type="string">算定する</Child\_Time\_Class\_Name>  
        <LastVisit\_Term type="string">02</LastVisit\_Term>  
        <Combination\_Number\_Chk\_Class type="string">2</Combination\_Number\_Chk\_Class>  
        <Combination\_Number\_Chk\_Class\_Name type="string">チェックする（すべて）</Combination\_Number\_Chk\_Class\_Name>  
      </Medical\_Set02\_Information>  
      <Medical\_Set03\_Information type="record">  
        <Dosage\_Chk\_Class type="string">0</Dosage\_Chk\_Class>  
        <Dosage\_Chk\_Class\_Name type="string">在宅・投薬・注射を対象</Dosage\_Chk\_Class\_Name>  
        <Dosage\_30Over\_Chk\_Class type="string">0</Dosage\_30Over\_Chk\_Class>  
        <Dosage\_30Over\_Chk\_Class\_Name type="string">チェックしない</Dosage\_30Over\_Chk\_Class\_Name>  
        <DrugInf\_Chk\_Class type="string">1</DrugInf\_Chk\_Class>  
        <DrugInf\_Chk\_Class\_Name type="string">チェックする</DrugInf\_Chk\_Class\_Name>  
        <Medication\_Notebook\_Chk\_Class type="string">1</Medication\_Notebook\_Chk\_Class>  
        <Medication\_Notebook\_Chk\_Class\_Name type="string">チェックする</Medication\_Notebook\_Chk\_Class\_Name>  
        <Time\_Chk\_Class type="string">1</Time\_Chk\_Class>  
        <Time\_Chk\_Class\_Name type="string">チェックする</Time\_Chk\_Class\_Name>  
        <Psy20\_Addition\_Auto\_Class type="string">0</Psy20\_Addition\_Auto\_Class>  
        <Psy20\_Addition\_Auto\_Class\_Name type="string">自動算定する</Psy20\_Addition\_Auto\_Class\_Name>  
        <Mind20\_Addition\_Auto\_Class type="string">0</Mind20\_Addition\_Auto\_Class>  
        <Mind20\_Addition\_Auto\_Class\_Name type="string">自動算定する</Mind20\_Addition\_Auto\_Class\_Name>  
        <Rem\_Addition\_Auto\_Class type="string">2</Rem\_Addition\_Auto\_Class>  
        <Rem\_Addition\_Auto\_Class\_Name type="string">すべての診療区分</Rem\_Addition\_Auto\_Class\_Name>  
        <Dispensing\_Auto\_Class type="string">1</Dispensing\_Auto\_Class>  
        <Dispensing\_Auto\_Class\_Name type="string">算定する</Dispensing\_Auto\_Class\_Name>  
        <DrugInf\_Auto\_Class type="string">1</DrugInf\_Auto\_Class>  
        <DrugInf\_Auto\_Class\_Name type="string">算定する（月１回）</DrugInf\_Auto\_Class\_Name>  
        <Om\_DrugInf\_Auto\_Class type="string">0</Om\_DrugInf\_Auto\_Class>  
        <Om\_DrugInf\_Auto\_Class\_Name type="string">算定しない</Om\_DrugInf\_Auto\_Class\_Name>  
        <Specific\_Drug\_Auto\_Class type="string">1</Specific\_Drug\_Auto\_Class>  
        <Specific\_Drug\_Auto\_Class\_Name type="string">算定する</Specific\_Drug\_Auto\_Class\_Name>  
        <Outpatient\_Modify\_Auto\_Class type="string">1</Outpatient\_Modify\_Auto\_Class>  
        <Outpatient\_Modify\_Auto\_Class\_Name type="string">算定する</Outpatient\_Modify\_Auto\_Class\_Name>  
        <Modify\_Disease\_Med\_Auto\_Class type="string">0</Modify\_Disease\_Med\_Auto\_Class>  
        <Modify\_Disease\_Med\_Auto\_Class\_Name type="string">算定しない</Modify\_Disease\_Med\_Auto\_Class\_Name>  
        <Laboratory\_text\_Med\_Auto\_Class type="string">1</Laboratory\_text\_Med\_Auto\_Class>  
        <Laboratory\_text\_Med\_Auto\_Class\_Name type="string">算定する</Laboratory\_text\_Med\_Auto\_Class\_Name>  
        <Image\_Addition\_Auto\_Class type="string">1</Image\_Addition\_Auto\_Class>  
        <Image\_Addition\_Auto\_Class\_Name type="string">算定する</Image\_Addition\_Auto\_Class\_Name>  
      </Medical\_Set03\_Information>  
      <Medical\_Set04\_Information type="record">  
        <Ic\_Request\_Code type="string">2</Ic\_Request\_Code>  
        <Ic\_Request\_Code\_Name type="string">今回分・伝票の古い未収順に入金</Ic\_Request\_Code\_Name>  
        <Ic\_Re\_Code type="string">3</Ic\_Re\_Code>  
        <Ic\_Re\_Code\_Name type="string">一括入金・返金反映</Ic\_Re\_Code\_Name>  
        <Modify\_Invoice\_Receipt\_Code type="string">0</Modify\_Invoice\_Receipt\_Code>  
        <Modify\_Invoice\_Receipt\_Code\_Name type="string">訂正分（差額）</Modify\_Invoice\_Receipt\_Code\_Name>  
      </Medical\_Set04\_Information>  
    </Medical\_Information>  
  </system01\_dailyres>  
</xmlio2>  

### レイアウト資料(PDF)

[api01rv2\_system01dailyv2.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_system01dailyv2.pdf)
  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 基本情報取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/system_daily.html#wrapper)

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
