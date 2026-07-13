import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Pencil, User } from "lucide-react";

export const Route = createFileRoute("/_admin/characters/$characterId/")({
  component: CharactersDetailPage,
});

function CharactersDetailPage() {
  const { characterId } = Route.useParams();
  const navigate = useNavigate();

  const { data: characters = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin", "characters"],
    queryFn: async () => {
      const r = await api<any>(`/admin/characters`);
      return r.data || r;
    },
  });

  const character = characters.find((c) => c.id === characterId);

  if (isLoading) {
    return <div className="text-center p-10">Memuat...</div>;
  }

  if (!character) {
    return <div className="text-center p-10">Karakter tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/characters" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl">Detail Karakter</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Informasi lengkap tentang karakter
          </p>
        </div>
        <Link
          to="/characters/$characterId/edit"
          params={{ characterId }}
          className={`${nb.btn} ${nb.btnYellow}`}
        >
          <Pencil className="w-4 h-4" /> Edit Karakter
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className={`${nb.card} overflow-hidden`}>
            <div className="aspect-square bg-muted">
              {character.imageUrl ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <User className="w-24 h-24 opacity-20" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className={`${nb.card} p-6 space-y-4`}>
            <div>
              <h3 className="text-3xl font-bold">{character.name}</h3>
              <div className="mt-2 inline-block bg-black text-white font-mono uppercase px-3 py-1 rounded text-xs">
                {character.category}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase mb-1">Deskripsi Singkat</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded nb-border">
                {character.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase mb-1">Prompt Konsistensi</h4>
              <p className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded nb-border whitespace-pre-wrap">
                {character.promptConsistency}
              </p>
            </div>

            <div className="pt-4 border-t-2 border-black/10">
              <p className="text-xs font-mono text-muted-foreground">
                ID: {character.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
