import { NextResponse } from 'next/server'
import { listAuditLogs } from '@/lib/audit-log'
import { requireAdmin } from '@/lib/api-auth-guard'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const logs = await listAuditLogs()
    return NextResponse.json({ logs })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
