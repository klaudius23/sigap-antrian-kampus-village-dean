import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pill } from "./common";
import { ELIGIBILITY_LABEL } from "@/lib/labels";
import type { Prescreen } from "@/lib/types";

export function PrescreenCard({ data, showAnomalies }: { data: Prescreen; showAnomalies?: boolean }) {
  const docOk = data.documents.status === "lengkap";
  const el = data.eligibility;
  const tone = el.label === "layak" ? "success" : el.label === "perlu_review" ? "warning" : "danger";
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3"><CardTitle className="text-lg">Hasil Pra-verifikasi</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <section>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Kelengkapan dokumen</span>
            <Pill tone={docOk ? "success" : "warning"}>{docOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{docOk ? "Lengkap" : "Perlu perbaikan"}</Pill>
          </div>
          {data.documents.reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{data.documents.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          )}
        </section>
        <section>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Rekomendasi kelayakan</span>
            <Pill tone={tone}>{ELIGIBILITY_LABEL[el.label]}</Pill>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={el.confidence * 100} aria-label="Tingkat keyakinan" className="h-2.5" />
            <span className="w-12 text-right text-sm font-semibold tabular-nums">{Math.round(el.confidence * 100)}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tingkat keyakinan sistem</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{el.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
        {showAnomalies && data.anomalies.length > 0 && (
          <section className="rounded-lg border border-warning/40 bg-warning-soft p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground"><AlertTriangle className="h-4 w-4" />Tanda anomali</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-warning-foreground">{data.anomalies.map((a) => <li key={a}>{a}</li>)}</ul>
          </section>
        )}
        <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0" />Ini rekomendasi sistem, keputusan akhir ada pada staf Village Dean.</p>
      </CardContent>
    </Card>
  );
}
