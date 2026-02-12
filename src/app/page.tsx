
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

// Data statis agar bagian tur mendatang selalu terlihat berisi
const STATIC_TOURS = [
  {
    id: "pacinan-static",
    name: "Pacinan Walking Tour",
    price: 65000,
    date: "Setiap Sabtu",
    distance: "2.5 KM",
    duration: "2 Jam",
    imageIdx: 0
  },
  {
    id: "sungai-static",
    name: "Susur Sungai Martapura",
    price: 85000,
    date: "Setiap Minggu",
    distance: "4 KM",
    duration: "1.5 Jam",
    imageIdx: 1
  },
  {
    id: "kubah-static",
    name: "Wisata Religi Kubah Basirih",
    price: 50000,
    date: "Fleksibel",
    distance: "1 KM",
    duration: "1 Jam",
    imageIdx: 2
  }
];

export default function LandingPage() {
  const db = useFirestore();
  
  const toursQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "tours"), limit(6));
  }, [db]);

  const { data: dynamicTours, loading: toursLoading } = useCollection(toursQuery);

  // Menggabungkan data dinamis dan statis
  const allTours = useMemo(() => {
    const dynamic = dynamicTours || [];
    // Jika data dinamis kurang dari 3, tambahkan data statis agar tetap terlihat penuh
    if (dynamic.length < 3) {
      return [...dynamic, ...STATIC_TOURS.slice(0, 3 - dynamic.length)];
    }
    return dynamic;
  }, [dynamicTours]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section dengan foto lokal Pasar Terapung */}
      <section className="relative h-[650px] flex items-center justify-center text-center overflow-hidden bg-slate-900">
        <Image
          src="/components/public/foto pasar terapung bjm.jpg"
          alt="Pasar Terapung Banjarmasin"
          fill
          className="object-cover brightness-[0.45]"
          priority
        />
        <div className="relative z-10 container px-4 space-y-6">
          <Badge className="bg-primary/20 text-primary-foreground border-primary/30 px-4 py-1 rounded-full backdrop-blur-md mb-2">
            Pariwisata Lokal Berkelanjutan
          </Badge>
          <h1 className="text-4xl md:text-7xl font-bold text-white font-headline max-w-4xl mx-auto leading-[1.1]">
            Jelajahi <span className="text-primary italic">Warisan Budaya</span> Kota Seribu Sungai
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light">
            Temukan cerita di balik setiap sudut bersejarah Banjarmasin bersama pemandu lokal yang berdedikasi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="#tours">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 rounded-full text-lg h-14 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                Mulai Menjelajah
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="bg-white/5 text-white border-white/20 hover:bg-white/10 px-10 rounded-full text-lg h-14 backdrop-blur-md transition-all">
              Tentang Kami
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10"></div>
      </section>

      {/* Featured Tours */}
      <section className="py-24 bg-background relative z-20" id="tours">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-secondary"></div>
                <span className="text-secondary font-bold tracking-widest text-xs uppercase">Eksplorasi Kota</span>
              </div>
              <h2 className="text-4xl font-bold font-headline tracking-tight">Tur Mendatang</h2>
              <p className="text-muted-foreground text-lg">Pilih petualangan jalan kaki Anda dan buat kenangan baru.</p>
            </div>
            <Link href="/tours">
              <Button variant="outline" className="group gap-2 rounded-full border-primary/30 hover:border-primary hover:bg-primary/5 px-6">
                Lihat Semua Rute <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {toursLoading && (!allTours || allTours.length === 0) ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : allTours && allTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {allTours.map((tour: any, idx: number) => {
                const imageIdx = tour.imageIdx !== undefined ? tour.imageIdx : idx;
                const tourImg = PlaceHolderImages[imageIdx % PlaceHolderImages.length];
                return (
                  <Card key={tour.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 group rounded-2xl bg-white flex flex-col h-full">
                    <div className="relative h-72 overflow-hidden">
                      <Image
                        src={tourImg.imageUrl}
                        alt={tour.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint={tourImg.imageHint}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 left-4 z-10">
                         <Badge className="bg-secondary text-white border-none px-3 py-1 text-sm shadow-lg">
                           Rp {tour.price?.toLocaleString('id-ID')}
                         </Badge>
                      </div>
                      {tour.id.includes('static') && (
                        <div className="absolute top-4 left-4">
                          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-[10px] border-none text-slate-500">
                            Rekomendasi
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="font-headline text-2xl group-hover:text-secondary transition-colors line-clamp-1">{tour.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{tour.date || "Jadwal Fleksibel"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-tighter pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-1.5">
                           <Map className="h-4 w-4 text-primary/70" />
                           <span>{tour.distance}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                           <Clock className="h-4 w-4 text-primary/70" />
                           <span>{tour.duration}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                           <Users className="h-4 w-4 text-primary/70" />
                           <span>Grup</span>
                         </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-6 px-6">
                      <Link href={`/book/${tour.id}`} className="w-full">
                        <Button className="w-full bg-slate-900 hover:bg-secondary text-white rounded-xl h-12 transition-all font-bold">
                          Daftar Tur Ini
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center p-24 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
              <p className="text-muted-foreground text-lg italic">Menyiapkan rute petualangan terbaik untuk Anda...</p>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest text-[10px] px-3">Eksplorasi</Badge>
            <h2 className="text-4xl font-bold font-headline">Titik Temu & Rute Warisan</h2>
            <p className="text-muted-foreground text-lg">Kami menjelajahi setiap sudut kota yang memiliki cerita mendalam.</p>
          </div>
          <div className="aspect-[21/9] bg-white rounded-[2.5rem] shadow-2xl border-8 border-white overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjaXR5JTIwbWFwfGVufDB8fHx8MTc3MDY5NTc2Nnww&ixlib=rb-4.1.0&q=80&w=1200')] bg-cover opacity-70 transition-transform duration-1000 group-hover:scale-105">
               <div className="bg-white/95 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center max-w-sm mx-4 border border-white/50 animate-in fade-in zoom-in duration-700">
                  <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-secondary animate-bounce" />
                  </div>
                  <p className="font-bold text-2xl mb-2 text-slate-800">Peta Eksplorasi</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lihat titik pertemuan dan jalur bersejarah yang akan kita lalui bersama pemandu lokal.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-20 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3 font-bold text-3xl tracking-tight">
              <div className="bg-primary p-1.5 rounded-lg">
                <MapPin className="h-6 w-6 text-slate-900" />
              </div>
              <span className="font-headline uppercase">BDJ <span className="text-primary">Walking</span>Tour</span>
            </div>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed">
              Misi kami adalah melestarikan narasi sejarah Banjarmasin melalui pengalaman jalan kaki yang otentik dan edukatif bagi semua orang.
            </p>
            <div className="flex gap-4 pt-4">
              {['Instagram', 'WhatsApp', 'Facebook'].map(social => (
                <div key={social} className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-primary hover:text-slate-950 transition-all cursor-pointer">
                  <span className="sr-only">{social}</span>
                  <div className="h-4 w-4 bg-current rounded-sm opacity-20"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-lg border-b border-slate-800 pb-2">Navigasi</h4>
            <ul className="space-y-4 text-slate-400">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="/tours" className="hover:text-primary transition-colors">Semua Paket Tur</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Dashboard Staf</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-lg border-b border-slate-800 pb-2">Hubungi Kami</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-primary"></div> hello@bdjwalkingtour.com</li>
              <li className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-primary"></div> +62 812-3456-7890</li>
              <li className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-primary"></div> Jl. Ahmad Yani No. 123, BJM</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-20 pt-8 border-t border-slate-900 text-center text-slate-500 text-sm">
          &copy; 2024 JelajahBorneoKu. Dikembangkan untuk Pelestarian Sejarah Lokal.
        </div>
      </footer>
    </div>
  )
}
