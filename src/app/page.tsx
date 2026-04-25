"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar, Users, ArrowRight, Clock, Map, ArrowUpRight } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

const STATIC_TOURS = [
  {
    id: "st-1",
    name: "Pacinan Walking Tour",
    price: 65000,
    distance: "3 KM",
    duration: "2 Jam",
    date: "Minggu, 12 Okt",
    imageHint: "historical building",
  },
  {
    id: "st-2",
    name: "Susur Sungai Martapura",
    price: 85000,
    distance: "5 KM",
    duration: "3 Jam",
    date: "Sabtu, 18 Okt",
    imageHint: "river landscape",
  },
  {
    id: "st-3",
    name: "Wisata Religi Kubah Basirih",
    price: 50000,
    distance: "2 KM",
    duration: "1.5 Jam",
    date: "Jumat, 24 Okt",
    imageHint: "mosque architecture",
  },
]

export default function LandingPage() {
  const auth = useAuth()
  const { user, loading: authLoading } = useUser()
  const { toast } = useToast()
  const allTours = useMemo(() => STATIC_TOURS, [])
  const [newsletterEmail, setNewsletterEmail] = useState("")

  const heroImg = PlaceHolderImages.find((img) => img.id === "hero-bg")
  const showcaseImages = PlaceHolderImages.slice(0, 3)

  const stats = [
    { value: "20K+", label: "Travelers Hosted" },
    { value: "2K+", label: "Guided Walks" },
    { value: "5K+", label: "Trusted Reviews" },
  ]

  const handleLogout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = newsletterEmail.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Email belum valid",
        description: "Masukkan email yang valid untuk berlangganan newsletter.",
      })
      return
    }

    toast({
      title: "Newsletter aktif",
      description: `Terima kasih. Update terbaru akan dikirim ke ${email}.`,
    })
    setNewsletterEmail("")
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
                <Link href="#tours" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Semua Tur</Link>
                {(!authLoading || !auth) && !user && (
                  <Link href="/login" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Login Staf</Link>
                )}
                <Link href="/book/1" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Pesan Sekarang</Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {((!authLoading || !auth) && !user) && (
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
                    >
                      Log in
                    </Button>
                  </Link>
                )}
                {!authLoading && user && (
                  <>
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
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
                      onClick={handleLogout}
                    >
                      keluar
                    </Button>
                  </>
                )}
                <Link href="#tours">
                  <Button size="sm" className="h-8 rounded-full bg-[#98DDCA] px-3 text-xs font-semibold text-[#16302c] hover:bg-[#b8eadc]">
                    Explore
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-1 items-center py-14 md:py-20 lg:py-24">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/85 backdrop-blur-sm md:text-xs">
                  Heritage Walks
                </div>
                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[0.08em] text-white sm:text-6xl md:text-7xl lg:text-[7.25rem]">
                  Banjarmasin
                  <span className="block text-[#98DDCA]">Walking Tour</span>
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/88 md:text-lg">
                  Rasakan keindahan sejarah, sungai, dan budaya kota seribu sungai melalui pengalaman berjalan kaki yang dipandu lokal berpengalaman.
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Link href="#tours">
                    <Button className="h-11 rounded-full bg-[#98DDCA] px-6 text-xs font-bold uppercase text-[#16302c] hover:bg-[#b8eadc] md:px-7">
                      Jelajahi Tur <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  {!authLoading && !user && (
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="h-11 rounded-full border-white/30 bg-white/5 px-6 text-xs font-bold uppercase text-white hover:bg-white/15 hover:text-white md:px-7"
                      >
                        Login Staf
                      </Button>
                    </Link>
                  )}
                  {!authLoading && user && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link href="/dashboard/user">
                        <Button
                          variant="outline"
                          className="h-11 rounded-full border-white/30 bg-white/5 px-6 text-xs font-bold uppercase text-white hover:bg-white/15 hover:text-white md:px-7"
                        >
                          Profil Saya
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="h-11 rounded-full border-white/30 bg-white/5 px-6 text-xs font-bold uppercase text-white hover:bg-white/15 hover:text-white md:px-7"
                      >
                        Keluar
                      </Button>
                    </div>
                  )}
                </div>
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
              {showcaseImages.map((item, index) => (
                <div key={item.id} className="group relative h-56 overflow-hidden rounded-3xl">
                  <Image
                    src={item.imageUrl}
                    alt={item.description}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    data-ai-hint={item.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <p className="text-sm font-semibold">{["Bags", "Shoes", "Accessories"][index]}</p>
                    <span className="rounded-full border border-white/50 px-2 py-0.5 text-[10px]">Shop</span>
                  </div>
                </div>
              ))}
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
                  <Button variant="outline" className="rounded-full text-xs">
                    Explore Routes
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {allTours.slice(0, 6).map((tour: any, idx: number) => {
                    const tourImg = PlaceHolderImages[idx % PlaceHolderImages.length]
                    return (
                      <Link key={tour.id} href={`/book/${tour.id}`} className="group">
                        <div className="relative h-56 overflow-hidden rounded-2xl">
                          <Image
                            src={tour.imageUrl || tourImg.imageUrl}
                            alt={tour.name}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            data-ai-hint={tour.imageHint || tourImg.imageHint}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <p className="truncate text-sm font-bold md:text-base">{tour.name}</p>
                            <p className="text-xs text-white/80 md:text-sm">Rp {tour.price?.toLocaleString("id-ID")}</p>
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
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  {!authLoading && !user && (
                    <Link href="/login">
                      <Button className="rounded-full bg-white text-zinc-900 hover:bg-white/90">
                        Login Staf <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
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
                    <AccordionTrigger className="text-left">Do I need prior walking experience?</AccordionTrigger>
                    <AccordionContent>No. Tur kami dirancang untuk pemula dan peserta berpengalaman.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left">How do I choose the right route for my trip?</AccordionTrigger>
                    <AccordionContent>Pilih paket sesuai jarak, durasi, dan rekomendasi kebutuhan perjalanan.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left">Are your tours guided by local experts?</AccordionTrigger>
                    <AccordionContent>Ya, setiap rute dipandu oleh tim lokal yang memahami cerita dan konteks tempat.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-left">What if the route does not fit my needs?</AccordionTrigger>
                    <AccordionContent>Tim kami membantu penyesuaian sebelum keberangkatan agar tetap nyaman.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 w-full bg-[#d8d8d5] px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-700">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6f846d] text-white">
                  <Map className="h-5 w-5" />
                </span>
                <p className="text-3xl font-bold md:text-4xl">BDJ Tour</p>
              </div>
              <p className="max-w-xs text-base leading-8 text-[#667665] md:text-lg">
                Mitra terpercaya Anda dalam menjelajahi rahasia kota melalui pengalaman jalan kaki yang terkurasi.
              </p>
            </div>

            <div className="space-y-4 text-[#3b443b]">
              <p className="text-3xl font-bold md:text-4xl">Perusahaan</p>
              <div className="space-y-2 text-base md:text-lg">
                <Link href="/" className="block transition-colors hover:text-[#1f2a1f]">Tentang Kami</Link>
                <Link href="/dashboard/guide" className="block italic transition-colors hover:text-[#1f2a1f]">Dashboard Pemandu</Link>
                <Link href="/dashboard/owner" className="block italic transition-colors hover:text-[#1f2a1f]">Dashboard Pemilik</Link>
              </div>
            </div>

            <div className="space-y-4 text-[#3b443b]">
              <p className="text-3xl font-bold md:text-4xl">Bantuan</p>
              <div className="space-y-2 text-base md:text-lg">
                <Link href="#faq" className="block transition-colors hover:text-[#1f2a1f]">FAQ</Link>
                <Link href="/" className="block transition-colors hover:text-[#1f2a1f]">Kebijakan Privasi</Link>
                <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-[#1f2a1f]">Kontak Support</a>
              </div>
            </div>

            <div className="space-y-4 text-[#3b443b]">
              <p className="text-3xl font-bold md:text-4xl">Newsletter</p>
              <form className="flex items-center gap-3" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Email Anda"
                  className="h-12 flex-1 rounded-xl border border-transparent bg-white/65 px-4 text-base outline-none ring-0 placeholder:text-[#8c968c] focus:border-[#c38972]"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#c38972] text-white transition hover:bg-[#b6775f]"
                  aria-label="Kirim newsletter"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>

          <p className="mt-12 text-center text-base text-[#667665] md:text-lg">© 2026 BDJ Walking Tour. Hak cipta dilindungi.</p>
        </section>
      </main>
    </div>
  )
}
