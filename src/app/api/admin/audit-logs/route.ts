import { NextResponse } from 'next/server'
import type { RowDataPacket } from 'mysql2'
import { getMySqlPool } from '@/lib/mysql'

export const runtime = 'nodejs'

type AuditRow = RowDataPacket & Record<string, any>

export async function GET() {
  try {
    const pool = getMySqlPool()
    const [tableRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
         FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'`
    )

    if (!tableRows?.[0] || Number((tableRows[0] as any).total || 0) === 0) {
      return NextResponse.json({ logs: [] })
    }

    const [rows] = await pool.query<AuditRow[]>('SELECT * FROM audit_logs LIMIT 500')
    const logs = [...rows].sort((a, b) => {
      const aTime = new Date(String(a.created_at || a.createdAt || a.timestamp || a.time || 0)).getTime()
      const bTime = new Date(String(b.created_at || b.createdAt || b.timestamp || b.time || 0)).getTime()
      return bTime - aTime
    })

    return NextResponse.json({ logs: logs.slice(0, 200) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
