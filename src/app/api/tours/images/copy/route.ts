import { NextRequest, NextResponse } from 'next/server'
import { getMySqlPool } from '@/lib/mysql'
import { generateId } from '@/lib/file-storage'
import { isDatabaseProviderEnabled, isSupabaseProvider } from '@/lib/database-provider'
import { getSupabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/tours/images/copy
 * Body: { sourceTourId: string, targetTourId: string }
 *
 * Copies all tour_images rows from sourceTourId to targetTourId.
 * The actual image files in storage are NOT duplicated – only new DB rows
 * pointing to the same URLs are created.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database belum aktif.' }, { status: 400 })
    }

    const body = await request.json()
    const sourceTourId = String(body?.sourceTourId || '')
    const targetTourId = String(body?.targetTourId || '')

    if (!sourceTourId || !targetTourId) {
      return NextResponse.json({ error: 'sourceTourId dan targetTourId wajib disertakan.' }, { status: 400 })
    }

    const copied: any[] = []

    if (isSupabaseProvider()) {
      const admin = getSupabaseAdmin()

      // Fetch all images from the source tour
      const { data: sourceImages, error: fetchError } = await admin
        .from('tour_images')
        .select('*')
        .eq('tour_id', sourceTourId)

      if (fetchError) throw fetchError

      if (!sourceImages || sourceImages.length === 0) {
        return NextResponse.json({ ok: true, images: [], message: 'Tur sumber tidak memiliki gambar.' })
      }

      // Insert copies pointing to the same URLs but with the new tour ID
      for (const img of sourceImages) {
        const newId = randomUUID()
        const { error: insertError } = await admin.from('tour_images').insert({
          id: newId,
          tour_id: targetTourId,
          url: img.url,
          filename: img.filename,
          is_cover: img.is_cover,
          uploaded_by: null,
          uploaded_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error('[copy-images] Insert error:', insertError.message)
          continue
        }

        copied.push({
          id: newId,
          tourId: targetTourId,
          url: img.url,
          filename: img.filename,
          isCover: Boolean(img.is_cover),
        })
      }

      return NextResponse.json({ ok: true, images: copied })
    }

    // MySQL path
    const pool = getMySqlPool()

    const [rows] = await pool.execute(
      `SELECT * FROM tour_images WHERE tour_id = ?`,
      [sourceTourId]
    ) as any[]

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: true, images: [], message: 'Tur sumber tidak memiliki gambar.' })
    }

    for (const img of rows) {
      const newId = generateId()
      const isCover = img.is_cover ? 1 : 0

      await pool.execute(
        `INSERT INTO tour_images (id, tour_id, url, filename, is_cover, uploaded_by, uploaded_at)
         VALUES (?, ?, ?, ?, ?, NULL, NOW())`,
        [newId, targetTourId, img.url, img.filename, isCover]
      )

      copied.push({
        id: newId,
        tourId: targetTourId,
        url: img.url,
        filename: img.filename,
        isCover: Boolean(img.is_cover),
      })
    }

    return NextResponse.json({ ok: true, images: copied })
  } catch (err: any) {
    console.error('[copy-images] Error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
