
import * as cheerio from 'cheerio';

function todayInTz(tz) {
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
  const dayFmt  = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, weekday:'long' });
  return { date: dateFmt.format(now), weekday: dayFmt.format(now).toLowerCase() };
}
const clean = s => (s||'').replace(/\s+/g,' ').replace(//g,'').trim();

function linesFromHtml(html) {
  const $ = cheerio.load(html);
  const text = $('main').text() || $('body').text() || $.root().text();
  // Viktigt: använd ett regex för radbrytningar så slipper vi problem med '\n'
  return text.split(/\r?\n/).map(x => clean(x)).filter(Boolean);
}

function parseWeekly(html, weekdaySv){
  const lines = linesFromHtml(html);
  const lower = lines.map(l => l.toLowerCase());
  const dayIdx = lower.findIndex(l => l.startsWith(weekdaySv));
  let dagens = null;
  if (dayIdx >= 0){
    const after = lines.slice(dayIdx, dayIdx+4);
    const maybeInline = after[0].replace(new RegExp(`^${weekdaySv}\s*:?\s*`, 'i'), '');
    if (maybeInline && maybeInline.length < 200) dagens = clean(maybeInline);
    if (!dagens) dagens = clean(after[1] || '');
  }
  const vfIdx = lower.findIndex(l => l.startsWith('veckans fisk'));
  const vvIdx = lower.findIndex(l => l.startsWith('veckans vegetariska') || l.startsWith('veckans vegetarisk'));
  const veckansFisk = vfIdx >= 0 ? clean(lines[vfIdx+1] || '') : '';
  const veckansVeg  = vvIdx >= 0 ? clean(lines[vvIdx+1] || '') : '';
  return { dagens, veckansFisk, veckansVeg };
}

function parseHomepage(html){
  const lines = linesFromHtml(html);
  const lower = lines.map(l => l.toLowerCase());
  const dlIdx = lower.findIndex(l => l.includes('dagens lunch'));
  if (dlIdx === -1) return { todaysThree: [] };
  const candidates = [];
  for (let i=dlIdx+1; i<Math.min(lines.length, dlIdx+15); i++){
    const x = clean(lines[i]);
    if (!/^serveras/i.test(x) && x.length>2 && x.length<120) candidates.push(x);
    if (candidates.length >= 3) break;
  }
  return { todaysThree: candidates };
}

async function putGithubFile({owner, repo, path, branch, token, content, message}){
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' };
  let sha;
  const getResp = await fetch(api, { headers });
  if (getResp.ok){
    const json = await getResp.json();
    if (json && json.sha) sha = json.sha;
  }
  const putResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), branch, sha })
  });
  if (!putResp.ok) throw new Error(`GitHub PUT failed ${putResp.status}: ${await putResp.text()}`);
  return putResp.json();
}

export default async function handler(req, res){
  try{
    const tz = process.env.INTRANET_TZ || 'Europe/Stockholm';
    const { date, weekday } = todayInTz(tz);
    if (!['måndag','tisdag','onsdag','torsdag','fredag'].includes(weekday)){
      return res.status(200).json({ skipped:true, reason:'helg' });
    }

    const weekUrl = process.env.BALTHAZAR_URL_WEEK || 'https://balthazar.se/veckans-lunch/';
    const homeUrl = process.env.BALTHAZAR_URL_HOME || 'https://balthazar.se/';

    let weeklyHtml = '';
    try {
      const r = await fetch(weekUrl, { headers: { 'User-Agent': 'intranet-lunch-bot' }});
      if (r.ok) weeklyHtml = await r.text();
    } catch(e) {}

    let dagens='', veckansFisk='', veckansVeg='';
    if (weeklyHtml){
      const p = parseWeekly(weeklyHtml, weekday);
      dagens = p.dagens || '';
      veckansFisk = p.veckansFisk || '';
      veckansVeg  = p.veckansVeg || '';
    }

    if (!dagens || !veckansFisk || !veckansVeg){
      const r2 = await fetch(homeUrl, { headers: { 'User-Agent': 'intranet-lunch-bot' }});
      if (r2.ok){
        const html2 = await r2.text();
        const ph = parseHomepage(html2);
        if (!dagens && ph.todaysThree?.[0]) dagens = ph.todaysThree[0];
        if (!veckansVeg && ph.todaysThree?.[1]) veckansVeg = ph.todaysThree[1];
        if (!veckansFisk && ph.todaysThree?.[2]) veckansFisk = ph.todaysThree[2];
      }
    }

    if (!dagens && !veckansFisk && !veckansVeg){
      throw new Error('Kunde inte extrahera rätter från Balthazar.');
    }

    const payload = {
      date, weekday,
      source: { week: weekUrl, home: homeUrl },
      dishes: { dagens: dagens || '', veckansFisk: veckansFisk || '', veckansVegetarisk: veckansVeg || '' }
    };

    const owner  = process.env.GH_OWNER;
    const repo   = process.env.GH_REPO;
    const branch = process.env.GH_BRANCH || 'main';
    const token  = process.env.GH_TOKEN;
    if (!owner || !repo || !token) throw new Error('Saknar GH_OWNER/GH_REPO/GH_TOKEN');

    const jsonContent = JSON.stringify(payload, null, 2) + '
';
    const htmlContent = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Balthazar – Dagens lunch ${date}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;padding:16px;background:#fff;color:#111}.card{max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}h1{font-size:20px;margin:0 0 4px}.muted{color:#6b7280;font-size:13px;margin-bottom:12px}.row{display:flex;gap:12px;flex-wrap:wrap}.pill{background:#f3f4f6;border-radius:999px;padding:6px 10px;font-size:14px}.dish{margin:8px 0;font-size:16px}</style></head><body><div class="card"><h1>Dagens lunch – Balthazar</h1><div class="muted">${weekday} ${date}</div><div class="row"><div class="pill">Dagens rätt</div><div class="pill">Veckans fisk</div><div class="pill">Veckans vegetariska</div></div><div class="dish"><strong>Dagens:</strong> ${dagens || '-'}</div><div class="dish"><strong>Fisk:</strong> ${veckansFisk || '-'}</div><div class="dish"><strong>Veg:</strong> ${veckansVeg || '-'}</div><div class="muted">Källa: <a href="${weekUrl}">Veckans lunch</a> / <a href="${homeUrl}">Startsida</a></div></div></body></html>`;

    await putGithubFile({ owner, repo, branch, token, path: 'public/lunch.json', content: jsonContent, message: `chore: update lunch ${date}` });
    await putGithubFile({ owner, repo, branch, token, path: 'public/lunch.html', content: htmlContent, message: `chore: update lunch (html) ${date}` });

    return res.status(200).json({ ok:true, payload });
  } catch(err){
    console.error(err);
    return res.status(500).json({ ok:false, error:String(err) });
  }
}
