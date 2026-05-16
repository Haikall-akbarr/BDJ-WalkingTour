import { NextRequest, NextResponse } from 'next/server'
import { getMySqlPool } from '@/lib/mysql'

export const runtime = 'nodejs'

export async function GET(_: NextRequest) {
  try {
    const pool = getMySqlPool()
    const [rows] = await pool.query<any[]>(`
      SELECT DATE(created_at) AS day, COUNT(*) AS users
      FROM users
      WHERE created_at >= CURDATE() - INTERVAL 30 DAY
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `)

    return NextResponse.json({ data: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
