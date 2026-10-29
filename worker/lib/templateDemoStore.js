import { cleanText } from './helpers.js';
import { database } from './database.js';
import { canonicalTemplateCode, hasRealSupabaseConfig } from './repositories.js';

const DEMO_STORE_KEY_PREFIX = 'template-demo-data/';

function imageExtension(file) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[file.type] || 'jpg';
}

export function getDefaultTemplateDemo(templateCode) {
  const code = canonicalTemplateCode(templateCode);

  // Baseline shared fallback
  const base = {
    groom_full_name: 'Baskara Adiputra, S.T.',
    groom_nickname: 'Baskara',
    groom_father: 'Bpk. H. Suryanto',
    groom_mother: 'Ibu Hj. Rahayu',
    bride_full_name: 'Anindya Kirana, S.Ds.',
    bride_nickname: 'Anindya',
    bride_father: 'Bpk. H. Firmansyah',
    bride_mother: 'Ibu Hj. Lestari',
    akad_date: '2026-12-13',
    akad_start_time: '08:00',
    akad_end_time: '10:00',
    reception_date: '2026-12-13',
    reception_start_time: '11:00',
    reception_end_time: '14:00',
    venue_name: 'Pendopo Arunika',
    venue_address: 'Jl. Melati No. 12, Yogyakarta',
    maps_url: 'https://maps.google.com/',
    nearest_landmark: '300 meter dari Tugu Jogja',
    route_directions: 'Dari Tugu Jogja lurus ke arah selatan menuju Jl. Melati, lokasi berada di sebelah kiri.',
    transportation_guide: 'Tersedia area parkir luas untuk mobil dan motor di halaman pendopo.',
    love_story: 'Berawal dari pertemuan sederhana pada sebuah sore di Yogyakarta, percakapan kami tumbuh menjadi persahabatan, lalu keyakinan untuk melangkah bersama dalam ikatan suci pernikahan.',
    instagram: 'baskara.anindya',
    cover_image: null,
    groom_photo: null,
    bride_photo: null,
    stage_photo: null,
    covers: {
      essential: null,
      signature: null,
      prestige: null,
    },
    stage_photos: {
      essential: null,
      signature: null,
      prestige: null,
    },
    music_file: null,
    music_title: '',
    guest_name: 'Bapak/Ibu/Saudara/i',
    guest_salutation: 'Kepada Yth.',
    guest_list: [
      { id: 'guest-1', name: 'Bpk. Joko & Keluarga', salutation: 'Kepada Yth.' },
      { id: 'guest-2', name: 'Ibu Ratna & Rekan', salutation: 'Kepada Yth.' },
      { id: 'guest-3', name: 'Sahabat Dekat', salutation: 'Spesial untuk' },
    ],
    gift_accounts: [
      { id: 'gift-1', provider: 'BCA', account_number: '8830 1928 34', account_name: 'Baskara Adiputra', label: 'Rekening Mempelai Pria' },
      { id: 'gift-2', provider: 'Mandiri', account_number: '1370 0192 8472', account_name: 'Anindya Kirana', label: 'Rekening Mempelai Wanita' },
    ],
    greetings: [
      {
        id: 'greet-1',
        guest_name: 'Dila & Fajar',
        attendance_status: 'attending',
        message: 'Selamat berbahagia untuk kedua mempelai! Semoga senantiasa dipenuhi cinta, rahmat, dan keberkahan dalam membina bahtera rumah tangga yang sakinah mawaddah warahmah.',
        created_at: '2026-10-28T14:05:00.000Z',
      },
      {
        id: 'greet-2',
        guest_name: 'Bpk. H. Rahmat Santoso & Keluarga',
        attendance_status: 'attending',
        message: 'Barakallahu laka wa baraka alaika wa jama\'a bainakuma fii khoir. Selamat menempuh hidup baru Baskara & Anindya.',
        created_at: '2026-10-28T15:20:00.000Z',
      },
      {
        id: 'greet-3',
        guest_name: 'Sahabat Alumni Kampus',
        attendance_status: 'unsure',
        message: 'Happy wedding sahabatku! Maaf belum tentu bisa hadir langsung karena dinas tugas ke luar pulau, tapi doa tulus terbaik selalu mengiringi kebahagiaan kalian.',
        created_at: '2026-10-28T16:45:00.000Z',
      },
    ],
  };

  if (code.includes('lunara')) {
    base.groom_full_name = 'Adrian Danuarta, S.E.';
    base.groom_nickname = 'Adrian';
    base.groom_father = 'Bpk. Hendra Danuarta';
    base.groom_mother = 'Ibu Dewi Sartika';
    base.bride_full_name = 'Clarissa Althea, B.A.';
    base.bride_nickname = 'Clarissa';
    base.bride_father = 'Bpk. Bambang Sutrisno';
    base.bride_mother = 'Ibu Maya Anggraini';
    base.venue_name = 'The Glass Pavilion';
    base.venue_address = 'Jl. Dago Giri No. 88, Bandung';
    base.nearest_landmark = '500 meter setelah Dago Golf Course';
    base.love_story = 'Di bawah kilau cahaya kota dan sejuknya udara malam, dua cerita berbeda menyatu dalam satu harmoni cinta yang abadi.';
    base.instagram = 'adrian.clarissa';
    base.gift_accounts = [
      { id: 'gift-1', provider: 'BCA', account_number: '7820 4491 02', account_name: 'Adrian Danuarta', label: 'Rekening Mempelai Pria' },
      { id: 'gift-2', provider: 'Mandiri', account_number: '1310 0984 5512', account_name: 'Clarissa Althea', label: 'Rekening Mempelai Wanita' },
    ];
    base.greetings = [
      {
        id: 'greet-1',
        guest_name: 'Kevin & Natasha',
        attendance_status: 'attending',
        message: 'Selamat berbahagia untuk Adrian dan Clarissa! Semoga cinta dan kebahagiaan selalu menyertai setiap langkah kalian berdua selamanya.',
        created_at: '2026-10-28T14:05:00.000Z',
      },
      {
        id: 'greet-2',
        guest_name: 'Keluarga Besar Sutrisno',
        attendance_status: 'attending',
        message: 'Selamat menempuh hidup baru. Semoga senantiasa rukun, bahagia, dan selalu dalam lindungan Tuhan Yang Maha Esa.',
        created_at: '2026-10-28T15:20:00.000Z',
      },
      {
        id: 'greet-3',
        guest_name: 'Rekan Tim Kerja',
        attendance_status: 'attending',
        message: 'Happy wedding Clarissa & Adrian! Wishing you both a lifetime filled with endless love, joy, and wonderful adventures.',
        created_at: '2026-10-28T16:45:00.000Z',
      },
    ];
  } else if (code.includes('aurelia')) {
    base.groom_full_name = 'Jonathan Richard, B.A.';
    base.groom_nickname = 'Jonathan';
    base.groom_father = 'Bpk. Richard Wijaya';
    base.groom_mother = 'Ibu Caroline Tan';
    base.bride_full_name = 'Victoria Aurelia, B.Com.';
    base.bride_nickname = 'Victoria';
    base.bride_father = 'Bpk. Hartono Setiawan';
    base.bride_mother = 'Ibu Linda Susanto';
    base.venue_name = 'Grand Imperial Ballroom';
    base.venue_address = 'Jl. M.H. Thamrin No. 1, Jakarta Pusat';
    base.nearest_landmark = 'Lobby Utama Menara Thamrin';
    base.love_story = 'A timeless love story born in the heart of the ballroom, celebrating elegance, devotion, and a lifetime of shared dreams.';
    base.instagram = 'jonathan.victoria';
    base.gift_accounts = [
      { id: 'gift-1', provider: 'BCA', account_number: '5010 3928 11', account_name: 'Jonathan Richard', label: 'Rekening Mempelai Pria' },
      { id: 'gift-2', provider: 'CIMB Niaga', account_number: '7029 4819 0284', account_name: 'Victoria Aurelia', label: 'Rekening Mempelai Wanita' },
    ];
    base.greetings = [
      {
        id: 'greet-1',
        guest_name: 'Edward & Felicia',
        attendance_status: 'attending',
        message: 'Warmest congratulations to Jonathan and Victoria! May your marriage be filled with all the right ingredients: a heap of love, a dash of humor, and a lifetime of happiness.',
        created_at: '2026-10-28T14:05:00.000Z',
      },
      {
        id: 'greet-2',
        guest_name: 'Bpk. Hendra & Ibu Lily',
        attendance_status: 'attending',
        message: 'Selamat menempuh lembaran baru yang penuh sukacita. Semoga Tuhan senantiasa memberkati keluarga kecil Jonathan & Victoria.',
        created_at: '2026-10-28T15:20:00.000Z',
      },
      {
        id: 'greet-3',
        guest_name: 'Sahabat SMA Jakarta',
        attendance_status: 'attending',
        message: 'Super happy for both of you! Can’t wait to celebrate your special night at Grand Imperial Ballroom!',
        created_at: '2026-10-28T16:45:00.000Z',
      },
    ];
  } else if (code.includes('verdant')) {
    base.groom_full_name = 'Arya Bimantara, S.P.';
    base.groom_nickname = 'Arya';
    base.groom_father = 'Bpk. Gunawan Wibisono';
    base.groom_mother = 'Ibu Ratih Kusuma';
    base.bride_full_name = 'Nirmala Syahira, S.Hut.';
    base.bride_nickname = 'Nirmala';
    base.bride_father = 'Bpk. Priyanto Danarto';
    base.bride_mother = 'Ibu Indah Permatasari';
    base.venue_name = 'Pinehill Forest Estate';
    base.venue_address = 'Jl. Maribaya Timur No. 10, Lembang';
    base.nearest_landmark = 'Pintu Masuk Kawasan Hutan Pinus Maribaya';
    base.love_story = 'Di antara rindang pinus dan kabut fajar yang tenang, kami mengikrarkan janji suci untuk saling menjaga seumur hidup.';
    base.instagram = 'arya.nirmala';
    base.gift_accounts = [
      { id: 'gift-1', provider: 'BCA', account_number: '4390 1827 99', account_name: 'Arya Bimantara', label: 'Rekening Mempelai Pria' },
      { id: 'gift-2', provider: 'BNI', account_number: '0839 2819 03', account_name: 'Nirmala Syahira', label: 'Rekening Mempelai Wanita' },
    ];
    base.greetings = [
      {
        id: 'greet-1',
        guest_name: 'Bayu & Amanda',
        attendance_status: 'attending',
        message: 'Selamat mengikat janji suci Arya & Nirmala. Semoga cinta kalian senantiasa mekar abadi laksana sejuknya hutan pinus Maribaya.',
        created_at: '2026-10-28T14:05:00.000Z',
      },
      {
        id: 'greet-2',
        guest_name: 'Keluarga Besar Danarto',
        attendance_status: 'attending',
        message: 'Barakallah untuk kedua mempelai. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah serta dikaruniai keturunan yang sholeh & sholehah.',
        created_at: '2026-10-28T15:20:00.000Z',
      },
      {
        id: 'greet-3',
        guest_name: 'Komunitas Pecinta Alam',
        attendance_status: 'unsure',
        message: 'Happy wedding kawan seperjuangan! Mohon maaf bila belum pasti bisa merapat ke Lembang, doa terbaik selalu kami panjatkan!',
        created_at: '2026-10-28T16:45:00.000Z',
      },
    ];
  }

  return {
    invitation: base,
    gallery: {
      essential: [],
      signature: [],
      prestige: [],
    },
  };
}

