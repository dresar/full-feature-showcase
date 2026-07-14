import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { tokenStore } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = tokenStore.access;
    const u = tokenStore.user;
    if (t && u && u.role === "ADMIN") {
      navigate({ to: "/dashboard" });
    } else {
      if (t) tokenStore.clear();
      navigate({ to: "/login" });
    }
  }, [navigate]);

  return (
    <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-[var(--nb-bg)]">
      <div suppressHydrationWarning className="nb-border nb-shadow bg-white rounded-[var(--radius)] px-8 py-6 font-bold uppercase">
        Memuat…
      </div>
    </div>
  );
}
