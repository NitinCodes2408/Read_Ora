import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';
import { UserPreferences, Chapter, ThemeMode } from '@/types';

interface EpubReaderViewProps {
  chapters: Chapter[];
  currentChapterIndex: number; // 0-based
  preferences: UserPreferences;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleOverlay: () => void;
  onScrollProgress?: (percent: number) => void;
}

export const EpubReaderView: React.FC<EpubReaderViewProps> = ({
  chapters,
  currentChapterIndex,
  preferences,
  onPrevChapter,
  onNextChapter,
  onToggleOverlay,
  onScrollProgress,
}) => {
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
    preferences.lineSpacing === 'normal'
      ? 1.5
      : preferences.lineSpacing === 'loose'
      ? 2.1
      : 1.8;

  // Build self-contained HTML page
  const htmlContent = useMemo(() => {
    const rawBody = currentChapter ? currentChapter.contentHtml || '' : '<p>No chapter content.</p>';

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
      padding: 70px 22px 100px 22px;
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
  </style>
</head>
<body>
  ${rawBody}

  <script>
    // Click / Tap listener for overlay toggle
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
        if (diffY > 10 || diffX > 10) {
          isClick = false;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', function(e) {
      if (isClick) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_OVERLAY' }));
      }
    }, { passive: true });

    // Scroll progress reporter
    window.addEventListener('scroll', function() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        const percent = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SCROLL_PROGRESS',
          percent: percent
        }));
      }
    }, { passive: true });
  </script>
</body>
</html>`;
  }, [currentChapter, preferences, bgColor, textColor, accentColor, fontFamily, lineHeight]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'TOGGLE_OVERLAY') {
        onToggleOverlay();
      } else if (data.type === 'SCROLL_PROGRESS' && onScrollProgress) {
        onScrollProgress(data.percent);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <WebView
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
