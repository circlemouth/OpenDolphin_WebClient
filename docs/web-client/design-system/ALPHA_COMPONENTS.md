# デザインシステム α 版 コンポーネントガイド (更新: 2025-11-04)

フェーズ1で整備した共通 UI コンポーネントと Storybook 運用方法をまとめる。フェーズ2以降の画面実装・アクセシビリティ検証の基礎資料とし、変更時は本ファイルと Storybook ドキュメントを同時に更新する。

## Storybook 運用
- コマンド: `npm run storybook`
  - `http://localhost:6006/` にてデザインシステム α 版を参照可能。
  - CI では `npm run build-storybook` により静的ビルドが生成される。
- Storybook 構成
  - Vite Builder (`@storybook/react-vite`) + React 18 + Emotion テーマ。
  - Decorator で `ThemeProvider` と `GlobalStyle` を適用し、アプリ本体と同一の配色・タイポグラフィを再現。
  - `Design System/*` 階層にコンポーネント Story を配置。各 Story はアクセシビリティ属性、相互作用パターンのサンプルを含む。

## 実装済みコンポーネント
| コンポーネント | 用途 | 主な props | 備考 |
| --- | --- | --- | --- |
| `Button` | 主要/副次アクション | `variant` (`primary`/`secondary`/`ghost`/`danger`), `size`, `isLoading`, `as="a"` | Anchor レンダリング対応。ローディング表示、左/右アイコンをサポート。 |
| `TextField` | フォーム入力 | `label`, `description`, `errorMessage`, `leftAdornment` など | `ControlledTextField` で React Hook Form に統合可能。必須表示や aria 属性を内包。 |
| `SelectField` | セレクト入力 | `label`, `options`, `description`, `errorMessage` | TextField と同一スタイルの `<select>` を提供。請求モードやテンプレート選択で利用。 |
| `SurfaceCard` | 情報カード/サマリー | `tone` (`default`/`muted`/`elevated`), `padding` | 3 カラムレイアウトのサイドバー/メインセクションで再利用。 |
| `StatusBadge` | ステータス表示 | `tone` (`info`/`success`/`warning`/`danger`/`neutral`) | 診療状態や環境バージョンのバッジ表示に利用。 |
| `Stack` | 水平/垂直の余白制御 | `direction`, `gap`, `align`, `justify`, `wrap` | レイアウトユーティリティ。 |
| `ControlledTextField` | RHF 向けラッパー | `control`, `name`, `rules` | バリデーションメッセージを TextField に引き渡す。 |

## 今後の拡張 TODO
- [ ] `Callout`/`InlineNotification` コンポーネントでアラート UI を共通化。
- [ ] `Table`/`DataList` の設計に着手し、患者一覧/カルテ履歴で再利用可能な API を提供。
- [ ] `Button` と `SurfaceCard` のダークモード配色案を検討し、将来のアクセシビリティ要件に備える。

更新履歴
- 2026-03-06: `SelectField` を追加し、請求モードや文書テンプレート選択に利用。 (担当: Agent)
- 2025-11-04: 初版公開。Storybook セットアップと基礎コンポーネントを登録。 (担当: Agent)
