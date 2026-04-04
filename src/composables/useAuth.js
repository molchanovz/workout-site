import { ref } from 'vue'
import router from "../router/index.js";

const currentUser = ref(localStorage.getItem('token') ? { loggedIn: true } : null)

// Забираем токен из URL после редиректа от Google
const params = new URLSearchParams(window.location.search)
const urlToken = params.get('token')
if (urlToken) {
  localStorage.setItem('token', urlToken)
  window.history.replaceState({}, '', window.location.pathname)
  currentUser.value = { loggedIn: true }
}

export function useAuth() {
  function logout() {
    localStorage.removeItem('token')
    currentUser.value = null

    router.push("/")
  }

  router.push("/app")

  return { currentUser, logout }
}
