# ORCAマスタ関連画面 A11y 改善計画（RUN_ID=`20251124T203000Z`, 親=`20251124T000000Z`）

対象: `/charts/*` 配下の ORCA マスタ検索・結果表示・警告/エラー表示（ORCA-05/06/08、422/429 系レスポンスを含む）。WCAG 2.1 AA を最小満たすための要件整理・ギャップ洗い出し・改善ドラフトをまとめる。

## 1. 対象範囲と適用要件
- **キーボード操作**: Tab/Shift+Tab で検索フォーム → 結果リスト → 詳細/バナーの順に移動し、Enter/Space で項目選択・押下を完結できること。結果リストの上下移動は ArrowUp/Down を許可し、Home/End で先頭/末尾へ移動できること（2.1.1, 2.1.2）。
- **フォーカス表示**: フォーカスリング非表示を禁止し、結果リスト選択行・ボタン・リンクに 3:1 以上のコントラストのアウトラインを表示（2.4.7）。
- **ロール/aria**: 検索入力は `role="searchbox"` + `aria-label`、結果リストは `role="table"`（列見出しに `scope="col"`）または `role="listbox"` + `aria-activedescendant` を採用。警告/エラーは `role="alert"`（緊急）または `aria-live="polite"`（情報）を使い、バナーに `data-run-id` を含める（1.3.1, 4.1.2）。
- **コントラスト**: テキスト/アイコン 4.5:1 以上、アイコンのみの操作には 3:1 以上のアウトラインかラベルを付与（1.4.3, 1.4.11）。警告・危険トーンは design-system の `warning/danger` パレットに統一。
- **エラー/ステータス通知**: 422/429 など業務エラーは `role="alert"` + `aria-live="assertive"` で即時読み上げし、再送/待機の手順を明示。非致命のリトライ案内は `aria-live="polite"` を用いる（3.3.1, 3.3.3）。
- **ローディング/空状態**: `aria-busy="true"` をコンテナに付与し、結果 0 件時は `role="status"` で「該当なし」を読み上げる（4.1.3）。
- **スキップリンク**: Charts 共通ヘッダー下に「ORCAマスタ検索へ移動」スキップリンクを追加し、検索開始位置へフォーカスを飛ばす（2.4.1）。
- **SR 文脈**: 複合ラベル（薬価/診療行為）では列名 + 値を `aria-label` で統合し、単価未設定時は「最低薬価未取得、保存不可」を含める（1.3.1）。

## 2. 想定ギャップと修正方針（ドラフト）

| 画面/要素 | 期待 | 現状想定 | 優先度 | 修正方針 |
| --- | --- | --- | --- | --- |
| 検索フォーム（薬剤/点数/保険） | `role=search`、各入力に `aria-label`、必須項目へ `aria-required=true` | label がプレースホルダ依存、`aria-required` 未設定 | High | 各入力に明示ラベルと `aria-required`、検索実行ボタンに `aria-label="検索（薬剤/点数/保険）"` を付与 |
| 結果リスト（薬剤/点数） | テーブル構造 + `scope="col"`、行選択は `aria-selected`、キーボード上下移動 | div ベースリストでロールなし、矢印キー移動未対応 | High | `table` or `role=listbox` へ置換、行に `tabindex=-1` `aria-selected`、上下キー/Enter ハンドラ追加 |
| 警告バナー（暫定データ/フォールバック） | `role=alert` + `aria-live=assertive`、コントラスト 4.5:1、フォーカス移動時に1回だけ読み上げ | `InlineFeedback` のみで `role` 未指定、アイコン色が 4.5:1 未満の可能性 | High | `role=alert` 付与、design-system `warning` パレットに統一、フォーカス移動時に再読上げしない guard を追加 |
| エラーメッセージ（422/429） | `role=alert`、再試行ボタンが Tab 順序に入る、待機秒数をテキスト化 | トーストのみ/ボタンが `aria-label` 未設定 | High | エラーカード化して `role=alert`、ボタンに `aria-label`、429 は「あとN秒」表示を SR friendly テキストで提供 |
| ローディング/フェッチ中 | コンテナ `aria-busy=true`、スピナーに `role=status` | busy 未設定、スピナーが装飾扱い | Medium | fetch 中に busy を付与し、スピナーに `aria-label=\"読み込み中\"` を設定 |
| フォーカス順序 | 検索フォーム→バナー→結果→詳細リンク→閉じる の順 | バナーが DOM 末尾でフォーカスが飛びがち | Medium | DOM/TabIndex を整理し、検索完了時に結果先頭へ `focus()` を移動 |
| コントラスト（バッジ/タグ） | 4.5:1 以上、hover/active も担保 | `暫定` バッジ色が淡色の可能性 | Medium | design-system の `warning-foreground` に合わせて SCSS で上書き |
| スキップリンク | ヘッダー直後で検索フォームへジャンプ | 未実装 | Medium | AppShell 共通 skiplinks に「ORCAマスタ検索」アンカーを追加し、Charts では検索フォーム ID へリンク |
| SR ラベル（最小薬価欠落） | `aria-label` に「最低薬価未取得。保存不可。」を含める | テキストのみで SR には届かない想定 | Low | 行ラベル生成時に欠落状態を aria-label へ埋め込む |

