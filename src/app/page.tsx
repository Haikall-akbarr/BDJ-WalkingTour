"use client"

import { useMemo, useState, useEffect } from "react"
import { signOutFirebase } from "@/lib/firebaseClient"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, ArrowRight, Clock, Map, ArrowUpRight } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useSessionUser } from "@/hooks/use-session-user"
import { useToast } from "@/hooks/use-toast"
import { FloatingNavbar } from "@/components/public/FloatingNavbar"
import { Footer } from "@/components/public/Footer"

const STATIC_TOURS = [
  {
    id: "st-1",
    name: "Pacinan Walking Tour",
    price: 65000,
    description: "Menelusuri jejak kawasan heritage Pacinan dengan cerita perdagangan, arsitektur lama, dan spot foto klasik.",
    distance: "3 KM",
    duration: "2 Jam",
    date: "Minggu, 12 Okt",
    imageHint: "historical building",
  },
  {
    id: "st-2",
    name: "Susur Sungai Martapura",
    price: 85000,
    description: "Rute santai menyusuri tepian sungai, dermaga, dan kehidupan warga yang tumbuh bersama air.",
    distance: "5 KM",
    duration: "3 Jam",
    date: "Sabtu, 18 Okt",
    imageHint: "river landscape",
  },
  {
    id: "st-3",
    name: "Wisata Religi Kubah Basirih",
    price: 50000,
    description: "Perjalanan singkat ke situs religi yang tenang, cocok untuk tur tematik dan eksplorasi budaya.",
    distance: "2 KM",
    duration: "1.5 Jam",
    date: "Jumat, 24 Okt",
    imageHint: "mosque architecture",
  },
]

