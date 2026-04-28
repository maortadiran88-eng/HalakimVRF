// utils.js
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const db=window._db;
const SEP='§';

// ── constants ──
const gid=()=>Math.random().toString(36).substr(2,9);
const DCOLS=()=>[{id:'ref',name:'מספר זיהוי'},{id:'nameHe',name:'שם בעברית'},{id:'nameEn',name:'Part Name'},{id:'mfgPn',name:'מק"ט יצרן'},{id:'tadPn',name:'מק"ט תדיראן'}];
const DCATS=()=>[{id:gid(),name:'יחידה פנימית',models:[]},{id:gid(),name:'יחידה חיצונית',models:[]},{id:gid(),name:'חימום מים',models:[]},{id:gid(),name:'בקרים',models:[]}];

const INIT=()=>({
  pass:'admin1234',editorPass:'editor1234',viewerPass:'tadir123',
  waDefaults:['nameHe','tadPn'],
  welcomeTitle:'ברוך הבא לקטלוג חלקי חילוף למערכות VRF',
  welcomeSub:'תחת המותג תדיראן',
  disclaimer:'מערכת זו מיועדת לשימוש עובדי תדיראן בלבד. הסיסמה אישית ואין להעבירה לגורם חיצוני. שימוש לא מורשה עלול לגרור השלכות משמעותיות.',
  brands:[
    {id:'gree',name:'GREE',color:'#1565c0',light:'#e3f2fd',categories:[
      {id:'gi0',name:'יחידה פנימית',models:[{id:'demo1',name:'GWH12ACC',synonyms:['GWH12ACC-K6DNA1A'],images:[],notes:'',columns:DCOLS(),parts:[
        {id:'dp1',values:{ref:'1',nameHe:'מנוע מאוורר',nameEn:'Fan Motor',mfgPn:'GM120023',tadPn:'TD-1001'},discontinued:false,tags:'מנוע,fan',pinned:false,comments:[]},
        {id:'dp2',values:{ref:'2',nameHe:'לוח אלקטרוני',nameEn:'Control Board',mfgPn:'CB340012',tadPn:'TD-1002'},discontinued:false,tags:'לוח,board,פיקוד',pinned:true,comments:[]},
      ]}]},
      {id:'gi1',name:'יחידה חיצונית',models:[]},{id:'gi2',name:'חימום מים',models:[]},{id:'gi3',name:'בקרים',models:[]},
    ]},
    {id:'toshiba',name:'TOSHIBA',color:'#c62828',light:'#ffebee',categories:[{id:'ti0',name:'יחידה פנימית',models:[]},{id:'ti1',name:'יחידה חיצונית',models:[]},{id:'ti2',name:'חימום מים',models:[]},{id:'ti3',name:'בקרים',models:[]}]},
    {id:'prime',name:'PRIME',color:'#2e7d32',light:'#e8f5e9',categories:[{id:'pi0',name:'יחידה פנימית',models:[]},{id:'pi1',name:'יחידה חיצונית',models:[]},{id:'pi2',name:'חימום מים',models:[]},{id:'pi3',name:'בקרים',models:[]}]},
  ]
});

// ── firebase ──
async function fbLoad(){
  const md=await db.collection('catalog').doc('meta').get();
  if(!md.exists)return null;
  const d=md.data().d;
  const mids=[];d.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>mids.push(m.id))));
  if(!mids.length)return d;
  const chunks=[];for(let i=0;i<mids.length;i+=20)chunks.push(mids.slice(i,i+20));
  const allD=[];for(const ch of chunks){const docs=await Promise.all(ch.map(id=>db.collection('parts').doc(id).get()));allD.push(...docs);}
  const pm={};allD.forEach(doc=>{if(doc.exists)pm[doc.id]=doc.data();});
  d.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
    const pd=pm[m.id]||{};
    m.parts=(pd.parts||[]).map(p=>({discontinued:false,tags:'',pinned:false,comments:[],...p}));
    m.images=pd.images||[];m.columns=pd.columns||DCOLS();m.synonyms=pd.synonyms||[];m.notes=pd.notes||'';
  })));
  return d;
}

async function fbSave(data,mids){
  const meta={pass:data.pass,editorPass:data.editorPass,viewerPass:data.viewerPass,waDefaults:data.waDefaults||['nameHe','tadPn'],
    welcomeTitle:data.welcomeTitle,welcomeSub:data.welcomeSub,disclaimer:data.disclaimer,
    brands:data.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.map(m=>({id:m.id,name:m.name}))}))}))};
  await db.collection('catalog').doc('meta').set({d:meta});
  const batch=db.batch();
  data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
    if(!mids.has(m.id))return;
    batch.set(db.collection('parts').doc(m.id),{parts:m.parts||[],images:m.images||[],columns:m.columns||DCOLS(),synonyms:m.synonyms||[],notes:m.notes||''});
  })));
  await batch.commit();
}

async function fbHist(e){try{await db.collection('history').add({...e,ts:firebase.firestore.FieldValue.serverTimestamp()});}catch{}}
async function fbGetHist(){try{const s=await db.collection('history').orderBy('ts','desc').limit(60).get();return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));}catch{return[];}}
async function fbSaveReport(r){return db.collection('reports').add({...r,ts:firebase.firestore.FieldValue.serverTimestamp(),resolved:false});}
async function fbGetReports(){try{const s=await db.collection('reports').orderBy('ts','desc').limit(100).get();return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));}catch{return[];}}
async function fbResolveReport(id){return db.collection('reports').doc(id).update({resolved:true});}

// ── helpers ──
async function compressImg(file){return new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height,M=1200;if(w>M||h>M){const r=Math.min(M/w,M/h);w=Math.round(w*r);h=Math.round(h*r);}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',.72));};img.src=e.target.result;};r.readAsDataURL(file);});}
const updBrands=(brands,bid,cid,mid,fn)=>brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:c.models.map(m=>m.id!==mid?m:fn(m))})});

function fuzzyMatch(q,text){
  const n=s=>s.toLowerCase().replace(/[\s\-_'"]/g,'');
  const nq=n(q),nt=n(text);
  if(!nq)return false;
  if(nt.includes(nq))return true;
  if(nq.length>=3){for(let i=0;i<nq.length;i++){const d=nq.slice(0,i)+nq.slice(i+1);if(nt.includes(d))return true;}}
  return false;
}

function partMatches(q,p,cols){
  const qParts=q.trim().toLowerCase().split(/\s+/);
  const allText=[...Object.values(p.values),p.tags||''].join(' ').toLowerCase();
  return qParts.every(qp=>fuzzyMatch(qp,allText));
}

// ── style atoms ──
const bB=bg=>({background:bg,border:'none',color:'#fff',padding:'7px 11px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:'bold',whiteSpace:'nowrap',flexShrink:0});
const sB=bg=>({background:bg,border:'none',color:'#fff',padding:'4px 10px',borderRadius:5,cursor:'pointer',fontSize:11,whiteSpace:'nowrap'});
const BPr=bg=>({background:bg,border:'none',color:'#fff',padding:'10px 0',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:14});
const BST={background:'var(--border)',border:'none',color:'var(--text)',padding:'10px 0',borderRadius:8,cursor:'pointer',fontSize:14};
const INS={width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',fontSize:14,boxSizing:'border-box',textAlign:'right',color:'var(--inp)',outline:'none',display:'block',background:'var(--ibg)'};
