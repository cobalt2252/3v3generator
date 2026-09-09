# 3v3 Fixture Generator

Create fair, organised and balanced small-sided games in seconds. A free, open-source, static web app — everything runs in the browser, with no accounts and no data leaving your device.

## How it works

The app walks you through a short setup, then generates the session:

1. **Squads & players** — add up to 4 squads and set how many players are in each. Rename them to your own club or team names and optionally paste in player names.
2. **Session settings** — game duration, rest time, an optional pitch-change buffer, total session length, start time and number of pitches.
3. **Spare players & options** — how spares are handled, team size (3v3 / 4v4 / 5v5), match-up format, whether team-mates rotate, and pitch formats.
4. **Generate** — the app builds the schedule and takes you to the results.

## Screens

- **Home** — start a new session, open saved setups, and jump to the current session
- **Fixtures** — the full schedule, filterable **by team** or **by pitch**, with a detail view for each match showing both line-ups and who is resting
- **Fairness** — squad and player fairness scores, a squad-by-squad comparison, and a per-player bar showing games played, rest rounds and how they compare to the squad average
- **Settings** — appearance (light/dark), saved setups, how it works, and CSV export

## Features

- 2–4 squads, 1–15 players each, with optional named player lists
- Configurable game time, rest time, pitch-change buffer, total session length, start time and pitches
- Spare players either rotate on as substitutes or rest between rounds
- Team-mates rotate each round or stay together for the whole session
- Match-up formats: within squad, same-where-possible, or fully mixed
- Pitch formats: automatic, manual per pitch, or **balance uneven** — when numbers don't divide evenly (e.g. 10 v 11) it splits everyone across every pitch each round so nobody sits out, even if that means 3v3, 3v3, 3v2, 2v2
- Fairness scored against the squad average, so being one game behind the busiest player doesn't read as unfair
- **Dark mode** — follows your system setting by default, with a toggle in Settings
- Save setups as templates in the browser, or export/import a `.json` file to move between devices
- One-click CSV export of the schedule

## Project structure

```
index.html      All screens (single-page app shell)
style.css       Design tokens and styling, including the dark theme
js/engine.js    Scheduling logic (pure functions, no DOM — testable in Node)
js/app.js       Screen routing, rendering, icons and fairness scoring
images/         Drop your own photos here (see images/README.md)
```

## Adding your own images

The app ships with no photos — the interface is drawn entirely with CSS
gradients and inline SVG icons, so it works offline and loads instantly.
If you want a photo on the home screen, save it as `images/hero.jpg` and
uncomment the marked block in `style.css`. Full instructions are in
`images/README.md`.

Keep images under about 300 KB and no wider than 1600 px so the app stays fast
on mobile data.

## Running it locally

Static site, no build step:

- Open `index.html` directly in a browser, or
- Serve the folder, e.g. `python3 -m http.server 8000`, then visit `http://localhost:8000`

## Hosting on GitHub Pages

**Without the command line:**

1. Create a new **public** repository on GitHub.
2. **Add file - Upload files**, drag in `index.html`, `style.css`, `README.md`, `LICENSE` and the `js` folder, then commit.
3. **Settings - Pages**, set Source to **Deploy from a branch**, pick **main** and **/ (root)**, save.
4. Your site appears at `https://<username>.github.io/<repo-name>/` within a minute or two.

**With git:**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

## How the scheduler works

Each round, the engine fills every pitch with a match sized to that pitch's format, drawing players according to the match-up rule and the team-formation rule. Players who have played the fewest games so far are always prioritised, so game time evens out across the session even when squads are different sizes. Anyone left over is marked resting, and that rest feeds into who plays next. Rest time and the pitch-change buffer are both added to the gap between rounds.

This is an independent implementation, not affiliated with or endorsed by any organisation — it's an open tool anyone can host, read and modify.

## License

MIT — see [LICENSE](LICENSE).