export default function LandingPage() {
  const { user, loading: authLoading } = useSessionUser()
  const { toast } = useToast()
  const [dbTours, setDbTours] = useState<any[]>([])
  const [toursLoading, setToursLoading] = useState(true)

  const isSupabaseStorageUrl = (value?: string) =>
    typeof value === "string" && value.includes(".supabase.co/storage/v1/object/public/")

  useEffect(() => {
    let mounted = true
    const loadTours = async () => {
      try {
        const response = await fetch("/api/tours", { cache: "no-store" })
        const result = await response.json()
        if (mounted && response.ok && Array.isArray(result?.tours)) {
          setDbTours(result.tours)
        }
      } catch (err) {
        console.error("Gagal memuat tur:", err)
      } finally {
        if (mounted) {
          setToursLoading(false)
        }
      }
    }
    loadTours()
    return () => {
      mounted = false
    }
  }, [])

  const allTours = useMemo(() => {
    return dbTours.length > 0 ? dbTours : STATIC_TOURS
  }, [dbTours])

  const tourShowcaseImages = useMemo(() => {
    const toursWithImages = allTours.filter((t: any) => t.imageUrl)
    return toursWithImages.slice(0, 3)
  }, [allTours])

  const heroImg = PlaceHolderImages.find((img) => img.id === "hero-bg")
  const showcaseImages = PlaceHolderImages.slice(0, 3)

  const stats = [
    { value: "20K+", label: "Travelers Hosted" },
    { value: "2K+", label: "Guided Walks" },
    { value: "5K+", label: "Trusted Reviews" },
  ]

  const handleLogout = async () => {
    try {
      await signOutFirebase()
    } catch (err) {
      console.error('Client signOut failed:', err)
    }
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }



  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] text-zinc-900">
      <FloatingNavbar />
      <main className="w-full space-y-8 md:space-y-12">
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-y border-black/5 md:min-h-[calc(100vh-4.5rem)]">
          {heroImg?.imageUrl && (
            <>
              <Image
                src={heroImg.imageUrl}
                alt="Hero background"
                fill
                className="object-cover"
                priority
                data-ai-hint="floating market"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,28,26,0.28)_0%,rgba(18,28,26,0.42)_35%,rgba(18,28,26,0.84)_100%)]" />
            </>
          )}

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-end px-4 py-6 md:min-h-[calc(100vh-4.5rem)] md:px-8 md:py-8">
              <div className="space-y-5">
                {/* Heritage Walks badge hidden - only shown in login form */}
                <h1 className="max-w-4xl text-5xl font-bold uppercase leading-[0.9] tracking-[0.08em] text-white sm:text-6xl md:text-7xl lg:text-[7.25rem]">
                  Banjarmasin
                  <span className="block text-[#98DDCA]">Walking Tour</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/88 md:text-lg text-white/80">
                  Rasakan keindahan sejarah, sungai, dan budaya kota seribu sungai melalui pengalaman berjalan kaki yang dipandu lokal berpengalaman.
                </p>
                {/* CTA buttons removed as requested */}
              </div>

            <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-3 md:pb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/15 bg-black/20 p-4 backdrop-blur-md md:p-5">
                  <p className="text-3xl font-bold text-white md:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] tracking-[0.25em] text-white/80 md:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-full px-4 md:px-8" id="tours">
          <div className="rounded-[34px] bg-white p-6 shadow-sm md:p-10">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-[0.25em] text-zinc-500">Pilihan Tur</p>
              <h2 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">
                Temukan Rute Favorit untuk Perjalanan Berikutnya
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 md:text-base">
                Pilih rute jalan kaki populer, lihat harga, dan pesan slot terbaik untuk jadwal kamu.
              </p>
              <Link href="/tours">
                <Button variant="outline" className="mt-5 rounded-full border-zinc-900 px-6 text-xs font-bold ">
                  Lihat Semua Tur
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {allTours.slice(0, 3).map((tour: any, index: number) => {
                const fallbackImage = PlaceHolderImages[index % PlaceHolderImages.length]
                return (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="group relative h-56 overflow-hidden rounded-3xl block cursor-pointer">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm font-bold truncate max-w-[150px] sm:max-w-[180px]">{tour.name}</p>
                        <p className="text-[10px] text-white/80">Rp {Number(tour.priceHemat != null && tour.priceHemat < (tour.price || 0) ? tour.priceHemat : (tour.price || 0)).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="rounded-full border border-white/50 bg-white/10 px-3 py-1 text-[10px] backdrop-blur-sm">Lihat Detail</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pilihan Destinasi - Swapped from Owner page */}
        <section className="mx-auto w-full max-w-full px-4 md:px-8">
          <div className="rounded-[34px] bg-white p-4 shadow-sm md:p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
              <div className="flex flex-col justify-between rounded-[28px] bg-[#10221f] p-6 text-white md:p-8">
                <div className="space-y-4">
                  <p className="text-[10px] tracking-[0.35em] text-white/60">Pilihan Destinasi</p>
                  <h2 className="max-w-xs text-3xl font-bold leading-[0.95] md:text-5xl lg:text-[3.75rem]">
                    Belum Tahu Mau Ke Mana?
                  </h2>
                  <p className="max-w-sm text-sm leading-7 text-white/75">
                    Jangan khawatir, kami menyiapkan pilihan rute dan pengalaman visual terbaik untuk inspirasi perjalanan berikutnya.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <Link href="/tours">
                    <Button className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
                      Jelajahi Rute
                    </Button>
                  </Link>
                  <p className="text-[11px] tracking-[0.3em] text-white/45">Setiap rute dimulai dari langkah yang tepat</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:h-[540px]">
                {/* Main large image */}
                <div className="relative overflow-hidden rounded-[24px] lg:col-span-2 lg:row-span-2">
                  <Image
                    src={tourShowcaseImages[0]?.imageUrl || PlaceHolderImages[0]?.imageUrl}
                    alt={tourShowcaseImages[0]?.name || "Tur Unggulan"}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[10px] tracking-[0.3em] text-white/70">Unggulan</p>
                      <p className="text-lg font-bold">{tourShowcaseImages[0]?.name || "Tur Utama"}</p>
                    </div>
                    <Link href={tourShowcaseImages[0] ? `/tours/${tourShowcaseImages[0].id}` : "/tours"}>
                      <span className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[10px] tracking-[0.2em] backdrop-blur cursor-pointer hover:bg-white/20 transition-colors">
                        Jelajahi
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Top right image */}
                <div className="relative overflow-hidden rounded-[24px]">
                  <Image
                    src={tourShowcaseImages[1]?.imageUrl || PlaceHolderImages[1]?.imageUrl || (heroImg?.imageUrl || PlaceHolderImages[0]?.imageUrl)}
                    alt={tourShowcaseImages[1]?.name || "Tur 2"}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  {tourShowcaseImages[1] && (
                    <Link href={`/tours/${tourShowcaseImages[1].id}`} className="absolute inset-0 z-10">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] font-semibold text-white drop-shadow-lg truncate">{tourShowcaseImages[1].name}</p>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Bottom right image */}
                <div className="relative overflow-hidden rounded-[24px]">
                  <Image
                    src={tourShowcaseImages[2]?.imageUrl || PlaceHolderImages[2]?.imageUrl || (heroImg?.imageUrl || PlaceHolderImages[0]?.imageUrl)}
                    alt={tourShowcaseImages[2]?.name || "Tur 3"}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                  />
                  {tourShowcaseImages[2] && (
                    <Link href={`/tours/${tourShowcaseImages[2].id}`} className="absolute inset-0 z-10">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[10px] font-semibold text-white drop-shadow-lg truncate">{tourShowcaseImages[2].name}</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pilihan Jadwal Terbaru */}
        <section className="w-full px-4 md:px-8">
          <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-zinc-400">Detail Paket Tur</p>
                  <h4 className="text-xl font-bold md:text-3xl">Pilihan Jadwal Terbaru</h4>
                </div>
                <Badge className="bg-white/10 text-white hover:bg-white/10">{allTours.length} Paket</Badge>
              </div>

              <div className="grid gap-3">
                {allTours.slice(0, 3).map((tour: any) => (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="block group transition-all duration-300">
                    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-4 transition duration-300 group-hover:border-zinc-500 group-hover:bg-zinc-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold md:text-base group-hover:text-[#98DDCA] transition-colors">{tour.name}</p>
                        <Badge variant="outline" className="border-zinc-500 text-zinc-200">
                          Rp {tour.price?.toLocaleString("id-ID")}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300 md:grid-cols-4">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {tour.date || "Jadwal Fleksibel"}</span>
                        <span className="inline-flex items-center gap-1"><Map className="h-3.5 w-3.5" /> {tour.distance}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {tour.duration}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Grup Kecil</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">
                        {tour.description || "Deskripsi singkat tur ini akan membantu peserta memilih rute yang paling sesuai."}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <Footer />

    </div>
  )
}


