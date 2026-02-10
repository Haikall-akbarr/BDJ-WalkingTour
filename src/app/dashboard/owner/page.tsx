
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  Users, 
  Map, 
  DollarSign, 
  CalendarClock,
  UserPlus,
  LogOut,
  MapPin
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

const STATS = [
  { label: "Total Pendapatan", value: "Rp 12,5 Juta", icon: DollarSign, trend: "+12%", color: "text-green-600" },
  { label: "Total Pemesanan", value: "184", icon: Users, trend: "+5%", color: "text-blue-600" },
  { label: "Tur Aktif", value: "8", icon: Map, trend: "Stabil", color: "text-primary-foreground" }
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'Mei', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const UNASSIGNED_TOURS = [
  { id: "t1", name: "Heritage Trail", date: "22 Jan 2024", time: "09:00 WIB", pax: 12 },
  { id: "t2", name: "Pasar Terapung Kuin", date: "23 Jan 2024", time: "05:30 WIB", pax: 8 },
  { id: "t3", name: "Pacinan Night Walk", date: "25 Jan 2024", time: "19:00 WIB", pax: 15 },
];

const GUIDES = [
  { id: "g1", name: "Andi Saputra" },
  { id: "g2", name: "Budi Santoso" },
  { id: "g3", name: "Siti Aminah" },
  { id: "g4", name: "Diana Putri" },
];

export default function OwnerDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Business Insight</p>
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
                Sesi Anda akan berakhir dan Anda akan diarahkan ke halaman utama.
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Pemantauan Bisnis</h1>
          <p className="text-muted-foreground">Ringkasan real-time operasional BDJ WalkingTour.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Ekspor Laporan</Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Ringkasan Bulanan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className={`text-xs ${stat.color} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" /> {stat.trend} bulan ini
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-xl">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Ikhtisar Pendapatan</CardTitle>
            <CardDescription>Visualisasi pertumbuhan pendapatan bulanan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Bar dataKey="value" fill="#98DDCA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-secondary" /> 
              Tur Mendatang (Alokasi Pemandu)
            </CardTitle>
            <CardDescription>Alokasikan sumber daya untuk jadwal mendatang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {UNASSIGNED_TOURS.map((tour) => (
              <div key={tour.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-slate-50 gap-4">
                <div className="space-y-1">
                  <p className="font-bold">{tour.name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{tour.date}</span>
                    <span>•</span>
                    <span>{tour.time}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-[10px] py-0">{tour.pax} Pax</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Pilih Pemandu" />
                    </SelectTrigger>
                    <SelectContent>
                      {GUIDES.map(guide => (
                        <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                    <UserPlus className="h-3 w-3" /> Tugaskan
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
