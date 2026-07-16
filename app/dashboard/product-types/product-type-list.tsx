'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Pencil, X, Loader2, LayoutList } from 'lucide-react'
import { ProductType, ProductTypeField } from '@/types'

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface FormState {
  name: string
  fields: ProductTypeField[]
  message_template: string
}

const emptyForm: FormState = { name: '', fields: [{ key: 'login', label: 'Login' }, { key: 'senha', label: 'Senha' }], message_template: '' }

interface ProductTypeListProps {
  initialTypes: ProductType[]
}

export function ProductTypeList({ initialTypes }: ProductTypeListProps) {
  const [types, setTypes] = useState(initialTypes)
  const [editing, setEditing] = useState<ProductType | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(pt: ProductType) {
    setEditing(pt)
    setForm({ name: pt.name, fields: pt.fields, message_template: pt.message_template ?? '' })
    setShowForm(true)
  }

  function updateFieldLabel(index: number, label: string) {
    setForm((f) => {
      const fields = [...f.fields]
      fields[index] = { key: slugify(label), label }
      return { ...f, fields }
    })
  }

  function addField() {
    setForm((f) => ({ ...f, fields: [...f.fields, { key: '', label: '' }] }))
  }

  function removeField(index: number) {
    setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanFields = form.fields
      .map((f) => ({ key: slugify(f.key || f.label), label: f.label.trim() }))
      .filter((f) => f.key && f.label)

    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    if (cleanFields.length === 0) { setError('Adicione ao menos um campo'); return }
    const keys = cleanFields.map((f) => f.key)
    if (new Set(keys).size !== keys.length) { setError('Chaves de campo repetidas — ajuste os nomes'); return }

    setLoading(true)
    try {
      const url = editing ? `/api/product-types/${editing.id}` : '/api/product-types'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), fields: cleanFields, message_template: form.message_template.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }

      setTypes((prev) => editing ? prev.map((t) => t.id === data.id ? data : t) : [data, ...prev])
      setShowForm(false)
      setEditing(null)
      toast.success(editing ? 'Tipo de produto atualizado' : 'Tipo de produto criado')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este tipo de produto? Planos vinculados voltam a usar login/senha padrão.')) return
    const res = await fetch(`/api/product-types/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTypes((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tipo de produto excluído')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo de Produto
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar Tipo de Produto' : 'Novo Tipo de Produto'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-md px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#b91c1c' }}>{error}</p>}

              <div className="space-y-1.5">
                <Label>Nome do tipo</Label>
                <Input placeholder="Ex: Conta de Streaming, Licença de Software..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <Label>Campos de entrega</Label>
                <p className="text-xs text-zinc-500">Cada campo vira uma coluna na planilha de importação e uma variável na mensagem de entrega.</p>
                <div className="space-y-2">
                  {form.fields.map((field, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Nome do campo (ex: Contra-senha)"
                          value={field.label}
                          onChange={(e) => updateFieldLabel(i, e.target.value)}
                        />
                        {field.key && <p className="mt-1 font-mono text-[10px] text-zinc-400">coluna na planilha: {field.key}</p>}
                      </div>
                      <button type="button" onClick={() => removeField(i)} className="shrink-0 text-zinc-400 hover:text-red-500" title="Remover campo">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  <Plus className="mr-1.5 h-3 w-3" />
                  Adicionar campo
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Mensagem de entrega personalizada (opcional)</Label>
                <Textarea
                  placeholder={`Deixe em branco para gerar automaticamente. Use {chave_planilha} para inserir cada campo, além de {plano} e {garantia}.\n\nEx:\n🏦 Banco: {banco}\n💳 Número: {numero}`}
                  value={form.message_template}
                  onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                  className="min-h-[120px] font-mono text-xs"
                />
                {form.fields.some((f) => f.key) && (
                  <p className="text-xs text-zinc-500">
                    Variáveis disponíveis: {form.fields.filter((f) => f.key).map((f) => `{${f.key}}`).join(' ')} {'{plano}'} {'{garantia}'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Salvar' : 'Criar Tipo de Produto'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.length === 0 && !showForm && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
              <LayoutList className="h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">Nenhum tipo de produto ainda. Crie um pra vender algo além de login/senha simples.</p>
            </CardContent>
          </Card>
        )}
        {types.map((pt) => (
          <Card key={pt.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{pt.name}</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(pt)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pt.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {pt.fields.map((f) => (
                  <span key={f.key} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(124,58,237,0.08)', color: '#6d28d9' }}>
                    {f.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
