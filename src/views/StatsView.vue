<template>
  <div class="scroll">
    <div class="page-head">
      <div>
        <p class="page-sub">За 12 недель</p>
        <h1 class="page-title">Прогресс</h1>
      </div>
    </div>

    <div v-if="loading" class="muted">Загрузка...</div>
    <div v-else-if="error" class="err">{{ error }}</div>

    <template v-else>
      <div class="stat-kpi-row">
        <div class="kpi accent">
          <div class="kp-val">
            {{ streak?.currentStreak ?? 0 }}<span class="kp-unit">нед</span>
          </div>
          <div class="kp-sub">Стрик</div>
        </div>
        <div class="kpi">
          <div class="kp-val">{{ streak?.monthCount ?? 0 }}</div>
          <div class="kp-sub">Месяц</div>
        </div>
        <div class="kpi">
          <div class="kp-val">{{ streak?.yearCount ?? 0 }}</div>
          <div class="kp-sub">Год</div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-head">
          <p class="chart-title">Объём · тонн/нед</p>
          <span v-if="volumeDelta != null" class="chart-metric">
            {{ volumeDelta >= 0 ? '↗' : '↘' }} {{ volumeDelta >= 0 ? '+' : '' }}{{ volumeDelta }}%
          </span>
        </div>
        <div class="chart">
          <div v-for="bar in volumeBars" :key="bar.week" class="chart-col">
            <div class="cbar-wrap">
              <div
                class="cbar"
                :class="{ active: bar.isCurrentWeek }"
                :style="{ height: bar.heightPct + '%' }"
              ></div>
            </div>
            <span class="cl" :class="{ curr: bar.isCurrentWeek }">{{ bar.label }}</span>
          </div>
        </div>
      </div>

      <div class="section-head">
        <h3>Личные рекорды</h3>
        <span v-if="freshCount" class="more">★ {{ freshCount }} {{ pluralFresh(freshCount) }}</span>
      </div>

      <div v-if="personalRecords.length" class="chart-section pr-list">
        <div
          v-for="(pr, i) in personalRecords"
          :key="pr.exerciseId"
          class="pr-row"
        >
          <div class="pr-rank">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="pr-info">
            <div class="pr-name">
              {{ pr.exerciseTitle }}
              <span v-if="isFresh(pr.achievedAt)" class="pr-fresh">★ NEW</span>
            </div>
            <div class="pr-date">{{ formatDate(pr.achievedAt) }}</div>
          </div>
          <div class="pr-num">
            <div class="pr-max">{{ pr.maxWeight }}<span class="pr-unit">×{{ pr.reps }}</span></div>
            <div class="pr-1rm">1RM {{ pr.est1rm }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty">Нет рекордов — добавьте первую тренировку</div>
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
    const [s, v, pr] = await Promise.all([
      api.stats.streak(),
      api.stats.weeklyVolume({ weeks: 12 }),
      api.stats.personalRecords(),
    ])
    streak.value = s
    weeklyVolume.value = Array.isArray(v) ? v : []
    personalRecords.value = Array.isArray(pr) ? pr : []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const currentISOWeek = computed(() => startOfISOWeek(new Date()))

const volumeBars = computed(() => {
  const vols = weeklyVolume.value
  if (!vols.length) return []
  const maxVol = Math.max(...vols.map(v => v.volume), 1)
  return vols.map(v => {
    const [, mm, dd] = v.week.split('-')
    return {
      week: v.week,
      heightPct: maxVol > 0 ? Math.max((v.volume / maxVol) * 100, v.volume > 0 ? 4 : 0) : 0,
      label: `${parseInt(dd)}.${mm}`,
      isCurrentWeek: v.week === currentISOWeek.value,
    }
  })
})

const volumeDelta = computed(() => {
  const v = weeklyVolume.value
  if (v.length < 2) return null
  const half = Math.floor(v.length / 2)
  const recent = v.slice(-half)
  const prev = v.slice(0, half)
  const sum = arr => arr.reduce((s, w) => s + (w.volume || 0), 0)
  const a = sum(prev)
  const b = sum(recent)
  if (a === 0) return b > 0 ? 100 : null
  return Math.round(((b - a) / a) * 100)
})

const freshCount = computed(() => personalRecords.value.filter(pr => isFresh(pr.achievedAt)).length)

function isFresh(d) {
  if (!d) return false
  const achieved = new Date(d)
  const now = new Date()
  return achieved.getFullYear() === now.getFullYear()
    && achieved.getMonth() === now.getMonth()
    && achieved.getDate() === now.getDate()
}

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

function pluralFresh(n) {
  const m10 = n % 10, m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return 'новых'
  if (m10 === 1) return 'новый'
  if (m10 >= 2 && m10 <= 4) return 'новых'
  return 'новых'
}

onMounted(loadStats)
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

.stat-kpi-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin: 4px 20px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
}
.kpi {
  padding: 16px 14px;
  border-right: 1px solid var(--border);
}
.kpi:last-child { border-right: 0; }
.kpi .kp-val {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.kpi.accent .kp-val { color: var(--accent); }
.kp-unit {
  font-size: 14px;
  color: var(--ink-3);
  margin-left: 3px;
  font-weight: 600;
  letter-spacing: 0;
}
.kpi .kp-sub {
  font-size: 10px;
  color: var(--ink-4);
  margin-top: 6px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.chart-section {
  margin: 0 20px 18px;
  padding: 20px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
}
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}
.chart-title {
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
  font-weight: 700;
}
.chart-metric {
  font-size: 13px;
  color: var(--accent);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 110px;
  margin: 0 -2px;
}
.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}
.cbar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}
.cbar {
  width: 100%;
  min-height: 3px;
  border-radius: 3px 3px 0 0;
  background: #252525;
}
.cbar.active {
  background: var(--accent);
  box-shadow: 0 0 14px rgba(196, 181, 253, 0.35);
}
.cl {
  font-size: 8.5px;
  color: var(--ink-4);
  font-weight: 600;
}
.cl.curr { color: var(--accent); }

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
  color: var(--gold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
}

