# カルテ/診療記録機能レビュー（RUN_ID=20251119T133348Z）

## 背景
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`。
- 担当: Worker B (拡張機能 API KRT-02)
- 目的: `RoutineMed` および `SafetySummary` 関連エンドポイントの検証と実装。

## 調査結果
### 1. RoutineMed エンドポイントの存在確認
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java` に `GET /karte/routineMed/list/{karteId}` が実装済みであることを確認。
- `KarteServiceBean#getRoutineMedications` も実装されており、`RoutineMedicationResponse` DTO も存在した。
- 以前の作業（RUN_ID=20251116T210500Z-A）により実装されたものと思われる。

### 2. SafetySummary エンドポイントの欠如
- `SafetySummary` 機能（安全管理情報）に関連する `/karte/safety` エンドポイントは存在しなかった。
- Web クライアントの `SafetySummaryCard` はアレルギー、既往歴、定期処方情報を必要とするが、これらを一括取得するエンドポイントが未実装であった。

## 実装内容
### 1. SafetySummaryResponse DTO の作成
- `server-modernized/src/main/java/open/dolphin/rest/dto/SafetySummaryResponse.java` を新規作成。
- アレルギー (`List<AllergyModel>`)、診断 (`List<RegisteredDiagnosisModel>`)、定期処方 (`List<RoutineMedicationResponse>`) を保持する構造とした。

### 2. KarteServiceBean へのメソッド追加
- `KarteServiceBean#getSafetySummary(long karteId)` を実装。
- 以下の情報を集約して返却するロジックを追加:
    - アレルギー情報 (`QUERY_ALLERGY`)
    - アクティブな診断情報 (`QUERY_DIAGNOSIS_BY_KARTE_ACTIVEONLY`)
    - 定期処方情報 (`getRoutineMedications` を再利用)

### 3. KarteResource へのエンドポイント追加
- `GET /karte/safety/{karteId}` を追加し、`KarteServiceBean#getSafetySummary` を呼び出すように実装。

## 検証
- コードベースの静的確認を行い、コンパイルエラーがないことを想定（依存クラスのインポート確認済み）。
- `RoutineMed` は既存実装を維持し、`SafetySummary` で再利用することで整合性を確保した。

## 次のアクション
- Web クライアント側で `SafetySummaryCard` がこの新しいエンドポイント `/karte/safety/{karteId}` を利用するように実装/修正する必要がある（本タスク範囲外だが記録しておく）。
