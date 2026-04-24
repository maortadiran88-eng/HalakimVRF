// ══════════ SHARED GLOBALS ══════════
const {useState,useEffect,useRef,useMemo,useCallback}=React;
const db=window._db;
const SEP='§';
const gid=()=>Math.random().toString(36).substr(2,9);
const DCOLS=()=>[{id:'ref',name:'מספר זיהוי'},{id:'nameHe',name:'שם'},{id:'nameEn',name:'Part Name'},{id:'mfgPn',name:'מק"ט יצרן'},{id:'tadPn',name:'מק"ט תדיראן'}];
const DCATS=()=>[{id:gid(),name:'יחידה פנימית',models:[]},{id:gid(),name:'יחידה חיצונית',models:[]},{id:gid(),name:'חימום מים',models:[]},{id:gid(),name:'בקרים',models:[]}];

const DEFAULT_TIPS=[
  'השתמש בחיפוש הגלובלי בראש העמוד לאיתור מהיר של כל חלק לפי שם, מק"ט, או דגם',
  'בחר מספר חלקים בטבלה ושלח אותם ישירות לווצאפ כרשימה מסודרת',
  'הוסף דגמים למועדפים ⭐ לגישה מהירה ממסך הבית',
  'לחץ על עמוד ניווט 📱 לתצוגה ידידותית לסמארטפון',
  'לחץ 🖨️ להדפסת כרטיס דגם מלא כולל שרטוטים',
  'ניתן לשתף קישור ישיר לכל דגם בלחיצת 🔗',
];

const INIT=()=>({
  pass:'admin1234',editorPass:'editor1234',viewerPass:'tadir123',
  waDefaults:['nameHe','tadPn'],
  welcomeTitle:'ברוך הבא לקטלוג חלקי חילוף למערכות VRF',
  welcomeSub:'תחת המותג תדיראן',
  disclaimer:'מערכת זו מיועדת לשימוש עובדי תדיראן בלבד. הסיסמה אישית ואין להעבירה לגורם חיצוני.',
  greetingMorning:'בוקר טוב! ☀️',
  greetingAfternoon:'צהריים טובים! 🌤️',
  greetingEvening:'ערב טוב! 🌙',
  greetingNight:'לילה טוב! 🌟',
  tips:DEFAULT_TIPS,
  news:[],
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

// ── style atoms ──
const bB=bg=>({background:bg,border:'none',color:'#fff',padding:'7px 11px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:'bold',whiteSpace:'nowrap',flexShrink:0});
const sB=bg=>({background:bg,border:'none',color:'#fff',padding:'4px 10px',borderRadius:5,cursor:'pointer',fontSize:11,whiteSpace:'nowrap'});
const BPr=bg=>({background:bg,border:'none',color:'#fff',padding:'10px 0',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:14});
const BST={background:'var(--border)',border:'none',color:'var(--text)',padding:'10px 0',borderRadius:8,cursor:'pointer',fontSize:14};
const INS={width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',fontSize:14,boxSizing:'border-box',textAlign:'right',color:'var(--inp)',outline:'none',display:'block',background:'var(--ibg)'};

// ── helpers ──
function partMatchesGlobal(q,p){
  const qParts=q.trim().toLowerCase().split(/\s+/);
  const allText=[...Object.values(p.values),p.tags||''].join(' ').toLowerCase();
  return qParts.every(qp=>allText.includes(qp));
}
const sanitizeSheet=n=>n.replace(/[\\\/\[\]\*\?:]/g,'').slice(0,31)||'Sheet';
const updBrands=(brands,bid,cid,mid,fn)=>brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:c.models.map(m=>m.id!==mid?m:fn(m))})});

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
  if(!d.tips)d.tips=DEFAULT_TIPS;
  if(!d.news)d.news=[];
  if(!d.greetingMorning)d.greetingMorning='בוקר טוב! ☀️';
  if(!d.greetingAfternoon)d.greetingAfternoon='צהריים טובים! 🌤️';
  if(!d.greetingEvening)d.greetingEvening='ערב טוב! 🌙';
  if(!d.greetingNight)d.greetingNight='לילה טוב! 🌟';
  return d;
}
async function fbSave(data,mids){
  const meta={
    pass:data.pass,editorPass:data.editorPass,viewerPass:data.viewerPass,
    waDefaults:data.waDefaults||['nameHe','tadPn'],
    welcomeTitle:data.welcomeTitle,welcomeSub:data.welcomeSub,disclaimer:data.disclaimer,
    greetingMorning:data.greetingMorning||'בוקר טוב! ☀️',
    greetingAfternoon:data.greetingAfternoon||'צהריים טובים! 🌤️',
    greetingEvening:data.greetingEvening||'ערב טוב! 🌙',
    greetingNight:data.greetingNight||'לילה טוב! 🌟',
    tips:data.tips||DEFAULT_TIPS,news:data.news||[],
    brands:data.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.map(m=>({id:m.id,name:m.name}))}))}))
  };
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
async function fbSaveMissingModel(r){return db.collection('missing_models').add({...r,ts:firebase.firestore.FieldValue.serverTimestamp(),resolved:false});}
async function fbGetMissingModels(){try{const s=await db.collection('missing_models').orderBy('ts','desc').limit(100).get();return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));}catch{return[];}}
async function fbResolveMissing(id,note){return db.collection('missing_models').doc(id).update({resolved:true,resolveNote:note||'',resolvedAt:firebase.firestore.FieldValue.serverTimestamp()});}
async function fbDeleteMissing(id){return db.collection('missing_models').doc(id).delete();}

// ── recycle bin: save to firestore ──
async function fbTrash(type,data){
  const exp=new Date();exp.setDate(exp.getDate()+30);
  return db.collection('trash').add({type,data:JSON.stringify(data),ts:firebase.firestore.FieldValue.serverTimestamp(),expiresAt:exp.toISOString()});
}
async function fbGetTrash(){
  try{
    const s=await db.collection('trash').orderBy('ts','desc').limit(200).get();
    const now=new Date();
    const items=s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||'',parsed:null}));
    // filter expired
    return items.filter(i=>{
      if(!i.expiresAt)return true;
      return new Date(i.expiresAt)>now;
    }).map(i=>{try{i.parsed=JSON.parse(i.data);}catch{}return i;});
  }catch{return[];}
}
async function fbDeleteTrashItem(id){return db.collection('trash').doc(id).delete();}

async function compressImg(file){return new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height,M=1200;if(w>M||h>M){const r=Math.min(M/w,M/h);w=Math.round(w*r);h=Math.round(h*r);}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);res(c.toDataURL('image/jpeg',.72));};img.src=e.target.result;};r.readAsDataURL(file);});}

// ══════════ MODAL ══════════
function Modal({children,onClose,wide,title}){
  return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
    <div style={{background:'var(--card)',borderRadius:14,padding:24,width:'100%',maxWidth:wide?680:390,maxHeight:'92vh',overflowY:'auto',animation:'fadeIn .15s',color:'var(--text)'}} dir="rtl" onClick={e=>e.stopPropagation()}>
      {title&&<div style={{fontWeight:'bold',fontSize:17,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:12}}>{title}</div>}
      {children}
    </div>
  </div>);
}

