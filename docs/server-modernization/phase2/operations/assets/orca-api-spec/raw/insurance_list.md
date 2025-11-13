[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/insurance_list.html#content)

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
 > 保険・公費一覧取得

保険・公費一覧取得
=========

保険・公費一覧取得API(URL:/api01rv2/insuranceinf1v2)
-------------------------------------------

このAPIは、患者登録APIの保険情報の補助的なAPIとして利用可能です。

保険登録・更新時に必要となる保険の種類と補助区分、公費の種類の一覧を返却します。  
補助区分等の値は、日レセ独自に設定したもので、取得しなければ連携相手では補助区分の設定が出来ないため起動時等適切なところで取得しておくことを推奨します。  

1.  連携相手から送信された基準日から1ヶ月の範囲で有効な保険番号マスタから、保険の種類と補助区分、公費の種類の一覧を返却します。  
    

### リクエストサンプル  

<data>  
  <insuranceinfreq type ="record">  
    <Request\_Number type ="string">01</Request\_Number>  
    <Base\_Date type ="string">2018-12-25</Base\_Date>  
  </insuranceinfreq>  
</data>  

### レスポンスサンプル  

<?xml version="1.0" encoding="UTF-8"?>  
<xmlio2>  
  <insuranceinfres type="record">  
    <Information\_Date type="string">2018-12-26</Information\_Date>  
    <Information\_Time type="string">13:28:43</Information\_Time>  
    <Api\_Result type="string">00</Api\_Result>  
    <Api\_Result\_Message type="string">処理終了</Api\_Result\_Message>  
    <Reskey type="string">Patient Info</Reskey>  
    <Insurance\_Information type="record">  
      <Base\_Date type="string">2018-12-26</Base\_Date>  
      <HealthInsurance\_Information type="array">  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">002</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">船員</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">02</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">職務</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">下船</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">通勤</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">A</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割職務</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">B</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">C</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割通勤</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">D</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割職務</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">E</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">F</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割通勤</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">G</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割職務</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">H</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">I</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割通勤</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">003</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">一般</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">03</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">004</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">特別</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">04</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">006</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">組合</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">06</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">007</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">自官</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">07</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">009</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">協会</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">01</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">031</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">国公</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">31</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">下船３月</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">B</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">E</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">H</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">032</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">地公</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">32</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">下船３月</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">B</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">E</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">H</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">033</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">警察</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">33</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">下船３月</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">B</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">E</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">H</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">034</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">学校</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">34</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">下船３月</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">B</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">E</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">H</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割下船</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">039</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">後期高齢者</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">39</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">040</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">後期特療費</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">39</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">060</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">国保</InsuranceProvider\_WholeName>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">0</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">無し</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">4</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外１割 入０割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">5</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外２割 入１割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">6</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外３割 入２割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">063</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退組合</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">63</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">067</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退国保</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">67</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">068</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">特療費</InsuranceProvider\_WholeName>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">0</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">無し</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">3</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">4</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外１割 入０割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">5</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外２割 入１割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">6</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">外３割 入２割</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">069</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退特療費</InsuranceProvider\_WholeName>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">072</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退国公</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">72</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">073</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退地公</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">73</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">074</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退警察</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">74</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">075</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">退学校</InsuranceProvider\_WholeName>  
          <InsuranceProvider\_Identification\_Number type="string">75</InsuranceProvider\_Identification\_Number>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">7</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">３割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">8</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">２割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">9</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">１割</HealthInsuredPerson\_Assistance\_Name>  
              <HealthInsuredPerson\_Assistance\_Mode type="string">1</HealthInsuredPerson\_Assistance\_Mode>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">971</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">労災保険</InsuranceProvider\_WholeName>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">973</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">自賠責保険</InsuranceProvider\_WholeName>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">975</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">公害保険</InsuranceProvider\_WholeName>  
        </HealthInsurance\_Information\_child>  
        <HealthInsurance\_Information\_child type="record">  
          <InsuranceProvider\_Class type="string">980</InsuranceProvider\_Class>  
          <InsuranceProvider\_WholeName type="string">自費</InsuranceProvider\_WholeName>  
          <HealthInsuredPerson\_Assistance\_Info type="array">  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">1</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">課税</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
            <HealthInsuredPerson\_Assistance\_Info\_child type="record">  
              <HealthInsuredPerson\_Assistance type="string">2</HealthInsuredPerson\_Assistance>  
              <HealthInsuredPerson\_Assistance\_Name type="string">非課</HealthInsuredPerson\_Assistance\_Name>  
            </HealthInsuredPerson\_Assistance\_Info\_child>  
          </HealthInsuredPerson\_Assistance\_Info>  
        </HealthInsurance\_Information\_child>  
      </HealthInsurance\_Information>  
      <PublicInsurance\_Information type="array">  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">010</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">感３７の２</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">10</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">011</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">結核入院</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">11</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">012</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">生活保護</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">12</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">013</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">戦傷傷病</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">13</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">014</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">戦傷更正</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">14</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">015</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">更生</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">15</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">016</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">育成</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">16</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">017</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">児童療育</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">17</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">018</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">原爆認定</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">18</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">019</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">原爆一般</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">19</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">020</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">精神入院</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">20</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">021</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">精神通院</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">21</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">023</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">養育</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">23</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">024</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">療養介護</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">24</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">025</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">残留邦人等</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">25</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">028</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">感染症入院</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">28</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">029</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">新感染</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">29</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">030</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">心神喪失</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">30</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">038</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">肝炎治療</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">38</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">051</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">特定負有</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">51</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">052</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">小児特定</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">52</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">053</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">児童保護</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">53</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">054</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">難病</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">54</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">062</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">Ｂ型肝炎</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">62</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">066</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">石綿</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">66</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">079</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">障害児施設</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">79</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">091</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">特定負無</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">51</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">092</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">肝がん治療</PublicInsurance\_Name>  
          <PublicInsurance\_Identification\_Number type="string">38</PublicInsurance\_Identification\_Number>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">945</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">肝治４回目</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">946</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高齢者現役</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">948</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">医併入所中</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">949</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">医療入所中</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">950</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">０７入所中</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">951</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">０８入所中</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">953</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">減額（円超</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">954</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">特例非該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">955</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">０１公該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">956</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">公費アイ　</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">957</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">公費ウエオ</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">958</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">特疾４回目</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">959</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">災害該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">960</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">減額（割）</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">961</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">減額（円）</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">962</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">免除</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">963</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">支払猶予</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">964</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高額委任払</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">965</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高額４回目</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">966</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高額アイ　</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">967</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高額ウエオ</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">968</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">後期該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">969</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">７５歳特例</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">970</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">第三者行為</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">972</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">長期</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">974</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">長期（上位</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">976</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">高齢非該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
        <PublicInsurance\_Information\_child type="record">  
          <PublicInsurance\_Class type="string">977</PublicInsurance\_Class>  
          <PublicInsurance\_Name type="string">後期非該当</PublicInsurance\_Name>  
        </PublicInsurance\_Information\_child>  
      </PublicInsurance\_Information>  
    </Insurance\_Information>  
  </insuranceinfres>  
</xmlio2>  

### レイアウト資料(PDF)  

[api01rv2\_insuranceinf1v2.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/api01rv2_insuranceinf1v2.pdf)

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

[sample\_insuranceinf1v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_insuranceinf1v2.rb)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 保険・公費一覧取得

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/insurance_list.html#wrapper)

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
