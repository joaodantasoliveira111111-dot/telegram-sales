'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react'

interface MediaUploadProps {
  value: string
  mediaType: string
  onChange: (url: string, type: string) => void
  onClear: () => void
}

export function MediaUpload({ value, mediaType, onChange, onClear }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao fazer upload')
        return
      }

      onChange(data.url, data.media_type)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
        {mediaType === 'video' ? (
          <video src={value} className="max-h-40 w-full object-contain" controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className="max-h-40 w-full object-contain" />
        )}
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-2 rounded-full bg-zinc-900/80 p-1 text-zinc-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
          {mediaType === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {mediaType === 'video' ? 'Vídeo' : 'Imagem'} enviado
        </div>
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 py-6 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Upload className="h-6 w-6" />
        )}
        {loading ? 'Enviando...' : 'Clique para enviar foto ou vídeo'}
        <span className="text-xs text-zinc-600">PNG, JPG, GIF, MP4 • Máx 50MB</span>
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
