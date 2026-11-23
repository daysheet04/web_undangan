export const VINTAGE_COLOR_DEFAULTS = Object.freeze({
  bg: '#F4F0E8',
  surface: '#FAF7F1',
  ink: '#2A231E',
  accent: '#7C6850',
  ornament: '#302720',
  photo_border: '#FAF7F1',
  btn_bg: '#2A231E',
  btn_text: '#FBF9F5',
  cover_title: '#2A231E',
  cover_subtitle: '#7C6850',
  cover_body: '#63584D',
  body_title: '#2A231E',
  body_subtitle: '#7C6850',
  body_text: '#63584D',
});

export const VINTAGE_COLOR_GROUPS = Object.freeze([
  {
    id: 'surface',
    title: 'Latar, Ornamen & Garis',
    hint: 'Warna dasar halaman, kartu, ukiran ornamen & bingkai foto',
  },
  {
    id: 'button',
    title: 'Warna Tombol Aksi',
    hint: 'Terpisah dari teks — dipakai di tombol Buka Undangan, Peta, RSVP, Salin & Musik',
  },
  {
    id: 'cover_text',
    title: 'Teks Section Buka Undangan (Sampul)',
    hint: 'Hanya mengatur warna teks di halaman sampul sebelum undangan dibuka',
  },
  {
    id: 'body_text',
    title: 'Teks Isi Undangan (The Wedding Of – Terima Kasih)',
    hint: 'Mengatur warna teks seluruh bagian setelah undangan dibuka hingga penutup Terima Kasih',
  },
]);

export const VINTAGE_COLOR_FIELDS = Object.freeze([
  {
    key: 'bg',
    group: 'surface',
    formName: 'theme_color_bg',
    label: 'Latar Utama',
    description: 'Dipakai untuk kanvas / background utama seluruh halaman undangan',
  },
  {
    key: 'surface',
    group: 'surface',
    formName: 'theme_color_surface',
    label: 'Latar Kartu & Surat',
    description: 'Dipakai untuk latar kartu sampul, kutipan, jadwal acara, RSVP & amplop',
  },
  {
    key: 'ornament',
    group: 'surface',
    formName: 'theme_color_ornament',
    label: 'Ornamen Hiasan',
    description: 'Dipakai untuk ukiran floral, merpati, karangan bunga & siluet',
  },
  {
    key: 'photo_border',
    group: 'surface',
    formName: 'theme_color_photo_border',
    label: 'Border & Bingkai Foto',
    description: 'Dipakai untuk bingkai/matte foto sampul, profil mempelai & galeri',
  },
  {
    key: 'accent',
    group: 'surface',
    formName: 'theme_color_accent',
    label: 'Garis & Aksen Bingkai',
    description: 'Dipakai untuk garis pemisah, bingkai halus kartu & ikon dekoratif',
  },
  {
    key: 'btn_bg',
    group: 'button',
    formName: 'theme_color_btn_bg',
    label: 'Warna Latar Tombol',
    description: 'Dipakai untuk tombol Buka Undangan, Buka Peta, Kirim Ucapan, Salin & Musik',
  },
  {
    key: 'btn_text',
    group: 'button',
    formName: 'theme_color_btn_text',
    label: 'Warna Teks Tombol',
    description: 'Dipakai untuk tulisan & ikon di dalam semua tombol aksi undangan',
  },
  {
    key: 'cover_title',
    group: 'cover_text',
    formName: 'theme_color_cover_title',
    label: 'Judul Sampul (Cover)',
    description: 'Dipakai untuk nama kedua mempelai di halaman Buka Undangan',
  },
  {
    key: 'cover_subtitle',
    group: 'cover_text',
    formName: 'theme_color_cover_subtitle',
    label: 'Subjudul Sampul (Cover)',
    description: 'Dipakai untuk label "The Wedding Invitation", simbol "&" & "Kepada Yth."',
  },
  {
    key: 'cover_body',
    group: 'cover_text',
    formName: 'theme_color_cover_body',
    label: 'Isi Sampul (Cover)',
    description: 'Dipakai untuk tanggal acara & nama tamu di kotak sampul Buka Undangan',
  },
  {
    key: 'body_title',
    group: 'body_text',
    formName: 'theme_color_body_title',
    label: 'Judul Isi Undangan',
    description: 'Dipakai untuk nama mempelai, judul section, judul cerita, angka hitung mundur & nama penutup',
  },
  {
    key: 'body_subtitle',
    group: 'body_text',
    formName: 'theme_color_body_subtitle',
    label: 'Subjudul Isi Undangan',
    description: 'Dipakai untuk label "The Wedding Of", peran mempelai, tahun cerita, Akad/Resepsi & subjudul bagian',
  },
  {
    key: 'body_text',
    group: 'body_text',
    formName: 'theme_color_body_text',
    label: 'Isi & Deskripsi Undangan',
    description: 'Dipakai untuk kutipan, nama orang tua, deskripsi cerita, alamat, ucapan tamu & teks Terima Kasih',
  },
]);

