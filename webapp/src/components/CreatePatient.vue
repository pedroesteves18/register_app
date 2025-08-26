<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { pacientesAPI } from '../services/api'

const router = useRouter()

const patientForm = ref({
  nome: '',
  dot: '',
  sexo: '',
  hospital: '',
  registro: '',
  historico: ''
})

const sexoOptions = ref([
  { value: 'masc', label: '♂ Masculino' },
  { value: 'fem', label: '♀ Feminino' }
])

const isLoading = ref(false)
const errorMessage = ref('')

const goBack = () => {
  router.push('/patients')
}

const formatDateToBrazilian = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const formatDate = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  
  if (value.length <= 2) {
    event.target.value = value
  } else if (value.length <= 4) {
    event.target.value = value.slice(0, 2) + '/' + value.slice(2)
  } else if (value.length <= 8) {
    event.target.value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8)
  } else {
    event.target.value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8)
  }
  
  patientForm.value.dot = event.target.value
}

const isValidDate = (dateString) => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!regex.test(dateString)) return false
  
  const [day, month, year] = dateString.split('/').map(Number)
  const date = new Date(year, month - 1, day)
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year &&
         year >= 1900 && year <= new Date().getFullYear()
}

const convertToAPIDate = (brazilianDate) => {
  const [day, month, year] = brazilianDate.split('/')
  return `${year}-${month}-${day}`
}

const handleSubmit = async () => {
  if (!patientForm.value.nome.trim()) {
    errorMessage.value = 'Por favor, preencha o nome do paciente'
    return
  }

  if (!patientForm.value.dot || !isValidDate(patientForm.value.dot)) {
    errorMessage.value = 'Por favor, insira uma data de nascimento válida (dd/mm/aaaa)'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const formData = { ...patientForm.value }
    formData.dot = convertToAPIDate(formData.dot)
    
    await pacientesAPI.createPaciente(formData)
    router.push('/patients')
  } catch (error) {
    console.error('Error creating patient:', error)
    
    if (error.response?.status === 401) {
      errorMessage.value = 'Erro de autenticação. Faça login novamente.'
    } else if (error.response?.status === 400) {
      errorMessage.value = error.response?.data?.msg || 'Dados inválidos. Verifique os campos obrigatórios.'
    } else if (error.response?.status === 403) {
      errorMessage.value = 'Erro ao criar paciente. Verifique suas permissões.'
    } else if (error.response?.status === 500) {
      errorMessage.value = 'Erro interno do servidor. Tente novamente.'
    } else {
      errorMessage.value = error.response?.data?.msg || 'Erro ao criar paciente. Tente novamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="create-patient-container">
    <!-- Header -->
    <div class="header">
      <h1>Novo Paciente</h1>
      <button @click="goBack" class="btn-secondary">
        ← Voltar
      </button>
    </div>
    
    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="patient-form">
        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Name Field -->
        <div class="form-group">
          <label for="nome">Nome Completo *</label>
          <input 
            id="nome"
            v-model="patientForm.nome" 
            type="text" 
            required 
            placeholder="Digite o nome completo"
            :disabled="isLoading"
            class="form-input"
          />
        </div>
        
        <!-- Birth Date Field -->
        <div class="form-group">
          <label for="dot">Data de Nascimento *</label>
          <input 
            id="dot"
            v-model="patientForm.dot" 
            type="text" 
            required
            placeholder="dd/mm/aaaa"
            maxlength="10"
            @input="formatDate"
            :disabled="isLoading"
            class="form-input"
          />
        </div>
        
        <!-- Gender Field -->
        <div class="form-group">
          <label for="sexo">Sexo *</label>
          <select id="sexo" v-model="patientForm.sexo" required :disabled="isLoading" class="form-select">
            <option value="">Selecione o sexo</option>
            <option v-for="option in sexoOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <!-- Hospital Field -->
        <div class="form-group">
          <label for="hospital">Hospital *</label>
          <input 
            id="hospital"
            v-model="patientForm.hospital" 
            type="text" 
            required
            placeholder="Digite o nome do hospital"
            :disabled="isLoading"
            class="form-input"
          />
        </div>
        
        <!-- Registration Field -->
        <div class="form-group">
          <label for="registro">Registro *</label>
          <input 
            id="registro"
            v-model="patientForm.registro" 
            type="text" 
            required
            placeholder="Digite o número de registro"
            :disabled="isLoading"
            class="form-input"
          />
        </div>
        
        <!-- Medical History Field -->
        <div class="form-group">
          <label for="historico">Histórico Médico</label>
          <textarea 
            id="historico"
            v-model="patientForm.historico" 
            placeholder="Digite o histórico médico do paciente"
            rows="4"
            :disabled="isLoading"
            class="form-textarea"
          ></textarea>
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner small"></span>
            {{ isLoading ? 'Criando...' : 'Criar Paciente' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-patient-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 16px;
  padding-bottom: 80px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  min-height: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.form-container {
  max-width: 500px;
  margin: 0 auto;
}

.patient-form {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ff6b6b;
  font-size: 14px;
  background: rgba(255, 107, 107, 0.1);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  margin-bottom: 20px;
}

.error-icon {
  font-size: 16px;
}

.error-message p {
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  transition: all 0.3s ease;
  min-height: 48px;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  background: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.5;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: 40px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.form-actions .btn-primary,
.form-actions .btn-secondary {
  flex: 1;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 14px;
  height: 14px;
  border-width: 1.5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .create-patient-container {
    padding: 12px;
    padding-bottom: 80px;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .patient-form {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    padding: 14px;
    font-size: 16px;
    min-height: 44px;
  }
  
  .form-textarea {
    min-height: 80px;
  }
  
  .form-actions {
    margin-top: 24px;
    gap: 8px;
  }
  
  .form-actions .btn-primary,
  .form-actions .btn-secondary {
    padding: 12px 8px;
    font-size: 14px;
  }
}

@media (max-width: 360px) {
  .create-patient-container {
    padding: 8px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .patient-form {
    padding: 16px;
  }
  
  .form-input,
  .form-select,
  .form-textarea {
    padding: 12px;
    font-size: 16px;
    min-height: 44px;
  }
  
  .form-actions .btn-primary,
  .form-actions .btn-secondary {
    padding: 12px 6px;
    font-size: 13px;
  }
}
</style>
