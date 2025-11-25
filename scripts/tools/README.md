# scripts/tools

## orca-artifacts-namer.js
- 目的: `artifacts/orca-connectivity/` 以下の Evidence ディレクトリ名が UTC タイムスタンプ (`YYYYMMDDThhmmssZ`) に統一されているかを自動検証し、命名揺れがある場合は推奨名を提案する。
- 事前条件: Node.js が利用可能であること。Python 実行は禁止されているため、必ず `node` コマンドで実行する。
- 使い方:
  - リポジトリルートで `node scripts/tools/orca-artifacts-namer.js` を実行すると、デフォルトで `artifacts/orca-connectivity/` を走査する。
  - 任意のパスを渡す場合は `node scripts/tools/orca-artifacts-namer.js <path/to/scan>`。
- 終了コード: 命名がすべて規約通りであれば 0。規約違反があると違反一覧と推奨名を表示して 1 を返す。実行エラー時も 1。
