import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import { Service } from '@/lib/types';
import { formatCurrency } from '@/lib/store';

interface Props {
  service: Service;
  showBook?: boolean;
}

export default function ServiceCard({ service, showBook = true }: Props) {
  const categoryLabel = {
    manicure: 'Manicure',
    alongamento: 'Alongamento',
    outros: 'Outros',
  }[service.category];

  const categoryColor = {
    manicure: '#D4789C',
    alongamento: '#C8883A',
    outros: '#7B8FD4',
  }[service.category];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: '#1C1828',
        border: '1px solid rgba(212,120,156,0.15)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{service.emoji}</span>
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                background: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              {categoryLabel}
            </span>
            <h3 className="font-semibold mt-1" style={{ color: '#F0ECF0' }}>
              {service.name}
            </h3>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-lg" style={{ color: '#D4789C' }}>
            {formatCurrency(service.price)}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: '#9A8A96' }}>
        {service.description}
      </p>

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5" style={{ color: '#9A8A96' }}>
          <Clock size={13} />
          <span className="text-xs">{service.duration} min</span>
        </div>

        {showBook && (
          <Link
            href={`/agendar?servico=${service.id}`}
            className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2"
            style={{ color: '#D4789C' }}
          >
            Agendar <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
