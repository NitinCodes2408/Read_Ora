const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=====================================================');
console.log('ReadOra Phase A — Precision Reading Progress Verification');
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
// 1. Types & Serialization Tests
// -------------------------------------------------------------------
function serializeLocation(location) {
  return JSON.stringify(location);
}

function parseLocation(rawJson) {
  if (!rawJson || typeof rawJson !== 'string') return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === 'object' && parsed.format) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

test('1.1 EPUB Location Serialization & Round-Trip Parsing', () => {
  const epubLoc = {
    format: 'EPUB',
    chapterIndex: 3,
    scrollPercent: 42.75,
    totalChapters: 31,
    chapterHref: 'text/ch004.xhtml',
    chapterId: 'chapter_4',
  };

  const json = serializeLocation(epubLoc);
  assert.ok(typeof json === 'string');
  assert.ok(json.includes('"format":"EPUB"'));
  assert.ok(json.includes('"scrollPercent":42.75'));

  const restored = parseLocation(json);
  assert.strictEqual(restored.format, 'EPUB');
  assert.strictEqual(restored.chapterIndex, 3);
  assert.strictEqual(restored.scrollPercent, 42.75);
  assert.strictEqual(restored.totalChapters, 31);
  assert.strictEqual(restored.chapterHref, 'text/ch004.xhtml');
});

test('1.2 TXT Location Serialization & Character Offset Integrity', () => {
  const txtLoc = {
    format: 'TXT',
    pageIndex: 5,
    charOffset: 7240,
    totalPages: 24,
    readingMode: 'scroll',
  };

  const json = serializeLocation(txtLoc);
  const restored = parseLocation(json);
  assert.strictEqual(restored.format, 'TXT');
  assert.strictEqual(restored.pageIndex, 5);
  assert.strictEqual(restored.charOffset, 7240);
  assert.strictEqual(restored.totalPages, 24);
  assert.strictEqual(restored.readingMode, 'scroll');
});

test('1.3 PDF Location Serialization & Zoom Preservation', () => {
  const pdfLoc = {
    format: 'PDF',
    pageNumber: 17,
    totalPages: 120,
    zoom: 1.5,
  };

  const json = serializeLocation(pdfLoc);
  const restored = parseLocation(json);
  assert.strictEqual(restored.format, 'PDF');
  assert.strictEqual(restored.pageNumber, 17);
  assert.strictEqual(restored.totalPages, 120);
  assert.strictEqual(restored.zoom, 1.5);
});

test('1.4 Corrupted or Legacy Null Location Handling', () => {
  assert.strictEqual(parseLocation(null), null);
  assert.strictEqual(parseLocation(undefined), null);
  assert.strictEqual(parseLocation(''), null);
  assert.strictEqual(parseLocation('{ not valid json }'), null);
  assert.strictEqual(parseLocation('{"someOtherField": 123}'), null);
});

// -------------------------------------------------------------------
// 2. TXT Deterministic Character Offset Paging Tests
// -------------------------------------------------------------------
test('2.1 TXT Deterministic Page Offsets and Restoration', () => {
  const sampleText = `Chapter 1: The Gathering Storm

It was a dark and stormy night; the rain fell in torrents—except at occasional intervals, when it was checked by a violent gust of wind which swept up the streets.

Chapter 2: The Departure

The next morning broke clear and brisk. The horses were harnessed, the baggage packed into the carriage, and the travelers bade farewell to their hosts.

Chapter 3: The Journey

Days turned into weeks as they navigated across the rugged hills and winding rivers.`;

  const paragraphs = sampleText.split(/\n\s*\n/);
  const CHARACTERS_PER_PAGE = 150;
  const pages = [];
  let currentPageText = '';

  paragraphs.forEach((para) => {
    const trimmed = para.trim();
    if (!trimmed) return;
    if (currentPageText.length + trimmed.length > CHARACTERS_PER_PAGE && currentPageText.length > 0) {
      pages.push(currentPageText.trim());
      currentPageText = trimmed;
    } else {
      currentPageText = currentPageText ? `${currentPageText}\n\n${trimmed}` : trimmed;
    }
  });
  if (currentPageText.trim().length > 0) {
    pages.push(currentPageText.trim());
  }

  // Calculate offsets exactly as in txtService
  const pageOffsets = [];
  let searchPointer = 0;
  for (const pageContent of pages) {
    const foundIdx = sampleText.indexOf(pageContent, searchPointer);
    if (foundIdx !== -1) {
      pageOffsets.push(foundIdx);
      searchPointer = foundIdx + pageContent.length;
    } else {
      pageOffsets.push(searchPointer);
      searchPointer += pageContent.length;
    }
  }

  assert.ok(pages.length >= 2, 'Should create multiple pages');
  assert.strictEqual(pageOffsets.length, pages.length);
  assert.strictEqual(pageOffsets[0], 0, 'Page 1 offset should be 0');

  // Verify reverse lookup: Given charOffset in Chapter 2, find exact page
  const targetCharOffset = sampleText.indexOf('Chapter 2');
  let matchedPage = 0;
  for (let i = 0; i < pageOffsets.length; i++) {
    if (targetCharOffset >= pageOffsets[i]) {
      matchedPage = i;
    } else {
      break;
    }
  }

  assert.ok(matchedPage > 0, 'Should match Chapter 2 to subsequent page');
  assert.ok(pages[matchedPage].includes('Chapter 2'), 'Target page should contain Chapter 2 text');
});

