// ui-components.js

function Modal({children,onClose,wide,title}){
  return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
    <div style={{background:'var(--card)',borderRadius:14,padding:24,width:'100%',maxWidth:wide?640:390,maxHeight:'92vh',overflowY:'auto',animation:'fadeIn .15s',color:'var(--text)'}} dir="rtl" onClick={e=>e.stopPropagation()}>
      {title&&<div style={{fontWeight:'bold',fontSize:17,marginBottom:16,borderBottom:'1px solid var(--border)',paddingBottom:12}}>{title}</div>}
      {children}
    </div>
  </div>);
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
        ⚠️ {data.disclaimer||'מערכת זו מיועדת לשימוש עובדי תדיראן בלבד. הסיסמה אישית ואין להעבירה לגורם חיצוני. שימוש לא מורשה עלול לגרור השלכות משמעותיות.'}
      </div>
    </div>
  </div>);
}

// ══════════ NOTIFICATIONS PANEL ══════════
function NotificationsPanel({missingAlerts,reports,onNav,onResolve,onClose}){
  const[tab,setTab]=useState('missing');
  const unresolved=reports.filter(r=>!r.resolved);
  return(<Modal onClose={onClose} wide title="🔔 התראות ומשימות">
    <div style={{display:'flex',gap:4,marginBottom:16}}>
      {[['missing',`⚠️ שדות חסרים (${missingAlerts.length})`],['reports',`🔴 דיווחי שגיאה (${unresolved.length})`]].map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'8px',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',fontSize:12,background:tab===k?'#1565c0':'var(--row2)',color:tab===k?'#fff':'var(--text)'}}>{l}</button>
      ))}
    </div>
    {tab==='missing'&&(<div style={{maxHeight:'55vh',overflowY:'auto'}}>
      {!missingAlerts.length&&<div style={{textAlign:'center',color:'#4caf50',padding:30,fontSize:14}}>✅ אין שדות חסרים!</div>}
      {missingAlerts.slice(0,50).map((a,i)=>(
        <div key={i} onClick={()=>onNav(a.b.id,a.c.id,a.m.id)}
          style={{display:'flex',gap:10,padding:'10px 12px',borderRadius:8,border:'1px solid #ff980022',background:'#fff8e1',marginBottom:6,cursor:'pointer',alignItems:'center'}}
          onMouseEnter={e=>e.currentTarget.style.background='#fff3cd'} onMouseLeave={e=>e.currentTarget.style.background='#fff8e1'}>
          <span style={{background:a.b.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{a.b.name}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:'bold',fontSize:12,color:'#333'}}>{a.m.name}</div>
            <div style={{fontSize:11,color:'#795548'}}>חלק: {a.p.values.nameHe||a.p.values.nameEn||a.p.id} · חסר: {a.field}</div>
          </div>
          <span style={{color:'#e65100',fontSize:11,fontWeight:'bold'}}>→</span>
        </div>
      ))}
      {missingAlerts.length>50&&<div style={{textAlign:'center',color:'var(--sub)',fontSize:12,padding:8}}>ועוד {missingAlerts.length-50} פריטים...</div>}
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
    <button onClick={onClose} style={{width:'100%',marginTop:14,...BST}}>סגור</button>
  </Modal>);
}

