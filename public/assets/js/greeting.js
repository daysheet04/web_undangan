(() => {
    'use strict';

    const form = document.querySelector('[data-greeting-form]');
    if (!form) return;
    const feedback = form.querySelector('[data-form-feedback]');
    const textarea = form.elements.message;
    const count = form.querySelector('[data-message-count]');

    textarea.addEventListener('input', () => { count.textContent = textarea.value.length; });

    const makeGreeting = (greeting) => {
        const article = document.createElement('article');
        article.className = 'greeting-item';
        const head = document.createElement('div');
        head.className = 'greeting-head';
        const name = document.createElement('strong');
        name.textContent = greeting.guest_name;
        const meta = document.createElement('small');
        const labels = { attending: 'Hadir', not_attending: 'Tidak Hadir', unsure: 'Masih Ragu' };
        const guestCount = Number(greeting.guest_count || 1);
        meta.textContent = (labels[greeting.attendance_status] || 'Masih Ragu') + ` · ${guestCount} orang · Baru saja`;
        const message = document.createElement('p');
        message.textContent = greeting.message;
        head.append(name, meta);
        article.append(head, message);
        return article;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"]');
        const payload = Object.fromEntries(new FormData(form).entries());
        if (!payload.guest_name.trim() || !payload.message.trim() || !payload.attendance_status) {
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
            document.querySelector('[data-empty-greeting]')?.remove();
            document.querySelector('[data-greeting-list]')?.prepend(makeGreeting(result.greeting));
            form.elements.message.value = '';
            count.textContent = '0';
            feedback.textContent = result.message;
        } catch (error) {
            feedback.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = oldLabel;
        }
    });
})();
