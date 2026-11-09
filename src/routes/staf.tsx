import { createFileRoute } from "@tanstack/react-router";
import { RoleLayout } from "@/components/sigap/AppShell";

export const Route = createFileRoute("/staf")({
  ssr: false,
  head: () => ({ meta: [{ title: "Staf — SIGAP-VD" }, { name: "description", content: "Halaman staf SIGAP-VD." }, { property: "og:title", content: "Staf — SIGAP-VD" }, { property: "og:description", content: "Halaman staf SIGAP-VD." }] }),
  component: () => <RoleLayout role="staf" nav={[]} />,
});
