import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { updateUserProfile } from '@/lib/auth-store';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Database tidak aktif.' }, { status: 503 });
    }

    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, emergencyContact, address } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1)) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 });
    }

    if (name !== undefined && name.trim().length > 100) {
      return NextResponse.json({ error: 'Nama maksimal 100 karakter.' }, { status: 400 });
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Nomor telepon tidak valid.' }, { status: 400 });
    }

    if (address !== undefined && typeof address !== 'string') {
      return NextResponse.json({ error: 'Alamat tidak valid.' }, { status: 400 });
    }

    if (emergencyContact !== undefined && typeof emergencyContact !== 'string') {
      return NextResponse.json({ error: 'Kontak darurat tidak valid.' }, { status: 400 });
    }

    const updateData: { name?: string; phone?: string; emergencyContact?: string; address?: string } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact.trim();
    if (address !== undefined) updateData.address = address.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 });
    }

    const updated = await updateUserProfile(sessionUser.id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updated ? {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        phone: updated.phone || '',
        emergencyContact: updated.emergencyContact || '',
        address: updated.address || '',
      } : null,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui profil.' },
      { status: 500 }
    );
  }
}
