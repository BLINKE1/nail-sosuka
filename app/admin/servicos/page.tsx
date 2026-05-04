'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getServices, saveServices, getCombos, saveCombos, generateId, formatCurrency } from '@/lib/store';
import { Service, Combo } from '@/lib/types';

// ── Services config ───────────────────────────────────────

const EMPTY_SERVICE: Omit<Service, 'id'> = {
  name: '', description: '', price: 0, duration: 60,
  category: 'manicure', active: true, emoji: '💅',
};

const CATEGORY_OPTIONS = [
  { value: 'manicure', label: 'Manicure' },
  { value: 'alongamento', label: 'Alongamento' },
  { value: 'outros', label: 'Outros' },
] as const;

const EMOJI_OPTIONS = ['💅', '🦶', '✨', '🤍', '🎨', '💎', '🔮', '🛠️', '🌟', '🌸', '👑', '🦋', '🌈', '🎀', '💍', '🌺', '⭐'];

type CategoryFilter = 'all' | Service['category'];
type Tab = 'servicos' | 'combos';

// ── Main page ─────────────────────────────────────────────

export default function AdminServicosPage() {
  const [tab, setTab] = useState<Tab>('servicos');

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-2">
          {([['servicos', 'Serviços'], ['combos', 'Combos']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }
                : { background: 'rgba(212,120,156,0.08)', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }
              }>
              {label}
            </button>
          ))}
        </div>

        {tab === 'servicos' ? <ServicosTab /> : <CombosTab />}
      </div>
    </AdminLayout>
  );
}

// ── Serviços Tab ──────────────────────────────────────────

function ServicosTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY_SERVICE);
  const [saved, setSaved] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => { setServices(getServices()); }, []);

  function startCreate() { setForm(EMPTY_SERVICE); setEditing(null); setCreating(true); }
  function startEdit(s: Service) {
    setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, category: s.category, active: s.active, emoji: s.emoji });
    setEditing(s); setCreating(false);
  }
  function cancel() { setEditing(null); setCreating(false); }

  function save() {
    let updated: Service[];
    if (creating) updated = [...services, { ...form, id: generateId() }];
    else if (editing) updated = services.map(s => s.id === editing.id ? { ...s, ...form } : s);
    else return;
    setServices(updated); saveServices(updated);
    setEditing(null); setCreating(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function toggleActive(id: string) {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setServices(updated); saveServices(updated);
  }

  function deleteService(id: string) {
    if (!confirm('Excluir este serviço?')) return;
    const updated = services.filter(s => s.id !== id);
    setServices(updated); saveServices(updated);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const from = services.findIndex(s => s.id === dragId);
    const to = services.findIndex(s => s.id === targetId);
    if (from < 0 || to < 0) { setDragId(null); setDragOverId(null); return; }
    const updated = [...services];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setServices(updated); saveServices(updated);
    setDragId(null); setDragOverId(null);
  }

  const filtered = filter === 'all' ? services : services.filter(s => s.category === filter);
  const categoryColor = (cat: Service['category']) => ({ manicure: '#D4789C', alongamento: '#C8883A', outros: '#7B8FD4' }[cat]);

  return (
    <>
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.3)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: '#F0ECF0' }}>{creating ? 'Novo Serviço' : 'Editar Serviço'}</h2>
              <button onClick={cancel} style={{ color: '#9A8A96' }}><X size={20} /></button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#9A8A96' }}>Ícone</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: form.emoji === e ? 'rgba(212,120,156,0.2)' : '#1C1828', border: form.emoji === e ? '2px solid #D4789C' : '1px solid rgba(212,120,156,0.15)' }}>
                    {e}
                  </button>
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
              <button onClick={cancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: 'rgba(212,120,156,0.25)', color: '#9A8A96' }}>Cancelar</button>
              <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {filter !== 'all' && (
        <p className="text-xs" style={{ color: '#9A8A96' }}>Reordenação disponível somente na visualização "Todos".</p>
      )}

      <div className="space-y-1">
        {filtered.map(s => (
          <div key={s.id}
            draggable={filter === 'all'}
            onDragStart={() => setDragId(s.id)}
            onDragOver={e => { e.preventDefault(); setDragOverId(s.id); }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(s.id)}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            className="flex items-center gap-3 rounded-2xl p-4 transition-all"
            style={{
              background: dragOverId === s.id ? 'rgba(212,120,156,0.12)' : '#12101C',
              border: dragOverId === s.id
                ? '2px dashed rgba(212,120,156,0.6)'
                : `1px solid ${s.active ? 'rgba(212,120,156,0.15)' : 'rgba(212,120,156,0.06)'}`,
              opacity: dragId === s.id ? 0.4 : s.active ? 1 : 0.6,
              cursor: filter === 'all' ? 'grab' : 'default',
            }}>
            {filter === 'all' && (
              <GripVertical size={16} className="shrink-0" style={{ color: '#9A8A96' }} />
            )}
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
    </>
  );
}

// ── Combos Tab ────────────────────────────────────────────

const EMPTY_COMBO: Omit<Combo, 'id'> = {
  name: '', description: '', price: 0, duration: 0,
  serviceIds: [], active: true,
};

function CombosTab() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Combo, 'id'>>(EMPTY_COMBO);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCombos(getCombos());
    setServices(getServices());
  }, []);

  function startCreate() { setForm(EMPTY_COMBO); setEditing(null); setCreating(true); }
  function startEdit(c: Combo) {
    setForm({ name: c.name, description: c.description, price: c.price, duration: c.duration, serviceIds: c.serviceIds, active: c.active });
    setEditing(c); setCreating(false);
  }
  function cancel() { setEditing(null); setCreating(false); }

  function save() {
    let updated: Combo[];
    if (creating) updated = [...combos, { ...form, id: generateId() }];
    else if (editing) updated = combos.map(c => c.id === editing.id ? { ...c, ...form } : c);
    else return;
    setCombos(updated); saveCombos(updated);
    setEditing(null); setCreating(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function toggleActive(id: string) {
    const updated = combos.map(c => c.id === id ? { ...c, active: !c.active } : c);
    setCombos(updated); saveCombos(updated);
  }

  function deleteCombo(id: string) {
    if (!confirm('Excluir este combo?')) return;
    const updated = combos.filter(c => c.id !== id);
    setCombos(updated); saveCombos(updated);
  }

  function toggleServiceInCombo(serviceId: string) {
    setForm(f => {
      const ids = f.serviceIds.includes(serviceId)
        ? f.serviceIds.filter(id => id !== serviceId)
        : [...f.serviceIds, serviceId];
      return { ...f, serviceIds: ids };
    });
  }

  function addExtraService(serviceId: string) {
    setForm(f => ({ ...f, serviceIds: [...f.serviceIds, serviceId] }));
  }

  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]));

  const servicesSumPrice = form.serviceIds.reduce((sum, id) => sum + (serviceMap[id]?.price ?? 0), 0);
  const servicesSumDuration = form.serviceIds.reduce((sum, id) => sum + (serviceMap[id]?.duration ?? 0), 0);

  const discount = servicesSumPrice > form.price && form.price > 0 ? servicesSumPrice - form.price : 0;

  return (
    <>
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 my-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.3)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: '#F0ECF0' }}>{creating ? 'Novo Combo' : 'Editar Combo'}</h2>
              <button onClick={cancel} style={{ color: '#9A8A96' }}><X size={20} /></button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Manicure + Nail Art"
                className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Descrição</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm border resize-none" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
            </div>

            {/* Service selection */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#9A8A96' }}>Serviços incluídos *</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {services.map(s => {
                  const count = form.serviceIds.filter(id => id === s.id).length;
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{ background: count > 0 ? 'rgba(212,120,156,0.1)' : '#1C1828', border: `1px solid ${count > 0 ? 'rgba(212,120,156,0.35)' : 'rgba(212,120,156,0.1)'}` }}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-base">{s.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: '#F0ECF0' }}>{s.name}</p>
                          <p className="text-xs" style={{ color: '#9A8A96' }}>{formatCurrency(s.price)} · {s.duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {count > 0 && (
                          <>
                            <button onClick={() => setForm(f => {
                              const idx = f.serviceIds.lastIndexOf(s.id);
                              const ids = [...f.serviceIds];
                              ids.splice(idx, 1);
                              return { ...f, serviceIds: ids };
                            })} className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center" style={{ background: 'rgba(212,120,156,0.2)', color: '#D4789C' }}>−</button>
                            <span className="w-5 text-center text-xs font-bold" style={{ color: '#D4789C' }}>{count}</span>
                          </>
                        )}
                        <button onClick={() => addExtraService(s.id)}
                          className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center"
                          style={{ background: count > 0 ? 'rgba(212,120,156,0.2)' : 'rgba(212,120,156,0.12)', color: '#D4789C' }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {form.serviceIds.length > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#9A8A96' }}>
                  Soma dos serviços: <strong style={{ color: '#F0ECF0' }}>{formatCurrency(servicesSumPrice)}</strong> · {servicesSumDuration} min
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Preço do Combo (R$) *</label>
                <input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
                {discount > 0 && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>Desconto: {formatCurrency(discount)}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#9A8A96' }}>Duração (min)</label>
                <input type="number" min={15} step={15} value={form.duration || servicesSumDuration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border" style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium" style={{ color: '#9A8A96' }}>Ativo</label>
              <button onClick={() => setForm(f => ({ ...f, active: !f.active }))} style={{ color: form.active ? '#D4789C' : '#9A8A96' }}>
                {form.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={cancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: 'rgba(212,120,156,0.25)', color: '#9A8A96' }}>Cancelar</button>
              <button onClick={save} disabled={!form.name.trim() || form.serviceIds.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Combos</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>{combos.length} combos cadastrados</p>
        </div>
        <button onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}>
          <Plus size={16} /> Novo Combo
        </button>
      </div>

      {saved && (
        <div className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
          ✓ Combo salvo com sucesso!
        </div>
      )}

      <div className="space-y-3">
        {combos.map(c => {
          const includedServices = c.serviceIds.map(id => serviceMap[id]).filter(Boolean);
          const sumPrice = c.serviceIds.reduce((sum, id) => sum + (serviceMap[id]?.price ?? 0), 0);
          const hasDiscount = sumPrice > c.price && c.price > 0;
          return (
            <div key={c.id} className="rounded-2xl p-4 transition-all"
              style={{ background: '#12101C', border: `1px solid ${c.active ? 'rgba(212,120,156,0.15)' : 'rgba(212,120,156,0.06)'}`, opacity: c.active ? 1 : 0.6 }}>
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0 mt-0.5">
                  {[...new Set(c.serviceIds)].map(id => serviceMap[id]?.emoji ?? '').join('')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>{c.name}</p>
                    {hasDiscount && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                        -{formatCurrency(sumPrice - c.price)} desconto
                      </span>
                    )}
                    {!c.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(154,138,150,0.15)', color: '#9A8A96' }}>Inativo</span>}
                  </div>
                  {c.description && <p className="text-xs mt-0.5" style={{ color: '#9A8A96' }}>{c.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.serviceIds.map((id, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,120,156,0.1)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.2)' }}>
                        {serviceMap[id]?.emoji} {serviceMap[id]?.name ?? id}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold" style={{ color: '#D4789C' }}>{formatCurrency(c.price)}</p>
                  {hasDiscount && <p className="text-xs line-through" style={{ color: '#9A8A96' }}>{formatCurrency(sumPrice)}</p>}
                  <p className="text-xs" style={{ color: '#9A8A96' }}>{c.duration} min</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(c.id)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: c.active ? '#D4789C' : '#9A8A96' }} title={c.active ? 'Desativar' : 'Ativar'}>
                    {c.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#9A8A96' }}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteCombo(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#9A8A96' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {combos.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.1)' }}>
          <p className="text-3xl mb-2">🎀</p>
          <p style={{ color: '#9A8A96' }}>Nenhum combo criado ainda.</p>
          <button onClick={startCreate} className="mt-4 px-6 py-2 rounded-full text-sm font-semibold" style={{ background: 'rgba(212,120,156,0.12)', color: '#D4789C', border: '1px solid rgba(212,120,156,0.3)' }}>
            Criar Combo
          </button>
        </div>
      )}
    </>
  );
}
