"use client"

import { useMemo, useState, useEffect } from "react"
import { signOutFirebase } from "@/lib/firebaseClient"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Calendar, Users, ArrowRight, Clock, Map, ArrowUpRight } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useSessionUser } from "@/hooks/use-session-user"
import { useToast } from "@/hooks/use-toast"
import { NotificationBell } from "@/components/NotificationBell"

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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

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

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-between px-4 py-6 md:min-h-[calc(100vh-4.5rem)] md:px-8 md:py-8">
            <div className="flex w-full flex-col gap-3 rounded-[28px] border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:rounded-full lg:px-5">
              <Link href="/" className="flex items-center gap-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#16302c] shadow-sm">
                  <Map className="h-5 w-5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/65 md:text-[11px]">Banjarmasin Route</span>
                  <span className="font-headline text-base font-bold text-white md:text-lg">BDJ WalkingTour</span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-white/85">
                <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Beranda</Link>
                <Link href="/tours" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Semua Tur</Link>
                <Link href="/book/new" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Pesan Sekarang</Link>
                <Link href="#faq" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">FAQ</Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!authLoading && !user && (
                  <Link href="/login">
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-[#98DDCA] px-3 text-xs font-semibold text-[#16302c] hover:bg-[#b8eadc]"
                    >
                      Log in
                    </Button>
                  </Link>
                )}
                {!authLoading && user && (
                  <>
                    <NotificationBell />
                    <Link href="/dashboard/user">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
                      >
                        Profil
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="h-8 rounded-full bg-[#e15959] px-3 text-xs font-semibold text-white hover:bg-[#c84a4a]"
                      onClick={() => setLogoutDialogOpen(true)}
                    >
                      keluar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-1 items-center py-14 md:py-20 lg:py-24">
              <div className="space-y-5">
                {/* Heritage Walks badge hidden - only shown in login form */}
                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[0.08em] text-white sm:text-6xl md:text-7xl lg:text-[7.25rem]">
                  Banjarmasin
                  <span className="block text-[#98DDCA]">Walking Tour</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/88 md:text-lg text-white/80">
                  Rasakan keindahan sejarah, sungai, dan budaya kota seribu sungai melalui pengalaman berjalan kaki yang dipandu lokal berpengalaman.
                </p>
                {/* CTA buttons removed as requested */}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-3 md:pb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/15 bg-black/20 p-4 backdrop-blur-md md:p-5">
                  <p className="text-3xl font-bold text-white md:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/80 md:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 md:px-8" id="tours">
          <div className="rounded-[34px] bg-white p-6 shadow-sm md:p-10">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Pilihan Tur</p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-tight md:text-5xl">
                Temukan Rute Favorit untuk Perjalanan Berikutnya
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-600 md:text-base">
                Pilih rute jalan kaki populer, lihat harga, dan pesan slot terbaik untuk jadwal kamu.
              </p>
                  <Link href="/tours">
                <Button variant="outline" className="mt-5 rounded-full border-zinc-900 px-6 text-xs font-bold uppercase">
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
                        <p className="text-[10px] text-white/80">Rp {Number(tour.price || 0).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="rounded-full border border-white/50 bg-white/10 px-3 py-1 text-[10px] backdrop-blur-sm">Lihat Detail</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="w-full px-4 md:px-8">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-[28px] border-none shadow-md">
              <CardContent className="p-4 md:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rute Populer</p>
                    <h3 className="text-2xl font-black uppercase md:text-5xl">Jelajah Kota dari Sudut Terbaik</h3>
                  </div>
                  <Link href="/tours">
                    <Button variant="outline" className="rounded-full text-xs hover:bg-[#10221f] hover:text-white transition-colors">
                      Explore Routes
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {allTours.slice(0, 6).map((tour: any, idx: number) => {
                    const tourImg = PlaceHolderImages[idx % PlaceHolderImages.length]
                    return (
                      <Link key={tour.id} href={`/book/${tour.id}`} className="group">
                        <div className="relative h-56 overflow-hidden rounded-2xl">
                          {isSupabaseStorageUrl(tour.imageUrl) ? (
                            <img
                              src={tour.imageUrl}
                              alt={tour.name}
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <Image
                              src={tour.imageUrl || tourImg.imageUrl}
                              alt={tour.name}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-105"
                              data-ai-hint={tour.imageHint || tourImg.imageHint}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <p className="truncate text-sm font-bold md:text-base">{tour.name}</p>
                            <p className="text-xs text-white/80 md:text-sm">Rp {tour.price?.toLocaleString("id-ID")}</p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/75 md:text-xs">
                              {tour.description || "Tur pilihan dengan pengalaman lokal yang terkurasi."}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
              <CardContent className="p-4 md:p-6">
                <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Detail Paket Tur</p>
                    <h4 className="text-xl font-black uppercase md:text-3xl">Pilihan Jadwal Terbaru</h4>
                  </div>
                  <Badge className="bg-white/10 text-white hover:bg-white/10">{allTours.length} Paket</Badge>
                </div>

                <div className="grid gap-3">
                  {allTours.slice(0, 6).map((tour: any) => (
                    <div key={tour.id} className="rounded-2xl border border-zinc-700 bg-zinc-800/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold md:text-base">{tour.name}</p>
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
                  ))}
                </div>

                <div className="mt-5">
                  {!authLoading && !user && null}
                  {!authLoading && user && (
                    <div className="flex flex-wrap gap-2">
                      <Link href="/dashboard/user">
                        <Button className="rounded-full bg-white text-zinc-900 hover:bg-white/90">
                          Profil Saya <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" className="rounded-full border-zinc-300 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900" onClick={handleLogout}>
                        Keluar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card id="faq" className="rounded-[28px] border-none bg-white shadow-md">
              <CardContent className="space-y-4 p-4 md:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">FAQ</p>
                  <h4 className="text-2xl font-black uppercase md:text-4xl">Pertanyaan Umum</h4>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left">Apakah saya membutuhkan pengalaman berjalan kaki sebelumnya?</AccordionTrigger>
                    <AccordionContent>Tidak. Tur kami dirancang untuk pemula maupun peserta berpengalaman dengan ritme yang santai.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">Bagaimana cara memilih rute yang tepat untuk perjalanan saya?</AccordionTrigger>
                    <AccordionContent>Pilih paket sesuai jarak, durasi, dan rekomendasi kebutuhan perjalanan yang tersedia di halaman detail tur.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left">Apakah tur ini dipandu oleh pemandu lokal berpengalaman?</AccordionTrigger>
                    <AccordionContent>Ya, setiap rute dipandu oleh warga lokal yang memahami sejarah, budaya, dan cerita unik kawasan tersebut.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left">Bagaimana jika rute yang tersedia tidak sesuai dengan kebutuhan saya?</AccordionTrigger>
                    <AccordionContent>Tim kami siap membantu melakukan penyesuaian jadwal atau rute khusus sebelum keberangkatan agar perjalanan Anda tetap nyaman.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 w-full bg-[#10221f] text-white px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                  <Map className="h-5 w-5" />
                </span>
                <p className="text-3xl font-bold md:text-4xl">BDJ Tour</p>
              </div>
              <p className="max-w-xs text-base leading-8 text-white/70 md:text-lg">
                Mitra terpercaya Anda dalam menjelajahi rahasia kota melalui pengalaman jalan kaki yang terkurasi.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-3xl font-bold md:text-4xl text-[#98DDCA]">Bantuan</p>
              <div className="space-y-2 text-base md:text-lg text-white/80">
                <Link href="#faq" className="block transition-colors hover:text-white">FAQ</Link>
                <Link href="/" className="block transition-colors hover:text-white">Kebijakan Privasi</Link>
                <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-white">Kontak Support</a>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-3xl font-bold md:text-4xl text-[#98DDCA]">Hubungi Kami</p>
              <div className="space-y-2 text-base md:text-lg text-white/80">
                <p>Email: <a href="mailto:info@bdjwalkingtour.com" className="hover:underline">info@bdjwalkingtour.com</a></p>
                <p>WhatsApp: <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:underline">+62 812-3456-7890</a></p>
                <p>Lokasi: Banjarmasin, Kalimantan Selatan</p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50 space-y-1">
            <p className="uppercase tracking-wider">POLITEKNIK NEGERI BANJARMASIN & UNIVERSITAS ISLAM NEGERI BANJARMASIN 2026</p>
            <p className="font-semibold text-[#98DDCA]">Haikal x Nazar</p>
          </div>
        </section>
      </main>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin ingin keluar?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi Anda akan diakhiri dan perlu login kembali untuk mengakses fitur akun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#16302c] text-white hover:bg-[#0f211d]"
              onClick={handleLogout}
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

