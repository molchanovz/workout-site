<template>
  <div class="scroll">
    <!-- Page head -->
    <div class="page-head">
      <div>
        <p class="page-sub">{{ headSub }}</p>
        <h1 class="page-title">{{ headTitle }}</h1>
      </div>
      <div class="avatar">{{ avatarLetter }}</div>
    </div>

    <!-- Skeleton while loading -->
    <template v-if="loading">
      <div class="day-strip-skel">
        <div v-for="i in 7" :key="i" class="skeleton sk-day"></div>
      </div>
      <div class="skeleton sk-hero"></div>
      <div class="big-stats">
        <div class="skeleton sk-stat"></div>
        <div class="skeleton sk-stat"></div>
        <div class="skeleton sk-stat"></div>
      </div>
      <div class="section-head"><div class="skeleton sk-section-title"></div></div>
      <div class="hist-skel">
        <div v-for="i in 3" :key="i" class="skeleton sk-hist-row"></div>
      </div>
    </template>

    <template v-else>
    <!-- Day strip -->
    <div class="day-strip" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div
        v-for="day in weekDays"
        :key="day.ds"
        class="day-item"
        :class="{ has: day.hasTraining, today: day.isToday, active: day.ds === selectedDateStr }"
        @click="selectedDateStr = day.ds"
      >
        <span class="dow">{{ day.dow }}</span>
        <span class="num">{{ day.num }}</span>
        <span v-if="day.hasTraining" class="dot"></span>
      </div>
    </div>

    <!-- Hero: training or rest -->
    <template v-if="selectedTraining">
      <div class="hero">
        <div class="hero-kicker">
          <span class="live">{{ isSelectedToday ? 'Сегодня' : formatDate(selectedDateStr) }}</span>
          <span v-if="heroRightLabel">{{ heroRightLabel }}</span>
        </div>
        <h2 class="hero-title">{{ selectedTraining.name || 'Тренировка' }}</h2>
        <div class="hero-split">
          <div class="hero-stat">
            <div class="hs-val">{{ selectedTraining.exerciseCount || 0 }}</div>
            <div class="hs-label">упражнений</div>
          </div>
          <div class="hero-stat">
            <div class="hs-val">{{ selectedSetCount }}</div>
            <div class="hs-label">подходов</div>
          </div>
          <div class="hero-stat">
            <div class="hs-val">
              {{ selectedVolumeTons }}<span v-if="selectedVolume > 0" class="hs-unit">т</span>
            </div>
            <div class="hs-label">объём</div>
          </div>
        </div>
        <button class="hero-start" @click="openTraining(selectedTraining.id)">
          Открыть тренировку →
        </button>
      </div>

      <div v-if="nextTraining" class="next-row" @click="openTraining(nextTraining.id)">
        <div class="next-cal">
          <span class="m">{{ dayMonth(nextTraining.date).m }}</span>
          <span class="d">{{ dayMonth(nextTraining.date).d }}</span>
        </div>
        <div class="next-info">
          <div class="eye">Следующая</div>
          <div class="nm">{{ nextTraining.name || 'Тренировка' }}</div>
        </div>
        <svg class="next-arrow" width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
    </template>

    <div v-else class="hero-rest">
      <p class="page-sub">{{ isSelectedToday ? 'День отдыха' : formatDate(selectedDateStr) }}</p>
      <h2>{{ isSelectedToday ? 'Сегодня разгрузка' : 'Нет тренировки' }}</h2>
      <p v-if="nextTraining">
        Следующая — {{ nextTraining.name || 'тренировка' }} через {{ daysUntil(nextTraining.date) }} д.
      </p>
      <p v-else>Запланируй тренировку на этот день.</p>
      <button class="btn-ghost" @click="createTraining">＋ Создать тренировку</button>
    </div>

    <!-- Big stats -->
    <div class="big-stats">
      <div class="big-stat accent">
        <div class="bs-val">
          {{ streak.currentStreak || 0 }}<span class="bs-unit">нед</span>
        </div>
        <div class="bs-label">Стрик</div>
      </div>
      <div class="big-stat">
        <div class="bs-val">{{ streak.monthCount || 0 }}</div>
        <div class="bs-label">Этот месяц</div>
      </div>
      <div class="big-stat">
        <div class="bs-val">{{ streak.yearCount || 0 }}</div>
        <div class="bs-label">Этот год</div>
      </div>
    </div>

    <!-- History -->
    <div class="section-head">
      <h3>История</h3>
      <span class="more" @click="$router.push('/app/calendar')">Все →</span>
    </div>
    <div class="hist" v-if="historyList.length">
      <div
        v-for="t in historyList"
        :key="t.id"
        class="hist-row"
        @click="openTraining(t.id)"
      >
        <div class="hist-date-cube">
          <div class="d">{{ dayMonth(t.date).d }}</div>
          <div class="m">{{ dayMonth(t.date).m }}</div>
        </div>
        <div>
          <div class="hist-name">{{ t.name || 'Тренировка' }}</div>
          <div class="hist-meta">
            {{ t.exerciseCount || 0 }} упр
            <span class="sep">·</span>
            {{ (t.approachIds || []).length }} подх
          </div>
        </div>
        <svg class="arrow" width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-dash"></div>
      <p class="empty-title">Пока пусто</p>
      <p class="empty-sub">Здесь появятся твои завершённые тренировки.</p>
    </div>

    </template>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { currentUser } = useAuth()

