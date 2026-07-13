import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_admin/templates/$templateId/edit")({
  component: TemplatesEditPage,
});

function TemplatesEditPage() {
  const { templateId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  const [form, setForm] = useState({
    category: "poster",
    template: "",
    isActive: true,
    previewImageUrl: "",
    viralScore: "90",
    viralBreakdown: JSON.stringify({ hook: 90, visual: 92, education: 85, engagement: 90 }, null, 2),
    payloadJson: JSON.stringify({ topic: "[Topik Utama]", description: "[Deskripsi]" }, null, 2),
    hooks: "Mengapa {{topic}} Anda sepi penonton? Gunakan template ini!\n3 Aturan emas membuat konten visual {{topic}}.",
    analysis: "Template ini dirancang untuk menghasilkan prompt visual terstruktur dengan tingkat konversi tinggi.",
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
        viralScore: templateData.viralScore ? String(templateData.viralScore) : "90",
        viralBreakdown: templateData.viralBreakdown ? JSON.stringify(templateData.viralBreakdown, null, 2) : JSON.stringify({ hook: 90, visual: 92, education: 85, engagement: 90 }, null, 2),
        payloadJson: templateData.payloadJson ? JSON.stringify(templateData.payloadJson, null, 2) : JSON.stringify({ topic: "[Topik Utama]", description: "[Deskripsi]" }, null, 2),
        hooks: Array.isArray(templateData.hooks) ? templateData.hooks.join('\n') : "Mengapa {{topic}} Anda sepi penonton? Gunakan template ini!\n3 Aturan emas membuat konten visual {{topic}}.",
        analysis: templateData.analysis || "Template ini dirancang untuk menghasilkan prompt visual terstruktur dengan tingkat konversi tinggi.",
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

  const generateTemplateAi = async (idea: string) => {
    setIsGeneratingTemplate(true);
    try {
      const res = await api<any>("/admin/templates/generate-suggested", {
        method: "POST",
        body: { category: form.category, idea }
      });
      const data = res.data || res;
      if (data) {
        setForm(f => ({
          ...f,
          template: data.template || f.template,
          analysis: data.analysis || f.analysis,
          hooks: Array.isArray(data.hooks) ? data.hooks.join('\n') : f.hooks,
          payloadJson: data.payloadJson ? JSON.stringify(data.payloadJson, null, 2) : f.payloadJson,
          viralScore: data.viralScore ? String(data.viralScore) : f.viralScore,
          viralBreakdown: data.viralBreakdown ? JSON.stringify(data.viralBreakdown, null, 2) : f.viralBreakdown,
        }));
        toast.success("AI Gemini berhasil memformulasikan template lengkap!");
      } else {
        throw new Error("Respons AI tidak valid");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menghubungi AI");
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const saveMut = useMutation({
    mutationFn: () => {
      let parsedBreakdown = null;
      try {
        if (form.viralBreakdown) parsedBreakdown = JSON.parse(form.viralBreakdown);
      } catch (e) {
        toast.error("Format JSON Viral Breakdown tidak valid!");
        throw e;
      }

      let parsedPayload = null;
      try {
        if (form.payloadJson) parsedPayload = JSON.parse(form.payloadJson);
      } catch (e) {
        toast.error("Format JSON Payload tidak valid!");
        throw e;
      }

      const body = { 
        category: form.category, 
        template: form.template,
        previewImageUrl: form.previewImageUrl,
        isActive: form.isActive,
        viralScore: form.viralScore ? parseInt(form.viralScore) : null,
        viralBreakdown: parsedBreakdown,
        payloadJson: parsedPayload,
        hooks: form.hooks ? form.hooks.split('\n').map(h => h.trim()).filter(Boolean) : null,
        analysis: form.analysis || null,
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
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: "/templates" })} className={`${nb.btn} bg-white`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold uppercase">Edit Template</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Ubah template prompt dengan asisten AI Gemini
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
              <label className={nb.label}>Template Prompt (DSL)</label>
              <button 
                type="button"
                onClick={() => {
                  const idea = prompt("Ketik ide template (contoh: desain spanduk warung sate kambing):");
                  if (idea) {
                    generateTemplateAi(idea);
                  }
                }}
                disabled={isGeneratingTemplate}
                className={`${nb.btn} ${nb.btnYellow} !py-1 !px-2 !text-[10px]`}
              >
                <Sparkles className="w-3 h-3 mr-1 inline animate-pulse" /> 
                {isGeneratingTemplate ? "MEMBUAT DENGAN GEMINI..." : "Buat dengan AI Gemini"}
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

          {/* AI Metadata Sections */}
          <div className="border-t-4 border-black pt-4 mt-6 space-y-4">
            <h3 className="text-lg font-bold uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--nb-pink)]" />
              Metadata Visual & AI (Opsional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={nb.label}>Viral Score (0 - 100)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={form.viralScore}
                  onChange={(e) => setForm({ ...form, viralScore: e.target.value })}
                  className={nb.input}
                  placeholder="92"
                />
              </div>

              <div>
                <label className={nb.label}>Status Aktif</label>
                <select
                  value={form.isActive ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
                  className={nb.input}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>

            <div>
              <label className={nb.label}>Struktur Analisis</label>
              <textarea
                rows={3}
                value={form.analysis}
                onChange={(e) => setForm({ ...form, analysis: e.target.value })}
                className={nb.input}
                placeholder="Penjelasan struktur desain..."
              />
            </div>

            <div>
              <label className={nb.label}>Copywriting Hooks (Satu per baris)</label>
              <textarea
                rows={3}
                value={form.hooks}
                onChange={(e) => setForm({ ...form, hooks: e.target.value })}
                className={nb.input}
                placeholder="Hook 1&#10;Hook 2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={nb.label}>Payload JSON</label>
                <textarea
                  rows={6}
                  value={form.payloadJson}
                  onChange={(e) => setForm({ ...form, payloadJson: e.target.value })}
                  className={`${nb.input} font-mono text-xs`}
                  placeholder="{}"
                />
              </div>

              <div>
                <label className={nb.label}>Viral Score Breakdown (JSON)</label>
                <textarea
                  rows={6}
                  value={form.viralBreakdown}
                  onChange={(e) => setForm({ ...form, viralBreakdown: e.target.value })}
                  className={`${nb.input} font-mono text-xs`}
                  placeholder="{}"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveMut.isPending}
            className={`${nb.btn} ${nb.btnGreen} w-full mt-6`}
          >
            {saveMut.isPending ? "MENYIMPAN…" : "SIMPAN PERUBAHAN"}
          </button>
        </form>
      </div>
    </div>
  );
}
