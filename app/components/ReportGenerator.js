"use client"
import { useState } from "react"

export default function ReportGenerator({ trades }) {
  const [generating, setGenerating] = useState(false)

  const generateReport = async () => {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Title
      doc.setFontSize(22)
      doc.setTextColor(0, 212, 255)
      doc.text("MatrixVerse", pageWidth / 2, 20, { align: "center" })
      
      doc.setFontSize(16)
      doc.setTextColor(31, 35, 40)
      doc.text("Performance Report", pageWidth / 2, 30, { align: "center" })

      // Date
      doc.setFontSize(10)
      doc.setTextColor(101, 109, 118)
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, 38, { align: "center" })

      // Stats summary
      const total = trades.length
      const wins = trades.filter(t => parseFloat(t.pnl) > 0).length
      const losses = trades.filter(t => parseFloat(t.pnl) < 0).length
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0"
      const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
      const avgRR = trades.filter(t => t.rr_ratio).reduce((sum, t) => sum + parseFloat(t.rr_ratio), 0) / (trades.filter(t => t.rr_ratio).length || 1)

      doc.setFontSize(12)
      doc.setTextColor(31, 35, 40)
      doc.text("Summary", 14, 50)
      
      doc.setFontSize(10)
      doc.setTextColor(87, 96, 106)
      const summaryData = [
        [`Total Trades: ${total}`, `Win Rate: ${winRate}%`],
        [`Wins: ${wins}`, `Losses: ${losses}`],
        [`Total P&L: $${totalPnL.toFixed(2)}`, `Avg RR: ${avgRR.toFixed(2)}R`],
      ]
      autoTable(doc, {
        startY: 55,
        body: summaryData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: pageWidth / 2 - 14 }, 1: { cellWidth: pageWidth / 2 - 14 } },
      })

      // Trades table
      doc.setFontSize(12)
      doc.setTextColor(31, 35, 40)
      doc.text("Trade History", 14, doc.lastAutoTable.finalY + 15)

      const head = [["Date", "Pair", "Direction", "P&L", "RR"]]
      const body = trades.slice().reverse().map(t => [
        new Date(t.traded_at).toLocaleDateString(),
        t.pair,
        t.direction?.toUpperCase() || "-",
        `$${parseFloat(t.pnl).toFixed(2)}`,
        t.rr_ratio ? `${t.rr_ratio}R` : "-",
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head,
        body,
        theme: "grid",
        headStyles: { fillColor: [0, 212, 255], textColor: [13, 17, 23], fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [246, 248, 250] },
      })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text("MatrixVerse - Track. Improve. Dominate the Markets.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" })

      doc.save(`matrixverse-report-${Date.now()}.pdf`)
    } catch (err) {
      console.error("Report generation failed:", err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generateReport}
      disabled={generating || trades.length === 0}
      className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
    >
      {generating ? "Generating..." : "📄 Download PDF Report"}
    </button>
  )
}
