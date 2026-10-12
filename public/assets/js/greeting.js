(() => {
    'use strict';

    document.addEventListener('input', (event) => {
        const textarea = event.target;
        if (!textarea || textarea.name !== 'message') return;
        const form = textarea.closest('[data-greeting-form]');
        if (!form) return;
        const count = form.querySelector('[data-message-count]');
        if (count) count.textContent = textarea.value.length;
    });

    document.addEventListener('submit', async (event) => {
        if (event.defaultPrevented) return;
        const form = event.target;
        if (!form || !form.matches('[data-greeting-form]')) return;
        event.preventDefault();

        const feedback = form.querySelector('[data-form-feedback]');
        const button = form.querySelector('button[type="submit"]');
        const payload = Object.fromEntries(new FormData(form).entries());
        if (!String(payload.guest_name || '').trim() || !String(payload.message || '').trim() || !payload.attendance_status) {
            if (feedback) feedback.textContent = 'Lengkapi nama, kehadiran, dan ucapan.';
            return;
        }
        let oldLabel = '';
        if (button) {
            button.disabled = true;
            oldLabel = button.textContent;
            button.textContent = 'Mengirim...';
        }
        if (feedback) feedback.textContent = '';
        try {
            const response = await fetch('/api/greetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Ucapan gagal dikirim.');
            if (form.elements.message) form.elements.message.value = '';
            const count = form.querySelector('[data-message-count]');
            if (count) count.textContent = '0';
            if (feedback) feedback.textContent = result.message;
            window.dispatchEvent(new CustomEvent('daymoment:greeting-sent', { detail: { greeting: result.greeting } }));
        } catch (error) {
            if (feedback) feedback.textContent = error.message;
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = oldLabel;
            }
        }
    });
})();
