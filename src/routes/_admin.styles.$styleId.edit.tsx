import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Upload, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_admin/styles/$styleId/edit")({
  component: StylesEditPage,
});

function StylesEditPage() {
  const { styleId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    promptTemplate: "",
    previewImageUrl: "",
  });

  const { data: styles = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin", "styles"],
    queryFn: async () => {
      const r = await api<any>(`/admin/visual-styles`);
      return r.data || r.styles || r;
    },
  });

  const styleData = styles.find((s) => s.id === styleId);

  useEffect(() => {
    if (styleData) {
      setForm({
        name: styleData.name || "",
        promptTemplate: styleData.promptTemplate || "",
        previewImageUrl: styleData.previewImageUrl || "",
      });
    }
  }, [styleData]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        promptTemplate: form.promptTemplate,
        previewImageUrl: form.previewImageUrl,
      };
      return api(`/admin/visual-styles/${styleId}`, { method: "PATCH", body });
    },
    onSuccess: () => {
      toast.success("Gaya diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "styles"] });
      navigate({ to: "/styles" });
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
        body: { image: base64, fileName: file.name },
      });
      const url = res.url || res.data?.url;
      if (!url) throw new Error("Upload gagal: URL kosong");
      setForm((f) => ({ ...f, previewImageUrl: url }));
      toast.success("Preview terupload");
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
        <button onClick={() => navigate({ to: "/styles" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl">Edit Gaya Visual</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Ubah detail gaya {styleData?.name}
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
            <label className={nb.label}>Nama Gaya</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={nb.input}
            />
          </div>
          <div>
            <label className={nb.label}>Prompt Template</label>
            <textarea
              required
              rows={5}
              value={form.promptTemplate}
              onChange={(e) => setForm({ ...form, promptTemplate: e.target.value })}
              className={`${nb.input} font-mono text-sm`}
            />
          </div>
          <div>
            <label className={nb.label}>Preview Image (Upload / CDN)</label>
            <div className="nb-border rounded-[var(--radius)] bg-muted p-3 space-y-4">
              {form.previewImageUrl && (
                <img
                  src={form.previewImageUrl}
                  alt="preview"
                  className="w-full max-w-[300px] aspect-video object-cover nb-border rounded-md mx-auto bg-white"
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Gunakan URL CDN</label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    value={form.previewImageUrl}
                    onChange={(e) => setForm({ ...form, previewImageUrl: e.target.value })}
                    className={nb.input}
                  />
                </div>
                <div className="relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 md:hidden text-xs font-bold text-gray-500">ATAU</div>
                  <label
                    className={`${nb.btn} ${nb.btnBlack} w-full cursor-pointer justify-center`}
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "MENGUPLOAD…" : "PILIH FILE PREVIEW"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
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
