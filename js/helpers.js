async function compressImg(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w=img.width,h=img.height,M=1200;
        if(w>M||h>M){const ratio=Math.min(M/w,M/h);w=Math.round(w*ratio);h=Math.round(h*ratio);}
        c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
        res(c.toDataURL('image/jpeg',.72));
      };
      img.src=e.target.result;
    };
    r.readAsDataURL(file);
  });
}

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

const bB  = bg=>({background:bg,border:'none',color:'#fff',padding:'7px 11px',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:'bold',whiteSpace:'nowrap',flexShrink:0});
const sB  = bg=>({background:bg,border:'none',color:'#fff',padding:'4px 10px',borderRadius:5,cursor:'pointer',fontSize:11,whiteSpace:'nowrap'});
const BPr = bg=>({background:bg,border:'none',color:'#fff',padding:'10px 0',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:14});
const BST = {background:'var(--border)',border:'none',color:'var(--text)',padding:'10px 0',borderRadius:8,cursor:'pointer',fontSize:14};
const INS = {width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid var(--border)',fontSize:14,boxSizing:'border-box',textAlign:'right',color:'var(--inp)',outline:'none',display:'block',background:'var(--ibg)'};

function Modal({children,onClose,wide,title}){
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'var(--card)',borderRadius:14,padding:24,width:'100%',maxWidth:wide?700:390,maxHeight:'92vh',overflowY:'auto',animation:'fadeIn .15s',color:'var(--text)'}} dir="rtl" onClick={e=>e.stopPropagation()}>
        {title&&<div style={{fontWeight:'bold',fontSize:17,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:12}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ── News Ticker ──
function NewsTicker({items}){
  if(!items||!items.length)return null;
  const all=[...items,...items];
  return(
    <div style={{background:'#1565c0',color:'#fff',height:28,overflow:'hidden',display:'flex',alignItems:'center',position:'relative',zIndex:190}}>
      <div style={{flexShrink:0,background:'#0d47a1',padding:'0 12px',height:'100%',display:'flex',alignItems:'center',fontWeight:'bold',fontSize:12,whiteSpace:'nowrap',gap:4}}>📰 חדשות</div>
      <div style={{overflow:'hidden',flex:1,position:'relative',height:'100%',display:'flex',alignItems:'center'}}>
        <div style={{display:'flex',gap:0,whiteSpace:'nowrap',animation:`tickerScroll ${Math.max(items.length*8,20)}s linear infinite`,willChange:'transform'}}>
          {all.map((item,i)=>(
            <span key={i} style={{padding:'0 32px',fontSize:13,borderLeft:'1px solid rgba(255,255,255,.2)'}}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tips Bar — fixed at BOTTOM ──
function TipsBar({tips}){
  const[idx,setIdx]=useState(0);
  const[visible,setVisible]=useState(true);
  useEffect(()=>{
    if(!tips||!tips.length)return;
    const t=setInterval(()=>{setVisible(false);setTimeout(()=>{setIdx(i=>(i+1)%tips.length);setVisible(true);},400);},20000);
    return()=>clearInterval(t);
  },[tips]);
  if(!tips||!tips.length)return null;
  return(
    <div style={{position:'fixed',bottom:0,right:0,left:0,zIndex:150,background:'#fff8e1',borderTop:'1px solid #ffe082',padding:'5px 14px',fontSize:12,color:'#795548',display:'flex',alignItems:'center',gap:8,minHeight:28,boxShadow:'0 -2px 8px rgba(0,0,0,.08)'}}>
      <span style={{flexShrink:0}}>💡</span>
      <span style={{transition:'opacity .4s',opacity:visible?1:0}}>{tips[idx]||''}</span>
    </div>
  );
}

// ── Broadcast Banner ──
function BroadcastBanner({msg,onDismiss}){
  if(!msg)return null;
  return(
    <div style={{background:'linear-gradient(135deg,#e65100,#f57c00)',color:'#fff',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',zIndex:195,position:'relative'}}>
      <span style={{fontSize:16,flexShrink:0}}>📢</span>
      <span style={{flex:1,fontWeight:'bold',fontSize:13}}>{msg}</span>
      <button onClick={onDismiss} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:6,color:'#fff',padding:'4px 12px',cursor:'pointer',fontSize:12,flexShrink:0}}>הבנתי ✓</button>
    </div>
  );
}

// ── Time-based greeting ──
function getGreeting(greetings){
  const h=new Date().getHours();
  if(greetings){
    if(h>=5&&h<12&&greetings.morning)  return greetings.morning;
    if(h>=12&&h<17&&greetings.noon)    return greetings.noon;
    if(h>=17&&h<21&&greetings.evening) return greetings.evening;
    if(greetings.night)                return greetings.night;
  }
  if(h>=5&&h<12)  return'🌅 בוקר טוב!';
  if(h>=12&&h<17) return'☀️ צהריים טובים!';
  if(h>=17&&h<21) return'🌆 ערב טוב!';
  return'🌙 לילה טוב!';
}

// ── Help Modal ──
function HelpModal({role,onClose}){
  const isViewer=role==='viewer',isEditor=role==='editor',isAdmin=role==='admin';
  const sections=isViewer?[
    {icon:'🔍',title:'חיפוש',text:'השתמש בשורת החיפוש למעלה. ניתן לחפש לפי שם חלק, מק"ט, שם דגם. החיפוש סולח על שגיאות כתיב.'},
    {icon:'📁',title:'ניווט',text:'בסרגל הצד השמאלי תמצא את כל המותגים והדגמים. לחץ ☰ לפתיחת הסרגל.'},
    {icon:'✅',title:'בחירת חלקים',text:'לחץ על שורה לבחירתה. בחר מספר שורות ושלח בווצאפ בלחיצה אחת.'},
    {icon:'🛒',title:'סל חלקים',text:'לחץ 🛒 על חלק כדי להוסיפו לסל. מהסל ניתן לשלוח את כל החלקים יחד.'},
    {icon:'⭐',title:'מועדפים',text:'לחץ ⭐ ליד דגם לשמירה במועדפים לגישה מהירה מדף הבית.'},
    {icon:'💬',title:'חסר דגם?',text:'בדף הבית: "חסר לך דגם?" — השתמש בטופס כדי לבקש הוספת דגם חדש.'},
  ]:isEditor?[
    {icon:'➕',title:'הוספת דגמים',text:'בסרגל הצד לחץ + ליד קטגוריה להוספת דגם. הקלד שם ובחר מהרשימה למניעת כפילויות.'},
    {icon:'✏️',title:'עריכה',text:'לחץ ישירות על תא בטבלה לעריכה. שינויים נשמרים אוטומטית. ניתן לערוך שם דגם בלחיצה על השם בכותרת.'},
    {icon:'📋',title:'הדבקת נתונים',text:'לחץ "הדבק" להדבקת נתונים מ-Excel. הסדר: לפי עמודות הטבלה.'},
    {icon:'⛔',title:'הופסק',text:'לחץ ⛔ לסימון חלק כהופסק. הוא ימשיך להופיע באדום.'},
    {icon:'📋',title:'לוח משימות',text:'בדף הבית תראה לוח משימות עם דגמים חסרי מק"ט ודיווחים ממתינים.'},
  ]:[
    {icon:'⚙',title:'ניהול מותגים',text:'לחץ ⚙ לניהול מותגים — הוספה, עריכה, שינוי צבע.'},
    {icon:'🔑',title:'הגדרות',text:'לחץ 🔑 לשינוי סיסמאות, טיפים, ברכות ומסך כניסה.'},
    {icon:'📢',title:'הודעת מערכת',text:'לחץ 📢 לשליחת הודעה שתופיע לכל המשתמשים בכניסה הבאה.'},
    {icon:'📊',title:'דשבורד',text:'לחץ 📊 לדשבורד עם גרפי צפיות ולוח משימות.'},
    {icon:'🕐',title:'גרסאות',text:'לחץ 🕐 לגרסאות קודמות — ניתן לשחזר כל גרסה בלחיצה אחת.'},
    {icon:'📰',title:'חדשות',text:'לחץ 📰 לעריכת שורת החדשות הרצה בראש האתר.'},
  ];
  return(
    <Modal onClose={onClose} wide title={`❓ מדריך שימוש${isViewer?' — צופה':isEditor?' — עורך':' — מנהל'}`}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {sections.map((s,i)=>(
          <div key={i} style={{background:'var(--row2)',borderRadius:10,padding:'12px 14px',borderRight:'3px solid #1565c0'}}>
            <div style={{fontWeight:'bold',fontSize:13,marginBottom:4,color:'var(--text)'}}>{s.icon} {s.title}</div>
            <div style={{fontSize:12,color:'var(--sub)',lineHeight:1.6}}>{s.text}</div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{width:'100%',...BPr('#1565c0')}}>הבנתי ✓</button>
    </Modal>
  );
}
