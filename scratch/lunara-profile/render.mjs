import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';

// Local render fixture: actual template + local assets, no API writes or remote data.
const label = process.argv[2] || 'before';
console.log(`${label}: preparing isolated local render`);
const dir = resolve('scratch/lunara-profile');
await build({ entryPoints: ['src/templates/LunaraAzureTemplate.jsx'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', define: { 'import.meta.env': '{}' }, outfile: `${dir}/template.cjs`, logLevel: 'silent' });
const Template = createRequire(import.meta.url)(`${dir}/template.cjs`).default;
const fixture = renderToStaticMarkup(React.createElement(Template, {
  invitation: { reception_date: '2026-12-25', akad_date: '2026-12-25', reception_start_time: '11:00', akad_start_time: '09:00', has_gift: true, has_wishes: true, gallery_limit: 6 },
  media: [], giftAccounts: [{ provider: 'BCA', account_number: '123456789', account_name: 'Andi & Nisa' }], greetings: [], guestName: 'Tamu', guestSalutation: 'Kepada Yth.', preview: true
}));
const styles = ['base.css', 'lunara-azure.css', 'daymoment-shared.css', 'mobile-template-fixes.css'];
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(s => `<link rel="stylesheet" href="/assets/css/templates/${s}">`).join('')}</head><body>${fixture}<script src="/assets/js/templates/lunara-azure.js"></script></body></html>`;
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
  const file = resolve('public', '.' + pathname);
  if (!file.startsWith(resolve('public') + '\\')) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    res.setHeader('Content-Type', ({ '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp' })[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
console.log(`Fixture ready on loopback port ${port}`);
const profile = await mkdtemp(resolve(tmpdir(), 'lunara-render-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let socket;
try {
  let debugPort;
  for (let n = 0; n < 80; n++) {
    try { debugPort = Number((await readFile(`${profile}/DevToolsActivePort`, 'utf8')).split('\n')[0]); break; } catch { await sleep(100); }
  }
  if (!debugPort) throw new Error('Chrome debugging endpoint unavailable');
  console.log(`Chrome debugging ready on ${debugPort}`);
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`, { signal: AbortSignal.timeout(5000) })).json();
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, reject) => { const timer = setTimeout(() => reject(new Error('Chrome connection timed out')), 5000); socket.onopen = () => { clearTimeout(timer); r(); }; socket.onerror = reject; });
  const pending = new Map();
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(JSON.stringify(message.error)));
    else task.resolve(message.result);
  };
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; const timer = setTimeout(() => { pending.delete(key); reject(new Error(`${method} timed out`)); }, method === 'Input.synthesizeScrollGesture' ? 60000 : 10000); pending.set(key, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id: key, method, params })); });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  for (let n = 0; n < 80; n++) {
    if (await evaluate('!!document.querySelector(".lunara-opening-ready")')) break;
    await sleep(100);
  }
  await evaluate('document.querySelector("[data-open-invitation]").click()');
  await sleep(5500);
  const animationSnapshot = `Array.from(document.querySelectorAll('.lunara-section .garden-butterfly')).map(node => ({ section: node.closest('.lunara-section').className, opacity: getComputedStyle(node).opacity, display: getComputedStyle(node).display, names: getComputedStyle(node).animationName, durations: getComputedStyle(node).animationDuration, delays: getComputedStyle(node).animationDelay, easing: getComputedStyle(node).animationTimingFunction, state: getComputedStyle(node).animationPlayState }))`;
  await evaluate(`window.profileFrames=[];window.profileLongTasks=[];window.profileOn=true;new PerformanceObserver(list=>profileLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask'});let prev;function sample(t){if(prev)profileFrames.push(t-prev);prev=t;if(profileOn)requestAnimationFrame(sample)}requestAnimationFrame(sample)`);
  const distance = await evaluate('document.documentElement.scrollHeight - innerHeight');
  console.log(`${label}: rendering mobile scroll, CPU 4x, ${distance}px`);
  await cdp('Input.synthesizeScrollGesture', { x: 190, y: 660, yDistance: -distance, speed: 650, gestureSourceType: 'mouse' });
  await sleep(4000);
  const result = await evaluate(`(() => {profileOn=false;const sorted=profileFrames.slice().sort((a,b)=>a-b);return {frames:sorted.length,framesOver34ms:sorted.filter(x=>x>34).length,p95ms:sorted[Math.floor(sorted.length*.95)],longTasks:profileLongTasks.length,longTaskMs:profileLongTasks.reduce((a,b)=>a+b,0),scrollY, distance:document.documentElement.scrollHeight-innerHeight,offscreenRunning:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest('.lunara-section:not(.is-viewport-active)')).length,butterflies:${animationSnapshot},hiddenGardens:[...document.querySelectorAll('[data-lunara-garden]')].filter(n=>!n.classList.contains('is-bloomed')).length}})()`);
  if (result.scrollY < distance * .9) throw new Error(`Scroll incomplete: ${result.scrollY}/${distance}`);
  await evaluate(`document.querySelector('.lunara-gift').scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(3500);
  result.gift = await evaluate(animationSnapshot);
  const shot = await cdp('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${dir}/${label}-gift.png`, Buffer.from(shot.data, 'base64'));
  await writeFile(`${dir}/${label}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, butterflies: undefined, gift: undefined }));
  await cdp('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
  server.close();
}
