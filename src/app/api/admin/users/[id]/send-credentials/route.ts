import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUserPasswordHash } from '@/lib/auth-store'
import { hashPassword } from '@/lib/auth-session'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

function makeTempPassword() {
  return `${Math.random().toString(36).slice(2, 10)}A!`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const user = await getUserById(id)
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

    const shouldRotatePassword = body?.rotatePassword !== false
    const password = String(body?.password || (shouldRotatePassword ? makeTempPassword() : ''))

    if (!password) {
      return NextResponse.json({ error: 'Password tidak tersedia.' }, { status: 400 })
    }

    if (shouldRotatePassword) {
      await updateUserPasswordHash(user.id, hashPassword(password))
    }

    const baseUrl = process.env.APP_BASE_URL || ''
    const html = `
      <p>Halo ${user.name || user.email},</p>
      <p>Berikut kredensial akun BDJ WalkingTour Anda:</p>
      <p><strong>Email:</strong> ${user.email}<br/><strong>Password:</strong> ${password}</p>
      ${baseUrl ? `<p>Login di <a href="${baseUrl}">${baseUrl}</a></p>` : ''}
    `

    await sendEmail(user.email, 'Kredensial akun BDJ WalkingTour', html)

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, password })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
