# API専用化方針の確定（前提ドキュメント）

## 目的
- CLAIM を完全廃止し、API/PushAPI に統一する方針を確定する。

## 参照
- `docs/server-modernization/ORCA_CLAIM_DEPRECATION.md`
- `docs/server-modernization/orca-claim-deprecation/00_方針確認と影響範囲整理.md`

## 前提
- CLAIM 依存の機能は API/PushAPI で代替可能。
- API-only で動く構成に合わせて設定・監査・運用手順を見直す。

## 作業内容
- 置換方針（削除対象/残存禁止/移行方法）を決める。
- 影響範囲に合わせた実装順序を確定する。
- リスク（監査・互換・設定影響）を整理する。

## 完了条件
- API-only 方針と作業順序が確定している。

## 成果物
- API-only 移行方針メモ
- 作業順序とリスク一覧
