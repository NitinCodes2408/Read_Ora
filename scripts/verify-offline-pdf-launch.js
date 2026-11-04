const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=====================================================');
console.log('ReadOra — Launch Readiness Verification (Steps 1–4)');
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

// 1. Verify pdfjsBundle data integrity
test('1.1 PDF.js Bundle JSON and TS Exports Integrity', () => {
  const jsonPath = path.join(__dirname, '..', 'src', 'services', 'pdfjsBundle.json');
  assert.ok(fs.existsSync(jsonPath), 'pdfjsBundle.json must exist');
  const bundle = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  assert.ok(typeof bundle.pdfJs === 'string' && bundle.pdfJs.length > 250000, 'pdfJs must be > 250KB');
  assert.ok(typeof bundle.pdfWorkerJs === 'string' && bundle.pdfWorkerJs.length > 900000, 'pdfWorkerJs must be > 900KB');

  const tsPath = path.join(__dirname, '..', 'src', 'services', 'pdfjsBundle.ts');
  assert.ok(fs.existsSync(tsPath), 'pdfjsBundle.ts must exist');
  const tsContent = fs.readFileSync(tsPath, 'utf8');
  assert.ok(tsContent.includes('export const PDF_JS_CODE'), 'Must export PDF_JS_CODE');
  assert.ok(tsContent.includes('export const PDF_WORKER_JS_CODE'), 'Must export PDF_WORKER_JS_CODE');
});

// 2. Verify PdfReaderView.tsx is 100% offline and embeds bundled scripts
test('2.1 PdfReaderView embeds local PDF.js and has NO remote CDN dependency', () => {
  const readerPath = path.join(__dirname, '..', 'src', 'components', 'reader', 'PdfReaderView.tsx');
  const content = fs.readFileSync(readerPath, 'utf8');

  assert.ok(content.includes("from '@/services/pdfjsBundle'"), 'Must import from pdfjsBundle');
  assert.ok(content.includes('${PDF_WORKER_JS_CODE}'), 'Must embed PDF_WORKER_JS_CODE');
  assert.ok(content.includes('${PDF_JS_CODE}'), 'Must embed PDF_JS_CODE');
  assert.ok(!content.includes('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'), 'Must NOT load pdf.min.js from CDN');
  assert.ok(!content.includes('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'), 'Must NOT load pdf.worker.min.js from CDN');
});

// 3. Verify coverExtractionService.ts offline readiness
test('3.1 coverExtractionService uses bundled PDF.js for instant offline execution', () => {
  const servicePath = path.join(__dirname, '..', 'src', 'services', 'coverExtractionService.ts');
  const content = fs.readFileSync(servicePath, 'utf8');

  assert.ok(content.includes("from './pdfjsBundle'"), 'Must import from pdfjsBundle');
  assert.ok(content.includes('workerScript.textContent = PDF_WORKER_JS_CODE'), 'Must inject worker script directly');
  assert.ok(content.includes('pdfScript.textContent = PDF_JS_CODE'), 'Must inject pdf script directly');
});

// 4. Verify app.json configuration
test('4.1 app.json contains valid versionCode and INTERNET permission', () => {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  assert.strictEqual(appJson.expo.android.package, 'com.nitincodes.readora');
  assert.ok(appJson.expo.android.versionCode >= 1, 'versionCode must be >= 1');
  assert.ok(Array.isArray(appJson.expo.android.permissions), 'permissions must be an array');
  assert.ok(appJson.expo.android.permissions.includes('INTERNET'), 'permissions must include INTERNET');
  assert.ok(typeof appJson.expo.version === 'string' && appJson.expo.version.length > 0, 'version must be specified');
});

// 5. Verify eas.json standalone production-apk profile
test('5.1 eas.json has production-apk profile with apk buildType', () => {
  const easPath = path.join(__dirname, '..', 'eas.json');
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));

  assert.ok(eas.build['production-apk'], 'production-apk profile must exist');
  assert.strictEqual(eas.build['production-apk'].distribution, 'internal');
  assert.strictEqual(eas.build['production-apk'].android.buildType, 'apk');
  assert.strictEqual(eas.build.preview.android.buildType, 'apk');
  assert.strictEqual(eas.build.development.android.buildType, 'apk');
});

// 6. Test runtime execution of bundled scripts
test('6.1 Bundled PDF.js scripts initialize without crashing in clean JS environment', () => {
  const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'pdfjsBundle.json'), 'utf8'));
  const fakeWindow = {};
  const fnWorker = new Function('globalThis', 'window', bundle.pdfWorkerJs);
  fnWorker(fakeWindow, fakeWindow);
  assert.ok(fakeWindow.pdfjsWorker, 'Worker must attach to window.pdfjsWorker');

  const fnPdf = new Function('globalThis', 'window', bundle.pdfJs);
  fnPdf(fakeWindow, fakeWindow);
  assert.ok(fakeWindow.pdfjsLib, 'pdfjsLib must attach to window.pdfjsLib');
  assert.strictEqual(fakeWindow.pdfjsLib.version, '3.11.174');
});

console.log('\n-----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
console.log('-----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL LAUNCH READINESS AUDIT STEPS 1-4 VERIFIED SUCCESSFULLY!\n');
} else {
  process.exit(1);
}

