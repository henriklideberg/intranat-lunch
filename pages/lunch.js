
import fs from 'fs';
import path from 'path';
import Head from 'next/head';

export async function getServerSideProps(){
  const p = path.join(process.cwd(), 'public', 'lunch.json');
  let data = {};
  try { data = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch(e) { data = {}; }
  return { props: { data } };
}

export default function Lunch({ data }){
  const d = data?.dishes || {};
  return (
    <>
      <Head>
        <title>Balthazar – Dagens lunch {data?.date || ''}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{fontFamily:'system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif',margin:0,padding:16,background:'#fff',color:'#111'}}>
        <div style={{maxWidth:620,margin:'0 auto',border:'1px solid #e5e7eb',borderRadius:12,padding:20,boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
          <h1 style={{fontSize:20,margin:'0 0 4px'}}>Dagens lunch – Balthazar</h1>
          <div style={{color:'#6b7280',fontSize:13,marginBottom:12}}>{data?.weekday || ''} {data?.date || ''}</div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <div style={{background:'#f3f4f6',borderRadius:999,padding:'6px 10px',fontSize:14}}>Dagens rätt</div>
            <div style={{background:'#f3f4f6',borderRadius:999,padding:'6px 10px',fontSize:14}}>Veckans fisk</div>
            <div style={{background:'#f3f4f6',borderRadius:999,padding:'6px 10px',fontSize:14}}>Veckans vegetariska</div>
          </div>
          <div style={{margin:'8px 0',fontSize:16}}><strong>Dagens:</strong> {d.dagens || '-'}</div>
          <div style={{margin:'8px 0',fontSize:16}}><strong>Fisk:</strong> {d.veckansFisk || '-'}</div>
          <div style={{margin:'8px 0',fontSize:16}}><strong>Veg:</strong> {d.veckansVegetarisk || '-'}</div>
          <div style={{color:'#6b7280',fontSize:13,marginTop:12}}>Källa: balthazar.se</div>
        </div>
      </div>
    </>
  );
}
