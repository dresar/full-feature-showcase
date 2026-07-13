import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/templates")({
  component: TemplatesLayout,
});

function TemplatesLayout() {
  return <Outlet />;
}
