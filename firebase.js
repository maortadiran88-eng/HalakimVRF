const db = window._db;

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
    m.parts    = (pd.parts   || []).map(p => ({discontinued:false, tags:'', pinned:false, comments:[], ...p}));
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
    waDefaults:data.waDefaults || ['nameHe','tadPn'],
    welcomeTitle:data.welcomeTitle, welcomeSub:data.welcomeSub, disclaimer:data.disclaimer,
    tips: data.tips || [],
    brands:data.brands.map(b => ({
      ...b,
      categories: b.categories.map(c => ({
        ...c,
        models: c.models.map(m => ({id:m.id, name:m.name}))
      }))
    }))
  };
  await db.collection('catalog').doc('meta').set({d: meta});
  const batch = db.batch();
  data.brands.forEach(b => b.categories.forEach(c => c.models.forEach(m => {
    if (!mids.has(m.id)) return;
    batch.set(db.collection('parts').doc(m.id), {
      parts:    m.parts    || [],
      images:   m.images   || [],
      columns:  m.columns  || DCOLS(),
      synonyms: m.synonyms || [],
      notes:    m.notes    || ''
    });
  })));
  await batch.commit();
}

async function fbHist(e) {
  try { await db.collection('history').add({...e, ts: firebase.firestore.FieldValue.serverTimestamp()}); } catch {}
}
async function fbGetHist() {
  try {
    const s = await db.collection('history').orderBy('ts','desc').limit(60).get();
    return s.docs.map(d => ({id:d.id, ...d.data(), ts: d.data().ts?.toDate?.()?.toLocaleString('he-IL') || ''}));
  } catch { return []; }
}

// ── News ticker ──
async function fbAddNews(text) {
  return db.collection('news').add({text, ts: firebase.firestore.FieldValue.serverTimestamp()});
}
async function fbGetNews() {
  try {
    const s = await db.collection('news').orderBy('ts','desc').limit(30).get();
    return s.docs.map(d => ({id:d.id, ...d.data(), ts: d.data().ts?.toDate?.()?.toLocaleString('he-IL') || ''}));
  } catch { return []; }
}

// ── Reports ──
async function fbSaveReport(r) {
  return db.collection('reports').add({...r, ts: firebase.firestore.FieldValue.serverTimestamp(), resolved:false});
}
async function fbGetReports() {
  try {
    const s = await db.collection('reports').orderBy('ts','desc').limit(100).get();
    return s.docs.map(d => ({id:d.id, ...d.data(), ts: d.data().ts?.toDate?.()?.toLocaleString('he-IL') || ''}));
  } catch { return []; }
}
async function fbResolveReport(id) {
  return db.collection('reports').doc(id).update({resolved:true});
}

// ── Technician requests (missing models) ──
async function fbSaveTechRequest(r) {
  return db.collection('techRequests').add({...r, ts: firebase.firestore.FieldValue.serverTimestamp(), resolved:false});
}
async function fbGetTechRequests() {
  try {
    const s = await db.collection('techRequests').orderBy('ts','desc').limit(100).get();
    return s.docs.map(d => ({id:d.id, ...d.data(), ts: d.data().ts?.toDate?.()?.toLocaleString('he-IL') || ''}));
  } catch { return []; }
}
async function fbResolveTechRequest(id) {
  return db.collection('techRequests').doc(id).update({resolved:true});
}
