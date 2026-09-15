import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const editorToken = process.env.TEST_EDITOR_TOKEN || '';
const publicSlug = process.env.TEST_PUBLIC_SLUG || '';
const debugPort = Number(process.env.CHROME_DEBUG_PORT || 9333);
const runtimeRoot = resolve('.test-runtime/browser-preview');
mkdirSync(runtimeRoot, { recursive: true });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
const failures = [];
let passes = 0;

function check(condition, message) {
    if (condition) {
        passes += 1;
        process.stdout.write(`[OK]   ${message}\n`);
        return;
    }
    failures.push(message);
    process.stdout.write(`[FAIL] ${message}\n`);
}

class CdpClient {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.counter = 0;
        this.pending = new Map();
        this.events = new Map();
        this.listeners = new Set();
        this.ready = new Promise((resolveReady, rejectReady) => {
            this.socket.addEventListener('open', resolveReady, { once: true });
            this.socket.addEventListener('error', rejectReady, { once: true });
        });
        this.socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.id && this.pending.has(message.id)) {
                const { resolvePending, rejectPending } = this.pending.get(message.id);
                this.pending.delete(message.id);
                if (message.error) rejectPending(new Error(message.error.message));
                else resolvePending(message.result || {});
                return;
            }
            if (!message.method) return;
            const queue = this.events.get(message.method) || [];
            queue.push(message.params || {});
            this.events.set(message.method, queue);
            this.listeners.forEach((listener) => listener(message.method, message.params || {}));
        });
    }

    async send(method, params = {}) {
        await this.ready;
        const id = ++this.counter;
        const response = new Promise((resolvePending, rejectPending) => {
            this.pending.set(id, { resolvePending, rejectPending });
        });
        this.socket.send(JSON.stringify({ id, method, params }));
        return response;
    }

    waitFor(method, timeout = 10000) {
        const queued = this.events.get(method) || [];
        if (queued.length) return Promise.resolve(queued.shift());
        return new Promise((resolveEvent, rejectEvent) => {
            const timer = setTimeout(() => {
                this.listeners.delete(listener);
                rejectEvent(new Error(`Timeout waiting for ${method}`));
            }, timeout);
            const listener = (eventMethod, params) => {
                if (eventMethod !== method) return;
                clearTimeout(timer);
                this.listeners.delete(listener);
                const queue = this.events.get(method) || [];
                queue.shift();
                resolveEvent(params);
            };
            this.listeners.add(listener);
        });
    }

    clearEvents() {
        this.events.clear();
    }
}

async function waitForDebugger() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
            if (response.ok) return;
        } catch (_) {
            // Chrome is still starting.
        }
        await delay(100);
    }
    throw new Error('Chrome DevTools endpoint tidak aktif.');
}

