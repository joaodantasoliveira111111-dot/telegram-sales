'use client'

import { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Upload, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ProductType } from '@/types'

interface XlsxImportProps {
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; bot_id: string; product_type_id: string | null }[]
  productTypes: ProductType[]
  onImported: () => void
}

const BASE_COLUMNS = ['product_name', 'extra_info', 'warranty_days', 'notes']

function buildTemplateRow(productType: ProductType | null): Record<string, string> {
  const row: Record<string, string> = { product_name: 'Nome do produto', warranty_days: '30', notes: '' , extra_info: ''}
  if (productType) {
    for (const f of productType.fields) row[f.key] = f.label
  } else {
    row.login = 'usuario@email.com'
    row.password = 'senha123'
  }
  return row
}

function downloadTemplate(productType: ProductType | null) {
  const row = buildTemplateRow(productType)
  const ws = XLSX.utils.json_to_sheet([row])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo')
  XLSX.writeFile(wb, 'modelo_estoque.xlsx')
}

export function XlsxImport({ bots, plans, productTypes, onImported }: XlsxImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [botId, setBotId] = useState(bots[0]?.id ?? '')
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)

  const botPlans = plans.filter((p) => p.bot_id === botId)
  const selectedPlan = plans.find((p) => p.id === planId)
  const productType = useMemo(
    () => selectedPlan?.product_type_id ? productTypes.find((pt) => pt.id === selectedPlan.product_type_id) ?? null : null,
    [selectedPlan, productTypes]
  )
  const customKeys = productType?.fields.map((f) => f.key) ?? []

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      if (!rawRows.length) { toast.error('Planilha vazia ou inválida'); return }

      const rows = rawRows.map((raw) => {
        const row: Record<string, unknown> = {}
        for (const key of BASE_COLUMNS) row[key] = String(raw[key] ?? '').trim()
        if (customKeys.length) {
          const custom_fields: Record<string, string> = {}
          for (const key of customKeys) custom_fields[key] = String(raw[key] ?? '').trim()
          row.custom_fields = custom_fields
        } else {
          row.login = String(raw.login ?? '').trim()
          row.password = String(raw.password ?? '').trim()
        }
        return row
      })

      const res = await fetch('/api/account-stock/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, bot_id: botId || null, plan_id: planId || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setResult(data)
      toast.success(`${data.imported} item(ns) importado(s)!`)
      onImported()
    } catch {
      toast.error('Não foi possível ler a planilha. Confira se é um arquivo .xlsx válido.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">Importar Planilha (.xlsx)</p>
        <Button size="sm" variant="outline" onClick={() => downloadTemplate(productType)}>
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

      <p className="text-xs text-zinc-500">
        Colunas esperadas: <code className="font-mono">product_name</code>
        {productType
          ? productType.fields.map((f) => <span key={f.key}>, <code className="font-mono">{f.key}</code></span>)
          : <>, <code className="font-mono">login</code>, <code className="font-mono">password</code></>}
        , <code className="font-mono">extra_info</code>, <code className="font-mono">warranty_days</code>, <code className="font-mono">notes</code> (opcionais)
      </p>

      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <Button
        className="w-full"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Selecionar arquivo .xlsx
      </Button>

      {result && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <p className="text-zinc-500">Total</p>
            <p className="font-bold text-zinc-700">{result.total}</p>
          </div>
          <div className="rounded-lg p-2" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <CheckCircle2 className="mx-auto mb-0.5 h-3 w-3" style={{ color: '#16a34a' }} />
            <p className="font-bold" style={{ color: '#15803d' }}>{result.imported}</p>
          </div>
          <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <XCircle className="mx-auto mb-0.5 h-3 w-3 text-zinc-500" />
            <p className="font-bold text-zinc-600">{result.skipped}</p>
          </div>
        </div>
      )}
    </div>
  )
}
