
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { signOutFirebase } from "@/lib/firebaseClient"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, CheckCircle2, MessageSquareText, LogOut, Loader2, ArrowUpRight, QrCode, Camera, Download } from "lucide-react"
import Link from "next/link"
import { BrowserMultiFormatReader } from "@zxing/browser"
import type { IScannerControls } from "@zxing/browser/es2015/common/IScannerControls"
import * as XLSX from "xlsx"
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
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useSessionUser } from "@/hooks/use-session-user"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/public/Footer"
import { GuideAnnouncementDialog } from "@/components/GuideAnnouncementDialog"
import { GuideAttendanceDialog } from "@/components/GuideAttendanceDialog"

export default function GuideDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSessionUser();
  const currentGuideId = user?.id || "";
  const currentGuideName = user?.name || "Pemandu";
  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
  }, []);

  const [scanCode, setScanCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const scanGuardRef = useRef(false);

  const historyStorageKey = `guide-scan-history-${currentGuideId}`;
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [apiTours, setApiTours] = useState<any[]>([]);
  const [toursList, setToursList] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [myRevenue, setMyRevenue] = useState<number>(0);

  const loadGuideTours = async () => {
    if (!currentGuideId) return;
    setApiLoading(true);

    try {
      const response = await fetch(`/api/bookings?guideId=${encodeURIComponent(currentGuideId)}`, {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Gagal memuat jadwal guide.");
      }

      setApiTours(Array.isArray(result?.bookings) ? result.bookings : []);
    } catch {
      setApiTours([]);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadMyRevenue = async () => {
      if (!currentGuideId) return;
      try {
        const response = await fetch(`/api/analytics/revenue?guideId=${encodeURIComponent(currentGuideId)}`);
        const result = await response.json();
        if (response.ok && mounted) {
          setMyRevenue(result.totalGuideRevenue || 0);
        }
      } catch { }
    };

    const loadTours = async () => {
      try {
        const response = await fetch("/api/tours", { cache: "no-store" });
        const result = await response.json();
        if (response.ok && mounted && Array.isArray(result?.tours)) {
          setToursList(result.tours);
        }
      } catch (err) {
        console.error("Gagal memuat tur:", err);
      }
    };

    loadGuideTours();
    loadMyRevenue();
    loadTours();

    return () => {
      mounted = false;
    };
  }, [currentGuideId]);

  const toursDateMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of toursList) {
      map[t.id] = t.date;
    }
    return map;
  }, [toursList]);

  const groupedTourGroups = useMemo(() => {
    if (!apiTours || apiTours.length === 0) return [];

    const groups: Record<string, any> = {};

    for (const booking of apiTours) {
      const tId = booking.tourId;
      if (!groups[tId]) {
        // Look up clean name from toursList if available
        const matchedTour = toursList.find((t: any) => t.id === tId);
        const cleanName = matchedTour?.name || booking.tourName.replace(/\s*\(Paket\s*(Hemat|Reguler)\)/gi, "");

        groups[tId] = {
          id: tId,
          tourId: tId,
          tourName: cleanName,
          tourDate: toursDateMap[tId] || (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("id-ID") : "-"),
          bookings: [],
          isDemo: booking.id.startsWith("mock") || booking.id.startsWith("local-"),
        };
      }
      groups[tId].bookings.push(booking);
    }

    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === "-") return 0;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.getTime();
      
      const months: Record<string, string> = {
          'januari': 'Jan', 'jan': 'Jan',
          'februari': 'Feb', 'feb': 'Feb',
          'maret': 'Mar', 'mar': 'Mar',
          'april': 'Apr', 'apr': 'Apr',
          'mei': 'May',
          'juni': 'Jun', 'jun': 'Jun',
          'juli': 'Jul', 'jul': 'Jul',
          'agustus': 'Aug', 'agu': 'Aug',
          'september': 'Sep', 'sep': 'Sep',
          'oktober': 'Oct', 'okt': 'Oct',
          'november': 'Nov', 'nov': 'Nov',
          'desember': 'Dec', 'des': 'Dec'
      };
      let s = dateStr.toLowerCase();
      for (const [id, en] of Object.entries(months)) {
          s = s.replace(id, en);
      }
      const d2 = new Date(s);
      if (!isNaN(d2.getTime())) return d2.getTime();
      return 0;
    };

    return Object.values(groups).sort((a: any, b: any) => parseDate(a.tourDate) - parseDate(b.tourDate));
  }, [apiTours, toursList, toursDateMap]);

  const selectedGroup = useMemo(() => {
    if (groupedTourGroups.length === 0) return null;
    if (selectedTourId) {
      return groupedTourGroups.find((g: any) => g.id === selectedTourId) || groupedTourGroups[0];
    }
    return groupedTourGroups[0];
  }, [groupedTourGroups, selectedTourId]);

  const stopCameraScanner = () => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    scannerRef.current = null;
    scanGuardRef.current = false;
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      scannerRef.current = null;
    };
  }, []);

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

  const verifyAttendanceCode = async (code: string, source: "manual" | "camera") => {
    if (!code.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceCode: code.trim(), scannedBy: currentGuideName || 'guide' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Scan gagal.");
      }

      await loadGuideTours();
      setScanResult(`Terverifikasi: ${result.booking?.userName || result.bookingId}`);
      setScanCode("");
      toast({
        title: "Absensi berhasil",
        description: "Data absensi berhasil disimpan ke database.",
      });
    } catch (error: any) {
      setScanResult(error?.message || "Scan gagal.");
      toast({
        variant: "destructive",
        title: "Scan gagal",
        description: error?.message || "Kode absensi tidak valid.",
      });
    } finally {
      setScanLoading(false);
      scanGuardRef.current = false;
    }
  };

  const handleScanAttendance = async () => {
    await verifyAttendanceCode(scanCode, "manual");
  };

  const handleStartCamera = async () => {
    if (cameraActive) return;
    setScanResult(null);
    setCameraActive(true);
  };

  useEffect(() => {
    if (!cameraActive) return;
    if (!videoRef.current) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new BrowserMultiFormatReader();
        scannerRef.current = scanner;
        scanGuardRef.current = false;

        scannerControlsRef.current = await scanner.decodeFromVideoDevice(undefined, videoRef.current!, async (result, error) => {
          if (!mounted) return;

          if (result && !scanGuardRef.current) {
            scanGuardRef.current = true;
            const decoded = result.getText();
            stopCameraScanner();
            setScanCode(decoded);
            await verifyAttendanceCode(decoded, "camera");
            return;
          }

          if (error && (error as { name?: string })?.name !== "NotFoundException") {
            setScanResult("Kamera aktif, tetapi kode belum terbaca jelas. Coba arahkan ulang kamera.");
          }
        });
      } catch (error: any) {
        if (!mounted) return;
        setCameraActive(false);
        toast({
          variant: "destructive",
          title: "Kamera tidak bisa dibuka",
          description: error?.message || "Pastikan izin kamera di browser sudah diberikan.",
        });
      }
    };

    startScanner();

    return () => {
      mounted = false;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      scannerRef.current = null;
      scanGuardRef.current = false;
    };
  }, [cameraActive, toast]);

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
              <p className="text-[10px] tracking-[0.35em] text-white/75">Guide Dashboard</p>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-wide text-white sm:text-5xl md:text-6xl">
                Route Briefing
              </h1>
              <p className="text-sm font-semibold text-white/90">Selamat datang, {currentGuideName}</p>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Kelola jadwal, data peserta, dan laporan tur harian dalam satu panel bergaya eksplorasi.
              </p>
              <Button className="h-10 rounded-full bg-white px-5 text-xs font-bold text-black hover:bg-white/90">
                Explore Routes <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Dashboard Pemandu</h2>
            <p className="text-sm text-zinc-600">Kelola tur jalan kaki Anda.</p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] md:text-xs">Akses Pemandu Aktif</Badge>
        </div>

        <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl md:text-2xl">Estimasi Pendapatan Anda</CardTitle>
            <CardDescription className="text-zinc-300">Total estimasi komisi (35%) dari semua tur berbayar yang ditugaskan kepada Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-[#98DDCA]">
              Rp {myRevenue.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-none bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold md:text-2xl">
              <QrCode className="h-5 w-5" /> Scan Barcode Absensi
            </CardTitle>
            <CardDescription>Scan via kamera atau masukkan kode QR/barcode dari email peserta untuk menandai kehadiran.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
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
            </div>

            <div className="flex flex-wrap gap-2">
              {!cameraActive ? (
                <Button type="button" variant="outline" onClick={handleStartCamera} className="rounded-full">
                  <Camera className="mr-2 h-4 w-4" /> Scan dari Kamera
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={stopCameraScanner} className="rounded-full">
                  Stop Kamera
                </Button>
              )}
            </div>

            {cameraActive && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
                <video ref={videoRef} className="h-[260px] w-full rounded-xl bg-black object-cover" muted playsInline />
                <p className="pt-2 text-xs text-zinc-500">Arahkan kamera ke barcode/QR peserta sampai terbaca otomatis.</p>
              </div>
            )}

          </CardContent>
          {scanResult && (
            <CardFooter className="pt-0">
              <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {scanResult}
              </div>
            </CardFooter>
          )}
        </Card>

        {apiLoading ? (
          <Card className="rounded-[28px] border-dashed p-20 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              <p className="text-muted-foreground">Memuat jadwal guide...</p>
            </div>
          </Card>
        ) : groupedTourGroups && groupedTourGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="rounded-[28px] border-none bg-white shadow-md lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold ">
                  <Calendar className="h-4 w-4" /> Jadwal Saya
                </CardTitle>
                <CardDescription>Pilih jadwal untuk melihat detail peserta.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {groupedTourGroups.map((group: any) => (
                  <button
                    key={group.id}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedGroup?.id === group.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"}`}
                    onClick={() => setSelectedTourId(group.id)}
                    type="button"
                  >
                    <p className="truncate text-sm font-bold md:text-base">{group.tourName}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className={`text-[10px] md:text-xs ${selectedGroup?.id === group.id ? "text-zinc-300" : "text-zinc-500"}`}>
                        {group.tourDate}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] md:text-[10px] px-1.5 rounded-full ${selectedGroup?.id === group.id ? "border-white/40 bg-white/10 text-white" : "border-zinc-300"}`}
                      >
                        {group.isDemo ? "Demo" : "Aktif"}
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
                      <CardTitle className="truncate text-xl font-bold md:text-2xl">{selectedGroup?.tourName}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1 text-xs text-zinc-300">
                        <MapPin className="h-3 w-3" /> Lokasi Tur • {selectedGroup?.tourDate}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <GuideAnnouncementDialog
                        tourId={selectedGroup?.tourId || ""}
                        tourName={selectedGroup?.tourName || ""}
                        tourDate={selectedGroup?.tourDate || ""}
                      />
                      <GuideAttendanceDialog
                        tourId={selectedGroup?.tourId || ""}
                        tourName={selectedGroup?.tourName || ""}
                        tourDate={selectedGroup?.tourDate || ""}
                        bookings={selectedGroup?.bookings || []}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 md:p-6">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold md:text-base">
                      <Users className="h-4 w-4" /> Detail Peserta ({selectedGroup?.bookings.reduce((sum: number, b: any) => sum + (Number(b.pax) || 0), 0)} Orang)
                    </h3>
                    <Badge variant="outline" className="rounded-full bg-zinc-50 font-semibold text-zinc-700">
                      {selectedGroup?.bookings.length} Pemesanan
                    </Badge>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                    {selectedGroup?.bookings.map((booking: any) => (
                      <div key={booking.id} className="rounded-2xl bg-zinc-50 border border-zinc-200/60 p-4 text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-bold text-zinc-950">{booking.userName}</p>
                          <Badge variant="secondary" className="rounded-full bg-zinc-200/50 text-[10px] text-zinc-600">
                            Booking: {booking.id.startsWith("local-") ? booking.id.slice(0, 12) : booking.id.slice(0, 8)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-zinc-600">
                          <p>WhatsApp: <span className="font-semibold text-zinc-800">{booking.userWhatsApp}</span></p>
                          <p>Email: <span className="text-zinc-800">{booking.userEmail}</span></p>
                          {booking.userEmergencyContact && (
                            <p className="md:col-span-2 mt-0.5 text-red-600 flex items-center gap-1">
                              <span className="font-semibold">Kontak Darurat:</span> {booking.userEmergencyContact}
                            </p>
                          )}
                        </div>

                        {booking.participantNames && (
                          <div className="text-xs text-zinc-700 bg-white p-2.5 rounded-lg border border-black/5">
                            <strong className="block text-zinc-800 mb-0.5">Peserta Tambahan:</strong>
                            {booking.participantNames}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="outline" className="rounded-full bg-white text-[11px] text-zinc-700">
                            Domisili: {booking.domicile} {booking.customDomicile ? `(${booking.customDomicile})` : ""}
                          </Badge>
                          <Badge variant="outline" className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-zinc-800">
                            {booking.pax} Pax
                          </Badge>
                          {(() => {
                            const isHemat =
                              booking.tourName?.toLowerCase().includes("hemat") ||
                              (!booking.tourName?.toLowerCase().includes("reguler") &&
                                (() => {
                                  const matchedTour = toursList.find((t: any) => t.id === booking.tourId);
                                  return matchedTour?.priceHemat != null &&
                                    Number(booking.pricePerPax) === Number(matchedTour.priceHemat);
                                })());
                            return isHemat ? (
                              <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-full text-[10px]">
                                Paket Hemat
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full text-[10px]">
                                Paket Reguler
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-center justify-between gap-4 border-t bg-zinc-50 p-4 sm:flex-row">
                  <p className="text-xs italic text-zinc-600">Siapkan cerita lokal terbaik Anda!</p>
                </CardFooter>
              </Card>

              <Card className="rounded-[28px] border-none bg-white shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 p-4 md:p-6">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-zinc-500">Trip Reminder</p>
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
        <Footer className="w-full rounded-[34px] mt-0" />
      </div>
    </div>
  )
}