// ══════════ NEWS & TIPS BAR ══════════
function NewsTipsBar({data,admin,onEditNewsTips}){
  const tips=data.tips||DEFAULT_TIPS;
  const news=data.news||[];
  const[tipKey,setTipKey]=useState(()=>Math.floor(Date.now()/3600000));
  const[showAll,setShowAll]=useState(false);
  useEffect(()=>{const t=setInterval(()=>setTipKey(Math.floor(Date.now()/3600000)),60000);return()=>clearInterval(t);},[]);
  const currentTip=tips.length?tips[tipKey%tips.length]:'';

  // Helper to navigate to a model referenced in a news item
  const handleNewsClick=(n,onNav)=>{if(n.modelBid&&n.modelCid&&n.modelMid&&onNav)onNav(n.modelBid,n.modelCid,n.modelMid);};

  return(<div style={{background:'var(--card)',borderRadius:12,marginBottom:14,boxShadow:'0 1px 4px var(--shadow)',overflow:'hidden'}}>
    <div style={{display:'flex',alignItems:'center',gap:0,borderBottom:news.length||showAll?'1px solid var(--border)':'none'}}>
      <div style={{background:'#1565c0',color:'#fff',padding:'9px 14px',fontSize:12,fontWeight:'bold',flexShrink:0}}>💡 טיפ</div>
      <div style={{flex:1,padding:'9px 14px',fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={currentTip}>{currentTip}</div>
      <div style={{display:'flex',alignItems:'center',gap:6,paddingLeft:10,flexShrink:0}}>
        {news.length>0&&<button onClick={()=>setShowAll(v=>!v)} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'var(--sub)'}}>{showAll?'הסתר ▲':'📰 חדשות ▼'}</button>}
        {admin&&<button onClick={onEditNewsTips} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:11,color:'#1565c0'}}>✏️ ערוך</button>}
      </div>
    </div>
    {(showAll||(news.length>0&&news.length<=2))&&news.length>0&&(
      <div style={{padding:'10px 14px',background:'var(--row2)'}}>
        <div style={{fontWeight:'bold',fontSize:11,color:'var(--sub)',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
          📰 חדשות ועדכונים
          <span style={{background:'#e53935',color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:10}}>{news.length}</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {news.map((n,i)=>(
            <div key={n.id||i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{background:n.type==='new'?'#e8f5e9':n.type==='update'?'#fff3e0':'#e3f2fd',color:n.type==='new'?'#2e7d32':n.type==='update'?'#e65100':'#1565c0',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:'bold',flexShrink:0,whiteSpace:'nowrap'}}>
                {n.type==='new'?'✨ חדש':n.type==='update'?'🔄 עדכון':'📌 הודעה'}
              </span>
              <span style={{fontSize:13,color:n.modelMid?'#1565c0':'var(--text)',lineHeight:1.4,cursor:n.modelMid?'pointer':'default',textDecoration:n.modelMid?'underline':'none'}}
                onClick={()=>{if(n.modelMid&&window._navToModel)window._navToModel(n.modelBid,n.modelCid,n.modelMid);}}>
                {n.text}
              </span>
              {n.date&&<span style={{fontSize:10,color:'var(--sub)',flexShrink:0,marginRight:'auto'}}>{n.date}</span>}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>);
}

// ══════════ EDIT NEWS & TIPS MODAL ══════════
function NewsTipsEditor({data,onSave,onClose}){
  const[tips,setTips]=useState((data.tips||DEFAULT_TIPS).join('\n'));
  const[news,setNews]=useState(data.news||[]);
  const[newText,setNewText]=useState('');
  const[newType,setNewType]=useState('new');
  const[greetings,setGreetings]=useState({
    morning:data.greetingMorning||'בוקר טוב! ☀️',
    afternoon:data.greetingAfternoon||'צהריים טובים! 🌤️',
    evening:data.greetingEvening||'ערב טוב! 🌙',
    night:data.greetingNight||'לילה טוב! 🌟',
  });
  // For linking news to a model
  const[linkModel,setLinkModel]=useState(null);// {bid,cid,mid,name}
  const[showModelPicker,setShowModelPicker]=useState(false);
  const[pickerQ,setPickerQ]=useState('');

  const allModels=[];
  data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>allModels.push({bid:b.id,cid:c.id,mid:m.id,name:m.name,bname:b.name,color:b.color}))));
  const filteredModels=pickerQ.trim()?allModels.filter(m=>m.name.toLowerCase().includes(pickerQ.toLowerCase())||m.bname.toLowerCase().includes(pickerQ.toLowerCase())):allModels.slice(0,20);

  const addNews=()=>{
    if(!newText.trim())return;
    const today=new Date().toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'2-digit'});
    const item={id:gid(),text:newText.trim(),type:newType,date:today};
    if(linkModel){item.modelBid=linkModel.bid;item.modelCid=linkModel.cid;item.modelMid=linkModel.mid;item.modelName=linkModel.name;}
    setNews(p=>[item,...p]);
    setNewText('');setLinkModel(null);
  };
  const delNews=id=>setNews(p=>p.filter(n=>n.id!==id));

  const save=()=>{
    const tipsArr=tips.split('\n').map(t=>t.trim()).filter(Boolean);
    if(!tipsArr.length){alert('הוסף לפחות טיפ אחד');return;}
    onSave({...data,tips:tipsArr,news,
      greetingMorning:greetings.morning,greetingAfternoon:greetings.afternoon,
      greetingEvening:greetings.evening,greetingNight:greetings.night});
    onClose();
  };

  return(<Modal onClose={onClose} wide title="✏️ עריכת טיפים, ברכות וחדשות">
    {/* Greetings */}
    <div style={{marginBottom:18,background:'var(--row2)',borderRadius:10,padding:12}}>
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--text)',marginBottom:8}}>👋 ברכות לפי שעה</div>
      {[['morning','05:00–11:59','בוקר'],['afternoon','12:00–17:59','צהריים'],['evening','18:00–21:59','ערב'],['night','22:00–04:59','לילה']].map(([k,range,label])=>(
        <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <span style={{fontSize:12,color:'var(--sub)',width:90,flexShrink:0}}>{label} ({range}):</span>
          <input value={greetings[k]} onChange={e=>setGreetings(p=>({...p,[k]:e.target.value}))} style={{...INS,padding:'6px 10px',fontSize:13}}/>
        </div>
      ))}
    </div>

    {/* Tips */}
    <div style={{marginBottom:18}}>
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--text)',marginBottom:4}}>💡 טיפים לשימוש</div>
      <div style={{fontSize:12,color:'var(--sub)',marginBottom:8}}>כל שורה = טיפ אחד. מתחלפים כל שעה.</div>
      <textarea value={tips} onChange={e=>setTips(e.target.value)} rows={6}
        style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',color:'var(--inp)',background:'var(--ibg)',fontFamily:'Arial',lineHeight:1.8,boxSizing:'border-box'}}/>
    </div>

    {/* News */}
    <div>
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--text)',marginBottom:8}}>📰 הוסף חדשה</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
        {[['new','✨ חדש','#4caf50'],['update','🔄 עדכון','#ff9800'],['notice','📌 הודעה','#1565c0']].map(([k,l,c])=>(
          <div key={k} onClick={()=>setNewType(k)} style={{padding:'5px 12px',borderRadius:20,border:`2px solid ${newType===k?c:'var(--border)'}`,background:newType===k?c+'22':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>{l}</div>
        ))}
      </div>
      <input value={newText} onChange={e=>setNewText(e.target.value)} placeholder="טקסט החדשה..." style={{...INS,marginBottom:8}}/>
      {/* Link to model */}
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <span style={{fontSize:12,color:'var(--sub)'}}>קישור לדגם (אופציונלי):</span>
        {linkModel
          ?<div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:12,color:'#1565c0',fontWeight:'bold'}}>{linkModel.name}</span>
            <button onClick={()=>setLinkModel(null)} style={sB('#e53935')}>✕</button>
          </div>
          :<button onClick={()=>setShowModelPicker(true)} style={sB('#607d8b')}>+ בחר דגם</button>}
      </div>
      {showModelPicker&&<div style={{border:'1px solid var(--border)',borderRadius:8,padding:8,marginBottom:8,background:'var(--card)'}}>
        <input value={pickerQ} onChange={e=>setPickerQ(e.target.value)} placeholder="חיפוש דגם..." style={{...INS,padding:'6px 10px',marginBottom:8,fontSize:12}}/>
        <div style={{maxHeight:160,overflowY:'auto'}}>
          {filteredModels.map(m=>(
            <div key={m.mid} onClick={()=>{setLinkModel(m);setShowModelPicker(false);setPickerQ('');}}
              style={{padding:'6px 10px',cursor:'pointer',borderRadius:6,display:'flex',gap:8,alignItems:'center',marginBottom:2}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--row2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{background:m.color,color:'#fff',padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>{m.bname}</span>
              <span style={{fontSize:13,color:'var(--text)'}}>{m.name}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>setShowModelPicker(false)} style={{...BST,marginTop:6,width:'100%',padding:'6px'}}>סגור</button>
      </div>}
      <button onClick={addNews} style={{...BPr('#1565c0'),width:'100%',marginBottom:14}}>+ הוסף</button>
      {news.length>0&&<div style={{maxHeight:180,overflowY:'auto',borderTop:'1px solid var(--border)',paddingTop:8}}>
        {news.map((n,i)=>(
          <div key={n.id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontSize:10,background:'#e3f2fd',color:'#1565c0',padding:'1px 6px',borderRadius:4,flexShrink:0}}>{n.type}</span>
            <span style={{flex:1,fontSize:12,color:'var(--text)'}}>{n.text}{n.modelName&&<span style={{color:'#1565c0',marginRight:4}}>→ {n.modelName}</span>}</span>
            <button onClick={()=>delNews(n.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:14,flexShrink:0}}>🗑</button>
          </div>
        ))}
      </div>}
    </div>
    <div style={{display:'flex',gap:8,marginTop:16}}>
      <button onClick={save} style={{flex:1,...BPr('#1565c0')}}>✓ שמור הכל</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ USER GUIDE MODAL ══════════
function LegendModal({loginRole,onClose}){
  const[tab,setTab]=useState(loginRole);
  useEffect(()=>setTab(loginRole),[loginRole]);
  const Section=({title,children})=>(<div style={{marginBottom:16}}><div style={{fontWeight:'bold',fontSize:13,color:'#1565c0',marginBottom:8,paddingBottom:4,borderBottom:'1px solid var(--border)'}}>{title}</div>{children}</div>);
  const Row=({icon,label,desc})=>(<div style={{display:'flex',gap:10,marginBottom:6,alignItems:'flex-start'}}><span style={{fontSize:16,flexShrink:0,width:22}}>{icon}</span><div><span style={{fontWeight:'bold',fontSize:12,color:'var(--text)'}}>{label}</span><div style={{fontSize:11,color:'var(--sub)',marginTop:1,lineHeight:1.4}}>{desc}</div></div></div>);

  const viewerGuide=(<div>
    <div style={{background:'#e3f2fd',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#1565c0',lineHeight:1.7}}>ברוך הבא! מדריך זה יעזור לך להשתמש בקטלוג.</div>
    <Section title="🧭 ניווט">
      <Row icon="☰" label="תפריט צד" desc="פתח/סגור רשימת מותגים ודגמים לניווט מהיר"/>
      <Row icon="⭐" label="מועדפים" desc="סמן דגמים כמועדפים — יופיעו בראש מסך הבית"/>
      <Row icon="🕐" label="נצפו לאחרונה" desc="מסך הבית מציג 6 הדגמים האחרונים שבדקת"/>
    </Section>
    <Section title="🔍 חיפוש">
      <Row icon="🔍" label="חיפוש גלובלי" desc="הקלד בשורת החיפוש העליונה — מחפש בכל המותגים, דגמים, חלקים ומק&quot;טים"/>
      <Row icon="🔎" label="חיפוש לפי דגם" desc="בסרגל הצד לחץ על 🔍 לחיפוש דגם מהיר"/>
      <Row icon="🔎" label="חיפוש בתוך דגם" desc="בתוך כל דגם יש שורת חיפוש מקומית שמסננת את הטבלה"/>
    </Section>
    <Section title="📤 ייצוא ושיתוף">
      <Row icon="🖨️" label="PDF" desc="הדפס כרטיס דגם מלא עם כל החלקים"/>
      <Row icon="📊" label="Excel" desc="הורד את חלקי הדגם לקובץ Excel"/>
      <Row icon="🔗" label="שתף" desc="העתק קישור ישיר לדגם"/>
      <Row icon="📱" label="נייד" desc="עבור לתצוגה מותאמת לסמארטפון"/>
    </Section>
    <Section title="📱 שליחה לווצאפ">
      <Row icon="☑️" label="בחירת שורות" desc="לחץ על שורות בטבלה לסימונן"/>
      <Row icon="📱" label="שלח לווצאפ" desc="לאחר בחירה, לחץ 'ערוך ושלח'"/>
    </Section>
    <Section title="⚠️ דיווח שגיאות">
      <Row icon="⚠️" label="דווח שגיאה" desc="מצאת נתון שגוי? לחץ על הכפתור הכתום בראש הדגם"/>
      <Row icon="❓" label="חסר דגם?" desc="גלול למטה בכל דגם ולחץ 'חסר דגם? דווח לנו'"/>
    </Section>
    <Section title="📱 התקנה על המסך הבית">
      <Row icon="📱" label="אייפון/אייפד" desc="לחץ על כפתור השיתוף ↑ בסאפארי ← 'הוסף למסך הבית'"/>
      <Row icon="🤖" label="אנדרואיד/כרום" desc="לחץ על תפריט ⋮ בכרום ← 'הוסף למסך הבית' — או לחץ על כפתור ההתקנה שמופיע"/>
    </Section>
  </div>);

  const editorGuide=(<div>
    <div style={{background:'#fff3e0',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#e65100',lineHeight:1.7}}>כעורך יש לך את כל יכולות הצופה, בנוסף לעריכה והוספת תוכן.</div>
    <Section title="✏️ עריכת תוכן">
      <Row icon="+" label="הוספת דגם" desc="בתפריט הצד, לחץ + ליד שם הקטגוריה"/>
      <Row icon="✏️" label="עריכת שם דגם" desc="בדגם, לחץ על כפתור ✏️ ליד שם הדגם לעריכה"/>
      <Row icon="+" label="הוספת חלק" desc="בטבלת הדגם, לחץ '+ שורה'"/>
      <Row icon="+" label="הוספת עמודה" desc="לחץ '+ עמודה' להוספת שדה מידע חדש"/>
      <Row icon="✏️" label="עריכת תאים" desc="לחץ ישירות על כל תא לעריכה"/>
    </Section>
    <Section title="📋 ייבוא">
      <Row icon="📥" label="ייבוא Excel" desc="לחץ '📥 ייבוא' בסרגל לייבוא מ-Excel"/>
      <Row icon="📋" label="הדבקה מהירה" desc="לחץ '📋 הדבק' והדבק ישירות מ-Excel"/>
    </Section>
  </div>);

  const adminGuide=(<div>
    <div style={{background:'#fce4ec',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#b71c1c',lineHeight:1.7}}>כמנהל יש לך גישה מלאה לכל המערכת.</div>
    <Section title="⚙️ ניהול מערכת">
      <Row icon="⚙" label="ניהול מותגים" desc="הוסף/מחק/ערוך מותגים ושנה צבעיהם"/>
      <Row icon="🔑" label="הגדרות מנהל" desc="שנה סיסמאות, ערוך טקסטי מסך כניסה"/>
      <Row icon="✏️" label="טיפים וחדשות" desc="ערוך טיפים, ברכות ולוח חדשות"/>
    </Section>
    <Section title="🔔 ניטור">
      <Row icon="🔔" label="התראות" desc="דיווחי שגיאה, שדות חסרים, בקשות דגמים חסרים"/>
      <Row icon="🗑" label="סל מיחזור" desc="פריטים שנמחקו — ניתן לשחזר תוך 30 יום"/>
      <Row icon="📋" label="לוג שינויים" desc="היסטוריית כל הפעולות שבוצעו"/>
    </Section>
    <Section title="💾 גיבוי">
      <Row icon="📊" label="Excel מלא" desc="ייצא את כל הקטלוג ל-Excel"/>
      <Row icon="💾" label="גיבוי JSON" desc="הורד גיבוי מלא של כל הנתונים"/>
    </Section>
  </div>);

  // Show only relevant tabs per role
  const tabs=loginRole==='viewer'
    ?[['viewer','🔧 מדריך שימוש']]
    :loginRole==='editor'
    ?[['viewer','🔧 צופה'],['editor','✏️ עורך']]
    :[['viewer','🔧 צופה'],['editor','✏️ עורך'],['admin','👑 מנהל']];

  return(<Modal onClose={onClose} wide title="📖 מדריך שימוש">
    {tabs.length>1&&<div style={{display:'flex',gap:4,marginBottom:16}}>
      {tabs.map(([k,l])=>(<button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'8px',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:13,background:tab===k?'#1565c0':'var(--row2)',color:tab===k?'#fff':'var(--text)'}}>{l}</button>))}
    </div>}
    <div style={{maxHeight:'58vh',overflowY:'auto'}}>
      {tab==='viewer'&&viewerGuide}
      {tab==='editor'&&<><div style={{marginBottom:14}}>{viewerGuide}</div><div style={{borderTop:'2px dashed var(--border)',paddingTop:14}}>{editorGuide}</div></>}
      {tab==='admin'&&<><div style={{marginBottom:14}}>{editorGuide}</div><div style={{borderTop:'2px dashed var(--border)',paddingTop:14}}>{adminGuide}</div></>}
    </div>
    <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
  </Modal>);
}

// ══════════ LOGIN SCREEN ══════════
function LoginScreen({data,onLogin}){
  const[pwd,setPwd]=useState('');const[err,setErr]=useState('');
  const submit=()=>{
    if(pwd===data.pass)onLogin('admin');
    else if(pwd===(data.editorPass||'editor1234'))onLogin('editor');
    else if(pwd===(data.viewerPass||'tadir123'))onLogin('viewer');
    else setErr('סיסמה שגויה');
  };
  return(<div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:'rtl'}}>
    <div style={{background:'#fff',borderRadius:20,padding:'40px 32px',maxWidth:400,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.5)',animation:'slideUp .4s'}}>
      <div style={{fontSize:56,marginBottom:12}}>🔧</div>
      <div style={{fontWeight:'bold',fontSize:20,color:'#1565c0',marginBottom:6,lineHeight:1.4,whiteSpace:'pre-line'}}>{data.welcomeTitle||'ברוך הבא לקטלוג חלקי חילוף\nלמערכות VRF'}</div>
      <div style={{fontSize:14,color:'#6b7280',marginBottom:28}}>{data.welcomeSub||'תחת המותג תדיראן'}</div>
      <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
        placeholder="הזן סיסמת כניסה" autoFocus
        style={{width:'100%',padding:'13px 16px',borderRadius:10,border:`2px solid ${err?'#e53935':'#e5e7eb'}`,fontSize:15,textAlign:'center',marginBottom:10,outline:'none',boxSizing:'border-box',transition:'border .2s'}}/>
      {err&&<div style={{color:'#e53935',fontSize:13,marginBottom:10,fontWeight:'bold'}}>{err}</div>}
      <button onClick={submit} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#1565c0,#1976d2)',color:'#fff',border:'none',borderRadius:10,fontSize:16,fontWeight:'bold',cursor:'pointer',marginBottom:22,boxShadow:'0 4px 14px rgba(21,101,192,.4)'}}>
        כניסה למערכת ←
      </button>
      <div style={{background:'#fff8e1',borderRadius:10,padding:'12px 14px',fontSize:12,color:'#795548',textAlign:'right',lineHeight:1.7,border:'1px solid #ffe082'}}>
        ⚠️ {data.disclaimer||'מערכת זו מיועדת לשימוש עובדי תדיראן בלבד.'}
      </div>
    </div>
  </div>);
}

// ══════════ HOME SCREEN ══════════
function HomeScreen({data,onNav,recent,favorites,onToggleFav,admin,onEditNewsTips}){
  const total=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.length,0),0);
  const totalParts=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.reduce((sss,m)=>sss+m.parts.length,0),0),0);
  const fmtTime=ts=>{const diff=Math.floor((Date.now()-ts)/60000);if(diff<1)return'עכשיו';if(diff<60)return`לפני ${diff} דק'`;if(diff<1440)return`לפני ${Math.floor(diff/60)} שע'`;return new Date(ts).toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'});};
  const recentModels=recent.slice(0,6).map(rv=>{const b=data.brands.find(x=>x.id===rv.bid);const c=b?.categories.find(x=>x.id===rv.cid);const m=c?.models.find(x=>x.id===rv.mid);if(!b||!c||!m)return null;return{b,c,m,ts:rv.ts};}).filter(Boolean);
  const favModels=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{if(favorites.has(m.id))favModels.push({b,c,m});})));

  // Time-based greeting
  const getGreeting=()=>{
    const h=new Date().getHours();
    if(h>=5&&h<12)return data.greetingMorning||'בוקר טוב! ☀️';
    if(h>=12&&h<18)return data.greetingAfternoon||'צהריים טובים! 🌤️';
    if(h>=18&&h<22)return data.greetingEvening||'ערב טוב! 🌙';
    return data.greetingNight||'לילה טוב! 🌟';
  };

  return(<div>
    {/* Greeting */}
    <div style={{background:'var(--card)',borderRadius:12,padding:'12px 16px',marginBottom:14,boxShadow:'0 1px 4px var(--shadow)',fontSize:15,fontWeight:'bold',color:'var(--text)'}}>
      {getGreeting()}
    </div>

    <NewsTipsBar data={data} admin={admin} onEditNewsTips={onEditNewsTips}/>

    {/* Stats */}
    <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
      {[['❄️','דגמים',total,'#1565c0'],['🔩','חלקים',totalParts.toLocaleString(),'#2e7d32'],['🏷️','מותגים',data.brands.length,'#6a1b9a']].map(([ic,lb,v,col])=>(
        <div key={lb} style={{background:'var(--card)',borderRadius:12,padding:'12px 16px',flex:'1 1 90px',boxShadow:'0 1px 4px var(--shadow)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:26}}>{ic}</span><div><div style={{fontSize:18,fontWeight:'bold',color:col}}>{v}</div><div style={{fontSize:11,color:'var(--sub)'}}>{lb}</div></div>
        </div>
      ))}
    </div>

    {favModels.length>0&&(<div style={{marginBottom:18}}>
      <div style={{fontWeight:'bold',fontSize:13,color:'var(--sub)',marginBottom:8}}>⭐ מועדפים</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))',gap:8}}>
        {favModels.map(({b,c,m})=>(
          <div key={m.id} style={{background:'var(--card)',borderRadius:10,padding:'11px 13px',cursor:'pointer',boxShadow:'0 1px 4px var(--shadow)',borderRight:`4px solid ${b.color}`,position:'relative',transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <button onClick={e=>{e.stopPropagation();onToggleFav(m.id);}} style={{position:'absolute',top:6,left:8,background:'none',border:'none',fontSize:14,cursor:'pointer'}}>⭐</button>
            <div onClick={()=>onNav(b.id,c.id,m.id)}>
              <div style={{fontWeight:'bold',color:'var(--text)',fontSize:12,marginBottom:2,paddingLeft:18}}>{m.name}</div>
              <div style={{fontSize:10,color:'var(--sub)',marginBottom:3}}>{b.name} · {c.name}</div>
              <div style={{fontSize:11,color:b.color,fontWeight:'bold'}}>{m.parts.length} חלקים</div>
            </div>
          </div>
        ))}
      </div>
    </div>)}

    {recentModels.length>0&&(<div style={{marginBottom:18}}>
      <div style={{fontWeight:'bold',fontSize:13,color:'var(--sub)',marginBottom:8}}>🕐 נצפו לאחרונה</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))',gap:8}}>
        {recentModels.map(({b,c,m,ts})=>(
          <div key={m.id} onClick={()=>onNav(b.id,c.id,m.id)} style={{background:'var(--card)',borderRadius:10,padding:'11px 13px',cursor:'pointer',boxShadow:'0 1px 4px var(--shadow)',borderRight:`4px solid ${b.color}`,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <div style={{fontSize:10,color:'var(--sub)',marginBottom:3}}>{fmtTime(ts)}</div>
            <div style={{fontWeight:'bold',color:'var(--text)',fontSize:12,marginBottom:2}}>{m.name}</div>
            <div style={{fontSize:10,color:'var(--sub)',marginBottom:3}}>{b.name} · {c.name}</div>
            <div style={{fontSize:11,color:b.color,fontWeight:'bold'}}>{m.parts.length} חלקים</div>
          </div>
        ))}
      </div>
    </div>)}

    {/* Brand cards — no model list, just brand + count */}
    <div style={{fontWeight:'bold',fontSize:13,color:'var(--sub)',marginBottom:10}}>📁 לפי מותג</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10,marginBottom:24}}>
      {data.brands.map(b=>{
        const mc=b.categories.reduce((s,c)=>s+c.models.length,0);
        const pc=b.categories.reduce((s,c)=>s+c.models.reduce((ss,m)=>ss+m.parts.length,0),0);
        return(<div key={b.id} style={{background:'var(--card)',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px var(--shadow)',borderTop:`4px solid ${b.color}`}}>
          <div style={{padding:'14px 16px'}}>
            <div style={{fontWeight:'bold',fontSize:16,color:b.color,marginBottom:4}}>{b.name}</div>
            <div style={{fontSize:12,color:'var(--sub)'}}>{mc} דגמים · {pc.toLocaleString()} חלקים</div>
          </div>
        </div>);
      })}
    </div>
  </div>);
}

// ══════════ SIDEBAR ══════════
function SidebarBrand({brand,sel,editor,admin,favorites,onToggleFav,onNav,onAddModel,onDelModel,onAddCat,onEditCat,onDelCat,onRenameModel}){
  const[open,setOpen]=useState(false);
  const[openCats,setOpenCats]=useState({});
  const[addingMod,setAddingMod]=useState(null);
  const[newModName,setNewModName]=useState('');
  const[editCat,setEditCat]=useState(null);
  const[addingCat,setAddingCat]=useState(false);
  const[newCatName,setNewCatName]=useState('');
  const[sideSearch,setSideSearch]=useState('');
  const modRef=useRef();
  useEffect(()=>{if(sel?.bid===brand.id){setOpen(true);setOpenCats(p=>({...p,[sel.cid]:true}));}},[sel?.bid,sel?.cid]);
  const toggleCat=id=>setOpenCats(p=>({...p,[id]:!p[id]}));
  const doAddMod=cid=>{const n=newModName.trim();if(!n)return;onAddModel(cid,n);setNewModName('');setAddingMod(null);};
  const startAdd=cid=>{setAddingMod(cid);setNewModName('');setTimeout(()=>modRef.current?.focus(),50);};

  // filtered models for sidebar search
  const searchLower=sideSearch.trim().toLowerCase();

  return(<div style={{borderBottom:'1px solid var(--border)'}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:'11px 14px',background:brand.color,color:'#fff',display:'flex',alignItems:'center',cursor:'pointer',userSelect:'none',gap:6}}>
      <span style={{flex:1,fontWeight:'bold',fontSize:14}}>{brand.name}</span>
      <span style={{fontSize:11,opacity:.8}}>{open?'▲':'▼'}</span>
    </div>
    {open&&<>
      {/* Sidebar search */}
      <div style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',background:'var(--row2)'}}>
        <input value={sideSearch} onChange={e=>setSideSearch(e.target.value)} placeholder="🔍 חיפוש דגם..."
          style={{width:'100%',border:'1px solid var(--border)',borderRadius:16,padding:'5px 10px',fontSize:12,outline:'none',color:'var(--inp)',background:'var(--ibg)'}}/>
      </div>
      {brand.categories.map(c=>{
        const filteredModels=searchLower?c.models.filter(m=>m.name.toLowerCase().includes(searchLower)||(m.synonyms||[]).some(s=>s.toLowerCase().includes(searchLower))):c.models;
        if(searchLower&&filteredModels.length===0)return null;
        return(<div key={c.id}>
          <div style={{display:'flex',alignItems:'center',background:'var(--row2)',borderBottom:'1px solid var(--border)',minHeight:36}}>
            {editCat?.id===c.id&&admin
              ?<div style={{flex:1,display:'flex',gap:4,padding:'4px 8px'}}>
                 <input value={editCat.name} autoFocus onChange={e=>setEditCat({id:c.id,name:e.target.value})} onKeyDown={e=>{if(e.key==='Enter'){onEditCat(c.id,editCat.name);setEditCat(null);}if(e.key==='Escape')setEditCat(null);}} style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'3px 6px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
                 <button onClick={()=>{onEditCat(c.id,editCat.name);setEditCat(null);}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:11}}>✓</button>
                 <button onClick={()=>setEditCat(null)} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:11,color:'var(--text)'}}>✕</button>
               </div>
              :<div onClick={()=>toggleCat(c.id)} style={{flex:1,padding:'8px 14px 8px 20px',cursor:'pointer',color:'var(--sub)',fontSize:13,userSelect:'none',display:'flex',alignItems:'center'}}>
                 <span style={{flex:1}}>{c.name}</span><span style={{fontSize:10}}>{openCats[c.id]||searchLower?'▲':'▼'}</span>
               </div>}
            {admin&&editCat?.id!==c.id&&(<div style={{display:'flex',flexShrink:0,paddingLeft:4}}>
              <button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 6px',lineHeight:1}}>+</button>
              <button onClick={e=>{e.stopPropagation();setEditCat({id:c.id,name:c.name});}} style={{background:'none',border:'none',color:'var(--sub)',cursor:'pointer',fontSize:13,padding:'2px 4px'}}>✏</button>
              <button onClick={e=>{e.stopPropagation();onDelCat(c.id);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'2px 5px'}}>🗑</button>
            </div>)}
            {editor&&!admin&&editCat?.id!==c.id&&(<button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 8px',lineHeight:1}}>+</button>)}
          </div>
          {(openCats[c.id]||searchLower)&&<>
            {addingMod===c.id&&(<div style={{padding:'6px 10px',background:'var(--row2)',display:'flex',gap:6,borderBottom:'1px solid var(--border)'}}>
              <input ref={modRef} value={newModName} onChange={e=>setNewModName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doAddMod(c.id);if(e.key==='Escape'){setAddingMod(null);setNewModName('');}}} placeholder="שם הדגם..." style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
              <button onClick={()=>doAddMod(c.id)} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'5px 10px',cursor:'pointer',fontSize:12}}>הוסף</button>
              <button onClick={()=>{setAddingMod(null);setNewModName('');}} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'5px 8px',cursor:'pointer',fontSize:12,color:'var(--text)'}}>✕</button>
            </div>)}
            {filteredModels.map(m=>(
              <ModelSidebarItem key={m.id} m={m} brand={brand} sel={sel} favorites={favorites} editor={editor} admin={admin}
                onNav={onNav} cid={c.id} onToggleFav={onToggleFav} onDelModel={onDelModel} onRenameModel={onRenameModel}/>
            ))}
            {!filteredModels.length&&!searchLower&&<div style={{padding:'7px 26px',color:'var(--sub)',fontSize:12}}>אין דגמים</div>}
          </>}
        </div>);
      })}
      {admin&&(addingCat
        ?<div style={{padding:'6px 10px',background:'var(--row2)',display:'flex',gap:6}}>
           <input value={newCatName} autoFocus onChange={e=>setNewCatName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newCatName.trim()){onAddCat(newCatName.trim());setNewCatName('');setAddingCat(false);}if(e.key==='Escape')setAddingCat(false);}} placeholder="שם קטגוריה..." style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
           <button onClick={()=>{if(newCatName.trim()){onAddCat(newCatName.trim());setNewCatName('');setAddingCat(false);}}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'5px 10px',cursor:'pointer',fontSize:12}}>הוסף</button>
           <button onClick={()=>setAddingCat(false)} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'5px 8px',cursor:'pointer',fontSize:12,color:'var(--text)'}}>✕</button>
         </div>
        :<button onClick={()=>setAddingCat(true)} style={{width:'100%',padding:'8px',background:'none',border:'none',borderTop:'1px dashed var(--border)',color:brand.color,cursor:'pointer',fontSize:12,fontWeight:'bold'}}>+ הוסף קטגוריה</button>
      )}
    </>}
  </div>);
}

