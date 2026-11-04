import bundle from './pdfjsBundle.json';

/**
 * Embedded Mozilla PDF.js v3.11.174 client scripts for 100% offline document rendering
 * Bundled locally to ensure standalone APK runs in airplane mode with zero CDN dependencies.
 */
export const PDF_JS_CODE: string = bundle.pdfJs;
export const PDF_WORKER_JS_CODE: string = bundle.pdfWorkerJs;

