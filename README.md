# tomoπgraphy - Photo Gallery / フォトギャラリー

A beautiful, modern photo gallery website with powerful upload management tools.

美しくモダンなフォトギャラリーウェブサイトと強力なアップロード管理ツール

## ✨ Features / 機能

### 🎨 Gallery Features / ギャラリー機能
- **Random Display**: Homepage shows random artwork with "next" button navigation
  - **ランダム表示**: ホームページでランダムな作品を「次へ」ボタンナビゲーションで表示
- **Latest Photos View**: Time-ordered browsing from newest to oldest (`?view=top`)
  - **最新写真表示**: 最新から古い順での時系列ブラウジング (`?view=top`)
- **Chronological Gallery**: Time-based thumbnail view with year organization (`?view=gallery`)
  - **時系列ギャラリー**: 年別に整理された時系列サムネイル表示 (`?view=gallery`)
- **URL-Based Navigation**: Direct links to specific views with browser history support
  - **URLベースナビゲーション**: 特定ビューへの直接リンクとブラウザ履歴対応
- **Drag & Drop Upload Tool**: Web-based upload interface with auto-commit
  - **ドラッグ&ドロップアップロードツール**: 自動コミット機能付きWebベースアップロードインターフェース
- **Dual View Modes**: Toggle between standard and compact thumbnail layouts
  - **2つの表示モード**: 標準とコンパクトサムネイルレイアウトの切り替え
- **Interactive Modal**: Full-screen artwork viewer with keyboard navigation
  - **インタラクティブモーダル**: キーボードナビゲーション付きフルスクリーン作品ビューア
- **Responsive Design**: Mobile-optimized for all devices
  - **レスポンシブデザイン**: 全デバイス対応のモバイル最適化

### 🚀 Technical Features / 技術的機能
- **S3 Integration**: Seamless cloud storage with AWS S3
  - **S3統合**: AWS S3とのシームレスなクラウドストレージ
- **Direct S3 Upload**: Browser → Lambda → S3 (no Git bloat!)
  - **S3直接アップロード**: ブラウザ → Lambda → S3（Gitの肥大化なし！）
- **AWS Lambda**: Pre-signed URL generation for secure uploads
  - **AWS Lambda**: セキュアなアップロード用のPre-signed URL生成
- **Automatic Optimization**: Generates thumbnails and WebP formats
  - **自動最適化**: サムネイルとWebP形式の自動生成
- **Command-Line Tools**: Simple upload scripts for batch operations
  - **コマンドラインツール**: バッチ操作用のシンプルなアップロードスクリプト
- **GitHub Pages Ready**: Static site deployment
  - **GitHub Pages対応**: 静的サイトデプロイメント
- **GitHub Actions**: Automated image processing workflow
  - **GitHub Actions**: 自動画像処理ワークフロー
- **Modern UI**: Cyberpunk-inspired design with pixel animations
  - **モダンUI**: ピクセルアニメーション付きサイバーパンク風デザイン

## 🎯 Live Demo / ライブデモ

### Gallery Views / ギャラリービュー
- **Home (Random)**: `https://tomo3141592653.github.io/tomopigraphy/`
  - **ホーム（ランダム）**: ランダムな作品を表示
- **Latest Photos**: `https://tomo3141592653.github.io/tomopigraphy/?view=top`
  - **最新写真**: 最新から古い順で写真をブラウジング
- **Gallery View**: `https://tomo3141592653.github.io/tomopigraphy/?view=gallery`
  - **ギャラリービュー**: 年月別に整理されたサムネイル表示

ライブギャラリーはこちら: `https://tomo3141592653.github.io/tomopigraphy/`

## ⚠️ **Important Notice / 重要なお知らせ**

**Before starting, you MUST create your own S3 bucket and update the configuration!**

**開始する前に、必ず自分専用のS3バケットを作成して設定を更新してください！**

This template includes placeholder values that you need to replace with your own:
- `YOUR-BUCKET-NAME` → Your unique S3 bucket name
- `Your Gallery Name` → Your gallery title
- `Your Name` → Your name

