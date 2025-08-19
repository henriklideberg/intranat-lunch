
# Intranät – Balthazar Dagens Lunch (GitHub + Vercel)

Automatisk publicering av **Dagens lunch**, **Veckans fisk** och **Veckans vegetariska** från Balthazar varje vardag kl **06:00** svensk tid.

**Flöde:** Vercel Cron (UTC) → /api/cron skrapar balthazar.se → committar `public/lunch.json` + `public/lunch.html` → Vercel autodeploy → sidan `/lunch` visar aktuell meny.

## Konfiguration (kort)
1. Ladda upp allt i denna mapp till din GitHub‑repo.
2. Importera repon i Vercel som nytt projekt (Next.js).
3. Lägg till Environment Variables i Vercel:
   - `GH_TOKEN` – GitHub Personal Access Token (repo:contents write)
   - `GH_OWNER` – t.ex. `henriklideberg`
   - `GH_REPO` – t.ex. `intranat-lunch`
   - `GH_BRANCH` – `main`
   - `INTRANET_TZ` – `Europe/Stockholm`
   - `BALTHAZAR_URL_WEEK` – `https://balthazar.se/veckans-lunch/`
   - `BALTHAZAR_URL_HOME` – `https://balthazar.se/`
4. Deploya. Cron‑jobben i `vercel.json` (04:00 och 05:00 UTC) motsvarar 06:00 svensk tid (CET/CEST) och funktionen är idempotent.

## Test
- Manuell körning: `https://<din-app>.vercel.app/api/cron` → ska svara med JSON (på vardagar fylls rätter om de finns publicerade hos Balthazar).
- Visning: `https://<din-app>.vercel.app/lunch` → läser `public/lunch.json`.

## Lokalt
```bash
npm i
npm run dev
# http://localhost:3000/lunch
```
