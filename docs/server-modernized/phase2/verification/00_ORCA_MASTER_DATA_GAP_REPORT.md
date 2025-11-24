# ORCA マスタデータ実装ギャップ報告書

**日付:** 2025-11-23
**RUN_ID:** 20251123T130134Z
**対象:** Server Modernized (`server-modernized`)
**範囲:** ORCA マスタデータの取得および Web クライアントへの引き渡しに関する検証（追加調査反映版）

## 1. エグゼクティブサマリー

**ステータス: 部分実装だが重要な欠落あり (MAJOR GAP REMAINS)**

追加調査の結果、`server-modernized` には旧 `OrcaResource` を移植した REST エンドポイントが存在し、以下のマスタは **DB 直読で取得・Web クライアントへ引き渡し済み** であることを確認した：
- 点数マスタ検索 `/orca/tensu/*`（名称・コード・点数帯・診区で検索）
- 病名マスタ検索 `/orca/disease/name/*`
- 一般名辞書 `/orca/general/{srycd}`
- 相互作用判定 `/orca/interaction`
- 入力セット/スタンプ `/orca/inputset`, `/orca/stamp/{setCd,...}`
- 施設コード `/orca/facilitycode`

一方で、薬剤分類・最低薬価・用法・特定器材・保険者・住所など多くの ORCA マスタは依然として未提供であり、薬剤 UI/リハ/材料オーダー・資格確認系の要件を満たさない。従って重大ギャップは継続する。

### 2025-11-24 追記（RUN_ID=`20251124T073245Z`）
- Web クライアント側で ORCA-05/06/08 の DTO/型拡張と API スケルトン（`web-client/src/types/orca.ts`, `web-client/src/features/charts/api/orca-api.ts`）を追加し、ORCA DB 定義書に準拠した必須列・監査メタ（dataSource/cacheHit/missingMaster/fallbackUsed/version/runId）を明示。
- サーバー側 REST 追加の設計メモを `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` / `docs/server-modernization/phase2/notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` に追記し、オーナー=Worker-B（暫定）、優先度=P1、ETA=ORCA-05/06=2025-12-06、ORCA-08=2025-12-20 と設定。

## 2. 検証結果

### 2.1. データベース接続（直接アクセス）
*   **要件:** PostgreSQL 接続による ORCA `MASTER` スキーマ（または `PUBLIC` ビュー）へのアクセス（推奨ルート）。
*   **結果:** `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java` で `custom.properties` を読み込み、`claim.jdbc.url`/`claim.user`/`claim.password` を用いた JDBC 接続を生成し `setReadOnly(true)` を設定。永続化ユニットは未定義だが **専用 JDBC 接続クラスで直接参照** している。
*   **判定:** △ 実装あり（JDBC 直読）だが DataSource/Persistence 設定としては未整備。

### 2.2. HTTP API カバレッジ
*   **要件:** ORCA API 経由の代替アクセス、またはモダナイズ版 REST でのマスタ提供。
*   **結果:** ORCA公式 API ラッパー (`OrcaEndpoint` など) にはマスタ取得は無し。一方、`open/orca/rest/OrcaResource` が **独自 REST** として点数・病名・一般名・相互作用・入力セットを公開し、Web クライアントが利用中。
*   **判定:** ▲ 部分実装（独自 REST 経由）。ORCA 公式 API 経由のマスタ取得は未実装。

### 2.3. Web クライアントへのデータ転送
*   **要件:** マスタデータを Web クライアントに提供する REST エンドポイント。
*   **結果:** Web クライアントは `web-client/src/features/charts/api/orca-api.ts` から `/orca/tensu/*`, `/orca/disease/name/*`, `/orca/general/*`, `/orca/interaction`, `/orca/stamp/*` を呼び出しており、サーバー側に対応実装あり。薬剤分類・最低薬価・用法・保険者などのエンドポイントは存在せず、クライアント側にも呼び出し実装なし。
*   **判定:** ▲ 部分実装（主要診療行為・病名・一般名のみ）。

### 2.4. （参考）旧来版サーバーの実装状況
*   **クラス:** `server/src/main/java/open/orca/rest/OrcaResource.java`
*   **実装:** JDBC (`java.sql.*`) を使用して ORCA データベース（PostgreSQL）に直接接続し、SQL クエリを発行しています。
*   **提供機能:**
    *   点数マスタ検索（名称、コード、点数指定）
    *   病名マスタ検索
    *   一般名マスタ検索
    *   相互作用チェック
    *   施設情報取得
