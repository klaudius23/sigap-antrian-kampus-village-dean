import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/labels";
import type { ApplicationStatus } from "@/lib/types";

export type Tone = "neutral" | "info" | "primary" | "warning" | "success" | "danger";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info-soft text-info border-info/30",
  primary: "bg-secondary text-primary border-primary/30",
  warning: "bg-warning-soft text-warning-foreground border-warning/40",
  success: "bg-success-soft text-success border-success/30",
  danger: "bg-danger-soft text-destructive border-destructive/30",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONE[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-secondary p-3 text-primary"><Inbox className="h-6 w-6" /></div>
      <p className="font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

const STEPS: { key: ApplicationStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "menunggu_verifikasi", label: "Menunggu verifikasi" },
  { key: "dijadwalkan", label: "Dijadwalkan" },
  { key: "disetujui", label: "Keputusan" },
];

export function StatusStepper({ status }: { status: ApplicationStatus }) {
  const idx = status === "perlu_revisi" ? 1 : status === "ditolak" ? 3 : STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Tahapan pengajuan">
      {STEPS.map((s, i) => {
        const done = i < idx || (i === idx && (status === "disetujui"));
        const current = i === idx;
        let label = s.label;
        if (i === 3 && status === "disetujui") label = "Disetujui";
        if (i === 3 && status === "ditolak") label = "Ditolak";
        if (i === 1 && status === "perlu_revisi") label = "Perlu revisi";
        const tone =
          current && status === "perlu_revisi" ? "bg-warning" : current && status === "ditolak" ? "bg-destructive" : done || current ? "bg-primary" : "bg-border";
        return (
          <li key={s.key} className="flex flex-col gap-2" aria-current={current ? "step" : undefined}>
            <div className={cn("h-2 rounded-full", tone)} />
            <span className={cn("text-xs leading-tight", current ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
