'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getWorkingDays, getAvailableSlots } from '@/lib/store';
import { WorkingDay } from '@/lib/types';
import Link from 'next/link';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AgendaPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);

  useEffect(() => {
    setWorkingDays(getWorkingDays());
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setSlots(getAvailableSlots(selectedDate));
  }, [selectedDate]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function isDayOpen(day: number) {
    const dow = new Date(year, month, day).getDay();
    return workingDays.find(w => w.dayOfWeek === dow)?.open ?? false;
  }

  function isPast(day: number) {
    const d = new Date(year, month, day);
    const t = new Date();
    t.setHours(0,0,0,0);
    return d < t;
  }

  function handleSelectDay(day: number) {
    if (!isDayOpen(day) || isPast(day)) return;
    setSelectedDate(isoDate(year, month, day));
  }

  function getDayStyle(day: number) {
    const iso = isoDate(year, month, day);
    const past = isPast(day);
    const open = isDayOpen(day);
    const selected = selectedDate === iso;
    const isToday = iso === isoDate(today.getFullYear(), today.getMonth(), today.getDate());

    if (selected) return { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0', cursor: 'pointer' };
    if (past || !open) return { background: 'transparent', color: 'rgba(240,236,240,0.2)', cursor: 'default' };
    if (isToday) return { background: 'rgba(212,120,156,0.2)', color: '#D4789C', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.5)' };
    return { background: 'rgba(28,24,40,0.8)', color: '#F0ECF0', cursor: 'pointer', border: '1px solid rgba(212,120,156,0.15)' };
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#D4789C' }}>Disponibilidade</p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#F0ECF0' }}>Agenda</h1>
          <p className="mt-2 text-sm" style={{ color: '#9A8A96' }}>Veja os horários disponíveis e escolha o melhor para você.</p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(212,120,156,0.15)' }}>
            <button onClick={prevMonth} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#D4789C' }}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-lg" style={{ color: '#F0ECF0' }}>
              {MONTH_LABELS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#D4789C' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold px-4 pt-4 pb-2" style={{ color: '#9A8A96' }}>
            {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 px-4 pb-6">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => handleSelectDay(day)}
                className="aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all hover:scale-105"
                style={getDayStyle(day)}
                disabled={!isDayOpen(day) || isPast(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 pb-4 text-xs flex-wrap" style={{ color: '#9A8A96' }}>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)' }} /> Selecionado</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(212,120,156,0.2)', border: '1px solid rgba(212,120,156,0.5)' }} /> Hoje</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: '#1C1828', border: '1px solid rgba(212,120,156,0.15)' }} /> Disponível</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: 'rgba(240,236,240,0.05)' }} /> Indisponível</div>
          </div>
        </div>

        {/* Available slots */}
        {selectedDate && (
          <div className="mt-6 rounded-2xl p-6" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} style={{ color: '#D4789C' }} />
              <h3 className="font-semibold" style={{ color: '#F0ECF0' }}>
                Horários disponíveis
              </h3>
            </div>

            {slots.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
                  {slots.map(slot => (
                    <Link
                      key={slot}
                      href={`/agendar?data=${selectedDate}&horario=${slot}`}
                      className="py-2 px-3 rounded-xl text-sm font-medium text-center transition-all hover:scale-105"
                      style={{ background: '#1C1828', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}
                    >
                      {slot}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/agendar?data=${selectedDate}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
                >
                  Agendar nesta data
                </Link>
              </>
            ) : (
              <p style={{ color: '#9A8A96' }}>Todos os horários estão ocupados neste dia. Escolha outra data.</p>
            )}
          </div>
        )}

        {/* Working hours info */}
        <div className="mt-6 rounded-2xl p-6" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.15)' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#F0ECF0' }}>Horários de Funcionamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {workingDays.map(wd => (
              <div key={wd.dayOfWeek} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: '#1C1828' }}>
                <span className="text-sm font-medium" style={{ color: wd.open ? '#F0ECF0' : '#9A8A96' }}>{wd.label}</span>
                <span className="text-sm" style={{ color: wd.open ? '#D4789C' : '#9A8A96' }}>
                  {wd.open ? `${wd.startTime} – ${wd.endTime}` : 'Fechado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
