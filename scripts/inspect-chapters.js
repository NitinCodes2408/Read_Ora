const fs = require('fs');
const JSZip = require('jszip');

async function inspectChapters() {
  const data = fs.readFileSync('public/books/curated_frankenstein.epub');
  const zip = await JSZip.loadAsync(data);
  const container = await zip.file('META-INF/container.xml').async('text');
  const opfPath = container.match(/full-path=["']([^"']+)["']/i)[1];
  const opf = await zip.file(opfPath).async('text');

  const spineRefs = [...opf.matchAll(/<itemref\s+[^>]*idref=["']([^"']+)["']/gi)].map((x) => x[1]);
  console.log(`spineRefs count: ${spineRefs.length}, first 3:`, spineRefs.slice(0, 3));

  const manifest = {};
  for (const m of opf.matchAll(/<item\s+[^>]*>/gi)) {
    const id = (m[0].match(/\bid=["']([^"']+)["']/i) || [])[1];
    const href = (m[0].match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (id && href) manifest[id] = href;
  }
  console.log(`manifest count: ${Object.keys(manifest).length}`);

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) : '';
  console.log('opfDir:', opfDir);

  for (let i = 0; i < spineRefs.length; i++) {
    const href = manifest[spineRefs[i]];
    const chapPath = opfDir ? `${opfDir}/${href}` : href;
    const file = zip.file(chapPath);
    console.log(`[${i + 1}] spineId: ${spineRefs[i]}, href: ${href}, chapPath: ${chapPath}, found: ${!!file}`);
    if (file) {
      const txt = await file.async('text');
      const titleMatch = txt.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) || txt.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'No title';
      console.log(`     len: ${txt.length}, title: ${title}`);
    }
  }
}

inspectChapters().catch(console.error);