export const VINTAGE_COLOR_PRESETS = Object.freeze([
  {
    id: 'heirloom_parchment',
    name: 'Kertas Klasik',
    badge: 'Default',
    colors: {
      bg: '#F4F0E8',
      surface: '#FAF7F1',
      ink: '#2A231E',
      accent: '#7C6850',
      ornament: '#302720',
      photo_border: '#FAF7F1',
    },
  },
  {
    id: 'sage_botanical',
    name: 'Sage Botanical',
    badge: 'Garden',
    colors: {
      bg: '#EDF1EC',
      surface: '#F6F8F5',
      ink: '#1E2A23',
      accent: '#5A7362',
      ornament: '#3B5242',
      photo_border: '#FFFFFF',
    },
  },
  {
    id: 'dusty_rose',
    name: 'Dusty Rose',
    badge: 'Romantic',
    colors: {
      bg: '#F4EAE8',
      surface: '#FAF4F2',
      ink: '#2F2021',
      accent: '#9B6B6B',
      ornament: '#74484B',
      photo_border: '#FFF9F8',
    },
  },
  {
    id: 'powder_blue',
    name: 'Serene Blue',
    badge: 'Soft',
    colors: {
      bg: '#EAEFF4',
      surface: '#F4F7FA',
      ink: '#1D2935',
      accent: '#5B7690',
      ornament: '#3A536B',
      photo_border: '#FFFFFF',
    },
  },
  {
    id: 'mocha_velvet',
    name: 'Warm Mocha',
    badge: 'Earthy',
    colors: {
      bg: '#EAE1D8',
      surface: '#F3ECE5',
      ink: '#2B2018',
      accent: '#835E45',
      ornament: '#543928',
      photo_border: '#FAF6F2',
    },
  },
  {
    id: 'midnight_gold',
    name: 'Midnight Gold',
    badge: 'Gelap',
    colors: {
      bg: '#181D24',
      surface: '#212731',
      ink: '#F3ECE0',
      accent: '#C8A46B',
      ornament: '#D8B981',
      photo_border: '#2D3542',
    },
  },
]);

export function isVintageTemplateCode(code) {
  return String(code || '').trim().toLowerCase() === 'vintage_classic';
}

