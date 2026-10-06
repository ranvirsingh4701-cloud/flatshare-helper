import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createDemoHousehold } from "@/lib/flat.functions";
import { readMe, saveMe } from "@/lib/balances";
import { toast } from "sonner";
import { Home, Users, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlatSplit — Shared expenses for flatmates" },
      { name: "description", content: "Track shared expenses. See who owes whom. Simple expense splitting for flatmates." },
      { property: "og:title", content: "FlatSplit — Shared expenses for flatmates" },
      { property: "og:description", content: "Track shared expenses. See who owes whom." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => setLast(readMe()._last ?? null), []);

  async function demo() {
    setLoading(true);
    try {
      const r = await createDemoHousehold();
      saveMe(r.code, r.memberId);
      navigate({ to: "/h/$code", params: { code: r.code } });
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12">
      <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
        <Home className="h-4 w-4" /> For shared flats
      </div>
      <h1 className="font-display text-6xl font-extrabold tracking-tight text-primary sm:text-7xl">FlatSplit</h1>
      <p className="mt-4 text-xl text-muted-foreground">Track shared expenses. See who owes whom.</p>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Button asChild size="lg" className="h-14 text-base">
          <Link to="/create"><Home /> Create Household</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 text-base">
          <Link to="/join"><Users /> Join Household</Link>
        </Button>
      </div>

      {last && (
        <Link to="/h/$code" params={{ code: last }} className="mt-4 flex items-center justify-between rounded-xl border bg-card p-4 text-sm font-medium hover:bg-muted">
          Continue to household {last} <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="mt-10 rounded-2xl border border-dashed bg-card/60 p-5">
        <p className="font-semibold">Just looking around?</p>
        <p className="mt-1 text-sm text-muted-foreground">Create a demo flat with 4 flatmates and a few example expenses.</p>
        <Button variant="secondary" className="mt-3" onClick={demo} disabled={loading}>
          <Sparkles /> {loading ? "Creating demo…" : "Try a demo household"}
        </Button>
      </div>

      <ol className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <li><span className="font-display text-lg font-bold text-foreground">1.</span> Create a flat & share the code</li>
        <li><span className="font-display text-lg font-bold text-foreground">2.</span> Add what you paid for</li>
        <li><span className="font-display text-lg font-bold text-foreground">3.</span> See who owes whom & settle up</li>
      </ol>
    </main>
  );
}