このテンプレートには、あなた自身の値に置き換える必要があるプレースホルダーが含まれています：
- `YOUR-BUCKET-NAME` → あなた独自のS3バケット名
- `Your Gallery Name` → あなたのギャラリータイトル
- `Your Name` → あなたの名前

## 📦 Quick Setup / クイックセットアップ

### Prerequisites / 前提条件
- Node.js 14.0.0+
- AWS Account (for image hosting) / AWS アカウント（画像ホスティング用）
- Git

### WSL2/Linux Environment Setup / WSL2・Linux環境でのセットアップ
```bash
# Install required build tools (if needed) / 必要なビルドツールをインストール（必要に応じて）
sudo apt-get update
sudo apt-get install -y build-essential python3 libvips-dev

```

### 1. Clone & Install / クローンとインストール
```bash
git clone https://github.com/tomo3141592653/tomopixel.git
cd tomopigraphy
npm install
```

### 2. Setup Configuration / 設定のセットアップ

#### Option A: Interactive Setup (Recommended) / 方法A: 対話式セットアップ（推奨）
```bash
npm run setup -- --bucket YOUR-BUCKET-NAME --title "My Gallery" --author "Your Name"
```

#### Option B: Manual Setup / 方法B: 手動セットアップ
```bash
# 1. Copy template / テンプレートをコピー
cp config/config_template.json config/config.json

# 2. Edit config.json manually / config.jsonを手動で編集
# Replace YOUR-BUCKET-NAME with your actual bucket name
# YOUR-BUCKET-NAMEを実際のバケット名に変更

# 3. Run basic setup / 基本セットアップを実行
npm run setup
```

**Note**: `config.json` is ignored by git for security reasons. Use `config_template.json` as reference.

**注意**: `config.json` はセキュリティ上の理由でgitで無視されます。`config_template.json` を参考にしてください。

### 3. Configure AWS / AWS設定
```bash
# Creating AWS Account / AWSアカウントの作成
# 1. Access https://aws.amazon.com/jp/ / 1. https://aws.amazon.com/jp/ にアクセス
# 2. Click "Create Account" / 2. 「アカウントを作成」をクリック
# 3. Enter email, password, account name / 3. メールアドレス、パスワード、アカウント名を入力
# 4. Enter contact information / 4. 連絡先情報を入力
# 5. Enter payment information (credit card required) / 5. 支払い情報を入力（クレジットカードが必要）
# 6. Identity verification (phone number verification) / 6. 本人確認（電話番号の確認）
# 7. Select support plan (free plan is OK) / 7. サポートプランの選択（無料プランでOK）

# Note: Create IAM User (security best practice) / 注意: IAMユーザーの作成（セキュリティのベストプラクティス）
# 1. Open "IAM" in AWS Management Console / 1. AWSマネジメントコンソールで「IAM」を開く
# 2. Select "Users" → "Create User" / 2. 「ユーザー」→「ユーザーを作成」を選択
# 3. Enter username (e.g., gallery-admin) / 3. ユーザー名を入力（例：gallery-admin）
# 4. Check "Access key - Programmatic access" / 4. 「アクセスキー - プログラムによるアクセス」にチェック
# 5. Grant necessary permissions: / 5. 必要な権限を付与：
#    - AmazonS3FullAccess
# 6. Save the created access key and secret key / 6. 作成したアクセスキーとシークレットキーを保存

# Install AWS CLI / AWS CLI をインストール
aws configure
# Enter your AWS credentials / AWS認証情報を入力

# Create S3 bucket (replace YOUR-BUCKET-NAME with your unique bucket name)
# S3バケットを作成（YOUR-BUCKET-NAMEを独自のバケット名に変更してください）
aws s3 mb s3://YOUR-BUCKET-NAME

# Note: S3 Bucket Public Access Settings / 注意: S3バケットのパブリックアクセス設定
# 1. Open S3 bucket in AWS Management Console / 1. AWSマネジメントコンソールでS3バケットを開く
# 2. Select "Permissions" tab / 2. 「アクセス許可」タブを選択
# 3. Edit "Block all public access" settings / 3. 「パブリックアクセスをすべてブロック」の設定を編集
# 4. Turn off the following settings: / 4. 以下の設定をオフにする：
#    - "Block all public access" / 「パブリックアクセスをすべてブロック」
#    - "Block new ACLs for public access" / 「パブリックアクセスをブロックする新しいACL」
#    - "Block new public bucket policies" / 「パブリックアクセスをブロックする新しいパブリックバケットポリシー」
#    - "Block public bucket policies" / 「パブリックアクセスをブロックするパブリックバケットポリシー」

# Set public read permissions (replace YOUR-BUCKET-NAME)
# パブリック読み取り権限を設定（YOUR-BUCKET-NAMEを変更してください）
aws s3api put-bucket-policy --bucket YOUR-BUCKET-NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow", 
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}'
```

