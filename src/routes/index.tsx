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
    if (t && u?.role === "ADMIN") {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--nb-bg)]">
      <div className="nb-border nb-shadow bg-white rounded-[var(--radius)] px-8 py-6 font-bold uppercase">
        Memuat…
      </div>
    </div>
  );
}
