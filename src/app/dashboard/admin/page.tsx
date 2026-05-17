
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
  Map as MapIcon
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
import { PlaceHolderImages } from "@/lib/placeholder-images"

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
    date: "",
    description: "",
    distance: "3 KM",
    duration: "2 Jam"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");
  const [users, setUsers] = useState<any[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user' });
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

  const fetchTours = async () => {
    setToursLoading(true);
    try {
      const response = await fetch("/api/tours", { cache: "no-store" });
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
      if (!resp.ok) throw new Error(data?.error || 'Gagal memuat audit log');
      setAuditLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (error: any) {
      setAuditLogs([]);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat log audit',
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
      date: "",
      description: "",
      distance: "3 KM",
      duration: "2 Jam"
    });
    setTourFiles([]);
    setIsTourDialogOpen(true);
  };

  const handleOpenEditTour = (tour: any) => {
    setEditingTour(tour);
    setTourFormData({
      name: tour.name || "",
      price: tour.price?.toString() || "",
      date: tour.date || "",
      description: tour.description || "",
      distance: tour.distance || "3 KM",
      duration: tour.duration || "2 Jam"
    });
    setTourFiles([]);
    setIsTourDialogOpen(true);
  };

  const handleSaveTour = async () => {
    const data = {
      ...tourFormData,
      price: Number(tourFormData.price),
    };

    try {
      const response = await fetch(editingTour ? `/api/tours/${editingTour.id}` : "/api/tours", {
        method: editingTour ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Gagal menyimpan tur.");
      }

      // If there are images selected, upload them after creating/updating tour
      const tourId = result?.tour?.id;
      if (tourId && tourFiles && tourFiles.length > 0) {
        // helper to read file as base64 without prefix
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

        const images = await Promise.all(tourFiles.map(async (f) => ({ filename: f.name, data: await readFileAsBase64(f) })));

        try {
          await fetch('/api/tours/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourId, images }),
          });
        } catch (err) {
          // ignore upload failures but notify
          toast({ variant: 'destructive', title: 'Gagal upload gambar', description: 'Gambar mungkin belum tersimpan.' })
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
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/75">Admin Dashboard</p>
              <h1 className="max-w-3xl text-4xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-5xl md:text-6xl">
                Control Center
              </h1>
              <p className="max-w-2xl text-xs text-white/90 md:text-sm">
                Kelola pemesanan, paket tur, dan pengguna dalam panel visual yang seragam dengan dashboard lainnya.
              </p>
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
          <h2 className="text-2xl font-black uppercase md:text-3xl">Pusat Kontrol Admin</h2>
          <p className="text-sm text-zinc-600">Kelola pengguna sistem, tur, dan pengaturan global.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full rounded-[30px] bg-white p-4 shadow-md md:p-6">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="h-auto w-max justify-start rounded-full border bg-zinc-50 p-1 sm:w-full mb-4">
            <TabsTrigger value="bookings" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Pemesanan Pending</TabsTrigger>
            <TabsTrigger value="tours" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Kelola Tur</TabsTrigger>
            <TabsTrigger value="users" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Kelola Pengguna</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-full px-4 py-2 text-xs md:px-6 md:text-sm data-[state=active]:bg-zinc-900 data-[state=active]:text-white">Audit Log</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bookings" className="space-y-4 outline-none">
          <Card className="overflow-hidden rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Permintaan Pemesanan Baru</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Lihat semua pemesanan, baik belum bayar, sudah bayar, maupun dibatalkan.</CardDescription>
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 md:p-4 text-left font-medium">Pelanggan</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tur</th>
                      <th className="p-3 md:p-4 text-center font-medium">Pax</th>
                      <th className="p-3 md:p-4 text-left font-medium">Tanggal</th>
                      <th className="p-3 md:p-4 text-left font-medium">Status</th>
                      <th className="p-3 md:p-4 text-right font-medium">Aksi</th>
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
                          </td>
                          <td className="p-3 md:p-4 whitespace-nowrap">{booking.tourName}</td>
                          <td className="p-3 md:p-4 text-center">{booking.pax}</td>
                          <td className="p-3 md:p-4 whitespace-nowrap">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="p-3 md:p-4">
                            <Badge variant="outline" className={`text-[10px] md:text-xs whitespace-nowrap ${getBookingStatusBadge(booking).className}`}>
                              {getBookingStatusBadge(booking).label}
                            </Badge>
                          </td>
                          <td className="p-3 md:p-4 text-right space-x-1 whitespace-nowrap">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 md:h-8 md:w-8 text-green-600 hover:bg-green-50"
                              onClick={() => handleUpdateBookingStatus(booking.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 md:h-8 md:w-8 text-red-600 hover:bg-red-50"
                              onClick={() => handleUpdateBookingStatus(booking.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {toursLoading ? (
              <div className="col-span-full p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-muted-foreground">Memuat paket tur...</p>
              </div>
            ) : tours && tours.length > 0 ? (
              tours.map((tour: any, idx: number) => {
                const tourImg = PlaceHolderImages[idx % PlaceHolderImages.length];
                return (
                  <Card key={`${tour.id}-${idx}`} className="overflow-hidden border border-zinc-200 shadow-none group rounded-2xl">
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
        </TabsContent>

        <TabsContent value="users" className="space-y-4 outline-none">
          <Card className="rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Manajemen Pengguna</CardTitle>
                <CardDescription className="text-xs md:text-sm">Atur peran dan kelola akses staf.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsUserDialogOpen(true)}><Plus className="h-4 w-4" /> Tambah Pengguna</Button>
                <Button size="sm" variant="outline" className="w-full sm:w-auto gap-2"><Settings className="h-4 w-4" /> Peran</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-3 md:px-6">
              {users && users.length > 0 ? users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors gap-2">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-2 rounded-full" onClick={() => {
                          setResetPasswordTarget(u)
                          setResetPasswordForm({ password: '', confirmPassword: '' })
                        }}>
                          <RefreshCcw className="h-4 w-4" /> Reset Password
                        </Button>
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-zinc-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold">{(u.name || u.email || '').slice(0,1).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{u.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0">{u.role}</Badge>
                    <Button size="icon" variant="ghost" onClick={async () => {
                      // delete
                      if (!confirm('Hapus pengguna ini?')) return;
                      await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
                      fetchUsers()
                    }}> <Trash2 className="h-4 w-4" /> </Button>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-sm text-muted-foreground">Belum ada pengguna terdaftar.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 outline-none">
          <Card className="rounded-[24px] border border-zinc-200 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl">Audit Log Aktivitas</CardTitle>
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
                    placeholder="Cari audit log..."
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
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
                          <p className="mt-2 text-muted-foreground">Memuat log audit...</p>
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
                          Belum ada log audit yang cocok.
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
          <DialogContent className="sm:max-w-[450px]">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Paket Tur" : "Tambah Paket Tur Baru"}</DialogTitle>
            <DialogDescription>
              Lengkapi detail paket tur untuk ditampilkan kepada pengunjung.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tour-name">Nama Tur</Label>
              <Input 
                id="tour-name" 
                placeholder="misal: Pacinan Walking Tour"
                value={tourFormData.name}
                onChange={(e) => setTourFormData({...tourFormData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tour-price">Harga (Rp)</Label>
                <Input 
                  id="tour-price" 
                  type="number"
                  placeholder="65000"
                  value={tourFormData.price}
                  onChange={(e) => setTourFormData({...tourFormData, price: e.target.value})}
                />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tour-distance">Jarak (KM)</Label>
                <Input 
                  id="tour-distance" 
                  placeholder="3 KM"
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
            <div className="grid gap-2">
              <Label htmlFor="tour-desc">Deskripsi</Label>
              <Textarea 
                id="tour-desc" 
                placeholder="Ceritakan sejarah singkat atau rute tur ini..."
                className="min-h-[100px]"
                value={tourFormData.description}
                onChange={(e) => setTourFormData({...tourFormData, description: e.target.value})}
              />
            </div>
              <div className="grid gap-2">
                <Label>Foto Paket (opsional)</Label>
                <input type="file" accept="image/*" multiple onChange={(e) => setTourFiles(Array.from(e.target.files || []))} />
                {tourFiles && tourFiles.length > 0 && <p className="text-sm text-muted-foreground">{tourFiles.length} file dipilih</p>}
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTourDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTour} className="bg-zinc-900 text-white hover:bg-zinc-800">Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
