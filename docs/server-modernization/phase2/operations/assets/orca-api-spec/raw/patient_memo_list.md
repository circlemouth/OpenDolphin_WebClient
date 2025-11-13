[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/patient_memo_list.html#content)

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
 > 患者メモ取得

患者メモ取得
======

更新履歴
----

 2021-01-27   レイアウト資料に項目を追加。

患者メモ取得（URL:/api01rv2/patientlst7v2）
-----------------------------------

基準日を基に対象患者のメモ情報の取得を可能とします。

1.  基準日が未設定の時はシステム日付とします。
2.  メモ区分の設定がなければ、メモ2の内容を返却します。  
    メモ1を取得したいときのみ、メモ区分(Memo\_Class)=1 を設定します。
3.  診療科の設定がなければ、登録されているすべての診療科のメモ情報を返却します。  
    最大件数は10件とします。
4.  診療科で受付中であれば、メモ情報に受付の保険組合せを返却します。  
    受付中でない（会計済み）場合は受付なしとして保険組合せの返却はしません。  
      
    登録されているメモ情報の診療科=00の場合は、最初の受付中の保険組合せと診療科を返却します。  
    登録されているメモ情報の診療科≠00の場合は、その診療科で受付中であれば受付時の保険組合せを返却します。  
      
    受付後に保険組合せの変更で保険組合せが削除・期間終了になった場合は、保険組合せ番号のみ返却します。  
      
    ※　基準日が過去日の場合は、基本的に会計済となるので保険組合せの返却はしませんが、会計済みにできなかった場合のみ返却を行います。  
    

リクエストサンプル

<data>  
	<patientlst7req type="record">  
		<Request\_Number type="string">01</Request\_Number>  
		<Patient\_ID type="string">161</Patient\_ID>  
		<Base\_Date type="string">2018-11-13</Base\_Date>  
		<Department\_Code type="string"></Department\_Code>  
		<Memo\_Class type="string"></Memo\_Class>  
	</patientlst7req>  
</data>  

レスポンスサンプル  

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <patientlst7res type="record">  
    <Information\_Date type="string">2018-11-13</Information\_Date>  
    <Information\_Time type="string">14:45:18</Information\_Time>  
    <Api\_Result type="string">000</Api\_Result>  
    <Api\_Result\_Message type="string">処理終了</Api\_Result\_Message>  
    <Reskey type="string">Patient Info</Reskey>  
    <Patient\_Information type="record">  
      <Patient\_ID type="string">00161</Patient\_ID>  
      <WholeName type="string">羽織　てすと</WholeName>  
      <WholeName\_inKana type="string">ハオリ　テスト</WholeName\_inKana>  
      <BirthDate type="string">1971-06-04</BirthDate>  
      <Sex type="string">2</Sex>  
    </Patient\_Information>  
    <Base\_Date type="string">2018-11-13</Base\_Date>  
    <Patient\_Memo\_Information type="array">  
      <Patient\_Memo\_Information\_child type="record">  
        <Department\_Code type="string">01</Department\_Code>  
        <Department\_Name type="string">内科</Department\_Name>  
        <Patient\_Memo type="string">めも２　診療科０１</Patient\_Memo>  
        <Accept\_Information type="record">  
          <HealthInsurance\_Information type="record">  
            <Insurance\_Combination\_Number type="string">0006</Insurance\_Combination\_Number>  
            <InsuranceProvider\_Class type="string">060</InsuranceProvider\_Class>  
            <InsuranceProvider\_Number type="string">320010</InsuranceProvider\_Number>  
            <InsuranceProvider\_WholeName type="string">国保</InsuranceProvider\_WholeName>  
            <HealthInsuredPerson\_Symbol type="string">１２３４５６７</HealthInsuredPerson\_Symbol>  
            <HealthInsuredPerson\_Number type="string">５５６６７７８</HealthInsuredPerson\_Number>  
            <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
            <RelationToInsuredPerson type="string">1</RelationToInsuredPerson>  
            <HealthInsuredPerson\_WholeName type="string">羽織　てすと</HealthInsuredPerson\_WholeName>  
            <Certificate\_StartDate type="string">2014-01-01</Certificate\_StartDate>  
            <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
          </HealthInsurance\_Information>  
        </Accept\_Information>  
      </Patient\_Memo\_Information\_child>  
      <Patient\_Memo\_Information\_child type="record">  
        <Department\_Code type="string">00</Department\_Code>  
        <Department\_Name type="string">全科</Department\_Name>  
        <Patient\_Memo type="string">めも２　診療科００</Patient\_Memo>  
        <Accept\_Information type="record">  
          <Department\_Code type="string">01</Department\_Code>  
          <Department\_Name type="string">内科</Department\_Name>  
          <HealthInsurance\_Information type="record">  
            <Insurance\_Combination\_Number type="string">0006</Insurance\_Combination\_Number>  
            <InsuranceProvider\_Class type="string">060</InsuranceProvider\_Class>  
            <InsuranceProvider\_Number type="string">320010</InsuranceProvider\_Number>  
            <InsuranceProvider\_WholeName type="string">国保</InsuranceProvider\_WholeName>  
            <HealthInsuredPerson\_Symbol type="string">１２３４５６７</HealthInsuredPerson\_Symbol>  
            <HealthInsuredPerson\_Number type="string">５５６６７７８</HealthInsuredPerson\_Number>  
            <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
            <RelationToInsuredPerson type="string">1</RelationToInsuredPerson>  
            <HealthInsuredPerson\_WholeName type="string">羽織　てすと</HealthInsuredPerson\_WholeName>  
            <Certificate\_StartDate type="string">2014-01-01</Certificate\_StartDate>  
            <Certificate\_ExpiredDate type="string">9999-12-31</Certificate\_ExpiredDate>  
          </HealthInsurance\_Information>  
        </Accept\_Information>  
      </Patient\_Memo\_Information\_child>  
    </Patient\_Memo\_Information>  
  </patientlst7res>  
</xmlio2>  

### レイアウト資料(PDF)

[api01rv2\_patientlst7v2.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_patientlst7v2.pdf)
  
[api01rv2\_patientlst7v2\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_patientlst7v2_err.pdf)

### Rubyによるリクエストサンプルソース

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。  
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。

*   Ruby1.9.2以降の場合  
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    

Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
サンプルソース内に以下の一行が記述されていることを確認して下さい。

\# -\*- coding: utf-8 -\*-  

[sample\_patientlst7\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_patientlst7_v2.rb)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 患者メモ取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/patient_memo_list.html#wrapper)

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
