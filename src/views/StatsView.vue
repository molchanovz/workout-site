<template>
  <div class="stats">
    <h1 class="page-title">Прогресс</h1>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <!-- Top cards: streak, month, year -->
      <div class="cards-row">
        <div class="card">
          <p class="card-label">Стрик</p>
          <p class="card-value">{{ streak?.currentStreak ?? 0 }}</p>
          <p class="card-sub">{{ pluralWeeks(streak?.currentStreak ?? 0) }} подряд</p>
        </div>
        <div class="card">
          <p class="card-label">В этом месяце</p>
          <p class="card-value">{{ streak?.monthCount ?? 0 }}</p>
          <p class="card-sub">{{ pluralTrainings(streak?.monthCount ?? 0) }}</p>
        </div>
        <div class="card">
          <p class="card-label">В этом году</p>
          <p class="card-value">{{ streak?.yearCount ?? 0 }}</p>
          <p class="card-sub">{{ pluralTrainings(streak?.yearCount ?? 0) }}</p>
        </div>
      </div>

      <!-- Weekly volume chart -->
      <div class="section">
        <p class="section-label">Объём нагрузки по неделям, кг</p>
        <div class="chart">
          <div
            v-for="bar in volumeBars"
            :key="bar.week"
            class="chart-col"
          >
            <div class="chart-bar-wrap">
              <div
                class="chart-bar"
                :style="{ height: bar.heightPct + '%' }"
                :class="{ active: bar.isCurrentWeek }"
              ></div>
            </div>
            <span class="chart-label">{{ bar.label }}</span>
          </div>
        </div>
      </div>

      <!-- Personal records table -->
      <div class="section">
        <p class="section-label">Личные рекорды</p>
        <div v-if="personalRecords.length" class="pr-table">
          <div class="pr-header">
            <span>Упражнение</span>
            <span>Лучший сет</span>
            <span>1RM (расч.)</span>
            <span class="pr-date-col">Дата</span>
          </div>
          <div v-for="pr in personalRecords" :key="pr.exerciseId" class="pr-row">
            <span class="pr-name">{{ pr.exerciseTitle }}</span>
            <span class="pr-set">{{ pr.maxWeight }} кг × {{ pr.reps }} повт.</span>
            <span class="pr-1rm">{{ pr.est1rm }} кг</span>
            <span class="pr-date pr-date-col">{{ formatDate(pr.achievedAt) }}</span>
          </div>
        </div>
        <p v-else class="empty">Нет данных — добавьте первую тренировку</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api.js'

const loading = ref(false)
const error = ref(null)
const streak = ref(null)
const weeklyVolume = ref([])
const personalRecords = ref([])

async function loadStats() {
  loading.value = true
  error.value = null
  try {
    const [streakRes, volumeRes, prRes] = await Promise.all([
      api.stats.streak(),
      api.stats.weeklyVolume({ weeks: 12 }),
      api.stats.personalRecords(),
    ])
    streak.value = streakRes
    weeklyVolume.value = Array.isArray(volumeRes) ? volumeRes : []
    personalRecords.value = Array.isArray(prRes) ? prRes : []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const volumeBars = computed(() => {
  const vols = weeklyVolume.value
  if (!vols.length) return []
  const maxVol = Math.max(...vols.map(v => v.volume), 1)
  const todayMon = startOfISOWeek(new Date())

  return vols.map(v => {
    const [, mm, dd] = v.week.split('-')
    const isCurrentWeek = v.week === todayMon
    return {
      week: v.week,
      heightPct: maxVol > 0 ? Math.max((v.volume / maxVol) * 100, v.volume > 0 ? 4 : 0) : 0,
      label: `${parseInt(dd)}.${mm}`,
      isCurrentWeek,
    }
  })
})

function startOfISOWeek(d) {
  const wd = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - wd + 1)
  mon.setHours(0, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('ru', { day: 'numeric', month: 'short' })
}

function pluralWeeks(n) {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return 'недель'
  if (m10 === 1) return 'неделя'
  if (m10 >= 2 && m10 <= 4) return 'недели'
  return 'недель'
}

function pluralTrainings(n) {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return 'тренировок'
  if (m10 === 1) return 'тренировка'
  if (m10 >= 2 && m10 <= 4) return 'тренировки'
  return 'тренировок'
}

onMounted(loadStats)
</script>

<style scoped>
.stats {
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

/* Top cards */
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: #111;
  border: 1px solid #1e1e1e;
  border-radius: 16px;
  padding: 20px 22px;
}

.card-label {
  font-size: 11px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 8px;
}

.card-value {
  font-size: 40px;
  font-weight: 800;
  color: #4ade80;
  margin: 0 0 4px;
  line-height: 1;
}

.card-sub {
  font-size: 12px;
  color: #555;
  margin: 0;
}

/* Section */
.section {
  background: #111;
  border: 1px solid #1e1e1e;
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 24px;
}

.section-label {
  font-size: 11px;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 16px;
}

/* Chart */
.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100px;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.chart-bar-wrap {
  height: 80px;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.chart-bar {
  width: 100%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  background: #3a3a3a;
  transition: height 0.3s;
}

.chart-bar.active {
  background: #4ade80;
}

.chart-label {
  font-size: 9px;
  color: #444;
  white-space: nowrap;
}

/* PR table */
.pr-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pr-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  padding: 0 0 10px;
  border-bottom: 1px solid #1e1e1e;
  font-size: 11px;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.pr-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  padding: 10px 0;
  border-bottom: 1px solid #161616;
  align-items: center;
}

.pr-row:last-child {
  border-bottom: none;
}

.pr-name {
  font-size: 14px;
  color: #ccc;
}

.pr-set {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
}

.pr-1rm {
  font-size: 14px;
  color: #4ade80;
  font-weight: 600;
}

.pr-date {
  font-size: 12px;
  color: #555;
}

/* Misc */
.empty {
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
}

/* Responsive */
@media (max-width: 960px) {
  .pr-date-col {
    display: none;
  }

  .pr-header,
  .pr-row {
    grid-template-columns: 2fr 1.5fr 1fr;
  }
}

@media (max-width: 768px) {
  .stats {
    padding: 24px 16px 80px;
    min-height: unset;
  }

  .page-title {
    font-size: 22px;
    margin-bottom: 20px;
  }

  .cards-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-value {
    font-size: 32px;
  }

  .chart {
    height: 80px;
  }

  .pr-header,
  .pr-row {
    grid-template-columns: 2fr 1.2fr 0.9fr;
    font-size: 13px;
  }

  .pr-date-col {
    display: none;
  }
}
</style>