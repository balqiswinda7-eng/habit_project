'use strict';

/* ═══════════════════════════════════════════════════════
   HabitBear 2.0 — script.js (Luxury Fullpage Edition)
   ═══════════════════════════════════════════════════════ */

const MONTHS    = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_SHORT = ['S','S','R','K','J','S','M'];
const DAY_NAMES  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

/* ── State ─────────────────────────────────────────── */
let currentMonthIndex = new Date().getMonth();
let currentWeekNumber = 1;
let habitsData  = [];
let todoData    = [];
let notesData   = [];
let selectedEmoji     = '🌸';
let selectedNoteColor = 'note-yellow';
let pomoInterval  = null;
let pomoTimeLeft  = 1500;
let pomoTotalTime = 1500;
let isPomoRunning = false;
let pomoSessions  = 0;
let currentPomoMode = 'focus';

/* ── DOM refs ──────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ══════════════════════════════════════════════════════
   FULLPAGE SCROLL SYSTEM
   ══════════════════════════════════════════════════════ */
let currentPage = 0;
const TOTAL_PAGES = 4;
let isScrolling = false;
let touchStartY = 0;

function navToPage(index) {
  if (index < 0 || index >= TOTAL_PAGES) return;
  currentPage = index;

  const container = $('fullpage-container');
  const sections  = container.querySelectorAll('.fp-section');

  // Scroll the container to the target section
  sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update active states
  sections.forEach((s, i) => s.classList.toggle('is-active', i === index));

  // Update nav dots
  document.querySelectorAll('.page-dot').forEach((d, i) =>
    d.classList.toggle('active', i === index)
  );
}

