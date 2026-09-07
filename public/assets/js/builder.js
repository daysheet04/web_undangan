(() => {
    'use strict';

    const app = document.getElementById('builderApp');
    if (!app) return;

    const form = document.getElementById('invitationForm');
    const preview = document.getElementById('livePreview');
    const steps = [...document.querySelectorAll('.form-step')];
    const content = document.querySelector('.builder-content');
    const csrf = app.dataset.csrf;
    const token = app.dataset.token;
    let currentTemplate = app.dataset.template;
    let currentStep = 0;
    let saveTimer;
    let savePromise = Promise.resolve();
    let pendingTemplate = '';

    const fields = () => {
        const data = Object.fromEntries(new FormData(form).entries());
        data.editor_token = token;
        data._csrf = csrf;
        return data;
    };

    const setSaveState = (state, label) => {
        const target = document.getElementById('saveState');
        target.dataset.state = state;
        target.querySelector('span').textContent = label;
    };

    const postPreview = () => {
        preview.contentWindow?.postMessage({
            type: 'invitation:update',
            data: fields()
        }, window.location.origin);
    };

    const renderSlug = (result) => {
        const input = form.elements.slug;
        const status = document.getElementById('slugStatus');
        const suggestions = document.getElementById('slugSuggestions');
        if (!input.value.trim()) {
            status.textContent = '';
            status.className = 'slug-status';
            suggestions.replaceChildren();
            return;
        }
        status.textContent = result.slug_available ? '✓ URL tersedia' : (result.slug_message || 'URL belum valid');
        status.className = 'slug-status ' + (result.slug_available ? 'success' : 'error');
        suggestions.replaceChildren();
        (result.slug_suggestions || []).forEach((slug) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = slug;
            button.addEventListener('click', () => {
                input.value = slug;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            suggestions.appendChild(button);
        });
        updateChecklist();
    };

    const saveNow = async () => {
        window.clearTimeout(saveTimer);
        setSaveState('saving', 'Menyimpan...');
        savePromise = fetch('/api/invitation/autosave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(fields())
        }).then(async (response) => {
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Gagal menyimpan.');
            setSaveState('saved', 'Tersimpan');
            renderSlug(result);
            return result;
        }).catch((error) => {
            setSaveState('error', 'Gagal menyimpan');
            throw error;
        });
        return savePromise;
    };

    const queueSave = () => {
        window.clearTimeout(saveTimer);
        setSaveState('saving', 'Menyimpan...');
        saveTimer = window.setTimeout(() => saveNow().catch(() => {
            window.showToast?.('Perubahan belum dapat disimpan.', 'error');
        }), 1000);
    };

    const updateCharCount = () => {
        document.querySelectorAll('[data-char-count]').forEach((target) => {
            const input = form.elements[target.dataset.charCount];
            target.textContent = input?.value.length || 0;
        });
    };

    const groupComplete = (names) => names.every((name) => form.elements[name]?.value.trim());
    const updateChecklist = () => {
        const groups = {
            couple: ['groom_full_name', 'groom_nickname', 'bride_full_name', 'bride_nickname', 'groom_father', 'groom_mother', 'bride_father', 'bride_mother'],
            event: ['akad_date', 'akad_start_time', 'akad_end_time', 'reception_date', 'reception_start_time', 'reception_end_time', 'venue_name', 'venue_address'],
            story: ['love_story'],
            slug: ['slug']
        };
        Object.entries(groups).forEach(([group, names]) => {
            const row = document.querySelector(`[data-check-group="${group}"]`);
            if (!row) return;
            const complete = groupComplete(names);
            row.classList.toggle('complete', complete);
            row.querySelector('b').textContent = complete ? 'Lengkap' : 'Periksa';
        });
    };

    const showStep = (index) => {
        currentStep = Math.max(0, Math.min(steps.length - 1, index));
        steps.forEach((step, number) => step.classList.toggle('active', number === currentStep));
        document.getElementById('progressBar').style.width = `${((currentStep + 1) / steps.length) * 100}%`;
        document.getElementById('stepCaption').textContent = `Langkah ${currentStep + 1} dari ${steps.length}`;
        document.getElementById('stepTitle').textContent = steps[currentStep].dataset.title;
        document.getElementById('prevStep').disabled = currentStep === 0;
        document.getElementById('nextStep').hidden = currentStep === steps.length - 1;
        document.querySelector('.builder-form-pane').scrollTo({ top: 0, behavior: 'smooth' });
        if (currentStep === steps.length - 1) updateChecklist();
    };

    form.addEventListener('input', (event) => {
        if (event.target.name === 'slug') {
            const cleaned = event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
            if (cleaned !== event.target.value) event.target.value = cleaned;
        }
        event.target.closest('.field')?.classList.remove('invalid');
        updateCharCount();
        updateChecklist();
        postPreview();
        queueSave();
    });

    form.addEventListener('change', (event) => {
        if (event.target.type !== 'file') {
            postPreview();
            queueSave();
        }
    });

    document.getElementById('nextStep').addEventListener('click', () => showStep(currentStep + 1));
    document.getElementById('prevStep').addEventListener('click', () => showStep(currentStep - 1));

    document.querySelectorAll('[data-builder-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            const previewMode = button.dataset.builderTab === 'preview';
            content.classList.toggle('preview-mode', previewMode);
            document.querySelectorAll('[data-builder-tab]').forEach((tab) => {
                const active = tab === button;
                tab.classList.toggle('active', active);
                tab.setAttribute('aria-selected', String(active));
            });
            if (previewMode) postPreview();
        });
    });

    const previewUrl = () => `/template/${currentTemplate}?embed=1&token=${encodeURIComponent(token)}`;
    const reloadPreview = () => { preview.src = previewUrl(); };
    preview.addEventListener('load', () => window.setTimeout(postPreview, 100));
    window.addEventListener('message', (event) => {
        if (event.origin === window.location.origin && event.source === preview.contentWindow && event.data?.type === 'invitation:ready') {
            postPreview();
        }
    });
    document.querySelector('[data-refresh-preview]').addEventListener('click', reloadPreview);

    const compressImage = (file) => new Promise((resolve, reject) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            reject(new Error('Format foto harus JPG, PNG, atau WEBP.'));
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            reject(new Error('Foto asli terlalu besar. Pilih foto di bawah 15 MB.'));
            return;
        }
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(url);
            const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * ratio));
            canvas.height = Math.max(1, Math.round(image.height * ratio));
            const context = canvas.getContext('2d');
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const exportBlob = (quality) => canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Foto gagal diproses.'));
                    return;
                }
                if (blob.size > 2 * 1024 * 1024 && quality > .58) {
                    exportBlob(.58);
                    return;
                }
                if (blob.size > 2 * 1024 * 1024) {
                    reject(new Error('Foto masih lebih dari 2 MB setelah dikompres.'));
                    return;
                }
                resolve(new File([blob], 'photo-' + Date.now() + '.webp', { type: 'image/webp' }));
            }, 'image/webp', quality);
            exportBlob(.82);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Foto tidak dapat dibaca.'));
        };
        image.src = url;
    });

    const uploadPhoto = async (file, kind) => {
        const processed = await compressImage(file);
        const data = new FormData();
        data.append('_csrf', csrf);
        data.append('editor_token', token);
        data.append('kind', kind);
        data.append('photo', processed);
        const response = await fetch('/api/invitation/upload', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: data
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Upload gagal.');
        return result;
    };

    document.getElementById('coverInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const label = event.target.closest('.cover-upload');
        label.classList.add('uploading');
        try {
            const result = await uploadPhoto(file, 'cover');
            document.getElementById('coverThumb').src = result.path + '?v=' + Date.now();
            window.showToast?.(result.message);
            reloadPreview();
        } catch (error) {
            window.showToast?.(error.message, 'error');
        } finally {
            label.classList.remove('uploading');
            event.target.value = '';
        }
    });

    const bindProfilePhoto = (inputId, kind, thumbId) => {
        document.getElementById(inputId)?.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const label = event.target.closest('.cover-upload');
            label.classList.add('uploading');
            try {
                const result = await uploadPhoto(file, kind);
                document.getElementById(thumbId).src = result.path + '?v=' + Date.now();
                window.showToast?.(result.message);
                reloadPreview();
            } catch (error) {
                window.showToast?.(error.message, 'error');
            } finally {
                label.classList.remove('uploading');
                event.target.value = '';
            }
        });
    };
    bindProfilePhoto('brideInput', 'bride', 'brideThumb');
    bindProfilePhoto('groomInput', 'groom', 'groomThumb');

    const updateGalleryCount = () => {
        const count = document.querySelectorAll('#galleryEditor figure').length;
        document.getElementById('galleryCount').textContent = `${count}/5`;
        document.getElementById('galleryAdd').classList.toggle('disabled', count >= 5);
    };

    const addGalleryItem = (media) => {
        const figure = document.createElement('figure');
        figure.dataset.mediaId = media.id;
        const image = document.createElement('img');
        image.src = media.url;
        image.alt = 'Foto galeri';
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.deletePhoto = media.id;
        button.setAttribute('aria-label', 'Hapus foto');
        button.textContent = '×';
        figure.append(image, button);
        document.getElementById('galleryEditor').insertBefore(figure, document.getElementById('galleryAdd'));
        updateGalleryCount();
    };

    document.getElementById('galleryInput').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const label = event.target.closest('.gallery-add');
        label.classList.add('uploading');
        try {
            const result = await uploadPhoto(file, 'gallery');
            addGalleryItem(result.media);
            window.showToast?.(result.message);
            reloadPreview();
        } catch (error) {
            window.showToast?.(error.message, 'error');
        } finally {
            label.classList.remove('uploading');
            event.target.value = '';
        }
    });

    document.getElementById('galleryEditor').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-delete-photo]');
        if (!button || !window.confirm('Hapus foto ini dari galeri?')) return;
        button.disabled = true;
        try {
            const response = await fetch('/api/invitation/delete-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _csrf: csrf, editor_token: token, media_id: button.dataset.deletePhoto })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message);
            button.closest('figure').remove();
            updateGalleryCount();
            window.showToast?.(result.message);
            reloadPreview();
        } catch (error) {
            button.disabled = false;
            window.showToast?.(error.message || 'Foto gagal dihapus.', 'error');
        }
    });

    const uploadMusic = async (file) => {
        if (file.size > 12 * 1024 * 1024) throw new Error('Ukuran musik maksimal 12 MB.');
        const data = new FormData();
        data.append('_csrf', csrf);
        data.append('editor_token', token);
        data.append('kind', 'music');
        data.append('file', file);
        const response = await fetch('/api/invitation/upload', { method: 'POST', headers: { 'Accept': 'application/json' }, body: data });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message || 'Upload musik gagal.');
        return result;
    };

    document.getElementById('musicInput')?.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const card = event.target.closest('.music-upload-card');
        card.classList.add('uploading');
        try {
            const result = await uploadMusic(file);
            document.getElementById('musicTitle').textContent = result.title;
            window.showToast?.(result.message);
            reloadPreview();
        } catch (error) {
            window.showToast?.(error.message, 'error');
        } finally {
            card.classList.remove('uploading');
            event.target.value = '';
        }
    });

    const giftProviders = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'PermataBank', 'SeaBank', 'Jago', 'GoPay', 'DANA', 'OVO', 'ShopeePay', 'Lainnya'];
    const giftEditor = document.getElementById('giftAccountEditor');
    const refreshGiftEmpty = () => {
        document.getElementById('giftEmpty').hidden = Boolean(giftEditor.querySelector('[data-gift-row]'));
    };
    const createGiftRow = () => {
        const row = document.createElement('div');
        row.className = 'gift-account-row';
        row.dataset.giftRow = '';
        const fields = [
            ['provider', 'Bank / e-wallet', 'select'],
            ['account_number', 'Nomor rekening / akun', 'input'],
            ['account_name', 'Nama pemilik', 'input'],
            ['label', 'Label opsional', 'input']
        ];
        fields.forEach(([key, labelText, type]) => {
            const label = document.createElement('label');
            label.className = 'field';
            const caption = document.createElement('span');
            caption.textContent = labelText;
            const control = document.createElement(type);
            control.dataset.giftField = key;
            if (type === 'select') {
                giftProviders.forEach((provider) => control.add(new Option(provider, provider)));
            } else {
                control.maxLength = key === 'account_name' ? 150 : 100;
            }
            label.append(caption, control);
            row.appendChild(label);
        });
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-editor-row';
        remove.dataset.removeGift = '';
        remove.textContent = 'Hapus';
        row.appendChild(remove);
        return row;
    };

    document.getElementById('addGiftAccount')?.addEventListener('click', () => {
        if (giftEditor.querySelectorAll('[data-gift-row]').length >= 10) {
            window.showToast?.('Rekening maksimal sepuluh.', 'error');
            return;
        }
        giftEditor.appendChild(createGiftRow());
        refreshGiftEmpty();
    });
    giftEditor?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-gift]');
        if (!button) return;
        button.closest('[data-gift-row]').remove();
        refreshGiftEmpty();
    });
    document.getElementById('saveGiftAccounts')?.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const accounts = [...giftEditor.querySelectorAll('[data-gift-row]')].map((row) => Object.fromEntries(
            [...row.querySelectorAll('[data-gift-field]')].map((field) => [field.dataset.giftField, field.value.trim()])
        ));
        button.disabled = true;
        try {
            const response = await fetch('/api/invitation/gift-accounts', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _csrf: csrf, editor_token: token, accounts })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message);
            window.showToast?.(result.message);
            reloadPreview();
        } catch (error) {
            window.showToast?.(error.message || 'Rekening gagal disimpan.', 'error');
        } finally {
            button.disabled = false;
        }
    });

    const inviteeList = document.getElementById('inviteeList');
    const inviteeUrl = (guestName) => {
        const slug = form.elements.slug.value.trim() || 'preview-undangan';
        return `${window.location.origin}/${slug}?to=${encodeURIComponent(guestName)}`;
    };
    const refreshInvitees = () => {
        const rows = [...inviteeList.querySelectorAll('[data-guest-id]')];
        document.getElementById('inviteeCount').textContent = `${rows.length} nama tersimpan`;
        document.getElementById('inviteeEmpty').hidden = rows.length > 0;
        rows.forEach((row) => { row.querySelector('input').value = inviteeUrl(row.dataset.guestName); });
    };
    const createInviteeRow = (guest) => {
        const row = document.createElement('article');
        row.className = 'invitee-row';
        row.dataset.guestId = guest.id;
        row.dataset.guestName = guest.guest_name;
        const info = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = guest.guest_name;
        const meta = document.createElement('small');
        meta.textContent = guest.salutation;
        info.append(name, meta);
        const actions = document.createElement('div');
        actions.className = 'invitee-link';
        const input = document.createElement('input');
        input.readOnly = true;
        input.value = inviteeUrl(guest.guest_name);
        const copy = document.createElement('button');
        copy.type = 'button'; copy.dataset.copyInvitee = ''; copy.textContent = 'Salin';
        const remove = document.createElement('button');
        remove.type = 'button'; remove.dataset.deleteInvitee = ''; remove.textContent = 'Hapus';
        actions.append(input, copy, remove);
        row.append(info, actions);
        return row;
    };
    document.getElementById('addInvitee')?.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const guestName = document.getElementById('inviteeName').value.trim();
        if (!guestName) {
            window.showToast?.('Nama tamu wajib diisi.', 'error');
            return;
        }
        button.disabled = true;
        try {
            const response = await fetch('/api/invitation/invitees', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _csrf: csrf, editor_token: token, guest_name: guestName, salutation: document.getElementById('inviteeSalutation').value })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message);
            inviteeList.prepend(createInviteeRow(result.guest));
            document.getElementById('inviteeName').value = '';
            refreshInvitees();
            window.showToast?.(result.message);
        } catch (error) {
            window.showToast?.(error.message || 'Tamu gagal ditambahkan.', 'error');
        } finally {
            button.disabled = false;
        }
    });
    inviteeList?.addEventListener('click', async (event) => {
        const row = event.target.closest('[data-guest-id]');
        if (!row) return;
        if (event.target.closest('[data-copy-invitee]')) {
            const value = row.querySelector('input').value;
            try { await navigator.clipboard.writeText(value); window.showToast?.('Link tamu disalin.'); }
            catch (_) { window.prompt('Salin link undangan:', value); }
            return;
        }
        const remove = event.target.closest('[data-delete-invitee]');
        if (!remove || !window.confirm('Hapus nama tamu ini?')) return;
        remove.disabled = true;
        try {
            const response = await fetch('/api/invitation/invitees/delete', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _csrf: csrf, editor_token: token, guest_id: row.dataset.guestId })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message);
            row.remove(); refreshInvitees(); window.showToast?.(result.message);
        } catch (error) {
            remove.disabled = false;
            window.showToast?.(error.message || 'Tamu gagal dihapus.', 'error');
        }
    });
    form.elements.slug?.addEventListener('input', refreshInvitees);

    const dialog = document.getElementById('templateDialog');
    document.querySelector('[data-open-template]').addEventListener('click', () => dialog.showModal());
    document.querySelectorAll('[data-template-choice]').forEach((choice) => {
        choice.addEventListener('click', () => {
            pendingTemplate = choice.dataset.templateChoice;
            document.querySelectorAll('[data-template-choice]').forEach((item) => item.classList.toggle('pending', item === choice));
            document.getElementById('confirmTemplate').disabled = pendingTemplate === currentTemplate;
        });
    });
    document.getElementById('confirmTemplate').addEventListener('click', async (event) => {
        if (!pendingTemplate || pendingTemplate === currentTemplate) return;
        const button = event.currentTarget;
        const chosen = document.querySelector(`[data-template-choice="${pendingTemplate}"]`);
        if (!window.confirm(`Gunakan template ${chosen.dataset.templateName}? Semua data akan tetap tersimpan.`)) return;
        button.disabled = true;
        button.textContent = 'Mengganti...';
        try {
            const response = await fetch('/api/invitation/change-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _csrf: csrf, editor_token: token, template_code: pendingTemplate })
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message);
            currentTemplate = result.template.code;
            app.dataset.template = currentTemplate;
            document.getElementById('previewTemplateName').textContent = result.template.name;
            document.querySelectorAll('[data-template-choice]').forEach((item) => item.classList.toggle('selected', item.dataset.templateChoice === currentTemplate));
            dialog.close();
            reloadPreview();
            window.showToast?.(result.message);
        } catch (error) {
            window.showToast?.(error.message || 'Template gagal diganti.', 'error');
        } finally {
            button.textContent = 'Gunakan Template';
            button.disabled = false;
        }
    });

    document.getElementById('publishButton').addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const errorBox = document.getElementById('publishErrors');
        button.disabled = true;
        button.textContent = 'Memeriksa data...';
        errorBox.hidden = true;
        document.querySelectorAll('.field.invalid').forEach((field) => field.classList.remove('invalid'));
        try {
            await saveNow();
            const response = await fetch('/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(fields())
            });
            const result = await response.json();
            if (!response.ok || !result.ok) {
                if (result.errors) {
                    const list = document.createElement('ul');
                    Object.entries(result.errors).forEach(([name, message]) => {
                        form.elements[name]?.closest('.field')?.classList.add('invalid');
                        const item = document.createElement('li');
                        item.textContent = message;
                        list.appendChild(item);
                    });
                    errorBox.replaceChildren(document.createTextNode(result.message), list);
                    errorBox.hidden = false;
                }
                renderSlug({ slug_available: false, slug_message: result.errors?.slug || '', slug_suggestions: result.slug_suggestions || [] });
                throw new Error(result.message || 'Data belum lengkap.');
            }
            button.textContent = 'Berhasil!';
            window.location.href = result.redirect;
        } catch (error) {
            button.disabled = false;
            button.textContent = 'Selesai dan Publish';
            window.showToast?.(error.message || 'Undangan gagal diterbitkan.', 'error');
        }
    });

    updateCharCount();
    updateGalleryCount();
    refreshGiftEmpty();
    refreshInvitees();
    updateChecklist();
    showStep(0);
})();
