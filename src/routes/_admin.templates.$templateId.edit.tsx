import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Upload } from "lucide-react";

export const Route = createFileRoute("/_admin/templates/$templateId/edit")({
  component: TemplatesEditPage,
});

function TemplatesEditPage() {
  const { templateId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category: "poster",
    template: "",
    isActive: true,
    previewImageUrl: "",
  });

  const { data: templates = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin", "templates"],
    queryFn: async () => {
      const r = await api<any>(`/admin/templates`);
      return r.data || r;
    },
  });

  const templateData = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (templateData) {
      setForm({
        category: templateData.category || "poster",
        template: templateData.template || "",
        isActive: templateData.isActive ?? true,
        previewImageUrl: templateData.previewImageUrl || "",
      });
    }
  }, [templateData]);

  const categoryOptions = [
    "poster",
    "banner",
    "edukasi",
    "affiliate",
    "digital_product",
    "baliho",
    "logo",
    "quotes",
    "enhance",
  ];

  const saveMut = useMutation({
    mutationFn: () => {
      const body = { 
        category: form.category, 
        template: form.template,
        previewImageUrl: form.previewImageUrl 
      };
      return api(`/admin/templates/${templateId}`, { method: "PATCH", body });
    },
    onSuccess: () => {
      toast.success("Template diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
      navigate({ to: "/templates" });
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
        <button onClick={() => navigate({ to: "/templates" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl">Edit Template</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Ubah template prompt
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
            <label className={nb.label}>Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={nb.input}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={nb.label}>Template Prompt</label>
            <textarea
              required
              rows={8}
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              className={`${nb.input} font-mono text-xs`}
              placeholder="Isi template prompt lengkap di sini..."
            />
          </div>
          <div>
            <label className={nb.label}>Preview Image</label>
            <div className="nb-border rounded-[var(--radius)] bg-muted p-3 space-y-2">
              {form.previewImageUrl && (
                <img
                  src={form.previewImageUrl}
                  alt="preview"
                  className="w-full max-w-[300px] aspect-video object-cover nb-border rounded-md"
                />
              )}
              <label
                className={`${nb.btn} ${nb.btnBlack} w-full cursor-pointer`}
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
