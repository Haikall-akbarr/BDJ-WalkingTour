
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, CheckCircle2, MessageSquareText, LogOut } from "lucide-react"
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

const MY_SCHEDULE = [
  {
    id: "s1",
    tourName: "Pacinan Walking Tour",
    date: "15 Jan 2024",
    time: "08:00 WIB",
    status: "Mendatang",
    location: "Kampung Pecinan",
    participants: [
      { name: "Andi Wijaya", wa: "08123456789", pax: 2 },
      { name: "Siti Rahma", wa: "08219876543", pax: 1 },
      { name: "Budi Santoso", wa: "08534567123", pax: 3 }
    ]
  },
  {
    id: "s2",
    tourName: "Riverfront Discovery",
    date: "18 Jan 2024",
    time: "16:00 WIB",
    status: "Dikonfirmasi",
    location: "Siring Menara Pandang",
    participants: [
      { name: "Jessica Lee", wa: "08192837465", pax: 1 }
    ]
  }
];

export default function GuideDashboard() {
  const [selectedTour, setSelectedTour] = useState(MY_SCHEDULE[0]);
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pemandu Lokal</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
              <AlertDialogDescription>
                Pastikan Anda telah mengirimkan laporan tur jika ada tur yang baru saja selesai.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
                Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Dashboard Pemandu</h1>
          <p className="text-muted-foreground">Kelola tur jalan kaki Anda mendatang.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1">Akses Pemandu Aktif</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Jadwal Saya
          </h2>
          {MY_SCHEDULE.map((tour) => (
            <Card 
              key={tour.id} 
              className={`cursor-pointer transition-all border-l-4 ${selectedTour.id === tour.id ? 'border-l-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => setSelectedTour(tour)}
            >
              <CardContent className="p-4">
                <p className="font-bold">{tour.tourName}</p>
                <div className="flex justify-between items-end mt-2">
                  <div className="text-xs text-muted-foreground">
                    <p>{tour.date}</p>
                    <p>{tour.time}</p>
                  </div>
                  <Badge variant={tour.status === 'Mendatang' ? 'secondary' : 'default'} className="text-[10px]">
                    {tour.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-headline">{selectedTour.tourName}</CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Konfirmasi Kehadiran
                </Button>
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {selectedTour.location} • {selectedTour.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                  <Users className="h-4 w-4 text-primary" /> Daftar Peserta ({selectedTour.participants.reduce((acc, p) => acc + p.pax, 0)} Total Pax)
                </h3>
                <div className="grid gap-2">
                  {selectedTour.participants.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted/40 text-sm">
                      <div className="space-y-0.5">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.wa}</p>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {p.pax} Pax
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground italic">Siapkan perlengkapan dan cerita lokal Anda!</p>
              <Link href={`/dashboard/guide/${selectedTour.id}/report`}>
                <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
                  <MessageSquareText className="h-4 w-4" /> Kirim Laporan Tur
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
