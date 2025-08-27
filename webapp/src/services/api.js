import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Don't set Content-Type for FormData, let the browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login attempts
    if (error.response?.status === 401 && !error.config.url.includes('/users/login')) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/users/login', { access: credentials.accessCode })
    return response.data
  }
}

// Patients API
export const pacientesAPI = {
  getAllPacientes: async () => {
    try {
      const response = await api.get('/pacientes/all')
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        // If the route doesn't exist yet, return empty array
        return { pacientes: [] }
      }
      throw error
    }
  },

  createPaciente: async (pacienteData) => {
    const response = await api.post('/pacientes', pacienteData)
    return response.data
  },

  getPaciente: async (id) => {
    const response = await api.get(`/pacientes/${id}`)
    return response.data
  },

  updatePaciente: async (id, pacienteData) => {
    const response = await api.put(`/pacientes/${id}`, pacienteData)
    return response.data
  },

  deletePaciente: async (id) => {
    const response = await api.delete(`/pacientes/${id}`)
    return response.data
  }
}

// Surgeries API
export const cirurgiasAPI = {
  getAllCirurgias: async () => {
    try {
      const response = await api.get('/cirurgias/all')
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        // If the route doesn't exist yet, return empty array
        return { cirurgias: [] }
      }
      throw error
    }
  },
  createCirurgia: async (formData, pacienteId) => {
    const response = await api.post(`/cirurgias/${pacienteId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  getPacienteCirurgias: async (pacienteId) => {
    const response = await api.get(`/cirurgias/paciente/${pacienteId}`)
    return response.data
  },
  updateCirurgia: async (cirurgiaId, cirurgiaData) => {
    try {
      let config = {}
      
      if (cirurgiaData instanceof FormData) {
        // For FormData, let the browser set the Content-Type with boundary
        config.headers = {}
        delete config.headers['Content-Type']
      } else {
        // For JSON data, set the Content-Type
        config.headers = {
          'Content-Type': 'application/json'
        }
      }
      
      const response = await api.put(`/cirurgias/${cirurgiaId}`, cirurgiaData, config)
      return response.data
    } catch (error) {
      console.error('Error updating surgery:', error)
      throw error
    }
  },
  deleteCirurgia: async (cirurgiaId) => {
    try {
      const response = await api.delete(`/cirurgias/${cirurgiaId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting surgery:', error)
      throw error
    }
  },
  getImageProxy: (imageUrl) => {
    try {
      // Check if imageUrl is valid
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.warn('Invalid image URL:', imageUrl)
        return ''
      }
      
      // Convert S3 URL to proxy URL for secure access
      const s3Url = new URL(imageUrl)
      const key = s3Url.pathname.substring(1) // Remove leading slash
      return `${API_BASE_URL}/proxy/s3?key=${encodeURIComponent(key)}`
    } catch (error) {
      console.error('Error processing image URL:', imageUrl, error)
      return ''
    }
  }
}

export default api