.pr-list { padding: 8px 18px; }
.pr-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #1a1a1a;
}
.pr-row:last-child { border-bottom: 0; }
.pr-rank {
  width: 22px;
  text-align: right;
  font-size: 11px;
  color: var(--ink-4);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.pr-info { min-width: 0; }
.pr-name {
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pr-fresh {
  color: var(--gold);
  margin-left: 8px;
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.pr-date {
  font-size: 10px;
  color: var(--ink-4);
  letter-spacing: 0.06em;
  margin-top: 2px;
  text-transform: uppercase;
}
.pr-num { text-align: right; }
.pr-max {
  font-size: 16px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
.pr-unit {
  font-size: 11px;
  color: var(--ink-4);
  font-weight: 600;
  margin-left: 3px;
}
.pr-1rm {
  font-size: 10px;
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-top: 2px;
}

.empty {
  margin: 0 20px;
  padding: 28px 0;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}
.muted {
  margin: 0 20px;
  padding: 40px 0;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}
.err {
  margin: 0 20px;
  padding: 12px 14px;
  background: rgba(255, 92, 92, 0.08);
  border: 1px solid rgba(255, 92, 92, 0.3);
  border-radius: 12px;
  color: var(--danger);
  font-size: 13px;
}

@media (min-width: 1024px) {
  .scroll { max-width: 760px; padding: 24px 0 60px; }
  .page-head { padding: 4px 28px 22px; }
  .page-title { font-size: 44px; }
  .stat-kpi-row { margin: 4px 28px 22px; }
  .kpi { padding: 22px 20px; }
  .kpi .kp-val { font-size: 40px; }
  .chart-section { margin: 0 28px 22px; padding: 24px 24px; }
  .chart { height: 140px; }
  .section-head { padding-left: 28px; padding-right: 28px; }
  .empty, .muted, .err { margin-left: 28px; margin-right: 28px; }
}
</style>
