
"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ChevronLeft, ChevronRight, QrCode, Loader2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useUser } from "@/firebase"
import { collection, query } from "firebase/firestore"

const MOCK_TOURS = [
  { id: "pacinan", name: "Pacinan Walking Tour", price: 65000 },
  { id: "sungai", name: "Susur Sungai Martapura", price: 85000 },
  { id: "kubah", name: "Wisata Religi Kubah Basirih", price: 50000 }
];

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const tourIdParam = unwrappedParams.id;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [domicile, setDomicile] = useState("banjarmasin");
  const [customDomicile, setCustomDomicile] = useState("");
  
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const toursQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "tours"));
  }, [db]);

  const { data: dbTours, loading: toursLoading } = useCollection(toursQuery);

  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    tourId: "",
    pax: 1
  });

  const allTours = useMemo(() => {
    if (!dbTours || dbTours.length === 0) return MOCK_TOURS;
    return dbTours;
  }, [dbTours]);

  const nextAfterLogin = useMemo(() => {
    const safeId = tourIdParam && tourIdParam !== "new" ? tourIdParam : "new";
    return `/book/${safeId}`;
  }, [tourIdParam]);

  useEffect(() => {
    if (tourIdParam && tourIdParam !== "new") {
      setFormData(prev => ({ ...prev, tourId: tourIdParam }));
    }
  }, [tourIdParam]);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.displayName || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const selectedTour = useMemo(() => {
    if (!allTours || !formData.tourId) return null;
    return allTours.find((t: any) => t.id === formData.tourId);
  }, [allTours, formData.tourId]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    if (!selectedTour) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Silakan pilih paket tur terlebih dahulu.",
      });
      return;
    }
    setLoading(true);

    fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        whatsapp: formData.whatsapp,
        email: formData.email,
        domicile,
        customDomicile,
        tourId: formData.tourId,
        tourName: selectedTour.name,
        tourPrice: Number(selectedTour.price || 0),
        pax: Number(formData.pax),
      }),
    })
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Gagal membuat pembayaran.");
        }

        if (!result.checkoutUrl) {
          throw new Error("Checkout URL tidak tersedia.");
        }

        toast({
          title: "Mengalihkan ke pembayaran",
          description: "Setelah pembayaran berhasil, barcode akan dikirim ke email pembeli.",
        });

        window.location.href = result.checkoutUrl;
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Pembayaran gagal dibuat",
          description: error?.message || "Silakan coba lagi atau cek konfigurasi payment gateway.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const progressValue = (step / 3) * 100;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center rounded-[28px] border border-black/5 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
          <div className="space-y-3">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#16302c]" />
            <p className="text-sm text-zinc-600">Memeriksa sesi login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-[28px] border-none bg-white/90 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Login Diperlukan</CardTitle>
              <CardDescription>
                Untuk membuka form pemesanan tur, silakan login terlebih dahulu.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/login?next=${encodeURIComponent(nextAfterLogin)}`} className="w-full sm:w-auto">
                <Button className="w-full rounded-full bg-[#16302c] text-white hover:bg-[#0f211d]">Login untuk Pesan Tur</Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-full">Kembali ke Beranda</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex w-full flex-col gap-3 rounded-[28px] border border-white/15 bg-[#10221f]/85 px-4 py-3 text-white shadow-md backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:rounded-full lg:px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#16302c] shadow-sm">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/65 md:text-[11px]">Booking Flow</span>
              <span className="font-headline text-base font-bold text-white md:text-lg">BDJ WalkingTour</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-white/85">
            <Link href="/" className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white">Beranda</Link>
            <Link href="/#tours" className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white">Semua Tur</Link>
            <Link href="/book/new" className="rounded-full bg-[#98DDCA] px-4 py-2 text-[#16302c] transition-colors hover:bg-[#b8eadc]">Pesan Tur</Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black uppercase tracking-wide">Pesan Tur Anda</h1>
            <p className="text-muted-foreground">Hanya beberapa langkah dari petualangan Anda berikutnya.</p>
          </div>

          <div className="space-y-4">
            <Progress value={progressValue} className="h-2 bg-slate-200" />
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>PENDAFTARAN</span>
              <span>PEMBAYARAN</span>
              <span>KONFIRMASI</span>
            </div>
          </div>

          <Card className="rounded-[28px] border-none bg-white/90 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                <CardHeader>
                  <CardTitle>Detail Pendaftaran</CardTitle>
                  <CardDescription>Beri tahu kami siapa Anda dan tur mana yang ingin Anda ikuti.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                      <Input 
                        id="whatsapp" 
                        type="tel" 
                        placeholder="0812..." 
                        required 
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Domisili Anda</Label>
                    <RadioGroup 
                      value={domicile} 
                      onValueChange={setDomicile} 
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="banjarmasin" id="r1" />
                        <Label htmlFor="r1" className="cursor-pointer">Banjarmasin</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="banjarbaru" id="r2" />
                        <Label htmlFor="r2" className="cursor-pointer">Banjarbaru</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="martapura" id="r3" />
                        <Label htmlFor="r3" className="cursor-pointer">Martapura</Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="others" id="r4" />
                        <Label htmlFor="r4" className="cursor-pointer">Lainnya</Label>
                      </div>
                    </RadioGroup>

                    {domicile === "others" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="custom-domicile">Sebutkan Domisili Anda</Label>
                        <Input 
                          id="custom-domicile" 
                          placeholder="Nama Kota atau Kabupaten" 
                          required 
                          value={customDomicile}
                          onChange={(e) => setCustomDomicile(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Paket Tur</Label>
                      <Select 
                        value={formData.tourId} 
                        onValueChange={(val) => setFormData({...formData, tourId: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={toursLoading ? "Memuat tur..." : "Pilih tur"} />
                        </SelectTrigger>
                        <SelectContent>
                          {toursLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm">Memuat paket tur...</span>
                            </div>
                          ) : allTours && allTours.length > 0 ? (
                            allTours.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} - Rp {t.price?.toLocaleString('id-ID')}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Tidak ada paket tur tersedia.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pax">Jumlah Peserta</Label>
                      <Input 
                        id="pax" 
                        type="number" 
                        min="1" 
                        value={formData.pax}
                        onChange={(e) => setFormData({...formData, pax: Number(e.target.value)})}
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-primary/10 p-4 rounded-xl">
                    <Checkbox id="consent" required />
                    <Label htmlFor="consent" className="text-sm leading-tight font-normal">
                      Saya bersedia berjalan kaki dan akan menyiapkan alas kaki yang nyaman.
                    </Label>
                  </div>
                </CardContent>
                <div className="flex p-6 pt-0">
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2" disabled={toursLoading || !formData.tourId}>
                    Lanjut ke Pembayaran <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardHeader>
                  <CardTitle>Konfirmasi Pembayaran Gateway</CardTitle>
                  <CardDescription>Selesaikan pembayaran Anda untuk mengamankan tempat. Barcode akan dikirim otomatis ke email setelah pembayaran berhasil.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-4 text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <CreditCard className="h-14 w-14 text-[#98DDCA]" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">Checkout Payment Gateway</p>
                      <p className="text-sm text-muted-foreground">Midtrans akan membuka halaman pembayaran resmi setelah Anda klik tombol di bawah.</p>
                    </div>
                    {selectedTour && (
                      <div className="rounded-2xl bg-white p-4 text-sm">
                        <p className="text-muted-foreground">Total yang harus dibayar:</p>
                        <p className="text-xl font-black text-zinc-900">Rp {(selectedTour.price * formData.pax).toLocaleString('id-ID')}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Setelah pembayaran berhasil, barcode absensi akan dikirim ke email pembeli.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="flex gap-4 p-6 pt-0">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" /> Kembali
                  </Button>
                  <Button 
                    className="flex-[2] bg-[#98DDCA] text-[#16302c] hover:bg-[#b8eadc]" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Menghubungkan Payment Gateway..." : "Bayar Sekarang"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-12 text-center space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-headline">Pendaftaran Berhasil!</h2>
                  <p className="text-muted-foreground">
                    Terima kasih telah memesan di BDJ WalkingTour. Kami telah menyimpan data Anda dan akan memverifikasi pembayaran Anda segera.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                  <p className="font-bold mb-2">Ringkasan Pesanan:</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tur:</span>
                    <span>{selectedTour?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-amber-600 font-bold uppercase">Pending</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                  onClick={() => router.push("/")}
                >
                  Kembali ke Beranda
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
