import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";

export const Route = createFileRoute("/_admin/styles/")({
  component: StylesIndexPage,
});

type Style = {
  id: string;
  name: string;
  promptTemplate: string;
  previewImageUrl?: string;
};

function StylesIndexPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<Style[]>({
    queryKey: ["admin", "styles"],
    queryFn: async () => {
      const r = await api<any>("/admin/visual-styles");
      return r.data || r.styles || r;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/visual-styles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Gaya dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "styles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">🎨 Pustaka Gaya Visual</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Katalog template prompt gaya visual.
          </p>
        </div>
        <Link to="/styles/new" className={`${nb.btn} ${nb.btnPink}`}>
          <Plus className="w-4 h-4" /> Tambah Gaya
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className={`${nb.card} p-6 text-center col-span-full text-muted-foreground`}>
            Memuat…
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className={`${nb.card} p-6 text-center col-span-full text-muted-foreground`}>
            Belum ada gaya.
          </div>
        )}
        {data.map((s) => (
          <div key={s.id} className={`${nb.card} overflow-hidden flex flex-col`}>
            <div className="aspect-video bg-muted border-b-[3px] border-black overflow-hidden relative group cursor-pointer">
              <Link to="/styles/$styleId" params={{ styleId: s.id }} className="absolute inset-0 z-10" />
              {s.previewImageUrl ? (
                <img src={s.previewImageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-mono group-hover:scale-105 transition-transform">
                  Tanpa preview
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <Link to="/styles/$styleId" params={{ styleId: s.id }} className="hover:underline">
                <h4 className="text-lg mb-1">{s.name}</h4>
              </Link>
              <p className="text-xs font-mono text-muted-foreground line-clamp-3 flex-1">
                {s.promptTemplate}
              </p>
              <div className="flex gap-2 mt-3">
                <Link
                  to="/styles/$styleId" params={{ styleId: s.id }}
                  className={`${nb.btn} ${nb.btnBlue} !py-2 !px-3 !text-xs flex-1 text-center justify-center`}
                >
                  <Eye className="w-3.5 h-3.5" /> Detail
                </Link>
                <Link
                  to="/styles/$styleId/edit" params={{ styleId: s.id }}
                  className={`${nb.btn} ${nb.btnYellow} !py-2 !px-3 !text-xs flex-1 text-center justify-center`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button
                  onClick={() => confirm("Hapus gaya?") && deleteMut.mutate(s.id)}
                  className={`${nb.btn} bg-red-500 text-white !py-2 !px-3 !text-xs z-20`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
