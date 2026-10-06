import React, { useCallback, useEffect, useRef, useState } from "react";

const LAYER = "/assets/images/templates/verdant-vow/layers";
const CINEMATIC = "/assets/images/templates/verdant-vow/cinematic";
const GATE_DURATION = 5100;
const CAMERA_START_DELAY = 2400;
const CRITICAL_ASSETS = [
  `${CINEMATIC}/garden-gate-portal-v2.webp`,
  `${CINEMATIC}/garden-gate-leaves-v2.webp`,
  `${LAYER}/foreground-botanical.webp`,
];

export default function VerdantOpeningScene({ bride, groom, guestName, date, sceneReady = false, autoEnter = false, onStart, onEnter }) {
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const finishTimer = useRef();
  const startTimer = useRef();
  const autoTimer = useRef();
  const canEnter = ready && sceneReady;

  const enter = useCallback(() => {
    if (leaving || !canEnter) return;
    setLeaving(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 100 : GATE_DURATION;
    startTimer.current = window.setTimeout(() => onStart?.(), reducedMotion ? 0 : CAMERA_START_DELAY);
    finishTimer.current = window.setTimeout(onEnter, duration);
  }, [canEnter, leaving, onEnter, onStart]);

  useEffect(() => {
    let active = true;
    let completed = 0;
    const preload = (source) => new Promise((resolve) => {
      const image = new Image();
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        completed += 1;
        if (active) setLoadedAssets(completed);
        resolve();
      };
      image.onload = settle;
      image.onerror = settle;
      image.decoding = "async";
      image.src = source;
      if (image.complete) {
        if (image.decode) image.decode().then(settle).catch(settle);
        else settle();
      }
    });

    Promise.all(CRITICAL_ASSETS.map(preload)).then(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      window.clearTimeout(finishTimer.current);
      window.clearTimeout(startTimer.current);
      window.clearTimeout(autoTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!autoEnter || !canEnter || leaving) return undefined;
    autoTimer.current = window.setTimeout(enter, 650);
    return () => window.clearTimeout(autoTimer.current);
  }, [autoEnter, canEnter, enter, leaving]);

  return (
    <section className={`vv-cinematic-opening vv-gate-opening ${canEnter ? "is-scene-ready" : "is-preparing"} ${leaving ? "is-entering" : ""}`}>
      <div className="vv-gate-world" aria-hidden="true">
        <div className="vv-gate-assembly">
          <div className="vv-gate-doorway">
            <div className="vv-gate-leaf vv-gate-leaf-left">
              <img src={`${CINEMATIC}/garden-gate-leaves-v2.webp`} alt="" fetchPriority="high" />
              <i aria-hidden="true" />
            </div>
            <div className="vv-gate-leaf vv-gate-leaf-right">
              <img src={`${CINEMATIC}/garden-gate-leaves-v2.webp`} alt="" fetchPriority="high" />
              <i aria-hidden="true" />
            </div>
          </div>
          <div className="vv-gate-floor-shadow" />
          <img className="vv-gate-portal" src={`${CINEMATIC}/garden-gate-portal-v2.webp`} alt="" fetchPriority="high" />
        </div>

        <img className="vv-gate-foreground vv-gate-foreground-left" src={`${LAYER}/foreground-botanical.webp`} alt="" />
        <img className="vv-gate-foreground vv-gate-foreground-right" src={`${LAYER}/foreground-botanical.webp`} alt="" />
        <div className="vv-opening-sparks">
          {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--spark": index, "--x": `${(index * 29) % 95}%`, "--y": `${(index * 41) % 88}%` }} />)}
        </div>
      </div>

      <div className="vv-gate-copy" aria-busy={!canEnter}>
        <div className="vv-gate-medallion">
          <small>The Wedding of</small>
          <h1><b>{bride}</b><i>&amp;</i><b>{groom}</b></h1>
          <time>{date}</time>
        </div>
        <p>Kepada Yth.<strong>{guestName}</strong></p>
        <button type="button" onClick={enter} disabled={!canEnter || leaving}>
          {canEnter ? <>Buka Undangan <b aria-hidden="true">→</b></> : <>Menyiapkan gerbang <b aria-hidden="true">{loadedAssets}/{CRITICAL_ASSETS.length}</b></>}
        </button>
        <em className={`vv-opening-ready ${canEnter ? "is-ready" : ""}`}>
          {canEnter ? "Daymoment mempersembahkan" : "Menyusun taman sebelum Anda masuk"}
        </em>
      </div>

      <div className="vv-gate-prelude" role="status" aria-hidden={canEnter}>
        <span>Daymoment</span>
        <i aria-hidden="true" />
        <small>Menyiapkan satu perjalanan istimewa</small>
      </div>
    </section>
  );
}
