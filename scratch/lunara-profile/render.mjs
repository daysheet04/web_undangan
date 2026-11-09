import { build, transform } from 'esbuild';
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
const mode = process.argv[3] || 'scroll';
const stress = mode === 'stress-scroll';
const legacy = mode === 'legacy-scroll';
const photoFixture = mode === 'photo-scroll';
const cpuRate = stress ? 8 : 4;
console.log(`${label}: preparing isolated local render`);
const dir = resolve('scratch/lunara-profile');
await build({ entryPoints: ['src/templates/LunaraAzureTemplate.jsx'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', define: { 'import.meta.env': '{}' }, outfile: `${dir}/template.cjs`, logLevel: 'silent' });
const Template = createRequire(import.meta.url)(`${dir}/template.cjs`).default;
const fixtureProps = {
  invitation: { reception_date: '2026-12-25', akad_date: '2026-12-25', reception_start_time: '11:00', akad_start_time: '09:00', has_gift: true, has_wishes: true, gallery_limit: 6 },
  media: [], giftAccounts: [{ provider: 'BCA', account_number: '123456789', account_name: 'Andi & Nisa' }], greetings: [], guestName: 'Tamu', guestSalutation: 'Kepada Yth.', preview: true
};
if (photoFixture) {
  const photos = Object.keys(JSON.parse(await readFile(resolve('src/templates/lunara-demo-images.json'), 'utf8')));
  Object.assign(fixtureProps.invitation, {
    cover_image: photos.find(path => path.includes('prestige-cover_image')),
    bride_photo: photos.find(path => path.includes('bride_photo')),
    groom_photo: photos.find(path => path.includes('groom_photo')),
  });
  fixtureProps.media = photos.filter(path => path.includes('/prestige/')).map((file_path, id) => ({ id, file_path }));
}
const fixture = renderToStaticMarkup(React.createElement(Template, fixtureProps));
if (mode === 'react-startup') {
  await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import InvitationPage from './src/pages/InvitationPage.jsx'; createRoot(document.getElementById('root')).render(React.createElement(InvitationPage,{templateCode:'butterfly-blum',preview:true}));`, resolveDir: process.cwd(), loader: 'jsx' }, bundle: true, platform: 'browser', format: 'esm', define: { 'import.meta.env': '{}' }, outfile: `${dir}/page-fixture.js`, external: ['/assets/*'], logLevel: 'silent', minify: true, target: 'chrome90' });
}
const styles = ['base.css', 'lunara-azure.css', 'daymoment-shared.css', 'mobile-template-fixes.css'];
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preload" as="script" href="/assets/js/templates/lunara-azure.js" fetchpriority="high">${styles.map(s => `<link rel="stylesheet" href="/assets/css/templates/${s}">`).join('')}</head><body>${fixture}<script src="/assets/js/templates/lunara-azure.js"></script></body></html>`;
const originalPhotoRequests = [];
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/media/')) originalPhotoRequests.push(pathname);
  if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end(mode === 'react-startup' ? '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/react-fixture.js"></script></body></html>' : html); return; }
  if (pathname === '/react-fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile(`${dir}/page-fixture.js`)); return; }
  if (pathname === '/api/templates/butterfly-blum') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ok:true,template:{code:'butterfly_blum',packages:[{code:'prestige',has_gift:true,has_wishes:true,gallery_limit:6}]},invitation:fixtureProps.invitation,media:[],giftAccounts:fixtureProps.giftAccounts})); return; }
  if (mode === 'react-startup' && /\/(preview|greeting)\.js$/.test(pathname)) await new Promise(r => setTimeout(r, 6000));
  if (mode === 'slow-images' && /\.(webp|svg)$/.test(pathname)) await new Promise(r => setTimeout(r, 6000));
  const file = resolve('public', '.' + pathname);
  if (!file.startsWith(resolve('public') + '\\')) { res.writeHead(403).end(); return; }
  try {
    let data = await readFile(file);
    if (label.startsWith('v18-') && pathname === '/assets/js/templates/lunara-azure.js') data = await readFile(`${dir}/v18-baseline.js`);
    if (legacy && pathname === '/assets/js/templates/lunara-azure.js') data = (await transform(data.toString(), {loader:'js',minify:true,target:['es2020','chrome90','firefox88','safari14','edge90']})).code;
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
  const errors = [];
  let layers = [];
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'LayerTree.layerTreeDidChange') layers = message.params.layers || [];
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
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
  await cdp('Runtime.enable');
  await cdp('LayerTree.enable');
  await cdp('Performance.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  if (mode === 'stalled-decode') {
    await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'HTMLImageElement.prototype.decode = function() { return new Promise(function() {}); }; Object.defineProperty(document.fonts, "ready", {value:new Promise(function(){})});' });
  }
  await cdp('Page.addScriptToEvaluateOnNewDocument', {source: `window.revealGeometryReads=0;const original=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(this.hasAttribute('data-lunara-reveal')||this.hasAttribute('data-lunara-garden'))window.revealGeometryReads++;return original.call(this);};`});
  if (legacy) await cdp('Page.addScriptToEvaluateOnNewDocument', {source:'HTMLImageElement.prototype.decode=undefined;window.requestIdleCallback=undefined;'});
  await cdp('Page.navigate', { url: mode === 'live' ? process.argv[4] : `http://127.0.0.1:${port}/` });
  for (let n = 0; n < 80; n++) {
    if (await evaluate('!!document.querySelector(".lunara-opening-ready")')) break;
    await sleep(100);
  }
  if (mode !== 'scroll' && !stress && !legacy && !photoFixture) {
    const startup = await evaluate(`({ready:!!document.querySelector('.lunara-opening-ready'),root:document.querySelector('.lunara-azure')?.className,msSinceNavigation:performance.now(),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),images:[...document.querySelectorAll('.lunara-cover img')].map(n=>({complete:n.complete,width:n.naturalWidth}))})`);
    startup.errors = errors;
    if (mode !== 'live') {
      await evaluate('document.querySelector("[data-open-invitation]").click()');
      await sleep(700);
      startup.opened = await evaluate('!!document.querySelector(".invitation-open")');
    }
    const shot = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${dir}/${label}.png`, Buffer.from(shot.data, 'base64'));
    await writeFile(`${dir}/${label}.json`, JSON.stringify(startup, null, 2));
    console.log(JSON.stringify(startup));
    await cdp('Browser.close');
  } else {
  await evaluate('document.querySelector("[data-open-invitation]").click()');
  await sleep(5500);
  if (stress) await cdp('Memory.simulatePressureNotification', { level: 'critical' });
  const animationSnapshot = `Array.from(document.querySelectorAll('.lunara-section .garden-butterfly')).map(node => ({ section: node.closest('.lunara-section').className, opacity: getComputedStyle(node).opacity, display: getComputedStyle(node).display, names: getComputedStyle(node).animationName, durations: getComputedStyle(node).animationDuration, delays: getComputedStyle(node).animationDelay, easing: getComputedStyle(node).animationTimingFunction, state: getComputedStyle(node).animationPlayState }))`;
  await evaluate(`window.profileFrames=[];window.profileLongTasks=[];window.profileOn=true;new PerformanceObserver(list=>profileLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask'});let prev;function sample(t){if(prev)profileFrames.push(t-prev);prev=t;if(profileOn)requestAnimationFrame(sample)}requestAnimationFrame(sample)`);
  const metricsBefore = await cdp('Performance.getMetrics');
  const distance = await evaluate('document.documentElement.scrollHeight - innerHeight');
  console.log(`${label}: rendering mobile scroll, CPU ${cpuRate}x, ${distance}px, memory pressure ${stress ? 'critical' : 'normal'}`);
  await cdp('Input.synthesizeScrollGesture', { x: 190, y: 660, yDistance: -distance, speed: 650, gestureSourceType: 'mouse' });
  await sleep(4000);
  const result = await evaluate(`(() => {profileOn=false;const sorted=profileFrames.slice().sort((a,b)=>a-b);return {frames:sorted.length,framesOver34ms:sorted.filter(x=>x>34).length,p95ms:sorted[Math.floor(sorted.length*.95)],longTasks:profileLongTasks.length,longTaskMs:profileLongTasks.reduce((a,b)=>a+b,0),scrollY, distance:document.documentElement.scrollHeight-innerHeight,offscreenRunning:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest('.lunara-section:not(.is-viewport-active)')).length,butterflies:${animationSnapshot},hiddenGardens:[...document.querySelectorAll('[data-lunara-garden]')].filter(n=>!n.classList.contains('is-bloomed')).length}})()`);
  if (result.scrollY < distance * .9) throw new Error(`Scroll incomplete: ${result.scrollY}/${distance}`);
  result.revealGeometryReads = await evaluate('window.revealGeometryReads');
  const metricsAfter = await cdp('Performance.getMetrics');
  result.workMs = Object.fromEntries(['LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'].map(name=>[name,1000*((metricsAfter.metrics.find(m=>m.name===name)?.value||0)-(metricsBefore.metrics.find(m=>m.name===name)?.value||0))]));
  result.cpuRate = cpuRate;
  result.memoryPressure = stress ? 'critical notification' : 'none';
  result.layers = layers.length;
  result.layerReasons = [];
  for (const layer of layers.filter(l => l.drawsContent)) {
    try {
      const reasons = await cdp('LayerTree.compositingReasons', { layerId: layer.layerId });
      result.layerReasons.push({ width: layer.width, height: layer.height, backendNodeId: layer.backendNodeId, reasons: reasons.compositingReasonIds });
    } catch { /* A live animation can retire a layer after the snapshot. */ }
  }
  result.errors = errors;
  if (photoFixture) {
    result.photos = await evaluate(`Array.from(document.querySelectorAll('.lunara-section img[srcset]')).map(n=>({alt:n.alt,src:n.currentSrc,complete:n.complete,naturalWidth:n.naturalWidth,loading:n.loading}))`);
    result.originalPhotoRequests = originalPhotoRequests.slice();
    if (result.photos.length !== 9 || result.photos.some(photo => !photo.complete || !photo.naturalWidth) || result.originalPhotoRequests.length) {
      throw new Error('Responsive photo delivery failed: ' + JSON.stringify({photos:result.photos, originals:result.originalPhotoRequests}));
    }
  }
  await evaluate(`document.querySelector('.lunara-gift').scrollIntoView({behavior:'instant',block:'start'})`);
  await sleep(3500);
  result.gift = await evaluate(animationSnapshot);
  // Freeze ambient phases only in the local fixture to compare exact geometry/pixels.
  if (stress) {
    await evaluate(`document.getAnimations().forEach(a=>{a.pause();a.currentTime=5000;})`);
    await sleep(200);
    const geometry = `Array.from(document.querySelectorAll('[data-lunara-reveal].is-motion-settled,.section-garden.is-motion-settled .garden-piece:not(.garden-butterfly)')).map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {className:n.className,x:r.x,y:r.y,width:r.width,height:r.height,transform:s.transform,opacity:s.opacity}})`;
    result.restingGeometry = await evaluate(geometry);
    const shot = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${dir}/${label}-frozen.png`, Buffer.from(shot.data, 'base64'));
    const baselineCss = await readFile(`${dir}/v18-baseline.css`, 'utf8');
    await evaluate(`document.querySelector('link[href="/assets/css/templates/lunara-azure.css"]').disabled=true;var comparisonStyle=document.createElement('style');comparisonStyle.textContent=${JSON.stringify(baselineCss)};document.querySelector('link[href="/assets/css/templates/lunara-azure.css"]').after(comparisonStyle)`);
    await sleep(200);
    result.baselineRestingGeometry = await evaluate(geometry);
    const baselineShot = await cdp('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${dir}/${label}-baseline-frozen.png`, Buffer.from(baselineShot.data, 'base64'));
    await evaluate(`comparisonStyle.remove();document.querySelector('link[href="/assets/css/templates/lunara-azure.css"]').disabled=false`);
  }
  const shot = await cdp('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${dir}/${label}-gift.png`, Buffer.from(shot.data, 'base64'));
  await writeFile(`${dir}/${label}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, butterflies: undefined, gift: undefined, layerReasons: undefined, restingGeometry:undefined,baselineRestingGeometry:undefined }));
  await cdp('Browser.close');
  }
} finally {
  socket?.close();
  chrome.kill();
  server.close();
}
