# 帳票ライブラリ ライセンス比較

| ライブラリ | ライセンス | 主な制約 | 対応状況 |
| --- | --- | --- | --- |
| iText 2.0.8 | MPL/LGPL (デュアル) | 改変物の公開義務、商用サポート終了 | 廃止。既存バイナリはクリーンアップ済み。 |
| OpenPDF 1.3.41 | LGPL 2.1 / MPL 1.1 | デュアルライセンスのためソース入手方法の案内が必須 | 採用。LGPL/MPL 告知は運用ドキュメントへ追記済み。 |
| Apache Velocity 1.7 | Apache-2.0 | 旧 API、セキュリティ修正停止 | 廃止。Velocity 2.3 へ置換。 |
| Apache Velocity 2.3 | Apache-2.0 | Notice ファイルの保持 | 採用。`NOTICE` ファイルを WAR に同梱。 |

- OpenPDF への移行に伴い、フォント埋め込み用の `iTextAsian.jar` は LGPL 条件での再配布が認められているため、現行の docker ビルド手順で継続利用してもライセンス違反とはならない。
- 署名関連で利用する BouncyCastle ライブラリは Bouncy Castle License（MIT 互換）であり、再配布時にはライセンス文面の同梱が必要。
