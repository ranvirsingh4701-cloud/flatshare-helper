import { eur } from "@/lib/balances";
import { cn } from "@/lib/utils";

export function BalanceText({ value, className }: { value: number; className?: string }) {
  const r = Math.round(value * 100);
  return (
    <span className={cn("font-semibold tabular-nums", r > 0 ? "text-positive" : r < 0 ? "text-negative" : "text-muted-foreground", className)}>
      {r > 0 ? "+" : r < 0 ? "−" : ""}{eur(Math.abs(value))}
    </span>
  );
}

export function balanceLabel(name: string, value: number) {
  const r = Math.round(value * 100);
  if (r > 0) return `${name} should receive ${eur(value)}`;
  if (r < 0) return `${name} owes ${eur(-value)}`;
  return `${name} is all square`;
}
