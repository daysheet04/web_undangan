(() => {
    'use strict';
    const root = document.querySelector('.puspa-jawi');
    if (!root) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionReady = !reducedMotion && 'IntersectionObserver' in window;
    if (motionReady) root.classList.add('motion-ready');
    const revealItems = root.querySelectorAll('.jawi-reveal');
    const musicButton = root.querySelector('[data-music-controller]');
    const uploadedAudio = root.querySelector('[data-wedding-audio]');
    if (motionReady) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
        root.querySelectorAll('.jawi-section').forEach((section) => section.querySelectorAll('.jawi-reveal').forEach((item, index) => {
            item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 110}ms`);
            observer.observe(item);
        }));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }

    const revealVisibleFallback = () => {
        if (!root.classList.contains('invitation-open')) return;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        revealItems.forEach((item) => {
            if (item.classList.contains('is-visible') || item.hidden) return;
            const rect = item.getBoundingClientRect();
            if (rect.top <= viewportHeight * 1.08 && rect.bottom >= -40) {
                item.classList.add('is-visible');
            }
        });
    };
    window.addEventListener('scroll', revealVisibleFallback, { passive: true });
    window.addEventListener('resize', revealVisibleFallback, { passive: true });

    root.querySelector('[data-open-invitation]')?.addEventListener('click', (event) => {
        event.currentTarget.disabled = true;
        event.currentTarget.querySelector('span').textContent = 'Sugeng Rawuh';
        window.setTimeout(revealVisibleFallback, 80);
        window.setTimeout(revealVisibleFallback, 750);
        if (uploadedAudio) {
            uploadedAudio.play().then(() => musicButton?.setAttribute('aria-pressed', 'true')).catch(() => {});
        }
    }, { once: true });
    window.setTimeout(revealVisibleFallback, 1400);

    const closeChoices = (except = null) => {
        root.querySelectorAll('[data-custom-select]').forEach((choice) => {
            if (choice === except) return;
            choice.classList.remove('is-open');
            choice.querySelector('[data-choice-trigger]')?.setAttribute('aria-expanded', 'false');
            const options = choice.querySelector('[data-choice-options]');
            if (options) {
                options.hidden = true;
                options.style.display = 'none';
            }
        });
    };
    root.querySelectorAll('[data-custom-select]').forEach((choice) => {
        const trigger = choice.querySelector('[data-choice-trigger]');
        const options = choice.querySelector('[data-choice-options]');
        const input = choice.querySelector('input[type="hidden"]');
        trigger?.addEventListener('click', () => {
            const willOpen = options.hidden;
            closeChoices(choice);
            options.hidden = !willOpen;
            options.style.display = willOpen ? 'block' : 'none';
            choice.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', String(willOpen));
        });
        options?.addEventListener('click', (event) => {
            const option = event.target.closest('[data-choice-value]');
            if (!option) return;
            if (input) input.value = option.dataset.choiceValue;
            choice.querySelector('[data-choice-label]').textContent = option.textContent.trim();
            options.querySelectorAll('[role="option"]').forEach((item) => item.setAttribute('aria-selected', String(item === option)));
            options.hidden = true;
            options.style.display = 'none';
            choice.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            if (option.dataset.giftChoice !== undefined) {
                root.querySelectorAll('[data-gift-account-card]').forEach((card) => {
                    card.hidden = card.dataset.giftAccountCard !== option.dataset.giftChoice;
                    card.style.display = card.hidden ? 'none' : 'grid';
                });
            }
        });
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-custom-select]')) closeChoices();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeChoices();
    });

    root.querySelectorAll('[data-bank-picker]').forEach((picker) => {
        picker.querySelector('.bank-picker-options')?.addEventListener('click', (event) => {
            const option = event.target.closest('[data-bank-value]');
            if (!option) return;
            const selected = option.dataset.bankValue;
            picker.querySelector('[data-bank-label]').textContent = option.querySelector('span').textContent.trim();
            picker.querySelectorAll('[data-bank-value]').forEach((item) => item.setAttribute('aria-pressed', String(item === option)));
            root.querySelectorAll('[data-gift-account-card]').forEach((card) => {
                card.hidden = card.dataset.giftAccountCard !== selected;
                card.style.display = card.hidden ? 'none' : 'grid';
            });
            const toggle = picker.querySelector('.bank-picker-toggle');
            if (toggle) toggle.checked = false;
        });
    });
    document.addEventListener('click', (event) => {
        root.querySelectorAll('[data-bank-picker]').forEach((picker) => {
            if (!picker.contains(event.target)) {
                const toggle = picker.querySelector('.bank-picker-toggle');
                if (toggle) toggle.checked = false;
            }
        });
    });

    root.querySelectorAll('[data-copy-account]').forEach((button) => button.addEventListener('click', async () => {
        const number = button.closest('[data-gift-account-card]')?.querySelector('[data-account-number]')?.textContent.replace(/\s/g, '') || '';
        try {
            await navigator.clipboard.writeText(number);
            const previous = button.innerHTML;
            button.textContent = 'Nomor Tersalin';
            window.setTimeout(() => { button.innerHTML = previous; }, 1800);
        } catch (_) {
            window.prompt('Salin nomor rekening:', number);
        }
    }));

    const stage = root.querySelector('.stage-parallax');
    if (!reducedMotion && stage) {
        let ticking = false;
        const updateParallax = () => {
            const shift = Math.min(window.scrollY * .035, 34);
            stage.style.setProperty('--stage-shift', `${shift}px`);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    let audioContext;
    let musicTimer;
    let note = 0;
    const melody = [261.63, 329.63, 392, 440, 392, 329.63, 293.66, 349.23];
    const playTone = () => {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = melody[note++ % melody.length];
        gain.gain.setValueAtTime(.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(.026, audioContext.currentTime + .1);
        gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + 1.65);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1.7);
    };
    musicButton?.addEventListener('click', async () => {
        const playing = musicButton.getAttribute('aria-pressed') === 'true';
        if (playing) {
            if (uploadedAudio) uploadedAudio.pause();
            clearInterval(musicTimer);
            musicButton.setAttribute('aria-pressed', 'false');
            return;
        }
        if (uploadedAudio) {
            try {
                await uploadedAudio.play();
                musicButton.setAttribute('aria-pressed', 'true');
            } catch (_) {
                musicButton.setAttribute('aria-pressed', 'false');
            }
            return;
        }
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
        playTone();
        musicTimer = window.setInterval(playTone, 1750);
        musicButton.setAttribute('aria-pressed', 'true');
    });
})();