### 4. Start Development / 開発開始
```bash
npm run dev
# Opens at http://localhost:8000 / http://localhost:8000 で開きます
```

## 🔧 Setup Script / セットアップスクリプト

### About setup.js / setup.js について

The `setup.js` script automates the initial setup process for tomoπgraphy Gallery.

`setup.js` は tomoπgraphy ギャラリーの初期セットアップを自動化するスクリプトです。

### Features / 機能
- **Environment Check**: Validates Node.js version (14.0.0+ required)
  - **環境チェック**: Node.js バージョンの確認（14.0.0+必須）
- **Directory Creation**: Creates necessary folder structure
  - **ディレクトリ作成**: 必要なフォルダ構造の作成
- **Data Initialization**: Sets up empty `artworks.json` file
  - **データ初期化**: 空の `artworks.json` ファイルのセットアップ
- **Configuration Check**: Validates S3 settings in config file
  - **設定確認**: 設定ファイル内のS3設定の検証
- **Dependencies Installation**: Automatically runs `npm install`
  - **依存関係インストール**: `npm install` の自動実行
- **Next Steps Guide**: Shows what to do after setup
  - **次ステップガイド**: セットアップ後の手順を表示

### Usage / 使用方法
```bash
# Run setup script / セットアップスクリプトを実行
npm run setup

# Or run directly / または直接実行
node scripts/setup.js
```

### Process Flow / 実行される処理
1. **Node.js Version Check** → Ensures Node.js 14.0.0+ / Node.js 14.0.0+ の確認
2. **Directory Creation** → Creates `docs/`, `scripts/`, `config/` folders / 必要なフォルダの作成
3. **Data Initialization** → Initializes `docs/data/artworks.json` / `artworks.json` の初期化
4. **Config Check** → Validates `config/config.json` settings / 設定ファイルの確認
5. **Dependencies Install** → Runs `npm install` automatically / `npm install` の自動実行
6. **Next Steps Display** → Shows setup completion and next actions / 次のステップの表示

### Output Example / 出力例
```
🚀 tomoπgraphy Gallery Setup Starting... / tomoπgraphy ギャラリーセットアップを開始します...

📋 Node.js Version / Node.js バージョン: v18.17.0
✅ Node.js Version OK / Node.js バージョン OK

📁 Creating directory structure... / ディレクトリ構造を作成中...
  ✅ Exists / 存在: docs/css
  ✅ Exists / 存在: docs/js
  ✅ Exists / 存在: docs/data
  📂 Created / 作成: scripts
  📂 Created / 作成: config
✅ Directory Structure OK / ディレクトリ構造 OK

🎨 Initializing artwork data... / アートワークデータを初期化中...
  📄 Created artworks.json / artworks.json を作成しました
✅ Artwork Data OK / アートワークデータ OK

⚙️  Checking configuration... / 設定ファイルをチェック中...
⚠️  Please update S3 bucket name / S3バケット名を更新してください

📦 Installing dependencies... / 依存関係をインストール中...
✅ Dependencies installed / 依存関係インストール完了

🎉 Setup Complete! / セットアップ完了!
```

