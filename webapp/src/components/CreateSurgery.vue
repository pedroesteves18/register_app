<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { cirurgiasAPI } from '../services/api'

const router = useRouter()
const route = useRoute()

const surgeryForm = ref({
  descricao: '',
  data: '',
  fotos: []
})

const selectedFiles = ref([])
const imageUrls = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const patient = ref(null)

onMounted(() => {
  try {
    if (route.query.patient) {
      patient.value = JSON.parse(route.query.patient)
    }
  } catch (error) {
    console.error('Error parsing patient data:', error)
    errorMessage.value = 'Erro ao carregar dados do paciente'
  }
})

const goBack = () => {
  router.push('/patients')
}

const handleFileUpload = (event) => {
  const newFiles = Array.from(event.target.files)
  
  surgeryForm.value.fotos = [...surgeryForm.value.fotos, ...newFiles]
  selectedFiles.value = [...selectedFiles.value, ...newFiles.map(file => file.name)]
  
  newFiles.forEach(file => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      imageUrls.value.push(url)
    }
  })
}

const removeImage = (index) => {
  surgeryForm.value.fotos.splice(index, 1)
  selectedFiles.value.splice(index, 1)
  URL.revokeObjectURL(imageUrls.value[index])
  imageUrls.value.splice(index, 1)
}

const clearAllImages = () => {
  imageUrls.value.forEach(url => URL.revokeObjectURL(url))
  surgeryForm.value.fotos = []
  selectedFiles.value = []
  imageUrls.value = []
}

