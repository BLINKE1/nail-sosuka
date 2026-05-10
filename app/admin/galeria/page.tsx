'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Images, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import AdminLayout from '@/components/admin/AdminLayout';
import { getPromoImages, savePromoImages, generateId } from '@/lib/store';
import { PromoImage } from '@/lib/types';

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const MAX = 1200;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function cleanTitle(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function AdminGaleriaPage() {
  const [images, setImages] = useState<PromoImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(getPromoImages());
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    try {
      const newImgs: PromoImage[] = await Promise.all(
        files.map(async (f) => ({
          id: generateId(),
          src: await compressImage(f),
          title: cleanTitle(f.name),
          active: true,
        }))
      );
      const updated = [...images, ...newImgs];
      setImages(updated);
      savePromoImages(updated);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function deleteImage(id: string) {
    const updated = images.filter(img => img.id !== id);
    setImages(updated);
    savePromoImages(updated);
  }

  function toggleActive(id: string) {
    const updated = images.map(img => img.id === id ? { ...img, active: !img.active } : img);
    setImages(updated);
    savePromoImages(updated);
  }

  function startEdit(img: PromoImage) {
    setEditingId(img.id);
    setEditTitle(img.title ?? '');
  }

  function saveTitle(id: string) {
    const updated = images.map(img => img.id === id ? { ...img, title: editTitle.trim() || undefined } : img);
    setImages(updated);
    savePromoImages(updated);
    setEditingId(null);
  }

  const activeCount = images.filter(i => i.active).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#F0ECF0' }}>Galeria Promocional</h1>
            <p className="text-sm mt-0.5" style={{ color: '#9A8A96' }}>
              {images.length} {images.length === 1 ? 'foto' : 'fotos'} •{' '}
              {activeCount} visível{activeCount !== 1 ? 'is' : ''} no site
              {images.length > 1 ? ' • exibido como carrossel' : ''}
            </p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 shrink-0 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
          >
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Enviando…</>
              : <><Plus size={15} /> Adicionar Foto</>
            }
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Empty state */}
        {images.length === 0 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl p-14 flex flex-col items-center gap-3 transition-all hover:border-pink-400/40"
            style={{ border: '2px dashed rgba(212,120,156,0.25)', background: 'rgba(212,120,156,0.03)' }}
          >
            <Images size={44} style={{ color: '#D4789C', opacity: 0.45 }} />
            <p className="font-medium" style={{ color: '#9A8A96' }}>Nenhuma foto ainda</p>
            <p className="text-sm" style={{ color: '#9A8A96', opacity: 0.65 }}>
              Clique para adicionar fotos promocionais
            </p>
          </button>
        )}

        {/* Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  border: `1px solid ${img.active ? 'rgba(212,120,156,0.25)' : 'rgba(155,155,155,0.12)'}`,
                  background: '#1C1828',
                  opacity: img.active ? 1 : 0.55,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Image preview */}
                <div className="relative aspect-square group">
                  <Image
                    src={img.src}
                    alt={img.title ?? 'Foto promocional'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    unoptimized={img.src.startsWith('data:')}
                  />
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(10,8,20,0.72)' }}
                  >
                    <button
                      onClick={() => deleteImage(img.id)}
                      title="Remover foto"
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: 'rgba(239,68,68,0.18)',
                        border: '1px solid rgba(239,68,68,0.5)',
                        color: '#f87171',
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                  {editingId === img.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(img.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(img.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="text-xs w-full px-2 py-1 rounded-lg outline-none"
                      style={{
                        background: 'rgba(212,120,156,0.08)',
                        border: '1px solid rgba(212,120,156,0.4)',
                        color: '#F0ECF0',
                      }}
                      placeholder="Legenda da foto…"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(img)}
                      title="Editar legenda"
                      className="text-xs text-left truncate hover:opacity-80 transition-opacity"
                      style={{ color: '#9A8A96' }}
                    >
                      {img.title || <span style={{ opacity: 0.45 }}>Sem legenda — clique para editar</span>}
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(img.id)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg self-start font-medium transition-all hover:scale-105"
                    style={img.active
                      ? { background: 'rgba(212,120,156,0.12)', color: '#D4789C' }
                      : { background: 'rgba(155,155,155,0.08)', color: '#9A8A96' }
                    }
                  >
                    {img.active
                      ? <><Eye size={12} /> Visível</>
                      : <><EyeOff size={12} /> Oculta</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <p className="text-xs text-center pb-2" style={{ color: '#9A8A96', opacity: 0.55 }}>
            Clique na legenda para editar • Passe o mouse sobre a foto para remover
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
