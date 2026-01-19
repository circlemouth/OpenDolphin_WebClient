# 20 認証と runId のタブ共有（RUN_ID=20260119T141139Z）

## 実装サマリ
- 認証セッションと AuthService フラグ（runId / cacheHit / missingMaster / dataSourceTransition / fallbackUsed）を localStorage に永続化し、`BroadcastChannel('opendolphin:web-client:auth')` で全タブへ同期する仕組みを追加。
- 新規タブは起動直後に `restoreSharedAuthToSessionStorage` を実行し、shared storage から `sessionStorage`（`opendolphin:web-client:auth` / `opendolphin:web-client:auth-flags`）を再構成した上で `AuthServiceProvider` に初期反映。
- `applyObservabilityHeaders` は最新共有 runId を shared storage から解決し、ヘッダーへ反映するよう更新。

## 共有ストレージ
- shared session key: `opendolphin:web-client:auth:shared-session:v1`
- shared flags key: `opendolphin:web-client:auth:shared-flags:v1`
- TTL: 12h（既存 AuthService フラグ TTL と同一）

## BroadcastChannel メッセージ（version=1）
`channel = new BroadcastChannel('opendolphin:web-client:auth')`

| type | payload |
| ---- | ------- |
| `session:update` | `{ version:1, type:'session:update', origin, envelope:{ version:1, sessionKey, updatedAt, payload:{ facilityId, userId, displayName?, commonName?, role?, roles?, clientUuid?, runId } } }` |
| `session:clear` | `{ version:1, type:'session:clear', origin }` |
| `flags:update` | `{ version:1, type:'flags:update', origin, envelope:{ version:1, sessionKey, updatedAt, payload:{ runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed } } }` |
| `flags:clear` | `{ version:1, type:'flags:clear', origin }` |

- `sessionKey` は `facilityId:userId`。`origin` はタブ生成時に採番したローカル ID。
- storage fallback: BroadcastChannel が使えない場合でも `storage` イベントで同一ペイロードを読み取り同期する。

## 復元／反映フロー
1. 画面初期化時に `restoreSharedAuthToSessionStorage()` を呼び、sessionStorage が空の場合のみ shared storage の内容を復元。
2. `AuthServiceProvider` は shared flags のブロードキャストを購読し、runId などの更新を即座に state と Observability メタへ反映（無限ループ防止のため受信側は再ブロードキャストしない）。
3. ログイン・ログアウトや runId 更新時は shared storage に書き戻し + BroadcastChannel へ送信し、他タブのセッション/ヘッダーも追随。

## ハードニング追加仕様（RUN_ID=20260119T142900Z）
- `flags:clear` 受信時は runId もデフォルト値へ戻し、Observability メタからも旧 runId を消去する（API ヘッダーに残らないようにする）。
- sessionStorage に残存する auth-flags が現在の runId と異なる場合（同一 sessionKey でも）には破棄して再初期化し、旧 runId を採用しない。
- shared flags 受信時は `updatedAt` を比較し、より新しい更新のみ採用（古い runId のブロードキャストを無視）。
- テスト追加:
  - flags:clear ブロードキャスト後に applyObservabilityHeaders の runId が旧値から切り替わること。
  - runId 不一致の auth-flags が残っていても新しい runId で初期化されること。
