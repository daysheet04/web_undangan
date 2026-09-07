(() => {
    'use strict';

    window.showToast = (message, type = 'success') => {
        const region = document.getElementById('toastRegion');
        if (!region) return;
        const toast = document.createElement('div');
        toast.className = 'toast' + (type === 'error' ? ' error' : '');
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.textContent = message;
        region.appendChild(toast);
        window.setTimeout(() => toast.remove(), 3800);
    };

    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-copy]');
        if (!button) return;
        const value = button.dataset.copy || '';
        try {
            await navigator.clipboard.writeText(value);
            const old = button.textContent;
            button.textContent = 'Tersalin!';
            window.showToast('Tautan berhasil disalin.');
            window.setTimeout(() => { button.textContent = old; }, 1600);
        } catch {
            window.prompt('Salin tautan berikut:', value);
        }
    });
})();
