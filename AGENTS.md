<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Household data is accessed only via server functions in src/lib/flat.functions.ts (admin client, keyed by household code); tables have RLS on with no public policies — there is no user login, the code is the access key.
- Balances and settle-up suggestions are computed client-side in src/lib/balances.ts from raw expenses/shares/settlements, in integer cents, so they always reflect the latest data.
