<template>
  <div v-if="currentUser && $route.path !== '/'" class="app-layout">
    <!-- Sidebar (desktop only) -->
    <aside class="sidebar">
      <div class="sidebar-logo">KINETROVA</div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="{ active: isActive(item) }"
        >
          <span class="nav-dot"></span>
          <span>{{ item.label }}</span>
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
            Выйти
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
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item) }"
      >
        <span class="nav-dot"></span>
        <span>{{ item.label }}</span>
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

const navItems = [
  { path: '/app', label: 'Сегодня', exact: true },
  { path: '/app/stats', label: 'Прогресс' },
  { path: '/app/calendar', label: 'Календарь' },
  { path: '/app/profile', label: 'Профиль' },
]

function isActive(item) {
  if (item.exact) return $route.path === item.path
  return $route.path.startsWith(item.path)
}

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

/* ═══════════ Sidebar (desktop) ═══════════ */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--bg);
  border-right: 1px solid var(--border);
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
  font-size: 14px;
  color: var(--ink);
  letter-spacing: 0.14em;
  padding: 0 12px;
  margin-bottom: 36px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  color: var(--ink-4);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.15s;
}

.sidebar-nav a:hover { color: var(--ink-2); }
.sidebar-nav a:hover .nav-dot { background: var(--ink-4); }

.sidebar-nav a.active { color: var(--accent); }
.sidebar-nav a.active .nav-dot {
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}

.nav-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
  transition: all 0.15s;
}

/* User section at bottom */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
  margin-top: 8px;
}

.sidebar-user:hover { background: var(--surface); }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--ink);
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
  font-weight: 600;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: var(--ink-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  color: var(--ink-4);
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
}

.user-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border-2);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.menu-item:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.logout-item:hover { color: var(--danger); }

/* ═══════════ Main content ═══════════ */
.main-content {
  margin-left: 220px;
  width: calc(100% - 220px);
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ═══════════ Bottom nav — mobile only, text-first ═══════════ */
.bottom-nav { display: none; }

@media (max-width: 768px) {
  .sidebar { display: none; }

  .main-content {
    margin-left: 0;
    height: calc(100vh - 72px - env(safe-area-inset-bottom, 0px));
    overflow-y: auto;
    overflow-x: hidden;
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 72px;
    background: rgba(8, 8, 8, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid var(--border);
    padding: 10px 0 calc(env(safe-area-inset-bottom, 0px) + 4px);
    z-index: 200;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: none;
    border: none;
    color: var(--ink-4);
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .nav-item .nav-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: transparent;
    margin-bottom: 6px;
    transition: all 0.15s;
  }

  .nav-item.active { color: var(--accent); }
  .nav-item.active .nav-dot {
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
  }
}
</style>
