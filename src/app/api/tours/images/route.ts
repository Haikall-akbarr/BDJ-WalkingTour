import { NextRequest, NextResponse } from 'next/server'
import { getMySqlPool } from '@/lib/mysql'
import { saveBase64TourImage, generateId } from '@/lib/file-storage'
import { isSupabaseProvider } from '@/lib/database-provider'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tourId = String(body?.tourId || '')
    const images = Array.isArray(body?.images) ? body.images : []

    if (!tourId) return NextResponse.json({ error: 'tourId wajib disertakan.' }, { status: 400 })
    if (images.length === 0) return NextResponse.json({ error: 'Tidak ada gambar untuk diupload.' }, { status: 400 })

    const inserted: any[] = []

    if (isSupabaseProvider()) {
      const admin = getSupabaseAdmin()
      const bucketName = 'tour-images'

      try {
        await admin.storage.createBucket(bucketName, { public: true })
      } catch {
        // bucket may already exist
      }

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const filename = String(img.filename || `image-${i}.jpg`)
        const base64 = String(img.data || '')
        if (!base64) continue

        const safeName = `${tourId}/${Date.now()}-${filename.replace(/[^a-z0-9._-]/gi, '-')}`
        const buffer = Buffer.from(base64, 'base64')
        const contentType = filename.toLowerCase().endsWith('.png') ? 'image/png' : filename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'

        const { error: uploadError } = await admin.storage.from(bucketName).upload(safeName, buffer, {
          contentType,
          upsert: true,
        })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = admin.storage.from(bucketName).getPublicUrl(safeName)
        const url = publicUrlData.publicUrl

        const id = generateId()
        const isCover = i === 0

        const { error: insertError } = await admin.from('tour_images').insert({
          id,
          tour_id: tourId,
          url,
          filename,
          is_cover: isCover,
          uploaded_by: null,
          uploaded_at: new Date().toISOString(),
        })

        if (insertError) {
          throw insertError
        }

        inserted.push({ id, tourId, url, filename, isCover })
      }

      return NextResponse.json({ ok: true, images: inserted })
    }

    const pool = getMySqlPool()

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
