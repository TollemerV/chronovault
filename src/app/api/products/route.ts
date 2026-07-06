import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/aliexpress'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('q') ?? 'luxury watch'
  const page = Number(searchParams.get('page') ?? 1)

  try {
    const data = await searchProducts(keyword, page, 20)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[AliExpress search]', err)
    return NextResponse.json(
      { error: String(err), products: [], total: 0 },
      { status: 500 },
    )
  }
}
