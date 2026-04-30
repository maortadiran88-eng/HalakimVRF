// ── Image compression ──
async function compressImg(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h = img.height, M = 1200;
        if (w > M || h > M) { const ratio = Math.min(M/w, M/h); w = Math.round(w*ratio); h = Math.round(h*ratio); }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/jpeg', .72));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

const updBrands = (brands, bid, cid, mid, fn) =>
  brands.map(b => b.id !== bid ? b : {
    ...b, categories: b.categories.map(c => c.id !== cid ? c : {
      ...c, models: c.models.map(m => m.id !== mid ? m : fn(m))
    })
  });

// ── Fuzzy search ──
function fuzzyMatch(q, text) {
  const n = s => s.toLowerCase().replace(/[\s\-_'"]/g,'');
  const nq = n(q), nt = n(text);
  if (!nq) return false;
  if (nt.includes(nq)) return true;
  if (nq.length >= 3) {
    for (let i = 0; i < nq.length; i++) {
      const d = nq.slice(0,i) + nq.slice(i+1);
      if (nt.includes(d)) return true;
    }
  }
  return false;
}

function partMatches(q, p, cols) {
  const qParts = q.trim().toLowerCase().split(/\s+/);
  const allText = [...Object.values(p.values), p.tags||''].join(' ').toLowerCase();
  return qParts.every(qp => fuzzyMatch(qp, allText));
}

// ── Style atoms ──
const bB  = bg => ({background:bg, border:'none', color:'#fff', padding:'7px 11px', borderRadius:7,  cursor:'pointer', fontSize:12, fontWeight:'bold', whiteSpace:'nowrap', flexShrink:0});
const sB  = bg => ({background:bg, border:'none', color:'#fff', padding:'4px 10px', borderRadius:5,  cursor:'pointer', fontSize:11, whiteSpace:'nowrap'});
const BPr = bg => ({background:bg, border:'none', color:'#fff', padding:'10px 0',   borderRadius:8,  cursor:'pointer', fontWeight:'bold', fontSize:14});
const BST = {background:'var(--border)', border:'none', color:'var(--text)', padding:'10px 0', borderRadius:8, cursor:'pointer', fontSize:14};
const INS = {width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', fontSize:14, boxSizing:'border-box', textAlign:'right', color:'var(--inp)', outline:'none', display:'block', background:'var(--ibg)'};

// ── Generic Modal ──
function Modal({children, onClose, wide, title}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'var(--card)',borderRadius:14,padding:24,width:'100%',maxWidth:wide?640:390,maxHeight:'92vh',overflowY:'auto',animation:'fadeIn .15s',color:'var(--text)'}}
           dir="rtl" onClick={e => e.stopPropagation()}>
        {title && <div style={{fontWeight:'bold',fontSize:17,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:12}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ══════════ NEWS TICKER ══════════
function NewsTicker({items}) {
  if (!items || !items.length) return null;
  // Duplicate for seamless loop
  const all = [...items, ...items];
  return (
    <div style={{background:'#1565c0',color:'#fff',height:28,overflow:'hidden',display:'flex',alignItems:'center',position:'relative',zIndex:190}}>
      <div style={{flexShrink:0,background:'#0d47a1',padding:'0 12px',height:'100%',display:'flex',alignItems:'center',fontWeight:'bold',fontSize:12,whiteSpace:'nowrap',zIndex:1,gap:4}}>
        📰 חדשות
      </div>
      <div style={{overflow:'hidden',flex:1,position:'relative',height:'100%',display:'flex',alignItems:'center'}}>
        <div style={{
          display:'flex',gap:0,whiteSpace:'nowrap',
          animation:`tickerScroll ${Math.max(items.length * 8, 20)}s linear infinite`,
          willChange:'transform'
        }}>
          {all.map((item,i) => (
            <span key={i} style={{padding:'0 32px',fontSize:13,borderLeft:'1px solid rgba(255,255,255,.2)'}}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════ TIPS BAR ══════════
function TipsBar({tips}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!tips || !tips.length) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i+1) % tips.length); setVisible(true); }, 400);
    }, 20000);
    return () => clearInterval(t);
  }, [tips]);
  if (!tips || !tips.length) return null;
  return (
    <div style={{background:'#fff8e1',borderBottom:'1px solid #ffe082',padding:'5px 14px',fontSize:12,color:'#795548',display:'flex',alignItems:'center',gap:8,minHeight:28}}>
      <span style={{flexShrink:0}}>💡</span>
      <span style={{transition:'opacity .4s', opacity:visible?1:0, animation:visible?'tipFadeIn .4s':'none'}}>
        {tips[idx] || ''}
      </span>
    </div>
  );
}

// ══════════ HELP MODAL ══════════
function HelpModal({role, onClose}) {
  const isViewer = role === 'viewer';
  const isEditor = role === 'editor';
  const isAdmin  = role === 'admin';

  const sections = isViewer ? [
    {icon:'🔍', title:'חיפוש', text:'השתמש בשורת החיפוש למעלה. ניתן לחפש לפי שם חלק, מק"ט, או שם דגם. החיפוש סולח על שגיאות כתיב קטנות.'},
    {icon:'📁', title:'ניווט בין דגמים', text:'בסרגל הצד השמאלי תמצא את כל המותגים והדגמים. לחץ על מותג לפתיחה ובחר דגם לצפייה.'},
    {icon:'✅', title:'בחירת חלקים', text:'לחץ על שורה בטבלה לבחירתה. בחר מספר שורות ושלח אותן בווצאפ בלחיצה אחת.'},
    {icon:'🛒', title:'סל חלקים', text:'לחץ 🛒 על חלק כדי להוסיפו לסל. מהסל ניתן לשלוח את כל החלקים שנבחרו יחד.'},
    {icon:'⭐', title:'מועדפים', text:'לחץ ⭐ ליד דגם כדי לשמור אותו במועדפים לגישה מהירה מדף הבית.'},
    {icon:'📱', title:'מצב נייד', text:'לחץ 📱 בעמוד הדגם למעבר לתצוגה נוחה יותר בטלפון.'},
    {icon:'💬', title:'חסר דגם?', text:'בדף הבית תמצא כפתור "דיווח על דגם חסר". השתמש בו כדי לבקש הוספת דגם חדש למערכת.'},
  ] : isEditor ? [
    {icon:'🔍', title:'חיפוש', text:'חיפוש חכם לפי כל שדה — שם, מק"ט, שם נרדף, תגיות. סולח על שגיאות.'},
    {icon:'➕', title:'הוספת דגמים', text:'בסרגל הצד לחץ + ליד קטגוריה להוספת דגם חדש.'},
    {icon:'✏️', title:'עריכת חלקים', text:'לחץ ישירות על תא בטבלה לעריכה. שינויים נשמרים אוטומטית ל-Firebase.'},
    {icon:'📋', title:'הדבקת נתונים', text:'לחץ "הדבק" להדבקת נתונים מ-Excel. הסדר: לפי עמודות הטבלה.'},
    {icon:'📥', title:'ייבוא Excel', text:'לחץ 📥 ייבוא בסרגל העליון לייבוא קובץ Excel שלם עם מיפוי עמודות.'},
    {icon:'🔀', title:'העברת דגמים', text:'ניתן להעביר דגם בין מותגים וקטגוריות מכפתור 🔀 בעמוד הדגם.'},
    {icon:'⛔', title:'הופסק לייצור', text:'לחץ ⛔ ליד חלק לסימונו כהופסק. הוא ימשיך להופיע באדום כדי שניתן יהיה לאתר תחליפים.'},
  ] : [
    {icon:'⚙', title:'ניהול מותגים', text:'לחץ ⚙ בסרגל העליון לניהול מותגים — הוספה, עריכה ושינוי צבע.'},
    {icon:'🔑', title:'סיסמאות', text:'לחץ 🔑 לשינוי סיסמאות מנהל, עורך וצופה, ולעריכת הטיפים ומסך הכניסה.'},
    {icon:'🔔', title:'התראות', text:'🔔 מציג שדות חסרים ודיווחי שגיאה מהשטח. ניתן לסמן כטופל.'},
    {icon:'📋', title:'לוג שינויים', text:'📋 מציג היסטוריית פעולות — ייבוא, מחיקות, העברות.'},
    {icon:'📊', title:'ייצוא Excel', text:'📊 מייצא את כל הקטלוג לקובץ Excel עם גיליון לכל דגם + גיליון "כל הנתונים".'},
    {icon:'💬', title:'בקשות טכנאים', text:'בדף הבית תוכל לראות בקשות טכנאים לדגמים חסרים. סמן כטופל לאחר הוספה.'},
    {icon:'🗑', title:'מחיקה מרובה', text:'🗑 בסרגל מאפשר מחיקת מספר דגמים בבת אחת. זהירות — בלתי הפיך!'},
  ];

  return (
    <Modal onClose={onClose} wide title={`❓ מדריך שימוש${isViewer?' — צופה':isEditor?' — עורך':' — מנהל'}`}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {sections.map((s,i) => (
          <div key={i} style={{background:'var(--row2)',borderRadius:10,padding:'12px 14px',borderRight:`3px solid #1565c0`}}>
            <div style={{fontWeight:'bold',fontSize:13,marginBottom:4,color:'var(--text)'}}>{s.icon} {s.title}</div>
            <div style={{fontSize:12,color:'var(--sub)',lineHeight:1.6}}>{s.text}</div>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{width:'100%',...BPr('#1565c0')}}>הבנתי ✓</button>
    </Modal>
  );
}
