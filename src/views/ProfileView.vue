<template>
  <div class="scroll">
    <div class="page-head">
      <div>
        <p class="page-sub">Аккаунт</p>
        <h1 class="page-title">Профиль</h1>
      </div>
    </div>

    <div class="user-card">
      <div class="avatar">{{ avatarLetter }}</div>
      <div class="user-meta">
        <div class="user-name">{{ currentUser?.name || 'Без имени' }}</div>
        <div class="user-email">{{ currentUser?.email || '' }}</div>
      </div>
    </div>

    <div class="section-head"><h3>Настройки</h3></div>
    <div class="hist">
      <button
        v-for="s in settings"
        :key="s.key"
        class="hist-row"
        :disabled="s.disabled"
        @click="onSettingClick(s.key)"
      >
        <span class="hist-label">{{ s.label }}</span>
        <span v-if="s.disabled" class="hist-soon">Скоро</span>
        <svg v-else class="arrow" width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </button>
    </div>

    <button class="logout-btn" @click="logout">Выйти</button>
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

const settings = [
  { key: 'units', label: 'Единицы измерения', disabled: true },
  { key: 'notifications', label: 'Уведомления', disabled: true },
  { key: 'google-fit', label: 'Google Fit', disabled: true },
  { key: 'export', label: 'Экспорт данных', disabled: true },
  { key: 'help', label: 'Помощь', disabled: true },
]

function onSettingClick(_key) {
  // placeholders — implementation coming later
}
</script>

<style scoped>
.scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0 100px;
  max-width: 430px;
  margin: 0 auto;
  width: 100%;
}

.page-head {
  padding: 14px 20px 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.page-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1;
}
.page-sub {
  font-size: 11px;
  color: var(--ink-4);
  margin: 0 0 6px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
}

.user-card {
  margin: 0 20px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #222;
  color: var(--ink);
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-meta { min-width: 0; flex: 1; }
.user-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-email {
  font-size: 12px;
  color: var(--ink-4);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-head {
  padding: 8px 20px 12px;
}
.section-head h3 {
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-3);
  margin: 0;
}

.hist {
  margin: 0 20px;
  border-top: 1px solid var(--border);
}
.hist-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: color 0.12s;
}
.hist-row:hover:not(:disabled) { color: var(--accent); }
.hist-row:disabled { cursor: default; color: var(--ink-3); }

.hist-label {
  font-size: 15px;
  font-weight: 500;
}
.hist-soon {
  font-size: 10px;
  color: var(--ink-4);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
}
.arrow { color: var(--ink-4); }

.logout-btn {
  margin: 28px 20px 0;
  width: calc(100% - 40px);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: all 0.12s;
}
.logout-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

@media (min-width: 1024px) {
  .scroll { max-width: 600px; padding: 24px 0 60px; }
  .page-head { padding: 4px 28px 22px; }
  .user-card { margin: 0 28px 22px; padding: 22px; }
  .section-head { padding-left: 28px; padding-right: 28px; }
  .hist { margin: 0 28px; }
  .logout-btn { margin-left: 28px; margin-right: 28px; width: calc(100% - 56px); }
}
</style>
