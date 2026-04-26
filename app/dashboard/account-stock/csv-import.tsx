'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Upload, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CsvImportProps {
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; bot_id: string }[]
  onImported: () => void
}

const CSV_TEMPLATE = 'product_name,login,password,extra_info,warranty_days,notes\nCapCut Pro,email@exemplo.com,senha123,,30,Conta verificada\n'

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modelo_contas.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string) {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export function CsvImport({ bots, plans, onImported }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [botId, setBotId] = useState(bots[0]?.id ?? '')
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)

  const botPlans = plans.filter((p) => p.bot_id === botId)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setLoading(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (!rows.length) { toast.error('CSV vazio ou inválido'); return }

      const res = await fetch('/api/account-stock/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, bot_id: botId || null, plan_id: planId || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setResult(data)
      toast.success(`${data.imported} conta(s) importada(s)!`)
      onImported()
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">Importar CSV</p>
        <Button size="sm" variant="outline" onClick={downloadTemplate}>
          <Download className="mr-1.5 h-3 w-3" />
          Baixar Modelo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Bot</Label>
          <Select value={botId} onValueChange={(v) => { setBotId(v); setPlanId('') }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bots.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Plano (opcional)</Label>
          <Select value={planId || 'none'} onValueChange={(v) => setPlanId(v === 'none' ? '' : v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem vínculo</SelectItem>
              {botPlans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button
        className="w-full"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Selecionar arquivo CSV
      </Button>

      {result && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-zinc-800 p-2">
            <p className="text-zinc-500">Total</p>
            <p className="font-bold text-zinc-100">{result.total}</p>
          </div>
          <div className="rounded-lg bg-green-900/30 p-2">
            <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3 text-green-400" />
            <p className="font-bold text-green-400">{result.imported}</p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-2">
            <XCircle className="mx-auto mb-0.5 h-3 w-3 text-zinc-500" />
            <p className="font-bold text-zinc-400">{result.skipped}</p>
          </div>
        </div>
      )}
    </div>
  )
}