function getMemoryStore() {
  globalThis.__daymoment_template_demo_data__ = globalThis.__daymoment_template_demo_data__ || new Map();
  return globalThis.__daymoment_template_demo_data__;
}

export async function getTemplateDemoData(env, templateCode) {
  const code = canonicalTemplateCode(templateCode);
  const memStore = getMemoryStore();

  const cached = memStore.get(code);
  if (cached && (Date.now() - (cached.cachedAt || 0) < 1000)) {
    return cached.data;
  }

  // 1. Try reading from Supabase Database (site_settings table)
  if (hasRealSupabaseConfig(env)) {
    try {
      const db = database(env);
      const { data: row } = await db.from('site_settings')
        .select('value')
        .eq('key', `template_demo_${code}`)
        .maybeSingle();

      if (row?.value) {
        const parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        if (parsed && typeof parsed === 'object') {
          const defaultDemo = getDefaultTemplateDemo(code);
          const rawGreetings = Array.isArray(parsed.invitation?.greetings) && parsed.invitation.greetings.length > 0
            ? parsed.invitation.greetings
            : defaultDemo.invitation.greetings;
          const merged = {
            invitation: {
              ...defaultDemo.invitation,
              ...(parsed.invitation || {}),
              greetings: rawGreetings,
            },
            gallery: {
              essential: Array.isArray(parsed.gallery?.essential) ? parsed.gallery.essential : [],
              signature: Array.isArray(parsed.gallery?.signature) ? parsed.gallery.signature : [],
              prestige: Array.isArray(parsed.gallery?.prestige) ? parsed.gallery.prestige : [],
            },
          };
          memStore.set(code, { data: merged, cachedAt: Date.now() });
          return merged;
        }
      }
    } catch (err) {
      console.warn(`Failed reading demo data from Supabase for ${code}:`, err.message);
    }
  }

  // 2. Try reading from R2
  if (env?.MEDIA) {
    try {
      const objectKey = `${DEMO_STORE_KEY_PREFIX}${code}.json`;
      const object = await env.MEDIA.get(objectKey);
      if (object) {
        const parsed = await object.json();
        if (parsed && typeof parsed === 'object') {
          const defaultDemo = getDefaultTemplateDemo(code);
          const rawGreetings = Array.isArray(parsed.invitation?.greetings) && parsed.invitation.greetings.length > 0
            ? parsed.invitation.greetings
            : defaultDemo.invitation.greetings;
          const merged = {
            invitation: {
              ...defaultDemo.invitation,
              ...(parsed.invitation || {}),
              greetings: rawGreetings,
            },
            gallery: {
              essential: Array.isArray(parsed.gallery?.essential) ? parsed.gallery.essential : [],
              signature: Array.isArray(parsed.gallery?.signature) ? parsed.gallery.signature : [],
              prestige: Array.isArray(parsed.gallery?.prestige) ? parsed.gallery.prestige : [],
            },
          };
          memStore.set(code, { data: merged, cachedAt: Date.now() });
          return merged;
        }
      }
    } catch (err) {
      console.warn(`Failed reading demo data from R2 for ${code}:`, err.message);
    }
  }

  const defaultData = getDefaultTemplateDemo(code);
  memStore.set(code, { data: defaultData, cachedAt: Date.now() });
  return defaultData;
}

