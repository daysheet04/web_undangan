import React, { useState, useEffect, useRef, useMemo } from 'react';
import { templateCoverUrl, defaultTemplateCover } from './TemplateCover.jsx';

const FALLBACK_HERO_TEMPLATES = [
  {
    code: 'puspa_jawi',
    name: 'Puspa Jawi',
    category: 'Javanese Botanical',
  },
  {
    code: 'lunara_azure',
    name: 'Lunara Azure',
    category: 'Porcelain Moon Garden',
  },
  {
    code: 'aurelia_grande',
    name: 'Aurelia Grande',
    category: 'Interactive 3D Ballroom',
  },
  {
    code: 'verdant_vow',
    name: 'Verdant Vow',
    category: 'Sage Garden 4D',
  },
];

function HeroSlideItem({ slide, isActive, eager }) {
  const fallback = defaultTemplateCover(slide.code);
  const [source, setSource] = useState(slide.imageUrl);

  useEffect(() => {
    setSource(slide.imageUrl);
  }, [slide.imageUrl]);

  return (
    <div
      className={`hero-phone-slide ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      <a
        href={`/template/${slide.code}`}
        className="hero-phone-slide-link"
        tabIndex={isActive ? 0 : -1}
        aria-label={`Buka preview template ${slide.name}`}
      >
        <img
          src={source}
          alt={`Sampul template undangan pernikahan ${slide.name}`}
          width="236"
          height="472"
          className="hero-phone-slide-img"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            if (source !== fallback) setSource(fallback);
          }}
        />
      </a>
    </div>
  );
}

export default function HeroPhoneSlideshow({ templates = [], interval = 3500 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const slides = useMemo(() => {
    const list = Array.isArray(templates) && templates.length > 0 ? templates : FALLBACK_HERO_TEMPLATES;
    return list.map((item) => ({
      code: item.code,
      name: item.name || 'Daymoment',
      category: item.category || 'Undangan Digital',
      imageUrl: templateCoverUrl(item),
    }));
  }, [templates]);

  const total = slides.length;
  const safeIndex = total > 0 ? currentIndex % total : 0;
  const currentSlide = slides[safeIndex] || slides[0];

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, interval);
    return () => clearInterval(timer);
  }, [total, isPaused, interval]);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 36) {
      if (delta > 0) {
        // Swipe left -> Next
        setCurrentIndex((prev) => (prev + 1) % total);
      } else {
        // Swipe right -> Previous
        setCurrentIndex((prev) => (prev - 1 + total) % total);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!slides.length) return null;

  return (
    <div
      className="hero-phone-slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Slideshow template undangan aktif"
    >
      {slides.map((slide, index) => (
        <HeroSlideItem
          key={slide.code || index}
          slide={slide}
          isActive={index === safeIndex}
          eager={index < 2}
        />
      ))}

      <div className="hero-phone-gradient" aria-hidden="true" />

      {currentSlide && (
        <div className="hero-phone-overlay">
          <a
            href={`/template/${currentSlide.code}`}
            className="hero-phone-badge"
            aria-label={`Lihat preview template ${currentSlide.name}`}
          >
            <div className="hero-phone-badge-text">
              <span className="hero-phone-badge-category">{currentSlide.category}</span>
              <strong className="hero-phone-badge-title">{currentSlide.name}</strong>
            </div>
            <span className="hero-phone-badge-cta">
              Lihat
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </a>

          {total > 1 && (
            <div className="hero-phone-dots" role="tablist" aria-label="Indikator slide template">
              {slides.map((slide, idx) => (
                <button
                  key={slide.code || idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === safeIndex}
                  aria-label={`Buka slide template ${slide.name}`}
                  className={`hero-phone-dot ${idx === safeIndex ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
