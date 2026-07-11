"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Landmark, RefreshCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RequestRefundDialogProps {
  bookingId: string
  onSuccess?: () => void
  children?: React.ReactNode
}

export function RequestRefundDialog({ bookingId, onSuccess, children }: RequestRefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Semua data rekening bank harus diisi.",
      })
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses refund.")
      }

      toast({
        title: "Permintaan Refund Terkirim",
        description: "Permintaan Anda akan segera diproses oleh admin.",
      })
      
      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err?.message || "Terjadi kesalahan sistem.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
            Batalkan & Refund
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-zinc-900" />
            Permintaan Refund
          </DialogTitle>
          <DialogDescription>
            Pesanan Anda akan dibatalkan. Silakan isi detail rekening Anda untuk proses pengembalian dana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bank-name">Nama Bank</Label>
            <Input
              id="bank-name"
              placeholder="Contoh: BCA, Mandiri, BRI"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-number">Nomor Rekening</Label>
            <Input
              id="account-number"
              type="text"
              inputMode="numeric"
              placeholder="Masukkan nomor rekening"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-name">Nama Pemilik Rekening</Label>
            <Input
              id="account-name"
              placeholder="Nama sesuai di buku tabungan"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Kirim Permintaan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
