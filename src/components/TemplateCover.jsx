import React, { useState, useEffect, useRef } from 'react';
import { MAIN_APP_URL } from '../lib/urls.js';

const DEFAULT_COVERS = {
  java_vibes: '/assets/images/templates/puspa-jawi/puspa-cover-washi-v2.webp',
  puspa_jawi: '/assets/images/templates/puspa-jawi/puspa-cover-washi-v2.webp',
  lunara_azure: '/assets/images/templates/lunara-azure/lunara-opening-aurora-contour-v1.webp',
  aurelia_grande: '/assets/images/templates/aurelia-grande/grand-ballroom-stage.webp',
  verdant_vow: '/assets/images/templates/verdant-vow/cinematic/scene-01-grand-gate-v1.webp',
};

export function defaultTemplateCover(code) {
  return DEFAULT_COVERS[code] || '/assets/images/templates/placeholder-couple.svg';
}

export function templateCoverUrl(template) {
  const source = String(template?.thumbnail_url || template?.thumbnail || '').trim();
  const fallback = defaultTemplateCover(template?.code);
  if (!source || (!source.includes('/') && !/\.(avif|jpe?g|png|webp)$/i.test(source))) return fallback;
  if (/^(https?:|data:|blob:)/i.test(source) || source.startsWith('/')) return source;
  return `${MAIN_APP_URL}/media/${source.replace(/^\/+/, '')}`;
}

export function templatePhoneCoverUrl(template) {
  const source = String(template?.phone_cover_url || template?.phone_cover || '').trim();
  if (source && (source.includes('/') || /\.(avif|jpe?g|png|webp)$/i.test(source))) {
    if (/^(https?:|data:|blob:)/i.test(source) || source.startsWith('/')) return source;
    return `${MAIN_APP_URL}/media/${source.replace(/^\/+/, '')}`;
  }
  return templateCoverUrl(template);
}

export function DesktopTemplatePreview({ template, eager, source, fallback, setSource, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const width = rect.width || el.clientWidth;
      if (width > 0) {
        setScale(width / 1200);
      }
    };

    updateScale();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateScale);
      ro.observe(el);
    }
    window.addEventListener('resize', updateScale);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const iframeSrc = `/template/${template.code}?embed=1&cover_only=1`;

  return (
    <div
      ref={containerRef}
      className={`template-cover template-cover--desktop ${className}`.trim()}
      style={{
        '--preview-scale': scale,
      }}
    >
      {/* Background / Fallback placeholder underneath */}
      <img
        src={source}
        alt={`Sampul template ${template?.name || 'Daymoment'}`}
        width="400"
        height="300"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => source !== fallback && setSource(fallback)}
        className="template-cover-fallback-img"
        style={{
          opacity: isLoaded && !hasError ? 0 : 1,
        }}
      />

      {/* Scaled Desktop Live Template Preview */}
      {!hasError && (
        <div
          className="template-cover-iframe-scaler"
          style={{
            transform: `scale(${scale})`,
            opacity: isLoaded ? 1 : 0,
          }}
        >
          <iframe
            src={iframeSrc}
            title={`Preview Desktop Template ${template?.name || 'Java Vibes'}`}
            width="1200"
            height="900"
            scrolling="no"
            loading={eager ? 'eager' : 'lazy'}
            tabIndex={-1}
            aria-hidden="true"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </div>
      )}
    </div>
  );
}

export default function TemplateCover({ template, eager = false, className = '', liveDesktop = false }) {
  const fallback = defaultTemplateCover(template?.code);
  const [source, setSource] = useState(() => templateCoverUrl(template));

  useEffect(() => setSource(templateCoverUrl(template)), [template?.code, template?.thumbnail, template?.thumbnail_url]);

  if (liveDesktop) {
    return (
      <DesktopTemplatePreview
        template={template}
        eager={eager}
        source={source}
        fallback={fallback}
        setSource={setSource}
        className={className}
      />
    );
  }

  return (
    <div className={`template-cover ${className}`.trim()}>
      <img
        src={source}
        alt={`Sampul template ${template?.name || 'Daymoment'}`}
        width="400"
        height="300"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => source !== fallback && setSource(fallback)}
      />
    </div>
  );
}

