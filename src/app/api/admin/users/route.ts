import { NextRequest, NextResponse } from 'next/server'
import { listUsers, upsertUser } from '@/lib/auth-store'
import { hashPassword } from '@/lib/auth-session'
import { requireAdmin } from '@/lib/api-auth-guard'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

// Allowed roles that can be assigned via this endpoint
const ALLOWED_ROLES = ['user', 'guide', 'owner'];

export async function GET(request: NextRequest) {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const role = String(request.nextUrl.searchParams.get('role') || '').trim().toLowerCase()
    const users = await listUsers()
    const filtered = role ? users.filter((user) => String(user.role || '').toLowerCase() === role) : users

    // Sanitize output: never expose password hashes
    const sanitized = filtered.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({ users: sanitized })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const name = String(body?.name || '').trim() || email
    const role = String(body?.role || 'user').trim().toLowerCase()

    if (!email) return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })

    // ── Prevent creating admin accounts via API ──
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role "${role}" tidak diizinkan. Role yang tersedia: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const password = body?.password || (`${Math.random().toString(36).slice(2, 10)}A!`)
    const passwordHash = await hashPassword(String(password))

    const user = await upsertUser({ email, name, role, passwordHash })

    // Do NOT send password via email for security
    // Do NOT return password in response
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      } : null,
      message: 'User berhasil dibuat. Password dikirim secara terpisah.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
