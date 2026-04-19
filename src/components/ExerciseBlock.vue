<template>
  <div class="ex-block">
    <div class="ex-head">
      <div style="flex: 1; min-width: 0;">
        <div class="ex-num">
          {{ indexLabel }} · {{ approaches.length }} {{ pluralApp(approaches.length) }}
        </div>
        <h3 class="ex-name">{{ item.exercise.title }}</h3>
      </div>
      <div class="ex-best" v-if="bestLabel">
        Лучший<b>{{ bestLabel }}</b>
      </div>
    </div>

    <div class="set-table" v-if="approaches.length">
      <div class="set-h">#</div>
      <div class="set-h">{{ isTimed ? 'Время' : 'Вес' }}</div>
      <div class="set-h">{{ isTimed ? '' : 'Повт' }}</div>
      <div class="set-h" style="text-align: right;">×</div>

      <template v-for="(a, i) in approaches" :key="a.id">
        <div class="set-cell num">{{ i + 1 }}</div>

        <template v-if="isTimed">
          <div
            class="set-cell weight editable"
            :class="{ active: isEditing(a.id, 'duration') }"
            @click="openEditor(a, 'duration')"
          >
            {{ a.duration }}<span class="unit">сек</span>
          </div>
          <div class="set-cell"></div>
        </template>
        <template v-else>
          <div
            class="set-cell weight editable"
            :class="{ active: isEditing(a.id, 'weight') }"
            @click="openEditor(a, 'weight')"
          >
            <template v-if="a.weight != null">{{ a.weight }}<span class="unit">кг</span></template>
            <template v-else>—</template>
          </div>
          <div
            class="set-cell reps editable"
            :class="{ active: isEditing(a.id, 'reps') }"
            @click="openEditor(a, 'reps')"
          >
            {{ a.reps }}<span class="unit">×</span>
          </div>
        </template>

        <div class="set-cell check">
          <button
            class="set-check"
            :class="{ done: doneSet.has(a.id) }"
            @click="toggleDone(a.id)"
            aria-label="Отметить подход"
          >
            <svg v-if="doneSet.has(a.id)" width="14" height="14" viewBox="0 0 14 14">
              <path d="M3 7l3 3 5-6" stroke="#000" stroke-width="2.5" fill="none"
                    stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <div v-if="editing" class="set-editor">
      <div class="ed-head">
        <div class="ed-label">
          Подход {{ editing.index + 1 }}<b>{{ editorLabel }}</b>
        </div>
        <button class="ed-close" @click="closeEditor">✕</button>
      </div>
      <div class="ed-input-row">
        <button class="ed-step" @click="stepVal(-stepSize)">−</button>
        <input
          ref="editorInput"
          class="ed-input"
          inputmode="decimal"
          :value="editVal"
          @input="onEditInput"
          @keydown.enter="closeEditor"
        />
        <button class="ed-step" @click="stepVal(stepSize)">+</button>
        <div class="ed-unit">{{ editorUnit }}</div>
      </div>
      <div v-if="chipValues.length" class="ed-chips-label">История</div>
      <div v-if="chipValues.length" class="ed-chips">
        <button
          v-for="c in chipValues"
          :key="c.value"
          class="ed-chip"
          :class="{ current: Number(editVal) === c.value, best: bestChipValue === c.value && Number(editVal) !== c.value }"
          @click="applyChip(c.value)"
        >
          {{ c.value }}<span
            v-if="c.complement != null"
            class="chip-sub"
          >×{{ c.complement }}</span>
          <span v-if="bestChipValue === c.value"> ★</span>
        </button>
      </div>
    </div>

    <button class="add-set-inline" @click="addSet" :disabled="adding">
      {{ adding ? 'Добавление…' : '＋ Добавить подход' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  trainingId: { type: Number, required: true },
  best: { type: Object, default: null },
})
const emit = defineEmits(['changed'])

const editing = ref(null) // { id, field: 'weight'|'reps'|'duration', index }
const editVal = ref('')
const editorInput = ref(null)
const adding = ref(false)
const doneSet = ref(new Set()) // local-only: approachId set; backend integration TBD
let commitTimer = null

