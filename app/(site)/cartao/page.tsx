'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, ArrowRight, MapPin, Share2 } from 'lucide-react';

const SERVICES = ['Manicure', 'Pedicure', 'Alongamento em Gel', 'Nail Art', 'Banho de Gel'];

export default function CartaoPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Idle float animation
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const animate = (t: number) => {
      if (!active) {
        timeRef.current = t;
        const rx = Math.sin(t / 2000) * 4;
        const ry = Math.cos(t / 2500) * 6;
        const sx = 50 + Math.sin(t / 2000) * 15;
        const sy = 50 + Math.cos(t / 2500) * 15;
        setTilt({ rx, ry });
        setShine({ x: sx, y: sy });
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - y) * 22, ry: (x - 0.5) * 22 });
    setShine({ x: x * 100, y: y * 100 });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const card = cardRef.current;
    if (!card) return;
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;
    setTilt({ rx: (0.5 - y) * 16, ry: (x - 0.5) * 16 });
    setShine({ x: x * 100, y: y * 100 });
  }, []);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'Nail Sosuka — Cartão Virtual', text: 'Manicure profissional a domicílio 💅', url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const glowOpacity = 0.25 + (Math.abs(tilt.ry) + Math.abs(tilt.rx)) * 0.005;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8"
      style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% 0%, rgba(212,120,156,0.15) 0%, transparent 55%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(160,88,124,0.08) 0%, transparent 50%),
          #0A0A0A
        `,
      }}
    >
      {/* 3D Card */}
      <div style={{ perspective: '900px' }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          onTouchMove={handleTouchMove}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          className="relative cursor-pointer select-none"
          style={{
            width: 'min(420px, 90vw)',
            aspectRatio: '1.586',
            borderRadius: '20px',
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: active ? 'transform 0.05s linear' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
            transformStyle: 'preserve-3d',
            boxShadow: `
              0 0 0 1px rgba(212,120,156,0.35),
              0 8px 32px rgba(0,0,0,0.5),
              0 0 80px rgba(212,120,156,${glowOpacity}),
              0 0 160px rgba(212,120,156,${glowOpacity * 0.4})
            `,
            overflow: 'hidden',
          }}
        >
          {/* Base gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 60% at ${shine.x}% ${shine.y}%, rgba(212,120,156,0.22) 0%, transparent 65%),
                linear-gradient(135deg, #1E1530 0%, #12101C 45%, #1A1025 100%)
              `,
            }}
          />

          {/* Holographic foil overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `conic-gradient(
                from ${shine.x * 3.6 + shine.y * 1.8}deg at ${shine.x}% ${shine.y}%,
                rgba(255,100,160,0.14),
                rgba(180,100,255,0.14),
                rgba(80,200,255,0.10),
                rgba(100,255,160,0.08),
                rgba(255,220,80,0.12),
                rgba(255,100,160,0.14)
              )`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Specular sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 30% 25% at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.06) 0%, transparent 80%)`,
            }}
          />

          {/* Card content */}
          <div className="relative z-10 h-full flex flex-col p-[6%] gap-[4%]">
            {/* Header row */}
            <div className="flex items-start justify-between">
              <Image
                src="/logo.png"
                alt="Nail Sosuka"
                width={160}
                height={54}
                className="object-contain"
                style={{ width: 'min(160px, 38%)', height: 'auto' }}
                priority
              />
              <div
                className="flex items-center gap-1 rounded-full font-medium"
                style={{
                  background: 'rgba(212,120,156,0.15)',
                  color: '#D4789C',
                  border: '1px solid rgba(212,120,156,0.3)',
                  fontSize: 'clamp(8px, 1.6vw, 11px)',
                  padding: '3px 8px',
                }}
              >
                <MapPin size={10} />
                A domicílio
              </div>
            </div>

            {/* Tagline */}
            <p
              style={{
                color: '#9A8A96',
                fontSize: 'clamp(8px, 1.8vw, 12px)',
                lineHeight: 1.4,
              }}
            >
              Arte nas unhas, elegância em cada detalhe.
            </p>

            {/* Services tags */}
            <div className="flex flex-wrap gap-1 mt-auto">
              {SERVICES.map((s) => (
                <span
                  key={s}
                  style={{
                    background: 'rgba(212,120,156,0.1)',
                    color: '#D4789C',
                    border: '1px solid rgba(212,120,156,0.22)',
                    borderRadius: '99px',
                    fontSize: 'clamp(7px, 1.5vw, 10px)',
                    padding: '2px 7px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Footer row */}
            <div className="flex items-end justify-between">
              <div>
                <p style={{ color: '#9A8A96', fontSize: 'clamp(7px, 1.4vw, 10px)' }}>WhatsApp</p>
                <p style={{ color: '#F0ECF0', fontWeight: 600, fontSize: 'clamp(9px, 2vw, 13px)' }}>
                  (15) 9 9778-9464
                </p>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #D4789C, #A0587C)',
                  color: '#F0ECF0',
                  fontWeight: 600,
                  borderRadius: '99px',
                  fontSize: 'clamp(7px, 1.5vw, 10px)',
                  padding: '4px 10px',
                }}
              >
                @nailsosuka
              </div>
            </div>
          </div>

          {/* Metallic border highlight */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[20px]"
            style={{
              background: `linear-gradient(
                ${135 + tilt.ry * 2}deg,
                rgba(255,255,255,0.08) 0%,
                transparent 40%,
                transparent 60%,
                rgba(212,120,156,0.06) 100%
              )`,
            }}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-center" style={{ color: '#9A8A96' }}>
        ✦ Passe o mouse ou toque no cartão para ver o efeito 3D ✦
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: 'min(420px, 90vw)' }}>
        <Link
          href="/agendar"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #D4789C, #A0587C)',
            color: '#F0ECF0',
            boxShadow: '0 0 28px rgba(212,120,156,0.4)',
          }}
        >
          Agendar Agora <ArrowRight size={20} />
        </Link>

        <a
          href="https://wa.me/5515997789464"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105"
          style={{
            borderColor: 'rgba(37,211,102,0.4)',
            color: '#25D366',
            background: 'rgba(37,211,102,0.07)',
            border: '1px solid rgba(37,211,102,0.3)',
          }}
        >
          <MessageCircle size={20} />
          Chamar no WhatsApp
        </a>

        <div className="flex gap-3 w-full">
          <a
            href="https://instagram.com/nailsosuka"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all hover:opacity-80"
            style={{
              background: 'rgba(212,120,156,0.08)',
              border: '1px solid rgba(212,120,156,0.2)',
              color: '#D4789C',
            }}
          >
            📸 Instagram
          </a>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-medium text-sm transition-all hover:opacity-80"
            style={{
              background: 'rgba(212,120,156,0.08)',
              border: '1px solid rgba(212,120,156,0.2)',
              color: copied ? '#4ade80' : '#D4789C',
            }}
          >
            <Share2 size={16} />
            {copied ? 'Link copiado!' : 'Compartilhar'}
          </button>
        </div>
      </div>

      {/* Back to site */}
      <Link
        href="/"
        className="text-xs transition-opacity hover:opacity-80"
        style={{ color: '#9A8A96' }}
      >
        ← Voltar ao site
      </Link>
    </div>
  );
}
