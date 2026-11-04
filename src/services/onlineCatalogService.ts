import { CuratedBook, BookAvailability } from '@/types';
import { CURATED_CLASSICS } from '@/data/curatedClassics';
import { formatAuthorName } from '@/utils/fileUtils';

const searchMemoryCache = new Map<string, CuratedBook[]>();

/**
 * Check if the user query is an ISBN-10 or ISBN-13
 */
function isIsbnQuery(q: string): boolean {
  const cleaned = q.replace(/[-\s]/g, '');
  return /^(97(8|9))?\d{9}[\dX]$/i.test(cleaned);
}

/**
 * Convert language code to friendly name
 */
function formatLanguageName(code?: string): string | undefined {
  if (!code) return undefined;
  const c = code.toLowerCase().trim();
  const map: Record<string, string> = {
    en: 'English',
    eng: 'English',
    hi: 'Hindi',
    hin: 'Hindi',
    mr: 'Marathi',
    mar: 'Marathi',
    fr: 'French',
    fra: 'French',
    fre: 'French',
    de: 'German',
    deu: 'German',
    ger: 'German',
    es: 'Spanish',
    spa: 'Spanish',
    ru: 'Russian',
    rus: 'Russian',
    sa: 'Sanskrit',
    san: 'Sanskrit',
  };
  return map[c] || (c.length <= 3 ? c.toUpperCase() : c.charAt(0).toUpperCase() + c.slice(1));
}

/**
 * Smart Book Availability Classifier (Phase 2 - 5 Tier Classification)
 * Accurately determines legal access permissions for online catalog books
 */
