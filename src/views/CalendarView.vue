<template>
  <div>
  <div class="scroll">
    <div class="page-head">
      <div>
        <p class="page-sub">{{ monthTrainings.length }} {{ pluralTrain(monthTrainings.length) }}</p>
        <h1 class="page-title">Календарь</h1>
      </div>
    </div>

    <div class="cal-header">
      <span class="cal-month">{{ monthLabel }}</span>
      <div class="nav-buttons">
        <button class="nav-btn" @click="shiftMonth(-1)" aria-label="Предыдущий">‹</button>
        <button class="nav-btn" @click="shiftMonth(1)" aria-label="Следующий">›</button>
      </div>
    </div>

    <div class="weekdays">
      <span v-for="d in WEEKDAYS" :key="d">{{ d }}</span>
    </div>

    <div v-if="loading" class="days">
      <div v-for="i in 42" :key="i" class="skeleton sk-cell"></div>
    </div>
    <div v-else class="days">
      <div
        v-for="cell in gridCells"
        :key="cell.key"
        class="day-cell"
        :class="{
          other: cell.otherMonth,
          today: cell.isToday,
          has: cell.hasTraining,
          selected: cell.dateStr === selectedDateStr,
        }"
        @click="onCellClick(cell)"
      >
        <span>{{ cell.day }}</span>
        <span v-if="cell.hasTraining" class="mini-dot"></span>
      </div>
    </div>

    <div class="section-head" style="margin-top: 18px;">
      <h3>Тренировки · {{ monthOnly }}</h3>
    </div>
    <div v-if="loading" class="hist-skel">
      <div v-for="i in 3" :key="i" class="skeleton sk-hist-row"></div>
    </div>
    <div v-else-if="monthTrainings.length" class="hist">
      <div
        v-for="t in monthTrainings"
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
    <div v-else class="month-empty">Нет тренировок в этом месяце</div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>

  <!-- Bottom sheet -->
  <template v-if="selectedDateStr">
    <div class="sheet-backdrop" @click="selectedDateStr = null"></div>
    <div class="sheet">
      <div class="sheet-handle"></div>
      <p class="page-sub">{{ selectedDateLabel }}</p>
      <template v-if="selectedTraining">
        <h3 class="sheet-title">{{ selectedTraining.name || 'Тренировка' }}</h3>
        <div class="sheet-stats">
          <div>
            <div class="ss-val">{{ selectedTraining.exerciseCount || 0 }}</div>
            <div class="ss-label">упр</div>
          </div>
          <div>
            <div class="ss-val">{{ (selectedTraining.approachIds || []).length }}</div>
            <div class="ss-label">подх</div>
          </div>
        </div>
        <div class="sheet-actions">
          <button class="sheet-open" @click="openTraining(selectedTraining.id)">Открыть →</button>
          <button class="sheet-del" @click="deleteTraining(selectedTraining.id)" aria-label="Удалить">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 4h8M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v7a1 1 0 001 1h2a1 1 0 001-1V4"
                    stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </template>
      <template v-else>
        <p class="sheet-empty">На этот день нет тренировки</p>
        <button class="btn-ghost" @click="createTraining">＋ Создать тренировку</button>
      </template>
    </div>
  </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api.js'

const router = useRouter()

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

const today = new Date()
const todayStr = toDateStr(today)

const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDateStr = ref(null)

const trainings = ref([])
const error = ref(null)
const loading = ref(true)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.toLocaleString('ru', { month: 'long', year: 'numeric' })
})
const monthOnly = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  return d.toLocaleString('ru', { month: 'long' })
})

const trainingsMap = computed(() => {
  const m = new Map()
  for (const t of trainings.value) {
    if (t.date) m.set(t.date.slice(0, 10), t)
  }
  return m
})

const monthTrainings = computed(() => {
  const y = currentYear.value, m = currentMonth.value
  return trainings.value
    .filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === y && d.getMonth() === m
    })
    .sort((a, b) => b.date.localeCompare(a.date))
})

const gridCells = computed(() => {
  const y = currentYear.value, m = currentMonth.value
  const firstDay = new Date(y, m, 1)
  const lastDay = new Date(y, m + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(y, m, 1 - (startOffset - i))
    cells.push({ key: `p-${i}`, day: d.getDate(), dateStr: toDateStr(d), otherMonth: true, isToday: false, hasTraining: false })
  }
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(y, m, day)
    const ds = toDateStr(d)
    cells.push({
      key: ds, day, dateStr: ds, otherMonth: false,
      isToday: ds === todayStr,
      hasTraining: trainingsMap.value.has(ds),
    })
  }
  const rem = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= rem; i++) {
    const d = new Date(y, m + 1, i)
    cells.push({ key: `n-${i}`, day: i, dateStr: toDateStr(d), otherMonth: true, isToday: false, hasTraining: false })
  }
  return cells
})

const selectedTraining = computed(() => {
  if (!selectedDateStr.value) return null
  return trainingsMap.value.get(selectedDateStr.value) || null
})

