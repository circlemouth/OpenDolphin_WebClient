# API専用化方針の確定（前提ドキュメント）

## RUN_ID
- 20260105T053605Z

## 目的
- CLAIM を完全廃止し、API/PushAPI に統一する方針を確定する。

## 参照
- `docs/server-modernization/ORCA_CLAIM_DEPRECATION.md`
- `docs/server-modernization/orca-claim-deprecation/00_方針確認と影響範囲整理.md`

## 前提
- CLAIM 通信は **2026-03-31 で廃止予定**（以降は不具合修正/機能追加なし）。
- CLAIM 依存の機能は API/PushAPI で代替可能。
- API-only で動く構成に合わせて設定・監査・運用手順を見直す。

## 決定事項（API-only 方針）
1. **CLAIM 送受信の全面廃止**
   - CLAIM ソケット送信/受信、CLAIM XML 生成、CLAIM 互換 REST をすべて撤去対象とする。
   - `/karte/diagnosis/claim` / `/karte/claim` / `/schedule/document` / `/orca/claim/outpatient/*` / `/serverinfo/claim/conn` / `/claim/conn` は API-only 移行で廃止。
2. **代替は API/PushAPI のみ**
   - 病名/処方/オーダ/診療録は `/orca/*` API 群へ統一。
   - PushAPI は server-modernized に受信口がないため、必要性を確認し **新規実装を前提**とする。
3. **設定の単一路線化**
   - `custom.properties` の `claim.*` / `diagnosis.claim.send` / `claim.jdbc.*` は **完全撤去**。
   - `orca.orcaapi.*` を唯一の接続設定として扱い、`claim.host` などのフォールバック分岐は削除。
   - 移行期は `claim.*` が残っていても **無視 + 起動時警告**、次リリースでサンプル/運用手順から削除。
4. **監査/メトリクスの統合**
   - CLAIM 送信に紐づく監査イベントは API 呼び出しの監査ログに統合。
   - 監査イベント名は API 系に統一し、CLAIM 名称は廃止。
5. **データモデルの整理**
   - `sendClaim` / `claimDate` など CLAIM 専用フラグは **参照停止**し、後続で削除。
   - まずは機能停止 → 参照削除 → マイグレーションの順で段階的に撤去。

## 作業内容
- 置換方針（削除対象/残存禁止/移行方法）を決める。
- 影響範囲に合わせた実装順序を確定する。
- リスク（監査・互換・設定影響）を整理する。

## 作業順序（確定）
1. **CLAIM 送受信コードの削除**（`02_CLAIM送受信コードの削除.md`）
   - 送信/受信/テンプレート/CLAIM REST の削除と API 置換。
2. **CLAIM 設定と分岐の撤去**（`03_CLAIM設定と環境変数の整理.md`）
   - `claim.*`/`diagnosis.claim.send`/`claim.jdbc.*` の参照と設定例を削除。
3. **API-only 疎通確認**（`04_API-only疎通確認.md`）
   - API/PushAPI の最小疎通と設定読み込みを検証。
4. **ORCA API 互換テスト**（`05_ORCA_API互換テスト.md`）
   - 病名/処方/オーダ/診療録の API 互換性を確認。
5. **監査ログ/メトリクス整備**（`06_監査ログとメトリクス確認.md`）
   - CLAIM 監査の撤去と API 監査の一貫性を確認。
6. **運用ドキュメント更新**（`07_運用ドキュメント更新.md`）
   - 設定例・運用手順・トラブルシュートを API-only に刷新。
7. **リリース準備と移行告知**（`08_リリース準備と移行告知.md`）
   - 2026-03-31 に合わせた告知/移行ガイドの確定。

## リスクと対応
- **PushAPI 受信未実装**: ORCA 側の必要性を早期確認し、必要なら受信実装を先行。
- **UI 互換**: `api01rv2/claim/outpatient` 依存箇所は API-only で置換し、互換 API は維持しない。
- **監査ログ断絶**: CLAIM イベント撤去時に監査の粒度低下が起きないよう、API 監査へマッピング。
- **設定移行漏れ**: `claim.*` を使った既存環境に対し、警告と移行手順を運用ドキュメントへ記載。
- **DB スキーマ整理**: `claimDate` 等の削除は段階的に行い、未使用確認後にマイグレーション。

## 完了条件
- API-only 方針と作業順序が確定している。

## 成果物
- API-only 移行方針メモ
- 作業順序とリスク一覧
