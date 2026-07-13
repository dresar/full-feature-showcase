import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/characters")({
  component: CharactersLayout,
});

function CharactersLayout() {
  return <Outlet />;
}
