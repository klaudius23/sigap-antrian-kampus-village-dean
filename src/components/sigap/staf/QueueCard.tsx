import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, FileSearch, Megaphone, PauseCircle, SkipForward, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "../common";
import { fmtTime } from "@/lib/labels";
import type { QueueItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type QueueAction = "call" | "skip" | "defer" | "finish";

export function QueueCard({ item, eta, busy, onAction }: { item: QueueItem; eta?: number; busy?: boolean; onAction: (a: QueueAction) => void }) {
  const waiting = item.state === "menunggu" || item.state === "ditunda";
  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-4 shadow-soft transition-colors",
        item.state === "dilayani" && "border-primary/40 ring-2 ring-primary/15",
        item.state === "tidak_hadir" && "border-destructive/30 bg-danger-soft/40",
        item.state === "ditunda" && "border-warning/40",
      )}
      aria-label={`Antrean ${item.queue_no}, ${item.student_name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold tracking-tight text-primary">{item.queue_no}</p>
          <p className="truncate font-semibold">{item.student_name}</p>
          <p className="font-mono text-xs text-muted-foreground">{item.nim}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Loket {item.counter}</p>
          <p>Slot {fmtTime(item.slot_start)}</p>
          {waiting && eta !== undefined && <p className="mt-1 flex items-center justify-end gap-1"><Clock className="h-3 w-3" />~{eta} mnt</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.state === "tidak_hadir" && <Pill tone="danger"><UserX className="h-3 w-3" />Tidak hadir</Pill>}
        {item.state === "ditunda" && <Pill tone="warning"><PauseCircle className="h-3 w-3" />Ditunda</Pill>}
        {item.state !== "selesai" && item.state !== "tidak_hadir" && (
          item.checked_in ? <Pill tone="success"><CheckCircle2 className="h-3 w-3" />Sudah check-in</Pill> : <Pill>Belum check-in</Pill>
        )}
        {item.walk_in && <Pill tone="info">Walk-in</Pill>}
        {item.state === "selesai" && <Pill tone="success">Selesai</Pill>}
      </div>
      {waiting && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button size="sm" onClick={() => onAction("call")} disabled={busy}><Megaphone className="h-4 w-4" />Panggil</Button>
          <Button size="sm" variant="outline" onClick={() => onAction("skip")} disabled={busy}><SkipForward className="h-4 w-4" />Lewati</Button>
          <Button size="sm" variant="outline" onClick={() => onAction("defer")} disabled={busy || item.state === "ditunda"}><PauseCircle className="h-4 w-4" />Tunda</Button>
        </div>
      )}
      {item.state === "dilayani" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" asChild><Link to="/staf/tinjau/$id" params={{ id: item.application_id }}><FileSearch className="h-4 w-4" />Tinjau</Link></Button>
          <Button size="sm" variant="outline" onClick={() => onAction("finish")} disabled={busy}><CheckCircle2 className="h-4 w-4" />Selesai</Button>
        </div>
      )}
      {item.state === "tidak_hadir" && (
        <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={() => onAction("call")} disabled={busy}><Megaphone className="h-4 w-4" />Panggil ulang</Button>
      )}
    </article>
  );
}