function toggleDone(id) {
  const s = new Set(doneSet.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  doneSet.value = s
}

function flattenApproaches(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return [...(raw.strength || []), ...(raw.timed || [])]
}

const approaches = computed(() => flattenApproaches(props.item.approaches))
const isTimed = computed(() => props.item.exercise.typeId !== 1)

const indexLabel = computed(() => {
  const n = Number(props.index)
  if (!Number.isFinite(n)) return '01'
  return String(n + 1).padStart(2, '0')
})

const bestLabel = computed(() => {
  const b = props.best
  if (!b) return null
  if (isTimed.value) return `${b.maxWeight || 0}с`
  return `${b.maxWeight} × ${b.reps}`
})

const stepSize = computed(() => {
  if (!editing.value) return 1
  if (editing.value.field === 'weight') return 2.5
  return 1
})

const editorUnit = computed(() => {
  if (!editing.value) return ''
  if (editing.value.field === 'weight') return 'кг'
  if (editing.value.field === 'duration') return 'сек'
  return '×'
})

const editorLabel = computed(() => {
  if (!editing.value) return ''
  if (editing.value.field === 'weight') return 'вес'
  if (editing.value.field === 'duration') return 'время'
  return 'повторы'
})

const chipValues = computed(() => {
  if (!editing.value) return []
  if (editing.value.field !== 'weight') return []
  const latestComplement = new Map()
  for (const a of approaches.value) {
    if (a.weight == null) continue
    latestComplement.set(a.weight, a.reps ?? null)
  }
  const b = props.best
  if (b && !latestComplement.has(b.maxWeight)) latestComplement.set(b.maxWeight, b.reps)
  return [...latestComplement.entries()]
    .sort(([a], [z]) => a - z)
    .map(([value, complement]) => ({ value, complement }))
})

const bestChipValue = computed(() => {
  const b = props.best
  if (!b || !editing.value || editing.value.field !== 'weight') return null
  return b.maxWeight
})

function isEditing(id, field) {
  return editing.value && editing.value.id === id && editing.value.field === field
}

function openEditor(a, field) {
  const idx = approaches.value.findIndex(x => x.id === a.id)
  editing.value = { id: a.id, field, index: idx }
  editVal.value = String(a[field] ?? '')
  nextTick(() => {
    const el = editorInput.value
    if (!el) return
    el.focus()
    setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320)
  })
}

function closeEditor() {
  if (commitTimer) { clearTimeout(commitTimer); commitTimer = null; commitNow() }
  editing.value = null
  editVal.value = ''
}

function onEditInput(e) {
  editVal.value = e.target.value
  scheduleCommit()
}

function stepVal(delta) {
  const cur = parseFloat(String(editVal.value).replace(',', '.')) || 0
  const next = Math.max(0, Math.round((cur + delta) * 10) / 10)
  editVal.value = String(next)
  scheduleCommit()
}

function applyChip(v) {
  editVal.value = String(v)
  scheduleCommit()
}

function scheduleCommit() {
  if (commitTimer) clearTimeout(commitTimer)
  commitTimer = setTimeout(commitNow, 500)
}

async function commitNow() {
  if (!editing.value) return
  const ed = editing.value
  const raw = String(editVal.value).replace(',', '.')
  const num = raw === '' ? null : parseFloat(raw)
  if (num == null || isNaN(num) || num < 0) return
  const cur = approaches.value.find(a => a.id === ed.id)
  if (!cur) return
  if (cur[ed.field] === num) return

  try {
    if (isTimed.value) {
      await api.training.updateTimedApproach({ approachId: ed.id, duration: num })
    } else {
      const weight = ed.field === 'weight' ? num : cur.weight
      const reps = ed.field === 'reps' ? num : cur.reps
      await api.training.updateApproach({ approachId: ed.id, reps: Number(reps), weight: Number(weight) })
    }
    emit('changed')
  } catch { /* ignore — next edit will retry */ }
}

async function addSet() {
  if (adding.value) return
  adding.value = true
  try {
    const last = approaches.value[approaches.value.length - 1]
    if (isTimed.value) {
      await api.training.addTimedApproach({
        trainingId: props.trainingId,
        exerciseId: props.item.exercise.id,
        duration: Number(last?.duration) || 30,
      })
    } else {
      await api.training.addApproach({
        trainingId: props.trainingId,
        exerciseId: props.item.exercise.id,
        reps: Number(last?.reps) || 10,
        weight: Number(last?.weight) || 20,
      })
    }
    emit('changed')
  } finally { adding.value = false }
}

