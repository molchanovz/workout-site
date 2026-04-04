<template>
  <div>
    <HeroSection/>

    <section class="carousel-wrapper">
      <div
        class="carousel-track"
        ref="trackRef"
        @mousedown="onPointerDown"
        @touchstart="onPointerDown"
        @wheel.passive="onWheel"
      >
        <div class="card" v-for="(card, i) in duplicatedCards" :key="i">
          <h3>{{ card.title }}</h3>
          <p>{{ card.desc }}</p>
        </div>
      </div>
    </section>

    <section class="motivation">
      <h1>NO EXCUSES</h1>
      <h1>JUST TRAIN</h1>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import HeroSection from '../components/HeroSection.vue'

const cards = [
  { title: 'Календарь тренировок', desc: 'Следи за каждой тренировкой' },
  { title: 'Твой прогресс',        desc: 'Вес, сила и рекорды' },
  { title: 'План тренировок',       desc: 'AI предлагает программу' },
]

// Duplicate enough times for seamless loop
const duplicatedCards = computed(() => [...cards, ...cards, ...cards, ...cards])

const trackRef = ref(null)
let offset = 0
let rafId = null
let pauseTimeout = null
let paused = false
const SPEED = 0.6 // px per frame

function getCardWidth() {
  const card = trackRef.value?.querySelector('.card')
  if (!card) return 300
  const style = getComputedStyle(card)
  return card.offsetWidth + parseInt(style.marginRight || 0) + 24 // 24 = gap
}

function getSetWidth() {
  return getCardWidth() * cards.length
}

function animate() {
  if (!paused) {
    offset += SPEED
    const setWidth = getSetWidth()
    if (offset >= setWidth) offset -= setWidth
    if (trackRef.value) {
      trackRef.value.style.transform = `translateX(${-offset}px)`
    }
  }
  rafId = requestAnimationFrame(animate)
}

function pauseFor2s() {
  paused = true
  clearTimeout(pauseTimeout)
  pauseTimeout = setTimeout(() => { paused = false }, 2000)
}

function onWheel() {
  pauseFor2s()
}

let dragStartX = 0
function onPointerDown(e) {
  dragStartX = e.touches ? e.touches[0].clientX : e.clientX
  pauseFor2s()

  const onMove = (e2) => {
    const x = e2.touches ? e2.touches[0].clientX : e2.clientX
    const delta = dragStartX - x
    dragStartX = x
    const setWidth = getSetWidth()
    offset = (offset + delta + setWidth * 10) % setWidth
    if (trackRef.value) {
      trackRef.value.style.transform = `translateX(${-offset}px)`
    }
    pauseFor2s()
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchmove', onMove, { passive: true })
  window.addEventListener('touchend', onUp)
}

onMounted(() => { rafId = requestAnimationFrame(animate) })
onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(pauseTimeout)
})
</script>

<style scoped>
.carousel-wrapper {
  overflow: hidden;
  padding: 80px 0;
  cursor: grab;
  user-select: none;
}

.carousel-wrapper:active {
  cursor: grabbing;
}

.carousel-track {
  display: flex;
  gap: 24px;
  will-change: transform;
}

.card {
  background: #111;
  padding: 30px;
  min-width: 260px;
  border-radius: 12px;
  border: 1px solid #222;
  flex-shrink: 0;
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

@media (max-width: 768px) {
  .carousel-wrapper {
    padding: 48px 0;
  }

  .motivation {
    padding: 64px 20px;
    font-size: 28px;
  }
}
</style>