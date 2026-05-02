function App() {
  const [data,           setData]           = useState(null);
  const [loaded,         setLoaded]         = useState(false);
  const [saving,         setSaving]         = useState('');
  const [saveErr,        setSaveErr]        = useState('');
  const [loginRole,      setLoginRole]      = useState(null);
  const [loginLabel,     setLoginLabel]     = useState('');
  const [sel,            setSel]            = useState(null);
  const [dark,           setDark]           = useState(() => localStorage.getItem('ac_dark')==='1');
  const [sidebar,        setSidebar]        = useState(false);
  const [sidebarFilter,  setSidebarFilter]  = useState('');
  const [query,          setQuery]          = useState('');
  const [imgModal,       setImgModal]       = useState({imgs:[],idx:0});
  const [imgZoom,        setImgZoom]        = useState(1);
  const [cart,           setCart]           = useState([]);
  const [showCart,       setShowCart]       = useState(false);
  const [showNotif,      setShowNotif]      = useState(false);
  const [notifInitTab,   setNotifInitTab]   = useState('missing');
  const [reports,        setReports]        = useState([]);
  const [techRequests,   setTechRequests]   = useState([]);
  const [alerts,         setAlerts]         = useState([]);
  const [histData,       setHistData]       = useState([]);
  const [showHistory,    setShowHistory]    = useState(false);
  const [brandMgr,       setBrandMgr]       = useState(false);
  const [chPwd,          setChPwd]          = useState(false);
  const [showXls,        setShowXls]        = useState(false);
  const [showBulkMove,   setShowBulkMove]   = useState(false);
  const [showBulkDel,    setShowBulkDel]    = useState(false);
  const [showHelp,       setShowHelp]       = useState(false);
  const [showDashboard,  setShowDashboard]  = useState(false);
  const [showVersions,   setShowVersions]   = useState(false);
  const [showNewsEditor, setShowNewsEditor] = useState(false);
  const [showBroadcast,  setShowBroadcast]  = useState(false);
  const [showUsersMgr,   setShowUsersMgr]   = useState(false);
  const [showEditorAlerts, setShowEditorAlerts] = useState(true);
  const [broadcast,      setBroadcast]      = useState(null);
  const [newsItems,      setNewsItems]      = useState([]);
  const [favorites,      setFavorites]      = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ac_fav')||'[]')); } catch { return new Set(); }
  });
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ac_recent')||'[]'); } catch { return []; }
  });
  const [now, setNow] = useState(new Date());

  const saveTimer    = useRef(null);
  const firstLoad    = useRef(true);
  const changedMids  = useRef(new Set());
  const navStack     = useRef([]);
  const headerRef    = useRef(null);
  const saveCount    = useRef(0);

  const admin  = loginRole==='admin';
  const editor = loginRole==='editor' || loginRole==='admin';
  const viewer = loginRole==='viewer';

  useEffect(() => { document.documentElement.className=dark?'dark':''; document.body.style.background='var(--bg)'; }, [dark]);
  useEffect(() => { const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t); }, []);

  useEffect(() => {
    fbLoad().then(d => { setData(d||INIT()); setLoaded(true); }).catch(() => { setData(INIT()); setLoaded(true); });
    fbGetNews().then(docs => setNewsItems(docs.map(d=>d.text)));
    fbGetBroadcast().then(b => { if(b&&b.active) setBroadcast(b.msg); });
  }, []);

  // Load alerts/reports when editor logs in
  useEffect(() => {
    if (!loginRole) return;
    if (editor) {
      fbGetReports().then(setReports);
      fbGetTechRequests().then(setTechRequests);
      fbGetAlerts().then(setAlerts);
    }
  }, [loginRole]);

  useEffect(() => {
    if (!loaded||!data) return;
    if (firstLoad.current) { firstLoad.current=false; return; }
    setSaving('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fbSave(data, changedMids.current);
        changedMids.current = new Set();
        saveCount.current++;
        if (saveCount.current % 5 === 0) fbSaveSnapshot(data, loginLabel||loginRole||'system', 'שמירה אוטומטית');
        setSaving('saved'); setSaveErr('');
        setTimeout(() => setSaving(''), 3000);
      } catch(e) { setSaving('error'); setSaveErr(e.message||String(e)); }
    }, 2500);
  }, [data, loaded]);

  const missingAlerts = useMemo(() => {
    if (!data) return [];
    const res = [];
    data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => {
      m.parts.forEach(p => {
        if ((p.values.nameHe||'').trim() && !(p.values.tadPn||'').trim())
          res.push({b,c,m,p,field:'מק"ט תדיראן'});
      });
    })));
    return res;
  }, [data]);

  const unresolvedCount = useMemo(() => reports.filter(r=>!r.resolved).length, [reports]);
  const unresolvedTech  = useMemo(() => techRequests.filter(r=>!r.resolved).length, [techRequests]);
  const notifCount      = unresolvedCount + missingAlerts.length + unresolvedTech;

  const brand = sel&&data ? data.brands.find(b=>b.id===sel.bid) : null;
  const cat   = brand     ? brand.categories.find(c=>c.id===sel.cid) : null;
  const model = cat       ? cat.models.find(m=>m.id===sel.mid) : null;

  const results = useMemo(() => {
    if (!data||!loginRole) return [];
    const q = query.trim().toLowerCase(); if (!q) return [];
    const res=[]; const seen=new Set();
    data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => {
      const ms  = m.synonyms?.find(s => fuzzyMatch(q,s));
      const mh  = fuzzyMatch(q,m.name) || !!ms;
      const ph  = m.parts.filter(p => partMatches(q,p,m.columns));
      if ((mh||ph.length) && !seen.has(m.id)) { seen.add(m.id); res.push({b,c,m,ph,ms:ms||null}); }
    })));
    return res;
  }, [query, data, loginRole]);

  const nav = (bid,cid,mid,hq='') => {
    if (sel) navStack.current = [...navStack.current.slice(-9), sel];
    setSel({bid,cid,mid,hq}); setQuery('');
    const b=data?.brands.find(x=>x.id===bid);
    const c=b?.categories.find(x=>x.id===cid);
    const m=c?.models.find(x=>x.id===mid);
    if (m) fbTrackView(mid, m.name, b?.name||'');
    setRecent(p => {
      const e={bid,cid,mid,ts:Date.now()};
      const f=p.filter(x=>x.mid!==mid).slice(0,11);
      const n=[e,...f];
      try { localStorage.setItem('ac_recent',JSON.stringify(n)); } catch {}
      return n;
    });
    if (window.innerWidth<700) setSidebar(false);
  };
  const goBack = () => { if(navStack.current.length>0){const p=navStack.current.pop();setSel(p);}else setSel(null); };
  const goHome = () => { setSel(null); setQuery(''); navStack.current=[]; };

  const mut  = fn => setData(d => fn(d));
  const mutM = (bid,cid,mid,fn) => { changedMids.current.add(mid); mut(d=>({...d,brands:updBrands(d.brands,bid,cid,mid,fn)})); };

  const logAction = (action, extra={}) => fbHist({action,...extra,role:loginRole,actor:loginLabel||loginRole});
  const logAlert  = (type, text) => {
    fbLogAlert({type,text,actor:loginLabel||loginRole}).then(()=>fbGetAlerts().then(setAlerts));
  };

  const toggleDark = () => setDark(v => { localStorage.setItem('ac_dark',v?'0':'1'); return !v; });
  const toggleFav  = mid => setFavorites(p => {
    const n=new Set(p); n.has(mid)?n.delete(mid):n.add(mid);
    try { localStorage.setItem('ac_fav',JSON.stringify([...n])); } catch {}
    return n;
  });

  const handleImgUpload = async (e,bid,cid,mid) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    const b64 = await Promise.all(files.map(compressImg));
    mutM(bid,cid,mid, m=>({...m,images:[...(m.images||[]),...b64]}));
  };

  const addToCart = (bid,cid,mid,pid) => {
    if (cart.find(i=>i.mid===mid&&i.pid===pid)) { alert('כבר בסל'); return; }
    const b=data.brands.find(x=>x.id===bid),c=b?.categories.find(x=>x.id===cid),m=c?.models.find(x=>x.id===mid),p=m?.parts.find(x=>x.id===pid);
    if (!m||!p) return;
    setCart(prev => [...prev,{id:gid(),bid,cid,mid,pid,modelName:m.name,brandName:b.name,brandColor:b.color,catName:c.name,values:{...p.values},columns:m.columns}]);
  };
  const removeFromCart = id => setCart(p => p.filter(i=>i.id!==id));
  const clearCart      = ()  => setCart([]);

  const moveModel = (fBid,fCid,mid,toBid,toCid) => {
    let moved=null;
    mut(d => {
      const brands=d.brands.map(b => { if(b.id!==fBid)return b; return{...b,categories:b.categories.map(c=>{if(c.id!==fCid)return c;moved=c.models.find(m=>m.id===mid);return{...c,models:c.models.filter(m=>m.id!==mid)};})}; });
      if(!moved)return d;
      return{...d,brands:brands.map(b=>b.id!==toBid?b:{...b,categories:b.categories.map(c=>c.id!==toCid?c:{...c,models:[...c.models,moved]})})};
    });
    changedMids.current.add(mid); setSel(s=>({...s,bid:toBid,cid:toCid}));
  };

  const bulkMoveModels = (sels,toBid,toCid) => {
    mut(d => {
      let moved=[];
      let brands=d.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.filter(m=>{const s=sels.some(x=>x.mid===m.id&&x.bid===b.id&&x.cid===c.id);if(s)moved.push(m);return!s;})}))}));
      brands=brands.map(b=>b.id!==toBid?b:{...b,categories:b.categories.map(c=>c.id!==toCid?c:{...c,models:[...c.models,...moved]})});
      return{...d,brands};
    });
    sels.forEach(s=>changedMids.current.add(s.mid));
    logAction('העברה מרובה',{count:sels.length});
  };

  const bulkDeleteModels = async sels => {
    if(!confirm(`למחוק ${sels.length} דגמים לצמיתות?`))return;
    fbSaveSnapshot(data, loginLabel||loginRole, `לפני מחיקת ${sels.length} דגמים`);
    // Log each deleted model
    sels.forEach(s => {
      const b=data.brands.find(x=>x.id===s.bid);
      const c=b?.categories.find(x=>x.id===s.cid);
      const m=c?.models.find(x=>x.id===s.mid);
      if(m) logAlert('delete', `נמחק דגם: ${m.name} (${b?.name||''} / ${c?.name||''})`);
    });
    try{await Promise.all(sels.map(s=>db.collection('parts').doc(s.mid).delete().catch(()=>{})));}catch{}
    mut(d=>({...d,brands:d.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.filter(m=>!sels.some(s=>s.mid===m.id&&s.bid===b.id&&s.cid===c.id))}))}))}));
    if(sels.some(s=>s.mid===sel?.mid))setSel(null);
    logAction('מחיקה מרובה',{count:sels.length});
  };

  const duplicateModel = (bid,cid,mid) => {
    const orig=data.brands.find(b=>b.id===bid)?.categories.find(c=>c.id===cid)?.models.find(m=>m.id===mid);
    if(!orig)return;
    const newId=gid(); changedMids.current.add(newId);
    const dup={...JSON.parse(JSON.stringify(orig)),id:newId,name:orig.name+' (עותק)',synonyms:[]};
    mut(d=>({...d,brands:d.brands.map(b=>b.id!==bid?b:{...b,categories:b.categories.map(c=>c.id!==cid?c:{...c,models:[...c.models,dup]})})}));
  };

  const copyPartsFrom = (sb,sc,sm,db2,dc,dm) => {
    const srcM=data.brands.find(b=>b.id===sb)?.categories.find(c=>c.id===sc)?.models.find(m=>m.id===sm);
    if(!srcM)return;
    changedMids.current.add(dm);
    mutM(db2,dc,dm,m=>({...m,parts:[...m.parts,...srcM.parts.map(p=>({...p,id:gid()}))]}));
  };

  const handleAddModel = (b,cid,name) => {
    const id=gid(); changedMids.current.add(id);
    const nm={id,name,synonyms:[],images:[],notes:'',columns:DCOLS(),parts:[]};
    mut(d=>({...d,brands:d.brands.map(bb=>bb.id!==b.id?bb:{...bb,categories:bb.categories.map(c=>c.id!==cid?c:{...c,models:[...c.models,nm]})})}));
    logAction('הוסף דגם',{model:name,brand:b.name});
    logAlert('add', `נוסף דגם חדש: ${name} (${b.name})`);
    fbAddNews(`נוסף דגם חדש: ${name} (${b.name})`).then(()=>fbGetNews().then(docs=>setNewsItems(docs.map(d=>d.text))));
  };

  const importFromXls = (rows,colMap,tBid,tCid,excluded) => {
    const grouped={};
    rows.forEach(r=>{const mn=String(r[colMap.model]||'').trim();if(!mn||excluded.has(mn))return;if(!grouped[mn])grouped[mn]=[];grouped[mn].push(r);});
    let total=0;
    mut(d=>{
      const brands=d.brands.map(b=>{if(b.id!==tBid)return b;return{...b,categories:b.categories.map(c=>{if(c.id!==tCid)return c;let models=[...c.models];Object.entries(grouped).forEach(([mn,pRows])=>{let m=models.find(x=>x.name===mn);const newId=m?m.id:gid();if(!m){m={id:newId,name:mn,synonyms:[],images:[],notes:'',columns:DCOLS(),parts:[]};models.push(m);}const np=pRows.map(r=>({id:gid(),discontinued:false,tags:'',pinned:false,comments:[],values:{ref:'',nameHe:String(r[colMap.nameHe]||'').trim(),nameEn:String(r[colMap.nameEn]||'').trim(),mfgPn:String(r[colMap.mfgPn]||'').trim(),tadPn:String(r[colMap.tadPn]||'').trim()}}));total+=np.length;changedMids.current.add(newId);models=models.map(x=>x.name===mn?{...x,parts:[...x.parts,...np]}:x);});return{...c,models};})};});
      return{...d,brands};
    });
    const modelNames=Object.keys(grouped).join(', ');
    if(modelNames){
      fbAddNews(`נוספו דגמים חדשים: ${modelNames}`).then(()=>fbGetNews().then(docs=>setNewsItems(docs.map(d=>d.text))));
      logAlert('add',`יובאו ${Object.keys(grouped).length} דגמים מ-Excel: ${modelNames.slice(0,60)}`);
    }
    logAction('ייבוא Excel',{models:Object.keys(grouped).length,parts:total});
    return{models:Object.keys(grouped).length,parts:total};
  };

  const expXLS = () => {
    if(!data)return;
    const wb=XLSX.utils.book_new();
    const allRows=[['מותג','קטגוריה','שם דגם','שם חלק בעברית','שם חלק באנגלית','מק"ט יצרן','מק"ט תדיראן','סטטוס']];
    data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
      if(!m.parts.length)return;
      const extraCols=m.columns.filter(cl=>!['ref','nameHe','nameEn','mfgPn','tadPn'].includes(cl.id));
      const hdr=['מספר זיהוי','שם בעברית','Part Name','מק"ט יצרן','מק"ט תדיראן',...extraCols.map(c=>c.name),'סטטוס'];
      const rows=m.parts.map(p=>[p.values.ref||'',p.values.nameHe||'',p.values.nameEn||'',p.values.mfgPn||'',p.values.tadPn||'',...extraCols.map(c=>p.values[c.id]||''),p.discontinued?'הופסק לייצור':'']);
      const ws=XLSX.utils.aoa_to_sheet([hdr,...rows]);
      ws['!cols']=hdr.map((_,i)=>({wch:i===1||i===2?30:16}));
      XLSX.utils.book_append_sheet(wb,ws,`${b.name}-${m.name}`.slice(0,31));
      m.parts.forEach(p=>allRows.push([b.name,c.name,m.name,p.values.nameHe||'',p.values.nameEn||'',p.values.mfgPn||'',p.values.tadPn||'',p.discontinued?'הופסק':'']));
    })));
    const wsAll=XLSX.utils.aoa_to_sheet(allRows);
    wsAll['!cols']=[{wch:12},{wch:16},{wch:20},{wch:30},{wch:30},{wch:16},{wch:16},{wch:14}];
    XLSX.utils.book_append_sheet(wb,wsAll,'כל הנתונים');
    XLSX.writeFile(wb,`ac-catalog-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const expJSON = () => {
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.download=`ac-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const impFile = e => {
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{try{const d=JSON.parse(ev.target.result);d.brands?.forEach(b=>b.categories?.forEach(c=>c.models?.forEach(m=>changedMids.current.add(m.id))));setData(d);setSel(null);alert('✅ נטען');}catch{alert('❌ שגיאה');}};
    r.readAsText(f);e.target.value='';
  };

  if (!loaded) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16,background:'#0f172a'}}>
      <div style={{fontSize:52}}>🔧</div>
      <div style={{fontSize:17,color:'#94a3b8'}}>טוען...</div>
      <div style={{width:40,height:40,border:'4px solid #334155',borderTop:'4px solid #1565c0',borderRadius:'50%',animation:'spin .9s linear infinite'}}/>
    </div>
  );

  if (!loginRole) return <LoginScreen data={data} onLogin={(role,id,label)=>{setLoginRole(role);setLoginLabel(label||role);}}/>;

  const hdrBg = brand?.color || '#37474f';
  const tips  = data.tips&&data.tips.length ? data.tips : DEFAULT_TIPS;
  const partsDisclaimer = data.partsDisclaimer || DEFAULT_DISCLAIMER;

  const openNotif = (tab='missing') => {
    setNotifInitTab(tab);
    setShowNotif(true);
    fbGetReports().then(setReports);
    fbGetTechRequests().then(setTechRequests);
    fbGetAlerts().then(setAlerts);
  };

  return(
    <div dir="rtl" style={{fontFamily:'Arial,sans-serif',minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',fontSize:14,color:'var(--text)'}}>

      {/* Broadcast */}
      {broadcast && <BroadcastBanner msg={broadcast} onDismiss={()=>setBroadcast(null)}/>}

      {/* Editor alerts bar (shown after login if there are open tasks) */}
      {editor && showEditorAlerts && notifCount > 0 && (
        <EditorAlertsBar
          missingAlerts={missingAlerts} reports={reports} techRequests={techRequests}
          onNav={tab=>{openNotif(tab);setShowEditorAlerts(false);}}
          onClose={()=>setShowEditorAlerts(false)}/>
      )}

      {/* News Ticker */}
      <NewsTicker items={newsItems}/>

      {/* HEADER */}
      <header ref={headerRef} style={{background:hdrBg,color:'#fff',padding:'10px 12px',display:'flex',alignItems:'center',gap:7,boxShadow:'0 2px 8px rgba(0,0,0,.25)',position:'sticky',top:0,zIndex:200,flexWrap:'wrap',transition:'background .3s'}}>
        <button onClick={()=>setSidebar(v=>!v)} style={bB('rgba(255,255,255,.2)')}>☰</button>
        <button onClick={goHome} style={{...bB('rgba(255,255,255,.2)'),fontSize:16}}>🏠</button>
        {sel&&<button onClick={goBack} style={bB('rgba(255,255,255,.2)')}>◀</button>}
        <span style={{fontWeight:'bold',fontSize:14,flexShrink:0}}>🔧 חלקי חילוף</span>
        <span style={{fontSize:11,color:'rgba(255,255,255,.75)',flexShrink:0,fontFamily:'monospace'}}>
          {now.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'})} {now.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}
        </span>
        {saving==='saving'&&<span style={{fontSize:11,color:'rgba(255,255,255,.8)',flexShrink:0}}>💾 שומר...</span>}
        {saving==='saved' &&<span style={{fontSize:11,color:'#a5d6a7',flexShrink:0}}>✓ נשמר</span>}
        {saving==='error' &&<button onClick={()=>alert('שגיאת שמירה: '+saveErr)} style={{fontSize:11,color:'#fff',background:'#e53935',border:'none',borderRadius:5,padding:'3px 8px',cursor:'pointer',flexShrink:0}}>⚠ שגיאה</button>}

        <div style={{flex:'1 1 130px',position:'relative',minWidth:90}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔍 חיפוש — דגם / מק&quot;ט / שם חלק..."
            style={{width:'100%',padding:'7px 28px 7px 10px',borderRadius:20,border:'none',fontSize:13,outline:'none',color:'#222',background:'#fff'}}/>
          {query&&<button onClick={()=>setQuery('')} style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:15}}>✕</button>}
        </div>

        <button onClick={()=>setShowCart(true)} style={{...bB('rgba(255,255,255,.2)'),position:'relative'}}>
          🛒{cart.length>0&&<span style={{position:'absolute',top:-4,left:-4,background:'#e53935',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold'}}>{cart.length}</span>}
        </button>
        <button onClick={()=>setShowHelp(true)} style={bB('rgba(255,255,255,.2)')}>❓</button>

        {/* Notifications — editor + admin */}
        {editor&&(
          <button onClick={()=>openNotif()} style={{...bB('rgba(255,255,255,.2)'),position:'relative'}}>
            🔔{notifCount>0&&<span style={{position:'absolute',top:-4,left:-4,background:'#e53935',color:'#fff',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold'}}>{notifCount}</span>}
          </button>
        )}

        <button onClick={toggleDark} style={bB('rgba(255,255,255,.2)')}>{dark?'☀️':'🌙'}</button>
        <button onClick={()=>{setLoginRole(null);setSel(null);setSidebar(false);setShowEditorAlerts(true);}} style={bB('rgba(255,255,255,.2)')} title="התנתק">⬤ יציאה</button>

        {/* Editor extras */}
        {editor&&!admin&&<button onClick={()=>setShowNewsEditor(true)} style={bB('#00796b')}>📰 חדשות</button>}
        {editor&&!admin&&<button onClick={()=>setShowBroadcast(true)} style={bB('#e65100')}>📢 הודעה</button>}
        {editor&&<button onClick={()=>setShowXls(true)} style={bB('#00796b')}>📥 ייבוא</button>}

        {/* Admin extras */}
        {admin&&<button onClick={()=>setBrandMgr(true)}       style={bB('rgba(255,255,255,.2)')}>⚙</button>}
        {admin&&<button onClick={()=>setShowBulkMove(true)}   style={bB('rgba(255,255,255,.2)')}>🔀</button>}
        {admin&&<button onClick={()=>setShowBulkDel(true)}    style={bB('#b71c1c')}>🗑</button>}
        {admin&&<button onClick={()=>{setShowHistory(true);fbGetHist().then(setHistData);}} style={bB('rgba(255,255,255,.2)')}>📋</button>}
        {admin&&<button onClick={()=>setShowVersions(true)}   style={bB('rgba(255,255,255,.2)')}>🕐</button>}
        {admin&&<button onClick={()=>setShowDashboard(true)}  style={bB('rgba(255,255,255,.2)')}>📊</button>}
        {admin&&<button onClick={()=>setShowNewsEditor(true)} style={bB('rgba(255,255,255,.2)')}>📰</button>}
        {admin&&<button onClick={()=>setShowBroadcast(true)}  style={bB('#e65100')}>📢</button>}
        {admin&&<button onClick={()=>setShowUsersMgr(true)}   style={bB('#6a1b9a')}>👥</button>}
        {admin&&<button onClick={()=>setChPwd(true)}          style={bB('rgba(255,255,255,.2)')}>🔑</button>}
        {admin&&<button onClick={expXLS}                      style={bB('#2e7d32')}>📊 Excel</button>}
        {admin&&<button onClick={expJSON}                     style={bB('rgba(255,255,255,.2)')}>💾</button>}
        {admin&&<label  style={{...bB('rgba(255,255,255,.2)'),cursor:'pointer'}}>📂<input type="file" accept=".json" onChange={impFile} style={{display:'none'}}/></label>}
      </header>

      {/* SEARCH DROPDOWN */}
      {query&&(
        <div style={{position:'fixed',top:(headerRef.current?.offsetHeight||56)+56+'px',right:0,left:0,zIndex:300,background:'var(--card)',boxShadow:'0 6px 20px rgba(0,0,0,.2)',maxHeight:'55vh',overflowY:'auto',animation:'fadeIn .1s'}}>
          <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',color:'var(--sub)',fontSize:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>{results.length} תוצאות עבור: <strong style={{color:'var(--text)'}}>{query}</strong></span>
            <button onClick={()=>setQuery('')} style={{background:'#e53935',border:'none',borderRadius:5,color:'#fff',padding:'3px 10px',cursor:'pointer',fontSize:12}}>✕ סגור</button>
          </div>
          {!results.length&&(
            <div style={{padding:28,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:8}}>🔍</div>
              <div style={{color:'var(--sub)',fontSize:14,fontWeight:'bold'}}>לא נמצאו תוצאות עבור "{query}"</div>
              <div style={{color:'var(--sub)',fontSize:12,marginTop:6}}>נסה לחפש לפי שם דגם, מק"ט יצרן, מק"ט תדיראן או שם חלק</div>
            </div>
          )}
          {results.map((r,i)=>(
            <div key={i} onClick={()=>nav(r.b.id,r.c.id,r.m.id,query)}
              style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:'var(--card)'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--row2)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--card)'}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                <span style={{background:r.b.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:'bold'}}>{r.b.name}</span>
                <span style={{fontWeight:'bold',color:'var(--text)',fontSize:14}}>{r.m.name}</span>
                {r.ms&&<span style={{background:'#e3f2fd',color:'#1565c0',padding:'1px 7px',borderRadius:4,fontSize:11,fontWeight:'bold'}}>≡ {r.ms}</span>}
                {r.m.synonyms?.filter(s=>s!==r.ms).map((s,si)=>(
                  <span key={si} style={{background:'#f3e5f5',color:'#6a1b9a',padding:'1px 6px',borderRadius:4,fontSize:10}}>{s}</span>
                ))}
                <span style={{color:'var(--sub)',fontSize:11}}>{r.c.name}</span>
                {r.ph.length>0&&<span style={{color:'#795548',fontSize:11,background:'#fff9c4',padding:'1px 6px',borderRadius:4}}>✦ {r.ph.length} חלקים</span>}
              </div>
              {r.ph.slice(0,3).map(p=>{
                const he=(p.values.nameHe||'').trim(),tadPn=(p.values.tadPn||'').trim(),mfgPn=(p.values.mfgPn||'').trim();
                return(
                  <div key={p.id} style={{fontSize:11,color:'var(--sub)',paddingRight:8,marginBottom:2,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                    {p.discontinued&&<span style={{background:'#e53935',color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:10,fontWeight:'bold'}}>⛔ הופסק</span>}
                    {he&&<span style={{color:'var(--text)',fontWeight:'500'}}>{he}</span>}
                    {tadPn&&<span>מק"ט תדיראן: <strong style={{color:'#1565c0'}}>{tadPn}</strong></span>}
                    {mfgPn&&<span>מק"ט יצרן: <strong>{mfgPn}</strong></span>}
                  </div>
                );
              })}
              {r.ph.length>3&&<div style={{fontSize:10,color:'var(--sub)',paddingRight:8}}>ועוד {r.ph.length-3} חלקים...</div>}
            </div>
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={{display:'flex',flex:1,overflow:'hidden',height:'calc(100vh - 56px)'}}>

        {/* SIDEBAR */}
        <aside style={{width:sidebar?265:0,flexShrink:0,overflow:'hidden',transition:'width .25s',background:'var(--sidebar)',borderLeft:'1px solid var(--border)'}}>
          <div style={{width:265,overflowY:'auto',height:'100%',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'8px 10px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              <div style={{position:'relative'}}>
                <input value={sidebarFilter} onChange={e=>setSidebarFilter(e.target.value)}
                  placeholder="🔍 סינון דגמים..."
                  style={{width:'100%',padding:'6px 28px 6px 10px',borderRadius:16,border:'1px solid var(--border)',fontSize:12,outline:'none',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
                {sidebarFilter&&<button onClick={()=>setSidebarFilter('')} style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:13}}>✕</button>}
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {data.brands.map(b=>(
                <SidebarBrand key={b.id} brand={b} sel={sel} editor={editor} admin={admin}
                  favorites={favorites} onToggleFav={toggleFav} onNav={nav}
                  sidebarFilter={sidebarFilter}
                  onAddModel={(cid,name)=>handleAddModel(b,cid,name)}
                  onDelModel={async(cid,mid)=>{
                    if(!confirm('למחוק?'))return;
                    const m=b.categories.find(c=>c.id===cid)?.models.find(m=>m.id===mid);
                    fbSaveSnapshot(data,loginLabel||loginRole,'לפני מחיקת דגם');
                    if(m) logAlert('delete',`נמחק דגם: ${m.name} (${b.name})`);
                    try{await db.collection('parts').doc(mid).delete();}catch{}
                    mut(d=>({...d,brands:d.brands.map(bb=>bb.id!==b.id?bb:{...bb,categories:bb.categories.map(c=>c.id!==cid?c:{...c,models:c.models.filter(m=>m.id!==mid)})})}));
                    if(sel?.mid===mid)setSel(null);
                  }}
                  onAddCat={name=>mut(d=>({...d,brands:d.brands.map(bb=>bb.id!==b.id?bb:{...bb,categories:[...bb.categories,{id:gid(),name,models:[]}]})}))}
                  onEditCat={(cid,name)=>mut(d=>({...d,brands:d.brands.map(bb=>bb.id!==b.id?bb:{...bb,categories:bb.categories.map(c=>c.id!==cid?c:{...c,name})})}))}
                  onDelCat={cid=>{if(!confirm('למחוק?'))return;mut(d=>({...d,brands:d.brands.map(bb=>bb.id!==b.id?bb:{...bb,categories:bb.categories.filter(c=>c.id!==cid)})}));}}
                />
              ))}
            </div>
            <div style={{padding:'10px',borderTop:'1px solid var(--border)',flexShrink:0}}>
              <button onClick={()=>{if(confirm('לעבור לאתר הטכנאים?'))window.open('https://maortadiran88-eng.github.io/GREE/','_blank');}}
                style={{width:'100%',padding:'8px',background:'var(--row2)',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',fontSize:11,color:'var(--sub)',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
                🔧 אתר הטכנאים
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{flex:1,overflowY:'auto',padding:14,paddingBottom:44}}>
          {!model
            ?<HomeScreen data={data} onNav={nav} recent={recent} favorites={favorites} onToggleFav={toggleFav} loginRole={loginRole} reports={reports} techRequests={techRequests} alerts={alerts}/>
            :<ModelView
                key={model.id} brand={brand} cat={cat} model={model}
                editor={editor} admin={admin} viewer={viewer} hq={sel?.hq||''}
                data={data} favorites={favorites} onToggleFav={toggleFav} loginRole={loginRole}
                partsDisclaimer={partsDisclaimer}
                onUpdateDisclaimer={v=>mut(d=>({...d,partsDisclaimer:v}))}
                onUpdate={u=>{changedMids.current.add(model.id);mutM(brand.id,cat.id,model.id,m=>({...m,...u}));}}
                onRenameModel={name=>{
                  changedMids.current.add(model.id);
                  mut(d=>({...d,brands:d.brands.map(b=>b.id!==brand.id?b:{...b,categories:b.categories.map(c=>c.id!==cat.id?c:{...c,models:c.models.map(m=>m.id!==model.id?m:{...m,name})})})}));
                  logAction('שינוי שם דגם',{from:model.name,to:name});
                }}
                onAddPart={()=>mutM(brand.id,cat.id,model.id,m=>({...m,parts:[...m.parts,{id:gid(),discontinued:false,tags:'',pinned:false,comments:[],values:Object.fromEntries(m.columns.map(c=>[c.id,'']))}]}))}
                onDelPart={pid=>{
                  const p=model.parts.find(x=>x.id===pid);
                  if(p){logAlert('delete',`נמחק חלק: ${p.values.nameHe||p.values.nameEn||pid} מדגם ${model.name}`);}
                  fbSaveSnapshot(data,loginLabel||loginRole,'לפני מחיקת חלק');
                  mutM(brand.id,cat.id,model.id,m=>({...m,parts:m.parts.filter(p=>p.id!==pid)}));
                }}
                onCell={(pid,cid,v)=>mutM(brand.id,cat.id,model.id,m=>({...m,parts:m.parts.map(p=>p.id!==pid?p:{...p,values:{...p.values,[cid]:v}})}))}
                onColName={(cid,n)=>mutM(brand.id,cat.id,model.id,m=>({...m,columns:m.columns.map(c=>c.id!==cid?c:{...c,name:n})}))}
                onMoveCol={(cid,dir)=>mutM(brand.id,cat.id,model.id,m=>{const cols=[...m.columns];const idx=cols.findIndex(c=>c.id===cid);const ni=idx+dir;if(ni<0||ni>=cols.length)return m;[cols[idx],cols[ni]]=[cols[ni],cols[idx]];return{...m,columns:cols};})}
                onAddCol={()=>mutM(brand.id,cat.id,model.id,m=>{const cid=gid();return{...m,columns:[...m.columns,{id:cid,name:'עמודה חדשה'}],parts:m.parts.map(p=>({...p,values:{...p.values,[cid]:''}}))}})}
                onDelCol={cid=>mutM(brand.id,cat.id,model.id,m=>({...m,columns:m.columns.filter(c=>c.id!==cid),parts:m.parts.map(p=>{const v={...p.values};delete v[cid];return{...p,values:v}})}))}
                onPaste={rows=>mutM(brand.id,cat.id,model.id,m=>({...m,parts:[...m.parts,...rows.map(r=>({id:gid(),discontinued:false,tags:'',pinned:false,comments:[],values:Object.fromEntries(m.columns.map((c,i)=>[c.id,r[i]||'']))}))]}))}
                onImgUpload={e=>handleImgUpload(e,brand.id,cat.id,model.id)}
                onDelImg={idx=>mutM(brand.id,cat.id,model.id,m=>({...m,images:m.images.filter((_,i)=>i!==idx)}))}
                onImgUrl={url=>mutM(brand.id,cat.id,model.id,m=>({...m,images:[...(m.images||[]),url]}))}
                onOpenImg={(imgs,idx)=>{setImgModal({imgs,idx});setImgZoom(1);}}
                onMove={(toBid,toCid)=>moveModel(brand.id,cat.id,model.id,toBid,toCid)}
                onDuplicate={()=>duplicateModel(brand.id,cat.id,model.id)}
                onCopyPartsFrom={(sb,sc,sm)=>copyPartsFrom(sb,sc,sm,brand.id,cat.id,model.id)}
                onAddToCart={addToCart}
                onReport={async text=>{await fbSaveReport({bid:brand.id,cid:cat.id,mid:model.id,modelName:model.name,brandName:brand.name,text,role:loginRole});alert('✅ הדיווח נשלח למנהל');}}
                waDefaults={data.waDefaults||['nameHe','tadPn']}
              />
          }
        </main>
      </div>

      {/* Tips bar bottom */}
      <TipsBar tips={tips}/>

      {/* IMAGE MODAL */}
      {imgModal.imgs.length>0&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:900,display:'flex',flexDirection:'column'}} onClick={()=>setImgModal({imgs:[],idx:0})}>
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:12,flexShrink:0,flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
            {imgModal.imgs.length>1&&<button onClick={()=>setImgModal(p=>({...p,idx:Math.max(0,p.idx-1)}))} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontSize:14,fontWeight:'bold'}}>◀</button>}
            {[['🔍+',()=>setImgZoom(z=>Math.min(z+.5,8))],['🔍−',()=>setImgZoom(z=>Math.max(z-.5,.5))],['↺',()=>setImgZoom(1)]].map(([l,f])=>(
              <button key={l} onClick={f} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontSize:14,fontWeight:'bold'}}>{l}</button>
            ))}
            {imgModal.imgs.length>1&&<button onClick={()=>setImgModal(p=>({...p,idx:Math.min(p.imgs.length-1,p.idx+1)}))} style={{background:'#fff',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontSize:14,fontWeight:'bold'}}>▶</button>}
            <span style={{color:'rgba(255,255,255,.7)',fontSize:12}}>{Math.round(imgZoom*100)}%{imgModal.imgs.length>1?` | ${imgModal.idx+1}/${imgModal.imgs.length}`:''}</span>
            <button onClick={()=>setImgModal({imgs:[],idx:0})} style={{background:'#e53935',border:'none',borderRadius:8,padding:'8px 14px',cursor:'pointer',fontSize:14,fontWeight:'bold',color:'#fff'}}>✕</button>
          </div>
          <div style={{flex:1,overflow:'auto',display:'flex',justifyContent:'center',padding:16,alignItems:'flex-start'}} onClick={e=>e.stopPropagation()}>
            <img src={imgModal.imgs[imgModal.idx]} style={{transform:`scale(${imgZoom})`,transformOrigin:'top center',transition:'transform .2s',maxWidth:imgZoom<=1?'100%':'none'}} alt="שרטוט"/>
          </div>
        </div>
      )}

      {/* PANELS */}
      {showCart     &&<CartPanel cart={cart} data={data} onRemove={removeFromCart} onClear={clearCart} onClose={()=>setShowCart(false)} waDefaults={data.waDefaults||['nameHe','tadPn']}/>}
      {showNotif    &&<NotificationsPanel
        missingAlerts={missingAlerts} reports={reports} techRequests={techRequests} alerts={alerts}
        initialTab={notifInitTab}
        onNav={(bid,cid,mid)=>{nav(bid,cid,mid);setShowNotif(false);}}
        onResolve={async id=>{await fbResolveReport(id);fbGetReports().then(setReports);}}
        onResolveTech={async id=>{await fbResolveTechRequest(id);fbGetTechRequests().then(setTechRequests);}}
        onClose={()=>setShowNotif(false)}/>}
      {showHelp     &&<HelpModal role={loginRole} onClose={()=>setShowHelp(false)}/>}
      {showDashboard&&<DashboardModal data={data} onClose={()=>setShowDashboard(false)}/>}
      {showVersions &&<VersionHistoryModal
        onRestore={restoredBrands=>{restoredBrands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>changedMids.current.add(m.id))));mut(d=>({...d,brands:restoredBrands}));setSel(null);}}
        onClose={()=>setShowVersions(false)}/>}
      {showNewsEditor&&<NewsEditorModal onClose={()=>{setShowNewsEditor(false);fbGetNews().then(docs=>setNewsItems(docs.map(d=>d.text)));}}/>}
      {showBroadcast&&<BroadcastModal currentMsg={data.systemMsg||''} onClose={()=>setShowBroadcast(false)}/>}
      {showUsersMgr &&<UsersManagerModal data={data} onSave={users=>{mut(d=>({...d,users}));setShowUsersMgr(false);alert('✅ המשתמשים עודכנו');}} onClose={()=>setShowUsersMgr(false)}/>}

      {showHistory&&(
        <Modal onClose={()=>setShowHistory(false)} title="📋 לוג פעילות" wide>
          <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
            <div style={{fontSize:12,color:'var(--sub)',flex:1}}>200 פעולות אחרונות</div>
            <button onClick={async()=>{if(!confirm('לאפס את הלוג לצמיתות?'))return;await fbClearHist();setHistData([]);}} style={sB('#e53935')}>🔄 איפוס לוג</button>
          </div>
          <div style={{maxHeight:'60vh',overflowY:'auto'}}>
            {!histData.length&&<div style={{textAlign:'center',color:'var(--sub)',padding:30}}>אין רשומות</div>}
            {histData.map((h,i)=>(
              <div key={h.id||i} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid var(--border)',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>{h.action}</div>
                  <div style={{fontSize:11,color:'var(--sub)',marginTop:2}}>{h.model&&`דגם: ${h.model} · `}{h.brand&&`מותג: ${h.brand} · `}{h.count&&`כמות: ${h.count} · `}{h.parts&&`חלקים: ${h.parts} · `}{h.from&&`מ: ${h.from} → ${h.to} · `}משתמש: {h.actor||h.role||'?'}</div>
                </div>
                <div style={{fontSize:10,color:'var(--sub)',flexShrink:0}}>{h.ts}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>setShowHistory(false)} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
        </Modal>
      )}

      {chPwd    &&<ChangePwd   data={data} onSave={d=>{mut(()=>({...d}));setChPwd(false);alert('✅ נשמר');}} onClose={()=>setChPwd(false)}/>}
      {brandMgr &&<BrandMgr   data={data} onSave={brands=>{mut(d=>({...d,brands}));setBrandMgr(false);}} onClose={()=>setBrandMgr(false)}/>}
      {showXls  &&<XlsImportModal data={data} onImport={importFromXls} onClose={()=>setShowXls(false)}/>}
      {showBulkMove&&<BulkMoveModal data={data} onMove={bulkMoveModels} onClose={()=>setShowBulkMove(false)}/>}
      {showBulkDel &&<BulkDeleteModal data={data} onDelete={bulkDeleteModels} onClose={()=>setShowBulkDel(false)}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
