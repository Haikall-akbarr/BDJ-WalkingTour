"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Loader2, CheckCircle2, AlertCircle, User, Phone, MapPin } from "lucide-react"

interface EditProfileDialogProps {
  user: {
    name: string
    email: string
    phone?: string
    address?: string
  } | null
  onSuccess?: () => void
  children?: React.ReactNode
}

export function EditProfileDialog({ user, onSuccess, children }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (open && user) {
      setName(user.name || "")
      setPhone(user.phone || "")
      setAddress(user.address || "")
      setFeedback(null)
    }
  }, [open, user])

  const handleSave = async () => {
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Nama tidak boleh kosong." })
      return
    }

    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "Gagal memperbarui profil." })
        return
      }

      setFeedback({ type: "success", message: "Profil berhasil diperbarui!" })

      setTimeout(() => {
        setOpen(false)
        onSuccess?.()
      }, 1200)
    } catch {
      setFeedback({ type: "error", message: "Terjadi kesalahan jaringan." })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    name.trim() !== (user?.name || "") ||
    phone.trim() !== (user?.phone || "") ||
    address.trim() !== (user?.address || "")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="rounded-full border-[#98DDCA]/40 bg-[#98DDCA]/10 text-[#16302c] hover:bg-[#98DDCA]/25 hover:border-[#98DDCA]/60 gap-2 transition-all duration-200"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-semibold">Edit Profil</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] rounded-[24px] border-none bg-white p-0 overflow-hidden shadow-2xl">
        {/* Header with gradient */}
        <div className="bg-[linear-gradient(135deg,_rgba(16,34,31,1)_0%,_rgba(24,56,50,1)_48%,_rgba(152,221,202,0.95)_100%)] px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Pencil className="h-4 w-4 text-white" />
              </div>
              Edit Profil
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">
              Perbarui informasi profil Anda di bawah ini.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-xs tracking-[0.15em] text-zinc-500 uppercase">
              Email
            </Label>
            <div className="relative">
              <Input
                id="edit-email"
                value={user?.email || ""}
                disabled
                className="rounded-xl bg-zinc-50 border-zinc-200/60 text-zinc-400 cursor-not-allowed h-11 pl-10"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400">Email tidak dapat diubah.</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-xs tracking-[0.15em] text-zinc-500 uppercase">
              Nama Lengkap
            </Label>
            <div className="relative">
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                disabled={saving}
                className="rounded-xl border-zinc-200/60 focus:border-[#98DDCA] focus:ring-[#98DDCA]/30 h-11 pl-10 transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="text-xs tracking-[0.15em] text-zinc-500 uppercase">
              Nomor Telepon
            </Label>
            <div className="relative">
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                disabled={saving}
                className="rounded-xl border-zinc-200/60 focus:border-[#98DDCA] focus:ring-[#98DDCA]/30 h-11 pl-10 transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Phone className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="edit-address" className="text-xs tracking-[0.15em] text-zinc-500 uppercase">
              Alamat
            </Label>
            <div className="relative">
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat Anda"
                disabled={saving}
                className="rounded-xl border-zinc-200/60 focus:border-[#98DDCA] focus:ring-[#98DDCA]/30 h-11 pl-10 transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <MapPin className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {feedback.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-0">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="flex-1 rounded-xl h-11 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex-1 rounded-xl h-11 bg-[#10221f] text-white hover:bg-[#1a3531] disabled:opacity-50 transition-all duration-200"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