function ModelSidebarItem({m,brand,sel,favorites,editor,admin,onNav,cid,onToggleFav,onDelModel,onRenameModel}){
  const[editing,setEditing]=useState(false);
  const[editName,setEditName]=useState(m.name);
  const inputRef=useRef();
  useEffect(()=>{if(editing)setTimeout(()=>inputRef.current?.focus(),50);},[editing]);
  const saveRename=()=>{const n=editName.trim();if(n&&n!==m.name)onRenameModel(cid,m.id,n);setEditing(false);};
  return(<div style={{display:'flex',alignItems:'center',borderBottom:'1px solid var(--border)'}}>
    {editing&&editor
      ?<div style={{flex:1,display:'flex',gap:4,padding:'4px 8px'}}>
        <input ref={inputRef} value={editName} onChange={e=>setEditName(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')saveRename();if(e.key==='Escape'){setEditing(false);setEditName(m.name);}}}
          style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'3px 6px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
        <button onClick={saveRename} style={{background:'#4caf50',color:'#fff',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:11}}>✓</button>
        <button onClick={()=>{setEditing(false);setEditName(m.name);}} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:11,color:'var(--text)'}}>✕</button>
      </div>
      :<div onClick={()=>onNav(brand.id,cid,m.id)} style={{flex:1,padding:'8px 10px 8px 26px',cursor:'pointer',fontSize:13,color:sel?.mid===m.id?brand.color:'var(--text)',fontWeight:sel?.mid===m.id?'bold':'normal',background:sel?.mid===m.id?brand.light+'88':'transparent',borderRight:sel?.mid===m.id?`3px solid ${brand.color}`:'3px solid transparent'}}>
        {m.name}{m.synonyms?.length>0&&<div style={{fontSize:10,color:'var(--sub)',marginTop:2}}>{m.synonyms.join(' | ')}</div>}
      </div>}
    {!editing&&<>
      {editor&&<button onClick={()=>setEditing(true)} title="שנה שם" style={{background:'none',border:'none',fontSize:11,cursor:'pointer',padding:'0 3px',color:'var(--sub)'}}>✏</button>}
      <button onClick={()=>onToggleFav(m.id)} style={{background:'none',border:'none',fontSize:13,cursor:'pointer',padding:'0 4px'}}>{favorites.has(m.id)?'⭐':'☆'}</button>
      {admin&&<button onClick={()=>onDelModel(cid,m.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'0 8px'}}>🗑</button>}
    </>}
  </div>);
}

