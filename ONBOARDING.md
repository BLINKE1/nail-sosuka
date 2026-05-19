# Checklist de Onboarding de Cliente

## 1. Reunião inicial
- [ ] Entender o tipo de site (landing page / agendamento / e-commerce / outro)
- [ ] Entender o público-alvo e objetivo principal
- [ ] Definir prazo e orçamento
- [ ] Combinar forma de pagamento (50% entrada, 50% entrega é padrão)

---

## 2. Definir a stack antes de começar
- [ ] Landing page simples → Next.js estático + Cloudflare Pages
- [ ] Site com agendamento/banco → Next.js + Vercel + Vercel KV
- [ ] Site complexo / alto volume → Next.js + Railway/Render + PostgreSQL

---

## 3. Contas — criar na conta do cliente

**GitHub**
- [ ] Cliente cria conta em github.com (ou já tem)
- [ ] Criar o repositório no GitHub dele
- [ ] Adicionar sua conta como colaborador (`Settings → Collaborators`)

**Hospedagem**
- [ ] Cliente cria conta no Vercel / Cloudflare (conforme stack definida)
- [ ] Conectar o repositório GitHub na conta de hospedagem dele
- [ ] Adicionar sua conta como membro (`Settings → Members`)

**Domínio** (se tiver)
- [ ] Cliente compra o domínio (Registro.br para .com.br)
- [ ] Configurar DNS apontando pro host
- [ ] Verificar HTTPS ativo

---

## 4. Variáveis de ambiente
- [ ] Configurar no painel do Vercel/host (nunca no código)
- [ ] Entregar lista das variáveis necessárias pro cliente guardar
- [ ] Testar deploy com as variáveis configuradas

---

## 5. Identidade visual
- [ ] Receber logo (preferencialmente PNG com fundo transparente ou SVG)
- [ ] Confirmar paleta de cores (hex)
- [ ] Confirmar fonte (ou usar padrão do projeto)
- [ ] Receber fotos/imagens (se tiver)

---

## 6. Conteúdo
- [ ] Texto da home / hero
- [ ] Lista de serviços com nome, descrição, preço e duração
- [ ] Fotos para galeria (se tiver)
- [ ] WhatsApp / telefone de contato
- [ ] Endereço e CEP (para cálculo de frete, se aplicável)
- [ ] E-mail admin (para recuperação de senha)

---

## 7. Antes de entregar
- [ ] Testar fluxo de agendamento completo
- [ ] Testar login admin e todas as seções
- [ ] Testar no celular (Android + iOS)
- [ ] Verificar que o nome do negócio está correto em todo o site
- [ ] Trocar senha admin padrão para senha do cliente
- [ ] PWA: testar botão "Baixar App" no Android

---

## 8. Entrega
- [ ] Gravar vídeo curto mostrando como usar o admin
- [ ] Entregar documento com:
  - URL do site
  - URL do admin (`/admin`)
  - Senha admin
  - Lista de variáveis de ambiente (para o cliente guardar)
  - Contato seu para suporte

---

## 9. Pós-entrega (opcional mas profissional)
- [ ] Combinar plano de manutenção mensal (se quiser receita recorrente)
- [ ] Agendar revisão em 30 dias
- [ ] Pedir depoimento/indicação
