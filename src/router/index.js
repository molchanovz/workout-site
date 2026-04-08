import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import DashboardView from '../views/DashboardView.vue'
import CalendarView from '../views/CalendarView.vue'
import TrainingView from '../views/TrainingView.vue'
import ProfileView from '../views/ProfileView.vue'
import StatsView from '../views/StatsView.vue'

const authGuard = () => {
  if (!localStorage.getItem('token')) return '/'
}

const routes = [
  { path: '/', component: LandingView },
  { path: '/app', component: DashboardView, beforeEnter: authGuard },
  { path: '/app/calendar', component: CalendarView, beforeEnter: authGuard },
  { path: '/app/trainings/:id', component: TrainingView, beforeEnter: authGuard },
  { path: '/app/profile', component: ProfileView, beforeEnter: authGuard },
  { path: '/app/stats', component: StatsView, beforeEnter: authGuard },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
