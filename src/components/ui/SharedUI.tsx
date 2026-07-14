import { useState, useEffect, type ReactNode } from "react";
import { X, Copy, Check } from "lucide-react";
import { nb } from "@/lib/nb";
import { toast } from "sonner";

/* ─── Modal ─── */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
};

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`${nb.card} w-full ${maxWidth} mx-4 bg-white animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b-2 border-black/10 px-5 py-4">
            <h3 className="font-bold uppercase text-sm">{title}</h3>
            <button onClick={onClose} className="nb-border bg-white text-black p-1.5 rounded-[var(--radius)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Loading Overlay ─── */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
      <div className={`${nb.card} p-8 flex flex-col items-center gap-5 mx-4 bg-white`}>
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--nb-pink)] rounded-full animate-spin" />
        <div className="text-center">
          <p className="font-black uppercase tracking-wide text-base">COMPILING DSL…</p>
          {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Result Sheet ─── */
export function ResultSheet({
  open,
  onClose,
  prompt,
  viralBreakdown,
}: {
  open: boolean;
  onClose: () => void;
  prompt: string;
  viralBreakdown?: Record<string, any>;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`${nb.card} w-full max-w-2xl mx-4 mb-4 max-h-[90vh] flex flex-col bg-white animate-slide-up rounded-b-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black/10 px-5 py-4 bg-[var(--nb-yellow)] rounded-t-[10px]">
          <h3 className="font-black uppercase text-sm">⚡ Prompt Siap Digunakan!</h3>
          <button onClick={onClose} className="nb-border bg-white text-black p-1.5 rounded-[var(--radius)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Text */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="nb-border p-4 bg-gray-50 rounded-[var(--radius)] mb-4">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{prompt}</pre>
          </div>

          {viralBreakdown && (
            <div className="mt-4">
              <p className="nb-label mb-2">📊 Skor Viral</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(viralBreakdown).map(([k, v]) => (
                  <div key={k} className="nb-border p-3 text-sm bg-white rounded-[var(--radius)]">
                    <p className="text-gray-500 text-xs font-mono capitalize">{k.replace(/_/g, " ")}</p>
                    <p className="font-black text-lg">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t-2 border-black/10 flex gap-3 bg-white">
          <button
            onClick={copy}
            className={`flex-1 nb-border ${copied ? "bg-[var(--nb-green)] text-white" : "bg-black text-white"} nb-shadow-sm nb-press nb-press-hover py-2.5 font-bold uppercase text-xs flex items-center justify-center gap-2 rounded-[var(--radius)]`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Tersalin!" : "Salin Prompt"}
          </button>
          <button
            onClick={onClose}
            className="nb-border bg-white text-black nb-shadow-sm nb-press nb-press-hover py-2.5 px-6 font-bold uppercase text-xs rounded-[var(--radius)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
