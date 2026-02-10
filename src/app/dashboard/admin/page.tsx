
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit, 
  History,
  ShieldCheck,
  Check,
  X,
  LogOut,
  MapPin
} from "lucide-react"
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

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 md:space-y-8">
      {/* Header Responsif */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
            <History className="h-4 w-4" /> Log Sistem
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 shrink-0">
                <LogOut className="h-4 w-4" /> Keluar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[90%] max-w-lg rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan keluar dari dashboard admin dan kembali ke halaman utama.
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

      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold font-headline">Pusat Kontrol Admin</h2>
        <p className="text-sm md:text-base text-muted-foreground">Kelola pengguna sistem, tur, dan pengaturan global.</p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-white border w-max sm:w-full justify-start p-1 h-auto mb-4">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 md:px-6 text-xs md:text-sm">Pemesanan Pending</TabsTrigger>
            <TabsTrigger value="tours" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 md:px-6 text-xs md:text-sm">Kelola Tur</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 md:px-6 text-xs md:text-sm">Kelola Pengguna</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bookings" className="space-y-4 outline-none">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Permintaan Pemesanan Baru</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Setujui atau tolak permintaan pendaftaran baru.</CardDescription>
                </div>
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari pemesanan..." className="pl-10 text-sm" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 md:p-4 text-left font-medium">Pelanggan</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tur</th>
                      <th className="p-3 md:p-4 text-center font-medium">Pax</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tanggal</th>
                      <th className="p-3 md:p-4 text-left font-medium">Status</th>
                      <th className="p-3 md:p-4 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-3 md:p-4 whitespace-nowrap">
                          <p className="font-bold">John Doe {i}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">08123456789</p>
                        </td>
                        <td className="p-3 md:p-4 whitespace-nowrap">Pacinan Walking Tour</td>
                        <td className="p-3 md:p-4 text-center">2</td>
                        <td className="p-3 md:p-4 whitespace-nowrap">15 Jan 2024</td>
                        <td className="p-3 md:p-4">
                          <Badge variant="outline" className="text-[10px] md:text-xs text-amber-600 border-amber-200 bg-amber-50 whitespace-nowrap">
                            Menunggu Persetujuan
                          </Badge>
                        </td>
                        <td className="p-3 md:p-4 text-right space-x-1 whitespace-nowrap">
                          <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8 text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tours" className="space-y-4 outline-none">
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" /> Paket Tur Baru
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden border-none shadow-md group">
                <div className="h-32 md:h-40 bg-slate-200 flex items-center justify-center relative">
                  <span className="text-muted-foreground text-xs">Thumbnail Tur</span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm"><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-base md:text-lg">Paket Alpha {i}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Rp 65.000 • 3 KM • 2 Jam</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 outline-none">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Manajemen Pengguna</CardTitle>
                <CardDescription className="text-xs md:text-sm">Atur peran dan kelola akses staf.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto gap-2"><Settings className="h-4 w-4" /> Peran</Button>
            </CardHeader>
            <CardContent className="space-y-2 px-3 md:px-6">
              {[
                { name: "Nama Pemilik", role: "Owner", icon: ShieldCheck },
                { name: "Admin Alpha", role: "Admin", icon: Settings },
                { name: "Pemandu Beta", role: "Guide", icon: Plus }
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl border hover:bg-muted/10 transition-colors gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <user.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">staf_{i}@bdjwalkingtour.com</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0">{user.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
