<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { cirurgiasAPI, pacientesAPI } from '../services/api'

const router = useRouter()
const route = useRoute()

const surgeries = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const retryCount = ref(0)
const maxRetries = 3
const currentPatientId = ref(null)

const selectedSurgery = ref(null)
const showDetailsModal = ref(false)
const showImageModal = ref(false)
const selectedImage = ref(null)
const isLoadingPatientData = ref(false)

const fetchSurgeries = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    // Check if we're viewing surgeries for a specific patient
    const patientId = route.params.patientId || route.query.patientId
    currentPatientId.value = patientId
    
         let response
     if (patientId) {
       // Fetch surgeries for specific patient
       response = await cirurgiasAPI.getPacienteCirurgias(patientId)
       surgeries.value = response.cirurgias || response || []
     } else {
       // Fetch all surgeries
       response = await cirurgiasAPI.getAllCirurgias()
       surgeries.value = response.cirurgias || []
     }
    retryCount.value = 0 // Reset retry count on success
  } catch (error) {
    console.error('Error fetching surgeries:', error)
    console.error('Error details:', error.response?.data)
    console.error('Error status:', error.response?.status)
    
         if (retryCount.value < maxRetries) {
       retryCount.value++
       setTimeout(() => {
         fetchSurgeries()
       }, 1000 * retryCount.value) // Exponential backoff
       return
     }
    
    errorMessage.value = `Erro ao carregar cirurgias: ${error.response?.data?.msg || error.message}`
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  if (currentPatientId.value) {
    // If viewing patient-specific surgeries, go back to patient details
    router.push(`/patients?patientId=${currentPatientId.value}`)
  } else {
    // If viewing all surgeries, go back to patients list
    router.push('/patients')
  }
}

const fetchCompletePatientData = async (pacienteId) => {
  try {
    const response = await pacientesAPI.getPaciente(pacienteId)
    return response.paciente || response
  } catch (error) {
    console.error('Error fetching patient data:', error)
    return null
  }
}

const viewSurgeryDetails = async (surgery) => {
  selectedSurgery.value = surgery
  showDetailsModal.value = true
  
  // If patient data is incomplete, try to fetch complete data
  if (surgery.paciente && (!surgery.paciente.dot || !surgery.paciente.hospital || !surgery.paciente.registro)) {
    const pacienteId = surgery.paciente.id || surgery.pacienteId
    if (pacienteId) {
      isLoadingPatientData.value = true
      try {
        const completePatientData = await fetchCompletePatientData(pacienteId)
                 if (completePatientData) {
           selectedSurgery.value = {
             ...surgery,
             paciente: { ...surgery.paciente, ...completePatientData }
           }
         }
      } finally {
        isLoadingPatientData.value = false
      }
    }
  }
}

const closeModal = () => {
  showDetailsModal.value = false
  selectedSurgery.value = null
}

const viewImage = (imageUrl) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
}

const editSurgery = (surgery) => {
  router.push({ name: 'EditSurgery', query: { surgery: JSON.stringify(surgery) } })
}

const deleteSurgery = async (surgeryId) => {
  if (confirm('Tem certeza que deseja excluir esta cirurgia?')) {
    try {
      await cirurgiasAPI.deleteCirurgia(surgeryId)
      await fetchSurgeries() 
    } catch (error) {
      console.error('Error deleting surgery:', error)
      errorMessage.value = 'Erro ao excluir cirurgia. Tente novamente.'
    }
  }
}

const handleImageError = (event) => {
  console.warn('Image failed to load:', event.target.src)
  // Optionally set a fallback image
  event.target.style.display = 'none'
}

onMounted(() => {
  fetchSurgeries()
})
</script>

