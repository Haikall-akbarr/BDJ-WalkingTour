import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseProviderEnabled } from '@/lib/database-provider'
import { listBookings } from '@/lib/data-store'

export const runtime = 'nodejs'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const GUIDE_COMMISSION_RATE = 0.35

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 })
    }

    const guideId = request.nextUrl.searchParams.get('guideId') || undefined

    const bookings = await listBookings(guideId ? { guideId } : undefined)
    const paidBookings = bookings.filter(
      (b: any) => b.paymentStatus === 'paid' || b.status === 'paid'
    )

    const monthlyMap = new Map<string, { value: number; bookings: any[] }>()

    for (const booking of paidBookings) {
      const sourceDate = booking.paidAt || booking.createdAt || booking.updatedAt || null
      if (!sourceDate) continue
      const d = new Date(sourceDate)
      if (!Number.isFinite(d.getTime())) continue

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyMap.get(monthKey) || { value: 0, bookings: [] }
      existing.value += Number(booking.grossAmount || 0)
      existing.bookings.push({
        id: booking.id,
        tourName: booking.tourName,
        userName: booking.userName,
        userEmail: booking.userEmail,
        pax: booking.pax,
        grossAmount: Number(booking.grossAmount || 0),
        paidAt: booking.paidAt || booking.createdAt,
      })
      monthlyMap.set(monthKey, existing)
    }

    const sortedKeys = Array.from(monthlyMap.keys()).sort()
    const monthlyData = sortedKeys.map((key) => {
      const monthIdx = parseInt(key.split('-')[1], 10) - 1
      const entry = monthlyMap.get(key)!
      return {
        name: MONTH_NAMES[monthIdx] || key,
        monthKey: key,
        value: entry.value,
        bookings: entry.bookings,
      }
    })

    const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + Number(b.grossAmount || 0), 0)
    const totalGuideRevenue = Math.round(totalRevenue * GUIDE_COMMISSION_RATE)

    return NextResponse.json({ monthlyData, totalRevenue, totalGuideRevenue })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
