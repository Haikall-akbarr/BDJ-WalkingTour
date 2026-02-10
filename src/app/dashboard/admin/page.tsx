
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
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <History className="h-4 w-4" /> Log Sistem
          </Button>
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
                  Anda akan keluar dari dashboard admin dan kembali ke halaman utama.
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
      </div>

      <div className="grid gap-2">
        <h2 className="text-3xl font-bold font-headline">Pusat Kontrol Admin</h2>
        <p className="text-muted-foreground">Kelola pengguna sistem, tur, dan pengaturan global.</p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="bg-white border w-full justify-start p-1 h-auto mb-6">
          <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-6">Pemesanan Pending</TabsTrigger>
          <TabsTrigger value="tours" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-6">Kelola Tur</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-6">Kelola Pengguna</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Permintaan Pemesanan Baru</CardTitle>
                  <CardDescription>Setujui atau tolak permintaan pendaftaran baru.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari pemesanan..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-4 text-left font-medium">Pelanggan</th>
                      <th className="p-4 text-left font-medium">Tur</th>
                      <th className="p-4 text-left font-medium">Pax</th>
                      <th className="p-4 text-left font-medium">Tanggal</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-4">
                          <p className="font-bold">John Doe {i}</p>
                          <p className="text-xs text-muted-foreground">08123456789</p>
                        </td>
                        <td className="p-4">Pacinan Walking Tour</td>
                        <td className="p-4">2</td>
                        <td className="p-4">15 Jan 2024</td>
                        <td className="p-4"><Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Menunggu Persetujuan</Badge></td>
                        <td className="p-4 text-right space-x-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tours" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="h-4 w-4" /> Buat Paket Tur Baru
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden border-none shadow-md group">
                <div className="h-32 bg-slate-200 flex items-center justify-center relative">
                  <span className="text-muted-foreground text-sm">Placeholder Thumbnail Tur</span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full"><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">Paket Alpha {i}</CardTitle>
                  <CardDescription>Rp 65.000 • 3 KM • 2 Jam</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Atur peran dan kelola akses staf.</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Settings className="h-4 w-4" /> Konfig Peran</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Nama Pemilik", role: "Owner", icon: ShieldCheck },
                  { name: "Admin Alpha", role: "Admin", icon: Settings },
                  { name: "Pemandu Beta", role: "Guide", icon: Plus }
                ].map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <user.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">staf_{i}@bdjwalkingtour.com</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
