export const VINTAGE_STORY_MAX_WORDS = 35;
export const VINTAGE_STORY_MAX_ITEMS = 5;

export const VINTAGE_STORY_DEFAULT_ITEMS = [
  {
    year: '2023',
    title: 'Mulai Perkenalan',
    description:
      'Pertemuan sederhana pada sebuah sore membawa percakapan hangat yang perlahan menumbuhkan rasa saling percaya.',
  },
  {
    year: '2024',
    title: 'Menjalin Kasih',
    description:
      'Dalam perjalanan yang tenang, kami belajar saling menjaga dan berjalan beriringan melewati setiap musim.',
  },
  {
    year: '2026',
    title: 'Melangkah Bersama',
    description:
      'Dengan restu kedua orang tua, kami mengikrarkan janji suci untuk memulai lembaran hidup baru bersama.',
  },
];

export function countWords(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function clampWords(text, maxWords = VINTAGE_STORY_MAX_WORDS) {
  const raw = String(text || '');
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return raw;
  return words.slice(0, maxWords).join(' ');
}

function splitHeaderYearTitle(headerLine) {
  const clean = String(headerLine || '').trim();
  const sepMatch = clean.match(/^(.+?)\s*(?:·|\||—|–|-|:)\s*(.+)$/);
  if (sepMatch) {
    const left = sepMatch[1].trim();
    const right = sepMatch[2].trim();
    const looksLikeYear =
      /^\d{4}(?:\s*[-–/]\s*\d{2,4})?$/.test(left) ||
      /^(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}$/i.test(left) ||
      (left.length <= 12 && /\d/.test(left) && !/^(bab|chapter|bagian)\b/i.test(left));
    if (looksLikeYear) {
      return { year: left, title: right };
    }
    if (/^(bab|chapter|bagian)\b/i.test(left)) {
      return { year: '', title: right || clean };
    }
    return { year: '', title: clean };
  }
  return { year: '', title: clean };
}

export function parseVintageStory(rawStory, { fallbackToDefaults = true, enforceWordCap = false } = {}) {
  const source = String(rawStory || '').trim();
  if (!source) {
    return fallbackToDefaults ? VINTAGE_STORY_DEFAULT_ITEMS.map((item) => ({ ...item })) : [];
  }

  const blocks = source
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, VINTAGE_STORY_MAX_ITEMS);

  const fallbackTitles = ['Awal Cerita', 'Perjalanan Kami', 'Menuju Pelaminan', 'Momen Spesial', 'Babak Baru'];

  return blocks.map((block, idx) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    let year = '';
    let title = '';
    let description = '';

    if (lines.length >= 2 && lines[0].length <= 76) {
      const parsed = splitHeaderYearTitle(lines[0]);
      year = parsed.year;
      title = parsed.title;
      description = lines.slice(1).join(' ');
    } else if (lines.length === 1 && lines[0].length <= 60 && /\d{4}\s*(?:·|\||—|–|-|:)/.test(lines[0])) {
      const parsed = splitHeaderYearTitle(lines[0]);
      year = parsed.year;
      title = parsed.title;
    } else {
      title = fallbackTitles[idx] || 'Momen Spesial';
      description = lines.join(' ');
    }

    if (enforceWordCap && countWords(description) > VINTAGE_STORY_MAX_WORDS) {
      description = `${clampWords(description, VINTAGE_STORY_MAX_WORDS)}…`;
    }

    return { year, title, description };
  });
}

export function serializeVintageStory(items) {
  if (!Array.isArray(items)) return '';
  return items
    .slice(0, VINTAGE_STORY_MAX_ITEMS)
    .map((item) => {
      const year = String(item?.year || '').trim();
      const title = String(item?.title || '').trim();
      const desc = clampWords(String(item?.description || '').trim(), VINTAGE_STORY_MAX_WORDS);
      const header = [year, title].filter(Boolean).join(' · ');
      if (header && desc) return `${header}\n${desc}`;
      return header || desc;
    })
    .filter(Boolean)
    .join('\n\n');
}
