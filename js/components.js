// ══════════ LOGIN ══════════
function LoginScreen({data,onLogin}){
  const[pwd,setPwd]=useState('');const[err,setErr]=useState('');
  const submit=()=>{
    const users=data.users||DEFAULT_USERS;
    const match=users.find(u=>u.pass===pwd);
    if(match){onLogin(match.role,match.id,match.label);}
    else setErr('סיסמה שגויה');
  };
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,direction:'rtl'}}>
      <div style={{background:'#fff',borderRadius:20,padding:'40px 32px',maxWidth:400,width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.5)',animation:'slideUp .4s'}}>
        <div style={{fontSize:56,marginBottom:12}}>🔧</div>
        <div style={{fontWeight:'bold',fontSize:20,color:'#1565c0',marginBottom:6,lineHeight:1.4,whiteSpace:'pre-line'}}>{data.welcomeTitle||'ברוך הבא לקטלוג חלקי חילוף'}</div>
        <div style={{fontSize:14,color:'#6b7280',marginBottom:28}}>{data.welcomeSub||'תחת המותג תדיראן'}</div>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="הזן סיסמת כניסה" autoFocus
          style={{width:'100%',padding:'13px 16px',borderRadius:10,border:`2px solid ${err?'#e53935':'#e5e7eb'}`,fontSize:15,textAlign:'center',marginBottom:10,outline:'none',boxSizing:'border-box'}}/>
        {err&&<div style={{color:'#e53935',fontSize:13,marginBottom:10,fontWeight:'bold'}}>{err}</div>}
        <button onClick={submit} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#1565c0,#1976d2)',color:'#fff',border:'none',borderRadius:10,fontSize:16,fontWeight:'bold',cursor:'pointer',marginBottom:22}}>
          כניסה למערכת ←
        </button>
        <div style={{background:'#fff8e1',borderRadius:10,padding:'12px 14px',fontSize:12,color:'#795548',textAlign:'right',lineHeight:1.7,border:'1px solid #ffe082'}}>
          ⚠️ {data.disclaimer||'מערכת זו מיועדת לשימוש עובדי תדיראן בלבד.'}
        </div>
      </div>
    </div>
  );
}

