
import fs from 'fs';
import path from 'path';

export async function getServerSideProps(){
  const p = path.join(process.cwd(), 'public', 'lunch.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch(e) { data = {}; }
  return { props: { data } };
}

export default function Lunch({ data }){
  const d = data?.dishes || {};
  return (
    <html lang="sv">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Balthazar – Dagens lunch {data?.date || ''}</title>
        <style>{`
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;padding:16px;background:#fff;color:#111}
          .card{max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
          h1{font-size:20px;margin:0 0 4px}
          .muted{color:#6b7280;font-size:13px;margin-bottom:12px}
          .row{display:flex;gap:12px;flex-wrap:wrap}
          .pill{background:#f3f4f6;border-radius:999px;padding:6px 10px;font-size:14px}
          .dish{margin:8px 0;font-size:16px}
        `}</style>
      </head>
      <body>
        <div className="card">
          <h1>Dagens lunch – Balthazar</h1>
          <div className="muted">{data?.weekday || ''} {data?.date || ''}</div>
          <div className="row">
            <div className="pill">Dagens rätt</div>
            <div className="pill">Veckans fisk</div>
            <div className="pill">Veckans vegetariska</div>
          </div>
          <div className="dish"><strong>Dagens:</strong> {d.dagens || '-'}</div>
          <div className="dish"><strong>Fisk:</strong> {d.veckansFisk || '-'}</div>
          <div className="dish"><strong>Veg:</strong> {d.veckansVegetarisk || '-'}</div>
          <div className="muted">Källa: balthazar.se</div>
        </div>
      </body>
    </html>
  );
}
