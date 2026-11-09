import { createFileRoute } from "@tanstack/react-router";
import { RoleLayout } from "@/components/sigap/AppShell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — SIGAP-VD" }, { name: "description", content: "Halaman admin SIGAP-VD." }, { property: "og:title", content: "Admin — SIGAP-VD" }, { property: "og:description", content: "Halaman admin SIGAP-VD." }] }),
  component: () => <RoleLayout role="admin" nav={[]} />,
});