// ══════════ NOTIFICATIONS PANEL ══════════
function NotificationsPanel({missingAlerts,reports,missingModels,onNav,onResolve,onResolveMissing,onDeleteMissing,onClose}){
  const[tab,setTab]=useState('missing');
  const unresolved=reports.filter(r=>!r.resolved);
  const unresolvedMM=missingModels.filter(r=>!r.resolved);
  return(<Modal onClose={onClose} wide title="🔔 התראות ומשימות">
    <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap'}}>
      {[['missing',`⚠️ שדות חסרים (${missingAlerts.length})`],['reports',`🔴 שגיאות (${unresolved.length})`],['mm',`❓ דגמים חסרים (${unresolvedMM.length})`]].map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'8px',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:12,background:tab===k?'#1565c0':'var(--row2)',color:tab===k?'#fff':'var(--text)'}}>{l}</button>
      ))}
    </div>
    {tab==='missing'&&(<div style={{maxHeight:'55vh',overflowY:'auto'}}>
      {!missingAlerts.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין שדות חסרים!</div>}
      {missingAlerts.slice(0,50).map((a,i)=>(
        <div key={i} onClick={()=>onNav(a.b.id,a.c.id,a.m.id)}
          style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:8,border:'1px solid #ff980022',background:'#fff8e1',marginBottom:6,cursor:'pointer',alignItems:'center'}}>
          <span style={{background:a.b.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{a.b.name}</span>
          <div style={{flex:1}}><div style={{fontWeight:'bold',fontSize:12,color:'#333'}}>{a.m.name}</div>
            <div style={{fontSize:11,color:'#795548'}}>חלק: {a.p.values.nameHe||a.p.id} · חסר: {a.field}</div></div>
          <span style={{color:'#e65100',fontSize:11,fontWeight:'bold'}}>→</span>
        </div>
      ))}
    </div>)}
    {tab==='reports'&&(<div style={{maxHeight:'55vh',overflowY:'auto'}}>
      {!unresolved.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין דיווחים פתוחים!</div>}
      {reports.map(r=>(
        <div key={r.id} style={{padding:'12px',borderRadius:8,border:`1px solid ${r.resolved?'var(--border)':'#ff980055'}`,background:r.resolved?'var(--row2)':'#fff8e1',marginBottom:8,opacity:r.resolved?.6:1}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:'bold',fontSize:12,color:'var(--text)',marginBottom:4}}>{r.modelName||'לא ידוע'} ({r.brandName||''})</div>
              <div style={{fontSize:13,color:'var(--text)',marginBottom:4,lineHeight:1.5}}>{r.text}</div>
              <div style={{fontSize:10,color:'var(--sub)'}}>{r.ts} · {r.role||'?'}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              <button onClick={()=>onNav(r.bid,r.cid,r.mid)} style={sB('#1565c0')}>→ פתח</button>
              {!r.resolved&&<button onClick={()=>onResolve(r.id)} style={sB('#4caf50')}>✓ טופל</button>}
            </div>
          </div>
        </div>
      ))}
    </div>)}
    {tab==='mm'&&(<div style={{maxHeight:'55vh',overflowY:'auto'}}>
      {!missingModels.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין בקשות!</div>}
      {missingModels.map(r=>(
        <div key={r.id} style={{padding:'12px',borderRadius:8,border:`1px solid ${r.resolved?'var(--border)':'#7c43bd55'}`,background:r.resolved?'var(--row2)':'#f3e5f5',marginBottom:8}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              {r.resolved&&<span style={{background:'#e8f5e9',color:'#2e7d32',borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:'bold',display:'inline-block',marginBottom:4}}>✓ טופל</span>}
              <div style={{fontWeight:'bold',fontSize:13,color:'var(--text)',marginBottom:4}}>{r.modelName||'לא צוין שם'}</div>
              <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>{r.brand&&`מותג: ${r.brand} · `}תפקיד: {r.role||'?'}</div>
              {r.notes&&<div style={{fontSize:12,color:'var(--text)',marginBottom:4,background:'var(--card)',borderRadius:6,padding:'4px 8px'}}>{r.notes}</div>}
              {r.resolveNote&&<div style={{fontSize:11,color:'#2e7d32',marginBottom:4}}>הערת טיפול: {r.resolveNote}</div>}
              <div style={{fontSize:10,color:'var(--sub)'}}>{r.ts}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              {!r.resolved&&<ResolveMMBtn id={r.id} onResolve={onResolveMissing}/>}
              <button onClick={()=>onDeleteMissing(r.id)} style={sB('#e53935')}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>)}
    <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
  </Modal>);
}

function ResolveMMBtn({id,onResolve}){
  const[note,setNote]=useState('');const[open,setOpen]=useState(false);
  if(!open)return<button onClick={()=>setOpen(true)} style={sB('#4caf50')}>✓ טפל</button>;
  return(<div style={{display:'flex',flexDirection:'column',gap:4,minWidth:160}}>
    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="הערת טיפול..." style={{border:'1px solid var(--border)',borderRadius:4,padding:'4px 8px',fontSize:11,color:'var(--inp)',background:'var(--ibg)'}}/>
    <div style={{display:'flex',gap:4}}>
      <button onClick={()=>onResolve(id,note)} style={sB('#4caf50')}>✓</button>
      <button onClick={()=>setOpen(false)} style={sB('#9e9e9e')}>✕</button>
    </div>
  </div>);
}

// ══════════ RECYCLE BIN ══════════
function RecycleBin({onClose,onRestore}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{fbGetTrash().then(d=>{setItems(d);setLoading(false);});},[]);
  const deleteItem=async(id)=>{if(!confirm('למחוק לצמיתות?'))return;await fbDeleteTrashItem(id);setItems(p=>p.filter(i=>i.id!==id));};
  const typeLabel={model:'דגם',part:'חלק/שורה',column:'עמודה'};
  return(<Modal onClose={onClose} wide title="🗑 סל מיחזור">
    <div style={{fontSize:12,color:'var(--sub)',marginBottom:12}}>פריטים נשמרים 30 יום ואז נמחקים אוטומטית.</div>
    {loading&&<div style={{textAlign:'center',padding:30,color:'var(--sub)'}}>טוען...</div>}
    {!loading&&!items.length&&<div style={{textAlign:'center',padding:30,color:'var(--sub)'}}>✅ סל המיחזור ריק</div>}
    <div style={{maxHeight:'55vh',overflowY:'auto'}}>
      {items.map(item=>(
        <div key={item.id} style={{padding:'12px',borderRadius:8,border:'1px solid var(--border)',marginBottom:8,background:'var(--row2)'}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <div style={{flex:1}}>
              <span style={{background:'#e3f2fd',color:'#1565c0',padding:'1px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',marginLeft:6}}>{typeLabel[item.type]||item.type}</span>
              <span style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>{item.parsed?.name||item.parsed?.values?.nameHe||'ללא שם'}</span>
              <div style={{fontSize:11,color:'var(--sub)',marginTop:4}}>{item.ts}</div>
              {item.expiresAt&&<div style={{fontSize:10,color:'#e65100',marginTop:2}}>פג תוקף: {new Date(item.expiresAt).toLocaleDateString('he-IL')}</div>}
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>onRestore(item)} style={sB('#4caf50')}>↩ שחזר</button>
              <button onClick={()=>deleteItem(item.id)} style={sB('#e53935')}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
    <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
  </Modal>);
}

// ══════════ MISSING MODEL REPORT ══════════
function MissingModelModal({data,loginRole,onClose}){
  const[modelName,setModelName]=useState('');
  const[brand,setBrand]=useState('');
  const[notes,setNotes]=useState('');
  const[sent,setSent]=useState(false);
  const submit=async()=>{
    if(!modelName.trim()){alert('נא למלא שם דגם');return;}
    await fbSaveMissingModel({modelName:modelName.trim(),brand,notes,role:loginRole});
    setSent(true);
  };
  if(sent)return(<Modal onClose={onClose} title="❓ חסר דגם?">
    <div style={{textAlign:'center',padding:'20px 0'}}>
      <div style={{fontSize:48,marginBottom:12}}>✅</div>
      <div style={{fontWeight:'bold',fontSize:16,color:'var(--text)',marginBottom:8}}>הדיווח נשלח בהצלחה!</div>
      <div style={{fontSize:13,color:'var(--sub)',marginBottom:20}}>המנהל יטפל בבקשה בהקדם.</div>
      <button onClick={onClose} style={{width:'100%',...BPr('#1565c0')}}>סגור</button>
    </div>
  </Modal>);
  return(<Modal onClose={onClose} title="❓ חסר דגם? דווח לנו">
    <div style={{fontSize:13,color:'var(--sub)',marginBottom:14}}>לא מצאת דגם? שלח בקשה למנהל ויוסיף אותו.</div>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>שם הדגם החסר *</div>
      <input value={modelName} onChange={e=>setModelName(e.target.value)} placeholder="לדוגמא: GWH18AGD" style={INS}/>
    </div>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>מותג</div>
      <select value={brand} onChange={e=>setBrand(e.target.value)} style={INS}>
        <option value="">לא ידוע</option>
        {data.brands.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
      </select>
    </div>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>הערות נוספות</div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="מידע נוסף שיעזור..." style={{...INS,height:'auto',resize:'vertical'}}/>
    </div>
    <div style={{display:'flex',gap:8}}>
      <button onClick={submit} style={{flex:1,...BPr('#7b1fa2')}}>📨 שלח בקשה</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ TECHNICIAN SITE MODAL ══════════
function TechSiteModal({onClose}){
  const[confirmed,setConfirmed]=useState(false);
  const TECH_URL='https://maortadiran88-eng.github.io/GREE/';
  if(confirmed){window.open(TECH_URL,'_blank');onClose();return null;}
  return(<Modal onClose={onClose} title="🔗 מעבר לאתר טכנאים">
    <div style={{textAlign:'center',padding:'10px 0'}}>
      <div style={{fontSize:48,marginBottom:16}}>🔧</div>
      <div style={{fontSize:15,fontWeight:'bold',color:'var(--text)',marginBottom:8}}>האם לעבור לאתר הטכנאים?</div>
      <div style={{fontSize:13,color:'var(--sub)',marginBottom:24}}>תועבר לאתר חיצוני בחלון חדש.</div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>setConfirmed(true)} style={{flex:1,...BPr('#1565c0')}}>כן, עבור</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </div>
  </Modal>);
}

// ══════════ PWA INSTALL PROMPT ══════════
function PwaInstallBanner({onDismiss}){
  const install=async()=>{
    if(window._deferredPrompt){
      window._deferredPrompt.prompt();
      await window._deferredPrompt.userChoice;
      window._deferredPrompt=null;
    }
    onDismiss();
  };
  return(<div style={{position:'fixed',bottom:16,right:16,left:16,zIndex:500,background:'#1565c0',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 6px 20px rgba(0,0,0,.3)',animation:'slideUp .3s'}}>
    <span style={{fontSize:28}}>📱</span>
    <div style={{flex:1}}>
      <div style={{fontWeight:'bold',color:'#fff',fontSize:14}}>הוסף למסך הבית</div>
      <div style={{fontSize:11,color:'rgba(255,255,255,.8)'}}>גישה מהירה בלחיצה אחת</div>
    </div>
    <button onClick={install} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontWeight:'bold',color:'#1565c0',fontSize:13}}>התקן</button>
    <button onClick={onDismiss} style={{background:'rgba(255,255,255,.2)',border:'none',borderRadius:8,padding:'8px 10px',cursor:'pointer',color:'#fff',fontSize:13}}>✕</button>
  </div>);
}

// ══════════ CART PANEL ══════════
function CartPanel({cart,data,onRemove,onClear,onClose,waDefaults}){
  const[colSel,setColSel]=useState(new Set(waDefaults));
  const allCols=useMemo(()=>{const s=new Set();cart.forEach(i=>i.columns.forEach(c=>s.add(JSON.stringify({id:c.id,name:c.name}))));return[...s].map(x=>JSON.parse(x));},[cart]);
  const exportCartPDF=()=>{
    const w=window.open('','_blank');
    const rows=cart.map(i=>`<tr><td style="background:#f5f5f5;font-weight:bold">${i.modelName}<br><small>${i.brandName} · ${i.catName}</small></td>${i.columns.map(c=>`<td>${i.values[c.id]||''}</td>`).join('')}</tr>`).join('');
    w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>סל חלקים</title>
      <style>body{font-family:Arial;padding:20px;direction:rtl}table{border-collapse:collapse;width:100%}th{background:#1565c0;color:#fff;padding:8px 10px;text-align:right}td{border:1px solid #ddd;padding:6px 10px;font-size:13px}</style></head>
      <body><h2>🛒 סל חלקים — ${new Date().toLocaleDateString('he-IL')}</h2>
      <table><thead><tr><th>דגם</th>${cart[0]?.columns.map(c=>`<th>${c.name}</th>`).join('')||''}</tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };
  const sendCartWA=()=>{
    const activeCols=allCols.filter(c=>colSel.has(c.id));
    const hdr=`🛒 *סל חלקים*\n${new Date().toLocaleDateString('he-IL')}\n${'─'.repeat(28)}`;
    const lines=cart.map((item,i)=>{const vals=activeCols.map(c=>{const v=(item.values[c.id]||'').trim();return v?`${c.name}: ${v}`:'';}).filter(Boolean);return`*${i+1}.* [${item.modelName}] ${vals.join(' | ')}`;}).join('\n');
    window.open('https://wa.me/?text='+encodeURIComponent(`${hdr}\n\n${lines}\n\n_סה"כ ${cart.length} פריטים_`),'_blank');
  };
  return(<Modal onClose={onClose} wide title="🛒 סל חלקים">
    {!cart.length?<div style={{textAlign:'center',padding:40,color:'var(--sub)'}}>הסל ריק</div>
    :<>
      <div style={{maxHeight:'40vh',overflowY:'auto',marginBottom:14}}>
        {cart.map(item=>(<div key={item.id} style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:8,background:'var(--row2)',marginBottom:6,alignItems:'flex-start'}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
              <span style={{background:item.brandColor,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>{item.brandName}</span>
              <span style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>{item.modelName}</span>
            </div>
            <div style={{fontSize:12,color:'var(--sub)'}}>{item.columns.filter(c=>item.values[c.id]?.trim()).map(c=>`${c.name}: ${item.values[c.id]}`).join(' · ')}</div>
          </div>
          <button onClick={()=>onRemove(item.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,flexShrink:0}}>🗑</button>
        </div>))}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
        {allCols.map(c=>{const on=colSel.has(c.id);return(<div key={c.id} onClick={()=>setColSel(p=>{const n=new Set(p);on?n.delete(c.id):n.add(c.id);return n;})}
          style={{padding:'5px 10px',borderRadius:6,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>
          {on?'✓ ':''}{c.name}
        </div>);})}
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={exportCartPDF} style={{flex:1,...BPr('#546e7a')}}>🖨️ PDF</button>
        <button onClick={sendCartWA} style={{flex:1,...BPr('#25D366')}}>📱 ווצאפ</button>
        <button onClick={onClear} style={{...sB('#e53935'),padding:'10px 14px'}}>נקה</button>
      </div>
    </>}
  </Modal>);
}

// ══════════ MODEL VIEW ══════════
function ModelView({brand,cat,model,editor,admin,hq,data,favorites,onToggleFav,loginRole,onUpdate,onAddPart,onDelPart,onCell,onColName,onMoveCol,onAddCol,onDelCol,onPaste,onImgUpload,onDelImg,onImgUrl,onOpenImg,onMove,onDuplicate,onCopyPartsFrom,onAddToCart,onReport,waDefaults,onTrashPart,onTrashCol}){
  const[synIn,setSynIn]=useState(model.synonyms?.join(', ')||'');
  const[editSyn,setEditSyn]=useState(false);
  const[imgUrl,setImgUrl]=useState('');const[editUrl,setEditUrl]=useState(false);
  const[filter,setFilter]=useState('');const[sortCol,setSortCol]=useState(null);
  const[quickMode,setQuickMode]=useState(false);
  const[showPaste,setShowPaste]=useState(false);const[pasteText,setPasteText]=useState('');
  const[showMove,setShowMove]=useState(false);const[showCopy,setShowCopy]=useState(false);
  const[selRows,setSelRows]=useState(new Set());
  const[showWaEditor,setShowWaEditor]=useState(false);
  const[showReport,setShowReport]=useState(false);const[reportText,setReportText]=useState('');
  const[reportSent,setReportSent]=useState(false);
  const[showMissing,setShowMissing]=useState(false);
  const firstHiRef=useRef(null);
  const q=hq.trim().toLowerCase();
  const images=model.images||[];

  useEffect(()=>{setSynIn(model.synonyms?.join(', ')||'');},[model.id]);
  useEffect(()=>{if(q&&firstHiRef.current)setTimeout(()=>firstHiRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),200);},[q]);
  const saveSyn=()=>{onUpdate({synonyms:synIn.split(',').map(s=>s.trim()).filter(Boolean)});setEditSyn(false);};

  // For viewer: hide empty columns. For editor: show all.
  const visibleCols=useMemo(()=>editor?model.columns:model.columns.filter(col=>model.parts.some(p=>(p.values[col.id]||'').trim()!=='')),[model.columns,model.parts,editor]);

  let filtered=[...model.parts.filter(p=>p.pinned),...model.parts.filter(p=>!p.pinned)];
  if(filter.trim())filtered=filtered.filter(p=>partMatchesGlobal(filter,p));
  if(sortCol){filtered=[...filtered].sort((a,b)=>{const va=(a.values[sortCol.id]||'').toLowerCase();const vb=(b.values[sortCol.id]||'').toLowerCase();const n=va.localeCompare(vb,'he');return sortCol.dir==='asc'?n:-n;});}

  // For PDF: hide columns where ALL rows are empty
  const pdfCols=model.columns.filter(col=>model.parts.some(p=>(p.values[col.id]||'').trim()!==''));

  const rowHi=p=>q&&Object.values(p.values).some(v=>String(v).toLowerCase().includes(q));
  const cellHi=v=>q&&String(v).toLowerCase().includes(q);
  const submitPaste=()=>{const rows=pasteText.trim().split('\n').map(r=>r.split('\t').map(c=>c.trim())).filter(r=>r.some(c=>c));if(rows.length){onPaste(rows);setPasteText('');setShowPaste(false);}};
  const toggleRow=id=>setSelRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const clearRows=()=>setSelRows(new Set());
  const handleSort=cid=>{if(!sortCol||sortCol.id!==cid)setSortCol({id:cid,dir:'asc'});else if(sortCol.dir==='asc')setSortCol({id:cid,dir:'desc'});else setSortCol(null);};
  const sortIcon=cid=>!sortCol||sortCol.id!==cid?'⇅':sortCol.dir==='asc'?'↑':'↓';

  const exportPDF=()=>{
    const w=window.open('','_blank');
    // Only show rows where at least one pdfCol has a value
    const visibleRows=model.parts.filter(p=>pdfCols.some(c=>(p.values[c.id]||'').trim()!==''));
    // Only show pdfCols
    const rows=visibleRows.map(p=>`<tr style="${p.discontinued?'color:#c62828;text-decoration:line-through':p.pinned?'background:#fff8e1':''}">
      ${pdfCols.map(c=>`<td>${p.values[c.id]||''}</td>`).join('')}
      ${p.discontinued?'<td style="color:#c62828;font-weight:bold">⛔ הופסק</td>':'<td></td>'}
    </tr>`).join('');
    const imgs=images.map(img=>`<img src="${img}" style="max-width:280px;max-height:200px;border:1px solid #ddd;border-radius:6px;margin:4px;object-fit:contain">`).join('');
    const nh=model.notes?`<div style="background:#fff3f3;border-right:4px solid #e53935;padding:10px 14px;border-radius:6px;color:#e53935;font-weight:bold;margin:10px 0">${model.notes}</div>`:'';
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${model.name}</title>
      <style>body{font-family:Arial;padding:30px;color:#1a1a2a;direction:rtl}h1{color:${brand.color};font-size:22px}table{border-collapse:collapse;width:100%;margin-top:14px;font-size:13px}th{background:${brand.color};color:#fff;padding:9px 12px;text-align:right}td{border:1px solid #e5e7eb;padding:7px 12px}tr:nth-child(even){background:#f9fafb}@page{margin:20mm}</style></head>
      <body><h1>🔧 ${brand.name} — ${model.name}</h1><p style="color:#6b7280">${cat.name}${model.synonyms?.length?' · '+model.synonyms.join(', '):''}</p>
      ${nh}${imgs?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${imgs}</div>`:''}
      <table><thead><tr>${pdfCols.map(c=>`<th>${c.name}</th>`).join('')}<th>סטטוס</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:11px;color:#94a3b8;margin-top:8px">${visibleRows.length} חלקים · ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</p>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };

  const exportModelXLS=()=>{
    try{
      const wb=XLSX.utils.book_new();
      const hdr=model.columns.map(c=>c.name);
      const rows=model.parts.map(p=>model.columns.map(c=>p.values[c.id]||''));
      const ws=XLSX.utils.aoa_to_sheet([hdr,...rows]);
      ws['!cols']=model.columns.map(()=>({wch:20}));
      XLSX.utils.book_append_sheet(wb,ws,sanitizeSheet(model.name));
      XLSX.writeFile(wb,`${brand.name}-${model.name}.xlsx`);
    }catch(e){alert('שגיאה: '+e.message);}
  };
  const shareLink=()=>{const url=window.location.href.split('?')[0]+`?b=${brand.id}&c=${cat.id}&m=${model.id}`;navigator.clipboard?.writeText(url).then(()=>alert('✅ קישור הועתק')).catch(()=>alert('קישור:\n'+url));};

  let firstHiSet=false;

  if(quickMode){
    const qc=visibleCols.filter(c=>['nameHe','tadPn','mfgPn'].includes(c.id));
    const dc=qc.length?qc:visibleCols.slice(0,3);
    return(<div style={{maxWidth:600,margin:'0 auto'}}>
      <div style={{background:brand.color,color:'#fff',borderRadius:12,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
        <div style={{flex:1}}><div style={{fontWeight:'bold',fontSize:16}}>◈ {model.name}</div><div style={{fontSize:12,opacity:.8}}>{cat.name} · {model.parts.length} חלקים</div></div>
        <button onClick={()=>setQuickMode(false)} style={{background:'rgba(255,255,255,.25)',border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:'bold'}}>📋 מלא</button>
      </div>
      {model.notes&&<div style={{background:'#ffebee',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#e53935',fontWeight:'bold',fontSize:13}}>{model.notes}</div>}
      <div style={{background:'var(--card)',borderRadius:12,padding:10,marginBottom:10}}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="🔍 חיפוש..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:20,padding:'9px 14px',fontSize:14,outline:'none',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map(p=>(
          <div key={p.id} onClick={()=>toggleRow(p.id)} style={{background:selRows.has(p.id)?'var(--sel)':p.discontinued?'#ffebee':'var(--card)',borderRadius:10,padding:'12px 14px',boxShadow:'0 1px 4px var(--shadow)',borderRight:`4px solid ${p.discontinued?'#e53935':selRows.has(p.id)?'#25D366':brand.color}`,cursor:'pointer'}}>
            {p.pinned&&<div style={{fontSize:10,color:'#e65100',fontWeight:'bold',marginBottom:4}}>📌 חלק נפוץ</div>}
            {p.discontinued&&<div style={{fontSize:11,color:'#e53935',fontWeight:'bold',marginBottom:4}}>⛔ הופסק לייצור</div>}
            {dc.map(col=>{const v=(p.values[col.id]||'').trim();if(!v)return null;return(<div key={col.id} style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:13}}>
              <span style={{color:'var(--sub)',marginLeft:10}}>{col.name}:</span>
              <span style={{fontWeight:'bold',color:p.discontinued?'#e53935':'var(--text)',textDecoration:p.discontinued?'line-through':''}}>{v}</span>
            </div>);})}
            {selRows.has(p.id)&&<div style={{textAlign:'center',color:'#25D366',fontSize:11,fontWeight:'bold',marginTop:4}}>✓ בסל</div>}
          </div>
        ))}
      </div>
      {selRows.size>0&&(<div style={{position:'fixed',bottom:16,right:16,left:16,zIndex:100,background:'#25D366',borderRadius:14,padding:'13px 18px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 6px 20px rgba(0,0,0,.3)'}}>
        <span style={{color:'#fff',fontWeight:'bold',flex:1}}>✓ {selRows.size} נבחרו</span>
        <button onClick={()=>setShowWaEditor(true)} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:'bold',color:'#25D366',fontSize:13}}>📱 שלח</button>
        <button onClick={clearRows} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'8px 12px',cursor:'pointer',color:'#fff',fontSize:12}}>✕</button>
      </div>)}
      {showWaEditor&&<WaEditorModal brand={brand} cat={cat} model={model} selRows={selRows} defaultCols={waDefaults} onClose={()=>setShowWaEditor(false)}/>}
    </div>);
  }

  return(<div style={{maxWidth:1100,margin:'0 auto'}}>
    {/* Model header */}
    <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:8}}>
        <span style={{background:brand.color,color:'#fff',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>{brand.name}</span>
        <span style={{color:'var(--sub)',fontSize:12}}>{cat.name}</span>
        <span style={{fontSize:17,fontWeight:'bold',color:'var(--text)'}}>◈ {model.name}</span>
        <button onClick={()=>onToggleFav(model.id)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',marginRight:'auto'}}>{favorites.has(model.id)?'⭐':'☆'}</button>
        <span style={{color:'var(--sub)',fontSize:11}}>{model.parts.length.toLocaleString()} חלקים</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',fontSize:12,marginBottom:10}}>
        <span style={{color:'var(--sub)'}}>שמות נרדפים:</span>
        {!editSyn?<><span style={{color:'var(--text)'}}>{model.synonyms?.length?model.synonyms.join(' | '):'—'}</span>{editor&&<button onClick={()=>setEditSyn(true)} style={sB(brand.color)}>✏ עריכה</button>}</>
          :<><input value={synIn} onChange={e=>setSynIn(e.target.value)} placeholder="שם1, שם2" style={{border:'1px solid var(--border)',borderRadius:4,padding:'3px 8px',fontSize:12,width:200,color:'var(--inp)',background:'var(--ibg)'}}/>
             <button onClick={saveSyn} style={sB('#4caf50')}>✓</button><button onClick={()=>setEditSyn(false)} style={sB('#9e9e9e')}>✕</button></>}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',borderTop:'1px solid var(--border)',paddingTop:10}}>
        <button onClick={exportPDF} style={sB('#546e7a')}>🖨️ PDF</button>
        <button onClick={exportModelXLS} style={sB('#388e3c')}>📊 Excel</button>
        <button onClick={shareLink} style={sB('#7b1fa2')}>🔗 שתף</button>
        <button onClick={()=>setQuickMode(true)} style={sB('#0097a7')}>📱 נייד</button>
        <button onClick={()=>{setShowReport(true);setReportSent(false);setReportText('');}} style={sB('#e65100')}>⚠️ דווח שגיאה</button>
        {editor&&<><button onClick={()=>setShowMove(true)} style={sB('#455a64')}>🔀 העבר</button>
          <button onClick={()=>{if(confirm('לשכפל?'))onDuplicate();}} style={sB('#0277bd')}>⧉ שכפל</button>
          <button onClick={()=>setShowCopy(true)} style={sB('#558b2f')}>📋 העתק</button></>}
      </div>
    </div>

    {(editor||model.notes)&&(<div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>📝 הערות למנהל/עורך</div>
      {editor?<textarea value={model.notes||''} onChange={e=>onUpdate({notes:e.target.value})} placeholder="הוסף הערות חשובות..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',minHeight:72,color:'#e53935',background:'var(--ibg)',fontFamily:'Arial',lineHeight:1.6,boxSizing:'border-box'}}/>
        :<div style={{color:'#e53935',fontSize:14,lineHeight:1.7,fontWeight:'600',whiteSpace:'pre-wrap'}}>{model.notes}</div>}
    </div>)}

    {(editor||images.length>0)&&(<div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <span style={{fontWeight:'bold',fontSize:14,color:'var(--text)'}}>📐 שרטוטים</span>
        {editor&&<><label style={{...sB(brand.color),cursor:'pointer'}}>📁 העלה<input type="file" accept="image/*" multiple onChange={onImgUpload} style={{display:'none'}}/></label>
          <button onClick={()=>setEditUrl(v=>!v)} style={sB('#607d8b')}>🔗 URL</button></>}
        {images.length>0&&<span style={{color:'var(--sub)',fontSize:11,marginRight:'auto'}}>{images.length} תמונות</span>}
      </div>
      {editUrl&&editor&&(<div style={{display:'flex',gap:8,marginBottom:10}}>
        <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="https://..." style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px',fontSize:13,color:'var(--inp)',background:'var(--ibg)'}}/>
        <button onClick={()=>{if(imgUrl.trim()){onImgUrl(imgUrl.trim());setImgUrl('');setEditUrl(false);}}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',cursor:'pointer'}}>הוסף</button>
      </div>)}
      {images.length>0?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8}}>
        {images.map((img,idx)=>(<div key={idx} style={{borderRadius:8,overflow:'hidden',border:'2px solid var(--border)',background:'var(--row2)'}}>
          <img src={img} alt={`שרטוט ${idx+1}`} onClick={()=>onOpenImg(images,idx)} style={{width:'100%',height:120,objectFit:'contain',cursor:'zoom-in',display:'block'}}/>
          <div style={{padding:'3px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--row2)',borderTop:'1px solid var(--border)'}}>
            <span style={{fontSize:10,color:'var(--sub)'}}>תמונה {idx+1}</span>
            {editor&&<button onClick={()=>{if(confirm('למחוק?'))onDelImg(idx);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
          </div>
        </div>))}
      </div>:<div style={{textAlign:'center',padding:24,background:'var(--row2)',borderRadius:8,border:'2px dashed var(--border)',color:'var(--sub)',fontSize:13}}>העלה שרטוטים</div>}
    </div>)}

    {/* Parts table */}
    <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
        <span style={{fontWeight:'bold',fontSize:14,color:'var(--text)'}}>🔩 רשימת חלקים</span>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="חיפוש..." style={{border:'1px solid var(--border)',borderRadius:16,padding:'5px 12px',fontSize:12,outline:'none',width:130,color:'var(--inp)',background:'var(--ibg)'}}/>
        {sortCol&&<button onClick={()=>setSortCol(null)} style={sB('#9e9e9e')}>↺</button>}
        {editor&&<><button onClick={onAddPart} style={{...sB(brand.color),fontWeight:'bold'}}>+ שורה</button>
          <button onClick={onAddCol} style={sB('#607d8b')}>+ עמודה</button>
          <button onClick={()=>setShowPaste(v=>!v)} style={sB('#e65100')}>📋 הדבק</button></>}
        <span style={{marginRight:'auto',color:'var(--sub)',fontSize:11}}>{filtered.length.toLocaleString()}/{model.parts.length.toLocaleString()}</span>
      </div>

      {selRows.size>0&&(<div style={{position:'sticky',bottom:12,zIndex:100,background:'#25D366',borderRadius:12,padding:'11px 16px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 4px 16px rgba(0,0,0,.25)',marginBottom:12,flexWrap:'wrap',animation:'fadeIn .2s'}}>
        <span style={{color:'#fff',fontWeight:'bold',fontSize:13,flex:1}}>✓ {selRows.size} נבחרו</span>
        <button onClick={()=>setShowWaEditor(true)} style={{background:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:'pointer',fontWeight:'bold',color:'#25D366',fontSize:13}}>✏️ ערוך ושלח</button>
        <button onClick={()=>{selRows.forEach(pid=>onAddToCart(brand.id,cat.id,model.id,pid));clearRows();alert(`✅ ${selRows.size} פריטים נוספו לסל`);}} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',color:'#fff',fontSize:12}}>+ סל</button>
        <button onClick={clearRows} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'7px 12px',cursor:'pointer',color:'#fff',fontSize:12}}>ביטול</button>
      </div>)}

      {showPaste&&editor&&(<div style={{background:'#fff8e1',border:'1px solid #ffcc02',borderRadius:8,padding:12,marginBottom:12}}>
        <div style={{fontSize:12,color:'#795548',marginBottom:4,fontWeight:'bold'}}>📋 סדר: {model.columns.map(c=>c.name).join(' ➔ ')}</div>
        <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="הדבק כאן..." rows={5} style={{width:'100%',border:'1px solid #ddd',borderRadius:6,padding:'8px 10px',fontSize:12,fontFamily:'monospace',resize:'vertical',boxSizing:'border-box',direction:'ltr',color:'#333'}}/>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button onClick={submitPaste} style={{...sB('#4caf50'),padding:'8px 20px',fontSize:13}}>✓ ייבא</button>
          <button onClick={()=>{setPasteText('');setShowPaste(false);}} style={{...sB('#9e9e9e'),padding:'8px 14px',fontSize:13}}>ביטול</button>
        </div>
      </div>)}

      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:300}}>
          <thead>
            <tr style={{background:brand.light}}>
              <th style={{width:36,padding:'9px 6px',borderBottom:`2px solid ${brand.color}`}}>
                <div onClick={()=>{if(selRows.size===filtered.length&&filtered.length>0)clearRows();else setSelRows(new Set(filtered.map(p=>p.id)));}} style={{width:18,height:18,borderRadius:4,border:`2px solid ${brand.color}`,background:selRows.size===filtered.length&&filtered.length>0?brand.color:'transparent',cursor:'pointer',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {selRows.size===filtered.length&&filtered.length>0&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
                </div>
              </th>
              {visibleCols.map((col,ci)=>(
                <th key={col.id} style={{padding:'9px 10px',textAlign:'right',color:'#333',fontWeight:'bold',borderBottom:`2px solid ${brand.color}`,whiteSpace:'nowrap',minWidth:80}}>
                  {editor?<div style={{display:'flex',alignItems:'center',gap:3}}>
                    <div style={{display:'flex',flexDirection:'column',gap:1,flexShrink:0}}>
                      <button onClick={()=>onMoveCol(col.id,-1)} disabled={ci===0} style={{background:'none',border:'none',cursor:ci===0?'default':'pointer',color:ci===0?'#ccc':'#666',fontSize:10,padding:0,lineHeight:1}}>◀</button>
                      <button onClick={()=>onMoveCol(col.id,1)} disabled={ci===visibleCols.length-1} style={{background:'none',border:'none',cursor:ci===visibleCols.length-1?'default':'pointer',color:ci===visibleCols.length-1?'#ccc':'#666',fontSize:10,padding:0,lineHeight:1}}>▶</button>
                    </div>
                    <input value={col.name} onChange={e=>onColName(col.id,e.target.value)} style={{border:'1px dashed #ccc',borderRadius:3,padding:'2px 5px',fontSize:12,fontWeight:'bold',width:'100%',minWidth:50,background:'transparent',color:'#333'}}/>
                    {admin&&model.columns.length>1&&<button onClick={()=>{onTrashCol(col);onDelCol(col.id);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>×</button>}
                  </div>
                  :<div onClick={()=>handleSort(col.id)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}>
                    {col.name}<span style={{fontSize:10,color:sortCol?.id===col.id?brand.color:'#aaa'}}>{sortIcon(col.id)}</span>
                  </div>}
                </th>
              ))}
              {editor&&<th style={{padding:'9px 6px',borderBottom:`2px solid ${brand.color}`,fontSize:11,color:'#888',minWidth:70}}>תגיות</th>}
              <th style={{width:editor?60:40,borderBottom:`2px solid ${brand.color}`}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i)=>{
              const hi=rowHi(p);const isSel=selRows.has(p.id);
              let ref=null;if(hi&&!firstHiSet){firstHiSet=true;ref=firstHiRef;}
              return(<tr key={p.id} ref={ref}
                style={{background:p.discontinued?'#ffebee22':isSel?'var(--sel)':p.pinned?'#fff8e1':hi?'var(--hi)':i%2?'var(--row2)':'var(--row1)',transition:'background .15s',cursor:'pointer',opacity:p.discontinued?.7:1}}
                onClick={()=>toggleRow(p.id)}
                onMouseEnter={e=>{if(!isSel&&!hi&&!p.pinned)e.currentTarget.style.background=brand.light+'88';}}
                onMouseLeave={e=>{if(!isSel&&!hi)e.currentTarget.style.background=p.discontinued?'#ffebee22':p.pinned?'#fff8e1':i%2?'var(--row2)':'var(--row1)';}}>
                <td style={{padding:'7px 6px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                  <div onClick={()=>toggleRow(p.id)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?'#25D366':'var(--border)'}`,background:isSel?'#25D366':'transparent',cursor:'pointer',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {isSel&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
                  </div>
                </td>
                {visibleCols.map(col=>{const v=p.values[col.id]||'';return(
                  <td key={col.id} style={{padding:'7px 10px',borderBottom:'1px solid var(--border)',background:cellHi(v)?'var(--hi)':undefined}}>
                    {p.discontinued&&<span style={{fontSize:9,color:'#e53935',fontWeight:'bold',marginLeft:4}}>⛔</span>}
                    {p.pinned&&!p.discontinued&&<span style={{fontSize:9,color:'#e65100',marginLeft:4}}>📌</span>}
                    {editor?<input value={v} onChange={e=>onCell(p.id,col.id,e.target.value)} onClick={e=>e.stopPropagation()} style={{border:'none',borderBottom:'1px solid var(--border)',width:'100%',minWidth:50,padding:'2px 4px',fontSize:13,background:'transparent',outline:'none',color:p.discontinued?'#e53935':'var(--inp)',textDecoration:p.discontinued?'line-through':''}}/>
                      :<span style={{color:p.discontinued?'#e53935':'var(--text)',textDecoration:p.discontinued?'line-through':''}}>{v}</span>}
                  </td>
                );})}
                {editor&&<td style={{padding:'5px 6px',borderBottom:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                  <input value={p.tags||''} onChange={e=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,tags:e.target.value})})} onClick={e=>e.stopPropagation()}
                    style={{border:'none',borderBottom:'1px solid var(--border)',width:'100%',padding:'2px 4px',fontSize:11,background:'transparent',outline:'none',color:'var(--sub)'}}/>
                </td>}
                <td style={{padding:'5px 4px',textAlign:'center',borderBottom:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:2,justifyContent:'center',flexWrap:'wrap'}}>
                    <button onClick={()=>onAddToCart(brand.id,cat.id,model.id,p.id)} title="הוסף לסל" style={{background:'none',border:'none',cursor:'pointer',fontSize:13}}>🛒</button>
                    {editor&&<>
                      <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,pinned:!pp.pinned})})} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.pinned?'📌':'☆'}</button>
                      <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,discontinued:!pp.discontinued})})} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.discontinued?'✅':'⛔'}</button>
                    </>}
                    {admin&&<button onClick={()=>{onTrashPart(p);onDelPart(p.id);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
                  </div>
                </td>
              </tr>);
            })}
            {!filtered.length&&<tr><td colSpan={visibleCols.length+(editor?3:2)} style={{padding:24,textAlign:'center',color:'var(--sub)'}}>{editor?'לחץ "+ שורה" להוספת חלק':'אין חלקים'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>

    {/* Missing model button */}
    <div style={{marginTop:16,textAlign:'center'}}>
      <button onClick={()=>setShowMissing(true)} style={{background:'none',border:'1px dashed var(--border)',borderRadius:8,padding:'10px 20px',color:'var(--sub)',cursor:'pointer',fontSize:13}}>
        ❓ חסר דגם? דווח לנו
      </button>
    </div>

    {/* Report modal */}
    {showReport&&(<Modal onClose={()=>setShowReport(false)} title="⚠️ דיווח על שגיאה בנתונים">
      {reportSent
        ?<div style={{textAlign:'center',padding:'20px 0'}}>
          <div style={{fontSize:48,marginBottom:12}}>✅</div>
          <div style={{fontWeight:'bold',fontSize:16,marginBottom:8,color:'var(--text)'}}>הדיווח נשלח בהצלחה!</div>
          <div style={{fontSize:13,color:'var(--sub)',marginBottom:20}}>המנהל יטפל בדיווח בהקדם.</div>
          <button onClick={()=>setShowReport(false)} style={{width:'100%',...BPr('#1565c0')}}>סגור</button>
        </div>
        :<>
          <div style={{fontSize:13,color:'var(--sub)',marginBottom:12}}>מצאת שגיאה? תאר בקצרה מה לא נכון:</div>
          <div style={{background:'#e3f2fd',borderRadius:8,padding:'8px 12px',marginBottom:10,fontSize:12,color:'#1565c0'}}>
            דגם: <strong>{model.name}</strong> · מותג: <strong>{brand.name}</strong>
          </div>
          <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4} placeholder="לדוגמא: מק&quot;ט יצרן לא נכון..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={async()=>{if(!reportText.trim()){alert('כתוב תיאור');return;}await onReport(reportText);setReportSent(true);}} style={{flex:1,...BPr('#e65100')}}>📨 שלח דיווח</button>
            <button onClick={()=>setShowReport(false)} style={{flex:1,...BST}}>ביטול</button>
          </div>
        </>}
    </Modal>)}

    {showMissing&&<MissingModelModal data={data} loginRole={loginRole} onClose={()=>setShowMissing(false)}/>}
    {showMove&&<MoveModal data={data} currentBid={brand.id} currentCid={cat.id} onMove={onMove} onClose={()=>setShowMove(false)}/>}
    {showCopy&&<CopyPartsModal data={data} currentMid={model.id} onCopy={onCopyPartsFrom} onClose={()=>setShowCopy(false)}/>}
    {showWaEditor&&<WaEditorModal brand={brand} cat={cat} model={model} selRows={selRows} defaultCols={waDefaults} onClose={()=>setShowWaEditor(false)}/>}
  </div>);
}

