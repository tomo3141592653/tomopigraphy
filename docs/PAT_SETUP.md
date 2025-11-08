# GitHub Personal Access Token (PAT) の作成方法

## 📝 ステップバイステップガイド

### 🚀 **最も簡単な方法: 直接URLにアクセス**

GitHubにログインした状態で、以下のURLに直接アクセスしてください：

**Classic Token (推奨):**
```
https://github.com/settings/tokens/new
```

**または、Fine-grained Token (より安全):**
```
https://github.com/settings/personal-access-tokens/new
```

このURLから直接トークン作成ページに飛べます！→ **ステップ6**へ

---

### 📋 **手動で見つける方法**

#### 方法1: Developer settingsから（従来の方法）

1. **GitHubにログイン**
   - https://github.com/ にアクセス

2. **Settings（設定）にアクセス**
   - 右上のプロフィール画像をクリック
   - 「Settings」を選択

3. **Developer settings（開発者設定）を開く**
   - 左サイドバーを**一番下までスクロール**
   - 「Developer settings」をクリック
   - ⚠️ 見つからない場合は下記の「方法2」を試してください

4. **Personal access tokens（個人アクセストークン）を選択**
   - 「Personal access tokens」をクリック
   - 「Tokens (classic)」を選択

5. **新しいトークンを生成**
   - 「Generate new token」ボタンをクリック
   - 「Generate new token (classic)」を選択

#### 方法2: Developer settingsが見つからない場合

GitHubのUIが変更されている場合、以下を試してください：

**A. 直接URLでアクセス（最も確実）**
```
https://github.com/settings/tokens
```
ブラウザでこのURLを開くと、トークン管理ページに直接アクセスできます。

**B. 別のルートから探す**
1. Settings → 左サイドバーの「Access」セクションを探す
2. 「Personal access tokens」が「Access」セクション内にある場合があります

**C. プロフィールメニューから直接**
1. 右上のプロフィール画像をクリック
2. メニューに「Personal access tokens」が表示される場合があります（UIによって異なる）

### 6. トークンの設定（重要）
- **Note（メモ）**: トークンの用途を記入（例: "Photo Gallery Uploader"）
- **Expiration（有効期限）**: 
  - セキュリティのため、期限を設定することを推奨
  - 「No expiration」も選択可能ですが、セキュリティリスクが高くなります
- **Select scopes（スコープの選択）**: 
  - ✅ **`repo`** にチェック（これが必須です）
    - これにより、リポジトリへの読み書きが可能になります
    - より細かく設定する場合は、`repo` の下のサブオプションを確認してください

### 7. トークンを生成
- ページ下部の「Generate token」ボタンをクリック

### 8. トークンをコピー
⚠️ **重要**: トークンは一度しか表示されません！
- 生成されたトークン（`ghp_` で始まる文字列）をコピー
- 安全な場所に保存してください
- このページを離れると、もう一度トークンを確認することはできません

### 9. トークンを使用
- アップロードページ（`/upload.html`）にアクセス
- 認証セクションにトークンを貼り付け
- 「トークンを保存」をクリック

## 🔒 セキュリティに関する重要な注意事項

### ⚠️ 現在の実装のセキュリティリスク

**現在の実装では、以下のセキュリティリスクがあります：**

1. **トークンがブラウザに保存される**
   - トークンはブラウザのlocalStorageに保存されます
   - 同じブラウザを使う人は誰でもアップロードできます
   - トークンが漏洩すると、誰でもリポジトリにコミットできます

2. **公開リポジトリの場合**
   - リポジトリが公開されている場合、誰でもコードを見ることができます
   - ただし、トークンを知らない限り、アップロードはできません

3. **推奨される対策**
   - ✅ トークンに有効期限を設定する
   - ✅ 定期的にトークンを更新する
   - ✅ 不要になったトークンは削除する
   - ✅ プライベートブラウザモードを使用する場合は注意（トークンが保存されない）
   - ✅ 共有PCでは使用しない

### 🛡️ より安全な方法（推奨）

#### 方法1: GitHub Actionsを使った承認プロセス
- Pull Requestを作成し、承認後にマージする方式
- より安全ですが、手動での承認が必要

#### 方法2: サーバーサイドでの認証
- トークンをサーバー側で管理
- 追加の認証（パスワードなど）を実装
- より安全ですが、サーバーが必要

#### 方法3: Fine-grained tokens（細かい権限設定）
- 新しいFine-grained tokensを使用
- 特定のリポジトリのみにアクセス権限を付与
- より細かい権限制御が可能

## 🔧 トークンの管理

### トークンを削除する場合
1. GitHub → Settings → Developer settings → Personal access tokens
2. 削除したいトークンの横の「Delete」をクリック

### トークンを更新する場合
1. 古いトークンを削除
2. 新しいトークンを生成
3. アップロードページで新しいトークンを設定

## 📚 参考リンク
- [GitHub公式ドキュメント: Personal Access Tokens](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Fine-grained tokensについて](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

