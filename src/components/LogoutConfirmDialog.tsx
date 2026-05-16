"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOutFirebase } from "@/lib/firebaseClient"
import { Button } from "@/components/ui/button"
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
import { LogOut, Loader2 } from "lucide-react"

interface LogoutConfirmDialogProps {
  children?: React.ReactNode
}

export function LogoutConfirmDialog({ children }: LogoutConfirmDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Clear client-side Firebase session first to avoid cached currentUser
      try {
        await signOutFirebase()
      } catch (err) {
        // continue to server logout even if client sign-out fails
        console.error('Client signOut failed:', err)
      }

      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button type="button" variant="secondary" className="inline-flex items-center gap-2 rounded-full bg-white text-[#16302c] hover:bg-white/90">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-amber-200 bg-amber-50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-amber-950">Konfirmasi Logout</AlertDialogTitle>
          <AlertDialogDescription className="text-amber-900">
            Apakah Anda yakin ingin keluar dari akun ini? Anda perlu login kembali untuk mengakses dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full" disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={loading}
            className="rounded-full bg-amber-600 text-white hover:bg-amber-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Keluar..." : "Ya, Keluar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
