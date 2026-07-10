import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  Search,
  Layers,
  Eye,
  EyeOff,
  X,
  Save,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

export const Route = createFileRoute("/_admin/dropdowns")({
  component: DropdownsPage,
});

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
type DropdownOption = {
  id: string;
  groupKey: string;
  label: string;
  value: string;
  helperText?: string;
  icon?: string;
  sortOrder?: number;
};

const EMPTY_FORM: Omit<DropdownOption, "id"> = {
  groupKey: "",
  label: "",
  value: "",
  helperText: "",
  icon: "",
  sortOrder: 0,
};

// Group metadata
const GROUP_META: Record<string, { label: string; color: string; dot: string; emoji: string }> = {
  gaya_poster:         { label: "Gaya Poster",          color: "bg-yellow-50 border-yellow-400",   dot: "bg-yellow-400",   emoji: "🎨" },
  tata_letak_poster:   { label: "Tata Letak Poster",    color: "bg-blue-50 border-blue-400",       dot: "bg-blue-400",     emoji: "🗂️" },
  rasio_poster:        { label: "Rasio Poster",          color: "bg-purple-50 border-purple-400",   dot: "bg-purple-400",   emoji: "📐" },
  palet_warna:         { label: "Palet Warna",           color: "bg-pink-50 border-pink-400",       dot: "bg-pink-400",     emoji: "🌈" },
  nuansa_mood:         { label: "Nuansa Mood",           color: "bg-orange-50 border-orange-400",   dot: "bg-orange-400",   emoji: "☀️" },
  aturan_teks:         { label: "Aturan Teks",           color: "bg-red-50 border-red-400",         dot: "bg-red-400",      emoji: "🔒" },
  fokus_karakter:      { label: "Fokus Karakter",        color: "bg-green-50 border-green-400",     dot: "bg-green-400",    emoji: "🎲" },
  gaya_banner:         { label: "Gaya Banner",           color: "bg-cyan-50 border-cyan-400",       dot: "bg-cyan-400",     emoji: "🏷️" },
  rasio_banner:        { label: "Rasio Banner",          color: "bg-teal-50 border-teal-400",       dot: "bg-teal-400",     emoji: "📏" },
  gaya_baliho:         { label: "Gaya Baliho",           color: "bg-indigo-50 border-indigo-400",   dot: "bg-indigo-400",   emoji: "🏢" },
  rasio_baliho:        { label: "Rasio Baliho",          color: "bg-violet-50 border-violet-400",   dot: "bg-violet-400",   emoji: "📺" },
  gaya_edukasi:        { label: "Gaya Edukasi",          color: "bg-lime-50 border-lime-400",       dot: "bg-lime-400",     emoji: "📚" },
  jenis_materi:        { label: "Jenis Materi",          color: "bg-amber-50 border-amber-400",     dot: "bg-amber-400",    emoji: "📖" },
  gaya_quotes:         { label: "Gaya Quotes",           color: "bg-rose-50 border-rose-400",       dot: "bg-rose-400",     emoji: "✍️" },
  tema_quotes:         { label: "Tema Quotes",           color: "bg-fuchsia-50 border-fuchsia-400", dot: "bg-fuchsia-400",  emoji: "💬" },
  rasio_quotes:        { label: "Rasio Quotes",          color: "bg-sky-50 border-sky-400",         dot: "bg-sky-400",      emoji: "📱" },
  gaya_logo:           { label: "Gaya Logo",             color: "bg-emerald-50 border-emerald-400", dot: "bg-emerald-400",  emoji: "💎" },
  industri_logo:       { label: "Industri Logo",         color: "bg-stone-50 border-stone-400",     dot: "bg-stone-400",    emoji: "🏭" },
  gaya_digital:        { label: "Gaya Digital Product",  color: "bg-blue-50 border-blue-300",       dot: "bg-blue-300",     emoji: "💿" },
  enhance_style:       { label: "Enhance Style",         color: "bg-pink-50 border-pink-300",       dot: "bg-pink-300",     emoji: "✨" },
  change_level:        { label: "Tingkat Perubahan",     color: "bg-green-50 border-green-300",     dot: "bg-green-300",    emoji: "🌱" },
};

