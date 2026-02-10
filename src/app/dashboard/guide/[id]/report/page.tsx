
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ChevronLeft, Sparkles, Send, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateTourReport } from "@/ai/flows/tour-report-generation"

export default function TourReportPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tourName: "Pacinan Walking Tour",
    guideName: "Andi Saputra",
    date: new Date().toLocaleDateString('id-ID'),
    notableEncounters: ""
  });
  const [generatedReport, setGeneratedReport] = useState("");
  const router = useRouter();
  const { toast } = useToast();

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

  const handleSubmitFinal = () => {
    toast({
      title: "Berhasil",
      description: "Laporan resmi telah dikirim!",
    });
    router.push("/dashboard/guide");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> Kembali ke Dashboard
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Detail Laporan Tur</CardTitle>
            <CardDescription>Masukkan sorotan utama dari tur hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Tur</Label>
              <Input value={formData.tourName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nama Pemandu</Label>
              <Input value={formData.guideName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Temuan & Perjumpaan Menarik</Label>
              <Textarea 
                id="notes" 
                placeholder="misal: Menemukan pengrajin wayang tradisional, bertemu warga usia 90 tahun yang bercerita tentang sejarah kuil..." 
                className="min-h-[150px]"
                value={formData.notableEncounters}
                onChange={(e) => setFormData({...formData, notableEncounters: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Berikan poin-poin atau catatan singkat untuk hasil AI terbaik.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              onClick={handleGenerateAI}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" /> Membuat...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Buat Narasi Menarik (AI)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`border-none shadow-lg h-fit transition-opacity ${generatedReport ? 'opacity-100' : 'opacity-50'}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              Laporan Hasil AI
            </CardTitle>
            <CardDescription>Tinjau dan edit narasi akhir tur Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedReport ? (
              <Textarea 
                className="min-h-[350px] leading-relaxed p-4" 
                value={generatedReport}
                onChange={(e) => setGeneratedReport(e.target.value)}
              />
            ) : (
              <div className="h-[350px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
                <Sparkles className="h-12 w-12 text-primary/30" />
                <p>Narasi laporan akan muncul di sini setelah Anda klik "Buat Narasi".</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2"
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
