
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, CheckCircle2, MessageSquareText, LogOut, Loader2, ArrowUpRight, QrCode } from "lucide-react"
import Link from "next/link"
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { PlaceHolderImages } from "@/lib/placeholder-images"

// Data statis untuk keperluan demonstrasi jika database kosong
const MOCK_TOURS = [
  {
    id: "mock-1",
    tourName: "Susur Sungai Martapura",
    userName: "Budi Santoso",
    userWhatsApp: "08123456789",
    userEmail: "budi@example.com",
    domicile: "Banjarmasin",
    pax: 2,
    createdAt: { toDate: () => new Date() },
    status: "approved"
  },
  {
    id: "mock-2",
    tourName: "Pacinan Walking Tour",
    userName: "Siti Rahma",
    userWhatsApp: "08987654321",
    userEmail: "siti@example.com",
    domicile: "Banjarbaru",
    pax: 4,
    createdAt: { toDate: () => new Date(Date.now() + 86400000) },
    status: "approved"
  }
];

export default function GuideDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
  }, []);

  const [scanCode, setScanCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // ID Pemandu simulasi (dari login)
  const currentGuideId = "g1"; 

  const scheduleQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "bookings"), 
      where("guideId", "==", currentGuideId),
      where("status", "==", "approved")
    );
  }, [db]);

  const { data: dbTours, loading } = useCollection(scheduleQuery);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  // Gabungkan data DB dengan data mock jika DB kosong
  const myTours = useMemo(() => {
    if (!dbTours || dbTours.length === 0) return MOCK_TOURS;
    return [...dbTours, ...MOCK_TOURS];
  }, [dbTours]);

  const selectedTour = useMemo(() => {
    if (!myTours || myTours.length === 0) return null;
    if (selectedTourId) return myTours.find((t: any) => t.id === selectedTourId) || myTours[0];
    return myTours[0];
  }, [myTours, selectedTourId]);

  const handleLogout = () => {
    router.push("/");
  };

  const handleScanAttendance = async () => {
    if (!scanCode.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceCode: scanCode.trim(), scannedBy: "guide" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Scan gagal.");
      }

      setScanResult(`Terverifikasi: ${result.booking?.userName || result.bookingId}`);
      setScanCode("");
    } catch (error: any) {
      setScanResult(error?.message || "Scan gagal.");
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecece7] text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10 space-y-8">
        <section className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white shadow-xl">
          <div className="absolute inset-0">
            <Image src={heroImage} alt="Guide Hero" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
          </div>

          <div className="relative z-10 p-4 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 backdrop-blur">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wide">BDJ WalkingTour</span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 rounded-full border-white/40 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white">
                    <LogOut className="mr-1 h-3 w-3" /> Keluar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="w-[90%] rounded-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Keluar sekarang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pastikan laporan tur hari ini sudah dikirim.
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

            <div className="mt-8 space-y-3 md:mt-12">
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/75">Guide Dashboard</p>
              <h1 className="max-w-2xl text-4xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-5xl md:text-6xl">
                Route Briefing
              </h1>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Kelola jadwal, data peserta, dan laporan tur harian dalam satu panel bergaya eksplorasi.
              </p>
              <Button className="h-10 rounded-full bg-white px-5 text-xs font-bold uppercase text-black hover:bg-white/90">
                Explore Routes <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-xl font-black uppercase md:text-2xl">Dashboard Pemandu</h2>
            <p className="text-sm text-zinc-600">Kelola tur jalan kaki Anda.</p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] md:text-xs">Akses Pemandu Aktif</Badge>
        </div>

        <Card className="rounded-[28px] border-none bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase md:text-2xl">
              <QrCode className="h-5 w-5" /> Scan Barcode Absensi
            </CardTitle>
            <CardDescription>Masukkan kode QR/barcode yang ada di email peserta untuk menandai kehadiran.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Input
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Tempel atau ketik kode absensi..."
              className="h-11 rounded-full"
            />
            <Button
              onClick={handleScanAttendance}
              disabled={scanLoading || !scanCode.trim()}
              className="h-11 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {scanLoading ? "Memverifikasi..." : "Verifikasi Kehadiran"}
            </Button>
          </CardContent>
          {scanResult && (
            <CardFooter className="pt-0">
              <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {scanResult}
              </div>
            </CardFooter>
          )}
        </Card>

        {loading && (!dbTours || dbTours.length === 0) ? (
          <div className="flex flex-col items-center justify-center rounded-[28px] bg-white p-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Memuat jadwal tur Anda...</p>
          </div>
        ) : myTours && myTours.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="rounded-[28px] border-none bg-white shadow-md lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
                  <Calendar className="h-4 w-4" /> Jadwal Saya
                </CardTitle>
                <CardDescription>Pilih jadwal untuk melihat detail peserta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myTours.map((tour: any) => (
                  <button
                    key={tour.id}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedTour?.id === tour.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"}`}
                    onClick={() => setSelectedTourId(tour.id)}
                    type="button"
                  >
                    <p className="truncate text-sm font-bold md:text-base">{tour.tourName}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className={`text-[10px] md:text-xs ${selectedTour?.id === tour.id ? "text-zinc-300" : "text-zinc-500"}`}>
                        {tour.createdAt?.toDate().toLocaleDateString("id-ID")}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] md:text-[10px] px-1.5 rounded-full ${selectedTour?.id === tour.id ? "border-white/40 bg-white/10 text-white" : "border-zinc-300"}`}
                      >
                        {tour.id.startsWith("mock") ? "Demo" : "Aktif"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card className="overflow-hidden rounded-[28px] border-none shadow-md">
                <CardHeader className="relative bg-zinc-900 pb-6 text-white">
                  <div className="absolute inset-0 opacity-25">
                    <Image src={heroImage} alt="Tour cover" fill className="object-cover" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-xl font-black uppercase md:text-2xl">{selectedTour?.tourName}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 text-xs text-zinc-300">
                        <MapPin className="h-3 w-3" /> Lokasi Tur • {selectedTour?.createdAt?.toDate().toLocaleDateString("id-ID")}
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full border-white/50 bg-white/10 text-[10px] text-white hover:bg-white/20 hover:text-white md:text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Absensi
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 md:p-6">
                  <h3 className="flex items-center gap-2 border-b pb-2 text-sm font-bold uppercase md:text-base">
                    <Users className="h-4 w-4" /> Detail Peserta
                  </h3>
                  <div className="rounded-2xl bg-zinc-100 p-4 text-sm">
                    <p className="text-xl font-black uppercase">{selectedTour?.userName}</p>
                    <p className="mt-1 text-zinc-600">{selectedTour?.userWhatsApp}</p>
                    <p className="text-xs text-zinc-500">{selectedTour?.userEmail}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-full bg-white">
                        Domisili: {selectedTour?.domicile} {selectedTour?.customDomicile ? `(${selectedTour.customDomicile})` : ""}
                      </Badge>
                      <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-sm font-bold">
                        {selectedTour?.pax} Pax
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-center justify-between gap-4 border-t bg-zinc-50 p-4 sm:flex-row">
                  <p className="text-xs italic text-zinc-600">Siapkan cerita lokal terbaik Anda!</p>
                  <Link href={`/dashboard/guide/${selectedTour?.id}/report`} className="w-full sm:w-auto">
                    <Button className="h-9 w-full rounded-full bg-zinc-900 text-xs text-white hover:bg-zinc-800 sm:w-auto">
                      <MessageSquareText className="mr-2 h-4 w-4" /> Laporan Tur
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="rounded-[28px] border-none bg-white shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 p-4 md:p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Trip Reminder</p>
                    <p className="mt-1 text-base font-bold md:text-lg">Pastikan perlengkapan dan briefing peserta sudah lengkap.</p>
                  </div>
                  <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">Ready</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="rounded-[28px] border-dashed p-20 text-center">
            <p className="text-muted-foreground">Anda belum memiliki jadwal tur yang ditugaskan.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
