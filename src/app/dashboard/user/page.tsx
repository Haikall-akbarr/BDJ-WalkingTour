"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Compass, MapPin, Ticket, Mail, UserRound } from "lucide-react"
import { useSessionUser } from "@/hooks/use-session-user"
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog"
import { NotificationBell } from "@/components/NotificationBell"

export default function UserDashboardPage() {
  const { user, loading } = useSessionUser()

  const userInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-6 md:px-8 md:py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,_rgba(16,34,31,1)_0%,_rgba(24,56,50,1)_48%,_rgba(152,221,202,0.95)_100%)] px-5 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur">
                  {userInitial}
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.25em] text-white/80">
                    <MapPin className="h-3.5 w-3.5" />
                    BDJ WalkingTour
                  </div>
                  <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                    {loading ? "Memuat profil..." : user?.name || "Dashboard User"}
                  </h1>
                  <p className="mt-1 text-sm text-white/80">
                    {loading ? "Sedang mengambil sesi login." : user?.email || "Email login belum tersedia."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <NotificationBell />
                <LogoutConfirmDialog>
                  <Button variant="secondary" className="rounded-full bg-white text-[#16302c] hover:bg-white/90">
                    <span className="mr-2">Keluar</span>
                  </Button>
                </LogoutConfirmDialog>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr,0.9fr]">
          <Card className="rounded-[24px] border-none bg-white shadow-md">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#98DDCA]">Profil Aktif</Badge>
              <CardTitle className="text-2xl font-black uppercase">Akun yang sedang login</CardTitle>
              <CardDescription>Informasi di bawah mengikuti akun yang sedang Anda gunakan saat login.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Nama</p>
                <p className="mt-2 text-lg font-bold text-zinc-900">{user?.name || "Belum tersedia"}</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
                <p className="mt-2 text-lg font-bold text-zinc-900 break-words">{user?.email || "Belum tersedia"}</p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Role</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                    <UserRound className="mr-2 h-4 w-4" /> User Peserta
                  </Badge>
                  <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                    <Mail className="mr-2 h-4 w-4" /> Email mengikuti akun login
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-none bg-[#10221f] text-white shadow-md">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-white/10 text-white hover:bg-white/10">Next Step</Badge>
              <CardTitle className="text-2xl font-black uppercase">Lanjutkan ke pemesanan</CardTitle>
              <CardDescription className="text-white/70">Pilih tur, isi nomor WhatsApp, lalu lanjut ke pembayaran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/tours" className="block">
                <Button className="w-full rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#b8eadc]">
                  <Compass className="mr-2 h-4 w-4" /> Lihat Semua Tur
                </Button>
              </Link>
              <Link href="/book/new" className="block">
                <Button variant="outline" className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Ticket className="mr-2 h-4 w-4" /> Buat Pemesanan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="rounded-[24px] border-none shadow-md">
            <CardHeader>
              <Badge className="w-fit rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#98DDCA]">Explore</Badge>
              <CardTitle className="text-2xl font-black uppercase">Mulai Jelajah Tur</CardTitle>
              <CardDescription>Lihat paket tur terbaru dan pilih rute favorit Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tours">
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
