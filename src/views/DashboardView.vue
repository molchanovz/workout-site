<template>
  <div class="dashboard">
    <h1 class="page-title">Главная</h1>

    <!-- 7-day strip -->
    <div class="day-strip-wrap" @wheel.prevent="onWheel" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">      <button class="arrow-btn" @click="shiftDay(-1)">&#8249;</button>
      <div class="day-strip" ref="stripEl">
        <div
          v-for="day in weekDays"
          :key="day.dateStr"
          class="day-item"
          :class="{ active: day.dateStr === selectedDateStr, today: day.isToday }"
          @click="selectedDateStr = day.dateStr"
        >
          <span class="day-name">{{ day.dayName }}</span>
          <span class="day-num">{{ day.dayNum }}</span>
          <span v-if="day.hasTraining" class="training-dot"></span>
        </div>
      </div>
      <button class="arrow-btn" @click="shiftDay(1)">&#8250;</button>
    </div>

    <!-- Training card -->
    <div class="training-section">
      <p class="section-label">Тренировка — {{ selectedDayLabel }}</p>

      <div v-if="loading" class="loading">Загрузка...</div>
      <template v-else-if="selectedTraining">
        <h2 class="training-title">{{ selectedTraining.name || 'Тренировка' }}</h2>
        <div class="training-meta">
          <span class="meta-badge">⚡ {{ exerciseCount }} {{ pluralExercise(exerciseCount) }}</span>
        </div>
        <div class="training-actions">
          <button class="btn-primary" @click="openTraining(selectedTraining.id)">Начать тренировку</button>
          <button class="btn-secondary" @click="openTraining(selectedTraining.id)">Редактировать</button>
          <button class="btn-danger" @click="deleteTraining(selectedTraining.id)">Удалить</button>
        </div>
      </template>
      <template v-else>
        <p class="no-training">На этот день нет тренировки</p>
        <button class="btn-create" @click="createTraining">+ Создать тренировку</button>
      </template>
    </div>

    <!-- Stats grid -->
    <div class="stats-grid">
      <!-- Stats card -->
      <div class="stat-card">
        <p class="stat-card-label">Моя статистика</p>
        <div class="stat-rows">
          <div class="stat-row">
            <span class="stat-name">Тренировок всего</span>
            <span class="stat-val">{{ trainings.length }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-name">За последние 30 дней</span>
            <span class="stat-val">{{ last30Count }}</span>
          </div>
        </div>
      </div>

      <!-- Weekly progress -->
      <div class="stat-card">
        <p class="stat-card-label">Прогресс за неделю</p>
        <div class="week-bars">
          <div v-for="bar in weekBars" :key="bar.dateStr" class="bar-wrap">
            <div class="bar" :class="{ filled: bar.filled }"></div>
            <span class="bar-label">{{ bar.dayName }}</span>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="stat-card">
        <p class="stat-card-label">История тренировок</p>
        <div v-if="recentTrainings.length" class="recent-list">
          <div
            v-for="t in recentTrainings"
            :key="t.id"
            class="recent-item"
            @click="openTraining(t.id)"
          >
            <div class="recent-icon">🏋️</div>
            <div class="recent-info">
              <span class="recent-name">{{ t.name || 'Тренировка' }}</span>
              <span class="recent-date">{{ formatDate(t.date) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="no-history">Нет тренировок</p>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'

const router = useRouter()
const stripEl = ref(null)

function scrollStripToActive() {
  nextTick(() => {
    if (!stripEl.value) return
    const active = stripEl.value.querySelector('.day-item.active')
    if (!active) return
    const strip = stripEl.value
    const itemCenter = active.offsetLeft + active.offsetWidth / 2
    strip.scrollTo({ left: itemCenter - strip.offsetWidth / 2, behavior: 'smooth' })
  })
}

const today = new Date()
const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const todayStr = toDateStr(today)
const selectedDateStr = ref(todayStr)

const windowWidth = ref(window.innerWidth)
function onResize() { windowWidth.value = window.innerWidth }

const SIDEBAR_WIDTH = 220
const visibleCount = computed(() => {
  const w = windowWidth.value
  // на десктопе вычитаем сайдбар, на мобиле (<= 768) его нет
  const contentW = w > 768 ? w - SIDEBAR_WIDTH : w
  if (contentW >= 520) return 7
  if (contentW >= 380) return 5
  return 3
})

const weekDays = computed(() => {
  const sel = new Date(selectedDateStr.value)
  const count = visibleCount.value
  const half = Math.floor(count / 2)
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(sel, i - half)
    const ds = toDateStr(d)
    return {
      dateStr: ds,
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      isToday: ds === todayStr,
      hasTraining: trainingsMap.value.has(ds),
    }
  })
})

const selectedDayLabel = computed(() => {
  if (selectedDateStr.value === todayStr) return 'Сегодня'
  const d = new Date(selectedDateStr.value)
  return d.toLocaleString('ru', { day: 'numeric', month: 'long' })
})

const trainings = ref([])
const loading = ref(false)
const error = ref(null)

const trainingsMap = computed(() => {
  const m = new Map()
  for (const t of trainings.value) {
    if (t.date) m.set(t.date.slice(0, 10), t)
  }
  return m
})

const selectedTraining = computed(() => trainingsMap.value.get(selectedDateStr.value) || null)

const exerciseCount = computed(() => {
  const t = selectedTraining.value
  if (!t) return 0
  return t.exerciseCount ?? t.exercises?.length ?? t.ExerciseIDs?.length ?? 0
})

const recentTrainings = computed(() =>
  [...trainings.value]
    .filter(t => t.date && t.date.slice(0, 10) <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
)

const last30Count = computed(() => {
  const cutoff = toDateStr(addDays(today, -30))
  return trainings.value.filter(t => t.date && t.date.slice(0, 10) >= cutoff && t.date.slice(0, 10) <= todayStr).length
})

const weekBars = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    const ds = toDateStr(d)
    return { dateStr: ds, dayName: DAY_NAMES[d.getDay()], filled: trainingsMap.value.has(ds) }
  })
)

