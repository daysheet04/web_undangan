/**
 * Minimal zero-dependency ZIP archive builder (Method 0: STORE) for Cloudflare Workers.
 * Ideal for already-compressed media assets (JPG, WEBP, PNG, MP3, M4A) plus UTF-8 text files.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimeDate(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = Math.max(1980, d.getFullYear()) - 1980;
  const dosDate = ((year & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  const dosTime = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() >> 1) & 0x1f);
  return { dosTime, dosDate };
}

function sanitizeZipEntryName(name) {
  return String(name || 'file')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.\.+/g, '_')
    .replace(/[\x00-\x1f]/g, '')
    .slice(0, 220) || 'file';
}

/**
 * @param {Array<{ name: string, data: Uint8Array | ArrayBuffer | string, date?: Date }>} entries
 * @returns {Uint8Array}
 */
export function buildZipArchive(entries = []) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const usedNames = new Set();

  for (const rawEntry of entries) {
    let entryName = sanitizeZipEntryName(rawEntry?.name);
    if (usedNames.has(entryName)) {
      const dot = entryName.lastIndexOf('.');
      let n = 2;
      let candidate = dot > 0 ? `${entryName.slice(0, dot)}-${n}${entryName.slice(dot)}` : `${entryName}-${n}`;
      while (usedNames.has(candidate)) {
        n += 1;
        candidate = dot > 0 ? `${entryName.slice(0, dot)}-${n}${entryName.slice(dot)}` : `${entryName}-${n}`;
      }
      entryName = candidate;
    }
    usedNames.add(entryName);

    const nameBytes = encoder.encode(entryName);
    let dataBytes;
    if (rawEntry?.data instanceof Uint8Array) {
      dataBytes = rawEntry.data;
    } else if (rawEntry?.data instanceof ArrayBuffer) {
      dataBytes = new Uint8Array(rawEntry.data);
    } else if (typeof rawEntry?.data === 'string') {
      dataBytes = encoder.encode(rawEntry.data);
    } else {
      dataBytes = new Uint8Array(0);
    }

    const crc = crc32(dataBytes);
    const size = dataBytes.length;
    const { dosTime, dosDate } = dosTimeDate(rawEntry?.date);

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true);         // version needed (2.0)
    lv.setUint16(6, 0x0800, true);     // UTF-8 flag
    lv.setUint16(8, 0, true);          // compression: STORE (0)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);         // extra len
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true);         // version made by
    cv.setUint16(6, 20, true);         // version needed
    cv.setUint16(8, 0x0800, true);     // UTF-8 flag
    cv.setUint16(10, 0, true);         // compression: STORE
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);         // extra len
    cv.setUint16(32, 0, true);         // comment len
    cv.setUint16(34, 0, true);         // disk start
    cv.setUint16(36, 0, true);         // internal attrs
    cv.setUint32(38, 0, true);         // external attrs
    cv.setUint32(42, offset, true);    // local header offset
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const part of centralParts) centralSize += part.length;

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, usedNames.size, true);
  ev.setUint16(10, usedNames.size, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);

  const totalLength = centralOffset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of localParts) {
    output.set(part, pos);
    pos += part.length;
  }
  for (const part of centralParts) {
    output.set(part, pos);
    pos += part.length;
  }
  output.set(eocd, pos);
  return output;
}
