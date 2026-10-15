(async () => {
    'use strict';

    // Wait for React to mount the template root element
    const root = await new Promise((resolve) => {
        let count = 0;
        const check = () => {
            const el = document.querySelector('.puspa-jawi');
            if (el || count > 120) return resolve(el);
            count++;
            requestAnimationFrame(check);
        };
        check();
    });
    if (!root) return;

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionReady = !reducedMotion && 'IntersectionObserver' in window;
    root.classList.add('motion-ready');

    const revealItems = root.querySelectorAll('.jawi-reveal');
    const musicButton = root.querySelector('[data-music-controller]');
    const uploadedAudio = root.querySelector('[data-wedding-audio]');
    const invitationContent = root.querySelector('.invitation-content');

    /* ==========================================================================
       Typewriter Effect for Julia & Dandi (Zero CLS, Butter Smooth)
       ========================================================================== */
    const setupTypewriter = (heading) => {
        if (!heading) return null;
        const brideSpan = heading.querySelector('[data-live="bride_nickname"]');
        const ampersand = heading.querySelector('i');
        const groomSpan = heading.querySelector('[data-live="groom_nickname"]');
        if (!brideSpan || !groomSpan) return null;

        const brideText = (brideSpan.textContent || 'Julia').trim();
        const groomText = (groomSpan.textContent || 'Dandi').trim();

        const buildCharSpans = (container, text) => {
            container.innerHTML = '';
            container.setAttribute('aria-label', text);
            return Array.from(text).map((ch) => {
                const span = document.createElement('span');
                span.className = 'type-char';
                span.textContent = ch === ' ' ? '\u00A0' : ch;
                container.appendChild(span);
                return span;
            });
        };

        const brideChars = buildCharSpans(brideSpan, brideText);
        const groomChars = buildCharSpans(groomSpan, groomText);

        if (ampersand) ampersand.classList.add('type-ampersand');

        let cursor = heading.querySelector('.type-cursor');
        if (!cursor) {
            cursor = document.createElement('span');
            cursor.className = 'type-cursor';
            cursor.setAttribute('aria-hidden', 'true');
            heading.appendChild(cursor);
        }

        let isTyping = false;

        const play = () => {
            if (reducedMotion) {
                brideChars.forEach((c) => c.classList.add('char-inked'));
                groomChars.forEach((c) => c.classList.add('char-inked'));
                if (ampersand) ampersand.classList.add('is-visible');
                cursor.style.display = 'none';
                return;
            }
            if (isTyping) return;
            isTyping = true;

            // Reset characters first so typing runs fresh and visible
            brideChars.forEach((c) => c.classList.remove('char-inked'));
            groomChars.forEach((c) => c.classList.remove('char-inked'));
            if (ampersand) ampersand.classList.remove('is-visible');

            cursor.style.display = 'inline-block';
            cursor.classList.remove('is-finished');
            cursor.classList.add('is-typing');
            brideSpan.prepend(cursor);

            let bIdx = 0;
            const typeBride = () => {
                if (bIdx < brideChars.length) {
                    brideChars[bIdx].classList.add('char-inked');
                    brideChars[bIdx].after(cursor);
                    bIdx++;
                    setTimeout(typeBride, 85 + Math.random() * 35);
                } else {
                    // Reveal ampersand
                    setTimeout(() => {
                        if (ampersand) {
                            ampersand.classList.add('is-visible');
                            ampersand.after(cursor);
                        }
                        // Start typing groom
                        let gIdx = 0;
                        const typeGroom = () => {
                            if (gIdx < groomChars.length) {
                                groomChars[gIdx].classList.add('char-inked');
                                groomChars[gIdx].after(cursor);
                                gIdx++;
                                setTimeout(typeGroom, 85 + Math.random() * 35);
                            } else {
                                // Completed!
                                setTimeout(() => {
                                    cursor.classList.remove('is-typing');
                                    cursor.classList.add('is-finished');
                                    setTimeout(() => {
                                        cursor.style.display = 'none';
                                        isTyping = false;
                                    }, 750);
                                }, 350);
                            }
                        };
                        setTimeout(typeGroom, 160);
                    }, 140);
                }
            };

            setTimeout(typeBride, 260);
        };

        const reset = () => {
            if (reducedMotion) return;
            isTyping = false;
            brideChars.forEach((c) => c.classList.remove('char-inked'));
            groomChars.forEach((c) => c.classList.remove('char-inked'));
            if (ampersand) ampersand.classList.remove('is-visible');
            cursor.style.display = 'none';
            cursor.classList.remove('is-typing', 'is-finished');
        };

        return { play, reset };
    };

    const typewriterHeading = root.querySelector('.jawi-typewriter-title') || root.querySelector('.jawi-prologue-copy h2');
    const typewriterController = setupTypewriter(typewriterHeading);

    /* ==========================================================================
       Keluar-Masuk (Exit & Entrance) IntersectionObserver
       ========================================================================== */
    if (motionReady) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const item = entry.target;

                // GUARD: If envelope is still closed, do NOT reveal Section 1 yet!
                if (!root.classList.contains('invitation-open')) {
                    return;
                }

                if (entry.isIntersecting) {
                    item.classList.add('is-visible');
                    item.classList.remove('is-exiting');
                    if (item.matches('.jawi-prologue-copy') || item.querySelector('.jawi-typewriter-title')) {
                        typewriterController?.play();
                    }
                } else {
                    if (item.classList.contains('is-visible')) {
                        item.classList.remove('is-visible');
                        item.classList.add('is-exiting');
                        if (item.matches('.jawi-prologue-copy') || item.querySelector('.jawi-typewriter-title')) {
                            typewriterController?.reset();
                        }
                    }
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

        root.querySelectorAll('.jawi-section').forEach((section) => {
            section.querySelectorAll('.jawi-reveal').forEach((item, index) => {
                item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
                revealObserver.observe(item);
            });
        });

        // Section observer for ambient ornaments
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!root.classList.contains('invitation-open')) return;
                const isInter = entry.isIntersecting;
                entry.target.classList.toggle('is-in-view', isInter);
                entry.target.classList.toggle('is-out-of-view', !isInter);
            });
        }, { threshold: 0.05, rootMargin: '10% 0px 10% 0px' });

        root.querySelectorAll('.jawi-section').forEach((section) => sectionObserver.observe(section));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        root.querySelectorAll('.jawi-section').forEach((section) => section.classList.add('is-in-view'));
    }

    const revealVisibleFallback = () => {
        if (!root.classList.contains('invitation-open')) return;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        revealItems.forEach((item) => {
            if (item.classList.contains('is-visible') || item.hidden) return;
            const rect = item.getBoundingClientRect();
            if (rect.top <= viewportHeight * 1.05 && rect.bottom >= -40) {
                item.classList.add('is-visible');
                item.classList.remove('is-exiting');
            }
        });
    };

    /* ==========================================================================
       Ceremonial Envelope Opening -> Visible Section 1 Activation
       ========================================================================== */
    root.querySelector('[data-open-invitation]')?.addEventListener('click', (event) => {
        const button = event.currentTarget;
        const duration = reducedMotion ? 120 : 3800;
        button.disabled = true;
        const buttonLabel = button.querySelector('[data-open-label]');
        if (buttonLabel) buttonLabel.textContent = 'Membuka...';

        root.classList.add('jawi-envelope-opening');
        document.body.style.overflow = 'hidden';
        invitationContent?.setAttribute('aria-hidden', 'true');

        window.setTimeout(() => root.classList.add('jawi-envelope-letter-up'), reducedMotion ? 25 : 850);
        window.setTimeout(() => root.classList.add('jawi-envelope-page-turn'), reducedMotion ? 45 : 1950);
        window.setTimeout(() => root.classList.add('jawi-envelope-zooming'), reducedMotion ? 70 : 3050);

        window.setTimeout(() => {
            root.classList.add('invitation-open', 'jawi-envelope-complete', 'jawi-prologue-active');
            document.body.style.overflow = '';
            invitationContent?.setAttribute('aria-hidden', 'false');

            // EXACT MOMENT OF REVEAL: Section 1 animates in front of user's eyes!
            const prologue = root.querySelector('.jawi-prologue');
            if (prologue) {
                prologue.classList.add('is-in-view');
                prologue.classList.remove('is-out-of-view');

                const copyCard = prologue.querySelector('.jawi-prologue-copy');
                const portraitCard = prologue.querySelector('.jawi-prologue-portrait');

                // Card 3D fold-in starts
                window.setTimeout(() => {
                    if (copyCard) {
                        copyCard.classList.add('is-visible');
                        copyCard.classList.remove('is-exiting');
                    }
                    // Typewriter runs visibly right as card unfolds
                    typewriterController?.play();
                }, 80);

                // Portrait card tilts into view
                window.setTimeout(() => {
                    if (portraitCard) {
                        portraitCard.classList.add('is-visible');
                        portraitCard.classList.remove('is-exiting');
                    }
                }, 180);
            }
            revealVisibleFallback();
        }, duration);

        if (uploadedAudio) {
            uploadedAudio.play().then(() => musicButton?.setAttribute('aria-pressed', 'true')).catch(() => {});
        }
    }, { once: true, capture: true });

    /* ==========================================================================
       Custom Select Dropdowns & Bank Picker
       ========================================================================== */
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

    /* ==========================================================================
       Copy Account to Clipboard
       ========================================================================== */
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

    /* ==========================================================================
       Web Audio Synthesizer & Audio Fallback
       ========================================================================== */
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
