
"use client"

import Link from "next/link"
import { MapPin, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary-foreground">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="font-headline">BDJ WalkingTour</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Beranda
          </Link>
          <Link href="#tours" className="transition-colors hover:text-primary">
            Daftar Tur
          </Link>
          <Link href="/login" className="transition-colors hover:text-primary">
            Login Staf
          </Link>
          <Link href="/book/1">
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-6">
              Pesan Sekarang
            </Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-6 mt-12">
                <Link href="/" className="text-lg font-medium hover:text-primary">
                  Beranda
                </Link>
                <Link href="#tours" className="text-lg font-medium hover:text-primary">
                  Daftar Tur
                </Link>
                <Link href="/login" className="text-lg font-medium hover:text-primary">
                  Login Staf
                </Link>
                <Link href="/book/1">
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-full">
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
