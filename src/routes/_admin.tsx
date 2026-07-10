import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { tokenStore } from "@/lib/api";
import {
  LayoutDashboard,
  KeyRound,
  Settings,
  Palette,
  Ticket,
  ScrollText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, color: "bg-[var(--nb-yellow)]" },
  { to: "/keys", label: "Kunci Gemini", icon: KeyRound, color: "bg-[var(--nb-blue)] text-white" },
  { to: "/settings", label: "Pengaturan", icon: Settings, color: "bg-white" },
  { to: "/styles", label: "Pustaka Gaya", icon: Palette, color: "bg-[var(--nb-pink)] text-white" },
  { to: "/licenses", label: "Lisensi", icon: Ticket, color: "bg-[var(--nb-green)] text-white" },
  { to: "/logs", label: "Audit Log", icon: ScrollText, color: "bg-black text-white" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = tokenStore.access;
    const u = tokenStore.user;
    if (!t || !u || u.role !== "ADMIN") {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
    setReady(true);
  }, [navigate]);

  useEffect(() => setOpen(false), [location.pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--nb-bg)]">
        <div className="nb-border nb-shadow bg-white rounded-[var(--radius)] px-6 py-4 font-bold uppercase">
          Memeriksa sesi…
        </div>
      </div>
    );
  }

  function logout() {
    tokenStore.clear();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-[var(--nb-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--nb-bg)]/95 backdrop-blur border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="nb-border nb-shadow-sm bg-[var(--nb-yellow)] rounded-[var(--radius)] p-2">
            <Palette className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg leading-tight truncate">Poster Prompt Admin</h1>
            <p className="text-[11px] font-mono truncate text-muted-foreground">
              {user?.email} · <span className="text-black font-bold">ADMIN</span>
            </p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden nb-border nb-shadow-sm rounded-[var(--radius)] bg-white p-2"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={logout}
            className="hidden md:inline-flex nb-border nb-shadow-sm nb-press nb-press-hover items-center gap-2 rounded-[var(--radius)] bg-black text-white px-4 py-2 font-bold uppercase text-sm"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        {/* Tabs */}
        <nav
          className={`${open ? "block" : "hidden"} md:block border-t-[3px] border-black md:border-t-0`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex md:flex-wrap flex-col md:flex-row gap-2 overflow-x-auto">
            {tabs.map((t) => {
              const active = location.pathname === t.to;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={[
                    "nb-border nb-press nb-press-hover rounded-[var(--radius)] px-4 py-2 font-bold uppercase text-sm inline-flex items-center gap-2 whitespace-nowrap",
                    active
                      ? "nb-shadow bg-black text-white"
                      : `nb-shadow-sm ${t.color}`,
                  ].join(" ")}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="md:hidden nb-border nb-shadow-sm nb-press nb-press-hover rounded-[var(--radius)] bg-black text-white px-4 py-2 font-bold uppercase text-sm inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-10 pt-4">
        <p className="text-center text-xs font-mono text-muted-foreground">
          AI Poster Prompt Studio · Admin Console
        </p>
      </footer>
    </div>
  );
}