function initFullpage() {
  const container = $('fullpage-container');
  if (!container) return;

  // IntersectionObserver for section activation — lower threshold on mobile
  const isMobile = window.innerWidth <= 768;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio >= (isMobile ? 0.4 : 0.5)) {
        const pageIndex = parseInt(entry.target.dataset.page);
        currentPage = pageIndex;
        entry.target.classList.add('is-active');
        document.querySelectorAll('.page-dot').forEach((d, i) =>
          d.classList.toggle('active', i === pageIndex)
        );
      }
    });
  }, { root: container, threshold: isMobile ? [0.4] : [0.5] });

  container.querySelectorAll('.fp-section').forEach(s => observer.observe(s));

  // Nav dot clicks
  document.querySelectorAll('.page-dot').forEach(dot => {
    dot.addEventListener('click', () => navToPage(parseInt(dot.dataset.target)));
  });

  // Keyboard navigation (desktop)
  document.addEventListener('keydown', e => {
    if (document.querySelector('.sheet-overlay.open')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') navToPage(currentPage + 1);
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   navToPage(currentPage - 1);
  });

  // ── Touch swipe for fullpage navigation (mobile) ──────────────────
  // Only trigger when swiping on non-scrollable areas (hero, analytics header)
  let fpTouchStartY = 0;
  let fpTouchStartX = 0;
  let fpLastScrollTop = 0;

  container.addEventListener('touchstart', e => {
    fpTouchStartY = e.touches[0].clientY;
    fpTouchStartX = e.touches[0].clientX;
    fpLastScrollTop = container.scrollTop;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    // Skip if bottom sheet is open
    if (document.querySelector('.sheet-overlay.open')) return;

    const deltaY = fpTouchStartY - e.changedTouches[0].clientY;
    const deltaX = Math.abs(fpTouchStartX - e.changedTouches[0].clientX);

    // Only respond to predominantly vertical swipes (not horizontal scroll)
    if (deltaX > Math.abs(deltaY) * 0.7) return;

    // Threshold: 40px swipe triggers page change
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

    // Check if the current section's inner div is at the edge
    const section = container.querySelectorAll('.fp-section')[currentPage];
    const inner   = section?.querySelector('.fp-inner');

    if (inner) {
      const atTop    = inner.scrollTop <= 2;
      const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2;

      if (deltaY > 0 && !atBottom) return; // swiping up but content below
      if (deltaY < 0 && !atTop) return;    // swiping down but content above
    }

    if (deltaY > 0) navToPage(currentPage + 1);
    else            navToPage(currentPage - 1);
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════
   FLOWER ANIMATIONS
   ══════════════════════════════════════════════════════ */
function createFlower() {
  const layer = $('flowersLayer');
  if (!layer) return;

  // SVG flower shapes
  const flowerSVGs = [
    // 5-petal sakura
    `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="7" rx="4" ry="7" fill="#e8a5b8" opacity="0.85" transform="rotate(0 14 14)"/>
      <ellipse cx="14" cy="7" rx="4" ry="7" fill="#d4a574" opacity="0.8" transform="rotate(72 14 14)"/>
      <ellipse cx="14" cy="7" rx="4" ry="7" fill="#e8a5b8" opacity="0.85" transform="rotate(144 14 14)"/>
      <ellipse cx="14" cy="7" rx="4" ry="7" fill="#d4a574" opacity="0.8" transform="rotate(216 14 14)"/>
      <ellipse cx="14" cy="7" rx="4" ry="7" fill="#e8a5b8" opacity="0.85" transform="rotate(288 14 14)"/>
      <circle cx="14" cy="14" r="3.5" fill="#f5ede8"/>
    </svg>`,
    // 4-petal rose
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="6" rx="4" ry="6" fill="#c97b8a" opacity="0.8" transform="rotate(0 12 12)"/>
      <ellipse cx="12" cy="6" rx="4" ry="6" fill="#b8a0d8" opacity="0.75" transform="rotate(90 12 12)"/>
      <ellipse cx="12" cy="6" rx="4" ry="6" fill="#c97b8a" opacity="0.8" transform="rotate(180 12 12)"/>
      <ellipse cx="12" cy="6" rx="4" ry="6" fill="#b8a0d8" opacity="0.75" transform="rotate(270 12 12)"/>
      <circle cx="12" cy="12" r="3" fill="#f0d9c0"/>
    </svg>`,
    // small petal
    `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#e8a5b8" opacity="0.9" transform="rotate(0 9 9)"/>
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#d4a574" opacity="0.85" transform="rotate(60 9 9)"/>
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#e8a5b8" opacity="0.9" transform="rotate(120 9 9)"/>
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#d4a574" opacity="0.85" transform="rotate(180 9 9)"/>
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#e8a5b8" opacity="0.9" transform="rotate(240 9 9)"/>
      <ellipse cx="9" cy="4.5" rx="3" ry="4.5" fill="#d4a574" opacity="0.85" transform="rotate(300 9 9)"/>
      <circle cx="9" cy="9" r="2.5" fill="#f5ede8"/>
    </svg>`,
    // leaf
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="10" rx="4" ry="9" fill="#8fbcb0" opacity="0.7" transform="rotate(20 10 10)"/>
    </svg>`,
    // star petal
    `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#f0d9c0" opacity="0.8" transform="rotate(0 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#d4a574" opacity="0.75" transform="rotate(45 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#f0d9c0" opacity="0.8" transform="rotate(90 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#d4a574" opacity="0.75" transform="rotate(135 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#f0d9c0" opacity="0.8" transform="rotate(180 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#d4a574" opacity="0.75" transform="rotate(225 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#f0d9c0" opacity="0.8" transform="rotate(270 11 11)"/>
      <ellipse cx="11" cy="5.5" rx="3" ry="5.5" fill="#d4a574" opacity="0.75" transform="rotate(315 11 11)"/>
      <circle cx="11" cy="11" r="2.8" fill="#f5ede8"/>
    </svg>`
  ];

  const flower = document.createElement('div');
  flower.className = 'flower';
  const svgIndex = Math.floor(Math.random() * flowerSVGs.length);
  flower.innerHTML = flowerSVGs[svgIndex];

  const startX = Math.random() * 100; // vw
  const startY = 100 + Math.random() * 10; // start below viewport
  const duration = 18 + Math.random() * 20; // seconds
  const delay = Math.random() * 5;
  const scale = 0.5 + Math.random() * 1.2;

  flower.style.cssText = `
    left: ${startX}vw;
    bottom: -60px;
    transform: scale(${scale});
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
  `;

  layer.appendChild(flower);

  // Remove after animation completes
  setTimeout(() => {
    if (flower.parentNode) flower.parentNode.removeChild(flower);
  }, (duration + delay + 2) * 1000);
}

function initFlowers() {
  const isMobile = window.innerWidth <= 768;
  const initialCount  = isMobile ? 4 : 8;
  const spawnInterval = isMobile ? 3500 : 2200;

  // Initial burst
  for (let i = 0; i < initialCount; i++) {
    setTimeout(createFlower, i * (isMobile ? 700 : 400));
  }
  // Continuous spawn
  setInterval(createFlower, spawnInterval);
}

/* ══════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════ */
function init() {
  updateHeroDate();
  loadAllData();
  renderMonthTabs();
  renderTracker();
  renderMiniCalendar();
  renderTodoList();
  renderNotesGrid();
  renderWeeklyChart();
  buildStreakDots();
  updateKPIs();
  bindEvents();
  initFullpage();
  initFlowers();
}

/* ══════════════════════════════════════════════════════
   DATE
   ══════════════════════════════════════════════════════ */
function updateHeroDate() {
  const now  = new Date();
  const day  = DAY_NAMES[now.getDay()];
  const date = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  if ($('heroDay'))  $('heroDay').textContent  = day;
  if ($('heroDate')) $('heroDate').textContent = date;
}

/* ══════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════ */
function loadAllData() {
  const sh = localStorage.getItem('hb2_habits');
  habitsData = sh ? JSON.parse(sh) : [
    { id:'h1', month:0, week:1, emoji:'💧', name:'Minum Air Putih 2L',  checks:[true,false,true,false,false,false,false] },
    { id:'h2', month:0, week:1, emoji:'📚', name:'Review Materi Kuliah', checks:[false,true,false,false,false,false,false] },
    { id:'h3', month:0, week:1, emoji:'🏃', name:'Olahraga 30 menit',   checks:[true,true,false,false,false,false,false] },
  ];
  if (!sh) saveHabits();

  const st = localStorage.getItem('hb2_todos');
  todoData = st ? JSON.parse(st) : [
    { id:'t1', text:'Kerjakan Tugas Basis Data 🗄️', done:false },
    { id:'t2', text:'Beli buku catatan baru', done:true },
  ];
  if (!st) saveTodos();

  const sn = localStorage.getItem('hb2_notes');
  notesData = sn ? JSON.parse(sn) : [
    { id:'n1', title:'Ide Proyek Akhir', body:'Buat aplikasi habit tracker berbasis ML...', color:'note-lavender', pinned:true,  ts: Date.now() - 86400000 },
    { id:'n2', title:'Catatan Basis Data', body:'Normalisasi tabel: 1NF, 2NF, 3NF. Contoh ERD...', color:'note-sky',      pinned:false, ts: Date.now() - 3600000  },
    { id:'n3', title:'Motivasi Hari Ini', body:'Satu langkah kecil setiap hari lebih baik dari tidak sama sekali 🌸', color:'note-mint',     pinned:false, ts: Date.now() },
  ];
  if (!sn) saveNotes();
}
function saveHabits() { localStorage.setItem('hb2_habits', JSON.stringify(habitsData)); }
function saveTodos()  { localStorage.setItem('hb2_todos',  JSON.stringify(todoData));  }
function saveNotes()  { localStorage.setItem('hb2_notes',  JSON.stringify(notesData)); }

/* ══════════════════════════════════════════════════════
   KPI
   ══════════════════════════════════════════════════════ */
function updateKPIs() {
  const active = habitsData.filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber);
  const total  = active.length * 7;
  let done = 0;
  active.forEach(h => h.checks.forEach(c => { if (c) done++; }));
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if ($('kpiHabitPct'))   $('kpiHabitPct').textContent  = pct + '%';
  if ($('kpiHabitDone'))  $('kpiHabitDone').textContent = done;
  if ($('kpiHabitTotal')) $('kpiHabitTotal').textContent= total;
  if ($('trendHabit')) {
    $('trendHabit').textContent = pct >= 70 ? '↑ Luar biasa!' : pct >= 40 ? '→ Terus semangat!' : '↓ Ayo lebih giat!';
    $('trendHabit').className = 'kpi-trend ' + (pct >= 70 ? 'trend-up' : pct >= 40 ? 'trend-flat' : 'trend-down');
  }
  const ringEl = $('ringHabit');
  if (ringEl) ringEl.style.strokeDashoffset = 113 - (113 * pct / 100);

  const tdDone  = todoData.filter(t => t.done).length;
  const tdTotal = todoData.length;
  const tdPct   = tdTotal > 0 ? Math.round((tdDone / tdTotal) * 100) : 0;
  if ($('kpiTodoPct'))  $('kpiTodoPct').textContent  = `${tdDone}/${tdTotal}`;
  if ($('todoBar'))     $('todoBar').style.width      = tdPct + '%';
  if ($('trendTodo'))   $('trendTodo').textContent    = tdPct === 100 ? '✓ Semua selesai!' : `${tdPct}% done`;

  const streak = calculateStreak();
  if ($('kpiStreak'))  $('kpiStreak').textContent  = streak;
  buildStreakDots(streak);

  if ($('kpiNotes'))       $('kpiNotes').textContent       = notesData.length;
  if ($('noteCountBadge')) $('noteCountBadge').textContent = notesData.length + ' catatan';
  const lastNote = notesData.length ? notesData.reduce((a,b) => a.ts > b.ts ? a : b) : null;
  if ($('lastNoteTime')) $('lastNoteTime').textContent = lastNote ? timeAgo(lastNote.ts) : '—';

  const pending = total - done;
  updateDonut(done, 0, pending, total);

  if ($('sheetHabitStat')) $('sheetHabitStat').textContent = pct + '%';
  if ($('sheetTodoStat'))  $('sheetTodoStat').textContent  = tdDone;
}

function calculateStreak() {
  const withChecks = habitsData.filter(h => h.checks.some(c => c));
  return withChecks.length > 0 ? Math.min(withChecks.length * 2, 7) : 0;
}

function buildStreakDots(streak) {
  const el = $('streakDots');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const d = document.createElement('div');
    d.className = 'session-dot' + (i < (streak || 0) ? ' done-dot' : '');
    el.appendChild(d);
  }
}

function updateDonut(done, skip, pending, total) {
  const circumference = 264;
  const donePct = total > 0 ? done / total : 0;
  const skipPct = total > 0 ? skip / total : 0;
  if ($('donutDone')) $('donutDone').style.strokeDashoffset = circumference * (1 - donePct);
  if ($('donutSkip')) $('donutSkip').style.strokeDashoffset = circumference - (circumference * skipPct);
  const pct = total > 0 ? Math.round((done/total)*100) : 0;
  if ($('donutPctText')) $('donutPctText').textContent = pct + '%';
  if ($('lgDone'))    $('lgDone').textContent    = done;
  if ($('lgSkip'))    $('lgSkip').textContent    = skip;
  if ($('lgPending')) $('lgPending').textContent = Math.max(pending - skip, 0);
}

/* ══════════════════════════════════════════════════════
   WEEKLY CHART
   ══════════════════════════════════════════════════════ */
function renderWeeklyChart() {
  const el = $('weeklyBarChart');
  if (!el) return;
  el.innerHTML = '';
  const colors = ['pink-bar','','mint-bar','','','pink-bar','mint-bar'];
  for (let i = 0; i < 7; i++) {
    const dayChecks = habitsData
      .filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber)
      .reduce((sum, h) => sum + (h.checks[i] ? 1 : 0), 0);
    const maxH = Math.max(habitsData.filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber).length, 1);
    const heightPct = Math.round((dayChecks / maxH) * 100);
    const col = document.createElement('div');
    col.className = 'bar-col';
    const bar = document.createElement('div');
    bar.className = 'bar-fill ' + (colors[i] || '');
    bar.style.height = Math.max(heightPct, 6) + '%';
    bar.title = `${DAYS_SHORT[i]}: ${dayChecks} habit selesai`;
    const lbl = document.createElement('div');
    lbl.className = 'bar-label';
    lbl.textContent = DAYS_SHORT[i];
    col.appendChild(bar);
    col.appendChild(lbl);
    el.appendChild(col);
  }
}

