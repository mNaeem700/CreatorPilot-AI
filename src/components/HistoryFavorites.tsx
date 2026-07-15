import React, { useState } from "react";
import { 
  Search, 
  Star, 
  Trash2, 
  Copy, 
  Download, 
  Clock, 
  FileText, 
  Check, 
  Filter,
  Sparkles,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { HistoryEntry } from "../types";
import Markdown from "react-markdown";

interface HistoryFavoritesProps {
  history: HistoryEntry[];
  onToggleFavorite: (id: string) => void;
  onDeleteHistoryEntry: (id: string) => void;
}

export default function HistoryFavorites({ history, onToggleFavorite, onDeleteHistoryEntry }: HistoryFavoritesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter history entries
  const filteredEntries = history.filter((entry) => {
    const matchesSearch = 
      entry.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.output.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(entry.inputs).toLowerCase().includes(searchQuery.toLowerCase());
    
    if (showOnlyFavorites) {
      return matchesSearch && entry.isFavorite;
    }
    return matchesSearch;
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMarkdown = (entry: HistoryEntry) => {
    const element = document.createElement("a");
    const file = new Blob([entry.output], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `creatorpilot_${entry.toolId}_${entry.id}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export selected entry as CSV
  const handleExportEntryCSV = (entry: HistoryEntry) => {
    const headers = ["ID", "Tool Name", "Created At", "Niche", "Inputs", "Output"];
    const inputsStr = Object.entries(entry.inputs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    const row = [
      entry.id,
      entry.toolName,
      new Date(entry.createdAt).toISOString(),
      entry.inputs.niche || entry.inputs.topic || "General",
      inputsStr,
      entry.output
    ].map(val => `"${String(val).replace(/"/g, '""')}"`);

    const csvContent = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `creatorpilot_${entry.toolId}_${entry.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export selected entry as PDF
  const handleExportEntryPDF = async (entry: HistoryEntry) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Header banner
    doc.setFillColor(10, 11, 14);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CreatorPilot AI", margin, 18);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text("Professional Content Generation Report", margin, 24);
    
    doc.setFontSize(8);
    doc.setTextColor(129, 140, 248);
    doc.text(`DATE: ${new Date(entry.createdAt).toLocaleString()}`, margin, 32);

    let y = 50;

    // Metadata box
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 25, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 25, "S");

    doc.setTextColor(71, 85, 105);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text("METADATA PROFILE", margin + 5, y + 6);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Tool Engine: ${entry.toolName}`, margin + 5, y + 13);
    doc.text(`Platform Niche: ${entry.inputs.niche || entry.inputs.topic || "General"}`, margin + 5, y + 19);

    const inputsStr = Object.entries(entry.inputs)
      .filter(([k]) => k !== "screenshot" && k !== "niche" && k !== "topic")
      .map(([k, v]) => `${k}: ${v}`)
      .slice(0, 3)
      .join(" | ");

    if (inputsStr) {
      doc.text(`Inputs Map: ${inputsStr.length > 60 ? inputsStr.substring(0, 60) + "..." : inputsStr}`, margin + 5, y + 23);
    }

    y += 35;

    // Generated AI output section
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("GENERATED AI OUTPUT", margin, y);
    
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 40, y + 2);
    
    y += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);

    const lines = doc.splitTextToSize(entry.output, contentWidth);
    const lineHeight = 6;

    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin + 10;
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`CreatorPilot AI - ${entry.toolName} (Continued)`, margin, margin - 2);
        doc.line(margin, margin, pageWidth - margin, margin);
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
      }
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }

    // Footer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated via CreatorPilot.AI - Confidential External Report", margin, pageHeight - 10);
    
    doc.save(`creatorpilot_${entry.toolId}_${entry.id}.pdf`);
  };

  // Bulk Export CSV
  const handleExportAllCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = ["ID", "Tool Name", "Created At", "Niche", "Inputs", "Output"];
    const rows = filteredEntries.map(entry => {
      const inputsStr = Object.entries(entry.inputs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      return [
        entry.id,
        entry.toolName,
        new Date(entry.createdAt).toISOString(),
        entry.inputs.niche || entry.inputs.topic || "General",
        inputsStr,
        entry.output
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `creatorpilot_history_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Export PDF report
  const handleExportAllPDF = async () => {
    if (filteredEntries.length === 0) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Title Page (Minimal cover page in slate/dark theme)
    doc.setFillColor(10, 11, 14);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CreatorPilot AI", margin, pageHeight / 3);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(156, 163, 175);
    doc.text("Consolidated AI Generation Report", margin, (pageHeight / 3) + 10);
    
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(margin, (pageHeight / 3) + 16, pageWidth - margin, (pageHeight / 3) + 16);

    doc.setFontSize(10);
    doc.setTextColor(129, 140, 248);
    doc.text(`Total Generated Documents: ${filteredEntries.length}`, margin, (pageHeight / 3) + 26);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, (pageHeight / 3) + 32);

    doc.setTextColor(156, 163, 175);
    doc.text("Generated with Gemini 3.5 & Secure Local Client State.", margin, pageHeight - 20);

    // Now append each entry on separate pages
    filteredEntries.forEach((entry, idx) => {
      doc.addPage();
      let y = 20;

      // Grey banner
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 18, "F");
      
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${entry.toolName}`, margin + 4, y + 7);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Niche: ${entry.inputs.niche || entry.inputs.topic || "General"} | Date: ${new Date(entry.createdAt).toLocaleString()}`, margin + 4, y + 13);

      y += 26;

      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(entry.output, contentWidth);
      const lineHeight = 5.5;

      for (let i = 0; i < lines.length; i++) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
          
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(`Document ${idx + 1}: ${entry.toolName} (Continued)`, margin, margin - 2);
          doc.line(margin, margin, pageWidth - margin, margin);
          
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }
    });

    doc.save(`creatorpilot_compiled_report_${Date.now()}.pdf`);
  };

  const handleExportAllJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `creatorpilot_history_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Search & Action Bar */}
      <div className="bg-[#0E1015] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none pl-11 pr-4 py-2.5 rounded-lg text-xs text-white placeholder-slate-600"
            placeholder="Search past outlines, scripts, niches..."
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto gap-3 shrink-0 items-center">
          <button
            onClick={() => setShowOnlyFavorites(prev => !prev)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-xs font-semibold border transition-all ${
              showOnlyFavorites 
                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <Star className={`w-4 h-4 ${showOnlyFavorites ? "fill-indigo-400 text-indigo-400" : ""}`} />
            <span>Starred Only</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleExportAllJSON}
              disabled={filteredEntries.length === 0}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 px-4 py-2.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
              title="Export as JSON"
            >
              Export JSON
            </button>

            <button
              onClick={handleExportAllCSV}
              disabled={filteredEntries.length === 0}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 px-4 py-2.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
              title="Export as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportAllPDF}
              disabled={filteredEntries.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
              title="Export as PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Archive List Left */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[650px] overflow-y-auto pr-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-2xl bg-white/5">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <div className="text-xs font-semibold text-slate-500">No Generations Found</div>
              <p className="text-3xs text-slate-600 mt-1 max-w-[200px] mx-auto">Try clearing your filters or create new content outputs.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedEntry?.id === entry.id 
                    ? "bg-indigo-650/10 border-indigo-850/40 shadow-md" 
                    : "bg-[#0E1015] border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{entry.toolName}</h4>
                    <span className="text-3xs text-slate-500 mt-1 block">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
                      className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-indigo-400 transition"
                      title="Star favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? "fill-indigo-400 text-indigo-400" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteHistoryEntry(entry.id); if (selectedEntry?.id === entry.id) setSelectedEntry(null); }}
                      className="p-1.5 hover:bg-red-950/30 rounded text-slate-500 hover:text-red-400 transition"
                      title="Purge record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-2xs text-slate-400 line-clamp-2 leading-relaxed">
                  {entry.output}
                </p>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <span className="text-3xs font-mono text-slate-500">
                    Niche: {entry.inputs.niche || entry.inputs.topic || "General"}
                  </span>
                  <span className="text-3xs text-indigo-400 font-semibold uppercase">View details →</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Output Detail Pane Right */}
        <div className="lg:col-span-7">
          {selectedEntry ? (
            <div className="bg-[#0E1015] border border-white/5 p-6 rounded-2xl flex flex-col justify-between min-h-[500px]">
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start border-b border-white/5 pb-4 mb-5 gap-3">
                  <div>
                    <span className="text-3xs font-bold uppercase tracking-widest text-indigo-400">Archived Record Details</span>
                    <h3 className="font-display font-bold text-white mt-1">{selectedEntry.toolName}</h3>
                    <span className="text-3xs text-slate-500 block mt-1">
                      Invoked on {new Date(selectedEntry.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleCopyText(selectedEntry.output, selectedEntry.id)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-xs transition-all flex items-center space-x-1"
                      title="Copy Output"
                    >
                      {copiedId === selectedEntry.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === selectedEntry.id ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadMarkdown(selectedEntry)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-xs transition-all flex items-center space-x-1"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>MD</span>
                    </button>
                    <button
                      onClick={() => handleExportEntryCSV(selectedEntry)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-xs transition-all flex items-center space-x-1"
                      title="Export as CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => handleExportEntryPDF(selectedEntry)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded text-xs transition-all flex items-center space-x-1 font-semibold"
                      title="Export as PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Parameters capsule */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-5">
                  <div className="text-3xs font-bold uppercase tracking-widest text-slate-500 mb-2">Input Settings Mapped:</div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedEntry.inputs).map(([key, val]) => (
                      key !== "screenshot" && (
                        <div key={key}>
                          <span className="text-3xs text-slate-500 font-semibold uppercase">{key}</span>
                          <span className="text-2xs text-slate-300 block truncate" title={String(val)}>{String(val)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Main scrollable body */}
                <div className="markdown-body prose prose-cyan prose-invert max-w-none text-sm text-slate-200 leading-relaxed font-sans max-h-[420px] overflow-y-auto pr-1">
                  <Markdown>{selectedEntry.output}</Markdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-white/5 rounded-2xl bg-white/5 p-8 flex flex-col items-center justify-center text-center min-h-[500px]">
              <FileText className="w-10 h-10 text-slate-800 mb-3" />
              <div className="text-xs font-semibold text-slate-500">No Document Selected</div>
              <p className="text-3xs text-slate-600 mt-1 max-w-[200px]">Select an archived creator outline on the left-side timeline to display full text variables.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
