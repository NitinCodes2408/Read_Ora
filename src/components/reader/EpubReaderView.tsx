import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';
import { UserPreferences, Chapter, ThemeMode, Annotation } from '@/types';

interface EpubReaderViewProps {
  bookId?: string;
  chapters: Chapter[];
  currentChapterIndex: number; // 0-based
  preferences: UserPreferences;
  annotations?: Annotation[];
  firstStoryChapterIndex?: number;
  initialScrollPercent?: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onJumpToChapter?: (chapterIndex: number) => void;
  onAddAnnotation?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onToggleOverlay: () => void;
  onScrollProgress?: (percent: number) => void;
}

export const EpubReaderView: React.FC<EpubReaderViewProps> = ({
  bookId,
  chapters,
  currentChapterIndex,
  preferences,
  annotations = [],
  firstStoryChapterIndex,
  initialScrollPercent,
  onPrevChapter,
  onNextChapter,
  onJumpToChapter,
  onAddAnnotation,
  onDeleteAnnotation,
  onToggleOverlay,
  onScrollProgress,
}) => {
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  const currentChapter = chapters[currentChapterIndex];
  const themeMode: ThemeMode = preferences.themeMode;

  const isMidnight = themeMode === 'midnight';
  const isSepia = themeMode === 'sepia';

  const bgColor = isMidnight
    ? '#0B0E14'
    : isSepia
    ? '#EFE7D3'
    : '#FAF6EE';

  const textColor = isMidnight
    ? '#F8FAFC'
    : isSepia
    ? '#2D2319'
    : '#1C1917';

  const accentColor = isMidnight
    ? Colors.gold.primary
    : isSepia
    ? '#C59A3D'
    : '#967838';

  const fontFamily =
    preferences.fontFamily === 'serif'
      ? 'Georgia, serif'
      : preferences.fontFamily === 'sans'
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : preferences.fontFamily === 'mono'
      ? '"Courier New", Courier, monospace'
      : 'system-ui, sans-serif';

  const lineHeight =
    preferences.lineSpacing === 'compact'
      ? 1.4
      : preferences.lineSpacing === 'relaxed' || preferences.lineSpacing === 'loose'
      ? 2.1
      : 1.7;

  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < chapters.length - 1;
  const prevTitle = hasPrev ? chapters[currentChapterIndex - 1]?.title || 'Previous Chapter' : '';
  const nextTitle = hasNext ? chapters[currentChapterIndex + 1]?.title || 'Next Chapter' : '';

  // Build self-contained HTML page
  const htmlContent = useMemo(() => {
    const rawBody = currentChapter ? currentChapter.contentHtml || '' : '<p>No chapter content.</p>';

    const isBeforeStory =
      firstStoryChapterIndex !== undefined &&
      firstStoryChapterIndex > 0 &&
      currentChapterIndex < firstStoryChapterIndex;
    const firstStoryTitle =
      firstStoryChapterIndex !== undefined && chapters[firstStoryChapterIndex]
        ? chapters[firstStoryChapterIndex].title
        : 'Chapter 1';

    const storyStartBanner = isBeforeStory
      ? `
      <div class="story-quickjump-card">
        <div class="story-quickjump-header">
          <span class="story-quickjump-badge">📖 UNABRIDGED FULL EDITION</span>
          <span class="story-quickjump-subtitle">Introductory Section</span>
        </div>
        <p class="story-quickjump-desc">
          You are viewing front matter or archive terms. The complete book story begins at <strong>${firstStoryTitle}</strong>.
        </p>
        <button type="button" class="story-quickjump-btn" onclick="sendMessage({ type: 'JUMP_TO_CHAPTER', chapterIndex: ${firstStoryChapterIndex} })">
          <span>Start Reading Story: ${firstStoryTitle}</span>
          <span class="btn-arrow">→</span>
        </button>
      </div>
    `
      : '';

    const chapterEndNav = `
      <div class="chapter-nav-box">
        <div class="chapter-nav-divider"></div>
        <div class="chapter-nav-row">
          ${
            hasPrev
              ? `<button type="button" class="chapter-btn prev-btn" onclick="sendMessage({ type: 'PREV_CHAPTER' })">
                  <span class="btn-arrow">←</span> ${prevTitle}
                </button>`
              : '<div class="btn-placeholder"></div>'
          }
          ${
            hasNext
              ? `<button type="button" class="chapter-btn next-btn" onclick="sendMessage({ type: 'NEXT_CHAPTER' })">
                  ${nextTitle} <span class="btn-arrow">→</span>
                </button>`
              : '<div class="btn-placeholder"></div>'
          }
        </div>
      </div>
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      color: ${textColor};
      font-family: ${fontFamily};
      font-size: ${preferences.fontSize}px;
      line-height: ${lineHeight};
      word-break: break-word;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }
    body {
      padding: 70px 22px 120px 22px;
    }
    p {
      margin: 0 0 1.25em 0;
      text-align: justify;
      hyphens: auto;
    }
    h1, h2, h3, h4, h5, h6 {
      color: ${accentColor};
      font-family: ${fontFamily};
      line-height: 1.3;
      margin-top: 1.5em;
      margin-bottom: 0.6em;
      text-align: left;
    }
    a {
      color: ${accentColor};
      text-decoration: underline;
    }
    img, svg, image {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      margin: 1.5em auto;
      border-radius: 6px;
    }
    blockquote {
      border-left: 3px solid ${accentColor};
      padding-left: 14px;
      margin-left: 0;
      margin-right: 0;
      opacity: 0.9;
      font-style: italic;
    }
    pre, code {
      font-family: monospace;
      font-size: 0.9em;
      background: rgba(125,125,125,0.1);
      padding: 2px 4px;
      border-radius: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
    }
    th, td {
      border: 1px solid rgba(125,125,125,0.2);
      padding: 8px;
    }
    .story-quickjump-card {
      background: ${isMidnight ? 'rgba(229, 186, 88, 0.08)' : 'rgba(197, 154, 61, 0.08)'};
      border: 1px solid ${accentColor};
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 24px;
    }
    .story-quickjump-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .story-quickjump-badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: ${accentColor};
      background: ${isMidnight ? 'rgba(229, 186, 88, 0.15)' : 'rgba(197, 154, 61, 0.15)'};
      padding: 3px 8px;
      border-radius: 4px;
    }
    .story-quickjump-subtitle {
      font-size: 11px;
      color: ${isMidnight ? '#94A3B8' : '#78716C'};
    }
    .story-quickjump-desc {
      font-size: 13px !important;
      line-height: 1.5 !important;
      margin: 0 0 14px 0 !important;
      color: ${textColor} !important;
      text-align: left !important;
    }
    .story-quickjump-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: ${accentColor};
      color: ${isMidnight ? '#0B0E14' : '#FFFFFF'};
      font-weight: 700;
      font-size: 14px;
      padding: 12px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: opacity 0.2s;
    }
    .story-quickjump-btn:active {
      opacity: 0.8;
    }
    .chapter-nav-box {
      margin-top: 3.5em;
      padding-top: 1.5em;
    }
    .chapter-nav-divider {
      width: 100%;
      height: 1px;
      background: ${isMidnight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
      margin-bottom: 1.8em;
    }
    .chapter-nav-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .btn-placeholder {
      flex: 1;
    }
    .chapter-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid ${accentColor};
      background: ${isMidnight ? 'rgba(229, 186, 88, 0.08)' : 'rgba(197, 154, 61, 0.08)'};
      color: ${accentColor};
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .chapter-btn:active {
      opacity: 0.6;
      transform: scale(0.98);
    }
    .chapter-btn.next-btn {
      background: ${accentColor};
      color: ${isMidnight ? '#0B0E14' : '#FFFFFF'};
      border: none;
      font-weight: 700;
    }
    .readora-annotation {
      position: relative;
      cursor: pointer;
    }
    .readora-highlight {
      border-radius: 2px;
      padding: 1px 1px;
      color: inherit;
    }
    .readora-underline {
      text-decoration: none;
      border-bottom-width: 2.5px;
      border-bottom-style: solid;
      padding-bottom: 1px;
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
      pointer-events: auto;
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
    #annotation-popup {
      position: fixed;
      display: none;
      background: #121620;
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 20px;
      padding: 4px 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
      z-index: 10001;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      transform: translate(-50%, -115%);
      pointer-events: auto;
    }
    .ann-delete-btn {
      background: rgba(239, 68, 68, 0.18);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      cursor: pointer;
      font-family: -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  ${storyStartBanner}
  ${rawBody}
  ${chapterEndNav}

  <div id="selection-toolbar">
    <div class="swatch" style="background:#F5D061;" onclick="applyEpubAnnotation('highlight', '#F5D061')" title="Gold Highlight"></div>
    <div class="swatch" style="background:#86EFAC;" onclick="applyEpubAnnotation('highlight', '#86EFAC')" title="Emerald Highlight"></div>
    <div class="swatch" style="background:#93C5FD;" onclick="applyEpubAnnotation('highlight', '#93C5FD')" title="Sky Highlight"></div>
    <div class="swatch" style="background:#F472B6;" onclick="applyEpubAnnotation('highlight', '#F472B6')" title="Rose Highlight"></div>
    <div class="swatch" style="background:#C084FC;" onclick="applyEpubAnnotation('highlight', '#C084FC')" title="Purple Highlight"></div>
    <div class="tool-sep"></div>
    <button type="button" class="underline-btn" onclick="applyEpubAnnotation('underline', '#F5D061')">Underline</button>
  </div>

  <div id="annotation-popup">
    <button type="button" id="ann-delete-btn" class="ann-delete-btn">🗑️ Delete</button>
  </div>

  <script>
    function sendMessage(msgObj) {
      const json = JSON.stringify(msgObj);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(json);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(json, '*');
      }
    }

    function handleNavTap(clientX) {
      const isPaged = ${preferences.readingMode === 'paged'};
      if (!isPaged) {
        sendMessage({ type: 'TOGGLE_OVERLAY' });
        return;
      }
      const width = window.innerWidth;
      const zone = width * 0.22;
      if (clientX < zone) {
        sendMessage({ type: 'PREV_CHAPTER' });
      } else if (clientX > width - zone) {
        sendMessage({ type: 'NEXT_CHAPTER' });
      } else {
        sendMessage({ type: 'TOGGLE_OVERLAY' });
      }
    }

    // Touch listener with 3-zone tap support
    let startY = 0;
    let startX = 0;
    let isClick = true;

    window.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        isClick = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
      if (e.touches.length === 1) {
        const diffY = Math.abs(e.touches[0].clientY - startY);
        const diffX = Math.abs(e.touches[0].clientX - startX);
        if (diffY > 12 || diffX > 12) {
          isClick = false;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', function(e) {
      if (isClick && e.changedTouches.length === 1) {
        const target = e.target;
        if (target && (target.closest('button') || target.closest('a') || target.closest('#selection-toolbar') || target.closest('#annotation-popup') || target.closest('.readora-annotation'))) {
          return;
        }
        handleNavTap(e.changedTouches[0].clientX);
      }
    }, { passive: true });

    const chapterMap = ${JSON.stringify(
      chapters.reduce((acc: Record<string, number>, ch, idx) => {
        if (ch.href) {
          acc[ch.href] = idx;
          const fn = ch.href.split('/').pop()?.split('#')[0] || '';
          if (fn) acc[fn] = idx;
        }
        if (ch.id) {
          acc[ch.id] = idx;
        }
        return acc;
      }, {})
    )};

    // Bulletproof Link Interceptor: Prevent ANY navigation away from the reader!
    function handleLinkClick(e) {
      const link = e.target && e.target.closest('a');
      if (!link) return false;

      e.preventDefault();
      e.stopPropagation();

      const rawHref = (link.getAttribute('href') || '').trim();
      if (!rawHref || rawHref === '#') return true;

      // Case A: In-page anchor hash (e.g. #chap01 or #pg-header)
      if (rawHref.startsWith('#')) {
        const targetId = rawHref.substring(1);
        const targetEl = document.getElementById(targetId) || document.querySelector('[name="' + targetId + '"]');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        return true;
      }

      // Case B: Internal EPUB chapter link
      const cleanHref = rawHref.split('/').pop().split('#')[0] || '';
      if (chapterMap[rawHref] !== undefined || chapterMap[cleanHref] !== undefined) {
        const targetIndex = chapterMap[rawHref] !== undefined ? chapterMap[rawHref] : chapterMap[cleanHref];
        sendMessage({ type: 'JUMP_TO_CHAPTER', chapterIndex: targetIndex });
        return true;
      }

      // Case C: External web link (e.g. gutenberg.org or http/https)
      if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('mailto:')) {
        sendMessage({ type: 'OPEN_EXTERNAL_URL', url: rawHref });
        return true;
      }

      // Any other relative link: safely intercept and ignore to prevent iframe reload
      return true;
    }

    document.addEventListener('click', handleLinkClick, true);

    // Desktop browser tap zone support
    window.addEventListener('click', function(e) {
      const target = e.target;
      if (target && (target.closest('button') || target.closest('a') || target.closest('#selection-toolbar') || target.closest('#annotation-popup') || target.closest('.readora-annotation'))) {
        return;
      }
      handleNavTap(e.clientX);
    });

    // Precision reading progress scroll restoration
    let restoredScroll = false;
    const targetScrollPercent = ${initialScrollPercent && initialScrollPercent > 0 ? initialScrollPercent : 0};

    function attemptScrollRestore() {
      if (restoredScroll || targetScrollPercent <= 0) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 10) {
        const targetY = (targetScrollPercent / 100) * total;
        window.scrollTo({ top: targetY, behavior: 'instant' });
        restoredScroll = true;
      }
    }

    window.addEventListener('DOMContentLoaded', attemptScrollRestore);
    window.addEventListener('load', attemptScrollRestore);
    setTimeout(attemptScrollRestore, 60);
    setTimeout(attemptScrollRestore, 180);
    setTimeout(attemptScrollRestore, 400);

    // Scroll progress reporter with debounce
    let scrollTimeout = null;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(function() {
        scrollTimeout = null;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total > 0) {
          const percent = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
          sendMessage({
            type: 'SCROLL_PROGRESS',
            percent: percent,
            scrollY: window.scrollY
          });
        }
      }, 150);
    }, { passive: true });

    // ==========================================
    // EPUB Annotations Engine (DOM Anchors & Validation)
    // ==========================================
    window.allAnnotations = ${JSON.stringify(annotations || [])};
    const currentChapterIdx = ${currentChapterIndex};
    const bookId = "${bookId || ''}";

    function removeAnnotationWrappers() {
      const existing = document.querySelectorAll('.readora-annotation');
      existing.forEach(function(el) {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
        parent.normalize();
      });
    }

    function applyAnnotations(anns) {
      removeAnnotationWrappers();
      if (!anns || !Array.isArray(anns)) return;

      const chapterAnns = anns.filter(function(a) {
        return Number(a.chapterIndex) === Number(currentChapterIdx);
      });

      chapterAnns.forEach(function(ann) {
        if (!ann.selectedText || !ann.selectedText.trim()) return;
        const targetText = ann.selectedText.trim();

        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        let found = false;
        while ((node = walker.nextNode()) && !found) {
          if (node.parentElement && (
            node.parentElement.closest('#selection-toolbar') ||
            node.parentElement.closest('#annotation-popup') ||
            node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE'
          )) {
            continue;
          }

          const idx = node.nodeValue.indexOf(targetText);
          if (idx !== -1) {
            found = true;
            try {
              const range = document.createRange();
              range.setStart(node, idx);
              range.setEnd(node, idx + targetText.length);

              const wrapper = document.createElement(ann.type === 'underline' ? 'span' : 'mark');
              wrapper.className = 'readora-annotation ' + (ann.type === 'underline' ? 'readora-underline' : 'readora-highlight');
              wrapper.setAttribute('data-id', ann.id);

              if (ann.type === 'underline') {
                wrapper.style.borderBottomColor = ann.color || '#F5D061';
              } else {
                wrapper.style.backgroundColor = ann.color || '#F5D061';
              }

              wrapper.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                showAnnotationPopup(e.clientX, e.clientY, ann);
              };

              range.surroundContents(wrapper);
            } catch (err) {
              // Ignore boundary collision
            }
          }
        }
      });
    }

    window.updateAnnotations = function(newList) {
      window.allAnnotations = newList || [];
      applyAnnotations(window.allAnnotations);
    };

    const toolbar = document.getElementById('selection-toolbar');
    const annPopup = document.getElementById('annotation-popup');
    let activeRange = null;
    let activeSelectedText = '';

    function hideSelectionToolbar() {
      if (toolbar) toolbar.style.display = 'none';
      activeRange = null;
      activeSelectedText = '';
    }

    function hideAnnotationPopup() {
      if (annPopup) annPopup.style.display = 'none';
    }

    function handleSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        hideSelectionToolbar();
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 1) {
        hideSelectionToolbar();
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          hideSelectionToolbar();
          return;
        }

        activeRange = range.cloneRange();
        activeSelectedText = text;

        const top = Math.max(10, rect.top - 12);
        const left = Math.min(window.innerWidth - 130, Math.max(130, rect.left + rect.width / 2));

        toolbar.style.top = top + 'px';
        toolbar.style.left = left + 'px';
        toolbar.style.display = 'flex';
        hideAnnotationPopup();
      } catch (e) {
        hideSelectionToolbar();
      }
    }

    document.addEventListener('selectionchange', function() {
      setTimeout(handleSelection, 80);
    });

    window.addEventListener('mouseup', function(e) {
      if (toolbar && toolbar.contains(e.target)) return;
      if (annPopup && annPopup.contains(e.target)) return;
      setTimeout(handleSelection, 50);
    });

    window.addEventListener('touchend', function(e) {
      if (toolbar && toolbar.contains(e.target)) return;
      if (annPopup && annPopup.contains(e.target)) return;
      setTimeout(handleSelection, 100);
    });

    window.applyEpubAnnotation = function(type, color) {
      if (!activeSelectedText || !activeRange) {
        hideSelectionToolbar();
        return;
      }

      const annPayload = {
        bookId: bookId,
        type: type,
        color: color,
        selectedText: activeSelectedText,
        chapterIndex: currentChapterIdx,
        locationJson: JSON.stringify({
          format: 'EPUB',
          chapterIndex: currentChapterIdx,
          textSnippet: activeSelectedText.substring(0, 120),
        })
      };

      sendMessage({
        type: 'CREATE_ANNOTATION',
        annotation: annPayload
      });

      try {
        const wrapper = document.createElement(type === 'underline' ? 'span' : 'mark');
        wrapper.className = 'readora-annotation ' + (type === 'underline' ? 'readora-underline' : 'readora-highlight');
        if (type === 'underline') {
          wrapper.style.borderBottomColor = color || '#F5D061';
        } else {
          wrapper.style.backgroundColor = color || '#F5D061';
        }
        activeRange.surroundContents(wrapper);
      } catch (e) {}

      window.getSelection()?.removeAllRanges();
      hideSelectionToolbar();
    };

    function showAnnotationPopup(clientX, clientY, ann) {
      if (!annPopup) return;
      const top = Math.max(10, clientY - 14);
      const left = Math.min(window.innerWidth - 90, Math.max(90, clientX));

      annPopup.style.top = top + 'px';
      annPopup.style.left = left + 'px';
      annPopup.style.display = 'flex';

      const deleteBtn = document.getElementById('ann-delete-btn');
      if (deleteBtn) {
        deleteBtn.onclick = function(e) {
          e.stopPropagation();
          sendMessage({
            type: 'DELETE_ANNOTATION',
            annotationId: ann.id
          });
          const el = document.querySelector('[data-id="' + ann.id + '"]');
          if (el && el.parentNode) {
            while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
            el.parentNode.removeChild(el);
            el.parentNode.normalize();
          }
          hideAnnotationPopup();
        };
      }
    }

    window.addEventListener('click', function(e) {
      if (toolbar && toolbar.contains(e.target)) return;
      if (annPopup && annPopup.contains(e.target)) return;
      hideAnnotationPopup();
    });

    window.addEventListener('DOMContentLoaded', function() {
      applyAnnotations(window.allAnnotations);
    });
    window.addEventListener('load', function() {
      applyAnnotations(window.allAnnotations);
    });
    setTimeout(function() {
      applyAnnotations(window.allAnnotations);
    }, 200);
  </script>
</body>
</html>`;
  }, [
    currentChapter,
    currentChapterIndex,
    firstStoryChapterIndex,
    initialScrollPercent,
    chapters,
    preferences,
    annotations,
    bookId,
    bgColor,
    textColor,
    accentColor,
    fontFamily,
    lineHeight,
    hasPrev,
    hasNext,
    prevTitle,
    nextTitle,
    isMidnight,
  ]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'PREV_CHAPTER') {
          onPrevChapter();
        } else if (data.type === 'NEXT_CHAPTER') {
          onNextChapter();
        } else if (data.type === 'JUMP_TO_CHAPTER' && onJumpToChapter) {
          onJumpToChapter(data.chapterIndex);
        } else if (data.type === 'OPEN_EXTERNAL_URL' && data.url) {
          Linking.openURL(data.url).catch(() => {});
        } else if (data.type === 'TOGGLE_OVERLAY') {
          onToggleOverlay();
        } else if (data.type === 'SCROLL_PROGRESS' && onScrollProgress) {
          onScrollProgress(data.percent);
        } else if (data.type === 'CREATE_ANNOTATION' && data.annotation && onAddAnnotation) {
          onAddAnnotation(data.annotation);
        } else if (data.type === 'DELETE_ANNOTATION' && data.annotationId && onDeleteAnnotation) {
          onDeleteAnnotation(data.annotationId);
        }
      } catch {
        // ignore
      }
    },
    [onPrevChapter, onNextChapter, onJumpToChapter, onToggleOverlay, onScrollProgress, onAddAnnotation, onDeleteAnnotation]
  );

  // Synchronize annotations dynamically to WebView or iframe
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
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

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {React.createElement('iframe', {
          ref: iframeRef,
          key: `${currentChapterIndex}_${themeMode}_${preferences.fontSize}`,
          srcDoc: htmlContent,
          sandbox: 'allow-scripts allow-same-origin',
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: bgColor,
          },
          title: 'EPUB Reader',
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <WebView
        ref={webViewRef}
        key={`${currentChapterIndex}_${themeMode}_${preferences.fontSize}`}
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
});
