
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, UserCircle } from "lucide-react"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary-foreground">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-headline">JelajahBorneoKu</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link href="/tours" className="text-sm font-medium hover:text-primary transition-colors">Tour List</Link>
          <Link href="/#about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-2">
              <UserCircle className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