## 📸 Upload Images / 画像のアップロード

### 🌐 Web-Based Uploader / Webアップローダー（推奨）

外出先からブラウザで写真をアップロードできます！S3に直接アップロードされるため、Gitリポジトリが肥大化しません。

**セットアップ手順 / Setup Steps:**

#### 1. AWS Lambda & API Gateway の設定（初回のみ）

詳細な手順は `aws-lambda/README.md` を参照してください。

**概要:**
1. Lambda関数を作成（`aws-lambda/generate-presigned-url.js`）
2. API Gatewayで REST API を作成
3. Lambda関数のIAM権限を設定（S3 PutObject）
4. API エンドポイントURLを取得

#### 2. GitHub Secretsの設定（初回のみ）

1. GitHubリポジトリページを開く
2. **Settings** → **Secrets and variables** → **Actions**
3. 以下の3つのSecretを追加：
   - `AWS_ACCESS_KEY_ID`: AWSアクセスキー
   - `AWS_SECRET_ACCESS_KEY`: AWSシークレットキー
   - `AWS_S3_BUCKET_NAME`: S3バケット名（例: `tomopigraphy`）

#### 3. GitHub Personal Access Token (PAT) を作成

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token」をクリック
3. スコープで `repo` にチェック
4. トークンをコピー（一度しか表示されません）

📖 **詳しい手順**: [PAT_SETUP.md](docs/PAT_SETUP.md) を参照

#### 4. フロントエンド設定

`docs/js/upload.js` の `lambdaEndpoint` を更新：

```javascript
this.lambdaEndpoint = 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/upload';
```

#### 5. 写真をアップロード

1. **アップロードページにアクセス**
   - サイトの `/upload.html` にアクセス

2. **トークンを設定**（初回のみ）
   - ページ上部の認証セクションにトークンを入力
   - 「トークンを保存」ボタンをクリック

3. **写真をアップロード**
   - 画像をドラッグ&ドロップまたはクリックして選択
   - タイトルと説明を入力（オプション）
   - 「アップロード開始」ボタンをクリック

4. **自動処理（バックグラウンド）**
   - ✅ Lambda経由でS3に直接アップロード（**Gitを経由しない**）
   - ✅ GitHub Actionsが自動実行（repository_dispatch）
   - ✅ サムネイル・WebP・レスポンシブ画像を自動生成
   - ✅ artworks.jsonを自動更新

**処理時間**: 約1〜3分（GitHub Actions実行時間）

**利点 / Benefits:**
- ✅ **Gitリポジトリが肥大化しない**（画像はS3のみに保存）
- ✅ **大容量ファイル対応**（S3の制限: 5TB/ファイル）
- ✅ **高速アップロード**（直接S3にアップロード）
- ✅ **セキュア**（Pre-signed URL: 15分有効）

**🔒 セキュリティに関する重要な注意 / Important Security Notes:**
- ⚠️ **トークンはブラウザのlocalStorageに保存されます**
  - 同じブラウザを使う人は誰でもアップロードできます
  - 共有PCでは使用しないでください
- ⚠️ **AWS認証情報はGitHub Secretsで安全に管理**
  - ブラウザには保存されません
  - GitHub Actionsのみがアクセス可能
- ⚠️ **トークンに有効期限を設定することを推奨します**
  - GitHubでトークン作成時に有効期限を設定できます
  - 定期的にトークンを更新してください

### 💻 Command Line Upload / コマンドラインアップロード

#### Single Image Upload / 単一画像アップロード
```bash
# Basic upload / 基本アップロード
npm run upload ./my-artwork.png

# With title / タイトル付き
npm run upload ./my-artwork.png -- --title "夕暮れの街角"

# With title and description / タイトルと説明付き
npm run upload ./my-artwork.png -- --title "夕暮れの街角" --description "美しい夕暮れの風景"

# Use file modification date instead of upload date / アップロード日の代わりにファイル変更日を使用
npm run upload ./my-artwork.png -- --use-file-date
```

