import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import DashboardView from '../views/DashboardView.vue'
import CalendarView from '../views/CalendarView.vue'
import TrainingView from '../views/TrainingView.vue'

const authGuard = () => {
  if (!localStorage.getItem('token')) return '/'
}

const routes = [
  { path: '/', component: LandingView },
  { path: '/app', component: DashboardView, beforeEnter: authGuard },
  { path: '/app/calendar', component: CalendarView, beforeEnter: authGuard },
  { path: '/app/trainings/:id', component: TrainingView, beforeEnter: authGuard },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
