"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Megaphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GuideAnnouncementDialogProps {
  tourId: string
  tourName: string
  tourDate: string
  children?: React.ReactNode
}

export function GuideAnnouncementDialog({ tourId, tourName, tourDate, children }: GuideAnnouncementDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Pesan pengumuman tidak boleh kosong.",
      })
      return
    }

    setSending(true)

    try {
      const res = await fetch(`/api/tours/${tourId}/announce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          tourDate
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim pengumuman.")
      }

      toast({
        title: "Pengumuman Terkirim",
        description: `Berhasil mengirim pengumuman ke ${data.count || 0} peserta.`,
      })
      
      setOpen(false)
      setMessage("")
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan sistem.",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full border-white/50 bg-white/10 text-[10px] text-white hover:bg-white/20 hover:text-white md:text-xs">
            <Megaphone className="h-3 w-3" /> Pengumuman
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-zinc-900" />
            Kirim Pengumuman Peserta
          </DialogTitle>
          <DialogDescription>
            Pesan ini akan dikirimkan via WhatsApp ke semua peserta tur <strong>{tourName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Tuliskan pesan Anda di sini (misal: Tur ditunda 30 menit karena hujan)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            rows={5}
            className="resize-none rounded-xl"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={sending}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white" 
            onClick={handleSend} 
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim via WhatsApp"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
