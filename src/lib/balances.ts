import { queryOptions } from "@tanstack/react-query";
import { getHousehold } from "./flat.functions";

export type HouseholdData = NonNullable<Awaited<ReturnType<typeof getHousehold>>>;

export const householdQuery = (code: string) =>
  queryOptions({ queryKey: ["household", code.toUpperCase()], queryFn: () => getHousehold({ data: { code } }) });

export const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

export const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const c = (n: number) => Math.round(n * 100);

export function computeBalances(h: HouseholdData) {
  const map = new Map(h.members.map((m) => [m.id, { id: m.id, name: m.name, paid: 0, share: 0, sent: 0, received: 0 }]));
  for (const e of h.expenses) {
    const p = map.get(e.paid_by);
    if (p) p.paid += c(e.amount);
    for (const part of e.participants) {
      const m = map.get(part.member_id);
      if (m) m.share += c(part.share_amount);
    }
  }
  for (const s of h.settlements) {
    const f = map.get(s.from_member);
    const t = map.get(s.to_member);
    if (f) f.sent += c(s.amount);
    if (t) t.received += c(s.amount);
  }
  return [...map.values()].map((m) => ({
    id: m.id,
    name: m.name,
    paid: m.paid / 100,
    share: m.share / 100,
    balance: (m.paid - m.share + m.sent - m.received) / 100,
  }));
}

export function suggestPayments(bal: ReturnType<typeof computeBalances>) {
  const debtors = bal.filter((b) => c(b.balance) < 0).map((b) => ({ ...b, amt: -c(b.balance) })).sort((a, b) => b.amt - a.amt);
  const creditors = bal.filter((b) => c(b.balance) > 0).map((b) => ({ ...b, amt: c(b.balance) })).sort((a, b) => b.amt - a.amt);
  const out: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!, cr = creditors[j]!;
    const x = Math.min(d.amt, cr.amt);
    if (x > 0) out.push({ from: d.id, fromName: d.name, to: cr.id, toName: cr.name, amount: x / 100 });
    d.amt -= x;
    cr.amt -= x;
    if (d.amt === 0) i++;
    if (cr.amt === 0) j++;
  }
  return out;
}

const KEY = "flatsplit:me";
export function saveMe(code: string, memberId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    all[code.toUpperCase()] = memberId;
    all._last = code.toUpperCase();
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}
export function readMe(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