// ══════════ WA EDITOR ══════════
function WaEditorModal({brand,cat,model,selRows,defaultCols,onClose}){
  const[colSel,setColSel]=useState(new Set(defaultCols||['nameHe','tadPn']));
  const sp=model.parts.filter(p=>selRows.has(p.id));
  const activeCols=model.columns.filter(c=>colSel.has(c.id));
  const buildMsg=()=>{
    const hdr=`🔧 *${brand.name} — ${model.name}*\n📂 ${cat.name}\n${'─'.repeat(28)}`;
    const lines=sp.map((p,i)=>{const vals=activeCols.map(c=>{const v=(p.values[c.id]||'').trim();return v?`${c.name}: ${v}`:'';}).filter(Boolean);return`*${i+1}.* ${vals.join(' | ')}`;}).join('\n');
    return`${hdr}\n\n${lines}\n\n_סה"כ ${sp.length} חלקים_`;
  };
  return(<Modal onClose={onClose} wide title="📱 עריכת הודעת ווצאפ">
    <div style={{marginBottom:14}}>
      <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>בחר עמודות לשליחה:</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
        <button onClick={()=>setColSel(new Set(model.columns.map(c=>c.id)))} style={sB('#607d8b')}>הכל</button>
        <button onClick={()=>setColSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
        <button onClick={()=>setColSel(new Set(defaultCols||['nameHe','tadPn']))} style={sB('#1565c0')}>ברירת מחדל</button>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {model.columns.map(c=>{const on=colSel.has(c.id);return(
          <div key={c.id} onClick={()=>setColSel(p=>{const n=new Set(p);on?n.delete(c.id):n.add(c.id);return n;})}
            style={{padding:'5px 10px',borderRadius:6,border:`2px solid ${on?'#25D366':'var(--border)'}`,background:on?'#e8f5e9':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>
            {on?'✓ ':''}{c.name}
          </div>
        );})}
      </div>
    </div>
    <div style={{background:'var(--row2)',borderRadius:8,padding:'10px 14px',marginBottom:14,fontFamily:'monospace',fontSize:12,color:'var(--text)',whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto',direction:'ltr',textAlign:'left'}}>
      {buildMsg()}
    </div>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>window.open('https://wa.me/?text='+encodeURIComponent(buildMsg()),'_blank')} style={{flex:1,...BPr('#25D366')}}>📱 פתח ווצאפ</button>
      <button onClick={()=>navigator.clipboard?.writeText(buildMsg()).then(()=>alert('✅ הועתק'))} style={{flex:1,...BPr('#607d8b')}}>📋 העתק</button>
      <button onClick={onClose} style={{...BST,padding:'10px 14px'}}>סגור</button>
    </div>
  </Modal>);
}

// ══════════ MOVE MODAL ══════════
function MoveModal({data,currentBid,currentCid,onMove,onClose}){
  const[toBid,setToBid]=useState(currentBid);const[toCid,setToCid]=useState('');
  const tb=data.brands.find(b=>b.id===toBid);
  return(<Modal onClose={onClose} title="🔀 העבר דגם">
    <div style={{marginBottom:12}}>
      <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>בחר מותג יעד:</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        {data.brands.map(b=><button key={b.id} onClick={()=>{setToBid(b.id);setToCid('');}} style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>{b.name}</button>)}
      </div>
      {tb&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {tb.categories.map(c=><div key={c.id} onClick={()=>setToCid(c.id)} style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>{c.name}</div>)}
      </div>}
    </div>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!toCid){alert('בחר קטגוריה');return;}onMove(toBid,toCid);onClose();}} style={{flex:1,...BPr('#1565c0')}}>✓ העבר</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ COPY PARTS MODAL ══════════
function CopyPartsModal({data,currentMid,onCopy,onClose}){
  const[sel,setSel]=useState(null);
  const all=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{if(m.id!==currentMid)all.push({b,c,m});})));
  return(<Modal onClose={onClose} wide title="📋 העתק חלקים מדגם">
    <div style={{maxHeight:'55vh',overflowY:'auto',marginBottom:12}}>
      {all.map(({b,c,m})=>(
        <div key={m.id} onClick={()=>setSel({b,c,m})} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:`2px solid ${sel?.m.id===m.id?b.color:'var(--border)'}`,marginBottom:6,cursor:'pointer',background:sel?.m.id===m.id?b.light+'88':'var(--card)'}}>
          <span style={{background:b.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>{b.name}</span>
          <span style={{fontWeight:'bold',flex:1,color:'var(--text)',fontSize:13}}>{m.name}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{c.name} · {m.parts.length} חלקים</span>
        </div>
      ))}
    </div>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!sel){alert('בחר דגם');return;}onCopy(sel.b.id,sel.c.id,sel.m.id);onClose();}} style={{flex:1,...BPr('#558b2f')}}>📋 העתק</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ BULK MOVE MODAL ══════════
