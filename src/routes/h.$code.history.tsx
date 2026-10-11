import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { householdQuery, eur, fmtDate } from "@/lib/balances";
import { deleteExpense } from "@/lib/flat.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Receipt } from "lucide-react";

export const Route = createFileRoute("/h/$code/history")({
  component: History,
});

function History() {
  const { code } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(householdQuery(code));
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? "Unknown";
  const open = data.expenses.find((e) => e.id === openId);

  async function remove() {
    if (!open) return;
    setBusy(true);
    try {
      await deleteExpense({ data: { code, id: open.id } });
      await qc.invalidateQueries({ queryKey: householdQuery(code).queryKey });
      toast.success("Expense deleted");
      setOpenId(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 font-display text-2xl font-bold">Expense history</h2>
      {data.expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-2 h-8 w-8" />
          No expenses yet.
          <div className="mt-4"><Button asChild><Link to="/h/$code/add" params={{ code }}>+ Add Expense</Link></Button></div>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.expenses.map((e) => (
            <li key={e.id}>
              <button onClick={() => setOpenId(e.id)} className="flex w-full items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-left hover:bg-muted">
                <div className="min-w-0">
                  <p className="font-semibold">{e.description}</p>
                  <p className="text-sm text-muted-foreground">Paid by {name(e.paid_by)}</p>
                  <p className="truncate text-sm text-muted-foreground">Split between {e.participants.map((p) => name(p.member_id)).join(", ")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtDate(e.date)}
                    {e.expense_month && <> · {fmtMonth(e.expense_month)}</>}
                    {e.deadline && <> · Due {fmtDate(e.deadline)}</>}
                  </p>
                </div>
                <p className="font-display text-xl font-bold tabular-nums">{eur(e.amount)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {data.settlements.length > 0 && (
        <>
          <h3 className="mb-2 mt-8 font-display text-lg font-bold">Settled payments</h3>
          <ul className="space-y-2">
            {data.settlements.map((s) => (
              <li key={s.id} className="flex justify-between rounded-xl bg-positive-soft px-4 py-3 text-sm">
                <span>{name(s.from_member)} → {name(s.to_member)}</span>
                <span className="font-semibold tabular-nums">{eur(s.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.description}</DialogTitle>
                <DialogDescription>
                  {fmtDate(open.date)} · Paid by {name(open.paid_by)}
                  {open.expense_month && <> · {fmtMonth(open.expense_month)}</>}
                  {open.deadline && <> · Due {fmtDate(open.deadline)}</>}
                </DialogDescription>
              </DialogHeader>
              <p className="font-display text-3xl font-bold">{eur(open.amount)}</p>
              <ul className="divide-y rounded-lg border">
                {open.participants.map((p) => (
                  <li key={p.member_id} className="flex justify-between px-3 py-2 text-sm">
                    <span>{name(p.member_id)}</span><span className="tabular-nums">{eur(p.share_amount)}</span>
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="destructive" onClick={remove} disabled={busy}><Trash2 /> {busy ? "Deleting…" : "Delete expense"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
