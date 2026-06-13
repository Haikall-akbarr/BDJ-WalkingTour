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
  ChevronLeft,
  Utensils, 
  Building2, 
  Info 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { FloatingNavbar } from "@/components/public/FloatingNavbar"
import { Footer } from "@/components/public/Footer"
import { Maximize2 } from "lucide-react"

type TourItem = {
  id: string
  name: string
  price: number
  priceHemat?: number | null
  priceRegulerDesc?: string | null
  priceHematDesc?: string | null
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
  const [selectedDocIdx, setSelectedDocIdx] = useState<number | null>(null)

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

  const renderText = (text: string) => {
    if (!text) return null;
    return text.split(/\n\s*\n/).map((paragraph, idx) => (
      <p key={idx} className="mb-4 last:mb-0 text-justify">
        {paragraph.replace(/\n/g, ' ')}
      </p>
    ));
  }

  // Select all photos (cover + documentation)
  const allPhotos = useMemo(() => {
    if (!tour) return []
    const coverUrl = tour.imageUrl || PlaceHolderImages[0].imageUrl
    const coverObj = { id: 'cover', url: coverUrl, filename: tour.name, isCover: true }
    
    if (tour.images && tour.images.length > 0) {
      const cover = tour.images.find(img => img.isCover) || tour.images[0]
      const gallery = tour.images.filter(img => img.id !== cover.id)
      return [cover, ...gallery]
    }
    
    // Static Fallback pictures
    const fallbackGallery = PlaceHolderImages.slice(2, 6).map((img, index) => ({
      id: `fallback-img-${index}`,
      url: img.imageUrl,
      filename: img.imageHint,
      isCover: false
    }))
    return [coverObj, ...fallbackGallery]
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
      <FloatingNavbar />
      {/* Dynamic Cover Header Banner */}
      <header className="relative w-full h-[45vh] md:h-[55vh] overflow-hidden bg-zinc-900 group">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedDocIdx(0)}>
              {isSupabaseStorageUrl(tour.imageUrl) ? (
                <img
                  src={tour.imageUrl}
                  alt={tour.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <Image
                  src={tour.imageUrl || PlaceHolderImages[0].imageUrl}
                  alt={tour.name}
                  fill
                  className="object-cover animate-fade-in transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              )}
              {/* Overlay hover effect to indicate clickability */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              <div className="absolute right-6 top-24 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <Maximize2 className="h-5 w-5" />
              </div>
            </div>
      </header>

      {/* Tour Name & Info - Below the full photo */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 -mt-12 relative z-10">
        <div className="bg-[#f7f4ee] backdrop-blur-md p-5 md:p-7 rounded-3xl shadow-xl border border-white/20 w-fit">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#10221f] leading-none">
            {tour.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs md:text-sm font-bold text-[#10221f]">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#10221f]" /> Banjarmasin, Kalimantan Selatan</span>
            <Badge className="rounded-full bg-[#10221f] text-[#98DDCA] hover:bg-[#10221f] px-3.5 py-1.5 font-bold inline-flex items-center gap-1.5 text-xs shadow-sm border border-[#10221f]">
              <Map className="h-3.5 w-3.5 text-[#98DDCA]" /> {tour.distance || "3 KM"}
            </Badge>
            <Badge className="rounded-full bg-[#10221f] text-[#98DDCA] hover:bg-[#10221f] px-3.5 py-1.5 font-bold inline-flex items-center gap-1.5 text-xs shadow-sm border border-[#10221f]">
              <Clock className="h-3.5 w-3.5 text-[#98DDCA]" /> {tour.duration || "2 Jam"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 md:gap-8 items-start">
          
          {/* Left Column (Descriptions, History, Route Details) */}
          <div className="space-y-6 md:space-y-8">
            {/* Full Description Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Deskripsi
              </h2>
              <div className="text-zinc-700 text-sm md:text-base leading-relaxed">
                {renderText(tour.descriptionFull || tour.description || "Tidak ada detail deskripsi untuk paket tur ini.")}
              </div>
            </Card>

            {/* History & Culture Card */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Sejarah & Budaya
              </h2>
              <div className="text-zinc-700 text-sm md:text-base leading-relaxed mb-6">
                {renderText(tour.historyCulture || "Informasi latar belakang sejarah untuk kawasan rute ini belum ditambahkan.")}
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

            {/* Gallery documentation photos moved to Left Column */}
            <Card className="rounded-[24px] border-none bg-white p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-black uppercase text-[#10221f] tracking-wide border-b pb-3 mb-4">
                Dokumentasi Foto Tour
              </h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {allPhotos.slice(1, 5).map((img: any, idx: number) => (
                  <div 
                    key={img.id || idx} 
                    className="relative h-28 overflow-hidden rounded-xl bg-zinc-100 group border cursor-pointer"
                    onClick={() => setSelectedDocIdx(idx + 1)}
                  >
                    <img
                      src={img.url}
                      alt={img.filename || `Doc ${idx + 1}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={selectedDocIdx !== null} onOpenChange={(v) => !v && setSelectedDocIdx(null)}>
                <DialogContent className="max-w-4xl border-none bg-transparent shadow-none p-0 flex items-center justify-center" closeClassName="bg-red-500 text-white hover:bg-red-600 hover:text-white opacity-100 right-2 top-2 z-50">
                  <DialogTitle className="sr-only">Galeri Dokumentasi Tur</DialogTitle>
                  {selectedDocIdx !== null && (
                    <div className="relative w-full aspect-video md:aspect-[21/9] flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDocIdx(prev => prev! > 0 ? prev! - 1 : allPhotos.length - 1); }}
                        className="absolute left-2 md:left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                      </button>
                      <img 
                        src={allPhotos[selectedDocIdx].url} 
                        alt={allPhotos[selectedDocIdx].filename || `Foto ${selectedDocIdx + 1}`} 
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDocIdx(prev => prev! < allPhotos.length - 1 ? prev! + 1 : 0); }}
                        className="absolute right-2 md:right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                          {selectedDocIdx + 1} / {allPhotos.length}
                        </span>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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

            {/* Documentation photos have been moved to the left column */}
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
              <p className="text-2xl font-black text-[#98DDCA]">Rp {((tour.priceHemat != null && tour.priceHemat < tour.price) ? tour.priceHemat : tour.price)?.toLocaleString('id-ID')}</p>
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
      <Footer />
    </div>
  )
}
