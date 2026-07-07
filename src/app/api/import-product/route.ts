import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const API_URL = 'https://api-sg.aliexpress.com/sync'

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort()
  const str = APP_SECRET + sorted.map(k => k + params[k]).join('') + APP_SECRET
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

/** Extrait l'ID produit depuis une URL AliExpress */
function extractProductId(urlOrId: string): string | null {
  // Déjà un ID numérique
  if (/^\d+$/.test(urlOrId.trim())) return urlOrId.trim()
  // URL type: /item/1234567890.html
  const m = urlOrId.match(/\/item\/(\d+)/)
  if (m) return m[1]
  // URL type: productId=1234567890
  const m2 = urlOrId.match(/[?&]productId=(\d+)/)
  if (m2) return m2[1]
  return null
}

/** Tente de récupérer les données via l'API DS get */
async function fetchFromAPI(productId: string) {
  const params: Record<string, string> = {
    method: 'aliexpress.ds.product.get',
    app_key: APP_KEY,
    timestamp: String(Date.now()),
    format: 'json',
    v: '2.0',
    sign_method: 'md5',
    product_id: productId,
    currency: 'EUR',
    locale: 'fr_FR',
    country: 'FR',
  }
  params.sign = sign(params)
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}?${qs}`, { cache: 'no-store' })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      url,            // URL AliExpress (optionnel — import via URL)
      aliexpress_id,  // ID direct (optionnel — import manuel)
      title,
      images,
      price,
      selling_price,
      rating,
      review_count,
      category,
      description,
    } = body

    let productId = aliexpress_id ? String(aliexpress_id) : null
    let productData: Record<string, unknown> = {}

    /* ── Mode import via URL ── */
    if (url && !productId) {
      productId = extractProductId(url)
      if (!productId) {
        return NextResponse.json({ error: 'URL invalide — ID produit introuvable' }, { status: 400 })
      }

      // Tente l'API DS get
      try {
        const raw = await fetchFromAPI(productId)
        const dsProduct = raw?.aliexpress_ds_product_get_response?.result?.ae_item_base_info_dto
        if (dsProduct) {
          productData = {
            title: dsProduct.subject ?? title ?? `Produit ${productId}`,
            images: [dsProduct.product_images?.split(';')[0] ?? ''],
            price: parseFloat(dsProduct.aeop_ae_product_s_k_us?.aeop_ae_product_sku?.[0]?.sku_price ?? '0') || 0,
            description: dsProduct.detail ?? '',
          }
        }
      } catch {
        // API pas disponible — on utilisera les données manuelles
      }
    }

    if (!productId) {
      return NextResponse.json({ error: 'aliexpress_id ou url requis' }, { status: 400 })
    }

    const finalTitle = (productData.title as string) || title || `Produit AliExpress ${productId}`
    const finalImages = (productData.images as string[])?.length ? productData.images as string[] : (images ?? [])
    const finalPrice = Number(productData.price) || Number(price) || 0
    const finalSellPrice = Number(selling_price) || Math.ceil((finalPrice * 2.5) / 5) * 5 - 0.01

    const product = {
      aliexpress_id: productId,
      title: finalTitle,
      description: (productData.description as string) || description || finalTitle,
      images: finalImages,
      price: finalPrice,
      selling_price: finalSellPrice,
      stock: 99,
      rating: Number(rating) || 4.5,
      review_count: Number(review_count) || 0,
      category: category ?? 'montres',
      variants: [],
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'aliexpress_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: data })
  } catch (err) {
    console.error('[import-product]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
