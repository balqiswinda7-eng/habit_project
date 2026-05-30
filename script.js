'use strict';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAYS_SHORT = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

let currentMonthIndex = 0; 
let currentWeekNumber = 1; 
let habitsData = []; 
let todoData = []; 
let selectedEmoji = '🌟';

// --- TAMBAHAN STATE UNTUK POMODORO ---
let pomoInterval = null;
let pomoTimeLeft = 1500; // 25 menit dalam satuan detik
let isPomoRunning = false;
let currentPomoMode = 'focus'; // focus, short, long



const dom = {
  monthTabs: document.getElementById('monthTabs'),
  trackerTableBody: document.getElementById('trackerTableBody'),
  activeMonthLabel: document.getElementById('activeMonthLabel'),
  currentWeekLabel: document.getElementById('currentWeekLabel'),
  btnPrevWeek: document.getElementById('btnPrevWeek'),
  btnNextWeek: document.getElementById('btnNextWeek'),
  habitInput: document.getElementById('habitInput'),
  btnAdd: document.getElementById('btnAdd'),
  emojiTrigger: document.getElementById('emojiTrigger'),
  emojiGrid: document.getElementById('emojiGrid'),
  emptyState: document.getElementById('emptyState'),
  miniCalendar: document.getElementById('miniCalendar'),
  toast: document.getElementById('toast'),
  todoInput: document.getElementById('todoInput'),
  btnTodoAdd: document.getElementById('btnTodoAdd'),
  todoList: document.getElementById('todoList'),
  habitProgressFill: document.getElementById('habitProgressFill'),
  habitProgressText: document.getElementById('habitProgressText'),
  todoCounter: document.getElementById('todoCounter'),
  planningNotes: document.getElementById('planningNotes'),
  saveStatusText: document.getElementById('saveStatusText')
};

function init() {
  loadAllData();
  renderMonthTabs();
  renderTracker();
  renderMiniCalendar();
  renderTodoList();
  bindEventHandlers();
  calculateProgressDashboard();
}

function loadAllData() {
  const storedHabits = localStorage.getItem('hb_habits_2026');
  const storedTodos = localStorage.getItem('hb_todos_2026');
  const storedNotes = localStorage.getItem('hb_notes_2026');
  
  if (storedHabits) {
    habitsData = JSON.parse(storedHabits);
  } else {
    habitsData = [
      { id: 'h1', month: 0, week: 1, emoji: '💧', name: 'Minum Air Putih 2L', checks: [true, false, true, false, false, false, false] },
      { id: 'h2', month: 0, week: 1, emoji: '📚', name: 'Review Materi Kuliah', checks: [false, true, false, false, false, false, false] }
    ];
    saveHabits();
  }

  if (storedTodos) {
    todoData = JSON.parse(storedTodos);
  } else {
    todoData = [
      { id: 't1', text: 'Kerjakan Tugas Basis Data 🗄️', done: false },
      { id: 't2', text: 'Beli buku catatan baru', done: true }
    ];
    saveTodos();
  }

  if (storedNotes && dom.planningNotes) {
    dom.planningNotes.value = storedNotes;
  }
}

function saveHabits() { localStorage.setItem('hb_habits_2026', JSON.stringify(habitsData)); }
function saveTodos() { localStorage.setItem('hb_todos_2026', JSON.stringify(todoData)); }

function calculateProgressDashboard() {
  if (!dom.habitProgressFill || !dom.habitProgressText || !dom.todoCounter) return;
  
  const activeHabits = habitsData.filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber);
  let totalCheckboxes = activeHabits.length * 7;
  let totalChecked = 0;

  activeHabits.forEach(h => {
    h.checks.forEach(c => { if(c) totalChecked++; });
  });

  let habitPercentage = totalCheckboxes > 0 ? Math.round((totalChecked / totalCheckboxes) * 100) : 0;
  dom.habitProgressFill.style.width = `${habitPercentage}%`;
  dom.habitProgressText.textContent = `${habitPercentage}% Selesai`;

  let totalTodos = todoData.length;
  let completedTodos = todoData.filter(t => t.done).length;
  dom.todoCounter.textContent = `${completedTodos}/${totalTodos}`;
}

function renderMonthTabs() {
  if (!dom.monthTabs) return;
  dom.monthTabs.innerHTML = '';
  MONTHS.forEach((month, idx) => {
    const btn = document.createElement('button');
    btn.className = `month-btn ${idx === currentMonthIndex ? 'active' : ''}`;
    btn.textContent = month;
    btn.addEventListener('click', () => {
      currentMonthIndex = idx;
      currentWeekNumber = 1; 
      updateTabsUI();
      renderTracker();
      renderMiniCalendar();
      calculateProgressDashboard();
    });
    dom.monthTabs.appendChild(btn);
  });
}