const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DOW_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function weekOfYear(d) {
  const date = new Date(d.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - dayNr + 3)
  const firstThursday = date.valueOf()
  date.setMonth(0, 1)
  if (date.getDay() !== 4) {
    date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - date) / 604800000)
}

const today = new Date()
const todayStr = toDateStr(today)
const selectedDateStr = ref(todayStr)

const trainings = ref([])
const streak = ref({ currentStreak: 0, monthCount: 0, yearCount: 0 })
const selectedDetail = ref(null)
const error = ref(null)
const loading = ref(true)

const avatarLetter = computed(() => {
  const n = currentUser.value?.name || currentUser.value?.email || '?'
  return n.charAt(0).toUpperCase()
})

const trainingsMap = computed(() => {
  const m = new Map()
  for (const t of trainings.value) {
    if (t.date) m.set(t.date.slice(0, 10), t)
  }
  return m
})

const weekDays = computed(() => {
  const sel = new Date(selectedDateStr.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sel, i - 3)
    const ds = toDateStr(d)
    return {
      ds,
      dow: DOW[d.getDay()],
      num: d.getDate(),
      isToday: ds === todayStr,
      hasTraining: trainingsMap.value.has(ds),
    }
  })
})

const selectedTraining = computed(() => trainingsMap.value.get(selectedDateStr.value) || null)
const isSelectedToday = computed(() => selectedDateStr.value === todayStr)

const selectedSetCount = computed(() => {
  const t = selectedTraining.value
  if (!t) return 0
  return (t.approachIds || []).length
})

const selectedVolume = computed(() => {
  const d = selectedDetail.value
  if (!d) return 0
  return (d.exercises || []).reduce((sum, e) => {
    return sum + (e.approaches || []).reduce((s, a) => s + (a.weight || 0) * (a.reps || 0), 0)
  }, 0)
})

const selectedVolumeTons = computed(() => {
  const v = selectedVolume.value
  if (!v) return '—'
  return (v / 1000).toFixed(1)
})

const heroRightLabel = computed(() => {
  const s = selectedSetCount.value
  if (!s) return null
  return `~ ${Math.max(20, s * 3)} мин`
})

const headSub = computed(() => {
  const d = new Date(selectedDateStr.value)
  return `${DOW_FULL[d.getDay()]} · неделя ${weekOfYear(d)}`
})

