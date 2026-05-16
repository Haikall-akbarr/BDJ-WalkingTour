import { NextRequest, NextResponse } from 'next/server'
import { getUserById, upsertUser, deleteUserById } from '@/lib/mysql-auth-store'
import { hashPassword } from '@/lib/auth-session'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const patch: any = {}
    if (body?.name) patch.name = String(body.name)
    if (body?.role) patch.role = String(body.role)
    if (typeof body?.isActive !== 'undefined') patch.isActive = Boolean(body.isActive)
    if (body?.password) patch.passwordHash = hashPassword(String(body.password))

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
    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ok = await deleteUserById(id)
    if (!ok) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
