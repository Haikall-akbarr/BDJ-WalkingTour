
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Chrome, ArrowLeft, Info, Lock, Mail, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth, useFirebaseStatus } from "@/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const DEMO_CREDENTIALS = [
  { email: "admin@bdjwalkingtour.com", password: "admin123", role: "admin" },
  { email: "owner@bdjwalkingtour.com", password: "owner123", role: "owner" },
  { email: "guide@bdjwalkingtour.com", password: "guide123", role: "guide" },
];

const DASHBOARD_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  owner: "/dashboard/owner",
  guide: "/dashboard/guide",
  user: "/dashboard/user",
};

export default function LoginPage() {
  const auth = useAuth();
  const { firebaseReady, firebaseAvailable, firebaseError } = useFirebaseStatus();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const nextRoute = (() => {
    const candidate = searchParams.get("next");
    if (!candidate) return "/";
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
    return candidate;
  })();

  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl;

  const handleLogin = (role: string) => {
    setLoading(true);
    setTimeout(() => {
      router.push(nextRoute || DASHBOARD_ROUTES[role] || "/dashboard/owner");
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = DEMO_CREDENTIALS.find(u => u.email === email && u.password === password);

    setTimeout(() => {
      if (user) {
        router.push(nextRoute || DASHBOARD_ROUTES[user.role] || "/dashboard/owner");
      } else {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "Email atau kata sandi salah. Silakan gunakan kredensial demo di bawah.",
        });
      }
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    if (!firebaseReady) {
      toast({
        title: "Firebase sedang menyiapkan",
        description: "Tunggu sebentar lalu coba login Google lagi.",
      });
      return;
    }

    if (!firebaseAvailable) {
      toast({
        variant: "destructive",
        title: "Firebase belum aktif",
        description: firebaseError || "Inisialisasi Firebase gagal. Periksa env vars NEXT_PUBLIC_FIREBASE_* di Vercel, pastikan auth domain benar, dan aktifkan Google provider di Firebase Auth.",
      });
      return;
    }

    if (!auth) {
      toast({
        variant: "destructive",
        title: "Firebase belum siap",
        description: "Provider Firebase belum menyediakan auth instance. Refresh halaman lalu coba lagi.",
      });
      return;
    }

    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const route = nextRoute || "/";

      toast({
        title: "Login Google berhasil",
        description: `Masuk sebagai ${result.user.displayName || result.user.email || "pengguna"}.`,
      });

      router.push(route);
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      const code = firebaseError?.code || "unknown";
      const hostname = typeof window !== "undefined" ? window.location.hostname : "unknown-host";

      let description = "Aktifkan Google sign-in di Firebase Console, pastikan authorized domains berisi domain Vercel Anda, dan cek config Firebase valid.";

      if (code === "auth/unauthorized-domain") {
        description = `Domain ${hostname} belum diizinkan di Firebase Authentication > Settings > Authorized domains.`;
      } else if (code === "auth/popup-blocked") {
        description = "Popup login diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.";
      } else if (code === "auth/popup-closed-by-user") {
        description = "Popup login ditutup sebelum selesai. Coba login Google sekali lagi.";
      } else if (firebaseError?.message) {
        description = `${firebaseError.message} (code: ${code})`;
      }

      console.error("Google login error", { code, message: firebaseError?.message, hostname });
      toast({
        variant: "destructive",
        title: "Google login gagal",
        description,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <Image src={heroImage} alt="Banjarmasin backdrop" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,34,31,0.16)_0%,rgba(16,34,31,0.7)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Banjarmasin Route</span>
                <span className="font-headline text-lg font-bold">BDJ WalkingTour</span>
              </span>
            </Link>

            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/85 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Staff Access Portal
              </div>
              <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-[0.08em] xl:text-7xl">
                Manage tours with a cleaner workflow.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/80 xl:text-base">
                Masuk untuk mengelola pemesanan, tur, dan operasional dengan tampilan yang lebih tenang, modern, dan mudah dipindai.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">01</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Secure Access</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">02</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Google Login</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">03</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Quick Demo</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 md:px-8">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center space-y-2 lg:text-left">
              <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl tracking-tight text-primary-foreground lg:hidden">
                <MapPin className="h-7 w-7 text-primary" />
                <span className="font-headline">BDJ WalkingTour</span>
              </Link>
              <h2 className="text-3xl font-black uppercase leading-tight md:text-4xl">Selamat Datang Kembali</h2>
              <p className="text-muted-foreground">Masuk untuk mengelola operasional tur Anda.</p>
            </div>

            <Card className="border-none bg-white/85 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Login Staf</CardTitle>
                <CardDescription>Gunakan email staf atau lanjutkan dengan Google untuk mengakses dashboard.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-center gap-2 rounded-full border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading || !firebaseReady}
                  >
                    <Chrome className="h-4 w-4" />
                    {googleLoading ? "Menghubungkan Google..." : !firebaseReady ? "Menyiapkan Firebase..." : "Lanjutkan dengan Google"}
                  </Button>

                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">atau masuk manual</span></div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="staf@bdjwalkingtour.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Kata Sandi</Label>
                      <Button variant="link" type="button" className="h-auto px-0 text-xs text-primary">
                        Lupa kata sandi?
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <div className="flex gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        <p className="font-bold text-primary-foreground">Kredensial Demo:</p>
                        <p>• Admin: admin@bdjwalkingtour.com / admin123</p>
                        <p>• Owner: owner@bdjwalkingtour.com / owner123</p>
                        <p>• Guide: guide@bdjwalkingtour.com / guide123</p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]"
                    disabled={loading || googleLoading}
                  >
                    {loading ? "Memproses..." : "Masuk"}
                  </Button>

                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Akses Cepat</span></div>
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('admin')} disabled={loading || googleLoading}>Admin</Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('owner')} disabled={loading || googleLoading}>Owner</Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => handleLogin('guide')} disabled={loading || googleLoading}>Guide</Button>
                  </div>
                </CardFooter>
              </form>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors lg:justify-start">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
