
"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/public/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ArrowRight, Loader2, Clock, Map } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

export default function LandingPage() {
  const db = useFirestore();
  
  const toursQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "tours"), limit(6));
  }, [db]);

  const { data: dynamicTours, loading: toursLoading } = useCollection(toursQuery);
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-center overflow-hidden bg-slate-900">
        {heroImg?.imageUrl && (
          <Image
            src={heroImg.imageUrl}
            alt="Hero background"
            fill
            className="object-cover brightness-50"
            priority
            data-ai-hint={heroImg.imageHint}
          />
        )}
        <div className="relative z-10 container px-4 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-headline max-w-3xl mx-auto leading-tight">
            Temukan Permata Tersembunyi di <span className="text-primary">Banjarmasin</span>
          </h1>
          <p className="text-xl text-white/90 max-w-xl mx-auto">
            Rasakan keindahan sejarah dan budaya kota seribu sungai melalui kacamata pemandu lokal berpengalaman.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#tours">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-full text-lg">
                Jelajahi Tur
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-8 rounded-full text-lg backdrop-blur-sm">
              Cerita Kami
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-20 bg-background" id="tours">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-none">Tur Mendatang</Badge>
              <h2 className="text-3xl font-bold font-headline">Rute Jalan Kaki Populer</h2>
              <p className="text-muted-foreground">Pilih petualangan Anda dan pesan tempat sekarang.</p>
            </div>
            <Link href="/tours">
              <Button variant="ghost" className="group gap-2 hover:bg-primary/10">
                Lihat Semua Tur <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {toursLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : dynamicTours && dynamicTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dynamicTours.map((tour: any, idx: number) => {
                const tourImg = PlaceHolderImages[idx % PlaceHolderImages.length];
                return (
                  <Card key={tour.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="relative h-64 bg-slate-100">
                      <Image
                        src={tourImg.imageUrl}
                        alt={tour.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        data-ai-hint={tourImg.imageHint}
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-black border-none backdrop-blur-sm">
                          Rp {tour.price?.toLocaleString('id-ID')}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="font-headline text-xl">{tour.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{tour.date || "Jadwal Fleksibel"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                         <div className="flex items-center gap-1">
                           <Map className="h-3.5 w-3.5 text-primary" />
                           <span>{tour.distance}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Clock className="h-3.5 w-3.5 text-primary" />
                           <span>{tour.duration}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Users className="h-3.5 w-3.5 text-primary" />
                           <span>Grup Kecil</span>
                         </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/book/${tour.id}`} className="w-full">
                        <Button className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-full">
                          Pesan Sekarang
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center p-20 border-2 border-dashed rounded-2xl bg-muted/20">
              <p className="text-muted-foreground">Belum ada paket tur yang tersedia saat ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold font-headline">Tempat Kami Menjelajah</h2>
            <p className="text-muted-foreground">Jelajahi titik temu dan rute warisan populer kami di seluruh kota.</p>
          </div>
          <div className="aspect-[21/9] bg-white rounded-2xl shadow-inner border overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjaXR5JTIwbWFwfGVufDB8fHx8MTc3MDY5NTc2Nnww&ixlib=rb-4.1.0&q=80&w=1200')] bg-cover opacity-60">
               <div className="bg-white/90 p-6 rounded-xl shadow-xl backdrop-blur-sm text-center">
                  <MapPin className="h-10 w-10 text-secondary mx-auto mb-2 animate-bounce" />
                  <p className="font-bold text-lg">Peta Eksplorasi</p>
                  <p className="text-sm text-muted-foreground">Titik temu dan rute warisan akan ditampilkan di sini.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="font-headline">BDJ WalkingTour</span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Mendukung pariwisata lokal berkelanjutan di Banjarmasin sejak 2021. Mari melangkah bersama kami.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Tautan</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-primary">Beranda</Link></li>
              <li><Link href="/tours" className="hover:text-primary">Semua Tur</Link></li>
              <li><Link href="/login" className="hover:text-primary">Login Staf</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Kontak</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: hello@bdjwalkingtour.com</li>
              <li>WA: +62 812-3456-7890</li>
              <li>Jl. Ahmad Yani No. 123</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          &copy; 2024 BDJ WalkingTour Management System. Hak Cipta Dilindungi.
        </div>
      </footer>
    </div>
  )
}