## 3. 改善計画ドラフト

### 短期（本スプリントで実装推奨）
1) フォーカスアウトラインと Tab 順序の復元: 検索→バナー→結果→詳細の順に `tabindex` を整理し、検索完了時に結果先頭へフォーカス移動。  
2) ロール/aria 付与: 検索フォームへ `role=search`、入力に `aria-label`/`aria-required`、結果リストを `table` 化（`scope="col"`、`aria-selected`、上下キー移動）、バナー/エラーカードへ `role=alert` + `aria-live`。  
3) コントラスト修正: `暫定/警告` バッジとバナーアイコンを design-system `warning` 前景色に統一し、フォーカスリングを 3:1 以上に。  
4) エラー通知: 422/429 を `role=alert` カードに統合し、リトライ/待機ボタンへ `aria-label` とカウントダウン文言を追加。  
5) ローディング/空状態: コンテナ `aria-busy` と `role=status`（空ヒット時「該当なし」）を追加。

### 中期（リファクタ案）
1) 検索結果の表構造化と仮想化: テーブル + カラムヘッダーで SR 読み上げを最適化し、列単位の並び替えショートカット（Shift+Alt+矢印）を追加。  
2) グローバル Skip リンク: AppShell 共通の skiplinks に ORCA マスタ検索アンカーを追加し、Charts 初回描画後に有効化。  
3) 監査/テレメトリ統合: `dataSourceTransition` 送出時に `aria-live` バナーと同時に `audit.logUiState` を発火し、SR 表示とログを一貫させる。  
4) レイアウト再利用: 検索フォームと結果リストの A11y プリセットを共通 Hook/コンポーネント化し、他のマスタ画面（Stamp/診療行為）にも水平展開。  
5) コントラスト自動テスト: Storybook/Playwright で `axe + lighthouse` のコントラストチェックをプリチェックとして追加。

## 4. テスト/検証チェックリスト（ドラフト）
- キーボード操作: Tab だけで検索→結果選択→閉じるまで完結するか。矢印キーで行移動でき、フォーカスが視覚的に判別できるか。  
- スクリーンリーダー: NVDA + Chrome で検索開始→結果 1 件目 → 警告バナー → 422/429 エラーの読み上げ順序が期待通りか。`aria-busy` が解除されることを確認。  
- コントラスト: WCAG 1.4.3/1.4.11 を満たすか（バナー/バッジ/フォーカスリング）。  
- エラー再試行: 429 エラーで「あと N 秒」文言が読み上げられ、カウント完了後にボタンが有効化されるか。  
- 画面幅: 1280/1600/1920px でフォーカスアウトラインとテーブルヘッダが折り返さず表示されるか。  
- RUN_ID 表示: バナーと主要ボタンの `data-run-id="20251124T203000Z"` が反映され、監査ログと一致しているか。

## 5. 参照
- `docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md`
- `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md`（監査・RUN_ID 表示要件）
- `docs/web-client/design-system/ALPHA_COMPONENTS.md`（トーン/コントラスト指針）

更新日: 2025-11-24 / 担当: Codex / RUN_ID=`20251124T203000Z`（親=`20251124T000000Z`）
