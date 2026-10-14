(async () => {
    'use strict';
    // The template component is lazy-loaded. On a cold visit this runtime can
    // arrive before React commits the Lunara DOM, so wait for that specific
    // root instead of exiting permanently and leaving the cover transparent.
    const root = await new Promise((resolve) => {
        let attempt = 0;
        const findRoot = () => {
            const node = document.querySelector('.lunara-azure');
            if (node || attempt >= 240) {
                resolve(node);
                return;
            }
            attempt += 1;
            requestAnimationFrame(findRoot);
        };
        findRoot();
    });
    if (!root) return;
    if (root.dataset.lunaraRuntimeReady === 'true') return;
    root.dataset.lunaraRuntimeReady = 'true';

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileViewport = matchMedia('(max-width: 900px)').matches;
    const deviceMemory = Number(navigator.deviceMemory || 8);
    const processorCount = Number(navigator.hardwareConcurrency || 8);
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const constrainedConnection = Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType || '');
    let mobilePerformanceTier = 'high';
    if (mobileViewport && (constrainedConnection || deviceMemory <= 3 || processorCount <= 4)) mobilePerformanceTier = 'low';
    else if (mobileViewport && (deviceMemory <= 6 || processorCount <= 6 || connection?.effectiveType === '3g')) mobilePerformanceTier = 'balanced';
    if (mobileViewport) root.classList.add(`lunara-mobile-${mobilePerformanceTier}`);
    const openButton = root.querySelector('[data-open-invitation]');
    const invitationContent = root.querySelector('.invitation-content');
    invitationContent?.setAttribute('aria-hidden', 'true');
    const openingImages = [...root.querySelectorAll('.opening-garden img')];
    const waitForOpeningImages = Promise.allSettled(openingImages.map((image) => {
        if (image.complete && image.naturalWidth) return image.decode?.() || Promise.resolve();
        return new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
        }).then(() => image.decode?.().catch(() => {}) || undefined);
    }));
    // Immediate activation of opening sequence: paints LCP element in < 0.35s
    requestAnimationFrame(() => {
        root.classList.add('lunara-opening-ready');
        window.setTimeout(() => {
            root.classList.add('lunara-opening-complete');
            openButton?.removeAttribute('disabled');
        }, reducedMotion ? 80 : (mobileViewport ? 1200 : 7500));
    });

    const revealItems = root.querySelectorAll('[data-lunara-reveal]');
    const sections = root.querySelectorAll('[data-lunara-scene]');
    const motionReady = !reducedMotion && 'IntersectionObserver' in window;
    const gardenSettleTimers = new WeakMap();
    let motionStarted = false;

    // Keep the scroll path free of geometry reads. Backgrounds are decoded
    // before their section reaches the viewport, then CSS can reveal them from
    // the browser cache without a large image decode in the middle of a swipe.
    const mobileBackground = matchMedia('(max-width: 620px)').matches;
    const backgroundRoot = '/assets/images/templates/lunara-azure/';
    const preloadSectionBackground = (section) => {
        if (section.classList.contains('is-near') || section.dataset.lunaraBackgroundLoading === 'true') return;
        const asset = section.dataset.lunaraBg;
        if (!asset) {
            section.classList.add('is-near');
            return;
        }
        section.dataset.lunaraBackgroundLoading = 'true';
        const image = new Image();
        image.decoding = 'async';
        image.src = `${backgroundRoot}${asset}${mobileBackground ? '-mobile' : ''}.webp`;
        const ready = image.decode
            ? image.decode().catch(() => {})
            : new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
            });
        ready.finally(() => requestAnimationFrame(() => {
            section.classList.add('is-near');
            delete section.dataset.lunaraBackgroundLoading;
        }));
    };

    if ('IntersectionObserver' in window) {
        const preloadDistance = mobilePerformanceTier === 'low' ? 1.5 : mobilePerformanceTier === 'balanced' ? 2 : 2.5;
        const backgroundObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                preloadSectionBackground(entry.target);
                backgroundObserver.unobserve(entry.target);
            });
        }, { threshold: 0, rootMargin: `${Math.round(innerHeight * preloadDistance)}px 0px` });
        sections.forEach((section) => backgroundObserver.observe(section));
    } else {
        sections.forEach(preloadSectionBackground);
    }

    // Progressively decode section backgrounds in the background during idle time
    // so swiping through sections has zero network or image decode jank.
    const preloadAllSectionBackgrounds = () => {
        let index = 0;
        const list = [...sections];
        const step = () => {
            if (index >= list.length) return;
            preloadSectionBackground(list[index++]);
            if ('requestIdleCallback' in window) {
                requestIdleCallback(step, { timeout: 400 });
            } else {
                window.setTimeout(step, 80);
            }
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(step, { timeout: 600 });
        } else {
            window.setTimeout(step, 200);
        }
    };
    preloadAllSectionBackgrounds();

    const setGardenBloom = (garden, blooming) => {
        window.clearTimeout(gardenSettleTimers.get(garden));
        garden.classList.toggle('is-bloomed', blooming);
        garden.classList.remove('is-settled');
        if (!blooming) return;
        const settleDelay = mobileViewport ? 3200 : 5200;
        const timer = window.setTimeout(() => {
            if (garden.classList.contains('is-bloomed')) garden.classList.add('is-settled');
        }, settleDelay);
        gardenSettleTimers.set(garden, timer);
    };

    const startScrollMotion = () => {
        if (motionStarted) return;
        motionStarted = true;
        if (motionReady) {
            root.classList.add('lunara-motion');
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting);
                });
            }, { threshold: mobileViewport ? .05 : .1, rootMargin: mobileViewport ? '8% 0px -4% 0px' : '-7% 0px -9% 0px' });
            revealItems.forEach((item, index) => {
                // Keep the choreography readable: each group enters in a soft
                // stagger, while leaving the viewport starts fading immediately.
                item.style.setProperty('--reveal-delay', `${Math.min(index % 7, 6) * (mobileViewport ? 95 : 170)}ms`);
                revealObserver.observe(item);
            });

            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const active = entry.isIntersecting && entry.intersectionRatio >= (mobileViewport ? .04 : .12);
                    entry.target.classList.toggle('is-in-view', active);
                    if (active) preloadSectionBackground(entry.target);
                    entry.target.querySelectorAll('[data-lunara-garden]').forEach((garden) => setGardenBloom(garden, active));
                });
            }, { threshold: mobileViewport ? [0, .04, .2] : [0, .12, .28], rootMargin: mobileViewport ? '10% 0px 8% 0px' : '-6% 0px -8% 0px' });
            sections.forEach((section) => sectionObserver.observe(section));
        } else {
            revealItems.forEach((item) => item.classList.add('is-visible'));
            sections.forEach((section) => {
                section.classList.add('is-in-view');
                section.querySelectorAll('[data-lunara-garden]').forEach((garden) => {
                    garden.classList.add('is-bloomed', 'is-settled');
                });
            });
        }
    };

    const playHeroOpening = () => {
        window.setTimeout(() => root.classList.add('lunara-hero-sequence'), reducedMotion ? 40 : 720);
        window.setTimeout(() => root.classList.add('lunara-hero-settled'), reducedMotion ? 80 : 5700);
    };

    let openingStarted = false;
    const openInvitation = (event) => {
        event.preventDefault();
        // The shared preview runtime may have attached its own instant-open
        // handler. Lunara owns this interaction so its curtain sequence can
        // finish before the fixed cover is hidden.
        event.stopImmediatePropagation();
        if (openingStarted) return;
        openingStarted = true;

        const transitionDuration = reducedMotion ? 80 : 1650;
        root.classList.add('lunara-is-opening');
        openButton?.setAttribute('disabled', '');
        openButton?.setAttribute('aria-busy', 'true');

        // Defer audio initialization and heavy DOM work so the first paint frame
        // after user pointer interaction completes in < 1ms (INP <= 40ms)
        window.setTimeout(() => {
            const buttonLabel = openButton?.querySelector('span');
            if (buttonLabel) buttonLabel.textContent = 'Membuka...';
            document.body.style.overflow = 'hidden';
            void startMusic();
        }, 8);

        window.setTimeout(playHeroOpening, Math.max(0, transitionDuration - 300));
        window.setTimeout(() => {
            root.classList.add('invitation-open');
            document.body.style.overflow = '';
            invitationContent?.setAttribute('aria-hidden', 'false');
            startScrollMotion();
            // Keep the release pose until the cover's own opacity transition
            // has fully finished. Removing it immediately caused a one-frame
            // flash where the card returned to its resting state.
            window.setTimeout(() => root.classList.remove('lunara-is-opening'), reducedMotion ? 0 : 900);
        }, transitionDuration);
    };
    openButton?.addEventListener('click', openInvitation, { once: true, capture: true });
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
