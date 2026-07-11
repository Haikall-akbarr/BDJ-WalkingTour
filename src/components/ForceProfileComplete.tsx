"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle, PhoneCall, MapPin } from "lucide-react"
import { usePathname } from "next/navigation"

function getCompletedKey(userId: string) {
  return `bdj_ec_done_${userId}`
}

export function ForceProfileComplete() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [emergencyContact, setEmergencyContact] = useState("")
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const checkUser = useCallback(async () => {
    // Skip popup on login page
    if (pathname === "/login") {
      setOpen(false)
      return
    }

    try {
      const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        cache: "no-store",
      })
      if (!res.ok) {
        setOpen(false)
        return
      }
      const data = await res.json()
      const user = data?.user

      if (!user || !user.id) {
        setOpen(false)
        return
      }

      // Check 0: Only force completion for normal users
      if (user.role && user.role !== "user") {
        setOpen(false)
        return
      }

      setUserId(user.id)

      // Check 1: API says data already filled? => no popup
      const hasEmergencyFromApi = user.emergencyContact && user.emergencyContact.trim() !== ""
      const hasAddressFromApi = user.address && user.address.trim() !== ""
      if (hasEmergencyFromApi && hasAddressFromApi) {
        setOpen(false)
        return
      }

      // Check 2: localStorage says user already completed? => no popup
      const localFlag = localStorage.getItem(getCompletedKey(user.id))
      if (localFlag === "true") {
        setOpen(false)
        return
      }

      // Both checks failed => show popup
      setOpen(true)
    } catch {
      setOpen(false)
    }
  }, [pathname])

  // Check on mount and whenever route changes
  useEffect(() => {
    checkUser()
  }, [checkUser])

  // Prevent manual close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) return // Block closing
    setOpen(newOpen)
  }

  // Validate phone: only digits allowed
  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "")
    setEmergencyContact(digitsOnly)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emergencyContact.trim()) {
      setFeedback({ type: "error", message: "No. Telpon Darurat wajib diisi." })
      return
    }

    if (emergencyContact.trim().length < 10) {
      setFeedback({ type: "error", message: "No. Telpon minimal 10 digit." })
      return
    }

    if (!address.trim()) {
      setFeedback({ type: "error", message: "Alamat wajib diisi." })
      return
    }

    if (address.trim().length < 3) {
      setFeedback({ type: "error", message: "Alamat minimal 3 karakter." })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyContact: emergencyContact.trim(),
          address: address.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Gagal menyimpan data." })
        return
      }

      // Save completed flag + actual values to localStorage
      if (userId) {
        localStorage.setItem(getCompletedKey(userId), "true")
        localStorage.setItem(`bdj_ec_value_${userId}`, emergencyContact.trim())
        localStorage.setItem(`bdj_addr_value_${userId}`, address.trim())
      }

      // Close popup immediately
      setOpen(false)
    } catch {
      setFeedback({ type: "error", message: "Terjadi kesalahan jaringan." })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[480px] rounded-[24px] border-none bg-white p-0 overflow-hidden shadow-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className="bg-[linear-gradient(135deg,_rgba(16,34,31,1)_0%,_rgba(24,56,50,1)_48%,_rgba(152,221,202,0.95)_100%)] px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              Lengkapi Data Diri
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1">
              Mohon lengkapi Kontak Darurat dan Alamat Anda. Informasi ini sangat penting untuk mencegah hal yang tidak diinginkan selama tour berlangsung.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form body */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ Form ini wajib diisi sebelum Anda dapat melanjutkan menggunakan sistem.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="force-emergency-contact" className="text-xs font-bold tracking-[0.1em] text-zinc-600 uppercase">
              No. Telpon Darurat <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="force-emergency-contact"
                type="tel"
                inputMode="numeric"
                value={emergencyContact}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Contoh: 081234567890"
                disabled={saving}
                required
                className="rounded-xl border-zinc-200/60 focus:border-[#98DDCA] focus:ring-[#98DDCA]/30 h-11 pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <PhoneCall className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400">Nomor HP keluarga/kerabat yang bisa dihubungi saat darurat</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="force-address" className="text-xs font-bold tracking-[0.1em] text-zinc-600 uppercase">
              Alamat Domisili <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="force-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap Anda"
                disabled={saving}
                required
                className="rounded-xl border-zinc-200/60 focus:border-[#98DDCA] focus:ring-[#98DDCA]/30 h-11 pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <MapPin className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {feedback?.type === "error" && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {feedback.message}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl h-12 bg-[#10221f] text-white hover:bg-[#1a3531] disabled:opacity-50 transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan & Lanjutkan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