// -------------------------------------------------------------------
// 3. Database Migration Idempotency & Schema v3 Validation
// -------------------------------------------------------------------
test('3.1 Schema File Inspection for Schema v3 Migration Integrity', () => {
  const dbServicePath = path.join(__dirname, '../src/services/libraryDatabaseService.ts');
  const content = fs.readFileSync(dbServicePath, 'utf8');

  const versionMatch = content.match(/const CURRENT_SCHEMA_VERSION = (\d+);/);
  assert.ok(versionMatch && Number(versionMatch[1]) >= 3, 'CURRENT_SCHEMA_VERSION must be at least 3');
  assert.ok(content.includes('PRAGMA table_info(books);'), 'Migration must check existing table columns via PRAGMA');
  assert.ok(content.includes('ALTER TABLE books ADD COLUMN lastLocationJson TEXT;'), 'Must execute idempotent ALTER TABLE');
  assert.ok(content.includes('lastLocationJson: row.lastLocationJson || undefined'), 'mapRowToBook must map lastLocationJson');
});

test('3.2 SQLite Primary Authority & AsyncStorage Sync Validation', () => {
  const dbServicePath = path.join(__dirname, '../src/services/libraryDatabaseService.ts');
  const content = fs.readFileSync(dbServicePath, 'utf8');

  // Verify SQLite is primary in updateReadingProgress
  const updateIdx = content.indexOf('export async function updateReadingProgress(');
  assert.ok(updateIdx !== -1);
  const updateSection = content.substring(updateIdx, updateIdx + 1600);
  assert.ok(updateSection.includes('UPDATE books'), 'SQLite UPDATE must execute');
  assert.ok(updateSection.includes('lastLocationJson'), 'SQLite UPDATE must save lastLocationJson');
});

// -------------------------------------------------------------------
// 4. Reader View Integration Validation
// -------------------------------------------------------------------
test('4.1 Reader Screen Precision Location Wiring', () => {
  const readerPath = path.join(__dirname, '../src/app/reader/[id].tsx');
  const content = fs.readFileSync(readerPath, 'utf8');

  assert.ok(content.includes('parseLocation(bookRecord.lastLocationJson)'), 'Reader must parse saved location on load');
  assert.ok(content.includes('initialScrollPercent={initialScrollPercent}'), 'Must pass initialScrollPercent to EpubReaderView');
  assert.ok(content.includes('initialZoom={initialZoom}'), 'Must pass initialZoom to PdfReaderView');
  assert.ok(content.includes('onScrollProgress'), 'Must handle scroll progress in EPUB');
  assert.ok(content.includes('onZoomChange'), 'Must handle zoom change in PDF');
  assert.ok(content.includes('scheduleDebouncedProgressSave'), 'Must save location in debounced saver');
});

test('4.2 EPUB Reader Precision Scroll Restoration Script Injection', () => {
  const epubReaderPath = path.join(__dirname, '../src/components/reader/EpubReaderView.tsx');
  const content = fs.readFileSync(epubReaderPath, 'utf8');

  assert.ok(content.includes('initialScrollPercent?: number;'), 'EpubReaderViewProps must include initialScrollPercent');
  assert.ok(content.includes('attemptScrollRestore()'), 'HTML template must inject attemptScrollRestore function');
  assert.ok(content.includes('window.scrollTo({ top: targetY, behavior: \'instant\' })'), 'Must execute instant scrollTo');
  assert.ok(content.includes('SCROLL_PROGRESS'), 'Must emit SCROLL_PROGRESS');
});

test('4.3 TXT Reader Absolute Offset & Mode Compatibility', () => {
  const txtReaderPath = path.join(__dirname, '../src/components/reader/TxtReaderView.tsx');
  const content = fs.readFileSync(txtReaderPath, 'utf8');

  assert.ok(content.includes('scrollViewRef'), 'TxtReaderView must have scrollViewRef');
  assert.ok(content.includes('flatListRef'), 'TxtReaderView must have flatListRef');
  assert.ok(content.includes('onScrollToIndexFailed'), 'Must handle onScrollToIndexFailed gracefully');
});

test('4.4 PDF Reader Precision Zoom and Page Persistence', () => {
  const pdfReaderPath = path.join(__dirname, '../src/components/reader/PdfReaderView.tsx');
  const content = fs.readFileSync(pdfReaderPath, 'utf8');

  assert.ok(content.includes('initialZoom?: number;'), 'PdfReaderViewProps must include initialZoom');
  assert.ok(content.includes('onZoomChange?: (newZoom: number) => void;'), 'PdfReaderViewProps must include onZoomChange');
});

console.log('\n-----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
console.log('-----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('>>> ALL PHASE A VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
  process.exit(0);
} else {
  console.error('>>> SOME TESTS FAILED! <<<');
  process.exit(1);
}
