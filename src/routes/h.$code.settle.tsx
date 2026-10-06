import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { householdQuery, computeBalances, suggestPayments, eur } from "@/lib/balances";
import { addSettlement } from "@/lib/flat.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight, PartyPopper } from "lucide-react";

export const Route = createFileRoute("/h/$code/settle")({
  component: Settle,
});

function Settle() {
  const { code } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(householdQuery(code));
  const [busy, setBusy] = useState<string | null>(null);
  if (!data) return null;
  const payments = suggestPayments(computeBalances(data));

  async function settle(p: (typeof payments)[number]) {
    const k = p.from + p.to;
    setBusy(k);
    try {
      await addSettlement({ data: { code, from: p.from, to: p.to, amount: p.amount } });
      await qc.invalidateQueries({ queryKey: householdQuery(code).queryKey });
      toast.success(`${p.fromName} paid ${p.toName} ${eur(p.amount)}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Settle up</h2>
      <p className="mb-4 text-sm text-muted-foreground">The fewest payments needed to make everyone square. Mark one as settled once the money's been sent.</p>
      {payments.length === 0 ? (
        <div className="rounded-2xl border bg-positive-soft p-8 text-center text-positive">
          <PartyPopper className="mx-auto mb-2 h-8 w-8" />
          <p className="font-semibold">Everyone is settled up!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.from + p.to} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <span className="text-negative">{p.fromName}</span>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="text-positive">{p.toName}</span>
                <span className="ml-2 font-display tabular-nums">{eur(p.amount)}</span>
              </div>
              <Button onClick={() => settle(p)} disabled={busy !== null}>{busy === p.from + p.to ? "Saving…" : "Mark as settled"}</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
