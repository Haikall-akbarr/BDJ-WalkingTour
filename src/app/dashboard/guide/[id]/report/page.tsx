
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
    date: new Date().toLocaleDateString(),
    notableEncounters: ""
  });
  const [generatedReport, setGeneratedReport] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateAI = async () => {
    if (!formData.notableEncounters) {
      toast({
        title: "Input Required",
        description: "Please provide some notable encounters first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateTourReport(formData);
      setGeneratedReport(result.report);
      toast({
        title: "Report Generated",
        description: "AI has created a narrative based on your notes.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = () => {
    toast({
      title: "Success",
      description: "Report submitted successfully!",
    });
    router.push("/dashboard/guide");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Tour Report Details</CardTitle>
            <CardDescription>Enter the key highlights of today's tour.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tour Name</Label>
              <Input value={formData.tourName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Guide Name</Label>
              <Input value={formData.guideName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notable Encounters & Discoveries</Label>
              <Textarea 
                id="notes" 
                placeholder="e.g. Found a local artisan making traditional puppets, met a 90-year old resident with stories of the old temple..." 
                className="min-h-[150px]"
                value={formData.notableEncounters}
                onChange={(e) => setFormData({...formData, notableEncounters: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Provide bullet points or brief notes for the best AI results.</p>
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
                  <RefreshCcw className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Compelling Narrative
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className={`border-none shadow-lg h-fit transition-opacity ${generatedReport ? 'opacity-100' : 'opacity-50'}`}>
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              AI-Generated Report
            </CardTitle>
            <CardDescription>Review and edit your final tour narrative.</CardDescription>
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
                <p>Generated report will appear here after you click "Generate Narrative".</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2"
              disabled={!generatedReport || loading}
              onClick={handleSubmitFinal}
            >
              <Send className="h-4 w-4" /> Submit Official Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
