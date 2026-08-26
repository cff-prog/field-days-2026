# Field Day Event Scoring SPA

A mobile-first Single Page Application (SPA) designed for team captains to log scores during a 1-day Field Day event and view a live leaderboard. Hosted on **GitHub Pages** and backed by a **Google Sheet** and **Google Apps Script Web App**.

## Core Features

- 📱 **Mobile-First SPA**: Clean, responsive UI with smooth tab navigation for mobile devices.
- 🏷️ **QR Code Team Locking**: Automatically parses `?team=Team%201` from the URL parameter to lock the user's team and display a badge. If absent, a dropdown lets the captain choose from Team 1 to Team 11.
- 📋 **Dynamic Event Form Schemas**: Customized inputs for each of the 6 events:
  - **Dark Side of the Rainbow**: Rx/Scaled select, Minutes, Seconds.
  - **The Fast & The Furious**: Rx/Scaled select, Minutes, Seconds.
  - **The Three Amigos**: Total Calories.
  - **Tire Fire**: Rx/Scaled select, Total Reps.
  - **The Jerk**: 4-member form (Gender, Weight per member).
  - **White Men Can't Jump**: 4-member form (Gender, Max Height, Free Throw Points per member).
- 🔄 **Sequential / Batch POST Submissions**: Submits JSON payloads to the Google Apps Script Web App (`doPost`) using `text/plain` content type to prevent pre-flight CORS issues. Supports `offset: 0` to `3` for 4-member team events.
- 📊 **Direct Google Sheet Live Leaderboard**: Fetches real-time overall rankings directly from the Google Sheet (`Summary` tab) using Google's Visualization API endpoint (`gviz/tq`), bypassing Apps Script timeout issues on reads.

---

## Configuration (`config.js`)

1. **Google Apps Script Web App URL** (`APPS_SCRIPT_URL`):
   Used for writing scores via `POST`:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec";
   ```

2. **Google Sheet ID** (`SHEET_ID`):
   Used for fast, direct reads of the leaderboard via `/gviz/tq`:
   ```javascript
   const SHEET_ID = "1eMIiGOeuSSAhp7nFRTJQasfZF0PVngAHuNzHg1kQbRc";
   ```

---

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In your repository on GitHub.com, go to **Settings** -> **Pages**.
3. Under **Build and deployment**:
   - Set **Source** to `Deploy from a branch`.
   - Set **Branch** to `main` (or `master`) and folder to `/ (root)`.
4. Click **Save**. Your SPA will be hosted at `https://<your-username>.github.io/<repository-name>/`.

---

## QR Code Parameter Usage

Team captains can scan event-specific QR codes with pre-filled team parameters:
- `https://<your-username>.github.io/<repository-name>/?team=Team%201`
- `https://<your-username>.github.io/<repository-name>/?team=Team%203`
