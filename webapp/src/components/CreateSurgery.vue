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
          // Success message removed
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
    <div class="header">
      <h1>Registrar Nova Cirurgia</h1>
      <button @click="goBack" class="back-button" :disabled="isLoading">← Voltar aos Pacientes</button>
    </div>

    <div v-if="patient" class="patient-info-banner">
      <h3>Cirurgia de:</h3>
      <p><strong>Paciente:</strong> {{ patient.nome }}</p>
      <p><strong>Data de Nascimento:</strong> {{ patient.dot }}</p>
      <p><strong>Hospital:</strong> {{ patient.hospital }}</p>
    </div>
    
    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="surgery-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="descricao">Descrição da Cirurgia *</label>
          <textarea 
            id="descricao"
            v-model="surgeryForm.descricao" 
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
          <div v-if="surgeryForm.fotos.length > 0" class="uploaded-files">
            <p><strong>Arquivos selecionados ({{ surgeryForm.fotos.length }}):</strong></p>
            
            <div v-if="imageUrls.length > 0" class="image-preview">
              <div class="image-preview-header">
                <p><strong>Visualização das imagens:</strong></p>
                <button @click="clearAllImages" type="button" class="clear-all-button">Limpar Todas</button>
              </div>
              <div class="image-grid">
                <div v-for="(url, index) in imageUrls" :key="index" class="image-item">
                  <button @click="removeImage(index)" type="button" class="remove-image-button">×</button>
                  <img :src="url" :alt="`Imagem ${index + 1}`" class="image-item-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-button" :disabled="isLoading">Cancelar</button>
          <button type="submit" class="submit-button" :disabled="isLoading">
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
  font-family: Arial, sans-serif;
  padding: 2vw;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3vw;
}

h1 {
  font-size: 3vw;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
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

.patient-info-banner {
  min-width: 10vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2vw;
  margin-bottom: 3vw;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0 auto 3vw auto;
  max-width: 600px;
}

.patient-info-banner h3 {
  font-size: 1.5vw;
  margin-bottom: 1vw;
  color: #ffd700;
}

.patient-info-banner p {
  margin: 0.5vw 0;
  font-size: 1.2vw;
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
.image-item-img{
  width: auto;  
  height: 100%;
  object-fit: cover;
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
  margin-right: 1vw;
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

.uploaded-files {
  margin-top: 1vw;
  padding: 1vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.uploaded-files p {
  margin: 0 0 0.5vw 0;
  font-size: 0.9vw;
}

.uploaded-files ul {
  margin: 0;
  padding-left: 2vw;
}

.uploaded-files li {
  font-size: 0.8vw;
  margin: 0.2vw 0;
}

.image-preview {
  margin-top: 2vw;
  padding: 1.5vw;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1vw;
}

.image-preview-header p {
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-all-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: translateY(-1px);
}

.image-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5vw;
  margin-top: 1vw;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2vw;
  transition: all 0.3s ease;
  position: relative;
  gap: 1vw;
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

.image-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.image-item img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.image-name {
  font-size: 1vw;
  text-align: center;
  word-break: break-word;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5vw;
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
  .create-surgery-container {
    padding: 4vw;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 3vw;
  }

  h1 {
    font-size: 6vw;
    text-align: center;
  }

  .back-button {
    padding: 2.5vw 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
    align-self: center;
  }

  .patient-info-banner {
    padding: 4vw;
    border-radius: 20px;
    margin-bottom: 4vw;
  }

  .patient-info-banner h3 {
    font-size: 4vw;
    margin-bottom: 2vw;
  }

  .patient-info-banner p {
    font-size: 3.5vw;
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

  .uploaded-files {
    margin-top: 2vw;
    padding: 2vw;
  }

  .uploaded-files p {
    font-size: 3vw;
  }

  .uploaded-files li {
    font-size: 2.5vw;
  }

  .image-preview {
    margin-top: 4vw;
    padding: 3vw;
    border-radius: 15px;
  }

  .image-preview-header {
    flex-direction: column;
    gap: 2vw;
    align-items: stretch;
  }

  .image-preview-header p {
    font-size: 3vw;
    margin-bottom: 0;
    text-align: center;
  }

  .clear-all-button {
    padding: 1.5vw 3vw;
    font-size: 2.5vw;
    border-radius: 10px;
  }

  .image-grid {
    gap: 3vw;
    margin-top: 2vw;
  }

  .image-item {
    padding: 3vw;
    border-radius: 12px;
    gap: 2vw;
  }

  .remove-image-button {
    width: 4vw;
    height: 4vw;
    font-size: 2.5vw;
    top: -1vw;
    right: -1vw;
  }

  .image-item img {
    width: 150px;
    height: 150px;
    border-radius: 10px;
  }

  .image-name {
    font-size: 2.5vw;
    margin-top: 1vw;
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
  .create-surgery-container {
    padding: 5vw;
  }

  h1 {
    font-size: 7vw;
  }

  .back-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .patient-info-banner {
    padding: 5vw;
    border-radius: 25px;
  }

  .patient-info-banner h3 {
    font-size: 4.5vw;
  }

  .patient-info-banner p {
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

  .uploaded-files {
    margin-top: 3vw;
    padding: 3vw;
  }

  .uploaded-files p {
    font-size: 3.5vw;
  }

  .uploaded-files li {
    font-size: 3vw;
  }

  .image-preview {
    margin-top: 5vw;
    padding: 4vw;
    border-radius: 20px;
  }

  .image-preview-header {
    flex-direction: column;
    gap: 3vw;
    align-items: stretch;
  }

  .image-preview-header p {
    font-size: 3.5vw;
    margin-bottom: 0;
    text-align: center;
  }

  .clear-all-button {
    padding: 2vw 4vw;
    font-size: 3vw;
    border-radius: 12px;
  }

  .image-grid {
    gap: 4vw;
    margin-top: 3vw;
  }

  .image-item {
    padding: 4vw;
    border-radius: 15px;
    gap: 3vw;
  }

  .remove-image-button {
    width: 5vw;
    height: 5vw;
    font-size: 3vw;
    top: -1.5vw;
    right: -1.5vw;
  }

  .image-item img {
    width: 120px;
    height: 120px;
    border-radius: 12px;
  }

  .image-name {
    font-size: 3vw;
    margin-top: 1.5vw;
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
