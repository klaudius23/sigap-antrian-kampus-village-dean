import { QRCodeSVG } from "qrcode.react";
import { Clock, MapPin } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/labels";

export function TicketCard({ appt }: { appt: Appointment }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="bg-gradient-brand px-5 py-4 text-primary-foreground">
        <p className="text-xs font-medium uppercase tracking-wider opacity-90">Tiket Antrean Virtual</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{appt.queue_no}</p>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto rounded-xl border bg-card p-3">
          <QRCodeSVG value={appt.qr_payload} size={148} aria-label="Kode QR tiket" />
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-muted-foreground">Tanggal</dt><dd className="font-semibold">{fmtDate(appt.slot_start)}</dd></div>
          <div><dt className="text-muted-foreground">Jam</dt><dd className="font-semibold">{fmtTime(appt.slot_start)} WITA</dd></div>
          <div><dt className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Loket</dt><dd className="text-xl font-bold text-primary">{appt.counter}</dd></div>
          <div><dt className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />Estimasi layanan</dt><dd className="text-xl font-bold text-primary">{appt.eta_minutes} mnt</dd></div>
          <div className="col-span-2"><dt className="text-muted-foreground">ID Tiket</dt><dd className="font-mono text-xs">{appt.ticket_id}</dd></div>
        </dl>
      </div>
      <p className="border-t border-dashed px-5 py-3 text-xs text-muted-foreground">Tunjukkan QR ini ke staf saat check-in di kantor Village Dean.</p>
    </div>
  );
}
