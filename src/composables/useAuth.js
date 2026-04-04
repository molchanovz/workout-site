import { ref } from 'vue'

const currentUser = ref(localStorage.getItem('token') ? { loggedIn: true } : null)

export function useAuth() {
  function handleGoogleCallback(router) {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, '', window.location.pathname)
      currentUser.value = { loggedIn: true }
      router.push("/app")
    }
  }

  function logout() {
    localStorage.removeItem('token')
    currentUser.value = null
    window.location.replace('/')
  }

  return { currentUser, logout, handleGoogleCallback }
}
