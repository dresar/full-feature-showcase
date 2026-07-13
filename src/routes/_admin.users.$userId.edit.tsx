import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/users/$userId/edit")({
  component: UsersEditPage,
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

function UsersEditPage() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [subStatus, setSubStatus] = useState<string>("FREE");
  const [expiryDate, setExpiryDate] = useState<string>("");

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api<any>("/admin/users");
      return res.data || [];
    },
  });

  const selectedUser = users.find((u) => u.id === userId);

  useEffect(() => {
    if (selectedUser) {
      setRole(selectedUser.role);
      setSubStatus(selectedUser.subscriptionStatus);
      if (selectedUser.subscriptionExpiresAt) {
        setExpiryDate(new Date(selectedUser.subscriptionExpiresAt).toISOString().split('T')[0]);
      } else {
        setExpiryDate("");
      }
    }
  }, [selectedUser]);

  const updateRoleMut = useMutation({
    mutationFn: (payload: { id: string; role: "USER" | "ADMIN" }) =>
      api(`/admin/users/${payload.id}/role`, {
        method: "PATCH",
        body: { role: payload.role },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

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
      toast.success("Data pengguna berhasil diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      navigate({ to: "/users" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      if (role !== selectedUser.role) {
        await updateRoleMut.mutateAsync({ id: selectedUser.id, role });
      }

      const formattedExpiry = expiryDate ? new Date(expiryDate).toISOString() : null;
      await updateSubMut.mutateAsync({
        id: selectedUser.id,
        subscriptionStatus: subStatus,
        subscriptionExpiresAt: formattedExpiry,
      });
    } catch (e: any) {
      // errors handled in mutations
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Memuat...</div>;
  }

  if (!selectedUser) {
    return <div className="text-center p-10">Pengguna tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/users" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl">Edit Pengguna</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Ubah role dan paket langganan
          </p>
        </div>
      </div>

      <div className={`${nb.card} p-6`}>
        <form onSubmit={handleSave} className="space-y-4 font-sans text-sm">
          <div className="bg-gray-50 p-3 rounded border border-black/10">
            <span className="text-xs text-muted-foreground block mb-1">Email User:</span>
            <span className="font-bold text-black text-lg">{selectedUser.email}</span>
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
            disabled={updateSubMut.isPending || updateRoleMut.isPending}
            className={`${nb.btn} ${nb.btnGreen} w-full mt-4`}
          >
            {(updateSubMut.isPending || updateRoleMut.isPending) ? "MENYIMPAN…" : "SIMPAN PERUBAHAN"}
          </button>
        </form>
      </div>
    </div>
  );
}
