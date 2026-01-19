# Webクライアント画面遷移レビュー（2026-01-19, RUN_ID=20260119T124836Z）

本ページはモダナイズ版 Web クライアントの「ナビゲーション・セッション共有・多タブ利用」まわりをすぐ直すための着手ガイドです。前版（RUN_ID=20260119T123551Z）の指摘を整理し、後続ワーカーが迷わず実装できるよう再構成しています。

## TL;DR（いま着手する順番）
1. **403 で強制ログアウトしないようにする**  
   `httpClient.ts` の失効判定から 403 を除外し、必要時のみ opt-in でログアウトさせる。UI はバナー表示で吸収。
2. **ログイン成功時は即リダイレクト**  
   `handleLoginSuccess` で `state.from` or `/f/{facilityId}/reception` へ `Navigate` する。`LoginSwitchNotice` は「明示的に戻った場合のみ」表示条件にする。
3. **セッション共有とストレージ掃除を整備**  
   - 認証 + runId + authFlags を `localStorage` + `BroadcastChannel` で同期、起動時に復元。  
   - ログアウト時に `facilityId:userId` スコープの session/localStorage をまとめて削除し、既存キーはスコープ付きへ移行。
4. **サブパス配信を安全にする**  
   `BrowserRouter basename` と Vite `base` を `VITE_BASE_PATH`（デフォルト `/`）で統一。`buildFacilityPath` との二重スラッシュ回帰をテスト。
5. **ナビゲーションのロールガード**  
   `NAV_LINKS` に `roles: ['system_admin']` を付けるなど、Administration/Debug の誤踏を防止。

## 対象と方法
- 対象: `web-client/src` のルーティング・ログイン・画面間遷移実装。
- 参照ファイル: `AppRouter.tsx` / `LoginScreen.tsx` / `libs/http/httpClient.ts` / `features/reception/pages/ReceptionPage.tsx` / `features/charts/pages/ChartsPage.tsx` / `features/patients/PatientsPage.tsx` ほか。
- 方法: 静的コードレビュー（2026-01-19）。

## 現状サマリ（実装の骨子）
- ルーティング: `BrowserRouter` + `/f/:facilityId/*`。旧 URL は `LEGACY_ROUTES` で施設付きにリダイレクト。
- 認証保持: `sessionStorage['opendolphin:web-client:auth']` を読込・保存。`AppRouter` 初期化時に復元。
- セッション失効: `httpFetch` が 401/403/419/440 で `notifySessionExpired` を発火、`AppRouter` が受信するとログアウト。
- 画面遷移: Reception→Charts は `buildChartsUrl`（患者/受付ID/runId を引き継ぎ）。Charts→Patients・印刷プレビューも URL または `location.state` を利用。
- 画面状態保存: encounter コンテキスト / returnTo / SOAP 履歴などを複数の `sessionStorage` キーに保存（例: `opendolphin:web-client:charts:encounter-context:v1`、`opendolphin:web-client:patients:returnTo:v1`、`opendolphin:web-client:soap-history`）。

## 主要課題と具体的な直し方
- **Critical: 新規タブで即ログアウト・再ログイン要求**  
  - 原因: 認証を sessionStorage のみで保持。別タブは空のため `/login` へ飛ぶ。  
  - 対応: 認証スナップショットを `localStorage` + `BroadcastChannel` で共有し、タブ初期化時に sessionStorage を再構成。暫定で新規タブ導線に警告も可。
- **High: 403 を失効扱いにして強制ログアウト**  
  - 原因: `httpFetch` が 401/403/419/440 を一括で `notifySessionExpired`。  
  - 対応: 403 をデフォルト除外し、明示フラグがある場合のみ失効扱い。権限不足は画面バナーで通知。
- **High: ログイン後も `/login` に留まる二段階遷移**  
  - 原因: `handleLoginSuccess` がナビゲートしない。  
  - 対応: 成功時に `state.from` → それ以外は `/f/{facilityId}/reception` へ即遷移。`LoginSwitchNotice` は「戻ってきた時のみ」表示。
- **Medium: ログアウト後も旧施設/ユーザーの画面状態が残留**  
  - 原因: 認証キー以外の session/localStorage を掃除していない。  
  - 対応: ログアウトで関連キーを一括削除 or `facilityId:userId` でキーをスコープ化。Charts ロックキー（localStorage）も施設付きに再発行し、logout で削除。
- **High: runId / authFlags がタブ間で同期されず可観測性が分断**  
  - 原因: runId/flags を sessionStorage のみに保持し、Broadcast なし。  
  - 対応: 認証共有チャネルに runId と authFlags を含め、受信側で `bumpRunId` / `set*` を実行。`applyObservabilityHeaders` は「最新共有 runId」を参照。
