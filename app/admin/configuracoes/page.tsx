'use client';

import { useEffect, useState } from 'react';
import { MapPin, Save, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getOrigin, saveOrigin, OriginData } from '@/lib/store';
import { lookupCep } from '@/lib/transport';

function maskCep(v: string) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

function parseCoords(value: string): { lat: number; lon: number } | null {
  // aceita "lat, lon" ou "lat lon" copiado do Google Maps
  const parts = value.replace(',', ' ').trim().split(/\s+/);
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export default function ConfiguracoesPage() {
  const [origin, setOrigin] = useState<OriginData | null>(null);

  // CEP lookup
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');
  const [addressLabel, setAddressLabel] = useState('');

  // Coordenadas manuais
  const [coordsInput, setCoordsInput] = useState('');
  const [coordsError, setCoordsError] = useState('');

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const o = getOrigin();
    setOrigin(o);
    setCep(o.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'));
    setAddressLabel(o.address);
    setCoordsInput(`${o.lat}, ${o.lon}`);
  }, []);

  async function handleCepChange(value: string) {
    const masked = maskCep(value);
    setCep(masked);
    setCepError('');
    setAddressLabel('');
    setSaved(false);
    const clean = masked.replace(/\D/g, '');
    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const result = await lookupCep(clean);
        if (result) {
          setAddressLabel(`${result.address}, ${result.city}`);
          // preenche coords automaticamente, mas admin pode sobrescrever
          setCoordsInput(`${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`);
          setCoordsError('');
        } else {
          setCepError('CEP não encontrado. Preencha o endereço manualmente abaixo.');
        }
      } catch {
        setCepError('Erro ao buscar CEP. Preencha o endereço manualmente.');
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleSave() {
    const coords = parseCoords(coordsInput);
    if (!coords) {
      setCoordsError('Coordenadas inválidas. Use o formato: -23.6050, -48.0700');
      return;
    }
    const clean = cep.replace(/\D/g, '');
    const newOrigin: OriginData = {
      cep: clean,
      lat: coords.lat,
      lon: coords.lon,
      address: addressLabel || `CEP ${cep}`,
    };
    saveOrigin(newOrigin);
    setOrigin(newOrigin);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const previewCoords = parseCoords(coordsInput);

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0ECF0' }}>Configurações</h1>
          <p className="text-sm mt-1" style={{ color: '#9A8A96' }}>Gerencie as configurações do negócio.</p>
        </div>

        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#12101C', border: '1px solid rgba(200,136,58,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,136,58,0.15)', color: '#C8883A' }}>
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>Ponto de Partida</h2>
              <p className="text-xs" style={{ color: '#9A8A96' }}>Endereço de onde você sai para atender as clientes</p>
            </div>
          </div>

          {/* Endereço atual salvo */}
          {origin && (
            <div className="rounded-xl p-3" style={{ background: '#1C1828', border: '1px solid rgba(212,120,156,0.15)' }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#9A8A96' }}>Endereço atual</p>
              <p className="text-sm font-medium" style={{ color: '#F0ECF0' }}>📍 {origin.address}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9A8A96' }}>
                Coordenadas: {origin.lat.toFixed(5)}, {origin.lon.toFixed(5)}
              </p>
            </div>
          )}

          {/* CEP */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>CEP</label>
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
              {loadingCep && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: '#C8883A' }} />}
            </div>
            {cepError && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#f87171' }}><AlertCircle size={12} /> {cepError}</p>}
            {addressLabel && <p className="text-xs mt-1" style={{ color: '#4ade80' }}>📍 {addressLabel}</p>}
          </div>

          {/* Coordenadas manuais */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: '#9A8A96' }}>
                Coordenadas precisas *
              </label>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs"
                style={{ color: '#C8883A' }}
              >
                Abrir Google Maps <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="text"
              value={coordsInput}
              onChange={e => { setCoordsInput(e.target.value); setCoordsError(''); setSaved(false); }}
              placeholder="-23.6050, -48.0700"
              className="w-full px-3 py-3 rounded-xl text-sm border font-mono"
              style={{ background: '#1C1828', color: '#F0ECF0', borderColor: coordsError ? 'rgba(248,113,113,0.5)' : 'rgba(200,136,58,0.3)' }}
            />
            {coordsError && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{coordsError}</p>}
            {previewCoords && !coordsError && (
              <p className="text-xs mt-1" style={{ color: '#9A8A96' }}>
                Lat: {previewCoords.lat.toFixed(5)} · Lon: {previewCoords.lon.toFixed(5)}
              </p>
            )}

            {/* Instrução */}
            <div className="mt-3 rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(200,136,58,0.07)', border: '1px solid rgba(200,136,58,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#C8883A' }}>Como pegar as coordenadas do Google Maps:</p>
              <ol className="text-xs space-y-1" style={{ color: '#9A8A96' }}>
                <li>1. Abra o Google Maps e procure seu endereço</li>
                <li>2. Clique com o botão direito no pino da sua casa</li>
                <li>3. Clique no número que aparece (ex: <span style={{ color: '#F0ECF0' }}>-23.6050, -48.0700</span>)</li>
                <li>4. Cole aqui no campo acima</li>
              </ol>
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
              <CheckCircle size={15} /> Ponto de partida atualizado!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!previewCoords || loadingCep}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #C8883A, #A06828)', color: '#F0ECF0' }}
          >
            <Save size={15} /> Salvar endereço
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
