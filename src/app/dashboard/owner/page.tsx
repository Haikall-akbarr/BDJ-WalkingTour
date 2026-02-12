
"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  Users, 
  Map, 
  DollarSign, 
  CalendarClock,
  UserPlus,
  LogOut,
  MapPin,
  Loader2
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
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
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, where, doc, updateDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { useToast } from "@/hooks/use-toast"

const STATS = [
  { label: "Total Pendapatan", value: "Rp 12,5 Jt", icon: DollarSign, trend: "+12%", color: "text-green-600" },
  { label: "Total Pemesanan", value: "184", icon: Users, trend: "+5%", color: "text-blue-600" },
  { label: "Tur Aktif", value: "8", icon: Map, trend: "Stabil", color: "text-primary-foreground" }
];

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'Mei', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const GUIDES = [
  { id: "g1", name: "Andi Saputra" },
  { id: "g2", name: "Budi Santoso" },
  { id: "g3", name: "Siti Aminah" },
  { id: "g4", name: "Diana Putri" },
];

const MOCK_BOOKINGS = [
  { 
    id: "mock-b1", 
    tourName: "Pacinan Walking Tour", 
    userName: "Rizky Ramadhan", 
    pax: 2, 
    createdAt: { toDate: () => new Date() }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b2", 
    tourName: "Susur Sungai Martapura", 
    userName: "Lutfi Hakim", 
    pax: 1, 
    createdAt: { toDate: () => new Date() }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b3", 
    tourName: "Pacinan Walking Tour", 
    userName: "Hendra Wijaya", 
    pax: 3, 
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }, 
    status: "approved", 
    guideId: null 
  },
  { 
    id: "mock-b4", 
    tourName: "Susur Sungai Martapura", 
    userName: "Anita Sari", 
    pax: 2, 
    createdAt: { toDate: () => new Date(Date.now() - 172800000) }, 
    status: "approved", 
    guideId: null 
  }
];

export default function OwnerDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedGuides, setSelectedGuides] = useState<Record<string, string>>({});
  const [removedMockIds, setRemovedMockIds] = useState<string[]>([]);

  const unassignedQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "bookings"), 
      where("status", "==", "approved"),
      where("guideId", "==", null)
    );
  }, [db]);

  const { data: dbBookings, loading } = useCollection(unassignedQuery);

  const bookingsToDisplay = useMemo(() => {
    const activeMocks = MOCK_BOOKINGS.filter(b => !removedMockIds.includes(b.id));
    if (!dbBookings || dbBookings.length === 0) return activeMocks;
    return [...dbBookings, ...activeMocks];
  }, [dbBookings, removedMockIds]);

  const handleAssignGuide = (bookingId: string) => {
    const guideId = selectedGuides[bookingId];
    if (!guideId) return;

    const guideName = GUIDES.find(g => g.id === guideId)?.name;

    // Handle Mock Data (Simulasi)
    if (bookingId.startsWith('mock-')) {
      setRemovedMockIds(prev => [...prev, bookingId]);
      toast({
        title: "Berhasil (Simulasi)",
        description: `Pemandu ${guideName} telah ditugaskan (Hanya tampilan).`,
      });
      return;
    }

    // Handle Real Firestore Data
    if (!db) return;
    const bookingRef = doc(db, "bookings", bookingId);
    
    updateDoc(bookingRef, { 
      guideId: guideId,
      guideName: guideName
    }).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: `bookings/${bookingId}`,
        operation: "update",
        requestResourceData: { guideId, guideName }
      });
      errorEmitter.emit("permission-error", permissionError);
    });

    toast({
      title: "Penugasan Berhasil",
      description: `Pemandu ${guideName} telah ditugaskan.`,
    });
  };

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold font-headline leading-tight">BDJ WalkingTour</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Business Insight</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 w-full sm:w-auto">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90%] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar dari sistem?</AlertDialogTitle>
              <AlertDialogDescription>
                Sesi Anda akan berakhir.
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Pemantauan Bisnis</h1>
          <p className="text-sm md:text-base text-muted-foreground">Ringkasan real-time operasional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {STATS.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-md">
            <CardContent className="p-4 md:p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                <p className={`text-[10px] md:text-xs ${stat.color} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" /> {stat.trend}
                </p>
              </div>
              <div className="bg-primary/10 p-2 md:p-3 rounded-xl">
                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Ikhtisar Pendapatan</CardTitle>
            <CardDescription className="text-xs md:text-sm">Visualisasi pertumbuhan pendapatan bulanan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px] p-2 md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Bar dataKey="value" fill="#98DDCA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <CalendarClock className="h-5 w-5 text-secondary" /> 
              Alokasi Pemandu
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Tugaskan pemandu untuk pesanan yang sudah disetujui.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-3 md:px-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Memuat data...</p>
              </div>
            ) : bookingsToDisplay.length > 0 ? (
              bookingsToDisplay.map((booking: any) => (
                <div key={booking.id} className="flex flex-col gap-3 p-3 md:p-4 rounded-xl border bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-sm md:text-base truncate">{booking.tourName}</p>
                      <div className="flex flex-wrap gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <span className="font-medium text-primary-foreground">{booking.userName}</span>
                        <span>•</span>
                        <span>{booking.createdAt?.toDate().toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[9px] md:text-[10px] py-0 px-1">
                          {booking.pax} Pax {booking.id.startsWith('mock-') && "(Simulasi)"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select 
                      value={selectedGuides[booking.id] || ""}
                      onValueChange={(val) => setSelectedGuides({ ...selectedGuides, [booking.id]: val })}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] bg-white h-9 text-xs">
                        <SelectValue placeholder="Pilih Pemandu" />
                      </SelectTrigger>
                      <SelectContent>
                        {GUIDES.map(guide => (
                          <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-xs h-9"
                      disabled={!selectedGuides[booking.id]}
                      onClick={() => handleAssignGuide(booking.id)}
                    >
                      <UserPlus className="h-3 w-3" /> Tugaskan
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Semua pesanan sudah memiliki pemandu.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