export async function saveTemplateDemoData(env, templateCode, data) {
  const code = canonicalTemplateCode(templateCode);
  const current = await getTemplateDemoData(env, code);

  const updated = {
    invitation: {
      ...current.invitation,
      ...(data.invitation || {}),
    },
    gallery: {
      essential: Array.isArray(data.gallery?.essential) ? data.gallery.essential : current.gallery.essential,
      signature: Array.isArray(data.gallery?.signature) ? data.gallery.signature : current.gallery.signature,
      prestige: Array.isArray(data.gallery?.prestige) ? data.gallery.prestige : current.gallery.prestige,
    },
  };

  const memStore = getMemoryStore();
  memStore.set(code, { data: updated, cachedAt: Date.now() });

  // 1. Save to Supabase Database (site_settings table)
  if (hasRealSupabaseConfig(env)) {
    try {
      const db = database(env);
      await db.from('site_settings').upsert({
        key: `template_demo_${code}`,
        value: JSON.stringify(updated),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (code === 'java_vibes') {
        await db.from('site_settings').upsert({
          key: 'template_demo_puspa_jawi',
          value: JSON.stringify(updated),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      }
    } catch (err) {
      console.warn(`Failed saving demo data to Supabase for ${code}:`, err.message);
    }
  }

  // 2. Save to Cloudflare R2
  if (env?.MEDIA) {
    try {
      const objectKey = `${DEMO_STORE_KEY_PREFIX}${code}.json`;
      await env.MEDIA.put(objectKey, JSON.stringify(updated), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
        customMetadata: { templateCode: code, updatedAt: new Date().toISOString() },
      });
    } catch (err) {
      console.warn(`Failed writing demo data to R2 for ${code}:`, err.message);
    }
  }

  return updated;
}

export async function uploadTemplateGalleryPhoto(env, templateCode, packageCode, slotIndex, file) {
  const code = canonicalTemplateCode(templateCode);
  const pkgCode = String(packageCode || 'essential').toLowerCase().trim();
  const index = Math.max(0, parseInt(slotIndex, 10) || 0);

  if (!(file instanceof File)) {
    throw new Error('Pilih berkas foto terlebih dahulu.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 5 MB.');
  }

  const current = await getTemplateDemoData(env, code);
  const pkgGallery = Array.isArray(current.gallery[pkgCode]) ? [...current.gallery[pkgCode]] : [];

  const uuid = crypto.randomUUID();
  const ext = imageExtension(file);
  const objectKey = `template-gallery/${code}/${pkgCode}/slot-${index + 1}-${uuid}.${ext}`;

  if (env?.MEDIA) {
    // Delete previous file at this slot if it exists
    const previous = pkgGallery[index];
    if (previous?.file_path && previous.file_path.startsWith('template-gallery/')) {
      try { await env.MEDIA.delete(previous.file_path); } catch {}
    }

    await env.MEDIA.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { templateCode: code, packageCode: pkgCode, slotIndex: String(index) },
    });
  }

  const photoObj = {
    id: `demo-${pkgCode}-${index + 1}-${uuid.slice(0, 8)}`,
    file_path: objectKey,
    url: `/media/${objectKey}`,
    sort_order: index,
  };

  // Place into the specific slot index
  pkgGallery[index] = photoObj;

  const updatedGallery = {
    ...current.gallery,
    [pkgCode]: pkgGallery,
  };

  await saveTemplateDemoData(env, code, { gallery: updatedGallery });
  return { media: photoObj, gallery: updatedGallery };
}

export async function deleteTemplateGalleryPhoto(env, templateCode, packageCode, slotIndex) {
  const code = canonicalTemplateCode(templateCode);
  const pkgCode = String(packageCode || 'essential').toLowerCase().trim();
  const index = Math.max(0, parseInt(slotIndex, 10) || 0);

  const current = await getTemplateDemoData(env, code);
  const pkgGallery = Array.isArray(current.gallery[pkgCode]) ? [...current.gallery[pkgCode]] : [];

  const previous = pkgGallery[index];
  if (previous?.file_path && env?.MEDIA && previous.file_path.startsWith('template-gallery/')) {
    try { await env.MEDIA.delete(previous.file_path); } catch {}
  }

  // Remove the slot item or set it to null
  pkgGallery.splice(index, 1);

  const updatedGallery = {
    ...current.gallery,
    [pkgCode]: pkgGallery,
  };

  await saveTemplateDemoData(env, code, { gallery: updatedGallery });
  return { gallery: updatedGallery };
}

export async function uploadTemplateCouplePhoto(env, templateCode, kind, file) {
  const code = canonicalTemplateCode(templateCode);
  const allowedKinds = ['groom_photo', 'bride_photo', 'cover_image', 'stage_photo', 'custom_couple_image'];
  if (!allowedKinds.includes(kind)) {
    throw new Error('Jenis foto tidak valid.');
  }

  if (!(file instanceof File)) {
    throw new Error('Pilih berkas foto terlebih dahulu.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 8 MB.');
  }

  const current = await getTemplateDemoData(env, code);
  const uuid = crypto.randomUUID();
  const ext = imageExtension(file);
  const objectKey = `template-photos/${code}/${kind}-${uuid}.${ext}`;

  if (env?.MEDIA) {
    const oldPath = current.invitation[kind];
    if (oldPath && oldPath.startsWith('template-photos/')) {
      try { await env.MEDIA.delete(oldPath); } catch {}
    }

    await env.MEDIA.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { templateCode: code, kind },
    });
  }

  const updatedInvitation = {
    ...current.invitation,
    [kind]: objectKey,
  };

  await saveTemplateDemoData(env, code, { invitation: updatedInvitation });
  return { path: objectKey, url: `/media/${objectKey}`, invitation: updatedInvitation };
}

