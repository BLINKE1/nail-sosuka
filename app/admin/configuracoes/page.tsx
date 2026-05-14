'use client';

import { useEffect, useState } from 'react';
import { MapPin, Save, Loader2, CheckCircle, AlertCircle, ExternalLink, Car, Mail, Bell, BellOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getOrigin, saveOrigin, OriginData, getTransportPricePerBand, saveTransportPricePerBand, getRecoveryEmail, saveRecoveryEmail } from '@/lib/store';
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
  const [priceSaved, setPriceSaved] = useState(false);

  // Taxa de deslocamento
  const [pricePerBand, setPricePerBand] = useState('3');
  const [priceError, setPriceError] = useState('');

  // E-mail de recuperação
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);

  // Push notifications
  const [pushSupported, setPushSupported] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'subscribed' | 'denied'>('idle');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    const o = getOrigin();
    setOrigin(o);
    setCep(o.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2'));
    setAddressLabel(o.address);
    setCoordsInput(`${o.lat}, ${o.lon}`);
    setPricePerBand(String(getTransportPricePerBand()));
    setRecoveryEmail(getRecoveryEmail());

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushSupported(supported);
    if (supported) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setPushStatus('subscribed');
        else if (Notification.permission === 'denied') setPushStatus('denied');
      });
    }
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

  function handleSavePrice() {
    const val = parseFloat(pricePerBand.replace(',', '.'));
    if (isNaN(val) || val <= 0) { setPriceError('Informe um valor válido maior que zero.'); return; }
    saveTransportPricePerBand(val);
    setPriceError('');
    setPriceSaved(true);
    setTimeout(() => setPriceSaved(false), 3000);
  }

  const previewCoords = parseCoords(coordsInput);

  async function handleSubscribePush() {
    setPushError('');
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushStatus('denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });

      if (!res.ok) throw new Error('Falha ao registrar no servidor');
      setPushStatus('subscribed');
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Erro ao ativar notificações');
    } finally {
      setPushLoading(false);
    }
  }

  async function handleUnsubscribePush() {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushStatus('idle');
    } catch {
      // ignore
    } finally {
      setPushLoading(false);
    }
  }

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
        {/* E-mail de recuperação */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,120,156,0.15)', color: '#D4789C' }}>
              <Mail size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>E-mail de Recuperação de Senha</h2>
              <p className="text-xs" style={{ color: '#9A8A96' }}>E-mail para onde a senha será enviada se você esquecer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={recoveryEmail}
              onChange={e => { setRecoveryEmail(e.target.value); setEmailSaved(false); }}
              placeholder="seu@email.com"
              className="flex-1 px-3 py-3 rounded-xl text-sm border"
              style={{ background: '#1C1828', color: '#F0ECF0', borderColor: 'rgba(212,120,156,0.3)' }}
            />
            <button
              onClick={() => { saveRecoveryEmail(recoveryEmail); setEmailSaved(true); setTimeout(() => setEmailSaved(false), 3000); }}
              disabled={!recoveryEmail}
              className="px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
            >
              <Save size={15} /> Salvar
            </button>
          </div>
          {emailSaved && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
              <CheckCircle size={14} /> E-mail salvo!
            </div>
          )}
        </div>

        {/* Taxa de deslocamento */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(200,136,58,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,136,58,0.15)', color: '#C8883A' }}>
              <Car size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>Taxa de Deslocamento</h2>
              <p className="text-xs" style={{ color: '#9A8A96' }}>Valor cobrado a cada 500 m acima dos primeiros 500 m grátis</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#9A8A96' }}>Valor por faixa de 500 m (R$)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.50"
                value={pricePerBand}
                onChange={e => { setPricePerBand(e.target.value); setPriceError(''); setPriceSaved(false); }}
                placeholder="3.00"
                className="flex-1 px-3 py-3 rounded-xl text-sm border"
                style={{ background: '#1C1828', color: '#F0ECF0', borderColor: priceError ? 'rgba(248,113,113,0.5)' : 'rgba(200,136,58,0.3)' }}
              />
              <button
                onClick={handleSavePrice}
                className="px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #C8883A, #A06828)', color: '#F0ECF0' }}
              >
                <Save size={15} /> Salvar
              </button>
            </div>
            {priceError && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{priceError}</p>}
            {priceSaved && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl mt-2" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                <CheckCircle size={14} /> Taxa atualizada!
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: '#9A8A96' }}>
              Ex: com R$ {pricePerBand || '3'} — 2 km de distância = 3 faixas × R$ {pricePerBand || '3'} = R$ {(3 * parseFloat(String(pricePerBand).replace(',', '.')) || 9).toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
        {/* Notificações Push */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#12101C', border: '1px solid rgba(212,120,156,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,120,156,0.15)', color: '#D4789C' }}>
              <Bell size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: '#F0ECF0' }}>Notificações de Agendamento</h2>
              <p className="text-xs" style={{ color: '#9A8A96' }}>Receba um aviso neste dispositivo a cada novo agendamento</p>
            </div>
          </div>

          {!pushSupported && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              <AlertCircle size={14} /> Seu navegador não suporta notificações push. Use Chrome ou Safari no iOS 16.4+.
            </div>
          )}

          {pushSupported && (
            <>
              {pushStatus === 'subscribed' && (
                <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <CheckCircle size={14} /> Notificações ativas neste dispositivo!
                </div>
              )}
              {pushStatus === 'denied' && (
                <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <AlertCircle size={14} /> Permissão negada. Habilite notificações nas configurações do seu navegador.
                </div>
              )}
              {pushError && (
                <p className="text-xs flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertCircle size={12} /> {pushError}
                </p>
              )}

              <div className="flex gap-2">
                {pushStatus !== 'subscribed' ? (
                  <button
                    onClick={handleSubscribePush}
                    disabled={pushLoading || pushStatus === 'denied'}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)', color: '#F0ECF0' }}
                  >
                    {pushLoading ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
                    Ativar notificações
                  </button>
                ) : (
                  <button
                    onClick={handleUnsubscribePush}
                    disabled={pushLoading}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
                    style={{ background: '#1C1828', color: '#9A8A96', border: '1px solid rgba(212,120,156,0.2)' }}
                  >
                    {pushLoading ? <Loader2 size={15} className="animate-spin" /> : <BellOff size={15} />}
                    Desativar notificações
                  </button>
                )}
              </div>

              <p className="text-xs" style={{ color: '#9A8A96' }}>
                💡 Para receber no celular, instale o site: abra no Chrome → menu → &quot;Adicionar à tela inicial&quot;. Depois ative as notificações aqui.
              </p>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
