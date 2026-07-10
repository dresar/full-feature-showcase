import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_admin/logs")({
  component: LogsPage,
});

type LogItem = {
  id: string;
  action: string;
  userEmail?: string;
  createdAt?: string;
  timestamp?: string;
  details?: string;
};

const PAGE_SIZE = 15;

function LogsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data = [], isLoading } = useQuery<LogItem[]>({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const r = await api<any>("/admin/logs");
      const items = r.data || r.logs || r || [];
      return items.map((item: any) => {
        let detailsStr = "—";
        if (item.detail) {
          if (typeof item.detail === "string") {
            detailsStr = item.detail;
          } else {
            detailsStr = Object.entries(item.detail)
              .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
              .join(", ");
          }
        }
        return {
          ...item,
          userEmail: item.user?.email || item.userEmail || "—",
          details: detailsStr,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return data;
    return data.filter(
      (l) =>
        l.action?.toLowerCase().includes(t) ||
        l.userEmail?.toLowerCase().includes(t) ||
        l.details?.toLowerCase().includes(t),
    );
  }, [data, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">📜 Audit Log</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Lini masa aktivitas sistem.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari action, user, detail…"
            className={`${nb.input} pl-10`}
          />
        </div>
      </div>

      <div className={`${nb.card} overflow-hidden`}>
        {/* Mobile Card List */}
        <div className="space-y-4 md:hidden p-4 bg-[var(--nb-bg)]/50">
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Memuat…
            </div>
          )}
          {!isLoading && slice.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Tidak ada log.
            </div>
          )}
          {slice.map((l) => {
            const ts = l.createdAt || l.timestamp;
            return (
              <div key={l.id} className={`${nb.card} p-4 space-y-2.5 bg-white`}>
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className={`${nb.badge} bg-[var(--nb-yellow)] text-xs`}>{l.action}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {ts ? new Date(ts).toLocaleString("id-ID") : "—"}
                  </span>
                </div>
                <div className="text-xs space-y-1 font-mono">
                  <div>
                    <span className="text-muted-foreground font-sans">User:</span> {l.userEmail || "—"}
                  </div>
                  <div className="bg-muted p-2 rounded-md border border-black/10 break-all whitespace-pre-wrap mt-1">
                    {l.details || "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-[var(--nb-blue)] text-white border-b-[3px] border-black">
              <tr className="text-left uppercase text-xs">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              )}
              {!isLoading && slice.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada log.
                  </td>
                </tr>
              )}
              {slice.map((l) => {
                const ts = l.createdAt || l.timestamp;
                return (
                  <tr key={l.id} className="border-b-2 border-black/10 align-top">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ts ? new Date(ts).toLocaleString("id-ID") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${nb.badge} bg-[var(--nb-yellow)]`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-3">{l.userEmail || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-md break-words">
                      {l.details || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t-[3px] border-black bg-muted">
          <p className="text-xs font-mono">
            Halaman {currentPage} / {totalPages} · {filtered.length} entri
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={`${nb.btn} ${nb.btnWhite} !py-2 !px-3`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`${nb.btn} ${nb.btnBlack} !py-2 !px-3`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
