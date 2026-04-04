<template>
  <div class="calendar-page" :style="selectedDateStr ? 'padding-bottom: 88px' : ''">
    <!-- Header -->
    <div class="cal-header">
      <h1 class="page-title">Календарь</h1>
      <div class="month-nav">
        <button class="arrow-btn" @click="shiftMonth(-1)">&#8249;</button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="arrow-btn" @click="shiftMonth(1)">&#8250;</button>
      </div>
    </div>

    <!-- Weekday row -->
    <div class="weekday-row">
      <span v-for="name in WEEKDAY_NAMES" :key="name" class="weekday-name">{{ name }}</span>
    </div>

    <!-- Days grid — fills remaining height -->
    <div class="days-grid">
      <div
        v-for="cell in gridCells"
        :key="cell.key"
        class="day-cell"
        :class="{
          empty: !cell.day,
          today: cell.isToday,
          selected: cell.dateStr === selectedDateStr,
          'other-month': cell.otherMonth,
        }"
        @click="cell.day && selectDay(cell.dateStr)"
      >
        <template v-if="cell.day">
          <span class="cell-num">{{ cell.day }}</span>
          <span v-if="cell.hasTraining" class="training-dot"></span>
        </template>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>

  <!-- Fixed bottom bar when date selected -->
  <transition name="slide-up">
    <div v-if="selectedDateStr" class="bottom-bar">
      <div class="bottom-bar-inner">
        <div class="bar-left">
          <p class="detail-label">{{ selectedDayLabel }}</p>
          <div v-if="loading" class="loading">Загрузка...</div>
          <template v-else-if="selectedTraining">
            <h2 class="detail-title">{{ selectedTraining.Title || 'Тренировка' }}</h2>
            <span class="meta-badge">⚡ {{ exerciseCount }} упражнений</span>
          </template>
          <template v-else>
            <p class="no-training">На этот день нет тренировки</p>
          </template>
        </div>

        <div class="bar-actions">
          <template v-if="!loading && selectedTraining">
            <button class="btn-primary" @click="openTraining(selectedTraining.ID)">Начать</button>
            <button class="btn-secondary" @click="openTraining(selectedTraining.ID)">Редактировать</button>
          </template>
          <template v-else-if="!loading">
            <button class="btn-create" @click="createTraining">+ Создать тренировку</button>
          </template>
          <button class="btn-close" @click="selectedDateStr = null">✕</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'

const router = useRouter()

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const today = new Date()
function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const todayStr = toDateStr(today)

const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDateStr = ref(null)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.toLocaleString('ru', { month: 'long', year: 'numeric' })
})

function shiftMonth(n) {
  let m = currentMonth.value + n
  let y = currentYear.value
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  currentMonth.value = m
  currentYear.value = y
  loadTrainings()
}

function dayOfWeekMon(d) {
  return (d.getDay() + 6) % 7
}

const gridCells = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)
  const startOffset = dayOfWeekMon(firstDay)
  const cells = []

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(y, m, 1 - (startOffset - i))
    const ds = toDateStr(d)
    cells.push({ key: `prev-${i}`, day: d.getDate(), dateStr: ds, isToday: false, hasTraining: false, otherMonth: true })
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(y, m, day)
    const ds = toDateStr(d)
    cells.push({
      key: ds,
      day,
      dateStr: ds,
      isToday: ds === todayStr,
      hasTraining: trainingsMap.value.has(ds),
      otherMonth: false,
    })
  }

  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(y, m + 1, i)
    const ds = toDateStr(d)
    cells.push({ key: `next-${i}`, day: d.getDate(), dateStr: ds, isToday: false, hasTraining: false, otherMonth: true })
  }

  return cells
})

function selectDay(dateStr) {
  selectedDateStr.value = selectedDateStr.value === dateStr ? null : dateStr
}

const selectedDayLabel = computed(() => {
  if (!selectedDateStr.value) return ''
  if (selectedDateStr.value === todayStr) return 'Сегодня'
  return new Date(selectedDateStr.value).toLocaleString('ru', { day: 'numeric', month: 'long' })
})

const trainings = ref([])
const loading = ref(false)
const error = ref(null)

const trainingsMap = computed(() => {
  const m = new Map()
  for (const t of trainings.value) {
    if (t.Date) m.set(t.Date.slice(0, 10), t)
  }
  return m
})

const selectedTraining = computed(() =>
  selectedDateStr.value ? trainingsMap.value.get(selectedDateStr.value) || null : null
)

const exerciseCount = computed(() => {
  const t = selectedTraining.value
  if (!t) return 0
  return t.exercises?.length ?? t.ExerciseIDs?.length ?? 0
})

