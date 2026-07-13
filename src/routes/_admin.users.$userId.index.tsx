import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Pencil, Award, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_admin/users/$userId/")({
  component: UsersDetailPage,
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

function UsersDetailPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const { data: users = [], isLoading } = useQuery<UserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api<any>("/admin/users");
      return res.data || [];
    },
  });

  const userData = users.find((u) => u.id === userId);

  if (isLoading) {
    return <div className="text-center p-10">Memuat...</div>;
  }

  if (!userData) {
    return <div className="text-center p-10">Pengguna tidak ditemukan.</div>;
  }

  const isPro = userData.subscriptionStatus === "PRO";
  const expiryStr = userData.subscriptionExpiresAt
    ? new Date(userData.subscriptionExpiresAt).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : "Selamanya";
  const createdStr = new Date(userData.createdAt).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/users" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl">Detail Pengguna</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Informasi lengkap tentang status dan aktivitas pengguna
          </p>
        </div>
        <Link
          to="/users/$userId/edit"
          params={{ userId }}
          className={`${nb.btn} ${nb.btnYellow}`}
        >
          <Pencil className="w-4 h-4" /> Edit Pengguna
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className={`${nb.card} p-6 space-y-6 bg-white`}>
            <div>
              <h3 className="text-sm text-muted-foreground font-mono uppercase mb-1">Informasi Akun</h3>
              <p className="text-2xl font-bold font-sans break-all">{userData.email}</p>
              <div className="mt-2 flex gap-2">
                <span className={`nb-border rounded-[var(--radius)] px-3 py-1 text-xs font-bold border-black ${
                  userData.role === 'ADMIN' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  Role: {userData.role}
                </span>
                <span className="nb-border rounded-[var(--radius)] px-3 py-1 text-xs border-black bg-gray-50 text-gray-600 font-mono">
                  Join: {createdStr}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t-2 border-black/10">
              <p className="text-xs font-mono text-muted-foreground">
                User ID: {userData.id}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${nb.card} p-6 space-y-5 ${isPro ? 'bg-[var(--nb-pink)] text-white border-[var(--nb-pink)]' : 'bg-white'}`}>
            <h3 className={`text-sm font-mono uppercase mb-1 ${isPro ? 'text-pink-100' : 'text-muted-foreground'}`}>
              Status Langganan
            </h3>
            
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full border-2 border-black ${isPro ? 'bg-[var(--nb-yellow)] text-black' : 'bg-gray-100 text-gray-500'}`}>
                <Award className="w-8 h-8" />
              </div>
              <div>
                <p className="text-3xl font-bold font-sans">{userData.subscriptionStatus}</p>
                <p className={`text-xs font-mono mt-1 ${isPro ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {isPro ? "Akses premium aktif" : "Akses gratis terbatas"}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-md border-2 border-black ${isPro ? 'bg-white text-black' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase text-muted-foreground">Masa Aktif</span>
              </div>
              <p className="font-mono text-sm font-bold">{expiryStr}</p>
            </div>
          </div>

          <div className={`${nb.card} p-6 bg-[var(--nb-blue)] text-white`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full border-2 border-black bg-white text-[var(--nb-blue)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-mono uppercase mb-1 text-blue-100">Aktivitas</h3>
                <p className="text-3xl font-bold font-sans">{userData._count?.prompts || 0}</p>
                <p className="text-xs font-mono text-blue-100 mt-1">Prompt Berhasil Dibuat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
