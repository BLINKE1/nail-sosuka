'use client';

import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getAppointments, getActiveServices, formatCurrency, formatDate } from '@/lib/store';
import { Appointment } from '@/lib/types';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceCount, setServiceCount] = useState(0);

  useEffect(() => {
    setAppointments(getAppointments());
    setServiceCount(getActiveServices().length);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today && a.status !== 'cancelled');
  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + a.servicePrice, 0);

  const recent = [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: '#C8883A',
    confirmed: '#D4789C',
    cancelled: '#9A8A96',
    completed: '#4ade80',
  };

  const STATS = [
    { icon: <Calendar size={20} />, label: 'Hoje', value: todayAppts.length, color: '#D4789C' },
    { icon: <Clock size={20} />, label: 'Pendentes', value: pending.length, color: '#C8883A' },
    { icon: <CheckCircle size={20} />, label: 'Confirmados', value: confirmed.length, color: '#4ade80' },
    { icon: <TrendingUp size={20} />, label: 'Receita Total', value: formatCurrency(totalRevenue), color: '#D4789C' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>Visão geral dos agendamentos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20`, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9A8A96' }}>{s.label}</p>
                <p className="text-xl font-bold mt-0.5" style={{ color: '#F0ECF0' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Today's appointments */}
        <div>
          <h2 className="font-semibold mb-4" style={{ color: '#F0ECF0' }}>Agendamentos de Hoje</h2>
          {todayAppts.length > 0 ? (
            <div className="space-y-3">
              {todayAppts
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.15)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C' }}>
                        {a.time}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#F0ECF0' }}>{a.clientName}</p>
                        <p className="text-xs" style={{ color: '#9A8A96' }}>{a.serviceName}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${STATUS_COLORS[a.status]}20`, color: STATUS_COLORS[a.status] }}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-2xl" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
              <p className="text-3xl mb-2">📅</p>
              <p style={{ color: '#9A8A96' }}>Nenhum agendamento para hoje</p>
            </div>
          )}
        </div>

        {/* Recent */}
        <div>
          <h2 className="font-semibold mb-4" style={{ color: '#F0ECF0' }}>Agendamentos Recentes</h2>
          {recent.length > 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.15)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(212,120,156,0.1)' }}>
                      {['Cliente', 'Serviço', 'Data', 'Hora', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#9A8A96' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: i < recent.length - 1 ? '1px solid rgba(212,120,156,0.07)' : 'none' }}>
                        <td className="px-4 py-3 font-medium" style={{ color: '#F0ECF0' }}>{a.clientName}</td>
                        <td className="px-4 py-3" style={{ color: '#9A8A96' }}>{a.serviceName}</td>
                        <td className="px-4 py-3" style={{ color: '#9A8A96' }}>{formatDate(a.date).split(',')[0]}</td>
                        <td className="px-4 py-3" style={{ color: '#9A8A96' }}>{a.time}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${STATUS_COLORS[a.status]}20`, color: STATUS_COLORS[a.status] }}>
                            {STATUS_LABELS[a.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 rounded-2xl" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
              <p className="text-3xl mb-2">📋</p>
              <p style={{ color: '#9A8A96' }}>Nenhum agendamento ainda</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
