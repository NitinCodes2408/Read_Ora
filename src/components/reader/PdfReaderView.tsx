import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSize, FontWeight } from '@/constants/typography';
import { UserPreferences, ThemeMode, Annotation } from '@/types';
import { readBookAsBase64 } from '@/services/bookStorageService';
import { updateBookCover, updateBookAuthor } from '@/services/libraryDatabaseService';
import { updateStoreBookCover, updateStoreBookAuthor } from '@/context/LibraryContext';
import { formatAuthorName } from '@/utils/fileUtils';
import { PDF_JS_CODE, PDF_WORKER_JS_CODE } from '@/services/pdfjsBundle';

interface PdfReaderViewProps {
  bookId?: string;
  fileUri: string;
  currentPage: number; // 1-based
  initialZoom?: number;
  preferences: UserPreferences;
  annotations?: Annotation[];
  onTotalPagesDetected: (total: number) => void;
  onPageChange: (newPage: number) => void;
  onZoomChange?: (newZoom: number) => void;
  onAddAnnotation?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onToggleOverlay: () => void;
  onBack?: () => void;
}

export const PdfReaderView: React.FC<PdfReaderViewProps> = ({
  bookId,
  fileUri,
  currentPage,
  initialZoom,
  preferences,
  annotations = [],
  onTotalPagesDetected,
  onPageChange,
  onZoomChange,
  onAddAnnotation,
  onDeleteAnnotation,
  onToggleOverlay,
  onBack,
}) => {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(
    initialZoom && initialZoom >= 0.6 ? initialZoom : 1.0
  );
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<any>(null);

  const themeMode: ThemeMode = preferences.themeMode;
  const isMidnight = themeMode === 'midnight';
  const isSepia = themeMode === 'sepia';

  const bgColor = isMidnight
    ? '#0B0E14'
    : isSepia
    ? '#EFE7D3'
    : '#FAF6EE';

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(2.5, Number((prev + 0.25).toFixed(2)));
      onZoomChange?.(next);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.75, Number((prev - 0.25).toFixed(2)));
      onZoomChange?.(next);
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    onZoomChange?.(1.0);
  };

  // Read PDF as base64 on mount (supporting Web IndexedDB and Native FileSystem)
  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const base64 = await readBookAsBase64(fileUri, bookId);
        if (isMounted) {
          setPdfBase64(base64);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to read PDF file';
          setLoadError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [fileUri, bookId]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'DOC_LOADED') {
          onTotalPagesDetected(data.totalPages);
        } else if (data.type === 'PAGE_CHANGE') {
          onPageChange(data.page);
        } else if (data.type === 'TOGGLE_OVERLAY') {
          onToggleOverlay();
        } else if (data.type === 'ZOOM_CHANGE' && typeof data.zoom === 'number') {
          setZoomLevel(data.zoom);
          onZoomChange?.(data.zoom);
        } else if (data.type === 'COVER_CAPTURED' && data.coverUri && bookId) {
          updateBookCover(bookId, data.coverUri)
            .then(() => updateStoreBookCover(bookId, data.coverUri))
            .catch(() => {});
        } else if (data.type === 'AUTHOR_CAPTURED' && data.author && bookId) {
          const formatted = formatAuthorName(data.author);
          if (formatted !== 'Unknown Author') {
            updateBookAuthor(bookId, formatted)
              .then(() => updateStoreBookAuthor(bookId, formatted))
              .catch(() => {});
          }
        } else if (data.type === 'CREATE_ANNOTATION' && data.annotation && onAddAnnotation) {
          onAddAnnotation(data.annotation);
        } else if (data.type === 'DELETE_ANNOTATION' && data.annotationId && onDeleteAnnotation) {
          onDeleteAnnotation(data.annotationId);
        }
      } catch {
        // ignore
      }
    },
    [bookId, onTotalPagesDetected, onPageChange, onZoomChange, onAddAnnotation, onDeleteAnnotation, onToggleOverlay]
  );

  // Synchronize annotations to WebView or iframe
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ action: 'UPDATE_ANNOTATIONS', annotations }),
            '*'
          );
          if (typeof iframeRef.current.contentWindow.updateAnnotations === 'function') {
            iframeRef.current.contentWindow.updateAnnotations(annotations);
          }
        }
      } catch {
        // ignore
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.updateAnnotations === 'function') {
          window.updateAnnotations(${JSON.stringify(annotations)});
        }
        true;
      `);
    }
  }, [annotations]);

  // Synchronize zoom level to WebView or iframe
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ action: 'SET_ZOOM', zoom: zoomLevel }),
            '*'
          );
          if (typeof iframeRef.current.contentWindow.setZoom === 'function') {
            iframeRef.current.contentWindow.setZoom(zoomLevel);
          }
        }
      } catch {
        // ignore
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.setZoom === 'function') {
          window.setZoom(${zoomLevel});
        }
        true;
      `);
    }
  }, [zoomLevel]);

  // Handle messages on Web (from iframe parent window)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMsg = (e: MessageEvent) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.type) {
            handleMessage({ nativeEvent: { data: JSON.stringify(data) } });
          }
        } catch {
          // ignore non-JSON messages
        }
      };
      window.addEventListener('message', handleWebMsg);
      return () => window.removeEventListener('message', handleWebMsg);
    }
  }, [handleMessage]);

  // When currentPage changes, instruct WebView or iframe to render that page
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ action: 'GO_TO_PAGE', page: currentPage }),
            '*'
          );
          if (typeof iframeRef.current.contentWindow.goToPage === 'function') {
            iframeRef.current.contentWindow.goToPage(currentPage);
          }
        }
      } catch {
        // ignore cross-origin error if any
      }
    } else if (webViewRef.current && pdfBase64) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.goToPage === 'function') {
          window.goToPage(${currentPage});
        }
        true;
      `);
    }
  }, [currentPage, pdfBase64]);

  // When theme changes, update theme class
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ action: 'SET_THEME', theme: themeMode }),
            '*'
          );
          if (typeof iframeRef.current.contentWindow.setTheme === 'function') {
            iframeRef.current.contentWindow.setTheme(themeMode);
          }
        }
      } catch {
        // ignore
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.setTheme === 'function') {
          window.setTheme('${themeMode}');
        }
        true;
      `);
    }
  }, [themeMode]);

  if (isLoading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={Colors.gold.primary} />
        <Text style={[styles.loadingText, { color: isMidnight ? Colors.text.primary : '#2D2319' }]}>
          Loading PDF document...
        </Text>
      </View>
    );
  }

  if (loadError || !pdfBase64) {
    return (
      <View style={[styles.centerBox, { backgroundColor: bgColor }]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to Display PDF</Text>
          <Text style={styles.errorText}>
            {loadError || 'The document content could not be loaded.'}
          </Text>
          {onBack && (
            <Pressable
              style={styles.errorBackBtn}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Return to Library"
            >
              <Text style={styles.errorBackBtnText}>Return to Library</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const cleanBase64 = (pdfBase64 || '').replace(/\s+/g, '');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <!-- Embedded Mozilla PDF.js v3.11.174 & worker for 100% offline standalone operation -->
  <script>
    ${PDF_WORKER_JS_CODE}
  </script>
  <script>
    ${PDF_JS_CODE}
  </script>
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: ${bgColor};
      overflow: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      user-select: none;
    }
    #container {
      width: 100%;
      min-height: 100%;
      padding: 60px 8px 80px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #page-wrapper {
      position: relative;
      display: inline-block;
      margin: 0 auto;
      user-select: text;
    }
    canvas {
      display: block;
      max-width: 100%;
      height: auto;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      border-radius: 4px;
      transition: filter 0.25s ease;
    }
    .theme-midnight canvas {
      filter: invert(0.92) hue-rotate(180deg) contrast(1.1) brightness(0.95);
    }
    .theme-sepia canvas {
      filter: sepia(0.35) contrast(1.05) brightness(0.94);
    }
    .theme-ivory canvas {
      filter: none;
    }
    #text-layer {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      opacity: 0.2;
      line-height: 1.0;
      user-select: text;
      -webkit-user-select: text;
      pointer-events: auto;
      z-index: 2;
    }
    #text-layer span {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }
    #text-layer ::selection {
      background: rgba(229, 186, 88, 0.45);
      color: transparent;
    }
    #annotations-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }
    .pdf-highlight {
      position: absolute;
      mix-blend-mode: multiply;
      border-radius: 2px;
      pointer-events: auto;
      cursor: pointer;
    }
    .pdf-underline {
      position: absolute;
      border-bottom-width: 2.5px;
      border-bottom-style: solid;
      pointer-events: auto;
      cursor: pointer;
    }
    #spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #E5BA58;
      font-family: sans-serif;
      font-size: 14px;
    }
    #selection-toolbar {
      position: fixed;
      display: none;
      background: #121620;
      border: 1px solid rgba(229, 186, 88, 0.45);
      border-radius: 24px;
      padding: 6px 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      z-index: 10000;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      transform: translate(-50%, -115%);
    }
    .swatch {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      cursor: pointer;
      border: 1.5px solid rgba(255, 255, 255, 0.5);
      transition: transform 0.15s ease;
    }
    .swatch:hover {
      transform: scale(1.18);
    }
    .tool-sep {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.18);
      margin: 0 4px;
    }
    .underline-btn {
      background: rgba(229, 186, 88, 0.16);
      color: #E5BA58;
      border: 1px solid rgba(229, 186, 88, 0.35);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      cursor: pointer;
      font-family: -apple-system, sans-serif;
    }
  </style>
