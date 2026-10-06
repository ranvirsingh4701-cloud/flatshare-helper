import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntryShell } from "@/components/EntryForm";
import { joinHousehold } from "@/lib/flat.functions";
import { saveMe } from "@/lib/balances";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a household — FlatSplit" },
      { name: "description", content: "Enter your flat's code to join and start splitting expenses." },
      { property: "og:title", content: "Join a household — FlatSplit" },
      { property: "og:description", content: "Enter your flat's code to join and start splitting expenses." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [me, setMe] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4 || !me.trim()) return setErr("Enter the household code and your name.");
    setBusy(true);
    setErr(null);
    try {
      const r = await joinHousehold({ data: { code, yourName: me } });
      saveMe(r.code, r.memberId);
      navigate({ to: "/h/$code", params: { code: r.code } });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <EntryShell title="Join household" subtitle="Ask a flatmate for the 6-character household code.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Household code</Label>
          <Input id="code" placeholder="e.g. K7M2QX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} className="font-mono text-lg tracking-widest uppercase" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="me">Your name</Label>
          <Input id="me" placeholder="e.g. Sam" value={me} onChange={(e) => setMe(e.target.value)} maxLength={60} />
          <p className="text-xs text-muted-foreground">Already in the flat? Use the same name to rejoin.</p>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Joining…" : "Join household"}</Button>
      </form>
    </EntryShell>
  );
}
