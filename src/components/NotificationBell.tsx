"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Loader2, QrCode, Check, Trash2 } from "lucide-react"
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
  const [readIds, setReadIds] = useState<string[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [replyDetail, setReplyDetail] = useState<{ title: string; message: string; time: string } | null>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("read_notification_ids")
    if (saved) {
      try {
        setReadIds(JSON.parse(saved))
      } catch {}
    }
    const savedDeleted = localStorage.getItem("deleted_notification_ids")
    if (savedDeleted) {
      try {
        setDeletedIds(JSON.parse(savedDeleted))
      } catch {}
    }
  }, [])

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

  const visibleNotifications = notifications.filter(n => !deletedIds.includes(n.id))
  const unreadCount = visibleNotifications.filter(n => !n.isRead && !readIds.includes(n.id)).length

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readIds.includes(item.id) && !item.isRead) {
      const updated = [...readIds, item.id]
      setReadIds(updated)
      localStorage.setItem("read_notification_ids", JSON.stringify(updated))

      // Sync with API
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      }).catch(() => {})
    }

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

    if (item.type === 'report_reply') {
      setReplyDetail({
        title: item.title,
        message: item.message,
        time: item.createdAt || ""
      })
      setReplyDialogOpen(true)
      setOpen(false)
      return
    }

    if (item.actionUrl) {
      router.push(item.actionUrl)
      setOpen(false)
    }
  }

  const handleNotificationDelete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    const updated = [...deletedIds, itemId]
    setDeletedIds(updated)
    localStorage.setItem("deleted_notification_ids", JSON.stringify(updated))

    // Sync with API
    fetch(`/api/notifications?id=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    }).catch(() => {})
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
            ) : visibleNotifications.length === 0 ? (
              <div className="px-3 py-6 text-sm text-white/70">Belum ada progres pembayaran atau absensi terbaru.</div>
            ) : (
              visibleNotifications.map((item) => {
                const isItemRead = item.isRead || readIds.includes(item.id)
                return (
                  <div key={item.id} className="p-1">
                    <div 
                      onClick={() => handleNotificationClick(item)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition-colors hover:bg-white/10 cursor-pointer text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isItemRead ? "text-white/60" : "text-white"}`}>{item.title}</p>
                          <p className={`mt-1 text-xs leading-5 ${isItemRead ? "text-white/50" : "text-white/70"}`}>{item.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {!isItemRead && (
                            <span className="h-2 w-2 rounded-full bg-[#98DDCA]" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-white/10 text-white/40 hover:text-white"
                            onClick={(e) => handleNotificationDelete(e, item.id)}
                            title="Hapus Notifikasi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 md:p-8 bg-[#10221f] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                <Bell className="h-4 w-4" />
              </span>
              {replyDetail?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60 tracking-wider uppercase font-semibold">Isi Balasan Owner:</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-100 italic">
                {replyDetail?.message.match(/"(.*?)"/)?.[1] || replyDetail?.message || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-xs text-white/60 tracking-wider uppercase">Waktu Balasan</p>
              <p className="mt-1 text-xs text-[#98DDCA]">
                {replyDetail?.time ? new Date(replyDetail.time).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }) : "-"}
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setReplyDialogOpen(false)} className="w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] font-bold">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