function BulkMoveModal({data,onMove,onClose}){
  const[sel,setSel]=useState(new Set());const[q,setQ]=useState('');const[toBid,setToBid]=useState('');const[toCid,setToCid]=useState('');
  const all=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color,parts:(m.parts||[]).length}))));
  const filtered=q.trim()?all.filter(x=>[x.mname,x.bname,x.cname].some(s=>s.toLowerCase().includes(q.toLowerCase()))):all;
  const key=(bid,cid,mid)=>`${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle=k=>setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const tb=data.brands.find(b=>b.id===toBid);
  return(<Modal onClose={onClose} wide title="🔀 העברה מרובה">
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{...INS,padding:'7px 12px',marginBottom:10}}/>
    <div style={{maxHeight:'30vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
      {filtered.map(x=>{const k=key(x.bid,x.cid,x.mid);const isSel=sel.has(k);return(
        <div key={k} onClick={()=>toggle(k)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'var(--sel)':'var(--card)'}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?'#1565c0':'var(--border)'}`,background:isSel?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isSel&&<span style={{color:'#fff',fontSize:11}}>✓</span>}</div>
          <span style={{background:x.color,color:'#fff',padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>{x.bname}</span>
          <span style={{flex:1,fontWeight:'bold',color:'var(--text)',fontSize:13}}>{x.mname}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
        </div>
      );})}
    </div>
    {sel.size>0&&<div style={{background:'var(--sel)',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#2e7d32',fontWeight:'bold'}}>✓ {sel.size} דגמים נבחרו</div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>{data.brands.map(b=><button key={b.id} onClick={()=>{setToBid(b.id);setToCid('');}} style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>{b.name}</button>)}</div>
    {tb&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>{tb.categories.map(c=><div key={c.id} onClick={()=>setToCid(c.id)} style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>{c.name}</div>)}</div>}
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!sel.size){alert('בחר דגמים');return;}if(!toCid){alert('בחר יעד');return;}const sels=[...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});onMove(sels,toBid,toCid);alert(`✅ ${sels.length} דגמים הועברו`);onClose();}} style={{flex:1,...BPr('#1565c0')}}>✓ העבר{sel.size>0?` (${sel.size})`:''}</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ BULK DELETE MODAL ══════════
function BulkDeleteModal({data,onDelete,onClose}){
  const[sel,setSel]=useState(new Set());const[q,setQ]=useState('');
  const all=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color,parts:(m.parts||[]).length}))));
  const filtered=q.trim()?all.filter(x=>[x.mname,x.bname,x.cname].some(s=>s.toLowerCase().includes(q.toLowerCase()))):all;
  const key=(bid,cid,mid)=>`${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle=k=>setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  return(<Modal onClose={onClose} wide title="🗑 מחיקה מרובה">
    <div style={{background:'#ffebee',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#c62828',fontWeight:'bold'}}>⚠ הפריטים יועברו לסל מיחזור ל-30 יום</div>
    <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{flex:1,minWidth:100,...INS,padding:'7px 12px'}}/>
      <button onClick={()=>setSel(new Set(filtered.map(x=>key(x.bid,x.cid,x.mid))))} style={sB('#607d8b')}>בחר הכל</button>
      <button onClick={()=>setSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
    </div>
    <div style={{maxHeight:'38vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
      {filtered.map(x=>{const k=key(x.bid,x.cid,x.mid);const isSel=sel.has(k);return(
        <div key={k} onClick={()=>toggle(k)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'#ffebee':'var(--card)'}}>
          <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${isSel?'#c62828':'var(--border)'}`,background:isSel?'#c62828':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isSel&&<span style={{color:'#fff',fontSize:13,fontWeight:'bold'}}>✓</span>}</div>
          <span style={{background:x.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.bname}</span>
          <span style={{fontWeight:'bold',color:'var(--text)',flex:1,fontSize:13}}>{x.mname}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
          <span style={{color:'#e53935',fontSize:11,fontWeight:'bold',flexShrink:0}}>{x.parts} חלקים</span>
        </div>
      );})}
    </div>
    {sel.size>0&&<div style={{background:'#ffebee',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#c62828',fontWeight:'bold'}}>🗑 {sel.size} דגמים יועברו לסל מיחזור</div>}
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!sel.size){alert('לא נבחרו');return;}const sels=[...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});onDelete(sels);onClose();}} style={{flex:1,...BPr(sel.size?'#c62828':'#aaa')}}>🗑 מחק{sel.size>0?` (${sel.size})`:''}</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ BRAND MGR ══════════
function BrandMgr({data,onClose,onSave}){
  const[brands,setBrands]=useState(JSON.parse(JSON.stringify(data.brands)));
  const add=()=>setBrands(b=>[...b,{id:gid(),name:'מותג חדש',color:'#607d8b',light:'#eceff1',categories:DCATS()}]);
  const upd=(id,k,v)=>setBrands(b=>b.map(x=>x.id!==id?x:{...x,[k]:v}));
  const del=id=>{if(confirm('למחוק?'))setBrands(b=>b.filter(x=>x.id!==id));};
  return(<Modal onClose={onClose} wide title="⚙ ניהול מותגים">
    <div style={{maxHeight:'50vh',overflowY:'auto',marginBottom:12}}>
      {brands.map(b=>(<div key={b.id} style={{border:'1px solid var(--border)',borderRadius:10,padding:12,marginBottom:10,borderRight:`5px solid ${b.color}`}}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={b.name} onChange={e=>upd(b.id,'name',e.target.value)} style={{border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:14,fontWeight:'bold',flex:'1 1 100px',color:'var(--inp)',background:'var(--ibg)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <label style={{fontSize:12,color:'var(--sub)'}}>צבע:</label>
            <input type="color" value={b.color} onChange={e=>{const c=e.target.value;upd(b.id,'color',c);upd(b.id,'light',c+'22');}} style={{border:'none',borderRadius:4,height:34,width:44,cursor:'pointer'}}/>
          </div>
          <button onClick={()=>del(b.id)} style={{background:'none',border:'1px solid #e53935',color:'#e53935',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12}}>מחק</button>
        </div>
        <div style={{fontSize:11,color:'var(--sub)',marginTop:6}}>{b.categories.reduce((s,c)=>s+c.models.length,0)} דגמים</div>
      </div>))}
    </div>
    <button onClick={add} style={{width:'100%',padding:10,background:'#607d8b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',marginBottom:12}}>+ הוסף מותג</button>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>onSave(brands)} style={{flex:1,...BPr('#1565c0')}}>✓ שמור</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ CHANGE PWD / SETTINGS ══════════
function ChangePwd({data,onSave,onClose}){
  const[cur,setCur]=useState('');const[an,setAn]=useState('');const[en,setEn]=useState('');const[vn,setVn]=useState('');const[err,setErr]=useState('');
  const[wt,setWt]=useState(data.welcomeTitle||'');const[ws,setWs]=useState(data.welcomeSub||'');const[wd,setWd]=useState(data.waDefaults||['nameHe','tadPn']);
  const[disc,setDisc]=useState(data.disclaimer||'');
  const submit=()=>{
    if(cur!==data.pass){setErr('סיסמת מנהל נוכחית שגויה');return;}
    if(an&&an.length<4){setErr('לפחות 4 תווים');return;}
    onSave({...data,pass:an||data.pass,editorPass:en||data.editorPass||'editor1234',viewerPass:vn||data.viewerPass||'tadir123',waDefaults:wd,welcomeTitle:wt,welcomeSub:ws,disclaimer:disc});
    alert('✅ נשמר');
  };
  const allCols=data.brands[0]?.categories[0]?.models[0]?.columns||DCOLS();
  return(<Modal onClose={onClose} wide title="🔑 הגדרות מנהל">
    <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>🔐 סיסמאות</div>
    {[['סיסמת מנהל נוכחית (לאימות)',cur,setCur,''],['סיסמת מנהל חדשה',an,setAn,'ריק = ללא שינוי'],['סיסמת עורך חדשה',en,setEn,`נוכחית: ${data.editorPass||'editor1234'}`],['סיסמת צופה חדשה',vn,setVn,`נוכחית: ${data.viewerPass||'tadir123'}`]].map(([l,v,s,hint])=>(
      <div key={l} style={{marginBottom:10}}>
        <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>{l}{hint&&<span style={{color:'#aaa',marginRight:8,fontSize:11}}>({hint})</span>}</div>
        <input type="password" value={v} onChange={e=>s(e.target.value)} style={INS}/>
      </div>
    ))}
    {err&&<div style={{color:'red',fontSize:12,marginBottom:8}}>{err}</div>}
    <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingTop:12,paddingBottom:8,borderBottom:'1px solid var(--border)',borderTop:'1px solid var(--border)',marginTop:4}}>📱 ברירת מחדל לווצאפ</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
      {allCols.map(c=>{const on=wd.includes(c.id);return(<div key={c.id} onClick={()=>setWd(p=>on?p.filter(x=>x!==c.id):[...p,c.id])} style={{padding:'6px 12px',borderRadius:8,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>{on?'✓ ':''}{c.name}</div>);})}
    </div>
    <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>🏠 מסך כניסה</div>
    {[['כותרת ראשית',wt,setWt,'textarea'],['כותרת משנה',ws,setWs,'input'],['הצהרת אחריות',disc,setDisc,'textarea']].map(([l,v,s,t])=>(
      <div key={l} style={{marginBottom:10}}>
        <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>{l}</div>
        {t==='textarea'?<textarea value={v} onChange={e=>s(e.target.value)} rows={2} style={{...INS,height:'auto',resize:'vertical'}}/>:<input value={v} onChange={e=>s(e.target.value)} style={INS}/>}
      </div>
    ))}
    <div style={{display:'flex',gap:8,marginTop:14}}>
      <button onClick={submit} style={{flex:1,...BPr('#1565c0')}}>שמור הכל</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ EXCEL IMPORT ══════════
function XlsImportModal({data,onImport,onClose}){
  const[rows,setRows]=useState([]);const[fn,setFn]=useState('');const[toBid,setToBid]=useState(data.brands[0]?.id||'');const[toCid,setToCid]=useState(data.brands[0]?.categories[0]?.id||'');const[cm,setCm]=useState({model:0,nameHe:1,tadPn:2,nameEn:3,mfgPn:4});const[step,setStep]=useState(1);const[groups,setGroups]=useState([]);const[excl,setExcl]=useState(new Set());
  const tb=data.brands.find(b=>b.id===toBid);
  const parseFile=e=>{const f=e.target.files[0];if(!f)return;setFn(f.name);const r=new FileReader();r.onload=ev=>{const wb=XLSX.read(ev.target.result,{type:'binary'});const ws=wb.Sheets[wb.SheetNames[0]];const all=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});const fc=String(all[0]?.[0]||'').toLowerCase();const dr=(fc.includes('דגם')||fc.includes('model'))?all.slice(1):all;setRows(dr.filter(r=>r.some(c=>String(c).trim())));setStep(2);};r.readAsBinaryString(f);e.target.value='';};
  const buildPreview=()=>{const g={};rows.forEach(r=>{const mn=String(r[cm.model]||'').trim();if(!mn)return;g[mn]=(g[mn]||0)+1;});setGroups(Object.entries(g));setExcl(new Set());setStep(3);};
  const colLbl=i=>{const s=rows.slice(0,3).map(r=>String(r[i]||'').trim()).filter(Boolean).join(', ');return`עמודה ${i+1}${s?' ('+s.slice(0,22)+')':''}`;};
  const maxC=rows[0]?rows[0].length:6;const included=groups.filter(([n])=>!excl.has(n));
  return(<Modal onClose={onClose} wide title="📥 ייבוא מ-Excel">
    <div style={{display:'flex',gap:4,marginBottom:20}}>{['1. העלאה','2. מיפוי','3. אישור'].map((s,i)=>(
      <div key={i} style={{flex:1,textAlign:'center',padding:'6px 0',borderRadius:6,fontSize:12,fontWeight:'bold',background:step===i+1?'#1565c0':step>i+1?'#4caf50':'var(--row2)',color:step>=i+1?'#fff':'var(--sub)'}}>{s}</div>
    ))}</div>
    {step===1&&<label style={{display:'block',border:'2px dashed #1565c0',borderRadius:12,padding:'32px 20px',textAlign:'center',cursor:'pointer',background:'var(--row2)'}}>
      <div style={{fontSize:40,marginBottom:8}}>📊</div><div style={{fontWeight:'bold',color:'#1565c0',fontSize:15,marginBottom:4}}>לחץ לבחירת קובץ Excel</div>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={parseFile} style={{display:'none'}}/>
    </label>}
    {step===2&&<div>
      <div style={{background:'#e8f5e9',borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:'#2e7d32'}}>✓ {fn} — {rows.length} שורות</div>
      {[['model','שם הדגם (מפתח)'],['nameHe','שם בעברית'],['tadPn','מק"ט תדיראן'],['nameEn','שם באנגלית'],['mfgPn','מק"ט יצרן']].map(([k,lbl])=>(
        <div key={k} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <span style={{width:130,fontSize:12,color:'var(--sub)',flexShrink:0}}>{lbl}:</span>
          <select value={cm[k]} onChange={e=>setCm(p=>({...p,[k]:Number(e.target.value)}))} style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}>
            {Array.from({length:maxC},(_,i)=>i).map(i=><option key={i} value={i}>{colLbl(i)}</option>)}
          </select>
        </div>
      ))}
      <div style={{fontWeight:'bold',fontSize:13,marginTop:12,marginBottom:8,color:'var(--text)'}}>ייבא אל:</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>{data.brands.map(b=><button key={b.id} onClick={()=>{setToBid(b.id);setToCid(b.categories[0]?.id||'');}} style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>{b.name}</button>)}</div>
      {tb&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:14}}>{tb.categories.map(c=><div key={c.id} onClick={()=>setToCid(c.id)} style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>{c.name}</div>)}</div>}
      <div style={{display:'flex',gap:8}}>
        <button onClick={buildPreview} disabled={!toCid} style={{flex:1,...BPr(toCid?'#1565c0':'#aaa')}}>הבא ▶</button>
        <button onClick={()=>setStep(1)} style={{...BST,padding:'10px 16px',borderRadius:8}}>חזור</button>
      </div>
    </div>}
    {step===3&&<div>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
        <div style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>בחר דגמים ({groups.length}):</div>
        <button onClick={()=>setExcl(new Set())} style={{...sB('#4caf50'),marginRight:'auto'}}>בחר הכל</button>
        <button onClick={()=>setExcl(new Set(groups.map(([n])=>n)))} style={sB('#9e9e9e')}>בטל הכל</button>
      </div>
      <div style={{maxHeight:'34vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:10}}>
        {groups.map(([name,count])=>{const isEx=excl.has(name);return(
          <div key={name} onClick={()=>setExcl(p=>{const n=new Set(p);isEx?n.delete(name):n.add(name);return n;})} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isEx?'var(--row2)':'var(--card)',opacity:isEx?.45:1}}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${!isEx?'#1565c0':'var(--border)'}`,background:!isEx?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{!isEx&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}</div>
            <span style={{flex:1,fontWeight:'bold',color:'var(--text)',fontSize:13}}>{name}</span>
            <span style={{color:'var(--sub)',fontSize:11}}>{count} חלקים</span>
          </div>
        );})}
      </div>
      <div style={{background:'#f3e5f5',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#6a1b9a'}}>
        יוייבאו: <strong>{included.length} דגמים</strong> עם <strong>{included.reduce((s,[,c])=>s+c,0).toLocaleString()} חלקים</strong>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>{const res=onImport(rows,cm,toBid,toCid,excl);alert(`✅ ${res.models} דגמים, ${res.parts.toLocaleString()} חלקים`);onClose();}} disabled={!included.length} style={{flex:1,...BPr(included.length?'#4caf50':'#aaa')}}>✅ ייבא</button>
        <button onClick={()=>setStep(2)} style={{...BST,padding:'10px 16px',borderRadius:8}}>חזור</button>
      </div>
    </div>}
  </Modal>);
}
// ══════════ MAIN APP ══════════
function App(){
  const[data,setData]=useState(null);
  const[loaded,setLoaded]=useState(false);
  const[loginRole,setLoginRole]=useState(null);
  const[sel,setSel]=useState(null);// {bid,cid,mid}
  const[sidebar,setSidebar]=useState(window.innerWidth>700);
  const[dark,setDark]=useState(()=>localStorage.getItem('dark')==='1');
  const[query,setQuery]=useState('');
  const[saving,setSaving]=useState('idle');
  const[saveErr,setSaveErr]=useState('');
  const[showCart,setShowCart]=useState(false);
  const[cart,setCart]=useState([]);
  const[showLegend,setShowLegend]=useState(false);
  const[showSettings,setShowSettings]=useState(false);
  const[showBrandMgr,setShowBrandMgr]=useState(false);
  const[showHist,setShowHist]=useState(false);
  const[histItems,setHistItems]=useState([]);
  const[showNotif,setShowNotif]=useState(false);
  const[reports,setReports]=useState([]);
  const[missingModels,setMissingModels]=useState([]);
  const[notifCount,setNotifCount]=useState(0);
  const[showImport,setShowImport]=useState(false);
  const[showBulkMove,setShowBulkMove]=useState(false);
  const[showBulkDel,setShowBulkDel]=useState(false);
  const[showRecycle,setShowRecycle]=useState(false);
  const[showEditNews,setShowEditNews]=useState(false);
  const[showTechSite,setShowTechSite]=useState(false);
  const[showPwa,setShowPwa]=useState(false);
  const[favorites,setFavorites]=useState(()=>new Set(JSON.parse(localStorage.getItem('favs')||'[]')));
  const[recent,setRecent]=useState(()=>JSON.parse(localStorage.getItem('recent')||'[]'));
  const[imgViewer,setImgViewer]=useState(null);// {imgs,idx}
  const[now,setNow]=useState(new Date());
  const changedMids=useRef(new Set());
  const saveTimer=useRef(null);
  const headerRef=useRef(null);

  // PWA prompt
  useEffect(()=>{
    const handler=()=>setShowPwa(true);
    window.addEventListener('beforeinstallprompt',handler);
    // Also show after a delay if not installed
    const t=setTimeout(()=>{if(window._deferredPrompt&&loginRole)setShowPwa(true);},5000);
    return()=>{window.removeEventListener('beforeinstallprompt',handler);clearTimeout(t);};
  },[loginRole]);

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t);},[]);
  useEffect(()=>{document.body.className=dark?'dark':'';localStorage.setItem('dark',dark?'1':'0');},[dark]);
  useEffect(()=>{localStorage.setItem('favs',JSON.stringify([...favorites]));},[favorites]);
  useEffect(()=>{localStorage.setItem('recent',JSON.stringify(recent));},[recent]);

  // Load data
  useEffect(()=>{fbLoad().then(d=>{setData(d||INIT());setLoaded(true);}).catch(e=>{console.error(e);setData(INIT());setLoaded(true);});},[]);

  // Poll notifications for admin/editor
  useEffect(()=>{
    if(!loginRole||loginRole==='viewer')return;
    const check=()=>{
      fbGetReports().then(r=>{setReports(r);setNotifCount(r.filter(x=>!x.resolved).length+missingModels.filter(x=>!x.resolved).length);});
      fbGetMissingModels().then(m=>setMissingModels(m));
    };
    check();
    const t=setInterval(check,60000);
    return()=>clearInterval(t);
  },[loginRole]);

  // Handle deep link
  useEffect(()=>{
    if(!data)return;
    const p=new URLSearchParams(window.location.search);
    const b=p.get('b'),c=p.get('c'),m=p.get('m');
    if(b&&c&&m)setSel({bid:b,cid:c,mid:m});
  },[data]);

  // expose nav for news clicks
  useEffect(()=>{window._navToModel=(bid,cid,mid)=>{setSel({bid,cid,mid});window.scrollTo(0,0);};},[]);

  // Save logic
  const mut=fn=>{setData(d=>{const nd=fn(d);scheduleSave(nd);return nd;});};
  const scheduleSave=nd=>{clearTimeout(saveTimer.current);setSaving('saving');saveTimer.current=setTimeout(()=>doSave(nd),1500);};
  const doSave=async nd=>{
    try{await fbSave(nd,changedMids.current);changedMids.current=new Set();setSaving('saved');setTimeout(()=>setSaving('idle'),2500);}
    catch(e){setSaving('error');setSaveErr(e.message);}
  };

  const admin=loginRole==='admin';
  const editor=loginRole==='admin'||loginRole==='editor';

  // Missing alerts (fields) for admin
  const missingAlerts=useMemo(()=>{
    if(!data||!admin)return[];
    const res=[];
    data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>m.parts.forEach(p=>{
      ['nameHe','tadPn'].forEach(f=>{if(!(p.values[f]||'').trim())res.push({b,c,m,p,field:f==='nameHe'?'שם':'מק"ט תדיראן'});});
    }))));
    return res;
  },[data,admin]);

  // NAVIGATION
  const goHome=()=>{setSel(null);setQuery('');};
  const goBack=()=>setSel(null);
  const onNav=(bid,cid,mid)=>{
    setSel({bid,cid,mid});
    setRecent(p=>{const f=p.filter(r=>r.mid!==mid);return[{bid,cid,mid,ts:Date.now()},...f].slice(0,20);});
    window.scrollTo(0,0);
    if(window.innerWidth<=700)setSidebar(false);
  };

  // DATA MUTATIONS
  const mutM=(bid,cid,mid,fn)=>mut(d=>({...d,brands:updBrands(d.brands,bid,cid,mid,fn)}));
  const addModel=(bid,cid,name)=>{const id=gid();changedMids.current.add(id);mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:[...c.models,{id,name,synonyms:[],images:[],notes:'',columns:DCOLS(),parts:[]}]})})}));};

  const renameModel=(bid,cid,mid,newName)=>{
    changedMids.current.add(mid);
    mut(d=>({...d,brands:updBrands(d.brands,bid,cid,mid,m=>({...m,name:newName}))}));
    fbHist({action:'שינוי שם דגם',model:newName,role:loginRole});
  };

  const delModel=async(bid,cid,mid)=>{
    const b=data.brands.find(x=>x.id===bid);
    const c=b?.categories.find(x=>x.id===cid);
    const m=c?.models.find(x=>x.id===mid);
    if(!m)return;
    if(!confirm(`למחוק "${m.name}"? יועבר לסל מיחזור.`))return;
    await fbTrash('model',{...m,_brand:bid,_cat:cid});
    try{await db.collection('parts').doc(mid).delete();}catch{}
    mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:c.models.filter(m=>m.id!==mid)})})}));
    if(sel?.mid===mid)setSel(null);
    fbHist({action:'מחיקת דגם',model:m.name,role:loginRole});
  };

  const addCat=(bid,name)=>{const id=gid();mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:[...b.categories,{id,name,models:[]}]})}));};
  const editCat=(bid,cid,name)=>mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,name})})}));
  const delCat=(bid,cid)=>{
    if(!confirm('למחוק קטגוריה?'))return;
    mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.filter(c=>c.id!==cid)})}));
    if(sel?.cid===cid)setSel(null);
  };
  const updateModel=(bid,cid,mid,upd)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,...upd}));};
  const addPart=(bid,cid,mid)=>{
    const m=data.brands.find(b=>b.id===bid)?.categories.find(c=>c.id===cid)?.models.find(m=>m.id===mid);
    if(!m)return;
    const vals={};m.columns.forEach(c=>{vals[c.id]='';});
    const p={id:gid(),values:vals,discontinued:false,tags:'',pinned:false,comments:[]};
    changedMids.current.add(mid);
    mutM(bid,cid,mid,m=>({...m,parts:[...m.parts,p]}));
  };
  const delPart=(bid,cid,mid,pid)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,parts:m.parts.filter(p=>p.id!==pid)}));};
  const trashPart=async(bid,cid,mid,p)=>{await fbTrash('part',{...p,_bid:bid,_cid:cid,_mid:mid});};
  const cellChange=(bid,cid,mid,pid,colId,val)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,parts:m.parts.map(p=>p.id!==pid?p:{...p,values:{...p.values,[colId]:val}})}));};
  const colName=(bid,cid,mid,colId,name)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,columns:m.columns.map(c=>c.id!==colId?c:{...c,name}),parts:m.parts.map(p=>({...p,values:{...p.values}}))  }));};
  const moveCol=(bid,cid,mid,colId,dir)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>{const cols=[...m.columns];const i=cols.findIndex(c=>c.id===colId);const j=i+dir;if(j<0||j>=cols.length)return m;[cols[i],cols[j]]=[cols[j],cols[i]];return{...m,columns:cols};});};
  const addCol=(bid,cid,mid)=>{const id=gid();changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,columns:[...m.columns,{id,name:'עמודה חדשה'}],parts:m.parts.map(p=>({...p,values:{...p.values,[id]:''}}))  }));};
  const delCol=async(bid,cid,mid,colId,col)=>{
    await fbTrash('column',{...col,_bid:bid,_cid:cid,_mid:mid});
    changedMids.current.add(mid);
    mutM(bid,cid,mid,m=>{const{[colId]:_,...rest}={};return{...m,columns:m.columns.filter(c=>c.id!==colId),parts:m.parts.map(p=>{const v={...p.values};delete v[colId];return{...p,values:v};})};});
  };
  const pasteRows=(bid,cid,mid,rows)=>{
    const m=data.brands.find(b=>b.id===bid)?.categories.find(c=>c.id===cid)?.models.find(m=>m.id===mid);
    if(!m)return;
    changedMids.current.add(mid);
    const newParts=rows.map(row=>{const vals={};m.columns.forEach((c,i)=>{vals[c.id]=row[i]||'';});return{id:gid(),values:vals,discontinued:false,tags:'',pinned:false,comments:[]};});
    mutM(bid,cid,mid,m=>({...m,parts:[...m.parts,...newParts]}));
    fbHist({action:'הדבקה מרובה',count:newParts.length,role:loginRole});
  };
  const imgUpload=async(bid,cid,mid,files)=>{
    const imgs=await Promise.all([...files].map(f=>compressImg(f)));
    changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,images:[...(m.images||[]),...imgs]}));
  };
  const delImg=(bid,cid,mid,idx)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,images:(m.images||[]).filter((_,i)=>i!==idx)}));};
  const addImgUrl=(bid,cid,mid,url)=>{changedMids.current.add(mid);mutM(bid,cid,mid,m=>({...m,images:[...(m.images||[]),url]}));};

  const moveModel=(fBid,fCid,mid,toBid,toCid)=>{
    let moved=null;
    mut(d=>{const brands=d.brands.map(b=>{if(b.id!==fBid)return b;return{...b,categories:b.categories.map(c=>{if(c.id!==fCid)return c;moved=c.models.find(m=>m.id===mid);return{...c,models:c.models.filter(m=>m.id!==mid)};})};});if(!moved)return d;return{...d,brands:brands.map(b=>b.id!==toBid?b:{...b,categories:b.categories.map(c=>c.id!==toCid?c:{...c,models:[...c.models,moved]})})};});
    changedMids.current.add(mid);setSel(s=>({...s,bid:toBid,cid:toCid}));
  };
  const bulkMoveModels=(sels,toBid,toCid)=>{
    mut(d=>{let moved=[];let brands=d.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.filter(m=>{const s=sels.some(x=>x.mid===m.id&&x.bid===b.id&&x.cid===c.id);if(s)moved.push(m);return!s;})}))}));brands=brands.map(b=>b.id!==toBid?b:{...b,categories:b.categories.map(c=>c.id!==toCid?c:{...c,models:[...c.models,...moved]})});return{...d,brands};});
    sels.forEach(s=>changedMids.current.add(s.mid));fbHist({action:'העברה מרובה',count:sels.length,role:loginRole});
  };
  const bulkDeleteModels=async(sels)=>{
    try{await Promise.all(sels.map(s=>db.collection('parts').doc(s.mid).delete().catch(()=>{})));}catch{}
    // Trash each
    await Promise.all(sels.map(async s=>{
      const b=data.brands.find(x=>x.id===s.bid);
      const c=b?.categories.find(x=>x.id===s.cid);
      const m=c?.models.find(x=>x.id===s.mid);
      if(m)await fbTrash('model',{...m,_brand:s.bid,_cat:s.cid});
    }));
    mut(d=>({...d,brands:d.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.filter(m=>!sels.some(s=>s.mid===m.id&&s.bid===b.id&&s.cid===c.id))}))}))}));
    if(sels.some(s=>s.mid===sel?.mid))setSel(null);fbHist({action:'מחיקה מרובה',count:sels.length,role:loginRole});
  };
  const duplicateModel=(bid,cid,mid)=>{const orig=data.brands.find(b=>b.id===bid)?.categories.find(c=>c.id===cid)?.models.find(m=>m.id===mid);if(!orig)return;const newId=gid();changedMids.current.add(newId);const dup={...JSON.parse(JSON.stringify(orig)),id:newId,name:orig.name+' (עותק)',synonyms:[]};mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:[...c.models,dup]})})}));};
  const copyPartsFrom=(sb,sc,sm,db2,dc,dm)=>{const srcM=data.brands.find(b=>b.id===sb)?.categories.find(c=>c.id===sc)?.models.find(m=>m.id===sm);if(!srcM)return;changedMids.current.add(dm);mutM(db2,dc,dm,m=>({...m,parts:[...m.parts,...srcM.parts.map(p=>({...p,id:gid()}))]}));};
  const importFromXls=(rows,colMap,tBid,tCid,excluded)=>{
    const grouped={};rows.forEach(r=>{const mn=String(r[colMap.model]||'').trim();if(!mn||excluded.has(mn))return;if(!grouped[mn])grouped[mn]=[];grouped[mn].push(r);});
    let total=0;
    mut(d=>{const brands=d.brands.map(b=>{if(b.id!==tBid)return b;return{...b,categories:b.categories.map(c=>{if(c.id!==tCid)return c;let models=[...c.models];Object.entries(grouped).forEach(([mn,pRows])=>{let m=models.find(x=>x.name===mn);const newId=m?m.id:gid();if(!m){m={id:newId,name:mn,synonyms:[],images:[],notes:'',columns:DCOLS(),parts:[]};models.push(m);}const np=pRows.map(r=>({id:gid(),discontinued:false,tags:'',pinned:false,comments:[],values:{ref:'',nameHe:String(r[colMap.nameHe]||'').trim(),nameEn:String(r[colMap.nameEn]||'').trim(),mfgPn:String(r[colMap.mfgPn]||'').trim(),tadPn:String(r[colMap.tadPn]||'').trim()}}));total+=np.length;changedMids.current.add(newId);models=models.map(x=>x.name===mn?{...x,parts:[...x.parts,...np]}:x);});return{...c,models};})};});return{...d,brands};});
    fbHist({action:'ייבוא Excel',models:Object.keys(grouped).length,parts:total,role:loginRole});
    return{models:Object.keys(grouped).length,parts:total};
  };

  // Restore from recycle bin
  const restoreFromTrash=async(item)=>{
    if(!item.parsed)return alert('לא ניתן לשחזר — נתונים חסרים');
    const d=item.parsed;
    if(item.type==='model'){
      const bid=d._brand,cid=d._cat;
      if(!bid||!cid){alert('מידע על מותג/קטגוריה חסר');return;}
      const clean={...d};delete clean._brand;delete clean._cat;
      const newId=gid();clean.id=newId;
      changedMids.current.add(newId);
      mut(prev=>({...prev,brands:prev.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:[...c.models,clean]})})}));
      await fbDeleteTrashItem(item.id);
      alert(`✅ דגם "${clean.name}" שוחזר`);
    } else if(item.type==='part'){
      const{_bid,_cid,_mid,...part}=d;
      if(!_bid||!_cid||!_mid){alert('מידע חסר');return;}
      changedMids.current.add(_mid);
      mutM(_bid,_cid,_mid,m=>({...m,parts:[...m.parts,{...part,id:gid()}]}));
      await fbDeleteTrashItem(item.id);
      alert('✅ חלק שוחזר');
    } else {
      alert('שחזור לסוג זה לא נתמך');
    }
  };

  // Cart
  const addToCart=(bid,cid,mid,pid)=>{
    const b=data.brands.find(x=>x.id===bid);const c=b?.categories.find(x=>x.id===cid);const m=c?.models.find(x=>x.id===mid);const p=m?.parts.find(x=>x.id===pid);
    if(!b||!c||!m||!p)return;
    setCart(prev=>{if(prev.some(i=>i.id===pid))return prev;return[...prev,{id:pid,brandName:b.name,brandColor:b.color,catName:c.name,modelName:m.name,columns:m.columns,values:p.values}];});
  };
  const removeFromCart=id=>setCart(p=>p.filter(i=>i.id!==id));
  const clearCart=()=>setCart([]);

  // Excel export
  const expXLS=()=>{
    if(!data)return;
    try{
      const wb=XLSX.utils.book_new();
      const summaryRows=[['מותג','קטגוריה','שם דגם','שם','שם באנגלית','מק"ט יצרן','מק"ט תדיראן','הופסק','נפוץ','תגיות']];
      data.brands.forEach(b=>{
        const brandRows=[['קטגוריה','שם דגם','שם','שם באנגלית','מק"ט יצרן','מק"ט תדיראן','הופסק','נפוץ','תגיות']];
        b.categories.forEach(c=>{
          c.models.forEach(m=>{
            if(!m.parts||!m.parts.length){brandRows.push([c.name,m.name,'(אין חלקים)','','','','','','']);return;}
            m.parts.forEach(p=>{
              const row=[c.name,m.name,p.values.nameHe||'',p.values.nameEn||'',p.values.mfgPn||'',p.values.tadPn||'',p.discontinued?'כן':'',p.pinned?'כן':'',p.tags||''];
              brandRows.push(row);summaryRows.push([b.name,...row]);
            });
          });
        });
        const ws=XLSX.utils.aoa_to_sheet(brandRows);
        ws['!cols']=[{wch:14},{wch:18},{wch:22},{wch:22},{wch:16},{wch:16},{wch:8},{wch:8},{wch:20}];
        XLSX.utils.book_append_sheet(wb,ws,sanitizeSheet(b.name));
      });
      const wsSummary=XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols']=[{wch:12},{wch:14},{wch:18},{wch:22},{wch:22},{wch:16},{wch:16},{wch:8},{wch:8},{wch:20}];
      XLSX.utils.book_append_sheet(wb,wsSummary,'כל הנתונים');
      XLSX.writeFile(wb,`catalog-${new Date().toISOString().slice(0,10)}.xlsx`);
    }catch(e){alert('שגיאה בייצוא Excel: '+e.message);}
  };
  const expJSON=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`ac-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();};
  const impFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);d.brands?.forEach(b=>b.categories?.forEach(c=>c.models?.forEach(m=>changedMids.current.add(m.id))));setData(d);setSel(null);alert('✅ נטען');}catch{alert('❌ שגיאה');}};r.readAsText(f);e.target.value='';};

  // Report
  const onReport=async(text)=>{
    const b=data.brands.find(x=>x.id===sel?.bid);
    const c=b?.categories.find(x=>x.id===sel?.cid);
    const m=c?.models.find(x=>x.id===sel?.mid);
    await fbSaveReport({text,bid:sel?.bid,cid:sel?.cid,mid:sel?.mid,modelName:m?.name||'',brandName:b?.name||'',role:loginRole});
    fbHist({action:'דיווח שגיאה',model:m?.name,role:loginRole});
    if(admin||loginRole==='editor'){setNotifCount(p=>p+1);}
  };

  // Resolve report
  const resolveReport=async(id)=>{await fbResolveReport(id);setReports(p=>p.map(r=>r.id===id?{...r,resolved:true}:r));};
  const resolveMissing=async(id,note)=>{await fbResolveMissing(id,note);setMissingModels(p=>p.map(r=>r.id===id?{...r,resolved:true,resolveNote:note}:r));};
  const deleteMissing=async(id)=>{if(!confirm('למחוק?'))return;await fbDeleteMissing(id);setMissingModels(p=>p.filter(r=>r.id!==id));};

  // Favorites
  const toggleFav=mid=>setFavorites(p=>{const n=new Set(p);n.has(mid)?n.delete(mid):n.add(mid);return n;});

  if(!loaded)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16,background:'#0f172a'}}>
    <div style={{fontSize:52}}>🔧</div><div style={{fontSize:17,color:'#94a3b8'}}>טוען...</div>
    <div style={{width:40,height:40,border:'4px solid #334155',borderTop:'4px solid #1565c0',borderRadius:'50%',animation:'spin .9s linear infinite'}}/>
  </div>);
  if(!loginRole)return <LoginScreen data={data} onLogin={r=>{setLoginRole(r);fbHist({action:'כניסה',role:r});}}/>;

  const brand=sel?data.brands.find(b=>b.id===sel.bid):null;
  const cat=sel&&brand?brand.categories.find(c=>c.id===sel.cid):null;
  const model=sel&&cat?cat.models.find(m=>m.id===sel.mid):null;
  const hdrBg=brand?.color||'#37474f';

  // Global search
  const globalResults=useMemo(()=>{
    if(!query.trim()||!data)return[];
    const q=query.trim().toLowerCase();
    const res=[];
    data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
      const mMatch=m.name.toLowerCase().includes(q)||(m.synonyms||[]).some(s=>s.toLowerCase().includes(q));
      const partMatches=m.parts.filter(p=>partMatchesGlobal(q,p));
      if(mMatch||partMatches.length>0)res.push({b,c,m,partCount:partMatches.length,mMatch});
    })));
    return res.slice(0,40);
  },[query,data]);

  return(<div dir="rtl" style={{fontFamily:'Arial,sans-serif',minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',fontSize:14,color:'var(--text)'}}>

    {/* HEADER */}
    <header ref={headerRef} style={{background:hdrBg,color:'#fff',padding:'10px 12px',display:'flex',alignItems:'center',gap:7,boxShadow:'0 2px 8px rgba(0,0,0,.25)',position:'sticky',top:0,zIndex:200,flexWrap:'wrap',transition:'background .3s'}}>
      <button onClick={()=>setSidebar(v=>!v)} style={bB('rgba(255,255,255,.2)')}>☰</button>
      <button onClick={goHome} style={{...bB('rgba(255,255,255,.2)'),fontSize:16}}>🏠</button>
      {sel&&<button onClick={goBack} style={bB('rgba(255,255,255,.2)')}>◀</button>}
      <span style={{fontWeight:'bold',fontSize:14,flexShrink:0}}>🔧 חלקי חילוף</span>
      <span style={{fontSize:11,color:'rgba(255,255,255,.75)',flexShrink:0,fontFamily:'monospace'}}>{now.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'})} {now.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</span>
      {saving==='saving'&&<span style={{fontSize:11,color:'rgba(255,255,255,.8)',flexShrink:0}}>💾 שומר...</span>}
      {saving==='saved'&&<span style={{fontSize:11,color:'#a5d6a7',flexShrink:0}}>✓ נשמר</span>}
      {saving==='error'&&<button onClick={()=>alert('שגיאת שמירה: '+saveErr)} style={{fontSize:11,color:'#fff',background:'#e53935',border:'none',borderRadius:5,padding:'3px 8px',cursor:'pointer',flexShrink:0}}>⚠ שגיאה</button>}

      {/* Global search */}
      <div style={{flex:'1 1 130px',position:'relative',minWidth:90}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 חיפוש גלובלי..."
          style={{width:'100%',padding:'7px 28px 7px 10px',borderRadius:20,border:'none',fontSize:13,outline:'none',color:'#222',background:'#fff'}}/>
        {query&&<button onClick={()=>setQuery('')} style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:15}}>✕</button>}
      </div>

      <button onClick={()=>setShowCart(true)} style={{...bB('rgba(255,255,255,.2)'),position:'relative'}}>
        🛒{cart.length>0&&<span style={{position:'absolute',top:-4,left:-4,background:'#e53935',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold'}}>{cart.length}</span>}
      </button>
      {(admin||loginRole==='editor')&&<button onClick={()=>{setShowNotif(true);fbGetReports().then(setReports);fbGetMissingModels().then(setMissingModels);}} style={{...bB('rgba(255,255,255,.2)'),position:'relative'}}>
        🔔{notifCount>0&&<span style={{position:'absolute',top:-4,left:-4,background:'#e53935',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold'}}>{notifCount}</span>}
      </button>}
      <button onClick={()=>setShowLegend(true)} title="מדריך שימוש" style={bB('rgba(255,255,255,.2)')}>📖</button>
      {/* Technician site button */}
      <button onClick={()=>setShowTechSite(true)} title="אתר טכנאים" style={bB('rgba(255,255,255,.2)')}>🔧 טכנאים</button>
      <button onClick={()=>setDark(v=>!v)} style={bB('rgba(255,255,255,.2)')}>{dark?'☀️':'🌙'}</button>
    </header>

    {/* BODY */}
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>

      {/* SIDEBAR */}
      {sidebar&&(<aside style={{width:240,background:'var(--sidebar)',borderLeft:'1px solid var(--border)',overflowY:'auto',flexShrink:0,transition:'width .2s',boxShadow:'inset -1px 0 0 var(--border)'}}>
        {/* Admin toolbar */}
        {admin&&<div style={{padding:'8px 10px',background:'var(--row2)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:4}}>
          <button onClick={()=>setShowBrandMgr(true)} style={sB('#607d8b')}>⚙ מותגים</button>
          <button onClick={()=>setShowBulkMove(true)} style={sB('#455a64')}>🔀 העברה</button>
          <button onClick={()=>setShowBulkDel(true)} style={sB('#c62828')}>🗑 מחיקה</button>
          <button onClick={()=>setShowRecycle(true)} style={sB('#8d6e63')}>♻️ מיחזור</button>
          <button onClick={()=>setShowImport(true)} style={sB('#2e7d32')}>📥 ייבוא</button>
          <button onClick={expXLS} style={sB('#388e3c')}>📊 Excel</button>
          <button onClick={expJSON} style={sB('#5c6bc0')}>💾 JSON</button>
          <label style={{...sB('#546e7a'),cursor:'pointer'}}>📂 טען<input type="file" accept=".json" onChange={impFile} style={{display:'none'}}/></label>
          <button onClick={()=>setShowSettings(true)} style={sB('#1565c0')}>🔑 הגדרות</button>
          <button onClick={()=>setShowHist(true)} style={sB('#9c27b0')}>📋 לוג</button>
        </div>}
        {editor&&!admin&&<div style={{padding:'8px 10px',background:'var(--row2)',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:4}}>
          <button onClick={()=>setShowImport(true)} style={sB('#2e7d32')}>📥 ייבוא</button>
          <button onClick={expXLS} style={sB('#388e3c')}>📊 Excel</button>
        </div>}
        {data.brands.map(b=>(
          <SidebarBrand key={b.id} brand={b} sel={sel} editor={editor} admin={admin} favorites={favorites}
            onToggleFav={toggleFav} onNav={onNav}
            onAddModel={(cid,name)=>addModel(b.id,cid,name)}
            onDelModel={(cid,mid)=>delModel(b.id,cid,mid)}
            onAddCat={name=>addCat(b.id,name)}
            onEditCat={(cid,name)=>editCat(b.id,cid,name)}
            onDelCat={cid=>delCat(b.id,cid)}
            onRenameModel={(cid,mid,name)=>renameModel(b.id,cid,mid,name)}
          />
        ))}
      </aside>)}

      {/* MAIN CONTENT */}
      <main style={{flex:1,overflowY:'auto',padding:'14px 12px',minWidth:0}}>

        {/* GLOBAL SEARCH RESULTS */}
        {query.trim()&&(<div style={{marginBottom:16}}>
          <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10}}>🔍 תוצאות עבור "{query}" ({globalResults.length})</div>
          {!globalResults.length&&<div style={{textAlign:'center',padding:30,color:'var(--sub)'}}>אין תוצאות</div>}
          {globalResults.map(({b,c,m,partCount,mMatch})=>(
            <div key={m.id} onClick={()=>onNav(b.id,c.id,m.id)} style={{background:'var(--card)',borderRadius:10,padding:'12px 16px',marginBottom:8,cursor:'pointer',boxShadow:'0 1px 4px var(--shadow)',borderRight:`4px solid ${b.color}`,transition:'all .15s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <span style={{background:b.color,color:'#fff',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:'bold'}}>{b.name}</span>
                <span style={{fontWeight:'bold',color:'var(--text)',fontSize:14}}>{m.name}</span>
                {mMatch&&<span style={{background:'#fff3e0',color:'#e65100',padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>שם תואם</span>}
              </div>
              <div style={{fontSize:11,color:'var(--sub)'}}>{c.name} · {m.parts.length} חלקים{partCount>0?` · ${partCount} תוצאות בחלקים`:''}</div>
            </div>
          ))}
        </div>)}

        {/* MODEL VIEW or HOME */}
        {!query.trim()&&(model
          ?<ModelView
              brand={brand} cat={cat} model={model} editor={editor} admin={admin}
              hq={query} data={data} favorites={favorites} loginRole={loginRole}
              onToggleFav={toggleFav}
              onUpdate={u=>updateModel(brand.id,cat.id,model.id,u)}
              onAddPart={()=>addPart(brand.id,cat.id,model.id)}
              onDelPart={pid=>delPart(brand.id,cat.id,model.id,pid)}
              onTrashPart={p=>trashPart(brand.id,cat.id,model.id,p)}
              onTrashCol={(col)=>delCol(brand.id,cat.id,model.id,col.id,col)}
              onCell={(pid,colId,val)=>cellChange(brand.id,cat.id,model.id,pid,colId,val)}
              onColName={(colId,name)=>colName(brand.id,cat.id,model.id,colId,name)}
              onMoveCol={(colId,dir)=>moveCol(brand.id,cat.id,model.id,colId,dir)}
              onAddCol={()=>addCol(brand.id,cat.id,model.id)}
              onDelCol={(colId,col)=>delCol(brand.id,cat.id,model.id,colId,col)}
              onPaste={rows=>pasteRows(brand.id,cat.id,model.id,rows)}
              onImgUpload={files=>imgUpload(brand.id,cat.id,model.id,files)}
              onDelImg={idx=>delImg(brand.id,cat.id,model.id,idx)}
              onImgUrl={url=>addImgUrl(brand.id,cat.id,model.id,url)}
              onOpenImg={(imgs,idx)=>setImgViewer({imgs,idx})}
              onMove={(toBid,toCid)=>moveModel(brand.id,cat.id,model.id,toBid,toCid)}
              onDuplicate={()=>duplicateModel(brand.id,cat.id,model.id)}
              onCopyPartsFrom={(sb,sc,sm)=>copyPartsFrom(sb,sc,sm,brand.id,cat.id,model.id)}
              onAddToCart={addToCart}
              onReport={onReport}
              waDefaults={data.waDefaults||['nameHe','tadPn']}
            />
          :<HomeScreen
              data={data} onNav={onNav} recent={recent} favorites={favorites}
              onToggleFav={toggleFav} admin={admin}
              onEditNewsTips={()=>setShowEditNews(true)}
            />
        )}
      </main>
    </div>

    {/* IMAGE VIEWER */}
    {imgViewer&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:900,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setImgViewer(null)}>
      <button onClick={e=>{e.stopPropagation();setImgViewer(v=>({...v,idx:Math.max(0,v.idx-1)}));}} style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:'50%',width:44,height:44,fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>◀</button>
      <img src={imgViewer.imgs[imgViewer.idx]} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:'90vw',maxHeight:'85vh',objectFit:'contain',borderRadius:8}}/>
      <button onClick={e=>{e.stopPropagation();setImgViewer(v=>({...v,idx:Math.min(v.imgs.length-1,v.idx+1)}));}} style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:'50%',width:44,height:44,fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>▶</button>
      <button onClick={()=>setImgViewer(null)} style={{position:'absolute',top:16,left:16,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',borderRadius:'50%',width:36,height:36,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      <div style={{position:'absolute',bottom:16,color:'rgba(255,255,255,.6)',fontSize:13}}>{imgViewer.idx+1} / {imgViewer.imgs.length}</div>
    </div>)}

    {/* HISTORY MODAL */}
    {showHist&&(<Modal onClose={()=>setShowHist(false)} wide title="📋 לוג שינויים">
      <div style={{maxHeight:'60vh',overflowY:'auto'}}>
        {histItems.length===0&&<div style={{textAlign:'center',padding:30,color:'var(--sub)'}}>טוען...</div>}
        {histItems.map(h=>(
          <div key={h.id} style={{padding:'9px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{flex:1}}><span style={{fontWeight:'bold',color:'var(--text)'}}>{h.action}</span>{h.model&&<span style={{color:'var(--sub)',fontSize:12}}> — {h.model}</span>}</div>
            <div style={{fontSize:11,color:'var(--sub)',flexShrink:0,textAlign:'left'}}><div>{h.ts}</div><div>{h.role||'?'}</div></div>
          </div>
        ))}
      </div>
      <button onClick={async()=>{const h=await fbGetHist();setHistItems(h);}} style={{width:'100%',marginTop:10,...BPr('#607d8b')}}>🔄 רענן</button>
    </Modal>)}

    {/* MODALS */}
    {showCart&&<CartPanel cart={cart} data={data} onRemove={removeFromCart} onClear={clearCart} onClose={()=>setShowCart(false)} waDefaults={data.waDefaults||['nameHe','tadPn']}/>}
    {showLegend&&<LegendModal loginRole={loginRole} onClose={()=>setShowLegend(false)}/>}
    {showSettings&&<ChangePwd data={data} onSave={d=>{mut(()=>d);setShowSettings(false);}} onClose={()=>setShowSettings(false)}/>}
    {showBrandMgr&&<BrandMgr data={data} onClose={()=>setShowBrandMgr(false)} onSave={brands=>{mut(d=>({...d,brands}));setShowBrandMgr(false);}}/>}
    {showImport&&<XlsImportModal data={data} onImport={importFromXls} onClose={()=>setShowImport(false)}/>}
    {showBulkMove&&<BulkMoveModal data={data} onMove={bulkMoveModels} onClose={()=>setShowBulkMove(false)}/>}
    {showBulkDel&&<BulkDeleteModal data={data} onDelete={bulkDeleteModels} onClose={()=>setShowBulkDel(false)}/>}
    {showRecycle&&<RecycleBin onClose={()=>setShowRecycle(false)} onRestore={restoreFromTrash}/>}
    {showTechSite&&<TechSiteModal onClose={()=>setShowTechSite(false)}/>}
    {showEditNews&&<NewsTipsEditor data={data} onSave={d=>mut(()=>d)} onClose={()=>setShowEditNews(false)}/>}
    {showNotif&&<NotificationsPanel
      missingAlerts={missingAlerts} reports={reports} missingModels={missingModels}
      onNav={(bid,cid,mid)=>{onNav(bid,cid,mid);setShowNotif(false);}}
      onResolve={resolveReport} onResolveMissing={resolveMissing} onDeleteMissing={deleteMissing}
      onClose={()=>setShowNotif(false)}
    />}

    {/* PWA INSTALL BANNER */}
    {showPwa&&loginRole&&<PwaInstallBanner onDismiss={()=>setShowPwa(false)}/>}
  </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);