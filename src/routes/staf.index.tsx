import { useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Hourglass, Megaphone, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EmptyState, PageHeader } from "@/components/sigap/common";
import { CheckinForm } from "@/components/sigap/staf/CheckinForm";
import { QueueCard, type QueueAction } from "@/components/sigap/staf/QueueCard";
import { RecommendationBanner } from "@/components/sigap/staf/RecommendationBanner";
import { WalkinDialog } from "@/components/sigap/staf/WalkinDialog";
import { api } from "@/lib/api";
import { fmtTime } from "@/lib/labels";
import { boardSummary, columnOf, counterStats, sortWaiting, waitingEta } from "@/lib/staff";
import type { QueueItem } from "@/lib/types";

export const Route = createFileRoute("/staf/")({
  head: () => ({
    meta: [
      { title: "Papan Antrean Live — SIGAP-VD" },
      { name: "description", content: "Pantau dan kelola antrean layanan Village Dean secara langsung per loket." },
      { property: "og:title", content: "Papan Antrean Live — SIGAP-VD" },
      { property: "og:description", content: "Pantau dan kelola antrean layanan Village Dean secara langsung per loket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QueueBoard,
});

const POLL_MS = 5000;
const ACTION_MSG: Record<QueueAction, string> = { call: "dipanggil", skip: "ditandai tidak hadir", defer: "ditunda", finish: "selesai dilayani" };

function QueueBoard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [counter, setCounter] = useState("semua");
  const [dismissed, setDismissed] = useState<string | null>(null);
  const queue = useQuery({ queryKey: ["queue", "board"], queryFn: api.queue, refetchInterval: POLL_MS });
  const rec = useQuery({ queryKey: ["queue", "next"], queryFn: api.nextRecommendation, refetchInterval: POLL_MS });

  const action = useMutation({
    mutationFn: ({ item, a }: { item: QueueItem; a: QueueAction }) => api.queueAction(item.id, a),
    onSuccess: (q, { a }) => {
      qc.invalidateQueries({ queryKey: ["queue"] });
      if (a === "call") {
        toast.success(`${q.queue_no} — ${q.student_name} dipanggil ke Loket ${q.counter}`, {
          action: { label: "Buka tinjauan", onClick: () => navigate({ to: "/staf/tinjau/$id", params: { id: q.application_id } }) },
        });
      } else toast.success(`${q.queue_no} ${ACTION_MSG[a]}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const respond = useMutation({
    mutationFn: async (accepted: boolean) => {
      const r = rec.data!;
      await api.logRecommendation(r.queue_no, accepted);
      if (accepted) return api.queueAction(r.queue_id, "call");
      return null;
    },
    onSuccess: (q, accepted) => {
      if (!accepted) { setDismissed(rec.data?.queue_no ?? null); toast("Rekomendasi diabaikan dan dicatat"); return; }
      qc.invalidateQueries({ queryKey: ["queue"] });
      if (q) toast.success(`${q.queue_no} — ${q.student_name} dipanggil ke Loket ${q.counter}`, {
        action: { label: "Buka tinjauan", onClick: () => navigate({ to: "/staf/tinjau/$id", params: { id: q.application_id } }) },
      });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (queue.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-xl" />)}</div>
      </div>
    );
  }
  if (queue.isError || !queue.data) {
    return <EmptyState title="Gagal memuat antrean" desc="Periksa koneksi lalu coba lagi." action={<Button onClick={() => queue.refetch()}>Coba lagi</Button>} />;
  }

  const { items, counters, avg_service_minutes: avg } = queue.data;
  const visible = counter === "semua" ? items : items.filter((q) => q.counter === Number(counter));
  const summary = boardSummary(visible, counter === "semua" ? counters : 1, avg);
  const perCounter = counterStats(items, counters, avg);
  const eta = waitingEta(items, avg);
  const cols = {
    menunggu: sortWaiting(visible.filter((q) => columnOf(q.state) === "menunggu")),
    dilayani: visible.filter((q) => q.state === "dilayani"),
    selesai: visible.filter((q) => columnOf(q.state) === "selesai").reverse(),
  };
  const showRec = rec.data && rec.data.queue_no !== dismissed;
  const busy = action.isPending || respond.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papan Antrean"
        desc={`Diperbarui otomatis setiap ${POLL_MS / 1000} detik · terakhir ${fmtTime(new Date(queue.dataUpdatedAt).toISOString())}`}
        action={<WalkinDialog counters={counters} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CheckinForm />
        {showRec ? (
          <RecommendationBanner rec={rec.data!} busy={busy} onAccept={() => respond.mutate(true)} onIgnore={() => respond.mutate(false)} />
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Belum ada rekomendasi urutan berikutnya.</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Hourglass className="h-4 w-4" />} label="Menunggu" value={summary.waiting} />
        <Stat icon={<Megaphone className="h-4 w-4" />} label="Sedang dilayani" value={summary.serving} />
        <Stat icon={<UserX className="h-4 w-4" />} label="Tidak hadir" value={summary.noShow} tone="danger" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Estimasi sisa waktu" value={`~${summary.remainingMinutes} mnt`} />
      </div>

      <section aria-label="Ringkasan per loket" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Tampilan loket</h2>
          <ToggleGroup type="single" value={counter} onValueChange={(v) => v && setCounter(v)} variant="outline" aria-label="Filter loket">
            <ToggleGroupItem value="semua" className="px-3">Semua</ToggleGroupItem>
            {perCounter.map((c) => <ToggleGroupItem key={c.counter} value={String(c.counter)} className="px-3">Loket {c.counter}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {perCounter.map((c) => (
            <button key={c.counter} type="button" onClick={() => setCounter(String(c.counter))}
              className={`rounded-xl border bg-card p-4 text-left shadow-soft hover:border-primary/40 ${counter === String(c.counter) ? "border-primary ring-2 ring-primary/15" : ""}`}>
              <div className="flex items-center justify-between"><span className="font-semibold">Loket {c.counter}</span><span className="text-xs text-muted-foreground">{c.waiting} menunggu · ~{c.remainingMinutes} mnt</span></div>
              <p className="mt-2 text-sm text-muted-foreground">Sedang dilayani</p>
              <p className="text-lg font-bold">{c.serving ? <><span className="text-primary">{c.serving.queue_no}</span> · {c.serving.student_name}</> : <span className="text-muted-foreground">—</span>}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Column title="Menunggu" count={cols.menunggu.length} icon={<Hourglass className="h-4 w-4" />}>
          {cols.menunggu.map((q) => <QueueCard key={q.id} item={q} eta={eta[q.id]} busy={busy} onAction={(a) => action.mutate({ item: q, a })} />)}
        </Column>
        <Column title="Sedang dilayani" count={cols.dilayani.length} icon={<Megaphone className="h-4 w-4" />} highlight>
          {cols.dilayani.map((q) => <QueueCard key={q.id} item={q} busy={busy} onAction={(a) => action.mutate({ item: q, a })} />)}
        </Column>
        <Column title="Selesai" count={cols.selesai.length} icon={<CheckCircle2 className="h-4 w-4" />}>
          {cols.selesai.map((q) => <QueueCard key={q.id} item={q} busy={busy} onAction={(a) => action.mutate({ item: q, a })} />)}
        </Column>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone?: "danger" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className={`flex items-center gap-1.5 text-xs font-medium ${tone === "danger" ? "text-destructive" : "text-muted-foreground"}`}>{icon}{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Column({ title, count, icon, highlight, children }: { title: string; count: number; icon: ReactNode; highlight?: boolean; children: ReactNode[] }) {
  return (
    <section className={`flex flex-col rounded-2xl border p-3 ${highlight ? "bg-secondary/60" : "bg-muted/50"}`} aria-label={`Kolom ${title}`}>
      <h2 className="mb-3 flex items-center justify-between px-1 font-semibold">
        <span className="flex items-center gap-2">{icon}{title}</span>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold tabular-nums">{count}</span>
      </h2>
      <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
        {children.length ? children : <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">Tidak ada antrean di kolom ini.</p>}
      </div>
    </section>
  );
}
