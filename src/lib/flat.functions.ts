import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const name = z.string().trim().min(1, "Required").max(60);
const code = z.string().trim().toUpperCase().min(4).max(10);

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function householdId(c: string) {
  const sb = await db();
  const { data, error } = await sb.from("households").select("id").eq("code", c).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Household not found. Check the code.");
  return data.id;
}

/** Split amount in cents equally; leftover cents go to the first participants. */
function splitShares(amount: number, ids: string[]) {
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / ids.length);
  const rem = cents - base * ids.length;
  return ids.map((id, i) => ({ member_id: id, share_amount: (base + (i < rem ? 1 : 0)) / 100 }));
}

async function insertHousehold(hhName: string) {
  const sb = await db();
  for (let i = 0; i < 5; i++) {
    const { data, error } = await sb.from("households").insert({ name: hhName, code: genCode() }).select().single();
    if (!error) return data;
    if (!error.message.includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("Could not generate a code, try again.");
}

async function insertExpense(hid: string, e: { description: string; amount: number; paidBy: string; date: string; participants: string[] }) {
  const sb = await db();
  const { data, error } = await sb
    .from("expenses")
    .insert({ household_id: hid, description: e.description, amount: e.amount, paid_by: e.paidBy, date: e.date })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const rows = splitShares(e.amount, e.participants).map((r) => ({ ...r, expense_id: data.id }));
  const { error: e2 } = await sb.from("expense_participants").insert(rows);
  if (e2) throw new Error(e2.message);
}

export const createHousehold = createServerFn({ method: "POST" })
  .validator((d) => z.object({ householdName: name, yourName: name }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const hh = await insertHousehold(data.householdName);
    const { data: m, error } = await sb.from("members").insert({ household_id: hh.id, name: data.yourName }).select().single();
    if (error) throw new Error(error.message);
    return { code: hh.code, memberId: m.id };
  });

export const createDemoHousehold = createServerFn({ method: "POST" }).handler(async () => {
  const sb = await db();
  const hh = await insertHousehold("Demo Flat 4B");
  const { data: ms, error } = await sb
    .from("members")
    .insert(["Alex", "Sam", "Jamie", "Priya"].map((n) => ({ household_id: hh.id, name: n })))
    .select();
  if (error) throw new Error(error.message);
  const id = (n: string) => ms.find((m) => m.name === n)!.id;
  const all = ms.map((m) => m.id);
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);
  const demo = [
    { description: "Weekly groceries", amount: 64.8, paidBy: id("Alex"), date: d(9), participants: all },
    { description: "Cleaning supplies", amount: 18.5, paidBy: id("Sam"), date: d(7), participants: all },
    { description: "Internet bill", amount: 40, paidBy: id("Priya"), date: d(5), participants: all },
    { description: "Pizza night", amount: 36, paidBy: id("Jamie"), date: d(3), participants: [id("Alex"), id("Sam"), id("Jamie")] },
    { description: "Toilet paper & soap", amount: 12.4, paidBy: id("Alex"), date: d(1), participants: all },
  ];
  for (const e of demo) await insertExpense(hh.id, e);
  return { code: hh.code, memberId: id("Alex") };
});

export const joinHousehold = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code, yourName: name }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { data: existing } = await sb.from("members").select("id").eq("household_id", hid).ilike("name", data.yourName).maybeSingle();
    if (existing) return { code: data.code, memberId: existing.id };
    const { data: m, error } = await sb.from("members").insert({ household_id: hid, name: data.yourName }).select().single();
    if (error) throw new Error(error.message);
    return { code: data.code, memberId: m.id };
  });

export const getHousehold = createServerFn({ method: "GET" })
  .validator((d) => z.object({ code }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const { data: hh, error } = await sb.from("households").select("*").eq("code", data.code).maybeSingle();
    if (error) throw new Error(error.message);
    if (!hh) return null;
    const [m, e, s] = await Promise.all([
      sb.from("members").select("id,name,created_at").eq("household_id", hh.id).order("created_at"),
      sb
        .from("expenses")
        .select("id,description,amount,paid_by,date,created_at,expense_participants(member_id,share_amount)")
        .eq("household_id", hh.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      sb.from("settlements").select("id,from_member,to_member,amount,created_at").eq("household_id", hh.id).order("created_at", { ascending: false }),
    ]);
    for (const r of [m, e, s]) if (r.error) throw new Error(r.error.message);
    return {
      household: { id: hh.id, name: hh.name, code: hh.code },
      members: m.data!,
      expenses: e.data!.map((x) => ({
        ...x,
        amount: Number(x.amount),
        participants: x.expense_participants.map((p) => ({ member_id: p.member_id, share_amount: Number(p.share_amount) })),
      })),
      settlements: s.data!.map((x) => ({ ...x, amount: Number(x.amount) })),
    };
  });

export const addMember = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code, name }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { error } = await sb.from("members").insert({ household_id: hid, name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addExpense = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        code,
        description: z.string().trim().min(1, "Description is required").max(120),
        amount: z.number().positive("Amount must be greater than 0").max(1_000_000),
        paidBy: z.string().uuid("Choose who paid"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        participants: z.array(z.string().uuid()).min(1, "Pick at least one person"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { data: ms } = await sb.from("members").select("id").eq("household_id", hid);
    const valid = new Set((ms ?? []).map((m) => m.id));
    if (!valid.has(data.paidBy) || !data.participants.every((p) => valid.has(p))) throw new Error("Invalid flatmate selected");
    await insertExpense(hid, { ...data, participants: [...new Set(data.participants)] });
    return { ok: true };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { error } = await sb.from("expenses").delete().eq("id", data.id).eq("household_id", hid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addSettlement = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({ code, from: z.string().uuid(), to: z.string().uuid(), amount: z.number().positive() }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { error } = await sb
      .from("settlements")
      .insert({ household_id: hid, from_member: data.from, to_member: data.to, amount: Math.round(data.amount * 100) / 100 });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSettlement = createServerFn({ method: "POST" })
  .validator((d) => z.object({ code, id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await db();
    const hid = await householdId(data.code);
    const { error } = await sb.from("settlements").delete().eq("id", data.id).eq("household_id", hid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