#### Batch Upload / バッチアップロード
```bash
# Upload entire folder / フォルダ全体をアップロード
npm run batch-upload ./artwork-folder/

# Preview what would be uploaded (dry run) / アップロード予定をプレビュー（ドライラン）
npm run batch-upload ./artwork-folder/ --dry-run

# Use file modification dates instead of upload dates / アップロード日の代わりにファイル変更日を使用
npm run batch-upload ./artwork-folder/ --use-file-date
```

### Deploy Changes / 変更をデプロイ
```bash
npm run deploy
# Commits and pushes to GitHub / GitHubにコミット・プッシュ
```

## 🏗️ Project Structure / プロジェクト構造

```
photo_site/
├── docs/                    # Website files (GitHub Pages) / ウェブサイトファイル（GitHub Pages）
│   ├── index.html          # Main gallery page / メインギャラリーページ
│   ├── upload.html          # Web uploader page / Webアップローダーページ
│   ├── js/
│   │   ├── gallery.js      # Gallery functionality / ギャラリー機能
│   │   └── upload.js       # Web uploader functionality / Webアップローダー機能
│   └── data/
│       └── artworks.json   # Artwork metadata / 作品メタデータ
├── scripts/                # Upload tools / アップロードツール
│   ├── upload.js          # Single image uploader / 単一画像アップローダー
│   ├── batch-upload.js    # Batch uploader / バッチアップローダー
│   ├── process-uploaded-images.js  # GitHub Actions用画像処理 / Image processor for GitHub Actions
│   └── setup.js           # Initial setup / 初期セットアップ
├── .github/
│   └── workflows/
│       └── process-images.yml  # GitHub Actions workflow / GitHub Actionsワークフロー
├── config/
│   └── config.json        # Configuration / 設定
└── package.json           # Dependencies and scripts / 依存関係とスクリプト
```

### Daily Workflow / 日常のワークフロー

#### Option A: Web Upload (Recommended) / 方法A: Webアップロード（推奨）
```bash
# 1. Start upload server / 1. アップロードサーバーを起動
npm run upload-server

# 2. Drag & drop images at http://localhost:3000
# 2. http://localhost:3000 で画像をドラッグ&ドロップ
# (Auto-commits to GitHub) / (自動でGitHubにコミット)

# 3. Check live site / 3. ライブサイトを確認
# https://tomo3141592653.github.io/tomopigraphy/
```

#### Option B: Command Line / 方法B: コマンドライン
```bash
# 1. Add new artwork / 1. 新しい作品を追加
npm run upload ./new-art.jpg -- --title "New Creation"

# 2. Check locally / 2. ローカルで確認
npm run dev

# 3. Deploy to live site / 3. ライブサイトにデプロイ
npm run deploy
```

### Site Configuration / サイト設定
Update `config/config.json` / `config/config.json` を更新:
```json
{
  "site": {
    "title": "Your Gallery Name",
    "description": "Your gallery description"
  },
  "image": {
    "webpQuality": 80,
    "jpegQuality": 90
  }
}
```

## 🆕 Recent Updates / 最新のアップデート

### Version 2.0 - Enhanced Navigation & Upload Experience / バージョン2.0 - ナビゲーション＆アップロード体験の向上

#### ✨ New Features / 新機能
1. **URL-Based Navigation** / **URLベースナビゲーション**
   - Direct links to gallery views via URL parameters
   - URLパラメータによるギャラリービューへの直接リンク
   - Browser history support for seamless navigation
   - シームレスなナビゲーションのためのブラウザ履歴サポート

2. **Latest Photos View** / **最新写真ビュー**
   - Chronological browsing from newest to oldest photos
   - 最新から古い順での時系列写真ブラウジング
   - Dedicated navigation controls (Previous/Next/Latest)
   - 専用ナビゲーションコントロール（前へ/次へ/最新）
   - Keyboard shortcuts support (←/→ arrow keys)
   - キーボードショートカット対応（←/→矢印キー）

