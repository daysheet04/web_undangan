import React, { useEffect, useState } from 'react';
import { del, get, mediaUrl, post, put } from '../lib/api.js';
import AdminCoverAdjusterModal from './AdminCoverAdjusterModal.jsx';

const BANK_PROVIDERS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'BSI',
  'CIMB Niaga',
  'PermataBank',
  'SeaBank',
  'Bank Jago',
  'GoPay',
  'DANA',
  'OVO',
  'ShopeePay',
  'Lainnya',
];

export default function AdminTemplateEditorModal({ isOpen, onClose, template, onReload }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'gallery' | 'music' | 'bank' | 'guests'
  const [activePkg, setActivePkg] = useState('essential'); // 'essential' | 'signature' | 'prestige'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // `${pkg}:${index}` | 'groom' | 'bride' | 'cover' | 'music'
  const [invitation, setInvitation] = useState({});
  const [gallery, setGallery] = useState({ essential: [], signature: [], prestige: [] });
  const [packages, setPackages] = useState([
    { code: 'essential', name: 'Essential', gallery_limit: 2, has_music: false, has_gift: false },
    { code: 'signature', name: 'Signature', gallery_limit: 3, has_music: true, has_gift: false },
    { code: 'prestige', name: 'Prestige', gallery_limit: 5, has_music: true, has_gift: true },
  ]);

  // Drafts for adding bank & greeting cards
  const [bankDraft, setBankDraft] = useState({
    provider: 'BCA',
    account_number: '',
    account_name: '',
    label: '',
  });
  const [greetingDraft, setGreetingDraft] = useState({
    guest_name: '',
    attendance_status: 'attending',
    message: '',
  });

  // Modal adjuster configuration (pan & zoom)
  const [adjusterConfig, setAdjusterConfig] = useState(null);

  useEffect(() => {
    if (!isOpen || !template?.code) return;
    let cancelled = false;
    setLoading(true);

    get(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo`)
      .then((res) => {
        if (cancelled) return;
        if (res.packages?.length) setPackages(res.packages);
        setInvitation(res.invitation || {});
        setGallery(res.gallery || { essential: [], signature: [], prestige: [] });
      })
      .catch((err) => {
        if (cancelled) return;
        window.showToast?.(err.message || 'Gagal memuat data editor template.', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, template?.code]);

  if (!isOpen || !template) return null;

  const currentPackage = packages.find((p) => p.code === activePkg) || packages[0];
  const maxSlots = currentPackage?.gallery_limit || (activePkg === 'essential' ? 2 : activePkg === 'signature' ? 3 : 5);
  const currentPhotos = Array.isArray(gallery[activePkg]) ? gallery[activePkg] : [];

  // Active package specific cover and stage photos
  const pkgCoverCustom = invitation.covers?.[activePkg] || invitation[`cover_image_${activePkg}`] || null;
  const effectiveCover = pkgCoverCustom || invitation.cover_image || null;

  const pkgStageCustom = invitation.stage_photos?.[activePkg] || invitation[`stage_photo_${activePkg}`] || null;
  const effectiveStage = pkgStageCustom || invitation.stage_photo || invitation.custom_couple_image || null;

  const handleFieldChange = (field, value) => {
    setInvitation((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInfo = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await put(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo`, {
        invitation,
      });
      window.showToast?.(res.message || 'Data editor demo berhasil disimpan.');
      if (res.invitation) setInvitation(res.invitation);
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menyimpan data editor demo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSlot = async (slotIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    const slotKey = `${activePkg}:${slotIndex}`;
    setUploadingSlot(slotKey);
    try {
      const form = new FormData();
      form.append('package_code', activePkg);
      form.append('slot_index', String(slotIndex));
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/gallery`, form);
      window.showToast?.(res.message || `Foto berhasil disimpan ke slot ${slotIndex + 1}.`);
      if (res.gallery) {
        setGallery(res.gallery);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal mengunggah foto.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteSlot = async (slotIndex) => {
    if (!window.confirm(`Hapus foto pada slot ${slotIndex + 1} (${currentPackage.name})?`)) return;

    const slotKey = `${activePkg}:${slotIndex}`;
    setUploadingSlot(slotKey);
    try {
      const res = await del(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/gallery`, {
        package_code: activePkg,
        slot_index: slotIndex,
      });
      window.showToast?.(res.message || 'Foto berhasil dihapus.');
      if (res.gallery) {
        setGallery(res.gallery);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menghapus foto.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleUploadCouplePhoto = async (kind, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setUploadingSlot(kind);
    try {
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/photo`, form);
      window.showToast?.(res.message || 'Foto berhasil disimpan.');
      if (res.invitation) {
        setInvitation(res.invitation);
      } else if (res.path) {
        setInvitation((prev) => ({ ...prev, [kind]: res.path }));
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal mengunggah foto.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Package Cover & Stage Photo handlers
  const handleUploadPackagePhoto = async (kind, packageCode, eventOrFile) => {
    const file = eventOrFile instanceof File ? eventOrFile : eventOrFile?.target?.files?.[0];
    if (!file) return;
    if (eventOrFile?.target) eventOrFile.target.value = '';

    const slotKey = `${packageCode}:${kind}`;
    setUploadingSlot(slotKey);
    try {
      const form = new FormData();
      form.append('kind', kind);
      form.append('package_code', packageCode);
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/package-photo`, form);
      window.showToast?.(res.message || 'Foto paket berhasil disimpan.');
      if (res.invitation) {
        setInvitation(res.invitation);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal mengunggah foto paket.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeletePackagePhoto = async (kind, packageCode) => {
    const label = kind === 'cover_image' ? 'cover' : 'panggung';
    if (!window.confirm(`Hapus foto ${label} khusus paket ${packageCode.toUpperCase()} dan gunakan bawaan template?`)) return;

    const slotKey = `${packageCode}:${kind}`;
    setUploadingSlot(slotKey);
    try {
      const res = await del(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/package-photo`, {
        kind,
        package_code: packageCode,
      });
      window.showToast?.(res.message || `Foto ${label} paket ${packageCode.toUpperCase()} berhasil dihapus.`);
      if (res.invitation) {
        setInvitation(res.invitation);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menghapus foto paket.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSaveAdjustedPhoto = async (file) => {
    if (!adjusterConfig) return;
    const { target, packageCode, slotIndex } = adjusterConfig;

    if (target === 'package_cover' || target === 'package_stage') {
      const kind = target === 'package_cover' ? 'cover_image' : 'stage_photo';
      const form = new FormData();
      form.append('kind', kind);
      form.append('package_code', packageCode);
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/package-photo`, form);
      window.showToast?.(res.message || `Foto ${target === 'package_cover' ? 'cover' : 'panggung'} (${packageCode}) berhasil disesuaikan.`);
      if (res.invitation) {
        setInvitation(res.invitation);
      }
      onReload?.();
    } else if (target === 'gallery_slot') {
      const form = new FormData();
      form.append('package_code', packageCode);
      form.append('slot_index', String(slotIndex));
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/gallery`, form);
      window.showToast?.(res.message || `Foto galeri slot ${slotIndex + 1} (${packageCode}) berhasil disesuaikan.`);
      if (res.gallery) {
        setGallery(res.gallery);
      }
      onReload?.();
    } else if (target === 'groom_photo' || target === 'bride_photo') {
      const form = new FormData();
      form.append('kind', target);
      form.append('file', file);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/photo`, form);
      window.showToast?.(res.message || 'Foto mempelai berhasil disesuaikan.');
      if (res.invitation) {
        setInvitation(res.invitation);
      } else if (res.path) {
        setInvitation((prev) => ({ ...prev, [target]: res.path }));
      }
      onReload?.();
    }
  };

  // Music handlers
  const handleUploadMusic = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setUploadingSlot('music');
    try {
      const form = new FormData();
      form.append('file', file);
      if (invitation.music_title) form.append('title', invitation.music_title);

      const res = await post(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/music`, form);
      window.showToast?.(res.message || 'Musik latar berhasil diunggah.');
      if (res.invitation) {
        setInvitation(res.invitation);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal mengunggah musik.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDeleteMusic = async () => {
    if (!window.confirm('Hapus musik latar undangan demo ini?')) return;

    setUploadingSlot('music');
    try {
      const res = await del(`/api/admin/templates/${encodeURIComponent(template.code)}/editor-demo/music`);
      window.showToast?.(res.message || 'Musik berhasil dihapus.');
      if (res.invitation) {
        setInvitation(res.invitation);
      }
      onReload?.();
    } catch (err) {
      window.showToast?.(err.message || 'Gagal menghapus musik.', 'error');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Bank accounts handlers
  const handleAddBank = (e) => {
    e.preventDefault();
    if (!bankDraft.account_number.trim() || !bankDraft.account_name.trim()) {
      window.showToast?.('Nomor rekening dan nama pemilik wajib diisi.', 'error');
      return;
    }

    const currentGifts = Array.isArray(invitation.gift_accounts) ? [...invitation.gift_accounts] : [];
    const newEntry = {
      id: `gift-${Date.now()}`,
      provider: bankDraft.provider || 'BCA',
      account_number: bankDraft.account_number.trim(),
      account_name: bankDraft.account_name.trim(),
      label: bankDraft.label.trim() || 'Hadiah Pernikahan',
    };

    const updatedGifts = [...currentGifts, newEntry];
    setInvitation((prev) => ({ ...prev, gift_accounts: updatedGifts }));
    setBankDraft({ provider: 'BCA', account_number: '', account_name: '', label: '' });
    window.showToast?.('Rekening ditambahkan. Klik "Simpan Perubahan Rekening" untuk menyimpan permanen.');
  };

  const handleDeleteBank = (idOrIndex) => {
    const currentGifts = Array.isArray(invitation.gift_accounts) ? [...invitation.gift_accounts] : [];
    const updatedGifts = currentGifts.filter((item, idx) => (item.id ? item.id !== idOrIndex : idx !== idOrIndex));
    setInvitation((prev) => ({ ...prev, gift_accounts: updatedGifts }));
    window.showToast?.('Rekening dihapus dari daftar. Jangan lupa klik "Simpan Perubahan Rekening".');
  };

  // Greeting cards handlers
  const handleAddGreeting = (e) => {
    e.preventDefault();
    const guestName = greetingDraft.guest_name.trim();
    const message = greetingDraft.message.trim();
    if (!guestName) {
      window.showToast?.('Nama tamu wajib diisi.', 'error');
      return;
    }
    if (!message) {
      window.showToast?.('Pesan atau ucapan doa restu wajib diisi.', 'error');
      return;
    }

    const currentGreetings = Array.isArray(invitation.greetings) ? [...invitation.greetings] : [];
    const newEntry = {
      id: `greet-${Date.now()}`,
      guest_name: guestName,
      attendance_status: greetingDraft.attendance_status || 'attending',
      message: message,
      created_at: new Date().toISOString(),
    };

    const updatedGreetings = [newEntry, ...currentGreetings];
    setInvitation((prev) => ({ ...prev, greetings: updatedGreetings }));
    setGreetingDraft({ guest_name: '', attendance_status: 'attending', message: '' });
    window.showToast?.('Kartu ucapan ditambahkan. Klik "Simpan Kartu Ucapan & RSVP" untuk menyimpan permanen.');
  };

  const handleDeleteGreeting = (idOrIndex) => {
    const currentGreetings = Array.isArray(invitation.greetings) ? [...invitation.greetings] : [];
    const updatedGreetings = currentGreetings.filter((item, idx) => (item.id ? item.id !== idOrIndex : idx !== idOrIndex));
    setInvitation((prev) => ({ ...prev, greetings: updatedGreetings }));
    window.showToast?.('Kartu ucapan dihapus. Jangan lupa klik "Simpan Kartu Ucapan & RSVP".');
  };

  const openLivePreview = (pkgCode = activePkg, customGuest = null) => {
    let url = `/template/${encodeURIComponent(template.code)}?package=${encodeURIComponent(pkgCode)}`;
    const name = customGuest ? customGuest.name : (invitation.guest_name || '');
    const salutation = customGuest ? customGuest.salutation : (invitation.guest_salutation || '');
    if (name) url += `&to=${encodeURIComponent(name)}`;
    if (salutation) url += `&salutation=${encodeURIComponent(salutation)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="admin-modal-backdrop admin-template-editor-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="templateEditorModalTitle"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-window admin-template-editor-modal">
        {/* Scoped CSS to ensure immediate rendering without stylesheet cache lag */}
        <style dangerouslySetInnerHTML={{ __html: `
          .attendance-pills-selector {
            display: flex;
            gap: 8px;
            width: 100%;
          }
          .attendance-pill-option {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 750;
            cursor: pointer;
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
            background: #ffffff;
            border: 1.5px solid transparent;
            user-select: none;
          }
          .attendance-pill-option.attending {
            border-color: #c6e7d6;
            color: #166534;
            background: #f2f9f5;
          }
          .attendance-pill-option.attending:hover {
            background: #e4f5ec;
            border-color: #166534;
            transform: translateY(-1px);
          }
          .attendance-pill-option.attending.is-active {
            background: linear-gradient(135deg, #15803d, #0f622f);
            color: #ffffff;
            border-color: #15803d;
            box-shadow: 0 4px 14px rgba(21, 128, 61, 0.32);
            transform: translateY(-1px);
          }
          .attendance-pill-option.not_attending {
            border-color: #fecaca;
            color: #991b1b;
            background: #fef2f2;
          }
          .attendance-pill-option.not_attending:hover {
            background: #fee2e2;
            border-color: #991b1b;
            transform: translateY(-1px);
          }
          .attendance-pill-option.not_attending.is-active {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: #ffffff;
            border-color: #dc2626;
            box-shadow: 0 4px 14px rgba(220, 38, 38, 0.32);
            transform: translateY(-1px);
          }
          .attendance-pill-option.unsure {
            border-color: #fde68a;
            color: #92400e;
            background: #fffbeb;
          }
          .attendance-pill-option.unsure:hover {
            background: #fef3c7;
            border-color: #92400e;
            transform: translateY(-1px);
          }
          .attendance-pill-option.unsure.is-active {
            background: linear-gradient(135deg, #d97706, #b45309);
            color: #ffffff;
            border-color: #d97706;
            box-shadow: 0 4px 14px rgba(217, 119, 6, 0.32);
            transform: translateY(-1px);
          }
          .attendance-pill-option .pill-dot {
            font-size: 0.65rem;
            line-height: 1;
          }
          .attendance-pill-option.attending .pill-dot { color: #16a34a; }
          .attendance-pill-option.attending.is-active .pill-dot { color: #86efac; }
          .attendance-pill-option.not_attending .pill-dot { color: #dc2626; }
          .attendance-pill-option.not_attending.is-active .pill-dot { color: #fca5a5; }
          .attendance-pill-option.unsure .pill-dot { color: #d97706; }
          .attendance-pill-option.unsure.is-active .pill-dot { color: #fde68a; }
          .attendance-pill-option .pill-check {
            display: inline-grid;
            place-items: center;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.28);
            font-size: 0.65rem;
            font-weight: 900;
            margin-left: 2px;
          }
          .btn-add-greeting-submit {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 24px;
            font-size: 0.84rem;
            font-weight: 800;
            color: #ffffff;
            background: linear-gradient(135deg, #18634f 0%, #0e4535 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(14, 69, 53, 0.28);
            transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .btn-add-greeting-submit:hover {
            background: linear-gradient(135deg, #1d775f 0%, #125542 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(14, 69, 53, 0.38);
          }
          .btn-add-greeting-submit:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(14, 69, 53, 0.22);
          }
          .btn-add-greeting-icon {
            font-size: 0.95rem;
          }
          .greetings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 16px;
            margin-top: 16px;
          }
          .greeting-card-admin {
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #ffffff;
            border: 1.5px solid #dce8e1;
            border-radius: 14px;
            padding: 16px;
            box-shadow: 0 3px 12px rgba(18, 48, 38, 0.05);
            transition: all 0.18s ease;
          }
          .greeting-card-admin:hover {
            border-color: #18634f;
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(18, 48, 38, 0.09);
          }
          .greeting-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #edf4f0;
          }
          .greeting-guest-info {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }
          .guest-avatar-icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-weight: 800;
            font-size: 0.9rem;
            flex-shrink: 0;
            letter-spacing: -0.02em;
          }
          .guest-avatar-icon.attending {
            background: #dcfce7;
            color: #15803d;
            border: 1.5px solid #86efac;
          }
          .guest-avatar-icon.not_attending {
            background: #fee2e2;
            color: #b91c1c;
            border: 1.5px solid #fca5a5;
          }
          .guest-avatar-icon.unsure {
            background: #fef3c7;
            color: #92400e;
            border: 1.5px solid #fde68a;
          }
          .guest-meta-block {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
          }
          .greeting-guest-name {
            font-size: 0.9rem;
            font-weight: 800;
            color: #123026;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .attendance-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 8px;
            font-size: 0.68rem;
            font-weight: 750;
            border-radius: 6px;
            width: fit-content;
          }
          .attendance-pill.attending {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
          }
          .attendance-pill.not_attending {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }
          .attendance-pill.unsure {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
          }
          .attendance-pill .badge-bullet {
            font-size: 0.5rem;
          }
          .btn-delete-greeting {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            font-size: 0.72rem;
            font-weight: 750;
            color: #dc2626;
            background: #ffffff;
            border: 1px solid #fca5a5;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
            flex-shrink: 0;
          }
          .btn-delete-greeting:hover {
            background: #dc2626;
            color: #ffffff;
            border-color: #dc2626;
            transform: translateY(-1px);
          }
          .greeting-card-msg {
            position: relative;
            margin: 0;
            padding: 12px 14px 12px 28px;
            background: #f8faf9;
            border: 1px solid #e7efe9;
            border-radius: 10px;
            font-size: 0.8rem;
            color: #374151;
            line-height: 1.5;
            font-style: normal;
          }
          .msg-quote-mark {
            position: absolute;
            top: 6px;
            left: 10px;
            font-size: 1.4rem;
            line-height: 1;
            color: #9bb7a9;
            font-family: Georgia, serif;
            font-weight: 700;
            user-select: none;
          }
          .greeting-card-msg p {
            margin: 0;
          }
          .greetings-empty-notice {
            grid-column: 1 / -1;
            padding: 32px;
            text-align: center;
            color: #648275;
            font-size: 0.84rem;
            background: #fbfdfc;
            border: 1.5px dashed #cedcd5;
            border-radius: 12px;
          }
          /* Package Special Photos (Cover & Stage) */
          .package-special-photos-box {
            background: #ffffff;
            border: 1.5px solid #dce8e1;
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 4px 16px rgba(18, 48, 38, 0.05);
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 20px;
            margin-bottom: 22px;
          }
          .special-photos-header {
            border-bottom: 1px solid #edf4f0;
            padding-bottom: 12px;
          }
          .special-photos-title-group h4 {
            margin: 0 0 4px 0;
            font-size: 0.98rem;
            font-weight: 800;
            color: #123026;
            letter-spacing: -0.01em;
          }
          .special-photos-title-group p {
            margin: 0;
            font-size: 0.77rem;
            color: #587368;
            line-height: 1.45;
          }
          .package-special-photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 16px;
          }
          .package-photo-card {
            background: linear-gradient(145deg, #fbfdfc, #f4f8f6);
            border: 1.5px solid #d4e4db;
            border-radius: 14px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            box-shadow: 0 2px 8px rgba(18, 48, 38, 0.04);
            transition: all 0.18s ease;
          }
          .package-photo-card:hover {
            border-color: #165643;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(18, 48, 38, 0.08);
          }
          .package-photo-card-top {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .package-photo-meta-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
          .package-photo-title {
            font-size: 0.88rem;
            font-weight: 800;
            color: #123026;
          }
          .badge-photo-custom {
            font-size: 0.65rem;
            font-weight: 800;
            color: #15803d;
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            padding: 2px 8px;
            border-radius: 999px;
            white-space: nowrap;
          }
          .badge-photo-default {
            font-size: 0.65rem;
            font-weight: 700;
            color: #64748b;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 2px 8px;
            border-radius: 999px;
            white-space: nowrap;
          }
          .package-photo-desc {
            margin: 0;
            font-size: 0.73rem;
            color: #5c746e;
            line-height: 1.4;
          }
          .package-photo-preview-wrap {
            display: flex;
            gap: 14px;
            align-items: center;
          }
          .package-photo-thumb {
            width: 84px;
            height: 112px;
            border-radius: 10px;
            overflow: hidden;
            border: 1.5px solid #c8ddd2;
            background: #e7f1eb;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
          }
          .package-photo-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .package-photo-thumb .thumb-placeholder {
            font-size: 0.62rem;
            font-weight: 700;
            color: #688579;
            text-align: center;
            padding: 6px;
            line-height: 1.3;
          }
          .package-photo-actions {
            display: flex;
            flex-direction: column;
            gap: 7px;
            flex: 1;
          }
          .btn-package-photo-upload {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 12px;
            font-size: 0.76rem;
            font-weight: 750;
            color: #ffffff;
            background: linear-gradient(135deg, #18634f, #0e4535);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(14, 69, 53, 0.22);
            transition: all 0.16s ease;
            width: 100%;
            box-sizing: border-box;
          }
          .btn-package-photo-upload:hover {
            background: linear-gradient(135deg, #1d775f, #125542);
            transform: translateY(-1px);
            box-shadow: 0 5px 14px rgba(14, 69, 53, 0.32);
          }
          .btn-package-photo-upload input[type="file"] {
            display: none;
          }
          .btn-package-photo-adjust {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 7px 12px;
            font-size: 0.74rem;
            font-weight: 750;
            color: #12634d;
            background: #eef7f2;
            border: 1px solid #bce1ce;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.16s ease;
            width: 100%;
          }
          .btn-package-photo-adjust:hover {
            background: #dff2e7;
            border-color: #9cd4b5;
            color: #0b4938;
            transform: translateY(-1px);
          }
          .btn-package-photo-reset {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 5px 10px;
            font-size: 0.7rem;
            font-weight: 700;
            color: #dc2626;
            background: #fff;
            border: 1px solid #fecaca;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            width: 100%;
          }
          .btn-package-photo-reset:hover {
            background: #fef2f2;
            border-color: #f87171;
            color: #b91c1c;
          }
          .gallery-section-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 6px 0 -4px 0;
            padding-bottom: 8px;
            border-bottom: 1.5px dashed #dbe7e1;
          }
          .gallery-section-title {
            font-size: 0.88rem;
            font-weight: 800;
            color: #165643;
          }
          .btn-slot-adjust {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 9px;
            font-size: 0.72rem;
            font-weight: 750;
            color: #12634d;
            background: #eef7f2;
            border: 1px solid #bce1ce;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .btn-slot-adjust:hover {
            background: #dff2e7;
            border-color: #9cd4b5;
            color: #0b4938;
          }
          .slot-actions {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 5px;
            margin-top: 10px;
          }
          .photo-meta-buttons {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .btn-adjust-photo-tab1 {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            padding: 6px 12px;
            font-size: 0.74rem;
            font-weight: 750;
            color: #12634d;
            background: #eef7f2;
            border: 1px solid #bce1ce;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.16s ease;
          }
          .btn-adjust-photo-tab1:hover {
            background: #dff2e7;
            border-color: #9cd4b5;
            color: #0b4938;
            transform: translateY(-1px);
          }
        ` }} />

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="eyebrow">KELOLA EDITOR DEMO TEMPLATE</span>
            <h2 id="templateEditorModalTitle">{template.name}</h2>
            <p>Atur data pengantin, galeri per paket, musik latar, rekening bank, dan daftar tamu simulasi.</p>
          </div>
          <div className="modal-header-actions">
            <button
              type="button"
              className="admin-btn-preview-top"
              onClick={() => openLivePreview()}
              title="Buka halaman preview template ini di tab baru"
            >
              👁️ Buka Preview
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Tutup jendela"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="template-editor-tab-bar">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'info' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            💍 Data Pengantin &amp; Acara
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'gallery' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            📸 Plot Galeri Foto per Paket
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'music' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            🎵 Musik Latar ({invitation.music_file ? '✓ Ada Musik' : 'Signature & Prestige'})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'bank' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            💳 Rekening &amp; Amplop (Prestige)
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'guests' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('guests')}
          >
            💬 Kartu Ucapan &amp; RSVP (Signature &amp; Prestige)
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroller">
          {loading ? (
            <div className="admin-editor-loading">
              <span className="loading-spinner" />
              <span>Memuat data editor template...</span>
            </div>
          ) : activeTab === 'info' ? (
            /* ======================================================== */
            /* TAB 1: FORM PENGANTIN & ACARA */
            /* ======================================================== */
            <form onSubmit={handleSaveInfo} className="template-editor-form">
              <div className="editor-banner-hint">
                <span className="hint-icon">💡</span>
                <div>
                  <strong>Satu Editor untuk Seluruh Paket</strong>
                  <p>Nama pengantin, jadwal acara, lokasi, dan cerita cinta ini akan digunakan bersama oleh paket Essential, Signature, maupun Prestige pada preview template <b>{template.name}</b>.</p>
                </div>
              </div>

              {/* Grid 2 Kolom: Mempelai Pria & Wanita */}
              <div className="editor-section-grid">
                {/* Mempelai Pria */}
                <div className="editor-card-box">
                  <div className="box-header">
                    <span className="box-title">👔 Mempelai Pria</span>
                  </div>
                  <div className="editor-fields-group">
                    <label className="editor-field">
                      <span>Nama Lengkap</span>
                      <input
                        type="text"
                        value={invitation.groom_full_name || ''}
                        onChange={(e) => handleFieldChange('groom_full_name', e.target.value)}
                        placeholder="Contoh: Baskara Adiputra, S.T."
                        required
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Panggilan</span>
                      <input
                        type="text"
                        value={invitation.groom_nickname || ''}
                        onChange={(e) => handleFieldChange('groom_nickname', e.target.value)}
                        placeholder="Contoh: Baskara"
                        required
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Ayah</span>
                      <input
                        type="text"
                        value={invitation.groom_father || ''}
                        onChange={(e) => handleFieldChange('groom_father', e.target.value)}
                        placeholder="Contoh: Bpk. H. Suryanto"
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Ibu</span>
                      <input
                        type="text"
                        value={invitation.groom_mother || ''}
                        onChange={(e) => handleFieldChange('groom_mother', e.target.value)}
                        placeholder="Contoh: Ibu Hj. Rahayu"
                      />
                    </label>

                    {/* Foto Pria */}
                    <div className="couple-photo-upload-row">
                      <div className="photo-thumb-preview">
                        {invitation.groom_photo ? (
                          <img src={mediaUrl(invitation.groom_photo)} alt="Mempelai Pria" />
                        ) : (
                          <div className="thumb-placeholder">Foto Pria</div>
                        )}
                      </div>
                      <div className="photo-upload-meta">
                        <div className="photo-meta-buttons">
                          <label className="btn-upload-label">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleUploadCouplePhoto('groom_photo', e)}
                              disabled={uploadingSlot === 'groom_photo'}
                            />
                            {uploadingSlot === 'groom_photo' ? 'Mengunggah...' : (invitation.groom_photo ? 'Ganti Foto Pria' : 'Upload Foto Pria')}
                          </label>
                          {invitation.groom_photo && (
                            <button
                              type="button"
                              className="btn-adjust-photo-tab1"
                              onClick={() => {
                                setAdjusterConfig({
                                  target: 'groom_photo',
                                  aspectRatio: '1:1',
                                  initialImageUrl: mediaUrl(invitation.groom_photo),
                                  title: 'Atur Posisi Foto Mempelai Pria',
                                  subtitle: 'Geser foto (kiri, kanan, atas, bawah) dan atur zoom agar wajah mempelai pria pas di tengah lingkaran.',
                                  hint: '📐 Frame Foto Mempelai Pria (Rasio 1:1 Bulat/Kotak)',
                                });
                              }}
                              title="Geser posisi foto pria (kiri, kanan, atas, bawah, zoom)"
                            >
                              📐 Geser / Posisi
                            </button>
                          )}
                        </div>
                        <small>Format JPG/PNG/WEBP maks 5 MB</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mempelai Wanita */}
                <div className="editor-card-box">
                  <div className="box-header">
                    <span className="box-title">👗 Mempelai Wanita</span>
                  </div>
                  <div className="editor-fields-group">
                    <label className="editor-field">
                      <span>Nama Lengkap</span>
                      <input
                        type="text"
                        value={invitation.bride_full_name || ''}
                        onChange={(e) => handleFieldChange('bride_full_name', e.target.value)}
                        placeholder="Contoh: Anindya Kirana, S.Ds."
                        required
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Panggilan</span>
                      <input
                        type="text"
                        value={invitation.bride_nickname || ''}
                        onChange={(e) => handleFieldChange('bride_nickname', e.target.value)}
                        placeholder="Contoh: Anindya"
                        required
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Ayah</span>
                      <input
                        type="text"
                        value={invitation.bride_father || ''}
                        onChange={(e) => handleFieldChange('bride_father', e.target.value)}
                        placeholder="Contoh: Bpk. H. Firmansyah"
                      />
                    </label>
                    <label className="editor-field">
                      <span>Nama Ibu</span>
                      <input
                        type="text"
                        value={invitation.bride_mother || ''}
                        onChange={(e) => handleFieldChange('bride_mother', e.target.value)}
                        placeholder="Contoh: Ibu Hj. Lestari"
                      />
                    </label>

                    {/* Foto Wanita */}
                    <div className="couple-photo-upload-row">
                      <div className="photo-thumb-preview">
                        {invitation.bride_photo ? (
                          <img src={mediaUrl(invitation.bride_photo)} alt="Mempelai Wanita" />
                        ) : (
                          <div className="thumb-placeholder">Foto Wanita</div>
                        )}
                      </div>
                      <div className="photo-upload-meta">
                        <div className="photo-meta-buttons">
                          <label className="btn-upload-label">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleUploadCouplePhoto('bride_photo', e)}
                              disabled={uploadingSlot === 'bride_photo'}
                            />
                            {uploadingSlot === 'bride_photo' ? 'Mengunggah...' : (invitation.bride_photo ? 'Ganti Foto Wanita' : 'Upload Foto Wanita')}
                          </label>
                          {invitation.bride_photo && (
                            <button
                              type="button"
                              className="btn-adjust-photo-tab1"
                              onClick={() => {
                                setAdjusterConfig({
                                  target: 'bride_photo',
                                  aspectRatio: '1:1',
                                  initialImageUrl: mediaUrl(invitation.bride_photo),
                                  title: 'Atur Posisi Foto Mempelai Wanita',
                                  subtitle: 'Geser foto (kiri, kanan, atas, bawah) dan atur zoom agar wajah mempelai wanita pas di tengah lingkaran.',
                                  hint: '📐 Frame Foto Mempelai Wanita (Rasio 1:1 Bulat/Kotak)',
                                });
                              }}
                              title="Geser posisi foto wanita (kiri, kanan, atas, bawah, zoom)"
                            >
                              📐 Geser / Posisi
                            </button>
                          )}
                        </div>
                        <small>Format JPG/PNG/WEBP maks 5 MB</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2 Kolom: Jadwal Akad & Resepsi */}
              <div className="editor-section-grid">
                {/* Akad Nikah */}
                <div className="editor-card-box">
                  <div className="box-header">
                    <span className="box-title">💍 Akad / Pemberkatan</span>
                  </div>
                  <div className="editor-fields-group">
                    <label className="editor-field">
                      <span>Tanggal Akad</span>
                      <input
                        type="date"
                        value={invitation.akad_date || ''}
                        onChange={(e) => handleFieldChange('akad_date', e.target.value)}
                      />
                    </label>
                    <div className="editor-time-row">
                      <label className="editor-field">
                        <span>Jam Mulai</span>
                        <input
                          type="time"
                          value={invitation.akad_start_time || ''}
                          onChange={(e) => handleFieldChange('akad_start_time', e.target.value)}
                        />
                      </label>
                      <label className="editor-field">
                        <span>Jam Selesai</span>
                        <input
                          type="time"
                          value={invitation.akad_end_time || ''}
                          onChange={(e) => handleFieldChange('akad_end_time', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Resepsi */}
                <div className="editor-card-box">
                  <div className="box-header">
                    <span className="box-title">🎉 Resepsi Pernikahan</span>
                  </div>
                  <div className="editor-fields-group">
                    <label className="editor-field">
                      <span>Tanggal Resepsi</span>
                      <input
                        type="date"
                        value={invitation.reception_date || ''}
                        onChange={(e) => handleFieldChange('reception_date', e.target.value)}
                      />
                    </label>
                    <div className="editor-time-row">
                      <label className="editor-field">
                        <span>Jam Mulai</span>
                        <input
                          type="time"
                          value={invitation.reception_start_time || ''}
                          onChange={(e) => handleFieldChange('reception_start_time', e.target.value)}
                        />
                      </label>
                      <label className="editor-field">
                        <span>Jam Selesai</span>
                        <input
                          type="time"
                          value={invitation.reception_end_time || ''}
                          onChange={(e) => handleFieldChange('reception_end_time', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lokasi & Tempat */}
              <div className="editor-card-box">
                <div className="box-header">
                  <span className="box-title">📍 Lokasi &amp; Peta Acara</span>
                </div>
                <div className="editor-fields-group">
                  <label className="editor-field">
                    <span>Nama Gedung / Tempat</span>
                    <input
                      type="text"
                      value={invitation.venue_name || ''}
                      onChange={(e) => handleFieldChange('venue_name', e.target.value)}
                      placeholder="Contoh: Pendopo Arunika / Grand Ballroom"
                    />
                  </label>
                  <label className="editor-field">
                    <span>Alamat Lengkap</span>
                    <textarea
                      rows="2"
                      value={invitation.venue_address || ''}
                      onChange={(e) => handleFieldChange('venue_address', e.target.value)}
                      placeholder="Contoh: Jl. Melati No. 12, Yogyakarta"
                    />
                  </label>
                  <label className="editor-field">
                    <span>Link Google Maps</span>
                    <input
                      type="url"
                      value={invitation.maps_url || ''}
                      onChange={(e) => handleFieldChange('maps_url', e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                  </label>
                  <label className="editor-field">
                    <span>Patokan Terdekat</span>
                    <input
                      type="text"
                      value={invitation.nearest_landmark || ''}
                      onChange={(e) => handleFieldChange('nearest_landmark', e.target.value)}
                      placeholder="Contoh: 300 meter dari Tugu Jogja"
                    />
                  </label>
                </div>
              </div>

              {/* Kisah Cinta & Instagram */}
              <div className="editor-card-box">
                <div className="box-header">
                  <span className="box-title">📖 Kisah Pasangan &amp; Instagram</span>
                </div>
                <div className="editor-fields-group">
                  <label className="editor-field">
                    <span>Kisah Singkat (Love Story)</span>
                    <textarea
                      rows="3"
                      value={invitation.love_story || ''}
                      onChange={(e) => handleFieldChange('love_story', e.target.value)}
                      placeholder="Ceritakan awal mula bertemu dan perjalanan cinta..."
                    />
                  </label>
                  <label className="editor-field">
                    <span>Username Instagram Pasangan (opsional)</span>
                    <input
                      type="text"
                      value={invitation.instagram || ''}
                      onChange={(e) => handleFieldChange('instagram', e.target.value)}
                      placeholder="Contoh: baskara.anindya"
                    />
                  </label>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="editor-form-bottom-bar">
                <button
                  type="submit"
                  className="btn-save-editor"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : '💾 Simpan Data Mempelai & Acara'}
                </button>
              </div>
            </form>
          ) : activeTab === 'gallery' ? (
            /* ======================================================== */
            /* TAB 2: PLOT GALERI FOTO PER PAKET */
            /* ======================================================== */
            <div className="template-editor-gallery-tab">
              {/* Package Selector Pills */}
              <div className="package-plot-selector">
                {packages.map((pkg) => {
                  const isPkgActive = activePkg === pkg.code;
                  const count = (gallery[pkg.code] || []).filter(Boolean).length;
                  return (
                    <button
                      type="button"
                      key={pkg.code}
                      className={`package-plot-btn ${isPkgActive ? 'is-active' : ''}`}
                      onClick={() => setActivePkg(pkg.code)}
                    >
                      <strong>Paket {pkg.name}</strong>
                      <span className="plot-badge">
                        {count}/{pkg.gallery_limit} Foto Terisi
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Package Plot Banner */}
              <div className="plot-info-banner">
                <div className="plot-info-text">
                  <h3>
                    Plot Galeri Paket {currentPackage.name} — Maksimal {maxSlots} Foto
                  </h3>
                  <p>
                    Unggah foto untuk masing-masing slot di bawah ini. Anda dapat memasang foto yang berbeda di paket <b>Essential</b> (2 foto), <b>Signature</b> (3 foto), maupun <b>Prestige</b> (5 foto), sehingga calon customer dapat melihat variasi galeri pada setiap paket.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-preview-package-direct"
                  onClick={() => openLivePreview(activePkg)}
                >
                  Lihat Live Preview {currentPackage.name} ↗
                </button>
              </div>

              {/* Package Special Photos (Cover & Stage Photo) */}
              <div className="package-special-photos-box">
                <div className="special-photos-header">
                  <div className="special-photos-title-group">
                    <h4>🖼️ Foto Cover &amp; Panggung Paket {currentPackage.name}</h4>
                    <p>Atur foto cover pembuka dan foto berdiri di panggung khusus untuk paket <b>{currentPackage.name}</b>. Foto ini bisa berbeda antar paket dan dapat digeser posisi maupun zoom-nya.</p>
                  </div>
                </div>

                <div className="package-special-photos-grid">
                  {/* Foto Cover Paket */}
                  <div className="package-photo-card">
                    <div className="package-photo-card-top">
                      <div className="package-photo-meta-header">
                        <span className="package-photo-title">Foto Cover ({currentPackage.name})</span>
                        {pkgCoverCustom ? (
                          <span className="badge-photo-custom">✓ Kustom Paket</span>
                        ) : (
                          <span className="badge-photo-default">Bawaan Template</span>
                        )}
                      </div>
                      <p className="package-photo-desc">Foto sampul depan yang tampil di layar pertama undangan paket {currentPackage.name}.</p>
                    </div>

                    <div className="package-photo-preview-wrap">
                      <div className="package-photo-thumb">
                        {effectiveCover ? (
                          <img src={mediaUrl(effectiveCover)} alt={`Cover ${currentPackage.name}`} />
                        ) : (
                          <div className="thumb-placeholder">Belum Ada Foto Cover</div>
                        )}
                      </div>

                      <div className="package-photo-actions">
                        <label className="btn-package-photo-upload">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleUploadPackagePhoto('cover_image', activePkg, e)}
                            disabled={uploadingSlot === `${activePkg}:cover_image`}
                          />
                          {uploadingSlot === `${activePkg}:cover_image` ? 'Mengunggah...' : '📁 Upload / Ganti Cover'}
                        </label>

                        {effectiveCover && (
                          <button
                            type="button"
                            className="btn-package-photo-adjust"
                            onClick={() => {
                              setAdjusterConfig({
                                target: 'package_cover',
                                packageCode: activePkg,
                                aspectRatio: '3:4',
                                initialImageUrl: mediaUrl(effectiveCover),
                                title: `Atur Posisi Foto Cover — Paket ${currentPackage.name}`,
                                subtitle: `Geser foto (kiri, kanan, atas, bawah) dan atur zoom untuk tampilan cover paket ${currentPackage.name}.`,
                                hint: '📐 Frame Foto Cover (Rasio 3:4)',
                              });
                            }}
                            title="Geser posisi kiri/kanan/atas/bawah & zoom foto cover"
                          >
                            📐 Geser / Posisi
                          </button>
                        )}

                        {pkgCoverCustom && (
                          <button
                            type="button"
                            className="btn-package-photo-reset"
                            onClick={() => handleDeletePackagePhoto('cover_image', activePkg)}
                            disabled={uploadingSlot === `${activePkg}:cover_image`}
                            title="Reset foto cover khusus paket ini ke foto bawaan template"
                          >
                            🗑️ Reset ke Bawaan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Foto Berdiri di Panggung (Stage Couple) */}
                  <div className="package-photo-card">
                    <div className="package-photo-card-top">
                      <div className="package-photo-meta-header">
                        <span className="package-photo-title">Foto Berdiri di Panggung ({currentPackage.name})</span>
                        {pkgStageCustom ? (
                          <span className="badge-photo-custom">✓ Kustom Paket</span>
                        ) : (
                          <span className="badge-photo-default">Bawaan Template</span>
                        )}
                      </div>
                      <p className="package-photo-desc">Foto mempelai berdiri di panggung pelaminan / gapura (fitur khusus Modern Javanese &amp; Luxury Vibes paket {currentPackage.name}).</p>
                    </div>

                    <div className="package-photo-preview-wrap">
                      <div className="package-photo-thumb">
                        {effectiveStage ? (
                          <img src={mediaUrl(effectiveStage)} alt={`Panggung ${currentPackage.name}`} />
                        ) : (
                          <div className="thumb-placeholder">Belum Ada Foto Panggung</div>
                        )}
                      </div>

                      <div className="package-photo-actions">
                        <label className="btn-package-photo-upload">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => handleUploadPackagePhoto('stage_photo', activePkg, e)}
                            disabled={uploadingSlot === `${activePkg}:stage_photo`}
                          />
                          {uploadingSlot === `${activePkg}:stage_photo` ? 'Mengunggah...' : '📁 Upload / Ganti Foto Panggung'}
                        </label>

                        {effectiveStage && (
                          <button
                            type="button"
                            className="btn-package-photo-adjust"
                            onClick={() => {
                              setAdjusterConfig({
                                target: 'package_stage',
                                packageCode: activePkg,
                                aspectRatio: '3:4',
                                initialImageUrl: mediaUrl(effectiveStage),
                                title: `Atur Posisi Foto Panggung — Paket ${currentPackage.name}`,
                                subtitle: `Geser foto berdiri di panggung (kiri, kanan, atas, bawah) dan sesuaikan zoom agar proporsional.`,
                                hint: '📐 Frame Foto Panggung (Rasio 3:4)',
                              });
                            }}
                            title="Geser posisi kiri/kanan/atas/bawah & zoom foto panggung"
                          >
                            📐 Geser / Posisi
                          </button>
                        )}

                        {pkgStageCustom && (
                          <button
                            type="button"
                            className="btn-package-photo-reset"
                            onClick={() => handleDeletePackagePhoto('stage_photo', activePkg)}
                            disabled={uploadingSlot === `${activePkg}:stage_photo`}
                            title="Reset foto panggung khusus paket ini ke foto bawaan template"
                          >
                            🗑️ Reset ke Bawaan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slots Section Header */}
              <div className="gallery-section-divider">
                <span className="gallery-section-title">📸 Slot Galeri Kenangan — Paket {currentPackage.name} ({currentPhotos.filter(Boolean).length}/{maxSlots} Terisi)</span>
              </div>

              {/* Slots Grid */}
              <div className={`gallery-slots-grid slots-${maxSlots}`}>
                {Array.from({ length: maxSlots }, (_, idx) => {
                  const photo = currentPhotos[idx];
                  const isUploading = uploadingSlot === `${activePkg}:${idx}`;
                  const hasPhoto = Boolean(photo?.file_path || photo?.url);

                  return (
                    <div className={`gallery-slot-card ${hasPhoto ? 'has-photo' : 'is-empty'}`} key={idx}>
                      <div className="slot-badge-line">
                        <span className="slot-number">Slot {idx + 1}</span>
                        {hasPhoto && <span className="slot-status-tag">Terisi</span>}
                      </div>

                      <div className="slot-preview-area">
                        {isUploading ? (
                          <div className="slot-loading-indicator">
                            <span className="loading-spinner" />
                            <span>Mengunggah...</span>
                          </div>
                        ) : hasPhoto ? (
                          <img
                            src={mediaUrl(photo.url || photo.file_path)}
                            alt={`Galeri Slot ${idx + 1}`}
                            className="slot-img"
                          />
                        ) : (
                          <label className="slot-empty-dropzone">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleUploadSlot(idx, e)}
                              disabled={Boolean(uploadingSlot)}
                            />
                            <span className="dropzone-icon">📷</span>
                            <strong>+ Upload Foto</strong>
                            <small>Slot {idx + 1} ({currentPackage.name})</small>
                          </label>
                        )}
                      </div>

                      {hasPhoto && !isUploading && (
                        <div className="slot-actions">
                          <button
                            type="button"
                            className="btn-slot-adjust"
                            onClick={() => {
                              setAdjusterConfig({
                                target: 'gallery_slot',
                                packageCode: activePkg,
                                slotIndex: idx,
                                aspectRatio: '3:4',
                                initialImageUrl: mediaUrl(photo.url || photo.file_path),
                                title: `Atur Posisi Galeri Slot ${idx + 1} (${currentPackage.name})`,
                                subtitle: `Geser foto slot ${idx + 1} ke kiri, kanan, atas, bawah, atau atur zoom agar tampilan galeri pas.`,
                                hint: '📐 Frame Foto Galeri (Rasio 3:4)',
                              });
                            }}
                            title="Geser foto ke kiri, kanan, atas, bawah atau atur zoom"
                          >
                            📐 Geser
                          </button>
                          <label className="btn-slot-replace">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleUploadSlot(idx, e)}
                              disabled={Boolean(uploadingSlot)}
                            />
                            Ganti
                          </label>
                          <button
                            type="button"
                            className="btn-slot-delete"
                            onClick={() => handleDeleteSlot(idx)}
                            disabled={Boolean(uploadingSlot)}
                            title="Hapus foto dari slot ini"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'music' ? (
            /* ======================================================== */
            /* TAB 3: MUSIK LATAR UNDANGAN (SIGNATURE & PRESTIGE) */
            /* ======================================================== */
            <div className="template-editor-music-tab">
              <div className="editor-banner-hint">
                <span className="hint-icon">🎵</span>
                <div>
                  <strong>Fitur Musik Latar: Khusus Paket Signature &amp; Prestige</strong>
                  <p>
                    Audio latar ini akan otomatis diputar ketika tamu membuka undangan atau melalui tombol kontrol musik. Pada paket <b>Essential</b>, pemutar musik otomatis dinonaktifkan sesuai spesifikasi paket hemat.
                  </p>
                </div>
              </div>

              {/* Music Player & Upload Card */}
              <div className="music-player-box">
                <div className="music-box-header">
                  <div>
                    <span className="eyebrow">BERKAS AUDIO UNDANGAN</span>
                    <h3>{invitation.music_title || 'Belum Ada Judul Musik'}</h3>
                  </div>
                  {invitation.music_file && (
                    <span className="music-status-pill">✓ Musik Terpasang</span>
                  )}
                </div>

                {invitation.music_file ? (
                  <div className="music-active-container">
                    <div className="audio-preview-line">
                      <audio
                        controls
                        src={mediaUrl(invitation.music_file)}
                        className="admin-audio-player"
                      >
                        Browser Anda tidak mendukung elemen audio.
                      </audio>
                    </div>

                    <div className="music-meta-form">
                      <label className="editor-field" style={{ flex: 1 }}>
                        <span>Judul Lagu / Musik (Tampil saat tombol musik di-hover)</span>
                        <input
                          type="text"
                          value={invitation.music_title || ''}
                          onChange={(e) => handleFieldChange('music_title', e.target.value)}
                          placeholder="Contoh: A Thousand Years - Christina Perri"
                        />
                      </label>
                    </div>

                    <div className="music-actions-cluster">
                      <label className="btn-upload-music-replace">
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
                          onChange={handleUploadMusic}
                          disabled={uploadingSlot === 'music'}
                        />
                        {uploadingSlot === 'music' ? 'Mengunggah...' : '🔄 Ganti File Audio (MP3/WAV)'}
                      </label>
                      <button
                        type="button"
                        className="btn-delete-music"
                        onClick={handleDeleteMusic}
                        disabled={uploadingSlot === 'music'}
                      >
                        ✕ Hapus Musik
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="music-upload-dropzone">
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
                      onChange={handleUploadMusic}
                      disabled={uploadingSlot === 'music'}
                    />
                    <span className="music-dropzone-icon">🎶</span>
                    <strong>{uploadingSlot === 'music' ? 'Sedang Mengunggah Audio...' : '+ Unggah File Musik Latar'}</strong>
                    <p>Format MP3, M4A, OGG, atau WAV. Ukuran maksimal 15 MB.</p>
                  </label>
                )}
              </div>

              {/* Uji Live Preview Tab Bar */}
              <div className="music-preview-test-card">
                <h4>🧪 Uji Coba Pemutaran Musik di Halaman Preview:</h4>
                <p>Klik tombol di bawah untuk langsung menguji perilaku pemutaran musik pada masing-masing paket:</p>
                <div className="editor-test-bar">
                  <button
                    type="button"
                    className="btn-test-preview btn-test-signature"
                    onClick={() => openLivePreview('signature')}
                  >
                    ▶️ Preview Signature (Ada Musik) ↗
                  </button>
                  <button
                    type="button"
                    className="btn-test-preview btn-test-prestige"
                    onClick={() => openLivePreview('prestige')}
                  >
                    ▶️ Preview Prestige (Ada Musik) ↗
                  </button>
                  <button
                    type="button"
                    className="btn-test-preview btn-test-essential"
                    onClick={() => openLivePreview('essential')}
                  >
                    🚫 Preview Essential (Tanpa Musik) ↗
                  </button>
                </div>
              </div>

              {/* Sticky bottom bar to save music title if edited */}
              <div className="editor-form-bottom-bar">
                <button
                  type="button"
                  className="btn-save-editor"
                  onClick={handleSaveInfo}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : '💾 Simpan Judul & Pengaturan Musik'}
                </button>
              </div>
            </div>
          ) : activeTab === 'bank' ? (
            /* ======================================================== */
            /* TAB 4: REKENING & AMPLOP DIGITAL (PRESTIGE) */
            /* ======================================================== */
            <div className="template-editor-bank-tab">
              <div className="editor-banner-hint">
                <span className="hint-icon">💳</span>
                <div>
                  <strong>Amplop Digital &amp; Hadiah: Eksklusif Paket Prestige</strong>
                  <p>
                    Daftar rekening bank atau e-wallet di bawah ini <b>hanya akan tampil pada paket Prestige</b>. Di paket <b>Essential</b> dan <b>Signature</b>, fitur amplop digital ini otomatis disembunyikan sesuai hak fitur paket.
                  </p>
                </div>
              </div>

              {/* Active Bank Accounts List */}
              <div className="bank-section-box">
                <div className="box-header">
                  <div>
                    <span className="box-title">Daftar Rekening Hadiah Aktif</span>
                    <small style={{ color: '#5b756b', display: 'block', marginTop: '2px' }}>
                      {(invitation.gift_accounts || []).length} Rekening / E-Wallet terpasang untuk demo
                    </small>
                  </div>
                </div>

                <div className="bank-accounts-grid">
                  {(invitation.gift_accounts || []).map((account, idx) => (
                    <div className="bank-card-item" key={account.id || idx}>
                      <div className="bank-card-top">
                        <span className="bank-badge">{account.provider || 'Bank'}</span>
                        <button
                          type="button"
                          className="btn-delete-bank"
                          onClick={() => handleDeleteBank(account.id || idx)}
                          title="Hapus rekening ini dari daftar"
                        >
                          ✕ Hapus
                        </button>
                      </div>
                      <div className="bank-acc-num">{account.account_number}</div>
                      <div className="bank-acc-name">a.n. <strong>{account.account_name}</strong></div>
                      {account.label && <div className="bank-acc-label">{account.label}</div>}
                    </div>
                  ))}

                  {(!invitation.gift_accounts || invitation.gift_accounts.length === 0) && (
                    <div className="bank-empty-notice">
                      Belum ada rekening hadiah yang ditambahkan. Silakan gunakan form di bawah untuk menambahkan rekening.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Add New Bank Account */}
              <form onSubmit={handleAddBank} className="bank-add-card">
                <div className="bank-add-title">
                  <strong>+ Tambah Rekening / E-Wallet Baru</strong>
                  <p>Isi informasi bank atau dompet digital untuk amplop pernikahan demo.</p>
                </div>

                <div className="bank-form-grid">
                  <label className="editor-field">
                    <span>Pilih Bank / E-Wallet</span>
                    <select
                      value={bankDraft.provider}
                      onChange={(e) => setBankDraft((prev) => ({ ...prev, provider: e.target.value }))}
                    >
                      {BANK_PROVIDERS.map((p) => (
                        <option value={p} key={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  <label className="editor-field">
                    <span>Nomor Rekening / No. HP E-Wallet</span>
                    <input
                      type="text"
                      value={bankDraft.account_number}
                      onChange={(e) => setBankDraft((prev) => ({ ...prev, account_number: e.target.value }))}
                      placeholder="Contoh: 8830192834 atau 081234567890"
                      required
                    />
                  </label>

                  <label className="editor-field">
                    <span>Atas Nama Pemilik Rekening</span>
                    <input
                      type="text"
                      value={bankDraft.account_name}
                      onChange={(e) => setBankDraft((prev) => ({ ...prev, account_name: e.target.value }))}
                      placeholder="Contoh: Baskara Adiputra"
                      required
                    />
                  </label>

                  <label className="editor-field">
                    <span>Keterangan / Label (Opsional)</span>
                    <input
                      type="text"
                      value={bankDraft.label}
                      onChange={(e) => setBankDraft((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Contoh: Rekening Pria / Amplop Digital"
                    />
                  </label>
                </div>

                <div className="bank-add-action-line">
                  <button type="submit" className="btn-add-bank-submit">
                    + Tambahkan ke Daftar Rekening
                  </button>
                </div>
              </form>

              {/* Live Preview Test Buttons for Bank Accounts */}
              <div className="bank-preview-test-card">
                <h4>🧪 Uji Coba Tampilan Rekening di Halaman Preview:</h4>
                <p>Pastikan rekening amplop digital hanya muncul di Prestige dan tersembunyi di Signature &amp; Essential:</p>
                <div className="editor-test-bar">
                  <button
                    type="button"
                    className="btn-test-preview btn-test-prestige"
                    onClick={() => openLivePreview('prestige')}
                  >
                    👁️ Cek Preview Prestige (Rekening MUNCUL) ↗
                  </button>
                  <button
                    type="button"
                    className="btn-test-preview btn-test-signature"
                    onClick={() => openLivePreview('signature')}
                  >
                    👁️ Cek Preview Signature (Rekening TIDAK MUNCUL) ↗
                  </button>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="editor-form-bottom-bar">
                <button
                  type="button"
                  className="btn-save-editor"
                  onClick={handleSaveInfo}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : '💾 Simpan Perubahan Rekening'}
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 5: KARTU UCAPAN & RSVP (SIGNATURE & PRESTIGE) */
            /* ======================================================== */
            <div className="template-editor-guests-tab">
              <div className="editor-banner-hint">
                <span className="hint-icon">💬</span>
                <div>
                  <strong>Kelola Kartu Ucapan &amp; RSVP Tamu</strong>
                  <p>
                    Atur feed kartu ucapan doa restu tamu yang tampil pada preview template. Sesuai fitur paket, kartu ucapan &amp; konfirmasi kehadiran ini otomatis <b>MUNCUL</b> di paket <b>Signature</b> dan <b>Prestige</b>, serta otomatis <b>TIDAK MUNCUL</b> di paket <b>Essential</b>.
                  </p>
                </div>
              </div>

              {/* Form Tambah Kartu Ucapan Baru */}
              <div className="guest-simulator-box">
                <div className="box-header">
                  <div>
                    <span className="box-title">➕ Tambah Kartu Ucapan Tamu Baru</span>
                    <small style={{ color: '#5b756b', display: 'block', marginTop: '2px' }}>
                      Masukkan nama tamu, status kehadiran, dan pesan doa restu untuk ditampilkan di kartu ucapan preview.
                    </small>
                  </div>
                </div>

                <form onSubmit={handleAddGreeting} className="greeting-add-form">
                  <div className="greeting-form-grid">
                    <label className="editor-field" style={{ minWidth: '220px', flex: 1 }}>
                      <span>Nama Tamu / Kerabat / Sahabat</span>
                      <input
                        type="text"
                        value={greetingDraft.guest_name}
                        onChange={(e) => setGreetingDraft((prev) => ({ ...prev, guest_name: e.target.value }))}
                        placeholder="Contoh: Dila &amp; Fajar, Bpk. Joko Widodo &amp; Keluarga"
                        required
                      />
                    </label>

                    <div className="editor-field attendance-field" style={{ minWidth: '320px', flex: 1.3 }}>
                      <span>Konfirmasi Kehadiran</span>
                      <div className="attendance-pills-selector" role="radiogroup" aria-label="Status Kehadiran">
                        <button
                          type="button"
                          className={`attendance-pill-option attending ${greetingDraft.attendance_status === 'attending' ? 'is-active' : ''}`}
                          onClick={() => setGreetingDraft((prev) => ({ ...prev, attendance_status: 'attending' }))}
                          aria-checked={greetingDraft.attendance_status === 'attending'}
                          role="radio"
                        >
                          <span className="pill-dot">●</span>
                          <span className="pill-label">Hadir</span>
                          {greetingDraft.attendance_status === 'attending' && <span className="pill-check">✓</span>}
                        </button>
                        <button
                          type="button"
                          className={`attendance-pill-option not_attending ${greetingDraft.attendance_status === 'not_attending' ? 'is-active' : ''}`}
                          onClick={() => setGreetingDraft((prev) => ({ ...prev, attendance_status: 'not_attending' }))}
                          aria-checked={greetingDraft.attendance_status === 'not_attending'}
                          role="radio"
                        >
                          <span className="pill-dot">●</span>
                          <span className="pill-label">Tidak Hadir</span>
                          {greetingDraft.attendance_status === 'not_attending' && <span className="pill-check">✓</span>}
                        </button>
                        <button
                          type="button"
                          className={`attendance-pill-option unsure ${greetingDraft.attendance_status === 'unsure' ? 'is-active' : ''}`}
                          onClick={() => setGreetingDraft((prev) => ({ ...prev, attendance_status: 'unsure' }))}
                          aria-checked={greetingDraft.attendance_status === 'unsure'}
                          role="radio"
                        >
                          <span className="pill-dot">●</span>
                          <span className="pill-label">Masih Ragu</span>
                          {greetingDraft.attendance_status === 'unsure' && <span className="pill-check">✓</span>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="editor-field" style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Pesan Ucapan &amp; Doa Restu</span>
                      <small style={{ color: '#688477', fontSize: '0.72rem' }}>{greetingDraft.message.length}/500</small>
                    </div>
                    <textarea
                      value={greetingDraft.message}
                      onChange={(e) => setGreetingDraft((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Tuliskan doa hangat untuk kedua mempelai..."
                      maxLength={500}
                      rows={3}
                      required
                    />
                  </label>

                  <div className="greeting-add-action-line" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-add-greeting-submit">
                      <span className="btn-add-greeting-icon">💬</span>
                      <span>+ Tambah Kartu Ucapan ke Feed</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Kartu Ucapan Aktif */}
              <div className="guest-simulator-box">
                <div className="box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="box-title">💌 Feed Kartu Ucapan yang Ditampilkan (Preview)</span>
                    <small style={{ color: '#5b756b', display: 'block', marginTop: '2px' }}>
                      Total {(invitation.greetings || []).length} kartu ucapan aktif untuk template ini.
                    </small>
                  </div>
                </div>

                <div className="greetings-grid">
                  {(invitation.greetings || []).map((greet, idx) => {
                    const status = greet.attendance_status === 'not_attending'
                      ? { label: 'Tidak Hadir', pillClass: 'not_attending', icon: '🔴' }
                      : greet.attendance_status === 'unsure'
                      ? { label: 'Masih Ragu', pillClass: 'unsure', icon: '🟡' }
                      : { label: 'Hadir', pillClass: 'attending', icon: '🟢' };

                    return (
                      <div className="greeting-card-admin" key={greet.id || idx}>
                        <div className="greeting-card-header">
                          <div className="greeting-guest-info">
                            <span className={`guest-avatar-icon ${status.pillClass}`}>
                              {(greet.guest_name || 'T')[0].toUpperCase()}
                            </span>
                            <div className="guest-meta-block">
                              <strong className="greeting-guest-name">{greet.guest_name}</strong>
                              <span className={`attendance-pill ${status.pillClass}`}>
                                <span className="badge-bullet">●</span>
                                {status.label}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-delete-greeting"
                            onClick={() => handleDeleteGreeting(greet.id || idx)}
                            title="Hapus kartu ucapan ini"
                          >
                            ✕ Hapus
                          </button>
                        </div>
                        <div className="greeting-card-msg">
                          <span className="msg-quote-mark">“</span>
                          <p>{greet.message}</p>
                        </div>
                      </div>
                    );
                  })}

                  {(!invitation.greetings || invitation.greetings.length === 0) && (
                    <div className="greetings-empty-notice">
                      Belum ada kartu ucapan yang tersimpan. Gunakan form di atas untuk menambahkan ucapan simulasi.
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Test Buttons for Wishes */}
              <div className="bank-preview-test-card">
                <h4>🧪 Uji Coba Tampilan Kartu Ucapan &amp; RSVP di Preview:</h4>
                <p>
                  Periksa bagaimana feed kartu ucapan otomatis tampil di Signature dan Prestige, serta tidak muncul sama sekali di Essential:
                </p>
                <div className="editor-test-bar">
                  <button
                    type="button"
                    className="btn-test-preview btn-test-signature"
                    onClick={() => openLivePreview('signature')}
                  >
                    👁️ Cek Preview Signature (Ucapan MUNCUL) ↗
                  </button>
                  <button
                    type="button"
                    className="btn-test-preview btn-test-prestige"
                    onClick={() => openLivePreview('prestige')}
                  >
                    👁️ Cek Preview Prestige (Ucapan MUNCUL) ↗
                  </button>
                  <button
                    type="button"
                    className="btn-test-preview btn-test-essential"
                    onClick={() => openLivePreview('essential')}
                  >
                    🚫 Cek Preview Essential (Ucapan TIDAK MUNCUL) ↗
                  </button>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="editor-form-bottom-bar">
                <button
                  type="button"
                  className="btn-save-editor"
                  onClick={handleSaveInfo}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : '💾 Simpan Kartu Ucapan & RSVP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adjuster for Pan & Zoom (Portal) */}
      {adjusterConfig && (
        <AdminCoverAdjusterModal
          isOpen={Boolean(adjusterConfig)}
          onClose={() => setAdjusterConfig(null)}
          template={template}
          initialImageUrl={adjusterConfig.initialImageUrl}
          aspectRatio={adjusterConfig.aspectRatio || '3:4'}
          title={adjusterConfig.title}
          subtitle={adjusterConfig.subtitle}
          hint={adjusterConfig.hint}
          onSaveCover={handleSaveAdjustedPhoto}
        />
      )}
    </div>
  );
}
