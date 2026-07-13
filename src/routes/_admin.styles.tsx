import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/styles")({
  component: StylesLayout,
});

function StylesLayout() {
  return <Outlet />;
}
