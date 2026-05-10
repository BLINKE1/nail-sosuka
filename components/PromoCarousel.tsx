'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PromoImage } from '@/lib/types';
import { getActivePromoImages } from '@/lib/store';

export default function PromoCarousel() {
  const [images, setImages] = useState<PromoImage[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => {
      const imgs = getActivePromoImages();
      setImages(imgs);
      setCurrent(0);
    };
    load();
    window.addEventListener('store-synced', load);
    return () => window.removeEventListener('store-synced', load);
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 4800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [images.length, paused, next]);

  if (images.length === 0) return null;

  const isMultiple = images.length > 1;

  return (
    <section className="px-4 py-16" style={{ background: 'linear-gradient(180deg, #12101C 0%, #0E0C18 100%)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Nossa galeria</p>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#F0ECF0' }}>
            Inspirações & Promoções
          </h2>
        </div>

        {/* Carousel container */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            border: '1px solid rgba(212,120,156,0.3)',
            boxShadow: '0 0 50px rgba(212,120,156,0.12), 0 0 100px rgba(212,120,156,0.06)',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const diff = touchStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 48) diff > 0 ? next() : prev();
            setTouchStart(null);
          }}
        >
          {/* Slides strip */}
          <div
            className="flex"
            style={{
              transform: `translateX(-${current * 100}%)`,
              transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="relative flex-shrink-0 w-full"
                style={{ height: 'clamp(320px, 55vw, 560px)', background: '#0A0A14' }}
              >
                <Image
                  src={img.src}
                  alt={img.title ?? 'Foto promocional Nail Sosuka'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized={img.src.startsWith('data:')}
                  priority={img.id === images[0]?.id}
                />

                {/* Bottom gradient + caption */}
                {img.title && (
                  <div
                    className="absolute bottom-0 left-0 right-0 pt-16 pb-5 px-6 text-center"
                    style={{ background: 'linear-gradient(to top, rgba(10,8,20,0.92) 0%, transparent 100%)' }}
                  >
                    <p className="font-semibold text-base tracking-wide" style={{ color: '#F0ECF0' }}>
                      {img.title}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Arrows */}
          {isMultiple && (
            <>
              <button
                onClick={prev}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(10,8,20,0.65)',
                  border: '1px solid rgba(212,120,156,0.35)',
                  color: '#D4789C',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(10,8,20,0.65)',
                  border: '1px solid rgba(212,120,156,0.35)',
                  color: '#D4789C',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Progress bar */}
          {isMultiple && !paused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'rgba(212,120,156,0.15)' }}>
              <div
                key={current}
                className="h-full"
                style={{
                  background: 'linear-gradient(90deg, #D4789C, #A0587C)',
                  animation: 'growBar 4.8s linear forwards',
                }}
              />
            </div>
          )}
        </div>

        {/* Dots */}
        {isMultiple && (
          <div className="flex justify-center gap-2 mt-5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Foto ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '28px' : '8px',
                  height: '8px',
                  background: i === current
                    ? 'linear-gradient(90deg, #D4789C, #A0587C)'
                    : 'rgba(212,120,156,0.25)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes growBar {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
