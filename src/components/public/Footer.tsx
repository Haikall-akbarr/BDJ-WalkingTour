import Link from "next/link"
import { Map } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-12 w-full bg-[#10221f] text-white px-4 py-12 md:px-8 md:py-16 md:mt-24">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#98DDCA] text-[#10221f]">
              <Map className="h-5 w-5" />
            </span>
            <p className="text-3xl font-bold md:text-4xl">BDJ Tour</p>
          </div>
          <p className="max-w-xs text-base leading-8 text-white/70 md:text-lg">
            Mitra terpercaya Anda dalam menjelajahi rahasia kota melalui pengalaman jalan kaki yang terkurasi.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-3xl font-bold md:text-4xl text-[#98DDCA]">Bantuan</p>
          <div className="space-y-2 text-base md:text-lg text-white/80">
            <Link href="/#faq" className="block transition-colors hover:text-white">FAQ</Link>
            <Link href="/" className="block transition-colors hover:text-white">Kebijakan Privasi</Link>
            <a href="mailto:support@bdjwalkingtour.com" className="block transition-colors hover:text-white">Kontak Support</a>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-3xl font-bold md:text-4xl text-[#98DDCA]">Hubungi Kami</p>
          <div className="space-y-2 text-base md:text-lg text-white/80">
            <p>Email: <a href="mailto:info@bdjwalkingtour.com" className="hover:underline">info@bdjwalkingtour.com</a></p>
            <p>Instagram: <a href="https://www.instagram.com/bdj.walkingtour/" target="_blank" rel="noopener noreferrer" className="hover:underline">@bdj.walkingtour</a></p>
            <p>WhatsApp: <a href="https://wa.me/6281291697428" target="_blank" rel="noopener noreferrer" className="hover:underline">+62 812-9169-7428</a></p>
            <p>Lokasi: Banjarmasin, Kalimantan Selatan</p>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50 space-y-1">
        <p className=" tracking-wider">POLITEKNIK NEGERI BANJARMASIN & UNIVERSITAS ISLAM NEGERI BANJARMASIN 2026</p>
        <p className="font-semibold text-[#98DDCA]">Haikal x Nazar</p>
      </div>
    </footer>
  )
}
