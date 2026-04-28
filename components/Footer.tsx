import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ borderColor: 'rgba(212,120,156,0.15)', background: '#0A0A0A' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image
              src="/logo.jpeg"
              alt="Nail Sosuka"
              width={100}
              height={36}
              className="h-9 w-auto object-contain"
            />
            <p className="text-sm text-center md:text-left" style={{ color: '#9A8A96' }}>
              Arte nas unhas, elegância em cada detalhe.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#D4789C' }}>
              Navegação
            </p>
            {[
              { href: '/', label: 'Início' },
              { href: '/servicos', label: 'Serviços' },
              { href: '/agenda', label: 'Agenda' },
              { href: '/agendar', label: 'Agendar' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm transition-colors hover:text-[#D4789C]"
                style={{ color: '#9A8A96' }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#D4789C' }}>
              Redes Sociais
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#D4789C]"
              style={{ color: '#9A8A96' }}
            >
              📸
              @nailsosuka
            </a>
            <a
              href="https://wa.me/5515997789464"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#25D366]"
              style={{ color: '#9A8A96' }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t text-xs"
          style={{ borderColor: 'rgba(212,120,156,0.1)', color: '#9A8A96' }}
        >
          <p>© {new Date().getFullYear()} Nail Sosuka. Todos os direitos reservados.</p>
          <Link
            href="/admin"
            className="opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: '#9A8A96' }}
          >
            Área Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
