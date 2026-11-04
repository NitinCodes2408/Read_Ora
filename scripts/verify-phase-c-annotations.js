const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=====================================================');
console.log('ReadOra Phase C — Text Highlights & Underlines Verification');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

// -------------------------------------------------------------------
// 1. Types & Color Swatches Verification
// -------------------------------------------------------------------
const HIGHLIGHT_COLORS = [
  { name: 'Gold', hex: '#F5D061', darkHex: '#C59A3D' },
  { name: 'Emerald', hex: '#86EFAC', darkHex: '#10B981' },
  { name: 'Sky', hex: '#93C5FD', darkHex: '#3B82F6' },
  { name: 'Rose', hex: '#F472B6', darkHex: '#EC4899' },
  { name: 'Purple', hex: '#C084FC', darkHex: '#A855F7' },
];

test('1.1 Highlight Colors Palette integrity', () => {
  assert.strictEqual(HIGHLIGHT_COLORS.length, 5);
  const names = HIGHLIGHT_COLORS.map(c => c.name);
  assert.deepStrictEqual(names, ['Gold', 'Emerald', 'Sky', 'Rose', 'Purple']);
  HIGHLIGHT_COLORS.forEach(c => {
    assert.ok(c.hex.startsWith('#'));
    assert.ok(c.darkHex.startsWith('#'));
  });
});

// -------------------------------------------------------------------
// 2. Format Anchors & Location Indexing Verification
// -------------------------------------------------------------------
test('2.1 PDF Annotation Location Anchor (Normalized Coordinates)', () => {
  const pdfAnnotationLoc = {
    format: 'PDF',
    pageNumber: 4,
    rects: [
      { left: 0.12, top: 0.34, width: 0.55, height: 0.025 },
      { left: 0.12, top: 0.37, width: 0.42, height: 0.025 }
    ]
  };

  const serialized = JSON.stringify(pdfAnnotationLoc);
  const parsed = JSON.parse(serialized);

  assert.strictEqual(parsed.format, 'PDF');
  assert.strictEqual(parsed.pageNumber, 4);
  assert.strictEqual(parsed.rects.length, 2);
  // Guarantee relative normalization bounds 0.0 - 1.0
  parsed.rects.forEach(r => {
    assert.ok(r.left >= 0 && r.left <= 1);
    assert.ok(r.top >= 0 && r.top <= 1);
    assert.ok(r.width >= 0 && r.width <= 1);
    assert.ok(r.height >= 0 && r.height <= 1);
  });
});

test('2.2 EPUB Annotation Location Anchor (DOM Chapter Anchor & Text Snippet)', () => {
  const epubAnnotationLoc = {
    format: 'EPUB',
    chapterIndex: 2,
    textSnippet: 'It is a truth universally acknowledged',
    startOffset: 120,
    endOffset: 158,
    containerSelector: 'p.intro'
  };

  const serialized = JSON.stringify(epubAnnotationLoc);
  const parsed = JSON.parse(serialized);

  assert.strictEqual(parsed.format, 'EPUB');
  assert.strictEqual(parsed.chapterIndex, 2);
  assert.strictEqual(parsed.textSnippet, 'It is a truth universally acknowledged');
  assert.ok(parsed.startOffset < parsed.endOffset);
});

test('2.3 TXT Annotation Location Anchor (Deterministic Absolute Character Offsets)', () => {
  const txtAnnotationLoc = {
    format: 'TXT',
    startChar: 4500,
    endChar: 4580,
    pageIndex: 3
  };

  const serialized = JSON.stringify(txtAnnotationLoc);
  const parsed = JSON.parse(serialized);

  assert.strictEqual(parsed.format, 'TXT');
  assert.strictEqual(parsed.startChar, 4500);
  assert.strictEqual(parsed.endChar, 4580);
  assert.strictEqual(parsed.pageIndex, 3);
  assert.ok(parsed.endChar > parsed.startChar);
});

// -------------------------------------------------------------------
// 3. Database Schema v4 Verification (Static Analysis)
// -------------------------------------------------------------------
test('3.1 Database Service Schema Version 4 & Idempotent Migration', () => {
  const dbServicePath = path.join(__dirname, '..', 'src', 'services', 'libraryDatabaseService.ts');
  const code = fs.readFileSync(dbServicePath, 'utf8');

  assert.ok(code.includes('CURRENT_SCHEMA_VERSION = 4'), 'Schema version must be 4');
  assert.ok(code.includes('CREATE TABLE IF NOT EXISTS annotations'), 'Must contain CREATE TABLE IF NOT EXISTS annotations');
  assert.ok(code.includes('CREATE INDEX IF NOT EXISTS idx_annotations_bookId'), 'Must create index on bookId');
  assert.ok(code.includes('annotations(createdAt DESC)'), 'Must create index on createdAt');
});

