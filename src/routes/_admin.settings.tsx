import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { nb } from "@/lib/nb";
import { Save, Image as ImageIcon, Cog } from "lucide-react";

export const Route = createFileRoute("/_admin/settings")({
  component: SettingsPage,
});

type AppSettings = {
  appName?: string;
  quotaDailyLimit?: number;
  footerText?: string;
  bannerPosterInfo?: string;
  bannerEnhanceInfo?: string;
};

type ImageKitSettings = {
  publicKey?: string;
  privateKey?: string;
  urlEndpoint?: string;
};

function SettingsPage() {
  const qc = useQueryClient();

  const settingsQ = useQuery<AppSettings>({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const r = await api<any>("/admin/settings");
      return r.data || r;
    },
  });

  const imgQ = useQuery<ImageKitSettings>({
    queryKey: ["admin", "imagekit"],
    queryFn: async () => {
      const r = await api<any>("/admin/imagekit-settings");
      return r.data || r;
    },
  });

  const [app, setApp] = useState<AppSettings>({});
  const [img, setImg] = useState<ImageKitSettings>({});

  useEffect(() => {
    if (settingsQ.data) setApp(settingsQ.data);
  }, [settingsQ.data]);
  useEffect(() => {
    if (imgQ.data) setImg(imgQ.data);
  }, [imgQ.data]);

  const saveApp = useMutation({
    mutationFn: () => api("/admin/settings", { method: "POST", body: app }),
    onSuccess: () => {
      toast.success("Pengaturan aplikasi disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveImg = useMutation({
    mutationFn: () => api("/admin/imagekit-settings", { method: "POST", body: img }),
    onSuccess: () => {
      toast.success("ImageKit disimpan");
      qc.invalidateQueries({ queryKey: ["admin", "imagekit"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">⚙️ Pengaturan Umum</h2>
        <p className="text-sm text-muted-foreground font-mono">
          Konfigurasi sistem & kredensial ImageKit.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveApp.mutate();
          }}
          className={`${nb.card} p-5 space-y-4`}
        >
          <div className="flex items-center gap-2">
            <div className="nb-border nb-shadow-sm bg-[var(--nb-yellow)] rounded-md p-2">
              <Cog className="w-5 h-5" />
            </div>
            <h3 className="text-lg">Sistem Aplikasi</h3>
          </div>

          <Field label="Nama Aplikasi">
            <input
              value={app.appName || ""}
              onChange={(e) => setApp({ ...app, appName: e.target.value })}
              className={nb.input}
            />
          </Field>

          <Field label="Kuota Harian">
            <input
              type="number"
              value={app.quotaDailyLimit ?? 0}
              onChange={(e) =>
                setApp({ ...app, quotaDailyLimit: Number(e.target.value) })
              }
              className={nb.input}
            />
          </Field>

          <Field label="Teks Footer">
            <input
              value={app.footerText || ""}
              onChange={(e) => setApp({ ...app, footerText: e.target.value })}
              className={nb.input}
            />
          </Field>

          <Field label="Banner Buat Poster">
            <textarea
              rows={3}
              value={app.bannerPosterInfo || ""}
              onChange={(e) => setApp({ ...app, bannerPosterInfo: e.target.value })}
              className={nb.input}
            />
          </Field>

          <Field label="Banner Percantik Foto">
            <textarea
              rows={3}
              value={app.bannerEnhanceInfo || ""}
              onChange={(e) => setApp({ ...app, bannerEnhanceInfo: e.target.value })}
              className={nb.input}
            />
          </Field>

          <button className={`${nb.btn} ${nb.btnGreen} w-full`} disabled={saveApp.isPending}>
            <Save className="w-4 h-4" />
            {saveApp.isPending ? "MENYIMPAN…" : "SIMPAN PENGATURAN"}
          </button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveImg.mutate();
          }}
          className={`${nb.card} p-5 space-y-4`}
        >
          <div className="flex items-center gap-2">
            <div className="nb-border nb-shadow-sm bg-[var(--nb-pink)] text-white rounded-md p-2">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg">Kredensial ImageKit</h3>
          </div>

          <Field label="Public Key">
            <input
              value={img.publicKey || ""}
              onChange={(e) => setImg({ ...img, publicKey: e.target.value })}
              className={`${nb.input} font-mono`}
            />
          </Field>
          <Field label="Private Key">
            <input
              type="password"
              value={img.privateKey || ""}
              onChange={(e) => setImg({ ...img, privateKey: e.target.value })}
              className={`${nb.input} font-mono`}
            />
          </Field>
          <Field label="URL Endpoint">
            <input
              value={img.urlEndpoint || ""}
              onChange={(e) => setImg({ ...img, urlEndpoint: e.target.value })}
              className={`${nb.input} font-mono`}
              placeholder="https://ik.imagekit.io/..."
            />
          </Field>

          <button className={`${nb.btn} ${nb.btnBlue} w-full`} disabled={saveImg.isPending}>
            <Save className="w-4 h-4" />
            {saveImg.isPending ? "MENYIMPAN…" : "SIMPAN IMAGEKIT"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={nb.label}>{label}</label>
      {children}
    </div>
  );
}
