import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, KeyRound, X } from "lucide-react";

export const Route = createFileRoute("/_admin/keys")({
  component: KeysPage,
});

type GeminiKey = {
  id: string;
  apiKey?: string;
  maskedKey?: string;
  priority: number;
  isActive: boolean;
  status?: "HEALTHY" | "RATE_LIMITED" | "DEAD" | string;
};

function mask(k?: string) {
  if (!k) return "••••••••";
  if (k.length <= 10) return k;
  return `${k.slice(0, 6)}...${k.slice(-4)}`;
}

function statusBadge(s?: string) {
  const map: Record<string, string> = {
    HEALTHY: "bg-[var(--nb-green)] text-white",
    RATE_LIMITED: "bg-[var(--nb-yellow)]",
    DEAD: "bg-red-500 text-white",
  };
  return map[s || ""] || "bg-white";
}

function KeysPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(1);

  const { data = [], isLoading } = useQuery<GeminiKey[]>({
    queryKey: ["admin", "keys"],
    queryFn: async () => {
      const res = await api<any>("/admin/keys");
      return res.data || res.keys || res;
    },
  });

  const createMut = useMutation({
    mutationFn: () =>
      api("/admin/keys", { method: "POST", body: { apiKey, priority } }),
    onSuccess: () => {
      toast.success("Kunci ditambahkan");
      setOpen(false);
      setApiKey("");
      setPriority(1);
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; isActive?: boolean; priority?: number }) =>
      api(`/admin/keys/${payload.id}`, {
        method: "PATCH",
        body: { isActive: payload.isActive, priority: payload.priority },
      }),
    onSuccess: () => {
      toast.success("Kunci diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Kunci dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">🔑 Kunci Gemini</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Kelola pool API key untuk load balancing.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className={`${nb.btn} ${nb.btnPink}`}>
          <Plus className="w-4 h-4" /> Tambah Kunci
        </button>
      </div>

      <div className={`${nb.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--nb-yellow)] border-b-[3px] border-black">
              <tr className="text-left uppercase text-xs">
                <th className="px-4 py-3">API Key</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioritas</th>
                <th className="px-4 py-3">Aktif</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              )}
              {!isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada kunci.
                  </td>
                </tr>
              )}
              {data.map((k) => (
                <tr key={k.id} className="border-b-2 border-black/10">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    {k.maskedKey || mask(k.apiKey)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`${nb.badge} ${statusBadge(k.status)}`}>
                      {k.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={k.priority}
                      className="nb-border rounded-md px-2 py-1 w-20 bg-white"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== k.priority) updateMut.mutate({ id: k.id, priority: v });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateMut.mutate({ id: k.id, isActive: !k.isActive })}
                      className={`${nb.badge} ${k.isActive ? "bg-[var(--nb-green)] text-white" : "bg-white"}`}
                    >
                      {k.isActive ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Hapus kunci ini?")) deleteMut.mutate(k.id);
                      }}
                      className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-red-500 text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Tambah Kunci Gemini">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className={nb.label}>API Key</label>
              <input
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`${nb.input} font-mono`}
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className={nb.label}>Prioritas</label>
              <input
                type="number"
                min={1}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className={nb.input}
              />
            </div>
            <button
              type="submit"
              disabled={createMut.isPending}
              className={`${nb.btn} ${nb.btnGreen} w-full`}
            >
              {createMut.isPending ? "MENYIMPAN…" : "SIMPAN KUNCI"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg nb-border nb-shadow-lg rounded-[var(--radius)] bg-white p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="nb-border nb-shadow-sm rounded-md p-1.5 bg-white"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
