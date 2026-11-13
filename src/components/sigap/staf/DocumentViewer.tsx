import { useState } from "react";
import { FileText, ImageIcon } from "lucide-react";
import { EmptyState } from "../common";
import type { UploadedDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND: Record<UploadedDocument["kind"], string> = { domisili: "Surat domisili kelurahan", pendukung: "Dokumen pendukung" };
const fmtSize = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`);

export function DocumentViewer({ docs }: { docs: UploadedDocument[] }) {
  const [sel, setSel] = useState(0);
  if (!docs.length) return <EmptyState title="Belum ada dokumen" desc="Mahasiswa belum mengunggah dokumen apa pun." />;
  const d = docs[Math.min(sel, docs.length - 1)];
  const isImg = d.mime.startsWith("image/");
  return (
    <div className="grid gap-3 md:grid-cols-[220px_1fr]">
      <ul className="space-y-2" aria-label="Daftar dokumen">
        {docs.map((x, i) => (
          <li key={x.id}>
            <button type="button" onClick={() => setSel(i)}
              className={cn("flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted", i === sel && "border-primary bg-secondary")}
              aria-pressed={i === sel}>
              {x.mime.startsWith("image/") ? <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
              <span className="min-w-0"><span className="block truncate font-medium">{x.name}</span><span className="text-xs text-muted-foreground">{KIND[x.kind]} · {fmtSize(x.size)}</span></span>
            </button>
          </li>
        ))}
      </ul>
      <div className="grid min-h-64 place-items-center overflow-hidden rounded-lg border bg-muted">
        {d.url ? (
          isImg ? <img src={d.url} alt={d.name} className="max-h-[480px] w-full object-contain" /> : <iframe src={d.url} title={d.name} className="h-[480px] w-full" />
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-2 h-10 w-10 text-primary/60" />
            <p className="font-medium text-foreground">{d.name}</p>
            <p className="mt-1">Pratinjau berkas tidak tersedia dalam mode demo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
