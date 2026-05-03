function ModelView({brand,cat,model,editor,admin,viewer,hq,data,favorites,onToggleFav,loginRole,
  onUpdate,onRenameModel,onAddPart,onDelPart,onCell,onColName,onMoveCol,onAddCol,onDelCol,onPaste,
  onImgUpload,onDelImg,onImgUrl,onOpenImg,onMove,onDuplicate,onCopyPartsFrom,
  onAddToCart,onReport,waDefaults,partsDisclaimer,onUpdateDisclaimer}) {

  const [synIn,       setSynIn]       = useState(model.synonyms?.join(', ')||'');
  const [editSyn,     setEditSyn]     = useState(false);
  const [imgUrl,      setImgUrl]      = useState('');
  const [editUrl,     setEditUrl]     = useState(false);
  const [filter,      setFilter]      = useState('');
  const [sortCol,     setSortCol]     = useState(null);
  const [quickMode,   setQuickMode]   = useState(false);
  const [showPaste,   setShowPaste]   = useState(false);
  const [pasteText,   setPasteText]   = useState('');
  const [showMove,    setShowMove]    = useState(false);
  const [showCopy,    setShowCopy]    = useState(false);
  const [selRows,     setSelRows]     = useState(new Set());
  const [showWaEditor,setShowWaEditor]= useState(false);
  const [showReport,  setShowReport]  = useState(false);
  const [reportText,  setReportText]  = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput,   setNameInput]   = useState(model.name);
  const firstHiRef = useRef(null);
  const q      = hq.trim().toLowerCase();
  const images = model.images || [];

  useEffect(() => { setSynIn(model.synonyms?.join(', ')||''); setNameInput(model.name); setEditingName(false); }, [model.id]);
  useEffect(() => {
    if (q && firstHiRef.current)
      setTimeout(() => firstHiRef.current?.scrollIntoView({behavior:'smooth',block:'center'}), 200);
  }, [q]);

  const saveSyn = () => { onUpdate({synonyms:synIn.split(',').map(s=>s.trim()).filter(Boolean)}); setEditSyn(false); };

  const visibleCols = useMemo(() =>
    editor
      ? model.columns
      : model.columns.filter(col => model.parts.some(p => (p.values[col.id]||'').trim()!=='')),
  [model.columns, model.parts, editor]);

  let filtered = [...model.parts.filter(p=>p.pinned), ...model.parts.filter(p=>!p.pinned)];
  if (filter.trim()) filtered = filtered.filter(p => partMatches(filter,p,model.columns));
  if (sortCol) {
    filtered = [...filtered].sort((a,b) => {
      const va=(a.values[sortCol.id]||'').toLowerCase();
      const vb=(b.values[sortCol.id]||'').toLowerCase();
      const n = va.localeCompare(vb,'he');
      return sortCol.dir==='asc' ? n : -n;
    });
  }

  const rowHi  = p => q && Object.values(p.values).some(v => String(v).toLowerCase().includes(q));
  const cellHi = v => q && String(v).toLowerCase().includes(q);

  const submitPaste = () => {
    const rows = pasteText.trim().split('\n').map(r=>r.split('\t').map(c=>c.trim())).filter(r=>r.some(c=>c));
    if (rows.length) { onPaste(rows); setPasteText(''); setShowPaste(false); }
  };
  const toggleRow  = id => setSelRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const clearRows  = ()  => setSelRows(new Set());
  const handleSort = cid => {
    if (!sortCol||sortCol.id!==cid) setSortCol({id:cid,dir:'asc'});
    else if (sortCol.dir==='asc')   setSortCol({id:cid,dir:'desc'});
    else setSortCol(null);
  };
  const sortIcon = cid => !sortCol||sortCol.id!==cid ? '⇅' : sortCol.dir==='asc' ? '↑' : '↓';

  const exportPDF = () => {
    const w = window.open('','_blank');
    // Hide empty columns and empty rows
    const pdfCols = visibleCols.filter(col => model.parts.some(p => (p.values[col.id]||'').trim() !== ''));
    const pdfRows = model.parts.filter(p => pdfCols.some(col => (p.values[col.id]||'').trim() !== ''));
    const rows = pdfRows.map(p =>
      `<tr style="${p.discontinued?'opacity:.75':''}">
        ${pdfCols.map(c=>`<td style="${p.discontinued?'color:#c62828;text-decoration:line-through;':''}">${p.values[c.id]||''}</td>`).join('')}
        <td>${p.discontinued?'<span style="color:#c62828;font-weight:bold;background:#ffebee;padding:2px 6px;border-radius:4px">⛔ הופסק</span>':''}</td>
      </tr>`).join('');
    const imgs = images.map(img=>`<img src="${img}" style="max-width:280px;max-height:200px;border:1px solid #ddd;border-radius:6px;margin:4px;object-fit:contain">`).join('');
    const nh = model.notes ? `<div style="background:#fff3f3;border-right:4px solid #e53935;padding:10px 14px;border-radius:6px;color:#e53935;font-weight:bold;margin:10px 0">${model.notes}</div>` : '';
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${model.name}</title>
      <style>body{font-family:Arial;padding:30px;color:#1a1a2a;direction:rtl}h1{color:${brand.color};font-size:22px}table{border-collapse:collapse;width:100%;margin-top:14px;font-size:13px}th{background:${brand.color};color:#fff;padding:9px 12px;text-align:right}td{border:1px solid #e5e7eb;padding:7px 12px}tr:nth-child(even){background:#f9fafb}@page{margin:20mm}</style></head>
      <body><h1>🔧 ${brand.name} — ${model.name}</h1>
      <p style="color:#6b7280">${cat.name}${model.synonyms?.length?' · '+model.synonyms.join(', '):''}</p>
      ${nh}${imgs?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${imgs}</div>`:''}
      <table><thead><tr>${pdfCols.map(c=>`<th>${c.name}</th>`).join('')}<th>סטטוס</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:11px;color:#94a3b8;margin-top:8px">${model.parts.length} חלקים · ${new Date().toLocaleDateString('he-IL')}</p>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };

  const exportModelXLS = () => {
    const wb = XLSX.utils.book_new();
    // Main sheet
    const hdr = model.columns.map(c=>c.name);
    const rows = model.parts.map(p => [...model.columns.map(c=>p.values[c.id]||''), p.discontinued?'הופסק':'']);
    const ws = XLSX.utils.aoa_to_sheet([[ ...hdr,'סטטוס'], ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, model.name.slice(0,31));
    XLSX.writeFile(wb,`${brand.name}-${model.name}.xlsx`);
  };

  const shareLink = () => {
    const url = window.location.href.split('?')[0]+`?b=${brand.id}&c=${cat.id}&m=${model.id}`;
    navigator.clipboard?.writeText(url).then(()=>alert('✅ קישור הועתק')).catch(()=>alert('קישור:\n'+url));
  };

  // ── Quick (mobile) mode ──
  if (quickMode) {
    const qc = visibleCols.filter(c => ['nameHe','tadPn','mfgPn'].includes(c.id));
    const dc = qc.length ? qc : visibleCols.slice(0,3);
    return (
      <div style={{maxWidth:600,margin:'0 auto'}}>
        <div style={{background:brand.color,color:'#fff',borderRadius:12,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',fontSize:16}}>◈ {model.name}</div>
            <div style={{fontSize:12,opacity:.8}}>{cat.name} · {model.parts.length} חלקים</div>
          </div>
          <button onClick={()=>setQuickMode(false)} style={{background:'rgba(255,255,255,.25)',border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:'bold'}}>📋 מלא</button>
        </div>
        {model.notes && <div style={{background:'#ffebee',borderRadius:10,padding:'10px 14px',marginBottom:12,color:'#e53935',fontWeight:'bold',fontSize:13}}>{model.notes}</div>}
        <div style={{background:'var(--card)',borderRadius:12,padding:10,marginBottom:10}}>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="🔍 חיפוש מהיר..."
            style={{width:'100%',border:'1px solid var(--border)',borderRadius:20,padding:'9px 14px',fontSize:14,outline:'none',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map(p => (
            <div key={p.id} onClick={()=>toggleRow(p.id)}
              style={{background:selRows.has(p.id)?'var(--sel)':p.discontinued?'#fff5f5':'var(--card)',borderRadius:10,padding:'12px 14px',boxShadow:'0 1px 4px var(--shadow)',borderRight:`4px solid ${p.discontinued?'#e53935':selRows.has(p.id)?'#25D366':brand.color}`,cursor:'pointer'}}>
              {p.pinned       && <div style={{fontSize:10,color:'#e65100',fontWeight:'bold',marginBottom:4}}>📌 חלק נפוץ</div>}
              {/* ⛔ הופסק — מוצג בולט אבל החלק נראה */}
              {p.discontinued && (
                <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'#e53935',color:'#fff',borderRadius:5,padding:'2px 8px',fontSize:11,fontWeight:'bold',marginBottom:6}}>
                  ⛔ הופסק לייצור
                </div>
              )}
              {dc.map(col => {const v=(p.values[col.id]||'').trim();if(!v)return null;return(
                <div key={col.id} style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:13}}>
                  <span style={{color:'var(--sub)',marginLeft:10}}>{col.name}:</span>
                  <span style={{fontWeight:'bold',color:p.discontinued?'#e53935':'var(--text)',textDecoration:p.discontinued?'line-through':''}}>{v}</span>
                </div>
              );})}
              {selRows.has(p.id) && <div style={{textAlign:'center',color:'#25D366',fontSize:11,fontWeight:'bold',marginTop:4}}>✓ בסל</div>}
            </div>
          ))}
        </div>
        {selRows.size>0 && (
          <div style={{position:'fixed',bottom:16,right:16,left:16,zIndex:100,background:'#25D366',borderRadius:14,padding:'13px 18px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 6px 20px rgba(0,0,0,.3)'}}>
            <span style={{color:'#fff',fontWeight:'bold',flex:1}}>✓ {selRows.size} נבחרו</span>
            <button onClick={()=>setShowWaEditor(true)} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:'bold',color:'#25D366',fontSize:13}}>📱 שלח</button>
            <button onClick={clearRows} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'8px 12px',cursor:'pointer',color:'#fff',fontSize:12}}>✕</button>
          </div>
        )}
        {showWaEditor && <WaEditorModal brand={brand} cat={cat} model={model} selRows={selRows} defaultCols={waDefaults} onClose={()=>setShowWaEditor(false)}/>}
      </div>
    );
  }

  // ── Full table mode ──
  let firstHiSet = false;

  return (
    <div style={{maxWidth:1100,margin:'0 auto'}}>

      {/* Header card */}
      <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:8}}>
          <span style={{background:brand.color,color:'#fff',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:'bold'}}>{brand.name}</span>
          <span style={{color:'var(--sub)',fontSize:12}}>{cat.name}</span>
          {editor && editingName
            ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)} autoFocus
                  onKeyDown={e=>{if(e.key==='Enter'){onRenameModel(nameInput.trim()||model.name);setEditingName(false);}if(e.key==='Escape')setEditingName(false);}}
                  style={{fontSize:16,fontWeight:'bold',border:'1px solid var(--border)',borderRadius:6,padding:'3px 8px',color:'var(--inp)',background:'var(--ibg)',width:200}}/>
                <button onClick={()=>{onRenameModel(nameInput.trim()||model.name);setEditingName(false);}} style={sB('#4caf50')}>✓</button>
                <button onClick={()=>setEditingName(false)} style={sB('#9e9e9e')}>✕</button>
              </div>
            : <span onClick={()=>{if(editor){setNameInput(model.name);setEditingName(true);}}}
                style={{fontSize:17,fontWeight:'bold',color:'var(--text)',cursor:editor?'pointer':'default',borderBottom:editor?'2px dashed var(--border)':'none'}}
                title={editor?'לחץ לעריכת שם הדגם':''}>
                ◈ {model.name}
              </span>
          }
          <button onClick={()=>onToggleFav(model.id)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',marginRight:'auto'}}>{favorites.has(model.id)?'⭐':'☆'}</button>
          <span style={{color:'var(--sub)',fontSize:11}}>{model.parts.length.toLocaleString()} חלקים</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',fontSize:12,marginBottom:10}}>
          <span style={{color:'var(--sub)'}}>שמות נרדפים:</span>
          {!editSyn
            ? <><span style={{color:'var(--text)'}}>{model.synonyms?.length?model.synonyms.join(' | '):'—'}</span>
                {editor && <button onClick={()=>setEditSyn(true)} style={sB(brand.color)}>✏ עריכה</button>}</>
            : <><input value={synIn} onChange={e=>setSynIn(e.target.value)} placeholder="שם1, שם2"
                  style={{border:'1px solid var(--border)',borderRadius:4,padding:'3px 8px',fontSize:12,width:200,color:'var(--inp)',background:'var(--ibg)'}}/>
               <button onClick={saveSyn} style={sB('#4caf50')}>✓</button>
               <button onClick={()=>setEditSyn(false)} style={sB('#9e9e9e')}>✕</button></>}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',borderTop:'1px solid var(--border)',paddingTop:10}}>
          <button onClick={exportPDF}                style={sB('#546e7a')}>🖨️ PDF</button>
          <button onClick={exportModelXLS}           style={sB('#388e3c')}>📊 Excel</button>
          <button onClick={shareLink}                style={sB('#7b1fa2')}>🔗 שתף</button>
          <button onClick={()=>setQuickMode(true)}  style={sB('#0097a7')}>📱 נייד</button>
          <button onClick={()=>setShowReport(true)} style={sB('#e65100')}>⚠️ דווח שגיאה</button>
          {editor && <>
            <button onClick={()=>setShowMove(true)} style={sB('#455a64')}>🔀 העבר</button>
            <button onClick={()=>{if(confirm('לשכפל?'))onDuplicate();}} style={sB('#0277bd')}>⧉ שכפל</button>
            <button onClick={()=>setShowCopy(true)} style={sB('#558b2f')}>📋 העתק</button>
          </>}
        </div>
      </div>

      {/* Notes */}
      {(editor||model.notes) && (
        <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
          <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>📝 הערות</div>
          {editor
            ? <textarea value={model.notes||''} onChange={e=>onUpdate({notes:e.target.value})} placeholder="הוסף הערות חשובות..."
                style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',minHeight:72,color:'#e53935',background:'var(--ibg)',fontFamily:'Arial',lineHeight:1.6,boxSizing:'border-box'}}/>
            : <div style={{color:'#e53935',fontSize:14,lineHeight:1.7,fontWeight:'600',whiteSpace:'pre-wrap'}}>{model.notes}</div>}
        </div>
      )}

      {/* Images */}
      {(editor||images.length>0) && (
        <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            <span style={{fontWeight:'bold',fontSize:14,color:'var(--text)'}}>📐 שרטוטים</span>
            {editor && <>
              <label style={{...sB(brand.color),cursor:'pointer'}}>📁 העלה
                <input type="file" accept="image/*" multiple onChange={onImgUpload} style={{display:'none'}}/>
              </label>
              <button onClick={()=>setEditUrl(v=>!v)} style={sB('#607d8b')}>🔗 URL</button>
            </>}
            {images.length>0 && <span style={{color:'var(--sub)',fontSize:11,marginRight:'auto'}}>{images.length} תמונות</span>}
          </div>
          {editUrl && editor && (
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="https://..."
                style={{flex:1,border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px',fontSize:13,color:'var(--inp)',background:'var(--ibg)'}}/>
              <button onClick={()=>{if(imgUrl.trim()){onImgUrl(imgUrl.trim());setImgUrl('');setEditUrl(false);}}}
                style={{background:brand.color,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',cursor:'pointer'}}>הוסף</button>
            </div>
          )}
          {images.length>0
            ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8}}>
                {images.map((img,idx) => (
                  <div key={idx} style={{borderRadius:8,overflow:'hidden',border:'2px solid var(--border)',background:'var(--row2)'}}>
                    <img src={img} alt={`שרטוט ${idx+1}`} onClick={()=>onOpenImg(images,idx)} style={{width:'100%',height:120,objectFit:'contain',cursor:'zoom-in',display:'block'}}/>
                    <div style={{padding:'3px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--row2)',borderTop:'1px solid var(--border)'}}>
                      <span style={{fontSize:10,color:'var(--sub)'}}>תמונה {idx+1}</span>
                      {editor && <button onClick={()=>{if(confirm('למחוק?'))onDelImg(idx);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
                    </div>
                  </div>
                ))}
              </div>
            : <div style={{textAlign:'center',padding:24,background:'var(--row2)',borderRadius:8,border:'2px dashed var(--border)',color:'var(--sub)',fontSize:13}}>העלה שרטוטים</div>}
        </div>
      )}

      {/* Parts table */}
      <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',boxShadow:'0 1px 4px var(--shadow)'}}>

        {/* Disclaimer */}
        <div style={{background:'#fff8e1',border:'1px solid #ffe082',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#795548',lineHeight:1.6,display:'flex',alignItems:'flex-start',gap:8}}>
          <span style={{flexShrink:0,fontSize:15}}>⚠️</span>
          {admin
            ?<textarea value={partsDisclaimer||DEFAULT_DISCLAIMER} onChange={e=>onUpdateDisclaimer(e.target.value)}
                style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:12,color:'#795548',resize:'none',fontFamily:'Arial',lineHeight:1.6,cursor:'text'}} rows={2}/>
            :<span style={{flex:1}}>{partsDisclaimer||DEFAULT_DISCLAIMER}</span>
          }
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
          <span style={{fontWeight:'bold',fontSize:14,color:'var(--text)'}}>🔩 רשימת חלקים</span>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="חיפוש חכם..."
            style={{border:'1px solid var(--border)',borderRadius:16,padding:'5px 12px',fontSize:12,outline:'none',width:130,color:'var(--inp)',background:'var(--ibg)'}}/>
          {sortCol && <button onClick={()=>setSortCol(null)} style={sB('#9e9e9e')} title="בטל מיון">↺</button>}
          {editor && <>
            <button onClick={onAddPart}              style={{...sB(brand.color),fontWeight:'bold'}}>+ שורה</button>
            <button onClick={onAddCol}               style={sB('#607d8b')}>+ עמודה</button>
            <button onClick={()=>setShowPaste(v=>!v)} style={sB('#e65100')}>📋 הדבק</button>
          </>}
          <span style={{marginRight:'auto',color:'var(--sub)',fontSize:11}}>{filtered.length.toLocaleString()}/{model.parts.length.toLocaleString()}{sortCol?' · מוין':''}</span>
        </div>

        {selRows.size>0 && (
          <div style={{position:'sticky',bottom:12,zIndex:100,background:'#25D366',borderRadius:12,padding:'11px 16px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 4px 16px rgba(0,0,0,.25)',marginBottom:12,flexWrap:'wrap',animation:'fadeIn .2s'}}>
            <span style={{color:'#fff',fontWeight:'bold',fontSize:13,flex:1}}>✓ {selRows.size} נבחרו</span>
            <button onClick={()=>setShowWaEditor(true)} style={{background:'#fff',border:'none',borderRadius:8,padding:'7px 16px',cursor:'pointer',fontWeight:'bold',color:'#25D366',fontSize:13}}>✏️ ערוך ושלח</button>
            <button onClick={()=>{selRows.forEach(pid=>onAddToCart(brand.id,cat.id,model.id,pid));clearRows();alert(`✅ ${selRows.size} פריטים נוספו לסל`);}}
              style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',color:'#fff',fontSize:12}}>+ סל</button>
            <button onClick={clearRows} style={{background:'rgba(255,255,255,.25)',border:'none',borderRadius:8,padding:'7px 12px',cursor:'pointer',color:'#fff',fontSize:12}}>ביטול</button>
          </div>
        )}

        {showPaste && editor && (
          <div style={{background:'#fff8e1',border:'1px solid #ffcc02',borderRadius:8,padding:12,marginBottom:12}}>
            <div style={{fontSize:12,color:'#795548',marginBottom:4,fontWeight:'bold'}}>📋 סדר: {model.columns.map(c=>c.name).join(' ➔ ')}</div>
            <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="הדבק כאן..." rows={5}
              style={{width:'100%',border:'1px solid #ddd',borderRadius:6,padding:'8px 10px',fontSize:12,fontFamily:'monospace',resize:'vertical',boxSizing:'border-box',direction:'ltr',color:'#333'}}/>
            {pasteText.trim() && <div style={{fontSize:11,color:'#888',margin:'4px 0'}}>{pasteText.trim().split('\n').filter(r=>r.trim()).length} שורות</div>}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button onClick={submitPaste} style={{...sB('#4caf50'),padding:'8px 20px',fontSize:13}}>✓ ייבא</button>
              <button onClick={()=>{setPasteText('');setShowPaste(false);}} style={{...sB('#9e9e9e'),padding:'8px 14px',fontSize:13}}>ביטול</button>
            </div>
          </div>
        )}

        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:300}}>
            <thead>
              <tr style={{background:brand.light}}>
                <th style={{width:36,padding:'9px 6px',borderBottom:`2px solid ${brand.color}`}}>
                  <div onClick={()=>{if(selRows.size===filtered.length&&filtered.length>0)clearRows();else setSelRows(new Set(filtered.map(p=>p.id)));}}
                    style={{width:18,height:18,borderRadius:4,border:`2px solid ${brand.color}`,background:selRows.size===filtered.length&&filtered.length>0?brand.color:'transparent',cursor:'pointer',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {selRows.size===filtered.length&&filtered.length>0&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
                  </div>
                </th>
                {visibleCols.map((col,ci) => (
                  <th key={col.id} style={{padding:'9px 10px',textAlign:'right',color:'#333',fontWeight:'bold',borderBottom:`2px solid ${brand.color}`,whiteSpace:'nowrap',minWidth:80}}>
                    {editor
                      ? <div style={{display:'flex',alignItems:'center',gap:3}}>
                          <div style={{display:'flex',flexDirection:'column',gap:1,flexShrink:0}}>
                            <button onClick={()=>onMoveCol(col.id,-1)} disabled={ci===0} style={{background:'none',border:'none',cursor:ci===0?'default':'pointer',color:ci===0?'#ccc':'#666',fontSize:10,padding:0,lineHeight:1}}>◀</button>
                            <button onClick={()=>onMoveCol(col.id,1)} disabled={ci===visibleCols.length-1} style={{background:'none',border:'none',cursor:ci===visibleCols.length-1?'default':'pointer',color:ci===visibleCols.length-1?'#ccc':'#666',fontSize:10,padding:0,lineHeight:1}}>▶</button>
                          </div>
                          <input value={col.name} onChange={e=>onColName(col.id,e.target.value)}
                            style={{border:'1px dashed #ccc',borderRadius:3,padding:'2px 5px',fontSize:12,fontWeight:'bold',width:'100%',minWidth:50,background:'transparent',color:'#333'}}/>
                          {(admin||editor)&&model.columns.length>1&&<button onClick={()=>onDelCol(col.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>×</button>}
                        </div>
                      : <div onClick={()=>handleSort(col.id)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}>
                          {col.name}<span style={{fontSize:10,color:sortCol?.id===col.id?brand.color:'#aaa'}}>{sortIcon(col.id)}</span>
                        </div>}
                  </th>
                ))}
                {editor && <th style={{padding:'9px 6px',borderBottom:`2px solid ${brand.color}`,fontSize:11,color:'#888',minWidth:70}}>תגיות</th>}
                <th style={{width:editor?60:40,borderBottom:`2px solid ${brand.color}`}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i) => {
                const hi    = rowHi(p);
                const isSel = selRows.has(p.id);
                let ref = null;
                if (hi && !firstHiSet) { firstHiSet=true; ref=firstHiRef; }
                return (
                  <tr key={p.id} ref={ref}
                    style={{background:p.discontinued?'#fff0f0':isSel?'var(--sel)':p.pinned?'#fff8e1':hi?'var(--hi)':i%2?'var(--row2)':'var(--row1)',transition:'background .15s',cursor:'pointer'}}
                    onClick={()=>toggleRow(p.id)}
                    onMouseEnter={e=>{if(!isSel&&!hi&&!p.pinned&&!p.discontinued)e.currentTarget.style.background=brand.light+'88';}}
                    onMouseLeave={e=>{if(!isSel&&!hi)e.currentTarget.style.background=p.discontinued?'#fff0f0':p.pinned?'#fff8e1':i%2?'var(--row2)':'var(--row1)';}}>

                    <td style={{padding:'7px 6px',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                      <div onClick={()=>toggleRow(p.id)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?'#25D366':'var(--border)'}`,background:isSel?'#25D366':'transparent',cursor:'pointer',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {isSel&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}
                      </div>
                    </td>

                    {visibleCols.map(col => {
                      const v = p.values[col.id]||'';
                      return (
                        <td key={col.id} style={{padding:'7px 10px',borderBottom:'1px solid var(--border)',background:cellHi(v)?'var(--hi)':undefined}}>
                          {/* ⛔ הופסק — badge בולט, החלק עדיין נראה */}
                          {col.id===visibleCols[0]?.id && p.discontinued && (
                            <span style={{display:'inline-block',background:'#e53935',color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:10,fontWeight:'bold',marginLeft:6,verticalAlign:'middle'}}>⛔ הופסק</span>
                          )}
                          {p.pinned && !p.discontinued && col.id===visibleCols[0]?.id && (
                            <span style={{fontSize:9,color:'#e65100',marginLeft:4}}>📌</span>
                          )}
                          {editor
                            ? <input value={v} onChange={e=>onCell(p.id,col.id,e.target.value)} onClick={e=>e.stopPropagation()}
                                style={{border:'none',borderBottom:'1px solid var(--border)',width:'100%',minWidth:50,padding:'2px 4px',fontSize:13,background:'transparent',outline:'none',color:p.discontinued?'#c62828':'var(--inp)',textDecoration:p.discontinued?'line-through':''}}/>
                            : <span style={{color:p.discontinued?'#c62828':'var(--text)',textDecoration:p.discontinued?'line-through':''}}>{v}</span>}
                        </td>
                      );
                    })}

                    {editor && (
                      <td style={{padding:'5px 6px',borderBottom:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                        <input value={p.tags||''} onChange={e=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,tags:e.target.value})})}
                          onClick={e=>e.stopPropagation()}
                          style={{border:'none',borderBottom:'1px solid var(--border)',width:'100%',padding:'2px 4px',fontSize:11,background:'transparent',outline:'none',color:'var(--sub)'}}/>
                      </td>
                    )}

                    <td style={{padding:'5px 4px',textAlign:'center',borderBottom:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:2,justifyContent:'center',flexWrap:'wrap'}}>
                        <button onClick={()=>onAddToCart(brand.id,cat.id,model.id,p.id)} title="הוסף לסל" style={{background:'none',border:'none',cursor:'pointer',fontSize:13}}>🛒</button>
                        {editor && <>
                          <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,pinned:!pp.pinned})})}
                            title={p.pinned?'הסר סימון':'סמן כנפוץ'} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.pinned?'📌':'☆'}</button>
                          <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,discontinued:!pp.discontinued})})}
                            title={p.discontinued?'החזר לפעיל':'סמן כהופסק'} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.discontinued?'✅':'⛔'}</button>
                        </>}
                        {(admin||editor) && <button onClick={()=>onDelPart(p.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={visibleCols.length+(editor?3:2)} style={{padding:24,textAlign:'center',color:'var(--sub)'}}>
                  {editor?'לחץ "+ שורה" להוספת חלק':'אין חלקים'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReport && (
        <Modal onClose={()=>setShowReport(false)} title="⚠️ דיווח על שגיאה בנתונים">
          <div style={{fontSize:13,color:'var(--sub)',marginBottom:12}}>מצאת שגיאה? תאר בקצרה מה לא נכון:</div>
          <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4}
            placeholder={'לדוגמא: מק"ט יצרן לא נכון עבור מנוע מאוורר...'}
            style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={async()=>{if(!reportText.trim()){alert('כתוב תיאור');return;}await onReport(reportText);setReportText('');setShowReport(false);}}
              style={{flex:1,...BPr('#e65100')}}>📨 שלח דיווח</button>
            <button onClick={()=>setShowReport(false)} style={{flex:1,...BST}}>ביטול</button>
          </div>
        </Modal>
      )}

      {showMove     && <MoveModal      data={data} currentBid={brand.id} currentCid={cat.id} onMove={onMove} onClose={()=>setShowMove(false)}/>}
      {showCopy     && <CopyPartsModal data={data} currentMid={model.id} onCopy={onCopyPartsFrom} onClose={()=>setShowCopy(false)}/>}
      {showWaEditor && <WaEditorModal  brand={brand} cat={cat} model={model} selRows={selRows} defaultCols={waDefaults} onClose={()=>setShowWaEditor(false)}/>}
    </div>
  );
}
