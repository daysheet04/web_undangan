(() => {
    'use strict';

    const root = document.querySelector('[data-template-root]');
    if (!root) return;

    document.body.style.overflow = 'hidden';
    document.querySelector('.invitation-content')?.setAttribute('aria-hidden', 'true');

    const openInvitation = () => {
        root.classList.add('invitation-open');
        window.setTimeout(() => {
            document.body.style.overflow = '';
            document.querySelector('.invitation-content')?.setAttribute('aria-hidden', 'false');
        }, root.classList.contains('javanese-invitation') ? 1100 : 650);
    };

    document.querySelector('[data-open-invitation]')?.addEventListener('click', openInvitation);

    document.querySelectorAll('.event-card-grid, .garden-event-list, .traditional-cards, .polaroid-gallery, .classic-gallery').forEach((group) => {
        [...group.children].forEach((element, index) => {
            if (element.classList.contains('reveal')) element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
        });
    });

    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .12 });
        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('visible'));
    }

    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const sampleDate = new Date();
    sampleDate.setDate(sampleDate.getDate() + 45);
    const sampleDateValue = [sampleDate.getFullYear(), String(sampleDate.getMonth() + 1).padStart(2, '0'), String(sampleDate.getDate()).padStart(2, '0')].join('-');
    const previewFallbacks = {
        groom_full_name: 'Andi Pratama',
        groom_nickname: 'Andi',
        groom_father: 'Bapak H. Suryanto',
        groom_mother: 'Ibu Hj. Rahayu',
        bride_full_name: 'Nisa Maharani',
        bride_nickname: 'Nisa',
        bride_father: 'Bapak H. Firmansyah',
        bride_mother: 'Ibu Hj. Lestari',
        akad_date: sampleDateValue,
        akad_start_time: '08:00',
        akad_end_time: '10:00',
        reception_date: sampleDateValue,
        reception_start_time: '11:00',
        reception_end_time: '14:00',
        venue_name: 'Pendopo Arunika',
        venue_address: 'Jl. Melati No. 12, Yogyakarta',
        maps_url: 'https://maps.google.com/',
        love_story: 'Berawal dari pertemuan sederhana pada sebuah sore di Yogyakarta, percakapan kami tumbuh menjadi persahabatan, lalu keyakinan untuk berjalan bersama.',
        instagram: 'andindanisa'
    };
    const previewValue = (data, key) => {
        const value = String(data?.[key] ?? '').trim();
        return value || previewFallbacks[key] || '';
    };
    const formatDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return formatDate(sampleDateValue);
        const date = new Date(value + 'T12:00:00');
        return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };
    const formatTime = (start, end) => {
        return start.slice(0, 5) + (end ? ' – ' + end.slice(0, 5) : '') + ' WIB';
    };

    let countdownTimer;
    const startCountdown = (targetValue) => {
        window.clearInterval(countdownTimer);
        const container = document.querySelector('[data-countdown]');
        if (!container) return;
        if (targetValue) container.dataset.countdown = targetValue;
        const tick = () => {
            const target = new Date(container.dataset.countdown).getTime();
            const distance = Math.max(0, target - Date.now());
            const values = {
                days: Math.floor(distance / 86400000),
                hours: Math.floor((distance % 86400000) / 3600000),
                minutes: Math.floor((distance % 3600000) / 60000),
                seconds: Math.floor((distance % 60000) / 1000)
            };
            Object.entries(values).forEach(([name, value]) => {
                const element = container.querySelector(`[data-${name}]`);
                const nextValue = String(value).padStart(2, '0');
                if (element && element.textContent !== nextValue) {
                    element.classList.add('is-ticking');
                    element.textContent = nextValue;
                    window.setTimeout(() => element.classList.remove('is-ticking'), 150);
                }
            });
        };
        tick();
        countdownTimer = window.setInterval(tick, 1000);
    };
    startCountdown();

    const updatePreview = (data) => {
        document.querySelectorAll('[data-live]').forEach((element) => {
            const key = element.dataset.live;
            if (!(key in data)) return;
            element.textContent = previewValue(data, key);
        });
        document.querySelectorAll('[data-initial]').forEach((element) => {
            const value = previewValue(data, element.dataset.initial);
            element.textContent = [...value][0].toUpperCase();
        });
        document.querySelectorAll('[data-date-field]').forEach((element) => {
            element.textContent = formatDate(previewValue(data, element.dataset.dateField));
        });
        document.querySelectorAll('[data-time-range]').forEach((element) => {
            const prefix = element.dataset.timeRange;
            element.textContent = formatTime(previewValue(data, prefix + '_start_time'), previewValue(data, prefix + '_end_time'));
        });
        document.querySelectorAll('[data-live-href="maps_url"]').forEach((element) => {
            const url = previewValue(data, 'maps_url');
            element.href = /^https?:\/\//i.test(url) ? url : '#';
            element.setAttribute('aria-disabled', /^https?:\/\//i.test(url) ? 'false' : 'true');
        });
        document.querySelectorAll('[data-instagram]').forEach((element) => {
            const account = previewValue(data, 'instagram').replace(/^@/, '').trim();
            element.hidden = !account;
            if (account) element.href = 'https://instagram.com/' + encodeURIComponent(account);
        });
        const receptionDate = previewValue(data, 'reception_date');
        const receptionTime = previewValue(data, 'reception_start_time');
        startCountdown(receptionDate + 'T' + receptionTime.slice(0, 5) + ':00+07:00');
    };

    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin || event.data?.type !== 'invitation:update' || !event.data.data) return;
        updatePreview(event.data.data);
    });

    document.querySelector('[data-preview-form]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const feedback = event.currentTarget.querySelector('[data-form-feedback]');
        if (feedback) feedback.textContent = 'Ucapan siap dikirim setelah undangan dipublikasikan.';
    });

    document.querySelector('[data-share]')?.addEventListener('click', async (event) => {
        const url = event.currentTarget.dataset.shareUrl || window.location.href;
        const names = [...document.querySelectorAll('[data-live="groom_nickname"], [data-live="bride_nickname"]')].slice(0, 2).map((item) => item.textContent);
        const shareData = { title: 'Undangan Pernikahan', text: `Undangan pernikahan ${names.join(' & ')}`, url };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(url);
                event.currentTarget.textContent = 'Tautan Tersalin ✓';
                window.setTimeout(() => { event.currentTarget.textContent = 'Bagikan Undangan'; }, 1800);
            }
        } catch (error) {
            if (error.name !== 'AbortError') window.prompt('Salin tautan undangan:', url);
        }
    });

    if (window.parent !== window) {
        window.parent.postMessage({ type: 'invitation:ready' }, window.location.origin);
    }
})();
