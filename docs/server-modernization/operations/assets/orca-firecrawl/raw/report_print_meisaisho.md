[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#content)

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
 > [帳票印刷](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html)
 > 診療費明細書（外来）印刷API

診療費明細書（外来）印刷API  

==================

メニュー
----

*   [更新履歴](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#history)
      
    
*   [概要](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#about)
    
*   [テスト方法](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#test)
    
*   [リクエスト(POSTリクエスト)サンプル](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#reqsample)
    
*   [レスポンスサンプル](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#ressample)
    
*   [リクエスト一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#request)
    
*   [レスポンス一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#response)
    
*   [Rubyによるリクエストサンプルソース](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#rubysample)
    
*   [帳票印刷APIエラーメッセージ一覧](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#errmsg)
      
    

更新履歴
----

2019-10-28   帳票のPDF作成機能を追加。

概要
--

*   リクエスト項目に該当する診療費明細書（外来）の印刷および、レスポンスとして帳票データの返却を行います。
*   収納業務の再発行ボタンから印刷を行う際の内容を標準帳票の「ORCHC04」に準じたレイアウトで印刷を行います。
*   帳票の編集にあたって、システム管理マスタ「1910 プログラムオプション情報」の「ORCHC04」の設定を参照します。  
    

テスト方法
-----

1.  参考提供されている sample\_statement\_v2.rb 内の変数HOST等を接続環境に合わせます。
2.  sample\_statement\_v2.rb 内の患者番号等を接続先の日レセの環境に合わせます。
3.  ruby sample\_statement\_v2.rb により接続します。  
    

リクエスト(POSTリクエスト)サンプル
--------------------

POST : /api01rv2/statementv2  
  
Content-Type: application/xml

application/xml の場合の文字コードは UTF-8 とします。

<data>  
  <statementv2req type ="record">  
    <Request\_Number type ="string">01</Request\_Number>  
    <Patient\_ID type ="string">1</Patient\_ID>  
    <Invoice\_Number type ="string">1426</Invoice\_Number>  
  </statementv2req>  
</data>  

レスポンスサンプル  

------------

JSON形式で返却を行います。

{  
  "Information\_Date": "2019-07-16",  
  "Information\_Time": "13:28:24",  
  "Api\_Result": "0000",  
  "Api\_Result\_Message": "処理終了",  
  "Form\_ID": "meisaisho",  
  "Form\_Name": "診療費明細書",  
  "Print\_Date": "2019-07-16",  
  "Print\_Time": "13:28:23",  
  "Patient": {  
    "ID": "00001",  
    "Name": "日医　太郎",  
    "KanaName": "ニチイ　タロウ",  
    "BirthDate": "1958-01-10",  
    "Sex": "1"  
  },  
  "Forms": \[  \
    {  \
      "data": {  \
        "Form\_ID": "meisaisho",  \
        "Printer": "PDF",  \
        "Patient": {  \
          "ID": "00001",  \
          "Name": "日医　太郎"  \
        },  \
        "Hospital": {  \
          "Name": \[  \
            "ＯＲＣＡ診療所",  \
            "",  \
            ""  \
          \],  \
          "ZipCode": "1130021",  \
          "Address": \[  \
            "東京都文京区本駒込２−２８−１６",  \
            "",  \
            ""  \
          \],  \
          "PhoneNumber": "03-3946-0001"  \
        },  \
        "Perform\_Date": "2019-07-16",  \
        "IssuedDate": "2019-07-16",  \
        "Department\_Name": "内科",  \
        "Insurance\_Name": "協会　　　　",  \
        "Insurance\_Rate": "  3 割",  \
        "Invoice\_Number": "   1426",  \
        "Statement": \[  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "初・再診料",  \
            "Description": "＊再診料",  \
            "Point": "      720",  \
            "Count": "  1",  \
            "Total\_Point": "      720",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "投　　薬",  \
            "Description": "＊クラビット錠２５０ｍｇ　（レボフロキサシンとして）　　３錠",  \
            "Point": "      650",  \
            "Count": "  5",  \
            "Total\_Point": "     3250",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "＊調剤料（内服薬・浸煎薬・屯服薬）",  \
            "Point": "       90",  \
            "Count": "  1",  \
            "Total\_Point": "       90",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "＊処方料（その他）",  \
            "Point": "      420",  \
            "Count": "  1",  \
            "Total\_Point": "      420",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "処　　置",  \
            "Description": "＊酸素吸入",  \
            "Point": "      650",  \
            "Count": "  1",  \
            "Total\_Point": "      650",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "＊創傷処置（１００ｃｍ２未満）",  \
            "Point": "      520",  \
            "Count": "  1",  \
            "Total\_Point": "      520",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "検　　査",  \
            "Description": "＊末梢血液一般",  \
            "Point": "      210",  \
            "Count": "  1",  \
            "Total\_Point": "      210",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "＊血液学的検査判断料",  \
            "Point": "     1250",  \
            "Count": "  1",  \
            "Total\_Point": "     1250",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "画像診断",  \
            "Description": "＊胃（参考マスタ）"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "　単純撮影（デジタル撮影）　　１枚"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Description": "　単純撮影（ロ）の写真診断　　１枚",  \
            "Point": "     1110",  \
            "Count": "  1",  \
            "Total\_Point": "     1110",  \
            "End\_Flg": "1"  \
          },  \
          {  \
            "Group\_Number": "001",  \
            "Medical\_Class\_Name": "放射線治療",  \
            "Description": "＊放射線治療管理料（１門照射）",  \
            "Point": "    27000",  \
            "Count": "  1",  \
            "Total\_Point": "    27000",  \
            "End\_Flg": "1"  \
          },  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},  \
          {},{},{},{},{},{},{},{}  \
        \],  \
        "Yen\_Flg": "1",  \
        "Caution": "※厚生労働省が定める診療報酬や薬価等には、医療機関等が仕入れ時に負担する消費税が反映されています。"  \
      }  \
    }  \
  \]  
}  

リクエスト一覧  

----------

[meisaisho\_req.pdf](http://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/meisaisho_req.pdf)

レスポンス一覧
-------

[meisaisho.pdf](http://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/meisaisho.pdf)

Rubyによるリクエストサンプルソース  

----------------------

Rubyのバージョンが1.9.2以前の環境の場合、HTTPのバージョン指定を1.1に変更する必要があります。    

Rubyのバージョンを確認後、以下のように該当箇所を変更して下さい。  

*   Ruby1.9.2以降の場合
    
    Net::HTTP.version\_1\_2   
    
*   Ruby1.9.2以前の場合  
    
    Net::HTTP.version\_1\_1   
    

Rubyのバージョンが1.9.1以降の環境(日レセ4.8以降の環境)ではソースファイル内の文字コードの指定が必要になります。  
サンプルソース内に以下の一行が記述されていることを確認して下さい。  

\# -\*- coding: utf-8 -\*-    

[sample\_statement\_v2.rb](http://ftp.orca.med.or.jp/pub/data/receipt/tec/api/sample_statement_v2.rb)
  

帳票印刷APIエラーメッセージ一覧
-----------------

[report\_api\_err.pdf](http://ftp.orca.med.or.jp/pub/data/receipt/tec/push-api/report_api_err.pdf)

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [技術情報](https://www.orca.med.or.jp/receipt/tec/index.html)
 > [日医標準レセプトソフト API](https://www.orca.med.or.jp/receipt/tec/api/index.html)
 > [帳票印刷](https://www.orca.med.or.jp/receipt/tec/api/report_print/index.html)
 > 診療費明細書（外来）印刷API

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/tec/api/report_print/meisaisho.html#wrapper)

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
