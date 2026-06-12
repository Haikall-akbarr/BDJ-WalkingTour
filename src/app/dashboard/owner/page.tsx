
"use client"

import { useEffect, useMemo, useState, useRef } from "react"
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
  Mountain,
  Download,
  X
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import * as XLSX from "xlsx"

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
  const [revenueBookingsMap, setRevenueBookingsMap] = useState<Record<string, any[]>>({});
  const bookingsMapRef = useRef<Record<string, any[]>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalGuideRevenue, setTotalGuideRevenue] = useState(0);
  const [selectedMonthBookings, setSelectedMonthBookings] = useState<any[] | null>(null);
  const [selectedMonthName, setSelectedMonthName] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tours, setTours] = useState<any[]>([]);

  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
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

  const loadTours = async () => {
    try {
      const response = await fetch('/api/tours', { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && Array.isArray(result?.tours)) {
        setTours(result.tours);
      }
    } catch {
      setTours([]);
    }
  };

  useEffect(() => {
    loadUnassignedBookings();
    loadGuides();
    loadTours();
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
          const monthly = d3.monthlyData || [];
          setRevenueChartData(monthly);
          setTotalRevenue(d3.totalRevenue || 0);
          setTotalGuideRevenue(d3.totalGuideRevenue || 0);
          // Build a lookup map: month name -> bookings array
          const bMap: Record<string, any[]> = {};
          for (const m of monthly) {
            if (m.name && Array.isArray(m.bookings)) {
              bMap[m.name] = m.bookings;
            }
          }
          setRevenueBookingsMap(bMap);
          bookingsMapRef.current = bMap;
        } else {
          setApiError(`API resp not ok: ${resp3.status} ${d3?.error || ''}`);
        }
      } catch (err: any) {
        setApiError(`Fetch error: ${err?.message || String(err)}`);
      }
    })();
  }, []);

  const bookingsToDisplay = useMemo(() => {
    return dbBookings || [];
  }, [dbBookings]);

  // Get up to 3 tour images from database for the "Pilihan Destinasi" section
  const tourShowcaseImages = useMemo(() => {
    const toursWithImages = tours.filter((t: any) => t.imageUrl);
    return toursWithImages.slice(0, 3);
  }, [tours]);

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

  const handleChartClick = (data: any) => {
    if (!data || !data.activePayload || data.activePayload.length === 0) return;
    const payload = data.activePayload[0].payload;
    const monthName = payload.name || "";
    // Look up bookings from the stored map instead of relying on Recharts payload
    const bookings = bookingsMapRef.current[monthName] || [];
    if (bookings.length > 0) {
      setSelectedMonthBookings(bookings);
      setSelectedMonthName(monthName);
      setDetailDialogOpen(true);
    } else {
      toast({
        title: "Tidak ada data",
        description: `Belum ada booking untuk bulan ${monthName || "ini"}.`,
      });
    }
  };

  const handleExportExcel = () => {
    if (!selectedMonthBookings || selectedMonthBookings.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak ada data",
        description: "Belum ada booking untuk diekspor.",
      });
      return;
    }

    const rows = selectedMonthBookings.map((b: any, idx: number) => ({
      No: idx + 1,
      "Nama Tur": b.tourName || "-",
      "Nama Pemesan": b.userName || "-",
      Email: b.userEmail || "-",
      Pax: b.pax || 0,
      "Total (Rp)": b.grossAmount || 0,
      "Tanggal Bayar": b.paidAt ? new Date(b.paidAt).toLocaleDateString("id-ID") : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Booking ${selectedMonthName}`);

    const fileData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const filename = `booking-${selectedMonthName}-${new Date().getFullYear()}.xlsx`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);

    toast({
      title: "File diunduh",
      description: `Data booking bulan ${selectedMonthName} berhasil diekspor ke Excel.`,
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

        {/* Pilihan Destinasi - uses tour photos from DB */}
        <section className="rounded-[34px] bg-white p-4 shadow-sm md:p-6 lg:p-8">
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
                  src={tourShowcaseImages[1]?.imageUrl || PlaceHolderImages[1]?.imageUrl || heroImage}
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
                  src={tourShowcaseImages[2]?.imageUrl || PlaceHolderImages[2]?.imageUrl || heroImage}
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
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card className="overflow-hidden rounded-[28px] border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold ">
                  <Compass className="h-6 w-6" /> Statistik Booking
                </CardTitle>
                <CardDescription>Jumlah booking selama 30 hari terakhir.</CardDescription>
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
                      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                        Belum ada data booking.
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>

            {/* Revenue Chart - clickable bars */}
            <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Ikhtisar Pendapatan</CardTitle>
                    <CardDescription className="text-zinc-300">Klik batang chart untuk melihat detail booking bulan tersebut.</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total Komisi Pemandu Keluar (35%)</p>
                    <p className="text-lg font-bold text-[#98DDCA]">Rp {totalGuideRevenue.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueChartData.length > 0 ? revenueChartData : []}
                    onClick={handleChartClick}
                    style={{ cursor: "pointer" }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} tickFormatter={(val) => `Rp ${val/1000}k`} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.08)" }}
                      formatter={(val: number) => [`Rp ${val.toLocaleString("id-ID")}`, "Pendapatan"]}
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "12px", color: "#fff" }}
                      labelStyle={{ color: "#a1a1aa" }}
                    />
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
                        <span>•</span>
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

        {/* Footer - same style as user/public footer */}
        <footer className="w-full rounded-[34px] bg-[#10221f] text-white px-4 py-12 md:px-8 md:py-16 overflow-hidden">
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
                <Link href="/#faq" className="block transition-colors hover:text-white">FAQ</Link>
                <Link href="/" className="block transition-colors hover:text-white">Kebijakan Privasi</Link>
                <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-white">Kontak Support</a>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-3xl font-bold md:text-4xl text-[#98DDCA]">Hubungi Kami</p>
              <div className="space-y-2 text-base md:text-lg text-white/80">
                <p>Email: <a href="mailto:info@bdjwalkingtour.com" className="hover:underline">info@bdjwalkingtour.com</a></p>
                <p>Instagram: <a href="https://www.instagram.com/bdj.walkingtour/" target="_blank" rel="noopener noreferrer" className="hover:underline">@bdj.walkingtour</a></p>
                <p>WhatsApp: <a href="https://wa.me/6281291697428" target="_blank" rel="noopener noreferrer" className="hover:underline">+62 812-9169-7428</a></p>
                <p>Lokasi: Banjarmasin, Kalimantan Selatan</p>
              </div>
            </div>

            {/* Bakantan mascot */}
            <div className="flex items-end justify-center xl:justify-end">
              <div className="relative w-[180px] h-[220px] md:w-[200px] md:h-[250px]">
                <Image
                  src="/bekantan.png"
                  alt="Bekantan - Maskot Banjarmasin"
                  fill
                  className="object-contain drop-shadow-[0_4px_24px_rgba(152,221,202,0.35)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50 space-y-1">
            <p className="tracking-wider">POLITEKNIK NEGERI BANJARMASIN & UNIVERSITAS ISLAM NEGERI BANJARMASIN 2026</p>
            <p className="font-semibold text-[#98DDCA]">Haikal x Nazar</p>
          </div>
        </footer>
      </div>

      {/* Revenue Month Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="bg-zinc-900 text-white px-6 py-5">
            <DialogTitle className="text-xl font-bold">
              Detail Booking — {selectedMonthName}
            </DialogTitle>
            <p className="text-sm text-zinc-300 mt-1">
              {selectedMonthBookings?.length || 0} booking ditemukan pada bulan ini
            </p>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[400px] overflow-y-auto space-y-3">
            {selectedMonthBookings && selectedMonthBookings.length > 0 ? (
              selectedMonthBookings.map((b: any, idx: number) => (
                <div key={b.id || idx} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 truncate">{b.tourName}</p>
                      <p className="text-xs text-zinc-500">{b.userName} • {b.userEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-emerald-600">Rp {Number(b.grossAmount || 0).toLocaleString("id-ID")}</p>
                      <p className="text-[10px] text-zinc-400">{b.pax} Pax</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-400">
                    Dibayar: {b.paidAt ? new Date(b.paidAt).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-zinc-500 py-8">Tidak ada data booking.</p>
            )}
          </div>
          <div className="border-t px-6 py-4 flex items-center justify-between gap-3 bg-zinc-50">
            <p className="text-sm font-bold text-zinc-900">
              Total: Rp {(selectedMonthBookings || []).reduce((s: number, b: any) => s + Number(b.grossAmount || 0), 0).toLocaleString("id-ID")}
            </p>
            <Button
              onClick={handleExportExcel}
              className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
            >
              <Download className="h-4 w-4" /> Ekspor ke Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
