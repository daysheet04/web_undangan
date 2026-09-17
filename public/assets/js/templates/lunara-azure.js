(() => {
    'use strict';
    const root = document.querySelector('.lunara-azure');
    if (!root) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openButton = root.querySelector('[data-open-invitation]');
    openButton?.setAttribute('disabled', '');
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('lunara-opening-ready')));
    window.setTimeout(() => {
        root.classList.add('lunara-opening-complete');
        openButton?.removeAttribute('disabled');
    }, reducedMotion ? 120 : 5200);

    const revealItems = root.querySelectorAll('[data-lunara-reveal]');
    const sections = root.querySelectorAll('[data-lunara-scene]');
    const motionReady = !reducedMotion && 'IntersectionObserver' in window;
    let motionStarted = false;

    const startScrollMotion = () => {
        if (motionStarted) return;
        motionStarted = true;
        if (motionReady) {
            root.classList.add('lunara-motion');
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting);
                });
            }, { threshold: .07, rootMargin: '-4% 0px -7% 0px' });
            revealItems.forEach((item, index) => {
                item.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
                revealObserver.observe(item);
            });

            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('is-in-view', entry.isIntersecting);
                    entry.target.querySelectorAll('[data-lunara-garden]').forEach((garden) => garden.classList.toggle('is-bloomed', entry.isIntersecting));
                });
            }, { threshold: .04, rootMargin: '-3% 0px -5% 0px' });
            sections.forEach((section) => sectionObserver.observe(section));
        } else {
            revealItems.forEach((item) => item.classList.add('is-visible'));
            sections.forEach((section) => {
                section.classList.add('is-in-view');
                section.querySelectorAll('[data-lunara-garden]').forEach((garden) => garden.classList.add('is-bloomed'));
            });
        }
    };

    const playHeroOpening = () => {
        window.setTimeout(() => root.classList.add('lunara-hero-sequence'), reducedMotion ? 40 : 720);
        window.setTimeout(() => root.classList.add('lunara-hero-settled'), reducedMotion ? 80 : 5700);
    };

    openButton?.addEventListener('click', () => window.setTimeout(startScrollMotion, 420), { once: true });
    openButton?.addEventListener('click', playHeroOpening, { once: true });
    if (root.classList.contains('invitation-open')) {
        startScrollMotion();
        playHeroOpening();
    }

    if (!reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
        sections.forEach((section) => {
            let frame = 0;
            let nextX = 0;
            let nextY = 0;
            const render = () => {
                section.style.setProperty('--scene-x', nextX.toFixed(3));
                section.style.setProperty('--scene-y', nextY.toFixed(3));
                frame = 0;
            };
            section.addEventListener('pointermove', (event) => {
                const bounds = section.getBoundingClientRect();
                nextX = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
                nextY = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
                if (!frame) frame = requestAnimationFrame(render);
            }, { passive: true });
            section.addEventListener('pointerleave', () => {
                nextX = 0;
                nextY = 0;
                if (!frame) frame = requestAnimationFrame(render);
            }, { passive: true });
        });
    }

    const bankPicker = root.querySelector('[data-lunara-bank-picker]');
    const bankTrigger = bankPicker?.querySelector('[data-lunara-bank-trigger]');
    const bankLabel = bankPicker?.querySelector('[data-lunara-bank-label]');
    const closeBankPicker = () => {
        if (!bankPicker || !bankTrigger) return;
        bankPicker.classList.remove('is-open');
        bankTrigger.setAttribute('aria-expanded', 'false');
    };
    bankTrigger?.addEventListener('click', () => {
        const opening = !bankPicker.classList.contains('is-open');
        bankPicker.classList.toggle('is-open', opening);
        bankTrigger.setAttribute('aria-expanded', String(opening));
    });
    bankPicker?.querySelectorAll('[data-lunara-bank-option]').forEach((option) => option.addEventListener('click', () => {
        const selected = option.dataset.lunaraBankOption;
        bankPicker.querySelectorAll('[data-lunara-bank-option]').forEach((item) => item.setAttribute('aria-selected', String(item === option)));
        if (bankLabel) bankLabel.textContent = [...option.querySelectorAll('strong,small')].map((item) => item.textContent.trim()).filter(Boolean).join(' — ');
        root.querySelectorAll('[data-lunara-bank-card]').forEach((card) => {
            card.hidden = card.dataset.lunaraBankCard !== selected;
        });
        closeBankPicker();
        bankTrigger?.focus();
    }));
    root.addEventListener('click', (event) => {
        if (bankPicker && !bankPicker.contains(event.target)) closeBankPicker();
    });
    bankPicker?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeBankPicker();
            bankTrigger?.focus();
        }
    });

    const fieldPickers = [...root.querySelectorAll('[data-lunara-select]')];
    const closeFieldPicker = (picker) => {
        picker.classList.remove('is-open');
        picker.querySelector('[data-lunara-select-trigger]')?.setAttribute('aria-expanded', 'false');
    };
    fieldPickers.forEach((picker) => {
        const trigger = picker.querySelector('[data-lunara-select-trigger]');
        const label = picker.querySelector('[data-lunara-select-label]');
        const input = picker.querySelector('[data-lunara-select-input]');
        const options = [...picker.querySelectorAll('[data-lunara-select-option]')];
        trigger?.addEventListener('click', () => {
            const opening = !picker.classList.contains('is-open');
            fieldPickers.forEach((item) => closeFieldPicker(item));
            picker.classList.toggle('is-open', opening);
            trigger.setAttribute('aria-expanded', String(opening));
        });
        trigger?.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                picker.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
                options[0]?.focus();
            }
        });
        options.forEach((option, index) => option.addEventListener('click', () => {
            options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
            if (input) {
                input.value = option.dataset.lunaraSelectOption || '';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (label) label.textContent = option.textContent.trim();
            closeFieldPicker(picker);
            trigger?.focus();
        }));
        picker.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeFieldPicker(picker);
                trigger?.focus();
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                const activeIndex = options.indexOf(document.activeElement);
                if (activeIndex < 0) return;
                event.preventDefault();
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                options[(activeIndex + direction + options.length) % options.length]?.focus();
            }
        });
    });
    root.addEventListener('click', (event) => {
        fieldPickers.forEach((picker) => {
            if (!picker.contains(event.target)) closeFieldPicker(picker);
        });
    });

    root.querySelectorAll('[data-copy-account]').forEach((button) => button.addEventListener('click', async () => {
        const number = button.closest('[data-lunara-bank-card]')?.querySelector('[data-account-number]')?.textContent.replace(/\s/g, '') || '';
        try {
            await navigator.clipboard.writeText(number);
            const previous = button.innerHTML;
            button.textContent = 'Nomor Tersalin';
            window.setTimeout(() => { button.innerHTML = previous; }, 1800);
        } catch (_) {
            window.prompt('Salin nomor rekening:', number);
        }
    }));

    const musicButton = root.querySelector('[data-music-controller]');
    const uploadedAudio = root.querySelector('[data-wedding-audio]');
    let audioContext;
    let musicTimer;
    let note = 0;
    const melody = [293.66, 369.99, 440, 554.37, 440, 369.99, 329.63, 415.30];
    const playTone = () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = melody[note++ % melody.length];
        gain.gain.setValueAtTime(.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(.018, audioContext.currentTime + .12);
        gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + 1.8);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1.85);
    };
    const startMusic = async () => {
        if (!musicButton || musicButton.getAttribute('aria-pressed') === 'true') return;
        if (uploadedAudio) {
            try {
                await uploadedAudio.play();
                musicButton.setAttribute('aria-pressed', 'true');
            } catch (_) { musicButton.setAttribute('aria-pressed', 'false'); }
            return;
        }
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        playTone();
        musicTimer = window.setInterval(playTone, 1900);
        musicButton.setAttribute('aria-pressed', 'true');
    };
    root.querySelector('[data-open-invitation]')?.addEventListener('click', () => window.setTimeout(startMusic, 240), { once: true });
    musicButton?.addEventListener('click', async () => {
        if (musicButton.getAttribute('aria-pressed') === 'true') {
            uploadedAudio?.pause();
            window.clearInterval(musicTimer);
            musicButton.setAttribute('aria-pressed', 'false');
            return;
        }
        await startMusic();
    });
})();
