'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import { getActiveServices } from '@/lib/store';
import { Service } from '@/lib/types';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'manicure', label: 'Manicure' },
  { id: 'alongamento', label: 'Alongamento' },
  { id: 'outros', label: 'Outros' },
] as const;

type CategoryFilter = 'all' | 'manicure' | 'alongamento' | 'outros';

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    setServices(getActiveServices());
  }, []);

  const filtered = filter === 'all' ? services : services.filter((s) => s.category === filter);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>
            Catálogo Completo
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#F0ECF0' }}>
            Nossos Serviços
          </h1>
          <p className="max-w-md mx-auto text-sm" style={{ color: '#9A8A96' }}>
            Escolha o serviço ideal e agende diretamente online. Qualidade e capricho em cada detalhe.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                filter === cat.id
                  ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }
                  : { background: 'rgba(212,120,156,0.08)', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16" style={{ color: '#9A8A96' }}>
            <p className="text-4xl mb-3">🔍</p>
            <p>Nenhum serviço encontrado nesta categoria.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', boxShadow: '0 0 28px rgba(212,120,156,0.35)' }}
          >
            Agendar Agora <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
