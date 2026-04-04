<template>
  <form class="add-form" @submit.prevent="submit">
    <template v-if="typeId === 1">
      <input v-model.number="reps" type="number" placeholder="Повт." min="1" required />
      <input v-model.number="weight" type="number" placeholder="Кг" min="0" step="0.5" required />
    </template>
    <template v-else>
      <input v-model.number="duration" type="number" placeholder="Сек." min="1" required />
    </template>
    <button type="submit" :disabled="loading">+</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../api.js'

const props = defineProps({
  trainingId: Number,
  exerciseId: Number,
  typeId: Number,
})
const emit = defineEmits(['added'])

const reps = ref('')
const weight = ref('')
const duration = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    if (props.typeId === 1) {
      await api.training.addApproach({ trainingId: props.trainingId, exerciseId: props.exerciseId, reps: reps.value, weight: weight.value })
    } else {
      await api.training.addTimedApproach({ trainingId: props.trainingId, exerciseId: props.exerciseId, duration: duration.value })
    }
    reps.value = ''; weight.value = ''; duration.value = ''
    emit('added')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-form {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.add-form input {
  background: #222;
  border: 1px solid #444;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  width: 80px;
  font-size: 13px;
}

.add-form button {
  background: #4ade80;
  color: #000;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.add-form button:disabled {
  opacity: 0.5;
}
</style>
