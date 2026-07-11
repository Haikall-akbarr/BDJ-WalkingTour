"use client"


import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Info, Mail, MapPin, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordField } from "@/components/auth/PasswordField"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useToast } from "@/hooks/use-toast"

const DASHBOARD_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  owner: "/dashboard/owner",
  guide: "/dashboard/guide",
  user: "/dashboard/user",
}

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || ""
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || ""
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || ""
const FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || ""
const FIREBASE_CLIENT_READY = Boolean(FIREBASE_API_KEY && FIREBASE_AUTH_DOMAIN && FIREBASE_PROJECT_ID && FIREBASE_APP_ID)

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
  interface Window { }
}

async function safeParseResponse(response: Response): Promise<any> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Respon server tidak valid (${response.status}): ${text.substring(0, 80)}...`)
  }
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
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showStaffPassword, setShowStaffPassword] = useState(false)

  const staffMode = searchParams.get("mode") === "staff"

  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-bg")?.imageUrl || PlaceHolderImages[0]?.imageUrl
  const heroSizes = "(max-width: 768px) 100vw, 50vw"

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
      const result = await safeParseResponse(response)

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
      const result = await safeParseResponse(response)

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
      const result = await safeParseResponse(response)

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
    if (loading) return // Prevent multiple simultaneous sign-in attempts
    setLoading(true)
    try {
      console.log('[LoginClient] handleFirebaseGoogleSignIn clicked')
      const helper = await ensureFirebaseHelper()
      if (!helper) throw new Error("Firebase helper tidak tersedia.")

      console.log('[LoginClient] Calling signInWithFirebaseGoogle (popup)...')
      const data = await helper.signInWithFirebaseGoogle()

      // null = popup was cancelled/closed by user or handed off to redirect
      if (!data) {
        console.log('[LoginClient] Firebase sign-in was cancelled or handed off to redirect flow.')
        return
      }

      if (!data.firebaseIdToken) {
        throw new Error('Tidak menerima token dari Firebase.')
      }

      console.log('[LoginClient] signInWithFirebaseGoogle returned token, posting to API...')
      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: data.firebaseIdToken }),
      })

      const result = await safeParseResponse(response)
      if (!response.ok) {
        throw new Error(result?.error || 'Login Firebase gagal.')
      }

      routeAfterLogin(result?.user?.role || 'user')
    } catch (err: any) {
      // Silently ignore cancelled/closed popup errors
      const errCode = String(err?.code || "")
      const errMsg = String(err?.message || err || "")
      if (errCode.includes('cancelled-popup') || errCode.includes('popup-closed') || errMsg.includes('cancelled-popup') || errMsg.includes('popup-closed')) {
        console.log('[LoginClient] Popup was cancelled or closed by user, ignoring.')
        return
      }

      console.error('[LoginClient] handleFirebaseGoogleSignIn error:', errMsg)
      toast({
        variant: "destructive",
        title: "Firebase login gagal",
        description: errMsg.includes("Konfigurasi Firebase belum lengkap")
          ? errMsg
          : errMsg.includes("auth/network-request-failed")
            ? "Firebase tidak bisa terhubung ke jaringan atau konfigurasi authDomain/projectId belum benar. Periksa environment Firebase Anda."
            : errMsg || "Login Google gagal.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const finishRedirectLogin = async () => {
      try {
        const helper = await ensureFirebaseHelper()
        if (!helper || !mounted) return

        const data = await helper.handleFirebaseRedirectResult()
        if (!mounted || !data?.firebaseIdToken) return

        setLoading(true)
        const response = await fetch("/api/auth/firebase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: data.firebaseIdToken }),
        })

        const result = await safeParseResponse(response)
        if (!response.ok) {
          throw new Error(result?.error || 'Login Firebase gagal.')
        }

        routeAfterLogin(result?.user?.role || 'user')
      } catch (error: any) {
        console.error('[LoginClient] handleFirebaseRedirectResult error:', error?.message)
        toast({
          variant: 'destructive',
          title: 'Firebase login gagal',
          description: error?.message || 'Login Google gagal.',
        })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    finishRedirectLogin()

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
          <PasswordField
            id="register-password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Minimal 8 karakter"
            visible={showRegisterPassword}
            onToggle={() => setShowRegisterPassword((current) => !current)}
          />
          <PasswordField
            id="confirm-password"
            label="Konfirmasi Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((current) => !current)}
          />
          <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
          <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            visible={showLoginPassword}
            onToggle={() => setShowLoginPassword((current) => !current)}
          />
          <div className="flex justify-end">
            <button type="button" className="text-xs font-bold text-green-600 hover:underline" onClick={() => setViewMode("reset")}>Lupa password?</button>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses..." : "Masuk"}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/85 px-2 text-muted-foreground">
              atau
            </span>
          </div>
        </div>

        {FIREBASE_API_KEY ? (
          <Button
            type="button"
            onClick={handleFirebaseGoogleSignIn}
            className="h-11 w-full rounded-full bg-gradient-to-r from-white to-[#E8F5EE] text-[#1a2b3c] hover:opacity-90 flex items-center justify-center gap-2 border border-slate-200 font-bold shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Masuk dengan Google
          </Button>
        ) : (
          <p className="text-center text-xs text-amber-700">
            Set `NEXT_PUBLIC_FIREBASE_API_KEY` untuk mengaktifkan login Firebase.
          </p>
        )}
      </form>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <Image src={heroImage} alt="Banjarmasin backdrop" fill sizes={heroSizes} className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,34,31,0.16)_0%,rgba(16,34,31,0.72)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] tracking-[0.3em] text-white/60">Banjarmasin Route</span>
                <span className="font-headline text-lg font-bold">BDJ WalkingTour</span>
              </span>
            </Link>

            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] font-semibold tracking-[0.3em] text-white/85 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Akses peserta dan Heritage Walks
              </div>
              <h1 className="text-5xl font-bold leading-[0.92] tracking-[0.08em] xl:text-7xl">
                Masuk, daftar, dan atur ulang akun dengan mudah.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/80 xl:text-base">
                Gunakan login Google via Firebase, buat akun email baru, atau reset password agar akses ke BDJ WalkingTour tetap lancar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">01</p>
                <p className="text-[10px] tracking-[0.25em] text-white/65">Firebase Login</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">02</p>
                <p className="text-[10px] tracking-[0.25em] text-white/65">Buat Akun</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">03</p>
                <p className="text-[10px] tracking-[0.25em] text-white/65">Reset Email</p>
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
              <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                {staffMode ? "Heritage Walks Access" : "Selamat Datang Kembali"}
              </h2>
              <p className="text-muted-foreground">
                {staffMode
                  ? "Masuk dengan email yang sudah didaftarkan untuk membuka menu khusus Heritage Walks."
                  : "Masuk atau daftar untuk melanjutkan ke BDJ WalkingTour."}
              </p>
            </div>

            <Card className="border-none bg-white/85 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{staffMode ? "Akses Khusus" : "Akun Peserta"}</CardTitle>
                <CardDescription>
                  {staffMode
                    ? "Gunakan email/password untuk akun admin, owner, atau guide yang sudah di-seed di Supabase."
                    : "Pilih Google atau email untuk melanjutkan ke BDJ WalkingTour."}
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
                      <PasswordField
                        id="staff-password"
                        label="Password"
                        value={password}
                        onChange={setPassword}
                        visible={showStaffPassword}
                        onToggle={() => setShowStaffPassword((current) => !current)}
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc] flex items-center justify-center gap-2" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Memproses..." : "Masuk ke Menu Khusus"}
                    </Button>
                  </form>
                ) : (
                  <>

                    {renderParticipantForms()}

                    {viewMode === "login" && (
                      <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-3 text-sm text-muted-foreground">
                        Belum punya akun? Gunakan menu <button type="button" className="font-bold text-green-600 hover:underline" onClick={() => setViewMode("register")}>Buat Akun</button>.
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

      <div className="fixed bottom-4 right-4 z-50">
        {!staffMode && (
          <Link href="/login?mode=staff" className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-[10px] font-medium text-black/40 transition-colors hover:bg-black/10 hover:text-black/60">
            <MapPin className="h-3 w-3" />
            Heritage Walks Access
          </Link>
        )}
      </div>
    </div>
  )
}






