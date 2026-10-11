import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { householdQuery, computeBalances, eur, forgetMe } from "@/lib/balances";
import { addMember, removeMember, deleteHousehold } from "@/lib/flat.functions";
import { BalanceText, balanceLabel } from "@/components/Money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus, ArrowRight, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/h/$code/")({
  component: Dashboard,
});

function Dashboard() {
  const { code } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(householdQuery(code));
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  if (!data) return null;
  const bal = computeBalances(data);
  const total = data.expenses.reduce((s, e) => s + e.amount, 0);
  const sorted = [...bal].sort((a, b) => b.balance - a.balance);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addMember({ data: { code, name: newName } });
      setNewName("");
      await qc.invalidateQueries({ queryKey: householdQuery(code).queryKey });
      toast.success("Flatmate added");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string, memberName: string) {
    if (!window.confirm(`Remove ${memberName} from the flat?`)) return;
    try {
      await removeMember({ data: { code, id } });
      await qc.invalidateQueries({ queryKey: householdQuery(code).queryKey });
      toast.success("Flatmate removed");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function removeHousehold() {
    if (!window.confirm(`Delete "${data!.household.name}" for everyone? All expenses and settlements will be permanently removed.`)) return;
    try {
      await deleteHousehold({ data: { code } });
      forgetMe(code);
      qc.removeQueries({ queryKey: householdQuery(code).queryKey });
      toast.success("Household deleted");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-primary p-6 text-primary-foreground">
        <div>
          <p className="text-sm opacity-80">Total household spending</p>
          <p className="font-display text-5xl font-extrabold tabular-nums">{eur(total)}</p>
          <p className="mt-1 text-sm opacity-80">{data.expenses.length} expenses · {data.members.length} flatmates</p>
        </div>
        <Button asChild size="lg" variant="secondary" className="h-12 text-base">
          <Link to="/h/$code/add" params={{ code }}><Plus /> Add Expense</Link>
        </Button>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Flatmates</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {bal.map((m) => (
            <div key={m.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display font-bold text-accent-foreground">{m.name[0]?.toUpperCase()}</div>
                  <p className="font-semibold">{m.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <BalanceText value={m.balance} className="text-lg" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-negative"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => remove(m.id, m.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-muted-foreground">Paid</dt><dd className="font-medium tabular-nums">{eur(m.paid)}</dd></div>
                <div><dt className="text-muted-foreground">Should pay</dt><dd className="font-medium tabular-nums">{eur(m.share)}</dd></div>
                <div><dt className="text-muted-foreground">Balance</dt><dd><BalanceText value={m.balance} /></dd></div>
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Positive balance = should receive money. Negative = owes money. Balance includes settled payments.</p>
        <form onSubmit={add} className="mt-3 flex gap-2">
          <Input placeholder="Add a flatmate by name" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />
          <Button type="submit" variant="outline" disabled={adding || !newName.trim()}><UserPlus /> Add</Button>
        </form>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Who owes whom?</h2>
          <Link to="/h/$code/settle" params={{ code }} className="flex items-center gap-1 text-sm font-medium text-primary">Settle up <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {data.expenses.length === 0 ? (
          <p className="text-muted-foreground">No expenses yet. Add the first one to see balances.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((m) => {
              const r = Math.round(m.balance * 100);
              return (
                <li key={m.id} className={cn("rounded-lg px-3 py-2 font-medium", r > 0 ? "bg-positive-soft text-positive" : r < 0 ? "bg-negative-soft text-negative" : "bg-muted text-muted-foreground")}>
                  {balanceLabel(m.name, m.balance)}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-negative/30 bg-negative-soft/40 p-5">
        <h2 className="font-display text-lg font-bold text-negative">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting this household removes it for everyone — all flatmates, expenses and settlements are gone for good.
        </p>
        <Button variant="outline" className="mt-3 border-negative/40 text-negative hover:bg-negative-soft hover:text-negative" onClick={removeHousehold}>
          <Trash2 /> Delete household
        </Button>
      </section>
    </div>
  );
}