/* ══════════════════════════════════════════════════════
   MONTH TABS
   ══════════════════════════════════════════════════════ */
function renderMonthTabs() {
  const el = $('monthTabs');
  if (!el) return;
  el.innerHTML = '';
  MONTHS.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'month-btn' + (i === currentMonthIndex ? ' active' : '');
    btn.textContent = m;
    btn.addEventListener('click', () => {
      currentMonthIndex = i; currentWeekNumber = 1;
      el.querySelectorAll('.month-btn').forEach((b,bi) => b.classList.toggle('active', bi === i));
      renderTracker(); renderMiniCalendar(); updateKPIs(); renderWeeklyChart();
    });
    el.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════════════
   TRACKER
   ══════════════════════════════════════════════════════ */
function renderTracker() {
  if ($('activeMonthLabel')) $('activeMonthLabel').textContent = MONTHS[currentMonthIndex];
  if ($('currentWeekLabel')) $('currentWeekLabel').textContent = `Minggu ${currentWeekNumber}`;
  const rows = habitsData.filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber);
  const tbody = $('trackerTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (rows.length === 0) {
    if ($('emptyState')) $('emptyState').style.display = 'block';
    updateKPIs(); return;
  }
  if ($('emptyState')) $('emptyState').style.display = 'none';
  rows.forEach(habit => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.innerHTML = `<div class="habit-chip">${habit.emoji} ${escapeHtml(habit.name)}</div>`;
    tr.appendChild(tdName);
    habit.checks.forEach((checked, di) => {
      const td = document.createElement('td');
      const dot = document.createElement('div');
      dot.className = 'check-dot' + (checked ? ' checked' : '');
      dot.addEventListener('click', () => {
        habit.checks[di] = !habit.checks[di];
        dot.classList.toggle('checked');
        saveHabits(); updateKPIs(); renderWeeklyChart();
      });
      td.appendChild(dot); tr.appendChild(td);
    });
    const tdDel = document.createElement('td');
    tdDel.innerHTML = '<button class="btn-del-habit">✕</button>';
    tdDel.querySelector('button').addEventListener('click', () => {
      habitsData = habitsData.filter(h => h.id !== habit.id);
      saveHabits(); renderTracker(); updateKPIs(); renderWeeklyChart();
      showToast('Habit dihapus 🗑️');
    });
    tr.appendChild(tdDel);
    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════════════════
   MINI CALENDAR
   ══════════════════════════════════════════════════════ */
function renderMiniCalendar() {
  const el = $('miniCalendar');
  if (!el) return;
  el.innerHTML = '';
  DAYS_SHORT.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-head'; h.textContent = d;
    el.appendChild(h);
  });
  const year = 2026;
  const today = new Date();
  const firstDayIdx = new Date(year, currentMonthIndex, 1).getDay();
  const offset = firstDayIdx === 0 ? 6 : firstDayIdx - 1;
  const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();
  for (let x = 0; x < offset; x++) {
    const em = document.createElement('div'); em.className = 'cal-date empty'; el.appendChild(em);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const slot = offset + day;
    let week = Math.ceil(slot / 7); if (week > 4) week = 4;
    const div = document.createElement('div');
    div.className = 'cal-date real-date';
    div.textContent = day;
    if (week === currentWeekNumber) div.classList.add('active-week');
    const isToday = today.getFullYear() === year && today.getMonth() === currentMonthIndex && today.getDate() === day;
    if (isToday) div.classList.add('today');
    div.addEventListener('click', () => {
      currentWeekNumber = week;
      renderTracker(); renderMiniCalendar(); updateKPIs(); renderWeeklyChart();
    });
    el.appendChild(div);
  }
}

