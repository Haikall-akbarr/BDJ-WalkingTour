import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUserPasswordHash } from '@/lib/auth-store'
import { hashPassword } from '@/lib/auth-session'
import { sendEmail } from '@/lib/email'
import { requireAdmin } from '@/lib/api-auth-guard'

export const runtime = 'nodejs'

function makeTempPassword() {
  return `${Math.random().toString(36).slice(2, 10)}A!`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ── Auth check: admin only ──
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
      await updateUserPasswordHash(user.id, await hashPassword(password))
    }

    const baseUrl = process.env.APP_BASE_URL || ''
    const html = `
      <p>Halo ${user.name || user.email},</p>
      <p>Password akun BDJ WalkingTour Anda telah direset oleh administrator.</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Password Sementara:</strong> ${password}</p>
      <p>Silakan login dan segera ganti password Anda melalui halaman profil.</p>
      ${baseUrl ? `<p>Login di <a href="${baseUrl}">${baseUrl}</a></p>` : ''}
      <p style="font-size:12px;color:#999;">Jika Anda tidak meminta reset ini, segera hubungi administrator.</p>
    `

    let emailWarning = ''
    try {
      await sendEmail(user.email, 'Password akun BDJ WalkingTour direset', html)
    } catch (emailErr: any) {
      console.error('Failed to send credentials email:', emailErr)
      emailWarning = ` Email gagal dikirim: ${emailErr.message}`
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      password, // Frontend needs this to display in the Credentials Modal
      message: 'Password berhasil direset.' + emailWarning,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