// ══════════ CART PANEL ══════════
function CartPanel({cart,data,onRemove,onClear,onClose,waDefaults}){
  const[colSel,setColSel]=useState(new Set(waDefaults));
  const allCols=useMemo(()=>{const s=new Set();cart.forEach(i=>i.columns.forEach(c=>s.add(JSON.stringify({id:c.id,name:c.name}))));return[...s].map(x=>JSON.parse(x));},[ cart]);

  const exportCartPDF=()=>{
    const w=window.open('','_blank');
    const rows=cart.map(i=>`<tr><td style="background:#f5f5f5;font-weight:bold">${i.modelName}<br><small>${i.brandName} · ${i.catName}</small></td>${i.columns.map(c=>`<td>${i.values[c.id]||''}</td>`).join('')}</tr>`).join('');
    w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>סל חלקים</title>
      <style>body{font-family:Arial;padding:20px;direction:rtl}table{border-collapse:collapse;width:100%}th{background:#1565c0;color:#fff;padding:8px 10px;text-align:right}td{border:1px solid #ddd;padding:6px 10px;font-size:13px}</style></head>
      <body><h2 style="color:#1565c0">🛒 סל חלקים — ${new Date().toLocaleDateString('he-IL')}</h2>
      <p style="color:#666">${cart.length} פריטים</p>
      <table><thead><tr><th>דגם</th>${cart[0]?.columns.map(c=>`<th>${c.name}</th>`).join('')||''}</tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };

  const sendCartWA=()=>{
    const activeCols=allCols.filter(c=>colSel.has(c.id));
    const hdr=`🛒 *סל חלקים*\n${new Date().toLocaleDateString('he-IL')}\n${'─'.repeat(28)}`;
    const lines=cart.map((item,i)=>{
      const vals=activeCols.map(c=>{const v=(item.values[c.id]||'').trim();return v?`${c.name}: ${v}`:'';}).filter(Boolean);
      return`*${i+1}.* [${item.modelName}] ${vals.join(' | ')}`;
    }).join('\n');
    window.open('https://wa.me/?text='+encodeURIComponent(`${hdr}\n\n${lines}\n\n_סה"כ ${cart.length} פריטים_`),'_blank');
  };

  return(<Modal onClose={onClose} wide title="🛒 סל חלקים">
    {!cart.length
      ?<div style={{textAlign:'center',padding:40,color:'var(--sub)'}}>הסל ריק</div>
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
            {allCols.map(c=>{const on=colSel.has(c.id);return(<div key={c.id} onClick={()=>setColSel(p=>{const n=new Set(p);on?n.delete(c.id):n.add(c.id);return n;})}
              style={{padding:'5px 10px',borderRadius:6,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>
              {on?'✓ ':''}{c.name}
            </div>);
            })}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={exportCartPDF} style={{flex:1,...BPr('#546e7a')}}>🖨️ PDF</button>
          <button onClick={sendCartWA} style={{flex:1,...BPr('#25D366')}}>📱 ווצאפ</button>
          <button onClick={onClear} style={{...sB('#e53935'),padding:'10px 14px'}}>נקה</button>
        </div>
      </>
    }
  </Modal>);
}

// ══════════ HOME SCREEN ══════════
function HomeScreen({data,onNav,recent,favorites,onToggleFav}){
  const total=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.length,0),0);
  const totalParts=data.brands.reduce((s,b)=>s+b.categories.reduce((ss,c)=>ss+c.models.reduce((sss,m)=>sss+m.parts.length,0),0),0);
  const[expandedBrand,setExpandedBrand]=useState(null);
  const fmtTime=ts=>{const diff=Math.floor((Date.now()-ts)/60000);if(diff<1)return'עכשיו';if(diff<60)return`לפני ${diff} דק'`;if(diff<1440)return`לפני ${Math.floor(diff/60)} שע'`;return new Date(ts).toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'});};
  const recentModels=recent.slice(0,6).map(rv=>{const b=data.brands.find(x=>x.id===rv.bid);const c=b?.categories.find(x=>x.id===rv.cid);const m=c?.models.find(x=>x.id===rv.mid);if(!b||!c||!m)return null;return{b,c,m,ts:rv.ts};}).filter(Boolean);
  const favModels=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{if(favorites.has(m.id))favModels.push({b,c,m});})));

  return(<div>
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
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='';}}>
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
    <div style={{fontWeight:'bold',fontSize:13,color:'var(--sub)',marginBottom:10}}>📁 לפי מותג</div>
    {data.brands.map(b=>{
      const mc=b.categories.reduce((s,c)=>s+c.models.length,0);const isOpen=expandedBrand===b.id;
      return(<div key={b.id} style={{marginBottom:8,background:'var(--card)',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px var(--shadow)'}}>
        <div onClick={()=>setExpandedBrand(isOpen?null:b.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',cursor:'pointer',background:isOpen?b.color+'18':'var(--card)',borderBottom:isOpen?`2px solid ${b.color}`:'none'}}>
          <div style={{background:b.color,color:'#fff',padding:'4px 14px',borderRadius:20,fontWeight:'bold',fontSize:14}}>{b.name}</div>
          <span style={{color:'var(--sub)',fontSize:12}}>{mc} דגמים</span>
          <span style={{marginRight:'auto',color:'var(--sub)',fontSize:13}}>{isOpen?'▲':'▼'}</span>
        </div>
        {isOpen&&<div style={{padding:'10px 16px 14px'}}>
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
          {!b.categories.some(c=>c.models.length>0)&&<div style={{color:'var(--sub)',fontSize:13}}>אין דגמים עדיין</div>}
        </div>}
      </div>);
    })}
  </div>);
}

// ══════════ SIDEBAR ══════════
function SidebarBrand({brand,sel,editor,admin,favorites,onToggleFav,onNav,onAddModel,onDelModel,onAddCat,onEditCat,onDelCat}){
  const[open,setOpen]=useState(false);const[openCats,setOpenCats]=useState({});const[addingMod,setAddingMod]=useState(null);const[newModName,setNewModName]=useState('');const[editCat,setEditCat]=useState(null);const[addingCat,setAddingCat]=useState(false);const[newCatName,setNewCatName]=useState('');const modRef=useRef();
  useEffect(()=>{if(sel?.bid===brand.id){setOpen(true);setOpenCats(p=>({...p,[sel.cid]:true}));}},[sel?.bid,sel?.cid]);
  const toggleCat=id=>setOpenCats(p=>({...p,[id]:!p[id]}));
  const doAddMod=cid=>{const n=newModName.trim();if(!n)return;onAddModel(cid,n);setNewModName('');setAddingMod(null);};
  const startAdd=cid=>{setAddingMod(cid);setNewModName('');setTimeout(()=>modRef.current?.focus(),50);};
  return(<div style={{borderBottom:'1px solid var(--border)'}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:'11px 14px',background:brand.color,color:'#fff',display:'flex',alignItems:'center',cursor:'pointer',userSelect:'none',gap:6}}>
      <span style={{flex:1,fontWeight:'bold',fontSize:14}}>{brand.name}</span><span style={{fontSize:11,opacity:.8}}>{open?'▲':'▼'}</span>
    </div>
    {open&&<>
      {brand.categories.map(c=>(
        <div key={c.id}>
          <div style={{display:'flex',alignItems:'center',background:'var(--row2)',borderBottom:'1px solid var(--border)',minHeight:36}}>
            {editCat?.id===c.id&&admin
              ?<div style={{flex:1,display:'flex',gap:4,padding:'4px 8px'}}>
                 <input value={editCat.name} autoFocus onChange={e=>setEditCat({id:c.id,name:e.target.value})} onKeyDown={e=>{if(e.key==='Enter'){onEditCat(c.id,editCat.name);setEditCat(null);}if(e.key==='Escape')setEditCat(null);}} style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'3px 6px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
                 <button onClick={()=>{onEditCat(c.id,editCat.name);setEditCat(null);}} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'2px 8px',cursor:'pointer',fontSize:11}}>✓</button>
                 <button onClick={()=>setEditCat(null)} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'2px 6px',cursor:'pointer',fontSize:11,color:'var(--text)'}}>✕</button>
               </div>
              :<div onClick={()=>toggleCat(c.id)} style={{flex:1,padding:'8px 14px 8px 20px',cursor:'pointer',color:'var(--sub)',fontSize:13,userSelect:'none',display:'flex',alignItems:'center'}}>
                 <span style={{flex:1}}>{c.name}</span><span style={{fontSize:10}}>{openCats[c.id]?'▲':'▼'}</span>
               </div>
            }
            {admin&&editCat?.id!==c.id&&(<div style={{display:'flex',flexShrink:0,paddingLeft:4}}>
              <button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 6px',lineHeight:1}}>+</button>
              <button onClick={e=>{e.stopPropagation();setEditCat({id:c.id,name:c.name});}} style={{background:'none',border:'none',color:'var(--sub)',cursor:'pointer',fontSize:13,padding:'2px 4px'}}>✏</button>
              <button onClick={e=>{e.stopPropagation();onDelCat(c.id);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'2px 5px'}}>🗑</button>
            </div>)}
            {editor&&!admin&&editCat?.id!==c.id&&(<button onClick={e=>{e.stopPropagation();startAdd(c.id);}} style={{background:'none',border:'none',color:brand.color,cursor:'pointer',fontSize:20,fontWeight:'bold',padding:'2px 8px',lineHeight:1}}>+</button>)}
          </div>
          {openCats[c.id]&&<>
            {addingMod===c.id&&(<div style={{padding:'6px 10px',background:'var(--row2)',display:'flex',gap:6,borderBottom:'1px solid var(--border)'}}>
              <input ref={modRef} value={newModName} onChange={e=>setNewModName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')doAddMod(c.id);if(e.key==='Escape'){setAddingMod(null);setNewModName('');}}} placeholder="שם הדגם..." style={{flex:1,border:'1px solid var(--border)',borderRadius:4,padding:'5px 8px',fontSize:12,color:'var(--inp)',background:'var(--ibg)'}}/>
              <button onClick={()=>doAddMod(c.id)} style={{background:brand.color,color:'#fff',border:'none',borderRadius:4,padding:'5px 10px',cursor:'pointer',fontSize:12}}>הוסף</button>
              <button onClick={()=>{setAddingMod(null);setNewModName('');}} style={{background:'var(--border)',border:'none',borderRadius:4,padding:'5px 8px',cursor:'pointer',fontSize:12,color:'var(--text)'}}>✕</button>
            </div>)}
            {c.models.map(m=>(
              <div key={m.id} style={{display:'flex',alignItems:'center',borderBottom:'1px solid var(--border)'}}>
                <div onClick={()=>onNav(brand.id,c.id,m.id)} style={{flex:1,padding:'8px 10px 8px 26px',cursor:'pointer',fontSize:13,color:sel?.mid===m.id?brand.color:'var(--text)',fontWeight:sel?.mid===m.id?'bold':'normal',background:sel?.mid===m.id?brand.light+'88':'transparent',borderRight:sel?.mid===m.id?`3px solid ${brand.color}`:'3px solid transparent'}}>
                  {m.name}{m.synonyms?.length>0&&<div style={{fontSize:10,color:'var(--sub)',marginTop:2}}>{m.synonyms.join(' | ')}</div>}
                </div>
                <button onClick={()=>onToggleFav(m.id)} style={{background:'none',border:'none',fontSize:13,cursor:'pointer',padding:'0 4px'}}>{favorites.has(m.id)?'⭐':'☆'}</button>
                {admin&&<button onClick={()=>onDelModel(c.id,m.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13,padding:'0 8px'}}>🗑</button>}
              </div>
            ))}
            {!c.models.length&&<div style={{padding:'7px 26px',color:'var(--sub)',fontSize:12}}>אין דגמים</div>}
          </>}
        </div>
      ))}
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

// ══════════ MODEL VIEW ══════════
function ModelView({brand,cat,model,editor,admin,viewer,hq,data,favorites,onToggleFav,loginRole,onUpdate,onAddPart,onDelPart,onCell,onColName,onMoveCol,onAddCol,onDelCol,onPaste,onImgUpload,onDelImg,onImgUrl,onOpenImg,onMove,onDuplicate,onCopyPartsFrom,onAddToCart,onReport,waDefaults}){
  const[synIn,setSynIn]=useState(model.synonyms?.join(', ')||'');const[editSyn,setEditSyn]=useState(false);
  const[imgUrl,setImgUrl]=useState('');const[editUrl,setEditUrl]=useState(false);
  const[filter,setFilter]=useState('');
  const[sortCol,setSortCol]=useState(null);
  const[quickMode,setQuickMode]=useState(false);
  const[showPaste,setShowPaste]=useState(false);const[pasteText,setPasteText]=useState('');
  const[showMove,setShowMove]=useState(false);const[showCopy,setShowCopy]=useState(false);
  const[selRows,setSelRows]=useState(new Set());
  const[showWaEditor,setShowWaEditor]=useState(false);
  const[showReport,setShowReport]=useState(false);
  const[reportText,setReportText]=useState('');
  const firstHiRef=useRef(null);
  const q=hq.trim().toLowerCase();
  const images=model.images||[];

  useEffect(()=>{setSynIn(model.synonyms?.join(', ')||'');},[model.id]);
  useEffect(()=>{if(q&&firstHiRef.current)setTimeout(()=>firstHiRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),200);},[q]);

  const saveSyn=()=>{onUpdate({synonyms:synIn.split(',').map(s=>s.trim()).filter(Boolean)});setEditSyn(false);};

  const visibleCols=useMemo(()=>editor?model.columns:model.columns.filter(col=>model.parts.some(p=>(p.values[col.id]||'').trim()!=='')),[model.columns,model.parts,editor]);

  let filtered=model.parts;
  filtered=[...filtered.filter(p=>p.pinned),...filtered.filter(p=>!p.pinned)];
  if(filter.trim())filtered=filtered.filter(p=>partMatches(filter,p,model.columns));
  if(sortCol){filtered=[...filtered].sort((a,b)=>{const va=(a.values[sortCol.id]||'').toLowerCase();const vb=(b.values[sortCol.id]||'').toLowerCase();const n=va.localeCompare(vb,'he');return sortCol.dir==='asc'?n:-n;});}

  const rowHi=p=>q&&Object.values(p.values).some(v=>String(v).toLowerCase().includes(q));
  const cellHi=v=>q&&String(v).toLowerCase().includes(q);
  const submitPaste=()=>{const rows=pasteText.trim().split('\n').map(r=>r.split('\t').map(c=>c.trim())).filter(r=>r.some(c=>c));if(rows.length){onPaste(rows);setPasteText('');setShowPaste(false);}};
  const toggleRow=id=>setSelRows(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const clearRows=()=>setSelRows(new Set());
  const handleSort=cid=>{if(!sortCol||sortCol.id!==cid)setSortCol({id:cid,dir:'asc'});else if(sortCol.dir==='asc')setSortCol({id:cid,dir:'desc'});else setSortCol(null);};
  const sortIcon=cid=>!sortCol||sortCol.id!==cid?'⇅':sortCol.dir==='asc'?'↑':'↓';

  const exportPDF=()=>{
    const w=window.open('','_blank');
    const rows=model.parts.map(p=>`<tr style="${p.discontinued?'color:#c62828;text-decoration:line-through':p.pinned?'background:#fff8e1':''}">
      ${visibleCols.map(c=>`<td>${p.values[c.id]||''}</td>`).join('')}
      ${p.discontinued?'<td style="color:#c62828;font-weight:bold">⛔ הופסק</td>':'<td></td>'}
    </tr>`).join('');
    const imgs=images.map(img=>`<img src="${img}" style="max-width:280px;max-height:200px;border:1px solid #ddd;border-radius:6px;margin:4px;object-fit:contain">`).join('');
    const nh=model.notes?`<div style="background:#fff3f3;border-right:4px solid #e53935;padding:10px 14px;border-radius:6px;color:#e53935;font-weight:bold;margin:10px 0">${model.notes}</div>`:'';
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${model.name}</title>
      <style>body{font-family:Arial;padding:30px;color:#1a1a2a;direction:rtl}h1{color:${brand.color};font-size:22px}table{border-collapse:collapse;width:100%;margin-top:14px;font-size:13px}th{background:${brand.color};color:#fff;padding:9px 12px;text-align:right}td{border:1px solid #e5e7eb;padding:7px 12px}tr:nth-child(even){background:#f9fafb}@page{margin:20mm}</style></head>
      <body><h1>🔧 ${brand.name} — ${model.name}</h1><p style="color:#6b7280">${cat.name}${model.synonyms?.length?' · '+model.synonyms.join(', '):''}</p>
      ${nh}${imgs?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${imgs}</div>`:''}
      <table><thead><tr>${visibleCols.map(c=>`<th>${c.name}</th>`).join('')}<th>סטטוס</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:11px;color:#94a3b8;margin-top:8px">${model.parts.length} חלקים · ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</p>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
    w.document.close();
  };
  const exportModelXLS=()=>{const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([model.columns.map(c=>c.name),...model.parts.map(p=>model.columns.map(c=>p.values[c.id]||''))]);XLSX.utils.book_append_sheet(wb,ws,model.name.slice(0,31));XLSX.writeFile(wb,`${brand.name}-${model.name}.xlsx`);};
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
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="🔍 חיפוש מהיר (סלחני)..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:20,padding:'9px 14px',fontSize:14,outline:'none',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
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
        <button onClick={exportPDF}       style={sB('#546e7a')}>🖨️ PDF</button>
        <button onClick={exportModelXLS}  style={sB('#388e3c')}>📊 Excel</button>
        <button onClick={shareLink}       style={sB('#7b1fa2')}>🔗 שתף</button>
        <button onClick={()=>setQuickMode(true)} style={sB('#0097a7')}>📱 נייד</button>
        <button onClick={()=>setShowReport(true)} style={sB('#e65100')}>⚠️ דווח שגיאה</button>
        {editor&&<><button onClick={()=>setShowMove(true)} style={sB('#455a64')}>🔀 העבר</button>
          <button onClick={()=>{if(confirm('לשכפל?'))onDuplicate();}} style={sB('#0277bd')}>⧉ שכפל</button>
          <button onClick={()=>setShowCopy(true)} style={sB('#558b2f')}>📋 העתק</button></>}
      </div>
    </div>

    {(editor||model.notes)&&(<div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>📝 הערות למנהל/עורך</div>
      {editor?<textarea value={model.notes||''} onChange={e=>onUpdate({notes:e.target.value})} placeholder="הוסף הערות חשובות (יוצגו באדום לכל המשתמשים)..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',minHeight:72,color:'#e53935',background:'var(--ibg)',fontFamily:'Arial',lineHeight:1.6,boxSizing:'border-box'}}/>
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
        {images.map((img,idx)=>(
          <div key={idx} style={{borderRadius:8,overflow:'hidden',border:'2px solid var(--border)',background:'var(--row2)'}}>
            <img src={img} alt={`שרטוט ${idx+1}`} onClick={()=>onOpenImg(images,idx)} style={{width:'100%',height:120,objectFit:'contain',cursor:'zoom-in',display:'block'}}/>
            <div style={{padding:'3px 8px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'var(--row2)',borderTop:'1px solid var(--border)'}}>
              <span style={{fontSize:10,color:'var(--sub)'}}>תמונה {idx+1}</span>
              {editor&&<button onClick={()=>{if(confirm('למחוק?'))onDelImg(idx);}} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
            </div>
          </div>
        ))}
      </div>:<div style={{textAlign:'center',padding:24,background:'var(--row2)',borderRadius:8,border:'2px dashed var(--border)',color:'var(--sub)',fontSize:13}}>העלה שרטוטים</div>}
    </div>)}

    <div style={{background:'var(--card)',borderRadius:12,padding:'14px 16px',boxShadow:'0 1px 4px var(--shadow)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
        <span style={{fontWeight:'bold',fontSize:14,color:'var(--text)'}}>🔩 רשימת חלקים</span>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="חיפוש חכם..." style={{border:'1px solid var(--border)',borderRadius:16,padding:'5px 12px',fontSize:12,outline:'none',width:130,color:'var(--inp)',background:'var(--ibg)'}}/>
        {sortCol&&<button onClick={()=>setSortCol(null)} style={sB('#9e9e9e')} title="בטל מיון">↺</button>}
        {editor&&<><button onClick={onAddPart} style={{...sB(brand.color),fontWeight:'bold'}}>+ שורה</button>
          <button onClick={onAddCol} style={sB('#607d8b')}>+ עמודה</button>
          <button onClick={()=>setShowPaste(v=>!v)} style={sB('#e65100')}>📋 הדבק</button></>}
        <span style={{marginRight:'auto',color:'var(--sub)',fontSize:11}}>{filtered.length.toLocaleString()}/{model.parts.length.toLocaleString()}{sortCol?` · מוין`:''}</span>
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
        {pasteText.trim()&&<div style={{fontSize:11,color:'#888',margin:'4px 0'}}>{pasteText.trim().split('\n').filter(r=>r.trim()).length} שורות</div>}
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
                    {admin&&model.columns.length>1&&<button onClick={()=>onDelCol(col.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:16,padding:0,lineHeight:1,flexShrink:0}}>×</button>}
                  </div>
                  :<div onClick={()=>handleSort(col.id)} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}>
                    {col.name}<span style={{fontSize:10,color:sortCol?.id===col.id?brand.color:'#aaa'}}>{sortIcon(col.id)}</span>
                  </div>}
                </th>
              ))}
              {editor&&<th style={{padding:'9px 6px',borderBottom:`2px solid ${brand.color}`,fontSize:11,color:'#888',minWidth:70}}>תגיות/מילות מפתח</th>}
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
                  <input value={p.tags||''} onChange={e=>onCell(p.id,'__tags',e.target.value)||onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,tags:e.target.value})})} onClick={e=>e.stopPropagation()}
                    style={{border:'none',borderBottom:'1px solid var(--border)',width:'100%',padding:'2px 4px',fontSize:11,background:'transparent',outline:'none',color:'var(--sub)'}}/>
                </td>}
                <td style={{padding:'5px 4px',textAlign:'center',borderBottom:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:2,justifyContent:'center',flexWrap:'wrap'}}>
                    <button onClick={()=>onAddToCart(brand.id,cat.id,model.id,p.id)} title="הוסף לסל" style={{background:'none',border:'none',cursor:'pointer',fontSize:13}}>🛒</button>
                    {editor&&<>
                      <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,pinned:!pp.pinned})})} title={p.pinned?'הסר סימון':'סמן כנפוץ'} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.pinned?'📌':'☆'}</button>
                      <button onClick={()=>onUpdate({parts:model.parts.map(pp=>pp.id!==p.id?pp:{...pp,discontinued:!pp.discontinued})})} title={p.discontinued?'החזר לפעיל':'סמן כהופסק'} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>{p.discontinued?'✅':'⛔'}</button>
                    </>}
                    {admin&&<button onClick={()=>onDelPart(p.id)} style={{background:'none',border:'none',color:'#e53935',cursor:'pointer',fontSize:13}}>🗑</button>}
                  </div>
                </td>
              </tr>);
            })}
            {!filtered.length&&<tr><td colSpan={visibleCols.length+(editor?3:2)} style={{padding:24,textAlign:'center',color:'var(--sub)'}}>{editor?'לחץ "+ שורה" להוספת חלק':'אין חלקים'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>

    {showReport&&(<Modal onClose={()=>setShowReport(false)} title="⚠️ דיווח על שגיאה בנתונים">
      <div style={{fontSize:13,color:'var(--sub)',marginBottom:12}}>מצאת שגיאה? תאר בקצרה מה לא נכון:</div>
      <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4} placeholder="לדוגמא: מק&quot;ט יצרן לא נכון עבור מנוע מאוורר..." style={{width:'100%',border:'1px solid var(--border)',borderRadius:8,padding:'10px',fontSize:13,resize:'vertical',color:'var(--inp)',background:'var(--ibg)',boxSizing:'border-box'}}/>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={async()=>{if(!reportText.trim()){alert('כתוב תיאור');return;}await onReport(reportText);setReportText('');setShowReport(false);}} style={{flex:1,...BPr('#e65100')}}>📨 שלח דיווח</button>
        <button onClick={()=>setShowReport(false)} style={{flex:1,...BST}}>ביטול</button>
      </div>
    </Modal>)}

    {showMove&&<MoveModal data={data} currentBid={brand.id} currentCid={cat.id} onMove={onMove} onClose={()=>setShowMove(false)}/>}
    {showCopy&&<CopyPartsModal data={data} currentMid={model.id} onCopy={onCopyPartsFrom} onClose={()=>setShowCopy(false)}/>}
    {showWaEditor&&<WaEditorModal brand={brand} cat={cat} model={model} selRows={selRows} defaultCols={waDefaults} onClose={()=>setShowWaEditor(false)}/>}
  </div>);
}

// ══════════ WA EDITOR MODAL ══════════
function WaEditorModal({brand,cat,model,selRows,defaultCols,onClose}){
  const[colSel,setColSel]=useState(new Set(defaultCols||['nameHe','tadPn']));
  const[preview,setPreview]=useState(false);
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
        {model.columns.map(col=>{const on=colSel.has(col.id);return(<div key={col.id} onClick={()=>setColSel(p=>{const n=new Set(p);on?n.delete(col.id):n.add(col.id);return n;})} style={{padding:'7px 12px',borderRadius:8,border:`2px solid ${on?brand.color:'var(--border)'}`,background:on?brand.color+'22':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none',transition:'all .15s'}}>{on?'✓ ':''}{col.name}</div>);})}
      </div>
    </div>
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        <div style={{fontWeight:'bold',fontSize:12,color:'var(--sub)'}}>תצוגה מקדימה:</div>
        <button onClick={()=>setPreview(v=>!v)} style={sB('#455a64')}>{preview?'הסתר':'הצג'}</button>
      </div>
      {preview&&<div style={{background:'#e8f5e9',borderRadius:10,padding:12,fontFamily:'monospace',fontSize:11,color:'#1a1a2a',whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto',direction:'ltr',textAlign:'left',border:'1px solid #c8e6c9'}}>{buildMsg()}</div>}
    </div>
    <div style={{background:'var(--row2)',borderRadius:8,padding:'8px 12px',marginBottom:14,fontSize:12,color:'var(--sub)'}}>{sp.length} שורות · {activeCols.length} עמודות נבחרו</div>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>window.open('https://wa.me/?text='+encodeURIComponent(buildMsg()),'_blank')} disabled={!colSel.size} style={{flex:1,...BPr(colSel.size?'#25D366':'#aaa')}}>📱 שלח לווצאפ</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ MOVE MODAL ══════════
function MoveModal({data,currentBid,currentCid,onMove,onClose}){
  const[toBid,setToBid]=useState(currentBid);const[toCid,setToCid]=useState('');
  const brand=data.brands.find(b=>b.id===toBid);
  return(<Modal onClose={onClose} title="🔀 העבר דגם">
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
      {data.brands.map(b=><button key={b.id} onClick={()=>{setToBid(b.id);setToCid('');}} style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>{b.name}</button>)}
    </div>
    {brand&&brand.categories.map(c=><div key={c.id} onClick={()=>setToCid(c.id)} style={{padding:'10px 14px',borderRadius:8,border:`2px solid ${toCid===c.id?brand.color:'var(--border)'}`,marginBottom:6,cursor:'pointer',background:toCid===c.id?brand.light:'var(--ibg)',color:'var(--text)',fontSize:13,fontWeight:toCid===c.id?'bold':'normal'}}>
      {c.name}{toBid===currentBid&&c.id===currentCid&&<span style={{fontSize:11,color:'var(--sub)',marginRight:8}}>(נוכחי)</span>}
    </div>)}
    <div style={{display:'flex',gap:8,marginTop:12}}>
      <button onClick={()=>{if(!toCid){alert('בחר קטגוריה');return;}if(toBid===currentBid&&toCid===currentCid){alert('אותה קטגוריה');return;}onMove(toBid,toCid);onClose();}} style={{flex:1,...BPr('#1565c0')}}>✓ העבר</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ COPY PARTS ══════════
function CopyPartsModal({data,currentMid,onCopy,onClose}){
  const[picked,setPicked]=useState(null);
  const opts=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{if(m.id!==currentMid&&m.parts.length>0)opts.push({b,c,m});})));
  return(<Modal onClose={onClose} title="📋 העתק חלקים" wide>
    <div style={{maxHeight:'50vh',overflowY:'auto',marginBottom:12}}>
      {!opts.length&&<div style={{textAlign:'center',color:'var(--sub)',padding:24}}>אין דגמים עם חלקים</div>}
      {opts.map(({b,c,m})=>(
        <div key={m.id} onClick={()=>setPicked({b,c,m})} style={{padding:'10px 14px',borderRadius:8,border:`2px solid ${picked?.m.id===m.id?b.color:'var(--border)'}`,marginBottom:6,cursor:'pointer',background:picked?.m.id===m.id?b.light:'var(--ibg)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{background:b.color,color:'#fff',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:'bold'}}>{b.name}</span>
          <span style={{fontWeight:'bold',color:'var(--text)',flex:1}}>{m.name}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{c.name}</span>
          <span style={{color:b.color,fontSize:11,fontWeight:'bold'}}>{m.parts.length} חלקים</span>
        </div>
      ))}
    </div>
    {picked&&<div style={{background:'#e8f5e9',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#2e7d32'}}>✓ <strong>{picked.m.name}</strong> — {picked.m.parts.length} חלקים יועתקו</div>}
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!picked){alert('בחר דגם');return;}onCopy(picked.b.id,picked.c.id,picked.m.id);onClose();alert(`✅ ${picked.m.parts.length} חלקים הועתקו`);}} style={{flex:1,...BPr('#4caf50')}}>✓ העתק</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ BULK MOVE ══════════
function BulkMoveModal({data,onMove,onClose}){
  const[sel,setSel]=useState(new Set());const[toBid,setToBid]=useState('');const[toCid,setToCid]=useState('');const[q,setQ]=useState('');
  const all=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color}))));
  const filtered=q.trim()?all.filter(x=>x.mname.toLowerCase().includes(q.toLowerCase())||x.bname.toLowerCase().includes(q.toLowerCase())):all;
  const key=(bid,cid,mid)=>`${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle=k=>setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  const tb=data.brands.find(b=>b.id===toBid);
  return(<Modal onClose={onClose} wide title="🔀 העברה מרובה">
    <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{flex:1,minWidth:100,...INS,padding:'7px 12px'}}/>
      <button onClick={()=>setSel(new Set(filtered.map(x=>key(x.bid,x.cid,x.mid))))} style={sB('#607d8b')}>בחר הכל</button>
      <button onClick={()=>setSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
    </div>
    <div style={{maxHeight:'28vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
      {all.length===0&&<div style={{padding:20,textAlign:'center',color:'var(--sub)'}}>אין דגמים</div>}
      {filtered.map(x=>{const k=key(x.bid,x.cid,x.mid);const isSel=sel.has(k);return(
        <div key={k} onClick={()=>toggle(k)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'var(--sel)':'var(--card)',userSelect:'none'}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSel?'#1565c0':'var(--border)'}`,background:isSel?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isSel&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}</div>
          <span style={{background:x.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.bname}</span>
          <span style={{fontWeight:'bold',color:'var(--text)',flex:1,fontSize:13}}>{x.mname}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
        </div>
      );})}
    </div>
    {sel.size>0&&<div style={{background:'var(--sel)',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#2e7d32',fontWeight:'bold'}}>✓ {sel.size} דגמים נבחרו</div>}
    <div style={{fontWeight:'bold',fontSize:13,marginBottom:8,color:'var(--text)'}}>העבר אל:</div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>{data.brands.map(b=><button key={b.id} onClick={()=>{setToBid(b.id);setToCid('');}} style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${toBid===b.id?b.color:'var(--border)'}`,background:toBid===b.id?b.color:'var(--ibg)',color:toBid===b.id?'#fff':'var(--text)',cursor:'pointer',fontWeight:'bold',fontSize:13}}>{b.name}</button>)}</div>
    {tb&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>{tb.categories.map(c=><div key={c.id} onClick={()=>setToCid(c.id)} style={{padding:'8px 12px',borderRadius:8,border:`2px solid ${toCid===c.id?tb.color:'var(--border)'}`,cursor:'pointer',background:toCid===c.id?tb.light:'var(--ibg)',fontSize:12,color:'var(--text)',fontWeight:toCid===c.id?'bold':'normal'}}>{c.name}</div>)}</div>}
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!sel.size){alert('בחר דגמים');return;}if(!toCid){alert('בחר יעד');return;}const sels=[...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});onMove(sels,toBid,toCid);alert(`✅ ${sels.length} דגמים הועברו`);onClose();}} style={{flex:1,...BPr('#1565c0')}}>✓ העבר{sel.size>0?` (${sel.size})`:''}</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ BULK DELETE ══════════
function BulkDeleteModal({data,onDelete,onClose}){
  const[sel,setSel]=useState(new Set());const[q,setQ]=useState('');
  const all=[];data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>all.push({bid:b.id,cid:c.id,mid:m.id,bname:b.name,cname:c.name,mname:m.name,color:b.color,parts:(m.parts||[]).length}))));
  const filtered=q.trim()?all.filter(x=>[x.mname,x.bname,x.cname].some(s=>s.toLowerCase().includes(q.toLowerCase()))):all;
  const key=(bid,cid,mid)=>`${bid}${SEP}${cid}${SEP}${mid}`;
  const toggle=k=>setSel(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});
  return(<Modal onClose={onClose} wide title="🗑 מחיקה מרובה">
    <div style={{background:'#ffebee',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#c62828',fontWeight:'bold'}}>⚠ המחיקה לצמיתות — לא ניתנת לביטול!</div>
    <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 חפש..." style={{flex:1,minWidth:100,...INS,padding:'7px 12px'}}/>
      <button onClick={()=>setSel(new Set(filtered.map(x=>key(x.bid,x.cid,x.mid))))} style={sB('#607d8b')}>בחר הכל</button>
      <button onClick={()=>setSel(new Set())} style={sB('#9e9e9e')}>נקה</button>
    </div>
    <div style={{maxHeight:'38vh',overflowY:'auto',border:'1px solid var(--border)',borderRadius:8,marginBottom:12}}>
      {!all.length&&<div style={{padding:30,textAlign:'center',color:'var(--sub)',fontSize:14}}>אין דגמים</div>}
      {!filtered.length&&all.length>0&&<div style={{padding:20,textAlign:'center',color:'var(--sub)'}}>אין תוצאות</div>}
      {filtered.map(x=>{const k=key(x.bid,x.cid,x.mid);const isSel=sel.has(k);return(
        <div key={k} onClick={()=>toggle(k)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isSel?'#ffebee':'var(--card)',userSelect:'none'}}
          onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='var(--row2)';}} onMouseLeave={e=>{e.currentTarget.style.background=isSel?'#ffebee':'var(--card)';}}>
          <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${isSel?'#c62828':'var(--border)'}`,background:isSel?'#c62828':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isSel&&<span style={{color:'#fff',fontSize:13,fontWeight:'bold'}}>✓</span>}</div>
          <span style={{background:x.color,color:'#fff',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:'bold',flexShrink:0}}>{x.bname}</span>
          <span style={{fontWeight:'bold',color:'var(--text)',flex:1,fontSize:13}}>{x.mname}</span>
          <span style={{color:'var(--sub)',fontSize:11}}>{x.cname}</span>
          <span style={{color:'#e53935',fontSize:11,fontWeight:'bold',flexShrink:0}}>{x.parts} חלקים</span>
        </div>
      );})}
    </div>
    {sel.size>0&&<div style={{background:'#ffebee',borderRadius:8,padding:'8px 14px',marginBottom:10,fontSize:13,color:'#c62828',fontWeight:'bold'}}>🗑 {sel.size} דגמים יימחקו לצמיתות</div>}
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>{if(!sel.size){alert('לא נבחרו דגמים');return;}const sels=[...sel].map(k=>{const[bid,cid,mid]=k.split(SEP);return{bid,cid,mid};});onDelete(sels);onClose();}} style={{flex:1,...BPr(sel.size?'#c62828':'#aaa')}}>🗑 מחק{sel.size>0?` (${sel.size})`:''}</button>
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
      <div style={{fontSize:40,marginBottom:8}}>📊</div><div style={{fontWeight:'bold',color:'#1565c0',fontSize:15,marginBottom:4}}>לחץ לבחירת קובץ Excel</div><div style={{color:'var(--sub)',fontSize:12}}>XLSX, XLS, CSV</div>
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
        {groups.map(([name,count])=>{const isEx=excl.has(name);const exists=tb?.categories.find(c=>c.id===toCid)?.models.some(m=>m.name===name);return(
          <div key={name} onClick={()=>setExcl(p=>{const n=new Set(p);isEx?n.delete(name):n.add(name);return n;})} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid var(--border)',background:isEx?'var(--row2)':'var(--card)',opacity:isEx?.45:1}}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${!isEx?'#1565c0':'var(--border)'}`,background:!isEx?'#1565c0':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{!isEx&&<span style={{color:'#fff',fontSize:11,fontWeight:'bold'}}>✓</span>}</div>
            <span style={{flex:1,fontWeight:'bold',color:'var(--text)',fontSize:13}}>{name}</span>
            <span style={{color:'var(--sub)',fontSize:11}}>{count} חלקים</span>
            {exists?<span style={{background:'#fff3e0',color:'#e65100',padding:'1px 6px',borderRadius:4,fontSize:10}}>יתווסף</span>:<span style={{background:'#e8f5e9',color:'#2e7d32',padding:'1px 6px',borderRadius:4,fontSize:10}}>חדש</span>}
          </div>
        );})}
      </div>
      <div style={{background:'#f3e5f5',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#6a1b9a'}}>
        יוייבאו: <strong>{included.length} דגמים</strong> עם <strong>{included.reduce((s,[,c])=>s+c,0).toLocaleString()} חלקים</strong> → <strong>{tb?.name}</strong> / <strong>{tb?.categories.find(c=>c.id===toCid)?.name}</strong>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>{const res=onImport(rows,cm,toBid,toCid,excl);alert(`✅ ${res.models} דגמים, ${res.parts.toLocaleString()} חלקים`);onClose();}} disabled={!included.length} style={{flex:1,...BPr(included.length?'#4caf50':'#aaa')}}>✅ ייבא</button>
        <button onClick={()=>setStep(2)} style={{...BST,padding:'10px 16px',borderRadius:8}}>חזור</button>
      </div>
    </div>}
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
      {brands.map(b=>(
        <div key={b.id} style={{border:'1px solid var(--border)',borderRadius:10,padding:12,marginBottom:10,borderRight:`5px solid ${b.color}`}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <input value={b.name} onChange={e=>upd(b.id,'name',e.target.value)} style={{border:'1px solid var(--border)',borderRadius:6,padding:'6px 10px',fontSize:14,fontWeight:'bold',flex:'1 1 100px',color:'var(--inp)',background:'var(--ibg)'}}/>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <label style={{fontSize:12,color:'var(--sub)'}}>צבע:</label>
              <input type="color" value={b.color} onChange={e=>{const c=e.target.value;upd(b.id,'color',c);upd(b.id,'light',c+'22');}} style={{border:'none',borderRadius:4,height:34,width:44,cursor:'pointer'}}/>
            </div>
            <button onClick={()=>del(b.id)} style={{background:'none',border:'1px solid #e53935',color:'#e53935',borderRadius:6,padding:'6px 12px',cursor:'pointer',fontSize:12}}>מחק</button>
          </div>
          <div style={{fontSize:11,color:'var(--sub)',marginTop:6}}>{b.categories.reduce((s,c)=>s+c.models.length,0)} דגמים</div>
        </div>
      ))}
    </div>
    <button onClick={add} style={{width:'100%',padding:10,background:'#607d8b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:'bold',marginBottom:12}}>+ הוסף מותג</button>
    <div style={{display:'flex',gap:8}}>
      <button onClick={()=>onSave(brands)} style={{flex:1,...BPr('#1565c0')}}>✓ שמור</button>
      <button onClick={onClose} style={{flex:1,...BST}}>ביטול</button>
    </div>
  </Modal>);
}

// ══════════ CHANGE PWD ══════════
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
      {allCols.map(c=>{const on=wd.includes(c.id);return(<div key={c.id} onClick={()=>setWd(p=>on?p.filter(x=>x!==c.id):[...p,c.id])} style={{padding:'6px 12px',borderRadius:8,border:`2px solid ${on?'#1565c0':'var(--border)'}`,background:on?'#e3f2fd':'var(--ibg)',cursor:'pointer',fontSize:12,color:'var(--text)',userSelect:'none'}}>{on?'✓ ':''}{c.name}</div>);
      })}
    </div>
    <div style={{fontWeight:'bold',fontSize:14,color:'var(--sub)',marginBottom:10,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>🏠 מסך כניסה</div>
    {[['כותרת ראשית',wt,setWt,'textarea'],['כותרת משנה',ws,setWs,'input'],['הודעת אחריות/הצהרה',disc,setDisc,'textarea']].map(([l,v,s,t])=>(
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
