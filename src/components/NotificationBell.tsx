"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Loader2, QrCode, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  createdAt: string | null
  actionUrl: string | null
  ctaLabel?: string | null
  isRead: boolean
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [scanDetail, setScanDetail] = useState<{ name: string; time: string } | null>(null)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" })
        const result = await response.json()

        if (!mounted) return
        setNotifications(Array.isArray(result?.notifications) ? result.notifications : [])
      } catch {
        if (!mounted) return
        setNotifications([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 20000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const unreadCount = notifications.length

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.type === 'attendance_scanned') {
      let name = "Peserta"
      let time = item.createdAt || ""
      
      const nameMatch = item.message.match(/Peserta\s+(.*?)\s+sudah/i)
      if (nameMatch && nameMatch[1]) name = nameMatch[1]

      setScanDetail({ name, time })
      setScanDialogOpen(true)
      setOpen(false)
      return
    }

    if (item.actionUrl) {
      router.push(item.actionUrl)
      setOpen(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="relative h-8 w-8 rounded-full border-white/25 bg-white/10 px-0 text-white hover:bg-white/20 hover:text-white"
            aria-label="Buka notifikasi"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-[#e15959] px-1 text-[10px] text-white hover:bg-[#e15959]">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 border-white/10 bg-[#10221f] p-0 text-white shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">Notifikasi</p>
            <p className="text-xs text-white/60">Progres pembayaran, barcode, dan absensi terbaru</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-white/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat notifikasi...
              </div>
            ) : unreadCount === 0 ? (
              <div className="px-3 py-6 text-sm text-white/70">Belum ada progres pembayaran atau absensi terbaru.</div>
            ) : (
              notifications.map((item) => {
                return (
                  <div key={item.id} className="p-1">
                    <div 
                      onClick={() => handleNotificationClick(item)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition-colors hover:bg-white/10 cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-white/70">{item.message}</p>
                        </div>
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#98DDCA] shrink-0" />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 md:p-8 bg-[#10221f] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                <Check className="h-4 w-4" />
              </span>
              Absensi Berhasil Discan
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xs text-white/60 tracking-wider uppercase">Nama Peserta</p>
              <p className="mt-1 text-lg font-bold text-white">{scanDetail?.name}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xs text-white/60 tracking-wider uppercase">Waktu Absen</p>
              <p className="mt-1 font-mono text-sm text-[#98DDCA]">
                {scanDetail?.time ? new Date(scanDetail.time).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' }) : '-'}
              </p>
            </div>
            <div className="text-center text-xs text-white/60">
              Peserta ini telah berhasil diverifikasi oleh Pemandu (Guide) saat check-in di lokasi tur.
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setScanDialogOpen(false)} className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
