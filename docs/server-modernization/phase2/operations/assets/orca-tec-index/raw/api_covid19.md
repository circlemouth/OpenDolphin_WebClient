[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/covid19-api.html#content)

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
 > 新型コロナウイルス感染症入院対応

新型コロナウイルス感染症入院対応
================

  

日レセ本体の仕様については、下記ページをご参照ください。  
[新型コロナウイルス感染症に係る対応について](https://www.orca.med.or.jp/receipt/manual/COVID_19.html)

入退院登録API(/orca31/hsptinfmodv2)
------------------------------

*   入院登録、入院登録（訂正）、転科転棟転室リクエスト項目の算定要件非該当区分の設定内容を追加しました。こちらの項目を利用して診療報酬上臨時的取り扱いに係る特定入院料の算定を可能とします。
*   2 ( 新型コロナ感染症入院（２倍）)
*   3 ( 新型コロナ感染症入院（３倍）) (令和２年５月２６日より)

診療報酬上臨時的取り扱いに係る特定入院料を算定する場合、以下の２通りの方法で可能とします。

パターン１　従来どおりの特定入院料の設定に加えて、算定要件非該当区分に"２"（２倍）または"３"（３倍）を設定する
---------------------------------------------------------

電文サンプル

リクエスト

<data>
  <private\_objects type ="record">
     <Save\_Request type ="string">1</Save\_Request>
     <Request\_Number type ="string">01</Request\_Number>
     <Patient\_ID type ="string">1</Patient\_ID>
     <Admission\_Date type ="string">2020-05-01</Admission\_Date>
     <Ward\_Number type ="string">51</Ward\_Number>
     <Room\_Number type ="string">5101</Room\_Number>
     <Department\_Code type ="string">01</Department\_Code>
     <Doctor\_Code type="array">
       <Doctor\_Code\_child type="string">10001</Doctor\_Code\_child>
     </Doctor\_Code>
     <HealthInsurance\_Information type ="record">
        <Insurance\_Combination\_Number type ="string">0002</Insurance\_Combination\_Number>
     </HealthInsurance\_Information>
     <Hospital\_Charge\_Auto\_Set type ="string"></Hospital\_Charge\_Auto\_Set>
     <!-- システム管理［5002 病室管理情報］で救命救急入院料１の設定をしておくこと。 -->
     <!-- 救命救急入院料１（３日以内）(Hospital\_Charge\_Auto\_Set: '1'でも可) -->
     <Hospital\_Charge type ="string">190024510</Hospital\_Charge>
     <Hospital\_Charge\_NotApplicable type ="string">2</Hospital\_Charge\_NotApplicable>
  </private\_objects>
</data>

レスポンス（一部抜粋）

      <Hospital\_Charge type="record">
        <Label type="string">入院日の入院料</Label>
        <Data type="string">190221450</Data>
        <Name type="string">救命救急入院料１（イ・診療報酬上臨時的取扱）</Name>
      </Hospital\_Charge>

パターン２　診療報酬上臨時的取り扱いに係る特定入院料のコードを設定する。
------------------------------------

電文サンプル

リクエスト

<data>
  <private\_objects type ="record">
     <Save\_Request type ="string">1</Save\_Request>
     <Request\_Number type ="string">01</Request\_Number>
     <Patient\_ID type ="string">1</Patient\_ID>
     <Admission\_Date type ="string">2020-05-01</Admission\_Date>
     <Ward\_Number type ="string">51</Ward\_Number>
     <Room\_Number type ="string">5101</Room\_Number>
     <Department\_Code type ="string">01</Department\_Code>
     <Doctor\_Code type="array">
       <Doctor\_Code\_child type="string">10001</Doctor\_Code\_child>
     </Doctor\_Code>
     <HealthInsurance\_Information type ="record">
        <Insurance\_Combination\_Number type ="string">0002</Insurance\_Combination\_Number>
     </HealthInsurance\_Information>
     <Hospital\_Charge\_Auto\_Set type ="string"></Hospital\_Charge\_Auto\_Set>
     <!-- システム管理［5002 病室管理情報］で救命救急入院料１の設定をしておくこと。 -->
     <!-- 救命救急入院料１（イ・診療報酬上臨時的取扱）-->
     <Hospital\_Charge type ="string">190221450</Hospital\_Charge>
  </private\_objects>
</data>

レスポンス（一部抜粋）

      <Hospital\_Charge type="record">
        <Label type="string">入院日の入院料</Label>
        <Data type="string">190221450</Data>
        <Name type="string">救命救急入院料１（イ・診療報酬上臨時的取扱）</Name>
      </Hospital\_Charge>

注意事項
----

*   新型コロナ感染症患者の入院登録時の保険組み合わせは公費「028 感染症入院」を含んだもので登録を行ってください。
*   入院登録を行うと対象の特定入院料を算定の最大上限日数となる３５日まで算定を行います。  
    （３６日目以降はシステム管理「5001 病棟管理情報」に設定されている入院基本料で入院料の算定を行います。）  
    患者状態によって２１日上限となる患者の場合は、２２日目に異動処理を行い該当入院料の算定を終了してください。

2020-06-04追記 2020-06-25更新

*   「新型コロナウイルス感染症に係る診療報酬上の臨時的な取扱いについて（その 19）」により２０２０年５月２６日以降、通常の特定入院料の３倍の点数を算定できることとされましたが、５月２５日迄に入院登録済みの患者で５月２６日以降も新型コロナウイルス感染症による入院~の~で**３倍の点数の算定が可能な場合**は、異動日に５月２６日を指定して転科転棟転室リクエストを行ってください。  
    （2020-06-04提供ののパッチ、マスタの更新が必須）

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > 新型コロナウイルス感染症入院対応

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/covid19-api.html#wrapper)

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
