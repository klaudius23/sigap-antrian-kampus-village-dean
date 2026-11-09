import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2, Home } from "lucide-react";
import { RoleLayout } from "@/components/sigap/AppShell";

export const Route = createFileRoute("/mahasiswa")({
  ssr: false,
  head: () => ({ meta: [{ title: "Portal Mahasiswa — SIGAP-VD" }, { name: "description", content: "Pantau status pengajuan hunian outsider Anda." }] }),
  component: () => (
    <RoleLayout role="mahasiswa" nav={[
      { to: "/mahasiswa", label: "Beranda", icon: <Home className="h-5 w-5" /> },
      { to: "/mahasiswa/pengajuan", label: "Pengajuan baru", icon: <FilePlus2 className="h-5 w-5" /> },
    ]} />
  ),
});
