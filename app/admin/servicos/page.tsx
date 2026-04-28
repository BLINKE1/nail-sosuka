'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getServices, saveServices, generateId, formatCurrency } from '@/lib/store';
import { Service } from '@/lib/types';

const EMPTY_SERVICE: Omit<Service, 'id'> = {
  name: '',
  description: '',
  price: 0,
  duration: 60,
  category: 'manicure',
  active: true,
  emoji: '💅',
};

const CATEGORY_OPTIONS = [
  { value: 'manicure', label: 'Manicure' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'outros', label: 'Outros' },
] as const;

const EMOJI_OPTIONS = ['💅', '✨', '🤍', '🎨', '💎', '🔮', '🛠️', '🌟', '🌸', '👑', '🦋', '🌈'];

type CategoryFilter = 'all' | Service['category'];

export default function AdminServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY_SERVICE);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setServices(getServices()); }, []);

  function startCreate() {
    setForm(EMPTY_SERVICE);
    setEditing(null);
    setCreating(true);
  }

  function startEdit(s: Service) {
    setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, category: s.category, active: s.active, emoji: s.emoji });
    setEditing(s);
    setCreating(false);
  }

  function cancel() { setEditing(null); setCreating(false); }

  function save() {
    let updated: Service[];
    if (creating) {
      updated = [...services, { ...form, id: generateId() }];
    } else if (editing) {
      updated = services.map(s => s.id === editing.id ? { ...s, ...form } : s);
    } else return;
    setServices(updated);
    saveServices(updated);
    setEditing(null);
    setCreating(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleActive(id: string) {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setServices(updated);
    saveServices(updated);
  }

  function deleteService(id: string) {
    if (!confirm('Excluir este serviço?')) return;
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    saveServices(updated);
  }

  const filtered = filter === 'all' ? services : services.filter(s => s.category === filter);

  const categoryColor = (cat: Service['category']) =>
    ({ manicure: '#D4789C', alongamento: '#C8883A', outros: '#7B8FD4' }[cat]);

  const FormPanel = () => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.3)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: '#F0ECF0' }}>
            {creating ? 'Novo Serviço' : 'Editar Serviço'}
          </h2>
          <button onClick={cancel} style={{ color: '#9A8A96' }}><X size={20} /></button>
        </div>

        {/* Emoji picker */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: '#9A8A96' }}>Ícone</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: form.emoji === e ? 'rgba(212,120,156,0.2)' : '#1C1828', border: form.emoji === e ? '2px solid #D4789C' : '1px solid rgba(212,120,156,0.15)' }}
              >{e}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Nome *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Descrição</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border resize-none" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Preço (R$) *</label>
            <input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Duração (min)</label>
            <input type="number" min={15} step={15} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Service['category'] }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <label className="text-xs font-medium" style={{ color: '#9A8A96' }}>Ativo</label>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ color: form.active ? '#D4789C' : '#9A8A96' }}>
              {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={cancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: 'rgba(212,120,156,0.25)', color: '#9A8A96' }}>
            Cancelar
          </button>
          <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {(creating || editing) && <FormPanel />}

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Serviços</h1>
            <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>{services.length} serviços cadastrados</p>
          </div>
          <button onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
            <Plus size={16} /> Novo
          </button>
        </div>

        {saved && (
          <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
            ✓ Serviços salvos com sucesso!
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {([{ value: 'all', label: 'Todos' }, ...CATEGORY_OPTIONS] as { value: string; label: string }[]).map(cat => (
            <button key={cat.value} onClick={() => setFilter(cat.value as CategoryFilter)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filter === cat.value
                ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }
                : { background: 'rgba(212,120,156,0.08)', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }
              }>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services list */}
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="flex items-center gap-4 rounded-2xl p-4 transition-all" style={{ background: '#12101C', border: `1px solid ${s.active ? 'rgba(212,120,156,0.15)' : 'rgba(212,120,156,0.06)'}`, opacity: s.active ? 1 : 0.6 }}>
              <span className="text-2xl shrink-0">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{s.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${categoryColor(s.category)}20`, color: categoryColor(s.category) }}>
                    {{ manicure: 'Manicure', alongamento: 'Alongamento', outros: 'Outros' }[s.category]}
                  </span>
                  {!s.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(154,138,150,0.15)', color: '#9A8A96' }}>Inativo</span>}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#9A8A96' }}>{s.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(s.price)}</p>
                <p className="text-xs" style={{ color: '#9A8A96' }}>{s.duration} min</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(s.id)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: s.active ? '#D4789C' : '#9A8A96' }} title={s.active ? 'Desativar' : 'Ativar'}>
                  {s.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#9A8A96' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteService(s.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#9A8A96' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
            <p className="text-3xl mb-2">✂️</p>
            <p style={{ color: '#9A8A96' }}>Nenhum serviço nesta categoria.</p>
            <button onClick={startCreate} className="mt-4 px-6 py-2 rounded-full text-sm font-semibold" style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}>
              Criar Serviço
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