function shiftDay(n) {
  const d = new Date(selectedDateStr.value)
  d.setDate(d.getDate() + n)
  selectedDateStr.value = toDateStr(d)
}

// Mouse wheel — desktop
let wheelAccum = 0
let wheelTimer = null
function onWheel(e) {
  wheelAccum += e.deltaX || e.deltaY
  clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => { wheelAccum = 0 }, 200)
  if (Math.abs(wheelAccum) >= 50) {
    shiftDay(wheelAccum > 0 ? 1 : -1)
    wheelAccum = 0
  }
}

// Touch swipe — mobile
let touchStartX = 0
function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
}
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) shiftDay(dx < 0 ? 1 : -1)
}

function formatDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleString('ru', { day: 'numeric', month: 'long' })
}

async function loadTrainings() {
  loading.value = true
  error.value = null
  try {
    const sel = new Date(selectedDateStr.value)
    const from = toDateStr(addDays(sel, -14))
    const to = toDateStr(addDays(sel, 14))
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
    const id = typeof t === 'number' ? t : t?.id
    if (id) router.push(`/app/trainings/${id}`)
    else await loadTrainings()
  } catch (e) {
    error.value = e.message
  }
}

function pluralExercise(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'упражнений'
  if (mod10 === 1) return 'упражнение'
  if (mod10 >= 2 && mod10 <= 4) return 'упражнения'
  return 'упражнений'
}

function openTraining(id) {
  router.push(`/app/trainings/${id}`)
}

async function deleteTraining(id) {
  if (!confirm('Удалить тренировку?')) return
  try {
    await api.training.delete({ id })
    trainings.value = trainings.value.filter(t => t.id !== id)
  } catch (e) {
    error.value = e.message
  }
}

let loadedCenter = null
watch(selectedDateStr, (val) => {
  if (!loadedCenter) return
  const diff = Math.abs(new Date(val) - new Date(loadedCenter)) / 86400000
  if (diff > 7) {
    loadedCenter = val
    loadTrainings()
  }
})

watch(selectedDateStr, () => scrollStripToActive())

