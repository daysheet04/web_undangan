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

    const revealItems = Array.from(root.querySelectorAll('.jawi-reveal'));
    const musicButton = root.querySelector('[data-music-controller]');
    const uploadedAudio = root.querySelector('[data-wedding-audio]');
    const invitationContent = root.querySelector('.invitation-content');
    const sections = Array.from(root.querySelectorAll('.jawi-section'));
    const customSelects = Array.from(root.querySelectorAll('[data-custom-select]'));
    const bankPickers = Array.from(root.querySelectorAll('[data-bank-picker]'));
    const giftAccountCards = Array.from(root.querySelectorAll('[data-gift-account-card]'));
    let activateSectionRendering = () => {};

    /* Cover entrance: paper scene -> wayang -> envelope -> copy -> action. */
    if (reducedMotion) {
        root.classList.add('jawi-cover-bg-visible', 'jawi-cover-wayangs-visible', 'jawi-cover-envelope-visible', 'jawi-cover-copy-visible', 'jawi-cover-actions-visible', 'jawi-cover-ready');
    } else {
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('jawi-cover-bg-visible')));
        window.setTimeout(() => root.classList.add('jawi-cover-wayangs-visible'), 120);
        window.setTimeout(() => root.classList.add('jawi-cover-envelope-visible'), 240);
        window.setTimeout(() => root.classList.add('jawi-cover-copy-visible'), 360);
        window.setTimeout(() => root.classList.add('jawi-cover-actions-visible'), 500);
        window.setTimeout(() => root.classList.add('jawi-cover-ready'), 650);
    }

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

        let cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.style.display = 'none';

        let isTyping = false;

        const play = () => {
            if (reducedMotion) {
                brideChars.forEach((c) => c.classList.add('char-inked'));
                groomChars.forEach((c) => c.classList.add('char-inked'));
                if (ampersand) ampersand.classList.add('is-visible');
                cursor.remove();
                return;
            }
            if (isTyping) return;
            isTyping = true;

            // Reset characters first so typing runs fresh
            brideChars.forEach((c) => c.classList.remove('char-inked'));
            groomChars.forEach((c) => c.classList.remove('char-inked'));
            if (ampersand) ampersand.classList.remove('is-visible');

            cursor.style.display = 'inline-block';
            cursor.classList.remove('is-finished');
            cursor.classList.add('is-typing');
            brideSpan.appendChild(cursor);

            let bIdx = 0;
            const typeBride = () => {
                if (bIdx < brideChars.length) {
                    brideChars[bIdx].classList.add('char-inked');
                    brideChars[bIdx].after(cursor);
                    bIdx++;
                    setTimeout(typeBride, 70 + Math.random() * 20);
                } else {
                    // Reveal ampersand with flourish, keeping cursor in brideSpan
                    setTimeout(() => {
                        if (ampersand) ampersand.classList.add('is-visible');
                        // Move cursor into groom span without creating a flex row on heading
                        groomSpan.prepend(cursor);
                        let gIdx = 0;
                        const typeGroom = () => {
                            if (gIdx < groomChars.length) {
                                groomChars[gIdx].classList.add('char-inked');
                                groomChars[gIdx].after(cursor);
                                gIdx++;
                                setTimeout(typeGroom, 70 + Math.random() * 20);
                            } else {
                                // Completed!
                                setTimeout(() => {
                                    cursor.classList.remove('is-typing');
                                    cursor.classList.add('is-finished');
                                    setTimeout(() => {
                                        cursor.remove();
                                        isTyping = false;
                                    }, 400);
                                }, 250);
                            }
                        };
                        setTimeout(typeGroom, 130);
                    }, 140);
                }
            };

            setTimeout(typeBride, 80);
        };

        const reset = () => {
            if (reducedMotion) return;
            isTyping = false;
            brideChars.forEach((c) => c.classList.remove('char-inked'));
            groomChars.forEach((c) => c.classList.remove('char-inked'));
            if (ampersand) ampersand.classList.remove('is-visible');
            cursor.remove();
        };

        const finish = () => {
            if (reducedMotion) return;
            isTyping = false;
            brideChars.forEach((c) => c.classList.add('char-inked'));
            groomChars.forEach((c) => c.classList.add('char-inked'));
            if (ampersand) ampersand.classList.add('is-visible');
            cursor.remove();
        };

        return { play, reset, finish };
    };

    const typewriterHeading = root.querySelector('.jawi-typewriter-title') || root.querySelector('.jawi-prologue-copy h2');
    const typewriterController = setupTypewriter(typewriterHeading);

    /* ==========================================================================
       Keluar-Masuk (Exit & Entrance) IntersectionObserver
       ========================================================================== */
    if (motionReady) {
        let revealRafId = null;
        const pendingVisible = new Set();
        const pendingExit = new Set();

        const flushReveals = () => {
            revealRafId = null;
            pendingVisible.forEach((item) => {
                item.classList.remove('is-motion-settled');
                if (item.classList.contains('is-exiting')) {
                    item.classList.add('re-entering');
                }
                item.classList.add('is-visible');
                item.classList.remove('is-exiting');
                if (item.matches('.jawi-prologue-copy') || item.querySelector('.jawi-typewriter-title')) {
                    typewriterController?.play();
                }
            });
            pendingVisible.clear();

            pendingExit.forEach((item) => {
                item.classList.remove('is-motion-settled');
                item.classList.remove('is-visible', 're-entering');
                item.classList.add('is-exiting');
                if (item.matches('.jawi-prologue-copy') || item.querySelector('.jawi-typewriter-title')) {
                    typewriterController?.reset();
                }
            });
            pendingExit.clear();
        };

        const revealObserver = new IntersectionObserver((entries) => {
            if (!root.classList.contains('jawi-envelope-complete') && !root.classList.contains('invitation-open')) return;

            let hasUpdates = false;
            entries.forEach((entry) => {
                const item = entry.target;

                if (entry.isIntersecting) {
                    if (pendingExit.has(item)) pendingExit.delete(item);
                    if (!item.classList.contains('is-visible') || item.classList.contains('is-exiting')) {
                        pendingVisible.add(item);
                        hasUpdates = true;
                    }
                } else {
                    if (item.classList.contains('is-visible')) {
                        if (pendingVisible.has(item)) pendingVisible.delete(item);
                        pendingExit.add(item);
                        hasUpdates = true;
                    }
                }
            });

            if (hasUpdates && !revealRafId) {
                revealRafId = requestAnimationFrame(flushReveals);
            }
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

        sections.forEach((section) => {
            section.querySelectorAll('.jawi-reveal').forEach((item, index) => {
                item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 90}ms`);
                revealObserver.observe(item);
            });
        });

        // Section observer for ambient ornaments: pauses off-screen animations for 100% GPU scroll bandwidth
        const sectionObserver = new IntersectionObserver((entries) => {
            if (!root.classList.contains('jawi-envelope-complete')) return;
            entries.forEach((entry) => {
                const isInter = entry.isIntersecting;
                entry.target.classList.toggle('is-in-view', isInter);
                entry.target.classList.toggle('is-out-of-view', !isInter);
            });
        }, { threshold: 0.01, rootMargin: '120px 0px 120px 0px' });

        sections.forEach((section) => sectionObserver.observe(section));

        // Heavy section artwork is requested shortly before it is needed. Its
        // existing in-view transition remains the sole visible animation.
        const deferredVisualSelector = [
            '.jawi-greeting-scenery',
            '.jawi-couple-scenery',
            '.jawi-countdown-scenery',
            '.jawi-events-scenery',
            '.jawi-story-scenery',
            '.jawi-gallery-scenery',
            '.jawi-gift-scenery',
            '.jawi-rsvp-scenery',
            '.jawi-closing-scenery',
        ].join(',');
        const deferredVisualSections = sections.filter((section) => section.querySelector(deferredVisualSelector));
        const visualObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visual-ready');
                visualObserver.unobserve(entry.target);
            });
        }, { threshold: 0, rootMargin: '1200px 0px' });
        deferredVisualSections.forEach((section) => visualObserver.observe(section));

        // Pre-promote only the two heaviest compositions shortly before they
        // enter the viewport, then release their layers again when far away.
        // This prevents a fast last-section -> first-section jump from paying
        // the rasterization cost on the same frame as the existing animation.
        const compositorSections = sections.filter((section) => (
            section.classList.contains('jawi-prologue')
            || section.classList.contains('jawi-events-v2')
        ));
        const compositorObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const canPromote = root.classList.contains('jawi-envelope-complete');
                entry.target.classList.toggle('is-compositor-ready', canPromote && entry.isIntersecting);
            });
        }, { threshold: 0, rootMargin: '1000px 0px' });
        compositorSections.forEach((section) => compositorObserver.observe(section));

        // Render-window virtualization for the long invitation. Sections are
        // measured once while still behind the cover, so hiding their distant
        // subtrees cannot alter scroll height. They are restored 1400px before
        // the viewport—well before the 160px reveal observer can animate them.
        if (window.CSS?.supports('content-visibility', 'hidden')) {
            const renderMargin = 1400;
            const getIntrinsicBlockSize = (section, borderBoxHeight) => {
                const style = getComputedStyle(section);
                const blockExtras = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
                    + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
                return Math.max(1, Math.ceil(borderBoxHeight - blockExtras));
            };
            const renderObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle('is-render-near', entry.isIntersecting);
                });
            }, { threshold: 0, rootMargin: `${renderMargin}px 0px` });
            const sectionResizeObserver = 'ResizeObserver' in window
                ? new ResizeObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.target.classList.contains('is-render-near')) return;
                        const borderBox = Array.isArray(entry.borderBoxSize)
                            ? entry.borderBoxSize[0]
                            : entry.borderBoxSize;
                        const borderBoxHeight = borderBox?.blockSize || entry.target.getBoundingClientRect().height;
                        const height = getIntrinsicBlockSize(entry.target, borderBoxHeight);
                        if (height > 0) entry.target.style.setProperty('--jawi-section-height', `${height}px`);
                    });
                })
                : null;

            activateSectionRendering = () => {
                if (root.classList.contains('jawi-render-window-ready')) return;
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const measurements = sections.map((section) => ({
                    section,
                    rect: section.getBoundingClientRect(),
                }));

                measurements.forEach(({ section, rect }) => {
                    section.style.setProperty('--jawi-section-height', `${getIntrinsicBlockSize(section, rect.height)}px`);
                    section.classList.toggle('is-render-near', rect.bottom >= -renderMargin && rect.top <= viewportHeight + renderMargin);
                    section.classList.add('is-render-managed');
                    renderObserver.observe(section);
                    sectionResizeObserver?.observe(section);
                });
                root.classList.add('jawi-render-window-ready');
            };
        }

    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
        sections.forEach((section) => section.classList.add('is-in-view', 'is-visual-ready'));
    }

    // Release compositor layers after each reveal has settled. They are promoted
    // again immediately before the exact same entrance or exit transition runs.
    root.addEventListener('transitionend', (event) => {
        if (!(event.target instanceof Element) || !event.target.classList.contains('jawi-reveal')) return;
        const isInkReveal = event.target.dataset.reveal === 'ink';
        if (event.propertyName !== 'transform' && !(isInkReveal && event.propertyName === 'clip-path')) return;
        event.target.classList.add('is-motion-settled');
    }, { passive: true });

    const revealVisibleFallback = () => {
        if (!root.classList.contains('jawi-envelope-complete')) return;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        revealItems.forEach((item) => {
            if (item.classList.contains('is-visible') || item.hidden) return;
            const rect = item.getBoundingClientRect();
            if (rect.top <= viewportHeight * 1.05 && rect.bottom >= -40) {
                item.classList.remove('is-motion-settled');
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
        const buttonLabel = button.querySelector('[data-open-label]');

        requestAnimationFrame(() => {
            button.disabled = true;
            if (buttonLabel) buttonLabel.textContent = 'Membuka...';
            root.classList.add('jawi-envelope-opening', 'jawi-cover-ready');
            document.body.style.overflow = 'hidden';
            invitationContent?.setAttribute('aria-hidden', 'true');
        });

        window.setTimeout(() => root.classList.add('jawi-envelope-letter-up'), reducedMotion ? 25 : 850);
        window.setTimeout(() => root.classList.add('jawi-envelope-page-turn'), reducedMotion ? 45 : 1950);
        window.setTimeout(() => {
            root.classList.add('jawi-envelope-zooming');
            root.querySelector('.jawi-prologue')?.classList.add('is-compositor-ready');
            activateSectionRendering();
        }, reducedMotion ? 70 : 3050);

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
        customSelects.forEach((choice) => {
            if (choice === except || !choice.classList.contains('is-open')) return;
            choice.classList.remove('is-open');
            choice.querySelector('[data-choice-trigger]')?.setAttribute('aria-expanded', 'false');
            const options = choice.querySelector('[data-choice-options]');
            if (options) {
                options.hidden = true;
                options.style.display = 'none';
            }
        });
    };
    customSelects.forEach((choice) => {
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
                giftAccountCards.forEach((card) => {
                    card.hidden = card.dataset.giftAccountCard !== option.dataset.giftChoice;
                    card.style.display = card.hidden ? 'none' : 'grid';
                });
            }
        });
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeChoices();
    }, { passive: true });

    bankPickers.forEach((picker) => {
        picker.querySelector('.bank-picker-options')?.addEventListener('click', (event) => {
            const option = event.target.closest('[data-bank-value]');
            if (!option) return;
            const selected = option.dataset.bankValue;
            picker.querySelector('[data-bank-label]').textContent = option.querySelector('span').textContent.trim();
            picker.querySelectorAll('[data-bank-value]').forEach((item) => item.setAttribute('aria-pressed', String(item === option)));
            giftAccountCards.forEach((card) => {
                card.hidden = card.dataset.giftAccountCard !== selected;
                card.style.display = card.hidden ? 'none' : 'grid';
            });
            const toggle = picker.querySelector('.bank-picker-toggle');
            if (toggle) toggle.checked = false;
        });
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('[data-custom-select]')) closeChoices();
        bankPickers.forEach((picker) => {
            if (!picker.contains(event.target)) {
                const toggle = picker.querySelector('.bank-picker-toggle:checked');
                if (toggle) toggle.checked = false;
            }
        });
    }, { passive: true });

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
