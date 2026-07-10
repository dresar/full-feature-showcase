import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Users, Shield, Calendar, Award, Edit2, X, Check } from "lucide-react";

export const Route = createFileRoute("/_admin/users")({
  component: UsersPage,
});

type UserItem = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  subscriptionStatus: "FREE" | "PRO" | string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  _count?: {
    prompts: number;
  };
};

function UsersPage() {
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  // Edit form states
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [subStatus, setSubStatus] = useState<string>("FREE");
  const [expiryDate, setExpiryDate] = useState<string>("");

  // Fetch Users List
  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api<any>("/admin/users");
      return res.data || [];
    },
  });

  // Role Update Mutation
  const updateRoleMut = useMutation({
    mutationFn: (payload: { id: string; role: "USER" | "ADMIN" }) =>
      api(`/admin/users/${payload.id}/role`, {
        method: "PATCH",
        body: { role: payload.role },
      }),
    onSuccess: () => {
      toast.success("Role user berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Subscription Update Mutation
  const updateSubMut = useMutation({
    mutationFn: (payload: { id: string; subscriptionStatus: string; subscriptionExpiresAt: string | null }) =>
      api(`/admin/users/${payload.id}/subscription`, {
        method: "PATCH",
        body: {
          subscriptionStatus: payload.subscriptionStatus,
          subscriptionExpiresAt: payload.subscriptionExpiresAt,
        },
      }),
    onSuccess: () => {
      toast.success("Status langganan user berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEditModal = (u: UserItem) => {
    setSelectedUser(u);
    setRole(u.role);
    setSubStatus(u.subscriptionStatus);
    if (u.subscriptionExpiresAt) {
      setExpiryDate(new Date(u.subscriptionExpiresAt).toISOString().split('T')[0]);
    } else {
      setExpiryDate("");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Save Role
    if (role !== selectedUser.role) {
      updateRoleMut.mutate({ id: selectedUser.id, role });
    }

    // Save Subscription
    const formattedExpiry = expiryDate ? new Date(expiryDate).toISOString() : null;
    updateSubMut.mutate({
      id: selectedUser.id,
      subscriptionStatus: subStatus,
      subscriptionExpiresAt: formattedExpiry,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold uppercase">👥 Kelola Pengguna</h2>
        <p className="text-sm text-muted-foreground font-mono">
          Manajemen role user, masa aktif paket premium, dan lisensi PRO.
        </p>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-4 md:hidden">
        {isLoading && (
          <div className={`${nb.card} p-8 text-center text-muted-foreground`}>
            Memuat…
          </div>
        )}
        {!isLoading && users.length === 0 && (
          <div className={`${nb.card} p-8 text-center text-muted-foreground`}>
            Belum ada pengguna terdaftar.
          </div>
        )}
        {users.map((u) => {
          const isPro = u.subscriptionStatus === "PRO";
          const expiryStr = u.subscriptionExpiresAt
            ? new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID')
            : "Selasanya / Selamanya";
            
          return (
            <div key={u.id} className={`${nb.card} p-4 space-y-3 font-mono text-sm bg-white`}>
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                <span className="font-bold truncate font-sans text-black">{u.email}</span>
                <span className={`nb-border rounded-[var(--radius)] px-2 py-0.5 text-[10px] font-bold border-black ${
                  u.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {u.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1 font-sans">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Paket Langganan:</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${isPro ? "text-green-600" : "text-gray-500"}`}>
                    <Award className="w-3.5 h-3.5" />
                    {u.subscriptionStatus}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block mb-0.5">Prompt Terbuat:</span>
                  <span className="font-bold">{u._count?.prompts || 0} prompt</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-black/10 text-xs font-sans">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Masa Aktif PRO: <strong className="font-mono">{expiryStr}</strong></span>
              </div>

              <div className="border-t-2 border-black/10 pt-2 flex justify-end">
                <button
                  onClick={() => openEditModal(u)}
                  className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-yellow)] text-black px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className={`${nb.card} overflow-hidden hidden md:block bg-white`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--nb-pink)] text-white border-b-[3px] border-black">
              <tr className="text-left uppercase text-xs">
                <th className="px-4 py-3">Email Pengguna</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status Premium</th>
                <th className="px-4 py-3">Masa Aktif Langganan</th>
                <th className="px-4 py-3">Prompt Dibuat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const isPro = u.subscriptionStatus === "PRO";
                const expiryStr = u.subscriptionExpiresAt
                  ? new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID')
                  : "FREE / Unlimited";
                  
                return (
                  <tr key={u.id} className="border-b-2 border-black/10">
                    <td className="px-4 py-3 font-sans font-medium text-black">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`nb-border rounded-[var(--radius)] px-2 py-0.5 text-xs font-bold border-black ${
                        u.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`nb-border rounded-[var(--radius)] px-2 py-0.5 text-xs font-bold border-black ${
                        isPro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{expiryStr}</td>
                    <td className="px-4 py-3 font-bold">{u._count?.prompts || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-yellow)] text-black px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md nb-border nb-shadow-lg rounded-[var(--radius)] bg-white p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
              <h3 className="text-lg font-bold uppercase">Edit Pengguna</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="nb-border rounded-md p-1.5 bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 font-sans text-sm">
              <div className="bg-gray-50 p-2.5 rounded border border-black/10">
                <span className="text-xs text-muted-foreground block">Email User:</span>
                <span className="font-bold text-black text-base">{selectedUser.email}</span>
              </div>

              <div>
                <label className={nb.label}>User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={nb.input}
                >
                  <option value="USER">USER (Akses standar aplikasi)</option>
                  <option value="ADMIN">ADMIN (Akses penuh ke dashboard admin)</option>
                </select>
              </div>

              <div>
                <label className={nb.label}>Paket Langganan</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className={nb.input}
                >
                  <option value="FREE">FREE (Paket Gratis / Standar)</option>
                  <option value="PRO">PRO (Akses Premium)</option>
                </select>
              </div>

              {subStatus === "PRO" && (
                <div>
                  <label className={nb.label}>Masa Expiry PRO</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={nb.input}
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Pilih tanggal berakhirnya paket PRO untuk pengguna ini.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className={`${nb.btn} ${nb.btnGreen} w-full mt-4`}
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