onMounted(() => {
  window.addEventListener('resize', onResize)
  loadedCenter = selectedDateStr.value
  loadTrainings()
  scrollStripToActive()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #0d0d0d;
  color: #fff;
  padding: 48px 48px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 32px;
}

/* Day strip */
.day-strip-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #111;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,.4);
  padding: 10px 14px;
  margin-bottom: 28px;
  border: 1px solid #1e1e1e;
}

.arrow-btn {
  background: transparent;
  border: none;
  color: #555;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.arrow-btn:hover { color: #fff; }

.day-strip {
  display: flex;
  flex: 1;
}

.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  flex: 1;
  border: 1px solid transparent;
}
.day-item:hover:not(.active) { background: #1a1a1a; }
.day-item.active {
  background: rgba(74,222,128,.08);
  border: 1px solid rgba(74,222,128,.25);
}

.day-name {
  font-size: 11px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.day-item.active .day-name { color: #888; }

.day-num {
  font-size: 18px;
  font-weight: 600;
  color: #666;
}
.day-item.active .day-num { color: #fff; }
.day-item.today .day-num { color: #4ade80; }

.training-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 4px #4ade80;
}

/* Training section */
.training-section {
  background: linear-gradient(135deg, #141414, #111);
  border: 1px solid #222;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  padding: 32px 36px;
  margin-bottom: 24px;
}

.section-label {
  font-size: 12px;
  color: #555;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}

.training-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 16px;
  line-height: 1.1;
  background: linear-gradient(180deg, #fff 0%, #888 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.training-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.meta-badge {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 13px;
  color: #888;
}

.training-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: #4ade80;
  color: #000;
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.btn-primary:hover {
  box-shadow: 0 0 20px rgba(74,222,128,.35);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: #ccc;
  border: 1px solid #333;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-secondary:hover { border-color: #555; }

.btn-danger {
  background: transparent;
  color: #f87171;
  border: 1px solid #3a1e1e;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.btn-danger:hover { border-color: #f87171; background: rgba(248,113,113,.08); }

.no-training {
  color: #555;
  font-size: 15px;
  margin: 0 0 16px;
}

.btn-create {
  background: transparent;
  color: #4ade80;
  border: 1px dashed rgba(74,222,128,.5);
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-create:hover { background: rgba(74,222,128,.08); }

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.stat-card {
  background: #111;
  border: 1px solid #1e1e1e;
  border-radius: 16px;
  padding: 20px 22px;
}

.stat-card-label {
  font-size: 11px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 14px;
}

.stat-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-name {
  font-size: 13px;
  color: #777;
}

.stat-val {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

/* Week bars */
.week-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 60px;
}

.bar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.bar {
  width: 100%;
  height: 44px;
  border-radius: 4px;
  background: #1e1e1e;
  transition: background 0.2s;
}
.bar.filled { background: #4ade80; }

.bar-label {
  font-size: 10px;
  color: #555;
}

/* History */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}
.recent-item:hover { background: #1a1a1a; }

.recent-icon {
  font-size: 16px;
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.recent-name {
  font-size: 13px;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-date {
  font-size: 11px;
  color: #555;
}

.no-history {
  font-size: 13px;
  color: #444;
  margin: 0;
}

.loading {
  color: #555;
  font-size: 14px;
}

.error {
  color: #f87171;
  font-size: 13px;
  margin-top: 12px;
}

/* Планшет / сжатый десктоп: сайдбар есть, но места мало */
@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 24px 16px 80px;
    min-height: unset;
  }

  .page-title {
    font-size: 22px;
    margin-bottom: 20px;
  }

  .day-strip-wrap {
    padding: 8px 10px;
    gap: 4px;
    margin-bottom: 16px;
  }

  .arrow-btn {
    font-size: 20px;
    padding: 4px 2px;
  }

  .day-num {
    font-size: 15px;
  }

  .training-section {
    padding: 20px 18px;
    margin-bottom: 16px;
  }

  .training-title {
    font-size: 26px;
    margin-bottom: 12px;
  }

  .training-actions {
    flex-wrap: wrap;
  }

  .btn-primary, .btn-secondary {
    flex: 1;
    text-align: center;
    padding: 12px 16px;
    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px 18px;
  }

  .week-bars {
    height: 52px;
  }
}
</style>
