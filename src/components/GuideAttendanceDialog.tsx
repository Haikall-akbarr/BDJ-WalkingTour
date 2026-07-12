"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle2, Download, FileSpreadsheet, FileText, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Badge } from "@/components/ui/badge"

interface GuideAttendanceDialogProps {
  tourId: string
  tourName: string
  tourDate: string
  bookings: any[]
  children?: React.ReactNode
}

export function GuideAttendanceDialog({ tourId, tourName, tourDate, bookings, children }: GuideAttendanceDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Filter only attendees who are present
  const presentBookings = bookings.filter((b) => b.attendanceStatus === "present")

  const handleDownloadExcel = () => {
    if (presentBookings.length === 0) {
      toast({
        variant: "destructive",
        title: "Belum ada data",
        description: "Belum ada peserta yang melakukan absensi.",
      })
      return
    }

    const rows = presentBookings.map((item, idx) => ({
      No: idx + 1,
      WaktuScan: item.attendanceScannedAt ? new Date(item.attendanceScannedAt).toLocaleString("id-ID") : "-",
      BookingId: item.id.startsWith("local-") ? item.id.slice(0, 12) : item.id.slice(0, 8),
      NamaPeserta: item.userName,
      PesertaTambahan: item.participantNames || "-",
      EmailPeserta: item.userEmail,
      PaketTur: item.tourName,
      Pax: item.pax,
      AttendanceCode: item.attendanceCode || "-",
      Pemandu: item.attendanceScannedBy || "-",
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "RiwayatAbsensi")

    const fileData = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const filename = `Absensi-${tourName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = () => {
    if (presentBookings.length === 0) {
      toast({
        variant: "destructive",
        title: "Belum ada data",
        description: "Belum ada peserta yang melakukan absensi.",
      })
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Laporan Absensi Tur", 14, 20)
    
    doc.setFontSize(11)
    doc.text(`Tur: ${tourName}`, 14, 30)
    doc.text(`Tanggal: ${tourDate}`, 14, 36)
    doc.text(`Total Hadir: ${presentBookings.reduce((acc, b) => acc + (Number(b.pax) || 0), 0)} Pax (${presentBookings.length} Pemesanan)`, 14, 42)

    const tableColumn = ["No", "Waktu Scan", "Nama", "Pax", "Booking ID"]
    const tableRows = presentBookings.map((item, idx) => [
      idx + 1,
      item.attendanceScannedAt ? new Date(item.attendanceScannedAt).toLocaleString("id-ID") : "-",
      item.userName + (item.participantNames ? ` (+ ${item.participantNames})` : ""),
      item.pax,
      item.id.startsWith("local-") ? item.id.slice(0, 12) : item.id.slice(0, 8),
    ])

    // @ts-ignore
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [24, 24, 27] }, // zinc-900
    })

    const filename = `Absensi-${tourName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(filename)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="h-8 gap-1 rounded-full border-white/50 bg-white/10 text-[10px] text-white hover:bg-white/20 hover:text-white md:text-xs">
            <CheckCircle2 className="h-3 w-3" /> Absensi
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-zinc-900" />
            Riwayat Absensi
          </DialogTitle>
          <DialogDescription>
            Riwayat kehadiran peserta untuk tur <strong>{tourName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleDownloadExcel} className="rounded-full flex-1">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="rounded-full flex-1">
            <FileText className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-4 min-h-[200px]">
          {presentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 py-8">
              <UserCheck className="h-10 w-10 opacity-20" />
              <p className="text-sm">Belum ada data absensi untuk tur ini.</p>
            </div>
          ) : (
            presentBookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-zinc-900">{booking.userName}</p>
                  <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">Hadir</Badge>
                </div>
                <p className="mt-1 text-zinc-600">
                  {booking.pax} Pax • Booking: {booking.id.startsWith("local-") ? booking.id.slice(0, 12) : booking.id.slice(0, 8)}
                </p>
                {booking.participantNames && (
                  <p className="mt-1 text-xs text-zinc-600 font-medium bg-zinc-100 p-1.5 rounded-lg">
                    <strong>Peserta Tambahan:</strong> {booking.participantNames}
                  </p>
                )}
                {booking.attendanceScannedAt && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Discan pada: {new Date(booking.attendanceScannedAt).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t mt-auto flex justify-between items-center">
          <p className="text-xs font-semibold text-zinc-500">
            Total Kehadiran: {presentBookings.reduce((acc, b) => acc + (Number(b.pax) || 0), 0)} Pax
          </p>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
