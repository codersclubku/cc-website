import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface HeroSlide {
  id: string;
  webp: string;
  webp1600: string;
  webp2400: string;
  fallback: string;
  alt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-campus-01',
    webp: '/assets/campus/campus-01.webp',
    webp1600: '/assets/campus/campus-01-1600w.webp',
    webp2400: '/assets/campus/campus-01-2400w.webp',
    fallback: '/assets/campus/campus-01.jpg',
    alt: 'Academic Block and Main Quad exterior architecture'
  },
  {
    id: 'hero-campus-02',
    webp: '/assets/campus/campus-02.webp',
    webp1600: '/assets/campus/campus-02-1600w.webp',
    webp2400: '/assets/campus/campus-02-2400w.webp',
    fallback: '/assets/campus/campus-02.jpg',
    alt: 'Computer Science and Engineering laboratory facility'
  },
  {
    id: 'hero-campus-03',
    webp: '/assets/campus/campus-03.webp',
    webp1600: '/assets/campus/campus-03-1600w.webp',
    webp2400: '/assets/campus/campus-03-2400w.webp',
    fallback: '/assets/campus/campus-03.jpg',
    alt: 'Central University Library building and study commons'
  },
  {
    id: 'hero-campus-04',
    webp: '/assets/campus/campus-04.webp',
    webp1600: '/assets/campus/campus-04-1600w.webp',
    webp2400: '/assets/campus/campus-04-2400w.webp',
    fallback: '/assets/campus/campus-04.jpg',
    alt: 'University Auditorium and Seminar Hall complex'
  },
  {
    id: 'hero-campus-05',
    webp: '/assets/campus/campus-05.webp',
    webp1600: '/assets/campus/campus-05-1600w.webp',
    webp2400: '/assets/campus/campus-05-2400w.webp',
    fallback: '/assets/campus/campus-05.jpg',
    alt: 'Engineering wing and technology research center'
  },
  {
    id: 'hero-campus-06',
    webp: '/assets/campus/campus-06.webp',
    webp1600: '/assets/campus/campus-06-1600w.webp',
    webp2400: '/assets/campus/campus-06-2400w.webp',
    fallback: '/assets/campus/campus-06.jpg',
    alt: 'Campus Innovation Center and collaborative workspace'
  }
];

export interface HeroSlideshowProps {
  slides?: HeroSlide[];
  slideIndex?: number;
  widthClass?: string;
  fadeSpan?: string;
  mobileReducedOpacity?: boolean;
  showDots?: boolean;
  ariaLabel?: string;
}

export const HeroSlideshow: React.FC<HeroSlideshowProps> = ({
  slides,
  slideIndex,
  widthClass = 'lg:w-[55%]',
  fadeSpan = '28%',
  mobileReducedOpacity = false,
  showDots = true,
  ariaLabel = 'Kishkinda University Campus Slideshow',
}) => {
  const activeSlides = slideIndex !== undefined ? [HERO_SLIDES[slideIndex]] : (slides || HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasRealPhotos, setHasRealPhotos] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !hasRealPhotos || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [prefersReduced, hasRealPhotos, activeSlides.length]);

  useEffect(() => {
    if (!hasRealPhotos || activeSlides.length <= 1) return;
    const nextIndex = (currentIndex + 1) % activeSlides.length;
    const nextImg = new Image();
    nextImg.src = activeSlides[nextIndex].webp;
  }, [currentIndex, hasRealPhotos, activeSlides]);

  if (!hasRealPhotos) {
    return (
      <div
        aria-label="Kishkinda University Coders Club"
        className={`absolute inset-0 w-full h-full lg:left-auto lg:right-0 ${widthClass} overflow-hidden pointer-events-none`}
      >
        <img
          src="/src/assets/hero.png"
          alt="Coders Club Kishkinda University architectural platform stack"
          className={`w-full h-full object-cover object-center select-none ${
            mobileReducedOpacity ? 'opacity-25 lg:opacity-100' : ''
          }`}
        />
        <div
          className="hidden lg:block absolute inset-y-0 left-0 w-full pointer-events-none z-10"
          style={{
            background: `linear-gradient(to right, var(--bg) 0%, transparent ${fadeSpan})`,
          }}
          aria-hidden="true"
        />
        <div
          className="block lg:hidden absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to bottom, color-mix(in srgb, var(--bg) 86%, transparent) 0%, color-mix(in srgb, var(--bg) 96%, transparent) 55%, var(--bg) 100%)',
          }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      role="region"
      className={`absolute inset-0 w-full h-full lg:left-auto lg:right-0 ${widthClass} overflow-hidden pointer-events-none`}
    >
      {activeSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        const isFirst = idx === 0;

        return (
          <div
            key={slide.id}
            aria-hidden={!isCurrent}
            style={{
              opacity: isCurrent ? 1 : 0,
              pointerEvents: isCurrent ? 'auto' : 'none',
              transition: 'opacity 700ms ease-in-out',
            }}
            className={`absolute inset-0 w-full h-full ${
              mobileReducedOpacity ? 'opacity-25 lg:opacity-100' : ''
            }`}
          >
            <picture className="w-full h-full block">
              <source
                type="image/webp"
                srcSet={`${slide.webp1600} 1600w, ${slide.webp2400} 2400w, ${slide.webp} 1920w`}
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
              <img
                src={slide.fallback}
                alt={slide.alt}
                width="2400"
                height="1500"
                loading={isFirst ? 'eager' : 'lazy'}
                fetchPriority={isFirst ? 'high' : 'low'}
                decoding="async"
                className="w-full h-full object-cover object-center select-none"
                onError={() => {
                  if (isFirst) {
                    setHasRealPhotos(false);
                  }
                }}
              />
            </picture>
          </div>
        );
      })}

      <div
        className="hidden lg:block absolute inset-y-0 left-0 w-full pointer-events-none z-10"
        style={{
          background: `linear-gradient(to right, var(--bg) 0%, transparent ${fadeSpan})`,
        }}
        aria-hidden="true"
      />

      <div
        className="block lg:hidden absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, color-mix(in srgb, var(--bg) 86%, transparent) 0%, color-mix(in srgb, var(--bg) 96%, transparent) 55%, var(--bg) 100%)',
        }}
        aria-hidden="true"
      />

      {showDots && activeSlides.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-6 lg:right-8 z-20 flex items-center gap-1.5 pointer-events-none">
          {activeSlides.map((_, dotIdx) => (
            <span
              key={dotIdx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dotIdx === currentIndex
                  ? 'bg-[var(--accent)] w-4'
                  : 'bg-[var(--accent)]/30 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlideshow;
