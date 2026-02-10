
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
  const { toast } = useToast();
  const router = useRouter();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      toast({
        title: "Registration Success!",
        description: "We've received your booking.",
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
            <h1 className="text-3xl font-bold font-headline">Book Your Tour</h1>
            <p className="text-muted-foreground">Just a few steps away from your next adventure.</p>
          </div>

          <div className="space-y-4">
            <Progress value={progressValue} className="h-2 bg-slate-200" />
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>REGISTRATION</span>
              <span>PAYMENT</span>
              <span>CONFIRMATION</span>
            </div>
          </div>

          <Card className="shadow-xl border-none">
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                <CardHeader>
                  <CardTitle>Registration Details</CardTitle>
                  <CardDescription>Tell us who you are and which tour you'd like to join.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input id="whatsapp" type="tel" placeholder="0812..." required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label>Your Address</Label>
                    <RadioGroup defaultValue="banjarmasin" className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="r4" className="cursor-pointer">Others</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tour Package</Label>
                      <Select defaultValue="pacinan">
                        <SelectTrigger>
                          <SelectValue placeholder="Select tour" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pacinan">Pacinan - 15 Jan - Rp 65k</SelectItem>
                          <SelectItem value="river">River - 18 Jan - Rp 75k</SelectItem>
                          <SelectItem value="heritage">Heritage - 20 Jan - Rp 60k</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pax">Pax Count</Label>
                      <Input id="pax" type="number" min="1" defaultValue="1" required />
                      <p className="text-[10px] text-muted-foreground">Choose total participants including yourself.</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 bg-primary/10 p-4 rounded-lg">
                    <Checkbox id="consent" required />
                    <Label htmlFor="consent" className="text-sm leading-tight font-normal">
                      I am willing to walk 2-3 km and will prepare comfortable footwear.
                    </Label>
                  </div>
                </CardContent>
                <div className="flex p-6 pt-0">
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2">
                    Proceed to Payment <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CardHeader>
                  <CardTitle>Payment Confirmation</CardTitle>
                  <CardDescription>Complete your payment to secure your spot.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200 text-center space-y-4">
                    <div className="mx-auto bg-white p-4 w-32 h-32 flex items-center justify-center rounded-lg shadow-sm">
                      <QrCode className="h-24 w-24 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">SCAN QRIS</p>
                      <p className="text-sm text-muted-foreground">BDJ Walking Tour (JelajahBorneoKu)</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Bank Transfer</p>
                      <p className="font-mono font-bold text-xl">BCA: 123 456 7890</p>
                      <p className="text-sm">A/N: Jelajah Borneo Ku</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="block text-center mb-4">Upload Payment Proof</Label>
                    <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-8 text-center cursor-pointer hover:bg-primary/10 transition-colors space-y-2">
                      <UploadCloud className="h-10 w-10 text-primary mx-auto" />
                      <p className="font-medium">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                </CardContent>
                <div className="flex gap-4 p-6 pt-0">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button 
                    className="flex-[2] bg-secondary hover:bg-secondary/90 text-white" 
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "I Have Paid / Upload Proof"}
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
                    Thank you for booking with JelajahBorneoKu. We've sent a confirmation message to your WhatsApp.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                  <p className="font-bold mb-2">Booking Summary:</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tour:</span>
                    <span>Pacinan Walking Tour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>15 Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participants:</span>
                    <span>1 Person</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                  onClick={() => router.push("/")}
                >
                  Return to Home
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
