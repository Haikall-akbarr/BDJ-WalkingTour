
"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, CheckCircle2, MessageSquareText, LogOut, Loader2 } from "lucide-react"
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

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Pemandu Lokal</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 w-full sm:w-auto">
              <LogOut className="h-4 w-4" /> Keluar
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold font-headline">Dashboard Pemandu</h1>
          <p className="text-sm text-muted-foreground">Kelola tur jalan kaki Anda.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 w-fit text-[10px] md:text-xs">Akses Pemandu Aktif</Badge>
      </div>

      {loading && (!dbTours || dbTours.length === 0) ? (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Memuat jadwal tur Anda...</p>
        </div>
      ) : myTours && myTours.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Jadwal Saya
            </h2>
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
              {myTours.map((tour: any) => (
                <Card 
                  key={tour.id} 
                  className={`cursor-pointer transition-all border-l-4 shrink-0 w-64 lg:w-full ${selectedTour?.id === tour.id ? 'border-l-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedTourId(tour.id)}
                >
                  <CardContent className="p-4">
                    <p className="font-bold text-sm md:text-base truncate">{tour.tourName}</p>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        <p>{tour.createdAt?.toDate().toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant="default" className="text-[9px] md:text-[10px] px-1.5 bg-green-500">
                        {tour.id.startsWith('mock') ? 'Demo' : 'Aktif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-4 bg-muted/20">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg md:text-xl font-headline truncate">{selectedTour?.tourName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[10px] md:text-xs">
                      <MapPin className="h-3 w-3" /> Lokasi Tur • {selectedTour?.createdAt?.toDate().toLocaleDateString('id-ID')}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="text-[10px] md:text-xs gap-1 h-8">
                    <CheckCircle2 className="h-3 w-3" /> Absensi
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 border-b pb-2">
                    <Users className="h-4 w-4 text-primary" /> Detail Peserta
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/40 text-xs md:text-sm gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-lg">{selectedTour?.userName}</p>
                        <p className="text-muted-foreground">{selectedTour?.userWhatsApp}</p>
                        <p className="text-[10px]">{selectedTour?.userEmail}</p>
                        <p className="text-xs bg-white/50 p-1 rounded mt-1 inline-block">
                          Domisili: {selectedTour?.domicile} {selectedTour?.customDomicile ? `(${selectedTour.customDomicile})` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-white shrink-0 text-xl p-4 h-auto">
                        {selectedTour?.pax} Pax
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[10px] md:text-xs text-muted-foreground italic text-center sm:text-left">Siapkan cerita lokal terbaik Anda!</p>
                <Link href={`/dashboard/guide/${selectedTour?.id}/report`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-white gap-2 text-xs h-9">
                    <MessageSquareText className="h-4 w-4" /> Laporan Tur
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-20 text-center border-dashed">
          <p className="text-muted-foreground">Anda belum memiliki jadwal tur yang ditugaskan.</p>
        </Card>
      )}
    </div>
  )
}
