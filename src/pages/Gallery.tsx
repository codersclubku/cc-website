import React, { useState, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HairlineGrid } from '../components/HairlineGrid';
import { EmptyState } from '../components/EmptyState';
import { TiltCard } from '../components/TiltCard';
import { StaggerGrid, StaggerItem } from '../components/ScrollReveal';
import { GalleryCardSkeleton, Skeleton } from '../components/Skeleton';
import { InstagramIcon } from '../components/SocialIcons';
import { SITE_CONSTANTS } from '../content/site';
import { fetchGalleryItems } from '../lib/api';
import type { DbGalleryItem } from '../lib/api';
import { COPY } from '../content/copy';
import { useReducedMotion } from '../hooks/useReducedMotion';

const getFullResSrc = (item: DbGalleryItem): string => {
  if (item.full_image_path) return item.full_image_path;
  if (/campus-0[1-6]\.webp$/.test(item.image_path)) {
    return item.image_path.replace('.webp', '-1600w.webp');
  }
  return item.image_path;
};

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<DbGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedFullSrc, setLoadedFullSrc] = useState<string | null>(null);
  const [currentLoadedId, setCurrentLoadedId] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const titleId = useId();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const list = await fetchGalleryItems();
        if (active) {
          setItems(list);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const activeItem = selectedIndex !== null ? items[selectedIndex] : null;
  const baseSrc = activeItem ? activeItem.image_path : '';
  const fullSrc = activeItem ? getFullResSrc(activeItem) : '';
  const displaySrc = activeItem && loadedFullSrc === fullSrc ? fullSrc : baseSrc;
  const isImageReady = Boolean(activeItem && currentLoadedId === activeItem.id);

  useEffect(() => {
    if (!activeItem) return;
    const full = getFullResSrc(activeItem);
    let active = true;

    if (full && full !== activeItem.image_path) {
      const fullImg = new Image();
      fullImg.src = full;
      fullImg.onload = () => {
        if (active) {
          setLoadedFullSrc(full);
        }
      };
    }

    if (items.length > 0 && selectedIndex !== null) {
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      [items[prevIndex], items[nextIndex]].forEach((it) => {
        if (it) {
          const img1 = new Image();
          img1.src = it.image_path;
          const f1 = getFullResSrc(it);
          if (f1 && f1 !== it.image_path) {
            const img2 = new Image();
            img2.src = f1;
          }
        }
      });
    }

    return () => {
      active = false;
    };
  }, [activeItem, selectedIndex, items]);

  const handleClose = () => {
    const lastIndex = selectedIndex;
    setSelectedIndex(null);
    if (lastIndex !== null && cardRefs.current[lastIndex]) {
      cardRefs.current[lastIndex]?.focus();
    }
  };

  const handlePrev = () => {
    if (items.length <= 1) return;
    setSelectedIndex((curr) => (curr !== null && curr > 0 ? curr - 1 : items.length - 1));
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    setSelectedIndex((curr) => (curr !== null && curr < items.length - 1 ? curr + 1 : 0));
  };

  const actionsRef = useRef({ handlePrev, handleNext, handleClose });
  useEffect(() => {
    actionsRef.current = { handlePrev, handleNext, handleClose };
  });

  useEffect(() => {
    if (selectedIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        actionsRef.current.handleClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        actionsRef.current.handlePrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        actionsRef.current.handleNext();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [selectedIndex]);

  return (
    <HairlineGrid>
      <section
        className="hairline-row w-full px-4 sm:px-8 lg:px-16 py-10 sm:py-14 bg-[var(--bg)] text-left"
        aria-labelledby="gallery-heading"
      >
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <span className="eyebrow-marker font-mono text-xs uppercase tracking-wider text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] font-semibold">
                Moments & Archive
              </span>
              <h1
                id="gallery-heading"
                className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text)] leading-tight m-0 mt-1"
              >
                Gallery
              </h1>
              <p className="text-base text-[var(--text-muted)] mt-2">
                Photo records from Coders Club weekly sessions, workshops, and hackathons.
              </p>
            </div>

            <a
              href={SITE_CONSTANTS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-4 shrink-0 font-semibold"
            >
              <InstagramIcon className="w-4 h-4" />
              <span>Instagram / {SITE_CONSTANTS.instagram}</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="pt-2">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                <GalleryCardSkeleton />
                <GalleryCardSkeleton />
                <GalleryCardSkeleton />
                <GalleryCardSkeleton />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title={COPY.empty.noGalleryPhotos.title}
                description={COPY.empty.noGalleryPhotos.description}
                actionText="See upcoming events"
                actionHref="/events"
                illustration="sieve"
              />
            ) : (
              <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                {items.map((item, index) => (
                  <StaggerItem key={item.id}>
                    <TiltCard maxTilt={5}>
                      <div
                        role="button"
                        tabIndex={0}
                        ref={(el) => {
                          cardRefs.current[index] = el;
                        }}
                        onClick={() => setSelectedIndex(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedIndex(index);
                          }
                        }}
                        aria-label={`View photo: ${item.caption || item.alt_text}`}
                        className="p-3 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col gap-3 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] cursor-pointer h-full text-left"
                      >
                        <div className="w-full aspect-[4/3] bg-[var(--surface-2)] border border-[var(--border)] rounded-sm overflow-hidden">
                          <picture className="w-full h-full block">
                            <source type="image/webp" srcSet={item.image_path.endsWith('.webp') ? item.image_path : item.image_path.replace(/\.[a-z]+$/i, '.webp')} />
                            <img
                              src={item.image_path.endsWith('.webp') ? item.image_path.replace(/\.webp$/i, '.jpg') : item.image_path}
                              alt={item.alt_text}
                              width="400"
                              height="300"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (target.src !== item.image_path) {
                                  target.src = item.image_path;
                                }
                              }}
                            />
                          </picture>
                        </div>
                        {item.caption && (
                          <p className="text-xs text-[var(--text)] font-sans leading-relaxed m-0 text-left">
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </TiltCard>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            )}
          </div>
        </div>
      </section>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedIndex !== null && activeItem && (
            <div
              data-cursor-native
              className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReduced ? 0 : 0.18 }}
                onClick={handleClose}
                className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm"
                aria-hidden="true"
              />

              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: prefersReduced ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
                className="relative w-full max-w-[960px] max-h-[92dvh] md:max-h-[85dvh] bg-[var(--surface-1)] border border-[var(--accent)] rounded-t-2xl sm:rounded-md shadow-5 flex flex-col overflow-hidden text-left z-10 pb-[env(safe-area-inset-bottom)] sm:pb-0"
              >
                <div className="relative w-full flex items-center justify-center bg-[var(--surface-2)] overflow-hidden shrink min-h-[200px] sm:min-h-[300px]">
                  {!isImageReady && (
                    <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                  )}

                  <img
                    key={activeItem.id}
                    ref={(node) => {
                      if (node && node.complete && node.naturalWidth > 0 && currentLoadedId !== activeItem.id) {
                        setCurrentLoadedId(activeItem.id);
                      }
                    }}
                    src={displaySrc}
                    alt={activeItem.alt_text}
                    onLoad={() => setCurrentLoadedId(activeItem.id)}
                    className={`max-h-[60vh] sm:max-h-[68vh] max-w-[90vw] md:max-w-full w-auto h-auto object-contain transition-opacity duration-150 select-none ${
                      isImageReady ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={handleClose}
                    aria-label="Close modal"
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-[var(--surface-1)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] transition-colors shadow-2"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous image"
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-[var(--surface-1)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next image"
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-[var(--surface-1)]/90 backdrop-blur-md border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-2"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[var(--surface-1)] border-t border-[var(--border)] flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <h2
                      id={titleId}
                      className="text-lg sm:text-xl font-bold font-sans tracking-tight text-[var(--text)] m-0 leading-snug"
                    >
                      {activeItem.caption || activeItem.alt_text}
                    </h2>
                    <span className="text-xs font-mono font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)] shrink-0">
                      {selectedIndex + 1} / {items.length}
                    </span>
                  </div>

                  {activeItem.description && (
                    <p className="text-xs sm:text-sm font-sans text-[var(--text-muted)] leading-relaxed m-0">
                      {activeItem.description}
                    </p>
                  )}

                  {(activeItem.category || activeItem.location || activeItem.date) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs font-mono text-[var(--text-subtle)]">
                      {(activeItem.category || activeItem.location) && (
                        <span className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xs uppercase tracking-wider text-xs font-semibold text-[var(--text-strong)] dark:text-[var(--accent-on-dark)]">
                          {activeItem.category || activeItem.location}
                        </span>
                      )}
                      {activeItem.date && (
                        <span>{activeItem.date}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </HairlineGrid>
  );
};

export default Gallery;
