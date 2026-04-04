<template>
  <div>
    <HeroSection/>

    <section class="features">
      <div class="card">
        <h3>Календарь тренировок</h3>
        <p>Следи за каждой тренировкой</p>
      </div>
      <div class="card">
        <h3>Твой прогресс</h3>
        <p>Вес, сила и рекорды</p>
      </div>
      <div class="card">
        <h3>План тренировок</h3>
        <p>AI предлагает программу</p>
      </div>
    </section>

    <section class="motivation">
      <h1>NO EXCUSES</h1>
      <h1>JUST TRAIN</h1>
    </section>
  </div>
</template>

<script setup>
import HeroSection from '../components/HeroSection.vue'
</script>

<style scoped>
.features {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 80px 40px;
}

.card {
  background: #111;
  padding: 30px;
  width: 260px;
  border-radius: 12px;
  border: 1px solid #222;
}

.card h3 {
  margin-top: 0;
}

.motivation {
  text-align: center;
  padding: 120px 20px;
  font-weight: 800;
  font-size: 40px;
}
</style>
