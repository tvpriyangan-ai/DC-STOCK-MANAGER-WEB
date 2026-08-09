# DC Stock Manager — Web / Mobile Edition

This is your Tkinter "DC Stock Manager" desktop app, rebuilt as a web app so it
works on phones, tablets, and PCs through a browser (or installed as an app
icon via "Add to Home Screen").

It connects to the **same MySQL database** you already manage in MySQL
Workbench (`dc_stock_v2`) — no data migration needed.

```
dc-stock-manager/
├── server/              Node.js + Express backend (talks to MySQL)
│   ├── server.js        App entrypoint
│   ├── db.js            MySQL connection pool
│   ├── dbFunctions.js   Same queries as your database_functions.py
│   ├── schema.sql       Run this once in MySQL Workbench (safe to re-run)
│   ├── routes/          API endpoints (auth, products, users, activity)
│   └── .env.example     Copy to .env and fill in your MySQL login
└── public/              Frontend (HTML/CSS/JS) — this is what phones load
    ├── index.html       Login screen
    ├── dashboard.html   Main inventory screen
    ├── css/style.css
    ├── js/
    └── manifest.json    Makes it installable as a phone "app"
```

## 1. One-time setup

**Requirements:** [Node.js](https://nodejs.org) installed on the PC that will
run this (the same PC running MySQL Workbench is the easiest choice).

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and confirm the MySQL details match your Workbench connection
(host/user/password/database). It's pre-filled with the values from your
original `database.py`.

Also set `JWT_SECRET` in `.env` to a random value (a command to generate
one is in `.env.example`) — this is what signs login tokens, so it must
be set and must stay private.

Then, in MySQL Workbench, run `server/schema.sql` once. It's written with
`IF NOT EXISTS` so it will **not** delete any of your existing products —
it just makes sure every column the web app needs (like `users.full_name`
and `users.status`) is present, since your two SQL files had slightly
different `users` table versions.

If you want the **Customer Bill** search (see section 4 below), also run
`server/customer_bills_import.sql` once, after `schema.sql`. It loads the
customer name / bill date history from `server/customer_bills.csv` — to
refresh it later with an updated spreadsheet, regenerate that `.sql` file
from the new CSV and re-run it (it clears and reloads the table, so it's
safe to re-run).

### Auth setup (one-time, only needed on a database created before this)

If your `users` table already has accounts with plain-text passwords
(anything created before this change), hash them in place by running,
from the `server/` folder:

```bash
node scripts/migrate_passwords_to_bcrypt.js
```

It only rewrites rows that aren't already bcrypt hashes, so it's safe to
run more than once. A brand-new database (via `schema.sql`) doesn't need
this — its seed `admin` account is created with an already-hashed
password.

## 2. Run it

```bash
cd server
npm start
```

You'll see:
```
🚀 DC Stock Manager server running at http://localhost:4000
✅ Database Connected Successfully to dc_stock_v2
```

Open `http://localhost:4000` in a browser on that same PC — you'll see the
login screen. Log in with the same username/password you use in the
Tkinter app (e.g. `admin` / `admin123`).

## 3. Using it from your phone

Your phone needs to reach the PC over the network:

1. Find the PC's local IP address (Windows: `ipconfig`, look for IPv4 Address, e.g. `192.168.1.25`).
2. On your phone (same WiFi), open `http://192.168.1.25:4000`.
3. To install it like an app: open the browser menu → **"Add to Home Screen"**
   (Chrome/Android) or **Share → Add to Home Screen** (Safari/iPhone). It'll
   get its own icon and open full-screen, no browser bar.

**To use it from anywhere (not just home WiFi)**, you'd host the `server/`
folder on a small cloud server (e.g. a $5/month VPS, Railway, or Render) and
point your MySQL connection at a reachable MySQL instance. That's a bigger
step — happy to help set that up when you're ready.

## 4. What changed vs. the Tkinter version

- **Popup windows → modals.** Tkinter's `Toplevel` dialogs (Add/Update
  Product, Stock Update, User Management, History) are now on-screen modal
  popups, since phones don't have separate windows.
- **Treeview categories → sidebar.** On mobile it slides in from a ☰ menu
  button instead of always being visible.
- **File picker → phone's native picker.** "Browse Image" now opens your
  phone's camera/gallery picker.
- **`session.py` globals → browser session.** The logged-in user is kept in
  the browser's session storage instead of Python globals, and login state
  clears when you log out or close the tab.
- **New: Customer Bill search (Admin only).** The 🧾 **Customer Bill** button
  in the header (hidden for non-Admin accounts, and blocked server-side too)
  opens a dialog where you can search by customer name or bill date
  (e.g. `Rajah` or `6/21/2023`) to look up historical bills imported from
  `customer_bills.csv`.

## 5. Known gaps / things worth improving next

- **Auth fixed:** passwords are now hashed with bcrypt (never stored or
  compared in plain text), and login issues a signed JWT that every
  protected route verifies server-side — the old trick of just sending an
  `X-Username` header no longer works. See "Auth setup" below for the
  one-time steps this requires on your existing database.
- `product_manager.py` (the file that likely built your original product
  table screen) never made it into what I received, so the table/detail
  panel here was rebuilt from your screenshots + `database_functions.py`
  rather than your exact original code — let me know if anything behaves
  differently than your Tkinter version and I'll adjust it.
