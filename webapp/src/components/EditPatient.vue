<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { pacientesAPI } from '../services/api'

const router = useRouter()
const route = useRoute()

const patientForm = ref({
  nome: '',
  dot: '',
  sexo: '',
  hospital: '',
  registro: '',
  historico: ''
})

const sexoOptions = ref([
  { value: 'masc', label: 'Masculino' },
  { value: 'fem', label: 'Feminino' }
])

const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  try {
    if (!route.query.patient) {
      errorMessage.value = 'Dados do paciente não encontrados'
      return
    }
    
    const patientData = JSON.parse(route.query.patient)
    patientForm.value = { ...patientData }
    
    // Format the date to dd/mm/aaaa format
    if (patientForm.value.dot) {
      let date
      
      // Handle different date formats
      if (typeof patientForm.value.dot === 'string') {
        if (patientForm.value.dot.includes('T')) {
          // ISO format (2023-12-25T00:00:00.000Z)
          date = new Date(patientForm.value.dot)
        } else if (patientForm.value.dot.includes('-')) {
          // YYYY-MM-DD format
          date = new Date(patientForm.value.dot + 'T00:00:00')
        } else {
          // Try direct parsing
          date = new Date(patientForm.value.dot)
        }
      } else {
        date = new Date(patientForm.value.dot)
      }
      
      if (!isNaN(date.getTime())) {
        patientForm.value.dot = formatDateToBrazilian(date)
      }
    } else {
      // Check for alternative date field names
      if (patientForm.value.data_nascimento) {
        patientForm.value.dot = patientForm.value.data_nascimento
      } else if (patientForm.value.birth_date) {
        patientForm.value.dot = patientForm.value.birth_date
      } else if (patientForm.value.nascimento) {
        patientForm.value.dot = patientForm.value.nascimento
      }
    }
  } catch (error) {
    console.error('Error parsing patient data:', error)
    errorMessage.value = 'Erro ao carregar dados do paciente'
  }
})

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

const goBack = () => {
  router.push('/patients')
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
    
    await pacientesAPI.updatePaciente(formData.id, formData)
          // Success message removed
    router.push('/patients')
  } catch (error) {
    console.error('Error updating patient:', error)
    errorMessage.value = error.response?.data?.msg || 'Erro ao atualizar paciente. Tente novamente.'
  } finally {
    isLoading.value = false
  }
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
</script>

<template>
  <div class="edit-patient-container">
    <div class="header">
      <button @click="goBack" class="back-button" :disabled="isLoading">← Voltar aos Pacientes</button>
    </div>
    
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="patient-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>



        <div class="form-group">
          <label for="nome">Nome Completo *</label>
          <input 
            id="nome"
            v-model="patientForm.nome" 
            type="text" 
            required 
            placeholder="Digite o nome completo do paciente"
            :disabled="isLoading"
          />
        </div>
        
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
          />
        </div>
        
        <div class="form-group">
          <label for="sexo">Sexo *</label>
          <select id="sexo" v-model="patientForm.sexo" required :disabled="isLoading">
            <option value="">Selecione o sexo</option>
            <option v-for="option in sexoOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="hospital">Hospital *</label>
          <input 
            id="hospital"
            v-model="patientForm.hospital" 
            type="text" 
            required
            placeholder="Digite o nome do hospital"
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="registro">Registro *</label>
          <input 
            id="registro"
            v-model="patientForm.registro" 
            type="text" 
            required
            placeholder="Digite o número de registro"
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="historico">Histórico</label>
          <textarea 
            id="historico"
            v-model="patientForm.historico" 
            placeholder="Digite o histórico médico do paciente"
            rows="3"
            :disabled="isLoading"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-button" :disabled="isLoading">Cancelar</button>
          <button type="submit" class="submit-button" :disabled="isLoading">
            {{ isLoading ? 'Atualizando...' : 'Atualizar Paciente' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.edit-patient-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: Arial, sans-serif;
  padding: 2vw;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1vw;
}

.back-button {
  padding: 1vw 2vw;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1.2vw;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.back-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-container {
  max-width: 600px;
  margin: 0 auto;
}

.patient-form {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 3vw;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.error-message {
  color: #ff6b6b;
  font-size: 1vw;
  background: rgba(255, 107, 107, 0.1);
  padding: 1vw;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.3);
  margin-bottom: 2vw;
}

.form-group {
  margin-bottom: 2vw;
}

.form-group label {
  display: block;
  margin-bottom: 0.5vw;
  font-size: 1.2vw;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 1vw;
  border: none;
  border-radius: 8px;
  font-size: 1vw;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 2vw;
  margin-top: 3vw;
}

.cancel-button,
.submit-button {
  flex: 1;
  padding: 1.2vw 2vw;
  border: none;
  border-radius: 10px;
  font-size: 1.2vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.cancel-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.submit-button:disabled {
  background: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .edit-patient-container {
    padding: 4vw;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 3vw;
  }

  .back-button {
    padding: 2.5vw 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
    align-self: center;
  }

  .form-container {
    max-width: 100%;
  }

  .patient-form {
    padding: 6vw;
    border-radius: 20px;
  }

  .error-message {
    font-size: 3vw;
    padding: 2vw;
    border-radius: 12px;
    margin-bottom: 4vw;
  }

  .form-group {
    margin-bottom: 4vw;
  }

  .form-group label {
    font-size: 3.5vw;
    margin-bottom: 1.5vw;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 3vw;
    font-size: 4vw;
    border-radius: 12px;
  }

  .form-group textarea {
    min-height: 120px;
  }

  .form-actions {
    flex-direction: column;
    gap: 3vw;
    margin-top: 6vw;
  }

  .cancel-button,
  .submit-button {
    padding: 3vw 6vw;
    font-size: 4vw;
    border-radius: 15px;
  }
}

@media (max-width: 480px) {
  .edit-patient-container {
    padding: 5vw;
  }

  .back-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .patient-form {
    padding: 8vw;
    border-radius: 25px;
  }

  .error-message {
    font-size: 3.5vw;
    padding: 3vw;
    border-radius: 15px;
  }

  .form-group {
    margin-bottom: 5vw;
  }

  .form-group label {
    font-size: 4vw;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 4vw;
    font-size: 4.5vw;
    border-radius: 15px;
  }

  .form-group textarea {
    min-height: 150px;
  }

  .form-actions {
    gap: 4vw;
    margin-top: 8vw;
  }

  .cancel-button,
  .submit-button {
    padding: 4vw 8vw;
    font-size: 4.5vw;
    border-radius: 20px;
  }
}
</style>