/* ══════════════════════════════════════════════════════
   TODO
   ══════════════════════════════════════════════════════ */
function renderTodoList() {
  const ul = $('todoList');
  if (!ul) return;
  ul.innerHTML = '';
  if (todoData.length === 0) {
    ul.innerHTML = '<li style="text-align:center;color:var(--text-3);font-size:0.78rem;padding:10px">Belum ada rencana hari ini! 🌸</li>';
    updateKPIs(); return;
  }
  todoData.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.innerHTML = `
      <div class="todo-left">
        <div class="todo-checkbox"></div>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
      </div>
      <button class="btn-del-todo">✕</button>
    `;
    li.querySelector('.todo-left').addEventListener('click', () => {
      todo.done = !todo.done; li.classList.toggle('done');
      saveTodos(); updateKPIs();
    });
    li.querySelector('.btn-del-todo').addEventListener('click', e => {
      e.stopPropagation();
      todoData = todoData.filter(t => t.id !== todo.id);
      saveTodos(); renderTodoList();
    });
    ul.appendChild(li);
  });
}

function addTodo() {
  const inp = $('todoInput'); if (!inp) return;
  const text = inp.value.trim(); if (!text) return;
  todoData.push({ id: 't-' + Date.now().toString(36), text, done: false });
  saveTodos(); inp.value = ''; renderTodoList();
}