</head>
<body class="theme-${themeMode}">
  <div id="container">
    <div id="spinner">Rendering page...</div>
    <div id="page-wrapper">
      <canvas id="pdf-canvas"></canvas>
      <div id="annotations-layer"></div>
      <div id="text-layer" class="textLayer"></div>
    </div>
  </div>

  <div id="selection-toolbar">
    <div class="swatch" style="background:#F5D061;" onclick="applyPdfAnnotation('highlight', '#F5D061')" title="Gold Highlight"></div>
    <div class="swatch" style="background:#86EFAC;" onclick="applyPdfAnnotation('highlight', '#86EFAC')" title="Emerald Highlight"></div>
    <div class="swatch" style="background:#93C5FD;" onclick="applyPdfAnnotation('highlight', '#93C5FD')" title="Sky Highlight"></div>
    <div class="swatch" style="background:#F472B6;" onclick="applyPdfAnnotation('highlight', '#F472B6')" title="Rose Highlight"></div>
    <div class="swatch" style="background:#C084FC;" onclick="applyPdfAnnotation('highlight', '#C084FC')" title="Purple Highlight"></div>
    <div class="tool-sep"></div>
    <button type="button" class="underline-btn" onclick="applyPdfAnnotation('underline', '#F5D061')">Underline</button>
  </div>

  <script>
    let pdfDoc = null;
    let pageNum = ${currentPage};
    let currentZoom = ${zoomLevel};
    let pageRendering = false;
    let pageNumPending = null;
    window.allAnnotations = ${JSON.stringify(annotations || [])};

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const spinner = document.getElementById('spinner');
    const pageWrapper = document.getElementById('page-wrapper');
    const textLayer = document.getElementById('text-layer');
    const annotationsLayer = document.getElementById('annotations-layer');
    const toolbar = document.getElementById('selection-toolbar');

    let activeSelectedText = '';
    let activeSelectionRects = [];

    function sendMessage(msgObj) {
      const json = JSON.stringify(msgObj);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(json);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(json, '*');
      }
    }

    function initPdf() {
      if (!window.pdfjsLib) {
        setTimeout(initPdf, 100);
        return;
      }
      try {
        // PDF.js worker is already bundled locally in-thread via window.pdfjsWorker
        if (!pdfjsLib.GlobalWorkerOptions.workerPort && typeof window.pdfjsWorker === 'object') {
          // Offline fake worker active
        }
        const raw = atob("${cleanBase64}");
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          uint8[i] = raw.charCodeAt(i);
        }

        pdfjsLib.getDocument({ data: uint8 }).promise.then(function(doc) {
          pdfDoc = doc;
          spinner.style.display = 'none';
          sendMessage({
            type: 'DOC_LOADED',
            totalPages: doc.numPages
          });

          // Extract document author & title metadata
          doc.getMetadata().then(function(metaData) {
            let docAuthor = metaData && metaData.info ? metaData.info.Author : null;
            if (!docAuthor && metaData && metaData.metadata) {
              docAuthor = metaData.metadata.get('dc:creator');
            }
            if (docAuthor) {
              sendMessage({
                type: 'AUTHOR_CAPTURED',
                author: docAuthor
              });
            }
          }).catch(function() {});

          renderPage(pageNum);
        }).catch(function(err) {
          spinner.innerText = 'PDF rendering error: ' + err.message;
        });
      } catch (e) {
        spinner.innerText = 'PDF load error: ' + e.message;
      }
    }

    if (document.readyState === 'complete') {
      initPdf();
    } else {
      window.addEventListener('load', initPdf);
    }

    function renderAnnotations(pageNumber) {
      if (!annotationsLayer) return;
      annotationsLayer.innerHTML = '';

      const w = parseFloat(canvas.style.width) || canvas.width;
      const h = parseFloat(canvas.style.height) || canvas.height;

      const pageAnnotations = (window.allAnnotations || []).filter(function(a) {
        return Number(a.pageNumber) === Number(pageNumber);
      });

      pageAnnotations.forEach(function(ann) {
        let loc = null;
        try {
          loc = typeof ann.locationJson === 'string' ? JSON.parse(ann.locationJson) : ann.locationJson;
        } catch (e) {}

        if (!loc || !Array.isArray(loc.rects)) return;

        loc.rects.forEach(function(r) {
          const div = document.createElement('div');
          div.className = ann.type === 'underline' ? 'pdf-underline' : 'pdf-highlight';
          div.style.left = (r.left * w) + 'px';
          div.style.top = (r.top * h) + 'px';
          div.style.width = (r.width * w) + 'px';
          div.style.height = (r.height * h) + 'px';

          if (ann.type === 'underline') {
            div.style.borderBottomColor = ann.color || '#F5D061';
          } else {
            div.style.backgroundColor = ann.color || '#F5D061';
            div.style.opacity = '0.38';
          }

          div.setAttribute('data-id', ann.id);
          div.setAttribute('title', 'Tap to remove ' + ann.type);
          div.onclick = function(e) {
            e.stopPropagation();
            if (confirm('Delete this ' + ann.type + '?')) {
              sendMessage({ type: 'DELETE_ANNOTATION', annotationId: ann.id });
            }
          };

          annotationsLayer.appendChild(div);
        });
      });
    }

    window.updateAnnotations = function(newAnnotations) {
      window.allAnnotations = newAnnotations || [];
      renderAnnotations(pageNum);
    };

    function renderPage(num) {
      if (!pdfDoc) return;
      pageRendering = true;
      spinner.style.display = 'block';

      pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: 1.0 });
        const screenWidth = window.innerWidth - 16;
        const baseScale = screenWidth / viewport.width;
        const effectiveScale = baseScale * currentZoom;
        const dpr = window.devicePixelRatio || 1.5;
        const scaledViewport = page.getViewport({ scale: effectiveScale * dpr });

        const displayWidth = Math.floor(scaledViewport.width / dpr) + 'px';
        const displayHeight = Math.floor(scaledViewport.height / dpr) + 'px';

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        canvas.style.width = displayWidth;
        canvas.style.height = displayHeight;

        pageWrapper.style.width = displayWidth;
        pageWrapper.style.height = displayHeight;
        textLayer.style.width = displayWidth;
        textLayer.style.height = displayHeight;
        annotationsLayer.style.width = displayWidth;
        annotationsLayer.style.height = displayHeight;

        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport
        };

        const renderTask = page.render(renderContext);
        renderTask.promise.then(function() {
          pageRendering = false;
          spinner.style.display = 'none';

          // Build Real Selectable Text Layer
          page.getTextContent().then(function(textContent) {
            textLayer.innerHTML = '';
            if (pdfjsLib.renderTextLayer) {
              pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayer,
                viewport: scaledViewport,
                textDivs: []
              });
            } else {
              textContent.items.forEach(function(item) {
                const tx = pdfjsLib.Util.transform(scaledViewport.transform, item.transform);
                const span = document.createElement('span');
                span.textContent = item.str;
                span.style.left = Math.floor(tx[4] / dpr) + 'px';
                span.style.top = Math.floor((tx[5] - item.height * scaledViewport.scale) / dpr) + 'px';
                span.style.fontSize = Math.floor((item.height * scaledViewport.scale) / dpr) + 'px';
                textLayer.appendChild(span);
              });
            }
          }).catch(function() {});

          // Render Page Highlights & Underlines
          renderAnnotations(num);

          // If rendering page 1, capture thumbnail and inspect title/cover text for author
          if (num === 1 && canvas) {
            try {
              const coverData = canvas.toDataURL('image/jpeg', 0.82);
              sendMessage({
                type: 'COVER_CAPTURED',
                coverUri: coverData
              });
            } catch (err) {}

            page.getTextContent().then(function(tc) {
              const items = tc.items.map(function(it) { return it.str ? it.str.trim() : ''; }).filter(Boolean);
              for (let i = 0; i < items.length; i++) {
                const line = items[i];
                const byMatch = line.match(/^(?:by|written by|author[:\s])\s+([A-Z][A-Za-z\s.'’\-]+)$/i);
                if (byMatch && byMatch[1]) {
                  sendMessage({ type: 'AUTHOR_CAPTURED', author: byMatch[1] });
                  break;
                }
                if (/^(?:by|written by)$/i.test(line) && i + 1 < items.length) {
                  sendMessage({ type: 'AUTHOR_CAPTURED', author: items[i + 1] });
                  break;
                }
              }
            }).catch(function() {});
          }

          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });
    }

    function queueRenderPage(num) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    }

    window.goToPage = function(num) {
      if (pdfDoc && num >= 1 && num <= pdfDoc.numPages) {
        pageNum = num;
        queueRenderPage(pageNum);
      }
    };

    window.setZoom = function(z) {
      currentZoom = Math.max(0.6, Math.min(3.0, z));
      renderPage(pageNum);
    };

    window.setTheme = function(theme) {
      document.body.className = 'theme-' + theme;
    };

    // Text Selection & Floating Annotation Menu
    function checkTextSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        toolbar.style.display = 'none';
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        toolbar.style.display = 'none';
        return;
      }

      const range = sel.getRangeAt(0);
      const clientRects = range.getClientRects();
      const pageRect = canvas.getBoundingClientRect();
      if (clientRects.length === 0 || pageRect.width === 0) return;

      const normalizedRects = [];
      for (let i = 0; i < clientRects.length; i++) {
        const r = clientRects[i];
        normalizedRects.push({
          left: Math.max(0, (r.left - pageRect.left) / pageRect.width),
          top: Math.max(0, (r.top - pageRect.top) / pageRect.height),
          width: Math.min(1, r.width / pageRect.width),
          height: Math.min(1, r.height / pageRect.height),
        });
      }

      activeSelectedText = text;
      activeSelectionRects = normalizedRects;

      const firstRect = clientRects[0];
      toolbar.style.display = 'flex';
      toolbar.style.left = Math.min(window.innerWidth - 120, Math.max(120, firstRect.left + firstRect.width / 2)) + 'px';
      toolbar.style.top = Math.max(20, firstRect.top - 12) + 'px';
    }

    function applyPdfAnnotation(type, color) {
      if (!activeSelectedText || !activeSelectionRects || activeSelectionRects.length === 0) return;

      const locObj = {
        format: 'PDF',
        pageNumber: pageNum,
        rects: activeSelectionRects
      };

      sendMessage({
        type: 'CREATE_ANNOTATION',
        annotation: {
          bookId: "${bookId || ''}",
          type: type,
          color: color,
          selectedText: activeSelectedText,
          pageNumber: pageNum,
          locationJson: JSON.stringify(locObj)
        }
      });

      toolbar.style.display = 'none';
      activeSelectedText = '';
      activeSelectionRects = [];
      window.getSelection()?.removeAllRanges();
    }

    document.addEventListener('selectionchange', checkTextSelection);
    document.addEventListener('mouseup', checkTextSelection);

    // Listen for messages from web parent
    window.addEventListener('message', function(e) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.action === 'GO_TO_PAGE' && typeof data.page === 'number') {
          window.goToPage(data.page);
        } else if (data && data.action === 'SET_THEME' && typeof data.theme === 'string') {
          window.setTheme(data.theme);
        } else if (data && data.action === 'SET_ZOOM' && typeof data.zoom === 'number') {
          window.setZoom(data.zoom);
        } else if (data && data.action === 'UPDATE_ANNOTATIONS' && Array.isArray(data.annotations)) {
          window.updateAnnotations(data.annotations);
        }
      } catch (err) {}
    });

    function handleNavigation(clickX) {
      const width = window.innerWidth;
      const zone = width * 0.25;

      if (clickX < zone) {
        // Left tap: previous page
        if (pdfDoc && pageNum > 1) {
          pageNum--;
          queueRenderPage(pageNum);
          sendMessage({
            type: 'PAGE_CHANGE',
            page: pageNum
          });
        }
      } else if (clickX > width - zone) {
        // Right tap: next page
        if (pdfDoc && pageNum < pdfDoc.numPages) {
          pageNum++;
          queueRenderPage(pageNum);
          sendMessage({
            type: 'PAGE_CHANGE',
            page: pageNum
          });
        }
      } else {
        // Center tap: toggle overlay
        sendMessage({
          type: 'TOGGLE_OVERLAY'
        });
      }
    }

    // Touch navigation for mobile
    let startX = 0;
    let isTap = true;
    let lastTapTime = 0;

    window.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        isTap = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        const diffX = Math.abs(e.touches[0].clientX - startX);
        if (diffX > 15) {
          isTap = false;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', function(e) {
      const target = e.target;
      if (target && (target.closest('#selection-toolbar') || target.closest('#annotations-layer'))) {
        return;
      }

      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        checkTextSelection();
        return;
      }

      if (isTap && e.changedTouches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime < 320) {
          currentZoom = currentZoom > 1.15 ? 1.0 : 1.5;
          renderPage(pageNum);
          sendMessage({ type: 'ZOOM_CHANGE', zoom: currentZoom });
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;
        handleNavigation(e.changedTouches[0].clientX);
      }
    }, { passive: true });

    // Click navigation for desktop web browsers
    window.addEventListener('click', function(e) {
      const target = e.target;
      if (target && (target.closest('#selection-toolbar') || target.closest('#annotations-layer') || target.closest('button') || target.closest('a'))) {
        return;
      }
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        return;
      }
      handleNavigation(e.clientX);
    });

    window.addEventListener('dblclick', function(e) {
      currentZoom = currentZoom > 1.15 ? 1.0 : 1.5;
      renderPage(pageNum);
      sendMessage({ type: 'ZOOM_CHANGE', zoom: currentZoom });
    });
  </script>