// ══════════ EDITOR QUICK ALERTS (shown on login) ══════════
function EditorAlertsBar({missingAlerts,reports,techRequests,onNav,onClose}){
  const missing=missingAlerts.length;
  const openReports=reports.filter(r=>!r.resolved).length;
  const openTech=techRequests.filter(r=>!r.resolved).length;
  const total=missing+openReports+openTech;
  if(!total)return null;
  return(
    <div style={{background:'#fff8e1',borderBottom:'2px solid #ffe082',padding:'10px 16px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <span style={{fontWeight:'bold',fontSize:13,color:'#e65100'}}>📋 משימות ממתינות:</span>
      {missing>0&&<span style={{background:'#fff3e0',color:'#e65100',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:'bold',cursor:'pointer'}} onClick={()=>onNav('missing')}>⚠️ {missing} שדות חסרים</span>}
      {openReports>0&&<span style={{background:'#ffebee',color:'#c62828',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:'bold',cursor:'pointer'}} onClick={()=>onNav('reports')}>🔴 {openReports} דיווחי שגיאה</span>}
      {openTech>0&&<span style={{background:'#e3f2fd',color:'#1565c0',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:'bold',cursor:'pointer'}} onClick={()=>onNav('tech')}>💬 {openTech} בקשות טכנאים</span>}
      <button onClick={onClose} style={{marginRight:'auto',background:'none',border:'none',color:'#aaa',cursor:'pointer',fontSize:16,flexShrink:0}}>✕</button>
    </div>
  );
}

// ══════════ TODO LIST ══════════
function TodoList({data,reports,techRequests,alerts}){
  const missingTadPn=[];
  data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
    const miss=m.parts.filter(p=>(p.values.nameHe||'').trim()&&!(p.values.tadPn||'').trim());
    if(miss.length)missingTadPn.push({b,c,m,count:miss.length});
  })));
  const openReports=reports.filter(r=>!r.resolved).length;
  const openTech=techRequests.filter(r=>!r.resolved).length;
  const modelsNoMakat=missingTadPn.reduce((s,x)=>s+x.count,0);
  const recentAlerts=alerts.slice(0,3);

  const items=[
    modelsNoMakat>0&&{icon:'⚠️',color:'#e65100',bg:'#fff3e0',text:`${modelsNoMakat} חלקים ב-${missingTadPn.length} דגמים חסרי מק"ט תדיראן`},
    openReports>0&&{icon:'🔴',color:'#c62828',bg:'#ffebee',text:`${openReports} דיווחי שגיאה ממתינים לטיפול`},
    openTech>0&&{icon:'💬',color:'#1565c0',bg:'#e3f2fd',text:`${openTech} בקשות טכנאים לדגמים חסרים`},
    modelsNoMakat===0&&openReports===0&&openTech===0&&{icon:'✅',color:'#2e7d32',bg:'#e8f5e9',text:'הכל מעודכן! אין משימות פתוחות.'},
  ].filter(Boolean);

  return(
    <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:16,boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{fontWeight:'bold',fontSize:14,color:'var(--text)',marginBottom:10}}>📋 לוח משימות</div>
      {items.map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,background:item.bg,marginBottom:6,border:`1px solid ${item.color}22`}}>
          <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
          <span style={{flex:1,fontSize:13,color:item.color,fontWeight:'500'}}>{item.text}</span>
        </div>
      ))}
      {recentAlerts.length>0&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:11,color:'var(--sub)',marginBottom:6,fontWeight:'bold'}}>פעולות אחרונות:</div>
          {recentAlerts.map((a,i)=>(
            <div key={i} style={{fontSize:11,color:'var(--sub)',padding:'3px 0',display:'flex',gap:8}}>
              <span style={{color:a.type==='delete'?'#e53935':'#2e7d32',fontWeight:'bold'}}>{a.type==='delete'?'🗑':'➕'}</span>
              <span>{a.text}</span>
              <span style={{marginRight:'auto',color:'var(--border)'}}>{a.ts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════ TECH REQUEST BOX ══════════
function TechRequestBox({loginRole}){
  const[text,setText]=useState('');const[name,setName]=useState('');const[sent,setSent]=useState(false);const[loading,setLoading]=useState(false);
  const send=async()=>{
    if(!text.trim()){alert('נא לרשום את שם הדגם החסר');return;}
    setLoading(true);
    try{await fbSaveTechRequest({text:text.trim(),submittedBy:name.trim()||'אנונימי',role:loginRole});setSent(true);setText('');setName('');setTimeout(()=>setSent(false),4000);}
    catch{alert('שגיאה בשליחה');}
    setLoading(false);
  };
  return(
    <div style={{background:'var(--card)',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px var(--shadow)',border:'1px solid #e3f2fd',marginBottom:16}}>
      <div style={{fontWeight:'bold',fontSize:14,color:'#1565c0',marginBottom:8}}>💬 חסר לך דגם במערכת?</div>
      <div style={{fontSize:12,color:'var(--sub)',marginBottom:10}}>רשום את שם הדגם החסר ונוסיף אותו בהקדם</div>
      {sent
        ?<div style={{textAlign:'center',color:'#4caf50',fontWeight:'bold',padding:'12px',background:'#e8f5e9',borderRadius:8}}>✅ הבקשה נשלחה! נטפל בהקדם.</div>
        :<>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="שמך (אופציונלי)" style={{...INS,marginBottom:8,fontSize:13,padding:'8px 12px'}}/>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="לדוגמא: GREE GWH18ACC — יחידה פנימית..." rows={3}
            style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid var(--border)',fontSize:13,resize:'vertical',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box',marginBottom:10}}/>
          <button onClick={send} disabled={loading} style={{...BPr('#1565c0'),width:'100%'}}>{loading?'⏳ שולח...':'📨 שלח בקשה'}</button>
        </>
      }
    </div>
  );
}

// ══════════ TECH SITE LINK ══════════
function TechSiteLink(){
  return(
    <div style={{marginBottom:16}}>
      <button onClick={()=>{if(confirm('לעבור לאתר הטכנאים?\nhttps://maortadiran88-eng.github.io/GREE/'))window.open('https://maortadiran88-eng.github.io/GREE/','_blank');}}
        style={{width:'100%',padding:'11px 16px',background:'var(--card)',border:'2px solid #1565c030',borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',gap:10,boxShadow:'0 1px 4px var(--shadow)',color:'var(--text)',fontSize:13,fontWeight:'bold'}}>
        <span style={{fontSize:20}}>🔧</span>
        <span style={{flex:1,textAlign:'right'}}>אתר הטכנאים</span>
        <span style={{color:'#1565c0',fontSize:12}}>→ לחץ לכניסה</span>
      </button>
    </div>
  );
}

// ══════════ HOME SCREEN ══════════
function HomeScreen({data,onNav,recent,favorites,onToggleFav,loginRole,reports,techRequests,alerts}){
  const total=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.length,0),0);
  const totalParts=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.reduce((sss,m)=>sss+m.parts.length,0),0),0);
  const[expandedBrand,setExpandedBrand]=useState(null);
  const greeting=getGreeting(data.greetings);

  const fmtTime=ts=>{const diff=Math.floor((Date.now()-ts)/60000);if(diff<1)return'עכשיו';if(diff<60)return`לפני ${diff} דק'`;if(diff<1440)return`לפני ${Math.floor(diff/60)} שע'`;return new Date(ts).toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'});};
  const recentModels=recent.slice(0,6).map(rv=>{const b=data.brands.find(x=>x.id===rv.bid);const c=b?.categories.find(x=>x.id===rv.cid);const m=c?.models.find(x=>x.id===rv.mid);if(!b||!c||!m)return null;return{b,c,m,ts:rv.ts};}).filter(Boolean);
  const favModels=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{if(favorites.has(m.id))favModels.push({b,c,m});})));

  return(
    <div style={{paddingBottom:44}}>
      {/* Greeting */}
      <div style={{background:'var(--card)',borderRadius:12,padding:'14px 18px',marginBottom:16,boxShadow:'0 1px 4px var(--shadow)'}}>
        <span style={{fontWeight:'bold',fontSize:18,color:'var(--text)'}}>{greeting}</span>
      </div>

      {/* Stats */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        {[['❄️','דגמים',total,'#1565c0'],['🔩','חלקים',totalParts.toLocaleString(),'#2e7d32'],['🏷️','מותגים',data.brands.length,'#6a1b9a']].map(([ic,lb,v,col])=>(
          <div key={lb} style={{background:'var(--card)',borderRadius:12,padding:'12px 16px',flex:'1 1 90px',boxShadow:'0 1px 4px var(--shadow)',display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:26}}>{ic}</span>
            <div><div style={{fontSize:18,fontWeight:'bold',color:col}}>{v}</div><div style={{fontSize:11,color:'var(--sub)'}}>{lb}</div></div>
          </div>
        ))}
      </div>

      {/* Todo — editor/admin */}
      {(loginRole==='editor'||loginRole==='admin')&&<TodoList data={data} reports={reports||[]} techRequests={techRequests||[]} alerts={alerts||[]}/>}

      {/* Favorites */}
      {favModels.length>0&&(
        <div style={{marginBottom:16}}>
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
          {/* Tech site link after favorites */}
          <div style={{marginTop:10}}><TechSiteLink/></div>
        </div>
      )}

      {/* Tech request */}
      <TechRequestBox loginRole={loginRole}/>

      {/* Recently viewed */}
      {recentModels.length>0&&(
        <div style={{marginBottom:16}}>
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
          {/* Tech site link after recent */}
          <div style={{marginTop:10}}><TechSiteLink/></div>
        </div>
      )}

      {/* If neither favorites nor recent, show tech link standalone */}
      {favModels.length===0&&recentModels.length===0&&<TechSiteLink/>}

      {/* Brand list */}
      <div style={{fontWeight:'bold',fontSize:13,color:'var(--sub)',marginBottom:10}}>📁 לפי מותג</div>
      {data.brands.map(b=>{
        const mc=b.categories.reduce((s,c)=>s+c.models.length,0);const isOpen=expandedBrand===b.id;
        return(
          <div key={b.id} style={{marginBottom:8,background:'var(--card)',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px var(--shadow)'}}>
            <div onClick={()=>setExpandedBrand(isOpen?null:b.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',cursor:'pointer',background:isOpen?b.color+'18':'var(--card)',borderBottom:isOpen?`2px solid ${b.color}`:'none'}}>
              <div style={{background:b.color,color:'#fff',padding:'4px 14px',borderRadius:20,fontWeight:'bold',fontSize:14}}>{b.name}</div>
              <span style={{color:'var(--sub)',fontSize:12}}>{mc} דגמים</span>
              <span style={{marginRight:'auto',color:'var(--sub)',fontSize:13}}>{isOpen?'▲':'▼'}</span>
            </div>
            {isOpen&&(
              <div style={{padding:'10px 16px 14px'}}>
                {b.categories.filter(c=>c.models.length>0).map(c=>(
                  <div key={c.id} style={{marginBottom:10}}>
                    <div style={{fontSize:11,color:'var(--sub)',fontWeight:'bold',marginBottom:6}}>{c.name}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6}}>
                      {c.models.map(m=>(
                        <div key={m.id} style={{padding:'8px 10px',borderRadius:8,border:`1px solid ${b.color}44`,cursor:'pointer',background:b.light+'88',transition:'background .1s',position:'relative'}}
                          onMouseEnter={e=>e.currentTarget.style.background=b.color+'33'} onMouseLeave={e=>e.currentTarget.style.background=b.light+'88'}>
                          <button onClick={ev=>{ev.stopPropagation();onToggleFav(m.id);}} style={{position:'absolute',top:4,left:6,background:'none',border:'none',fontSize:12,cursor:'pointer'}}>{favorites.has(m.id)?'⭐':'☆'}</button>
                          <div onClick={()=>onNav(b.id,c.id,m.id)} style={{paddingLeft:18}}>
                            <div style={{fontWeight:'bold',color:'var(--text)',fontSize:12,marginBottom:2}}>{m.name}</div>
                            <div style={{fontSize:10,color:b.color,fontWeight:'bold'}}>{m.parts.length} חלקים</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════ SIDEBAR BRAND ══════════
function SidebarBrand({brand,sel,editor,admin,favorites,onToggleFav,onNav,onAddModel,onDelModel,onAddCat,onEditCat,onDelCat,sidebarFilter}){
  const[open,setOpen]=useState(false);const[openCats,setOpenCats]=useState({});
  const[addingMod,setAddingMod]=useState(null);const[newModName,setNewModName]=useState('');
  const[editCat,setEditCat]=useState(null);const[addingCat,setAddingCat]=useState(false);const[newCatName,setNewCatName]=useState('');
  const modRef=useRef();

  useEffect(()=>{if(sel?.bid===brand.id){setOpen(true);setOpenCats(p=>({...p,[sel.cid]:true}));}},[sel?.bid,sel?.cid]);
  useEffect(()=>{
    if(!sidebarFilter)return;
    const hasMatch=brand.categories.some(c=>c.models.some(m=>m.name.toLowerCase().includes(sidebarFilter.toLowerCase())));
    if(hasMatch){setOpen(true);brand.categories.forEach(c=>{if(c.models.some(m=>m.name.toLowerCase().includes(sidebarFilter.toLowerCase())))setOpenCats(p=>({...p,[c.id]:true}));});}
  },[sidebarFilter]);

  const toggleCat=id=>setOpenCats(p=>({...p,[id]:!p[id]}));
  const doAddMod=cid=>{const n=newModName.trim();if(!n)return;onAddModel(cid,n);setNewModName('');setAddingMod(null);};
  const startAdd=cid=>{setAddingMod(cid);setNewModName('');setTimeout(()=>modRef.current?.focus(),50);};
  const allModelNames=brand.categories.flatMap(c=>c.models.map(m=>m.name));
  const suggestions=newModName.trim().length>=1?allModelNames.filter(n=>n.toLowerCase().includes(newModName.toLowerCase())&&n.toLowerCase()!==newModName.toLowerCase()):[];
  const isDuplicate=allModelNames.some(n=>n.toLowerCase()===newModName.trim().toLowerCase());

  return(
    <div style={{borderBottom:'1px solid var(--border)'}}>
      <div onClick={()=>setOpen(v=>!v)} style={{padding:'11px 14px',background:brand.color,color:'#fff',display:'flex',alignItems:'center',cursor:'pointer',userSelect:'none',gap:6}}>
        <span style={{flex:1,fontWeight:'bold',fontSize:14}}>{brand.name}</span>
        <span style={{fontSize:11,opacity:.8}}>{open?'▲':'▼'}</span>
      </div>
      {open&&<>
        {brand.categories.map(c=>{
          const visibleModels=sidebarFilter?c.models.filter(m=>m.name.toLowerCase().includes(sidebarFilter.toLowerCase())):c.models;
          if(sidebarFilter&&!visibleModels.length)return null;
          return(
            <div key={c.id}>
              <div style={{display:'flex',alignItems:'center',background:'var(--row2)',borderBottom:'1px solid var(--border)',minHeight:36}}>
                {editCat?.id===c.id&&admin
                  ?<div style={{flex:1,display:'flex',gap:4,padding:'4px 8px'}}>
                     <input value={editCat.name} autoFocus onChange={e=>setEditCat({id:c.id,name:e.target.value})}
                       onKeyDown={e=>{if(e.key==='Enter'){onEditCat(c.id,editCat.name);setEditCat(null);}if(e.key==='Escape')setEditCat(null);}}
                       style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'3px 6px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
                     <button onClick={()=>{onEditCat(c.id,editCat.name);setEditCat(null);}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:11}}>✓</button>
                     <button onClick={()=>setEditCat(null)} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:11,color:'var(--text)'}}>✕</button>
                   </div>
                  :<div onClick={()=>toggleCat(c.id)} style={{flex:1,padding:'8px 14px 8px 20px',cursor:'pointer',color:'var(--sub)',fontSize:13,userSelect:'none',display:'flex',alignItems:'center'}}>
                     <span style={{flex:1}}>{c.name}</span><span style={{fontSize:10}}>{openCats[c.id]?'▲':'▼'}</span>
                   </div>
                }
                {admin&&editCat?.id!==c.id&&(
                  <div style={{display:'flex',flexShrink:0,paddingLeft:4}}>
                    <button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 6px',lineHeight:1}}>+</button>
                    <button onClick={e=>{e.stopPropagation();setEditCat({id:c.id,name:c.name});}} style={{background:'none',border:'none',color:'var(--sub)',cursor:'pointer',fontSize:13,padding:'2px 4px'}}>✏</button>
                    <button onClick={e=>{e.stopPropagation();onDelCat(c.id);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'2px 5px'}}>🗑</button>
                  </div>
                )}
                {editor&&!admin&&editCat?.id!==c.id&&(
                  <button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 8px',lineHeight:1}}>+</button>
                )}
              </div>
              {(openCats[c.id]||sidebarFilter)&&<>
                {addingMod===c.id&&(
                  <div style={{padding:'6px 10px',background:'var(--row2)',display:'flex',flexDirection:'column',gap:4,borderBottom:'1px solid var(--border)'}}>
                    <div style={{display:'flex',gap:6}}>
                      <input ref={modRef} value={newModName} onChange={e=>setNewModName(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter'&&!isDuplicate)doAddMod(c.id);if(e.key==='Escape'){setAddingMod(null);setNewModName('');}}}
                        placeholder="שם הדגם..."
                        style={{flex:1,border:`1px solid ${isDuplicate?'#e53935':'var(--border)'}`,borderRadius:4,padding:'5px 8px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
                      <button onClick={()=>{if(!isDuplicate)doAddMod(c.id);}} disabled={isDuplicate}
                        style={{background:isDuplicate?'#aaa':brand.color,color:'#fff',border:'none',borderRadius:4,padding:'5px 10px',cursor:isDuplicate?'not-allowed':'pointer',fontSize:12}}>הוסף</button>
                      <button onClick={()=>{setAddingMod(null);setNewModName('');}} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'5px 8px',cursor:'pointer',fontSize:12,color:'var(--text)'}}>✕</button>
                    </div>
                    {isDuplicate&&<div style={{fontSize:11,color:'#e53935',fontWeight:'bold'}}>⚠️ דגם בשם זה כבר קיים!</div>}
                    {suggestions.length>0&&!isDuplicate&&(
                      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:6,overflow:'hidden',maxHeight:120,overflowY:'auto'}}>
                        {suggestions.slice(0,5).map(s=>(
                          <div key={s} onClick={()=>setNewModName(s)} style={{padding:'5px 10px',cursor:'pointer',fontSize:12,color:'var(--text)',borderBottom:'1px solid var(--border)'}}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--row2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>🔍 {s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {visibleModels.map(m=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',borderBottom:'1px solid var(--border)'}}>
                    <div onClick={()=>onNav(brand.id,c.id,m.id)}
                      style={{flex:1,padding:'8px 10px 8px 26px',cursor:'pointer',fontSize:13,color:sel?.mid===m.id?brand.color:'var(--text)',fontWeight:sel?.mid===m.id?'bold':'normal',background:sel?.mid===m.id?brand.light+'88':'transparent',borderRight:sel?.mid===m.id?`3px solid ${brand.color}`:'3px solid transparent'}}>
                      {m.name}
                      {m.synonyms?.length>0&&<div style={{fontSize:10,color:'var(--sub)',marginTop:2}}>{m.synonyms.join(' | ')}</div>}
                    </div>
                    <button onClick={()=>onToggleFav(m.id)} style={{background:'none',border:'none',fontSize:13,cursor:'pointer',padding:'0 4px'}}>{favorites.has(m.id)?'⭐':'☆'}</button>
                    {admin&&<button onClick={()=>onDelModel(c.id,m.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'0 8px'}}>🗑</button>}
                  </div>
                ))}
                {!visibleModels.length&&!sidebarFilter&&<div style={{padding:'7px 26px',color:'var(--sub)',fontSize:12}}>אין דגמים</div>}
              </>}
            </div>
          );
        })}
        {admin&&(addingCat
          ?<div style={{padding:'6px 10px',background:'var(--row2)',display:'flex',gap:6}}>
             <input value={newCatName} autoFocus onChange={e=>setNewCatName(e.target.value)}
               onKeyDown={e=>{if(e.key==='Enter'&&newCatName.trim()){onAddCat(newCatName.trim());setNewCatName('');setAddingCat(false);}if(e.key==='Escape')setAddingCat(false);}}
               placeholder="שם קטגוריה..." style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
             <button onClick={()=>{if(newCatName.trim()){onAddCat(newCatName.trim());setNewCatName('');setAddingCat(false);}}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'5px 10px',cursor:'pointer',fontSize:12}}>הוסף</button>
             <button onClick={()=>setAddingCat(false)} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'5px 8px',cursor:'pointer',fontSize:12,color:'var(--text)'}}>✕</button>
           </div>
          :<button onClick={()=>setAddingCat(true)} style={{width:'100%',padding:'8px',background:'none',border:'none',borderTop:'1px dashed var(--border)',color:brand.color,cursor:'pointer',fontSize:12,fontWeight:'bold'}}>+ הוסף קטגוריה</button>
        )}
      </>}
    </div>
  );
}

// ══════════ CART PANEL ══════════
function CartPanel({cart,data,onRemove,onClear,onClose,waDefaults}){
  const[colSel,setColSel]=useState(new Set(waDefaults));
  const allCols=useMemo(()=>{const s=new Set();cart.forEach(i=>i.columns.forEach(c=>s.add(JSON.stringify({id:c.id,name:c.name}))));return[...s].map(x=>JSON.parse(x));},[cart]);
  const exportCartPDF=()=>{const w=window.open('','_blank');const rows=cart.map(i=>`<tr><td style="background:#f5f5f5;font-weight:bold">${i.modelName}<br><small>${i.brandName}·${i.catName}</small></td>${i.columns.map(c=>`<td>${i.values[c.id]||''}</td>`).join('')}</tr>`).join('');w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>סל חלקים</title><style>body{font-family:Arial;padding:20px;direction:rtl}table{border-collapse:collapse;width:100%}th{background:#1565c0;color:#fff;padding:8px 10px;text-align:right}td{border:1px solid #ddd;padding:6px 10px;font-size:13px}</style></head><body><h2 style="color:#1565c0">🛒 סל חלקים — ${new Date().toLocaleDateString('he-IL')}</h2><p>${cart.length} פריטים</p><table><thead><tr><th>דגם</th>${cart[0]?.columns.map(c=>`<th>${c.name}</th>`).join('')||''}</tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>window.print();<\/script></body></html>`);w.document.close();};
  const sendCartWA=()=>{const activeCols=allCols.filter(c=>colSel.has(c.id));const hdr=`🛒 *סל חלקים*\n${new Date().toLocaleDateString('he-IL')}\n${'─'.repeat(28)}`;const lines=cart.map((item,i)=>{const vals=activeCols.map(c=>{const v=(item.values[c.id]||'').trim();return v?`${c.name}: ${v}`:'';}).filter(Boolean);return`*${i+1}.* [${item.modelName}] ${vals.join(' | ')}`;}).join('\n');window.open('https://wa.me/?text='+encodeURIComponent(`${hdr}\n\n${lines}\n\n_סה"כ ${cart.length} פריטים_`),'_blank');};
  return(
    <Modal onClose={onClose} wide title="🛒 סל חלקים">
      {!cart.length?<div style={{textAlign:'center',padding:40,color:'var(--sub)'}}>הסל ריק</div>
        :<>
          <div style={{maxHeight:'40vh',overflowY:'auto',marginBottom:14}}>
            {cart.map(item=>(
              <div key={item.id} style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:8,background:'var(--row2)',marginBottom:6,alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                    <span style={{background:item.brandColor,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold'}}>{item.brandName}</span>
                    <span style={{fontWeight:'bold',fontSize:13,color:'var(--text)'}}>{item.modelName}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--sub)'}}>{item.columns.filter(c=>item.values[c.id]?.trim()).map(c=>`${c.name}: ${item.values[c.id]}`).join(' · ')}</div>
                </div>
                <button onClick={()=>onRemove(item.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,flexShrink:0}}>🗑</button>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontWeight:'bold',fontSize:12,color:'var(--sub)',marginBottom:8}}>עמודות לשליחה בווצאפ:</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {allCols.map(c=>{const on=colSel.has(c.id);return(
                <div key={c.id} onClick={()=>setColSel(p=>{const n=new Set(p);on?n.delete(c.id):n.add(c.id);return n;})}
                  style={{padding:'5px 10px',borderRadius:6,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>
                  {on?'✓ ':''}{c.name}
                </div>
              );})}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={exportCartPDF} style={{flex:1,...BPr('#546e7a')}}>🖨️ PDF</button>
            <button onClick={sendCartWA} style={{flex:1,...BPr('#25D366')}}>📱 ווצאפ</button>
            <button onClick={onClear} style={{...sB('#e53935'),padding:'10px 14px'}}>נקה</button>
          </div>
        </>
      }
    </Modal>
  );
}

// ══════════ NOTIFICATIONS PANEL ══════════
function NotificationsPanel({missingAlerts,reports,techRequests,alerts,onNav,onResolve,onResolveTech,onClose,initialTab}){
  const[tab,setTab]=useState(initialTab||'missing');
  const unresolved=reports.filter(r=>!r.resolved);
  const unresolvedTech=techRequests.filter(r=>!r.resolved);
  return(
    <Modal onClose={onClose} wide title="🔔 התראות ומשימות">
      <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap'}}>
        {[
          ['missing',`⚠️ שדות חסרים (${missingAlerts.length})`],
          ['reports',`🔴 דיווחי שגיאה (${unresolved.length})`],
          ['tech',`💬 בקשות טכנאים (${unresolvedTech.length})`],
          ['activity',`📋 פעולות (${alerts.length})`],
        ].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'7px',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:11,background:tab===k?'#1565c0':'var(--row2)',color:tab===k?'#fff':'var(--text)',minWidth:80}}>{l}</button>
        ))}
      </div>
      {tab==='missing'&&(
        <div style={{maxHeight:'55vh',overflowY:'auto'}}>
          {!missingAlerts.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין שדות חסרים!</div>}
          {missingAlerts.slice(0,50).map((a,i)=>(
            <div key={i} onClick={()=>onNav(a.b.id,a.c.id,a.m.id)} style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:8,border:'1px solid #ff980022',background:'#fff8e1',marginBottom:6,cursor:'pointer',alignItems:'center'}}
              onMouseEnter={e=>e.currentTarget.style.background='#fff3cd'} onMouseLeave={e=>e.currentTarget.style.background='#fff8e1'}>
              <span style={{background:a.b.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{a.b.name}</span>
              <div style={{flex:1}}><div style={{fontWeight:'bold',fontSize:12,color:'#333'}}>{a.m.name}</div><div style={{fontSize:11,color:'#795548'}}>חלק: {a.p.values.nameHe||a.p.id} · חסר: {a.field}</div></div>
              <span style={{color:'#e65100',fontSize:11,fontWeight:'bold'}}>→</span>
            </div>
          ))}
        </div>
      )}
      {tab==='reports'&&(
        <div style={{maxHeight:'55vh',overflowY:'auto'}}>
          {!unresolved.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין דיווחים פתוחים!</div>}
          {reports.map(r=>(
            <div key={r.id} style={{padding:'12px',borderRadius:8,border:`1px solid ${r.resolved?'var(--border)':'#ff980055'}`,background:r.resolved?'var(--row2)':'#fff8e1',marginBottom:8,opacity:r.resolved?.6:1}}>
              <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <div style={{flex:1}}><div style={{fontWeight:'bold',fontSize:12,color:'var(--text)',marginBottom:4}}>{r.modelName||'?'} ({r.brandName||''})</div><div style={{fontSize:13,color:'var(--text)',marginBottom:4,lineHeight:1.5}}>{r.text}</div><div style={{fontSize:10,color:'var(--sub)'}}>{r.ts} · {r.role||'?'}</div></div>
                <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                  <button onClick={()=>onNav(r.bid,r.cid,r.mid)} style={sB('#1565c0')}>→ פתח</button>
                  {!r.resolved&&<button onClick={()=>onResolve(r.id)} style={sB('#4caf50')}>✓ טופל</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='tech'&&(
        <div style={{maxHeight:'55vh',overflowY:'auto'}}>
          {!unresolvedTech.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין בקשות פתוחות!</div>}
          {techRequests.map(r=>(
            <div key={r.id} style={{padding:'12px',borderRadius:8,border:`1px solid ${r.resolved?'var(--border)':'#1565c055'}`,background:r.resolved?'var(--row2)':'#e3f2fd',marginBottom:8,opacity:r.resolved?.6:1}}>
              <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <div style={{flex:1}}><div style={{fontWeight:'bold',fontSize:13,color:'var(--text)',marginBottom:4}}>{r.text}</div><div style={{fontSize:11,color:'var(--sub)'}}>{r.ts} · {r.submittedBy||'?'}</div></div>
                {!r.resolved&&<button onClick={()=>onResolveTech(r.id)} style={sB('#4caf50')}>✓ טופל</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='activity'&&(
        <div style={{maxHeight:'55vh',overflowY:'auto'}}>
          {!alerts.length&&<div style={{textAlign:'center',color:'var(--sub)',padding:30}}>אין פעולות עדיין</div>}
          {alerts.map((a,i)=>(
            <div key={a.id||i} style={{display:'flex',gap:10,padding:'9px 12px',borderRadius:8,background:a.type==='delete'?'#ffebee':'#e8f5e9',marginBottom:6,alignItems:'center'}}>
              <span style={{fontSize:16,flexShrink:0}}>{a.type==='delete'?'🗑':'➕'}</span>
              <div style={{flex:1}}><div style={{fontSize:13,color:'var(--text)',fontWeight:'500'}}>{a.text}</div><div style={{fontSize:11,color:'var(--sub)'}}>{a.ts} · {a.actor||'?'}</div></div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
    </Modal>
  );
}
