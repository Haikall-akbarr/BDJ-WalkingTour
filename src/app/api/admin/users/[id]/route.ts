import { NextRequest, NextResponse } from 'next/server'
import { getUserById, upsertUser, deleteUserById } from '@/lib/auth-store'
import { hashPassword } from '@/lib/auth-session'
import { requireAdmin } from '@/lib/api-auth-guard'

export const runtime = 'nodejs'

// Allowed roles that can be assigned
const ALLOWED_ROLES = ['user', 'guide', 'owner'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params
    const body = await request.json()
    const patch: any = {}
    if (body?.name) patch.name = String(body.name)
    if (body?.role) {
      const role = String(body.role).toLowerCase();
      // Prevent role escalation to admin via API
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          { error: `Role "${role}" tidak diizinkan via API.` },
          { status: 400 }
        );
      }
      patch.role = role;
    }
    if (typeof body?.isActive !== 'undefined') patch.isActive = Boolean(body.isActive)
    if (body?.password) patch.passwordHash = await hashPassword(String(body.password))

    const existing = await getUserById(id)
    if (!existing) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

    const merged = {
      id: existing.id,
      email: existing.email,
      name: patch.name || existing.name,
      role: patch.role || existing.role,
      passwordHash: patch.passwordHash || existing.passwordHash,
      isActive: typeof patch.isActive === 'undefined' ? existing.isActive : patch.isActive,
    }

    const user = await upsertUser(merged as any)

    // Sanitize output
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      } : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params
    const ok = await deleteUserById(id)
    if (!ok) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