export async function uploadTemplatePackagePhoto(env, templateCode, kind, packageCode, file) {
  const code = canonicalTemplateCode(templateCode);
  const pkgCode = String(packageCode || 'essential').toLowerCase().trim();
  const allowedKinds = ['cover_image', 'stage_photo'];
  if (!allowedKinds.includes(kind)) {
    throw new Error('Jenis foto paket tidak valid.');
  }

  if (!(file instanceof File)) {
    throw new Error('Pilih berkas foto terlebih dahulu.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 8 MB.');
  }

  const current = await getTemplateDemoData(env, code);
  const uuid = crypto.randomUUID();
  const ext = imageExtension(file);
  const objectKey = `template-photos/${code}/${pkgCode}-${kind}-${uuid}.${ext}`;

  const targetGroup = kind === 'cover_image' ? 'covers' : 'stage_photos';
  const currentGroup = current.invitation[targetGroup] || {};

  if (env?.MEDIA) {
    const oldPath = currentGroup[pkgCode];
    if (oldPath && oldPath.startsWith('template-photos/')) {
      try { await env.MEDIA.delete(oldPath); } catch {}
    }

    await env.MEDIA.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { templateCode: code, packageCode: pkgCode, kind },
    });
  }

  const updatedGroup = {
    ...currentGroup,
    [pkgCode]: objectKey,
  };

  const updatedInvitation = {
    ...current.invitation,
    [targetGroup]: updatedGroup,
    [`${kind}_${pkgCode}`]: objectKey,
  };

  await saveTemplateDemoData(env, code, { invitation: updatedInvitation });
  return { path: objectKey, url: `/media/${objectKey}`, invitation: updatedInvitation };
}

