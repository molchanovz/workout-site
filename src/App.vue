<template>
  <div v-if="currentUser" class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">TRAINING</div>

      <nav class="sidebar-nav">
        <RouterLink to="/app" :class="{ active: $route.path === '/app' }">
          <span class="nav-icon">🏠</span>
          <span>Главная</span>
        </RouterLink>
        <RouterLink to="/app/calendar" :class="{ active: $route.path.startsWith('/app/calendar') }">
          <span class="nav-icon">📅</span>
          <span>Календарь</span>
        </RouterLink>
      </nav>

      <div class="sidebar-user">
        <div class="avatar">{{ avatarLetter }}</div>
        <div class="user-name">Профиль</div>
        <button class="logout" @click="logout">Выйти</button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>

  <!-- Not logged in — just show landing -->
  <RouterView v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const { currentUser, logout } = useAuth()
const $route = useRoute()

const avatarLetter = computed(() => {
  const name = currentUser.value?.name || currentUser.value?.email || '?'
  return name.charAt(0).toUpperCase()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #0a0a0a;
  border-right: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-logo {
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  letter-spacing: 0.04em;
  padding: 0 12px;
  margin-bottom: 36px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.sidebar-nav a:hover {
  background: #141414;
  color: #ccc;
}

.sidebar-nav a.active {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

/* User section at bottom */
.sidebar-user {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 12px;
  border-top: 1px solid #1a1a1a;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1e2e1e;
  border: 1px solid #4ade80;
  color: #4ade80;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 13px;
  color: #555;
}

.logout {
  background: transparent;
  border: 1px solid #222;
  padding: 5px 12px;
  color: #555;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.15s, border-color 0.15s;
}
.logout:hover {
  color: #fff;
  border-color: #444;
}

/* Main content */
.main-content {
  margin-left: 220px;
  flex: 1;
  height: 100vh;
  overflow: hidden;
}
</style>