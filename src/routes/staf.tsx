import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ClipboardList, ListOrdered } from "lucide-react";
import { RoleLayout } from "@/components/sigap/AppShell";

export const Route = createFileRoute("/staf")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard Staf — SIGAP-VD" },
      { name: "description", content: "Kelola antrean, tinjau pengajuan hunian outsider, dan lihat laporan layanan Village Dean." },
      { property: "og:title", content: "Dashboard Staf — SIGAP-VD" },
      { property: "og:description", content: "Kelola antrean, tinjau pengajuan hunian outsider, dan lihat laporan layanan Village Dean." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RoleLayout role="staf" wide nav={[
      { to: "/staf", label: "Antrean", icon: <ListOrdered className="h-5 w-5" /> },
      { to: "/staf/pengajuan", label: "Pengajuan", icon: <ClipboardList className="h-5 w-5" /> },
      { to: "/staf/laporan", label: "Laporan", icon: <BarChart3 className="h-5 w-5" /> },
    ]} />
  ),
});
