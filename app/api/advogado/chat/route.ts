import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Variável ANTHROPIC_API_KEY não configurada. Adicione-a ao arquivo .env.local.' },
      { status: 500 }
    )
  }

  const { messages, documents } = await request.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    documents: { name: string; text: string }[]
  }

  const client = new Anthropic({ apiKey })

  const docsContext = documents.length > 0
    ? '\n\n## DOCUMENTOS DISPONÍVEIS\n\n' +
      documents.map(d => `### ${d.name}\n\n${d.text}`).join('\n\n---\n\n')
    : ''

  const system = `Você é um assistente jurídico especializado para advogados brasileiros.
Suas competências:
- Analisar e resumir documentos jurídicos (processos, contratos, procurações, pareceres)
- Responder perguntas sobre o conteúdo dos documentos carregados
- Redigir peças processuais (petições, recursos, memoriais, contratos) conforme CPC/2015
- Identificar riscos, prazos processuais e pontos críticos
- Auxiliar na estratégia jurídica dos casos

Sempre responda em português brasileiro com linguagem jurídica precisa e profissional.
Ao referenciar informações dos documentos, indique claramente de qual documento veio.
Para redação de peças, siga as normas processuais e a legislação brasileira vigente.${docsContext}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages,
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ content })
  } catch (err: unknown) {
    console.error('Erro na API do Claude:', err)
    const msg = err instanceof Error ? err.message : 'Erro ao contactar a API do Claude'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
