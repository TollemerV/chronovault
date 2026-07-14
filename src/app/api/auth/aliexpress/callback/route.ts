import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

function signSha256(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex').toUpperCase()
}

async function saveSetting(key: string, value: string) {
  await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

/**
 * GET /api/auth/aliexpress/callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Log TOUS les paramètres reçus d'AliExpress
  const allParams: Record<string, string> = {}
  searchParams.forEach((v, k) => { allParams[k] = v })
  console.log('[AE Callback] Params reçus:', JSON.stringify(allParams))

  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const origin = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : new URL(req.url).origin

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(error ?? 'code manquant')}`,
    )
  }

  const callbackUrl = `${origin}/api/auth/aliexpress/callback`
  const ts = String(Date.now())

  // Helpers pour construire les params signés
  const buildParams = (signFn: (p: Record<string, string>) => string, signMethod: string) => {
    const p: Record<string, string> = { app_key: APP_KEY, code, sign_method: signMethod, timestamp: ts }
    p.sign = signFn(p)
    return p
  }

  // Variantes à tester — on s'arrête au premier JSON valide
  interface Variant { label: string; fn: () => Promise<Response> }
  const variants: Variant[] = [
    // 1. GET sur /auth/token/security/create (POST donnait 405 → essayons GET)
    { label: 'GET-security-create-sha256', fn: () => {
      const p = buildParams(signSha256, 'sha256')
      return fetch(`https://api-sg.aliexpress.com/auth/token/security/create?${new URLSearchParams(p)}`, { method: 'GET', cache: 'no-store', signal: AbortSignal.timeout(7000) })
    }},
    // 2. POST JSON body
    { label: 'POST-JSON-sha256', fn: () => {
      const p = buildParams(signSha256, 'sha256')
      return fetch('https://api-sg.aliexpress.com/auth/token/security/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), cache: 'no-store', signal: AbortSignal.timeout(7000) })
    }},
    // 3. Gateway SYNC avec method en paramètre (format réel de la plupart des AE APIs)
    { label: 'POST-SYNC-sha256', fn: () => {
      const p: Record<string, string> = { method: '/auth/token/security/create', app_key: APP_KEY, code, sign_method: 'sha256', timestamp: ts }
      p.sign = signSha256(p)
      return fetch('https://api-sg.aliexpress.com/sync', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }, body: new URLSearchParams(p).toString(), cache: 'no-store', signal: AbortSignal.timeout(7000) })
    }},
    // 4. POST form-urlencoded avec charset (différence subtile parfois requise)
    { label: 'POST-FORM-charset-sha256', fn: () => {
      const p = buildParams(signSha256, 'sha256')
      return fetch('https://api-sg.aliexpress.com/auth/token/security/create', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }, body: new URLSearchParams(p).toString(), cache: 'no-store', signal: AbortSignal.timeout(7000) })
    }},
  ]

  let rawText = ''
  let httpStatus = 0

  for (const v of variants) {
    try {
      const res = await v.fn()
      httpStatus = res.status
      rawText = await res.text()
      console.log(`[AE OAuth] ${v.label} HTTP ${httpStatus}: ${rawText.slice(0, 200)}`)
      if (rawText.trim() && !rawText.trim().startsWith('<') && httpStatus !== 405) break
    } catch (err) {
      console.error(`[AE OAuth] ${v.label} error:`, err)
    }
  }


  // Page HTML = AliExpress refuse (permissions insuffisantes)
  if (rawText.trim().startsWith('<')) {
    const isMaintenancePage = rawText.includes('Maintaining')
    const reason = isMaintenancePage
      ? 'App sans permission DS — saisir le token manuellement dans l\'admin'
      : `HTTP ${httpStatus} — réponse HTML`
    console.warn('[AE OAuth] Réponse HTML reçue:', rawText.slice(0, 200))
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(reason)}&show_manual=1`,
    )
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    return NextResponse.redirect(
      `${origin}/admin?ae_error=${encodeURIComponent(`Réponse non-JSON: ${rawText.slice(0, 200)}`)}&show_manual=1`,
    )
  }

  if (data.access_token) {
    await Promise.all([
      saveSetting('ae_access_token', data.access_token as string),
      saveSetting('ae_refresh_token', (data.refresh_token as string) ?? ''),
      saveSetting('ae_token_expiry', String(data.expire_time ?? Date.now() + 30 * 24 * 3600 * 1000)),
      saveSetting('ae_account_id', String(data.account_id ?? '')),
      saveSetting('ae_connected_at', new Date().toISOString()),
    ])
    console.log('[AE OAuth] ✅ Token sauvegardé !')
    return NextResponse.redirect(`${origin}/admin?ae_connected=1`)
  }

  const errMsg = String(data.error_description ?? data.error ?? data.message ?? JSON.stringify(data).slice(0, 300))
  return NextResponse.redirect(
    `${origin}/admin?ae_error=${encodeURIComponent(errMsg)}&show_manual=1`,
  )
}
