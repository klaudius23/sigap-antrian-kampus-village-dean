import type { ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, Pill, StatusBadge } from "@/components/sigap/common";
import { PrescreenCard } from "@/components/sigap/PrescreenCard";
import { DecisionForm } from "@/components/sigap/staf/DecisionForm";
import { DocumentViewer } from "@/components/sigap/staf/DocumentViewer";
import { api } from "@/lib/api";
import { HOUSING_LABEL, STATUS_LABEL, fmtDateTime, fmtTime } from "@/lib/labels";
import { DECISION_LABEL } from "@/lib/staff";
import type { Decision } from "@/lib/types";

export const Route = createFileRoute("/staf/tinjau/$id")({
  head: () => ({
    meta: [
      { title: "Tinjau Pengajuan — SIGAP-VD" },
      { name: "description", content: "Tinjau data, dokumen, dan hasil pra-verifikasi sebelum memberi keputusan." },
      { property: "og:title", content: "Tinjau Pengajuan — SIGAP-VD" },
      { property: "og:description", content: "Tinjau data, dokumen, dan hasil pra-verifikasi sebelum memberi keputusan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Review,
});

function Review() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const app = useQuery({ queryKey: ["applications", id], queryFn: () => api.getApplication(id) });
  const pre = useQuery({ queryKey: ["prescreen", id], queryFn: () => api.prescreen(id) });

  const decide = useMutation({
    mutationFn: ({ d, reason, override }: { d: Decision; reason: string; override: boolean }) => api.decide(id, d, reason, override),
    onSuccess: async (a, { d, override }) => {
      await qc.invalidateQueries();
      toast.success(`Keputusan "${DECISION_LABEL[d]}" disimpan untuk ${a.student_name}${override ? " (override)" : ""}`);
      navigate({ to: "/staf" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (app.isLoading) return <div className="grid gap-4 lg:grid-cols-[1fr_420px]"><Skeleton className="h-[520px] rounded-xl" /><Skeleton className="h-[520px] rounded-xl" /></div>;
  if (app.isError || !app.data) return <EmptyState title="Pengajuan tidak ditemukan" desc="Pengajuan mungkin sudah dihapus." action={<Button asChild><Link to="/staf">Kembali ke antrean</Link></Button>} />;
  const a = app.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1"><Link to="/staf"><ArrowLeft className="h-4 w-4" />Kembali ke antrean</Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">{a.student_name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{a.nim}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {a.appointment && <Pill tone="primary"><Ticket className="h-3 w-3" />{a.appointment.queue_no} · Loket {a.appointment.counter} · {fmtTime(a.appointment.slot_start)}</Pill>}
          <StatusBadge status={a.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-3"><CardTitle className="text-lg">Ringkasan mahasiswa</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Jenis pengajuan" value={a.kind === "baru" ? "Baru" : "Perpanjangan"} />
                <Field label="Tipe hunian" value={HOUSING_LABEL[a.housing_type]} />
                <Field label="Alamat lengkap" value={a.address} wide />
                <Field label="Kelurahan" value={a.kelurahan} />
                <Field label="Jarak & kategori" value={<span className="flex items-center gap-2">{a.distance_km} km <Pill tone={a.category === "dekat" ? "info" : "neutral"}>Outsider {a.category === "dekat" ? "Dekat" : "Jauh"}</Pill></span>} />
                <Field label="Nama wali" value={a.guardian_name} />
                <Field label="No. HP wali" value={<span className="font-mono">{a.guardian_phone}</span>} />
                <Field label="Dikirim" value={fmtDateTime(a.created_at)} />
                <Field label="Terakhir diperbarui" value={fmtDateTime(a.updated_at)} />
              </dl>
              {(a.status === "disetujui" || a.status === "ditolak" || a.status === "perlu_revisi") && a.decision_reason && (
                <p className="mt-4 rounded-lg bg-muted p-3 text-sm"><span className="font-semibold">Keputusan sebelumnya ({STATUS_LABEL[a.status]}):</span> {a.decision_reason}</p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardHeader className="pb-3"><CardTitle className="text-lg">Dokumen</CardTitle></CardHeader>
            <CardContent><DocumentViewer docs={a.documents} /></CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {pre.isLoading ? <Skeleton className="h-80 rounded-xl" /> : pre.data ? <PrescreenCard data={pre.data} showAnomalies /> : (
            <EmptyState title="Pra-verifikasi gagal dimuat" action={<Button variant="outline" onClick={() => pre.refetch()}>Coba lagi</Button>} />
          )}
          <DecisionForm mlLabel={pre.data?.eligibility.label} pending={decide.isPending} onSubmit={(d, reason, override) => decide.mutate({ d, reason, override })} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : undefined}><dt className="text-muted-foreground">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>;
}
