import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/users")({
  component: UsersLayout,
});

function UsersLayout() {
  return <Outlet />;
}
