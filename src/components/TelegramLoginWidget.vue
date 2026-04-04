<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '../api.js'

const emit = defineEmits(['login'])
const container = ref(null)

function handleTelegramAuth(user) {
  api.auth.telegramLogin({
    tgID: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    photoURL: user.photo_url || '',
    authDate: user.auth_date,
    hash: user.hash
  }).then(token => {
    localStorage.setItem('token', token)
    emit('login', user)
  })
}

let script = null

onMounted(() => {
  window.onTelegramAuth = handleTelegramAuth

  script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', 'SPPR_testing_bot')
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')
  container.value.appendChild(script)
})

onUnmounted(() => {
  delete window.onTelegramAuth
  if (script) script.remove()
})
</script>
