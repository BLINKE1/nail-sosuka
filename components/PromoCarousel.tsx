'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PromoImage } from '@/lib/types';
import { getActivePromoImages, getWhatsapp } from '@/lib/store';

export default function PromoCarousel() {
  const [images, setImages] = useState<PromoImage[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => {
      const imgs = getActivePromoImages();
      setImages(imgs);
      setCurrent(0);
      setWhatsapp(getWhatsapp());
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

  function waLink(img: PromoImage) {
    const msg = img.title
      ? `Olá! Vi a foto *${img.title}* no site e quero agendar/adquirir! 💅`
      : 'Olá! Vi uma foto no site e quero agendar/adquirir! 💅';
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  }

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

                {/* Bottom gradient + caption + CTA */}
                <div
                  className="absolute bottom-0 left-0 right-0 pt-16 pb-5 px-5"
                  style={{ background: 'linear-gradient(to top, rgba(10,8,20,0.94) 0%, transparent 100%)' }}
                >
                  {img.title && (
                    <p className="font-semibold text-base tracking-wide text-center mb-3" style={{ color: '#F0ECF0' }}>
                      {img.title}
                    </p>
                  )}
                  <a
                    href={waLink(img)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.03] active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #25D366, #1aab52)',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(37,211,102,0.35)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Quero assim! Falar no WhatsApp
                  </a>
                </div>
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
