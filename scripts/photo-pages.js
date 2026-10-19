// 写真ごとの小さなページ docs/p/<id>.html を作る。中身はその写真の og:image と、/#<id> への転送だけ。
// Twitter などのカードはリンク先 HTML の og:image しか読まず、#以降も JavaScript も見ないので、
// 特定の写真を貼ったときにその写真が出るよう、写真ごとに HTML を置く。
//   node scripts/photo-pages.js        # artworks.json の全写真ぶんを作り直す
const fs = require('fs');
const path = require('path');

const SITE = 'https://tomo3141592653.github.io/tomopigraphy/';
const DIR = path.join(__dirname, '../docs/p');

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
<meta property="og:url" content="${SITE}p/${id}.html">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=../#${id}">
<script>location.replace('../#${id}');</script>
<style>body{background:#0a0a0a}</style>
</head>
<body></body>
</html>
`;
}

function writePage(a) {
    if (!a || !a.id) return null;
    fs.mkdirSync(DIR, { recursive: true });
    const file = path.join(DIR, `${a.id}.html`);
    const html = pageHtml(a);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
    return file;
}

module.exports = { writePage, pageHtml };

if (require.main === module) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/data/artworks.json'), 'utf8'));
    const list = (data.artworks || []).filter(a => a && a.id && a.original);
    list.forEach(writePage);
    console.log(`${list.length} 枚ぶんのページを ${DIR} に置いた`);
}