export function sanitizeHex(value, fallback = null) {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(prefixed)) {
    return prefixed.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(prefixed)) {
    const [, r, g, b] = prefixed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

function parseColorObject(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return null;
}

function resolveDerivedDefaults(partial) {
  const bg = partial.bg || VINTAGE_COLOR_DEFAULTS.bg;
  const surface = partial.surface || VINTAGE_COLOR_DEFAULTS.surface;
  const accent = partial.accent || VINTAGE_COLOR_DEFAULTS.accent;
  const ornament = partial.ornament || VINTAGE_COLOR_DEFAULTS.ornament;
  const photo_border = partial.photo_border || VINTAGE_COLOR_DEFAULTS.photo_border;
  const baseInk = partial.body_title || partial.ink || VINTAGE_COLOR_DEFAULTS.ink;
  const softInk = mixHex(baseInk, bg, 0.28);
  const btn_bg = partial.btn_bg || baseInk;
  const btnBgLum = relativeLuminance(btn_bg);
  const btn_text = partial.btn_text || (btnBgLum > 0.45 ? '#1B1714' : '#FBF9F5');

  return {
    bg,
    surface,
    ink: partial.body_title || partial.ink || VINTAGE_COLOR_DEFAULTS.ink,
    accent,
    ornament,
    photo_border,
    btn_bg,
    btn_text,
    cover_title: partial.cover_title || baseInk,
    cover_subtitle: partial.cover_subtitle || accent,
    cover_body: partial.cover_body || softInk,
    body_title: partial.body_title || baseInk,
    body_subtitle: partial.body_subtitle || accent,
    body_text: partial.body_text || softInk,
  };
}

export function normalizeVintageColors(raw, { fallbackToDefaults = true } = {}) {
  const source = parseColorObject(raw);
  const explicit = {};
  let foundAny = false;

  const legacyInk = source ? sanitizeHex(source.ink, null) : null;
  if (legacyInk) {
    explicit.ink = legacyInk;
    foundAny = true;
  }

  for (const field of VINTAGE_COLOR_FIELDS) {
    const key = field.key;
    const valid = source ? sanitizeHex(source[key], null) : null;
    if (valid) {
      explicit[key] = valid;
      foundAny = true;
    }
  }

  if (!fallbackToDefaults && !foundAny) {
    return null;
  }
  return resolveDerivedDefaults(explicit);
}

export function extractVintageColorsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const baseObj = parseColorObject(payload.theme_colors) || {};
  const merged = {};
  let hasExplicitField = false;

  const legacyInk = sanitizeHex(payload.theme_color_ink, null) || sanitizeHex(baseObj.ink, null);
  if (legacyInk) {
    merged.ink = legacyInk;
    hasExplicitField = true;
  }

  for (const field of VINTAGE_COLOR_FIELDS) {
    const key = field.key;
    const flatValue = payload[field.formName];
    const valid = sanitizeHex(flatValue, null) || sanitizeHex(baseObj[key], null);
    if (valid) {
      merged[key] = valid;
      hasExplicitField = true;
    }
  }

  if (!hasExplicitField) {
    return null;
  }
  return resolveDerivedDefaults(merged);
}

export function areVintageColorsEqual(a, b) {
  const normA = normalizeVintageColors(a);
  const normB = normalizeVintageColors(b);
  return VINTAGE_COLOR_FIELDS.every((field) => normA[field.key] === normB[field.key]);
}