const selectedDateLabel = computed(() => {
  if (!selectedDateStr.value) return ''
  const d = new Date(selectedDateStr.value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
})

function dayMonth(str) {
  const d = new Date(str)
  return { d: d.getDate(), m: MONTHS_SHORT[d.getMonth()] }
}

function onCellClick(cell) {
  if (cell.otherMonth) return
  selectedDateStr.value = selectedDateStr.value === cell.dateStr ? null : cell.dateStr
}

function shiftMonth(n) {
  let m = currentMonth.value + n
  let y = currentYear.value
  if (m < 0) { m = 11; y-- }
  if (m > 11) { m = 0; y++ }
  currentMonth.value = m
  currentYear.value = y
  loadTrainings()
}

function openTraining(id) { router.push(`/app/trainings/${id}`) }

async function createTraining() {
  try {
    const t = await api.training.new({ date: selectedDateStr.value })
    const id = typeof t === 'number' ? t : t?.id
    if (id) router.push(`/app/trainings/${id}`)
  } catch (e) { error.value = e.message }
}

async function deleteTraining(id) {
  if (!confirm('Удалить тренировку?')) return
  try {
    await api.training.delete({ id })
    trainings.value = trainings.value.filter(t => t.id !== id)
    selectedDateStr.value = null
  } catch (e) { error.value = e.message }
}

async function loadTrainings() {
  error.value = null
  try {
    const y = currentYear.value, m = currentMonth.value
    const from = `${y}-${pad(m + 1)}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`
    const result = await api.training.list({ from, to })
    trainings.value = Array.isArray(result) ? result : (result?.items || [])
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function pluralTrain(n) {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return 'тренировок'
  if (m10 === 1) return 'тренировка'
  if (m10 >= 2 && m10 <= 4) return 'тренировки'
  return 'тренировок'
}

onMounted(loadTrainings)
</script>

<style scoped>
.scroll {
  padding: 8px 0 100px;
  max-width: 430px;
  margin: 0 auto;
  width: 100%;
}

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

.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 20px 10px;
}
.cal-month {
  font-size: 20px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: -0.02em;
}
.nav-buttons { display: flex; gap: 6px; }
.nav-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-2);
  background: transparent;
  color: var(--ink-2);
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
}
.nav-btn:hover { color: var(--ink); }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin: 0 20px 6px;
}
.weekdays span {
  text-align: center;
  font-size: 10px;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 0;
  font-weight: 600;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 0 20px;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-2);
  position: relative;
}
.day-cell.other {
  color: #2a2a2a;
  cursor: default;
}
.day-cell.has { background: var(--surface); }
.day-cell.today {
  color: var(--accent);
  font-weight: 700;
}
.day-cell.today.has {
  background: rgba(196, 181, 253, 0.14);
  border-color: rgba(196, 181, 253, 0.35);
}
.day-cell.selected {
  background: var(--accent) !important;
  color: #000 !important;
  border-color: var(--accent);
}
.day-cell .mini-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
.day-cell.selected .mini-dot { background: #000; }

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
.hist-date-cube { width: 40px; flex-shrink: 0; }
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

.month-empty {
  padding: 20px;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}

.error {
  color: var(--danger);
  font-size: 13px;
  margin: 12px 20px 0;
}

/* Bottom sheet */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  animation: fadeIn 0.2s;
}
.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #0e0e0e;
  border-top: 1px solid var(--border);
  border-radius: 24px 24px 0 0;
  padding: 12px 20px calc(22px + env(safe-area-inset-bottom, 0px));
  z-index: 210;
  max-width: 430px;
  margin: 0 auto;
  animation: slideUp 0.25s cubic-bezier(.2, .8, .2, 1);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle {
  width: 40px;
  height: 4px;
  background: #333;
  border-radius: 3px;
  margin: 0 auto 14px;
}
.sheet-title {
  margin: 6px 0 14px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.sheet-stats {
  display: flex;
  gap: 24px;
  padding-bottom: 18px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.sheet-stats .ss-val {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.sheet-stats .ss-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
  margin-top: 4px;
}
.sheet-actions {
  display: flex;
  gap: 8px;
}
.sheet-open {
  flex: 1;
  background: var(--accent);
  color: #000;
  border: 0;
  padding: 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-transform: uppercase;
}
.sheet-del {
  background: transparent;
  border: 1px solid var(--border-2);
  color: var(--ink-3);
  border-radius: 14px;
  width: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sheet-del:hover {
  color: var(--danger);
  border-color: var(--danger);
}
.sheet-empty {
  color: var(--ink-3);
  font-size: 14px;
  margin: 0 0 14px;
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

@media (min-width: 1024px) {
  .scroll { max-width: 820px; padding: 24px 0 60px; }
  .page-head { padding: 4px 28px 22px; }
  .cal-header { margin: 0 28px 12px; }
  .weekdays { margin: 0 28px 6px; }
  .days { margin: 0 28px 24px; gap: 6px; }
  .section-head { padding-left: 28px; padding-right: 28px; }
  .hist { margin: 0 28px; }
}

/* Skeletons */
.sk-cell {
  aspect-ratio: 1;
  border-radius: 12px;
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
@media (min-width: 1024px) {
  .hist-skel { margin: 0 28px; }
}
</style>
