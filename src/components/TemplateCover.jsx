import React, { useState } from 'react';
import { MAIN_APP_URL } from '../lib/urls.js';

const DEFAULT_COVERS = {
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

export default function TemplateCover({ template, eager = false, className = '' }) {
  const fallback = defaultTemplateCover(template?.code);
  const [source, setSource] = useState(() => templateCoverUrl(template));

  React.useEffect(() => setSource(templateCoverUrl(template)), [template?.code, template?.thumbnail, template?.thumbnail_url]);

  return <div className={`template-cover ${className}`.trim()}>
    <img
      src={source}
      alt={`Sampul template ${template?.name || 'Daymoment'}`}
      width="400"
      height="300"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => source !== fallback && setSource(fallback)}
    />
  </div>;
}
