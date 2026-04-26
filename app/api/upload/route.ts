import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage
    .from('media')
    .upload(filename, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(data.path)

  const mediaType = file.type.startsWith('video') ? 'video' : 'image'

  return NextResponse.json({ url: publicUrl, media_type: mediaType })
}
