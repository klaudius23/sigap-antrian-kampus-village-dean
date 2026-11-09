import { useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_BYTES = 5 * 1024 * 1024;

export function validateFile(f: File): string | null {
  if (!ALLOWED.includes(f.type)) return "Format harus PDF, JPG, atau PNG";
  if (f.size > MAX_BYTES) return "Ukuran file maksimal 5 MB";
  return null;
}

export function FileDrop({ id, label, required, file, existingName, onChange }: {
  id: string; label: string; required?: boolean; file: File | null; existingName?: string; onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f?: File) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) return toast.error(err);
    onChange(f);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input ref={ref} id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {file ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {file.type.startsWith("image/") && preview ? (
            <img src={preview} alt={`Pratinjau ${file.name}`} className="max-h-56 w-full bg-muted object-contain" />
          ) : preview ? (
            <object data={preview} type="application/pdf" className="h-56 w-full bg-muted" aria-label={`Pratinjau ${file.name}`} />
          ) : null}
          <div className="flex items-center gap-2 p-3">
            <FileText className="h-4 w-4 text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
            <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}><RefreshCw className="h-3.5 w-3.5" />Ganti</Button>
            <Button type="button" size="icon" variant="ghost" aria-label="Hapus file" onClick={() => onChange(null)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card p-6 text-center hover:border-primary hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">{existingName ? `Terunggah: ${existingName} — ketuk untuk mengganti` : "Ketuk untuk memilih file"}</span>
          <span className="text-xs text-muted-foreground">PDF, JPG, PNG · maks. 5 MB</span>
        </button>
      )}
    </div>
  );
}