function addHabit() {
  const inp = $('habitInput'); if (!inp) return;
  const name = inp.value.trim(); if (!name) return;
  habitsData.push({ id: 'h-' + Date.now().toString(36), month: currentMonthIndex, week: currentWeekNumber, emoji: selectedEmoji, name, checks: [false,false,false,false,false,false,false] });
  saveHabits(); inp.value = ''; renderTracker(); updateKPIs(); renderWeeklyChart();
  showToast('🌸 Habit baru ditambahkan!');
}

/* ══════════════════════════════════════════════════════
   NOTES
   ══════════════════════════════════════════════════════ */
function renderNotesGrid() {
  const grid = $('notesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const sorted = [...notesData].sort((a,b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return b.ts - a.ts;
  });
  sorted.forEach(note => grid.appendChild(buildNoteCard(note)));
  const addCard = document.createElement('div');
  addCard.className = 'note-add-card';
  addCard.innerHTML = '<div style="font-size:1.5rem">🌸</div><span>Catatan baru</span>';
  addCard.addEventListener('click', () => createNewNote());
  grid.appendChild(addCard);
  updateKPIs();
}

function buildNoteCard(note) {
  const card = document.createElement('div');
  card.className = `note-card ${note.color}`;
  card.dataset.id = note.id;
  card.innerHTML = `
    <div class="note-header">
      <input class="note-title-input" placeholder="Judul..." value="${escapeHtml(note.title)}" maxlength="40"/>
      <button class="btn-del-note" title="Hapus">✕</button>
    </div>
    <textarea class="note-body-input" placeholder="Tulis catatan di sini... (tersimpan otomatis)">${escapeHtml(note.body)}</textarea>
    <div class="note-footer">
      <span class="note-timestamp">${timeAgo(note.ts)}</span>
      <span class="note-pin ${note.pinned ? 'pinned' : ''}" title="Pin catatan">📌</span>
    </div>
  `;
  card.querySelector('.note-title-input').addEventListener('input', e => {
    const n = notesData.find(x => x.id === note.id);
    if (n) { n.title = e.target.value; n.ts = Date.now(); saveNotes(); updateKPIs(); }
  });
  card.querySelector('.note-body-input').addEventListener('input', e => {
    const n = notesData.find(x => x.id === note.id);
    if (n) { n.body = e.target.value; n.ts = Date.now(); saveNotes(); updateKPIs(); }
  });
  card.querySelector('.btn-del-note').addEventListener('click', e => {
    e.stopPropagation();
    notesData = notesData.filter(x => x.id !== note.id);
    saveNotes(); renderNotesGrid();
    showToast('Catatan dihapus 🗑️');
  });
  card.querySelector('.note-pin').addEventListener('click', e => {
    e.stopPropagation();
    const n = notesData.find(x => x.id === note.id);
    if (n) { n.pinned = !n.pinned; saveNotes(); renderNotesGrid(); }
  });
  return card;
}

