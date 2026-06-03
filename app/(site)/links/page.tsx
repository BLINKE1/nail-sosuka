'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle, CalendarCheck } from 'lucide-react';
import { getActiveExternalLinks } from '@/lib/store';
import { ExternalLink } from '@/lib/types';

export default function LinksPage() {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLinks(getActiveExternalLinks());
    setMounted(true);
    const onSync = () => setLinks(getActiveExternalLinks());
    window.addEventListener('store-synced', onSync);
    return () => window.removeEventListener('store-synced', onSync);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12 gap-8"
      style={{
        background: `
          radial-gradient(ellipse 100% 50% at 50% 0%, rgba(212,120,156,0.13) 0%, transparent 55%),
          #0A0A0A
        `,
      }}
    >
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'rgba(212,120,156,0.3)', transform: 'scale(1.4)' }}
          />
          <Image
            src="/logo.png"
            alt="Nail Sosuka"
            width={200}
            height={70}
            className="relative w-44 h-auto object-contain"
            priority
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm" style={{ color: '#9A8A96' }}>
            Manicure profissional • Atendimento a domicílio
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.25)' }}
          >
            📍 Itapetininga/SP
          </div>
        </div>
      </div>

      {/* Links list */}
      <div className="w-full space-y-3" style={{ maxWidth: 460 }}>
        {/* Fixed CTAs always visible */}
        <Link
          href="/agendar"
          className="group flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #D4789C, #A0587C)',
            color: '#F0ECF0',
            boxShadow: '0 0 24px rgba(212,120,156,0.3)',
          }}
        >
          <span className="text-2xl">📅</span>
          <span className="flex-1">Agendar Horário</span>
          <CalendarCheck size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </Link>

        <a
          href="https://wa.me/5515997789464"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 w-full px-5 py-4 rounded-2xl font-semibold text-base transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'rgba(37,211,102,0.08)',
            color: '#25D366',
            border: '1px solid rgba(37,211,102,0.3)',
          }}
        >
          <span className="text-2xl">💬</span>
          <span className="flex-1">WhatsApp</span>
          <MessageCircle size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Divider when there are custom links */}
        {mounted && links.length > 0 && (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'rgba(212,120,156,0.15)' }} />
            <span className="text-xs" style={{ color: '#9A8A96' }}>Mais links</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(212,120,156,0.15)' }} />
          </div>
        )}

        {/* Dynamic links */}
        {mounted && links.map((link, i) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: '#12101C',
              border: '1px solid rgba(212,120,156,0.18)',
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="text-2xl shrink-0">{link.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{link.title}</p>
              {link.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9A8A96' }}>{link.description}</p>
              )}
            </div>
            <ArrowUpRight
              size={16}
              className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0"
              style={{ color: '#D4789C' }}
            />
          </a>
        ))}

        {/* Placeholder when no dynamic links yet */}
        {mounted && links.length === 0 && (
          <div className="rounded-2xl px-5 py-6 text-center" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
            <p className="text-sm" style={{ color: '#9A8A96' }}>✨ Mais links em breve!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <Link
          href="/"
          className="text-xs transition-opacity hover:opacity-80"
          style={{ color: '#9A8A96' }}
        >
          ← Ver site completo
        </Link>
        <p className="text-xs" style={{ color: 'rgba(154,138,150,0.4)' }}>Nail Sosuka © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
