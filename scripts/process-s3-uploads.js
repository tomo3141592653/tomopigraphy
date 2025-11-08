#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const sharp = require('sharp');

// AWS S3設定
const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'ap-northeast-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : new AWS.SharedIniFileCredentials({ profile: 'default' })
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'tomopigraphy';
const ARTWORKS_JSON_PATH = path.join(__dirname, '../docs/data/artworks.json');

async function main() {
    try {
        // uploaded_files.json から情報を読み込む
        const uploadedFilesPath = path.join(process.cwd(), 'uploaded_files.json');
        
        if (!fs.existsSync(uploadedFilesPath)) {
            console.error('❌ uploaded_files.json not found');
            process.exit(1);
        }

        const uploadedFiles = JSON.parse(fs.readFileSync(uploadedFilesPath, 'utf8'));
        console.log(`📦 Processing ${uploadedFiles.length} images...`);

        // artworks.json を読み込む
        let artworksData = { artworks: [], totalCount: 0, lastUpdated: null };
        if (fs.existsSync(ARTWORKS_JSON_PATH)) {
            artworksData = JSON.parse(fs.readFileSync(ARTWORKS_JSON_PATH, 'utf8'));
        }

        // 各画像を処理
        for (const fileInfo of uploadedFiles) {
            console.log(`\n📸 Processing: ${fileInfo.fileName}`);
            await processImage(fileInfo, artworksData);
        }

        // artworks.json を保存
        artworksData.totalCount = artworksData.artworks.length;
        artworksData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(ARTWORKS_JSON_PATH, JSON.stringify(artworksData, null, 2));
        
        console.log(`\n✅ Updated artworks.json with ${artworksData.artworks.length} artworks`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function processImage(fileInfo, artworksData) {
    const { s3Key, fileName, title, description, fileSize, date } = fileInfo;

    // 一時ディレクトリを作成
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // S3からオリジナル画像をダウンロード
    console.log(`  ⬇️  Downloading from S3: ${s3Key}`);
    const tempOriginalPath = path.join(tempDir, fileName);
    
    const originalData = await s3.getObject({
        Bucket: BUCKET_NAME,
        Key: s3Key
    }).promise();
    
    fs.writeFileSync(tempOriginalPath, originalData.Body);

    // 画像情報を取得
    const imageInfo = await sharp(tempOriginalPath).metadata();
    console.log(`  📏 Dimensions: ${imageInfo.width}x${imageInfo.height}`);

    // ファイル名からIDを生成
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const id = fileNameWithoutExt;
    
    // 日付情報を抽出
    const dateMatch = fileName.match(/^(\d{4})(\d{2})(\d{2})_/);
    const year = dateMatch ? parseInt(dateMatch[1]) : new Date(date).getFullYear();
    const month = dateMatch ? parseInt(dateMatch[2]) : new Date(date).getMonth() + 1;

    // サムネイル生成
    console.log('  🖼️  Generating thumbnail...');
    const thumbnailBuffer = await sharp(tempOriginalPath)
        .resize(400, 400, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    
    const thumbnailKey = s3Key.replace('/originals/', '/thumbnails/').replace(/\.[^/.]+$/, '_thumb.jpg');
    await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    }).promise();
    console.log(`  ✅ Thumbnail uploaded: ${thumbnailKey}`);

    // WebP生成
    console.log('  🖼️  Generating WebP...');
    const webpBuffer = await sharp(tempOriginalPath)
        .webp({ quality: 85 })
        .toBuffer();
    
    const webpKey = s3Key.replace(/\.[^/.]+$/, '.webp');
    await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: webpKey,
        Body: webpBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read'
    }).promise();
    console.log(`  ✅ WebP uploaded: ${webpKey}`);

    // レスポンシブ画像生成
    console.log('  🖼️  Generating responsive images...');
    const responsive = {};
    const sizes = [640, 1024, 1920];
    
    for (const size of sizes) {
        if (imageInfo.width > size) {
            const resizedBuffer = await sharp(tempOriginalPath)
                .resize(size, null, {
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toBuffer();
            
            const resizedKey = s3Key.replace(/\.[^/.]+$/, `_${size}w.jpg`);
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: resizedKey,
                Body: resizedBuffer,
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            }).promise();
            
            responsive[`${size}w`] = getPublicUrl(resizedKey);
            console.log(`  ✅ Responsive ${size}w uploaded`);
        }
    }

    // 一時ファイルを削除
    fs.unlinkSync(tempOriginalPath);

    // artworks.json に追加
    const artwork = {
        id,
        title: title || '',
        description: description || '',
        date: date,
        year,
        month,
        original: getPublicUrl(s3Key),
        thumbnail: getPublicUrl(thumbnailKey),
        webp: getPublicUrl(webpKey),
        responsive,
        dimensions: {
            width: imageInfo.width,
            height: imageInfo.height
        },
        fileSize: fileSize
    };

    // 既存のアートワークをチェック（重複回避）
    const existingIndex = artworksData.artworks.findIndex(a => a.id === id);
    if (existingIndex >= 0) {
        artworksData.artworks[existingIndex] = artwork;
        console.log(`  ♻️  Updated existing artwork: ${id}`);
    } else {
        artworksData.artworks.unshift(artwork);
        console.log(`  ➕ Added new artwork: ${id}`);
    }
}

function getPublicUrl(s3Key) {
    // S3の公開URLを返す
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${s3Key}`;
}

// 実行
main();

