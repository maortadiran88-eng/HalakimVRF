const db = window._db;

// ── Core catalog ──
async function fbLoad() {
  const md = await db.collection('catalog').doc('meta').get();
  if (!md.exists) return null;
  const d = md.data().d;
  const mids = [];
  d.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => mids.push(m.id))));
  if (!mids.length) return d;
  const chunks = [];
  for (let i = 0; i < mids.length; i += 20) chunks.push(mids.slice(i, i + 20));
  const allD = [];
  for (const ch of chunks) {
    const docs = await Promise.all(ch.map(id => db.collection('parts').doc(id).get()));
    allD.push(...docs);
  }
  const pm = {};
  allD.forEach(doc => { if (doc.exists) pm[doc.id] = doc.data(); });
  d.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => {
    const pd = pm[m.id] || {};
    m.parts    = (pd.parts   || []).map(p => ({discontinued:false,tags:'',pinned:false,comments:[],...p}));
    m.images   = pd.images   || [];
    m.columns  = pd.columns  || DCOLS();
    m.synonyms = pd.synonyms || [];
    m.notes    = pd.notes    || '';
  })));
  return d;
}

async function fbSave(data, mids) {
  const meta = {
    pass:data.pass, editorPass:data.editorPass, viewerPass:data.viewerPass,
    waDefaults:data.waDefaults||['nameHe','tadPn'],
    welcomeTitle:data.welcomeTitle, welcomeSub:data.welcomeSub,
    disclaimer:data.disclaimer, tips:data.tips||[],
    greetings:data.greetings||null,
    systemMsg:data.systemMsg||null,
    brands:data.brands.map(b=>({...b,categories:b.categories.map(c=>({...c,models:c.models.map(m=>({id:m.id,name:m.name}))}))}))
  };
  await db.collection('catalog').doc('meta').set({d:meta});
  const batch = db.batch();
  data.brands.forEach(b=>b.categories.forEach(c=>c.models.forEach(m=>{
    if (!mids.has(m.id)) return;
    batch.set(db.collection('parts').doc(m.id),{
      parts:m.parts||[], images:m.images||[], columns:m.columns||DCOLS(),
      synonyms:m.synonyms||[], notes:m.notes||''
    });
  })));
  await batch.commit();
}

// ── Activity log ──
async function fbHist(e) {
  try { await db.collection('history').add({...e, ts:firebase.firestore.FieldValue.serverTimestamp()}); } catch {}
}
async function fbGetHist() {
  try {
    const s = await db.collection('history').orderBy('ts','desc').limit(200).get();
    return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));
  } catch { return []; }
}

// ── News ──
async function fbAddNews(text) { return db.collection('news').add({text,ts:firebase.firestore.FieldValue.serverTimestamp()}); }
async function fbGetNews() {
  try {
    const s = await db.collection('news').orderBy('ts','desc').limit(30).get();
    return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));
  } catch { return []; }
}
async function fbDeleteNews(id) { return db.collection('news').doc(id).delete(); }

// ── Reports ──
async function fbSaveReport(r) { return db.collection('reports').add({...r,ts:firebase.firestore.FieldValue.serverTimestamp(),resolved:false}); }
async function fbGetReports() {
  try {
    const s = await db.collection('reports').orderBy('ts','desc').limit(100).get();
    return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));
  } catch { return []; }
}
async function fbResolveReport(id) { return db.collection('reports').doc(id).update({resolved:true}); }

// ── Technician requests ──
async function fbSaveTechRequest(r) { return db.collection('techRequests').add({...r,ts:firebase.firestore.FieldValue.serverTimestamp(),resolved:false}); }
async function fbGetTechRequests() {
  try {
    const s = await db.collection('techRequests').orderBy('ts','desc').limit(100).get();
    return s.docs.map(d=>({id:d.id,...d.data(),ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));
  } catch { return []; }
}
async function fbResolveTechRequest(id) { return db.collection('techRequests').doc(id).update({resolved:true}); }

// ── System broadcast message ──
async function fbSetBroadcast(msg) {
  return db.collection('system').doc('broadcast').set({msg, ts:firebase.firestore.FieldValue.serverTimestamp(), active:!!msg});
}
async function fbGetBroadcast() {
  try {
    const d = await db.collection('system').doc('broadcast').get();
    if (!d.exists || !d.data().active) return null;
    return d.data();
  } catch { return null; }
}

// ── Version snapshots (last 10 full saves) ──
async function fbSaveSnapshot(data, actor, action) {
  try {
    const snap = {
      actor, action,
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      brands: JSON.stringify(data.brands)   // compact store
    };
    const col = db.collection('snapshots');
    await col.add(snap);
    // Keep only last 10
    const all = await col.orderBy('ts','desc').get();
    if (all.docs.length > 10) {
      const toDelete = all.docs.slice(10);
      await Promise.all(toDelete.map(d=>d.ref.delete()));
    }
  } catch {}
}
async function fbGetSnapshots() {
  try {
    const s = await db.collection('snapshots').orderBy('ts','desc').limit(10).get();
    return s.docs.map(d=>({id:d.id,...d.data(),brands:undefined,ts:d.data().ts?.toDate?.()?.toLocaleString('he-IL')||''}));
  } catch { return []; }
}
async function fbRestoreSnapshot(snapId) {
  const doc = await db.collection('snapshots').doc(snapId).get();
  if (!doc.exists) throw new Error('לא נמצא');
  return JSON.parse(doc.data().brands);
}

// ── Page view tracking (for dashboard) ──
async function fbTrackView(mid, modelName, brandName) {
  try {
    const ref = db.collection('views').doc(mid);
    const d = await ref.get();
    if (d.exists) await ref.update({count: (d.data().count||0)+1, modelName, brandName, lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
    else await ref.set({count:1, modelName, brandName, lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
  } catch {}
}
async function fbGetTopViews() {
  try {
    const s = await db.collection('views').orderBy('count','desc').limit(20).get();
    return s.docs.map(d=>({id:d.id,...d.data()}));
  } catch { return []; }
}