function createNewNote() {
  const newNote = { id: 'n-' + Date.now().toString(36), title: '', body: '', color: selectedNoteColor, pinned: false, ts: Date.now() };
  notesData.unshift(newNote);
  saveNotes(); renderNotesGrid();
  const firstInput = $('notesGrid')?.querySelector('.note-title-input');
  if (firstInput) firstInput.focus();
  showToast('🌸 Catatan baru dibuat!');
}

/* ══════════════════════════════════════════════════════
   POMODORO
   ══════════════════════════════════════════════════════ */
const POMO_LABELS = { focus:'Fokus 🌸', short:'Istirahat ☕', long:'Istirahat Panjang 🛋️' };
const POMO_CIRCUMFERENCE = 427; // 2 * PI * 68

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2,'0');
  const s = String(sec % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function updatePomoDisplay() {
  const el = $('pomoTimerText');
  if (el) el.textContent = formatTime(pomoTimeLeft);
  const ring = $('pomoRingFill');
  if (ring) {
    const offset = POMO_CIRCUMFERENCE * (1 - pomoTimeLeft / pomoTotalTime);
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = currentPomoMode === 'focus' ? 'var(--rose-gold)' : 'var(--sage)';
  }
  const lbl = $('pomoModeLabel');
  if (lbl) lbl.textContent = POMO_LABELS[currentPomoMode];
}

function startPomodoro() {
  if (isPomoRunning) return;
  isPomoRunning = true;
  pomoInterval = setInterval(() => {
    if (pomoTimeLeft <= 0) {
      clearInterval(pomoInterval); isPomoRunning = false;
      if (currentPomoMode === 'focus') {
        pomoSessions++;
        updateSessionDots();
        if ($('pomoCount')) $('pomoCount').innerHTML = `Sesi selesai: <strong>${pomoSessions}</strong>`;
      }
      showToast(currentPomoMode === 'focus' ? '🌸 Sesi fokus selesai!' : '⏰ Istirahat habis, ayo mulai!');
      return;
    }
    pomoTimeLeft--;
    updatePomoDisplay();
  }, 1000);
}

function pausePomodoro()  { clearInterval(pomoInterval); isPomoRunning = false; }
function resetPomodoro()  { clearInterval(pomoInterval); isPomoRunning = false; pomoTimeLeft = pomoTotalTime; updatePomoDisplay(); }

function updateSessionDots() {
  const dots = $('pomoDots')?.querySelectorAll('.session-dot');
  if (!dots) return;
  dots.forEach((d,i) => d.classList.toggle('done-dot', i < (pomoSessions % 4)));
}

/* ══════════════════════════════════════════════════════
   BOTTOM SHEET
   ══════════════════════════════════════════════════════ */
function openSheet()  { $('sheetOverlay')?.classList.add('open'); }
function closeSheet() { $('sheetOverlay')?.classList.remove('open'); }

/* ══════════════════════════════════════════════════════
   BIND EVENTS
   ══════════════════════════════════════════════════════ */
function bindEvents() {
  $('sweepTrigger')?.addEventListener('click', openSheet);
  $('sheetBackdrop')?.addEventListener('click', closeSheet);
  $('sheetHandle')?.addEventListener('click', closeSheet);

  let sheetStartY = 0;
  const sheet = $('bottomSheet');
  if (sheet) {
    sheet.addEventListener('touchstart', e => { sheetStartY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - sheetStartY > 80) closeSheet();
    }, { passive: true });
  }

  $('btnAdd')?.addEventListener('click', addHabit);
  $('habitInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
  $('btnTodoAdd')?.addEventListener('click', addTodo);
  $('todoInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

  $('btnPrevWeek')?.addEventListener('click', () => {
    if (currentWeekNumber > 1) { currentWeekNumber--; renderTracker(); renderMiniCalendar(); updateKPIs(); renderWeeklyChart(); }
  });
  $('btnNextWeek')?.addEventListener('click', () => {
    if (currentWeekNumber < 4) { currentWeekNumber++; renderTracker(); renderMiniCalendar(); updateKPIs(); renderWeeklyChart(); }
  });

  $('emojiTrigger')?.addEventListener('click', e => {
    e.stopPropagation();
    $('emojiGrid')?.classList.toggle('open');
  });
  $('emojiGrid')?.querySelectorAll('.emoji-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedEmoji = opt.dataset.emoji;
      $('emojiTrigger').textContent = selectedEmoji;
      $('emojiGrid').classList.remove('open');
    });
  });
  document.addEventListener('click', () => $('emojiGrid')?.classList.remove('open'));

  $('colorPalette')?.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      $('colorPalette').querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      selectedNoteColor = sw.dataset.color;
    });
  });

  $('btnNewNote')?.addEventListener('click', createNewNote);

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pomoTotalTime = parseInt(btn.dataset.time);
      pomoTimeLeft  = pomoTotalTime;
      currentPomoMode = btn.id === 'modeFocus' ? 'focus' : btn.id === 'modeShort' ? 'short' : 'long';
      clearInterval(pomoInterval); isPomoRunning = false;
      updatePomoDisplay();
    });
  });

  $('btnStartPomo')?.addEventListener('click', startPomodoro);
  $('btnPausePomo')?.addEventListener('click', pausePomodoro);
  $('btnResetPomo')?.addEventListener('click', resetPomodoro);

  $('mascot')?.addEventListener('click', () => {
    const msgs = [
      'Semangat! 🔥', 'Kamu bisa! 🌸', 'Terus bergerak! 🐻',
      'Jangan menyerah! ✨', 'You got this! 💖',
      'Aku percaya padamu! 🌷', 'Satu langkah lagi! 🎯',
      'Keren banget! 💅', 'Proud of you! 🥹'
    ];
    showToast(msgs[Math.floor(Math.random() * msgs.length)]);
  });
}

/* ══════════════════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════════════════ */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d} hari lalu`;
  if (h > 0) return `${h} jam lalu`;
  if (m > 0) return `${m} menit lalu`;
  return 'Baru saja';
}

let toastTimeout;
function showToast(msg) {
  const el = $('toast'); if (!el) return;
  clearTimeout(toastTimeout);
  el.textContent = msg;
  el.style.display = 'block';
  // Small haptic feedback on mobile (if supported)
  if (navigator.vibrate) navigator.vibrate(40);
  toastTimeout = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

/* ══════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  init();
  updatePomoDisplay();
});
