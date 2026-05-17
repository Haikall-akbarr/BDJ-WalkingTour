"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CalendarDays, Clock3, Loader2, MapPin, Sparkles, Users } from "lucide-react"
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
  imageHint?: string
  imageUrl?: string
}

const CURATED_TOURS: TourItem[] = [
  {
    id: "pacinan-walking-tour",
    name: "Pacinan Walking Tour",
    price: 65000,
    date: "Minggu, 12 Okt",
    distance: "3 KM",
    duration: "2 Jam",
    description: "Rute heritage dengan cerita komunitas Tionghoa, bangunan tua, dan suasana kota lama yang khas.",
    imageHint: "historical building",
  },
  {
    id: "susur-sungai-martapura",
    name: "Susur Sungai Martapura",
    price: 85000,
    date: "Sabtu, 18 Okt",
    distance: "5 KM",
    duration: "3 Jam",
    description: "Perjalanan santai menyusuri alur sungai, pasar air, dan ritme harian warga Banjarmasin.",
    imageHint: "river landscape",
  },
  {
    id: "wisata-religi-kubah-basirih",
    name: "Wisata Religi Kubah Basirih",
    price: 50000,
    date: "Jumat, 24 Okt",
    distance: "2 KM",
    duration: "1.5 Jam",
    description: "Rute singkat menuju situs religi yang tenang, cocok untuk tur tematik dan refleksi budaya.",
    imageHint: "mosque architecture",
  },
  {
    id: "heritage-port-side",
    name: "Heritage Port Side",
    price: 72000,
    date: "Sabtu, 1 Nov",
    distance: "4 KM",
    duration: "2.5 Jam",
    description: "Menjelajah sisi pelabuhan lama, gudang bersejarah, dan kisah perdagangan sungai.",
    imageHint: "harbor city",
  },
  {
    id: "kampung-melayu-storywalk",
    name: "Kampung Melayu Storywalk",
    price: 68000,
    date: "Minggu, 9 Nov",
    distance: "3.5 KM",
    duration: "2 Jam",
    description: "Jalan kaki di gang kecil dan rumah lama sambil mendengar cerita tradisi lokal yang masih hidup.",
    imageHint: "old neighborhood",
  },
  {
    id: "river-market-heritage",
    name: "River Market Heritage",
    price: 76000,
    date: "Sabtu, 15 Nov",
    distance: "4 KM",
    duration: "2 Jam",
    description: "Tur berirama pasar sungai untuk melihat kuliner, aktivitas dagang, dan arus wisata lokal.",
    imageHint: "floating market",
  },
  {
    id: "city-core-night-walk",
    name: "City Core Night Walk",
    price: 69000,
    date: "Jumat, 21 Nov",
    distance: "3 KM",
    duration: "2 Jam",
    description: "Jelajah malam di pusat kota dengan pencahayaan bangunan heritage dan suasana yang lebih tenang.",
    imageHint: "city night",
  },
  {
    id: "culture-river-loop",
    name: "Culture River Loop",
    price: 90000,
    date: "Sabtu, 29 Nov",
    distance: "6 KM",
    duration: "3.5 Jam",
    description: "Rute terpanjang untuk peserta yang ingin kombinasi budaya, kuliner, dan lanskap sungai.",
    imageHint: "river walkway",
  },
]

export default function ToursPage() {
  const [apiTours, setApiTours] = useState<TourItem[]>([])
  const [loading, setLoading] = useState(true)

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
    const merged = new Map<string, TourItem>()

    for (const item of CURATED_TOURS) {
      merged.set(item.id, item)
    }

    for (const item of apiTours) {
      merged.set(item.id, {
        ...merged.get(item.id),
        ...item,
      })
    }

    return Array.from(merged.values())
  }, [apiTours])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] text-zinc-900">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="overflow-hidden rounded-[34px] bg-[#10221f] text-white shadow-[0_24px_80px_rgba(16,34,31,0.16)]">
          <div className="grid gap-6 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Katalog Tur
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black uppercase leading-tight md:text-6xl">
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

            <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-black text-white">{tours.length}</p>
                <p className="mt-1 uppercase tracking-[0.25em] text-white/55">Paket Tur</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-black text-white">3-4h</p>
                <p className="mt-1 uppercase tracking-[0.25em] text-white/55">Rata-rata Durasi</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-black text-white">Local</p>
                <p className="mt-1 uppercase tracking-[0.25em] text-white/55">Guide Berpengalaman</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-black text-white">QR</p>
                <p className="mt-1 uppercase tracking-[0.25em] text-white/55">Payment & Barcode</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour, index) => {
            const fallbackImage = PlaceHolderImages[index % PlaceHolderImages.length]

            return (
              <Card key={tour.id} className="group overflow-hidden rounded-[28px] border-none bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(16,34,31,0.14)]">
                <div className="relative h-56 overflow-hidden">
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
                    <Badge className="rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#98DDCA]">Rp {Number(tour.price || 0).toLocaleString("id-ID")}</Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h2 className="text-2xl font-black leading-tight">{tour.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">
                      {tour.description || "Tur pilihan dengan pengalaman lokal yang terkurasi."}
                    </p>
                  </div>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 md:grid-cols-3">
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><CalendarDays className="h-4 w-4 text-[#16302c]" /> {tour.date || "Jadwal Fleksibel"}</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><Clock3 className="h-4 w-4 text-[#16302c]" /> {tour.duration || "2 Jam"}</span>
                    <span className="inline-flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2"><Users className="h-4 w-4 text-[#16302c]" /> Grup Kecil</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Rute Populer</p>
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
      </section>
    </div>
  )
}
