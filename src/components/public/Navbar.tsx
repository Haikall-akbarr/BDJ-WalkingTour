
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-foreground">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-headline">BDJ WalkingTour</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-primary transition-colors font-body">Beranda</Link>
          <Link href="/#tours" className="hover:text-primary transition-colors font-body">Semua Tur</Link>
          <Link href="/login" className="hover:text-primary transition-colors font-body">Login Staf</Link>
          <Link href="/book/1">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-body">Pesan Sekarang</Button>
          </Link>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4">
                <SheetTitle className="font-headline text-2xl flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  BDJ WalkingTour
                </SheetTitle>
                <SheetDescription className="font-body">
                  Menu navigasi untuk menjelajahi layanan kami.
                </SheetDescription>
              </div>
              <nav className="flex flex-col gap-6 mt-12">
                <Link href="/" className="text-lg font-medium hover:text-primary transition-colors font-body">Beranda</Link>
                <Link href="/#tours" className="text-lg font-medium hover:text-primary transition-colors font-body">Semua Tur</Link>
                <Link href="/login" className="text-lg font-medium hover:text-primary transition-colors font-body">Login Staf</Link>
                <Link href="/book/1">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-body">Pesan Sekarang</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
