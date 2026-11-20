import React from 'react';

/** Minimal hairline UI icon set (1.35px editorial strokes) for buttons and controls. */
export function VcIcon({ name, size = 16 }) {
  const s = { width: size, height: size, flexShrink: 0, display: 'inline-block' };
  const stroke = 'currentColor';
  switch (name) {
    case 'map':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case 'calendar':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );
    case 'copy':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="1.5" />
          <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5V4.5A1.5 1.5 0 0 1 4 3h9.5A1.5 1.5 0 0 1 15 4.5v1" />
        </svg>
      );
    case 'check':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5 9.5 17 19 7" />
        </svg>
      );
    case 'music':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </svg>
      );
    case 'share':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="m16 6-4-4-4 4M12 2v13" />
        </svg>
      );
    case 'close':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'prev':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case 'next':
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    default:
      return null;
  }
}

/** Symmetrical Baroque calligraphic dividers (scroll / fleuron / diamond). */
export function VcBaroqueDivider({ variant = 'scroll', className = '' }) {
  if (variant === 'fleuron') {
    return (
      <svg
        className={`vc-svg-orn vc-divider-fleuron${className ? ` ${className}` : ''}`}
        viewBox="0 0 160 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 14H58M102 14H144"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M80 4.5C77.2 8.2 75.8 11.2 80 14C84.2 11.2 82.8 8.2 80 4.5Z"
          fill="currentColor"
          opacity="0.88"
        />
        <path
          d="M80 23.5C77.2 19.8 75.8 16.8 80 14C84.2 16.8 82.8 19.8 80 23.5Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M78 14C73 9 65.5 9.2 63.5 13.5C62.2 16.4 65 18.4 67.5 17C69.4 15.9 68.7 13.4 66.8 13.6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M82 14C87 9 94.5 9.2 96.5 13.5C97.8 16.4 95 18.4 92.5 17C90.6 15.9 91.3 13.4 93.2 13.6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="54" cy="14" r="1.4" fill="currentColor" opacity="0.7" />
        <circle cx="106" cy="14" r="1.4" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }

  if (variant === 'diamond') {
    return (
      <svg
        className={`vc-svg-orn vc-divider-diamond${className ? ` ${className}` : ''}`}
        viewBox="0 0 180 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 10H72M108 10H168"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M90 3.5L96.5 10L90 16.5L83.5 10L90 3.5Z"
          stroke="currentColor"
          strokeWidth="1.15"
          fill="none"
        />
        <circle cx="90" cy="10" r="1.9" fill="currentColor" />
        <circle cx="77" cy="10" r="1.3" fill="currentColor" opacity="0.75" />
        <circle cx="103" cy="10" r="1.3" fill="currentColor" opacity="0.75" />
      </svg>
    );
  }

  return (
    <svg
      className={`vc-svg-orn vc-divider-scroll${className ? ` ${className}` : ''}`}
      viewBox="0 0 240 34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M120 5C116.8 9.2 115.6 13.2 120 17C124.4 13.2 123.2 9.2 120 5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M120 29C117.4 25.5 116.8 22.2 120 19.2C123.2 22.2 122.6 25.5 120 29Z"
        fill="currentColor"
        opacity="0.72"
      />
      <path
        d="M116 17C108 9 95 7 85 13C77.5 17.5 79.5 24.5 85.5 23.5C89.8 22.8 90.2 17.5 86.2 16.8C83.5 16.3 82.4 18.8 84 20.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M124 17C132 9 145 7 155 13C162.5 17.5 160.5 24.5 154.5 23.5C150.2 22.8 149.8 17.5 153.8 16.8C156.5 16.3 157.6 18.8 156 20.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M78 16.8C64 16.8 55 11.2 44 13.5C37 15 35.5 20.5 40 22C43.2 23 45.2 20.4 43.4 18.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M162 16.8C176 16.8 185 11.2 196 13.5C203 15 204.5 20.5 200 22C196.8 23 194.8 20.4 196.6 18.4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.82"
      />
      <path
        d="M14 17H34M206 17H226"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="102" cy="17" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="138" cy="17" r="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/** Delicate Baroque Fleur-de-Lis & Acanthus Crown Finial perched atop arch frames. */
export function VcArchCrown({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-arch-crown${className ? ` ${className}` : ''}`}
      viewBox="0 0 120 34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M60 3C55.5 10.5 55 17 60 22C65 17 64.5 10.5 60 3Z"
        fill="currentColor"
      />
      <path
        d="M55 21C49 11 39 10 34 15.5C31 19 34 23 37.5 21.5C39.8 20.5 39 17.5 36.8 18"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M65 21C71 11 81 10 86 15.5C89 19 86 23 82.5 21.5C80.2 20.5 81 17.5 83.2 18"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M50 23.5C41 25.5 27 28.5 14 29.5M70 23.5C79 25.5 93 28.5 106 29.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.72"
      />
      <circle cx="48" cy="24" r="1.6" fill="currentColor" />
      <circle cx="72" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Refined vintage stationery ribbon banner with forked ends. */
export function VcRibbonBanner({ text = 'THE WEDDING OF', className = '' }) {
  return (
    <div className={`vc-ribbon-banner${className ? ` ${className}` : ''}`}>
      <span className="vc-ribbon-tail is-left" aria-hidden="true" />
      <span className="vc-ribbon-body">{text}</span>
      <span className="vc-ribbon-tail is-right" aria-hidden="true" />
    </div>
  );
}

/** Dainty Baroque corner scrollwork bracket for stationery cards and frames. */
export function VcCornerFiligree({ position = 'tl', className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-corner-filigree is-${position}${className ? ` ${className}` : ''}`}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 29V9C3 5.7 5.7 3 9 3H29"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M7 22C7 13 13 7 22 7M10 13C11.5 10.2 13.8 8.8 16.5 8.5"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Intertwined antique wedding rings emblem. */
export function VcRingsEmblem({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-rings-emblem${className ? ` ${className}` : ''}`}
      viewBox="0 0 64 36"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="20" r="10.5" stroke="currentColor" strokeWidth="1.45" />
      <circle cx="40" cy="20" r="10.5" stroke="currentColor" strokeWidth="1.45" />
      <path
        d="M32 6.5L34.4 9.2L32 11.8L29.6 9.2L32 6.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
      />
      <path
        d="M27.5 6.8L26.2 5M36.5 6.8L37.8 5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/** Graceful botanical & Baroque crest sweeping above the Hero arched portrait frame. */
export function VcHeroBotanicalCrest({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-hero-botanical-crest${className ? ` ${className}` : ''}`}
      viewBox="0 0 260 52"
      fill="none"
      aria-hidden="true"
    >
      {/* Center fleur-de-lis crown finial */}
      <path
        d="M130 3.5C126.2 9.5 125.2 14.5 130 19C134.8 14.5 133.8 9.5 130 3.5Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M124 19C119.5 11.5 112 10.5 107.5 14.5C104.5 17.2 106.5 21.2 110 20.2C112.5 19.5 112 16.5 109.5 16.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M136 19C140.5 11.5 148 10.5 152.5 14.5C155.5 17.2 153.5 21.2 150 20.2C147.5 19.5 148 16.5 150.5 16.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Left & right arch-following floral boughs */}
      <path
        d="M119 20.5C94 21 63 29 31 44.5C24 47.8 18 45.2 21 40.5C22.8 37.8 26.8 39 25.8 41.8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M141 20.5C166 21 197 29 229 44.5C236 47.8 242 45.2 239 40.5C237.2 37.8 233.2 39 234.2 41.8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      {/* Fine leaves along left bough */}
      <path
        d="M95 23C92 17.5 86 15.5 81 17C85.5 20 89.5 21.5 95 23ZM74 28C70.5 23 64 21.5 59.5 23.5C64 26 68.5 27.2 74 28ZM53 35C49 30.8 43 30 39 32.2C43.5 34.2 48 34.8 53 35Z"
        fill="currentColor"
        opacity="0.72"
      />
      {/* Fine leaves along right bough */}
      <path
        d="M165 23C168 17.5 174 15.5 179 17C174.5 20 170.5 21.5 165 23ZM186 28C189.5 23 196 21.5 200.5 23.5C196 26 191.5 27.2 186 28ZM207 35C211 30.8 217 30 221 32.2C216.5 34.2 212 34.8 207 35Z"
        fill="currentColor"
        opacity="0.72"
      />
      {/* Delicate pearl accents */}
      <circle cx="130" cy="23.5" r="1.6" fill="currentColor" opacity="0.88" />
      <circle cx="102" cy="24.5" r="1.2" fill="currentColor" opacity="0.65" />
      <circle cx="158" cy="24.5" r="1.2" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

/** Inverted calligraphic scrollwork pedestal anchoring the Hero portrait showcase. */
export function VcHeroPedestalFlourish({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-hero-pedestal-flourish${className ? ` ${className}` : ''}`}
      viewBox="0 0 220 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M110 27.5C107.2 22.8 106.4 18.8 110 15C113.6 18.8 112.8 22.8 110 27.5Z"
        fill="currentColor"
        opacity="0.86"
      />
      <path
        d="M106 14.5C96 8 81 6.5 68 11.5C60 14.6 62 21.5 68 20.5C72 19.8 72.5 15 68.5 14.5C65.8 14.2 65 16.5 66.5 17.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M114 14.5C124 8 139 6.5 152 11.5C160 14.6 158 21.5 152 20.5C148 19.8 147.5 15 151.5 14.5C154.2 14.2 155 16.5 153.5 17.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M61 13.5C47 13.5 34 9.5 16 11.5M159 13.5C173 13.5 186 9.5 204 11.5"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.65"
      />
      <circle cx="96" cy="14" r="1.4" fill="currentColor" opacity="0.72" />
      <circle cx="124" cy="14" r="1.4" fill="currentColor" opacity="0.72" />
      <circle cx="110" cy="8.5" r="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/** Graceful Baroque filigree wings flanking a script "&" divider between bride and groom. */
export function VcCoupleAmpersand({ className = '' }) {
  const wingPath = (
    <svg className="vc-svg-orn vc-amp-wing" viewBox="0 0 112 36" fill="none" aria-hidden="true">
      <path
        d="M104 18H74C61 18 51 11 39 11C28 11 22 17 24.5 22.5C26.5 27 33 27.5 36.5 23.5C39.2 20.5 37.5 15.8 33.5 16.2C30.8 16.5 30 19 31.8 20.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M72 18C62 18 54 25 43 27.5C34 29.5 21 27 10 21.5"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.68"
      />
      <path
        d="M84 18C79 13.5 73 11.5 67 13C72.5 15.2 77 16.6 84 18Z"
        fill="currentColor"
        opacity="0.72"
      />
      <circle cx="56" cy="18" r="1.35" fill="currentColor" opacity="0.7" />
      <circle cx="96" cy="18" r="1.2" fill="currentColor" opacity="0.58" />
    </svg>
  );

  return (
    <div className={`vc-couple-ampersand${className ? ` ${className}` : ''}`} aria-hidden="true">
      {wingPath}
      <span className="vc-couple-amp-glyph">&amp;</span>
      <span className="vc-amp-wing-flip">{wingPath}</span>
    </div>
  );
}

/** Antique 4-point compass emblem marking the start of the Vintage Journey Map. */
export function VcMapCompass({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-map-compass${className ? ` ${className}` : ''}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1" opacity="0.65" />
      <circle cx="32" cy="32" r="17.5" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.55" />
      <path d="M32 6V12M32 52V58M6 32H12M52 32H58" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
      <path d="M32 14L35.4 28.6L50 32L35.4 35.4L32 50L28.6 35.4L14 32L28.6 28.6Z" stroke="currentColor" strokeWidth="1.05" fill="none" />
      <path d="M32 14L35.4 28.6L32 32L28.6 28.6Z" fill="currentColor" opacity="0.82" />
      <circle cx="32" cy="32" r="2.2" fill="currentColor" />
    </svg>
  );
}

/** Dotted vintage travel-map S-curve connector between chronological journey stops. */
export function VcMapTrailCurve({ direction = 'ltr', className = '' }) {
  const d =
    direction === 'rtl'
      ? 'M 222 4 C 222 38, 58 38, 58 72'
      : 'M 58 4 C 58 38, 222 38, 222 72';

  return (
    <svg
      className={`vc-svg-orn vc-map-trail-svg${className ? ` ${className}` : ''}`}
      viewBox="0 0 280 76"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="4 5"
        strokeLinecap="round"
        opacity="0.72"
      />
      <circle cx={direction === 'rtl' ? 222 : 58} cy="5" r="2.6" fill="currentColor" opacity="0.82" />
      <circle cx={direction === 'rtl' ? 58 : 222} cy="71" r="2.6" fill="currentColor" opacity="0.82" />
      <path
        d="M140 31.5L142.2 35.8L146.5 38L142.2 40.2L140 44.5L137.8 40.2L133.5 38L137.8 35.8Z"
        fill="currentColor"
        opacity="0.75"
      />
    </svg>
  );
}

/** Destination antique map pin & heart crest marking "Menuju Pelaminan". */
export function VcMapDestination({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-map-destination${className ? ` ${className}` : ''}`}
      viewBox="0 0 72 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M36 4V16"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeDasharray="3 4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M36 18C27.2 18 20.5 24.7 20.5 33.4C20.5 44.5 36 58 36 58C36 58 51.5 44.5 51.5 33.4C51.5 24.7 44.8 18 36 18Z"
        stroke="currentColor"
        strokeWidth="1.25"
        fill="none"
      />
      <path
        d="M36 39.2C36 39.2 29.8 35.3 29.8 31.1C29.8 29 31.4 27.5 33.4 27.5C34.6 27.5 35.5 28.2 36 29.1C36.5 28.2 37.4 27.5 38.6 27.5C40.6 27.5 42.2 29 42.2 31.1C42.2 35.3 36 39.2 36 39.2Z"
        fill="currentColor"
        opacity="0.88"
      />
      <path d="M18 59H54" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

/** Delicate 4-point compass star pin emblem replacing numeric badges on the Vintage Journey Map. */
export function VcMapWaypointStar({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-map-waypoint-star${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2.5L14.2 9.8L21.5 12L14.2 14.2L12 21.5L9.8 14.2L2.5 12L9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 5.2L13.4 10.6L18.8 12L13.4 13.4L12 18.8L10.6 13.4L5.2 12L10.6 10.6Z"
        fill="currentColor"
        opacity="0.22"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/** Delicate wax-sealed antique wedding invitation envelope icon for the cover CTA button. */
export function VcEnvelopeSealIcon({ className = '' }) {
  return (
    <svg
      className={`vc-svg-orn vc-envelope-seal-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 22 18"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.5" y="2" width="19" height="14" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.2 3.2L11 9.8L19.8 3.2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="10" r="2.2" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="11" cy="10" r="0.8" fill="currentColor" />
    </svg>
  );
}
