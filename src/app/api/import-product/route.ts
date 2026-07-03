import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/import-product
 * Body: { url: string, selling_price: number }
 *
 * Pour l'instant : mode mock (retourne des données simulées)
 * À brancher sur l'API AliExpress réelle dès réception des clés
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { url, selling_price } = body

  if (!url) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
  }

  // Extraire l'ID AliExpress depuis l'URL
  const aliexpressIdMatch = url.match(/item\/(\d+)/) || url.match(/productId=(\d+)/)
  const aliexpressId = aliexpressIdMatch?.[1] || `mock-${Date.now()}`

  // ─── TODO: Remplacer ce bloc par l'appel API AliExpress réel ───
  // const appKey = process.env.ALIEXPRESS_APP_KEY
  // const appSecret = process.env.ALIEXPRESS_APP_SECRET
  // const productData = await fetchAliExpressProduct(aliexpressId, appKey, appSecret)
  // ────────────────────────────────────────────────────────────────

  // Mock : données simulées basées sur l'URL
  const mockProduct = {
    aliexpress_id: aliexpressId,
    title: `Montre AliExpress #${aliexpressId}`,
    description: 'Produit importé depuis AliExpress. Description à personnaliser.',
    price: 20.00,
    selling_price: selling_price || 89.00,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80',
    ],
    variants: [
      { id: 'v1', name: 'Couleur', value: 'Noir', price_modifier: 0, stock: 10 },
      { id: 'v2', name: 'Couleur', value: 'Or', price_modifier: 10, stock: 5 },
    ],
    stock: 15,
    category: 'montres',
    rating: 4.5,
    review_count: 0,
  }

  // Insérer dans Supabase
  const { data, error } = await supabase
    .from('products')
    .upsert(mockProduct, { onConflict: 'aliexpress_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, product: data })
}
