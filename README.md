# StudyTrack

A lightweight weekly study planner with daily check-ins and progress stats. The app is plain HTML, CSS, and JavaScript modules; it needs no build step.

## Run locally

Serve this folder with a local static web server (ES modules do not work reliably from a `file://` URL). For example, with Python installed:

```sh
python -m http.server 8000
```

Open <http://localhost:8000>. Create an account from the sign-in page. Account details, your timetable, and check-ins stay in this browser's local storage. This local demo stores passwords in the browser and is not suitable for real accounts or sensitive data.

If Python is not installed, use VS Code's Live Server extension: open this folder, right-click `index.html`, and choose **Open with Live Server**. The overview redirects to `login.html` until you create an account in that browser.

## Supabase schema

`setup.sql` creates the `study_sessions` and `study_checkins` tables, indexes, and row-level security policies. Run it in the Supabase SQL Editor when preparing a hosted backend. The current app does not connect to Supabase; no Supabase URL or key is needed to use the local demo. For production, use Supabase Auth rather than the browser-only demo authentication, and connect the app to the schema through the Supabase client.

## Project structure

- `index.html` — overview, study statistics, and daily check-in
- `login.html` — local demo sign-in and account creation
- `timetable.html` — weekly timetable editor
- `history.html` — check-in history with editable attendance status and extra hours
- `css/style.css` — responsive application styling
- `js/model/` — browser persistence, authentication, timetable, and check-in data
- `js/view/` — dashboard, timetable, and history rendering
- `js/controller/` — page initialization, routing, and form actions
- `setup.sql` — optional Supabase schema