*   **示唆:** モダナイズ版でも同様に、ORCA DB への直接接続（読み取り専用）を確立し、JPA または SQL でマスタデータを取得するアーキテクチャが必要です。

## 3. ユーザー要件に対する詳細ギャップ分析

### 3.1. 必須マスタ（セクション 2-1 & 2-2）

| カテゴリ | マスタ名 | テーブル / ビュー | 実装状況 |
| :--- | :--- | :--- | :--- |
| **診療行為** | 点数マスタ | `TBL_TENSU` | ✅ **実装済（/orca/tensu/*）** |
| | 電子点数表 1〜5 | `TBL_ETENSU_1~5` | ❌ 欠落 |
| **薬剤** | 一般名 | `TBL_GENERICNAME` | ✅ **実装済（/orca/general）** |
| | 最低薬価 | `TBL_GENERIC_PRICE` | ❌ 欠落 |
| | 医薬品分類 | `TBL_GENERIC_CLASS` | ❌ 欠落 |
| | 用法 | `TBL_YOUHOU` | ❌ 欠落 |
| **機材** | 特定器材マスタ | `TBL_MATERIAL_*` | ❌ 欠落 |
| **病名** | 病名マスタ | `TBL_BYOMEI` | ✅ **実装済（/orca/disease/name）** |
| **相互作用** | 相互作用・症状機序 | `TBL_INTERACT`, `TBL_SSKIJYO` | ✅ **実装済（/orca/interaction）** |
| **入力セット** | 約束処方/診療セット | `TBL_INPUTCD`, `TBL_INPUTSET` + `TBL_TENSU` | ✅ **実装済（/orca/inputset, /orca/stamp）** |
| **保険** | 保険者情報 | `TBL_HKNJAINF` | ❌ 欠落（組合せ API のみ） |
| **住所** | 住所マスタ | `TBL_ADRS` | ❌ 欠落 |
| **その他** | 電子点数表メタ・特材・最低薬価・用法・医薬品分類 ほか |  | ❌ 欠落 |

## 4. 推奨事項

Web クライアントのオーダー入力機能をサポートするために、以下の対応が直ちに必要です：

1.  **既存 DB 直読エンドポイントのハードニング:**
    *   `OrcaResource` で使用する JDBC 接続設定を `DataSource` 化し、接続プールと認証情報管理を標準化する。
    *   `custom.properties` 依存のままになっている接続情報を Secrets 管理へ移行。

2.  **未実装マスタの追加提供:**
    *   薬剤分類（`TBL_GENERIC_CLASS`）、最低薬価（`TBL_GENERIC_PRICE`）、用法（`TBL_YOUHOU`）、特材（`TBL_MATERIAL_*`）、検査分類（`TBL_KENSASORT`）、保険者（`TBL_HKNJAINF`）、住所（`TBL_ADRS`）などを追加で公開する REST を整備。
    *   可能であれば ORCA 公式 API に存在する `/api01rv2/insprogetv2` をラップし、クラウド越し構成でも取得できる経路を用意。

3.  **ペイロード互換とキャッシュ方針:**
    *   取得データのフィールド/型を Web クライアント `types/orca.ts` と揃える変換層を追加。
    *   マスタサイズが大きいもの（点数・用法・特材・住所）は短期キャッシュを導入し、クエリ集中を抑止。

4.  **テストと監査:**
    *   追加マスタの REST について MSW/fixture を用意し、`artifacts/api-stability/20251123T130134Z/` に期待値を格納。
    *   `/orca/interaction` など既存 API も含め SLA 計測と監査ログを追加し、障害時ロールバック手順を明記。

## 5. 参照資料

* ORCA データベーステーブル定義書（firecrawl 取得・オフライン参照可）: `docs/server-modernization/phase2/operations/assets/orca-db-schema/README.md`（正式版 2024-04-26 を基本参照。長期収載品選定療養の追加カラム確認時のみ 2024-09-25 速報版を併用）。
* 取得ファイル一覧: `docs/server-modernization/phase2/operations/assets/orca-db-schema/manifest.json`（`raw/*.pdf` / `raw/*.md` のローカルパスと版を明記）。
