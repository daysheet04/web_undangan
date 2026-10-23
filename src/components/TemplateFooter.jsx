import React from 'react';

export default function TemplateFooter({ className = '' }) {
  return (
    <footer className={`template-footer daymoment-template-footer ${className}`.trim()}>
      <img
        src="/assets/images/brand/daymoment-logo.webp"
        alt="Daymoment"
        width="180"
        height="64"
        loading="lazy"
        decoding="async"
      />
      <p>Semoga setiap momen bahagiamu selalu dipenuhi berkah dan kebahagiaan.</p>
    </footer>
  );
}
