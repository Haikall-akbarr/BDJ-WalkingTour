
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signOutFirebase } from "@/lib/firebaseClient"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  Map,
  UserPlus,
  LogOut,
  MapPin,
  Loader2,
  ArrowUpRight,
  Compass,
  Mountain
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const STATS = [
  { label: "Climbers Equipped", value: "20K+", trend: "+12%" },
  { label: "Successful Expeditions", value: "2K+", trend: "+5%" },
  { label: "Trusted Reviews", value: "5K+", trend: "Stabil" }
];

export default function OwnerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedGuides, setSelectedGuides] = useState<Record<string, string>>({});
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingChartData, setBookingChartData] = useState<any[]>([]);
  const [userChartData, setUserChartData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalGuideRevenue, setTotalGuideRevenue] = useState(0);

  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
  }, []);

  const showcaseImages = useMemo(() => {
    return PlaceHolderImages.slice(0, 3);
  }, []);

  const loadUnassignedBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings?paymentStatus=paid&unassigned=true", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Gagal memuat booking owner.");
      }

      setDbBookings(Array.isArray(result?.bookings) ? result.bookings : []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data",
        description: error?.message || "Periksa backend database.",
      });
      setDbBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGuides = async () => {
    try {
      const response = await fetch('/api/admin/users?role=guide', { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Gagal memuat daftar pemandu.');
      }

      setGuides(Array.isArray(result?.users) ? result.users : []);
    } catch {
      setGuides([]);
    }
  };

  useEffect(() => {
    loadUnassignedBookings();
    loadGuides();
    // load analytics
    (async () => {
      try {
        const resp1 = await fetch('/api/analytics/bookings');
        const d1 = await resp1.json();
        if (resp1.ok) setBookingChartData(d1.data || []);
      } catch {}

      try {
        const resp2 = await fetch('/api/analytics/users');
        const d2 = await resp2.json();
        if (resp2.ok) setUserChartData(d2.data || []);
      } catch {}

      try {
        const resp3 = await fetch('/api/analytics/revenue');
        const d3 = await resp3.json();
        if (resp3.ok) {
          setRevenueChartData(d3.monthlyData || []);
          setTotalRevenue(d3.totalRevenue || 0);
          setTotalGuideRevenue(d3.totalGuideRevenue || 0);
        }
      } catch {}
    })();
  }, []);

  const bookingsToDisplay = useMemo(() => {
    return dbBookings || [];
  }, [dbBookings]);

  const handleAssignGuide = async (bookingId: string) => {
    const guideId = selectedGuides[bookingId];
    if (!guideId) return;

    const guideName = guides.find(g => g.id === guideId)?.name;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guideId,
          guideName,
          status: "assigned",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menugaskan pemandu.");
      }

      await loadUnassignedBookings();
      toast({
        title: "Penugasan Berhasil",
        description: `Pemandu ${guideName} telah ditugaskan.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menugaskan pemandu",
        description: error?.message || "Coba lagi beberapa saat.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase()
    } catch (err) {
      console.error('Client signOut failed:', err)
    }

    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/");
    });
  };

  return (
    <div className="min-h-screen bg-[#ecece7] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 space-y-8 md:space-y-12">
        <section className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white shadow-xl">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/65" />
          </div>

          <div className="relative z-10 p-4 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 backdrop-blur">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wide">BDJ WalkingTour</span>
              </div>

              <div className="inline-flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/30 bg-white/15 p-2 backdrop-blur md:w-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 rounded-full border-white/40 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white">
                      <LogOut className="mr-1 h-3 w-3" /> Keluar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90%] rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Keluar dari sistem?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sesi Anda akan berakhir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto">
                        Keluar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-8 md:mt-12 space-y-4">
              <p className="text-[10px] tracking-[0.35em] text-white/70">Owner Dashboard</p>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-wide text-white sm:text-5xl md:text-7xl">
                New Heights
              </h1>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Built for climbers who demand reliability at every altitude. Semua fitur dashboard tetap aktif, kini dalam tampilan eksplorasi yang lebih modern.
              </p>

              <div className="pt-2">
                <Button className="h-10 rounded-full bg-white px-5 text-xs font-bold text-black hover:bg-white/90">
                  Connect <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] tracking-wide text-white/80">{stat.label}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-200">
                    <TrendingUp className="h-3 w-3" /> {stat.trend}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[34px] bg-white p-4 shadow-sm md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-[28px] bg-[#10221f] p-6 text-white md:p-8">
              <div className="space-y-4">
                <p className="text-[10px] tracking-[0.35em] text-white/60">Destination Picks</p>
                <h2 className="max-w-xs text-3xl font-bold leading-[0.95] md:text-5xl lg:text-[3.75rem]">
                  Not Sure Where To Go Next
                </h2>
                <p className="max-w-sm text-sm leading-7 text-white/75">
                  Jangan khawatir, kami menyiapkan pilihan rute dan pengalaman visual terbaik untuk inspirasi perjalanan berikutnya.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <Button className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
                  Explore Routes
                </Button>
                <p className="text-[11px] tracking-[0.3em] text-white/45">Where every route begins with the right step</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:h-[540px]">
              <div className="relative overflow-hidden rounded-[24px] lg:col-span-2 lg:row-span-2">
                <Image
                  src={PlaceHolderImages[0].imageUrl}
                  alt={PlaceHolderImages[0].description}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  data-ai-hint={PlaceHolderImages[0].imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] text-white/70">Featured</p>
                    <p className="text-lg font-bold">River & Heritage Route</p>
                  </div>
                  <span className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[10px] tracking-[0.2em] backdrop-blur">
                    Explore
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px]">
                <Image
                  src={PlaceHolderImages[1].imageUrl}
                  alt={PlaceHolderImages[1].description}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  data-ai-hint={PlaceHolderImages[1].imageHint}
                />
              </div>

              <div className="relative overflow-hidden rounded-[24px]">
                <Image
                  src={PlaceHolderImages[2].imageUrl}
                  alt={PlaceHolderImages[2].description}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  data-ai-hint={PlaceHolderImages[2].imageHint}
                />
              </div>

              <div className="relative overflow-hidden rounded-[24px] lg:col-span-1">
                <Image
                  src={heroImage}
                  alt="Hero"
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card className="overflow-hidden rounded-[28px] border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold ">
                  <Compass className="h-6 w-6" /> Not Sure Where To Go Next
                </CardTitle>
                <CardDescription>Jelajahi rute paling cocok untuk level petualangan Anda.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div style={{ width: '100%', height: 220 }}>
                    {bookingChartData && bookingChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={bookingChartData.map((r:any) => ({ name: r.day, value: Number(r.bookings) }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10221f" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {PlaceHolderImages.map((img) => (
                          <div key={img.id} className="relative h-40 overflow-hidden rounded-xl md:h-56">
                            <Image
                              src={img.imageUrl}
                              alt={img.description}
                              fill
                              className="object-cover"
                              data-ai-hint={img.imageHint}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Ikhtisar Pendapatan</CardTitle>
                    <CardDescription className="text-zinc-300">Visualisasi pertumbuhan pendapatan kotor bulanan.</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total Komisi Pemandu Keluar (35%)</p>
                    <p className="text-lg font-bold text-[#98DDCA]">Rp {totalGuideRevenue.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData.length > 0 ? revenueChartData : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.08)" }} formatter={(val: number) => `Rp ${val.toLocaleString("id-ID")}`} />
                    <Bar dataKey="value" fill="#98DDCA" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border-none bg-white shadow-md lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold ">
                <Mountain className="h-5 w-5" /> Alokasi Pemandu
              </CardTitle>
              <CardDescription>Tugaskan pemandu untuk pesanan yang sudah dibayar dan belum memiliki pemandu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground mt-2">Memuat data...</p>
                </div>
              ) : bookingsToDisplay.length > 0 ? (
                bookingsToDisplay.map((booking: any) => (
                  <div key={booking.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="space-y-1">
                      <p className="truncate text-sm font-bold">{booking.tourName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-800">{booking.userName}</span>
                        <span>â€¢</span>
                        <span>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("id-ID") : "-"}</span>
                        <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                          {booking.pax} Pax
                        </Badge>
                        <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                          {(booking.paymentStatus || booking.status || "pending_payment").toString()}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={selectedGuides[booking.id] || ""}
                        onValueChange={(val) => setSelectedGuides({ ...selectedGuides, [booking.id]: val })}
                      >
                        <SelectTrigger className="h-9 w-full bg-white text-xs sm:w-[175px]">
                          <SelectValue placeholder="Pilih Pemandu" />
                        </SelectTrigger>
                        <SelectContent>
                          {guides.map((guide) => (
                            <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        className="h-9 w-full rounded-full bg-zinc-900 text-xs text-white hover:bg-zinc-800 sm:w-auto"
                        disabled={!selectedGuides[booking.id]}
                        onClick={() => handleAssignGuide(booking.id)}
                      >
                        <UserPlus className="mr-1 h-3 w-3" /> Tugaskan
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Semua pesanan sudah memiliki pemandu.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <footer className="overflow-hidden rounded-[34px] border border-black/5 bg-[#10221f] text-white shadow-md">
          <div className="relative overflow-hidden px-6 py-8 md:px-10 md:py-12">
            <div className="absolute inset-0 opacity-15">
              <Image
                src={heroImage}
                alt="Footer Banner"
                fill
                className="object-cover"
              />
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-[10px] tracking-[0.35em] text-white/55">BDJ WalkingTour</p>
                <h4 className="max-w-lg text-3xl font-bold leading-tight md:text-5xl">
                  Professional routing for the city of rivers.
                </h4>
                <p className="max-w-xl text-sm leading-7 text-white/70 md:text-base">
                  Footer ini dirancang untuk memberi akses cepat ke navigasi penting, informasi kontak, dan status operasional dashboard.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button className="rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
                    Open Dashboard
                  </Button>
                  <Button variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    Manage Routes
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs tracking-[0.25em] text-white/55">Quick Access</p>
                <div className="flex flex-col gap-2 text-sm text-white/75">
                  <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Beranda
                  </Link>
                  <Link href="/tours" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Semua Tur
                  </Link>
                  <Link href="/book/1" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Pesan Sekarang
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs tracking-[0.25em] text-white/55">Contact</p>
                <div className="space-y-3 text-sm text-white/75">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-white">hello@bdjwalkingtour.com</p>
                    <p className="text-xs text-white/55">Support email</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-white">+62 812-3456-7890</p>
                    <p className="text-xs text-white/55">WhatsApp</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-white">Jl. Ahmad Yani, Banjarmasin</p>
                    <p className="text-xs text-white/55">Office location</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
              <p>Â© 2026 BDJ WalkingTour. All rights reserved.</p>
              <p className=" tracking-[0.25em]">Owner Dashboard UI Refresh</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}


