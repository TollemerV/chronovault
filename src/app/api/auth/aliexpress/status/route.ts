import { NextResponse } from 'next/server'
import { getConnectionStatus } from '@/lib/aliexpress'

export async function GET() {
  try {
    const status = await getConnectionStatus()
    return NextResponse.json(status)
  } catch (err) {
    return NextResponse.json({ connected: false, error: String(err) })
  }
}
