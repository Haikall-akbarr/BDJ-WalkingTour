
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/public/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ChevronLeft, ChevronRight, UploadCloud, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function BookingPage({ params }: { params: { id: string } }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [domicile, setDomicile] = useState("banjarmasin");
  const [customDomicile, setCustomDomicile] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Kami telah menerima pesanan Anda.",
      });
    }, 1500);
  };

  const progressValue = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Pesan Tur Anda</h1>
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

          <Card className="shadow-xl border-none">
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
                      <Input id="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                      <Input id="whatsapp" type="tel" placeholder="0812..." required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Alamat Email (Opsional)</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
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
                      <Select defaultValue="pacinan">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pacinan">Pacinan - 15 Jan - Rp 65rb</SelectItem>
                          <SelectItem value="river">River - 18 Jan - Rp 75rb</SelectItem>
                          <SelectItem value="heritage">Heritage - 20 Jan - Rp 60rb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pax">Jumlah Peserta</Label>
                      <Input id="pax" type="number" min="1" defaultValue="1" required />
                      <p className="text-[10px] text-muted-foreground">Pilih total peserta termasuk diri Anda sendiri.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-primary/10 p-4 rounded-lg">
                    <Checkbox id="consent" required />
                    <Label htmlFor="consent" className="text-sm leading-tight font-normal">
                      Saya bersedia berjalan kaki 2-3 km dan akan menyiapkan alas kaki yang nyaman.
                    </Label>
                  </div>
                </CardContent>
                <div className="flex p-6 pt-0">
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2">
                    Lanjut ke Pembayaran <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardHeader>
                  <CardTitle>Konfirmasi Pembayaran</CardTitle>
                  <CardDescription>Selesaikan pembayaran Anda untuk mengamankan tempat.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 text-center space-y-4">
                    <div className="mx-auto bg-white p-4 w-32 h-32 flex items-center justify-center rounded-lg shadow-sm">
                      <QrCode className="h-24 w-24 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">PINDAI QRIS</p>
                      <p className="text-sm text-muted-foreground">BDJ WalkingTour (JelajahBorneoKu)</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Transfer Bank</p>
                      <p className="font-mono font-bold text-xl">BCA: 123 456 7890</p>
                      <p className="text-sm">A/N: BDJ WalkingTour</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="block text-center mb-4">Unggah Bukti Pembayaran</Label>
                    <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-8 text-center cursor-pointer hover:bg-primary/10 transition-colors space-y-2">
                      <UploadCloud className="h-10 w-10 text-primary mx-auto" />
                      <p className="font-medium">Klik untuk unggah gambar</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG hingga 5MB</p>
                    </div>
                  </div>
                </CardContent>
                <div className="flex gap-4 p-6 pt-0">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" /> Kembali
                  </Button>
                  <Button 
                    className="flex-[2] bg-secondary hover:bg-secondary/90 text-white" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Memproses..." : "Saya Sudah Bayar / Unggah Bukti"}
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
                    Terima kasih telah memesan di BDJ WalkingTour. Kami telah mengirimkan pesan konfirmasi ke WhatsApp Anda.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                  <p className="font-bold mb-2">Ringkasan Pesanan:</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tur:</span>
                    <span>Pacinan Walking Tour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal:</span>
                    <span>15 Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peserta:</span>
                    <span>1 Orang</span>
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
