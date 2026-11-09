import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Loader2, ShieldCheck, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { api, USE_MOCK } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — SIGAP-VD Universitas Klabat" },
      { name: "description", content: "Masuk ke SIGAP-VD untuk mendaftar hunian outsider, memesan slot, dan memantau antrean Village Dean." },
      { property: "og:title", content: "Masuk — SIGAP-VD Universitas Klabat" },
      { property: "og:description", content: "Pendaftaran hunian outsider online dengan tiket antrean virtual." },
    ],
  }),
  component: Login,
});

function Login() {
  const { user, ready, setSession } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) navigate({ to: homeFor(user.role), replace: true });
  }, [ready, user, navigate]);

  const doLogin = async (role?: Role) => {
    if (!role && (!id || !pw)) return toast.error("NIM/email dan kata sandi wajib diisi");
    setLoading(role ?? "form");
    try {
      const res = await api.login(id, pw, role);
      setSession(res.token, res.user);
      toast.success(`Selamat datang, ${res.user.name}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-gradient-brand p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3 text-lg font-bold"><ShieldCheck className="h-7 w-7" />SIGAP-VD</div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Tanpa antre panjang.<br />Daftar hunian outsider dari ponsel Anda.</h2>
          <p className="mt-4 max-w-md opacity-90">Smart Queue & Approval System untuk Village Dean Universitas Klabat — daftar online, dapatkan tiket virtual, dan datang sesuai jadwal.</p>
        </div>
        <p className="text-sm opacity-80">© 2026 Universitas Klabat</p>
      </aside>
      <main className="flex items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-primary-foreground"><ShieldCheck className="h-6 w-6" /></div>
            <h1 className="text-2xl font-bold">SIGAP-VD</h1>
            <p className="text-sm text-muted-foreground">Smart Queue & Approval System · Village Dean UNKLAB</p>
          </div>
          <h2 className="hidden text-2xl font-bold lg:block">Masuk</h2>
          <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
            <div className="space-y-1.5">
              <Label htmlFor="id">NIM atau email</Label>
              <Input id="id" className="h-12" value={id} onChange={(e) => setId(e.target.value)} placeholder="S22410001" autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Kata sandi</Label>
              <Input id="pw" type="password" className="h-12" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="h-12 w-full text-base" disabled={!!loading}>
              {loading === "form" && <Loader2 className="h-4 w-4 animate-spin" />}Masuk
            </Button>
          </form>
          {USE_MOCK && (
            <Card className="mt-8 border-dashed">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode demo · masuk cepat</p>
                {([
                  ["mahasiswa", "Masuk sebagai Mahasiswa", <GraduationCap key="g" className="h-4 w-4" />],
                  ["staf", "Masuk sebagai Staf", <Users key="u" className="h-4 w-4" />],
                  ["admin", "Masuk sebagai Admin", <Wrench key="w" className="h-4 w-4" />],
                ] as const).map(([r, l, icon]) => (
                  <Button key={r} variant="outline" className="h-11 w-full justify-start" disabled={!!loading} onClick={() => doLogin(r)}>
                    {loading === r ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{l}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
