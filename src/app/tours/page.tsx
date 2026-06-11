"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CalendarDays, Clock3, Loader2, MapPin, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { FloatingNavbar } from "@/components/public/FloatingNavbar"
import { Footer } from "@/components/public/Footer"

type TourItem = {
  id: string
  name: string
  price: number
  date?: string
  description?: string
  distance?: string
  duration?: string
  imageHint?: string
  imageUrl?: string
  descriptionFull?: string
  priceHemat?: number
}


export default function ToursPage() {
  const [apiTours, setApiTours] = useState<TourItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  const isSupabaseStorageUrl = (value?: string) =>
    typeof value === "string" && value.includes(".supabase.co/storage/v1/object/public/")

  useEffect(() => {
    let mounted = true

    const loadTours = async () => {
      setLoading(true)

      try {
        const response = await fetch("/api/tours", { cache: "no-store" })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result?.error || "Gagal memuat tur.")
        }

        if (mounted) {
          setApiTours(Array.isArray(result?.tours) ? result.tours : [])
        }
      } catch {
        if (mounted) {
          setApiTours([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadTours()

    return () => {
      mounted = false
    }
  }, [])

  const tours = useMemo(() => {
    return apiTours
  }, [apiTours])

  const totalPages = Math.ceil(tours.length / itemsPerPage)

  const paginatedTours = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return tours.slice(startIndex, startIndex + itemsPerPage)
  }, [tours, currentPage])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] text-zinc-900">
      <FloatingNavbar />
      <section className="mx-auto w-full px-4 py-8 pt-32 md:px-8 md:py-12 md:pt-36">
        <div className="w-full overflow-hidden rounded-[34px] bg-[#10221f] text-white shadow-[0_24px_80px_rgba(16,34,31,0.16)]">
          <div className="grid gap-6 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Katalog Tur
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
                Semua Tur BDJ WalkingTour dalam satu halaman
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/75 md:text-base">
                Pilih rute favorit, baca deskripsi singkat, dan lanjutkan ke pemesanan tanpa perlu kembali ke beranda.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/book/new">
                  <Button className="rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
                    Pesan Tur <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative h-48 w-72 sm:h-56 sm:w-80">
                <Image
                  src="/bekantan_3.png"
                  alt="Mascot 3 Bekantan"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
          {paginatedTours.map((tour, index) => {
            const fallbackImage = PlaceHolderImages[index % PlaceHolderImages.length]

            return (
              <Card key={tour.id} className="group overflow-hidden rounded-[28px] border-none bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(16,34,31,0.14)]">
                <Link href={`/tours/${tour.id}`}>
                  <div className="relative h-56 overflow-hidden cursor-pointer">
                    {isSupabaseStorageUrl(tour.imageUrl) ? (
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Image
                        src={tour.imageUrl || fallbackImage.imageUrl}
                        alt={tour.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        data-ai-hint={tour.imageHint || fallbackImage.imageHint}
                      />
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,34,31,0.05)_0%,rgba(16,34,31,0.78)_100%)]" />
                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
                      <Badge className="rounded-full bg-white/12 text-white hover:bg-white/12">{tour.distance || "3 KM"}</Badge>
                      <Badge className="rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#98DDCA]">Rp {Number(tour.priceHemat != null && tour.priceHemat < (tour.price || 0) ? tour.priceHemat : (tour.price || 0)).toLocaleString("id-ID")}</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h2 className="text-2xl font-bold leading-tight">{tour.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">
                        {tour.description || tour.descriptionFull || "Tur pilihan dengan pengalaman lokal yang terkurasi."}
                      </p>
                    </div>
                  </div>
                </Link>

                <CardContent className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 md:grid-cols-3">
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><CalendarDays className="h-4 w-4 text-[#16302c]" /> {tour.date || "Jadwal Fleksibel"}</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><Clock3 className="h-4 w-4 text-[#16302c]" /> {tour.duration || "2 Jam"}</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><Users className="h-4 w-4 text-[#16302c]" /> Grup Kecil</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs tracking-[0.25em] text-zinc-500">Rute Populer</p>
                    <Link href={`/book/${tour.id}`}>
                      <Button className="rounded-full bg-[#10221f] text-white hover:bg-[#0b1715]">
                        Pesan Sekarang
                      </Button>
                    </Link>
                  </div>

                  {loading && index === 0 && (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Memuat daftar terbaru dari database...
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-6 text-sm font-medium select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`transition-colors duration-200 ${
                currentPage === 1
                  ? "text-zinc-400 cursor-not-allowed"
                  : "text-zinc-600 hover:text-zinc-900 font-semibold"
              }`}
            >
              Kembali
            </button>

            <div className="flex items-center gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-[#10221f] text-white shadow-md"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`transition-colors duration-200 ${
                currentPage === totalPages
                  ? "text-zinc-400 cursor-not-allowed"
                  : "text-[#10221f] hover:text-[#1c3c36] font-bold"
              }`}
            >
              Selanjutnya
            </button>
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}

