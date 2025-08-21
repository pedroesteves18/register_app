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
    <div class="header">
      <button @click="goBack" class="back-button" :disabled="isLoading">← Voltar às Cirurgias</button>
    </div>
    
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="surgery-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="descrição">Descrição da Cirurgia *</label>
          <textarea 
            id="descrição"
            v-model="surgeryForm.descrição" 
            required
            placeholder="Digite a descrição da cirurgia"
            rows="4"
            :disabled="isLoading"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="data">Data da Cirurgia *</label>
          <input 
            id="data"
            v-model="surgeryForm.data" 
            type="date" 
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="fotos">Fotos (opcional)</label>
          <input 
            id="fotos"
            type="file" 
            multiple
            accept="image/*"
            @change="handleFileUpload"
            :disabled="isLoading"
          />
          
                     <!-- Existing Images -->
           <div v-if="existingImages.length > 0" class="existing-images">
             <p><strong>Imagens existentes:</strong></p>
             <div class="images-grid">
               <div v-for="(imageUrl, index) in existingImages" :key="`existing-${index}`" class="image-item">
                 <button @click="removeExistingImage(index)" type="button" class="remove-image-button">×</button>
                 <img 
                   :src="cirurgiasAPI.getImageProxy(imageUrl)" 
                   :alt="`Imagem ${index + 1}`" 
                   class="image-preview" 
                   @click="viewImage(cirurgiasAPI.getImageProxy(imageUrl))"
                 />
               </div>
             </div>
           </div>
          
          <!-- New Images -->
          <div v-if="newImages.length > 0" class="new-images">
            <div class="new-images-header">
              <p><strong>Novas imagens selecionadas ({{ newImages.length }}):</strong></p>
              <button @click="clearAllNewImages" type="button" class="clear-all-button">Limpar Todas</button>
            </div>
                         <div class="images-grid">
               <div v-for="(file, index) in newImages" :key="`new-${index}`" class="image-item">
                 <button @click="removeNewImage(index)" type="button" class="remove-image-button">×</button>
                 <img 
                   :src="imageUrls[index]" 
                   :alt="`Nova imagem ${index + 1}`" 
                   class="image-preview" 
                   @click="viewImage(imageUrls[index])"
                 />
                 <p class="image-name">{{ file.name }}</p>
               </div>
             </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-button" :disabled="isLoading">Cancelar</button>
          <button type="submit" class="submit-button" :disabled="isLoading">
            {{ isLoading ? 'Atualizando...' : 'Atualizar Cirurgia' }}
          </button>
                 </div>
       </form>
     </div>

     <!-- Image Modal -->
     <div v-if="showImageModal" class="modal-overlay image-modal-overlay" @click="closeImageModal">
       <div class="image-modal-content" @click.stop>
         <div class="image-modal-header">
           <h3>Visualização da Imagem</h3>
           <button @click="closeImageModal" class="close-button">×</button>
         </div>
         <div class="image-modal-body">
           <img :src="selectedImage" alt="Imagem da cirurgia" class="full-size-image" />
         </div>
         <div class="image-modal-actions">
           <button @click="closeImageModal" class="close-modal-button">Fechar</button>
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

.surgery-form {
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
.form-group textarea:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.form-group input:disabled,
.form-group textarea:disabled {
  background: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.existing-images,
.new-images {
  margin-top: 1vw;
  padding: 1vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.existing-images p,
.new-images p {
  margin: 0 0 0.5vw 0;
  font-size: 0.9vw;
  color: #ffd700;
}

.images-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1vw;
  margin-top: 1vw;
}

.image-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1vw;
  transition: all 0.3s ease;
}

.remove-image-button {
  position: absolute;
  top: -0.5vw;
  right: -0.5vw;
  width: 2vw;
  height: 2vw;
  border: none;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.9);
  color: white;
  font-size: 1.2vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.remove-image-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: scale(1.1);
}

.image-preview {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-preview:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.image-name {
  font-size: 0.7vw;
  text-align: center;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5vw;
}

.new-images-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1vw;
}

.new-images-header p {
  margin: 0;
  font-size: 1vw;
  color: #ffd700;
}

