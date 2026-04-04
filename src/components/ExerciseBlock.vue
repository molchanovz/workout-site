<template>
  <div class="exercise-block">
    <h3 class="exercise-title">{{ item.exercise.Title }}</h3>

    <div class="approaches">
      <div
        v-for="approach in approaches"
        :key="approach.ID"
        class="approach-row"
      >
        <span v-if="item.exercise.TypeID === 1">{{ approach.Reps }} × {{ approach.Weight }} кг</span>
        <span v-else>{{ approach.Duration }} сек</span>
        <button class="del-btn" @click="deleteApproach(approach.ID)">×</button>
      </div>
      <div v-if="approaches.length === 0" class="empty">Нет подходов</div>
    </div>

    <AddApproachForm
      :trainingId="trainingId"
      :exerciseId="item.exercise.ID"
      :typeId="item.exercise.TypeID"
      @added="reload"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api.js'
import AddApproachForm from './AddApproachForm.vue'

const props = defineProps({
  item: Object,
  trainingId: Number,
})

// item.approaches может быть объектом {strength: [...], timed: [...]}
const approaches = ref([])

function flattenApproaches(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return [...(raw.strength || []), ...(raw.timed || [])]
}

function reload() {
  approaches.value = flattenApproaches(props.item.approaches)
}

async function deleteApproach(approachId) {
  await api.training.deleteApproach({ trainingId: props.trainingId, approachId })
  approaches.value = approaches.value.filter(a => a.ID !== approachId)
}

onMounted(reload)
</script>

<style scoped>
.exercise-block {
  background: #111;
  border: 1px solid #222;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.exercise-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.approaches {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.approach-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a1a1a;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
}

.del-btn {
  background: transparent;
  border: none;
  color: #f87171;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}

.empty {
  color: #555;
  font-size: 13px;
}
</style>
