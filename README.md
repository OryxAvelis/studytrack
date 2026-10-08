# StudyTrack

StudyTrack is a free browser-based study planner with a weekly timetable, check-ins, study history, CSV export, an eight-week progress chart, goals, deadlines, and opt-in session reminders. An account is optional: guest data is stored locally in the current browser; signing in enables private Supabase sync.

## Configure Supabase

Supabase is optional for guest use. Configure it to enable accounts and synced study data.

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`setup.sql`](./setup.sql). It creates the required tables, indexes, and row-level-security policies. It is safe to re-run to add schema updates.
3. Copy `js/model/supabaseConfig.example.js` to `js/model/supabaseConfig.js`.
4. Set `SUPABASE_URL` to the project URL and `SUPABASE_PUBLISHABLE_KEY` to the project's **publishable (anon)** key. Never put a `service_role` key in a browser app. The local config is git-ignored.
5. In Supabase Auth settings, configure the site's URL and allow-list the app's local and deployed callback URLs for email confirmation and password recovery.
6. Serve the project over HTTP(S). Guests can use the planner immediately; create an account and confirm its email if confirmation is enabled to use cloud sync.

The publishable key is designed for browser use; row-level security is what protects user data. Do not disable the policies in `setup.sql`.

## Run locally

Serve this folder with a static web server; JavaScript modules do not work reliably from a `file://` URL.

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. Alternatively, use VS Code's Live Server extension: right-click `index.html` and choose **Open with Live Server**.

Guest data (timetable, check-ins, goals, and reminder preferences) stays in this browser and is not uploaded. Configure Supabase and sign in if you want account-based cloud sync. Guest data and account data remain separate.

Run the dependency-free model tests with:

```sh
npm test
```

## Features

- Supabase email/password sign-up and sign-in, email confirmation, and password recovery
- Free guest mode with locally saved timetable, check-ins, goals, and reminder preferences; no account is required
- Cloud-synced timetable, check-ins, goals, and reminder preferences
- Left-to-right English timetable with Monday–Saturday weekday rows and ten hourly slots from 08:00–09:00 through 17:00–18:00
- One-time, user-confirmed import of the previous browser demo's timetable and check-ins; demo passwords are not imported
- Full, half, or absent check-in statuses; calculated and extra study hours
- Study history with edit/delete and CSV export
- Dashboard totals and Chart.js weekly study-hours chart
- User-created goals with due dates, optional target hours, completion, and overdue status
- Opt-in browser notifications for sessions with a reminder selected

Browser notifications are local to the browser and are checked while StudyTrack is open and visible. They are not delivered when the site is closed, and browser permission is required.

## Project structure

- `index.html` — dashboard, chart, goals, and reminders
- `login.html` — sign-in, account creation, and password recovery
- `timetable.html` — weekly timetable editor and per-session reminder setup
- `history.html` — check-in history, edit/delete, and CSV export
- `css/style.css` — responsive styling
- `js/model/` — Supabase client, authentication, and data access
- `js/view/` — dashboard, chart, timetable, goal, and history rendering
- `js/controller/` — page initialization and feature interactions
- `setup.sql` — Supabase schema and row-level-security policies