"use client";

import { FaXTwitter, FaInstagram, FaDiscord, FaYoutube, FaTelegram } from "react-icons/fa6";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeInUp, staggerContainerFast } from "../lib/animations";

export default function Footer() {
  return (
    <footer className="bg-[#0D1117] border-t border-[#30363D] py-16 px-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainerFast}
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1">
            <div className="text-[#00D4FF] font-bold text-2xl mb-3">MatrixVerse</div>
            <p className="text-[#8B949E] text-sm leading-relaxed mb-4">
              The all-in-one platform for serious traders. Track, improve, and dominate the markets.
            </p>
            <div className="flex gap-4">
              {[
                { icon: FaXTwitter, href: "https://x.com", hoverColor: "#00D4FF" },
                { icon: FaInstagram, href: "https://instagram.com", hoverColor: "#E1306C" },
                { icon: FaDiscord, href: "https://discord.com", hoverColor: "#5865F2" },
                { icon: FaYoutube, href: "https://youtube.com", hoverColor: "#FF0000" },
                { icon: FaTelegram, href: "https://t.me", hoverColor: "#00D4FF" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  whileHover={{ scale: 1.3, color: social.hoverColor }}
                  className="text-[#8B949E] transition-colors"
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-4">Product</div>
            <div className="flex flex-col gap-2">
              <Link href="#features" className="text-[#8B949E] hover:text-white text-sm transition-colors">Features</Link>
              <Link href="#pricing" className="text-[#8B949E] hover:text-white text-sm transition-colors">Pricing</Link>
              <Link href="#faq" className="text-[#8B949E] hover:text-white text-sm transition-colors">FAQ</Link>
              <Link href="/dashboard" className="text-[#8B949E] hover:text-white text-sm transition-colors">Dashboard</Link>
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-4">Community</div>
            <div className="flex flex-col gap-2">
              <Link href="/community" className="text-[#8B949E] hover:text-white text-sm transition-colors">Feed</Link>
              <Link href="/leaderboard" className="text-[#8B949E] hover:text-white text-sm transition-colors">Leaderboard</Link>
              <Link href="/prop-firms" className="text-[#8B949E] hover:text-white text-sm transition-colors">Prop Firms</Link>
              <Link href="/psychology" className="text-[#8B949E] hover:text-white text-sm transition-colors">Psychology</Link>
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-4">Legal</div>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-[#8B949E] hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[#8B949E] hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-[#8B949E] hover:text-white text-sm transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="border-t border-[#30363D] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#8B949E] text-sm">
            © 2025 MatrixVerse. All rights reserved.
          </p>
          <p className="text-[#8B949E] text-sm">
            Built for traders. By traders. 🚀
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}