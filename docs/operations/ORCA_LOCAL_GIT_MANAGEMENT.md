# ORCA証明書ファイルのローカル管理ガイド

## 概要

ORCA証明書ファイル（`.p12`など）を**ローカルのワークツリー間で共有**しつつ、**リモートリポジトリにはプッシュしない**設定方法です。

## 設定済みの保護機能

### 1. Pre-push Hook（自動保護）

`.git/hooks/pre-push` により、以下のファイルのリモートプッシュが**自動的にブロック**されます：

- `ORCAcertification/*.p12` - PKCS#12証明書ファイル
- `ORCAcertification/*.pfx` - PKCS#12証明書ファイル（別拡張子）
- `ORCAcertification/*.key` - 秘密鍵ファイル
- `ORCAcertification/*.pem` - PEM形式証明書
- `ORCAcertification/使用目的不明：使用停止/` - 特定ディレクトリ
- `ORCAcertification/新規*.txt` - 特定のテキストファイル
- `ORCAcertification/*パスワード*.txt` - 認証情報メモ
- `ORCAcertification/*アカウント情報*.txt` - 認証情報メモ

### 2. .gitignore（デフォルト除外）

上記ファイルは `.gitignore` に登録されており、**通常の `git add` では追加されません**。

## 使用方法

### ステップ1: ORCA証明書をローカルGit管理下に追加

```bash
# -f オプションで .gitignore を無視して追加
git add -f ORCAcertification/103867__JP_u00001294_client3948.p12
git add -f ORCAcertification/使用目的不明：使用停止/

# コミット（ローカルのみ）
git commit -m "ORCA証明書をローカル管理下に追加"
```

### ステップ2: 新しいワークツリーを作成

```bash
# 通常通りワークツリーを作成
git worktree add .worktrees/feature-branch feature-branch

# 新しいワークツリーに自動的にORCAファイルがコピーされる
ls .worktrees/feature-branch/ORCAcertification/
```

### ステップ3: 誤プッシュを防ぐテスト（オプション）

```bash
# Pre-push hookの動作確認
./test-pre-push-hook.sh
```

## 安全性の確認

### プッシュ時の動作

機密ファイルを含むコミットをプッシュしようとすると：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ PUSH BLOCKED: Sensitive ORCA files detected!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following protected files were found:
  ORCAcertification/103867__JP_u00001294_client3948.p12

These files should NOT be pushed to remote.
```

**プッシュは自動的に中止されます。**

## 追加のORCAファイルを管理下に追加する

```bash
# 新しい証明書を追加
git add -f ORCAcertification/新しい証明書.p12
git commit -m "新規ORCA証明書を追加"

# すべてのワークツリーで利用可能に
```

## 注意事項

### ✅ できること
- ローカルでの証明書ファイルのGit管理
- ワークツリー間での自動共有
- ローカルコミット履歴の記録

### ❌ できないこと（意図的に防止）
- リモートリポジトリへのプッシュ
- GitHub/GitLabなど外部への漏洩

### 🔒 セキュリティ

- **Pre-push hook**は `.git/hooks/` 配下にあり、Git管理されません
- 新しくリポジトリをクローンした場合は、このhookを**再設定する必要があります**
- チーム内で共有する場合は、セットアップスクリプトに組み込むことを推奨

## トラブルシューティング

### Q: ワークツリーにORCAファイルが表示されない

```bash
# メインワークツリーで確認
git ls-files | grep ORCAcertification

# 何も表示されない場合は、まだGit管理下にない
git add -f ORCAcertification/*.p12
git commit -m "ORCA証明書を追加"
```

### Q: Pre-push hookが動作しない

```bash
# 実行権限を確認
ls -l .git/hooks/pre-push

# 権限がない場合
chmod +x .git/hooks/pre-push
```

### Q: 誤ってプッシュしてしまった場合

```bash
# 直ちにGitHub/GitLabのリポジトリ管理者に連絡
# リポジトリを非公開に設定
# 証明書を無効化・再発行

# ローカルで履歴から削除（高度な操作）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ORCAcertification/*.p12" \
  --prune-empty --tag-name-filter cat -- --all
```

## 設定ファイル

- **Pre-push hook**: `.git/hooks/pre-push`
- **.gitignore**: `.gitignore` の28-37行目
- **テストスクリプト**: `test-pre-push-hook.sh`

## 関連ドキュメント

- `ORCAcertification/README_PASSPHRASE.md` - パスフレーズ情報
- `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` - ORCA連携手順
