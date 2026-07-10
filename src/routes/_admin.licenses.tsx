import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Sparkles, Trash2, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_admin/licenses")({
  component: LicensesPage,
});

type License = {
  id: string;
  key: string;
  days: number;
  used?: boolean;
  isUsed?: boolean;
  userEmail?: string | null;
  activatedAt?: string | null;
  createdAt?: string;
};

function LicensesPage() {
  const qc = useQueryClient();
  const [count, setCount] = useState(10);
  const [days, setDays] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery<License[]>({
    queryKey: ["admin", "licenses"],
    queryFn: async () => {
      const r = await api<any>("/admin/licenses");
      return r.data || r.licenses || r;
    },
  });

  const genMut = useMutation({
    mutationFn: () => api("/admin/licenses", { method: "POST", body: { count, days } }),
    onSuccess: () => {
      toast.success(`${count} lisensi digenerate`);
      qc.invalidateQueries({ queryKey: ["admin", "licenses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api(`/admin/licenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Lisensi dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "licenses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl">🎫 Lisensi & Paket</h2>
        <p className="text-sm text-muted-foreground font-mono">
          Generate & kelola license key.
        </p>
      </div>

      <div className={`${nb.card} p-5 bg-[var(--nb-yellow)]`}>
        <h3 className="text-lg mb-3">Generator Lisensi</h3>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className={nb.label}>Jumlah</label>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={nb.input}
            />
          </div>
          <div>
            <label className={nb.label}>Durasi (hari)</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={nb.input}
            />
          </div>
          <button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className={`${nb.btn} ${nb.btnPink}`}
          >
            <Sparkles className="w-4 h-4" />
            {genMut.isPending ? "GENERATE…" : "GENERATE KEYS"}
          </button>
        </div>
      </div>

      <div className={`${nb.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black text-white border-b-[3px] border-black">
              <tr className="text-left uppercase text-xs">
                <th className="px-4 py-3">License Key</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">User</th>
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
                    Belum ada lisensi.
                  </td>
                </tr>
              )}
              {data.map((l) => {
                const used = l.used ?? l.isUsed ?? !!l.userEmail;
                return (
                  <tr key={l.id} className="border-b-2 border-black/10">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copy(l.key)}
                        className="inline-flex items-center gap-2 hover:underline"
                        title="Salin"
                      >
                        {copied === l.key ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {l.key}
                      </button>
                    </td>
                    <td className="px-4 py-3">{l.days} hari</td>
                    <td className="px-4 py-3">
                      <span
                        className={`${nb.badge} ${used ? "bg-[var(--nb-pink)] text-white" : "bg-[var(--nb-green)] text-white"}`}
                      >
                        {used ? "USED" : "AVAILABLE"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{l.userEmail || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => confirm("Hapus lisensi?") && delMut.mutate(l.id)}
                        className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-red-500 text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
