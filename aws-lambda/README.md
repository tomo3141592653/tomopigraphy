# AWS Lambda セットアップ手順

このLambda関数は、S3へのPre-signed URLを生成してブラウザから直接画像をアップロードできるようにします。

## 1. Lambda関数の作成

### AWS Management Consoleから：

1. **Lambda コンソールを開く**
   - https://console.aws.amazon.com/lambda/

2. **関数の作成**
   - 「関数の作成」をクリック
   - 「一から作成」を選択
   - 関数名: `tomopigraphy-presigned-url`
   - ランタイム: `Node.js 18.x` 以上
   - アーキテクチャ: `x86_64`
   - 「関数の作成」をクリック

3. **コードをアップロード**
   - コードエディタに `generate-presigned-url.js` の内容をコピー
   - 「Deploy」をクリック

4. **環境変数を設定**
   - 「設定」タブ → 「環境変数」
   - 以下を追加:
     ```
     S3_BUCKET_NAME = tomopigraphy
     ALLOWED_ORIGINS = https://tomo3141592653.github.io
     ```

5. **実行ロールの権限を設定**
   - 「設定」タブ → 「アクセス権限」
   - 実行ロール名をクリック（IAMコンソールに移動）
   - 「インラインポリシーを追加」
   - JSON エディタで以下を追加:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl"
         ],
         "Resource": "arn:aws:s3:::tomopigraphy/originals/*"
       }
     ]
   }
   ```
   
   - ポリシー名: `S3PresignedUrlPolicy`
   - 「ポリシーの作成」をクリック

## 2. API Gateway の設定

1. **API Gatewayコンソールを開く**
   - https://console.aws.amazon.com/apigateway/

2. **REST APIを作成**
   - 「APIを作成」をクリック
   - 「REST API」（プライベートではない方）を選択
   - 「構築」をクリック
   - API名: `tomopigraphy-upload-api`
   - 「APIの作成」をクリック

3. **リソースとメソッドを作成**
   - 「アクション」→「リソースの作成」
   - リソース名: `upload`
   - 「リソースの作成」をクリック
   
   - `/upload` を選択した状態で「アクション」→「メソッドの作成」
   - `POST` を選択
   - 統合タイプ: `Lambda関数`
   - Lambda関数: `tomopigraphy-presigned-url`
   - 「保存」をクリック

4. **CORSを有効化**
   - `/upload` を選択
   - 「アクション」→「CORSの有効化」
   - デフォルト設定のまま「CORSを有効にして既存のCORSヘッダーを置換」をクリック

5. **APIをデプロイ**
   - 「アクション」→「APIのデプロイ」
   - デプロイされるステージ: `[新しいステージ]`
   - ステージ名: `prod`
   - 「デプロイ」をクリック

6. **APIエンドポイントURLをコピー**
   - 表示される「URLの呼び出し」をコピー
   - 例: `https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod`
   - これに `/upload` を追加したものが最終的なエンドポイント:
     `https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/upload`

## 3. テスト

以下のコマンドでテストできます:

```bash
curl -X POST https://your-api-endpoint.execute-api.ap-northeast-1.amazonaws.com/prod/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "20251108_test.jpg",
    "fileType": "image/jpeg"
  }'
```

成功すると以下のようなレスポンスが返ります:

```json
{
  "uploadUrl": "https://tomopigraphy.s3.amazonaws.com/originals/2025/11/20251108_test.jpg?...",
  "s3Key": "originals/2025/11/20251108_test.jpg",
  "expiresIn": 900
}
```

## 4. フロントエンドの設定

`docs/js/upload.js` に以下の環境変数を設定:

```javascript
const LAMBDA_ENDPOINT = 'https://your-api-endpoint.execute-api.ap-northeast-1.amazonaws.com/prod/upload';
```

## トラブルシューティング

### CORS エラーが出る場合
- API Gateway の CORS 設定を確認
- Lambda関数のヘッダー設定を確認
- ブラウザのデベロッパーツールでOriginヘッダーを確認

### 403 Forbidden エラー
- Lambda実行ロールのS3権限を確認
- バケットポリシーを確認

### タイムアウト
- Lambda関数のタイムアウト設定を確認（デフォルト3秒 → 10秒に増やす）

