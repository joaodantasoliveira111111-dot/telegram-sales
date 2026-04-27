'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Eye, EyeOff, Sparkles, Info } from 'lucide-react'

interface BotPixelFormProps {
  botId: string
  initialValues: {
    meta_pixel_id: string
    meta_access_token: string
    meta_test_event_code: string
  }
}

function SecretInput({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function BotPixelForm({ botId, initialValues }: BotPixelFormProps) {
  const [form, setForm] = useState(initialValues)
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao salvar pixel'); return }
      toast.success('Configurações do Pixel salvas!')
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !form.meta_pixel_id && !form.meta_access_token

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-semibold text-slate-100">Meta Pixel — Por Bot</h2>
        <p className="text-sm text-slate-500">
          Configure um Pixel específico para este bot. Se deixar vazio, usa o pixel global das Configurações.
        </p>
      </div>

      {isEmpty && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <p className="text-sm text-slate-400">
            Nenhum pixel configurado para este bot. Os eventos serão rastreados com o pixel global definido em{' '}
            <a href="/dashboard/settings" className="text-blue-400 hover:underline">Configurações</a>.
          </p>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <CardTitle className="text-base">Meta Conversions API</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pixel-id">Pixel ID</Label>
              <Input
                id="pixel-id"
                placeholder="123456789012345 (deixe vazio para usar o global)"
                value={form.meta_pixel_id}
                onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="access-token">Access Token</Label>
              <SecretInput
                id="access-token"
                value={form.meta_access_token}
                onChange={(v) => setForm({ ...form, meta_access_token: v })}
                placeholder="EAAxxxxx... (deixe vazio para usar o global)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-code">Código de Teste (opcional)</Label>
              <Input
                id="test-code"
                placeholder="TEST12345 — apenas para testes"
                value={form.meta_test_event_code}
                onChange={(e) => setForm({ ...form, meta_test_event_code: e.target.value })}
              />
              <p className="text-xs text-slate-600">
                Remova após testar. Não use em produção.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Pixel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
