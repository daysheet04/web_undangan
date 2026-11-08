(function(){var i=document.querySelector(".lunara-azure");if(!i||i.dataset.lunaraInitialized==="true")return;i.dataset.lunaraInitialized="true";var b=i.querySelector(".lunara-cover"),Y=i.querySelector("[data-open-invitation]"),g=i.querySelector("[data-wedding-audio]"),w=i.querySelector("[data-music-controller]"),f=i.querySelector("[data-countdown]"),y=i.querySelector("[data-greeting-form]"),I=i.querySelector("[data-greeting-list]"),d=i.querySelector("[data-form-feedback]"),M=i.querySelector('textarea[name="message"]'),L=i.querySelector("[data-message-count]"),S=window.matchMedia("(prefers-reduced-motion: reduce)").matches,ie=window.matchMedia("(max-width: 900px)").matches,z=ie?"-mobile.webp":".webp",U="/assets/images/templates/lunara-azure/",oe=typeof navigator.deviceMemory=="number"&&navigator.deviceMemory<=4||typeof navigator.hardwareConcurrency=="number"&&navigator.hardwareConcurrency<=6||!!(navigator.connection&&navigator.connection.saveData),P=!1,q=!1,v=!1,E=!0,F=window.scrollY||window.pageYOffset||0,O=0,m={};i.classList.add("lunara-motion"),oe&&i.classList.add("is-perf-adaptive");// Sample frame pressure in short, spaced windows instead of on every scroll burst.
var A = false, lastPerfSample = -Infinity;
function N() {
  var now = performance.now();
  if (A || document.hidden || now - lastPerfSample < 2000 || i.classList.contains("is-perf-adaptive")) return;
  A = true;
  lastPerfSample = now;
  var previous = now, slowFrames = 0, samples = 0;
  function sample(time) {
    if (document.hidden || !i.isConnected) { A = false; return; }
    var elapsed = time - previous;
    previous = time;
    if (elapsed > 28 && elapsed < 250) slowFrames++;
    samples++;
    if (slowFrames >= 3) {
      i.classList.add("is-perf-adaptive");
      A = false;
    } else if (samples < 42) {
      window.requestAnimationFrame(sample);
    } else A = false;
  }
  window.requestAnimationFrame(sample);
}
N();
window.addEventListener("scroll", function() {
  var position = window.scrollY || window.pageYOffset || 0;
  if (Math.abs(position - F) > 2) { E = position >= F; F = position; }
  if (!v) { v = true; i.classList.add("is-scrolling"); }
  window.clearTimeout(O);
  O = window.setTimeout(function() {
    v = false;
    i.classList.remove("is-scrolling");
    scheduleSettledCleanup();
  }, 140);
  N();
}, { passive: true });
// Share deferred cleanup instead of polling once per completed element while scrolling.
var settledQueue = [], settledFrame = 0;
function scheduleSettledCleanup() {
  if (v || settledFrame || !settledQueue.length) return;
  settledFrame = window.requestAnimationFrame(function() {
    settledFrame = 0;
    if (v) return;
    var node = settledQueue.shift();
    if (node && node.isConnected) {
      node.classList.remove("is-animating");
      node.classList.add("is-motion-settled");
    }
    scheduleSettledCleanup();
  });
}
function se(node, duration) {
  var finished = false, timer;
  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    node.removeEventListener("transitionend", onEnd);
    settledQueue.push(node);
    scheduleSettledCleanup();
  }
  function onEnd(event) {
    if (event.target === node && event.propertyName === "transform") finish();
  }
  node.addEventListener("transitionend", onEnd);
  timer = window.setTimeout(finish, duration);
}
function V(e,a){if(!e)return Promise.resolve();e.loading==="lazy"&&(e.loading="eager");var n=e.currentSrc||e.src||"";return n&&m[n]&&e.complete&&e.naturalWidth>0?Promise.resolve():e.complete&&e.naturalWidth>0?typeof e.decode=="function"?Promise.race([e.decode().then(function(){n&&(m[n]=!0)}).catch(function(){}),new Promise(function(r){window.setTimeout(r,a||180)})]):(n&&(m[n]=!0),Promise.resolve()):new Promise(function(r){var o=!1,t=function(){o||(o=!0,typeof e.decode=="function"?e.decode().then(function(){n&&(m[n]=!0)}).catch(function(){}).finally(r):r())};e.addEventListener("load",t,{once:!0}),e.addEventListener("error",t,{once:!0}),window.setTimeout(t,a||240)})}function W(e,a){return!e||m[e]?Promise.resolve():new Promise(function(n){var r=new Image;r.decoding="async";var o=!1,t=function(){o||(o=!0,m[e]=!0,typeof r.decode=="function"?r.decode().catch(function(){}).finally(n):n())};r.addEventListener("load",t,{once:!0}),r.addEventListener("error",t,{once:!0}),r.src=e,window.setTimeout(t,a||220)})}function ce(){if(S){i.classList.add("lunara-opening-ready");return}var e=U+"lunara-opening-aurora-contour-v1"+z,a=U+"lunara-hero-aurora-collage-v1"+z,n=Array.prototype.slice.call(i.querySelectorAll(".lunara-cover img, .lunara-hero-photo img, .lunara-mirror-bottom-frame img")),r=document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready.catch(function(){}),new Promise(function(o){window.setTimeout(o,240)})]):Promise.resolve();Promise.all(n.map(function(o){return V(o,160)}).concat([W(e,180),W(a,200),r])).finally(function(){window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){i.classList.add("lunara-opening-ready")})})})}ce();function B(e){w&&(w.classList.toggle("is-playing",!!e),w.setAttribute("aria-pressed",e?"true":"false"))}function G(){g&&g.play().then(function(){B(!0)}).catch(function(){B(!1)})}function le(){var e=window.location.hash;if(!e||e==="#")return null;try{return i.querySelector(e)}catch{return null}}var Q=Array.prototype.slice.call(i.querySelectorAll("[data-lunara-reveal]")),R=Array.prototype.slice.call(i.querySelectorAll("[data-lunara-garden]")),J=Array.prototype.slice.call(i.querySelectorAll(".lunara-section")),_=null,D=null,K=null,X=!1;function k(e,a){e&&(e.classList.remove("is-animating"),e.classList.add("no-reveal-transition",a?"is-bloomed":"is-visible","is-motion-settled"))}function Z() {
  if (X) return;
  X = true;
  if (S || !("IntersectionObserver" in window)) {
    Q.forEach(function(node) { node.classList.add("is-visible", "is-motion-settled"); });
    R.forEach(function(node) { node.classList.add("is-bloomed", "is-motion-settled"); });
    J.forEach(function(node) { node.classList.add("is-in-view", "is-viewport-active"); });
    return;
  }
  var revealQueue = [], timer = 0, frame = 0;
  function schedule() {
    if (!timer && !frame && revealQueue.length && i.isConnected) {
      frame = window.requestAnimationFrame(drain);
    }
  }
  function drain() {
    frame = 0;
    if (!i.isConnected) return;
    // Read positions together before any class writes can invalidate layout.
    var positions = revealQueue.map(function(item) { return item.node.getBoundingClientRect(); });
    while (revealQueue.length) {
      var item = revealQueue.shift(), rect = positions.shift();
      var node = item.node, visibleClass = item.isGarden ? "is-bloomed" : "is-visible";
      if (node.classList.contains(visibleClass)) continue;
      if (rect.bottom < 40 || (!E && rect.top < 0)) {
        k(node, item.isGarden);
        continue;
      }
      // Preserve v14 choreography and its 115ms entry cadence on every device.
      node.classList.add("is-animating", visibleClass);
      se(node, item.isGarden ? 3250 : 2500);
      break;
    }
    if (revealQueue.length) {
      timer = window.setTimeout(function() {
        timer = 0;
        schedule();
      }, 115);
    }
  }
  function observeEntries(entries, isGarden, observer) {
    entries.forEach(function(entry) {
      var node = entry.target;
      var passed = entry.boundingClientRect.top < 0 || entry.boundingClientRect.bottom < 0;
      if (!entry.isIntersecting && !passed) return;
      observer.unobserve(node);
      if (node.classList.contains(isGarden ? "is-bloomed" : "is-visible")) return;
      if (!entry.isIntersecting || !E || entry.boundingClientRect.bottom < 40) k(node, isGarden);
      else revealQueue.push({ node: node, isGarden: isGarden });
    });
    schedule();
  }
  _ = new IntersectionObserver(function(entries) { observeEntries(entries, false, _); }, {
    threshold: .06, rootMargin: "0px 0px -3% 0px"
  });
  D = new IntersectionObserver(function(entries) { observeEntries(entries, true, D); }, {
    threshold: .08, rootMargin: "0px 0px -4% 0px"
  });
  Q.forEach(function(node) { _.observe(node); });
  R.forEach(function(node) { D.observe(node); });
  K = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add("is-in-view", "is-viewport-active");
      else entry.target.classList.remove("is-viewport-active");
    });
  }, { threshold: .01, rootMargin: "80px 0px 80px 0px" });
  J.forEach(function(node) { K.observe(node); });
}
function ue(e){if(e){var a=e.querySelectorAll("[data-lunara-reveal]"),n=e.querySelectorAll("[data-lunara-garden]");e.classList.add("no-reveal-transition","is-in-view","is-viewport-active"),a.forEach(function(r){r.classList.add("is-visible","is-motion-settled")}),n.forEach(function(r){r.classList.add("is-bloomed","is-motion-settled")}),window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){e.classList.remove("no-reveal-transition")})})}}function $(){var e=i.querySelector(".lunara-hero");if(e&&e.classList.add("is-in-view","is-viewport-active"),S){i.classList.add("lunara-hero-sequence","lunara-hero-clean");return}window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){i.classList.add("lunara-hero-sequence"),window.setTimeout(function(){var a=function(){if(v){window.setTimeout(a,180);return}i.classList.add("lunara-hero-clean")};a()},3650)})})}function de(){if(!(P||q)){P=!0,q=!0,N();var e=le(),a=Array.prototype.slice.call(i.querySelectorAll(".lunara-hero img"));Promise.all(a.map(function(n){return V(n,130)})).finally(function(){window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){i.classList.add("lunara-is-opening","invitation-open"),document.body.classList.remove("lunara-locked"),document.body.style.overflow="",e?ue(e):window.scrollTo({top:0,behavior:"auto"}),window.setTimeout(function(){$()},180),window.setTimeout(function(){b&&(b.setAttribute("aria-hidden","true"),b.style.display="none"),i.classList.remove("lunara-is-opening"),i.classList.add("lunara-cover-closed"),P=!1,Z(),e&&e.scrollIntoView({behavior:S?"auto":"smooth",block:"start"})},1280),G()})})})}}if(b&&Y?(document.body.classList.add("lunara-locked"),Y.addEventListener("click",de)):(q=!0,i.classList.add("invitation-open","lunara-cover-closed"),$(),Z()),w&&g&&w.addEventListener("click",function(){g.paused?G():(g.pause(),B(!1))}),f){var ee=f.closest(".lunara-section"),te=new Date(f.getAttribute("data-countdown")||"").getTime(),x={days:f.querySelector("[data-days]"),hours:f.querySelector("[data-hours]"),minutes:f.querySelector("[data-minutes]"),seconds:f.querySelector("[data-seconds]")},ae=function(){if(!(!q||v)&&!(ee&&!ee.classList.contains("is-viewport-active"))&&Number.isFinite(te)){var e=Math.max(0,te-Date.now()),a={days:Math.floor(e/864e5),hours:Math.floor(e/36e5%24),minutes:Math.floor(e/6e4%60),seconds:Math.floor(e/1e3%60)};Object.keys(x).forEach(function(n){if(x[n]){var r=String(a[n]).padStart(2,"0");x[n].textContent!==r&&(x[n].textContent=r)}})}};ae(),window.setInterval(ae,1e3)}var p=i.querySelector("[data-lunara-bank-picker]"),h=i.querySelector("[data-lunara-bank-trigger]"),ne=i.querySelector("[data-lunara-bank-label]"),re=Array.prototype.slice.call(i.querySelectorAll("[data-lunara-bank-option]")),fe=Array.prototype.slice.call(i.querySelectorAll("[data-lunara-bank-card]"));function H(){!p||!h||(p.classList.remove("is-open"),h.setAttribute("aria-expanded","false"))}function ve(e){fe.forEach(function(a,n){a.hidden=n!==e}),re.forEach(function(a,n){var r=n===e;if(a.setAttribute("aria-selected",r?"true":"false"),r&&ne){var o=a.querySelector("strong"),t=a.querySelector("small");ne.textContent=o?o.textContent+(t?" \u2014 "+t.textContent:""):""}}),H()}p&&h&&(h.addEventListener("click",function(){var e=!p.classList.contains("is-open");p.classList.toggle("is-open",e),h.setAttribute("aria-expanded",e?"true":"false")}),re.forEach(function(e){e.addEventListener("click",function(){var a=Number(e.getAttribute("data-lunara-bank-option")||0);ve(a)})}),document.addEventListener("click",function(e){p.contains(e.target)||H()}),document.addEventListener("keydown",function(e){e.key==="Escape"&&H()}));var C=Array.prototype.slice.call(i.querySelectorAll("[data-lunara-select]"));function T(e){var a=e.querySelector("[data-lunara-select-trigger]");e.classList.remove("is-open"),a&&a.setAttribute("aria-expanded","false")}C.forEach(function(e){var a=e.querySelector("[data-lunara-select-input]"),n=e.querySelector("[data-lunara-select-trigger]"),r=e.querySelector("[data-lunara-select-label]"),o=Array.prototype.slice.call(e.querySelectorAll("[data-lunara-select-option]"));!a||!n||!r||(n.addEventListener("click",function(){var t=!e.classList.contains("is-open");C.forEach(T),e.classList.toggle("is-open",t),n.setAttribute("aria-expanded",t?"true":"false")}),o.forEach(function(t){t.addEventListener("click",function(){var l=t.getAttribute("data-lunara-select-option")||"",c=t.textContent?t.textContent.trim():"";a.value=l,r.textContent=c||"Pilih",o.forEach(function(s){s.setAttribute("aria-selected",s===t?"true":"false")}),T(e)})}))}),document.addEventListener("click",function(e){C.forEach(function(a){a.contains(e.target)||T(a)})}),document.addEventListener("keydown",function(e){e.key==="Escape"&&C.forEach(T)}),i.querySelectorAll("[data-copy-account]").forEach(function(e){e.addEventListener("click",function(){var a=e.closest("[data-lunara-bank-card]"),n=a?a.querySelector("[data-account-number]"):null,r=n?n.textContent.trim():"";!r||!navigator.clipboard||navigator.clipboard.writeText(r).then(function(){var o=e.innerHTML;e.textContent="Nomor Tersalin",window.setTimeout(function(){e.innerHTML=o},1600)})})}),M&&L&&M.addEventListener("input",function(){L.textContent=String(M.value.length)});function me(e){return e==="attending"?"Hadir":e==="not_attending"?"Tidak Hadir":"Masih Ragu"}y&&y.addEventListener("submit",function(e){e.preventDefault();var a=new FormData(y),n={slug:String(a.get("slug")||i.getAttribute("data-slug")||"").trim(),guest_name:String(a.get("guest_name")||"").trim(),attendance_status:String(a.get("attendance_status")||"unsure").trim()||"unsure",message:String(a.get("message")||"").trim()};if(!n.guest_name||!n.message){d&&(d.textContent="Nama dan ucapan wajib diisi.");return}d&&(d.textContent="Mengirim ucapan..."),fetch("/api/public/greetings",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(n)}).then(function(r){return r.json().then(function(o){if(!r.ok||!o.ok)throw new Error(o.message||"Ucapan belum berhasil dikirim.");return o})}).then(function(){if(I){var r=I.querySelector("[data-empty-greeting]");r&&r.remove();var o=document.createElement("article");o.className="greeting-item";var t=document.createElement("div");t.className="greeting-head";var l=document.createElement("strong");l.textContent=n.guest_name;var c=document.createElement("small");c.textContent=me(n.attendance_status);var s=document.createElement("p");s.textContent=n.message,t.appendChild(l),t.appendChild(c),o.appendChild(t),o.appendChild(s),I.prepend(o)}y.reset(),L&&(L.textContent="0"),d&&(d.textContent="Terima kasih, doa hangat Anda sudah tercatat.")}).catch(function(r){d&&(d.textContent=r.message||"Terjadi kendala saat mengirim ucapan.")})})})();
