<template>
  <section class="hero">
    <div class="overlay">
      <h1>DISCIPLINE</h1>
      <h1>BEATS</h1>
      <h1>MOTIVATION</h1>

      <RouterLink v-if="currentUser" to="/app" class="cta-start">Начать тренировку</RouterLink>
      <GoogleLoginButton v-else class="cta-google" />
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import GoogleLoginButton from './GoogleLoginButton.vue'
import { useAuth } from '../composables/useAuth.js'

const { currentUser } = useAuth()
</script>

<style scoped>
.hero{
  height:80vh;
  position: relative;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding: 0 20px;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),
    url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070');
  background-size: cover;
  background-position: center;
  filter: blur(4px);
  transform: scale(1.05);
}

h1{
  font-size:80px;
  margin:0;
  font-weight:800;
}

.overlay {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-google {
  margin-top: 40px;
}

.cta-start {
  margin-top: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #4ade80;
  border: 2px solid #4ade80;
  padding: 16px 36px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
}

.cta-start:hover {
  background: #4ade80;
  color: #000;
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .hero {
    height: 100svh;
  }

  h1 {
    font-size: 48px;
  }

  .cta-google,
  .cta-start {
    margin-top: 32px;
  }
}
</style>