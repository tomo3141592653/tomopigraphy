#!/usr/bin/env node
// 目録 docs/data/artworks.json（手元の正本）を S3 に置く。サイトは S3 の data/artworks.json を読む。
// git への commit / push は要らない（S3 に書いた時点でサイトに出る）。
//
//   node scripts/publish.js                 # 目録と、トップのカード画像 og/latest.jpg を更新
//   node scripts/publish.js --pages ID ...  # 加えて、その写真のページ p/<id>.html を置く
//   node scripts/publish.js --all-pages     # 加えて、全写真のページを置き直す
//
// 履歴はバケットのバージョニングで残る（古い目録に戻すときは S3 の以前のバージョンから）。
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const AWS = require('aws-sdk');
const { pageHtml } = require('./photo-pages');

const ROOT = path.join(__dirname, '..');
const ARTWORKS = path.join(ROOT, 'docs/data/artworks.json');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/config.json'), 'utf8'));
const BUCKET = config.s3.bucket;
const CDN = config.s3.cdnDomain.replace(/\/$/, '');

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    AWS.config.update({ region: process.env.AWS_REGION || 'ap-northeast-1' });
} else {
    AWS.config.update({ region: 'ap-northeast-1', credentials: new AWS.SharedIniFileCredentials() });
}
const s3 = new AWS.S3({ region: config.s3.region });

// S3 は送るときに圧縮しないので、gzip で置いて Content-Encoding を付ける（目録 1MB → 約46KB）
const put = (Key, Body, ContentType, CacheControl) =>
    s3.putObject({ Bucket: BUCKET, Key, Body: zlib.gzipSync(Body, { level: 9 }), ContentEncoding: 'gzip',
                   ContentType, CacheControl }).promise();

async function publish({ pages = [], allPages = false, log = console.log } = {}) {
    const body = fs.readFileSync(ARTWORKS, 'utf8');
    const data = JSON.parse(body);   // 壊れた JSON を上げない
    const arts = (data.artworks || []).filter(a => a && a.id && a.original);
    // 手元は読みやすい形のまま、S3 には空白を詰めて置く
    await put('data/artworks.json', JSON.stringify(data), 'application/json; charset=utf-8', 'no-cache');
    log(`✅ 目録を S3 に置いた（${arts.length} 枚）`);

    // トップページのカード画像: いちばん新しく足した写真（目録の先頭）を固定の名前に写す
    const top = arts[0];
    const r = (top && top.responsive) || {};
    const src = top && (r['1280'] || r['1024'] || top.original);
    if (src && src.startsWith(CDN + '/')) {
        await s3.copyObject({
            Bucket: BUCKET, Key: 'og/latest.jpg', CopySource: `${BUCKET}/${src.slice(CDN.length + 1)}`,
            MetadataDirective: 'REPLACE', ContentType: 'image/jpeg', CacheControl: 'max-age=300',
        }).promise();
    }

    const want = allPages ? arts : arts.filter(a => pages.includes(a.id));
    for (const a of want) {
        await put(`p/${a.id}.html`, pageHtml(a), 'text/html; charset=utf-8', 'max-age=300');
    }
    if (want.length) log(`✅ 写真のページを ${want.length} 枚ぶん S3 に置いた`);
}

module.exports = { publish, CDN };

if (require.main === module) {
    const args = process.argv.slice(2);
    const i = args.indexOf('--pages');
    const pages = i >= 0 ? args.slice(i + 1) : [];
    publish({ pages, allPages: args.includes('--all-pages') }).catch(e => {
        console.error('❌ S3 に置けなかった:', e.message);
        process.exit(1);
    });
}
