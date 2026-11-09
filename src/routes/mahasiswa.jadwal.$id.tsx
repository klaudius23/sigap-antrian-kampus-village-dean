import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/sigap/common";
import { TicketCard } from "@/components/sigap/TicketCard";
import { api } from "@/lib/api";
import { fmtTime } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mahasiswa/jadwal/$id")({
  head: () => ({ meta: [{ title: "Pesan Slot — SIGAP-VD" }, { name: "description", content: "Pilih tanggal dan jam verifikasi di kantor Village Dean." }, { property: "og:title", content: "Pesan Slot — SIGAP-VD" }, { property: "og:description", content: "Pilih jadwal verifikasi." }] }),
  component: Booking,
});

function Booking() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [date, setDate] = useState<Date>(() => { const d = addDays(new Date(), 1); return d.getDay() === 6 ? addDays(d, 2) : d.getDay() === 0 ? addDays(d, 1) : d; });
  const [slotId, setSlotId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const dateStr = format(date, "yyyy-MM-dd");

  const app = useQuery({ queryKey: ["application", id], queryFn: () => api.getApplication(id) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.getSettings });
  const slots = useQuery({ queryKey: ["slots", dateStr], queryFn: () => api.slots(dateStr) });

  const invalidate = () => Promise.all([qc.invalidateQueries({ queryKey: ["application", id] }), qc.invalidateQueries({ queryKey: ["applications"] }), qc.invalidateQueries({ queryKey: ["slots"] })]);
  const appt = app.data?.appointment;

  const book = useMutation({
    mutationFn: () => (appt ? api.reschedule(id, appt.ticket_id, slotId!) : api.book(id, slotId!)),
    onSuccess: async () => { await invalidate(); setEditing(false); setSlotId(null); toast.success(appt ? "Jadwal berhasil diubah" : "Slot berhasil dipesan"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const cancel = useMutation({
    mutationFn: () => api.cancel(id, appt!.ticket_id),
    onSuccess: async () => { await invalidate(); toast.success("Jadwal dibatalkan"); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (app.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const deadlineH = settings.data?.reschedule_deadline_hours ?? 12;
  const canChange = appt ? new Date(appt.slot_start).getTime() - Date.now() > deadlineH * 3600_000 : true;

  if (appt && !editing) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <PageHeader title="Tiket Anda" desc="Datang 10 menit sebelum jadwal dan lakukan check-in." />
        <TicketCard appt={appt} />
        {canChange ? (
          <div className="flex flex-wrap gap-2">
            <Button size="lg" variant="outline" onClick={() => setEditing(true)}>Ubah jadwal</Button>
            <Button size="lg" variant="ghost" className="text-destructive" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Batalkan
            </Button>
          </div>
        ) : <p className="text-sm text-muted-foreground">Batas waktu ubah/batal ({deadlineH} jam sebelum jadwal) sudah lewat.</p>}
        <p className="text-xs text-muted-foreground">Perubahan jadwal dapat dilakukan paling lambat {deadlineH} jam sebelum jadwal.</p>
        <Button asChild variant="link" className="px-0"><Link to="/mahasiswa">Kembali ke beranda</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={appt ? "Ubah jadwal" : "Pesan slot verifikasi"} desc="Pilih tanggal lalu pilih jam yang masih tersedia." />
      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        <Card className="mx-auto w-fit"><CardContent className="p-2">
          <Calendar mode="single" selected={date} locale={localeId} onSelect={(d) => { if (d) { setDate(d); setSlotId(null); } }}
            disabled={(d) => d < new Date(new Date().toDateString()) || d.getDay() === 0 || d.getDay() === 6 || d > addDays(new Date(), 30)}
            className="pointer-events-auto p-3" />
        </CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{format(date, "EEEE, d MMMM yyyy", { locale: localeId })}</CardTitle></CardHeader>
          <CardContent>
            {slots.isLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : !slots.data?.length ? (
              <EmptyState title="Tidak ada slot" desc="Tidak ada layanan pada tanggal ini. Pilih tanggal lain." />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Pilih slot">
                {slots.data.map((s) => {
                  const full = s.remaining <= 0;
                  return (
                    <button key={s.id} type="button" role="radio" aria-checked={slotId === s.id} disabled={full} onClick={() => setSlotId(s.id)}
                      className={cn("min-h-16 rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        full ? "cursor-not-allowed bg-muted text-muted-foreground opacity-60" : "hover:border-primary",
                        slotId === s.id && "border-primary bg-secondary ring-1 ring-primary")}>
                      <span className="block font-semibold">{fmtTime(s.start)}–{fmtTime(s.end)}</span>
                      <span className={cn("text-xs", s.remaining === 1 ? "text-warning-foreground" : "text-muted-foreground")}>{full ? "Penuh" : `Sisa ${s.remaining} kuota`}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="lg" disabled={!slotId || book.isPending} onClick={() => book.mutate()}>{book.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{appt ? "Simpan jadwal baru" : "Pesan slot"}</Button>
              {appt && <Button size="lg" variant="outline" onClick={() => setEditing(false)}>Batal</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
