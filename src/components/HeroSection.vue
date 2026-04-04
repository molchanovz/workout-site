<template>
  <section class="hero">
    <div class="overlay">
      <h1>DISCIPLINE</h1>
      <h1>BEATS</h1>
      <h1>MOTIVATION</h1>

      <GoogleLoginButton class="cta-google" />
    </div>
  </section>
</template>

<script setup>
import GoogleLoginButton from './GoogleLoginButton.vue'
</script>

<style scoped>
.hero{
  height:80vh;
  background:linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.7)),
  url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070');
  background-size:cover;
  background-position:center;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
}

h1{
  font-size:80px;
  margin:0;
  font-weight:800;
}

.overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cta-google {
  margin-top: 40px;
}
</style>