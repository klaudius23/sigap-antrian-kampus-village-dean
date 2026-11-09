import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/sigap/common";

export const Route = createFileRoute("/admin/")({
  component: () => <EmptyState title="Segera hadir" desc="Halaman ini belum selesai dibangun." />,
});
