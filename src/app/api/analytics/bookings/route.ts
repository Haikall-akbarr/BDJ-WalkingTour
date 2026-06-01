import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseProviderEnabled } from '@/lib/database-provider'
import { listBookings } from '@/lib/data-store'

export const runtime = 'nodejs'

export async function GET(_: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 })
    }

    const bookings = await listBookings()
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000
    const counts = new Map<string, number>()

    for (const booking of bookings) {
      const sourceDate = booking.createdAt || booking.updatedAt || booking.paidAt || null
      if (!sourceDate) continue

      const time = new Date(sourceDate).getTime()
      if (!Number.isFinite(time) || time < threshold) continue

      const day = new Date(time).toISOString().slice(0, 10)
      counts.set(day, (counts.get(day) || 0) + 1)
    }

    const data = Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, bookings]) => ({ day, bookings }))

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
