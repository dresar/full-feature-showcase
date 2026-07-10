import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import { Modal } from "./_admin.keys";

export const Route = createFileRoute("/_admin/styles")({
  component: StylesPage,
});

type Style = {
  id: string;
  name: string;
  promptTemplate: string;
  previewImageUrl?: string;
};

function StylesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Style | null>(null);
  const [form, setForm] = useState<Style>({ id: "", name: "", promptTemplate: "", previewImageUrl: "" });
  const [uploading, setUploading] = useState(false);

  const { data = [], isLoading } = useQuery<Style[]>({
    queryKey: ["admin", "styles"],
    queryFn: async () => {
      const r = await api<any>("/admin/visual-styles");
      return r.data || r.styles || r;
    },
  });

  function openNew() {
    setEditing(null);
    setForm({ id: "", name: "", promptTemplate: "", previewImageUrl: "" });
    setOpen(true);
  }
  function openEdit(s: Style) {
    setEditing(s);
    setForm(s);
    setOpen(true);
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        promptTemplate: form.promptTemplate,
        previewImageUrl: form.previewImageUrl,
      };
      if (editing) return api(`/admin/visual-styles/${editing.id}`, { method: "PATCH", body });
      return api(`/admin/visual-styles`, { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(editing ? "Gaya diperbarui" : "Gaya ditambahkan");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin", "styles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/admin/visual-styles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Gaya dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "styles"] });
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
      setForm((f) => ({ ...f, previewImageUrl: url }));
      toast.success("Preview terupload");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">🎨 Pustaka Gaya Visual</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Katalog template prompt gaya visual.
          </p>
        </div>
        <button onClick={openNew} className={`${nb.btn} ${nb.btnPink}`}>
          <Plus className="w-4 h-4" /> Tambah Gaya
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className={`${nb.card} p-6 text-center col-span-full text-muted-foreground`}>
            Memuat…
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className={`${nb.card} p-6 text-center col-span-full text-muted-foreground`}>
            Belum ada gaya.
          </div>
        )}
        {data.map((s) => (
          <div key={s.id} className={`${nb.card} overflow-hidden flex flex-col`}>
            <div className="aspect-video bg-muted border-b-[3px] border-black overflow-hidden">
              {s.previewImageUrl ? (
                <img src={s.previewImageUrl} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-mono">
                  Tanpa preview
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h4 className="text-lg mb-1">{s.name}</h4>
              <p className="text-xs font-mono text-muted-foreground line-clamp-3 flex-1">
                {s.promptTemplate}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(s)}
                  className={`${nb.btn} ${nb.btnYellow} !py-2 !px-3 !text-xs flex-1`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => confirm("Hapus gaya?") && deleteMut.mutate(s.id)}
                  className={`${nb.btn} bg-red-500 text-white !py-2 !px-3 !text-xs`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? "Edit Gaya" : "Tambah Gaya"}>
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
              <label className={nb.label}>Preview</label>
              <div className="nb-border rounded-[var(--radius)] bg-muted p-3 space-y-2">
                {form.previewImageUrl && (
                  <img
                    src={form.previewImageUrl}
                    alt="preview"
                    className="w-full aspect-video object-cover nb-border rounded-md"
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
              className={`${nb.btn} ${nb.btnGreen} w-full`}
            >
              {saveMut.isPending ? "MENYIMPAN…" : "SIMPAN GAYA"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
