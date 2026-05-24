'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, FileText, Send, Trash2, Search, Plus, Scale, X, ChevronRight } from 'lucide-react'

interface Document {
  id: string
  name: string
  text: string
  type: string
  size: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  { label: 'Resumir documentos', prompt: 'Faça um resumo detalhado de todos os documentos carregados, destacando os pontos principais de cada um.' },
  { label: 'Redigir petição inicial', prompt: 'Com base nos documentos carregados, redija uma petição inicial seguindo as normas do CPC/2015.' },
  { label: 'Analisar riscos jurídicos', prompt: 'Analise os riscos jurídicos e pontos críticos presentes nos documentos.' },
  { label: 'Extrair datas e prazos', prompt: 'Identifique e liste todas as datas, prazos processuais e termos importantes dos documentos.' },
  { label: 'Identificar as partes', prompt: 'Identifique e liste todas as partes envolvidas (autores, réus, advogados, juízes) nos documentos.' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function AssistenteJuridico() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/advogado/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) {
          setUploadError(data.error || 'Erro ao carregar arquivo')
          continue
        }

        const newDoc: Document = {
          id: crypto.randomUUID(),
          name: data.name,
          text: data.text,
          type: data.type,
          size: data.size,
        }
        setDocuments(prev => [...prev, newDoc])
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Documento **${data.name}** carregado com sucesso! Extraí ${data.text.length.toLocaleString('pt-BR')} caracteres. Agora posso responder perguntas, criar resumos ou redigir peças com base neste documento.`,
          timestamp: new Date(),
        }])
      } catch {
        setUploadError('Erro de conexão ao enviar o arquivo')
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/advogado/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          documents: documents.map(d => ({ name: d.name, text: d.text })),
        }),
      })

      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: !res.ok ? `Erro: ${data.error || 'Falha ao processar a requisição'}` : data.content,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro de conexão. Verifique se o servidor está rodando e se ANTHROPIC_API_KEY está configurada no .env.local.',
        timestamp: new Date(),
      }])
    }

    setLoading(false)
  }, [messages, documents, loading])

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
  }

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Sidebar - Documentos */}
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">Assistente Jurídico</h1>
              <p className="text-xs text-slate-400">Powered by Claude</p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Adicionar Documento
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            multiple
            onChange={e => handleFileUpload(e.target.files)}
          />
          {uploadError && (
            <p className="text-xs text-red-400 mt-2 text-center">{uploadError}</p>
          )}
        </div>

        {documents.length > 0 && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700 focus:outline-none focus:border-slate-500 placeholder:text-slate-600"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredDocs.length === 0 && (
            <div className="text-center text-xs mt-8 px-2">
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-700" />
              <p className="text-slate-500">Nenhum documento</p>
              <p className="mt-1 text-slate-600">PDF · DOCX · TXT</p>
              <p className="mt-2 text-slate-700">Arraste arquivos para a tela</p>
            </div>
          )}
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer group transition-colors ${
                activeDoc?.id === doc.id
                  ? 'bg-blue-600/20'
                  : 'hover:bg-slate-800'
              }`}
              onClick={() => setActiveDoc(activeDoc?.id === doc.id ? null : doc)}
            >
              <FileText className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activeDoc?.id === doc.id ? 'text-blue-400' : 'text-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-slate-300">{doc.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{formatBytes(doc.size)}</p>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setDocuments(prev => prev.filter(d => d.id !== doc.id))
                  if (activeDoc?.id === doc.id) setActiveDoc(null)
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                title="Remover documento"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {documents.length > 0 && (
          <div className="p-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-600 text-center">
              {documents.length} doc{documents.length !== 1 ? 's' : ''} · {(documents.reduce((a, d) => a + d.size, 0) / 1024).toFixed(0)} KB
            </p>
          </div>
        )}
      </aside>

      {/* Área de Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Chat Jurídico</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {documents.length > 0
                ? `${documents.length} documento(s) em contexto`
                : 'Carregue documentos para análise com IA'}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">Assistente Jurídico com IA</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
                Carregue documentos e faça perguntas, solicite resumos ou peça para redigir peças processuais.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={documents.length === 0}
                    className="flex items-center gap-2 text-left text-xs bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {action.label}
                  </button>
                ))}
              </div>

              {documents.length === 0 && (
                <p className="text-xs text-slate-400 mt-4">Adicione documentos para habilitar as ações acima</p>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4 max-w-3xl mx-auto w-full">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Scale className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Scale className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {messages.length > 0 && documents.length > 0 && (
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                disabled={loading}
                className="flex-shrink-0 text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={autoResize}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Faça uma pergunta, peça um resumo ou solicite a redação de uma peça processual..."
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-blue-400 disabled:opacity-50 max-h-32 leading-relaxed"
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </main>

      {/* Preview do Documento */}
      {activeDoc && (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <h3 className="text-sm font-medium text-slate-800 flex-1 truncate">{activeDoc.name}</h3>
            <button onClick={() => setActiveDoc(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-2 border-b border-slate-100 flex gap-4 text-xs text-slate-500">
            <span>{formatBytes(activeDoc.size)}</span>
            <span>{activeDoc.text.length.toLocaleString('pt-BR')} caracteres</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{activeDoc.text}</pre>
          </div>
        </aside>
      )}
    </div>
  )
}
