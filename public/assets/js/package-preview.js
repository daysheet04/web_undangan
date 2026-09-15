(() => {
    'use strict';

    const root = document.querySelector('[data-package-preview-root]');
    if (!root) return;

    const frame = root.querySelector('[data-package-preview-frame]');
    const label = root.querySelector('[data-preview-label]');
    const orderLink = root.querySelector('[data-preview-order]');
    const template = root.dataset.templateCode;

    root.querySelectorAll('[data-preview-package]').forEach((button) => {
        button.addEventListener('click', () => {
            const code = button.dataset.previewPackage;
            const name = button.dataset.packageName;

            root.querySelectorAll('[data-preview-package-card]').forEach((card) => {
                const active = card.dataset.previewPackageCard === code;
                card.classList.toggle('active', active);
                const cardButton = card.querySelector('[data-preview-package]');
                cardButton.classList.toggle('button-primary', active);
                cardButton.classList.toggle('button-secondary', !active);
                cardButton.textContent = active ? 'Sedang dilihat' : `Lihat ${cardButton.dataset.packageName}`;
            });

            label.textContent = name;
            frame.title = `Preview ${template} paket ${name}`;
            frame.src = `/template/${encodeURIComponent(template)}?embed=1&package=${encodeURIComponent(code)}`;
            orderLink.href = `/order?template=${encodeURIComponent(template)}&package=${encodeURIComponent(code)}`;
            orderLink.textContent = `Pilih Paket ${name}`;

            if (window.innerWidth <= 720) {
                root.querySelector('.preview-phone-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();
