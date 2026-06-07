"use client"


import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { PasswordField } from "@/components/auth/PasswordField"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [token, setToken] = useState(searchParams.get("token") || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const queryEmail = searchParams.get("email") || ""
    const queryToken = searchParams.get("token") || ""

    if (!email && queryEmail) {
      setEmail(queryEmail)
    }

    if (!token && queryToken) {
      setToken(queryToken)
    }

    if (queryToken) {
      const nextParams = new URLSearchParams()
      if (queryEmail) {
        nextParams.set("email", queryEmail)
      }
      router.replace(`/reset-password${nextParams.toString() ? `?${nextParams.toString()}` : ""}`)
    }
  }, [email, router, searchParams, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, confirmPassword }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Reset password gagal.")
      }

      toast({
        title: "Password berhasil diubah",
        description: "Silakan login kembali dengan password baru Anda.",
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset gagal",
        description: error?.message || "Token atau password tidak valid.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
        <Card className="w-full border-none bg-white/90 shadow-[0_24px_80px_rgba(16,34,31,0.12)] backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-3xl font-bold ">Atur Ulang Password</CardTitle>
            <CardDescription>Gunakan tautan dari email untuk mengatur ulang password. Token diproses otomatis dan tidak ditampilkan di halaman.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <input type="hidden" name="token" value={token} readOnly />
              <div className="space-y-2">
                <PasswordField
                  id="password"
                  label="Password Baru"
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                />
              </div>
              <div className="space-y-2">
                <PasswordField
                  id="confirmPassword"
                  label="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="h-11 w-full rounded-full bg-[#98DDCA] text-[#10221f] hover:bg-[#b8eadc]" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Kembali ke login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}


