import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntryShell } from "@/components/EntryForm";
import { createHousehold } from "@/lib/flat.functions";
import { saveMe } from "@/lib/balances";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a household — FlatSplit" },
      { name: "description", content: "Start a FlatSplit household and invite flatmates with a short code." },
      { property: "og:title", content: "Create a household — FlatSplit" },
      { property: "og:description", content: "Start a FlatSplit household and invite flatmates with a short code." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [hh, setHh] = useState("");
  const [me, setMe] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hh.trim() || !me.trim()) return setErr("Please fill in both fields.");
    setBusy(true);
    setErr(null);
    try {
      const r = await createHousehold({ data: { householdName: hh, yourName: me } });
      saveMe(r.code, r.memberId);
      navigate({ to: "/h/$code", params: { code: r.code } });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <EntryShell title="Create household" subtitle="You'll get a short code to share with your flatmates.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hh">Flat name</Label>
          <Input id="hh" placeholder="e.g. Elm Street Flat" value={hh} onChange={(e) => setHh(e.target.value)} maxLength={60} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="me">Your name</Label>
          <Input id="me" placeholder="e.g. Alex" value={me} onChange={(e) => setMe(e.target.value)} maxLength={60} />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Creating…" : "Create household"}</Button>
      </form>
    </EntryShell>
  );
}
