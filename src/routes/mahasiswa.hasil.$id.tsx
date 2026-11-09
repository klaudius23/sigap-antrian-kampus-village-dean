import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/sigap/common";
import { PrescreenCard } from "@/components/sigap/PrescreenCard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/mahasiswa/hasil/$id")({
  head: () => ({ meta: [{ title: "Hasil Pra-verifikasi — SIGAP-VD" }, { name: "description", content: "Hasil pemeriksaan otomatis dokumen dan kelayakan." }, { property: "og:title", content: "Hasil Pra-verifikasi — SIGAP-VD" }, { property: "og:description", content: "Hasil pemeriksaan otomatis." }] }),
  component: Result,
});

function Result() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["prescreen", id], queryFn: () => api.prescreen(id) });
  const app = useQuery({ queryKey: ["application", id], queryFn: () => api.getApplication(id) });
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Pengajuan terkirim" desc="Sistem telah melakukan pemeriksaan awal terhadap pengajuan Anda." />
      {q.isLoading ? <Skeleton className="h-80 w-full rounded-xl" /> : q.isError ? (
        <EmptyState title="Pra-verifikasi gagal dimuat" action={<Button onClick={() => q.refetch()}>Coba lagi</Button>} />
      ) : <PrescreenCard data={q.data!} />}
      <div className="flex flex-wrap gap-2">
        {app.data?.status === "menunggu_verifikasi" && (
          <Button asChild size="lg"><Link to="/mahasiswa/jadwal/$id" params={{ id }}><CalendarClock className="h-4 w-4" />Pesan slot verifikasi</Link></Button>
        )}
        <Button asChild size="lg" variant="outline"><Link to="/mahasiswa">Ke beranda</Link></Button>
      </div>
    </div>
  );
}
