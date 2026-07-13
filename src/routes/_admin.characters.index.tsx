import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, Pencil, User, Eye } from "lucide-react";

export const Route = createFileRoute("/_admin/characters/")({
  component: CharactersIndexPage,
});

type Character = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  promptConsistency: string;
  category: string;
  isActive: boolean;
};

function CharactersIndexPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery<Character[]>({
    queryKey: ["admin", "characters"],
    queryFn: async () => {
      const r = await api<any>("/admin/characters");
      return r.data || r;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/characters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Karakter dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "characters"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">🎭 Pustaka Karakter</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Kelola persona / maskot yang bisa dipakai di prompt generation.
          </p>
        </div>
        <Link to="/characters/new" className={`${nb.btn} ${nb.btnPink}`}>
          <Plus className="w-4 h-4" /> Tambah Karakter
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
            Belum ada karakter. Klik "Tambah Karakter" untuk mulai.
          </div>
        )}
        {data.map((c) => (
          <div key={c.id} className={`${nb.card} overflow-hidden flex flex-col`}>
            <div className="aspect-square bg-muted border-b-[3px] border-black overflow-hidden relative group cursor-pointer">
              <Link to="/characters/$characterId" params={{ characterId: c.id }} className="absolute inset-0 z-10" />
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform">
                  <User className="w-16 h-16 opacity-20" />
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Link to="/characters/$characterId" params={{ characterId: c.id }} className="hover:underline">
                  <h4 className="text-lg font-bold">{c.name}</h4>
                </Link>
                <span className="text-[9px] bg-black text-white font-mono uppercase px-2 py-0.5 rounded">
                  {c.category}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground line-clamp-2 flex-1 mb-2">
                {c.description}
              </p>
              <div className="flex gap-2">
                <Link
                  to="/characters/$characterId" params={{ characterId: c.id }}
                  className={`${nb.btn} ${nb.btnBlue} !py-2 !px-3 !text-xs flex-1 text-center justify-center`}
                >
                  <Eye className="w-3.5 h-3.5" /> Detail
                </Link>
                <Link
                  to="/characters/$characterId/edit" params={{ characterId: c.id }}
                  className={`${nb.btn} ${nb.btnYellow} !py-2 !px-3 !text-xs flex-1 text-center justify-center`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button
                  onClick={() => confirm("Hapus karakter ini?") && deleteMut.mutate(c.id)}
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
