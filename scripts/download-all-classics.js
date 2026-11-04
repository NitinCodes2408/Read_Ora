const fs = require('fs');
const path = require('path');

const publicBooksDir = path.join(__dirname, '..', 'public', 'books');
const assetsBooksDir = path.join(__dirname, '..', 'assets', 'books');

if (!fs.existsSync(publicBooksDir)) fs.mkdirSync(publicBooksDir, { recursive: true });
if (!fs.existsSync(assetsBooksDir)) fs.mkdirSync(assetsBooksDir, { recursive: true });

const gutenbergBooks = [
  { id: 'curated_art_of_war', gutenbergId: 132, title: 'The Art of War' },
  { id: 'curated_meditations', gutenbergId: 2680, title: 'Meditations' },
  { id: 'curated_sherlock_holmes', gutenbergId: 1661, title: 'The Adventures of Sherlock Holmes' },
  { id: 'curated_pride_and_prejudice', gutenbergId: 1342, title: 'Pride and Prejudice' },
  { id: 'curated_frankenstein', gutenbergId: 84, title: 'Frankenstein' },
  { id: 'curated_great_gatsby', gutenbergId: 64317, title: 'The Great Gatsby' },
  { id: 'curated_alice_in_wonderland', gutenbergId: 11, title: "Alice's Adventures in Wonderland" },
  { id: 'curated_dorian_gray', gutenbergId: 174, title: 'The Picture of Dorian Gray' },
  { id: 'curated_metamorphosis', gutenbergId: 5200, title: 'The Metamorphosis' },
  { id: 'curated_the_prince', gutenbergId: 1232, title: 'The Prince' },
  { id: 'curated_time_machine', gutenbergId: 35, title: 'The Time Machine' },
  { id: 'curated_the_republic', gutenbergId: 1497, title: 'The Republic' },
  { id: 'curated_dracula', gutenbergId: 345, title: 'Dracula' },
  { id: 'curated_tale_of_two_cities', gutenbergId: 98, title: 'A Tale of Two Cities' },
  { id: 'curated_beyond_good_and_evil', gutenbergId: 4363, title: 'Beyond Good and Evil' },
  { id: 'curated_the_raven', gutenbergId: 1065, title: 'The Raven and Selected Poems' },
  { id: 'curated_gitanjali', gutenbergId: 7164, title: 'Gitanjali' },
  { id: 'curated_bhagavad_gita', gutenbergId: 2388, title: 'The Song Celestial: Bhagavad Gita' },
  { id: 'curated_vivekachudamani', gutenbergId: 34125, title: 'The Crest-Jewel of Wisdom: Vivekachudamani' },
];

async function downloadBook(book) {
  const filename = `${book.id}.epub`;
  const destPublic = path.join(publicBooksDir, filename);
  const destAssets = path.join(assetsBooksDir, filename);

  if (fs.existsSync(destPublic) && fs.statSync(destPublic).size > 10000) {
    console.log(`[Already exists] ${book.title} (${fs.statSync(destPublic).size} bytes)`);
    if (!fs.existsSync(destAssets)) fs.copyFileSync(destPublic, destAssets);
    return;
  }

  const url = `https://www.gutenberg.org/cache/epub/${book.gutenbergId}/pg${book.gutenbergId}.epub`;
  console.log(`Downloading ${book.title} from ${url}...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch ${book.title}: HTTP ${res.status}`);
      return;
    }

    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    fs.writeFileSync(destPublic, buffer);
    fs.writeFileSync(destAssets, buffer);
    console.log(`Saved ${book.title} (${buffer.length} bytes) to public & assets`);
  } catch (err) {
    console.error(`Error downloading ${book.title}:`, err.message);
  }
}

async function run() {
  console.log(`Starting download of ${gutenbergBooks.length} full-text Gutenberg books...`);
  for (const book of gutenbergBooks) {
    await downloadBook(book);
    // Pause briefly to be polite to Gutenberg servers
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log('Finished downloading Gutenberg books!');
}

run();
