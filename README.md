# FlatShare Helper

Build a full-stack web app called “FlatSplit” for flatmates who share household expenses.

PROBLEM:
Flatmates often pay for groceries, cleaning supplies, utilities, takeout, etc. and later forget who paid for what. This creates confusion when splitting costs and settling up.

GOAL:
Create a simple shared expense tracker where flatmates can add expenses and immediately see how much each person has paid, how much they should have paid, and who owes money to whom.

TARGET USERS:
University students and young adults living together in a shared flat.

CORE USER FLOW:
1. A user opens the app.
2. They create or join a household using a simple household code.
3. They see the household dashboard with all flatmates.
4. They can add a new expense.
5. They select:
   - What the expense was for
   - Amount
   - Who paid
   - Date
   - Which flatmates should split the expense
6. The app automatically calculates each person's share.
7. The dashboard shows:
   - Total household spending
   - How much each person has paid
   - How much each person owes
   - Who should pay whom
8. Users can mark a debt as settled.
9. All expenses and balances are saved in the backend so they remain after refreshing the page.

IMPORTANT:
Keep the project focused and simple. Do not add unnecessary features such as bank integrations, AI, notifications, or complicated financial features.

PAGES:

1. HOME / LANDING PAGE
- App name: FlatSplit
- Short explanation:
  “Track shared expenses. See who owes whom.”
- Buttons:
  “Create Household”
  “Join Household”

2. CREATE HOUSEHOLD
- Enter household/flat name
- Enter your name
- Create a household
- Generate a short household code
- After creation, take the user to the dashboard

3. JOIN HOUSEHOLD
- Enter household code
- Enter your name
- Join the household
- Take the user to the dashboard

4. DASHBOARD
Make this the main screen.

Show:
- Household name
- List of flatmates
- Total expenses
- Each person's paid amount
- Each person's current balance

Use clear labels:
“Paid”
“Should pay”
“Balance”

Interpret balances as:
- Positive = this person should receive money
- Negative = this person owes money

Also show a “Who owes whom?” section.

Example:
Alex should receive €12.50
Sam owes €8.00
Jamie owes €4.50

Add a prominent:
“+ Add Expense”
button.

5. ADD EXPENSE
Create a simple form with:
- Expense description
- Amount (€)
- Paid by
- Date
- Split between

The “Split between” field should allow selecting multiple flatmates.

For the first version, split expenses equally between selected people.

Example:
Groceries — €60
Paid by Alex
Split between Alex, Sam and Jamie

The app should calculate:
Alex share = €20
Sam share = €20
Jamie share = €20

If Alex paid €60, Alex's balance increases by €40 relative to the expense.

After saving, return to the dashboard and update all balances immediately.

6. EXPENSE HISTORY
Show all household expenses in a clean list.

Each expense should show:
- Description
- Amount
- Who paid
- Date
- People included in the split

Example:
Groceries
€60.00
Paid by Alex
Split between Alex, Sam, Jamie
5 October 2026

Allow users to open an expense and delete it if necessary.

7. SETTLE UP
Create a simple section showing the minimum useful payments needed to settle all balances.

Example:

“Sam → Alex €8.00”
“Jamie → Alex €4.50”

Each payment should have a:
“Mark as settled”
button.

When marked as settled, update the balances accordingly.

BACKEND / DATABASE:
Use a real persistent backend/database.

Create data models for:

Households:
- id
- name
- code
- created_at

Members:
- id
- household_id
- name
- created_at

Expenses:
- id
- household_id
- description
- amount
- paid_by
- date
- created_at

Expense participants:
- id
- expense_id
- member_id
- share_amount

Settlements:
- id
- household_id
- from_member
- to_member
- amount
- created_at

The data must persist after refreshing the browser.

BALANCE CALCULATION:
For every member calculate:

total_paid = sum of expenses they paid

total_share = sum of their shares across expenses

balance = total_paid - total_share

Positive balance means they are owed money.
Negative balance means they owe money.

Use the balances to calculate simple settlement suggestions.

Example:
Alex: +€30
Sam: -€20
Jamie: -€10

Show:
Sam → Alex €20
Jamie → Alex €10

DESIGN:
Make the UI modern, clean and friendly, but not over-designed.

Use:
- Responsive layout
- Mobile-friendly cards
- Clear typography
- Simple navigation
- Green/positive styling for money owed to a person
- Red/orange/negative styling for money someone owes
- Euro (€) as the default currency

The dashboard should be understandable within a few seconds.

Do not overwhelm the user with charts.

TECHNICAL REQUIREMENTS:
- Build a real working frontend and backend.
- Use persistent database storage.
- Make all CRUD operations functional.
- Handle loading and error states.
- Validate that expense amounts are greater than 0.
- Do not allow an expense without a payer.
- Do not allow an expense without at least one participant.
- Make sure calculations update correctly whenever an expense is added or deleted.
- Make the app usable by someone who has never seen it before.

DEMO DATA:
Include an easy way to create a demo household with 3–4 example flatmates and several example expenses so the app can immediately demonstrate its functionality.

IMPORTANT SCOPE:
This is a student project, so prioritize reliability and simplicity over a large number of features.

The most important functionality is:

1. Create/join household
2. Add expense
3. Store expenses in the backend
4. Calculate balances
5. Show who owes whom
6. Mark settlements
7. View expense history

Before finishing, test the complete flow:
Create household → add members → add expenses → refresh page → verify data persists → verify balances → settle a debt → verify updated balances.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4373504b-fc8e-498d-b22b-3195910ddd2c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
