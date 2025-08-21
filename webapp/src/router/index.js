import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'
import ShowPatients from '../components/ShowPatients.vue'
import CreatePatient from '../components/CreatePatient.vue'
import EditPatient from '../components/EditPatient.vue'
import ShowSurgeries from '../components/ShowSurgeries.vue'
import CreateSurgery from '../components/CreateSurgery.vue'
import EditSurgery from '../components/EditSurgery.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: HelloWorld
  },
  {
    path: '/patients',
    name: 'Patients',
    component: ShowPatients,
    meta: { requiresAuth: true }
  },
  {
    path: '/create-patient',
    name: 'CreatePatient',
    component: CreatePatient,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-patient',
    name: 'EditPatient',
    component: EditPatient,
    meta: { requiresAuth: true }
  },
  {
    path: '/surgeries',
    name: 'Surgeries',
    component: ShowSurgeries,
    meta: { requiresAuth: true }
  },
  {
    path: '/surgeries/patient/:patientId',
    name: 'PatientSurgeries',
    component: ShowSurgeries,
    meta: { requiresAuth: true }
  },
  {
    path: '/create-surgery',
    name: 'CreateSurgery',
    component: CreateSurgery,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-surgery',
    name: 'EditSurgery',
    component: EditSurgery,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/')
  } else if (to.path === '/' && token) {
    next('/patients')
  } else {
    next()
  }
})

export default router