3. **Web Upload Tool** / **Webアップロードツール**
   - Drag & drop interface for easy image uploads
   - 簡単な画像アップロードのためのドラッグ&ドロップインターフェース
   - Multi-file batch upload support
   - 複数ファイルのバッチアップロード対応
   - Real-time upload progress tracking
   - リアルタイムアップロード進行状況追跡
   - Automatic git commit and push to GitHub
   - GitHubへの自動gitコミット・プッシュ
   - Cyberpunk-themed UI matching gallery design
   - ギャラリーデザインに合わせたサイバーパンクテーマUI

#### 🔗 Navigation URLs / ナビゲーションURL
```
Home (Random):     https://tomo3141592653.github.io/tomopigraphy/
Latest Photos:     https://tomo3141592653.github.io/tomopigraphy/?view=top
Gallery View:      https://tomo3141592653.github.io/tomopigraphy/?view=gallery
```

#### 🛠️ Technical Improvements / 技術的改善
- Enhanced JavaScript routing system for single-page application behavior
- シングルページアプリケーション動作のための強化されたJavaScriptルーティングシステム
- Express.js server for web upload functionality
- Webアップロード機能のためのExpress.jsサーバー
- Multer integration for secure file handling
- 安全なファイル処理のためのMulter統合
- Improved responsive image handling across all views
- 全ビューでの改善されたレスポンシブ画像処理

## 🔧 Advanced Features / 高度な機能

### Image Processing / 画像処理
- **Automatic thumbnails**: 300px max dimension
  - **自動サムネイル**: 最大300pxのサムネイル生成
- **WebP conversion**: Modern format for faster loading
  - **WebP変換**: 高速読み込み用のモダンフォーマット
- **Quality optimization**: Configurable compression
  - **品質最適化**: 設定可能な圧縮
- **Metadata preservation**: EXIF data handling
  - **メタデータ保持**: EXIFデータの処理

### AWS Cost Optimization / AWS コスト最適化
- **CDN integration**: CloudFront support ready
  - **CDN統合**: CloudFront対応準備完了
- **Intelligent tiering**: S3 storage class optimization
  - **インテリジェント階層化**: S3ストレージクラスの最適化
- **Lifecycle policies**: Automatic archiving
  - **ライフサイクルポリシー**: 自動アーカイブ

### Reset Gallery / ギャラリーリセット
```bash
# Clear all artworks (careful!) / 全作品をクリア（要注意！）
echo '{"artworks":[],"totalCount":0,"lastUpdated":null}' > docs/data/artworks.json
```

## 💰 Cost Estimation / コスト見積もり

### AWS S3 Costs (Tokyo Region) / AWS S3 コスト（東京リージョン）
- **Storage**: ~$0.025/GB/month
  - **ストレージ**: 約 $0.025/GB/月
- **Requests**: ~$0.0004/1000 PUT requests
  - **リクエスト**: 約 $0.0004/1000 PUT リクエスト
- **Data Transfer**: Free for first 1GB/month
  - **データ転送**: 最初の1GB/月は無料

**Example**: 1000 images (~5GB) = ~$1.25/month

**例**: 1000枚の画像（約5GB）= 約 $1.25/月

### GitHub Pages
- **Hosting**: Free for public repositories
  - **ホスティング**: パブリックリポジトリは無料
- **Bandwidth**: 100GB/month soft limit
  - **帯域幅**: 100GB/月のソフトリミット

## 📄 License / ライセンス

### Code License / コードライセンス
This project's source code is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

このプロジェクトのソースコードはMITライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

### Photography Copyright / 写真の著作権
All photographs, images, and artwork displayed on this gallery are protected by copyright and belong to the site owner. 

このギャラリーに表示されるすべての写真、画像、および作品は著作権により保護されており、サイト所有者に帰属します。

For more information about licensing and usage rights, please refer to the [LICENSE](LICENSE) file.

ライセンスと使用権に関する詳細情報については、[LICENSE](LICENSE)ファイルをご参照ください。
