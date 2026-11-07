// 写真ごとの小さなページ p/<id>.html（S3 に置く。scripts/publish.js）の中身を作る。中身はその写真の og:image と、/#<id> への転送だけ。
// Twitter などのカードはリンク先 HTML の og:image しか読まず、#以降も JavaScript も見ないので、
// 特定の写真を貼ったときにその写真が出るよう、写真ごとに HTML を置く。
// 全写真ぶんを置き直すときは node scripts/publish.js --all-pages
// 2026-11-07 より前に共有したリンク（github.io の p/<id>.html）は docs/p/ に残してある。
const fs = require('fs');
const path = require('path');

const SITE = 'https://tomo3141592653.github.io/tomopigraphy/';
const CDN = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8')).s3.cdnDomain.replace(/\/$/, '');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function pageHtml(a) {
    const r = a.responsive || {};
    const img = r['1280'] || r['1024'] || a.original;
    const id = encodeURIComponent(a.id);
    const title = a.title && !/^(IMG|DSC|tumblr|\d{4}-)/.test(a.title) ? `${a.title} — tomoπgraphy` : 'tomoπgraphy';
    const desc = a.description;   // date は撮影日でなく投稿日なので出さない
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc || 'Photographs by Tomoyoshi Hirata.')}">
<meta property="og:type" content="article">
<meta property="og:url" content="${CDN}/p/${id}.html">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${SITE}#${id}">
<script>location.replace('${SITE}#${id}');</script>
<style>body{background:#0a0a0a}</style>
</head>
<body></body>
</html>
`;
}

module.exports = { pageHtml };
