import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--nb-bg)] px-4">
      <div className="nb-border nb-shadow bg-white rounded-[var(--radius)] p-8 max-w-md text-center">
        <h1 className="text-7xl">404</h1>
        <h2 className="mt-4 text-xl">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="nb-border nb-shadow-sm nb-press nb-press-hover inline-flex items-center rounded-[var(--radius)] bg-[var(--nb-yellow)] px-5 py-3 font-bold uppercase"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--nb-bg)] px-4">
      <div className="nb-border nb-shadow bg-white rounded-[var(--radius)] p-8 max-w-md text-center">
        <h1 className="text-xl">Halaman ini gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-[var(--radius)] bg-[var(--nb-pink)] px-5 py-3 font-bold uppercase text-white"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="nb-border nb-shadow-sm nb-press nb-press-hover rounded-[var(--radius)] bg-white px-5 py-3 font-bold uppercase"
          >
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Studio Prompt — Admin Dashboard" },
      {
        name: "description",
        content:
          "Admin dashboard neubrutalist untuk mengelola Studio Prompt: kunci Gemini, pengaturan, gaya visual, lisensi, dan audit log.",
      },
      { property: "og:title", content: "Studio Prompt — Admin Dashboard" },
      {
        property: "og:description",
        content: "Portal admin untuk mengelola Studio Prompt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "!nb-border !nb-shadow-sm !rounded-[var(--radius)] !bg-white !text-black !font-bold",
        }}
      />
    </QueryClientProvider>
  );
}
