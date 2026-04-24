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