export function hexToRgb(hex, fallbackHex = '#2A231E') {
  const clean = sanitizeHex(hex, fallbackHex) || fallbackHex;
  const intVal = Number.parseInt(clean.slice(1), 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((v) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function mixHex(hexA, hexB, weightB = 0.5) {
  const w = Math.max(0, Math.min(1, weightB));
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r * (1 - w) + b.r * w);
  const g = Math.round(a.g * (1 - w) + b.g * w);
  const bl = Math.round(a.b * (1 - w) + b.b * w);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export const VINTAGE_WHEEL_QUICK_SWATCHES = Object.freeze([
  '#F4F0E8',
  '#FAF7F1',
  '#EDF1EC',
  '#F4EAE8',
  '#D4AF37',
  '#7C6850',
  '#302720',
  '#181D24',
]);

export function rgbToHsv(r, g, b) {
  const rn = Math.max(0, Math.min(255, Number(r) || 0)) / 255;
  const gn = Math.max(0, Math.min(255, Number(g) || 0)) / 255;
  const bn = Math.max(0, Math.min(255, Number(b) || 0)) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

export function hsvToRgb(h, s, v) {
  const hue = ((Number(h) || 0) % 360 + 360) % 360;
  const sat = Math.max(0, Math.min(100, Number(s) || 0)) / 100;
  const val = Math.max(0, Math.min(100, Number(v) || 0)) / 100;

  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) {
    rp = c; gp = x; bp = 0;
  } else if (hue < 120) {
    rp = x; gp = c; bp = 0;
  } else if (hue < 180) {
    rp = 0; gp = c; bp = x;
  } else if (hue < 240) {
    rp = 0; gp = x; bp = c;
  } else if (hue < 300) {
    rp = x; gp = 0; bp = c;
  } else {
    rp = c; gp = 0; bp = x;
  }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function hexToHsv(hex, fallbackHex = '#F4F0E8') {
  const { r, g, b } = hexToRgb(hex, fallbackHex);
  return rgbToHsv(r, g, b);
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function buildVintageCssVars(rawColors) {
  const colors = normalizeVintageColors(rawColors);
  const bgLum = relativeLuminance(colors.bg);
  const btnBgLum = relativeLuminance(colors.btn_bg);
  const photoBorderLum = relativeLuminance(colors.photo_border);
  const isDarkBg = bgLum < 0.35;

  const accentRgb = hexToRgb(colors.accent, VINTAGE_COLOR_DEFAULTS.accent);
  const inkRgb = hexToRgb(colors.body_title, VINTAGE_COLOR_DEFAULTS.body_title);
  const surfaceRgb = hexToRgb(colors.surface, VINTAGE_COLOR_DEFAULTS.surface);
  const btnHover = btnBgLum > 0.45
    ? mixHex(colors.btn_bg, '#000000', 0.16)
    : mixHex(colors.btn_bg, '#FFFFFF', 0.14);

  return {
    '--vc-bg': colors.bg,
    '--vc-surface': colors.surface,
    '--vc-surface-soft': mixHex(colors.bg, colors.surface, 0.45),
    '--vc-ink': colors.body_title,
    '--vc-ink-soft': colors.body_text,
    '--vc-ink-muted': mixHex(colors.body_text, colors.bg, 0.36),
    '--vc-ink-hover': btnHover,
    '--vc-btn-bg': colors.btn_bg,
    '--vc-btn-hover': btnHover,
    '--vc-btn-text': colors.btn_text,
    '--vc-cover-title': colors.cover_title,
    '--vc-cover-subtitle': colors.cover_subtitle,
    '--vc-cover-body': colors.cover_body,
    '--vc-body-title': colors.body_title,
    '--vc-body-subtitle': colors.body_subtitle,
    '--vc-body-text': colors.body_text,
    '--vc-accent': colors.accent,
    '--vc-accent-rgb': `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
    '--vc-ink-rgb': `${inkRgb.r}, ${inkRgb.g}, ${inkRgb.b}`,
    '--vc-surface-rgb': `${surfaceRgb.r}, ${surfaceRgb.g}, ${surfaceRgb.b}`,
    '--vc-ornament': colors.ornament,
    '--vc-photo-border': colors.photo_border,
    '--vc-photo-outline': photoBorderLum > 0.48 ? 'rgba(42, 35, 30, 0.16)' : 'rgba(255, 255, 255, 0.22)',
    '--vc-line': `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${isDarkBg ? 0.34 : 0.28})`,
    '--vc-line-strong': `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${isDarkBg ? 0.56 : 0.48})`,
    '--vc-shadow-rgb': isDarkBg ? '0, 0, 0' : '42, 35, 30',
    '--vc-input-bg': isDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.62)',
    '--vc-placeholder-bg': mixHex(colors.surface, colors.accent, 0.14),
    '--vc-footer-logo-filter': isDarkBg ? 'brightness(0) invert(1) opacity(0.84)' : 'none',
    '--vc-gold': colors.accent,
  };
}