- **Medium: セッション失効イベントがタブ間に伝わらない**  
  - 原因: `notifySessionExpired` は CustomEvent + sessionStorage のみ。  
  - 対応: BroadcastChannel or storage event で失効理由をブロードキャストし、全タブ同じメッセージでログアウト。デバウンス 5s を共有。
- **Medium: サブパス配信でリロード 404 の恐れ**  
  - 原因: `BrowserRouter` に `basename` 未設定、Vite `base` も未設定。  
  - 対応: `VITE_BASE_PATH` を `BrowserRouter basename` と Vite `base` に適用。`buildFacilityPath` との二重スラッシュ回帰テストを追加。
- **Low: Administration ナビにロールガードなし**  
  - 原因: `NAV_LINKS` roles 未指定。  
  - 対応: `roles: ['system_admin']` を付与 or ページ側で 403 を吸収。

## 実装タスクリスト（着手ガイド）
- 403 失効解除: `libs/http/httpClient.ts` の `shouldNotifySessionExpired` から 403 を除外し、必要時は `suppressSessionExpiry` ではなく専用フラグを新設して opt-in させる。
- ログイン後リダイレクト: `AppRouter.tsx` の `handleLoginSuccess` で `navigate(from ?? buildFacilityPath(...))` を実行し、`LoginSwitchNotice` 表示条件を「戻り検知時のみ」に変更。
- セッション共有: 認証・runId・authFlags を `localStorage` に格納 + `BroadcastChannel('opendolphin:web-client:auth')` で同期。受信時に sessionStorage を再構築し、`AuthServiceProvider` へ反映。
- ストレージ掃除/スコープ化: 全ストレージキー（encounter-context/returnTo/soap-history/print-preview/lock 系）に `facilityId:userId` suffix を付けるか、logout 時に対象キーを列挙して削除するユーティリティを追加。
- 失効同期: `notifySessionExpired` で BroadcastChannel 送信 + storage event フォールバック。受信側は共通ハンドラでログアウト。
- サブパス対応: `VITE_BASE_PATH` を環境変数で受け取り、Vite `base` と `BrowserRouter basename` に適用。`setup-modernized-env.sh` にデフォルト追記。`buildFacilityPath` のスラッシュ重複防止をテスト。
- ロールガード: `NAV_LINKS` に roles を設定し、アクセス拒否時はトースト + audit に記録（既存のトーストハンドラを流用）。

## 検証チェックリスト
- 403 が返る API 叩き後もログアウトされず、画面上に権限不足バナー/トーストが出ること。
- ログイン成功直後に `/reception` へ遷移し、`LoginSwitchNotice` が出ないこと（戻り時のみ出る）。
- 同一ブラウザでタブ A ログイン → タブ B で `/f/{id}/charts` を直接開いてもログイン済みで表示されること。
- タブ A で runId 更新後、タブ B の API リクエストヘッダに同 runId が乗ること。
- タブ A でセッション失効（401/419）時、タブ B も同じメッセージでログアウトされること（デバウンス共有を含む）。
- ログアウト後に `sessionStorage` / `localStorage` の facility/user スコープデータが残っていないこと（印刷プレビュー・lock キー含む）。
- `VITE_BASE_PATH=/foo/` で `npm run preview` 起動し、直接リロードしても 404 にならないこと。`/f/{id}/reception` など facility 付きパスでも確認。

## 方針（複数患者「疑似タブ」/別ユーザー同時利用）
- 同一ユーザー・同一施設の並行閲覧は「Charts 内の患者疑似タブ」で解決し、ブラウザ別タブを増やさない運用に寄せる。
- 別ユーザー同時利用はブラウザプロファイル/シークレットウィンドウで分ける運用とし、アプリ側でセッション共存を保証しない。
- 疑似タブ実装時は、タブ単位で runId / encounterContext / draft / lock を管理し、タブ閉鎖時に該当ストレージをクリーンアップ。

## 追加観察・注意
- Print/Document プレビューは `location.state` 依存だが sessionStorage フォールバックあり。キーのスコープ変更時はバージョンアップと旧キー移行を忘れないこと。
- DEV プロキシはルート配信前提なので、`VITE_BASE_PATH` 導入時は `vite preview` / `docker compose` のパス書き換え漏れに注意。

## 参考パス
- ルーティング/認証: `web-client/src/AppRouter.tsx`
- ログイン: `web-client/src/LoginScreen.tsx`
- HTTP クライアント: `web-client/src/libs/http/httpClient.ts`
- 受付→カルテ: `web-client/src/features/reception/pages/ReceptionPage.tsx`
- カルテ本体: `web-client/src/features/charts/pages/ChartsPage.tsx`
- 患者一覧: `web-client/src/features/patients/PatientsPage.tsx`
