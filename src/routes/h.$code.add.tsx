import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { householdQuery, eur, readMe } from "@/lib/balances";
import { addExpense } from "@/lib/flat.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const Route = createFileRoute("/h/$code/add")({
  component: AddExpense,
});

function AddExpense() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(householdQuery(code));
  const members = data?.members ?? [];
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [split, setSplit] = useState<string[]>(() => members.map((m) => m.id));
  const [errors, setErrors] = useState<Partial<Record<"desc" | "amount" | "paidBy" | "split" | "date", string>>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const me = readMe()[code.toUpperCase()];
    if (me && members.some((m) => m.id === me)) setPaidBy(me);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const amt = Number(amount.replace(",", "."));
  const share = split.length && amt > 0 ? amt / split.length : 0;

  function toggle(id: string) {
    setSplit((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<"desc" | "amount" | "paidBy" | "split" | "date", string>> = {};
    if (!desc.trim()) errs.desc = "What was it for?";
    if (!(amt > 0)) errs.amount = "Amount must be greater than 0";
    if (!paidBy) errs.paidBy = "Choose who paid";
    if (split.length === 0) errs.split = "Select at least one flatmate";
    if (!date) errs.date = "Pick a date";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await addExpense({ data: { code, description: desc, amount: Math.round(amt * 100) / 100, paidBy, date, participants: split } });
      await qc.invalidateQueries({ queryKey: householdQuery(code).queryKey });
      toast.success("Expense added");
      navigate({ to: "/h/$code", params: { code } });
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  const chip = (on: boolean) =>
    cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted");

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold">Add expense</h2>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Input id="desc" placeholder="e.g. Groceries" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={120} />
        {errors.desc && <p className="text-sm text-destructive">{errors.desc}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (€)</Label>
          <Input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg tabular-nums" />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Paid by</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button type="button" key={m.id} onClick={() => setPaidBy(m.id)} className={chip(paidBy === m.id)} aria-pressed={paidBy === m.id}>{m.name}</button>
          ))}
        </div>
        {errors.paidBy && <p className="text-sm text-destructive">{errors.paidBy}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Split between</Label>
          <button type="button" className="text-sm font-medium text-primary" onClick={() => setSplit(split.length === members.length ? [] : members.map((m) => m.id))}>
            {split.length === members.length ? "Clear" : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const on = split.includes(m.id);
            return (
              <button type="button" key={m.id} onClick={() => toggle(m.id)} className={chip(on)} aria-pressed={on}>
                {on && <Check className="h-4 w-4" />}{m.name}
              </button>
            );
          })}
        </div>
        {errors.split && <p className="text-sm text-destructive">{errors.split}</p>}
        {share > 0 && <p className="text-sm text-muted-foreground">Split equally: <span className="font-semibold text-foreground">{eur(share)}</span> each</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="h-12 flex-1" disabled={busy}>{busy ? "Saving…" : "Save expense"}</Button>
        <Button type="button" size="lg" variant="outline" className="h-12" onClick={() => navigate({ to: "/h/$code", params: { code } })}>Cancel</Button>
      </div>
    </form>
  );
}