function getMeta(key: string) {
  return GROUP_META[key] ?? {
    label: key,
    color: "bg-gray-50 border-gray-300",
    dot: "bg-gray-400",
    emoji: "📋",
  };
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
function DropdownsPage() {
  const qc = useQueryClient();

  // Panel state: null = hidden, "new" = adding new, DropdownOption = editing
  const [panel, setPanel] = useState<null | "new" | DropdownOption>(null);
  const [form, setForm] = useState<Omit<DropdownOption, "id">>(EMPTY_FORM);
  const [customGroup, setCustomGroup] = useState("");
  const [filterGroup, setFilterGroup] = useState("__all__");
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // ── Fetch ──
  const { data = [], isLoading, refetch } = useQuery<DropdownOption[]>({
    queryKey: ["admin", "dropdowns"],
    queryFn: async () => {
      const r = await api<any>("/dropdown-options");
      return Array.isArray(r) ? r : r.data || [];
    },
    staleTime: 60_000,
  });

  // ── Auto-expand first group on load ──
  useEffect(() => {
    if (data.length > 0 && expandedGroups.size === 0) {
      const firstGroup = data[0]?.groupKey;
      if (firstGroup) setExpandedGroups(new Set([firstGroup]));
    }
  }, [data]);

  // ── Groups ──
  const allGroups = useMemo(() => Array.from(new Set(data.map((d) => d.groupKey))).sort(), [data]);

  // ── Filtered + Grouped ──
  const grouped = useMemo(() => {
    const map: Record<string, DropdownOption[]> = {};
    for (const item of data) {
      const matchGroup = filterGroup === "__all__" || item.groupKey === filterGroup;
      const q = search.toLowerCase();
      const matchSearch = !q || item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q);
      if (!matchGroup || !matchSearch) continue;
      if (!map[item.groupKey]) map[item.groupKey] = [];
      map[item.groupKey].push(item);
    }
    return map;
  }, [data, filterGroup, search]);

  // ── Mutations ──
  const saveMut = useMutation({
    mutationFn: () => {
      const groupKeyToUse = form.groupKey === "__new__" ? customGroup : form.groupKey;
      const body = { ...form, groupKey: groupKeyToUse };
      if (panel && panel !== "new") {
        return api(`/dropdown-options/${(panel as DropdownOption).id}`, { method: "PATCH", body });
      }
      return api("/dropdown-options", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(panel !== "new" ? "✅ Opsi berhasil diperbarui!" : "🎉 Opsi baru berhasil ditambahkan!");
      setPanel(null);
      qc.invalidateQueries({ queryKey: ["admin", "dropdowns"] });
    },
    onError: (e: any) => toast.error(e.message || "Gagal menyimpan"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/dropdown-options/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("🗑️ Opsi dihapus");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin", "dropdowns"] });
    },
    onError: (e: any) => toast.error(e.message || "Gagal menghapus"),
  });

  // ── Panel openers ──
  function openNew(defaultGroup = "") {
    setForm({ ...EMPTY_FORM, groupKey: defaultGroup });
    setCustomGroup("");
    setPanel("new");
  }

  function openEdit(item: DropdownOption) {
    setForm({
      groupKey: item.groupKey,
      label: item.label,
      value: item.value,
      helperText: item.helperText ?? "",
      icon: item.icon ?? "",
      sortOrder: item.sortOrder ?? 0,
    });
    setCustomGroup("");
    setPanel(item);
  }

  function closePanel() {
    setPanel(null);
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const isEditing = panel !== null && panel !== "new";
  const effectiveGroup = form.groupKey === "__new__" ? customGroup : form.groupKey;
  const canSave = effectiveGroup.trim() && form.label.trim() && form.value.trim();

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6" /> Kelola Dropdown Opsi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tambah dan kelola opsi yang tampil di dropdown aplikasi Flutter.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            title="Refresh"
            className="nb-border nb-shadow-sm nb-press rounded-[var(--radius)] bg-white p-2.5"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openNew()}
            className="nb-border nb-shadow nb-press nb-press-hover bg-[var(--nb-yellow)] text-black font-black uppercase text-xs px-5 py-2.5 rounded-[var(--radius)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Opsi Baru
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Opsi", value: data.length, bg: "bg-[var(--nb-yellow)]", emoji: "📋" },
          { label: "Grup", value: allGroups.length, bg: "bg-[var(--nb-green)]", emoji: "🗂️" },
          { label: "Tampil", value: Object.values(grouped).flat().length, bg: "bg-[var(--nb-blue)] text-white", emoji: "👁️" },
          { label: "Ada Preview", value: data.filter((d) => d.icon?.startsWith("http")).length, bg: "bg-[var(--nb-pink)] text-white", emoji: "🖼️" },
        ].map((s) => (
          <div key={s.label} className={`nb-border nb-shadow rounded-[var(--radius)] px-4 py-3 ${s.bg}`}>
            <div className="text-2xl font-black leading-none">{s.value}</div>
            <div className="text-[10px] font-bold uppercase opacity-70 mt-1">{s.emoji} {s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main: Two-column layout when panel is open ── */}
      <div className={`flex gap-5 items-start transition-all duration-200`}>

        {/* ── LEFT: Filter + List ── */}
        <div className={`flex-1 min-w-0 space-y-4 transition-all duration-200 ${panel ? "lg:max-w-[55%]" : "max-w-full"}`}>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari label atau value…"
                className="nb-border nb-shadow-sm rounded-[var(--radius)] bg-white text-xs font-semibold pl-8 pr-3 py-2 w-full outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="nb-border nb-shadow-sm rounded-[var(--radius)] bg-white text-[11px] font-bold uppercase pl-3 pr-7 py-2 appearance-none outline-none cursor-pointer"
              >
                <option value="__all__">Semua Grup</option>
                {allGroups.map((g) => (
                  <option key={g} value={g}>{getMeta(g).emoji} {getMeta(g).label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
            </div>
          </div>

          {/* Groups */}
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground text-sm animate-pulse font-mono">
              Memuat data…
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="nb-border nb-shadow rounded-[var(--radius)] bg-white text-center py-14">
              <div className="text-4xl mb-2">🤷</div>
              <p className="font-bold text-sm">Tidak ada opsi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([group, items]) => {
                const meta = getMeta(group);
                const isOpen = expandedGroups.has(group);
                return (
                  <div key={group} className="nb-border nb-shadow rounded-[var(--radius)] bg-white overflow-hidden">
                    {/* Group Header — clickable accordion */}
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-4 py-3 border-b-2 border-black/10 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />
                        <span className="text-lg leading-none">{meta.emoji}</span>
                        <div>
                          <span className="font-black text-sm">{meta.label}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground font-mono">{group}</span>
                        </div>
                        <span className="nb-border text-[10px] font-black px-2 py-0.5 rounded bg-black text-white ml-1">
                          {items.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openNew(group); }}
                          className="nb-border nb-shadow-sm nb-press rounded-[var(--radius)] bg-[var(--nb-yellow)] text-black font-black text-[10px] uppercase px-2.5 py-1 flex items-center gap-1 hover:scale-105 transition-transform"
                        >
                          <Plus className="w-3 h-3" /> Tambah
                        </button>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Items list — accordion body */}
                    {isOpen && (
                      <div className="divide-y divide-black/5">
                        {items.map((item) => {
                          const isURL = item.icon?.startsWith("http");
                          const isActiveEdit = panel && panel !== "new" && (panel as DropdownOption).id === item.id;
                          return (
                            <div key={item.id}>
                              <div
                                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                                  isActiveEdit ? "bg-yellow-50" : "hover:bg-gray-50/60"
                                }`}
                              >
                                {/* Thumb */}
                                <div className="w-8 h-8 shrink-0 nb-border rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {isURL ? (
                                    <img src={item.icon} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-base leading-none">{item.icon || "📋"}</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-black text-[13px] truncate leading-tight">
                                    {item.label}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <code className="text-[10px] bg-black text-white font-mono px-1.5 py-0.5 rounded">
                                      {item.value}
                                    </code>
                                    {item.helperText && (
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                        {item.helperText}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Row actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {isURL && (
                                    <button
                                      onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                                      title="Lihat Preview"
                                      className={`nb-border nb-shadow-sm nb-press p-1.5 rounded-[var(--radius)] transition-colors ${
                                        previewId === item.id ? "bg-black text-white" : "bg-white hover:bg-blue-50"
                                      }`}
                                    >
                                      {previewId === item.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => isActiveEdit ? closePanel() : openEdit(item)}
                                    className={`nb-border nb-shadow-sm nb-press p-1.5 rounded-[var(--radius)] ${
                                      isActiveEdit ? "bg-black text-white" : "bg-white hover:bg-yellow-50"
                                    }`}
                                    title={isActiveEdit ? "Tutup form" : "Edit"}
                                  >
                                    {isActiveEdit ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => setDeleteId(deleteId === item.id ? null : item.id)}
                                    className={`nb-border nb-shadow-sm nb-press p-1.5 rounded-[var(--radius)] transition-colors ${
                                      deleteId === item.id ? "bg-red-500 text-white" : "bg-white hover:bg-red-50 text-red-500"
                                    }`}
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Preview panel */}
                              {previewId === item.id && isURL && (
                                <div className="mx-4 mb-3 nb-border rounded-[var(--radius)] overflow-hidden">
                                  <div className="bg-black text-white text-[9px] font-mono uppercase px-3 py-1 flex items-center gap-1.5">
                                    <Eye className="w-3 h-3" /> Preview Visual — {item.label}
                                  </div>
                                  <img
                                    src={item.icon}
                                    alt={item.label}
                                    className="w-full max-h-56 object-cover"
                                  />
                                </div>
                              )}

                              {/* Delete confirm row */}
                              {deleteId === item.id && (
                                <div className="mx-4 mb-3 nb-border border-red-400 rounded-[var(--radius)] bg-red-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-xs font-bold text-red-700">
                                    ⚠️ Hapus "<strong>{item.label}</strong>"?
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setDeleteId(null)}
                                      className="nb-border nb-press text-xs font-bold px-3 py-1.5 rounded-[var(--radius)] bg-white"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      onClick={() => deleteMut.mutate(item.id)}
                                      disabled={deleteMut.isPending}
                                      className="nb-border nb-press text-xs font-bold px-3 py-1.5 rounded-[var(--radius)] bg-red-500 text-white disabled:opacity-50"
                                    >
                                      {deleteMut.isPending ? "Menghapus…" : "Ya, Hapus!"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Sticky Inline Form Panel ── */}
        {panel !== null && (
          <div className="w-full lg:w-[420px] shrink-0 sticky top-6 self-start">
            <div className="nb-border nb-shadow rounded-[var(--radius)] bg-white overflow-hidden">
              {/* Panel Header */}
              <div className={`px-5 py-3.5 border-b-[3px] border-black flex items-center justify-between ${
                isEditing ? "bg-[var(--nb-yellow)]" : "bg-[var(--nb-green)]"
              }`}>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">
                    {isEditing ? "✏️ Edit Opsi" : "➕ Tambah Opsi Baru"}
                  </h3>
                  {isEditing && (
                    <p className="text-[10px] font-mono opacity-70 mt-0.5">
                      ID: {(panel as DropdownOption).id}
                    </p>
                  )}
                </div>
                <button
                  onClick={closePanel}
                  className="nb-border nb-shadow-sm nb-press rounded-[var(--radius)] bg-white/80 p-1.5 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-5 space-y-4">

                {/* Group Key */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Grup <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.groupKey}
                      onChange={(e) => setForm((f) => ({ ...f, groupKey: e.target.value }))}
                      className="nb-border nb-shadow-sm rounded-[var(--radius)] bg-white text-sm font-semibold px-3 py-2.5 w-full appearance-none outline-none pr-8"
                    >
                      <option value="">-- Pilih Grup --</option>
                      {allGroups.map((g) => (
                        <option key={g} value={g}>
                          {getMeta(g).emoji} {getMeta(g).label}
                        </option>
                      ))}
                      <option value="__new__">➕ Buat Grup Baru…</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-muted-foreground" />
                  </div>
                  {form.groupKey === "__new__" && (
                    <input
                      value={customGroup}
                      onChange={(e) => setCustomGroup(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      placeholder="Nama group key baru (mis: gaya_affiliate)"
                      className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm font-mono px-3 py-2 w-full outline-none mt-2"
                    />
                  )}
                </div>

                {/* Label */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Label Tampilan <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="mis: 🎨 Neubrutalism Modern"
                    className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm font-semibold px-3 py-2.5 w-full outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Bisa diawali emoji, mis: 🎨 Nama Gaya
                  </p>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Value (key internal) <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                      }))
                    }
                    placeholder="mis: neubrutalism"
                    className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm font-mono px-3 py-2.5 w-full outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Hanya huruf kecil & underscore. Dikirim ke AI saat generate.
                  </p>
                </div>

                {/* Helper Text */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    value={form.helperText}
                    onChange={(e) => setForm((f) => ({ ...f, helperText: e.target.value }))}
                    placeholder="mis: Border hitam tebal, warna kontras solid."
                    rows={2}
                    className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm px-3 py-2 w-full outline-none resize-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                {/* Icon / URL */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Ikon / URL Preview Gambar
                  </label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="Emoji (🎨) atau URL https://…"
                    className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm px-3 py-2.5 w-full outline-none focus:ring-2 focus:ring-black/20"
                  />
                  {/* Instant image preview */}
                  {form.icon?.startsWith("http") && (
                    <div className="mt-2 nb-border rounded-[var(--radius)] overflow-hidden">
                      <div className="text-[9px] bg-black text-white font-mono uppercase px-2 py-1">
                        Preview Gambar
                      </div>
                      <img
                        src={form.icon}
                        alt="preview"
                        className="w-full max-h-36 object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </div>
                  )}
                  {form.icon && !form.icon.startsWith("http") && (
                    <div className="mt-2 text-center text-3xl py-2 nb-border rounded-[var(--radius)] bg-gray-50">
                      {form.icon}
                    </div>
                  )}
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1.5 tracking-wider">
                    Urutan (Sort Order)
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="nb-border nb-shadow-sm rounded-[var(--radius)] text-sm px-3 py-2.5 w-full outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || !canSave}
                  className="w-full nb-border nb-shadow nb-press rounded-[var(--radius)] bg-black text-white font-black uppercase text-sm py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saveMut.isPending
                    ? "Menyimpan…"
                    : isEditing
                    ? "Simpan Perubahan"
                    : "Tambahkan Opsi"}
                </button>

                {!canSave && (
                  <p className="text-[10px] text-center text-muted-foreground -mt-2">
                    * Grup, Label, dan Value wajib diisi
                  </p>
                )}
              </div>
            </div>

            {/* Floating add-group hint */}
            {!isEditing && (
              <div className="mt-3 nb-border rounded-[var(--radius)] bg-gray-50 px-4 py-2.5 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">
                  Pilih <strong>Buat Grup Baru…</strong> dari dropdown Grup untuk menambah kategori dropdown baru.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
