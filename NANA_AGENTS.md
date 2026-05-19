# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# The Nana Nail Design — Contexto do Projeto

## Origem
Este projeto é baseado no **nail-sosuka** (repositório da Nail Sosuka).
Mesma stack, mesma arquitetura — personalizado para uma nova cliente.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Vercel KV (Redis) para persistência
- Web Push Notifications (VAPID) via `web-push`
- PWA (manifest + service worker em `public/sw.js`)

## Paleta de cores
| Token | Hex | Uso |
|---|---|---|
| Primary | `#A855D4` | Botões, destaques, ícones |
| Primary dark | `#7A30A8` | Gradientes, hover |
| BG dark | `#12091E` | Fundo de seções |
| BG card | `#1C1030` | Cards, inputs |
| Text light | `#F0EAF8` | Títulos, textos principais |
| Text muted | `#9A85B5` | Subtextos, labels |
| Accent | `#C87AE8` | Destaques secundários |

## Identidade
- Nome: **The Nana Nail Design**
- Logo: `public/logo.jpeg` (lavanda claro com coração roxo)
- Admin password padrão: `nana2024`

## Arquitetura de dados
- Tudo em Vercel KV via `/api/store` (GET/PUT)
- Cache client-side em `localStorage` sincronizado por `StoreSync`
- Push subscriptions armazenadas separadamente no KV sob chave `push_subscriptions`

## Variáveis de ambiente necessárias (Vercel)
```
KV_URL / KV_REST_API_URL / KV_REST_API_TOKEN   ← Vercel KV
RESEND_API_KEY                                  ← recuperação de senha por e-mail
ORS_API_KEY                                     ← geocoding e distância
NEXT_PUBLIC_VAPID_PUBLIC_KEY                    ← Web Push (gerar com: npx web-push generate-vapid-keys)
VAPID_PRIVATE_KEY                               ← Web Push (privada, nunca expor)
```

## Fluxo de agendamento
1. Cliente escolhe serviço(s) ou combo → `/agendar`
2. Seleciona data/hora (slots calculados pela duração real do serviço)
3. Informa CEP → calcula frete por distância
4. Confirma → `saveAppointment()` → push notification para a manicure

## Admin
- Login: `/admin` (senha em `StoreData.adminPassword`)
- Seções: Dashboard, Agendamentos, Serviços, Galeria, Configurações
- Notificações push ativadas em: Admin → Configurações → Notificações de Agendamento

## PWA
- Instalar pelo Chrome Android: botão "Baixar App" no header
- iOS: botão "Baixar App" → instrução de Share → Adicionar à Tela de Início
- Ícones em `public/icons/icon-192.png` e `public/icons/icon-512.png`
