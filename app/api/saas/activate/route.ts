import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

// Poll endpoint: checks if the current user's account is activated after payment
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.type !== 'user') {
    return NextResponse.json({ active: false })
  }

  const { data } = await supabaseAdmin
    .from('saas_users')
    .select('is_active, plan_type')
    .eq('id', session.userId!)
    .single()

  return NextResponse.json({ active: data?.is_active ?? false, plan_type: data?.plan_type })
}
