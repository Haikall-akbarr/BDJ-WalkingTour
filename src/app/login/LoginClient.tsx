"use client"


import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Info, Lock, Mail, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useToast } from "@/hooks/use-toast"

const DASHBOARD_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  owner: "/dashboard/owner",
  guide: "/dashboard/guide",
  user: "/dashboard/user",
}

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || ""

let firebaseHelper: any = null
async function ensureFirebaseHelper() {
  if (!firebaseHelper) {
    try {
      firebaseHelper = await import("@/lib/firebaseClient")
    } catch (e) {
      // ignore
    }
  }
  return firebaseHelper
}

type ViewMode = "login" | "register" | "reset"


declare global {
  interface Window {}
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)

  const [viewMode, setViewMode] = useState<ViewMode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")

  const staffMode = searchParams.get("mode") === "staff"

  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl

  const getSafeNextRoute = (): string | null => {
    const candidate = searchParams.get("next")
    if (!candidate) return null
    if (!candidate.startsWith("/") || candidate.startsWith("//")) return null
    return candidate
  }

  const routeAfterLogin = (role: string) => {
    const nextRoute = getSafeNextRoute()
    if (nextRoute) {
      router.replace(nextRoute)
      return
    }

    if (role === "user") {
      router.replace("/")
      return
    }

    router.replace(DASHBOARD_ROUTES[role] ?? "/")
  }

  const loginWithEmail = async (emailValue: string, passwordValue: string) => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Login gagal.")
      }

      routeAfterLogin(result?.user?.role || "user")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: error?.message || "Email atau kata sandi salah.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await loginWithEmail(email, password)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Pembuatan akun gagal.")
      }

      toast({
        title: "Akun peserta dibuat",
        description: "Anda langsung masuk ke dashboard peserta.",
      })
      routeAfterLogin(result?.user?.role || "user")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Daftar gagal",
        description: error?.message || "Email sudah dipakai atau data tidak valid.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Permintaan reset gagal.")
      }

      toast({
        title: "Tautan reset dikirim",
        description: "Jika email terdaftar, Anda akan menerima tautan untuk mengatur ulang password.",
      })

      if (result?.resetUrl) {
        router.push(result.resetUrl)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset gagal",
        description: error?.message || "Coba cek email atau hubungi admin.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFirebaseGoogleSignIn = async () => {
    // start redirect-based sign-in (no immediate token returned)
    try {
      console.log('[LoginClient] handleFirebaseGoogleSignIn clicked')
      const helper = await ensureFirebaseHelper()
      if (!helper) throw new Error("Firebase helper tidak tersedia.")

      console.log('[LoginClient] Calling signInWithFirebaseGoogle...')
      await helper.signInWithFirebaseGoogle()
      console.log('[LoginClient] signInWithFirebaseGoogle completed (should have redirected)')
      // Redirect will occur; nothing further here.
    } catch (err: any) {
      console.error('[LoginClient] handleFirebaseGoogleSignIn error:', err?.message)
      toast({
        variant: "destructive",
        title: "Firebase login gagal",
        description: err?.message || String(err),
      })
    }
  }

  // Handle redirect result when user is returned from Firebase auth
  useEffect(() => {
    let mounted = true
    ;(async () => {
      console.log('[LoginClient] useEffect mounted, checking Firebase redirect result...')
      if (!FIREBASE_API_KEY) {
        console.log('[LoginClient] No FIREBASE_API_KEY, skipping')
        return
      }
      const helper = await ensureFirebaseHelper()
      if (!helper) {
        console.log('[LoginClient] Helper not available')
        return
      }

      try {
        // Try to get redirect result first
        console.log('[LoginClient] Calling handleFirebaseRedirectResult...')
        let data = await helper.handleFirebaseRedirectResult()
        
        // If no redirect result, try to get current user (fallback)
        if (!data && helper.getCurrentUserToken) {
          console.log('[LoginClient] No redirect result, trying getCurrentUserToken as fallback...')
          data = await helper.getCurrentUserToken()
        }
        
        console.log('[LoginClient] Auth data:', { hasData: !!data, hasToken: !!data?.firebaseIdToken })
        if (!data || !data.firebaseIdToken) {
          console.log('[LoginClient] No auth data or token found')
          return
        }

        console.log('[LoginClient] Posting token to /api/auth/firebase...')
        const response = await fetch("/api/auth/firebase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: data.firebaseIdToken }),
        })

        const result = await response.json()
        console.log('[LoginClient] Firebase auth response:', { status: response.status, user: result?.user?.email, error: result?.error })
        
        if (!response.ok) {
          throw new Error(result?.error || "Login Firebase gagal.")
        }

        if (mounted) {
          console.log('[LoginClient] Login success, routing to dashboard...')
          routeAfterLogin(result?.user?.role || "user")
        }
      } catch (err: any) {
        console.error('[LoginClient] Error in useEffect:', err?.message, err?.code)
        toast({
          variant: "destructive",
          title: "Firebase login gagal",
          description: err?.message || String(err),
        })
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const renderParticipantForms = () => {
    if (viewMode === "register") {
      return (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama peserta" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="register-email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="register-password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" disabled={loading}>
            {loading ? "Membuat akun..." : "Buat Akun"}
          </Button>
        </form>
      )
    }

    if (viewMode === "reset") {
      return (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Masukkan email yang pernah Anda gunakan. Jika akun ditemukan, tautan reset akan dikirim ke email tersebut.
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="reset-email" type="email" className="pl-10" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="nama@email.com" required />
            </div>
          </div>
          <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </Button>
        </form>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="login-email" type="email" className="pl-10" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password">Password</Label>
            <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setViewMode("reset")}>Lupa password?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="login-password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <Image src={heroImage} alt="Banjarmasin backdrop" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,34,31,0.16)_0%,rgba(16,34,31,0.72)_100%)]" />
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
                Akses peserta dan Heritage Walks
              </div>
              <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-[0.08em] xl:text-7xl">
                Masuk, daftar, dan atur ulang akun dengan mudah.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/80 xl:text-base">
                Gunakan login Google via Firebase, atau buat akun email baru agar proses pemesanan tur tetap lancar tanpa hambatan.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">01</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Firebase Login</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">02</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Buat Akun</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">03</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">Reset Email</p>
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
              <h2 className="text-3xl font-black uppercase leading-tight md:text-4xl">
                {staffMode ? "Heritage Walks Access" : "Selamat Datang Kembali"}
              </h2>
              <p className="text-muted-foreground">
                {staffMode
                  ? "Masuk dengan email yang sudah didaftarkan untuk membuka menu khusus Heritage Walks."
                  : "Masuk, daftar, atau reset password untuk akun peserta Anda."}
              </p>
            </div>

            <Card className="border-none bg-white/85 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{staffMode ? "Akses Khusus" : "Akun Peserta"}</CardTitle>
                <CardDescription>
                  {staffMode
                    ? "Gunakan menu ini hanya untuk akun pengelola yang sudah terdaftar."
                    : "Pilih Firebase Google atau email untuk melanjutkan ke dashboard peserta."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {staffMode ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="staff-email" type="email" className="pl-10" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="staff-password" type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </div>
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" disabled={loading}>
                      {loading ? "Memproses..." : "Masuk ke Menu Khusus"}
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="space-y-3 rounded-3xl border border-primary/10 bg-primary/5 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant={viewMode === "login" ? "default" : "outline"} className={viewMode === "login" ? "rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" : "rounded-full"} onClick={() => setViewMode("login")}>Masuk</Button>
                        <Button type="button" variant={viewMode === "register" ? "default" : "outline"} className={viewMode === "register" ? "rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" : "rounded-full"} onClick={() => setViewMode("register")}>Buat Akun</Button>
                        <Button type="button" variant={viewMode === "reset" ? "default" : "outline"} className={viewMode === "reset" ? "rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" : "rounded-full"} onClick={() => setViewMode("reset")}>Lupa Password</Button>
                      </div>
                      {viewMode === "login" && (
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-white/70 bg-white px-4 py-4 shadow-sm">
                            {FIREBASE_API_KEY ? (
                              <Button
                                type="button"
                                onClick={handleFirebaseGoogleSignIn}
                                className="h-12 w-full rounded-full bg-[#4285F4] text-white hover:brightness-95"
                              >
                                Masuk dengan Google
                              </Button>
                            ) : (
                              <p className="text-center text-xs text-amber-700">
                                Set `NEXT_PUBLIC_FIREBASE_API_KEY` untuk mengaktifkan login Firebase.
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-px flex-1 bg-border" />
                            ATAU MASUK DENGAN EMAIL
                            <span className="h-px flex-1 bg-border" />
                          </div>
                        </div>
                      )}
                    </div>

                    {renderParticipantForms()}

                    {viewMode === "login" && (
                      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-3 text-sm text-muted-foreground">
                        Belum punya akun? Gunakan menu <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setViewMode("register")}>Buat Akun</button>.
                      </div>
                    )}
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                  <Link href="/" className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                    <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
                  </Link>
                  {!staffMode && (
                    <Link href="/login?mode=staff" className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                      Heritage Walks
                    </Link>
                  )}
                </div>
              </CardFooter>
            </Card>

            {!staffMode && (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-bold text-primary-foreground">Catatan Akun Peserta</p>
                    <p>Login Google disediakan melalui Firebase untuk peserta yang terhubung ke akun Google.</p>
                    <p>Jika tidak bisa login dengan Google, buat akun email baru atau reset password dari menu yang tersedia.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}