<template>
  <div class="surgeries-container">
    <div class="header">
      <h1>{{ currentPatientId ? 'Cirurgias do Paciente' : 'Cirurgias' }}</h1>
      <button @click="goBack" class="back-button">
        {{ currentPatientId ? '← Voltar ao Paciente' : '← Voltar aos Pacientes' }}
      </button>
    </div>

    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="fetchSurgeries" class="retry-button">Tentar Novamente</button>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando cirurgias...</p>
    </div>
    
    <div v-else-if="!surgeries || surgeries.length === 0" class="no-surgeries">
      <p>Nenhuma cirurgia encontrada</p>
    </div>
    
    <div v-else class="surgeries-grid">
      <div v-for="surgery in surgeries" :key="surgery.id" class="surgery-card">
        <div class="surgery-header">
          <h3>{{ surgery.descrição || 'Sem descrição' }}</h3>
        </div>
        <div class="surgery-details">
          <p><strong>Data:</strong> {{ surgery.data }}</p>  
          <p v-if="surgery.fotos && surgery.fotos.length > 0">
          </p>
          <p><strong>Paciente:</strong> {{surgery.paciente?.nome || 'Paciente não encontrado' }}</p>
        </div>
        <div class="surgery-actions">
          <button @click="editSurgery(surgery)" class="action-button edit">Editar</button>
          <button @click="viewSurgeryDetails(surgery)" class="action-button view">Ver Detalhes</button>
          <button @click="deleteSurgery(surgery.id)" class="action-button delete">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Surgery Details Modal -->
         <div v-if="showDetailsModal" class="modal-overlay" @click="closeModal">
       <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Detalhes da Cirurgia</h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        
        <div v-if="selectedSurgery" class="surgery-details-modal">
          <div class="detail-section">
            <h3>Informações da Cirurgia</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Descrição:</strong>
                <span>{{ selectedSurgery.descrição || 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <strong>Data:</strong>
                <span>{{ selectedSurgery.data || 'Não informado' }}</span>
              </div>
            </div>
          </div>

                     <div class="detail-section">
             <h3>Informações do Paciente</h3>
             <div v-if="isLoadingPatientData" class="loading-patient-data">
               <div class="loading-spinner"></div>
               <p>Carregando dados completos do paciente...</p>
             </div>
             <div v-else class="detail-grid">
              <div class="detail-item">
                <strong>Nome:</strong>
                <span>{{ selectedSurgery.paciente?.nome || 'Paciente não encontrado' }}</span>
              </div>
                             <div class="detail-item">
                 <strong>Data de Nascimento:</strong>
                 <span>{{ selectedSurgery.paciente?.dot || selectedSurgery.paciente?.data_nascimento || selectedSurgery.paciente?.birth_date || 'Não informado' }}</span>
               </div>
               <div class="detail-item">
                 <strong>Sexo:</strong>
                 <span>{{ selectedSurgery.paciente?.sexo === 'masc' ? 'Masculino' : selectedSurgery.paciente?.sexo === 'fem' ? 'Feminino' : 'Não informado' }}</span>
               </div>
               <div class="detail-item">
                 <strong>Hospital:</strong>
                 <span>{{ selectedSurgery.paciente?.hospital || selectedSurgery.paciente?.hospital_name || 'Não informado' }}</span>
               </div>
               <div class="detail-item">
                 <strong>Registro:</strong>
                 <span>{{ selectedSurgery.paciente?.registro || selectedSurgery.paciente?.registration || 'Não informado' }}</span>
               </div>
            </div>
          </div>

          <div v-if="selectedSurgery.fotos && selectedSurgery.fotos.length > 0" class="detail-section">
            <h3>Fotos da Cirurgia ({{ selectedSurgery.fotos.length }})</h3>
            <div class="photos-grid">
              <div v-for="(foto, index) in selectedSurgery.fotos" :key="index" class="photo-container">
                                 <img 
                   :src="cirurgiasAPI.getImageProxy(foto) || ''" 
                   :alt="`Foto ${index + 1}`" 
                   class="surgery-photo" 
                   @click="viewImage(cirurgiasAPI.getImageProxy(foto))"
                   @error="handleImageError"
                 />
                <span class="photo-label">Foto {{ index + 1 }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedSurgery.historico" class="detail-section">
            <h3>Histórico Médico</h3>
            <div class="history-content">
              {{ selectedSurgery.historico }}
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="editSurgery(selectedSurgery)" class="modal-action-button edit">Editar Cirurgia</button>
          <button @click="closeModal" class="modal-action-button close">Fechar</button>
        </div>
      </div>
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
.surgeries-container {
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

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.surgeries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2vw;
}

.surgery-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2vw;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.surgery-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.surgery-header {
  margin-bottom: 1vw;
}

.surgery-header h3 {
  font-size: 1.5vw;
  margin: 0;
  color: #ffd700;
}

.surgery-details p {
  margin: 0.5vw 0;
  font-size: 1vw;
}

.surgery-actions {
  display: flex;
  gap: 0.5vw;
  margin-top: 1.5vw;
}

.action-button {
  flex: 1;
  padding: 0.8vw;
  border: none;
  border-radius: 8px;
  font-size: 0.8vw;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.action-button.edit {
  background: #2196f3;
  color: white;
}

.action-button.view {
  background: #4caf50;
  color: white;
}

.action-button.delete {
  background: #f44336;
  color: white;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.action-button.delete:hover {
  background: #d32f2f;
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 2vw;
  border-radius: 10px;
  margin-bottom: 2vw;
  text-align: center;
  font-size: 1.2vw;
}

.error-message p {
  margin: 0 0 1vw 0;
}

.retry-button {
  padding: 1vw 2vw;
  border: none;
  border-radius: 8px;
  background: rgba(255, 107, 107, 0.8);
  color: white;
  font-size: 1vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1vw;
}

.retry-button:hover {
  background: rgba(255, 107, 107, 1);
  transform: translateY(-1px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4vw;
  gap: 2vw;
}

.loading-spinner {
  width: 4vw;
  height: 4vw;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-surgeries {
  text-align: center;
  padding: 4vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  font-size: 1.5vw;
  font-style: italic;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .surgeries-container {
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

  .surgeries-grid {
    grid-template-columns: 1fr;
    gap: 4vw;
  }

  .surgery-card {
    padding: 4vw;
    border-radius: 20px;
  }

  .surgery-header h3 {
    font-size: 4.5vw;
  }

  .surgery-details p {
    font-size: 3.5vw;
    margin: 1vw 0;
  }

  .surgery-actions {
    gap: 1.5vw;
    margin-top: 3vw;
  }

  .action-button {
    padding: 2.5vw;
    font-size: 2.5vw;
    border-radius: 12px;
  }

  .error-message {
    font-size: 3vw;
    padding: 3vw;
  }

  .error-message p {
    margin: 0 0 2vw 0;
  }

  .retry-button {
    padding: 2vw 3vw;
    font-size: 2.5vw;
    border-radius: 10px;
    margin-top: 2vw;
  }

  .loading-container {
    padding: 6vw;
    gap: 3vw;
  }

  .loading-spinner {
    width: 6vw;
    height: 6vw;
  }

  .no-surgeries {
    padding: 6vw;
    font-size: 3.5vw;
    border-radius: 20px;
  }
}

@media (max-width: 480px) {
  .surgeries-container {
    padding: 5vw;
  }

  h1 {
    font-size: 7vw;
  }

  .back-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .surgery-card {
    padding: 5vw;
    border-radius: 25px;
  }

  .surgery-header h3 {
    font-size: 5vw;
  }

  .surgery-details p {
    font-size: 4vw;
  }

  .action-button {
    padding: 3vw;
    font-size: 3vw;
    border-radius: 15px;
  }

  .error-message {
    font-size: 3.5vw;
    padding: 4vw;
  }

  .error-message p {
    margin: 0 0 2.5vw 0;
  }

  .retry-button {
    padding: 2.5vw 4vw;
    font-size: 3vw;
    border-radius: 12px;
    margin-top: 2.5vw;
  }

  .loading-container {
    padding: 8vw;
    gap: 4vw;
  }

  .loading-spinner {
    width: 8vw;
    height: 8vw;
  }

  .no-surgeries {
    padding: 8vw;
    font-size: 4vw;
    border-radius: 25px;
  }
}

/* Modal Styles */
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

.modal-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 3vw;
  max-width: 80vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2vw;
}

.modal-header h2 {
  font-size: 2.5vw;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 2vw;
  cursor: pointer;
  border-radius: 50%;
  width: 3vw;
  height: 3vw;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.surgery-details-modal {
  margin-bottom: 2vw;
}

.detail-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 2vw;
  border-radius: 15px;
  margin-bottom: 2vw;
}

.detail-section h3 {
  font-size: 1.8vw;
  margin: 0 0 1.5vw 0;
  color: #ffd700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1vw;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
}

.detail-item strong {
  font-size: 1vw;
  color: #ffd700;
}

.detail-item span {
  font-size: 1.1vw;
  padding: 0.5vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5vw;
}

.photo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5vw;
}

.surgery-photo {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.surgery-photo:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.photo-label {
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.history-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5vw;
  border-radius: 10px;
  border-left: 4px solid rgba(255, 255, 255, 0.3);
  font-size: 1.1vw;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.loading-patient-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2vw;
  gap: 1vw;
}

.loading-patient-data .loading-spinner {
  width: 2vw;
  height: 2vw;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-patient-data p {
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1vw;
  margin-top: 2vw;
}

.modal-action-button {
  padding: 1vw 2vw;
  border: none;
  border-radius: 10px;
  font-size: 1.1vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-action-button.edit {
  background: #2196f3;
  color: white;
}

.modal-action-button.close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.modal-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-action-button.edit:hover {
  background: #1976d2;
}

.modal-action-button.close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Image Modal Styles */
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
  .modal-content {
    margin: 4vw;
    padding: 6vw;
    max-width: 92vw;
    max-height: 92vh;
    border-radius: 25px;
  }

  .modal-header h2 {
    font-size: 5vw;
  }

  .close-button {
    width: 8vw;
    height: 8vw;
    font-size: 5vw;
  }

  .detail-section {
    padding: 4vw;
    border-radius: 20px;
    margin-bottom: 3vw;
  }

  .detail-section h3 {
    font-size: 4vw;
    margin-bottom: 3vw;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 2vw;
  }

  .detail-item strong {
    font-size: 3vw;
  }

  .detail-item span {
    font-size: 3.5vw;
    padding: 1vw;
    border-radius: 12px;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 3vw;
  }

  .surgery-photo {
    height: 120px;
    border-radius: 15px;
  }

  .photo-label {
    font-size: 2.5vw;
  }

  .history-content {
    padding: 3vw;
    border-radius: 15px;
    font-size: 3.5vw;
  }

  .loading-patient-data {
    padding: 4vw;
    gap: 2vw;
  }

  .loading-patient-data .loading-spinner {
    width: 4vw;
    height: 4vw;
  }

  .loading-patient-data p {
    font-size: 3vw;
  }

  .modal-actions {
    gap: 2vw;
    margin-top: 3vw;
  }

  .modal-action-button {
    padding: 2.5vw 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
  }

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
  .modal-content {
    margin: 5vw;
    padding: 8vw;
  }

  .modal-header h2 {
    font-size: 6vw;
  }

  .close-button {
    width: 10vw;
    height: 10vw;
    font-size: 6vw;
  }

  .detail-section {
    padding: 5vw;
    border-radius: 25px;
  }

  .detail-section h3 {
    font-size: 5vw;
  }

  .detail-item strong {
    font-size: 4vw;
  }

  .detail-item span {
    font-size: 4.5vw;
  }

  .photos-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 4vw;
  }

  .surgery-photo {
    height: 100px;
  }

  .photo-label {
    font-size: 3vw;
  }

  .history-content {
    padding: 4vw;
    font-size: 4.5vw;
  }

  .modal-action-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

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
