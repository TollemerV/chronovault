import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/orders — crée une nouvelle commande
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customer_email, customer_name, shipping_address, items } = body

  if (!customer_email || !items?.length) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Calculer le total
  const total = items.reduce((sum: number, item: { unit_price: number; quantity: number }) =>
    sum + item.unit_price * item.quantity, 0
  )

  // Créer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_email, customer_name, shipping_address, total, status: 'pending' })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Créer les lignes de commande
  const orderItems = items.map((item: {
    product_id: string
    product_title: string
    quantity: number
    unit_price: number
    variant?: object
  }) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_title: item.product_title,
    quantity: item.quantity,
    unit_price: item.unit_price,
    variant: item.variant || null,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // TODO: Déclencher la commande AliExpress automatiquement
  // await placeAliExpressOrder(order.id, items)

  return NextResponse.json({ success: true, order_id: order.id })
}

// GET /api/orders — liste les commandes (admin uniquement)
export async function GET() {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