function pluralApp(n) {
  const m10 = n % 10
  const m100 = n % 100
  if (m100 >= 11 && m100 <= 19) return 'подх'
  if (m10 === 1) return 'подх'
  return 'подх'
}
</script>

<style scoped>
.ex-block {
  margin: 14px 20px 0;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.ex-block:last-of-type { border-bottom: 0; }

.ex-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0 2px 10px;
  gap: 10px;
}
.ex-num {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 700;
  margin-bottom: 3px;
}
.ex-name {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}
.ex-best {
  text-align: right;
  font-size: 10px;
  color: var(--ink-4);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  flex-shrink: 0;
}
.ex-best b {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-2);
  margin-top: 2px;
  letter-spacing: 0;
  text-transform: none;
}

.set-table {
  display: grid;
  grid-template-columns: 28px 1fr 1fr 42px;
  row-gap: 2px;
}
.set-h {
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
  padding: 4px 6px;
}
.set-cell {
  padding: 11px 6px;
  font-size: 14px;
  border-top: 1px solid #141414;
}
.set-cell.num {
  color: var(--ink-4);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.set-cell.weight {
  color: var(--ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.set-cell.reps {
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
.set-cell .unit {
  color: var(--ink-4);
  font-size: 11px;
  font-weight: 500;
  margin-left: 3px;
}
.set-cell.check {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.set-cell.editable {
  cursor: pointer;
  position: relative;
  border-radius: 4px;
  transition: background 0.12s;
}
.set-cell.editable:hover { background: #111; }
.set-cell.editable.active {
  background: #0f0f0f;
  box-shadow: inset 0 -2px 0 var(--accent);
}
.set-check {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid #2a2a2a;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.set-check.done {
  background: var(--accent);
  border-color: var(--accent);
}

/* Inline editor */
.set-editor {
  display: block;
  width: 100%;
  background: #0b0b0b;
  border-top: 1px solid var(--accent);
  border-bottom: 1px solid #141414;
  padding: 12px 10px 14px;
  margin-top: 2px;
  animation: edSlide 0.18s ease-out;
}
@keyframes edSlide {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.ed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ed-label {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 700;
}
.ed-label b { color: var(--accent); margin-left: 6px; }
.ed-close {
  background: transparent;
  border: 0;
  color: var(--ink-4);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.ed-close:hover { color: var(--ink); }
.ed-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.ed-step {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #1a1a1a;
  border: 1px solid #222;
  color: var(--ink-2);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}
.ed-step:active { background: #252525; }
.ed-input {
  flex: 1;
  min-width: 0;
  background: #000;
  border: 1px solid #222;
  color: var(--ink);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
  padding: 6px 10px;
  border-radius: 10px;
  height: 38px;
  font-family: inherit;
  outline: none;
}
.ed-input:focus { border-color: var(--accent); }
.ed-unit {
  font-size: 11px;
  color: var(--ink-4);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: 28px;
  text-align: left;
}
.ed-chips-label {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 700;
  margin-bottom: 6px;
}
.ed-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ed-chip {
  background: #141414;
  border: 1px solid #1e1e1e;
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
}
.ed-chip:hover {
  border-color: #333;
  color: var(--ink);
}
.ed-chip.current {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
}
.ed-chip.best {
  border-color: var(--gold);
  color: var(--gold);
}
.ed-chip .chip-sub {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 500;
  color: var(--ink-4);
  letter-spacing: 0;
}
.ed-chip.current .chip-sub { color: rgba(0, 0, 0, 0.6); }
.ed-chip.best .chip-sub { color: rgba(255, 216, 74, 0.7); }

.add-set-inline {
  width: 100%;
  background: transparent;
  color: var(--ink-4);
  border: 0;
  padding: 10px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  border-top: 1px dashed #1e1e1e;
  margin-top: 4px;
}
.add-set-inline:hover:not(:disabled) { color: var(--accent); }
.add-set-inline:disabled { opacity: 0.5; cursor: not-allowed; }

@media (min-width: 1024px) {
  .ex-block { margin: 18px 28px 0; }
}
</style>
