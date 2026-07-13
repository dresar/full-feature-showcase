import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, Pencil, Sparkles, Wand2, FileText } from "lucide-react";
import { Modal } from "./_admin.keys";

export const Route = createFileRoute("/_admin/templates/")({
  component: TemplatesIndexPage,
});

type Template = {
  id: string;
  category: string;
  template: string;
  isActive: boolean;
  previewImageUrl?: string;
  viralScore?: number;
  viralBreakdown?: any;
  payloadJson?: any;
  hooks?: string[];
  analysis?: string;
};

function TemplatesIndexPage() {
  const qc = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // AI Form States
  const [topic, setTopic] = useState("");
  const [aiResult, setAiResult] = useState("");

  const { data = [], isLoading } = useQuery<Template[]>({
    queryKey: ["admin", "templates"],
    queryFn: async () => {
      const r = await api<any>("/admin/templates");
      return r.data || r;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Template dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateAiMut = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error("Pilih template terlebih dahulu");
      
      const res = await api<any>("/generate-prompt", {
        method: "POST",
        body: {
          topic: topic || "Contoh Topik Kreatif",
          category: selectedTemplate.category,
          feature: "poster",
          styleTemplateId: "", // Not used here directly, we just test the text gen
          slideCount: 1,
        }
      });
      return res;
    },
    onSuccess: (data) => {
      if (data.error) throw new Error(data.error);
      
      const content = data.data?.content || data.content;
      if (content) {
        setAiResult(content);
        toast.success("Prompt berhasil di-generate menggunakan AI!");
      } else {
        throw new Error("Hasil AI kosong");
      }
    },
    onError: (e: any) => {
      toast.error(e.message || "Gagal menghubungi AI");
    }
  });

  const saveToTemplateMut = useMutation({
    mutationFn: async () => {
      const body = { 
        category: selectedTemplate?.category || "custom", 
        template: aiResult,
        previewImageUrl: selectedTemplate?.previewImageUrl || "" 
      };
      return api(`/admin/templates`, { method: "POST", body });
    },
    onSuccess: () => {
      toast.success("Hasil AI berhasil disimpan sebagai Template baru!");
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = data.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  const openDetailModal = (t: Template) => {
    setSelectedTemplate(t);
    setTopic("");
    setAiResult("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold uppercase">📄 Pustaka Template Prompt</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Kelola template prompt dasar per kategori fitur.
          </p>
        </div>
        <Link to="/templates/new" className={`${nb.btn} ${nb.btnPink}`}>
          <Plus className="w-4 h-4" /> Tambah Template
        </Link>
      </div>

      {isLoading && (
        <div className={`${nb.card} p-6 text-center text-muted-foreground`}>Memuat…</div>
      )}
      {!isLoading && data.length === 0 && (
        <div className={`${nb.card} p-6 text-center text-muted-foreground`}>
          Belum ada template. Klik "Tambah Template" untuk mulai.
        </div>
      )}

      {Object.entries(grouped).map(([cat, templates]) => (
        <div key={cat} className="mb-8">
          <h3 className="text-xl font-bold uppercase mb-4 flex items-center gap-2 border-b-4 border-black pb-2">
            <Sparkles className="w-6 h-6 text-[var(--nb-pink)]" />
            {cat}
            <span className="text-xs bg-black text-white font-mono px-2 py-0.5 rounded ml-2">
              {templates.length}
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <div 
                key={t.id} 
                className={`${nb.card} overflow-hidden flex flex-col group cursor-pointer hover:translate-y-[-4px] transition-transform`}
                onClick={() => openDetailModal(t)}
              >
                <div className="aspect-square bg-muted border-b-[3px] border-black overflow-hidden relative">
                  {t.previewImageUrl ? (
                    <img src={t.previewImageUrl} alt={t.category} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gray-50 text-xs font-mono p-4 text-center">
                      <div className="bg-gray-200 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                        <Wand2 className="w-6 h-6 text-gray-500" />
                      </div>
                      Tidak ada preview
                    </div>
                  )}
                  
                  {/* Status Badge Overlays */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${t.isActive ? "bg-[var(--nb-green)] text-white" : "bg-red-500 text-white"}`}
                    >
                      {t.isActive ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 bg-white flex flex-col justify-between">
                  <h4 className="font-bold text-sm uppercase truncate mb-3 group-hover:text-[var(--nb-blue)] transition-colors">
                    {t.category} TPL
                  </h4>
                  
                  <div className="flex gap-2 relative z-10" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to="/templates/$templateId/edit" params={{ templateId: t.id }}
                      className={`${nb.btn} ${nb.btnYellow} !py-1.5 !px-2 !text-[10px] flex-1 text-center justify-center`}
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Link>
                    <button
                      onClick={() => confirm("Hapus template?") && deleteMut.mutate(t.id)}
                      className={`${nb.btn} bg-red-500 text-white !py-1.5 !px-2 !text-[10px]`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Detail & AI Modal */}
      {selectedTemplate && (
        <Modal onClose={() => setSelectedTemplate(null)} title={`Detail & Tes AI: ${selectedTemplate.category.toUpperCase()}`}>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto overflow-x-hidden pr-2">
            
            {/* Visual Preview */}
            <div className="w-full h-40 bg-gray-100 rounded-md border-2 border-black overflow-hidden relative">
              {selectedTemplate.previewImageUrl ? (
                <img src={selectedTemplate.previewImageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
                  Belum ada gambar referensi
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[10px] font-mono uppercase font-bold px-2 py-1 rounded border-2 border-black ${selectedTemplate.isActive ? "bg-[var(--nb-green)] text-white" : "bg-red-400 text-black"}`}>
                  {selectedTemplate.isActive ? "STATUS AKTIF" : "STATUS NONAKTIF"}
                </span>
              </div>
            </div>

            {/* Template Format Raw */}
            <div className="bg-blue-50 border-2 border-[var(--nb-blue)] rounded p-3">
              <h4 className="text-xs font-bold uppercase text-[var(--nb-blue)] mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" /> Template Dasar (DSL)
              </h4>
              <p className="text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedTemplate.template}
              </p>
            </div>

            {/* Viral Score & Breakdown */}
            {selectedTemplate.viralScore !== undefined && (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase text-yellow-600 flex items-center justify-between">
                  <span>🔥 Viral Score Metrics</span>
                  <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    SCORE: {selectedTemplate.viralScore}/100
                  </span>
                </h4>
                {selectedTemplate.viralBreakdown && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-600">
                    <div>Hook: {selectedTemplate.viralBreakdown.hook || 0}</div>
                    <div>Visual: {selectedTemplate.viralBreakdown.visual || 0}</div>
                    <div>Edukasi: {selectedTemplate.viralBreakdown.education || 0}</div>
                    <div>Engagement: {selectedTemplate.viralBreakdown.engagement || 0}</div>
                  </div>
                )}
              </div>
            )}

            {/* Analysis & Hooks */}
            {selectedTemplate.analysis && (
              <div className="bg-green-50 border-2 border-green-500 rounded p-3 space-y-2">
                <h4 className="text-xs font-bold uppercase text-green-600">
                  💡 Struktur Analisis
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedTemplate.analysis}
                </p>
                {selectedTemplate.hooks && selectedTemplate.hooks.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-green-200">
                    <span className="text-[10px] font-bold text-green-600 uppercase block">Copywriting Hooks:</span>
                    {selectedTemplate.hooks.map((h, i) => (
                      <div key={i} className="text-xs font-semibold bg-white border border-green-100 p-1.5 rounded">
                        🎯 {h}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payload JSON */}
            {selectedTemplate.payloadJson && (
              <div className="bg-purple-50 border-2 border-purple-500 rounded p-3">
                <h4 className="text-xs font-bold uppercase text-purple-600 mb-1">
                  📦 Skema Payload JSON
                </h4>
                <pre className="text-[10px] font-mono text-gray-700 bg-white/50 p-2 border border-purple-100 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(selectedTemplate.payloadJson, null, 2)}
                </pre>
              </div>
            )}

            <hr className="border-t-2 border-black/20 my-4" />

            {/* AI Generator Box */}
            <div className="bg-[var(--nb-pink)] border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-xl p-4">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Wand2 className="w-5 h-5" /> Test Prompt AI (Simulation)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-white mb-1 block">Masukkan Topik (Opsional)</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Diskon Kemerdekaan 50%"
                    className="w-full p-2 rounded border-2 border-black font-sans text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                
                <button
                  onClick={() => generateAiMut.mutate()}
                  disabled={generateAiMut.isPending}
                  className={`${nb.btn} bg-[var(--nb-yellow)] text-black w-full justify-center !py-2`}
                >
                  {generateAiMut.isPending ? "MENGHASILKAN PROMPT..." : "GUNAKAN AI SEKARANG"}
                </button>
              </div>
            </div>

            {/* AI Result Area */}
            {aiResult && (
              <div className="mt-4 bg-gray-900 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-xl p-4 text-white animate-fadeIn">
                <h3 className="font-bold text-green-400 text-sm mb-3 uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Hasil Generate Prompt
                </h3>
                <div className="bg-black/50 p-3 rounded font-mono text-xs whitespace-pre-wrap border border-gray-700 text-gray-300 max-h-60 overflow-y-auto">
                  {aiResult}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => saveToTemplateMut.mutate()}
                    disabled={saveToTemplateMut.isPending}
                    className={`${nb.btn} ${nb.btnGreen} w-full !text-xs !py-2`}
                  >
                    {saveToTemplateMut.isPending ? "MENYIMPAN..." : "SIMPAN HISTORY KE TEMPLATE BARU"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
