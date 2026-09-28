(() => {
    'use strict';

    const form = document.querySelector('[data-greeting-form]');
    if (!form) return;
    const feedback = form.querySelector('[data-form-feedback]');
    const textarea = form.elements.message;
    const count = form.querySelector('[data-message-count]');

    textarea.addEventListener('input', () => { count.textContent = textarea.value.length; });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const payload = Object.fromEntries(new FormData(form).entries());
        if (!String(payload.guest_name || '').trim() || !String(payload.message || '').trim() || !payload.attendance_status) {
            feedback.textContent = 'Lengkapi nama, kehadiran, dan ucapan.';
            return;
        }
        button.disabled = true;
        const oldLabel = button.textContent;
        button.textContent = 'Mengirim...';
        feedback.textContent = '';
        try {
            const response = await fetch('/api/greetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Ucapan gagal dikirim.');
            form.elements.message.value = '';
            count.textContent = '0';
            feedback.textContent = result.message;
            window.dispatchEvent(new CustomEvent('daymoment:greeting-sent', { detail: { greeting: result.greeting } }));
        } catch (error) {
            feedback.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = oldLabel;
        }
    });
})();
