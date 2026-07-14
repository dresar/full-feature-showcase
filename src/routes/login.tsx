import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { api, tokenStore } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Palette, LogIn } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [{ title: "Masuk — Studio Prompt" }],
  }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
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
      const accessToken  = res.access_token  ?? res.accessToken  ?? res.data?.access_token  ?? res.data?.accessToken;
      const refreshToken = res.refresh_token ?? res.refreshToken ?? res.data?.refresh_token ?? res.data?.refreshToken ?? "";
      if (!user || !accessToken) throw new Error("Respons tidak valid");

      if (user.role !== "ADMIN") {
        throw new Error("Akses ditolak: Hanya Admin yang dapat masuk ke console ini.");
      }

      tokenStore.set(accessToken, refreshToken, user);
      toast.success(`Selamat datang, ${user.email}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--nb-bg)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`${nb.card} bg-[var(--nb-yellow)] p-3`}>
            <Palette className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight">POSTER STUDIO</h1>
            <p className="text-xs font-mono text-muted-foreground">Console Panel Admin</p>
          </div>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-5">
          <span className="text-8xl select-none animate-bounce">🤖</span>
        </div>

        {/* Form Card */}
        <form onSubmit={submit} className={`${nb.card} p-6 space-y-5`}>
          <div>
            <h2 className="text-xl font-black mb-1">
              Masuk Admin Console
            </h2>
            <p className="text-sm text-muted-foreground">
              Masukkan email & password akun Admin Anda
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
              placeholder="admin@email.com"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className={nb.label}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={nb.input}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${nb.btn} ${nb.btnPink} w-full`}
          >
            <LogIn className="w-5 h-5" />
            {loading ? "MEMPROSES…" : "MASUK SEKARANG"}
          </button>

          <p className="text-xs text-center font-mono text-muted-foreground">
            Akses dibatasi khusus untuk Administrator.
          </p>
        </form>
      </div>
    </main>
  );
}
