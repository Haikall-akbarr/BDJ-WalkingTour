
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { useToast } from "@/hooks/use-toast"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const STATS = [
  { label: "Climbers Equipped", value: "20K+", trend: "+12%" },
  { label: "Successful Expeditions", value: "2K+", trend: "+5%" },
  { label: "Trusted Reviews", value: "5K+", trend: "Stabil" }
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'Mei', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const GUIDES = [
  { id: "g1", name: "Andi Saputra" },
  { id: "g2", name: "Budi Santoso" },
  { id: "g3", name: "Siti Aminah" },
  { id: "g4", name: "Diana Putri" },
];

const MOCK_BOOKINGS = [
  { 
    id: "mock-b1", 
    tourName: "Pacinan Walking Tour", 
    userName: "Rizky Ramadhan", 
    pax: 2, 
    createdAt: { toDate: () => new Date() }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b2", 
    tourName: "Susur Sungai Martapura", 
    userName: "Lutfi Hakim", 
    pax: 1, 
    createdAt: { toDate: () => new Date() }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b3", 
    tourName: "Pacinan Walking Tour", 
    userName: "Hendra Wijaya", 
    pax: 3, 
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b4", 
    tourName: "Susur Sungai Martapura", 
    userName: "Anita Sari", 
    pax: 2, 
    createdAt: { toDate: () => new Date(Date.now() - 172800000) }, 
    status: "approved", 
    guideId: null 
  }
];

export default function OwnerDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedGuides, setSelectedGuides] = useState<Record<string, string>>({});
  const [removedMockIds, setRemovedMockIds] = useState<string[]>([]);

  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
  }, []);

  const showcaseImages = useMemo(() => {
    return PlaceHolderImages.slice(0, 3);
  }, []);

  const unassignedQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "bookings"), 
      where("status", "==", "approved"),
      where("guideId", "==", null)
    );
  }, [db]);

  const { data: dbBookings, loading } = useCollection(unassignedQuery);

  const bookingsToDisplay = useMemo(() => {
    const activeMocks = MOCK_BOOKINGS.filter(b => !removedMockIds.includes(b.id));
    if (!dbBookings || dbBookings.length === 0) return activeMocks;
    return [...dbBookings, ...activeMocks];
  }, [dbBookings, removedMockIds]);

  const handleAssignGuide = (bookingId: string) => {
    const guideId = selectedGuides[bookingId];
    if (!guideId) return;

    const guideName = GUIDES.find(g => g.id === guideId)?.name;

    // Handle Mock Data (Simulasi)
    if (bookingId.startsWith('mock-')) {
      setRemovedMockIds(prev => [...prev, bookingId]);
      toast({
        title: "Berhasil (Simulasi)",
        description: `Pemandu ${guideName} telah ditugaskan (Hanya tampilan).`,
      });
      return;
    }

    // Handle Real Firestore Data
    if (!db) return;
    const bookingRef = doc(db, "bookings", bookingId);
    
    updateDoc(bookingRef, { 
      guideId: guideId,
      guideName: guideName
    }).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: `bookings/${bookingId}`,
        operation: "update",
        requestResourceData: { guideId, guideName }
      });
      errorEmitter.emit("permission-error", permissionError);
    });

    toast({
      title: "Penugasan Berhasil",
      description: `Pemandu ${guideName} telah ditugaskan.`,
    });
  };

  const handleLogout = () => {
    router.push("/");
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
                {[
                  "Home",
                  "Gears",
                  "About",
                  "Destination",
                  "Contact",
                ].map((menu) => (
                  <span
                    key={menu}
                    className="rounded-full px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/20"
                  >
                    {menu}
                  </span>
                ))}

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
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/70">Owner Dashboard</p>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-5xl md:text-7xl">
                New Heights
              </h1>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Built for climbers who demand reliability at every altitude. Semua fitur dashboard tetap aktif, kini dalam tampilan eksplorasi yang lebih modern.
              </p>

              <div className="pt-2">
                <Button className="h-10 rounded-full bg-white px-5 text-xs font-bold uppercase text-black hover:bg-white/90">
                  Connect <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-sm">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-white/80">{stat.label}</p>
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
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/60">Destination Picks</p>
                <h2 className="max-w-xs text-3xl font-black uppercase leading-[0.95] md:text-5xl lg:text-[3.75rem]">
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
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Where every route begins with the right step</p>
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
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">Featured</p>
                    <p className="text-lg font-bold">River & Heritage Route</p>
                  </div>
                  <span className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] backdrop-blur">
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
                <CardTitle className="flex items-center gap-2 text-2xl font-black uppercase">
                  <Compass className="h-6 w-6" /> Not Sure Where To Go Next
                </CardTitle>
                <CardDescription>Jelajahi rute paling cocok untuk level petualangan Anda.</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-none bg-zinc-900 text-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Ikhtisar Pendapatan</CardTitle>
                <CardDescription className="text-zinc-300">Visualisasi pertumbuhan pendapatan bulanan.</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#d4d4d8" }} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.08)" }} />
                    <Bar dataKey="value" fill="#98DDCA" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[28px] border-none bg-white shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-black uppercase">
                <Mountain className="h-5 w-5" /> Alokasi Pemandu
              </CardTitle>
              <CardDescription>Tugaskan pemandu untuk pesanan yang sudah disetujui.</CardDescription>
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
                        <span>{booking.createdAt?.toDate().toLocaleDateString("id-ID")}</span>
                        <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                          {booking.pax} Pax {booking.id.startsWith("mock-") && "(Simulasi)"}
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
                          {GUIDES.map((guide) => (
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
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/55">BDJ WalkingTour</p>
                <h4 className="max-w-lg text-3xl font-black uppercase leading-tight md:text-5xl">
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
                <p className="text-xs uppercase tracking-[0.25em] text-white/55">Quick Access</p>
                <div className="flex flex-col gap-2 text-sm text-white/75">
                  <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Beranda
                  </Link>
                  <Link href="#tours" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Semua Tur
                  </Link>
                  <Link href="/login" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Login Staf
                  </Link>
                  <Link href="/book/1" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10 hover:text-white">
                    Pesan Sekarang
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/55">Contact</p>
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
              <p>© 2026 BDJ WalkingTour. All rights reserved.</p>
              <p className="uppercase tracking-[0.25em]">Owner Dashboard UI Refresh</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
