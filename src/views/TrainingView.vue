<template>
  <div class="scroll">
    <!-- Top bar -->
    <div class="top-bar">
      <button class="back-btn" @click="router.push('/app')" aria-label="Назад">←</button>
      <div class="train-head-info">
        <p class="d">{{ headDate }}</p>
        <h2 class="n">{{ training?.name || 'Тренировка' }}</h2>
      </div>
      <div style="text-align: right;" v-if="totalSets > 0">
        <div class="train-head-progress">
          {{ totalSets }}<span class="total">подх</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Загрузка…</div>
    <div v-if="error" class="error">{{ error }}</div>

    <template v-if="training">
      <div v-if="isEmpty" class="empty-state">
        <div class="empty-dash"></div>
        <p class="empty-title">Пусто</p>
        <p class="empty-sub">Сгенерируйте набор упражнений или добавьте их вручную.</p>
      </div>

      <ExerciseBlock
        v-for="(item, i) in training.exercises"
        :key="item.exercise.id"
        :item="item"
        :index="i"
        :trainingId="training.id"
        :best="prMap.get(item.exercise.id)"
        @changed="load"
      />

      <button v-if="isEmpty" class="btn-generate" @click="showSuggest = true">
        <div class="bg-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2l2 5 5 1-3.5 3.5 1 5.5L10 14.5 5.5 17l1-5.5L3 8l5-1 2-5z"
                  fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="bg-text">
          <div class="bg-title">Сгенерировать</div>
          <div class="bg-sub">Алгоритм подберёт упражнения</div>
        </div>
        <div class="bg-arrow">›</div>
      </button>

      <button class="add-ex-bar" @click="showModal = true">＋ Добавить упражнение</button>
    </template>

    <!-- Modal: add exercise -->
    <Teleport to="body">
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="sheet-handle"></div>
        <h3>Добавить упражнение</h3>

        <div v-if="!selectedExercise">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Поиск упражнения…"
            autofocus
          />
          <div v-if="searchLoading" class="search-loading">Поиск…</div>
          <div
            v-for="ex in searchResults"
            :key="ex.id"
            class="list-item"
            @click="selectExercise(ex)"
          >
            <span>{{ ex.title }}</span>
          </div>
          <div v-if="!searchLoading && searchQuery && searchResults.length === 0" class="empty-in-modal">
            Ничего не найдено
          </div>
        </div>

        <div v-else class="quick-add">
          <button class="back-link" @click="selectedExercise = null">← {{ selectedExercise.title }}</button>
          <p class="ed-chips-label">Первый подход</p>
          <div class="quick-row">
            <template v-if="selectedExercise.typeId === 1">
              <label>
                <span class="mini-label">Вес</span>
                <input v-model.number="quickWeight" type="number" step="0.5" min="0" />
              </label>
              <label>
                <span class="mini-label">Повт</span>
                <input v-model.number="quickReps" type="number" min="1" />
              </label>
            </template>
            <label v-else>
              <span class="mini-label">Сек</span>
              <input v-model.number="quickDuration" type="number" min="1" />
            </label>
          </div>
          <button class="add-confirm" :disabled="adding" @click="addSelectedExercise">
            {{ adding ? 'Добавление…' : 'Добавить' }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Modal: suggest template -->
    <Teleport to="body">
    <div v-if="showSuggest" class="modal-backdrop" @click.self="showSuggest = false">
      <div class="modal">
        <div class="sheet-handle"></div>
        <h3>Какой тип тренировки?</h3>
        <p class="suggest-hint">Подберём упражнения по выбранным группам мышц.</p>
        <div class="suggest-opts">
          <button
            v-for="tpl in suggestTemplates"
            :key="tpl.id"
            class="suggest-card"
            :disabled="suggesting"
            @click="pickSuggest(tpl)"
          >
            <div class="suggest-vis">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
                <path d="M14 8.5v6M9 13l5-2 5 2M10 14.5l-1.5 6M18 14.5l1.5 6M11 20.5l-.5 4M17 20.5l.5 4"
                      stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="suggest-body">
              <div class="suggest-title">{{ tpl.title }}</div>
              <div class="suggest-meta">
                <span v-for="(m, i) in tpl.meta" :key="i">{{ m }}</span>
              </div>
            </div>
            <div class="suggest-arrow">›</div>
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import ExerciseBlock from '../components/ExerciseBlock.vue'

const route = useRoute()
const router = useRouter()

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

const training = ref(null)
const loading = ref(false)
const error = ref(null)
const prMap = ref(new Map())

const showModal = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const selectedExercise = ref(null)
const quickWeight = ref(20)
const quickReps = ref(10)
const quickDuration = ref(30)
const adding = ref(false)

const showSuggest = ref(false)
const suggesting = ref(false)
const suggestTemplates = [
  { id: 'fullbody', title: 'Фулбади', meta: ['Всё тело', '5–6 упражнений'] },
  { id: 'upper', title: 'Верх', meta: ['Грудь · Спина · Плечи · Руки', '5 упражнений'] },
  { id: 'lower', title: 'Низ', meta: ['Ноги · Ягодицы', '4 упражнения'] },
]

async function pickSuggest(tpl) {
  if (suggesting.value || !training.value) return
  suggesting.value = true
  try {
    const s = await api.training.suggest({ mode: tpl.id })
    const exerciseIds = (s?.exercises || []).map(e => e.exerciseId).filter(Boolean)
    if (exerciseIds.length) {
      await api.training.applySuggestion({
        trainingId: training.value.id,
        exerciseIds,
      })
      await load()
    }
    showSuggest.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    suggesting.value = false
  }
}

function flattenApproaches(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return [...(raw.strength || []), ...(raw.timed || [])]
}

const totalSets = computed(() => {
  if (!training.value) return 0
  return (training.value.exercises || []).reduce(
    (sum, e) => sum + flattenApproaches(e.approaches).length, 0
  )
})

const isEmpty = computed(() => (training.value?.exercises || []).length === 0)

const headDate = computed(() => {
  const s = training.value?.date
  if (!s) return ''
  const d = new Date(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
})

async function load() {
  loading.value = true
  error.value = null
  try {
    training.value = await api.training.get({ id: Number(route.params.id) })
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function loadPRs() {
  try {
    const prs = await api.stats.personalRecords()
    const m = new Map()
    for (const pr of prs || []) m.set(pr.exerciseId, pr)
    prMap.value = m
  } catch { /* ignore */ }
}

function selectExercise(ex) {
  selectedExercise.value = ex
  quickWeight.value = 20
  quickReps.value = 10
  quickDuration.value = 30
}

function closeModal() {
  showModal.value = false
  searchQuery.value = ''
  searchResults.value = []
  selectedExercise.value = null
}

async function addSelectedExercise() {
  const ex = selectedExercise.value
  if (!ex || !training.value) return
  adding.value = true
  try {
    if (ex.typeId === 1) {
      await api.training.addApproach({
        trainingId: training.value.id,
        exerciseId: ex.id,
        reps: Number(quickReps.value),
        weight: Number(quickWeight.value),
      })
    } else {
      await api.training.addTimedApproach({
        trainingId: training.value.id,
        exerciseId: ex.id,
        duration: Number(quickDuration.value),
      })
    }
    closeModal()
    await load()
  } catch (e) { error.value = e.message }
  finally { adding.value = false }
}

let searchTimer = null
watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  if (!val) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      searchResults.value = await api.exercise.search({ title: val })
    } catch { searchResults.value = [] }
    finally { searchLoading.value = false }
  }, 300)
})

