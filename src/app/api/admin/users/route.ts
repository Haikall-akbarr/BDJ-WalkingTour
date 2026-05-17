import { NextRequest, NextResponse } from 'next/server'
import { listUsers, upsertUser } from '@/lib/auth-store'
import { hashPassword } from '@/lib/auth-session'
import { sendEmail } from '@/lib/email'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const role = String(request.nextUrl.searchParams.get('role') || '').trim().toLowerCase()
    const users = await listUsers()
    const filtered = role ? users.filter((user) => String(user.role || '').toLowerCase() === role) : users
    return NextResponse.json({ users: filtered })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const name = String(body?.name || '').trim() || email
    const role = String(body?.role || 'user')

    if (!email) return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })

    const password = body?.password || (`${Math.random().toString(36).slice(2, 10)}A!`)
    const passwordHash = hashPassword(String(password))

    const user = await upsertUser({ email, name, role, passwordHash })

    // Send email with credentials (best-effort)
    try {
      const html = `
        <p>Halo ${name},</p>
        <p>Akun Anda telah dibuat di BDJ WalkingTour.</p>
        <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
        <p>Silakan login di <a href="${process.env.APP_BASE_URL || '/'}">${process.env.APP_BASE_URL || ''}</a></p>
      `
      await sendEmail(email, 'Akun BDJ WalkingTour dibuat', html)
    } catch (e) {
      // ignore send error
    }

    return NextResponse.json({ user, password })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
