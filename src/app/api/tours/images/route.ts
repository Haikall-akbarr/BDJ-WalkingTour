import { NextRequest, NextResponse } from 'next/server'
import { getMySqlPool } from '@/lib/mysql'
import { saveBase64TourImage, generateId } from '@/lib/file-storage'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tourId = String(body?.tourId || '')
    const images = Array.isArray(body?.images) ? body.images : []

    if (!tourId) return NextResponse.json({ error: 'tourId wajib disertakan.' }, { status: 400 })
    if (images.length === 0) return NextResponse.json({ error: 'Tidak ada gambar untuk diupload.' }, { status: 400 })

    const pool = getMySqlPool()
    const inserted: any[] = []

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const filename = String(img.filename || `image-${i}.jpg`)
      const base64 = String(img.data || '')
      if (!base64) continue

      const url = await saveBase64TourImage(tourId, filename, base64)

      const id = generateId()
      const isCover = i === 0 ? 1 : 0
      await pool.execute(
        `INSERT INTO tour_images (id, tour_id, url, filename, is_cover, uploaded_by, uploaded_at)
         VALUES (?, ?, ?, ?, ?, NULL, NOW())`,
        [id, tourId, url, filename, isCover]
      )

      inserted.push({ id, tourId, url, filename, isCover })
    }

    return NextResponse.json({ ok: true, images: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
