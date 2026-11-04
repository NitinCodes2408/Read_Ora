const fs = require('fs');
let code = fs.readFileSync('src/data/curatedClassics.ts', 'utf8');

// Replace .epub3.images with canonical /cache/epub/{id}/pg{id}.epub
code = code.replace(/downloadUrl:\s*'https:\/\/www\.gutenberg\.org\/ebooks\/(\d+)\.epub3\.images'/g, (m, id) => {
  return `downloadUrl: 'https://www.gutenberg.org/cache/epub/${id}/pg${id}.epub'`;
});

// Replace Indian heritage books' placeholder Gutenberg 132 url with their own local/public EPUB
code = code.replace(/id:\s*'curated_godan'[\s\S]*?downloadUrl:\s*'[^']+'/m, (m) => m.replace(/downloadUrl:\s*'[^']+'/, "downloadUrl: '/books/curated_godan.epub'"));
code = code.replace(/id:\s*'curated_shyamchi_aai'[\s\S]*?downloadUrl:\s*'[^']+'/m, (m) => m.replace(/downloadUrl:\s*'[^']+'/, "downloadUrl: '/books/curated_shyamchi_aai.epub'"));
code = code.replace(/id:\s*'curated_tukaram_abhang'[\s\S]*?downloadUrl:\s*'[^']+'/m, (m) => m.replace(/downloadUrl:\s*'[^']+'/, "downloadUrl: '/books/curated_tukaram_abhang.epub'"));
code = code.replace(/id:\s*'curated_chanakya_neeti'[\s\S]*?downloadUrl:\s*'[^']+'/m, (m) => m.replace(/downloadUrl:\s*'[^']+'/, "downloadUrl: '/books/curated_chanakya_neeti.epub'"));
code = code.replace(/id:\s*'curated_madhushala'[\s\S]*?downloadUrl:\s*'[^']+'/m, (m) => m.replace(/downloadUrl:\s*'[^']+'/, "downloadUrl: '/books/curated_madhushala.epub'"));

fs.writeFileSync('src/data/curatedClassics.ts', code);
console.log('curatedClassics.ts updated successfully!');
