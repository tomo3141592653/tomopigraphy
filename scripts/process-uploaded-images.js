#!/usr/bin/env node

/**
 * GitHub Actions用の画像処理スクリプト
 * アップロードされた画像を処理して、artworks.jsonを更新する
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imagesDir = path.join(__dirname, '../docs/images');
const artworksPath = path.join(__dirname, '../docs/data/artworks.json');

// artworks.jsonを読み込む
function loadArtworks() {
    try {
        const data = fs.readFileSync(artworksPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.warn('artworks.json not found, creating new one');
        return { artworks: [], totalCount: 0, lastUpdated: null };
    }
}

// 画像のメタデータを取得
async function getImageMetadata(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        const stats = fs.statSync(imagePath);
        return {
            width: metadata.width,
            height: metadata.height,
            size: stats.size,
            format: metadata.format
        };
    } catch (error) {
        console.error(`Error reading metadata for ${imagePath}:`, error);
        return { width: 0, height: 0, size: 0, format: 'unknown' };
    }
}

// サムネイルを生成
async function generateThumbnail(imagePath, outputPath) {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        await sharp(imagePath)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toFile(outputPath);

        return true;
    } catch (error) {
        console.error(`Error generating thumbnail for ${imagePath}:`, error);
        return false;
    }
}

// 画像ディレクトリを再帰的に探索
function findImages(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findImages(filePath, fileList);
        } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// メイン処理
async function main() {
    console.log('🖼️  Processing uploaded images...');

    if (!fs.existsSync(imagesDir)) {
        console.log('No images directory found, skipping...');
        return;
    }

    const artworks = loadArtworks();
    const imageFiles = findImages(imagesDir);
    
    console.log(`Found ${imageFiles.length} images`);

    let updated = false;

    for (const imagePath of imageFiles) {
        // リポジトリ内の相対パスを取得
        const relativePath = path.relative(path.join(__dirname, '../docs'), imagePath);
        
        // 既にartworks.jsonに存在するかチェック
        const existingArtwork = artworks.artworks.find(art => {
            // パスからIDを推測してマッチング
            const pathParts = relativePath.split(path.sep);
            const filename = pathParts[pathParts.length - 1];
            return art.original && art.original.includes(filename);
        });

        if (existingArtwork) {
            console.log(`⏭️  Skipping ${relativePath} (already processed)`);
            continue;
        }

        // パスから情報を抽出
        const pathParts = relativePath.split(path.sep);
        const year = parseInt(pathParts[1]);
        const month = parseInt(pathParts[2]);
        const filename = pathParts[pathParts.length - 1];
        const id = filename.replace(/\.[^/.]+$/, '');

        console.log(`📸 Processing ${relativePath}...`);

        // メタデータを取得
        const metadata = await getImageMetadata(imagePath);

        // サムネイルを生成
        const thumbnailPath = path.join(
            path.dirname(imagePath),
            `${id}_thumb.jpg`
        );
        await generateThumbnail(imagePath, thumbnailPath);

        // アートワークエントリを作成
        const artwork = {
            id,
            title: '',
            description: '',
            date: new Date(year, month - 1, 1).toISOString().slice(0, 10),
            year,
            month,
            original: relativePath.replace(/\\/g, '/'),
            thumbnail: path.relative(
                path.join(__dirname, '../docs'),
                thumbnailPath
            ).replace(/\\/g, '/'),
            webp: relativePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp').replace(/\\/g, '/'),
            responsive: {},
            dimensions: {
                width: metadata.width,
                height: metadata.height
            },
            fileSize: metadata.size
        };

        artworks.artworks.unshift(artwork);
        updated = true;
    }

    if (updated) {
        artworks.totalCount = artworks.artworks.length;
        artworks.lastUpdated = new Date().toISOString();
        
        // artworks.jsonを保存
        const dir = path.dirname(artworksPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(artworksPath, JSON.stringify(artworks, null, 2));
        console.log(`✅ Updated artworks.json with ${artworks.totalCount} artworks`);
    } else {
        console.log('ℹ️  No new images to process');
    }
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});

