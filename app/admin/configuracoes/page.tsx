'use client';

import { useEffect, useState } from 'react';
import { MapPin, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getOrigin, saveOrigin, OriginData } from '@/lib/store';
import { lookupCep } from '@/lib/transport';

function maskCep(v: string) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export default function ConfiguracoesPage() {
  const [origin, setOrigin] = useState<OriginData | null>(null);
  const [cep, setCep] = useState('');
  const [preview, setPreview] = useState<{ address: string; city: string; lat: number; lon: number } | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const o = getOrigin();
    setOrigin(o);
    setCep(o.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'));
  }, []);

  async function handleCepChange(value: string) {
    const masked = maskCep(value);
    setCep(masked);
    setCepError('');
    setPreview(null);
    setSaved(false);
    const clean = masked.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const result = await lookupCep(clean);
        if (result) {
          setPreview({ address: result.address, city: result.city, lat: result.lat, lon: result.lon });
        } else {
          setCepError('CEP não encontrado. Verifique e tente novamente.');
        }
      } catch {
        setCepError('Erro ao buscar CEP. Verifique sua conexão.');
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleSave() {
    if (!preview) return;
    const clean = cep.replace(/\D/g, '');
    const newOrigin: OriginData = {
      cep: clean,
      lat: preview.lat,
      lon: preview.lon,
      address: `${preview.address}, ${preview.city}`,
    };
    saveOrigin(newOrigin);
    setOrigin(newOrigin);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Configurações</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>Gerencie as configurações do negócio.</p>
        </div>

        {/* Ponto de partida */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(200,136,58,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,136,58,0.15)', color: '#C8883A' }}>
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>Ponto de Partida</h2>
              <p className="text-xs" style={{ color: '#9A8A96' }}>Endereço de onde você sai para atender as clientes</p>
            </div>
          </div>

          {/* Endereço atual */}
          {origin && (
            <div className="rounded-xl p-3" style={{ background: '#1C1828', border: '1px solid rgba(212,120,156,0.15)' }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#9A8A96' }}>Endereço atual</p>
              <p className="text-sm font-medium" style={{ color: '#F0ECF0' }}>📍 {origin.address}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A8A96' }}>CEP: {origin.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
            </div>
          )}

          {/* Input novo CEP */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>
              Novo CEP
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9A8A96' }} />
              <input
                type="text"
                value={cep}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="w-full pl-8 pr-10 py-3 rounded-xl text-sm border"
                style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(200,136,58,0.3)' }}
              />
              {loadingCep && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#C8883A' }} />
              )}
            </div>
            <p className="text-xs mt-1.5" style={{ color: '#9A8A96' }}>
              Digite o CEP do seu endereço. O sistema buscará a localização automaticamente.
            </p>
          </div>

          {cepError && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#f87171' }}>
              <AlertCircle size={13} /> {cepError}
            </div>
          )}

          {/* Preview geocodificado */}
          {preview && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(200,136,58,0.08)', border: '1px solid rgba(200,136,58,0.3)' }}>
              <p className="text-xs font-medium" style={{ color: '#C8883A' }}>Endereço encontrado — confirme antes de salvar:</p>
              <p className="text-sm font-semibold" style={{ color: '#F0ECF0' }}>📍 {preview.address}</p>
              <p className="text-xs" style={{ color: '#9A8A96' }}>{preview.city}</p>
              <p className="text-xs" style={{ color: '#9A8A96' }}>
                Coordenadas: {preview.lat.toFixed(5)}, {preview.lon.toFixed(5)}
              </p>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
              <CheckCircle size={15} /> Ponto de partida atualizado com sucesso!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!preview || loadingCep}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #C8883A, #A06828)', color: '#F0ECF0' }}
          >
            <Save size={15} /> Salvar novo endereço
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
