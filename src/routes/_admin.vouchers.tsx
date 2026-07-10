import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Sparkles, Trash2, Copy, Check, Send } from "lucide-react";

export const Route = createFileRoute("/_admin/vouchers")({
  component: VouchersPage,
});

type Voucher = {
  id: string;
  key: string;
  days: number;
  credits: number;
  isUsed?: boolean;
  usedBy?: string | null;
  usedAt?: string | null;
  createdAt?: string;
};

function VouchersPage() {
  const qc = useQueryClient();
  const [count, setCount] = useState(10);
  const [credits, setCredits] = useState(300);
  const [copied, setCopied] = useState<string | null>(null);

  // Direct Transfer Fields
  const [transferEmail, setTransferEmail] = useState("");
  const [transferCredits, setTransferCredits] = useState(500);

  const { data = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ["admin", "vouchers"],
    queryFn: async () => {
      const r = await api<any>("/admin/licenses");
      return r.data || r.licenses || r;
    },
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api<any>("/admin/users");
      return res.data || [];
    },
  });

  const genMut = useMutation({
    mutationFn: () => api("/admin/licenses", { method: "POST", body: { count, credits } }),
    onSuccess: () => {
      toast.success(`${count} Voucher Key berhasil digenerate`);
      qc.invalidateQueries({ queryKey: ["admin", "vouchers"] });
    },
    onError: (e: any) => toast.error(e.message || "Gagal generate voucher"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api(`/admin/licenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Voucher dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "vouchers"] });
    },
    onError: (e: any) => toast.error(e.message || "Gagal menghapus voucher"),
  });

  const transferMut = useMutation({
    mutationFn: () => api("/admin/credits/transfer", {
      method: "POST",
      body: { email: transferEmail, credits: transferCredits },
    }),
    onSuccess: (res: any) => {
      toast.success(res.message || "Kredit berhasil ditransfer!");
      setTransferEmail("");
      // Invalidate users statistics queries if any
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: any) => toast.error(e.message || "Gagal mentransfer kredit"),
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">🎫 Voucher & Pengiriman Kredit</h2>
        <p className="text-sm text-muted-foreground font-mono">
          Kelola voucher kupon kredit dan kirim token langsung ke email terdaftar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Panel 1: Voucher Key Generator */}
        <div className={`${nb.card} p-5 bg-[var(--nb-yellow)] space-y-4`}>
          <h3 className="text-lg font-bold">Generator Voucher Kredit</h3>
          <p className="text-xs text-black/75">
            Buat voucher key baru yang bisa dicopy-paste oleh pengguna untuk menambah saldo kredit token mereka secara mandiri.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={nb.label}>Jumlah Voucher</label>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className={nb.input}
              />
            </div>
            <div>
              <label className={nb.label}>Kredit per Voucher</label>
              <input
                type="number"
                min={10}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className={nb.input}
              />
            </div>
          </div>
          <button
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
            className={`${nb.btn} ${nb.btnPink} w-full mt-2`}
          >
            <Sparkles className="w-4 h-4" />
            {genMut.isPending ? "GENERATING…" : "GENERATE VOUCHERS"}
          </button>
        </div>

        {/* Panel 2: Direct Credit Transfer */}
        <div className={`${nb.card} p-5 bg-white space-y-4`}>
          <h3 className="text-lg font-bold">Kirim Kredit Langsung ke User</h3>
          <p className="text-xs text-muted-foreground">
            Beli manual? Tambahkan saldo kredit/token instan langsung ke email pengguna yang terdaftar tanpa perlu voucher key.
          </p>
          <div className="space-y-3">
            <div>
              <label className={nb.label}>Email Pengguna</label>
              <select
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                className={nb.input}
              >
                <option value="">-- Pilih Email Pengguna --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.email}>
                    {u.email} ({u.subscriptionStatus})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={nb.label}>Jumlah Kredit/Token</label>
              <input
                type="number"
                min={1}
                value={transferCredits}
                onChange={(e) => setTransferCredits(Number(e.target.value))}
                className={nb.input}
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (!transferEmail) {
                toast.error("Email tujuan wajib diisi");
                return;
              }
              transferMut.mutate();
            }}
            disabled={transferMut.isPending}
            className={`${nb.btn} ${nb.btnBlue} w-full mt-2`}
          >
            <Send className="w-4 h-4" />
            {transferMut.isPending ? "MENGIRIM…" : "KIRIM KREDIT SEKARANG"}
          </button>
        </div>
      </div>

      {/* List of Vouchers */}
      <div className={`${nb.card} p-5 bg-white`}>
        <h3 className="text-lg mb-3">Daftar Voucher Kupon</h3>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="p-3 bg-gray-50">VOUCHER KEY</th>
                <th className="p-3 bg-gray-50">SALDO TOKEN</th>
                <th className="p-3 bg-gray-50">STATUS</th>
                <th className="p-3 bg-gray-50">DIGUNAKAN OLEH</th>
                <th className="p-3 bg-gray-50">DIBUAT PADA</th>
                <th className="p-3 bg-gray-50 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Memuat data kupon…
                  </td>
                </tr>
              )}
              {!isLoading && data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Belum ada voucher kupon yang digenerate.
                  </td>
                </tr>
              )}
              {data.map((l) => {
                const used = l.isUsed ?? !!l.usedBy;
                return (
                  <tr key={l.id} className="border-b border-black/10 hover:bg-gray-50/50">
                    <td className="p-3 font-bold">
                      <button
                        onClick={() => copy(l.key)}
                        className="inline-flex items-center gap-1.5 hover:underline"
                        title="Salin"
                      >
                        {copied === l.key ? (
                          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                        {l.key}
                      </button>
                    </td>
                    <td className="p-3 font-bold text-sm">🪙 {l.credits} Token</td>
                    <td className="p-3">
                      <span
                        className={`${nb.badge} ${used ? "bg-[var(--nb-pink)] text-white" : "bg-[var(--nb-green)] text-white"} text-[10px]`}
                      >
                        {used ? "USED" : "AVAILABLE"}
                      </span>
                    </td>
                    <td className="p-3 max-w-[150px] truncate">{l.usedBy || "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString("id-ID") : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm("Hapus voucher ini?")) delMut.mutate(l.id);
                        }}
                        className="p-1.5 border-2 border-black rounded-[var(--radius)] hover:bg-[var(--nb-pink)] hover:text-white transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="space-y-4 md:hidden">
          {isLoading && (
            <div className="p-8 text-center text-muted-foreground">Memuat…</div>
          )}
          {!isLoading && data.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Belum ada kupon.</div>
          )}
          {data.map((l) => {
            const used = l.isUsed ?? !!l.usedBy;
            return (
              <div key={l.id} className="border-2 border-black rounded-[var(--radius)] p-4 space-y-2 font-mono text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                <div className="flex items-center justify-between border-b pb-2">
                  <button
                    onClick={() => copy(l.key)}
                    className="font-bold inline-flex items-center gap-1 hover:underline truncate"
                  >
                    {copied === l.key ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{l.key}</span>
                  </button>
                  <span className={`${nb.badge} ${used ? "bg-[var(--nb-pink)] text-white" : "bg-[var(--nb-green)] text-white"} text-[10px]`}>
                    {used ? "USED" : "AVAILABLE"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Kredit:</span>
                    <span className="font-bold">🪙 {l.credits} Token</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block mb-0.5">User:</span>
                    <span className="truncate block font-semibold">{l.usedBy || "—"}</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t mt-2">
                  <button
                    onClick={() => {
                      if (confirm("Hapus voucher ini?")) delMut.mutate(l.id);
                    }}
                    className="p-1 border-2 border-black rounded-[var(--radius)] hover:bg-[var(--nb-pink)] text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
