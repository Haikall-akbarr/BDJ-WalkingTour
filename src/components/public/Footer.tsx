import Link from "next/link"
import Image from "next/image"
import { Map } from "lucide-react"
import { cn } from "@/lib/utils"

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-8 w-full bg-[#10221f] text-white px-4 py-6 md:px-8 md:py-8 md:mt-12", className)}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
              <Map className="h-4 w-4" />
            </span>
            <p className="text-xl font-bold md:text-2xl">BDJ Tour</p>
          </div>
          <p className="max-w-xs text-xs leading-6 text-white/70 md:text-sm">
            Mitra terpercaya Anda dalam menjelajahi rahasia kota melalui pengalaman jalan kaki yang terkurasi.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-bold text-[#98DDCA] md:text-xl">Bantuan</p>
          <div className="space-y-1 text-xs md:text-sm text-white/80">
            <Link href="/#faq" className="block transition-colors hover:text-white">FAQ</Link>
            <Link href="/" className="block transition-colors hover:text-white">Kebijakan Privasi</Link>
            <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-white">Kontak Support</a>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-bold text-[#98DDCA] md:text-xl">Hubungi Kami</p>
          <div className="space-y-1 text-xs md:text-sm text-white/80">
            <p>Email: <a href="mailto:info@bdjwalkingtour.com" className="hover:underline">info@bdjwalkingtour.com</a></p>
            <p>Instagram: <a href="https://www.instagram.com/bdj.walkingtour/" target="_blank" rel="noopener noreferrer" className="hover:underline">@bdj.walkingtour</a></p>
            <p>WhatsApp: <a href="https://wa.me/6281291697428" target="_blank" rel="noopener noreferrer" className="hover:underline">+62 812-9169-7428</a></p>
            <p>Lokasi: Banjarmasin, Kalimantan Selatan</p>
          </div>
        </div>

        {/* Bekantan mascot */}
        <div className="flex items-end justify-center xl:justify-end">
          <div className="relative w-[110px] h-[135px] md:w-[130px] md:h-[160px]">
            <Image
              src="/bekantan.png"
              alt="Bekantan - Maskot Banjarmasin"
              fill
              className="object-contain drop-shadow-[0_4px_20px_rgba(152,221,202,0.25)]"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-3 text-center text-[10px] md:text-xs text-white/50 space-y-1">
        <p className="tracking-wider">POLITEKNIK NEGERI BANJARMASIN & UNIVERSITAS ISLAM NEGERI BANJARMASIN 2026</p>
        <p className="font-semibold text-[#98DDCA]">Haikal x Nazar</p>
      </div>
    </footer>
  )
}
