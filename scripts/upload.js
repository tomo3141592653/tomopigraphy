#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const { program } = require('commander');
const mime = require('mime-types');

// AWS SDKの設定
// GitHub Actions環境では環境変数から、ローカルでは~/.aws/credentialsから読み込む
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // GitHub Actions環境
    AWS.config.update({
        region: process.env.AWS_REGION || 'ap-northeast-1',
        credentials: new AWS.Credentials(
            process.env.AWS_ACCESS_KEY_ID,
            process.env.AWS_SECRET_ACCESS_KEY
        )
    });
} else {
    // ローカル環境
    AWS.config.update({
        region: 'ap-northeast-1',
        credentials: new AWS.SharedIniFileCredentials()
    });
}

// Load configuration
const configPath = path.join(__dirname, '../config/config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error('❌ Error: config/config.json not found. Please run setup first.');
    process.exit(1);
}

// Initialize AWS S3
const s3 = new AWS.S3({ region: config.s3.region });

class ArtworkUploader {
    async uploadImage(imagePath, title = '', description = '', useFileDate = false) {
        try {
            // パスを正規化
            imagePath = path.normalize(imagePath);
            console.log(`📸 アップロード開始: ${imagePath}`);
            
            // Validate file exists
            if (!fs.existsSync(imagePath)) {
                throw new Error(`File not found: ${imagePath}`);
            }

            // Get file stats for date
            const stats = fs.statSync(imagePath);
            const fileDate = new Date(stats.mtime);
            const uploadDate = new Date();

            // Use file date or upload date based on option
            const dateToUse = useFileDate ? fileDate : uploadDate;
            const timestamp = dateToUse.toISOString().slice(0, 10).replace(/-/g, '');
            const rawFileName = path.basename(imagePath, path.extname(imagePath));
            // スペース、括弧、その他特殊文字をアンダースコアに置換（URL安全なファイル名に）
            const fileName = rawFileName.replace(/[\s()[\]{}'"<>|&;$#!?*]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
            const ext = path.extname(imagePath);
            const id = `${timestamp}_${fileName}`;

            if (rawFileName !== fileName) {
                console.log(`⚠️  ファイル名を正規化: "${rawFileName}" → "${fileName}"`);
            }
            
            // Read and process image
            const imageBuffer = fs.readFileSync(imagePath);
            const image = sharp(imageBuffer);
            const metadata = await image.metadata();
            
            console.log(`📐 画像サイズ: ${metadata.width}x${metadata.height}`);
            
            // Generate S3 paths using the selected date
            const year = dateToUse.getFullYear();
            const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
            const basePath = `${year}/${month}`;
            
            // レスポンシブ画像のサイズ定義
            const responsiveSizes = [640, 768, 1024, 1280, 1536, 1920, 2560];
            
            const paths = {
                original: `originals/${basePath}/${id}${ext}`,
                thumbnail: `thumbnails/${basePath}/${id}_thumb.jpg`,
                webp: `webp/${basePath}/${id}.webp`,
                responsive: {}
            };
            
            // レスポンシブ画像のパス生成
            responsiveSizes.forEach(size => {
                paths.responsive[size] = `responsive/${basePath}/${id}_${size}w.jpg`;
            });
            
            // Upload original image
            await this.uploadToS3(imageBuffer, paths.original, mime.lookup(ext) || 'application/octet-stream');
            console.log(`✅ オリジナル画像アップロード完了`);
            
            // Generate and upload thumbnail
            const thumbnailBuffer = await image
                .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: config.image.jpegQuality })
                .toBuffer();
            
            await this.uploadToS3(thumbnailBuffer, paths.thumbnail, 'image/jpeg');
            console.log(`✅ サムネイル生成・アップロード完了`);
            
            // Generate and upload WebP
            const webpBuffer = await image
                .webp({ quality: config.image.webpQuality })
                .toBuffer();
            
            await this.uploadToS3(webpBuffer, paths.webp, 'image/webp');
            console.log(`✅ WebP変換・アップロード完了`);
            
            // Generate and upload responsive images
            const responsiveUrls = {};
            for (const size of responsiveSizes) {
                // 元画像のサイズより大きい場合はスキップ
                if (size > metadata.width) {
                    console.log(`⏭️  ${size}w: 元画像より大きいためスキップ`);
                    continue;
                }
                
                const responsiveBuffer = await image
                    .resize(size, null, { 
                        fit: 'inside', 
                        withoutEnlargement: true,
                        fastShrinkOnLoad: false 
                    })
                    .jpeg({ quality: config.image.jpegQuality })
                    .toBuffer();
                
                await this.uploadToS3(responsiveBuffer, paths.responsive[size], 'image/jpeg');
                responsiveUrls[size] = `${config.s3.cdnDomain}/${paths.responsive[size]}`;
                console.log(`✅ ${size}w画像生成・アップロード完了`);
            }
            
            // Create artwork metadata
            const artwork = {
                id,
                title: title || '',
                description,
                date: dateToUse.toISOString().slice(0, 10),
                year,
                month: parseInt(month),
                original: `${config.s3.cdnDomain}/${paths.original}`,
                thumbnail: `${config.s3.cdnDomain}/${paths.thumbnail}`,
                webp: `${config.s3.cdnDomain}/${paths.webp}`,
                responsive: responsiveUrls,
                dimensions: { width: metadata.width, height: metadata.height },
                fileSize: imageBuffer.length
            };
            
            // Update metadata file
            await this.updateMetadata(artwork);
            console.log(`✅ メタデータ更新完了`);
            
            console.log(`🎉 アップロード完了: ${id}`);
            console.log(`🔗 URL: ${artwork.original}`);
            
            return artwork;
            
        } catch (error) {
            console.error(`❌ エラー:`, error.message);
            throw error;
        }
    }
    
    async uploadToS3(buffer, key, contentType) {
        const params = {
            Bucket: config.s3.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'max-age=31536000' // 1年間キャッシュ
        };
        
        return s3.upload(params).promise();
    }
    
    async updateMetadata(artwork) {
        const metadataPath = path.join(__dirname, '../docs/data/artworks.json');
        let metadata;
        
        try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch {
            metadata = { artworks: [], totalCount: 0, lastUpdated: null };
        }
        
        // Add new artwork at the beginning
        metadata.artworks.unshift(artwork);
        metadata.totalCount = metadata.artworks.length;
        metadata.lastUpdated = new Date().toISOString();
        
        // Ensure directory exists
        const dir = path.dirname(metadataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
}

// Command line interface
program
    .name('upload')
    .description('Upload artwork to the pixel gallery')
    .argument('<image>', 'Path to the image file to upload')
    .option('-t, --title <title>', 'Artwork title')
    .option('-d, --description <description>', 'Artwork description')
    .option('-f, --use-file-date', 'Use file modification date instead of upload date')
    .action(async (imagePath, options) => {
        try {
            const uploader = new ArtworkUploader();
            await uploader.uploadImage(imagePath, options.title, options.description, options.useFileDate);
        } catch (error) {
            console.error('Upload failed:', error.message);
            process.exit(1);
        }
    });

// Add version info
program.version('1.0.0');

// Parse command line arguments
program.parse();