export function classifyBookAvailability(
  provider: 'gutenberg' | 'openlibrary' | 'googlebooks' | 'curated',
  details: {
    publishedYear?: string;
    openLibraryKey?: string;
    iaId?: string;
    ebookAccess?: string;
    hasFullText?: boolean;
    googleAccessInfo?: any;
    googleSaleInfo?: any;
    googleVolumeInfo?: any;
  }
): BookAvailability {
  // 1. Curated Classics & Gutenberg are always 100% Free Full-Text
  if (provider === 'gutenberg' || provider === 'curated') {
    return {
      tier: 'free_full',
      label: 'Free Full Text',
      badgeColor: '#22C55E', // Green
      badgeBg: 'rgba(34, 197, 94, 0.16)',
      canAddToLibrary: true,
      canReadInApp: true,
      description: 'Verified public-domain edition curated from Project Gutenberg. Free to read & add to your library.',
    };
  }

  // 2. Open Library Books
  if (provider === 'openlibrary') {
    const { iaId, ebookAccess, hasFullText, openLibraryKey, publishedYear } = details;
    const yearNum = parseInt(publishedYear || '9999', 10);
    const isPublicDomainYear = !isNaN(yearNum) && yearNum < 1928;

    // Free full text via Internet Archive or Public Domain
    if (iaId && (ebookAccess === 'public' || hasFullText || isPublicDomainYear)) {
      return {
        tier: 'free_full',
        label: 'Free Full Text',
        badgeColor: '#22C55E',
        badgeBg: 'rgba(34, 197, 94, 0.16)',
        canAddToLibrary: true,
        canReadInApp: true,
        previewUrl: `https://archive.org/details/${iaId}`,
        description: 'Open access public digital edition hosted by the Internet Archive & Open Library. Free to read.',
      };
    }

    // Digital Library Borrowing
    if (ebookAccess === 'borrowable' || ebookAccess === 'printdisabled' || (iaId && ebookAccess !== 'unborrowable')) {
      const borrowUrl = openLibraryKey ? `https://openlibrary.org${openLibraryKey}` : `https://archive.org/details/${iaId}`;
      return {
        tier: 'borrow',
        label: 'Borrow on Open Library',
        badgeColor: '#38BDF8', // Sky blue
        badgeBg: 'rgba(56, 189, 248, 0.16)',
        canAddToLibrary: false,
        canReadInApp: false,
        borrowUrl,
        description: 'Available for digital lending via Open Library & Internet Archive digital lending library.',
      };
    }

    // Public Domain by publish year if older than 1928
    if (isPublicDomainYear) {
      return {
        tier: 'free_full',
        label: 'Public Domain',
        badgeColor: '#22C55E',
        badgeBg: 'rgba(34, 197, 94, 0.16)',
        canAddToLibrary: true,
        canReadInApp: true,
        description: 'Public-domain literary work first published before 1928. Free to read.',
      };
    }

    // Commercial or Catalog record
    const infoUrl = openLibraryKey ? `https://openlibrary.org${openLibraryKey}` : undefined;
    return {
      tier: 'commercial',
      label: 'Commercial Edition',
      badgeColor: '#E5BA58', // Gold
      badgeBg: 'rgba(229, 186, 88, 0.16)',
      canAddToLibrary: false,
      canReadInApp: false,
      infoUrl,
      description: 'Copyright-protected commercial publication. Bibliographic catalog entry from Open Library.',
    };
  }

  // 3. Google Books
  if (provider === 'googlebooks') {
    const { googleAccessInfo, googleSaleInfo, googleVolumeInfo } = details;
    const viewability = googleAccessInfo?.viewability;
    const isEbook = googleSaleInfo?.isEbook;
    const saleability = googleSaleInfo?.saleability;
    const previewLink = googleVolumeInfo?.previewLink || googleAccessInfo?.webReaderLink;
    const infoLink = googleVolumeInfo?.infoLink;

    if (viewability === 'FULL_PUBLIC_DOMAIN' || viewability === 'ALL_PAGES' || (isEbook && saleability === 'FREE')) {
      return {
        tier: 'free_full',
        label: 'Free Full Text',
        badgeColor: '#22C55E',
        badgeBg: 'rgba(34, 197, 94, 0.16)',
        canAddToLibrary: true,
        canReadInApp: true,
        previewUrl: previewLink,
        infoUrl: infoLink,
        description: 'Authorized public domain or free full-text publication on Google Books. Free to read.',
      };
    }

    if (viewability === 'PARTIAL' || viewability === 'SAMPLE') {
      return {
        tier: 'preview',
        label: 'Preview Available',
        badgeColor: '#F59E0B', // Amber
        badgeBg: 'rgba(245, 158, 11, 0.16)',
        canAddToLibrary: false,
        canReadInApp: true,
        previewUrl: previewLink,
        infoUrl: infoLink,
        description: 'Authorized publisher preview with sample chapters available via Google Books.',
      };
    }

    if (saleability === 'FOR_SALE' || saleability === 'FOR_SALE_AND_RENTAL') {
      return {
        tier: 'commercial',
        label: 'Commercial Edition',
        badgeColor: '#E5BA58',
        badgeBg: 'rgba(229, 186, 88, 0.16)',
        canAddToLibrary: false,
        canReadInApp: false,
        infoUrl: infoLink,
        description: 'Commercial copyrighted edition. Purchase and details available on Google Books / Store.',
      };
    }

    return {
      tier: 'metadata_only',
      label: 'Catalog Record',
      badgeColor: '#94A3B8', // Slate
      badgeBg: 'rgba(148, 163, 184, 0.16)',
      canAddToLibrary: false,
      canReadInApp: false,
      infoUrl: infoLink,
      description: 'Bibliographic catalog entry. No authorized online preview is currently published.',
    };
  }

  // Fallback
  return {
    tier: 'free_full',
    label: 'Public Domain',
    badgeColor: '#22C55E',
    badgeBg: 'rgba(34, 197, 94, 0.16)',
    canAddToLibrary: true,
    canReadInApp: true,
    description: 'Public-domain classic book.',
  };
}

/**
 * Infer book category from subject tags
 */
function inferCategory(
  subjects: string[] = []
): 'Classics' | 'Philosophy' | 'Science' | 'Fiction' | 'History' | 'Poetry' {
  const combined = subjects.join(' ').toLowerCase();
  if (combined.includes('philosophy') || combined.includes('ethics') || combined.includes('stoic') || combined.includes('spirituality')) {
    return 'Philosophy';
  }
  if (combined.includes('science') || combined.includes('physics') || combined.includes('nature') || combined.includes('astronomy') || combined.includes('mathematics')) {
    return 'Science';
  }
  if (combined.includes('poetry') || combined.includes('poem') || combined.includes('verse')) {
    return 'Poetry';
  }
  if (combined.includes('history') || combined.includes('biography') || combined.includes('war') || combined.includes('revolution')) {
    return 'History';
  }
  if (combined.includes('fiction') || combined.includes('novel') || combined.includes('adventure') || combined.includes('mystery') || combined.includes('humor')) {
    return 'Fiction';
  }
  return 'Classics';
}

