<template>
  <div class="training-view">
    <div class="top-bar">
      <button class="back-btn" @click="router.push('/app')">← Назад</button>
      <h2 v-if="training">{{ formatDate(training.Date) }}</h2>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <template v-if="training">
      <ExerciseBlock
        v-for="item in training.exercises"
        :key="item.exercise.ID"
        :item="item"
        :trainingId="training.ID"
      />

      <button class="add-exercise-btn" @click="showModal = true">+ Добавить упражнение</button>
    </template>

    <!-- Modal: выбор упражнения -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>Добавить упражнение</h3>

        <!-- Шаг 1: топ-уровень категорий -->
        <div v-if="!selectedParent && !selectedCategory">
          <p class="label">Категория</p>
          <div v-if="categoriesLoading">Загрузка...</div>
          <div class="list">
            <button
              v-for="cat in categories"
              :key="cat.ID"
              class="list-item"
              @click="selectParent(cat)"
            >{{ cat.Title }}</button>
          </div>
        </div>

        <!-- Шаг 2: подкатегории -->
        <div v-else-if="selectedParent && !selectedCategory">
          <button class="back-link" @click="selectedParent = null; subcategories = []">← {{ selectedParent.Title }}</button>
          <p class="label">Подкатегория</p>
          <div v-if="subcategoriesLoading">Загрузка...</div>
          <div class="list">
            <button
              v-for="cat in subcategories"
              :key="cat.ID"
              class="list-item"
              @click="selectCategory(cat)"
            >{{ cat.Title }}</button>
          </div>
          <div v-if="!subcategoriesLoading && subcategories.length === 0" class="empty">Нет подкатегорий</div>
        </div>

        <!-- Шаг 3: упражнения -->
        <div v-else-if="!selectedExercise">
          <button class="back-link" @click="selectedCategory = null; exercises = []">← {{ selectedCategory.Title }}</button>
          <div v-if="exercisesLoading">Загрузка...</div>
          <div class="list">
            <button
              v-for="ex in exercises"
              :key="ex.ID"
              class="list-item"
              @click="selectExercise(ex)"
            >{{ ex.Title }}</button>
          </div>
          <div v-if="!exercisesLoading && exercises.length === 0" class="empty">Нет упражнений</div>
        </div>

        <!-- Шаг 4: добавление подхода -->
        <div v-else>
          <button class="back-link" @click="selectedExercise = null">← {{ selectedExercise.Title }}</button>
          <p class="label">Добавить подход</p>
          <AddApproachForm
            :trainingId="training.ID"
            :exerciseId="selectedExercise.ID"
            :typeId="selectedExercise.TypeID"
            @added="onApproachAdded"
          />
        </div>

        <button class="close-btn" @click="closeModal">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const categories = ref([])
const categoriesLoading = ref(false)
const selectedParent = ref(null)
const subcategories = ref([])
const subcategoriesLoading = ref(false)
const selectedCategory = ref(null)
const exercises = ref([])
const exercisesLoading = ref(false)
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

async function openModal() {
  showModal.value = true
  if (categories.value.length) return
  categoriesLoading.value = true
  try {
    categories.value = await api.exercise.categoryList({})
  } finally {
    categoriesLoading.value = false
  }
}

async function selectParent(cat) {
  selectedParent.value = cat
  subcategoriesLoading.value = true
  try {
    subcategories.value = await api.exercise.categoryList({ parentId: cat.ID })
  } finally {
    subcategoriesLoading.value = false
  }
}

async function selectCategory(cat) {
  selectedCategory.value = cat
  exercisesLoading.value = true
  try {
    exercises.value = await api.exercise.list({ categoryId: cat.ID })
  } finally {
    exercisesLoading.value = false
  }
}

function selectExercise(ex) {
  selectedExercise.value = ex
}

function closeModal() {
  showModal.value = false
  selectedParent.value = null
  subcategories.value = []
  selectedCategory.value = null
  exercises.value = []
  selectedExercise.value = null
}

async function onApproachAdded() {
  showModal.value = false
  selectedParent.value = null
  subcategories.value = []
  selectedCategory.value = null
  exercises.value = []
  selectedExercise.value = null
  await load()
}

// Load categories when modal opens
import { watch } from 'vue'
watch(showModal, (val) => {
  if (val && categories.value.length === 0) openModal()
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

.empty {
  color: #555;
  font-size: 13px;
}
</style>
