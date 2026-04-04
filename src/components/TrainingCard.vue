<template>
  <div class="training-card" @click="$emit('click')">
    <span class="dot"></span>
    <span class="label">{{ training.ApproachIDs?.length || 0 }} подходов</span>
  </div>
</template>

<script setup>
defineProps({ training: Object })
defineEmits(['click'])
</script>

<style scoped>
.training-card {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}
</style>
