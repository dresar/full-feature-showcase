import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_admin/templates/new")({
  component: TemplatesNewPage,
});

function TemplatesNewPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category: "poster",
    template: "",
    isActive: true,
    previewImageUrl: "",
  });

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
      return api(`/admin/templates`, { method: "POST", body });
    },
    onSuccess: () => {
      toast.success("Template ditambahkan");
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/templates" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl">Tambah Template Baru</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Buat template prompt baru
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
            <div className="flex items-center justify-between mb-1">
              <label className={nb.label}>Template Prompt</label>
              <button 
                type="button"
                onClick={() => {
                  const idea = prompt("Ketik ide template (contoh: desain kaos esports 3d):");
                  if (idea) {
                    const enhanced = `A highly detailed, professional ${idea} focusing on {{topic}}. \nCore visual elements: {{keyPoints}}. \nArt style: {{style}} with {{colorPalette}} colors. \nLighting: {{lighting}}. \nCamera angle: {{cameraAngle}}. \nMood/Vibe: {{mood}}. \nLayout structure: {{layout}}, aspect ratio: {{aspectRatio}}. \nText to include (if any): {{textRule}}.`;
                    setForm(f => ({ ...f, template: enhanced }));
                    toast.success("AI merumuskan struktur template!");
                  }
                }}
                className={`${nb.btn} ${nb.btnYellow} !py-1 !px-2 !text-[10px]`}
              >
                <Sparkles className="w-3 h-3 mr-1 inline" /> Buat dengan AI
              </button>
            </div>
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
            {saveMut.isPending ? "MENYIMPAN…" : "SIMPAN TEMPLATE"}
          </button>
        </form>
      </div>
    </div>
  );
}
