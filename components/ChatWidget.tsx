'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  const whatsappNumber = '5515997789464';

  function handleSend() {
    if (!msg.trim()) return;
    const encoded = encodeURIComponent(msg.trim());
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
    setMsg('');
    setOpen(false);
  }

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="glass-card rounded-2xl shadow-2xl w-72 overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(212,120,156,0.2)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Nail Sosuka</p>
                <p className="text-white/70 text-xs">Responde em instantes</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4" style={{ background: '#12101C' }}>
            <div
              className="rounded-xl p-3 mb-4 text-sm"
              style={{ background: '#1C1828', color: '#F0ECF0' }}
            >
              👋 Olá! Tudo bem? Vou te ajudar a tirar dúvidas ou agendar seu horário. O que deseja?
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escreva sua mensagem..."
                className="flex-1 rounded-xl px-3 py-2 text-sm border"
                style={{
                  background: '#1C1828',
                  color: '#F0ECF0',
                  borderColor: 'rgba(212,120,156,0.3)',
                }}
              />
              <button
                onClick={handleSend}
                className="p-2 rounded-xl transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #D4789C, #A0587C)' }}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
            <p className="text-center mt-2 text-xs" style={{ color: '#9A8A96' }}>
              Continuará no WhatsApp
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          background: open
            ? '#1C1828'
            : 'linear-gradient(135deg, #25D366, #128C7E)',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(37,211,102,0.4)',
          border: open ? '1px solid rgba(212,120,156,0.3)' : 'none',
        }}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
