import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import HomeClient from '@/components/HomeClient'

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data as Product[]
}

export default async function HomePage() {
  const products = await getProducts()
  return <HomeClient products={products} />
}
