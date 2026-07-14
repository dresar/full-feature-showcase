import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, tokenStore } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Users, Calendar, Award, Edit2, Eye } from "lucide-react";

export const Route = createFileRoute("/_admin/users/")({
  component: UsersIndexPage,
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

function UsersIndexPage() {
  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api<any>("/admin/users");
      return res.data || [];
    },
    enabled: tokenStore.user?.role === "ADMIN",
  });

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
            : "FREE / Selamanya";
            
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
                <span>Masa Aktif: <strong className="font-mono">{expiryStr}</strong></span>
              </div>

              <div className="border-t-2 border-black/10 pt-2 flex justify-end gap-2">
                <Link
                  to="/users/$userId" params={{ userId: u.id }}
                  className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-blue)] text-white px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase"
                >
                  <Eye className="w-3.5 h-3.5" /> Detail
                </Link>
                <Link
                  to="/users/$userId/edit" params={{ userId: u.id }}
                  className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-yellow)] text-black px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Link>
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
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/users/$userId" params={{ userId: u.id }}
                          className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-blue)] text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </Link>
                        <Link
                          to="/users/$userId/edit" params={{ userId: u.id }}
                          className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-yellow)] text-black px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Link>
                      </div>
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