const handleSubmit = async () => {
  if (!surgeryForm.value.descricao.trim()) {
    errorMessage.value = 'Por favor, preencha a descrição da cirurgia'
    return
  }

  if (!surgeryForm.value.data) {
    errorMessage.value = 'Por favor, selecione a data da cirurgia'
    return
  }

  if (!patient.value) {
    errorMessage.value = 'Paciente não encontrado'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('descricao', surgeryForm.value.descricao)
    
    // Debug: Log what's being sent
    console.log('Sending descricao:', surgeryForm.value.descricao)
    console.log('FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(key, ':', value)
    }
    
    // Format date from YYYY-MM-DD to DD/MM/YYYY
    const dateParts = surgeryForm.value.data.split('-')
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
    formData.append('data', formattedDate)
    
    formData.append('paciente', patient.value.id)
    
    surgeryForm.value.fotos.forEach((file, index) => {
      formData.append('pics', file)
    })

    await cirurgiasAPI.createCirurgia(formData, patient.value.id)
    router.push('/patients')
  } catch (error) {
    console.error('Error creating surgery:', error)
    errorMessage.value = error.response?.data?.msg || 'Erro ao criar cirurgia. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="create-surgery-container">
    <!-- Header -->
    <div class="header">
      <h1>Nova Cirurgia</h1>
      <button @click="goBack" class="btn-secondary" :disabled="isLoading">
        ← Voltar
      </button>
    </div>

    <!-- Patient Info Banner -->
    <div v-if="patient" class="patient-info-banner">
      <div class="patient-info-header">
        <span class="patient-icon">👤</span>
        <h3>Paciente</h3>
      </div>
      <div class="patient-details">
        <div class="patient-detail">
          <span class="detail-label">Nome:</span>
          <span class="detail-value">{{ patient.nome }}</span>
        </div>
        <div class="patient-detail">
          <span class="detail-label">Nascimento:</span>
          <span class="detail-value">{{ patient.dot }}</span>
        </div>
        <div class="patient-detail">
          <span class="detail-label">Hospital:</span>
          <span class="detail-value">{{ patient.hospital }}</span>
        </div>
      </div>
    </div>
    
    <!-- Form Container -->
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="surgery-form">
        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          <span class="error-icon">⚠️</span>
          <p>{{ errorMessage }}</p>
        </div>

        <!-- Description Field -->
        <div class="form-group">
          <label for="descricao">Descrição da Cirurgia *</label>
          <textarea 
            id="descricao"
            v-model="surgeryForm.descricao" 
            required
            placeholder="Digite a descrição da cirurgia"
            rows="4"
            :disabled="isLoading"
            class="form-textarea"
          ></textarea>
        </div>
        
        <!-- Date Field -->
        <div class="form-group">
          <label for="data">Data da Cirurgia *</label>
          <input 
            id="data"
            v-model="surgeryForm.data" 
            type="date" 
            required
            :disabled="isLoading"
            class="form-input"
          />
        </div>
        
        <!-- Photos Field -->
        <div class="form-group">
          <label for="fotos">Fotos (opcional)</label>
          <div class="file-upload-container">
            <input 
              id="fotos"
              type="file" 
              multiple
              accept="image/*"
              @change="handleFileUpload"
              :disabled="isLoading"
              class="file-input"
            />
            <label for="fotos" class="file-upload-label">
              <span class="upload-icon">📷</span>
              <span class="upload-text">Selecionar Fotos</span>
            </label>
          </div>
          
          <!-- Uploaded Files Info -->
          <div v-if="surgeryForm.fotos.length > 0" class="uploaded-files">
            <div class="uploaded-files-header">
              <span class="files-count">{{ surgeryForm.fotos.length }} foto(s) selecionada(s)</span>
              <button @click="clearAllImages" type="button" class="clear-all-button">
                <span class="clear-icon">🗑️</span>
                Limpar
              </button>
            </div>
            
            <!-- Image Preview -->
            <div v-if="imageUrls.length > 0" class="image-preview">
              <div class="image-grid">
                <div v-for="(url, index) in imageUrls" :key="index" class="image-item">
                  <button @click="removeImage(index)" type="button" class="remove-image-button">
                    <span class="remove-icon">×</span>
                  </button>
                  <img :src="url" :alt="`Imagem ${index + 1}`" class="image-preview-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner small"></span>
            {{ isLoading ? 'Agendando...' : 'Agendar Cirurgia' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-surgery-container {
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
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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

.patient-info-banner {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.patient-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.patient-icon {
  font-size: 20px;
}

.patient-info-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #ffd700;
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.patient-detail:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.detail-value {
  font-size: 14px;
  color: white;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.form-container {
  max-width: 500px;
  margin: 0 auto;
}

.surgery-form {
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
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.form-input:disabled,
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

.file-upload-container {
  position: relative;
  width: 100%;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 2;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 80px;
}

.file-upload-label:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.uploaded-files {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.uploaded-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.files-count {
  font-size: 14px;
  font-weight: 600;
  color: #ffd700;
}

.clear-all-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 107, 107, 0.8);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.clear-all-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: translateY(-1px);
}

.clear-icon {
  font-size: 14px;
}

.image-preview {
  margin-top: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.remove-image-button {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.9);
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.remove-image-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: scale(1.1);
}

.remove-icon {
  line-height: 1;
}

.image-preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
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
  .create-surgery-container {
    padding: 12px;
    padding-bottom: 80px;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .patient-info-banner {
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .patient-info-header h3 {
    font-size: 16px;
  }
  
  .patient-detail {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-value {
    max-width: 100%;
    text-align: left;
  }
  
  .surgery-form {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-input,
  .form-textarea {
    padding: 14px;
    font-size: 16px;
    min-height: 44px;
  }
  
  .form-textarea {
    min-height: 80px;
  }
  
  .file-upload-label {
    padding: 16px;
    min-height: 70px;
  }
  
  .upload-icon {
    font-size: 20px;
  }
  
  .upload-text {
    font-size: 13px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .image-preview-img {
    height: 100px;
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
  .create-surgery-container {
    padding: 8px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .patient-info-banner {
    padding: 12px;
  }
  
  .surgery-form {
    padding: 16px;
  }
  
  .form-input,
  .form-textarea {
    padding: 12px;
    font-size: 16px;
    min-height: 44px;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .image-preview-img {
    height: 80px;
  }
  
  .form-actions .btn-primary,
  .form-actions .btn-secondary {
    padding: 12px 6px;
    font-size: 13px;
  }
}
</style>