const headTitle = computed(() => {
  if (isSelectedToday.value) return 'Сегодня'
  const d = new Date(selectedDateStr.value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
})

const nextTraining = computed(() => {
  const from = isSelectedToday.value ? todayStr : selectedDateStr.value
  return trainings.value
    .filter(t => t.date && t.date.slice(0, 10) > from)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null
})

const historyList = computed(() =>
  [...trainings.value]
    .filter(t => t.date && t.date.slice(0, 10) < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
)

function dayMonth(str) {
  const d = new Date(str)
  return { d: d.getDate(), m: MONTHS_SHORT[d.getMonth()] }
}

function formatDate(str) {
  const d = new Date(str)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function daysUntil(str) {
  const d = new Date(str)
  const base = new Date(todayStr)
  return Math.max(1, Math.ceil((d - base) / 86400000))
}

function openTraining(id) {
  router.push(`/app/trainings/${id}`)
}

async function createTraining() {
  try {
    const t = await api.training.new({ date: selectedDateStr.value })
    const id = typeof t === 'number' ? t : t?.id
    if (id) router.push(`/app/trainings/${id}`)
    else await loadTrainings()
  } catch (e) { error.value = e.message }
}

async function loadTrainings() {
  error.value = null
  try {
    const sel = new Date(selectedDateStr.value)
    const from = toDateStr(addDays(sel, -30))
    const to = toDateStr(addDays(sel, 30))
    const result = await api.training.list({ from, to })
    trainings.value = Array.isArray(result) ? result : (result?.items || [])
  } catch (e) { error.value = e.message }
}

async function loadStreak() {
  try { streak.value = await api.stats.streak() || {} } catch { /* ignore */ }
}

async function loadSelectedDetail() {
  const t = selectedTraining.value
  if (!t) { selectedDetail.value = null; return }
  try { selectedDetail.value = await api.training.get({ id: t.id }) } catch { selectedDetail.value = null }
}

watch(selectedDateStr, () => { loadSelectedDetail() })
watch(() => selectedTraining.value?.id, () => { loadSelectedDetail() })

// Swipe on day strip
let touchStartX = 0
function onTouchStart(e) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 40) {
    const d = new Date(selectedDateStr.value)
    d.setDate(d.getDate() + (dx < 0 ? 1 : -1))
    selectedDateStr.value = toDateStr(d)
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadTrainings(), loadStreak(), loadSelectedDetail()])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0 100px;
  max-width: 430px;
  margin: 0 auto;
  width: 100%;
}

/* Page head */
.page-head {
  padding: 14px 20px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.page-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1;
}
.page-sub {
  font-size: 11px;
  color: var(--ink-4);
  margin: 0 0 6px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b4fcf, #a78bfa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

/* Day strip */
.day-strip {
  display: flex;
  gap: 4px;
  padding: 0 20px 20px;
  overflow-x: auto;
}
.day-item {
  flex: 1;
  min-width: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 2px 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
  position: relative;
}
.day-item .dow {
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  font-weight: 600;
  text-transform: uppercase;
}
.day-item .num {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-3);
}
.day-item.has .dot {
  position: absolute;
  bottom: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ink-3);
}
.day-item.today .num { color: var(--accent); }
.day-item.active {
  background: #fff;
}
.day-item.active .dow,
.day-item.active .num { color: #000; }
.day-item.active .dot { background: #000; }
.day-item.today.active {
  background: var(--accent);
}
.day-item.today.active .num { color: #000; }

/* Hero */
.hero {
  margin: 0 20px 14px;
  background: var(--accent);
  color: #000;
  border-radius: 24px;
  padding: 22px 22px 18px;
  position: relative;
  overflow: hidden;
}
.hero-kicker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
}
.hero-kicker .live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hero-kicker .live::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #000;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.hero-title {
  font-size: 44px;
  font-weight: 900;
  margin: 0 0 4px;
  letter-spacing: -0.035em;
  line-height: 0.95;
  color: #000;
}
.hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  padding: 18px 0 4px;
  border-top: 1.5px solid rgba(0, 0, 0, 0.12);
  margin-top: 18px;
}
.hero-stat .hs-val {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #000;
}
.hero-stat .hs-unit { font-size: 14px; margin-left: 2px; }
.hero-stat .hs-label {
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 5px;
  font-weight: 600;
}
.hero-start {
  width: 100%;
  margin-top: 16px;
  background: #000;
  color: var(--accent);
  border: 0;
  padding: 16px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
  transition: transform 0.1s;
}
.hero-start:active { transform: scale(0.98); }

