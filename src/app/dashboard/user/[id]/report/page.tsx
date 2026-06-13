"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChevronLeft, Sparkles, Send, RefreshCcw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateTourReport } from "@/ai/flows/tour-report-generation"

export default function TourReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = React.use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tourName: "",
    guideName: "",
    date: "",
    notableEncounters: ""
  });
  const [generatedReport, setGeneratedReport] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadBooking = async () => {
      if (!bookingId) return;
      setBookingLoading(true);

      try {
        const response = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Gagal memuat detail booking.");
        }

        if (mounted) {
          setBooking(result?.booking || null);
        }
      } catch {
        if (mounted) setBooking(null);
      } finally {
        if (mounted) setBookingLoading(false);
      }
    };

    loadBooking();

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      setFormData({
        tourName: booking.tourName || "Tur Tanpa Nama",
        guideName: booking.guideName || "Belum Ditugaskan",
        date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'),
        notableEncounters: ""
      });
      if (booking.report) {
        setGeneratedReport(booking.report);
      }
    }
  }, [booking]);

  const handleGenerateAI = async () => {
    if (!formData.notableEncounters) {
      toast({
        title: "Input Diperlukan",
        description: "Mohon berikan catatan temuan menarik terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateTourReport(formData);
      setGeneratedReport(result.report);
      toast({
        title: "Laporan Berhasil Dibuat",
        description: "AI telah membuat narasi berdasarkan catatan Anda.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat laporan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!bookingId) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: generatedReport,
          reportSubmittedAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menyimpan laporan.");
      }

      toast({
        title: "Berhasil",
        description: "Laporan resmi telah dikirim!",
      });
      router.push("/dashboard/user");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan laporan",
        description: error?.message || "Coba lagi beberapa saat.",
      });
    }
  };

  if (bookingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-sm">
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="border-none shadow-lg h-fit">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-headline text-lg md:text-xl">Detail Laporan Tur</CardTitle>
            <CardDescription className="text-xs md:text-sm">Masukkan sorotan utama dari tur hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="space-y-2">
              <Label className="text-xs">Nama Tur</Label>
              <Input value={formData.tourName} readOnly className="bg-muted text-sm h-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nama Pemandu</Label>
              <Input value={formData.guideName} readOnly className="bg-muted text-sm h-9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs">Temuan & Perjumpaan Menarik</Label>
              <Textarea 
                id="notes" 
                placeholder="misal: Menemukan pengrajin wayang tradisional, bertemu warga usia 90 tahun..." 
                className="min-h-[120px] md:min-h-[150px] text-sm"
                value={formData.notableEncounters}
                onChange={(e) => setFormData({...formData, notableEncounters: e.target.value})}
              />
              <p className="text-[10px] md:text-xs text-muted-foreground">Berikan poin-poin singkat untuk hasil AI terbaik.</p>
            </div>
          </CardContent>
          <CardFooter className="p-4 md:p-6">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm h-10"
              onClick={handleGenerateAI}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" /> Membuat...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Buat Narasi (AI)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`border-none shadow-lg h-fit transition-all ${generatedReport ? 'opacity-100 scale-100' : 'opacity-60 scale-[0.98]'}`}>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="font-headline text-lg md:text-xl flex items-center gap-2">
              Laporan Hasil AI
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Tinjau dan edit narasi akhir tur Anda.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Textarea 
              className="min-h-[300px] md:min-h-[350px] leading-relaxed p-3 md:p-4 text-sm" 
              placeholder="Narasi laporan tur akan muncul di sini setelah Anda klik 'Buat Narasi (AI)', atau Anda juga bisa mengetik laporan tur secara manual di sini..."
              value={generatedReport}
              onChange={(e) => setGeneratedReport(e.target.value)}
            />
          </CardContent>
          <CardFooter className="p-4 md:p-6">
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2 text-sm h-10"
              disabled={!generatedReport || loading}
              onClick={handleSubmitFinal}
            >
              <Send className="h-4 w-4" /> Kirim Laporan Resmi
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
