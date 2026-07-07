import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const API_URL = 'https://api-sg.aliexpress.com/sync'

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const method = searchParams.get('method') ?? 'aliexpress.ds.product.search'

  const params: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp: String(Date.now()),
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    keywords: 'watch',
    page_no: '1',
    page_size: '5',
    currency: 'EUR',
    locale: 'fr_FR',
    country: 'FR',
    sort: 'LAST_VOLUME_DESC',
  }

  params.sign = sign(params)

  const qs = new URLSearchParams(params).toString()
  const url = `${API_URL}?${qs}`

  try {
    const res = await fetch(url)
    const raw = await res.json()

    return NextResponse.json({
      status: res.status,
      method,
      app_key: APP_KEY,
      raw_response: raw,
      keys: Object.keys(raw),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
