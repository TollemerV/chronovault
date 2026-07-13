import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function saveSetting(key: string, value: string) {
  await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

/**
 * POST /api/auth/aliexpress/manual
 * Sauvegarde un access_token AliExpress saisi manuellement dans l'admin
 */
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token || !access_token.trim()) {
    return NextResponse.json({ error: 'access_token requis' }, { status: 400 })
  }

  await Promise.all([
    saveSetting('ae_access_token', access_token.trim()),
    saveSetting('ae_refresh_token', refresh_token?.trim() ?? ''),
    saveSetting('ae_connected_at', new Date().toISOString()),
  ])

  return NextResponse.json({ ok: true })
}
