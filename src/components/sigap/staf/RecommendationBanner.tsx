import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextRecommendation } from "@/lib/types";

export function RecommendationBanner({ rec, busy, onAccept, onIgnore }: { rec: NextRecommendation; busy?: boolean; onAccept: () => void; onIgnore: () => void }) {
  return (
    <section className="flex h-full flex-col justify-between gap-3 rounded-xl border border-primary/30 bg-secondary p-4" aria-label="Rekomendasi urutan berikutnya">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />Rekomendasi urutan berikutnya</p>
        <p className="mt-1 text-lg font-bold">{rec.queue_no} · {rec.student_name} <span className="text-sm font-medium text-muted-foreground">→ Loket {rec.counter}</span></p>
        <p className="mt-1 text-sm text-secondary-foreground">{rec.reason}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept} disabled={busy}><Check className="h-4 w-4" />Terima & panggil</Button>
        <Button size="sm" variant="outline" onClick={onIgnore} disabled={busy}><X className="h-4 w-4" />Abaikan</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Pilihan Anda dicatat di log audit.</p>
    </section>
  );
}
