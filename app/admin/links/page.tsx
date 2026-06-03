'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink as ExternalLinkIcon, Eye, EyeOff, Save } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getExternalLinks, saveExternalLinks, generateId } from '@/lib/store';
import { ExternalLink } from '@/lib/types';

const EMPTY_FORM = { title: '', url: '', description: '', emoji: '🔗' };

export default function LinksPage() {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLinks(getExternalLinks().sort((a, b) => a.order - b.order));
  }, []);

  function persist(updated: ExternalLink[]) {
    setLinks(updated);
    saveExternalLinks(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleAdd() {
    if (!form.title.trim() || !form.url.trim()) return;
    const url = form.url.startsWith('http') ? form.url : `https://${form.url}`;
    if (editId) {
      persist(links.map(l => l.id === editId ? { ...l, ...form, url } : l));
      setEditId(null);
    } else {
      const next: ExternalLink = {
        id: generateId(),
        ...form,
        url,
        active: true,
        order: links.length,
      };
      persist([...links, next]);
    }
    setForm(EMPTY_FORM);
  }

  function handleEdit(link: ExternalLink) {
    setEditId(link.id);
    setForm({ title: link.title, url: link.url, description: link.description, emoji: link.emoji });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id: string) {
    persist(links.filter(l => l.id !== id).map((l, i) => ({ ...l, order: i })));
    if (editId === id) { setEditId(null); setForm(EMPTY_FORM); }
  }

  function handleToggle(id: string) {
    persist(links.map(l => l.id === id ? { ...l, active: !l.active } : l));
  }

  function handleMove(id: string, dir: -1 | 1) {
    const idx = links.findIndex(l => l.id === id);
    const target = idx + dir;
    if (target < 0 || target >= links.length) return;
    const updated = [...links];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    persist(updated.map((l, i) => ({ ...l, order: i })));
  }

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Links</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>
            Adicione links importantes para suas clientes — catálogos, redes sociais, promoções, etc.
          </p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#12101C', border: `1px solid rgba(212,120,156,${editId ? '0.5' : '0.25'})` }}
        >
          <h2 className="font-semibold text-sm" style={{ color: editId ? '#D4789C' : '#F0ECF0' }}>
            {editId ? '✏️ Editando link' : '+ Novo link'}
          </h2>

          <div className="flex gap-2">
            {/* Emoji picker */}
            <input
              type="text"
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              maxLength={4}
              placeholder="🔗"
              className="w-14 text-center px-2 py-3 rounded-xl text-xl border"
              style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
            />
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título (ex: Catálogo de Serviços)"
              className="flex-1 px-3 py-3 rounded-xl text-sm border"
              style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
            />
          </div>

          <input
            type="url"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="URL (ex: https://instagram.com/nailsosuka)"
            className="w-full px-3 py-3 rounded-xl text-sm border font-mono"
            style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
          />

          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição curta (opcional)"
            className="w-full px-3 py-3 rounded-xl text-sm border"
            style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.25)' }}
          />

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.title.trim() || !form.url.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
            >
              {editId ? <><Save size={15} /> Salvar alterações</> : <><Plus size={15} /> Adicionar link</>}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: '#1C1828', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }}
              >
                Cancelar
              </button>
            )}
          </div>

          {saved && (
            <p className="text-xs text-center" style={{ color: '#4ade80' }}>✓ Salvo!</p>
          )}
        </div>

        {/* Links list */}
        <div className="space-y-2">
          {links.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.12)' }}>
              <p className="text-4xl mb-2">🔗</p>
              <p className="text-sm" style={{ color: '#9A8A96' }}>Nenhum link adicionado ainda.</p>
            </div>
          )}
          {links.map((link, idx) => (
            <div
              key={link.id}
              className="rounded-2xl p-4 flex items-center gap-3 transition-all"
              style={{
                background: editId === link.id ? 'rgba(212,120,156,0.06)' : '#12101C',
                border: `1px solid rgba(212,120,156,${link.active ? '0.2' : '0.08'})`,
                opacity: link.active ? 1 : 0.55,
              }}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => handleMove(link.id, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded-lg disabled:opacity-20 hover:opacity-70 transition-opacity"
                  style={{ color: '#9A8A96' }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(link.id, 1)}
                  disabled={idx === links.length - 1}
                  className="p-1 rounded-lg disabled:opacity-20 hover:opacity-70 transition-opacity"
                  style={{ color: '#9A8A96' }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Emoji */}
              <span className="text-2xl shrink-0">{link.emoji}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#F0ECF0' }}>{link.title}</p>
                {link.description && (
                  <p className="text-xs truncate" style={{ color: '#9A8A96' }}>{link.description}</p>
                )}
                <p className="text-xs truncate font-mono" style={{ color: '#D4789C' }}>{link.url}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(link.id)}
                  title={link.active ? 'Ocultar' : 'Exibir'}
                  className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                  style={{ color: link.active ? '#4ade80' : '#9A8A96' }}
                >
                  {link.active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                  style={{ color: '#9A8A96' }}
                >
                  <ExternalLinkIcon size={15} />
                </a>
                <button
                  onClick={() => handleEdit(link)}
                  className="p-2 rounded-xl text-xs font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#D4789C' }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {links.length > 0 && (
          <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: 'rgba(212,120,156,0.06)', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.15)' }}>
            <ExternalLinkIcon size={14} style={{ color: '#D4789C', flexShrink: 0 }} />
            Os links ativos aparecem em{' '}
            <a href="/links" target="_blank" rel="noopener noreferrer" style={{ color: '#D4789C' }}>
              /links
            </a>
            {' '}para suas clientes.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
