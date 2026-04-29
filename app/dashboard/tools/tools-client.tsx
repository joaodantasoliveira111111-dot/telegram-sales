'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Wand2, ShieldCheck, Droplets, Eye, Hash,
  Upload, Download, ChevronDown, ChevronUp,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', quality))
}

async function cleanMetadata(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  canvas.getContext('2d')!.drawImage(img, 0, 0)
  return canvasToBlob(canvas)
}

async function addWatermark(file: File, text: string, opacity: number): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const fontSize = Math.max(20, Math.floor(canvas.width / 18))
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 3
  ctx.rotate(-Math.PI / 5)
  const step = fontSize * 6
  for (let x = -canvas.height * 2; x < canvas.width * 2; x += step) {
    for (let y = -canvas.height; y < canvas.height * 2; y += step) {
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
  return canvasToBlob(canvas)
}

async function blurPreview(file: File, blurPx: number): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.filter = `blur(${blurPx}px)`
  ctx.drawImage(img, 0, 0)
  return canvasToBlob(canvas)
}

async function uniqueHash(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const x = Math.floor(Math.random() * canvas.width)
  const y = Math.floor(Math.random() * canvas.height)
  ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},0.004)`
  ctx.fillRect(x, y, 1, 1)
  return canvasToBlob(canvas, 0.97)
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolId = 'clean' | 'watermark' | 'blur' | 'hash'

interface Tool {
  id: ToolId
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accentColor: string
  accentBg: string
}

const TOOLS: Tool[] = [
  {
    id: 'clean',
    name: 'Limpar Metadados',
    description: 'Remove EXIF e metadados da imagem re-codificando pelo canvas',
    icon: ShieldCheck,
    accentColor: 'text-emerald-400',
    accentBg: 'rgba(52,211,153,0.1)',
  },
  {
    id: 'watermark',
    name: 'Marca D\'água',
    description: 'Adiciona texto diagonal repetido sobre a imagem',
    icon: Droplets,
    accentColor: 'text-violet-400',
    accentBg: 'rgba(139,92,246,0.1)',
  },
  {
    id: 'blur',
    name: 'Preview Censurado',
    description: 'Aplica desfoque para criar previews censurados',
    icon: Eye,
    accentColor: 'text-blue-400',
    accentBg: 'rgba(96,165,250,0.1)',
  },
  {
    id: 'hash',
    name: 'Hash Único',
    description: 'Adiciona pixel invisível para gerar hash diferente a cada uso',
    icon: Hash,
    accentColor: 'text-orange-400',
    accentBg: 'rgba(251,146,60,0.1)',
  },
]

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  file,
  onFile,
}: {
  file: File | null
  onFile: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) onFile(f)
  }, [onFile])

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-3 py-10 transition-all"
      style={{
        border: dragging
          ? '2px dashed rgba(139,92,246,0.6)'
          : '2px dashed rgba(255,255,255,0.88)',
        background: dragging ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.68)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      {file ? (
        <div className="flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-violet-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 text-slate-600" />
          <div className="text-center">
            <p className="text-sm text-slate-400">Arraste uma imagem ou clique para selecionar</p>
            <p className="text-xs text-slate-600 mt-1">PNG, JPG, WebP, etc.</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tool Panel ───────────────────────────────────────────────────────────────

function ToolPanel({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  // Tool-specific controls
  const [watermarkText, setWatermarkText] = useState('FlowBot')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3)
  const [blurPx, setBlurPx] = useState(16)

  function handleFile(f: File) {
    setFile(f)
    setResultUrl(null)
    setResultBlob(null)
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setOriginalUrl(URL.createObjectURL(f))
  }

  async function handleProcess() {
    if (!file) return
    setProcessing(true)
    try {
      let blob: Blob
      if (tool.id === 'clean') blob = await cleanMetadata(file)
      else if (tool.id === 'watermark') blob = await addWatermark(file, watermarkText || 'FlowBot', watermarkOpacity)
      else if (tool.id === 'blur') blob = await blurPreview(file, blurPx)
      else blob = await uniqueHash(file)

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultBlob(blob)
      setResultUrl(URL.createObjectURL(blob))
      toast.success('Imagem processada com sucesso!')
    } catch {
      toast.error('Erro ao processar imagem')
    } finally {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!resultBlob) return
    const ext = 'jpg'
    const baseName = file?.name.replace(/\.[^.]+$/, '') ?? 'imagem'
    downloadBlob(resultBlob, `${baseName}_${tool.id}.${ext}`)
  }

  return (
    <div className="space-y-5 pt-2">
      <DropZone file={file} onFile={handleFile} />

      {/* Tool controls */}
      {tool.id === 'watermark' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Texto da marca d'água</Label>
            <Input
              value={watermarkText}
              onChange={e => setWatermarkText(e.target.value)}
              placeholder="FlowBot"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Opacidade: {Math.round(watermarkOpacity * 100)}%</Label>
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.05}
              value={watermarkOpacity}
              onChange={e => setWatermarkOpacity(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
        </div>
      )}

      {tool.id === 'blur' && (
        <div className="space-y-1.5">
          <Label>Intensidade do desfoque: {blurPx}px</Label>
          <input
            type="range"
            min={4}
            max={40}
            step={1}
            value={blurPx}
            onChange={e => setBlurPx(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
      )}

      {tool.id === 'clean' && (
        <p className="text-sm text-slate-500">
          A imagem será re-renderizada pelo canvas, removendo todos os metadados EXIF (localização, dispositivo, data, etc).
        </p>
      )}

      {tool.id === 'hash' && (
        <p className="text-sm text-slate-500">
          Um pixel aleatório (quase invisível) é inserido em posição aleatória e a qualidade de exportação é ligeiramente alterada, gerando um hash diferente a cada processamento.
        </p>
      )}

      <Button
        onClick={handleProcess}
        disabled={!file || processing}
        className="gap-2"
      >
        <Wand2 className="h-4 w-4" />
        {processing ? 'Processando...' : 'Processar Imagem'}
      </Button>

      {/* Before/After */}
      {originalUrl && resultUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Antes</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.84)' }}
              >
                <img src={originalUrl} alt="Original" className="w-full h-48 object-contain" style={{ background: '#000' }} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Depois</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <img src={resultUrl} alt="Resultado" className="w-full h-48 object-contain" style={{ background: '#000' }} />
              </div>
            </div>
          </div>

          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar imagem processada
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── ToolsClient ──────────────────────────────────────────────────────────────

export function ToolsClient() {
  const [openTool, setOpenTool] = useState<ToolId | null>(null)

  function toggleTool(id: ToolId) {
    setOpenTool(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-violet-400" />
          Ferramentas de Mídia
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Processamento de imagens no lado do cliente — nenhum arquivo é enviado para o servidor.
        </p>
      </div>

      {/* Tool cards */}
      <div className="space-y-3">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          const isOpen = openTool === tool.id

          return (
            <div
              key={tool.id}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.68)',
                border: isOpen
                  ? '1px solid rgba(139,92,246,0.25)'
                  : '1px solid rgba(255,255,255,0.82)',
              }}
            >
              {/* Card header */}
              <button
                onClick={() => toggleTool(tool.id)}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: tool.accentBg, border: '1px solid rgba(255,255,255,0.82)' }}
                >
                  <Icon className={`h-5 w-5 ${tool.accentColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{tool.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tool.description}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {!isOpen && (
                    <span
                      className="hidden sm:block text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      Usar ferramenta
                    </span>
                  )}
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-500" />
                    : <ChevronDown className="h-4 w-4 text-slate-500" />
                  }
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.80)' }}
                >
                  <ToolPanel tool={tool} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Privacy note */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-300">100% privado:</strong> todo o processamento acontece no seu navegador via Canvas API.</p>
          <p>Nenhuma imagem é enviada para nossos servidores.</p>
        </div>
      </div>
    </div>
  )
}
