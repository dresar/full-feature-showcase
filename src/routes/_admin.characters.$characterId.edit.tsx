import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Upload, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/characters/$characterId/edit")({
  component: CharactersEditPage,
});

function CharactersEditPage() {
  const { characterId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    promptConsistency: "",
    category: "general",
    isActive: true,
  });

  const { data: characters = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin", "characters"],
    queryFn: async () => {
      const r = await api<any>(`/admin/characters`);
      return r.data || r;
    },
  });

  const character = characters.find((c) => c.id === characterId);

  useEffect(() => {
    if (character) {
      setForm({
        name: character.name || "",
        description: character.description || "",
        imageUrl: character.imageUrl || "",
        promptConsistency: character.promptConsistency || "",
        category: character.category || "general",
        isActive: character.isActive ?? true,
      });
    }
  }, [character]);

  const categories = ["general", "human", "animal", "fantasy", "mascot", "robot"];

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        promptConsistency: form.promptConsistency,
        category: form.category,
      };
      return api(`/admin/characters/${characterId}`, { method: "PATCH", body });
    },
    onSuccess: () => {
      toast.success("Karakter diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "characters"] });
      qc.invalidateQueries({ queryKey: ["admin", "characters", characterId] });
      navigate({ to: "/characters" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await api<any>("/poster/upload", {
        method: "POST",
        body: { file: base64, filename: file.name },
      });
      const url = res.url || res.data?.url;
      if (!url) throw new Error("Upload gagal: URL kosong");
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Gambar terupload");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return <div className="text-center p-10">Memuat...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/characters" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl">Edit Karakter</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Ubah detail karakter {character?.name}
          </p>
        </div>
      </div>

      <div className={`${nb.card} p-6`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className={nb.label}>Nama Karakter</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={nb.input}
              placeholder="mis: Gadis Hijab Ceria, Robot AI Helper"
            />
          </div>
          <div>
            <label className={nb.label}>Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={nb.input}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={nb.label}>Deskripsi</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${nb.input} text-sm`}
              placeholder="Deskripsi singkat karakter — siapa dia, tampilan fisik, kepribadian"
            />
          </div>
          <div>
            <label className={nb.label}>Prompt Konsistensi (Detail Prompt untuk AI)</label>
            <textarea
              required
              rows={8}
              value={form.promptConsistency}
              onChange={(e) => setForm({ ...form, promptConsistency: e.target.value })}
              className={`${nb.input} font-mono text-xs`}
              placeholder="Prompt detail untuk menjaga konsistensi karakter di setiap generate..."
            />
          </div>
          <div>
            <label className={nb.label}>Gambar Karakter</label>
            <div className="nb-border rounded-[var(--radius)] bg-muted p-3 space-y-2">
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="w-full max-w-[200px] aspect-square object-cover nb-border rounded-md"
                />
              )}
              <label className={`${nb.btn} ${nb.btnBlack} w-full cursor-pointer`}>
                <Upload className="w-4 h-4" />
                {uploading ? "MENGUPLOAD…" : "PILIH GAMBAR KARAKTER"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={saveMut.isPending}
            className={`${nb.btn} ${nb.btnGreen} w-full mt-4`}
          >
            {saveMut.isPending ? "MENYIMPAN…" : "SIMPAN PERUBAHAN"}
          </button>
        </form>
      </div>
    </div>
  );
}