const chrome = spawn(chromePath, [
    '--headless=old',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${resolve(runtimeRoot, 'chrome-profile')}`,
    'about:blank'
], { stdio: 'ignore' });

let cdp;
let consoleErrors = [];
let requestFailures = [];
let badResponses = [];

try {
    await waitForDebugger();
    const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
    const target = await targetResponse.json();
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.ready;
    cdp.listeners.add((method, params) => {
        if (method === 'Runtime.exceptionThrown') consoleErrors.push(params.exceptionDetails?.text || 'Runtime exception');
        if (method === 'Log.entryAdded' && params.entry?.level === 'error') consoleErrors.push(params.entry.text);
        if (method === 'Network.loadingFailed' && !params.canceled) requestFailures.push(params.errorText || 'Network failed');
        if (method === 'Network.responseReceived' && params.response?.status >= 400) badResponses.push(`${params.response.status} ${params.response.url}`);
    });
    await Promise.all([
        cdp.send('Page.enable'),
        cdp.send('Runtime.enable'),
        cdp.send('Network.enable'),
        cdp.send('Log.enable')
    ]);

    async function evaluate(expression, awaitPromise = false) {
        const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Evaluasi browser gagal');
        return result.result?.value;
    }

    async function viewport(width, height) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width, height, deviceScaleFactor: 1, mobile: true,
            screenWidth: width, screenHeight: height
        });
    }

    async function navigate(path, width = 390, height = 844) {
        consoleErrors = [];
        requestFailures = [];
        badResponses = [];
        cdp.clearEvents();
        await viewport(width, height);
        const loaded = cdp.waitFor('Page.loadEventFired');
        await cdp.send('Page.navigate', { url: baseUrl + path });
        await loaded;
        await delay(1100);
    }

    async function assetAudit(frameExpression = 'document') {
        return evaluate(`(async () => {
            const doc = ${frameExpression};
            const urls = [...doc.querySelectorAll('link[rel="stylesheet"][href], script[src], img[src]')]
                .map((node) => new URL(node.href || node.src, location.href).href)
                .filter((url) => url.startsWith(location.origin));
            const unique = [...new Set(urls)];
            return Promise.all(unique.map(async (url) => {
                try { const response = await fetch(url, { cache: 'reload' }); return { url, status: response.status }; }
                catch (error) { return { url, status: 0, error: error.message }; }
            }));
        })()`, true);
    }

    async function directPreview(template, width) {
        await navigate(`/template/${template}?embed=1`, width, 844);
        const cover = await evaluate(`(() => {
            const root = document.querySelector('[data-template-root]');
            const content = document.querySelector('[data-cover-content]');
            const rect = content?.getBoundingClientRect();
            return {
                width: innerWidth,
                scrollWidth: document.documentElement.scrollWidth,
                text: document.querySelector('.opening-cover')?.innerText || '',
                visible: !!rect && rect.bottom > 0 && rect.top < innerHeight && rect.width > 100 && rect.height > 300,
                button: !!document.querySelector('[data-open-invitation]'),
                root: !!root
            };
        })()`);
        check(cover.width === width, `${template} memakai viewport ${width}px secara tepat`);
        check(cover.scrollWidth <= width + 1, `${template} ${width}px tanpa horizontal overflow`);
        check(cover.root && cover.visible && cover.button, `${template} ${width}px menampilkan cover dan tombol`);
        check(/wedding of/i.test(cover.text) && /Andi/i.test(cover.text) && /Nisa/i.test(cover.text), `${template} ${width}px memuat data contoh lengkap`);

        const assets = await assetAudit();
        check(assets.length >= 5 && assets.every((asset) => asset.status >= 200 && asset.status < 400), `${template} ${width}px memuat seluruh CSS/JS/SVG lokal`);
        const browserClean = consoleErrors.length === 0 && requestFailures.length === 0 && badResponses.length === 0;
        if (!browserClean) {
            process.stdout.write(`       detail: ${JSON.stringify({ consoleErrors, requestFailures, badResponses })}\n`);
        }
        check(browserClean, `${template} ${width}px tanpa error console/network`);

        if (width === 390) {
            const shot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
            writeFileSync(resolve(runtimeRoot, `${template}-390-cover.png`), Buffer.from(shot.data, 'base64'));
        }

        await evaluate(`document.querySelector('[data-open-invitation]').click()`);
        await delay(template === 'javanese_heritage' ? 1800 : 1100);
        const opened = await evaluate(`(() => {
            const root = document.querySelector('[data-template-root]');
            const text = document.body.innerText;
            return {
                open: root.classList.contains('invitation-open'),
                opacity: Number(getComputedStyle(document.querySelector('.invitation-content')).opacity),
                bodyOverflow: getComputedStyle(document.body).overflowY,
                longPage: document.documentElement.scrollHeight > innerHeight * 5,
                complete: document.querySelectorAll('main .inv-section').length >= 8
                    && !!document.querySelector('[data-time-range="akad"]')
                    && !!document.querySelector('[data-time-range="reception"]')
                    && !!document.querySelector('[data-countdown]')
                    && !!document.querySelector('[data-live-href="maps_url"]')
                    && !!document.querySelector('[data-live="love_story"]')
                    && !!document.querySelector('[class*="gallery"]'),
                form: !!document.querySelector('[data-preview-form]'),
                footer: !!document.querySelector('footer')
            };
        })()`);
        check(opened.open && opened.opacity > .99 && opened.bodyOverflow !== 'hidden', `${template} tombol membuka undangan dan mengaktifkan scroll`);
        check(opened.longPage && opened.complete && opened.form && opened.footer, `${template} memuat seluruh section, form demo, dan footer`);
        await evaluate(`new Promise((resolve) => { scrollTo(0, document.documentElement.scrollHeight); setTimeout(resolve, 350); })`, true);
        const revealCount = await evaluate(`document.querySelectorAll('.reveal.visible').length`);
        check(revealCount >= 8, `${template} menjalankan reveal saat scroll`);
    }

    await navigate('/', 1440, 1000);
    const homepageBrand = await evaluate(`(() => {
        const logo = document.querySelector('.site-header .brand-logo');
        const styles = getComputedStyle(document.documentElement);
        return {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
            hero: document.querySelector('.hero h1')?.textContent.trim() || '',
            navbar: document.querySelector('.site-header .brand')?.innerText || '',
            footer: document.querySelector('.site-footer')?.innerText || '',
            logo: !!logo && logo.complete && logo.naturalWidth > 0,
            navy: styles.getPropertyValue('--brand').trim(),
            gold: styles.getPropertyValue('--accent').trim(),
            oldBrand: document.documentElement.innerHTML.toLowerCase().includes('janjikita')
        };
    })()`);
    check(homepageBrand.title.includes('Daymoment') && homepageBrand.description.includes('Tempat kisah baik dimulai.'), 'homepage memakai judul dan metadata Daymoment');
    check(homepageBrand.hero === 'Tempat kisah baik dimulai.' && homepageBrand.navbar.includes('Daymoment') && homepageBrand.footer.includes('Daymoment'), 'navbar, hero, dan footer memakai branding Daymoment');
    check(homepageBrand.logo && homepageBrand.navy === '#102b4a' && homepageBrand.gold === '#c9a46a', 'logo lokal dan warna navy–gold berhasil dimuat');
    check(!homepageBrand.oldBrand && consoleErrors.length === 0 && requestFailures.length === 0 && badResponses.length === 0, 'homepage tidak menyisakan brand lama atau error browser');

    await navigate('/order?template=elegant_navy', 390, 844);
    const orderBrand = await evaluate(`(() => ({ title: document.title, brand: document.querySelector('.brand')?.innerText || '', logo: document.querySelector('.brand-logo')?.complete }))()`);
    check(orderBrand.title.includes('Daymoment') && orderBrand.brand.includes('Tempat kisah baik dimulai.') && orderBrand.logo, 'halaman order memakai logo, title, dan tagline Daymoment');

    for (const template of ['elegant_navy', 'soft_garden', 'javanese_heritage']) {
        for (const width of [360, 390, 430]) await directPreview(template, width);
    }

    await cdp.send('Emulation.clearDeviceMetricsOverride');
    for (const template of ['elegant_navy', 'soft_garden', 'javanese_heritage']) {
        await navigate(`/template/${template}`, 1440, 1000);
        const iframe = await evaluate(`(() => {
            const frame = document.querySelector('.preview-iframe');
            const doc = frame?.contentDocument;
            const rect = doc?.querySelector('[data-cover-content]')?.getBoundingClientRect();
            return {
                ready: doc?.readyState === 'complete',
                text: doc?.querySelector('.opening-cover')?.innerText || '',
                visible: !!rect && rect.top < frame.clientHeight && rect.bottom > 0
            };
        })()`);
        check(iframe.ready && iframe.visible && /Buka Undangan/i.test(iframe.text), `route /template/${template} merender isi di frame HP`);
        const assets = await assetAudit(`document.querySelector('.preview-iframe').contentDocument`);
        check(assets.every((asset) => asset.status >= 200 && asset.status < 400), `asset iframe /template/${template} berstatus sukses`);
        check(consoleErrors.length === 0 && requestFailures.length === 0 && badResponses.length === 0, `route /template/${template} tanpa error browser`);
    }

    if (editorToken) {
        await navigate(`/edit/${encodeURIComponent(editorToken)}`, 1440, 1000);
        const builderReady = await evaluate(`(() => {
            const frame = document.querySelector('#livePreview');
            const doc = frame?.contentDocument;
            return !!document.querySelector('#invitationForm')
                && document.title.includes('Daymoment')
                && /Daymoment/.test(document.querySelector('.builder-brand')?.innerText || '')
                && document.querySelector('.builder-brand .brand-logo')?.complete
                && doc?.readyState === 'complete'
                && /Buka Undangan/i.test(doc.querySelector('.opening-cover')?.innerText || '');
        })()`);
        check(builderReady, 'route /edit/{token} memuat branding Daymoment, builder, dan live preview');
        await evaluate(`document.querySelector('#livePreview').contentWindow.postMessage({ type: 'invitation:update', data: { groom_nickname: 'Raka', bride_nickname: '', venue_name: '' } }, location.origin)`);
        await delay(250);
        const liveResult = await evaluate(`(() => {
            const doc = document.querySelector('#livePreview').contentDocument;
            return {
                groom: doc.querySelector('[data-live="groom_nickname"]')?.textContent,
                bride: doc.querySelector('[data-live="bride_nickname"]')?.textContent,
                venue: doc.querySelector('[data-live="venue_name"]')?.textContent
            };
        })()`);
        check(liveResult.groom === 'Raka' && liveResult.bride === 'Nisa' && liveResult.venue === 'Pendopo Arunika', 'postMessage memperbarui input dan memakai fallback untuk field kosong');
        check(consoleErrors.length === 0 && requestFailures.length === 0 && badResponses.length === 0, 'route /edit/{token} tanpa error console/network');
    }

    if (publicSlug) {
        await navigate(`/${encodeURIComponent(publicSlug)}`, 390, 844);
        const publicReady = await evaluate(`(() => ({
            button: !!document.querySelector('[data-open-invitation]'),
            stylesheetCount: document.styleSheets.length,
            scriptCount: document.scripts.length,
            overflow: document.documentElement.scrollWidth <= innerWidth + 1,
            title: document.title,
            footer: document.querySelector('footer')?.innerText || '',
            brandLogo: document.querySelector('footer .template-brand-lockup img')?.complete
        }))()`);
        check(publicReady.button && publicReady.stylesheetCount >= 2 && publicReady.scriptCount >= 3 && publicReady.overflow, 'route /{slug} memuat template, CSS, JS, dan layout mobile');
        check(publicReady.title.includes('Daymoment') && publicReady.footer.includes('Tempat kisah baik dimulai.') && publicReady.brandLogo, 'route /{slug} memakai metadata dan footer Daymoment');
        await evaluate(`document.querySelector('[data-open-invitation]').click()`);
        await delay(1200);
        const publicOpened = await evaluate(`document.querySelector('[data-template-root]').classList.contains('invitation-open') && Number(getComputedStyle(document.querySelector('.invitation-content')).opacity) > .99`);
        check(publicOpened, 'route /{slug} dapat membuka undangan');
        check(consoleErrors.length === 0 && requestFailures.length === 0 && badResponses.length === 0, 'route /{slug} tanpa error console/network');

        if (editorToken) {
            await navigate(`/success/${encodeURIComponent(editorToken)}`, 390, 844);
            const successBrand = await evaluate(`document.title.includes('Daymoment') && /Daymoment/.test(document.querySelector('.brand')?.innerText || '')`);
            check(successBrand, 'halaman success memakai title dan navbar Daymoment');
        }
    }
} catch (error) {
    failures.push(error.stack || error.message);
    process.stderr.write(`${error.stack || error.message}\n`);
} finally {
    try { await cdp?.send('Browser.close'); } catch (_) { /* Chrome may close before responding. */ }
    chrome.kill();
}

process.stdout.write(`\nBrowser preview: ${passes} pemeriksaan lolos, ${failures.length} gagal.\n`);
if (failures.length) {
    failures.forEach((failure) => process.stdout.write(`- ${failure}\n`));
    process.exitCode = 1;
}
