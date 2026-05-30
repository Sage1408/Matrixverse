"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import InboxIcon from "../components/InboxIcon";
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function JournalClient() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [isDemo, setIsDemo] = useState(false)
  // Risk calculator state
  const [rcBalance, setRcBalance] = useState("")
  const [rcRiskPct, setRcRiskPct] = useState("")
  const [rcPipValue, setRcPipValue] = useState("10")
  const [rcLotSize, setRcLotSize] = useState(null)
  const [showRc, setShowRc] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [checklist, setChecklist] = useState({
    hasSL: false, hasTP: false, riskOk: false, notRevenge: false, planWritten: false,
  })
  const [importModal, setImportModal] = useState(false)
  const [importData, setImportData] = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [form, setForm] = useState({
    pair: "",
    direction: "buy",
    lot_size: "",
    entry_price: "",
    stop_loss: "",
    take_profit: "",
    pnl: "",
    strategy: "",
    emotion_before: "",
    emotion_after: "",
    notes: "",
    traded_at: new Date().toISOString().slice(0, 16),
  });
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchTrades(user.id);
      }
    };
    getUser();
  }, []);

  const fetchTrades = async (userId) => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("traded_at", { ascending: false });
    if (data) setTrades(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculateRR = () => {
    const entry = parseFloat(form.entry_price);
    const sl = parseFloat(form.stop_loss);
    const tp = parseFloat(form.take_profit);
    if (entry && sl && tp) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      return (reward / risk).toFixed(2);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let screenshotUrl = null;

    // Upload screenshot if selected
    if (screenshot) {
      const fileExt = screenshot.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, screenshot);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("screenshots")
          .getPublicUrl(fileName);
        screenshotUrl = urlData.publicUrl;
      }
    }

    const rr = calculateRR();

    const { error } = await supabase.from("trades").insert([{
      user_id: user.id,
      pair: form.pair,
      direction: form.direction,
      lot_size: parseFloat(form.lot_size),
      entry_price: parseFloat(form.entry_price),
      stop_loss: parseFloat(form.stop_loss),
      take_profit: parseFloat(form.take_profit),
      pnl: parseFloat(form.pnl),
      rr_ratio: rr ? parseFloat(rr) : null,
      strategy: form.strategy,
      tags: tags.length > 0 ? tags : null,
      emotion_before: form.emotion_before,
      emotion_after: form.emotion_after,
      notes: form.notes,
      traded_at: form.traded_at,
      screenshot_url: screenshotUrl,
      is_demo: isDemo,
    }]);

    if (!error) {
      setShowModal(false);
      fetchTrades(user.id);
      setScreenshot(null);
      setTags([]);
      setIsDemo(false);
      setShowRc(false);
      setRcLotSize(null);
      setChecklist({ hasSL: false, hasTP: false, riskOk: false, notRevenge: false, planWritten: false });
      setForm({
        pair: "",
        direction: "buy",
        lot_size: "",
        entry_price: "",
        stop_loss: "",
        take_profit: "",
        pnl: "",
        strategy: "",
        emotion_before: "",
        emotion_after: "",
        notes: "",
        traded_at: new Date().toISOString().slice(0, 16),
      });
    }
    setLoading(false);
  };

  // Filter trades by date range
  const getFilteredTrades = () => {
    if (!exportFrom && !exportTo) return trades;
    return trades.filter((t) => {
      const date = new Date(t.traded_at);
      const from = exportFrom ? new Date(exportFrom) : null;
      const to = exportTo ? new Date(exportTo) : null;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  };

  // Export as CSV
  const exportCSV = () => {
    const filtered = getFilteredTrades();
    const headers = ["Pair","Direction","Lot Size","Entry","SL","TP","PnL","RR","Strategy","Emotion Before","Emotion After","Notes","Date"];
    const rows = filtered.map(t => [
      t.pair, t.direction, t.lot_size, t.entry_price,
      t.stop_loss, t.take_profit, t.pnl, t.rr_ratio,
      t.strategy, t.emotion_before, t.emotion_after,
      t.notes, new Date(t.traded_at).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matrixverse_trades.csv";
    a.click();
  };

  // Export as Excel
  const exportExcel = () => {
    const filtered = getFilteredTrades();
    const data = filtered.map(t => ({
      Pair: t.pair,
      Direction: t.direction,
      "Lot Size": t.lot_size,
      Entry: t.entry_price,
      SL: t.stop_loss,
      TP: t.take_profit,
      PnL: t.pnl,
      RR: t.rr_ratio,
      Strategy: t.strategy,
      "Emotion Before": t.emotion_before,
      "Emotion After": t.emotion_after,
      Notes: t.notes,
      Date: new Date(t.traded_at).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    XLSX.writeFile(wb, "matrixverse_trades.xlsx");
  };

  // Export as PDF
  const exportPDF = () => {
    const filtered = getFilteredTrades();
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("MatrixVerse Trading Journal", 14, 15);
    doc.setFontSize(10);
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Pair","Dir","Lot","Entry","SL","TP","PnL","RR","Strategy","Date"]],
      body: filtered.map(t => [
        t.pair, t.direction, t.lot_size, t.entry_price,
        t.stop_loss, t.take_profit, `$${t.pnl}`,
        t.rr_ratio ? `${t.rr_ratio}R` : "-",
        t.strategy || "-",
        new Date(t.traded_at).toLocaleDateString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 212, 255], textColor: [0, 0, 0] },
    });
    doc.save("matrixverse_trades.pdf");
  };

  // CSV Import
  const parseCSV = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim())

    // Detect format
    const isMT4 = headers.some(h => h.includes("ticket") || h.includes("open price"))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ""))
      if (cols.length < 2) continue

      if (isMT4) {
        // MT4: Ticket,Time,Type,Size,Symbol,Open Price,S/L,T/P,Close Time,Close Price,Commission,Taxes,Swap,Profit
        const type = cols[2]?.toLowerCase() || ""
        if (type.includes("balance") || type.includes("deposit")) continue
        rows.push({
          pair: cols[4] || "",
          direction: type.includes("buy") ? "buy" : type.includes("sell") ? "sell" : "buy",
          lot_size: parseFloat(cols[3]) || 0,
          entry_price: parseFloat(cols[5]) || 0,
          stop_loss: parseFloat(cols[6]) || 0,
          take_profit: parseFloat(cols[7]) || 0,
          pnl: parseFloat(cols[13]) || 0,
          strategy: "Imported",
          traded_at: cols[1] ? new Date(cols[1]).toISOString() : new Date().toISOString(),
          notes: `Imported from MT4 (Ticket: ${cols[0]})`,
        })
      } else {
        // MatrixVerse format
        const get = (key) => {
          const idx = headers.findIndex(h => h.includes(key))
          return idx >= 0 ? cols[idx] : ""
        }
        const pair = get("pair") || get("symbol")
        const dirRaw = (get("direction") || get("type") || "buy").toLowerCase()
        const pnl = parseFloat(get("pnl") || get("profit")) || 0
        rows.push({
          pair,
          direction: dirRaw.includes("sell") ? "sell" : "buy",
          lot_size: parseFloat(get("lot")) || 0,
          entry_price: parseFloat(get("entry")) || 0,
          stop_loss: parseFloat(get("sl")) || 0,
          take_profit: parseFloat(get("tp")) || 0,
          pnl,
          strategy: get("strategy") || "Imported",
          traded_at: get("date") ? new Date(get("date")).toISOString() : new Date().toISOString(),
          notes: get("notes") || "Imported via CSV",
        })
      }
    }
    return rows.filter(r => r.pair)
  }

  const handleImport = async () => {
    if (importData.length === 0) return
    setImportLoading(true)
    const { error } = await supabase.from("trades").insert(
      importData.map(t => ({
        user_id: user.id,
        ...t,
      }))
    )
    if (!error) {
      fetchTrades(user.id)
      setImportModal(false)
      setImportData([])
    }
    setImportLoading(false)
  }

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors";
  const labelClass = "text-[var(--text-muted)] text-xs mb-1 block";

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
        <SkeletonText lines={2} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">

      {/* NAVBAR */}
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <InboxIcon username={user?.user_metadata?.username} />
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
           <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
        </div>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 pb-24">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Trading Journal</h1>
            <p className="text-[var(--text-muted)] text-sm">Log and track all your trades</p>
          </div>
          <button
            onClick={() => setShowChecklist(true)}
            className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-6 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors"
          >
            + Add Trade
          </button>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Trades", value: trades.length, color: "#00D4FF" },
            { label: "Wins", value: trades.filter(t => t.pnl > 0).length, color: "#00FF88" },
            { label: "Losses", value: trades.filter(t => t.pnl < 0).length, color: "#FF4757" },
            {
              label: "Net PnL",
              value: `$${trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}`,
              color: trades.reduce((sum, t) => sum + (t.pnl || 0), 0) >= 0 ? "#00FF88" : "#FF4757"
            },
          ].map((stat, index) => (
            <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4">
              <div className="text-[var(--text-muted)] text-xs mb-1">{stat.label}</div>
              <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* EXPORT ROW */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 mb-6">
          <p className="text-[var(--text-muted)] text-xs mb-3">Export trades by date range</p>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className={labelClass}>From</label>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label className={labelClass}>To</label>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={exportCSV} className="bg-[var(--accent-green-bg)] border border-[var(--accent-green)] text-[var(--accent-green)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)] transition-colors">
                CSV
              </button>
              <button onClick={exportExcel} className="bg-[#7C3AED20] border border-[#7C3AED] text-[var(--accent-purple)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-purple)] hover:text-[var(--text-primary)] transition-colors">
                Excel
              </button>
              <button onClick={exportPDF} className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] text-[var(--accent-red)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-red)] hover:text-[var(--text-primary)] transition-colors">
                PDF
              </button>
              <button onClick={() => setImportModal(true)} className="bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-gold)] hover:text-[var(--bg-primary)] transition-colors">
                Import CSV
              </button>
            </div>
          </div>
        </div>

        {/* TAG FILTER */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)] flex-1 max-w-xs"
          />
        </div>

        {/* TRADES LIST */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-[var(--text-primary)] font-bold">All Trades</h2>
          </div>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📓</div>
              <p className="text-[var(--text-muted)] text-sm">No trades logged yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors"
              >
                Log Your First Trade
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Pair","Direction","Lot","Entry","SL","TP","RR","PnL","Tags","Strategy","Screenshot","Date"].map((h) => (
                      <th key={h} className="text-[var(--text-muted)] text-xs font-semibold px-4 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tagFilter
                    ? trades.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())))
                    : trades
                  ).map((trade, index) => (
                    <tr key={index} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="px-4 py-3 text-[var(--accent-blue)] font-bold text-sm">
                        {trade.pair}
                        {trade.is_demo && <span className="ml-1.5 text-[10px] bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] font-bold px-1.5 py-0.5 rounded-full align-middle">Paper</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trade.direction === "buy" ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]" : "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"}`}>
                          {trade.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">{trade.lot_size}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-sm">{trade.entry_price}</td>
                      <td className="px-4 py-3 text-[var(--accent-red)] text-sm">{trade.stop_loss}</td>
                      <td className="px-4 py-3 text-[var(--accent-green)] text-sm">{trade.take_profit}</td>
                      <td className="px-4 py-3 text-[var(--accent-gold)] text-sm">{trade.rr_ratio ? `${trade.rr_ratio}R` : "-"}</td>
                      <td className="px-4 py-3 font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                      </td>
                      <td className="px-4 py-3">
                        {trade.tags && trade.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {trade.tags.map((tag, i) => (
                              <span key={i} className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-sm">{trade.strategy || "-"}</td>
                      <td className="px-4 py-3">
                        {trade.screenshot_url ? (
                          <a href={trade.screenshot_url} target="_blank" className="text-[var(--accent-blue)] text-xs hover:underline">
                            View 📸
                          </a>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{new Date(trade.traded_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PRE-TRADE CHECKLIST MODAL */}
      {showChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">✅ Pre-Trade Checklist</h2>
              <button onClick={() => setShowChecklist(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <p className="text-[var(--text-muted)] text-sm">Before you enter this trade, confirm:</p>
              {[
                { key: "hasSL", label: "I have a Stop Loss set" },
                { key: "hasTP", label: "I have a Take Profit set" },
                { key: "riskOk", label: "I'm risking ≤ 2% of my account" },
                { key: "notRevenge", label: "I'm not revenge trading" },
                { key: "planWritten", label: "I have a written plan for this trade" },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={"flex items-center gap-3 p-3 rounded-xl border transition-colors text-left " + (
                    checklist[item.key]
                      ? "border-[var(--accent-green)] bg-[var(--accent-green-bg)]"
                      : "border-[var(--border)] hover:border-[var(--accent-blue)]"
                  )}
                >
                  <span className={"w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " + (
                    checklist[item.key] ? "border-[var(--accent-green)] bg-[var(--accent-green)] text-black" : "border-[var(--border)]"
                  )}>
                    {checklist[item.key] && <span className="text-xs font-bold">✓</span>}
                  </span>
                  <span className={"text-sm " + (checklist[item.key] ? "text-[var(--accent-green)] font-semibold" : "text-[var(--text-secondary)]")}>{item.label}</span>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowChecklist(false)} className="flex-1 border border-[var(--border)] text-[var(--text-muted)] font-semibold py-3 rounded-full text-sm hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">
                  Skip
                </button>
                <button
                  onClick={() => { setShowChecklist(false); setShowModal(true) }}
                  disabled={!Object.values(checklist).every(Boolean)}
                  className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-40"
                >
                  I'm Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {importModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">📥 Import Trades</h2>
              <button onClick={() => { setImportModal(false); setImportData([]) }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 flex flex-col gap-3">
                <p className="text-[var(--text-primary)] text-xs font-bold">📋 How to export from MT4 / MT5</p>
                <div className="flex flex-col gap-2">
                  <details className="group">
                    <summary className="text-[var(--accent-blue)] text-xs font-semibold cursor-pointer hover:underline list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span> MT4 Steps
                    </summary>
                    <ol className="text-[var(--text-muted)] text-[11px] leading-relaxed pl-4 pt-2 flex flex-col gap-1 list-decimal">
                      <li>Open MT4 → go to <strong>Account History</strong> tab (bottom)</li>
                      <li>Right-click anywhere in the history area → select <strong>Save as Detailed Report</strong></li>
                      <li>Save the <code>.html</code> file to your computer</li>
                      <li>Open the file in a browser, copy the table, paste into a new CSV file</li>
                      <li><strong>OR</strong> use a free online converter (HTML to CSV)</li>
                    </ol>
                  </details>
                  <details className="group">
                    <summary className="text-[var(--accent-blue)] text-xs font-semibold cursor-pointer hover:underline list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span> MT5 Steps
                    </summary>
                    <ol className="text-[var(--text-muted)] text-[11px] leading-relaxed pl-4 pt-2 flex flex-col gap-1 list-decimal">
                      <li>Open MT5 → go to <strong>Tools</strong> → <strong>History Center</strong></li>
                      <li>Select the account and time period</li>
                      <li>Click <strong>Export</strong> → choose CSV format</li>
                      <li>Save the CSV file</li>
                      <li>Upload it below</li>
                    </ol>
                  </details>
                  <details className="group">
                    <summary className="text-[var(--accent-blue)] text-xs font-semibold cursor-pointer hover:underline list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span> MatrixVerse CSV Format
                    </summary>
                    <div className="text-[var(--text-muted)] text-[11px] leading-relaxed pl-4 pt-2">
                      <p className="mb-1">You can also upload a CSV with these columns:</p>
                      <code className="block bg-[var(--bg-primary)] p-2 rounded-lg text-[10px]">
                        Pair,Direction,Lot Size,Entry,SL,TP,PnL,Strategy,Date
                      </code>
                    </div>
                  </details>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  const text = await file.text()
                  const parsed = parseCSV(text)
                  setImportData(parsed)
                }}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] rounded-xl px-4 py-3 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--accent-blue)] file:text-[var(--bg-primary)] hover:file:bg-[#00b8d9]"
              />
              {importData.length > 0 && (
                <div>
                  <p className="text-[var(--accent-green)] text-xs font-semibold mb-2">✓ {importData.length} trades parsed</p>
                  <div className="max-h-40 overflow-y-auto bg-[var(--bg-primary)] rounded-xl p-3">
                    {importData.slice(0, 10).map((t, i) => (
                      <div key={i} className="text-[10px] text-[var(--text-secondary)] py-0.5 border-b border-[var(--border)] last:border-0">
                        {t.pair} | {t.direction} | {t.lot_size} lot | ${t.pnl}
                      </div>
                    ))}
                    {importData.length > 10 && <div className="text-[10px] text-[var(--text-muted)] pt-1">...and {importData.length - 10} more</div>}
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importLoading}
                    className="w-full mt-3 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
                  >
                    {importLoading ? "Importing..." : `Import ${importData.length} Trades`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD TRADE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Log New Trade</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Currency Pair</label>
                  <select name="pair" value={form.pair} onChange={handleChange} required className={inputClass}>
                    <option value="">Select pair</option>
                    {["EURUSD","GBPUSD","USDJPY","XAUUSD","USDCAD","AUDUSD","NZDUSD","USDCHF","GBPJPY","EURJPY","BTCUSD","ETHUSD"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Direction</label>
                  <select name="direction" value={form.direction} onChange={handleChange} className={inputClass}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Lot Size</label>
                  <input type="number" name="lot_size" placeholder="0.01" step="0.01" value={form.lot_size} onChange={handleChange} required className={inputClass} />
                  <button type="button" onClick={() => setShowRc(!showRc)} className="text-[var(--accent-blue)] text-[10px] font-semibold mt-1 hover:underline">
                    {showRc ? "▲ Hide" : "▼ Risk Calculator"}
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Entry Price</label>
                  <input type="number" name="entry_price" placeholder="1.08500" step="0.00001" value={form.entry_price} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              {showRc && (
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-[var(--text-primary)] text-xs font-bold">⚖️ Position Size Calculator</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Account Balance ($)</label>
                      <input type="number" placeholder="5000" value={rcBalance} onChange={e => setRcBalance(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Risk %</label>
                      <input type="number" placeholder="1" step="0.1" value={rcRiskPct} onChange={e => setRcRiskPct(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>SL (pips)</label>
                      <input type="number" placeholder="20" value={form.stop_loss && form.entry_price ? Math.abs(parseFloat(form.entry_price) - parseFloat(form.stop_loss)).toFixed(1) : ""} readOnly className={inputClass + " opacity-60"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Pip Value ($)</label>
                      <input type="number" placeholder="10" step="0.01" value={rcPipValue} onChange={e => setRcPipValue(e.target.value)} className={inputClass} />
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">$10 for 1 lot EUR/USD</p>
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className={labelClass}>Suggested Lot Size</label>
                      <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold" style={{ color: rcLotSize && parseFloat(rcLotSize) > 0 ? "#00FF88" : "#FF4757" }}>
                        {rcLotSize || "Fill fields above"}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => {
                    const balance = parseFloat(rcBalance)
                    const risk = parseFloat(rcRiskPct)
                    const sl = form.entry_price && form.stop_loss ? Math.abs(parseFloat(form.entry_price) - parseFloat(form.stop_loss)) : 0
                    const pv = parseFloat(rcPipValue)
                    if (balance && risk && sl && pv) {
                      const riskAmount = (balance * risk) / 100
                      const lots = riskAmount / (sl * pv)
                      setRcLotSize(lots.toFixed(2))
                    }
                  }} className="self-end bg-[var(--accent-blue)] text-[var(--bg-primary)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors">
                    Calculate
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stop Loss</label>
                  <input type="number" name="stop_loss" placeholder="1.08000" step="0.00001" value={form.stop_loss} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Take Profit</label>
                  <input type="number" name="take_profit" placeholder="1.09500" step="0.00001" value={form.take_profit} onChange={handleChange} required className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Profit / Loss ($)</label>
                  <input type="number" name="pnl" placeholder="-50 or +120" step="0.01" value={form.pnl} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>RR Ratio (auto)</label>
                  <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--accent-gold)] font-bold">
                    {calculateRR() ? `${calculateRR()}R` : "Fill entry, SL, TP"}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Strategy</label>
                <select name="strategy" value={form.strategy} onChange={handleChange} className={inputClass}>
                  <option value="">Select strategy</option>
                  {["ICT","SMC","Price Action","Scalping","Swing Trading","Breakout","VWAP","Supply & Demand","Other"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tags (press Enter or comma to add)</label>
                <input
                  type="text"
                  placeholder="e.g. scalp, swing, news"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      const val = tagInput.trim().replace(/,/g, "")
                      if (val && !tags.includes(val)) {
                        setTags(prev => [...prev, val])
                      }
                      setTagInput("")
                    }
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} className="hover:text-[var(--text-primary)]">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Emotion Before</label>
                  <select name="emotion_before" value={form.emotion_before} onChange={handleChange} className={inputClass}>
                    <option value="">Select emotion</option>
                    {["Calm","Confident","Anxious","Greedy","Fearful","Excited","Revenge"].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Emotion After</label>
                  <select name="emotion_after" value={form.emotion_after} onChange={handleChange} className={inputClass}>
                    <option value="">Select emotion</option>
                    {["Calm","Confident","Anxious","Greedy","Fearful","Excited","Revenge"].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea name="notes" placeholder="What did you observe? Why did you take this trade?" value={form.notes} onChange={handleChange} rows={3} className={inputClass} />
              </div>

              {/* SCREENSHOT UPLOAD */}
              <div>
                <label className={labelClass}>Screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--accent-blue)] file:text-[var(--bg-primary)] hover:file:bg-[#00b8d9]"
                />
                {screenshot && (
                  <p className="text-[var(--accent-green)] text-xs mt-1">✓ {screenshot.name} selected</p>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsDemo(!isDemo)}
                  className={"relative w-10 h-5 rounded-full transition-colors flex-shrink-0 " + (isDemo ? "bg-[var(--accent-gold)]" : "bg-[var(--border)]")}
                >
                  <div className={"w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all " + (isDemo ? "left-5" : "left-0.5")} />
                </button>
                <div>
                  <span className="text-[var(--text-primary)] text-sm font-semibold">Paper Trade</span>
                  <p className="text-[var(--text-muted)] text-[10px]">Mark as demo/practice — won't affect real stats</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Date & Time</label>
                <input type="datetime-local" name="traded_at" value={form.traded_at} onChange={handleChange} className={inputClass} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-[var(--border)] text-[var(--text-muted)] font-semibold py-3 rounded-full text-sm hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save Trade"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
