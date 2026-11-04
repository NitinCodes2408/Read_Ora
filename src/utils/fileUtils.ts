import { BookFormat } from '@/types';

/**
 * Format bytes into readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Determine BookFormat from filename or mime type
 */
export function detectBookFormat(filename: string, mimeType?: string): BookFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') {
    return 'PDF';
  }
  if (lower.endsWith('.epub') || mimeType === 'application/epub+zip') {
    return 'EPUB';
  }
  if (lower.endsWith('.txt') || mimeType === 'text/plain') {
    return 'TXT';
  }
  return null;
}

/**
 * Clean filename into a human-readable title
 * E.g. "Atomic_Habits_James_Clear.epub" -> "Atomic Habits James Clear"
 */
export function deriveTitleFromFilename(filename: string): string {
  // Strip extension
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  // Replace underscores and multiple dashes with spaces
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').trim();
  return cleaned || filename;
}

/**
 * Format and normalize author names
 * E.g. "Das, Gaur Gopal;" -> "Gaur Gopal Das", "Kiyosaki, Robert T." -> "Robert T. Kiyosaki"
 */
export function formatAuthorName(rawAuthor?: string): string {
  if (!rawAuthor) return 'Unknown Author';

  let cleaned = rawAuthor
    .replace(/[;\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove surrounding quotes, semicolons, or parentheses
  cleaned = cleaned.replace(/^["'([{\s;,]+|[)"'\]}\s;,]+$/g, '').trim();

  // If author is formatted as "LastName, FirstName"
  if (cleaned.includes(',') && !cleaned.includes('&') && !cleaned.includes(' and ')) {
    const parts = cleaned.split(',').map((p) => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      cleaned = `${parts[1]} ${parts[0]}`;
    }
  }

  // Reject generic tool/machine strings that are not real authors
  const lower = cleaned.toLowerCase();
  const invalidKeywords = [
    'unknown',
    'anonymous',
    'adobe',
    'scanner',
    'microsoft',
    'acrobat',
    'canon',
    'hp scan',
    'pdf',
    'wkhtmltopdf',
    'calibre',
    'ghostscript',
    'printer',
    'printers',
    'printers1',
    'printer1',
    'print',
    'admin',
    'administrator',
    'desktop',
    'user',
    'pc',
    'pmd',
    'indesign',
    'distiller',
    'coreldraw',
    'photoshop',
    'scan',
    'scanned',
    'untitled',
  ];

  if (
    invalidKeywords.some(
      (kw) =>
        lower === kw ||
        lower.startsWith(kw + ' ') ||
        lower.startsWith(kw + '_') ||
        lower.startsWith(kw + '-') ||
        lower.endsWith(' ' + kw) ||
        /^printers?\d*$/i.test(lower) ||
        /^users?\d*$/i.test(lower) ||
        /^admin\d*$/i.test(lower)
    )
  ) {
    return 'Unknown Author';
  }

  return cleaned || 'Unknown Author';
}

/**
 * Knowledge base of world-famous bestsellers and classics for instant, zero-lag author resolution
 */
const KNOWN_TITLE_AUTHORS: Record<string, string> = {
  'rich dad poor dad': 'Robert T. Kiyosaki',
  'wings of fire': 'A. P. J. Abdul Kalam & Arun Tiwari',
  'wing of fire': 'A. P. J. Abdul Kalam & Arun Tiwari',
  'wingoffine': 'A. P. J. Abdul Kalam & Arun Tiwari',
  'wingoffire': 'A. P. J. Abdul Kalam & Arun Tiwari',
  'wingoffine intro': 'A. P. J. Abdul Kalam & Arun Tiwari',
  'shyamachi aai': 'Sane Guruji',
  'shyamchi aai': 'Sane Guruji',
  'sane guruji': 'Sane Guruji',
  'atomic habits': 'James Clear',
  'think and grow rich': 'Napoleon Hill',
  'the alchemist': 'Paulo Coelho',
  'alchemist': 'Paulo Coelho',
  'the psychology of money': 'Morgan Housel',
  'psychology of money': 'Morgan Housel',
  'zero to one': 'Peter Thiel',
  'deep work': 'Cal Newport',
  'sapiens': 'Yuval Noah Harari',
  'homo deus': 'Yuval Noah Harari',
  '1984': 'George Orwell',
  'animal farm': 'George Orwell',
  'to kill a mockingbird': 'Harper Lee',
  'pride and prejudice': 'Jane Austen',
  'the great gatsby': 'F. Scott Fitzgerald',
  'great gatsby': 'F. Scott Fitzgerald',
  'steve jobs': 'Walter Isaacson',
  'elon musk': 'Walter Isaacson',
  'energize your mind': 'Gaur Gopal Das',
  'life amazing secrets': 'Gaur Gopal Das',
  'the power of your subconscious mind': 'Joseph Murphy',
  'power of your subconscious mind': 'Joseph Murphy',
  'how to win friends and influence people': 'Dale Carnegie',
  'the 7 habits of highly effective people': 'Stephen R. Covey',
  '7 habits of highly effective people': 'Stephen R. Covey',
  'ikigai': 'Héctor García & Francesc Miralles',
  'man search for meaning': 'Viktor E. Frankl',
  'mans search for meaning': 'Viktor E. Frankl',
  'the subtle art of not giving a fuck': 'Mark Manson',
  'the subtle art of not giving a f ck': 'Mark Manson',
  'can t hurt me': 'David Goggins',
  'cant hurt me': 'David Goggins',
  'war and peace': 'Leo Tolstoy',
  'crime and punishment': 'Fyodor Dostoevsky',
  'the idiot': 'Fyodor Dostoevsky',
  'meditations': 'Marcus Aurelius',
  'the prince': 'Niccolò Machiavelli',
  'the art of war': 'Sun Tzu',
  'art of war': 'Sun Tzu',
  'geetanjali': 'Rabindranath Tagore',
  'gitanjali': 'Rabindranath Tagore',
  'malgudi days': 'R. K. Narayan',
  'the guide': 'R. K. Narayan',
  'godan': 'Munshi Premchand',
  'discovery of india': 'Jawaharlal Nehru',
  'the discovery of india': 'Jawaharlal Nehru',
  'my experiments with truth': 'Mahatma Gandhi',
  'the story of my experiments with truth': 'Mahatma Gandhi',
  'bhagavad gita': 'Vyasa',
  'the bhagavad gita': 'Vyasa',
};

/**
 * Resolve author from book title using knowledge base
 */
export function getKnownAuthor(title: string): string | undefined {
  if (!title) return undefined;
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Exact match
  if (KNOWN_TITLE_AUTHORS[normalized]) {
    return KNOWN_TITLE_AUTHORS[normalized];
  }

  // Partial substring match
  for (const [key, author] of Object.entries(KNOWN_TITLE_AUTHORS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return author;
    }
  }

  return undefined;
}

/**
 * Attempt to extract both title and author from filenames structured like:
 * "Title by Author.ext", "Author - Title.ext", "Title - Author.ext", "[Author] Title.ext"
 */
export function parseTitleAndAuthor(filename: string): { title: string; author: string } {
  const withoutExt = filename.replace(/\.[^/.]+$/, '').trim();

  // Pattern 1: "Title by Author" or "Title_by_Author"
  const byMatch = withoutExt.match(/^(.+?)(?:\s+by\s+|[_\-]by[_\-])(.+)$/i);
  if (byMatch && byMatch[1] && byMatch[2]) {
    const rawTitle = byMatch[1].replace(/[_-]+/g, ' ').trim();
    const rawAuthor = byMatch[2].replace(/[_-]+/g, ' ').trim();
    return {
      title: rawTitle || 'Untitled',
      author: formatAuthorName(rawAuthor),
    };
  }

  // Pattern 2: "[Author] Title" or "(Author) Title"
  const bracketAuthorMatch = withoutExt.match(/^[[(]([^[\]()]+)[\])]\s*(.+)$/);
  if (bracketAuthorMatch && bracketAuthorMatch[1] && bracketAuthorMatch[2]) {
    const rawAuthor = bracketAuthorMatch[1].replace(/[_-]+/g, ' ').trim();
    const rawTitle = bracketAuthorMatch[2].replace(/[_-]+/g, ' ').trim();
    return {
      title: rawTitle || 'Untitled',
      author: formatAuthorName(rawAuthor),
    };
  }

  // Pattern 3: "Title (Author)" or "Title [Author]"
  const bracketTitleMatch = withoutExt.match(/^(.+?)\s*[[(]([^[\]()]+)[\])]$/);
  if (bracketTitleMatch && bracketTitleMatch[1] && bracketTitleMatch[2]) {
    const rawTitle = bracketTitleMatch[1].replace(/[_-]+/g, ' ').trim();
    const rawAuthor = bracketTitleMatch[2].replace(/[_-]+/g, ' ').trim();
    return {
      title: rawTitle || 'Untitled',
      author: formatAuthorName(rawAuthor),
    };
  }

  // Pattern 4: "Author - Title" or "Title - Author"
  if (withoutExt.includes(' - ')) {
    const parts = withoutExt.split(' - ');
    if (parts.length === 2) {
      const part1 = parts[0].replace(/[_-]+/g, ' ').trim();
      const part2 = parts[1].replace(/[_-]+/g, ' ').trim();

      // Check if part1 or part2 is a known author or title
      const authorFromPart1 = getKnownAuthor(part2);
      if (authorFromPart1) {
        return { title: part2, author: authorFromPart1 };
      }

      const authorFromPart2 = getKnownAuthor(part1);
      if (authorFromPart2) {
        return { title: part1, author: authorFromPart2 };
      }

      return {
        title: part1 || 'Untitled',
        author: formatAuthorName(part2),
      };
    }
  }

  const derivedTitle = deriveTitleFromFilename(filename);
  const known = getKnownAuthor(derivedTitle);

  return {
    title: derivedTitle,
    author: known || 'Unknown Author',
  };
}

/**
 * Sanitize filename for safe local disk storage
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Format date into readable string (e.g. "Oct 28, 2026")
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
