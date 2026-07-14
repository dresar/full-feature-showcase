import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, KeyRound, X, RefreshCw, Sparkles, Code, Check } from "lucide-react";

export const Route = createFileRoute("/_admin/keys")({
  component: KeysPage,
});

type GeminiKey = {
  id: string;
  apiKey?: string;
  maskedKey?: string;
  priority: number;
  isActive: boolean;
  status?: "HEALTHY" | "RATE_LIMITED" | "DEAD" | string;
  errorCount?: number;
  provider?: string;
};

function mask(k?: string) {
  if (!k) return "••••••••";
  if (k.length <= 10) return k;
  return `${k.slice(0, 6)}...${k.slice(-4)}`;
}

function statusBadge(s?: string) {
  const map: Record<string, string> = {
    HEALTHY: "bg-[var(--nb-green)] text-white",
    RATE_LIMITED: "bg-[var(--nb-yellow)]",
    DEAD: "bg-red-500 text-white",
    ERROR: "bg-red-500 text-white",
    LIMITED: "bg-[var(--nb-yellow)]",
  };
  return map[s || ""] || "bg-white";
}

function KeysPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pool' | 'developer'>('pool');
  const [providerTab, setProviderTab] = useState<'gemini' | 'groq'>('gemini');

  // Pool Keys States
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(1);
  const [provider, setProvider] = useState("gemini");

  // Developer Keys States
  const [newKeyName, setNewKeyName] = useState("");
  const [showDevModal, setShowDevModal] = useState(false);

  // Queries
  const { data = [], isLoading } = useQuery<GeminiKey[]>({
    queryKey: ["admin", "keys"],
    queryFn: async () => {
      const res = await api<any>("/admin/keys");
      const items = res.data || res.keys || res || [];
      return items.map((k: any) => ({
        id: k.id,
        apiKey: k.keyEncrypted,
        maskedKey: k.keyEncrypted,
        priority: k.priority,
        isActive: k.isActive,
        status: k.healthStatus?.toUpperCase() || "UNKNOWN",
        errorCount: k.errorCount || 0,
        provider: k.provider || 'gemini',
      }));
    },
  });

  // Auto-calculate priority when modal opens or provider changes
  useEffect(() => {
    if (open) {
      const providerKeys = data.filter(k => (k.provider || 'gemini').toLowerCase() === provider.toLowerCase());
      const maxPrio = providerKeys.length > 0 ? Math.max(...providerKeys.map(k => k.priority || 0)) : 0;
      setPriority(maxPrio + 1);
    }
  }, [open, provider, data]);

  const { data: devKeys = [], isLoading: devLoading } = useQuery<any[]>({
    queryKey: ["admin", "devKeys"],
    queryFn: async () => {
      const res = await api<any>("/admin/developer-keys");
      return res.data || [];
    },
    enabled: activeTab === 'developer',
  });

  // Mutations (Pool Keys)
  const createMut = useMutation({
    mutationFn: () =>
      api("/admin/keys", { method: "POST", body: { apiKey, priority, provider } }),
    onSuccess: () => {
      toast.success("Kunci ditambahkan");
      setOpen(false);
      setApiKey("");
      setPriority(1);
      setProvider("gemini");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { id: string; isActive?: boolean; priority?: number }) =>
      api(`/admin/keys/${payload.id}`, {
        method: "PATCH",
        body: { isActive: payload.isActive, priority: payload.priority },
      }),
    onSuccess: () => {
      toast.success("Kunci diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Kunci dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: (id: string) => api(`/admin/keys/${id}/test`, { method: "POST" }),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success("Kunci aktif dan sehat!");
      } else {
        toast.error(`Kunci bermasalah: ${res.error || "Gagal tes"}`);
      }
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const testAllMut = useMutation({
    mutationFn: () => api("/admin/keys/test-all", { method: "POST" }),
    onSuccess: () => {
      toast.success("Pengujian semua kunci selesai.");
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Mutations (Developer Keys)
  const createDevKeyMut = useMutation({
    mutationFn: () =>
      api("/admin/developer-keys", { method: "POST", body: { name: newKeyName } }),
    onSuccess: () => {
      toast.success("Developer API Key berhasil dibuat!");
      setShowDevModal(false);
      setNewKeyName("");
      qc.invalidateQueries({ queryKey: ["admin", "devKeys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDevKeyMut = useMutation({
    mutationFn: (id: string) => api(`/admin/developer-keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Developer API Key dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "devKeys"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold uppercase">🔑 Kredensial & Kunci Akses</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Kelola pool API Key provider untuk rotasi pintar dan atur kunci akses pengembang personal.
          </p>
        </div>
      </div>

      {/* Neubrutalist Tabs */}
      <div className="flex gap-2 border-b-4 border-black pb-0">
        <button
          onClick={() => setActiveTab('pool')}
          className={`px-4 py-2.5 font-bold uppercase text-xs sm:text-sm border-t-3 border-x-3 border-black rounded-t-md translate-y-[4px] transition-all ${
            activeTab === 'pool'
              ? 'bg-[var(--nb-yellow)] border-b-3 border-b-[var(--nb-yellow)] shadow-[0_3px_0_0_rgba(0,0,0,1)]'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          Key Pool (Gemini & Groq)
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`px-4 py-2.5 font-bold uppercase text-xs sm:text-sm border-t-3 border-x-3 border-black rounded-t-md translate-y-[4px] transition-all ${
            activeTab === 'developer'
              ? 'bg-[var(--nb-yellow)] border-b-3 border-b-[var(--nb-yellow)] shadow-[0_3px_0_0_rgba(0,0,0,1)]'
              : 'bg-white hover:bg-gray-100'
          }`}
        >
          Developer Keys & Dokumentasi
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'pool' ? (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold uppercase">Koleksi API Key Provider</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => testAllMut.mutate()}
                disabled={testAllMut.isPending}
                className={`${nb.btn} bg-white border-2 border-black !text-black !py-2 !px-4 text-sm`}
              >
                <RefreshCw className={`w-4 h-4 mr-2 inline ${testAllMut.isPending ? "animate-spin" : ""}`} />
                {testAllMut.isPending ? "MENGUJI…" : "TES SEMUA KUNCI"}
              </button>
              <button onClick={() => { setProvider(providerTab); setOpen(true); }} className={`${nb.btn} ${nb.btnPink}`}>
                <Plus className="w-4 h-4" /> Tambah Kunci Pool
              </button>
            </div>
          </div>

          {/* Provider Tabs (Sub-tabs) */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setProviderTab('gemini')}
              className={`px-4 py-2 font-bold uppercase text-xs rounded-md transition-all border-2 border-black ${
                providerTab === 'gemini'
                  ? 'bg-blue-100 text-blue-800 shadow-[0_2px_0_0_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              Gemini Keys
            </button>
            <button
              onClick={() => setProviderTab('groq')}
              className={`px-4 py-2 font-bold uppercase text-xs rounded-md transition-all border-2 border-black ${
                providerTab === 'groq'
                  ? 'bg-orange-100 text-orange-800 shadow-[0_2px_0_0_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              Groq Keys
            </button>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-4 md:hidden">
            {isLoading && (
              <div className={`${nb.card} p-8 text-center text-muted-foreground`}>
                Memuat…
              </div>
            )}
            {!isLoading && data.filter((k) => (k.provider || 'gemini') === providerTab).length === 0 && (
              <div className={`${nb.card} p-8 text-center text-muted-foreground`}>
                Belum ada kunci {providerTab.toUpperCase()} terdaftar.
              </div>
            )}
            {data.filter((k) => (k.provider || 'gemini') === providerTab).map((k) => (
              <div key={k.id} className={`${nb.card} p-4 space-y-3 font-mono text-sm`}>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <span className="font-bold inline-flex items-center gap-1.5 truncate mr-2">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span className="truncate">{k.maskedKey || mask(k.apiKey)}</span>
                    <span className={`nb-border rounded-[var(--radius)] px-1.5 py-0.2 text-[9px] font-bold border-black ${
                      k.provider === 'groq' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(k.provider || 'gemini').toUpperCase()}
                    </span>
                  </span>
                  <span className={`${nb.badge} ${statusBadge(k.status)} text-[10px] shrink-0`}>
                    {k.status || "UNKNOWN"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div>
                    <span className="text-muted-foreground block mb-1">Prioritas:</span>
                    <input
                      type="number"
                      defaultValue={k.priority}
                      className="nb-border rounded-md px-2 py-0.5 w-20 bg-white"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== k.priority) updateMut.mutate({ id: k.id, priority: v });
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block mb-1">Aktif:</span>
                    <button
                      onClick={() => updateMut.mutate({ id: k.id, isActive: !k.isActive })}
                      className={`${nb.badge} ${k.isActive ? "bg-[var(--nb-green)] text-white" : "bg-white"} text-[10px]`}
                    >
                      {k.isActive ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-red-50 p-2 rounded-md border border-red-200 text-xs">
                  <span className="text-red-700 font-sans font-bold">Total Error/Rotasi:</span>
                  <span className="font-bold text-red-800">⚠ {k.errorCount || 0} kali</span>
                </div>

                <div className="border-t-2 border-black/10 pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => testMut.mutate(k.id)}
                    disabled={testMut.isPending}
                    className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-blue)] text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Tes
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Hapus kunci ini?")) deleteMut.mutate(k.id);
                    }}
                    className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-red-500 text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className={`${nb.card} overflow-hidden hidden md:block`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--nb-yellow)] border-b-[3px] border-black">
                  <tr className="text-left uppercase text-xs">
                    <th className="px-4 py-3">API Key</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Prioritas</th>
                    <th className="px-4 py-3">Rotasi (Error)</th>
                    <th className="px-4 py-3">Aktif</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Memuat…
                      </td>
                    </tr>
                  )}
                  {!isLoading && data.filter((k) => (k.provider || 'gemini') === providerTab).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada kunci {providerTab.toUpperCase()} terdaftar.
                      </td>
                    </tr>
                  )}
                  {data.filter((k) => (k.provider || 'gemini') === providerTab).map((k) => (
                    <tr key={k.id} className="border-b-2 border-black/10">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        {k.maskedKey || mask(k.apiKey)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`nb-border rounded-[var(--radius)] px-2 py-0.5 text-xs font-bold border-black ${
                          k.provider === 'groq' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(k.provider || 'gemini').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${nb.badge} ${statusBadge(k.status)}`}>
                          {k.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          defaultValue={k.priority}
                          className="nb-border rounded-md px-2 py-1 w-20 bg-white"
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v !== k.priority) updateMut.mutate({ id: k.id, priority: v });
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="nb-border rounded-[var(--radius)] bg-red-100 px-2 py-0.5 text-xs text-red-700 font-bold border-red-300">
                          ⚠ {k.errorCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateMut.mutate({ id: k.id, isActive: !k.isActive })}
                          className={`${nb.badge} ${k.isActive ? "bg-[var(--nb-green)] text-white" : "bg-white"}`}
                        >
                          {k.isActive ? "ON" : "OFF"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => testMut.mutate(k.id)}
                          disabled={testMut.isPending}
                          className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-[var(--nb-blue)] text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Tes
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus kunci ini?")) deleteMut.mutate(k.id);
                          }}
                          className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-md bg-red-500 text-white px-3 py-1.5 inline-flex items-center gap-1 text-xs font-bold uppercase"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {open && (
            <Modal onClose={() => setOpen(false)} title="Tambah Kunci Pool Baru">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMut.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className={nb.label}>AI Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className={nb.input}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq AI (Llama)</option>
                  </select>
                </div>
                <div>
                  <label className={nb.label}>API Key</label>
                  <input
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className={`${nb.input} font-mono`}
                    placeholder={provider === "groq" ? "gsk_..." : "AIzaSy..."}
                  />
                </div>
                <div>
                  <label className={nb.label}>Prioritas</label>
                  <input
                    type="number"
                    min={0}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className={nb.input}
                  />
                </div>
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className={`${nb.btn} ${nb.btnGreen} w-full`}
                >
                  {createMut.isPending ? "MENYIMPAN…" : "SIMPAN KUNCI"}
                </button>
              </form>
            </Modal>
          )}
        </div>
      ) : (
        // Developer SaaS API keys and documentation tab
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold uppercase">Kunci API Pengembang (SaaS Access)</h3>
            <button onClick={() => setShowDevModal(true)} className={`${nb.btn} ${nb.btnPink}`}>
              <Plus className="w-4 h-4" /> Buat Kunci Baru
            </button>
          </div>

          {/* Developer keys list */}
          <div className="grid md:grid-cols-2 gap-4">
            {devLoading && (
              <div className={`${nb.card} p-8 text-center text-muted-foreground md:col-span-2`}>
                Memuat…
              </div>
            )}
            {!devLoading && devKeys.length === 0 && (
              <div className={`${nb.card} p-8 text-center text-muted-foreground md:col-span-2`}>
                Belum ada Developer API Key. Silakan buat satu untuk berintegrasi.
              </div>
            )}
            {devKeys.map((dk: any) => (
              <div key={dk.id} className={`${nb.card} p-4 space-y-3 font-mono text-sm bg-white`}>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <span className="font-bold text-base text-black font-sans">{dk.name}</span>
                  <span className={`${nb.badge} ${dk.isActive ? "bg-[var(--nb-green)] text-white" : "bg-white"} text-[10px]`}>
                    {dk.isActive ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>
                <div className="bg-gray-100 p-2.5 rounded border border-gray-300 font-bold select-all select-text break-all text-xs font-mono">
                  {dk.apiKey}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 font-sans">
                  <span>Dibuat: {new Date(dk.createdAt).toLocaleDateString('id-ID')}</span>
                  <button
                    onClick={() => {
                      if (confirm("Hapus Developer API Key ini? Integrasi yang menggunakan key ini akan terhenti.")) {
                        deleteDevKeyMut.mutate(dk.id);
                      }
                    }}
                    className="text-red-600 font-bold uppercase hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Integration documentation */}
          <div className={`${nb.card} p-5 space-y-5 bg-white`}>
            <div className="flex items-center gap-2 border-b-3 border-black pb-3">
              <div className="nb-border bg-[var(--nb-blue)] text-white p-2 rounded-md">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold uppercase">📚 Panduan Integrasi API Poster Prompt Studio</h3>
            </div>
            
            <div className="space-y-4 font-sans text-sm text-gray-700 leading-relaxed">
              <p>
                Gunakan Developer API Key yang telah Anda generate di atas untuk menghubungkan Poster Prompt Studio dengan aplikasi eksternal (Website, Bot Telegram, Mobile App, dll.).
                Backend kami akan secara otomatis memutar kunci (auto-rotation) secara pintar dari pool API Key Gemini/Groq yang aktif di sistem.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-black/10 p-3 rounded-md bg-gray-50">
                  <span className="font-bold text-black block mb-1">Base URL API:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-gray-300 font-mono text-xs select-all">
                    https://porto.apprentice.cyou/api/v1
                  </code>
                </div>
                <div className="border border-black/10 p-3 rounded-md bg-gray-50">
                  <span className="font-bold text-black block mb-1">Header Autentikasi Wajib:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-gray-300 font-mono text-xs select-all">
                    x-api-key: ps_live_YOUR_KEY
                  </code>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t-2 border-black/10">
                <h4 className="font-bold text-base text-black uppercase">💡 Endpoint API Utama</h4>
                
                {/* Endpoint 1 */}
                <div className="bg-gray-50 border-2 border-black rounded-lg p-4 font-mono text-xs space-y-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px]">POST</span>
                    <span className="font-bold text-black text-sm">/generate-prompt</span>
                  </div>
                  <div className="text-gray-700 font-sans">
                    Merumuskan prompt gambar final terstruktur yang detail & mendalam beserta copy-writing hooks sosial media dan viral score dari konfigurasi poster.
                  </div>
                  <div>
                    <span className="font-sans font-bold text-gray-500 block mb-1 text-[11px]">Request Body:</span>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-[11px] font-mono leading-relaxed max-h-40">
{`{
  "topic": "5 Tips Sukses Mulai Berinvestasi Saham",
  "category": "Keuangan",
  "styleTemplateId": "visual-style-id-bila-ada",
  "feature": "poster", // "poster" | "logo"
  "slideCount": 1
}`}
                    </pre>
                  </div>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-gray-50 border-2 border-black rounded-lg p-4 font-mono text-xs space-y-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px]">POST</span>
                    <span className="font-bold text-black text-sm">/improve-prompt</span>
                  </div>
                  <div className="text-gray-700 font-sans">
                    Meningkatkan kualitas draf prompt gambar biasa menjadi prompt detail berbahasa Inggris untuk Midjourney/Flux/DALL-E 3.
                  </div>
                  <div>
                    <span className="font-sans font-bold text-gray-500 block mb-1 text-[11px]">Request Body:</span>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-[11px] font-mono leading-relaxed">
{`{
  "promptDraft": "desain poster pendidikan digital neubrutalism style"
}`}
                    </pre>
                  </div>
                </div>

                {/* Endpoint 3 */}
                <div className="bg-gray-50 border-2 border-black rounded-lg p-4 font-mono text-xs space-y-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px]">POST</span>
                    <span className="font-bold text-black text-sm">/analyze-image</span>
                  </div>
                  <div className="text-gray-700 font-sans">
                    Menganalisis gambar referensi (palet warna, tata letak, gaya visual, tipografi, mood) secara instan.
                  </div>
                  <div>
                    <span className="font-sans font-bold text-gray-500 block mb-1 text-[11px]">Request Body:</span>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-[11px] font-mono leading-relaxed">
{`{
  "imageUrl": "https://example.com/poster-referensi-keren.png"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showDevModal && (
            <Modal onClose={() => setShowDevModal(false)} title="Buat Developer API Key Baru">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createDevKeyMut.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <label className={nb.label}>Nama Kunci Akses</label>
                  <input
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className={nb.input}
                    placeholder="Contoh: Integrasi Bot Telegram"
                  />
                </div>
                <button
                  type="submit"
                  disabled={createDevKeyMut.isPending}
                  className={`${nb.btn} ${nb.btnGreen} w-full`}
                >
                  {createDevKeyMut.isPending ? "MEMBUAT…" : "BUAT API KEY"}
                </button>
              </form>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

export function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg nb-border nb-shadow-lg rounded-[var(--radius)] bg-white p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="nb-border nb-shadow-sm rounded-md p-1.5 bg-white"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
