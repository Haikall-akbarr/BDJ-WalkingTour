"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

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

  return (
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
              const content = (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition-colors hover:bg-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/70">{item.message}</p>
                    </div>
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#98DDCA]" />
                  </div>
                  {item.actionUrl && item.ctaLabel && (
                    <div className="mt-3">
                      <Link
                        href={item.actionUrl}
                        className="inline-flex items-center rounded-full bg-[#98DDCA] px-3 py-1.5 text-xs font-semibold text-[#10221f] transition-colors hover:bg-[#b8eadc]"
                        onClick={() => setOpen(false)}
                      >
                        {item.ctaLabel}
                      </Link>
                    </div>
                  )}
                </div>
              )

              return (
                <div key={item.id} className="p-1">
                  {content}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