/**
 * Query Open Library API with selective fields
 */
async function fetchFromOpenLibrary(
  query: string,
  categoryFilter: string,
  signal: AbortSignal
): Promise<CuratedBook[]> {
  try {
    const isIsbn = isIsbnQuery(query);
    const searchParam = isIsbn
      ? `isbn:${query.replace(/[-\s]/g, '')}`
      : query.trim();

    const fields = 'key,title,author_name,cover_i,first_publish_year,ia,subject,number_of_pages_median,edition_count,publisher,isbn,ebook_access,has_fulltext,language,first_sentence';
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchParam)}&limit=12&fields=${fields}`;

    const res = await fetch(url, { signal });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.docs)) return [];

    const list: CuratedBook[] = [];

    for (const doc of data.docs) {
      const rawTitle = (doc.title || 'Untitled').trim();
      const rawAuthor = doc.author_name?.[0] || 'Unknown Author';
      const author = formatAuthorName(rawAuthor);
      const category = inferCategory(doc.subject);

      if (categoryFilter !== 'All' && category !== categoryFilter) {
        continue;
      }

      const publishedYear = doc.first_publish_year
        ? `${doc.first_publish_year}`
        : 'Classic';

      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : `https://www.gutenberg.org/cache/epub/132/pg132.cover.medium.jpg`;

      const iaId = doc.ia?.[0];
      const downloadUrl = iaId
        ? `https://archive.org/download/${iaId}/${iaId}.epub`
        : `https://www.gutenberg.org/ebooks/132.epub3.images`;

      const fallbackTextUrl = iaId
        ? `https://archive.org/stream/${iaId}/${iaId}_djvu.txt`
        : undefined;

      const estimatedPages = doc.number_of_pages_median || 180;
      const description =
        doc.first_sentence?.[0] ||
        `Classic work by ${author}, first published in ${publishedYear}. Public-domain edition from Open Library.`;

      const isbn = doc.isbn?.[0];
      const publisher = doc.publisher?.[0];
      const language = formatLanguageName(doc.language?.[0]);

      // Phase 2: 5-Tier Availability Classification
      const availability = classifyBookAvailability('openlibrary', {
        openLibraryKey: doc.key,
        iaId,
        ebookAccess: doc.ebook_access,
        hasFullText: doc.has_fulltext,
        publishedYear,
      });

      list.push({
        id: `ol_${(doc.key || Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '_')}`,
        openLibraryKey: doc.key,
        isbn,
        publisher,
        provider: 'openlibrary',
        title: rawTitle,
        author,
        category,
        description,
        format: 'EPUB',
        language,
        availability,
        coverUrl,
        downloadUrl,
        fallbackTextUrl,
        fileSizeBytes: 260000,
        publishedYear,
        estimatedPages,
        badge: availability.label,
      });

      if (list.length >= 10) break;
    }

    return list;
  } catch {
    return [];
  }
}

/**
 * Query Google Books API as secondary/parallel provider
 */
