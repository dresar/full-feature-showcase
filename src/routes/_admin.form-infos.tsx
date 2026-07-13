import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Save, Info, Plus } from "lucide-react";

export const Route = createFileRoute("/_admin/form-infos")({
  component: FormInfosPage,
});

type FormInfo = {
  id: string;
  featureKey: string;
  title: string;
  description: string;
};

function FormInfosPage() {
  const qc = useQueryClient();

  const query = useQuery<{ data: FormInfo[] }>({
    queryKey: ["admin", "form-infos"],
    queryFn: async () => {
      const r = await api<any>("/form-infos");
      return r.data || r;
    },
  });

  const [activeItem, setActiveItem] = useState<FormInfo | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [newKey, setNewKey] = useState("");

  const save = useMutation({
    mutationFn: (key: string) => api(`/admin/form-descriptions/${key}`, { method: "PUT", body: formData }),
    onSuccess: () => {
      toast.success("Informasi form berhasil disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "form-infos"] });
      setActiveItem(null);
      setNewKey("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const list = query.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl flex items-center gap-2">
          <Info className="w-6 h-6 text-[var(--nb-pink)]" />
          Info Form Dinamis
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          Atur informasi dan bantuan yang muncul ketika tombol (1.png) di atas form diklik oleh user.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className={`${nb.card} p-5 space-y-4`}>
          <h3 className="text-lg">Daftar Form</h3>
          <div className="space-y-2">
            {list.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-md border-2 cursor-pointer ${
                  activeItem?.id === item.id ? "bg-[var(--nb-yellow)] border-black" : "border-transparent bg-gray-50 hover:border-black"
                }`}
                onClick={() => {
                  setActiveItem(item);
                  setFormData({ title: item.title, description: item.description });
                  setNewKey(item.featureKey);
                }}
              >
                <div className="font-bold">{item.featureKey}</div>
                <div className="text-sm text-gray-600 line-clamp-1">{item.description}</div>
              </div>
            ))}
            
            <button 
              className={`${nb.btn} ${nb.btnBlue} w-full mt-4`}
              onClick={() => {
                setActiveItem(null);
                setFormData({ title: "", description: "" });
                setNewKey("");
              }}
            >
              <Plus className="w-4 h-4" /> TAMBAH INFO BARU
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newKey) return toast.error("Key fitur wajib diisi");
            save.mutate(newKey);
          }}
          className={`${nb.card} p-5 space-y-4`}
        >
          <h3 className="text-lg">{activeItem ? "Edit Info" : "Buat Info Baru"}</h3>
          
          <div className="space-y-1">
            <label className="text-sm font-bold">Key Fitur (Misal: Poster, Banner)</label>
            <input
              required
              disabled={!!activeItem}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className={nb.input}
              placeholder="Contoh: Edukasi"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold">Judul Popup (Opsional)</label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={nb.input}
              placeholder="Info Poster AI..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold">Deskripsi / Penjelasan Form</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={nb.input}
              placeholder="Gunakan form ini untuk..."
            />
          </div>

          <button className={`${nb.btn} ${nb.btnGreen} w-full`} disabled={save.isPending}>
            <Save className="w-4 h-4" />
            {save.isPending ? "MENYIMPAN…" : "SIMPAN"}
          </button>
        </form>
      </div>
    </div>
  );
}
