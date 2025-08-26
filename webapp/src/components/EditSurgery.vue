<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { cirurgiasAPI } from '../services/api'

const router = useRouter()
const route = useRoute()

const surgeryForm = ref({
  descrição: '',
  data: '',
  fotos: []
})

const selectedFiles = ref([])
const existingImages = ref([])
const newImages = ref([])
const imageUrls = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const showImageModal = ref(false)
const selectedImage = ref(null)

onMounted(async () => {
  try {
    console.log('Route query:', route.query)
    console.log('Route query surgery:', route.query.surgery)
    
    const surgeryData = JSON.parse(route.query.surgery)
    console.log('Surgery data loaded:', surgeryData)
    console.log('Surgery description (descricao):', surgeryData.descricao)
    console.log('Surgery description (descrição):', surgeryData.descrição)
    
    // Handle both field names (with and without accent)
    const description = surgeryData.descricao || surgeryData.descrição || ''
    surgeryForm.value = { 
      ...surgeryData, 
      descrição: description 
    }
    console.log('Form description after assignment:', surgeryForm.value.descrição)
    
    // Force reactivity update
    surgeryForm.value = { ...surgeryForm.value }
    
    await nextTick()
    console.log('After nextTick - Form description:', surgeryForm.value.descrição)
    
    // Separate existing images (URLs) from new files
    if (surgeryData.fotos && surgeryData.fotos.length > 0) {
      existingImages.value = surgeryData.fotos.filter(foto => typeof foto === 'string')
    }
  } catch (error) {
    console.error('Error parsing surgery data:', error)
    errorMessage.value = 'Erro ao carregar dados da cirurgia'
  }
})

const goBack = () => {
  router.push('/surgeries')
}

const handleFileUpload = (event) => {
  const newFiles = Array.from(event.target.files)
  
  // Append new files instead of replacing
  newImages.value = [...newImages.value, ...newFiles]
  selectedFiles.value = [...selectedFiles.value, ...newFiles.map(file => file.name)]
  
  // Create object URLs for preview
  newFiles.forEach(file => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      imageUrls.value.push(url)
    }
  })
  
  // Clear the input value to allow selecting the same file again
  event.target.value = ''
}

const removeExistingImage = (index) => {
  existingImages.value.splice(index, 1)
}

const removeNewImage = (index) => {
  // Revoke the object URL to prevent memory leaks
  if (imageUrls.value[index]) {
    URL.revokeObjectURL(imageUrls.value[index])
  }
  
  newImages.value.splice(index, 1)
  selectedFiles.value.splice(index, 1)
  imageUrls.value.splice(index, 1)
}

const clearAllNewImages = () => {
  // Revoke all object URLs to prevent memory leaks
  imageUrls.value.forEach(url => URL.revokeObjectURL(url))
  newImages.value = []
  selectedFiles.value = []
  imageUrls.value = []
}

const viewImage = (imageUrl) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
}

