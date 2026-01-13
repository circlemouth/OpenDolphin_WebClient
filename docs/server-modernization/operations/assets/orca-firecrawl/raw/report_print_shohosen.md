[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#content)

|     |     |
| --- | --- |
|     | [×](javascript:void(0) "検索ボックスをクリア") |

検索

カスタム検索

|     |     |
| --- | --- |
|     | 並べ替え<br><br>日付<br><br>関連性 |

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
 > [帳票印刷](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html)
 > 処方せん印刷API

処方せん印刷API  

============

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#history)
      
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#rubysample)
    
*   [帳票印刷APIエラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#errmsg)
      
    

更新履歴
----

2024-09-25   レスポンスの項目を追加。

2022-04-07   帳票のPDF作成機能を追加。

2019-10-28   帳票のPDF作成機能を追加。

2018-07-25   院外処方箋印刷リクエスト時、レスポンス項目［発行区分］に"0"を返却するよう修正。  

概要
--

*   リクエスト項目に該当する処方せんの印刷および、レスポンスとして帳票データの返却を行います。
*   標準帳票の「ORCHC02Q」(A5サイズ、ＱRコード付き)に準じたレイアウトで印刷を行います。
*   帳票の編集にあたって、システム管理マスタ「1910 プログラムオプション情報」の「ORCHC02Q」の設定を参照します。  
    

テスト方法
-----

1.  参考提供されている sample\_prescription\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_prescription\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_prescription\_v2.rb により接続します。  
    

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/prescriptionv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  
<prescriptionv2req type ="record">  
   <Request\_Number type ="string">01</Request\_Number>  
   <Patient\_ID type ="string">1</Patient\_ID>  
   <Invoice\_Number type ="string">372</Invoice\_Number>  
   <Outside\_Class type ="string">True</Outside\_Class>  
</prescriptionv2req>  
</data>  

レスポンスサンプル  

------------

JSON形式で返却を行います。

{
  "Information\_Date": "2022-04-01",
  "Information\_Time": "13:50:13",
  "Api\_Result": "0000",
  "Api\_Result\_Message": "処理終了",
  "Form\_ID": "shohosen",
  "Form\_Name": "処方箋",
  "Print\_Date": "2022-04-01",
  "Print\_Time": "10:50:12",
  "Patient": {
    "ID": "00110",
    "Name": "テスト　オウシン",
    "KanaName": "テスト　オウシン",
    "BirthDate": "1998-04-01",
    "Sex": "2"
  },
  "Forms": \[\
    {\
      "data": {\
        "Form\_ID": "shohosen",\
        "Printer": "PDF",\
        "Order\_Class": "0",\
        "Perform\_Date": "2022-04-01",\
        "IssuedDate": "2022-04-01",\
        "Department\_Code": "01",\
        "EditPageNumber\_Flg": "0",\
        "Split\_Count": "0",\
        "Split\_Number": "0",\
        "Refill\_Count": "0",\
    "Refill\_Delete\_Line": "True",\
        "Patient": {\
          "ID": "00110",\
          "Name": "テスト　オウシン",\
          "KanaName": "テスト　オウシン",\
          "BirthDate": "1998-04-01",\
          "Sex": "2"\
        },\
        "Insurance\_Combination\_Information": {\
          "Number": "0001",\
          "InsuranceProvider\_Class": "009",\
          "InsuranceProvider\_Name": "協会",\
          "HealthInsuredPerson\_Age": "024",\
          "HealthInsuredPerson\_Rate": "030",\
          "HealthInsuredPerson\_Rate\_Class": "0",\
          "HealthInsurance\_Information": {\
            "InsuranceProvider\_Number": "01320019",\
            "HealthInsuredPerson\_Symbol": "１２３",\
            "HealthInsuredPerson\_Number": "１２３４５６７８９",\
            "RelationToInsuredPerson": "2",\
            "Certificate\_StartDate": "2013-04-01",\
            "Certificate\_ExpiredDate": "9999-12-31"\
          }\
        },\
        "Hospital": {\
          "Prefectures\_Number": "13",\
          "Code": "1234567",\
          "Name": \[\
            "ＯＲＣＡクリニック",\
            "",\
            ""\
          \],\
          "ZipCode": "1130021",\
          "Address": \[\
            "東京都文京区本駒込２−２８−１６",\
            "",\
            ""\
          \],\
          "PhoneNumber": "03-3946-0001",\
          "FaxNumber": "03-3946-0002"\
        },\
        "Doctor": {\
          "Code": "10001",\
          "Name": "オルカ　太郎"\
        },\
        "IncludingNarcotic\_Flg": "0",\
        "IncludingUnchangeable\_Flg": "0",\
        "Rp": \[\
          {\
            "Medical\_Class": "21",\
            "Count": "001",\
            "Unit\_Name": "日分",\
            "Medication": \[\
              {\
                "Name": "アテノロール５０ｍｇ錠",\
                "Amount": "00002.00000",\
                "Unit\_Name": "錠",\
                "Code": "610461003",\
                "Generic\_Flg": "0",\
                "Generic\_Code": "2123011F2011"\
              },\
              {\
              },\
　　　　　　・\
　　　　　　・省略\
　　　　　　・\
          {\
          }\
        \],\
        "Qr\_ID": "1#4e2b6e54-5567-414a-bcef-d017f3356b93"\
      }\
    },\
\
リクエスト一覧  \
\
----------\
\
[shohosen\_req.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shohosen_req.pdf)\
\
レスポンス一覧\
-------\
\
[shohosen.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/shohosen_20240925.pdf)\
\
Rubyによるリクエストサンプルソース  \
\
----------------------\
\
Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。    \
\
Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。  \
\
*   Ruby1.9.2以降の場合\
    \
    Net::HTTP.version\_1\_2   \
    \
*   Ruby1.9.2以前の場合  \
    \
    Net::HTTP.version\_1\_1   \
    \
\
Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  \
サンプルソース内に以下の一行が記述されていることを確認して下さい。  \
\
\# -\*- coding: utf-8 -\*-    \
\
[sample\_prescription\_v2.rb](https://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_prescription_v2.rb)\
  \
\
帳票印刷APIエラーメッセージ一覧\
-----------------\
\
[report\_api\_err.pdf](https://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/report_api_err.pdf)\
\
[トップ](https://www.orca.med.or.jp/)\
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)\
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)\
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)\
 > [帳票印刷](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html)\
 > 処方せん印刷API\
\
[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/report_print/shohosen.html#wrapper)\
\
[![ORCAプロジェクト](https://www.orca.med.or.jp/images/common/orca_project_logo.gif)](http://www.orca.med.or.jp/)\
  \
  \
[![日本医師会](https://www.orca.med.or.jp/images/top/jma-s.png)](http://www.med.or.jp/)\
  \
\
ORCAについて\
\
[ORCAとは](https://www.orca.med.or.jp/orca/index.html)\
\
[医療機関ID申請](https://www.orca.med.or.jp/receipt/id/)\
\
[定点調査研究事業](https://www.orca.med.or.jp/das/index.html)\
\
[日医IT認定制度](https://www.orca.med.or.jp/nintei/)\
\
[日本医師会](http://www.med.or.jp/)\
\
[日本医師会ORCA管理機構](https://www.orcamo.co.jp/)\
\
[日本医師会電子認証センター](http://www.jmaca.med.or.jp/)\
\
日レセご紹介サイト\
\
[ソフトの特長](http://www.jma-receipt.jp/merit/index.html)\
\
[ユーザ事例](http://www.jma-receipt.jp/case/hokkaido/index.html)\
\
[展示・説明会](http://www.jma-receipt.jp/trial/index.html)\
\
[導入までの流れ](http://www.jma-receipt.jp/step/index.html)\
\
[日レセを体験](http://www.jma-receipt.jp/trialsite/index.html)\
\
[サポート事業所検索](http://search.orca.med.or.jp/support/)\
\
[稼働状況](http://www.jma-receipt.jp/operation/)\
\
日レセユーザサイト\
\
[更新情報](https://www.orca.med.or.jp/receipt/index.html#koushin)\
\
[開発計画](https://www.orca.med.or.jp/receipt/index.html#kaihatu)\
\
[操作ガイド](https://www.orca.med.or.jp/receipt/index.html#manual)\
\
[改正対応](https://www.orca.med.or.jp/receipt/index.html#kaisei)\
\
[ダウンロード](https://www.orca.med.or.jp/receipt/index.html#dl)\
\
[各種設定](https://www.orca.med.or.jp/receipt/index.html#unyo)\
\
[技術情報](https://www.orca.med.or.jp/receipt/tec/)\
\
介護・特定健診関連\
\
[医見書](https://www.orca.med.or.jp/ikensyo/index.html)\
\
[WebQKAN](https://www.orca.med.or.jp/qkan-cloud/index.html)\
\
[特定健康診査システム](https://www.orca.med.or.jp/tokutei/index.html)\
\
サポート\
\
[サポート・コミュニティ](https://www.orca.med.or.jp/support/index.html)\
\
[OSCについて](https://www.orca.med.or.jp/osc/index.html)\
\
[お問い合わせ一覧](https://www.orca.med.or.jp/contact/index.html)\
\
[リンク集](https://www.orca.med.or.jp/support/index.html#link)\
\
|     |     |\
| --- | --- |\
|     |     |
