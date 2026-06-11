"use client"

import { useState } from "react"
import Link from "next/link"
import { Map, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSessionUser } from "@/hooks/use-session-user"
import { signOutFirebase } from "@/lib/firebaseClient"
import { NotificationBell } from "@/components/NotificationBell"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function FloatingNavbar() {
  const { user, loading: authLoading } = useSessionUser()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOutFirebase()
    } catch (err) {
      console.error('Client signOut failed:', err)
    }
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <>
      <div className="absolute top-6 left-0 right-0 z-50 mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="flex w-full flex-row items-center justify-between rounded-full border border-white/15 bg-black/20 px-4 py-2.5 backdrop-blur-md lg:px-5 lg:py-3">
          <Link href="/" className="flex items-center gap-2 text-white shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#98DDCA] text-[#16302c] shadow-sm shrink-0">
              <Map className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="hidden sm:inline text-[9px] tracking-[0.3em] text-white/65">Banjarmasin Route</span>
              <span className="font-headline text-sm font-bold text-white md:text-lg">BDJ WalkingTour</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-white/85">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Beranda</Link>
            <Link href="/tours" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Explore</Link>
            <Link href="/book/new" className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">Pesan Sekarang</Link>
            <button onClick={() => setFaqOpen(true)} className="rounded-full px-4 py-2 transition-colors hover:bg-white/8 hover:text-white">FAQ</button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {!authLoading && !user && (
              <Link href="/login">
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-[#98DDCA] px-3 text-xs font-semibold text-[#16302c] hover:bg-[#b8eadc]"
                >
                  Login
                </Button>
              </Link>
            )}
            {!authLoading && user && (
              <>
                <NotificationBell />
                <Link href={user.role === 'admin' ? '/dashboard/admin' : user.role === 'owner' ? '/dashboard/owner' : user.role === 'guide' ? '/dashboard/guide' : '/dashboard/user'}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20 hover:text-white"
                  >
                    Profil
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="h-8 rounded-full bg-[#e15959] px-3 text-xs font-semibold text-white hover:bg-[#c84a4a]"
                  onClick={() => setLogoutDialogOpen(true)}
                >
                  keluar
                </Button>
              </>
            )}

            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] border-l border-white/10 bg-[#16302c]/95 text-white backdrop-blur-xl">
                  <div className="flex flex-col gap-4">
                    <SheetTitle className="flex items-center gap-3 text-xl font-headline text-white mt-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#98DDCA] text-[#16302c]">
                        <Map className="h-5 w-5" />
                      </span>
                      <span className="leading-tight">BDJ WalkingTour</span>
                    </SheetTitle>
                  </div>
                  <nav className="mt-8 flex flex-col gap-2">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white">Beranda</Link>
                    <Link href="/tours" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white">Explore</Link>
                    <Link href="/book/new" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white">Pesan Sekarang</Link>
                    <button onClick={() => { setFaqOpen(true); setMobileMenuOpen(false); }} className="text-left rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white">FAQ</button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold md:text-3xl">Pertanyaan Umum</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-medium">Apakah saya membutuhkan pengalaman berjalan kaki sebelumnya?</AccordionTrigger>
                <AccordionContent className="text-zinc-600">Tidak. Tur kami dirancang untuk pemula maupun peserta berpengalaman dengan ritme yang santai.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-medium">Bagaimana cara memilih rute yang tepat untuk perjalanan saya?</AccordionTrigger>
                <AccordionContent className="text-zinc-600">Pilih paket sesuai jarak, durasi, dan rekomendasi kebutuhan perjalanan yang tersedia di halaman detail tur.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-medium">Apakah tur ini dipandu oleh pemandu lokal berpengalaman?</AccordionTrigger>
                <AccordionContent className="text-zinc-600">Ya, setiap rute dipandu oleh warga lokal yang memahami sejarah, budaya, dan cerita unik kawasan tersebut.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-medium">Bagaimana jika rute yang tersedia tidak sesuai dengan kebutuhan saya?</AccordionTrigger>
                <AccordionContent className="text-zinc-600">Tim kami siap membantu melakukan penyesuaian jadwal atau rute khusus sebelum keberangkatan agar perjalanan Anda tetap nyaman.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin ingin keluar?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi Anda akan diakhiri dan perlu login kembali untuk mengakses fitur akun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#16302c] text-white hover:bg-[#0f211d]"
              onClick={handleLogout}
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
