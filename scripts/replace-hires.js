#!/usr/bin/env node
// 載せている写真を、同じ写真の大きい版に差し替える（作品の id・題・日付はそのまま）。
//
//   node scripts/replace-hires.js <並べた JPEG のフォルダ> [--limit N] [--dry-run]
//
// フォルダには <作品id>.jpg を置く（向きはサイトと同じに起こし、長い辺 2560px まで縮めたもの。
// 作るのは self-driving-ai-prototype の ayumu-lab/research/tomopi-hires/stage_replace.py）。
// upload.js と同じ大きさの画像（原寸・サムネイル・WebP・640〜2560w）を作り、
// 名前に _hq を付けて新しいキーで置く。S3 の画像は1年キャッシュするので、同じキーに上書きすると
// 見る人のブラウザに古い画像が残る。元の画像は消さない。
// 目録 docs/data/artworks.json は書き換える前に docs/data/artworks.before-hires-<時刻>.json に控える。
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ARTWORKS = path.join(ROOT, 'docs/data/artworks.json');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/config.json'), 'utf8'));
const CDN = config.s3.cdnDomain.replace(/\/$/, '');
AWS.config.update({ region: 'ap-northeast-1', credentials: new AWS.SharedIniFileCredentials() });
const s3 = new AWS.S3({ region: config.s3.region });
const SIZES = [640, 768, 1024, 1280, 1536, 1920, 2560];

const args = process.argv.slice(2);
const dir = args[0];
const dry = args.includes('--dry-run');
const li = args.indexOf('--limit');
const limit = li >= 0 ? parseInt(args[li + 1]) : Infinity;

const put = (Key, Body, ContentType) => dry ? Promise.resolve() :
    s3.upload({ Bucket: config.s3.bucket, Key, Body, ContentType, CacheControl: 'max-age=31536000' }).promise();

async function main() {
    const data = JSON.parse(fs.readFileSync(ARTWORKS, 'utf8'));
    const byId = new Map(data.artworks.map(a => [a.id, a]));
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).slice(0, limit);
    const done = [];
    for (const f of files) {
        const id = f.slice(0, -4);
        const a = byId.get(id);
        if (!a) { console.log(`⚠️ 目録に無い: ${id}`); continue; }
        if (a.hires) { console.log(`⏭️ 差し替え済み: ${id}`); continue; }
        const m = a.original.match(/\/originals\/(\d{4}\/\d{2})\//);
        if (!m) { console.log(`⚠️ 置き場が読めない: ${id} ${a.original}`); continue; }
        const base = m[1];
        const buf = fs.readFileSync(path.join(dir, f));
        const img = sharp(buf);
        const meta = await img.metadata();
        const { data: px } = await sharp(buf).resize(1, 1).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const k = {
            original: `originals/${base}/${id}_hq.jpg`,
            thumbnail: `thumbnails/${base}/${id}_hq_thumb.jpg`,
            webp: `webp/${base}/${id}_hq.webp`,
        };
        await put(k.original, buf, 'image/jpeg');
        await put(k.thumbnail, await img.clone().resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: config.image.jpegQuality }).toBuffer(), 'image/jpeg');
        await put(k.webp, await img.clone().webp({ quality: config.image.webpQuality }).toBuffer(), 'image/webp');
        const responsive = {};
        for (const size of SIZES) {
            if (size > meta.width) continue;
            const key = `responsive/${base}/${id}_hq_${size}w.jpg`;
            await put(key, await img.clone().resize(size, null, { fit: 'inside', withoutEnlargement: true, fastShrinkOnLoad: false })
                .jpeg({ quality: config.image.jpegQuality }).toBuffer(), 'image/jpeg');
            responsive[size] = `${CDN}/${key}`;
        }
        const before = `${(a.dimensions || {}).width}x${(a.dimensions || {}).height}`;
        Object.assign(a, {
            original: `${CDN}/${k.original}`, thumbnail: `${CDN}/${k.thumbnail}`, webp: `${CDN}/${k.webp}`, responsive,
            dimensions: { width: meta.width, height: meta.height },
            color: '#' + [...px].map(v => v.toString(16).padStart(2, '0')).join(''),
            fileSize: buf.length, hires: new Date().toISOString().slice(0, 10),
        });
        done.push(id);
        console.log(`✅ ${done.length}/${files.length} ${id}: ${before} → ${meta.width}x${meta.height}`);
    }
    if (dry) { console.log(`試し: ${done.length} 枚（S3・目録は触っていない）`); return; }
    if (!done.length) { console.log('差し替えるものが無い'); return; }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(ARTWORKS, path.join(ROOT, `docs/data/artworks.before-hires-${stamp}.json`));
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ARTWORKS + '.tmp', JSON.stringify(data, null, 2));
    fs.renameSync(ARTWORKS + '.tmp', ARTWORKS);
    await require('./publish').publish({ pages: done });
    console.log(`🎉 ${done.length} 枚を差し替えた`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
