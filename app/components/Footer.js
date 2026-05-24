import { FaXTwitter, FaInstagram, FaDiscord, FaYoutube, FaTelegram } from "react-icons/fa6";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0D1117] border-t border-[#30363D] py-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* BRAND */}
          <div className="col-span-1">
            <div className="text-[#00D4FF] font-bold text-2xl mb-3">MatrixVerse</div>
            <p className="text-[#8B949E] text-sm leading-relaxed mb-4">
              The all-in-one platform for serious traders. Track, improve, and dominate the markets.
            </p>
            <div className="flex gap-4">
  <a href="https://x.com" target="_blank" className="text-[#8B949E] hover:text-[#00D4FF] transition-colors">
    <FaXTwitter size={18} />
  </a>
  <a href="https://instagram.com" target="_blank" className="text-[#8B949E] hover:text-[#E1306C] transition-colors">
    <FaInstagram size={18} />
  </a>
  <a href="https://discord.com" target="_blank" className="text-[#8B949E] hover:text-[#5865F2] transition-colors">
    <FaDiscord size={18} />
  </a>
  <a href="https://youtube.com" target="_blank" className="text-[#8B949E] hover:text-[#FF0000] transition-colors">
    <FaYoutube size={18} />
  </a>
  <a href="https://t.me" target="_blank" className="text-[#8B949E] hover:text-[#00D4FF] transition-colors">
    <FaTelegram size={18} />
  </a>
</div>
          </div>

          {/* PRODUCT */}
          <div>
            <div className="text-white font-semibold text-sm mb-4">Product</div>
            <div className="flex flex-col gap-2">
              <Link href="#features" className="text-[#8B949E] hover:text-white text-sm transition-colors">Features</Link>
              <Link href="#pricing" className="text-[#8B949E] hover:text-white text-sm transition-colors">Pricing</Link>
              <Link href="#faq" className="text-[#8B949E] hover:text-white text-sm transition-colors">FAQ</Link>
              <Link href="/dashboard" className="text-[#8B949E] hover:text-white text-sm transition-colors">Dashboard</Link>
            </div>
          </div>

          {/* COMMUNITY */}
          <div>
            <div className="text-white font-semibold text-sm mb-4">Community</div>
            <div className="flex flex-col gap-2">
              <Link href="/community" className="text-[#8B949E] hover:text-white text-sm transition-colors">Feed</Link>
              <Link href="/leaderboard" className="text-[#8B949E] hover:text-white text-sm transition-colors">Leaderboard</Link>
              <Link href="/prop-firms" className="text-[#8B949E] hover:text-white text-sm transition-colors">Prop Firms</Link>
              <Link href="/psychology" className="text-[#8B949E] hover:text-white text-sm transition-colors">Psychology</Link>
            </div>
          </div>

          {/* LEGAL */}
          <div>
            <div className="text-white font-semibold text-sm mb-4">Legal</div>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-[#8B949E] hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[#8B949E] hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-[#8B949E] hover:text-white text-sm transition-colors">Cookie Policy</Link>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="border-t border-[#30363D] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#8B949E] text-sm">
            © 2025 MatrixVerse. All rights reserved.
          </p>
          <p className="text-[#8B949E] text-sm">
            Built for traders. By traders. 🚀
          </p>
        </div>

      </div>
    </footer>
  );
}