/* Rest hero */
.hero-rest {
  margin: 0 20px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 28px 22px;
}
.hero-rest h2 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}
.hero-rest p {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0 0 18px;
  line-height: 1.5;
}
.btn-ghost {
  background: transparent;
  color: var(--accent);
  border: 1px dashed rgba(196, 181, 253, 0.4);
  width: 100%;
  padding: 14px;
  font-size: 13px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

/* Next row */
.next-row {
  margin: 0 20px 14px;
  padding: 16px 20px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}
.next-cal {
  width: 52px;
  height: 52px;
  border-radius: 13px;
  background: var(--surface);
  border: 1px solid var(--border-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.next-cal .m {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
}
.next-cal .d { font-size: 22px; font-weight: 800; line-height: 1; }
.next-info { flex: 1; min-width: 0; }
.next-info .eye {
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
  margin-bottom: 3px;
}
.next-info .nm { font-size: 16px; font-weight: 700; }
.next-arrow { color: var(--ink-4); }

/* Big stats */
.big-stats {
  margin: 4px 20px 18px;
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
}
.big-stat {
  background: var(--bg);
  padding: 18px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.big-stat .bs-val {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.big-stat.accent .bs-val { color: var(--accent); }
.big-stat .bs-unit {
  font-size: 14px;
  color: var(--ink-3);
  font-weight: 600;
  margin-left: 3px;
}
.big-stat .bs-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
  margin-top: 6px;
}

/* Section head */
.section-head {
  padding: 8px 20px 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.section-head h3 {
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-3);
  margin: 0;
}
.section-head .more {
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

/* History */
.hist {
  margin: 0 20px;
  border-top: 1px solid var(--border);
}
.hist-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.hist-date-cube {
  width: 40px;
  flex-shrink: 0;
  text-align: left;
}
.hist-date-cube .d {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.hist-date-cube .m {
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
  margin-top: 2px;
}
.hist-name { font-size: 15px; font-weight: 600; color: var(--ink); }
.hist-meta {
  font-size: 11px;
  color: var(--ink-4);
  margin-top: 3px;
  letter-spacing: 0.04em;
}
.hist-meta .sep { margin: 0 6px; }
.hist-row .arrow { color: var(--ink-4); }

/* Empty */
.empty-state {
  margin: 40px 20px 20px;
  padding: 32px 24px;
  text-align: center;
}
.empty-dash {
  width: 32px;
  height: 2px;
  background: var(--ink-4);
  margin: 0 auto 20px;
  opacity: 0.4;
}
.empty-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.empty-sub {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0 auto;
  line-height: 1.5;
  max-width: 280px;
}

.error {
  color: var(--danger);
  font-size: 13px;
  margin: 12px 20px 0;
}

@media (min-width: 1024px) {
  .scroll { max-width: 760px; padding: 24px 0 60px; }
  .page-head { padding: 4px 28px 28px; }
  .page-title { font-size: 44px; }
  .day-strip { padding: 0 28px 22px; gap: 8px; }
  .hero, .hero-rest, .next-row { margin-left: 28px; margin-right: 28px; }
  .hero-title { font-size: 32px; }
  .big-stats { margin: 0 28px 20px; gap: 12px; }
  .section-head { padding-left: 28px; padding-right: 28px; }
  .hist { margin: 0 28px; }
  .empty-state { margin-left: 28px; margin-right: 28px; }
}

/* Skeletons */
.day-strip-skel {
  display: flex;
  gap: 4px;
  padding: 0 20px 20px;
}
.sk-day {
  flex: 1;
  min-width: 42px;
  height: 58px;
  border-radius: 12px;
}
.sk-hero {
  margin: 0 20px 14px;
  height: 210px;
  border-radius: 24px;
}
.sk-stat {
  height: 86px;
  border-radius: 0;
}
.big-stats .sk-stat:first-child { border-top-left-radius: 18px; border-bottom-left-radius: 18px; }
.big-stats .sk-stat:last-child { border-top-right-radius: 18px; border-bottom-right-radius: 18px; }
.sk-section-title {
  height: 14px;
  width: 90px;
  border-radius: 4px;
}
.hist-skel {
  margin: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sk-hist-row {
  height: 56px;
  border-radius: 12px;
}
</style>
