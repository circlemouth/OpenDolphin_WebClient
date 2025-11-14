[![ORCA PROJECT 日本医師会総合政策研究機構](https://www.orca.med.or.jp/images/common/orca_logo.gif)](https://www.orca.med.or.jp/)

[本文へジャンプ](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification4.html#content)

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
 > [運用のための各種設定](https://www.orca.med.or.jp/receipt/use/index.html)
 > SSLクライアント認証の利用(WebORCAオンプレ)

SSLクライアント認証の利用(WebORCAオンプレ版)
============================

最終更新日:2023年09月26日  

*   [概要](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification3.html#abstruct)
    
*   [認証局の作成と証明書の発行](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification3.html#issue_cert)
    
*   [サーバの設定](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification3.html#config_server)
    
*   [クライアントの設定](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification3.html#config_client)
    
*   [トラブルシューティング](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification3.html#troubleshoot)
      
    

概要
==

医院内に構築されているLAN(院内LAN)で日医標準レセプトソフト (以下日レセ) を使用するにあたり、第三者への情報漏洩を防ぐために通信を暗号化することが考えられます。

このドキュメントではサーバとクライアント間の通信をSSLで暗号化し、かつ証明書を利用した認証(以下SSLクライアント認証)を行うための、WebORCA-Server、GoogleChromeに必要な作業を記載します。

このドキュメントの前提条件および範囲は以下の通りです。

*   WeboORCA-ServerでのSSLクライアント認証
    
*   証明書形式はX.509v3(RFC3280)
    
*   日レセのバージョンは Ver.5.2.0 以降  
    
*   OSはUbuntu 22.04 以降  
    

構成
--

SSLクライアント認証では、WebORCA-ServerだけでなくGoogleChromeで利用するユーザアカウント毎に個別のX.509形式の証明書を持つ必要があります。X.509形式の証明書は商用サービス(ベリサインなど)やopensslコマンドで作成したものなど様々なものが利用できますが、本文書では組織内の簡易認証局を構築し、そこから発行した証明書を利用します。

以下に構成図を示します。

 ![構成図](https://ftp.orca.med.or.jp/pub/data/receipt/use/glserver_ssl_client_verification/system.png "構成図")  

作業手順
----

作業の流れは以下のとおりです。

1.  **証明書の発行**

*   > 組織内の簡易認証局を作成し、サーバ証明書とクライアント証明書を発行します。
    

3.  **サーバ設定**

*   CA証明書とサーバ証明書をサーバに設置し、WebORCA-ServerがSSLクライアント認証を行うよう設定します。

5.  **クライアント設定**

*   CA証明書をクライアントのシステムに設置します。 

認証局の作成と証明書の発行
=============

認証局の作成と証明書を発行します。認証局には日レセ用認証局構築ツール orca-catool を利用します。

認証局サーバの用意
---------

認証局を設置するサーバを用意します。条件は以下です。

*   Ubuntu 22.04以降
*   日レセ用apt-lineが設定されている  
    

認証局専用のサーバを用意するのが最も安全ですが、日レセ主サーバまたは従サーバでも構いません。

orca-catoolのインストール
------------------

認証局サーバでコンソールを開き以下のコマンド実行します。

% sudo apt update   
% sudo apt-get install orca-catool 

orca-catoolの起動および認証局作成
----------------------

 コンソールより以下のコマンドを実行します。  

% orca-catool

config file(/home/$USER/.orca\_catool/config.yml) does not exist.

initialize ca?
y or n> y
  specify subcommand

  issue\_server\_cert
  issue\_client\_cert
  export\_cert
  revoke\_cert
  issue\_crl
  list\_cert

 初回起動時は「initialize ca? y or n>」と表示されます。ここで'y'を入力すると認証局の初期化を行いCA証明書を作成します。デフォルトの設定ではサーバ証明書、クライアント証明書ともに有効期間は10年に設定されています。変更する場合は /home/$USER/.orca\_catool/config.yml の 「:server\_cert\_validity」、「:client\_cert\_validity」 の値(日数)を編集してください。  

サーバ証明書の発行
---------

WebORCA-Serverのサーバ証明書を発行します。

サーバ証明書はクライアントからの接続の際に、クライアントが正しいサーバに接続しているか検証するために利用されます。クライアントでのサーバの検証はアクセス先のホスト名と証明書のSubjectAltNameフィールドまたはCNと一致しているかチェックすることで行います。そのためサーバ証明書にはクライアントがアクセスする際のホスト名またはIPアドレスを指定する必要があります。

正

*   クライアントの接続先 -> https://weborca-server:8000
*   サーバ証明書のCNまたはSubjectAltName -> weborca-server  
    

正

*   クライアントの接続先 -> https://192.168.1.100:8000
*   サーバ証明書のCNまたはSubjectAltName -> 192.168.1.100  
    

誤

*   クライアントの接続先 -> https://weborca-server:8000
*   サーバ証明書のCNまたはSubjectAltName -> 192.168.1.100

サーバ証明書にホスト名を指定するか、IPアドレスを指定するかで実行するコマンドが異なります。

ホスト名を指定する場合

% cd  
% orca-catool issue\_server\_cert -c weborca-server

IPアドレスを指定する場合

% cd  
% orca-catool issue\_server\_cert -i 192.168.1.100

ホスト名、IPアドレス両方を指定することもできます。

% cd  
% orca-catool issue\_server\_cert -i 192.168.1.100 -c weborca-server

コマンドを実行すると $HOME/certs に 000002\_\_JP\_orca\_192.168.1.100.zip (<シリアルナンバー>\_JP\_orca\_<コモンネーム>.zip) のようなzipファイルが作成されます。

zipファイルを展開すると以下のようなファイルが格納されています。

*    000002\_\_JP\_orca\_192.168.1.100/

*   000002\_\_JP\_orca\_192.168.1.100.crt     (サーバ証明書(X509 PEM形式))  
    
*   000002\_\_JP\_orca\_192.168.1.100.enc.pem (サーバ証明書秘密鍵(PEM形式 パスフレーズ設定))  
    
*   000002\_\_JP\_orca\_192.168.1.100.p12     (サーバ証明書(PKCS#12形式))  
    
*   000002\_\_JP\_orca\_192.168.1.100.pass    (サーバ証明書パスフレーズ(テキスト))  
    
*   000002\_\_JP\_orca\_192.168.1.100.pem     (サーバ証明書秘密鍵(PEM形式 パスフレーズなし))  
    
*   ca.crt                                (CA証明書(X509 PEM形式))  
    

WebORCA-Serverの設定ではこのzipファイルのCA証明書とPKCS#12形式サーバ証明書を使用します。

クライアント証明書の発行
------------

クライアント用証明書を発行します。

コンソールより以下のようにコマンドを実行します。

\-cオプションにクライアント証明書のコモンネームを設定します。コモンネームは日レセの認証とは関係ないため、ユーザを識別する英数字であれば構いません。  

% cd
% orca-catool issue\_client\_cert -c user1

コマンドを実行すると $HOME/certs にサーバ証明書と同様のzipファイル(certs/000003\_\_JP\_orca\_user1.zip)が作成されます。

認証局ツールのその他の操作
-------------

orca-catoolでは証明書発行以外に以下の操作が可能です。

*   証明書の破棄
*   証明書破棄リスト(CRL)の発行
*   発行済証明書のエクスポート
*   発行済証明書の検索

詳細は /usr/share/doc/orca-catool/README.md.gz を参照してください。  

サーバの設定
======

証明書の設置
------

「サーバ証明書の発行」で作成したzipファイルを展開し、サーバ証明書、CA証明書を以下のパスでサーバ機に設置します。

|     |     |
| --- | --- |
| 項目名 | パス  |
| サーバ証明書 | /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.crt |
| サーバ証明書 | /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.pem |
| CA証明書 | /opt/jma/weborca/conf/ca.crt |

設置のコマンドの例を以下に示します。

証明書の解凍と配置をおこないます  
% cd
% cd certs/
% unzip 000002\_\_JP\_orca\_192.168.1.100.zip
% cd 000002\_\_JP\_orca\_192.168.1.100
$ sudo cp 000002\_\_JP\_orca\_192.168.1.100.crt /opt/jma/weborca/conf
$ sudo cp 000002\_\_JP\_orca\_192.168.1.100.pem /opt/jma/weborca/conf  
$ sudo cp ca.crt /opt/jma/weborca/conf  
  
証明書を特定ユーザからのみアクセスできるよう変更をおこないます  
$ sudo chown orca:orca /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.crt  
$ sudo chown orca:orca /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.pem  
$ sudo chown orca:orca /opt/jma/weborca/conf/ca.crt  
  
$ sudo chmod 400 /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.crt  
$ sudo chmod 400 /opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.pem  
$ sudo chmod 400 /opt/jma/weborca/conf/ca.crt 

**_配置場所に誤りがある場合、日レセが起動しません。_**  
**_日レセが起動しない場合は/opt/jma/weborca/log/jma-receipt-weborca.logにエラーメッセージがないか確認してください。_**

WebORCA-ServerのSSLクライアント認証有効化  

--------------------------------

WebORCA-Server起動時にSSLクライアント認証を有効化するよう設定を行います。  

/opt/jma/weborca/conf/jma-receipt.conf に以下を追記します。 

SERVER\_CRT=/opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.crt  
SERVER\_PEM=/opt/jma/weborca/conf/000002\_\_JP\_orca\_192.168.1.100.pem  
CA\_CRT=/opt/jma/weborca/conf/ca.crt  

設定後、日レセの再起動をおこなうことで/opt/jma/weborca/conf/jma-receipt.confを参照し、設定変更が反映されます。

日レセの再起動
-------

コンソールより以下のコマンドを起動します。

% sudo systemctl restart jma-receipt-weborca.service  

WebORCA-ServerがSSLクライアント認証設定で起動した場合は、/opt/jma/weborca/log/jma-receipt-weborca.logに各証明書が存在することが記録され、「_Server Mode: HTTPS_」のように表示されます。  

2023/09/07 12:56:10 CA\_CRT ...file exists  
2023/09/07 12:56:10 SERVER\_CRT ...file exists  
2023/09/07 12:56:10 SERVER\_PEM ...file exists  
2023/09/07 12:56:10 Server Mode: HTTPS  

クライアントの設定
=========

GoogleChrome
------------

### クライアント証明書の設置

クライアント証明書のzipファイルをGoogleChromeを利用するクライアントマシンにコピーして展開します。 ここではzipファイルが $HOME/certs/000003\_\_JP\_orca\_user1.zip にあるとします。

例：Ubuntuの場合  
% cd 
% cd certs
% unzip 000003\_\_JP\_orca\_user1.zip
% cd 000003\_\_JP\_orca\_user1/  
  
WindowsやMacの場合はUSBメモリ等の外部媒体を用いてコピー後、解凍をおこなってください

クライアント証明書のインポート設定で必要となる秘密鍵のパスフレーズを表示してメモします。

例：Ubuntuの場合  
% cat 000003\_\_JP\_orca\_user1.pass

6RYv24bqgpyu6tn8  
  
WindowsやMacの場合、「000003\_\_JP\_orca\_user1.pass」をテキストエディタで開き、パスフレーズを確認してください  

### クライアント証明のインポート

GoogleChromeを起動します。起動後、右上のメニューを開き、「設定」を選択します。

  
![設定](https://ftp.orca.med.or.jp/pub/data/receipt/use/glserver_ssl_client_verification/chrome-ssl1.png "設定")

  
「プライバシーとセキュリティ」タブを開き「セキュリティ」を選択します。  

![セキュリティ](https://ftp.orca.med.or.jp/pub/data/receipt/use/glserver_ssl_client_verification/chrome-ssl2.png "セキュリティ")  
  

画面下部にある「デバイス証明書の管理」を選択することで、証明書のインポート画面が表示されます。  

![デバイス証明書の管理](https://ftp.orca.med.or.jp/pub/data/receipt/use/glserver_ssl_client_verification/chrome-ssl3.png "デバイス証明書の管理") 

証明書のインポート画面にて「インポート」を選択し、クライアント証明である「000003\_\_JP\_orca\_user1.p12」を選択してください。  
インポート途中でパスワードを求められますので、上記「クライアント証明書の設置」でメモしたパスフレーズを入力してインポート  
をおこなってください。  
  
また、上記と同様の手順で「ca.crt」のインポートもおこなってください。  
(「ca.crt」インポート時は、パスワードを求められません)  

クライアント証明書、「ca.crt」のインポートが完了後、GoogleChromeのURL部分に下記を入力し、WebORCAへの接続確認をおこなって  
ください。

https://(サーバ名またはIPアドレス):8000  
  
_重要：「http」ではなく「https」で接続をおこなってください_

  
接続に成功すると、下記のようにインポートしたクライアント証明書の選択画面が表示されますので、選択して「OK」押下後、  
ログイン画面が表示され、ログインできることをご確認ください。  
  
![証明書の選択](https://ftp.orca.med.or.jp/pub/data/receipt/use/glserver_ssl_client_verification/chrome-ssl4.png "証明書の選択")  
  

### クライアント証明のファイル参照

push-exchangerやAPI利用時、クライアント証明のファイル参照をおこないますが、Ubuntu22.04(WebORCAオンプレ版)でクライアント証明のファイル参照をおこなう場合、クライアント証明はホームディレクトリには配置せず「/opt/jma/weborca/conf/」内に配置したうえで参照していただきますようお願いいたします。

 トラブルシューティング
============

 よくあるエラーケースを列挙します。

 サーバ側  

--------

### 正しいパスにCA証明書やサーバ証明書が設置されていない

「このサイトにアクセスできません」が表示されます。/opt/jma/weborca/log/jma-receipt-weborca.logに以下のようなログが出力されます。  

2023/09/07 13:43:31 CA\_CRT ...file does not exist  
2023/09/07 13:43:31 SERVER\_CRT ...file does not exist  
2023/09/07 13:43:31 SERVER\_PEM ...file does not exist  

### サーバ証明書にパスワードが設定されている

「このサイトにアクセスできません」が表示されます。/opt/jma/weborca/log/jma-receipt-weborca.logに以下のようなログが出力されます。

PASSWORD input was canceled

### サーバ証明書のコモンネームが正しいホスト名またはIPアドレスになっていない

「このサイトにアクセスできません」が表示されます。

### サーバ証明書の有効期限が切れている

「このサイトにアクセスできません」が表示されます。/opt/jma/weborca/log/jma-receipt-weborca.logに以下のようなログが出力されます。

The certificate(/C=JP/O=test/CN=localhost) will be expired in -1 days.#012Please update the certificate.

クライアント側  

----------

### クライアント証明書が設定されていない

「このサイトにアクセスできません」が表示されます。クライアント証明書がインポートされているかご確認ください。  

### httpで接続されている場合

「このサイトにアクセスできません」が表示されます。「https」で接続してください。

### クライアント証明書の有効期限が切れている  

「このサイトにアクセスできません」が表示されます。GoogleChromeの設定から「デバイス証明書の管理」を開き、  
クライアント証明書の有効期限をご確認ください。  

[トップ](https://www.orca.med.or.jp/)
 > [日医標準レセプトソフト](https://www.orca.med.or.jp/receipt/index.html)
 > [運用のための各種設定](https://www.orca.med.or.jp/receipt/use/index.html)
 > SSLクライアント認証の利用(WebORCAオンプレ)

[![このページのトップへ](https://www.orca.med.or.jp/images/common/to_page_top.gif)](https://www.orca.med.or.jp/receipt/use/glserver_ssl_client_verification4.html#wrapper)

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
