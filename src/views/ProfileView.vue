<template>
  <div class="profile-view">
    <div class="profile-card">
      <div class="avatar">{{ avatarLetter }}</div>
      <div class="user-label">Профиль</div>
      <button class="logout" @click="logout">Выйти</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'

const { currentUser, logout } = useAuth()

const avatarLetter = computed(() => {
  const name = currentUser.value?.name || currentUser.value?.email || '?'
  return name.charAt(0).toUpperCase()
})
</script>

<style scoped>
.profile-view {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 16px;
  padding: 40px 32px;
  width: 100%;
  max-width: 320px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1e2e1e;
  border: 2px solid #4ade80;
  color: #4ade80;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-label {
  font-size: 16px;
  color: #888;
}

.logout {
  background: transparent;
  border: 1px solid #333;
  padding: 10px 24px;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.15s, border-color 0.15s;
  margin-top: 8px;
}

.logout:hover {
  color: #fff;
  border-color: #555;
}
</style>