// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let scanRunning    = false;
let countdownTimer = null;
let prevData       = {};
let stockData      = {};
let alerts         = [];
let currentFilter  = 'all';
let sortCol        = 'sym';
let sortAsc        = true;
let currentTimeframe = 'daily';
let currentUniverse  = null;
let soundEnabled     = true;
let isDark           = true;
let revenueCache     = {};   // { sym: { growth, quarters, fetchedAt } }
let fmpApiKey        = '';   // Financial Modeling Prep API key

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function getMaPeriod() { return Math.max(2, parseInt(document.getElementById('maInput').value) || 150); }
function getInterval()  { return parseInt(document.getElementById('intervalSelect').value) || 300; }
function getNearPct()   { return parseFloat(document.getElementById('nearPct').value) || 1.5; }
function getTimeframe() { return currentTimeframe; }
function fmtPrice(p)    { return (p != null && !isNaN(p)) ? '$' + p.toFixed(2) : '—'; }
function fmtPct(p)      { return (p != null && !isNaN(p)) ? (p >= 0 ? '+' : '') + p.toFixed(2) + '%' : '—'; }
function fmtTime()      { return new Date().toLocaleTimeString('he-IL'); }
function fmtVol(v)      {
  if (!v || isNaN(v)) return '—';
  if (v >= 1e9) return (v/1e9).toFixed(1)+'B';
  if (v >= 1e6) return (v/1e6).toFixed(1)+'M';
  if (v >= 1e3) return (v/1e3).toFixed(0)+'K';
  return v.toString();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getActiveList() {
  if (!currentUniverse || !UNIVERSES[currentUniverse]) return null;
  return UNIVERSES[currentUniverse].list();
}

function getFmpKey() {
  return document.getElementById('fmpKeyInput')?.value?.trim() || fmpApiKey || '';
}

function saveFmpKey() {
  fmpApiKey = getFmpKey();
  try { localStorage.setItem('sma_fmp_key', fmpApiKey); } catch(e) {}
  const el = document.getElementById('fmpKeyStatus');
  if (el) {
    el.textContent = fmpApiKey ? '✓ API Key נשמר' : '';
    el.style.color = 'var(--green)';
    setTimeout(() => { if (el) el.textContent = ''; }, 2500);
  }
}

function loadFmpKey() {
  try {
    const k = localStorage.getItem('sma_fmp_key') || '';
    fmpApiKey = k;
    const inp = document.getElementById('fmpKeyInput');
    if (inp && k) inp.value = k;
  } catch(e) {}
}

// ─────────────────────────────────────────────
// FETCH REVENUE GROWTH (FMP)
// Fetches last 4 quarterly revenue reports
// Returns array of YoY growth % per quarter
// ─────────────────────────────────────────────
async function fetchRevenueGrowth(sym) {
  const key = getFmpKey();
  if (!key) return null;

  // Use cache (valid for 24h)
  const cached = revenueCache[sym];
  if (cached && Date.now() - cached.fetchedAt < 86400000) return cached;

  const url = `https://financialmodelingprep.com/api/v3/income-statement/${encodeURIComponent(sym)}?period=quarter&limit=8&apikey=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('FMP HTTP ' + res.status);
  const data = await res.json();

  if (!Array.isArray(data) || data.length < 5) return null;

  // data[0] = most recent quarter, data[4] = same quarter 1 year ago
  // Calculate YoY growth for last 4 quarters
  const quarters = [];
  for (let i = 0; i < 4; i++) {
    const curr = data[i];
    const prev = data[i + 4];
    if (!curr || !prev || !prev.revenue || prev.revenue === 0) continue;
    const growth = ((curr.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100;
    quarters.push({
      date:   curr.date?.substring(0, 7) || '',   // "2024-03"
      growth: parseFloat(growth.toFixed(1)),
      rev:    curr.revenue
    });
  }

  if (!quarters.length) return null;

  // Average growth over available quarters
  const avgGrowth = quarters.reduce((s, q) => s + q.growth, 0) / quarters.length;
  const result = { quarters, avgGrowth: parseFloat(avgGrowth.toFixed(1)), fetchedAt: Date.now() };
  revenueCache[sym] = result;
  return result;
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      universe: currentUniverse,
      timeframe: currentTimeframe,
      maPeriod: getMaPeriod(),
      nearPct: getNearPct(),
      interval: getInterval(),
      isDark,
      soundEnabled,
      savedAt: new Date().toLocaleString('he-IL')
    }));
  } catch(e) {}
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return null; }
}

function applySettings(s) {
  if (!s) return;
  // timeframe
  currentTimeframe = s.timeframe || 'daily';
  document.getElementById('tfDaily').classList.toggle('active',  currentTimeframe === 'daily');
  document.getElementById('tfWeekly').classList.toggle('active', currentTimeframe === 'weekly');
  // MA period
  if (s.maPeriod) document.getElementById('maInput').value = s.maPeriod;
  // near %
  if (s.nearPct) document.getElementById('nearPct').value = s.nearPct;
  // interval
  if (s.interval) {
    const sel = document.getElementById('intervalSelect');
    for (const opt of sel.options) {
      if (parseInt(opt.value) === s.interval) { opt.selected = true; break; }
    }
  }
  // universe
  if (s.universe && UNIVERSES[s.universe]) {
    currentUniverse = s.universe;
    document.querySelectorAll('.univ-btn').forEach(b => b.classList.remove('active-sp','active-nq'));
    const btn = document.getElementById('u' + s.universe);
    if (btn) {
      btn.classList.add(s.universe.startsWith('NQ') ? 'active-nq' : 'active-sp');
      document.getElementById('univInfo').textContent = UNIVERSES[s.universe].label;
      document.getElementById('univInfo').style.color = UNIVERSES[s.universe].color;
    }
  }
  // theme
  if (s.isDark === false) { isDark = false; document.body.classList.add('light'); document.getElementById('themeBtn').textContent = '☀️ בהיר'; }
  // sound
  soundEnabled = s.soundEnabled !== false;
  updateSoundBtn();
  updateConfigDisplay();
}

function showRestoreToast(s) {
  if (!s) return;
  const univLabel = s.universe ? (UNIVERSES[s.universe]?.label || s.universe) : '—';
  const toast = document.createElement('div');
  toast.id = 'sessionToast';
  toast.className = 'session-toast';
  toast.innerHTML = `
    <h4>📂 הגדרות אחרונות</h4>
    <p>
      📊 ${univLabel}<br>
      📈 ${s.timeframe === 'weekly' ? 'שבועי' : 'יומי'} · SMA${s.maPeriod}<br>
      ⚡ קרוב ל-SMA: ${s.nearPct}%<br>
      🕐 ${s.savedAt || ''}
    </p>
    <div class="toast-btns">
      <button class="toast-btn restore" onclick="restoreSession()">✓ שחזר</button>
      <button class="toast-btn dismiss" onclick="dismissToast()">✗ סגור</button>
    </div>`;
  document.body.appendChild(toast);
}

function restoreSession() {
  applySettings(loadSettings());
  dismissToast();
}
function dismissToast() {
  const t = document.getElementById('sessionToast');
  if (t) t.remove();
}

// ─────────────────────────────────────────────
// THEME & SOUND
// ─────────────────────────────────────────────
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('light', !isDark);
  document.getElementById('themeBtn').textContent = isDark ? '🌙 כהה' : '☀️ בהיר';
  saveSettings();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundBtn();
  saveSettings();
}

function updateSoundBtn() {
  const btn = document.getElementById('soundBtn');
  if (!btn) return;
  btn.textContent   = soundEnabled ? '🔔 קול' : '🔕 שקט';
  btn.style.color   = soundEnabled ? 'var(--green)' : 'var(--muted)';
  btn.style.borderColor = soundEnabled ? 'rgba(0,255,136,0.4)' : 'var(--border)';
}

function playBeep(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'buy') {
      [[523,0],[659,0.18],[784,0.36]].forEach(([freq, delay]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = freq; o.type = 'sine';
        const t = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.start(t); o.stop(t + 0.35);
      });
    } else if (type === 'hist') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 660; o.type = 'sine';
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      o.start(); o.stop(ctx.currentTime + 0.55);
    } else {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = type === 'up' ? 880 : 440; o.type = 'sine';
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(); o.stop(ctx.currentTime + 0.3);
    }
  } catch(e) {}
}

// ─────────────────────────────────────────────
// CONFIG DISPLAY
// ─────────────────────────────────────────────
function updateConfigDisplay() {
  const mp = getMaPeriod();
  const tf = currentTimeframe === 'weekly' ? 'שבועי' : 'יומי';
  const tfEn = currentTimeframe === 'weekly' ? 'Weekly' : 'Daily';
  const el = document.getElementById('activeConfig');
  if (el) el.textContent = tf + ' · SMA' + mp;
  const hm = document.getElementById('headerMa');
  if (hm) hm.textContent = mp;
  const ht = document.getElementById('headerTf');
  if (ht) ht.textContent = tfEn;
  const ml = document.getElementById('maLabel');
  if (ml) ml.textContent = mp;
}

function setTimeframe(tf, btn) {
  currentTimeframe = tf;
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateConfigDisplay();
  saveSettings();
}

function applyPreset(tf, period) {
  currentTimeframe = tf;
  document.getElementById('maInput').value = period;
  document.getElementById('tfDaily').classList.toggle('active',  tf === 'daily');
  document.getElementById('tfWeekly').classList.toggle('active', tf === 'weekly');
  updateConfigDisplay();
  saveSettings();
  if (scanRunning) { stockData = {}; prevData = {}; }
}

function onSettingChange() {
  updateConfigDisplay();
  saveSettings();
  if (scanRunning) { stockData = {}; prevData = {}; }
}

function setUniverse(key, btn) {
  currentUniverse = key;
  const univ = UNIVERSES[key];
  document.querySelectorAll('.univ-btn').forEach(b => b.classList.remove('active-sp','active-nq'));
  btn.classList.add(key.startsWith('NQ') ? 'active-nq' : 'active-sp');
  document.getElementById('univInfo').textContent = univ.label;
  document.getElementById('univInfo').style.color = univ.color;
  stockData = {}; prevData = {};
  saveSettings();
  renderTable();
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTable();
}

function setSortCol(col) {
  sortAsc = (sortCol === col) ? !sortAsc : true;
  sortCol = col;
  renderTable();
}

// ─────────────────────────────────────────────
// FETCH STOCK DATA
// ─────────────────────────────────────────────
async function fetchStock(sym, name) {
  const maPeriod = getMaPeriod();
  const tf       = getTimeframe();
  const interval = tf === 'weekly' ? '1wk' : '1d';
  const range    = tf === 'weekly'
    ? (maPeriod <= 52 ? '2y' : maPeriod <= 104 ? '3y' : '5y')
    : (maPeriod <= 100 ? '1y' : '2y');

  const url   = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('no data');

  const meta    = result.meta;
  const quote   = result.indicators?.quote?.[0] || {};
  const closes  = quote.close  || [];
  const volumes = quote.volume || [];

  const price     = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const changePct = (price && prevClose) ? ((price - prevClose) / prevClose) * 100 : 0;

  // SMA
  const valid = closes.filter(c => c != null && c > 0 && isFinite(c));
  const slice = valid.slice(-maPeriod);
  const ma    = (slice.length >= Math.min(maPeriod, 5))
    ? slice.reduce((a, b) => a + b, 0) / slice.length
    : null;

  // Slope: compare current MA vs MA from lookback candles ago
  let maSlope = null, maSlopePct = null;
  const lb = tf === 'weekly' ? 3 : 5;
  if (ma && valid.length >= maPeriod + lb) {
    const prevSlice = valid.slice(-(maPeriod + lb), -lb);
    const maPrev    = prevSlice.reduce((a, b) => a + b, 0) / prevSlice.length;
    maSlopePct = ((ma - maPrev) / maPrev) * 100;
    maSlope = maSlopePct > 0.1 ? 'up' : maSlopePct < -0.1 ? 'down' : 'flat';
  }

  // Volume
  const currentVol = meta.regularMarketVolume || volumes.filter(Boolean).slice(-1)[0] || 0;
  const validVols  = volumes.filter(v => v > 0);
  const avgVol20   = validVols.length >= 5
    ? validVols.slice(-20).reduce((a, b) => a + b, 0) / Math.min(validVols.length, 20)
    : 0;
  const volRatio  = avgVol20 > 0 ? currentVol / avgVol20 : null;
  const volStatus = volRatio == null ? null : volRatio >= 1.5 ? 'high' : volRatio < 0.5 ? 'low' : 'normal';

  return { sym, name, price, changePct, ma, maSlope, maSlopePct,
           currentVol, avgVol20, volRatio, volStatus,
           validCloses: valid, tf, maPeriod };
}

// ─────────────────────────────────────────────
// CROSSOVER DETECTION
// ─────────────────────────────────────────────
function detectLiveCross(sym, newPrice, newMa) {
  const prev = prevData[sym];
  if (!prev || !newMa || !prev.ma) return null;
  if (prev.price < prev.ma && newPrice >= newMa) return 'up';
  if (prev.price > prev.ma && newPrice <= newMa) return 'down';
  return null;
}

// Check last 2 candles historically
function detectHistCross(validCloses, maPeriod) {
  if (validCloses.length < maPeriod + 4) return null;

  const computeMA = (offset) => {
    const sl = validCloses.slice(-(maPeriod + offset), offset === 0 ? undefined : -offset);
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  };

  // prices: index 0=3ago, 1=2ago, 2=1ago, 3=last
  const n  = validCloses.length;
  const p  = [validCloses[n-4], validCloses[n-3], validCloses[n-2], validCloses[n-1]];
  const ma = [computeMA(3),     computeMA(2),     computeMA(1),     computeMA(0)];

  // 1 candle ago cross
  if (p[1] != null && p[2] != null) {
    if (p[1] < ma[1] && p[2] >= ma[2]) return { type: 'up',   candlesAgo: 1 };
    if (p[1] > ma[1] && p[2] <= ma[2]) return { type: 'down', candlesAgo: 1 };
  }
  // 2 candles ago cross
  if (p[0] != null && p[1] != null) {
    if (p[0] < ma[0] && p[1] >= ma[1]) return { type: 'up',   candlesAgo: 2 };
    if (p[0] > ma[0] && p[1] <= ma[1]) return { type: 'down', candlesAgo: 2 };
  }
  return null;
}

// BUY SIGNAL: cross-up + MA not falling + price close enough to MA
function isBuySignal(crossType, maSlope, price, ma, candlesAgo) {
  if (crossType !== 'up') return false;
  if (!ma || !maSlope || maSlope === 'down') return false;
  const nearPct   = getNearPct();
  const threshold = candlesAgo > 0 ? nearPct * 2 : nearPct; // wider for historical
  const diff      = Math.abs(((price - ma) / ma) * 100);
  return diff <= threshold;
}

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────
function addAlert(sym, name, price, ma, crossType, maSlope, buySignal, volStatus, candlesAgo) {
  const tfLabel   = getTimeframe() === 'weekly' ? 'שבועי' : 'יומי';
  const mp        = getMaPeriod();
  const isHist    = candlesAgo > 0;
  const volBonus  = buySignal && volStatus === 'high';

  alerts.unshift({ sym, name, price, ma, crossType, maSlope, buySignal, volStatus,
                   volBonus, candlesAgo, isHist, tfLabel, mp, time: fmtTime() });
  if (alerts.length > 100) alerts.pop();

  document.getElementById('statCross').textContent  = alerts.length;
  document.getElementById('alertCount').textContent = alerts.length + ' התראות';
  renderAlerts();

  if (buySignal)         playBeep(isHist ? 'hist' : 'buy');
  else if (!isHist)      playBeep(crossType);

  if (Notification.permission === 'granted' && !isHist && buySignal) {
    new Notification('🟢 סיגנל קנייה: ' + sym, {
      body: 'SMA ' + (maSlope==='up'?'עולה ↗':'ישר →') + (volBonus?' 📊 נפח גבוה':'') + ' | $' + price.toFixed(2)
    });
  }
}

function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  if (!alerts.length) {
    container.innerHTML = '<div class="empty-state">אין התראות עדיין</div>';
    return;
  }
  container.innerHTML = alerts.map(a => {
    const slopeIcon = a.maSlope === 'up' ? '↗' : a.maSlope === 'flat' ? '→' : '↘';
    const slopeClr  = a.maSlope === 'up' ? 'var(--green)' : a.maSlope === 'flat' ? 'var(--amber)' : 'var(--red)';
    const crossLabel = a.crossType === 'up' ? '▲ חצה מעלה' : '▼ חצה מטה';
    const crossCls   = a.crossType === 'up' ? 'cross-up' : 'cross-down';

    let buyBadge = '';
    if (a.buySignal) {
      buyBadge = a.isHist
        ? `<span class="badge-hist">🕐 קנייה לפני ${a.candlesAgo} נרות</span>`
        : `<span class="badge-buy">🟢 קנייה (חי)</span>`;
    }
    const volBadge = a.volStatus === 'high'
      ? `<span class="badge-vol">📊 נפח גבוה</span>` : '';

    return `<div class="alert-card ${crossCls}${a.buySignal && !a.isHist ? ' alert-buy' : ''}">
      <span class="alert-badge">${crossLabel}</span>
      <span class="alert-sym">${a.sym}</span>
      <div class="alert-info">
        <span class="alert-name">${a.name}</span>
        <div class="alert-badges">${buyBadge}${volBadge}
          ${a.maSlope ? `<span style="font-size:11px;color:${slopeClr};font-family:monospace">SMA ${slopeIcon}</span>` : ''}
        </div>
      </div>
      <span class="alert-price">${fmtPrice(a.price)}</span>
      <div class="alert-ma-wrap">
        <span class="alert-ma-lbl">${a.tfLabel} SMA${a.mp}</span>
        <span class="alert-ma-val">${fmtPrice(a.ma)}</span>
      </div>
      <span class="alert-time">${a.time}</span>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
// TABLE RENDER
// ─────────────────────────────────────────────
function renderTable() {
  const nearPct = getNearPct();
  const mp      = getMaPeriod();
  const search  = (document.getElementById('searchBox')?.value || '').toUpperCase().trim();

  // update labels
  const ml = document.getElementById('maLabel');
  if (ml) ml.textContent = mp;

  let rows = Object.values(stockData).filter(d => d.price != null);

  // search
  if (search) rows = rows.filter(d => d.sym.includes(search) || d.name.toUpperCase().includes(search));

  // filter
  rows = rows.filter(d => {
    if (!d.ma) return currentFilter === 'all';
    const diff      = ((d.price - d.ma) / d.ma) * 100;
    const near      = Math.abs(diff) <= nearPct;
    const buySignal = d.crossToday && d.maSlope !== 'down' && d.price >= d.ma;
    switch (currentFilter) {
      case 'above':      return d.price >= d.ma;
      case 'below':      return d.price <  d.ma;
      case 'near':       return near;
      case 'cross':      return d.crossToday;
      case 'buy':        return buySignal;
      case 'rev-pos':    return d.revenueGrowth != null && d.revenueGrowth > 0;
      case 'rev-strong': return d.revenueGrowth != null && d.revenueGrowth >= 10;
      default:           return true;
    }
  });

  // sort
  rows.sort((a, b) => {
    let va, vb;
    switch (sortCol) {
      case 'price':  va = a.price     || 0; vb = b.price     || 0; break;
      case 'change': va = a.changePct || 0; vb = b.changePct || 0; break;
      case 'diff':
        va = (a.ma && a.price) ? ((a.price - a.ma) / a.ma * 100) : -9999;
        vb = (b.ma && b.price) ? ((b.price - b.ma) / b.ma * 100) : -9999;
        break;
      case 'vol':    va = a.volRatio  || 0; vb = b.volRatio  || 0; break;
      case 'rev':    va = a.revenueGrowth != null ? a.revenueGrowth : -9999; vb = b.revenueGrowth != null ? b.revenueGrowth : -9999; break;
      default:       va = a.sym;            vb = b.sym;
    }
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  // stats
  let upCnt = 0, dnCnt = 0, nearCnt = 0;
  Object.values(stockData).filter(d => d.price && d.ma).forEach(d => {
    const diff = Math.abs(((d.price - d.ma) / d.ma) * 100);
    if (d.price >= d.ma) upCnt++; else dnCnt++;
    if (diff <= nearPct) nearCnt++;
  });
  document.getElementById('statTotal').textContent = Object.keys(stockData).length;
  document.getElementById('statUp').textContent    = upCnt;
  document.getElementById('statDown').textContent  = dnCnt;
  document.getElementById('statNear').textContent  = nearCnt;

  const tableCount = document.getElementById('tableCount');
  if (tableCount) tableCount.textContent = rows.length + ' מניות';

  const tbody = document.getElementById('stockTable');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="loading-cell" style="text-align:center;padding:28px">
      ${Object.keys(stockData).length === 0 ? 'בחר אינדקס ולחץ התחל סריקה' : 'אין תוצאות'}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(d => {
    const changeCls = (d.changePct || 0) >= 0 ? 'up' : 'dn';
    let maCell = '—', diffCell = '—', slopeCell = '—', volCell = '—', revCell = '—', statusCell = '—';

    // Revenue growth cell
    if (d.revenueGrowth != null) {
      const g    = d.revenueGrowth;
      const clr  = g >= 10 ? 'var(--green)' : g >= 0 ? 'var(--blue)' : 'var(--red)';
      const sign = g >= 0 ? '+' : '';
      const qs   = d.revenueQuarters || [];
      const tip  = qs.map(q => `${q.date}: ${q.growth >= 0 ? '+' : ''}${q.growth}%`).join(' | ');
      revCell = `<span style="color:${clr};font-weight:700" title="${tip}">${sign}${g.toFixed(1)}%</span>
        <div style="display:flex;gap:2px;margin-top:2px">${qs.slice(0,4).map(q => {
          const qclr = q.growth >= 10 ? 'var(--green)' : q.growth >= 0 ? 'var(--blue)' : 'var(--red)';
          const h    = Math.min(Math.abs(q.growth) / 30 * 10, 10);
          return `<div style="width:5px;height:${Math.max(h,2)}px;background:${qclr};border-radius:1px" title="${q.date}: ${q.growth}%"></div>`;
        }).join('')}</div>`;
    } else if (d.revLoading) {
      revCell = `<span style="color:var(--muted);font-size:10px">טוען...</span>`;
    } else if (!getFmpKey()) {
      revCell = `<span style="color:var(--muted);font-size:9px;letter-spacing:0">הכנס Key</span>`;
    }

    if (d.ma) {
      const diff    = ((d.price - d.ma) / d.ma) * 100;
      const near    = Math.abs(diff) <= nearPct;
      const diffCls = diff >= 0 ? 'up' : 'dn';
      maCell   = `<span class="ma-col">${fmtPrice(d.ma)}</span>`;
      diffCell = `<span class="${diffCls}">${fmtPct(diff)}</span>`;

      if (d.maSlope) {
        const icon = d.maSlope === 'up' ? '↗' : d.maSlope === 'flat' ? '→' : '↘';
        const clr  = d.maSlope === 'up' ? 'var(--green)' : d.maSlope === 'flat' ? 'var(--amber)' : 'var(--red)';
        const pct  = d.maSlopePct != null ? ` (${d.maSlopePct > 0?'+':''}${d.maSlopePct.toFixed(2)}%)` : '';
        slopeCell  = `<span style="color:${clr}">${icon} ${d.maSlope==='up'?'עולה':d.maSlope==='flat'?'ישר':'יורד'}</span><span style="color:var(--muted);font-size:10px">${pct}</span>`;
      }

      if (d.volRatio != null) {
        const pct = Math.min(d.volRatio / 2, 1) * 100;
        const cls = d.volStatus || 'normal';
        const lbl = d.volRatio.toFixed(1) + 'x';
        const clr = d.volStatus === 'high' ? 'var(--green)' : d.volStatus === 'low' ? 'var(--muted)' : 'var(--blue)';
        volCell = `<div style="display:flex;align-items:center;gap:5px;min-width:70px">
          <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${clr};border-radius:3px"></div>
          </div>
          <span style="font-family:monospace;font-size:10px;color:${clr}">${lbl}</span>
        </div>`;
      }

      const isLiveBuy = d.crossToday && d.maSlope !== 'down' && near && d.price >= d.ma && !d.candlesAgo;
      const isHistBuy = d.crossToday && d.maSlope !== 'down' && d.price >= d.ma && d.candlesAgo > 0;
      const nearTag   = near ? '<span class="near-badge">קרוב!</span>' : '';
      const buyTag    = isLiveBuy
        ? '<span class="badge-buy" style="font-size:9px;padding:2px 5px">🟢 חי</span> '
        : isHistBuy
          ? `<span class="badge-hist" style="font-size:9px;padding:2px 5px">🕐 ${d.candlesAgo}נ׳</span> `
          : '';

      statusCell = (d.price >= d.ma)
        ? `${buyTag}${nearTag}<span class="up">▲ מעל</span>`
        : `${nearTag}<span class="dn">▼ מתחת</span>`;
      if (d.crossToday && !isLiveBuy && !isHistBuy) statusCell += ' <span style="color:var(--amber)">🔔</span>';

      // row highlight
      var rowBg = '';
      if (isLiveBuy) rowBg = 'background:rgba(0,255,136,0.05)';
      else if (isHistBuy) rowBg = 'background:rgba(255,184,0,0.04)';

      return `<tr style="${rowBg}">
        <td class="sym-cell">${d.sym}</td>
        <td class="name-cell">${d.name}</td>
        <td>${fmtPrice(d.price)}</td>
        <td class="${changeCls}">${fmtPct(d.changePct)}</td>
        <td>${maCell}</td>
        <td>${diffCell}</td>
        <td>${slopeCell}</td>
        <td>${volCell}</td>
        <td>${revCell}</td>
        <td>${statusCell}</td>
        <td style="color:var(--muted);font-size:10px">${d.updatedAt || '—'}</td>
      </tr>`;
    }

    return `<tr>
      <td class="sym-cell">${d.sym}</td>
      <td class="name-cell">${d.name}</td>
      <td>${fmtPrice(d.price)}</td>
      <td class="${changeCls}">${fmtPct(d.changePct)}</td>
      <td colspan="7" class="loading-cell">טוען...</td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────────
// SCAN ENGINE
// ─────────────────────────────────────────────
async function runScan() {
  const dot      = document.getElementById('statusDot');
  const statusEl = document.getElementById('statusText');
  const label    = document.getElementById('progressLabel');
  const bgEl     = document.getElementById('progressBg');
  const bar      = document.getElementById('progressBar');

  dot.className = 'dot scanning';
  if (label) { label.style.display = 'block'; }
  if (bgEl)  { bgEl.style.display  = 'block'; }

  const list = getActiveList();
  if (!list) { dot.className = 'dot'; return; }

  const total = list.length;
  let done = 0;

  for (const [sym, name] of list) {
    if (!scanRunning) break;

    if (label) label.textContent = `סורק ${done+1}/${total}: ${sym}`;
    if (bar)   bar.style.width   = `${((done+1)/total)*100}%`;

    try {
      const d         = await fetchStock(sym, name);
      const isFirst   = !prevData[sym];
      let crossType   = null, candlesAgo = 0, buySignal = false;

      if (isFirst) {
        const hist = detectHistCross(d.validCloses, d.maPeriod);
        if (hist && hist.type === 'up') {
          crossType  = hist.type;
          candlesAgo = hist.candlesAgo;
          buySignal  = isBuySignal(crossType, d.maSlope, d.price, d.ma, candlesAgo);
          addAlert(sym, name, d.price, d.ma, crossType, d.maSlope, buySignal, d.volStatus, candlesAgo);
        }
      } else {
        crossType = detectLiveCross(sym, d.price, d.ma);
        if (crossType) {
          buySignal = isBuySignal(crossType, d.maSlope, d.price, d.ma, 0);
          addAlert(sym, name, d.price, d.ma, crossType, d.maSlope, buySignal, d.volStatus, 0);
        }
      }

      prevData[sym] = { price: d.price, ma: d.ma };
      stockData[sym] = {
        ...d,
        crossToday:      !!crossType || stockData[sym]?.crossToday,
        candlesAgo:      crossType ? candlesAgo : (stockData[sym]?.candlesAgo || 0),
        buySignalActive: buySignal,
        revenueGrowth:   stockData[sym]?.revenueGrowth ?? null,
        revenueQuarters: stockData[sym]?.revenueQuarters ?? null,
        revLoading:      getFmpKey() && stockData[sym]?.revenueGrowth == null,
        updatedAt:       fmtTime()
      };

      // Fetch revenue in background (non-blocking) if FMP key is set
      if (getFmpKey() && stockData[sym].revenueGrowth == null) {
        fetchRevenueGrowth(sym).then(rev => {
          if (rev && stockData[sym]) {
            stockData[sym].revenueGrowth   = rev.avgGrowth;
            stockData[sym].revenueQuarters = rev.quarters;
            stockData[sym].revLoading      = false;
            renderTable();
          }
        }).catch(() => {
          if (stockData[sym]) { stockData[sym].revLoading = false; }
        });
      }
    } catch(e) {
      if (!stockData[sym]) {
        stockData[sym] = { sym, name, price: null, changePct: null, ma: null,
                           maSlope: null, maSlopePct: null, volRatio: null,
                           volStatus: null, crossToday: false, updatedAt: 'שגיאה' };
      }
    }

    done++;
    if (done % 8 === 0 || done === total) renderTable();
    await sleep(380);
  }

  if (label) label.style.display = 'none';
  if (bgEl)  { bgEl.style.display = 'none'; if (bar) bar.style.width = '0%'; }
  dot.className = 'dot live';

  const tfLbl = currentTimeframe === 'weekly' ? 'שבועי' : 'יומי';
  statusEl.textContent = `הושלם · ${fmtTime()} · ${done} מניות · ${tfLbl} SMA${getMaPeriod()}`;
  renderTable();
  if (scanRunning) startCountdown();
}

function startCountdown() {
  clearInterval(countdownTimer);
  let remaining = getInterval();
  const el = document.getElementById('nextScanText');
  countdownTimer = setInterval(() => {
    remaining--;
    if (el) el.textContent = `סריקה הבאה בעוד ${remaining} שנ׳`;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      if (el) el.textContent = '';
      if (scanRunning) runScan();
    }
  }, 1000);
}

// ─────────────────────────────────────────────
// START / STOP
// ─────────────────────────────────────────────
function startScanner() {
  if (!currentUniverse) {
    alert('בחר תחילה איזה אינדקס לסרוק');
    return;
  }
  if (Notification.permission === 'default') Notification.requestPermission();
  scanRunning = true;
  stockData = {}; prevData = {};
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display  = 'inline-block';
  const tfLbl = currentTimeframe === 'weekly' ? 'שבועי' : 'יומי';
  document.getElementById('statusText').textContent = `סורק ${UNIVERSES[currentUniverse].label} · ${tfLbl} SMA${getMaPeriod()}...`;
  updateConfigDisplay();
  runScan();
}

function stopScanner() {
  scanRunning = false;
  clearInterval(countdownTimer);
  document.getElementById('startBtn').style.display = 'inline-block';
  document.getElementById('stopBtn').style.display  = 'none';
  document.getElementById('statusDot').className    = 'dot';
  document.getElementById('statusText').textContent = 'עצור';
  document.getElementById('nextScanText').textContent = '';
  const bgEl = document.getElementById('progressBg');
  if (bgEl) bgEl.style.display = 'none';
}

function clearAlerts() {
  alerts = [];
  document.getElementById('statCross').textContent  = '0';
  document.getElementById('alertCount').textContent = '0 התראות';
  Object.values(stockData).forEach(d => { d.crossToday = false; d.candlesAgo = 0; });
  renderAlerts();
  renderTable();
}

// ─────────────────────────────────────────────
// HELP MODAL
// ─────────────────────────────────────────────
function openHelp() {
  document.getElementById('helpModal').style.display   = 'flex';
  document.getElementById('helpOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeHelp() {
  document.getElementById('helpModal').style.display   = 'none';
  document.getElementById('helpOverlay').style.display = 'none';
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHelp(); });

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
(function init() {
  updateConfigDisplay();
  updateSoundBtn();
  loadFmpKey();
  renderAlerts();
  renderTable();
  const saved = loadSettings();
  if (saved) showRestoreToast(saved);
})();
