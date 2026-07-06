import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      aliexpress_id,
      title,
      images,
      price,          // coût AliExpress
      selling_price,  // prix de vente calculé
      rating,
      review_count,
      category,
    } = body

    if (!aliexpress_id || !title) {
      return NextResponse.json({ error: 'aliexpress_id et title requis' }, { status: 400 })
    }

    const product = {
      aliexpress_id: String(aliexpress_id),
      title,
      description: title, // sera enrichi plus tard
      images: images ?? [],
      price: Number(price) || 0,
      selling_price: Number(selling_price) || Number(price) * 2.5,
      stock: 99,          // stock fictif — mis à jour via webhook
      rating: Number(rating) || 4.5,
      review_count: Number(review_count) || 0,
      category: category ?? 'montres',
      variants: [],
      created_at: new Date().toISOString(),
    }

    /* Upsert — si le produit existe déjà on le met à jour */
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