.clear-all-button {
  padding: 0.5vw 1vw;
  border: none;
  border-radius: 6px;
  background: rgba(255, 107, 107, 0.8);
  color: white;
  font-size: 0.8vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-all-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: translateY(-1px);
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
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff5252 0%, #d63031 100%);
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
  .edit-surgery-container {
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

  .surgery-form {
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
  .form-group textarea {
    padding: 3vw;
    font-size: 4vw;
    border-radius: 12px;
  }

  .form-group textarea {
    min-height: 120px;
  }

  .existing-images,
  .new-images {
    margin-top: 2vw;
    padding: 2vw;
  }

  .existing-images p,
  .new-images p {
    font-size: 3vw;
  }

  .new-images-header {
    margin-bottom: 1.5vw;
  }

  .new-images-header p {
    font-size: 3vw;
  }

  .clear-all-button {
    padding: 1vw 2vw;
    font-size: 2vw;
    border-radius: 8px;
  }

  .images-grid {
    grid-template-columns: 1fr;
    gap: 2vw;
  }

  .image-item {
    padding: 2vw;
  }

  .remove-image-button {
    width: 4vw;
    height: 4vw;
    font-size: 2.5vw;
    top: -1vw;
    right: -1vw;
  }

  .image-preview {
    width: 80px;
    height: 80px;
  }

  .image-name {
    font-size: 2.5vw;
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
  .edit-surgery-container {
    padding: 5vw;
  }

  .back-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .surgery-form {
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
  .form-group textarea {
    padding: 4vw;
    font-size: 4.5vw;
    border-radius: 15px;
  }

  .form-group textarea {
    min-height: 150px;
  }

  .existing-images,
  .new-images {
    margin-top: 3vw;
    padding: 3vw;
  }

  .existing-images p,
  .new-images p {
    font-size: 3.5vw;
  }

  .new-images-header {
    margin-bottom: 2vw;
  }

  .new-images-header p {
    font-size: 3.5vw;
  }

  .clear-all-button {
    padding: 1.5vw 2.5vw;
    font-size: 2.5vw;
    border-radius: 10px;
  }

  .images-grid {
    grid-template-columns: 1fr;
    gap: 3vw;
  }

  .image-item {
    padding: 3vw;
  }

  .remove-image-button {
    width: 5vw;
    height: 5vw;
    font-size: 3vw;
    top: -1.5vw;
    right: -1.5vw;
  }

  .image-preview {
    width: 60px;
    height: 60px;
  }

  .image-name {
    font-size: 3vw;
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

 /* Image Modal Styles */
 .modal-overlay {
   position: fixed;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background: rgba(0, 0, 0, 0.7);
   display: flex;
   justify-content: center;
   align-items: center;
   z-index: 1000;
   backdrop-filter: blur(5px);
 }

 .image-modal-overlay {
   background: rgba(0, 0, 0, 0.9);
 }

 .image-modal-content {
   background: rgba(0, 0, 0, 0.95);
   border-radius: 15px;
   padding: 2vw;
   max-width: 90vw;
   max-height: 90vh;
   overflow: hidden;
   position: relative;
   border: 1px solid rgba(255, 255, 255, 0.1);
 }

 .image-modal-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-bottom: 1vw;
   padding-bottom: 1vw;
   border-bottom: 1px solid rgba(255, 255, 255, 0.2);
 }

 .image-modal-header h3 {
   font-size: 1.5vw;
   margin: 0;
   color: white;
 }

 .image-modal-body {
   display: flex;
   justify-content: center;
   align-items: center;
   max-height: 70vh;
   overflow: auto;
 }

 .full-size-image {
   max-width: 100%;
   max-height: 100%;
   object-fit: contain;
   border-radius: 8px;
   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
 }

 .image-modal-actions {
   display: flex;
   justify-content: center;
   margin-top: 1vw;
   padding-top: 1vw;
   border-top: 1px solid rgba(255, 255, 255, 0.2);
 }

 .close-modal-button {
   padding: 1vw 3vw;
   border: none;
   border-radius: 10px;
   background: rgba(255, 255, 255, 0.2);
   color: white;
   font-size: 1.2vw;
   cursor: pointer;
   transition: all 0.3s ease;
 }

 .close-modal-button:hover {
   background: rgba(255, 255, 255, 0.3);
   transform: translateY(-2px);
 }

 /* Mobile Responsive Modal Styles */
 @media (max-width: 768px) {
   .image-modal-content {
     max-width: 95vw;
     max-height: 95vh;
     padding: 4vw;
   }

   .image-modal-header h3 {
     font-size: 4vw;
   }

   .image-modal-body {
     max-height: 75vh;
   }

   .close-modal-button {
     padding: 3vw 6vw;
     font-size: 3.5vw;
     border-radius: 15px;
   }
 }

 @media (max-width: 480px) {
   .image-modal-content {
     max-width: 98vw;
     max-height: 98vh;
     padding: 5vw;
   }

   .image-modal-header h3 {
     font-size: 5vw;
   }

   .image-modal-body {
     max-height: 80vh;
   }

   .close-modal-button {
     padding: 4vw 8vw;
     font-size: 4vw;
   }
 }
 </style>
