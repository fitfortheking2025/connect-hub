// src/app/components/TempCsvUploader.tsx
"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function TempCsvUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select your CSV file first.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import-vips", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || `Successfully imported ${data.count} VIPs!` });
        setFile(null);
      } else {
        setResult({ success: false, message: data.error || "Failed to import CSV." });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Upload request failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6 p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black text-amber-900">
          <Upload className="w-4 h-4 text-amber-600" />
          <span>[TEMPORARY] Direct CSV First-Timer Importer</span>
        </div>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
          Remove when finished
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <input
          type="file"
          accept=".csv"
          disabled={loading}
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setResult(null);
          }}
          className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer border border-amber-200 rounded-xl p-1 bg-white/80"
        />

        <button
          type="button"
          disabled={!file || loading}
          onClick={handleUpload}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all disabled:opacity-40 active:scale-95 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
            result.success
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-rose-100 text-rose-800 border border-rose-300"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}