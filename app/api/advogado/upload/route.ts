import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_TEXT_CHARS = 150000

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Limite de 10 MB.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const name = file.name
  const type = file.type

  let text = ''

  try {
    if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer)
      text = data.text
    } else if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.toLowerCase().endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (type === 'text/plain' || name.toLowerCase().endsWith('.txt')) {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Use PDF, DOCX ou TXT.' },
        { status: 400 }
      )
    }

    if (text.length > MAX_TEXT_CHARS) {
      text = text.slice(0, MAX_TEXT_CHARS) + '\n\n[Documento truncado — apenas os primeiros 150.000 caracteres foram incluídos]'
    }

    return NextResponse.json({ text, name, type, size: file.size })
  } catch (err) {
    console.error('Erro ao processar arquivo:', err)
    return NextResponse.json({ error: 'Falha ao extrair texto do arquivo.' }, { status: 500 })
  }
}
