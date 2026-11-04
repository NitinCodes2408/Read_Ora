const fs = require('fs');
const JSZip = require('jszip');

function resolvePath(baseDir, relativePath) {
  const stack = baseDir ? baseDir.split('/').filter(Boolean) : [];
  const parts = relativePath.split('/');

  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join('/');
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

async function runTest() {
  const data = fs.readFileSync('public/books/curated_frankenstein.epub');
  const zip = await JSZip.loadAsync(data);
  const container = await zip.file('META-INF/container.xml').async('text');
  const opfPath = container.match(/full-path=["']([^"']+)["']/i)[1];
  const opfContent = await zip.file(opfPath).async('text');

  const manifestMap = {};
  const itemRegex = /<item\s+[^>]*>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
    const itemTag = itemMatch[0];
    const idMatch = itemTag.match(/\bid=["']([^"']+)["']/i);
    const hrefMatch = itemTag.match(/\bhref=["']([^"']+)["']/i);
    const typeMatch = itemTag.match(/\bmedia-type=["']([^"']+)["']/i);

    if (idMatch && hrefMatch) {
      manifestMap[idMatch[1]] = {
        href: hrefMatch[1],
        mediaType: typeMatch ? typeMatch[1] : '',
      };
    }
  }

  const spineRefs = [];
  const itemrefRegex = /<itemref\s+[^>]*idref=["']([^"']+)["'][^>]*>/gi;
  let spineMatch;

  while ((spineMatch = itemrefRegex.exec(opfContent)) !== null) {
    spineRefs.push(spineMatch[1]);
  }

  console.log('manifestMap size:', Object.keys(manifestMap).length);
  console.log('spineRefs size:', spineRefs.length);

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) : '';
  const chapters = [];

  for (let i = 0; i < spineRefs.length; i++) {
    const itemId = spineRefs[i];
    const manifestItem = manifestMap[itemId];
    if (!manifestItem) continue;

    const chapterPath = resolvePath(opfDir, manifestItem.href);
    const chapterEntry = zip.file(chapterPath);
    if (!chapterEntry) continue;

    const html = await chapterEntry.async('text');
    let chapterTitle = '';
    const h1Match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

    if (h1Match) {
      chapterTitle = stripTags(h1Match[1]);
    } else if (titleTagMatch && stripTags(titleTagMatch[1]).length > 0) {
      chapterTitle = stripTags(titleTagMatch[1]);
    } else {
      chapterTitle = `Section ${i + 1}`;
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;

    chapters.push({
      id: itemId,
      title: chapterTitle,
      bodyLength: bodyHtml.length,
    });
  }

  console.log('Parsed chapters count:', chapters.length);
  console.log('First 5 chapters:');
  chapters.slice(0, 5).forEach((c, idx) => {
    console.log(`  [${idx + 1}] "${c.title}" (${c.bodyLength} chars)`);
  });
  console.log('Middle chapters:');
  chapters.slice(7, 12).forEach((c, idx) => {
    console.log(`  [${idx + 8}] "${c.title}" (${c.bodyLength} chars)`);
  });
}

runTest();
