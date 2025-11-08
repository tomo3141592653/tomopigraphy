const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// 環境変数
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['https://tomo3141592653.github.io'];

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS用のヘッダー
  const origin = event.headers?.origin || event.headers?.Origin;
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONSリクエスト（CORS preflight）
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // リクエストボディをパース
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileType } = body;

    // バリデーション
    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'fileName and fileType are required',
          received: { fileName, fileType }
        })
      };
    }

    // ファイル名から日付とIDを抽出（例: 20251108_DSC03318.jpg）
    const dateMatch = fileName.match(/^(\d{4})(\d{2})(\d{2})_/);
    let s3Key;
    
    if (dateMatch) {
      const [, year, month] = dateMatch;
      s3Key = `originals/${year}/${month}/${fileName}`;
    } else {
      // 日付がない場合は現在日時を使用
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      s3Key = `originals/${year}/${month}/${fileName}`;
    }

    // Pre-signed URLを生成（15分有効）
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Expires: 900, // 15分
      ACL: 'public-read' // 公開読み取り可能
    });

    console.log('Generated pre-signed URL for:', s3Key);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        s3Key: s3Key,
        expiresIn: 900
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