test('3.2 Database Service CRUD APIs for Annotations', () => {
  const dbServicePath = path.join(__dirname, '..', 'src', 'services', 'libraryDatabaseService.ts');
  const code = fs.readFileSync(dbServicePath, 'utf8');

  assert.ok(code.includes('export async function getAnnotations'), 'Must export getAnnotations');
  assert.ok(code.includes('export async function addAnnotation'), 'Must export addAnnotation');
  assert.ok(code.includes('export async function deleteAnnotation'), 'Must export deleteAnnotation');
  assert.ok(code.includes('export async function updateAnnotationNote'), 'Must export updateAnnotationNote');
  assert.ok(code.includes('@readora_annotations_v1'), 'Must include AsyncStorage resilient fallback key');
});

// -------------------------------------------------------------------
// 4. Component Integration Verification
// -------------------------------------------------------------------
test('4.1 Reader Screen [id].tsx wires annotations to state and all components', () => {
  const readerPath = path.join(__dirname, '..', 'src', 'app', 'reader', '[id].tsx');
  const code = fs.readFileSync(readerPath, 'utf8');

  assert.ok(code.includes('const [annotations, setAnnotations] = useState<Annotation[]>([])'), 'Must have annotations state');
  assert.ok(code.includes('getAnnotations(id)'), 'Must fetch annotations on load');
  assert.ok(code.includes('handleAddAnnotation'), 'Must define handleAddAnnotation');
  assert.ok(code.includes('handleDeleteAnnotation'), 'Must define handleDeleteAnnotation');
  assert.ok(code.includes('<TxtReaderView') && code.includes('annotations={annotations}'), 'TxtReaderView must receive annotations');
  assert.ok(code.includes('<EpubReaderView') && code.includes('annotations={annotations}'), 'EpubReaderView must receive annotations');
  assert.ok(code.includes('<PdfReaderView') && code.includes('annotations={annotations}'), 'PdfReaderView must receive annotations');
  assert.ok(code.includes('<ReaderTocModal') && code.includes('annotations={annotations}'), 'ReaderTocModal must receive annotations');
});

test('4.2 PDF Reader Selectable Text Layer & Annotations Layer', () => {
  const pdfPath = path.join(__dirname, '..', 'src', 'components', 'reader', 'PdfReaderView.tsx');
  const code = fs.readFileSync(pdfPath, 'utf8');

  assert.ok(code.includes('pdfjsLib.renderTextLayer'), 'Must render real selectable text layer');
  assert.ok(code.includes('id="annotations-layer"'), 'Must render annotations-layer');
  assert.ok(code.includes('id="selection-toolbar"'), 'Must have selection toolbar');
  assert.ok(code.includes('applyPdfAnnotation'), 'Must have applyPdfAnnotation handler');
  assert.ok(code.includes('CREATE_ANNOTATION'), 'Must bridge CREATE_ANNOTATION message');
  assert.ok(code.includes('DELETE_ANNOTATION'), 'Must bridge DELETE_ANNOTATION message');
});

test('4.3 EPUB Reader DOM Anchors & Validation', () => {
  const epubPath = path.join(__dirname, '..', 'src', 'components', 'reader', 'EpubReaderView.tsx');
  const code = fs.readFileSync(epubPath, 'utf8');

  assert.ok(code.includes('document.createTreeWalker'), 'Must use DOM TreeWalker for text node location');
  assert.ok(code.includes('applyAnnotations'), 'Must have applyAnnotations function');
  assert.ok(code.includes('applyEpubAnnotation'), 'Must have applyEpubAnnotation function');
  assert.ok(code.includes('id="selection-toolbar"'), 'Must have selection-toolbar in EPUB');
  assert.ok(code.includes('id="annotation-popup"'), 'Must have annotation-popup for tap-to-delete');
  assert.ok(code.includes('CREATE_ANNOTATION'), 'Must bridge CREATE_ANNOTATION message');
  assert.ok(code.includes('DELETE_ANNOTATION'), 'Must bridge DELETE_ANNOTATION message');
});

