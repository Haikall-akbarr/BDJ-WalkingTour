"use client"

import Link from "next/link"
import { MapPin, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#10221f]/85 text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#10221f]/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-white/8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f] shadow-sm">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/65">Banjarmasin Route</span>
            <span className="font-headline text-base font-bold text-white md:text-lg">BDJ WalkingTour</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link href="/" className="rounded-full px-4 py-2 text-white/80 transition-colors hover:bg-white/8 hover:text-white">Beranda</Link>
          <Link href="/#tours" className="rounded-full px-4 py-2 text-white/80 transition-colors hover:bg-white/8 hover:text-white">Semua Tur</Link>
          <Link href="/login" className="rounded-full px-4 py-2 text-white/80 transition-colors hover:bg-white/8 hover:text-white">Login Staf</Link>
          <Link href="/book/1" className="ml-2">
            <Button className="rounded-full bg-[#98DDCA] px-6 text-[#10221f] hover:bg-[#b8eadc]">
              Pesan Sekarang
            </Button>
          </Link>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10 hover:text-white">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-[#10221f]/96 text-white sm:w-[400px]">
              <div className="flex flex-col gap-4">
                <SheetTitle className="flex items-center gap-3 text-2xl font-headline text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                    <MapPin className="h-6 w-6" />
                  </span>
                  <span className="leading-tight">BDJ WalkingTour</span>
                </SheetTitle>
                <SheetDescription className="text-white/70">
                  Menu navigasi untuk menjelajahi layanan kami.
                </SheetDescription>
              </div>
              <nav className="mt-12 flex flex-col gap-3">
                <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium transition-colors hover:bg-white/10 hover:text-white">Beranda</Link>
                <Link href="/#tours" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium transition-colors hover:bg-white/10 hover:text-white">Semua Tur</Link>
                <Link href="/login" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base font-medium transition-colors hover:bg-white/10 hover:text-white">Login Staf</Link>
                <Link href="/book/1">
                  <Button className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
                    Pesan Sekarang
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