const handleSubmit = async () => {
  if (!surgeryForm.value.descrição.trim()) {
    errorMessage.value = 'Por favor, preencha a descrição da cirurgia'
    return
  }

  if (!surgeryForm.value.data) {
    errorMessage.value = 'Por favor, selecione a data da cirurgia'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Format date from YYYY-MM-DD to DD/MM/YYYY
    const dateParts = surgeryForm.value.data.split('-')
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`

    // Create FormData
    const formData = new FormData()
    
    // Add text fields
    formData.append('descricao', surgeryForm.value.descrição)
    formData.append('data', formattedDate)
    formData.append('paciente', surgeryForm.value.paciente || surgeryForm.value.pacienteId)

    // Add existing images that weren't removed (these will be kept)
    if (existingImages.value.length > 0) {
      formData.append('existingFotos', JSON.stringify(existingImages.value))
    }
    
    // Add new images
    newImages.value.forEach((file, index) => {
      formData.append('pics', file)
    })

    // Add surgery ID to FormData
    formData.append('id', surgeryForm.value.id)

    await cirurgiasAPI.updateCirurgia(surgeryForm.value.id, formData)
    router.push('/surgeries')
  } catch (error) {
    console.error('Error updating surgery:', error)
    errorMessage.value = error.response?.data?.msg || 'Erro ao atualizar cirurgia. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="edit-surgery-container">
    <!-- Header -->
    <div class="header">
      <h1>Editar Cirurgia</h1>
      <button @click="goBack" class="btn-secondary" :disabled="isLoading">
        ← Voltar
      </button>
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
          <label for="descrição">Descrição da Cirurgia *</label>
          <textarea 
            id="descrição"
            v-model="surgeryForm.descrição" 
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
          
          <!-- File Upload -->
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
              <span class="upload-text">Adicionar Fotos</span>
            </label>
          </div>
          
          <!-- Existing Images -->
          <div v-if="existingImages.length > 0" class="existing-images">
            <div class="images-section-header">
              <span class="section-icon">🖼️</span>
              <span class="section-title">Imagens Existentes</span>
            </div>
            <div class="images-grid">
              <div v-for="(imageUrl, index) in existingImages" :key="`existing-${index}`" class="image-item">
                <button @click="removeExistingImage(index)" type="button" class="remove-image-button">
                  <span class="remove-icon">×</span>
                </button>
                <img 
                  :src="cirurgiasAPI.getImageProxy(imageUrl)" 
                  :alt="`Imagem ${index + 1}`" 
                  class="image-preview-img" 
                  @click="viewImage(cirurgiasAPI.getImageProxy(imageUrl))"
                />
              </div>
            </div>
          </div>
          
          <!-- New Images -->
          <div v-if="newImages.length > 0" class="new-images">
            <div class="new-images-header">
              <div class="images-section-header">
                <span class="section-icon">📸</span>
                <span class="section-title">{{ newImages.length }} Nova(s) Imagem(ns)</span>
              </div>
              <button @click="clearAllNewImages" type="button" class="clear-all-button">
                <span class="clear-icon">🗑️</span>
                Limpar
              </button>
            </div>
            <div class="images-grid">
              <div v-for="(file, index) in newImages" :key="`new-${index}`" class="image-item">
                <button @click="removeNewImage(index)" type="button" class="remove-image-button">
                  <span class="remove-icon">×</span>
                </button>
                <img 
                  :src="imageUrls[index]" 
                  :alt="`Nova imagem ${index + 1}`" 
                  class="image-preview-img" 
                  @click="viewImage(imageUrls[index])"
                />
                <div class="image-name">{{ file.name }}</div>
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
            {{ isLoading ? 'Atualizando...' : 'Atualizar Cirurgia' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Visualização da Imagem</h3>
          <button @click="closeImageModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <img :src="selectedImage" alt="Imagem da cirurgia" class="full-size-image" />
        </div>
        <div class="modal-actions">
          <button @click="closeImageModal" class="btn-secondary">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-surgery-container {
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

.existing-images,
.new-images {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.images-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffd700;
}

.new-images-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.images-grid {
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-preview-img:hover {
  transform: scale(1.05);
}

.image-name {
  font-size: 11px;
  text-align: center;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  padding: 16px;
}

.modal-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 16px;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h3 {
  font-size: 18px;
  margin: 0;
  color: white;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  margin: 16px 0;
}

.full-size-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
}

.modal-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

@media (max-width: 480px) {
  .edit-surgery-container {
    padding: 12px;
    padding-bottom: 80px;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
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
  
  .images-grid {
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
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-header h3 {
    font-size: 16px;
  }
  
  .close-button {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }
}

@media (max-width: 360px) {
  .edit-surgery-container {
    padding: 8px;
  }
  
  .header h1 {
    font-size: 20px;
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
  
  .images-grid {
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
  
  .modal-content {
    padding: 16px;
  }
  
  .modal-header h3 {
    font-size: 14px;
  }
}
</style>