async function fetchFromGoogleBooks(
  query: string,
  categoryFilter: string,
  signal: AbortSignal
): Promise<CuratedBook[]> {
  try {
    const isIsbn = isIsbnQuery(query);
    const searchParam = isIsbn
      ? `isbn:${query.replace(/[-\s]/g, '')}`
      : query.trim();

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchParam)}&maxResults=6`;
    const res = await fetch(url, { signal });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return [];

    const list: CuratedBook[] = [];

    for (const item of data.items) {
      const vInfo = item.volumeInfo;
      if (!vInfo || !vInfo.title) continue;

      const rawTitle = vInfo.title.trim();
      const rawAuthor = vInfo.authors?.[0] || 'Unknown Author';
      const author = formatAuthorName(rawAuthor);
      const category = inferCategory(vInfo.categories);

      if (categoryFilter !== 'All' && category !== categoryFilter) {
        continue;
      }

      const publishedYear = vInfo.publishedDate
        ? vInfo.publishedDate.substring(0, 4)
        : 'Classic';

      // Upgrade thumbnail to https
      let coverUrl = vInfo.imageLinks?.thumbnail || vInfo.imageLinks?.smallThumbnail;
      if (coverUrl) {
        coverUrl = coverUrl.replace(/^http:\/\//i, 'https://');
      } else {
        coverUrl = `https://www.gutenberg.org/cache/epub/132/pg132.cover.medium.jpg`;
      }

      const isbn = vInfo.industryIdentifiers?.[0]?.identifier;
      const publisher = vInfo.publisher;
      const description = vInfo.description || `Work by ${author} published by ${publisher || 'various publishers'}.`;
      const language = formatLanguageName(vInfo.language);

      // Phase 2: 5-Tier Availability Classification
      const availability = classifyBookAvailability('googlebooks', {
        googleAccessInfo: item.accessInfo,
        googleSaleInfo: item.saleInfo,
        googleVolumeInfo: vInfo,
        publishedYear,
      });

      list.push({
        id: `gb_${item.id}`,
        googleBooksId: item.id,
        isbn,
        publisher,
        provider: 'googlebooks',
        title: rawTitle,
        author,
        category,
        description,
        format: 'EPUB',
        language,
        availability,
        coverUrl,
        downloadUrl: item.accessInfo?.epub?.downloadLink || `https://www.gutenberg.org/ebooks/132.epub3.images`,
        fileSizeBytes: 280000,
        publishedYear,
        estimatedPages: vInfo.pageCount || 200,
        badge: availability.label,
      });

      if (list.length >= 6) break;
    }

    return list;
  } catch {
    return [];
  }
}

/**
 * Phase 1 & 2: Dual-Provider Global Search with Smart Availability Classification
 */
export async function searchGlobalBooks(
  query: string,
  categoryFilter = 'All'
): Promise<CuratedBook[]> {
  const enrichCurated = (b: CuratedBook): CuratedBook => ({
    ...b,
    language: b.language || 'English',
    availability:
      b.availability ||
      classifyBookAvailability('curated', { publishedYear: b.publishedYear }),
  });

  const q = query.trim().toLowerCase();
  if (!q) {
    const list = CURATED_CLASSICS.map(enrichCurated);
    if (categoryFilter === 'All') return list;
    return list.filter(
      (b) =>
        b.category === categoryFilter ||
        (categoryFilter === 'Indian Heritage' &&
          (b.collection === 'Indian Heritage' ||
            b.language === 'Marathi' ||
            b.language === 'Hindi'))
    );
  }

  // 1. Instant local curated matches (0ms latency)
  const localMatches = CURATED_CLASSICS.filter((b) => {
    const matchesQuery =
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.language && b.language.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === 'All' ||
      b.category === categoryFilter ||
      (categoryFilter === 'Indian Heritage' &&
        (b.collection === 'Indian Heritage' ||
          b.language === 'Marathi' ||
          b.language === 'Hindi'));

    return matchesQuery && matchesCategory;
  }).map(enrichCurated);

  const cacheKey = `${q}__${categoryFilter}`;
  if (searchMemoryCache.has(cacheKey)) {
    return searchMemoryCache.get(cacheKey)!;
  }

  // 2. Query Open Library & Google Books API concurrently
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const [openLibResults, googleBooksResults] = await Promise.all([
      fetchFromOpenLibrary(query, categoryFilter, controller.signal),
      fetchFromGoogleBooks(query, categoryFilter, controller.signal),
    ]);
    clearTimeout(timeoutId);

    const mergedOnline: CuratedBook[] = [];
    const seenTitles = new Set<string>(localMatches.map((b) => b.title.toLowerCase().trim()));

    // Interleave/combine results from both providers without duplicate titles
    const maxLen = Math.max(openLibResults.length, googleBooksResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < openLibResults.length) {
        const book = openLibResults[i];
        const key = book.title.toLowerCase().trim();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          mergedOnline.push(book);
        }
      }
      if (i < googleBooksResults.length) {
        const book = googleBooksResults[i];
        const key = book.title.toLowerCase().trim();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          mergedOnline.push(book);
        }
      }
    }

    const finalResults = [...localMatches, ...mergedOnline];
    searchMemoryCache.set(cacheKey, finalResults);
    return finalResults;
  } catch {
    // Network failure: return local curated matches safely
  }

  return localMatches;
}
