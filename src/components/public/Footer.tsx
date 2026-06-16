import Link from "next/link"
import Image from "next/image"
import { Map } from "lucide-react"
import { cn } from "@/lib/utils"

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-12 w-full bg-[#10221f] text-white px-4 py-8 md:px-8 md:py-10 md:mt-16", className)}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
              <Map className="h-4.5 w-4.5" />
            </span>
            <p className="text-2xl font-bold md:text-3xl">BDJ Tour</p>
          </div>
          <p className="max-w-xs text-sm leading-7 text-white/70 md:text-base">
            Mitra terpercaya Anda dalam menjelajahi rahasia kota melalui pengalaman jalan kaki yang terkurasi.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xl font-bold text-[#98DDCA] md:text-2xl">Bantuan</p>
          <div className="space-y-1.5 text-sm md:text-base text-white/80">
            <Link href="/#faq" className="block transition-colors hover:text-white">FAQ</Link>
            <Link href="/" className="block transition-colors hover:text-white">Kebijakan Privasi</Link>
            <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-white">Kontak Support</a>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xl font-bold text-[#98DDCA] md:text-2xl">Hubungi Kami</p>
          <div className="space-y-1.5 text-sm md:text-base text-white/80">
            <p>Email: <a href="mailto:info@bdjwalkingtour.com" className="hover:underline">info@bdjwalkingtour.com</a></p>
            <p>Instagram: <a href="https://www.instagram.com/bdj.walkingtour/" target="_blank" rel="noopener noreferrer" className="hover:underline">@bdj.walkingtour</a></p>
            <p>WhatsApp: <a href="https://wa.me/6281291697428" target="_blank" rel="noopener noreferrer" className="hover:underline">+62 812-9169-7428</a></p>
            <p>Lokasi: Banjarmasin, Kalimantan Selatan</p>
          </div>
        </div>

        {/* Bekantan mascot */}
        <div className="flex items-end justify-center xl:justify-end">
          <div className="relative w-[140px] h-[170px] md:w-[160px] md:h-[200px]">
            <Image
              src="/Bekantan.png"
              alt="Bekantan - Maskot Banjarmasin"
              fill
              className="object-contain drop-shadow-[0_4px_20px_rgba(152,221,202,0.25)]"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-4 text-center text-[10px] md:text-xs text-white/50 space-y-1">
        <p className="tracking-wider">POLITEKNIK NEGERI BANJARMASIN & UNIVERSITAS ISLAM NEGERI BANJARMASIN 2026</p>
        <p className="font-semibold text-[#98DDCA]">Haikal x Nazar</p>
      </div>
    </footer>
  )
}
