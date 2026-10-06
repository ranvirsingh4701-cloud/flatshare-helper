import { createFileRoute, Link, Outlet, notFound, type ErrorComponentProps } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { householdQuery } from "@/lib/balances";
import { Button } from "@/components/ui/button";
import { Copy, LayoutDashboard, ListOrdered, HandCoins, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/h/$code")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(householdQuery(params.code));
    if (!d) throw notFound();
    return { name: d.household.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — FlatSplit` : "Household — FlatSplit" },
      { name: "description", content: "Shared expenses and balances for this flat." },
      { property: "og:title", content: loaderData ? `${loaderData.name} — FlatSplit` : "FlatSplit household" },
      { property: "og:description", content: "Shared expenses and balances for this flat." },
    ],
  }),
  component: HouseholdLayout,
  pendingComponent: () => <div className="p-10 text-center text-muted-foreground">Loading household…</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-3xl font-bold">Household not found</h1>
      <p className="mt-2 text-muted-foreground">Check the code and try again.</p>
      <Button asChild className="mt-6"><Link to="/join">Join with a code</Link></Button>
    </div>
  ),
  errorComponent: ({ error, reset }: ErrorComponentProps) => (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="font-display text-2xl font-bold">Couldn't load household</h1>
      <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  ),
});

function HouseholdLayout() {
  const { code } = Route.useParams();
  const { data } = useSuspenseQuery(householdQuery(code));
  if (!data) return null;
  const tab = "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground sm:flex-row sm:justify-center sm:text-sm";
  const active = { className: "bg-secondary text-secondary-foreground" };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-28 pt-6 sm:pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="font-display text-sm font-bold text-primary">FlatSplit</Link>
          <h1 className="font-display text-3xl font-bold tracking-tight">{data.household.name}</h1>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(data.household.code); toast.success("Code copied — share it with your flatmates"); }}
          className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-left hover:bg-muted"
        >
          <span className="text-xs text-muted-foreground">Invite code</span>
          <span className="font-mono text-lg font-bold tracking-widest">{data.household.code}</span>
          <Copy className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-card/95 p-2 backdrop-blur sm:static sm:mt-6 sm:rounded-xl sm:border">
        <div className="mx-auto flex max-w-3xl gap-1">
          <Link to="/h/$code" params={{ code }} activeOptions={{ exact: true }} className={tab} activeProps={active}><LayoutDashboard className="h-5 w-5 sm:h-4 sm:w-4" />Dashboard</Link>
          <Link to="/h/$code/history" params={{ code }} className={tab} activeProps={active}><ListOrdered className="h-5 w-5 sm:h-4 sm:w-4" />History</Link>
          <Link to="/h/$code/settle" params={{ code }} className={tab} activeProps={active}><HandCoins className="h-5 w-5 sm:h-4 sm:w-4" />Settle up</Link>
          <Link to="/h/$code/add" params={{ code }} className={tab} activeProps={active}><Plus className="h-5 w-5 sm:h-4 sm:w-4" />Add</Link>
        </div>
      </nav>

      <div className="mt-6"><Outlet /></div>
    </div>
  );
}
