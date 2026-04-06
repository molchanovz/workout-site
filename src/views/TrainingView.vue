<template>
  <div class="training-view">
    <div class="top-bar">
      <button class="back-btn" @click="router.push('/app')">← Назад</button>
      <h2 v-if="training">{{ formatDate(training.date) }}</h2>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <template v-if="training">
      <ExerciseBlock
        v-for="item in training.exercises"
        :key="item.exercise.id"
        :item="item"
        :trainingId="training.id"
      />

      <button class="add-exercise-btn" @click="showModal = true">+ Добавить упражнение</button>
    </template>

    <!-- Modal: выбор упражнения -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>Добавить упражнение</h3>

        <!-- Поиск упражнения -->
        <div v-if="!selectedExercise">
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Название упражнения..."
            autofocus
          />
          <div v-if="searchLoading" class="label">Поиск...</div>
          <div class="list">
            <button
              v-for="ex in searchResults"
              :key="ex.id"
              class="list-item"
              @click="selectExercise(ex)"
            >{{ ex.title }}</button>
          </div>
          <div v-if="!searchLoading && searchQuery && searchResults.length === 0" class="empty">Ничего не найдено</div>
        </div>

        <!-- Добавление подхода -->
        <div v-else>
          <button class="back-link" @click="selectedExercise = null">← {{ selectedExercise.title }}</button>
          <p class="label">Добавить подход</p>
          <AddApproachForm
            :trainingId="training.id"
            :exerciseId="selectedExercise.id"
            :typeId="selectedExercise.typeId"
            @added="onApproachAdded"
          />
        </div>

        <button class="close-btn" @click="closeModal">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api.js'
import ExerciseBlock from '../components/ExerciseBlock.vue'
import AddApproachForm from '../components/AddApproachForm.vue'

const route = useRoute()
const router = useRouter()

const training = ref(null)
const loading = ref(false)
const error = ref(null)

const showModal = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const selectedExercise = ref(null)

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = null
  try {
    training.value = await api.training.get({ id: Number(route.params.id) })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function selectExercise(ex) {
  selectedExercise.value = ex
}

function closeModal() {
  showModal.value = false
  searchQuery.value = ''
  searchResults.value = []
  selectedExercise.value = null
}

async function onApproachAdded() {
  closeModal()
  await load()
}

let searchTimer = null
watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  if (!val) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    try {
      searchResults.value = await api.exercise.search({ title: val })
    } finally {
      searchLoading.value = false
    }
  }, 300)
})

onMounted(load)
</script>

<style scoped>
.training-view {
  padding: 40px 60px;
  max-width: 800px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  background: transparent;
  border: 1px solid #444;
  color: white;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.top-bar h2 {
  margin: 0;
}

.add-exercise-btn {
  background: transparent;
  border: 1px dashed #444;
  color: #aaa;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  font-size: 14px;
  margin-top: 8px;
  transition: border-color 0.15s, color 0.15s;
}

.add-exercise-btn:hover {
  border-color: #4ade80;
  color: #4ade80;
}

.loading, .error {
  text-align: center;
  color: #888;
  margin-top: 20px;
}

.error { color: #f87171; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 16px;
}

.label {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.list-item {
  background: #222;
  border: 1px solid #333;
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}

.list-item:hover {
  border-color: #4ade80;
}

.back-link {
  background: transparent;
  border: none;
  color: #4ade80;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  margin-bottom: 12px;
  display: block;
}

.close-btn {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
}

.search-input {
  width: 100%;
  background: #222;
  border: 1px solid #444;
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
  outline: none;
}

.search-input:focus {
  border-color: #4ade80;
}

.empty {
  color: #555;
  font-size: 13px;
}
</style>