</body>
</html>`;

  const zoomToolbar = (
    <View
      style={[
        styles.zoomToolbar,
        {
          backgroundColor: isMidnight
            ? 'rgba(11, 14, 20, 0.92)'
            : isSepia
            ? 'rgba(239, 231, 211, 0.95)'
            : 'rgba(250, 246, 238, 0.95)',
          borderColor: isMidnight
            ? Colors.midnight.border
            : isSepia
            ? 'rgba(197, 154, 61, 0.35)'
            : 'rgba(210, 200, 180, 0.8)',
        },
      ]}
    >
      <Pressable
        onPress={handleZoomOut}
        disabled={zoomLevel <= 0.75}
        style={({ pressed }) => [
          styles.zoomBtn,
          zoomLevel <= 0.75 && styles.zoomBtnDisabled,
          pressed && styles.zoomBtnPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
      >
        <Text
          style={[
            styles.zoomBtnText,
            { color: isMidnight ? Colors.text.primary : '#2D2319' },
          ]}
        >
          −
        </Text>
      </Pressable>

      <Pressable
        onPress={handleResetZoom}
        style={({ pressed }) => [styles.zoomBtnReset, pressed && styles.zoomBtnPressed]}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Reset zoom to 100 percent"
      >
        <Text style={styles.zoomResetText}>{Math.round(zoomLevel * 100)}%</Text>
      </Pressable>

      <Pressable
        onPress={handleZoomIn}
        disabled={zoomLevel >= 2.5}
        style={({ pressed }) => [
          styles.zoomBtn,
          zoomLevel >= 2.5 && styles.zoomBtnDisabled,
          pressed && styles.zoomBtnPressed,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
      >
        <Text
          style={[
            styles.zoomBtnText,
            { color: isMidnight ? Colors.text.primary : '#2D2319' },
          ]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {React.createElement('iframe', {
          ref: iframeRef,
          srcDoc: htmlContent,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: bgColor,
          },
          title: 'PDF Reader',
        })}
        {zoomToolbar}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={[styles.webview, { backgroundColor: bgColor }]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
      {zoomToolbar}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
  errorCard: {
    maxWidth: 420,
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.status.error,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  errorBackBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gold.primary,
    borderRadius: BorderRadius.md,
  },
  errorBackBtnText: {
    color: Colors.midnight.background,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  zoomToolbar: {
    position: 'absolute',
    bottom: 78,
    right: 16,
    zIndex: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  zoomBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnPressed: {
    opacity: 0.6,
  },
  zoomBtnDisabled: {
    opacity: 0.3,
  },
  zoomBtnText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    lineHeight: 20,
  },
  zoomBtnReset: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoomResetText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.gold.primary,
  },
});
