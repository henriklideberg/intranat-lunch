
# Intranät – Balthazar Dagens Lunch (GitHub + Vercel)

Detta projekt publicerar automatiskt **Dagens lunch**, **Veckans fisk** och **Veckans vegetariska** från Balthazar varje vardag kl 06:00 svensk tid. 

**Flöde:** Vercel Cron (UTC) → serverlös funktion skrapar balthazar.se → committar `public/lunch.json` + `public/lunch.html` till denna repo → Vercel autodeploy → sidan `/lunch` visar aktuell meny.

## Steg 1 – Ladda upp till GitHub
Ladda upp hela denna mapp till ditt repo (main/master). 

## Steg 2 – Koppla till Vercel
1. Importera repon till Vercel som ett nytt projekt (Next.js). 
2. Lägg till **Environment Variables**:
   - `GH_TOKEN` – GitHub Personal Access Token (repo access)
   - `GH_OWNER` – t.ex. `henriklideberg`
   - `GH_REPO` – t.ex. `intranat-lunch`
   - `GH_BRANCH` – `main`
   - `INTRANET_TZ` – `Europe/Stockholm`
   - `BALTHAZAR_URL_WEEK` – `https://balthazar.se/veckans-lunch/`
   - `BALTHAZAR_URL_HOME` – `https://balthazar.se/`
3. Deploya.

## Steg 3 – Cron
`vercel.json` innehåller två cron-jobb (UTC):
- `0 4 * * 1-5` och `0 5 * * 1-5`  ⇒ motsvarar 06:00 svensk tid året runt.

## Steg 4 – Bädda in på intranätet
Använd Embed-webbdelen i SharePoint för att visa `https://<ditt-projekt>.vercel.app/lunch`. Om domänen blockeras: lägg till domänen i **HTML Field Security** (tillåtelselista) i din site collection.

## Lokalt
```bash
npm i
npm run dev
# öppna http://localhost:3000/lunch
```

