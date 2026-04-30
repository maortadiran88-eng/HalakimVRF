// ══════════ WA EDITOR MODAL ══════════
function WaEditorModal({brand, cat, model, selRows, defaultCols, onClose}) {
  const [colSel,  setColSel]  = useState(new Set(defaultCols||['nameHe','tadPn']));
  const [preview, setPreview] = useState(false);
  const sp = model.parts.filter(p => selRows.has(p.id));
  const activeCols = model.columns.filter(c => colSel.has(c.id));

  const buildMsg = () => {
    const hdr = `🔧 *${brand.name} — ${model.name}*\n📂 ${cat.name}\n${'─'.repeat(28)}`;
    const lines = sp.map((p,i) => {
      const vals = activeCols.map(c => {const v=(p.values[c.id]||'').trim();return v?`${c.name}: ${v}`:'';}).filter(Boolean);
      return `*${i+1}.* ${vals.join(' | ')}`;
    }).join('\n');
    return `${hdr}\n\n${lines}\n\n_סה"כ ${sp.length} חלקים_`;
  };

  return (
    <Modal onClose={onClose} wide title="📱 עריכת הודעת ווצאפ">
      <div style={{marginBottom:14}}>
        <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>בחר עמודות לשליחה:</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          <button onClick={() => setColSel(new Set(model.columns.map(c=>c.id)))} style={sB('#607d8b')}>הכל</button>
          <button onClick={() => setColSel(new Set())}                            style={sB('#9e9e9e')}>נקה</button>
          <button onClick={() => setColSel(new Set(defaultCols||['nameHe','tadPn']))} style={sB('#1565c0')}>ברירת מחדל</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {model.columns.map(col => {
            const on = colSel.has(col.id);
            return (
              <div key={col.id} onClick={() => setColSel(p=>{const n=new Set(p);on?n.delete(col.id):n.add(col.id);return n;})}
                style={{padding:'7px 12px',borderRadius:8,border:`2px solid ${on?brand.color:'var(--border)'}`,background:on?brand.color+'22':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none',transition:'all .15s'}}>
                {on?'✓ ':''}{col.name}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <div style={{fontWeight:'bold',fontSize:12,color:'var(--sub)'}}>תצוגה מקדימה:</div>
          <button onClick={() => setPreview(v=>!v)} style={sB('#455a64')}>{preview?'הסתר':'הצג'}</button>
        </div>
        {preview && (
          <div style={{background:'#e8f5e9',borderRadius:10,padding:12,fontFamily:'monospace',fontSize:11,color:'#1a1a2a',whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto',direction:'ltr',textAlign:'left',border:'1px solid #c8e6c9'}}>
            {buildMsg()}
          </div>
        )}
      </div>

      <div style={{background:'var(--row2)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:12,color:'var(--sub)'}}>
        {sp.length} שורות · {activeCols.length} עמודות נבחרו
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => window.open('https://wa.me/?text='+encodeURIComponent(buildMsg()),'_blank')}
          disabled={!colSel.size} style={{flex:1,...BPr(colSel.size?'#25D366':'#aaa')}}>📱 שלח לווצאפ</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ MOVE MODAL ══════════
function MoveModal({data, currentBid, currentCid, onMove, onClose}) {
  const [toBid, setToBid] = useState(currentBid);
  const [toCid, setToCid] = useState('');
  const brand = data.brands.find(b => b.id===toBid);

  return (
    <Modal onClose={onClose} title="🔀 העבר דגם">
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
        {data.brands.map(b => (
          <button key={b.id} onClick={() => {setToBid(b.id);setToCid('');}}
            style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>
            {b.name}
          </button>
        ))}
      </div>
      {brand && brand.categories.map(c => (
        <div key={c.id} onClick={() => setToCid(c.id)}
          style={{padding:'10px 14px',borderRadius:8,border:`2px solid ${toCid===c.id?brand.color:'var(--border)'}`,marginBottom:6,cursor:'pointer',background:toCid===c.id?brand.light:'var(--ibg)',color:'var(--text)',fontSize:13,fontWeight:toCid===c.id?'bold':'normal'}}>
          {c.name}
          {toBid===currentBid && c.id===currentCid && <span style={{fontSize:11,color:'var(--sub)',marginRight:8}}>(נוכחי)</span>}
        </div>
      ))}
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={() => {
          if (!toCid) {alert('בחר קטגוריה');return;}
          if (toBid===currentBid && toCid===currentCid) {alert('אותה קטגוריה');return;}
          onMove(toBid,toCid); onClose();
        }} style={{flex:1,...BPr('#1565c0')}}>✓ העבר</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ COPY PARTS MODAL ══════════
function CopyPartsModal({data, currentMid, onCopy, onClose}) {
  const [picked, setPicked] = useState(null);
  const opts = [];
  data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => {
    if (m.id!==currentMid && m.parts.length>0) opts.push({b,c,m});
  })));

  return (
    <Modal onClose={onClose} title="📋 העתק חלקים" wide>
      <div style={{maxHeight:'50vh',overflowY:'auto',marginBottom:12}}>
        {!opts.length && <div style={{textAlign:'center',color:'var(--sub)',padding:24}}>אין דגמים עם חלקים</div>}
        {opts.map(({b,c,m}) => (
          <div key={m.id} onClick={() => setPicked({b,c,m})}
            style={{padding:'10px 14px',borderRadius:8,border:`2px solid ${picked?.m.id===m.id?b.color:'var(--border)'}`,marginBottom:6,cursor:'pointer',background:picked?.m.id===m.id?b.light:'var(--ibg)',display:'flex',alignItems:'center',gap:10}}>
            <span style={{background:b.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:'bold'}}>{b.name}</span>
            <span style={{fontWeight:'bold',color:'var(--text)',flex:1}}>{m.name}</span>
            <span style={{color:'var(--sub)',fontSize:11}}>{c.name}</span>
            <span style={{color:b.color,fontSize:11,fontWeight:'bold'}}>{m.parts.length} חלקים</span>
          </div>
        ))}
      </div>
      {picked && (
        <div style={{background:'#e8f5e9',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#2e7d32'}}>
          ✓ <strong>{picked.m.name}</strong> — {picked.m.parts.length} חלקים יועתקו
        </div>
      )}
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => {
          if (!picked) {alert('בחר דגם');return;}
          onCopy(picked.b.id,picked.c.id,picked.m.id); onClose(); alert(`✅ ${picked.m.parts.length} חלקים הועתקו`);
        }} style={{flex:1,...BPr('#4caf50')}}>✓ העתק</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ BULK MOVE MODAL ══════════
function BulkMoveModal({data, onMove, onClose}) {
  const [sel,   setSel]   = useState(new Set());
  const [toBid, setToBid] = useState('');
  const [toCid, setToCid] = useState('');
  const [q,     setQ]     = useState('');

  const all = [];
  data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m =>
    all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color})
  )));
  const filtered = q.trim() ? all.filter(x => x.mname.toLowerCase().includes(q.toLowerCase())||x.bname.toLowerCase().includes(q.toLowerCase())) : all;
  const key = (bid,cid,mid) => `${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle = k => setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const tb = data.brands.find(b => b.id===toBid);

  return (
    <Modal onClose={onClose} wide title="🔀 העברה מרובה">
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{flex:1,minWidth:100,...INS,padding:'7px 12px'}}/>
        <button onClick={() => setSel(new Set(filtered.map(x=>key(x.bid,x.cid,x.mid))))} style={sB('#607d8b')}>בחר הכל</button>
        <button onClick={() => setSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
      </div>

      <div style={{maxHeight:'28vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
        {all.length===0 && <div style={{padding:20,textAlign:'center',color:'var(--sub)'}}>אין דגמים</div>}
        {filtered.map(x => {
          const k = key(x.bid,x.cid,x.mid); const isSel = sel.has(k);
          return (
            <div key={k} onClick={() => toggle(k)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'var(--sel)':'var(--card)',userSelect:'none'}}>
              <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?'#1565c0':'var(--border)'}`,background:isSel?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {isSel && <span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
              </div>
              <span style={{background:x.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.bname}</span>
              <span style={{fontWeight:'bold',color:'var(--text)',flex:1,fontSize:13}}>{x.mname}</span>
              <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
            </div>
          );
        })}
      </div>

      {sel.size>0 && <div style={{background:'var(--sel)',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#2e7d32',fontWeight:'bold'}}>✓ {sel.size} דגמים נבחרו</div>}

      <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>העבר אל:</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
        {data.brands.map(b => (
          <button key={b.id} onClick={() => {setToBid(b.id);setToCid('');}}
            style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>
            {b.name}
          </button>
        ))}
      </div>
      {tb && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
          {tb.categories.map(c => (
            <div key={c.id} onClick={() => setToCid(c.id)}
              style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>
              {c.name}
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => {
          if (!sel.size) {alert('בחר דגמים');return;}
          if (!toCid) {alert('בחר יעד');return;}
          const sels = [...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});
          onMove(sels,toBid,toCid); alert(`✅ ${sels.length} דגמים הועברו`); onClose();
        }} style={{flex:1,...BPr('#1565c0')}}>✓ העבר{sel.size>0?` (${sel.size})`:''}</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ BULK DELETE MODAL ══════════
function BulkDeleteModal({data, onDelete, onClose}) {
  const [sel, setSel] = useState(new Set());
  const [q,   setQ]   = useState('');

  const all = [];
  data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m =>
    all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color,parts:(m.parts||[]).length})
  )));
  const filtered = q.trim() ? all.filter(x=>[x.mname,x.bname,x.cname].some(s=>s.toLowerCase().includes(q.toLowerCase()))) : all;
  const key = (bid,cid,mid) => `${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle = k => setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});

  return (
    <Modal onClose={onClose} wide title="🗑 מחיקה מרובה">
      <div style={{background:'#ffebee',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#c62828',fontWeight:'bold'}}>
        ⚠ המחיקה לצמיתות — לא ניתנת לביטול!
      </div>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{flex:1,minWidth:100,...INS,padding:'7px 12px'}}/>
        <button onClick={() => setSel(new Set(filtered.map(x=>key(x.bid,x.cid,x.mid))))} style={sB('#607d8b')}>בחר הכל</button>
        <button onClick={() => setSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
      </div>

      <div style={{maxHeight:'38vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
        {!all.length && <div style={{padding:30,textAlign:'center',color:'var(--sub)',fontSize:14}}>אין דגמים</div>}
        {!filtered.length && all.length>0 && <div style={{padding:20,textAlign:'center',color:'var(--sub)'}}>אין תוצאות</div>}
        {filtered.map(x => {
          const k = key(x.bid,x.cid,x.mid); const isSel = sel.has(k);
          return (
            <div key={k} onClick={() => toggle(k)}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'#ffebee':'var(--card)',userSelect:'none'}}
              onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='var(--row2)';}}
              onMouseLeave={e=>{e.currentTarget.style.background=isSel?'#ffebee':'var(--card)';}}>
              <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${isSel?'#c62828':'var(--border)'}`,background:isSel?'#c62828':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {isSel && <span style={{color:'#fff',fontSize:13,fontWeight:'bold'}}>✓</span>}
              </div>
              <span style={{background:x.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.bname}</span>
              <span style={{fontWeight:'bold',color:'var(--text)',flex:1,fontSize:13}}>{x.mname}</span>
              <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
              <span style={{color:'#e53935',fontSize:11,fontWeight:'bold',flexShrink:0}}>{x.parts} חלקים</span>
            </div>
          );
        })}
      </div>

      {sel.size>0 && <div style={{background:'#ffebee',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#c62828',fontWeight:'bold'}}>🗑 {sel.size} דגמים יימחקו לצמיתות</div>}
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => {
          if (!sel.size) {alert('לא נבחרו דגמים');return;}
          const sels = [...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});
          onDelete(sels); onClose();
        }} style={{flex:1,...BPr(sel.size?'#c62828':'#aaa')}}>🗑 מחק{sel.size>0?` (${sel.size})`:''}</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ EXCEL IMPORT MODAL ══════════
function XlsImportModal({data, onImport, onClose}) {
  const [rows,  setRows]  = useState([]);
  const [fn,    setFn]    = useState('');
  const [toBid, setToBid] = useState(data.brands[0]?.id||'');
  const [toCid, setToCid] = useState(data.brands[0]?.categories[0]?.id||'');
  const [cm,    setCm]    = useState({model:0,nameHe:1,tadPn:2,nameEn:3,mfgPn:4});
  const [step,  setStep]  = useState(1);
  const [groups,setGroups]= useState([]);
  const [excl,  setExcl]  = useState(new Set());
  const tb = data.brands.find(b => b.id===toBid);

  const parseFile = e => {
    const f = e.target.files[0]; if (!f) return;
    setFn(f.name);
    const r = new FileReader();
    r.onload = ev => {
      const wb = XLSX.read(ev.target.result,{type:'binary'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const all = XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      const fc = String(all[0]?.[0]||'').toLowerCase();
      const dr = (fc.includes('דגם')||fc.includes('model')) ? all.slice(1) : all;
      setRows(dr.filter(r=>r.some(c=>String(c).trim())));
      setStep(2);
    };
    r.readAsBinaryString(f); e.target.value='';
  };

  const buildPreview = () => {
    const g = {};
    rows.forEach(r => {const mn=String(r[cm.model]||'').trim();if(!mn)return;g[mn]=(g[mn]||0)+1;});
    setGroups(Object.entries(g)); setExcl(new Set()); setStep(3);
  };

  const colLbl = i => {
    const s = rows.slice(0,3).map(r=>String(r[i]||'').trim()).filter(Boolean).join(', ');
    return `עמודה ${i+1}${s?' ('+s.slice(0,22)+')':''}`;
  };

  const maxC    = rows[0] ? rows[0].length : 6;
  const included = groups.filter(([n]) => !excl.has(n));

  return (
    <Modal onClose={onClose} wide title="📥 ייבוא מ-Excel">
      <div style={{display:'flex',gap:4,marginBottom:20}}>
        {['1. העלאה','2. מיפוי','3. אישור'].map((s,i) => (
          <div key={i} style={{flex:1,textAlign:'center',padding:'6px 0',borderRadius:6,fontSize:12,fontWeight:'bold',background:step===i+1?'#1565c0':step>i+1?'#4caf50':'var(--row2)',color:step>=i+1?'#fff':'var(--sub)'}}>{s}</div>
        ))}
      </div>

      {step===1 && (
        <label style={{display:'block',border:'2px dashed #1565c0',borderRadius:12,padding:'32px 20px',textAlign:'center',cursor:'pointer',background:'var(--row2)'}}>
          <div style={{fontSize:40,marginBottom:8}}>📊</div>
          <div style={{fontWeight:'bold',color:'#1565c0',fontSize:15,marginBottom:4}}>לחץ לבחירת קובץ Excel</div>
          <div style={{color:'var(--sub)',fontSize:12}}>XLSX, XLS, CSV</div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={parseFile} style={{display:'none'}}/>
        </label>
      )}

      {step===2 && (
        <div>
          <div style={{background:'#e8f5e9',borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:'#2e7d32'}}>✓ {fn} — {rows.length} שורות</div>
          {[['model','שם הדגם (מפתח)'],['nameHe','שם בעברית'],['tadPn','מק"ט תדיראן'],['nameEn','שם באנגלית'],['mfgPn','מק"ט יצרן']].map(([k,lbl]) => (
            <div key={k} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{width:130,fontSize:12,color:'var(--sub)',flexShrink:0}}>{lbl}:</span>
              <select value={cm[k]} onChange={e=>setCm(p=>({...p,[k]:Number(e.target.value)}))}
                style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}>
                {Array.from({length:maxC},(_,i)=>i).map(i => <option key={i} value={i}>{colLbl(i)}</option>)}
              </select>
            </div>
          ))}
          <div style={{fontWeight:'bold',fontSize:13,marginTop:12,marginBottom:8,color:'var(--text)'}}>ייבא אל:</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
            {data.brands.map(b => (
              <button key={b.id} onClick={() => {setToBid(b.id);setToCid(b.categories[0]?.id||'');}}
                style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>
                {b.name}
              </button>
            ))}
          </div>
          {tb && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:14}}>
              {tb.categories.map(c => (
                <div key={c.id} onClick={() => setToCid(c.id)}
                  style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>
                  {c.name}
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:8}}>
            <button onClick={buildPreview} disabled={!toCid} style={{flex:1,...BPr(toCid?'#1565c0':'#aaa')}}>הבא ▶</button>
            <button onClick={() => setStep(1)} style={{...BST,padding:'10px 16px',borderRadius:8}}>חזור</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <div style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>בחר דגמים ({groups.length}):</div>
            <button onClick={() => setExcl(new Set())} style={{...sB('#4caf50'),marginRight:'auto'}}>בחר הכל</button>
            <button onClick={() => setExcl(new Set(groups.map(([n])=>n)))} style={sB('#9e9e9e')}>בטל הכל</button>
          </div>
          <div style={{maxHeight:'34vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:10}}>
            {groups.map(([name,count]) => {
              const isEx   = excl.has(name);
              const exists = tb?.categories.find(c=>c.id===toCid)?.models.some(m=>m.name===name);
              return (
                <div key={name} onClick={() => setExcl(p=>{const n=new Set(p);isEx?n.delete(name):n.add(name);return n;})}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isEx?'var(--row2)':'var(--card)',opacity:isEx?.45:1}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${!isEx?'#1565c0':'var(--border)'}`,background:!isEx?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {!isEx && <span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
                  </div>
                  <span style={{flex:1,fontWeight:'bold',color:'var(--text)',fontSize:13}}>{name}</span>
                  <span style={{color:'var(--sub)',fontSize:11}}>{count} חלקים</span>
                  {exists
                    ? <span style={{background:'#fff3e0',color:'#e65100',padding:'1px 6px',borderRadius:4,fontSize:10}}>יתווסף</span>
                    : <span style={{background:'#e8f5e9',color:'#2e7d32',padding:'1px 6px',borderRadius:4,fontSize:10}}>חדש</span>}
                </div>
              );
            })}
          </div>
          <div style={{background:'#f3e5f5',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#6a1b9a'}}>
            יוייבאו: <strong>{included.length} דגמים</strong> עם <strong>{included.reduce((s,[,c])=>s+c,0).toLocaleString()} חלקים</strong> → <strong>{tb?.name}</strong> / <strong>{tb?.categories.find(c=>c.id===toCid)?.name}</strong>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => {const res=onImport(rows,cm,toBid,toCid,excl);alert(`✅ ${res.models} דגמים, ${res.parts.toLocaleString()} חלקים`);onClose();}}
              disabled={!included.length} style={{flex:1,...BPr(included.length?'#4caf50':'#aaa')}}>✅ ייבא</button>
            <button onClick={() => setStep(2)} style={{...BST,padding:'10px 16px',borderRadius:8}}>חזור</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ══════════ BRAND MANAGER ══════════
function BrandMgr({data, onClose, onSave}) {
  const [brands, setBrands] = useState(JSON.parse(JSON.stringify(data.brands)));
  const add = () => setBrands(b => [...b,{id:gid(),name:'מותג חדש',color:'#607d8b',light:'#eceff1',categories:DCATS()}]);
  const upd = (id,k,v) => setBrands(b => b.map(x => x.id!==id ? x : {...x,[k]:v}));
  const del = id => { if(confirm('למחוק?')) setBrands(b => b.filter(x=>x.id!==id)); };

  return (
    <Modal onClose={onClose} wide title="⚙ ניהול מותגים">
      <div style={{maxHeight:'50vh',overflowY:'auto',marginBottom:12}}>
        {brands.map(b => (
          <div key={b.id} style={{border:'1px solid var(--border)',borderRadius:10,padding:12,marginBottom:10,borderRight:`5px solid ${b.color}`}}>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input value={b.name} onChange={e=>upd(b.id,'name',e.target.value)}
                style={{border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:14,fontWeight:'bold',flex:'1 1 100px',color:'var(--inp)',background:'var(--ibg)'}}/>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <label style={{fontSize:12,color:'var(--sub)'}}>צבע:</label>
                <input type="color" value={b.color} onChange={e=>{const c=e.target.value;upd(b.id,'color',c);upd(b.id,'light',c+'22');}}
                  style={{border:'none',borderRadius:4,height:34,width:44,cursor:'pointer'}}/>
              </div>
              <button onClick={() => del(b.id)} style={{background:'none',border:'1px solid #e53935',color:'#e53935',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12}}>מחק</button>
            </div>
            <div style={{fontSize:11,color:'var(--sub)',marginTop:6}}>{b.categories.reduce((s,c)=>s+c.models.length,0)} דגמים</div>
          </div>
        ))}
      </div>
      <button onClick={add} style={{width:'100%',padding:10,background:'#607d8b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',marginBottom:12}}>+ הוסף מותג</button>
      <div style={{display:'flex',gap:8}}>
        <button onClick={() => onSave(brands)} style={{flex:1,...BPr('#1565c0')}}>✓ שמור</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ CHANGE PASSWORD / SETTINGS ══════════
function ChangePwd({data, onSave, onClose}) {
  const [cur,  setCur]  = useState('');
  const [an,   setAn]   = useState('');
  const [en,   setEn]   = useState('');
  const [vn,   setVn]   = useState('');
  const [err,  setErr]  = useState('');
  const [wt,   setWt]   = useState(data.welcomeTitle||'');
  const [ws,   setWs]   = useState(data.welcomeSub||'');
  const [wd,   setWd]   = useState(data.waDefaults||['nameHe','tadPn']);
  const [disc, setDisc] = useState(data.disclaimer||'');
  const [tips, setTips] = useState(data.tips||DEFAULT_TIPS);

  const submit = () => {
    if (cur !== data.pass) {setErr('סיסמת מנהל נוכחית שגויה');return;}
    if (an && an.length<4)  {setErr('לפחות 4 תווים');return;}
    onSave({...data, pass:an||data.pass, editorPass:en||data.editorPass||'editor1234', viewerPass:vn||data.viewerPass||'tadir123', waDefaults:wd, welcomeTitle:wt, welcomeSub:ws, disclaimer:disc, tips});
    alert('✅ נשמר');
  };

  const allCols = data.brands[0]?.categories[0]?.models[0]?.columns || DCOLS();

  return (
    <Modal onClose={onClose} wide title="🔑 הגדרות מנהל">
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>🔐 סיסמאות</div>
      {[
        ['סיסמת מנהל נוכחית (לאימות)',cur,setCur,''],
        ['סיסמת מנהל חדשה',an,setAn,'ריק = ללא שינוי'],
        [`סיסמת עורך חדשה`,en,setEn,`נוכחית: ${data.editorPass||'editor1234'}`],
        [`סיסמת צופה חדשה`,vn,setVn,`נוכחית: ${data.viewerPass||'tadir123'}`],
      ].map(([l,v,s,hint]) => (
        <div key={l} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>{l}{hint&&<span style={{color:'#aaa',marginRight:8,fontSize:11}}>({hint})</span>}</div>
          <input type="password" value={v} onChange={e=>s(e.target.value)} style={INS}/>
        </div>
      ))}
      {err && <div style={{color:'red',fontSize:12,marginBottom:8}}>{err}</div>}

      <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingTop:12,paddingBottom:8,borderBottom:'1px solid var(--border)',borderTop:'1px solid var(--border)',marginTop:4}}>📱 ברירת מחדל לווצאפ</div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
        {allCols.map(c => {
          const on = wd.includes(c.id);
          return (
            <div key={c.id} onClick={() => setWd(p => on?p.filter(x=>x!==c.id):[...p,c.id])}
              style={{padding:'6px 12px',borderRadius:8,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>
              {on?'✓ ':''}{c.name}
            </div>
          );
        })}
      </div>

      <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>🏠 מסך כניסה</div>
      {[
        ['כותרת ראשית',wt,setWt,'textarea'],
        ['כותרת משנה',ws,setWs,'input'],
        ['הודעת אחריות/הצהרה',disc,setDisc,'textarea'],
      ].map(([l,v,s,t]) => (
        <div key={l} style={{marginBottom:10}}>
          <div style={{fontSize:12,color:'var(--sub)',marginBottom:4}}>{l}</div>
          {t==='textarea'
            ? <textarea value={v} onChange={e=>s(e.target.value)} rows={2} style={{...INS,height:'auto',resize:'vertical'}}/>
            : <input value={v} onChange={e=>s(e.target.value)} style={INS}/>}
        </div>
      ))}

      <TipsEditor tips={tips} setTips={setTips}/>

      <div style={{display:'flex',gap:8,marginTop:14}}>
        <button onClick={submit} style={{flex:1,...BPr('#1565c0')}}>שמור הכל</button>
        <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>
  );
}

// ══════════ TIPS EDITOR (used inside ChangePwd) ══════════
function TipsEditor({tips, setTips}) {
  const [newTip, setNewTip] = useState('');
  return (
    <div>
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingTop:12,paddingBottom:8,borderBottom:'1px solid var(--border)',borderTop:'1px solid var(--border)'}}>
        💡 טיפים (מתחלפים כל 20 שניות)
      </div>
      <div style={{maxHeight:200,overflowY:'auto',marginBottom:10}}>
        {tips.map((t,i) => (
          <div key={i} style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
            <input value={t} onChange={e=>setTips(p=>p.map((x,j)=>j===i?e.target.value:x))}
              style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
            <button onClick={()=>setTips(p=>p.filter((_,j)=>j!==i))}
              style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,flexShrink:0}}>🗑</button>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:6}}>
        <input value={newTip} onChange={e=>setNewTip(e.target.value)} placeholder="הוסף טיפ חדש..."
          onKeyDown={e=>{if(e.key==='Enter'&&newTip.trim()){setTips(p=>[...p,newTip.trim()]);setNewTip('');}}}
          style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
        <button onClick={()=>{if(newTip.trim()){setTips(p=>[...p,newTip.trim()]);setNewTip('');}}}
          style={{...sB('#1565c0'),padding:'7px 14px'}}>+ הוסף</button>
      </div>
    </div>
  );
}
