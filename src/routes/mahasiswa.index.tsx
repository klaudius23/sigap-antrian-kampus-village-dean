import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, FilePlus2, MessageSquareWarning, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, StatusBadge, StatusStepper } from "@/components/sigap/common";
import { TicketCard } from "@/components/sigap/TicketCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { HOUSING_LABEL, fmtDate } from "@/lib/labels";

export const Route = createFileRoute("/mahasiswa/")({
  head: () => ({ meta: [{ title: "Beranda Mahasiswa — SIGAP-VD" }, { name: "description", content: "Status pengajuan hunian dan tiket antrean Anda." }, { property: "og:title", content: "Beranda Mahasiswa — SIGAP-VD" }, { property: "og:description", content: "Status pengajuan hunian dan tiket antrean Anda." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["applications", "mine"], queryFn: api.myApplications });
  const current = data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${user?.name.split(" ")[0]} 👋`} desc="Pantau status pengajuan hunian outsider Anda di sini." />
      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-xl" /></div>
      ) : isError ? (
        <EmptyState title="Gagal memuat data" desc="Periksa koneksi Anda lalu coba lagi." action={<Button onClick={() => refetch()}>Coba lagi</Button>} />
      ) : !current ? (
        <EmptyState title="Belum ada pengajuan" desc="Mulai pengajuan hunian outsider Anda. Hanya butuh sekitar 5 menit."
          action={<Button asChild size="lg"><Link to="/mahasiswa/pengajuan"><FilePlus2 className="h-4 w-4" />Buat pengajuan</Link></Button>} />
      ) : (
        <>
          <Card className="shadow-soft">
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">Pengajuan aktif</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{HOUSING_LABEL[current.housing_type]} · {current.kind === "baru" ? "Baru" : "Perpanjangan"}</p>
              </div>
              <StatusBadge status={current.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <StatusStepper status={current.status} />
              {current.status === "perlu_revisi" && (
                <div className="rounded-lg border border-warning/40 bg-warning-soft p-4">
                  <p className="flex items-center gap-2 font-semibold text-warning-foreground"><MessageSquareWarning className="h-4 w-4" />Catatan staf</p>
                  <p className="mt-1 text-sm text-warning-foreground">{current.staff_notes}</p>
                  <Button asChild className="mt-3"><Link to="/mahasiswa/pengajuan" search={{ id: current.id }}>Perbaiki & kirim ulang</Link></Button>
                </div>
              )}
              {current.status === "ditolak" && current.decision_reason && (
                <p className="rounded-lg bg-danger-soft p-3 text-sm text-destructive">Alasan: {current.decision_reason}. Silakan hubungi kantor asrama untuk penempatan.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {current.status === "draft" && <Button asChild><Link to="/mahasiswa/pengajuan" search={{ id: current.id }}>Lanjutkan draft</Link></Button>}
                {["menunggu_verifikasi", "dijadwalkan", "perlu_revisi"].includes(current.status) && (
                  <Button asChild variant="outline"><Link to="/mahasiswa/hasil/$id" params={{ id: current.id }}>Lihat pra-verifikasi</Link></Button>
                )}
                {current.status === "menunggu_verifikasi" && (
                  <Button asChild><Link to="/mahasiswa/jadwal/$id" params={{ id: current.id }}><CalendarClock className="h-4 w-4" />Pesan slot</Link></Button>
                )}
                {current.status === "dijadwalkan" && current.appointment && (
                  <Button asChild variant="outline"><Link to="/mahasiswa/jadwal/$id" params={{ id: current.id }}><Ticket className="h-4 w-4" />Ubah jadwal</Link></Button>
                )}
              </div>
            </CardContent>
          </Card>
          {current.status === "dijadwalkan" && current.appointment && <TicketCard appt={current.appointment} />}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Riwayat pengajuan</h2>
            <ul className="divide-y rounded-xl border bg-card">
              {data!.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{HOUSING_LABEL[a.housing_type]}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(a.created_at)} · {a.kind === "baru" ? "Baru" : "Perpanjangan"}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
