"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Compass, LogOut, MapPin, Ticket } from "lucide-react"

export default function UserDashboardPage() {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-6 md:px-8 md:py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold tracking-wide">
                <MapPin className="h-4 w-4" />
                BDJ WalkingTour
              </div>
              <h1 className="mt-3 text-3xl font-black uppercase leading-tight md:text-4xl">Dashboard User</h1>
              <p className="mt-1 text-sm text-zinc-600">Selamat datang. Jelajahi tur dan kelola pemesanan Anda di sini.</p>
            </div>
            <Button variant="outline" className="rounded-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="rounded-[24px] border-none shadow-md">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#98DDCA]">Explore</Badge>
              <CardTitle className="text-2xl font-black uppercase">Mulai Jelajah Tur</CardTitle>
              <CardDescription>Lihat paket tur terbaru dan pilih rute favorit Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/#tours">
                <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800">
                  <Compass className="mr-2 h-4 w-4" /> Lihat Semua Tur
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-none shadow-md">
            <CardHeader>
              <Badge variant="outline" className="w-fit rounded-full">Booking</Badge>
              <CardTitle className="text-2xl font-black uppercase">Pemesanan Saya</CardTitle>
              <CardDescription>Masuk ke halaman pemesanan untuk mengatur jadwal tur Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/book/1">
                <Button variant="outline" className="rounded-full">
                  <Ticket className="mr-2 h-4 w-4" /> Buat Pemesanan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
