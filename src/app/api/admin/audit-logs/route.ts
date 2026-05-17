import { NextResponse } from 'next/server'
import { listAuditLogs } from '@/lib/audit-log'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const logs = await listAuditLogs()
    return NextResponse.json({ logs })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
