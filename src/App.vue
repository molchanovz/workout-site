<template>
  <div v-if="currentUser && $route.path !== '/'" class="app-layout">
    <!-- Sidebar (desktop only) -->
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
        <RouterLink to="/app/stats" :class="{ active: $route.path.startsWith('/app/stats') }">
          <span class="nav-icon">📈</span>
          <span>Прогресс</span>
        </RouterLink>
      </nav>

      <div class="sidebar-user" @click="menuOpen = !menuOpen" ref="userRef">
        <div class="avatar">{{ avatarLetter }}</div>
        <div class="user-info">
          <div class="user-name">{{ currentUser?.name || 'Профиль' }}</div>
          <div class="user-email">{{ currentUser?.email || '' }}</div>
        </div>
        <span class="chevron">›</span>

        <div v-if="menuOpen" class="user-menu">
          <button class="menu-item logout-item" @click.stop="logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Bottom nav (mobile only) -->
    <nav class="bottom-nav">
      <RouterLink to="/app" class="bottom-nav-item" :class="{ active: $route.path === '/app' }">
        <span class="bottom-nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M9 21V12h6v9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="bottom-nav-label">Главная</span>
      </RouterLink>
      <RouterLink to="/app/calendar" class="bottom-nav-item" :class="{ active: $route.path.startsWith('/app/calendar') }">
        <span class="bottom-nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <path d="M3 9h18" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="bottom-nav-label">Календарь</span>
      </RouterLink>
      <RouterLink to="/app/stats" class="bottom-nav-item" :class="{ active: $route.path.startsWith('/app/stats') }">
        <span class="bottom-nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="bottom-nav-label">Прогресс</span>
      </RouterLink>
      <RouterLink to="/app/profile" class="bottom-nav-item" :class="{ active: $route.path.startsWith('/app/profile') }">
        <span class="bottom-nav-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="bottom-nav-label">Профиль</span>
      </RouterLink>
    </nav>
  </div>

  <!-- Not logged in or on landing page — just show the view -->
  <RouterView v-else />
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const { currentUser, logout, handleGoogleCallback } = useAuth()
const $route = useRoute()
const router = useRouter()

const avatarLetter = computed(() => {
  const name = currentUser.value?.name || currentUser.value?.email || '?'
  return name.charAt(0).toUpperCase()
})

const menuOpen = ref(false)
const userRef = ref(null)

function onClickOutside(e) {
  if (userRef.value && !userRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  handleGoogleCallback(router)
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))
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
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid #1a1a1a;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.sidebar-user:hover {
  background: #141414;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #5b4fcf;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  color: #444;
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.user-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #161616;
  border: 1px solid #222;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 7px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.menu-item:hover {
  background: #1f1f1f;
  color: #fff;
}

.logout-item:hover {
  color: #f87171;
}

/* Main content */
.main-content {
  margin-left: 220px;
  width: calc(100% - 220px);
  flex: 1;
  height: 100vh;
  overflow: hidden;
}

/* Bottom nav — mobile only */
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .main-content {
    margin-left: 0;
    height: calc(100vh - 64px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #0a0a0a;
    border-top: 1px solid #1a1a1a;
    z-index: 200;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: #555;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: color 0.15s;
  }

  .bottom-nav-item.active {
    color: #4ade80;
  }

  .bottom-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bottom-nav-label {
    font-size: 10px;
  }
}
</style>