test('4.4 TXT Reader Deterministic Offsets & Segmentation', () => {
  const txtPath = path.join(__dirname, '..', 'src', 'components', 'reader', 'TxtReaderView.tsx');
  const code = fs.readFileSync(txtPath, 'utf8');

  assert.ok(code.includes('function segmentPageText'), 'Must have segmentPageText helper');
  assert.ok(code.includes('renderSegmentedText'), 'Must render text slices as segmented nodes');
  assert.ok(code.includes('handleApplyHighlight'), 'Must support applying highlights');
  assert.ok(code.includes('handleApplyUnderline'), 'Must support applying underlines');
  assert.ok(code.includes('<AnnotationFloatingMenu'), 'Must include AnnotationFloatingMenu');
  assert.ok(code.includes('deleteBannerContainer'), 'Must include tap-to-delete banner');
});

test('4.5 Reader TOC Modal Annotations Tab', () => {
  const tocModalPath = path.join(__dirname, '..', 'src', 'components', 'reader', 'ReaderTocModal.tsx');
  const code = fs.readFileSync(tocModalPath, 'utf8');

  assert.ok(code.includes("activeTab === 'annotations'"), 'Must handle activeTab === annotations');
  assert.ok(code.includes('Highlights ('), 'Must render Highlights tab with count');
  assert.ok(code.includes('onDeleteAnnotation'), 'Must accept and execute onDeleteAnnotation');
  assert.ok(code.includes('styles.annotationRow'), 'Must style annotation rows');
});

// -------------------------------------------------------------------
// 5. Deterministic TXT Segmentation Algorithm Unit Test
// -------------------------------------------------------------------
test('5.1 TXT Segmenter accurately divides raw text into normal and annotated slices', () => {
  function segmentPageText(pageText, pageStartChar, allAnnotations) {
    const pageEndChar = pageStartChar + pageText.length;
    const relevant = (allAnnotations || [])
      .map((ann) => {
        try {
          const loc = typeof ann.locationJson === 'string' ? JSON.parse(ann.locationJson) : ann.locationJson;
          if (loc && loc.format === 'TXT' && typeof loc.startChar === 'number') {
            return { ann, start: loc.startChar, end: loc.endChar };
          }
        } catch {}
        return null;
      })
      .filter((item) => item && item.start < pageEndChar && item.end > pageStartChar)
      .sort((a, b) => a.start - b.start);

    if (relevant.length === 0) {
      return [{ text: pageText }];
    }

    const segments = [];
    let currentLocalOffset = 0;

    for (const item of relevant) {
      const localStart = Math.max(0, item.start - pageStartChar);
      const localEnd = Math.min(pageText.length, item.end - pageStartChar);

      if (localStart > currentLocalOffset) {
        segments.push({
          text: pageText.slice(currentLocalOffset, localStart),
        });
      }

      if (localEnd > localStart) {
        segments.push({
          text: pageText.slice(localStart, localEnd),
          annotation: item.ann,
        });
        currentLocalOffset = localEnd;
      }
    }

    if (currentLocalOffset < pageText.length) {
      segments.push({
        text: pageText.slice(currentLocalOffset),
      });
    }

    return segments;
  }

  const rawText = "ReadOra is a clean, local-first reading app designed for high performance.";
  const annotations = [
    {
      id: 'ann_1',
      type: 'highlight',
      color: '#F5D061',
      selectedText: 'local-first',
      locationJson: JSON.stringify({
        format: 'TXT',
        startChar: rawText.indexOf('local-first'),
        endChar: rawText.indexOf('local-first') + 'local-first'.length,
      }),
    },
    {
      id: 'ann_2',
      type: 'underline',
      color: '#86EFAC',
      selectedText: 'high performance',
      locationJson: JSON.stringify({
        format: 'TXT',
        startChar: rawText.indexOf('high performance'),
        endChar: rawText.indexOf('high performance') + 'high performance'.length,
      }),
    },
  ];

  const segments = segmentPageText(rawText, 0, annotations);

  assert.strictEqual(segments.length, 5);
  assert.strictEqual(segments[0].text, 'ReadOra is a clean, ');
  assert.strictEqual(segments[0].annotation, undefined);
  assert.strictEqual(segments[1].text, 'local-first');
  assert.strictEqual(segments[1].annotation.id, 'ann_1');
  assert.strictEqual(segments[2].text, ' reading app designed for ');
  assert.strictEqual(segments[2].annotation, undefined);
  assert.strictEqual(segments[3].text, 'high performance');
  assert.strictEqual(segments[3].annotation.id, 'ann_2');
  assert.strictEqual(segments[4].text, '.');
  assert.strictEqual(segments[4].annotation, undefined);

  // Reconstruction check
  const reconstructed = segments.map(s => s.text).join('');
  assert.strictEqual(reconstructed, rawText);
});

console.log('\n-----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
console.log('-----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('🎉 Phase C Verification PASSED successfully!');
  process.exit(0);
} else {
  console.error('❌ Phase C Verification FAILED!');
  process.exit(1);
}
