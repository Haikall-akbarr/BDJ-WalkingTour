
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signOutFirebase } from "@/lib/firebaseClient"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  RefreshCcw,
  Edit, 
  History,
  ShieldCheck,
  Check,
  X,
  LogOut,
  MapPin,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  Map as MapIcon,
  Download
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Footer } from "@/components/public/Footer"

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const isSupabaseStorageUrl = (value?: string) =>
    typeof value === "string" && value.includes(".supabase.co/storage/v1/object/public/")
  const heroImage = useMemo(() => {
    return PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;
  }, []);

  const [isTourDialogOpen, setIsTourDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<any>(null);
  const [tourFiles, setTourFiles] = useState<File[]>([]);
  const [tourFormData, setTourFormData] = useState({
    name: "",
    price: "",
    priceHemat: "",
    priceRegulerDesc: "",
    priceHematDesc: "",
    date: "",
    description: "",
    distance: "3 KM",
    duration: "2 Jam",
    descriptionFull: "",
    historyCulture: "",
    highlight1Title: "",
    highlight1Desc: "",
    highlight2Title: "",
    highlight2Desc: "",
    highlight3Title: "",
    highlight3Desc: "",
    highlight4Title: "",
    highlight4Desc: "",
    routeMapUrl: "",
    pois: ["", "", "", "", ""]
  });
  const [routeMapFile, setRouteMapFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  const [users, setUsers] = useState<any[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user', password: '' });
  const [createdCreds, setCreatedCreds] = useState<{id:string,email:string,password:string}|null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [toursLoading, setToursLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [tourPage, setTourPage] = useState(1);
  const TOURS_PER_PAGE = 9;
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 15;

  const fetchTours = async () => {
    setToursLoading(true);
    try {
      const response = await fetch(`/api/tours?_t=${Date.now()}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Gagal memuat tur.");
      }

      setTours(Array.isArray(result?.tours) ? result.tours : []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat tur",
        description: error?.message || "Periksa konfigurasi backend MySQL.",
      });
      setTours([]);
    } finally {
      setToursLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch("/api/bookings", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Gagal memuat booking.");
      }

      setPendingBookings(Array.isArray(result?.bookings) ? result.bookings : []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat booking",
        description: error?.message || "Periksa konfigurasi backend database.",
      });
      setPendingBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const resp = await fetch('/api/admin/users');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Gagal memuat pengguna');
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setUsers([]);
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const resp = await fetch('/api/admin/audit-logs', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Gagal memuat log aktivitas');
      setAuditLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (error: any) {
      setAuditLogs([]);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat log aktivitas',
        description: error?.message || 'Periksa backend MySQL.',
      });
    } finally {
      setAuditLoading(false);
    }
  }

  const sendCredentials = async (user: { id: string; email: string; password?: string }, rotatePassword = true) => {
    const response = await fetch(`/api/admin/users/${user.id}/send-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: user.password, rotatePassword }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Gagal mengirim kredensial');
    }

    return data;
  }

  useEffect(() => {
    fetchTours();
    fetchPendingBookings();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const filteredAuditLogs = useMemo(() => {
    const query = auditSearchTerm.trim().toLowerCase();
    if (!query) return auditLogs;
    return auditLogs.filter((log: any) => {
      const haystack = [
        log.action,
        log.entity_type,
        log.entityType,
        log.entity_id,
        log.entityId,
        log.actor_name,
        log.actorName,
        log.actor_role,
        log.actorRole,
        typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [auditLogs, auditSearchTerm]);

  const getAuditMeta = (log: any) => {
    const action = String(log.action || log.action_name || log.event || 'audit');
    const entityType = String(log.entity_type || log.entityType || 'record');
    const entityId = String(log.entity_id || log.entityId || '-');
    const actorName = String(log.actor_name || log.actorName || log.user_name || 'system');
    const actorRole = String(log.actor_role || log.actorRole || log.role || 'system');
    const createdAt = String(log.created_at || log.createdAt || log.timestamp || log.time || '');
    const detailsRaw = log.details || log.payload || log.metadata || log.data || null;

    let details = detailsRaw;
    if (typeof detailsRaw === 'string') {
      try {
        details = JSON.parse(detailsRaw);
      } catch {
        details = detailsRaw;
      }
    }

    return { action, entityType, entityId, actorName, actorRole, createdAt, details };
  };

  const auditBadgeClass = (action: string) => {
    if (action.includes('assigned')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('scan')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('create') || action.includes('add')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (action.includes('delete') || action.includes('remove')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  };


  const filteredBookings = useMemo(() => {
    if (!pendingBookings) return [];
    const search = searchTerm.toLowerCase();

    const matchesStatus = (booking: any) => {
      const status = String(booking.paymentStatus || booking.status || '').toLowerCase();

      if (bookingStatusFilter === 'all') return true;
      if (bookingStatusFilter === 'pending') return ['pending', 'pending_payment', 'awaiting_payment'].includes(status);
      if (bookingStatusFilter === 'paid') return ['paid', 'settlement', 'completed'].includes(status);
      return ['cancelled', 'cancel', 'rejected', 'expire', 'expired', 'failed'].includes(status);
    };

    return pendingBookings.filter((b: any) => {
      const haystack = `${b.userName || ''} ${b.tourName || ''} ${b.paymentStatus || ''} ${b.status || ''}`.toLowerCase();
      return matchesStatus(b) && haystack.includes(search);
    });
  }, [pendingBookings, searchTerm, bookingStatusFilter]);

  const bookingSummary = useMemo(() => {
    const summary = { pending: 0, paid: 0, cancelled: 0 };
    for (const booking of pendingBookings || []) {
      const status = String(booking.paymentStatus || booking.status || '').toLowerCase();
      if (['paid', 'settlement', 'completed'].includes(status)) summary.paid += 1;
      else if (['cancelled', 'cancel', 'rejected', 'expire', 'expired', 'failed'].includes(status)) summary.cancelled += 1;
      else summary.pending += 1;
    }
    return summary;
  }, [pendingBookings]);

  const getBookingStatusBadge = (booking: any) => {
    const status = String(booking.paymentStatus || booking.status || '').toLowerCase();
    if (['paid', 'settlement', 'completed'].includes(status)) {
      return { label: 'Sudah Bayar', className: 'text-emerald-700 border-emerald-200 bg-emerald-50' };
    }
    if (['cancelled', 'cancel', 'rejected', 'expire', 'expired', 'failed'].includes(status)) {
      return { label: 'Dibatalkan', className: 'text-rose-700 border-rose-200 bg-rose-50' };
    }
    return { label: 'Belum Bayar', className: 'text-amber-700 border-amber-200 bg-amber-50' };
  };

  // Handlers
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal memperbarui status booking.");
      }

      await fetchPendingBookings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal update booking",
        description: error?.message || "Coba lagi beberapa saat.",
      });
    }
  };

  const handleOpenAddTour = () => {
    setEditingTour(null);
    setTourFormData({
      name: "",
      price: "",
      priceHemat: "",
      priceRegulerDesc: "",
      priceHematDesc: "",
      date: "",
      description: "",
      distance: "3 KM",
      duration: "2 Jam",
      descriptionFull: "",
      historyCulture: "",
      highlight1Title: "",
      highlight1Desc: "",
      highlight2Title: "",
      highlight2Desc: "",
      highlight3Title: "",
      highlight3Desc: "",
      highlight4Title: "",
      highlight4Desc: "",
      routeMapUrl: "",
      pois: ["", "", "", "", ""]
    });
    setTourFiles([]);
    setRouteMapFile(null);
    setIsTourDialogOpen(true);
  };

  const handleOpenEditTour = (tour: any) => {
    setEditingTour(tour);
    let highlights = [];
    try {
      highlights = JSON.parse(tour.historyHighlights || "[]");
    } catch {
      highlights = [];
    }

    let pois = [];
    try {
      pois = JSON.parse(tour.poiList || "[]");
    } catch {
      pois = [];
    }

    setTourFormData({
      name: tour.name || "",
      price: tour.price?.toString() || "",
      priceHemat: tour.priceHemat?.toString() || "",
      priceRegulerDesc: tour.priceRegulerDesc || "",
      priceHematDesc: tour.priceHematDesc || "",
      date: tour.date || "",
      description: tour.description || "",
      distance: tour.distance || "3 KM",
      duration: tour.duration || "2 Jam",
      descriptionFull: tour.descriptionFull || "",
      historyCulture: tour.historyCulture || "",
      highlight1Title: highlights[0]?.title || "",
      highlight1Desc: highlights[0]?.desc || "",
      highlight2Title: highlights[1]?.title || "",
      highlight2Desc: highlights[1]?.desc || "",
      highlight3Title: highlights[2]?.title || "",
      highlight3Desc: highlights[2]?.desc || "",
      highlight4Title: highlights[3]?.title || "",
      highlight4Desc: highlights[3]?.desc || "",
      routeMapUrl: tour.routeMapUrl || "",
      pois: pois.length > 0 ? pois : ["", "", "", "", ""]
    });
    setTourFiles([]);
    setRouteMapFile(null);
    setIsTourDialogOpen(true);
  };

  const handleSaveTour = async () => {
    const highlightsList = [];
    if (tourFormData.highlight1Title && tourFormData.highlight1Desc) {
      highlightsList.push({ title: tourFormData.highlight1Title, desc: tourFormData.highlight1Desc });
    }
    if (tourFormData.highlight2Title && tourFormData.highlight2Desc) {
      highlightsList.push({ title: tourFormData.highlight2Title, desc: tourFormData.highlight2Desc });
    }
    if (tourFormData.highlight3Title && tourFormData.highlight3Desc) {
      highlightsList.push({ title: tourFormData.highlight3Title, desc: tourFormData.highlight3Desc });
    }
    if (tourFormData.highlight4Title && tourFormData.highlight4Desc) {
      highlightsList.push({ title: tourFormData.highlight4Title, desc: tourFormData.highlight4Desc });
    }

    const poisList = tourFormData.pois.map(p => p.trim()).filter(Boolean);

    const payload = {
      name: tourFormData.name,
      price: Number(tourFormData.price),
      priceHemat: tourFormData.priceHemat ? Number(tourFormData.priceHemat) : null,
      priceRegulerDesc: tourFormData.priceRegulerDesc,
      priceHematDesc: tourFormData.priceHematDesc,
      date: tourFormData.date,
      description: tourFormData.description,
      distance: tourFormData.distance,
      duration: tourFormData.duration,
      descriptionFull: tourFormData.descriptionFull,
      historyCulture: tourFormData.historyCulture,
      historyHighlights: JSON.stringify(highlightsList),
      routeMapUrl: tourFormData.routeMapUrl,
      poiList: JSON.stringify(poisList),
    };

    try {
      const response = await fetch(editingTour ? `/api/tours/${editingTour.id}` : "/api/tours", {
        method: editingTour ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menyimpan tur.");
      }

      const tourId = result?.tour?.id;
      
      const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '')
          const parts = res.split(',')
          resolve(parts.length > 1 ? parts[1] : parts[0])
        }
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })

      // Upload Route Map if selected
      let finalRouteMapUrl = tourFormData.routeMapUrl;
      if (tourId && routeMapFile) {
        try {
          const mapData = await readFileAsBase64(routeMapFile);
          const uploadMapResp = await fetch('/api/tours/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tourId,
              images: [{ filename: routeMapFile.name, data: mapData, isRouteMap: true }]
            }),
          });
          const uploadMapResult = await uploadMapResp.json();
          if (uploadMapResp.ok && uploadMapResult?.images?.[0]?.url) {
            finalRouteMapUrl = uploadMapResult.images[0].url;
            // Immediately update the tour's routeMapUrl
            await fetch(`/api/tours/${tourId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ routeMapUrl: finalRouteMapUrl }),
            });
          }
        } catch (mapErr) {
          toast({ variant: 'destructive', title: 'Gagal upload peta rute', description: 'Gambar peta rute gagal disimpan.' })
        }
      }

      // Upload gallery images if selected
      if (tourId && tourFiles && tourFiles.length > 0) {
        const images = await Promise.all(tourFiles.map(async (f) => ({ filename: f.name, data: await readFileAsBase64(f) })));
        try {
          await fetch('/api/tours/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourId, images, append: !!editingTour }),
          });
        } catch (err) {
          toast({ variant: 'destructive', title: 'Gagal upload gambar', description: 'Gambar galeri mungkin belum tersimpan.' })
        }
      }

      setIsTourDialogOpen(false);
      await fetchTours();
      toast({
        title: editingTour ? "Tur Diperbarui" : "Tur Ditambahkan",
        description: `Paket tur ${tourFormData.name} telah berhasil disimpan.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan tur",
        description: error?.message || "Periksa konfigurasi backend MySQL.",
      });
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menghapus tur.");
      }

      await fetchTours();
      toast({
        title: "Tur Dihapus",
        description: "Paket tur telah dihapus dari sistem.",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus tur",
        description: error?.message || "Coba lagi beberapa saat.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase()
    } catch (err) {
      console.error('Client signOut failed:', err)
    }

    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/");
    });
  };

  const handleExportExcel = () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      toast({ variant: "destructive", title: "Tidak ada data", description: "Belum ada booking untuk diekspor." });
      return;
    }
    const rows = filteredBookings.map((b: any, idx: number) => ({
      No: idx + 1,
      "Nama Pelanggan": b.userName || "-",
      "Kontak (WA)": b.userWhatsApp || "-",
      "Peserta Tambahan": b.participantNames || "-",
      Tur: b.tourName || "-",
      Pax: b.pax || 0,
      "Total (Rp)": b.grossAmount || 0,
      Tanggal: b.createdAt ? new Date(b.createdAt).toLocaleDateString("id-ID") : "-",
      Status: String(b.paymentStatus || b.status || "pending").toLowerCase(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Semua Booking`);
    const fileData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `semua-booking-${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: "File diunduh", description: "Data booking berhasil diekspor ke Excel." });
  };

  const handleExportPDF = () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      toast({ variant: "destructive", title: "Tidak ada data", description: "Belum ada booking untuk diekspor." });
      return;
    }
    const doc = new jsPDF();
    doc.text("Laporan Pemesanan Tur", 14, 15);
    const tableColumn = ["No", "Pelanggan", "Tur", "Pax", "Total (Rp)", "Tanggal", "Status"];
    const tableRows = filteredBookings.map((b: any, idx: number) => [
      idx + 1,
      b.userName || "-",
      b.tourName || "-",
      b.pax || 0,
      (b.grossAmount || 0).toLocaleString("id-ID"),
      b.createdAt ? new Date(b.createdAt).toLocaleDateString("id-ID") : "-",
      String(b.paymentStatus || b.status || "pending").toLowerCase()
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`semua-booking-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: "File diunduh", description: "Data booking berhasil diekspor ke PDF." });
  };

  return (
    <div className="min-h-screen bg-[#ecece7] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 space-y-8 md:space-y-10">
        <section className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white shadow-xl">
          <div className="absolute inset-0">
            <Image src={heroImage} alt="Admin Hero" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
          </div>

          <div className="relative z-10 p-4 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 backdrop-blur">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wide">BDJ WalkingTour</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:flex gap-2" onClick={() => setActiveTab('audit')}>
                  <History className="h-4 w-4" /> Log Sistem
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-full border-white/40 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white">
                      <LogOut className="mr-1 h-3 w-3" /> Keluar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90%] max-w-lg rounded-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anda akan keluar dari dashboard admin dan kembali ke halaman utama.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 w-full sm:w-auto">
                        Keluar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="mt-8 space-y-3 md:mt-12">
              <p className="text-[10px] tracking-[0.35em] text-white/75">Admin Dashboard</p>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-wide text-white sm:text-5xl md:text-6xl">
                Control Center
              </h1>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Kelola pemesanan, paket tur, dan pengguna dalam panel visual yang seragam dengan dashboard lainnya.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-2xl font-bold md:text-3xl">Pusat Kontrol Admin</h2>
          <p className="text-sm text-zinc-600">Kelola pengguna sistem, tur, dan pengaturan global.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full rounded-[30px] bg-white p-4 shadow-md md:p-6">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="h-auto w-max justify-start rounded-full border bg-zinc-50 p-1 sm:w-full mb-4">
            <TabsTrigger value="bookings" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Pemesanan</TabsTrigger>
            <TabsTrigger value="tours" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Kelola Tur</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Kelola Pengguna</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Log Aktivitas</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bookings" className="space-y-4 outline-none">
          <Card className="overflow-hidden rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <CardTitle className="text-lg md:text-xl">Data Pesanan Tur</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 gap-2 text-xs" onClick={handleExportExcel} disabled={!filteredBookings || filteredBookings.length === 0}>
                        <Download className="h-3 w-3" /> Excel
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-2 text-xs" onClick={handleExportPDF} disabled={!filteredBookings || filteredBookings.length === 0}>
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs md:text-sm mt-1">Lihat semua pemesanan, baik belum bayar, sudah bayar, maupun dibatalkan.</CardDescription>
                </div>
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari pemesanan..." 
                    className="pl-10 text-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={bookingStatusFilter === 'all' ? 'default' : 'outline'} onClick={() => setBookingStatusFilter('all')}>Semua ({pendingBookings.length})</Button>
                <Button type="button" size="sm" variant={bookingStatusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setBookingStatusFilter('pending')}>Belum Bayar ({bookingSummary.pending})</Button>
                <Button type="button" size="sm" variant={bookingStatusFilter === 'paid' ? 'default' : 'outline'} onClick={() => setBookingStatusFilter('paid')}>Sudah Bayar ({bookingSummary.paid})</Button>
                <Button type="button" size="sm" variant={bookingStatusFilter === 'cancelled' ? 'default' : 'outline'} onClick={() => setBookingStatusFilter('cancelled')}>Dibatalkan ({bookingSummary.cancelled})</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 md:p-4 text-left font-medium">Pelanggan</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tur</th>
                      <th className="p-3 md:p-4 text-center font-medium">Pax</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tanggal</th>
                      <th className="p-3 md:p-4 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookingsLoading ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="mt-2 text-muted-foreground">Memuat data...</p>
                        </td>
                      </tr>
                    ) : filteredBookings && filteredBookings.length > 0 ? (
                      filteredBookings.map((booking: any) => (
                        <tr key={booking.id} className="hover:bg-muted/20">
                          <td className="p-3 md:p-4 whitespace-nowrap">
                            <p className="font-bold">{booking.userName}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">{booking.userWhatsApp}</p>
                            {booking.participantNames && (
                              <p className="text-[10px] text-zinc-500 max-w-[200px] truncate animate-in fade-in duration-200" title={booking.participantNames}>
                                <strong>Peserta:</strong> {booking.participantNames}
                              </p>
                            )}
                          </td>
                          <td className="p-3 md:p-4 whitespace-nowrap">{booking.tourName}</td>
                          <td className="p-3 md:p-4 text-center font-semibold">
                            {booking.pax} {booking.tourName?.toLowerCase().includes("hemat") ? "(Hemat)" : booking.tourName?.toLowerCase().includes("reguler") ? "(Reguler)" : ""}
                          </td>
                          <td className="p-3 md:p-4 whitespace-nowrap">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="p-3 md:p-4">
                            <Badge variant="outline" className={`text-[10px] md:text-xs whitespace-nowrap ${getBookingStatusBadge(booking).className}`}>
                              {getBookingStatusBadge(booking).label}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          Tidak ada pemesanan yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tours" className="space-y-4 outline-none">
          <div className="flex justify-end">
            <Button 
              className="w-full sm:w-auto rounded-full bg-zinc-900 hover:bg-zinc-800 text-white gap-2"
              onClick={handleOpenAddTour}
            >
              <Plus className="h-4 w-4" /> Paket Tur Baru
            </Button>
          </div>
          {(() => {
            const totalTourPages = Math.ceil((tours?.length || 0) / TOURS_PER_PAGE);
            const paginatedTours = tours?.slice((tourPage - 1) * TOURS_PER_PAGE, tourPage * TOURS_PER_PAGE) || [];
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {toursLoading ? (
                    <div className="col-span-full p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-muted-foreground">Memuat paket tur...</p>
                    </div>
                  ) : paginatedTours.length > 0 ? (
                    paginatedTours.map((tour: any, idx: number) => {
                      const realIdx = (tourPage - 1) * TOURS_PER_PAGE + idx;
                      const tourImg = PlaceHolderImages[realIdx % PlaceHolderImages.length];
                      return (
                        <Card key={`${tour.id}-${realIdx}`} className="overflow-hidden border border-zinc-200 shadow-none group rounded-2xl">
                          <div className="h-32 md:h-40 relative bg-slate-100">
                            {isSupabaseStorageUrl(tour.imageUrl) ? (
                              <img
                                src={tour.imageUrl}
                                alt={tour.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <Image
                                src={tour.imageUrl || tourImg.imageUrl}
                                alt={tour.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                data-ai-hint={tour.imageHint || tourImg.imageHint}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm"
                                onClick={() => handleOpenEditTour(tour)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus paket tur?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tindakan ini tidak dapat dibatalkan. Paket tur "{tour.name}" akan dihapus permanen.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTour(tour.id)} className="bg-red-500 hover:bg-red-600">Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <CardHeader className="p-4">
                            <CardTitle className="text-base md:text-lg">{tour.name}</CardTitle>
                            <CardDescription className="text-xs md:text-sm">
                              Rp {tour.price?.toLocaleString('id-ID')} • {tour.distance} • {tour.duration}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                      Belum ada paket tur yang dibuat. Klik "Paket Tur Baru" untuk memulai.
                    </div>
                  )}
                </div>
                {totalTourPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      disabled={tourPage <= 1}
                      onClick={() => setTourPage((p) => Math.max(1, p - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Halaman {tourPage} dari {totalTourPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      disabled={tourPage >= totalTourPages}
                      onClick={() => setTourPage((p) => Math.min(totalTourPages, p + 1))}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="users" className="space-y-4 outline-none">
          <Card className="rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Manajemen Pengguna</CardTitle>
                <CardDescription className="text-xs md:text-sm">Atur peran dan kelola akses staf.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => { setUserForm({ name: '', email: '', role: 'user', password: '' }); setIsUserDialogOpen(true); }}><Plus className="h-4 w-4" /> Tambah Pengguna</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-3 md:px-6">
              {users && users.length > 0 ? (
                ['admin', 'owner', 'guide', 'user'].map((roleKey) => {
                  const filtered = users.filter(u => (u.role || '').toLowerCase() === roleKey);
                  if (filtered.length === 0) return null;

                  const roleLabels: Record<string, string> = {
                    admin: 'Administrator (Admin)',
                    owner: 'Owner / Pemilik',
                    guide: 'Pemandu / Guide',
                    user: 'Pengguna / User'
                  };

                  // Pagination hanya untuk role 'user'
                  const isUserRole = roleKey === 'user';
                  const totalUserPages = isUserRole ? Math.ceil(filtered.length / USERS_PER_PAGE) : 1;
                  const displayedUsers = isUserRole
                    ? filtered.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE)
                    : filtered;

                  return (
                    <div key={roleKey} className="space-y-3 pt-4 border-t border-zinc-100 first:border-none">
                      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-1">
                        {roleLabels[roleKey]} ({filtered.length})
                      </h3>
                      <div className="space-y-2">
                        {displayedUsers.map((u) => (
                          <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors gap-3 sm:gap-2">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="h-8 w-8 md:h-10 md:w-10 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold">{(u.name || u.email || '').slice(0,1).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-sm truncate">{u.name}</p>
                                  <Badge 
                                    className={`text-[10px] py-0.5 px-2 font-semibold shrink-0 rounded-full border-none text-white ${
                                      u.role === 'admin' ? 'bg-emerald-500 hover:bg-emerald-500' :
                                      u.role === 'guide' ? 'bg-green-500 hover:bg-green-500' :
                                      u.role === 'owner' ? 'bg-blue-500 hover:bg-blue-500' :
                                      'bg-orange-500 hover:bg-orange-500'
                                    }`}
                                  >
                                    {u.role}
                                  </Badge>
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <Button size="sm" variant="outline" className="gap-2 rounded-full text-xs h-8" onClick={() => {
                                setResetPasswordTarget(u)
                                setResetPasswordForm({ password: '', confirmPassword: '' })
                              }}>
                                <RefreshCcw className="h-3.5 w-3.5" /> <span>Reset Password</span>
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-50" onClick={async () => {
                                if (!confirm('Hapus pengguna ini?')) return;
                                if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini secara permanen?')) return;
                                await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
                                fetchUsers()
                              }}> <Trash2 className="h-4 w-4" /> </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {isUserRole && totalUserPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2 pb-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            disabled={userPage <= 1}
                            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                          >
                            Sebelumnya
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Halaman {userPage} dari {totalUserPages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            disabled={userPage >= totalUserPages}
                            onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                          >
                            Selanjutnya
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-sm text-muted-foreground">Belum ada pengguna terdaftar.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 outline-none">
          <Card className="rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl">Log Aktivitas</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Pantau aksi penting seperti assign guide dan scan tiket.
                </CardDescription>
              </div>
              <div className="w-full sm:w-[320px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    placeholder="Cari log aktivitas..."
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="border-b bg-zinc-50">
                    <tr>
                      <th className="p-3 md:p-4 text-left font-medium">Waktu</th>
                      <th className="p-3 md:p-4 text-left font-medium">Aksi</th>
                      <th className="p-3 md:p-4 text-left font-medium">Pelaku</th>
                      <th className="p-3 md:p-4 text-left font-medium">Target</th>
                      <th className="p-3 md:p-4 text-left font-medium">Rincian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                          <p className="mt-2 text-muted-foreground">Memuat log aktivitas...</p>
                        </td>
                      </tr>
                    ) : filteredAuditLogs.length > 0 ? (
                      filteredAuditLogs.map((log: any, index: number) => {
                        const meta = getAuditMeta(log);
                        return (
                          <tr key={log.id || `${meta.action}-${index}`} className="align-top hover:bg-zinc-50/80">
                            <td className="p-3 md:p-4 whitespace-nowrap text-zinc-500">
                              {meta.createdAt ? new Date(meta.createdAt).toLocaleString('id-ID') : '-'}
                            </td>
                            <td className="p-3 md:p-4">
                              <Badge variant="outline" className={`${auditBadgeClass(meta.action)} border text-[10px] md:text-xs capitalize`}>
                                {meta.action.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="p-3 md:p-4">
                              <div className="min-w-0">
                                <p className="font-medium text-zinc-900 truncate">{meta.actorName}</p>
                                <p className="text-[10px] md:text-xs text-zinc-500 capitalize">{meta.actorRole}</p>
                              </div>
                            </td>
                            <td className="p-3 md:p-4">
                              <p className="font-medium text-zinc-900 capitalize">{meta.entityType}</p>
                              <p className="text-[10px] md:text-xs text-zinc-500 break-all">{meta.entityId}</p>
                            </td>
                            <td className="p-3 md:p-4 max-w-[360px]">
                              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs md:text-sm text-zinc-700">
                                {typeof meta.details === 'string' ? (
                                  <span className="break-words">{meta.details}</span>
                                ) : meta.details ? (
                                  <div className="space-y-1">
                                    {Object.entries(meta.details).map(([key, value]) => (
                                      <div key={key} className="flex gap-2">
                                        <span className="min-w-24 font-medium capitalize text-zinc-500">{key.replace(/_/g, ' ')}</span>
                                        <span className="break-words">{String(value ?? '-')}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-zinc-500">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                          Belum ada log aktivitas yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Pengguna</DialogTitle>
              <DialogDescription>Buat akun baru dan kirim kredensial via email.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label>Nama</Label>
                <Input value={userForm.name} onChange={(e)=>setUserForm({...userForm,name:e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={userForm.email} onChange={(e)=>setUserForm({...userForm,email:e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input type="password" value={userForm.password} onChange={(e)=>setUserForm({...userForm,password:e.target.value})} placeholder="Masukkan password (opsional, kosongkan untuk acak)" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select onValueChange={(v)=>setUserForm({...userForm,role:v})}>
                  <SelectTrigger className="w-full"><SelectValue>{userForm.role}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="owner">owner</SelectItem>
                    <SelectItem value="guide">guide</SelectItem>
                    <SelectItem value="user">user</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setIsUserDialogOpen(false)}>Batal</Button>
              <Button onClick={async ()=>{
                try {
                  const resp = await fetch('/api/admin/users', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(userForm) });
                  const data = await resp.json();
                  if (!resp.ok) throw new Error(data?.error || 'Gagal membuat');
                  setCreatedCreds({ id: data.user.id, email: data.user.email, password: data.password });
                  setIsUserDialogOpen(false);
                  fetchUsers();
                } catch (e:any) { alert(e?.message || String(e)) }
              }}>Buat & Kirim</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={!!resetPasswordTarget}
          onOpenChange={(open) => {
            if (!open) {
              setResetPasswordTarget(null)
              setResetPasswordForm({ password: '', confirmPassword: '' })
            }
          }}
        >
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Reset Password Custom</DialogTitle>
              <DialogDescription>
                Isi password baru untuk {resetPasswordTarget?.name || resetPasswordTarget?.email || 'pengguna ini'} lalu konfirmasi sekali lagi.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  value={resetPasswordForm.password}
                  onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan password baru"
                />
              </div>
              <div className="grid gap-2">
                <Label>Konfirmasi Password</Label>
                <Input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Ketik ulang password baru"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setResetPasswordTarget(null)
                setResetPasswordForm({ password: '', confirmPassword: '' })
              }}>Batal</Button>
              <Button onClick={async () => {
                if (!resetPasswordTarget) return;
                const password = resetPasswordForm.password.trim();
                const confirmPassword = resetPasswordForm.confirmPassword.trim();

                if (!password || !confirmPassword) {
                  toast({ variant: 'destructive', title: 'Password belum lengkap', description: 'Isi password baru dan konfirmasi terlebih dahulu.' })
                  return;
                }

                if (password !== confirmPassword) {
                  toast({ variant: 'destructive', title: 'Password tidak cocok', description: 'Pastikan password dan konfirmasi sama.' })
                  return;
                }

                try {
                  const result = await sendCredentials({ id: resetPasswordTarget.id, email: resetPasswordTarget.email, password }, true)
                  setCreatedCreds({ id: result.user.id, email: result.user.email, password: result.password })
                  setResetPasswordTarget(null)
                  setResetPasswordForm({ password: '', confirmPassword: '' })
                  fetchUsers()
                  toast({ title: 'Password diperbarui', description: 'Kredensial baru siap dikirim atau disalin.' })
                } catch (error: any) {
                  toast({ variant: 'destructive', title: 'Gagal reset password', description: error?.message || 'Coba lagi.' })
                }
              }}>Reset & Lanjut</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credentials Modal */}
        <Dialog open={!!createdCreds} onOpenChange={()=>setCreatedCreds(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kredensial Akun</DialogTitle>
              <DialogDescription>Salin atau kirim ke pengguna.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <div>Email: <strong>{createdCreds?.email}</strong></div>
              <div>Password: <strong>{createdCreds?.password}</strong></div>
            </div>
            <DialogFooter>
              <Button onClick={()=>{navigator.clipboard.writeText(`Email: ${createdCreds?.email}\nPassword: ${createdCreds?.password}`)}}>Salin</Button>
              <Button onClick={async ()=>{
                if (!createdCreds) return;
                try {
                  await sendCredentials({ id: createdCreds.id, email: createdCreds.email, password: createdCreds.password }, false)
                  toast({ title: 'Email terkirim', description: 'Kredensial berhasil dikirim ke pengguna.' })
                  setCreatedCreds(null)
                } catch (e:any) {
                  toast({ variant: 'destructive', title: 'Gagal kirim email', description: e?.message || 'Coba lagi.' })
                }
              }}>Kirim Email</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Add/Edit Tour Dialog */}
      <Dialog open={isTourDialogOpen} onOpenChange={setIsTourDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Paket Tur" : "Tambah Paket Tur Baru"}</DialogTitle>
            <DialogDescription>
              Lengkapi detail paket tur untuk ditampilkan kepada pengunjung.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-full border bg-zinc-50/50 p-1 mb-4">
              <TabsTrigger value="basic" className="rounded-full py-1.5 text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Info Dasar</TabsTrigger>
              <TabsTrigger value="detail" className="rounded-full py-1.5 text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Detail & Sejarah</TabsTrigger>
              <TabsTrigger value="route" className="rounded-full py-1.5 text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Rute & Peta</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="tour-name">Nama Tur</Label>
                <Input 
                  id="tour-name" 
                  placeholder="misal: Pacinan Walking Tour"
                  value={tourFormData.name}
                  onChange={(e) => setTourFormData({...tourFormData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tour-price">Harga Reguler (Rp)</Label>
                    <Input 
                      id="tour-price" 
                      type="number"
                      placeholder="65000"
                      value={tourFormData.price}
                      onChange={(e) => setTourFormData({...tourFormData, price: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tour-price-reguler-desc">Deskripsi Reguler</Label>
                    <Input 
                      id="tour-price-reguler-desc" 
                      placeholder="Misal: (Peta, Snack, Minum)"
                      value={tourFormData.priceRegulerDesc}
                      onChange={(e) => setTourFormData({...tourFormData, priceRegulerDesc: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tour-price-hemat">Harga Hemat (Rp)</Label>
                    <Input 
                      id="tour-price-hemat" 
                      type="number"
                      placeholder="45000"
                      value={tourFormData.priceHemat}
                      onChange={(e) => setTourFormData({...tourFormData, priceHemat: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tour-price-hemat-desc">Deskripsi Hemat</Label>
                    <Input 
                      id="tour-price-hemat-desc" 
                      placeholder="Misal: (PETA)"
                      value={tourFormData.priceHematDesc}
                      onChange={(e) => setTourFormData({...tourFormData, priceHematDesc: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tour-date">Tanggal Opsional</Label>
                <Input 
                  id="tour-date" 
                  placeholder="15 Jan 2024"
                  value={tourFormData.date}
                  onChange={(e) => setTourFormData({...tourFormData, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tour-distance">Jarak (KM / Meter)</Label>
                  <Input 
                    id="tour-distance" 
                    placeholder="3 KM atau 500 Meter"
                    value={tourFormData.distance}
                    onChange={(e) => setTourFormData({...tourFormData, distance: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tour-duration">Durasi</Label>
                  <Input 
                    id="tour-duration" 
                    placeholder="2 Jam"
                    value={tourFormData.duration}
                    onChange={(e) => setTourFormData({...tourFormData, duration: e.target.value})}
                  />
                </div>
              </div>
              {/* Deskripsi Singkat dihapus berdasarkan request */}
              <div className="grid gap-2">
                <Label>Foto Galeri Paket (opsional, ganda)</Label>
                <input type="file" accept="image/*" multiple onChange={(e) => setTourFiles(Array.from(e.target.files || []))} className="text-sm cursor-pointer" />
                {tourFiles && tourFiles.length > 0 && <p className="text-xs text-muted-foreground">{tourFiles.length} file dipilih (Akan ditambahkan ke foto sebelumnya)</p>}
                {editingTour && tourFiles.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-zinc-500 mb-2">Foto Saat Ini:</p>
                    <div className="flex flex-wrap gap-2">
                      {editingTour.imageUrl && (
                        <div className="relative w-16 h-16 rounded border border-zinc-200 overflow-hidden bg-zinc-100">
                          <img src={editingTour.imageUrl} alt="Cover" className="object-cover w-full h-full" />
                          <div className="absolute bottom-0 w-full bg-black/50 text-[9px] text-center text-white py-0.5">Cover</div>
                        </div>
                      )}
                      {(() => {
                        try {
                          const gallery = JSON.parse(editingTour.gallery || "[]");
                          if (Array.isArray(gallery)) {
                            return gallery.map((img: any, idx: number) => {
                              if (img.url === editingTour.imageUrl) return null; // don't duplicate cover
                              return (
                                <div key={idx} className="relative w-16 h-16 rounded border border-zinc-200 overflow-hidden bg-zinc-100">
                                  <img src={img.url || img} alt={`Galeri ${idx + 1}`} className="object-cover w-full h-full" />
                                </div>
                              );
                            });
                          }
                        } catch (e) {
                          return null;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="detail" className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="tour-desc-full">Deskripsi Lengkap Tur</Label>
                <Textarea 
                  id="tour-desc-full" 
                  placeholder="Tuliskan deskripsi lengkap tour secara detail..."
                  className="min-h-[100px]"
                  value={tourFormData.descriptionFull}
                  onChange={(e) => setTourFormData({...tourFormData, descriptionFull: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tour-history-culture">Sejarah & Budaya</Label>
                <Textarea 
                  id="tour-history-culture" 
                  placeholder="Ceritakan sejarah dan latar belakang budaya kawasan..."
                  className="min-h-[100px]"
                  value={tourFormData.historyCulture}
                  onChange={(e) => setTourFormData({...tourFormData, historyCulture: e.target.value})}
                />
              </div>
              
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <p className="text-xs font-bold tracking-wider text-zinc-500">Highlights Sejarah & Budaya (Opsional)</p>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 rounded-xl border">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Highlight 1</Label>
                    <Input placeholder="Judul (misal: Arsitektur Hibrida)" className="h-8 text-xs" value={tourFormData.highlight1Title} onChange={(e) => setTourFormData({...tourFormData, highlight1Title: e.target.value})} />
                    <Textarea placeholder="Deskripsi highlight..." className="min-h-[50px] text-xs" value={tourFormData.highlight1Desc} onChange={(e) => setTourFormData({...tourFormData, highlight1Desc: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 rounded-xl border">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Highlight 2</Label>
                    <Input placeholder="Judul (misal: Warisan Kuliner)" className="h-8 text-xs" value={tourFormData.highlight2Title} onChange={(e) => setTourFormData({...tourFormData, highlight2Title: e.target.value})} />
                    <Textarea placeholder="Deskripsi highlight..." className="min-h-[50px] text-xs" value={tourFormData.highlight2Desc} onChange={(e) => setTourFormData({...tourFormData, highlight2Desc: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 rounded-xl border">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Highlight 3</Label>
                    <Input placeholder="Judul" className="h-8 text-xs" value={tourFormData.highlight3Title} onChange={(e) => setTourFormData({...tourFormData, highlight3Title: e.target.value})} />
                    <Textarea placeholder="Deskripsi highlight..." className="min-h-[50px] text-xs" value={tourFormData.highlight3Desc} onChange={(e) => setTourFormData({...tourFormData, highlight3Desc: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 rounded-xl border">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-semibold">Highlight 4</Label>
                    <Input placeholder="Judul" className="h-8 text-xs" value={tourFormData.highlight4Title} onChange={(e) => setTourFormData({...tourFormData, highlight4Title: e.target.value})} />
                    <Textarea placeholder="Deskripsi highlight..." className="min-h-[50px] text-xs" value={tourFormData.highlight4Desc} onChange={(e) => setTourFormData({...tourFormData, highlight4Desc: e.target.value})} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="route" className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
              {/* Detail Rute Maps dihapus berdasarkan request */}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tour-route-map-url">Link Google Maps Rute</Label>
                  <Input 
                    id="tour-route-map-url" 
                    placeholder="Contoh: https://maps.app.goo.gl/..."
                    value={tourFormData.routeMapUrl}
                    onChange={(e) => setTourFormData({...tourFormData, routeMapUrl: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Atau Upload File Gambar Peta</Label>
                  <input type="file" accept="image/*" onChange={(e) => setRouteMapFile(e.target.files?.[0] || null)} className="text-sm cursor-pointer mt-1" />
                  {routeMapFile && <p className="text-xs text-emerald-600 font-semibold">{routeMapFile.name} dipilih</p>}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <p className="text-xs font-bold tracking-wider text-zinc-500">Titik Kunjungan / Points of Interest (POIs)</p>
                <div className="grid gap-3 p-3 bg-zinc-50/50 rounded-xl border space-y-2">
                  {tourFormData.pois.map((poi, idx) => (
                    <div key={idx} className="grid grid-cols-[30px_1fr_auto] items-center gap-2">
                      <span className="font-bold text-sm text-center">{idx + 1}</span>
                      <Input 
                        placeholder={`Lokasi ${idx + 1}`} 
                        className="h-8 text-xs" 
                        value={poi} 
                        onChange={(e) => {
                          const newPois = [...tourFormData.pois];
                          newPois[idx] = e.target.value;
                          setTourFormData({...tourFormData, pois: newPois});
                        }} 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const newPois = tourFormData.pois.filter((_, i) => i !== idx);
                          setTourFormData({...tourFormData, pois: newPois.length > 0 ? newPois : [""]});
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs border-dashed"
                    onClick={() => setTourFormData({...tourFormData, pois: [...tourFormData.pois, ""]})}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Tambah POI
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTourDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTour} className="bg-zinc-900 text-white hover:bg-zinc-800">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer className="w-full rounded-[34px] mt-0" />
      </div>
    </div>
  )
}

