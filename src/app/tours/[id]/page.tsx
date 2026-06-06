"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Map, 
  Compass, 
  Loader2, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Utensils, 
  Building2, 
  Info 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"

type TourItem = {
  id: string
  name: string
  price: number
  date?: string
  description?: string
  distance?: string
  duration?: string
  imageUrl?: string
  imageHint?: string
  descriptionFull?: string
  historyCulture?: string
  historyHighlights?: string
  routeDetail?: string
  routeMapUrl?: string
  poiList?: string
  images?: Array<{ id: string; url: string; filename: string; isCover: boolean }>
}



export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params)
  const tourId = unwrappedParams.id

  const router = useRouter()
  const [tour, setTour] = useState<TourItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSupabaseStorageUrl = (value?: string) =>
    typeof value === "string" && value.includes(".supabase.co/storage/v1/object/public/")

  useEffect(() => {
    let mounted = true

    const loadTourDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/tours/${tourId}`, { cache: "no-store" })
        const result = await response.json()

        if (mounted) {
          if (response.ok && result?.tour) {
            setTour(result.tour)
          } else {
            setError("Detail paket tur tidak ditemukan.")
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Gagal memuat detail tur.")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadTourDetails()

    return () => {
      mounted = false
    }
  }, [tourId])

  const parsedHighlights = useMemo(() => {
    if (!tour?.historyHighlights) return []
    try {
      return JSON.parse(tour.historyHighlights)
    } catch {
      return []
    }
  }, [tour?.historyHighlights])

  const parsedPois = useMemo(() => {
    if (!tour?.poiList) return []
    try {
      return JSON.parse(tour.poiList)
    } catch {
      return []
    }
  }, [tour?.poiList])

  // Select documentation photos from images (exclude cover or pick the rest)
  const docPhotos = useMemo(() => {
    if (!tour) return []
    if (tour.images && tour.images.length > 0) {
      // Return images that are not cover, or take up to 4 images
      const gallery = tour.images.filter(img => !img.isCover)
      if (gallery.length > 0) return gallery.slice(0, 4)
      return tour.images.slice(0, 4)
    }
    // Static Fallback pictures
    return PlaceHolderImages.slice(2, 6).map((img, index) => ({
      id: `fallback-img-${index}`,
      url: img.imageUrl,
      filename: img.imageHint,
      isCover: false
    }))
  }, [tour])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecece7]">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#10221f]" />
          <p className="text-sm font-medium text-zinc-600">Memuat detail paket tur...</p>
        </div>
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ecece7] px-4">
        <Card className="max-w-md w-full rounded-[28px] border-none bg-white p-8 text-center shadow-md">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-red-600">Terjadi Kesalahan</h2>
            <p className="text-zinc-600">{error || "Tur tidak ditemukan."}</p>
            <Button className="rounded-full bg-[#10221f] text-white hover:bg-[#1a3531]" onClick={() => router.push("/tours")}>
              Kembali ke Katalog
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-zinc-950">
      {/* Dynamic Cover Header Banner */}
      <header className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden bg-zinc-900">
        {isSupabaseStorageUrl(tour.imageUrl) ? (
          <img
            src={tour.imageUrl}
            alt={tour.name}
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
        ) : (
          <Image
            src={tour.imageUrl || PlaceHolderImages[0].imageUrl}
            alt={tour.name}
            fill
            className="object-cover opacity-75 animate-fade-in"
            priority
          />
        )}
        {/* Soft elegant gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f4ee] via-black/30 to-black/60" />
        
        {/* Top Navbar items inside header */}
        <div className="absolute top-6 left-4 right-4 md:left-8 md:right-8 flex justify-between items-center z-15">
          <Link href="/tours">
            <Button variant="outline" className="rounded-full bg-white/20 hover:bg-white/30 text-white border-white/25 backdrop-blur-md px-4 py-2 gap-2 h-9 text-xs">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          </Link>
          <Badge className="rounded-full bg-[#98DDCA] text-[#10221f] font-bold hover:bg-[#98DDCA] px-3 py-1 text-xs">
            ID: {tour.id}
          </Badge>
        </div>

        {/* Banner Details Text (Bottom Left Align) */}
        <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 z-15 text-zinc-950">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#10221f] leading-none drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.7)]">
              {tour.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-zinc-800">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#10221f]" /> Banjarmasin, Kalimantan Selatan</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="rounded-full bg-[#10221f]/90 text-white hover:bg-[#10221f]/90 px-3.5 py-1.5 font-bold inline-flex items-center gap-1.5 text-xs">
              <Map className="h-3.5 w-3.5 text-[#98DDCA]" /> {tour.distance || "3 KM"}
            </Badge>
            <Badge className="rounded-full bg-[#10221f]/90 text-white hover:bg-[#10221f]/90 px-3.5 py-1.5 font-bold inline-flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-[#98DDCA]" /> {tour.duration || "2 Jam"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 md:gap-8 items-start">
          
          {/* Left Column (Descriptions, History, Route Details) */}
          <div className="space-y-6 md:space-y-8">
            {/* Full Description Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Deskripsi Lengkap Tur
              </h2>
              <div className="text-zinc-700 text-sm md:text-base leading-relaxed space-y-4 whitespace-pre-line">
                {tour.descriptionFull || tour.description || "Tidak ada detail deskripsi untuk paket tur ini."}
              </div>
            </Card>

            {/* History & Culture Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Sejarah & Budaya
              </h2>
              <div className="text-zinc-700 text-sm md:text-base leading-relaxed mb-6 whitespace-pre-line">
                {tour.historyCulture || "Informasi latar belakang sejarah untuk kawasan rute ini belum ditambahkan."}
              </div>

              {/* Highlights section inside History */}
              {parsedHighlights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {parsedHighlights.map((hl: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="h-8 w-8 rounded-full bg-[#98DDCA]/40 text-[#10221f] flex items-center justify-center shrink-0">
                        {idx % 2 === 0 ? <Building2 className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-[#10221f] leading-snug">{hl.title}</p>
                        <p className="text-xs text-zinc-600 leading-normal">{hl.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Route Detail Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Detail Rute Maps
              </h2>
              <div className="text-zinc-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                {tour.routeDetail || "Informasi rute perjalanan jalan kaki belum ditambahkan."}
              </div>
            </Card>
          </div>

          {/* Right Column (Map, Points of Interest, Gallery) */}
          <div className="space-y-6 md:space-y-8">
            {/* Map & Visits Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Peta Rute & Titik Kunjungan
              </h2>
              
              {/* Map/Route Embed or Image */}
              <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 mb-6 flex items-center justify-center">
                {tour.routeMapUrl ? (
                  tour.routeMapUrl.includes('google.com/maps') || tour.routeMapUrl.includes('maps.google.com') ? (
                    <iframe
                      src={tour.routeMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      title={`Peta Rute ${tour.name}`}
                    ></iframe>
                  ) : (
                    <img
                      src={tour.routeMapUrl}
                      alt="Rute Peta"
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Compass className="mx-auto h-10 w-10 text-zinc-400 stroke-1" />
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Visual Peta Belum Ditambahkan</p>
                    <p className="text-[10px] text-zinc-400 max-w-[200px] mx-auto leading-normal">Admin dapat menambahkan link Google Maps di CRUD Dashboard admin.</p>
                  </div>
                )}
              </div>

              {/* Numbered POIs List */}
              {parsedPois.length > 0 ? (
                <div className="space-y-3">
                  {parsedPois.map((poi: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-semibold py-1 border-b border-zinc-50 last:border-none">
                      <span className="h-6 w-6 rounded-full bg-[#10221f] text-white flex items-center justify-center text-[10px] shrink-0 font-black">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-800">{poi}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-zinc-50 rounded-2xl text-xs text-zinc-500 font-medium">
                  Belum ada titik kunjungan POI yang terdaftar.
                </div>
              )}
            </Card>

            {/* Gallery documentation photos */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Dokumentasi Foto Tour
              </h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {docPhotos.map((img: any, idx: number) => (
                  <div key={img.id || idx} className="relative h-28 overflow-hidden rounded-xl bg-zinc-100 group border">
                    <img
                      src={img.url}
                      alt={img.filename || `Doc ${idx + 1}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Booking CTA Banner */}
        <section className="rounded-[30px] bg-[#10221f] text-white p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left z-10">
            <Badge className="w-fit rounded-full bg-white/10 text-[#98DDCA] hover:bg-white/10 text-[10px] uppercase font-bold tracking-widest px-3 py-1">
              Booking Slot
            </Badge>
            <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight">
              Siap untuk menjelajah?
            </h2>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-lg">
              Amankan slot Anda sekarang untuk pengalaman budaya tak terlupakan menyusuri keindahan sejarah kota bersama guide lokal berpengalaman.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 z-10 w-full sm:w-auto justify-center">
            <div className="text-center sm:text-right">
              <p className="text-[10px] text-white/55 uppercase tracking-widest">Mulai Dari</p>
              <p className="text-2xl font-black text-[#98DDCA]">Rp {tour.price?.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-white/55 uppercase tracking-widest">per pax</p>
            </div>
            <Link href={`/book/${tour.id}`} className="w-full sm:w-auto">
              <Button className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] font-black text-xs md:text-sm px-6 py-5 gap-2 shadow-md">
                Pesan Tur Ini Sekarang <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Simple design decor shapes */}
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 -mr-16 -mt-16 blur-2xl" />
          <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-[#98DDCA]/5 -ml-16 -mb-16 blur-2xl" />
        </section>
      </main>
    </div>
  )
}
