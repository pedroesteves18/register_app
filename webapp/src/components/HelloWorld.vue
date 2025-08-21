<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'

const router = useRouter()

const accessCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  try {
    if (!accessCode.value.trim()) {
      errorMessage.value = 'Por favor, insira o código de acesso'
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await authAPI.login({ accessCode: accessCode.value })
      
      localStorage.setItem('token', response.token)
      router.push('/patients')
    } catch (apiError) {
      errorMessage.value = apiError.response?.data?.message || 'Erro ao fazer login. Verifique o código de acesso.'
    }
  } catch (generalError) {
    errorMessage.value = 'Erro inesperado. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const handleKeyPress = (event) => {
  try {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      handleSubmit()
    }
  } catch (error) {
    console.error('Error in handleKeyPress:', error)
  }
}

const handleButtonClick = async (event) => {
  try {
    event.preventDefault()
    event.stopPropagation()
    await handleSubmit()
  } catch (error) {
    console.error('Error in handleButtonClick:', error)
  }
}
</script>

<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <h1>Bem-vindo</h1>
      <div class="input-section">
        <input 
          v-model="accessCode"
          type="password" 
          placeholder="Insira seu código de acesso aqui..."
          class="access-input"
          :disabled="isLoading"
          @keypress="handleKeyPress"
        />
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <!-- Main login button -->
        <button 
          @click="handleButtonClick"
          class="submit-button"
          :class="{ 'disabled': isLoading }"
          type="button"
        >
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial, sans-serif;
  padding: 2vw;
}

.welcome-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 4vw;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: white;
  font-size: 2.5vw;
  margin-bottom: 3vw;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 2vw;
}

.access-input {
  padding: 1.5vw;
  border: none;
  border-radius: 10px;
  font-size: 1.2vw;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  transition: all 0.3s ease;
}

.access-input:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.access-input::placeholder {
  color: #666;
}

.access-input:disabled {
  background: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.submit-button {
  padding: 1.5vw 3vw;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  font-size: 1.2vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.submit-button:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

.submit-button.disabled {
  background: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-message {
  color: #ff6b6b;
  font-size: 1vw;
  background: rgba(255, 107, 107, 0.1);
  padding: 1vw;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.3);
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .welcome-container {
    padding: 4vw;
  }

  .welcome-content {
    padding: 6vw;
    border-radius: 25px;
  }

  h1 {
    font-size: 5vw;
    margin-bottom: 4vw;
  }

  .input-section {
    gap: 3vw;
  }

  .access-input {
    padding: 3vw;
    font-size: 4vw;
    border-radius: 15px;
  }

  .submit-button {
    padding: 3vw 6vw;
    font-size: 4vw;
    border-radius: 15px;
  }

  .error-message {
    font-size: 3vw;
    padding: 2vw;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .welcome-container {
    padding: 5vw;
  }

  .welcome-content {
    padding: 8vw;
    border-radius: 30px;
  }

  h1 {
    font-size: 6vw;
    margin-bottom: 5vw;
  }

  .input-section {
    gap: 4vw;
  }

  .access-input {
    padding: 4vw;
    font-size: 4.5vw;
    border-radius: 20px;
  }

  .submit-button {
    padding: 4vw 8vw;
    font-size: 4.5vw;
    border-radius: 20px;
  }

  .error-message {
    font-size: 3.5vw;
    padding: 3vw;
    border-radius: 15px;
  }
}
</style>