async function loadTrainings() {
  loading.value = true
  error.value = null
  try {
    const y = currentYear.value
    const m = currentMonth.value
    const from = `${y}-${pad(m + 1)}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`
    const result = await api.training.list({ from, to })
    trainings.value = Array.isArray(result) ? result : (result?.items || [])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function createTraining() {
  try {
    const t = await api.training.new({ date: selectedDateStr.value })
    const id = typeof t === 'number' ? t : (t?.ID ?? t?.id)
    if (id) router.push(`/app/trainings/${id}`)
    else await loadTrainings()
  } catch (e) {
    error.value = e.message
  }
}

function openTraining(id) {
  router.push(`/app/trainings/${id}`)
}

onMounted(() => loadTrainings())
</script>

<style scoped>
.calendar-page {
  height: 100%;
  background: #0d0d0d;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 36px 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

/* Header */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.arrow-btn {
  background: transparent;
  border: 1px solid #2a2a2a;
  color: #888;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 3px 10px;
  border-radius: 6px;
  transition: color 0.15s, border-color 0.15s;
}
.arrow-btn:hover { color: #fff; border-color: #444; }

.month-label {
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
  min-width: 160px;
  text-align: center;
}

/* Weekday row */
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
  flex-shrink: 0;
}

.weekday-name {
  text-align: center;
  font-size: 11px;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 0;
}

/* Days grid — fills remaining space */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: 3px;
  flex: 1;
  min-height: 0;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.day-cell:hover:not(.empty):not(.selected):not(.today) {
  background: #161616;
}
.day-cell.empty { cursor: default; }
.day-cell.other-month .cell-num { color: #2a2a2a; }

.day-cell.today {
  border-color: rgba(74,222,128,.3);
  background: rgba(74,222,128,.06);
}
.day-cell.today .cell-num { color: #4ade80; }

.day-cell.selected {
  background: #1e1e1e;
  border-color: #383838;
}
.day-cell.today.selected {
  background: rgba(74,222,128,.1);
  border-color: rgba(74,222,128,.4);
}

.cell-num {
  font-size: 13px;
  font-weight: 500;
  color: #aaa;
}

.training-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 4px #4ade80;
}

/* Fixed bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 252px; /* sidebar width */
  right: 0;
  background: #111;
  border-top: 1px solid #222;
  z-index: 200;
  padding: 20px 40px;
}

.bottom-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 960px;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.detail-label {
  font-size: 13px;
  color: #555;
  margin: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

.detail-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-badge {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}

.no-training {
  color: #444;
  font-size: 14px;
  margin: 0;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.btn-primary {
  background: #4ade80;
  color: #000;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.btn-primary:hover { box-shadow: 0 0 16px rgba(74,222,128,.4); }

.btn-secondary {
  background: transparent;
  color: #ccc;
  border: 1px solid #333;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-secondary:hover { border-color: #555; }

.btn-create {
  background: transparent;
  color: #4ade80;
  border: 1px dashed rgba(74,222,128,.4);
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-create:hover { background: rgba(74,222,128,.08); }

.btn-close {
  background: transparent;
  border: 1px solid #2a2a2a;
  color: #555;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, border-color 0.15s;
}
.btn-close:hover { color: #fff; border-color: #444; }

/* Slide-up animation */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.loading { color: #555; font-size: 14px; }
.error { color: #f87171; font-size: 12px; margin-top: 8px; }

@media (max-width: 768px) {
  .calendar-page {
    padding: 20px 12px 80px;
    height: auto;
    min-height: 100%;
    overflow: visible;
  }

  .cal-header {
    margin-bottom: 14px;
  }

  .page-title {
    font-size: 20px;
  }

  .month-label {
    font-size: 14px;
    min-width: 120px;
  }

  .arrow-btn {
    font-size: 18px;
    padding: 3px 8px;
  }

  .weekday-name {
    font-size: 10px;
    padding: 3px 0;
  }

  .days-grid {
    gap: 2px;
    /* fixed height so calendar doesn't collapse */
    min-height: 300px;
  }

  .day-cell {
    border-radius: 8px;
    min-height: 44px;
  }

  .cell-num {
    font-size: 14px;
    font-weight: 600;
  }

  .bottom-bar {
    left: 0;
    padding: 14px 16px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  }

  .bottom-bar-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .bar-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    width: 100%;
  }

  .bar-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary, .btn-create {
    flex: 1;
    text-align: center;
    padding: 11px 14px;
  }

  .btn-close {
    position: absolute;
    top: 14px;
    right: 16px;
  }

  .bottom-bar-inner {
    position: relative;
  }

  .detail-title {
    font-size: 16px;
  }
}
</style>