onMounted(() => {
  load()
  loadPRs()
})
</script>

<style scoped>
.scroll {
  padding: 8px 0 100px;
  max-width: 430px;
  margin: 0 auto;
  width: 100%;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px 4px;
}
.back-btn {
  background: #121212;
  border: 1px solid var(--border-2);
  color: var(--ink-2);
  width: 38px;
  height: 38px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
}
.train-head-info { flex: 1; min-width: 0; }
.train-head-info .n {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.train-head-info .d {
  font-size: 11px;
  color: var(--ink-4);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
  margin: 0 0 2px;
}
.train-head-progress {
  font-size: 26px;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}
.train-head-progress .total {
  color: var(--ink-4);
  font-size: 11px;
  font-weight: 600;
  margin-left: 6px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.loading {
  color: var(--ink-3);
  font-size: 13px;
  padding: 40px 20px;
  text-align: center;
}
.error {
  color: var(--danger);
  font-size: 13px;
  padding: 12px 20px;
}

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

.btn-generate {
  margin: 20px 20px 10px;
  width: calc(100% - 40px);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--accent);
  color: #000;
  border: 0;
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}
.btn-generate:active { transform: scale(0.99); }
.bg-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bg-text { flex: 1; min-width: 0; }
.bg-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin-bottom: 2px;
}
.bg-sub {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.65;
  font-weight: 600;
}
.bg-arrow {
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.add-ex-bar {
  margin: 10px 20px 0;
  padding: 16px;
  background: transparent;
  border: 1px dashed var(--border-2);
  border-radius: 14px;
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: calc(100% - 40px);
}
.add-ex-bar:hover {
  color: var(--accent);
  border-color: rgba(196, 181, 253, 0.4);
}

.suggest-hint {
  color: var(--ink-4);
  font-size: 12px;
  margin: 0 4px 18px;
  line-height: 1.5;
}
.suggest-opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.suggest-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 14px 14px 12px;
  background: #121212;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  color: var(--ink);
  font-family: inherit;
}
.suggest-card:hover {
  background: #161616;
  border-color: #242424;
}
.suggest-card:active { transform: scale(0.99); }
.suggest-card:disabled { opacity: 0.5; cursor: wait; transform: none; }
.suggest-vis {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #1b1b1b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
}
.suggest-body { flex: 1; min-width: 0; }
.suggest-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
.suggest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.suggest-meta span {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 600;
}
.suggest-meta span + span::before {
  content: '·';
  margin-right: 4px;
  color: var(--ink-4);
}
.suggest-arrow {
  color: var(--ink-4);
  font-size: 20px;
  flex-shrink: 0;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s;
}
.modal {
  width: 100%;
  max-width: 430px;
  background: #0c0c0c;
  border-radius: 24px 24px 0 0;
  padding: 12px 20px 22px;
  max-height: 80vh;
  overflow-y: auto;
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
.modal h3 {
  margin: 4px 0 14px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.search-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid var(--border-2);
  color: #fff;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  margin-bottom: 14px;
}
.search-input:focus { border-color: var(--accent); }
.search-loading {
  color: var(--ink-4);
  font-size: 12px;
  margin: 6px 4px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #141414;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--ink);
  cursor: pointer;
  font-weight: 500;
}
.list-item:hover { border-color: var(--accent); }
.empty-in-modal {
  color: var(--ink-4);
  text-align: center;
  padding: 20px;
  font-size: 13px;
}
.back-link {
  background: transparent;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  margin-bottom: 12px;
  display: block;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.quick-add { padding-top: 4px; }
.ed-chips-label {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-4);
  font-weight: 700;
  margin-bottom: 10px;
}
.quick-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.quick-row label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-label {
  font-size: 10px;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
}
.quick-row input {
  width: 100%;
  background: #000;
  border: 1px solid #222;
  color: var(--ink);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
  padding: 10px 12px;
  border-radius: 10px;
  outline: none;
}
.quick-row input:focus { border-color: var(--accent); }
.add-confirm {
  width: 100%;
  background: var(--accent);
  color: #000;
  border: 0;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-transform: uppercase;
}
.add-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

@media (min-width: 1024px) {
  .scroll { max-width: 640px; padding: 24px 0 60px; }
  .top-bar { padding: 4px 28px 12px; }
  .btn-generate { margin-left: 28px; margin-right: 28px; width: calc(100% - 56px); }
  .add-ex-bar { margin-left: 28px; margin-right: 28px; width: calc(100% - 56px); }
  .empty-state { margin-left: 28px; margin-right: 28px; padding: 48px 28px; }
}
</style>
