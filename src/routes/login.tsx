import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { api, tokenStore } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Palette, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [{ title: "Login Admin — AI Poster Prompt Studio" }],
  }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<any>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const user = res.user ?? res.data?.user;
      const accessToken = res.access_token ?? res.accessToken ?? res.data?.access_token;
      const refreshToken = res.refresh_token ?? res.refreshToken ?? res.data?.refresh_token ?? "";
      if (!user || !accessToken) throw new Error("Respons login tidak valid");
      if (user.role !== "ADMIN") {
        toast.error("Akses Ditolak: Anda bukan administrator");
        return;
      }
      tokenStore.set(accessToken, refreshToken, user);
      toast.success(`Selamat datang, ${user.email || "Admin"}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--nb-bg)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="nb-border nb-shadow-sm bg-[var(--nb-yellow)] rounded-[var(--radius)] p-3">
            <Palette className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl leading-tight">Admin Portal</h1>
            <p className="text-xs font-mono">AI Poster Prompt Studio</p>
          </div>
        </div>

        <form onSubmit={submit} className={`${nb.card} p-6 space-y-5`}>
          <div>
            <h2 className="text-xl mb-1">Masuk Administrator</h2>
            <p className="text-sm text-muted-foreground">
              Hanya akun dengan role <span className="font-mono font-bold">ADMIN</span> yang diizinkan.
            </p>
          </div>

          <div className="space-y-2">
            <label className={nb.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={nb.input}
              placeholder="admin@domain.com"
            />
          </div>

          <div className="space-y-2">
            <label className={nb.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={nb.input}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${nb.btn} ${nb.btnPink} w-full`}
          >
            <LogIn className="w-5 h-5" />
            {loading ? "MEMPROSES…" : "LOGIN SEKARANG"}
          </button>

          <p className="text-xs text-center font-mono text-muted-foreground">
            1 lisensi = 1 perangkat aktif
          </p>
        </form>
      </div>
    </main>
  );
}
