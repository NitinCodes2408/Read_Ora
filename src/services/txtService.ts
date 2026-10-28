import * as FileSystem from 'expo-file-system/legacy';

export interface ParsedTxt {
  rawText: string;
  totalPages: number;
  pages: string[];
  sections: { title: string; pageIndex: number }[];
}

const CHARACTERS_PER_PAGE = 1400;

/**
 * Load and paginate plain text files
 */
export async function loadTxtBook(fileUri: string): Promise<ParsedTxt> {
  const raw = await FileSystem.readAsStringAsync(fileUri);
  const normalized = raw.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return {
      rawText: 'This document is empty.',
      totalPages: 1,
      pages: ['This document is empty.'],
      sections: [{ title: 'Start', pageIndex: 0 }],
    };
  }

  // Split into paragraphs
  const paragraphs = normalized.split(/\n\s*\n/);
  const pages: string[] = [];
  const sections: { title: string; pageIndex: number }[] = [];

  let currentPageText = '';

  paragraphs.forEach((para) => {
    const trimmed = para.trim();
    if (!trimmed) return;

    // Detect chapter headings (e.g. Chapter 1, CHAPTER II, Part 1, Act I)
    const isHeading = /^(chapter|part|book|section|act)\s+[0-9ivxlcdm]+/i.test(trimmed) ||
      (trimmed.length < 50 && /^[A-Z0-9\s—–:-]+$/.test(trimmed));

    if (isHeading) {
      if (currentPageText.length > 0) {
        pages.push(currentPageText.trim());
        currentPageText = '';
      }
      sections.push({
        title: trimmed.substring(0, 40),
        pageIndex: pages.length,
      });
    }

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

  if (sections.length === 0) {
    // Generate evenly distributed navigation markers if no explicit chapters found
    const step = Math.max(1, Math.floor(pages.length / 5));
    for (let i = 0; i < pages.length; i += step) {
      sections.push({
        title: `Page ${i + 1}`,
        pageIndex: i,
      });
    }
  }

  return {
    rawText: normalized,
    totalPages: Math.max(1, pages.length),
    pages: pages.length > 0 ? pages : [normalized],
    sections,
  };
}
