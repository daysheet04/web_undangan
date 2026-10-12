import React, { useCallback, useEffect, useRef, useState } from "react";

const LAYER = "/assets/images/templates/verdant-vow/layers";
const CINEMATIC = "/assets/images/templates/verdant-vow/cinematic";
const GATE_DURATION = 6500;
const JOURNEY_START_DELAY = 4050;

export default function VerdantOpeningScene({ bride, groom, guestName, date, sceneReady = false, autoEnter = false, onPrepare, onStart, onEnter }) {
  const compact = typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches;
  const gatePortal = `${CINEMATIC}/garden-gate-portal-indonesian-${compact ? 'mobile-' : ''}v1.webp`;
  const gateLeaves = `${CINEMATIC}/garden-gate-leaves-indonesian-${compact ? 'mobile-' : ''}v1.webp`;
  const foreground = `${LAYER}/foreground-botanical-indonesian-${compact ? 'mobile-' : ''}v1.webp`;
  const criticalAssets = [gatePortal, gateLeaves, foreground];
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const finishTimer = useRef();
  const journeyTimer = useRef();
  const autoTimer = useRef();
  const canEnter = ready && sceneReady;

  const enter = useCallback(() => {
    if (leaving || !canEnter) return;
    onPrepare?.();
    setLeaving(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 100 : GATE_DURATION;
    if (reducedMotion) onStart?.();
    else journeyTimer.current = window.setTimeout(() => onStart?.(), JOURNEY_START_DELAY);
    finishTimer.current = window.setTimeout(onEnter, duration);
  }, [canEnter, leaving, onEnter, onPrepare, onStart]);

  useEffect(() => {
    let active = true;
    let completed = 0;
    const maxWait = window.setTimeout(() => {
      if (active) setReady(true);
    }, compact ? 1200 : 1800);
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

    Promise.all(criticalAssets.map(preload)).then(() => {
      window.clearTimeout(maxWait);
      if (active) setReady(true);
    });

    return () => {
      active = false;
      window.clearTimeout(maxWait);
      window.clearTimeout(finishTimer.current);
      window.clearTimeout(journeyTimer.current);
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
              <span className="vv-gate-leaf-face">
                <img src={gateLeaves} alt="" fetchPriority="high" decoding="async" />
              </span>
              <span className="vv-gate-lock-plate" aria-hidden="true"><i /></span>
            </div>
            <div className="vv-gate-leaf vv-gate-leaf-right">
              <span className="vv-gate-leaf-face">
                <img src={gateLeaves} alt="" fetchPriority="high" decoding="async" />
              </span>
              <span className="vv-gate-lock-plate" aria-hidden="true"><i /></span>
            </div>
            <span className="vv-gate-latch" aria-hidden="true"><i><b /></i></span>
          </div>
          <div className="vv-gate-floor-shadow" />
          <img className="vv-gate-portal" src={gatePortal} alt="" fetchPriority="high" decoding="async" />
        </div>

        <img className="vv-gate-foreground vv-gate-foreground-left" src={foreground} alt="" decoding="async" />
        <img className="vv-gate-foreground vv-gate-foreground-right" src={foreground} alt="" decoding="async" />
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
          {canEnter ? <>Buka Undangan <b aria-hidden="true">→</b></> : <>{ready ? "Menyiapkan sinematik" : "Menyiapkan gerbang"} <b aria-hidden="true">{loadedAssets}/{criticalAssets.length}</b></>}
        </button>
        <em className={`vv-opening-ready ${canEnter ? "is-ready" : ""}`}>
          {canEnter ? "Daymoment mempersembahkan" : "Menyusun taman sebelum Anda masuk"}
        </em>
      </div>

      <div className="vv-gate-prelude" role="status" aria-hidden={canEnter}>
        <i aria-hidden="true" />
      </div>
    </section>
  );
}