function updateTabsUI() {
  if (!dom.monthTabs) return;
  const btns = dom.monthTabs.querySelectorAll('.month-btn');
  btns.forEach((btn, idx) => {
    if (idx === currentMonthIndex) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

function renderTracker() {
  if (dom.activeMonthLabel) dom.activeMonthLabel.textContent = MONTHS[currentMonthIndex];
  if (dom.currentWeekLabel) dom.currentWeekLabel.textContent = `Minggu ${currentWeekNumber}`;
  
  const activeData = habitsData.filter(h => h.month === currentMonthIndex && h.week === currentWeekNumber);
  if (!dom.trackerTableBody) return;
  dom.trackerTableBody.innerHTML = '';
  
  if (activeData.length === 0) {
    if (dom.emptyState) dom.emptyState.style.display = 'block';
    calculateProgressDashboard();
    return;
  }
  if (dom.emptyState) dom.emptyState.style.display = 'none';

  activeData.forEach(habit => {
    const tr = document.createElement('tr');
    
    const tdName = document.createElement('td');
    tdName.innerHTML = `<div class="habit-cell-name"><span>${habit.emoji}</span><span>${escapeHtml(habit.name)}</span></div>`;
    tr.appendChild(tdName);
    
    habit.checks.forEach((checkedStatus, dayIdx) => {
      const tdCheck = document.createElement('td');
      const dot = document.createElement('div');
      dot.className = `check-dot ${checkedStatus ? 'checked' : ''}`;
      dot.addEventListener('click', () => {
        habit.checks[dayIdx] = !habit.checks[dayIdx];
        dot.classList.toggle('checked');
        saveHabits();
        calculateProgressDashboard();
      });
      tdCheck.appendChild(dot);
      tr.appendChild(tdCheck);
    });
    
    const tdDel = document.createElement('td');
    tdDel.innerHTML = `<button class="btn-del-habit">✕</button>`;
    tdDel.querySelector('button').addEventListener('click', () => {
      habitsData = habitsData.filter(h => h.id !== habit.id);
      saveHabits();
      renderTracker();
      calculateProgressDashboard();
      showToast('Habit dihapus 🗑️');
    });
    tr.appendChild(tdDel);
    dom.trackerTableBody.appendChild(tr);
  });
}

function renderMiniCalendar() {
  if (!dom.miniCalendar) return;
  dom.miniCalendar.innerHTML = '';
  DAYS_SHORT.forEach(d => {
    const head = document.createElement('div');
    head.className = 'cal-day-head';
    head.textContent = d;
    dom.miniCalendar.appendChild(head);
  });
  
  const year = 2026;
  const firstDayIndex = new Date(year, currentMonthIndex, 1).getDay();
  let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDaysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();
  
  for (let x = 0; x < startOffset; x++) {
    const emptyBlock = document.createElement('div');
    emptyBlock.className = 'cal-date empty';
    dom.miniCalendar.appendChild(emptyBlock);
  }
  
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const block = document.createElement('div');
    block.className = 'cal-date real-date';
    block.textContent = day;
    
    let currentGridSlot = startOffset + day;
    let calculatedWeek = Math.ceil(currentGridSlot / 7);
    if(calculatedWeek > 4) calculatedWeek = 4;
    
    if (calculatedWeek === currentWeekNumber) {
      block.classList.add('active-week');
    }
    
    block.addEventListener('click', () => {
      currentWeekNumber = calculatedWeek;
      renderTracker();
      renderMiniCalendar();
      calculateProgressDashboard();
    });
    
    dom.miniCalendar.appendChild(block);
  }
}

function renderTodoList() {
  if (!dom.todoList) return;
  dom.todoList.innerHTML = '';
  if (todoData.length === 0) {
    dom.todoList.innerHTML = '<li style="text-align:center; color:var(--text-light); font-size:0.8rem; padding:8px;">Belum ada rencana hari ini!</li>';
    calculateProgressDashboard();
    return;
  }

  todoData.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.done ? 'done' : ''}`;
    li.innerHTML = `
      <div class="todo-left">
        <div class="todo-checkbox"></div>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
      </div>
      <button class="btn-del-todo">✕</button>
    `;
    
    li.querySelector('.todo-left').addEventListener('click', () => {
      todo.done = !todo.done;
      li.classList.toggle('done');
      saveTodos();
      calculateProgressDashboard();
    });
    
    li.querySelector('.btn-del-todo').addEventListener('click', (e) => {
      e.stopPropagation();
      todoData = todoData.filter(t => t.id !== todo.id);
      saveTodos();
      renderTodoList();
      calculateProgressDashboard();
    });
    dom.todoList.appendChild(li);
  });
}

function addNewTodo() {
  if (!dom.todoInput) return;
  const text = dom.todoInput.value.trim();
  if (!text) return;
  todoData.push({ id: 't-' + Date.now().toString(36), text: text, done: false });
  saveTodos();
  dom.todoInput.value = '';
  renderTodoList();
  calculateProgressDashboard();
}

function addNewHabit() {
  if (!dom.habitInput) return;
  const name = dom.habitInput.value.trim();
  if (!name) return;
  habitsData.push({
    id: 'h-' + Date.now().toString(36),
    month: currentMonthIndex,
    week: currentWeekNumber,
    emoji: selectedEmoji,
    name: name,
    checks: [false, false, false, false, false, false, false]
  });
  saveHabits();
  dom.habitInput.value = '';
  renderTracker();
  calculateProgressDashboard();
}

function bindEventHandlers() {
  if (dom.btnAdd) dom.btnAdd.addEventListener('click', addNewHabit);
  if (dom.habitInput) dom.habitInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addNewHabit(); });
  if (dom.btnTodoAdd) dom.btnTodoAdd.addEventListener('click', addNewTodo);
  if (dom.todoInput) dom.todoInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') addNewTodo(); });

  // =================================================================
  // --- TAMBAHAN EVENT LISTENER SWEEP SHEET & POMODORO TIMER ---
  // =================================================================
  const sweepTrigger = document.getElementById('sweepTrigger');
  const sheetOverlay = document.getElementById('sheetOverlay');
  const sheetHandle  = document.getElementById('sheetHandle');

  if (sweepTrigger && sheetOverlay && sheetHandle) {
    // 1. Pemicu Sweep Up / Buka Panel Bottom Sheet
    sweepTrigger.addEventListener('click', () => {
      sheetOverlay.classList.add('open');
    });

    // 2. Tutup panel jika klik gagang atas atau area transparan luar
    sheetHandle.addEventListener('click', () => sheetOverlay.classList.remove('open'));
    sheetOverlay.addEventListener('click', (e) => {
      if (e.target === sheetOverlay) sheetOverlay.classList.remove('open');
    });
  }

  // 3. Logika Klik Ganti Mode Menit Pomodoro
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      pomoTimeLeft = parseInt(btn.dataset.time);
      if (btn.id === 'modeFocus') currentPomoMode = 'focus';
      else if (btn.id === 'modeShort') currentPomoMode = 'short';
      else currentPomoMode = 'long';

      resetPomodoroLogic();
    });
  });

  // 4. Kontrol Tombol Jalankan / Jeda / Atur Ulang Pomodoro
  const btnStart = document.getElementById('btnStartPomo');
  const btnPause = document.getElementById('btnPausePomo');
  const btnReset = document.getElementById('btnResetPomo');

  if (btnStart) btnStart.addEventListener('click', startPomodoroLogic);
  if (btnPause) btnPause.addEventListener('click', pausePomodoroLogic);
  if (btnReset) btnReset.addEventListener('click', resetPomodoroLogic);

  // =================================================================
  // --- SISA KODE BAWAAN ASLI (JANGAN SAMPAI HILANG) ---
  // =================================================================
  if (dom.btnPrevWeek) {
    dom.btnPrevWeek.addEventListener('click', () => {
      if (currentWeekNumber > 1) { currentWeekNumber--; renderTracker(); renderMiniCalendar(); calculateProgressDashboard(); }
    });
  }
  if (dom.btnNextWeek) {
    dom.btnNextWeek.addEventListener('click', () => {
      if (currentWeekNumber < 4) { currentWeekNumber++; renderTracker(); renderMiniCalendar(); calculateProgressDashboard(); }
    });
  }

  if (dom.emojiTrigger) {
    dom.emojiTrigger.addEventListener('click', (e) => { e.stopPropagation(); if(dom.emojiGrid) dom.emojiGrid.classList.toggle('open'); });
  }
  
  if (dom.emojiGrid) {
    dom.emojiGrid.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedEmoji = opt.dataset.emoji;
        if (dom.emojiTrigger) dom.emojiTrigger.textContent = selectedEmoji;
        dom.emojiGrid.classList.remove('open');
      });
    });
  }
  document.addEventListener('click', () => { if(dom.emojiGrid) dom.emojiGrid.classList.remove('open'); });

  if (dom.planningNotes && dom.saveStatusText) {
    dom.planningNotes.addEventListener('input', () => {
      dom.saveStatusText.textContent = "Sedang mengetik & menyimpan...";
      localStorage.setItem('hb_notes_2026', dom.planningNotes.value);
      setTimeout(() => {
        dom.saveStatusText.textContent = "Semua tulisan telah disimpan otomatis ke LocalStorage";
      }, 800);
    });
  }
} // <-- Penutup fungsi utama bindEventHandlers

// FUNGSI UTAMA UNTUK ESCAPE STRING HTML AMAN
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg) {
  if (!dom.toast) return;
  dom.toast.textContent = msg; dom.toast.style.display = 'block';
  setTimeout(() => { dom.toast.style.display = 'none'; }, 2000);
}

document.addEventListener('DOMContentLoaded', init);