import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Pencil } from "lucide-react";

export const Route = createFileRoute("/_admin/styles/$styleId/")({
  component: StylesDetailPage,
});

function StylesDetailPage() {
  const { styleId } = Route.useParams();
  const navigate = useNavigate();

  const { data: styles = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin", "styles"],
    queryFn: async () => {
      const r = await api<any>(`/admin/visual-styles`);
      return r.data || r.styles || r;
    },
  });

  const styleData = styles.find((s) => s.id === styleId);

  if (isLoading) {
    return <div className="text-center p-10">Memuat...</div>;
  }

  if (!styleData) {
    return <div className="text-center p-10">Gaya visual tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/styles" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl">Detail Gaya Visual</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Informasi lengkap tentang gaya visual
          </p>
        </div>
        <Link
          to="/styles/$styleId/edit"
          params={{ styleId }}
          className={`${nb.btn} ${nb.btnYellow}`}
        >
          <Pencil className="w-4 h-4" /> Edit Gaya
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className={`${nb.card} overflow-hidden`}>
            <div className="aspect-video bg-muted border-b-2 border-black/10">
              {styleData.previewImageUrl ? (
                <img
                  src={styleData.previewImageUrl}
                  alt={styleData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                  Tanpa preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${nb.card} p-6 space-y-4`}>
            <div>
              <h3 className="text-3xl font-bold">{styleData.name}</h3>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase mb-1">Prompt Template</h4>
              <p className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded nb-border whitespace-pre-wrap">
                {styleData.promptTemplate}
              </p>
            </div>

            <div className="pt-4 border-t-2 border-black/10">
              <p className="text-xs font-mono text-muted-foreground">
                ID: {styleData.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