export async function deleteTemplatePackagePhoto(env, templateCode, kind, packageCode) {
  const code = canonicalTemplateCode(templateCode);
  const pkgCode = String(packageCode || 'essential').toLowerCase().trim();
  const current = await getTemplateDemoData(env, code);

  const targetGroup = kind === 'cover_image' ? 'covers' : 'stage_photos';
  const currentGroup = current.invitation[targetGroup] || {};
  const oldPath = currentGroup[pkgCode];

  if (oldPath && env?.MEDIA && oldPath.startsWith('template-photos/')) {
    try { await env.MEDIA.delete(oldPath); } catch {}
  }

  const updatedGroup = {
    ...currentGroup,
    [pkgCode]: null,
  };

  const updatedInvitation = {
    ...current.invitation,
    [targetGroup]: updatedGroup,
    [`${kind}_${pkgCode}`]: null,
  };

  await saveTemplateDemoData(env, code, { invitation: updatedInvitation });
  return { invitation: updatedInvitation };
}

export async function uploadTemplateMusic(env, templateCode, file, title = '') {
  const code = canonicalTemplateCode(templateCode);

  if (!(file instanceof File)) {
    throw new Error('Pilih berkas audio terlebih dahulu.');
  }

  const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'];
  const ext = file.name.split('.').pop().toLowerCase();
  const allowedExts = ['mp3', 'm4a', 'ogg', 'wav'];
  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    throw new Error('Format musik harus MP3, M4A, OGG, atau WAV.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran file musik maksimal 15 MB.');
  }

  const current = await getTemplateDemoData(env, code);
  const uuid = crypto.randomUUID();
  const fileExt = ext || 'mp3';
  const objectKey = `template-music/${code}/music-${uuid}.${fileExt}`;

  if (env?.MEDIA) {
    const prevFile = current.invitation?.music_file;
    if (prevFile && prevFile.startsWith('template-music/')) {
      try { await env.MEDIA.delete(prevFile); } catch {}
    } else if (prevFile && prevFile.startsWith('/media/template-music/')) {
      try { await env.MEDIA.delete(prevFile.replace('/media/', '')); } catch {}
    }

    await env.MEDIA.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type || 'audio/mpeg', cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { templateCode: code, type: 'demo-music' },
    });
  }

  const musicTitle = cleanText(title || file.name.replace(/\.[^/.]+$/, ''), 150) || 'Musik Undangan';
  const updatedInvitation = {
    ...current.invitation,
    music_file: objectKey,
    music_title: musicTitle,
  };

  await saveTemplateDemoData(env, code, { invitation: updatedInvitation });
  return { path: objectKey, url: `/media/${objectKey}`, title: musicTitle, invitation: updatedInvitation };
}

export async function deleteTemplateMusic(env, templateCode) {
  const code = canonicalTemplateCode(templateCode);
  const current = await getTemplateDemoData(env, code);

  const prevFile = current.invitation?.music_file;
  if (env?.MEDIA && prevFile) {
    const key = prevFile.replace('/media/', '');
    if (key.startsWith('template-music/')) {
      try { await env.MEDIA.delete(key); } catch {}
    }
  }

  const updatedInvitation = {
    ...current.invitation,
    music_file: null,
    music_title: '',
  };

  await saveTemplateDemoData(env, code, { invitation: updatedInvitation });
  return { ok: true, invitation: updatedInvitation };
}

