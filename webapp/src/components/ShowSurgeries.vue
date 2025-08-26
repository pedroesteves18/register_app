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
  event.target.style.display = 'none'
}

onMounted(() => {
  fetchSurgeries()
})
</script>

<template>
  <div class="surgeries-container">
    <!-- Header -->
    <div class="header">
      <h1>{{ currentPatientId ? 'Cirurgias' : 'Todas as Cirurgias' }}</h1>
      <button @click="goBack" class="btn-secondary">
        {{ currentPatientId ? '← Paciente' : '← Pacientes' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="fetchSurgeries" class="btn-primary">Tentar Novamente</button>
    </div>
    
    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando cirurgias...</p>
    </div>
    
    <!-- No Surgeries -->
    <div v-else-if="!surgeries || surgeries.length === 0" class="empty-state">
      <span class="empty-icon">🏥</span>
      <p>Nenhuma cirurgia encontrada</p>
    </div>
    
    <!-- Surgeries List -->
    <div v-else class="surgeries-list">
      <div v-for="surgery in surgeries" :key="surgery.id" class="surgery-card">
        <div class="surgery-info">
          <div class="surgery-header">
            <h3>{{ surgery.descrição || 'Sem descrição' }}</h3>
            <span class="surgery-id">#{{ surgery.id }}</span>
          </div>
          <div class="surgery-details">
            <div class="detail-item">
              <span class="detail-label">Data:</span>
              <span class="detail-value">{{ surgery.data }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Paciente:</span>
              <span class="detail-value">{{ surgery.paciente?.nome || 'Paciente não encontrado' }}</span>
            </div>
            <div v-if="surgery.fotos && surgery.fotos.length > 0" class="detail-item">
              <span class="detail-label">Fotos:</span>
              <span class="detail-value">📷 {{ surgery.fotos.length }}</span>
            </div>
          </div>
        </div>
        
        <div class="surgery-actions">
          <button @click="viewSurgeryDetails(surgery)" class="action-btn view">
            <span class="action-icon">👁️</span>
            Detalhes
          </button>
          <button @click="editSurgery(surgery)" class="action-btn edit">
            <span class="action-icon">✏️</span>
            Editar
          </button>
          <button @click="deleteSurgery(surgery.id)" class="action-btn delete">
            <span class="action-icon">🗑️</span>
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Surgery Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Detalhes da Cirurgia</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div v-if="selectedSurgery" class="surgery-details-modal">
          <div class="detail-section">
            <h3>Informações da Cirurgia</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Descrição:</span>
                <span>{{ selectedSurgery.descrição || 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Data:</span>
                <span>{{ selectedSurgery.data || 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ID:</span>
                <span>#{{ selectedSurgery.id }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Informações do Paciente</h3>
            <div v-if="isLoadingPatientData" class="loading-state">
              <div class="loading-spinner small"></div>
              <p>Carregando dados do paciente...</p>
            </div>
            <div v-else class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Nome:</span>
                <span>{{ selectedSurgery.paciente?.nome || 'Paciente não encontrado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Nascimento:</span>
                <span>{{ selectedSurgery.paciente?.dot || selectedSurgery.paciente?.data_nascimento || selectedSurgery.paciente?.birth_date || 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Sexo:</span>
                <span>{{ selectedSurgery.paciente?.sexo === 'masc' ? '♂ Masculino' : selectedSurgery.paciente?.sexo === 'fem' ? '♀ Feminino' : 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Hospital:</span>
                <span>{{ selectedSurgery.paciente?.hospital || selectedSurgery.paciente?.hospital_name || 'Não informado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Registro:</span>
                <span>{{ selectedSurgery.paciente?.registro || selectedSurgery.paciente?.registration || 'Não informado' }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedSurgery.fotos && selectedSurgery.fotos.length > 0" class="detail-section">
            <h3>Fotos da Cirurgia ({{ selectedSurgery.fotos.length }})</h3>
            <div class="photos-grid">
              <div v-for="(foto, index) in selectedSurgery.fotos" :key="index" class="photo-item">
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

        <div class="modal-footer">
          <button @click="editSurgery(selectedSurgery)" class="btn-primary">Editar Cirurgia</button>
          <button @click="closeModal" class="btn-secondary">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="modal-overlay image-modal" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <div class="image-modal-header">
          <h3>Imagem</h3>
          <button @click="closeImageModal" class="close-btn">×</button>
        </div>
        <div class="image-modal-body">
          <img :src="selectedImage" alt="Imagem da cirurgia" class="full-image" />
        </div>
        <div class="image-modal-footer">
          <button @click="closeImageModal" class="btn-secondary">Fechar</button>
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
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

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.error-message {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
}

.error-message p {
  margin: 0 0 12px 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
}

.loading-container p {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  gap: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 48px;
}

.empty-state p {
  margin: 0;
  font-size: 18px;
}

.surgeries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.surgery-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.surgery-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.surgery-info {
  margin-bottom: 16px;
}

.surgery-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.surgery-header h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #ffd700;
  flex: 1;
}

.surgery-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
}

.surgery-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: white;
  font-weight: 600;
  text-align: right;
}

.surgery-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.action-btn.view {
  background: #4caf50;
  color: white;
}

.action-btn.edit {
  background: #2196f3;
  color: white;
}

.action-btn.delete {
  background: #f44336;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-icon {
  font-size: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.surgery-details-modal {
  margin-bottom: 20px;
}

.detail-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.detail-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #ffd700;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-grid .detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-grid .detail-item:last-child {
  border-bottom: none;
}

.detail-grid .detail-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.detail-grid .detail-item span:last-child {
  font-size: 14px;
  color: white;
  font-weight: 600;
  text-align: right;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.photo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.surgery-photo {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.surgery-photo:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
}

.photo-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.history-content {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid rgba(255, 255, 255, 0.3);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 12px;
}

.loading-state p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.image-modal {
  background: rgba(0, 0, 0, 0.95);
}

.image-modal-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 16px;
  padding: 20px;
  width: 100%;
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
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.image-modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.image-modal-body {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 60vh;
  overflow: auto;
  margin-bottom: 16px;
}

.full-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.image-modal-footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 480px) {
  .surgeries-container {
    padding: 12px;
    padding-bottom: 80px;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .surgery-card {
    padding: 16px;
  }
  
  .surgery-header h3 {
    font-size: 18px;
  }
  
  .surgery-actions {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  
  .action-btn {
    padding: 12px 8px;
    font-size: 13px;
    min-height: 44px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 8px;
  }
  
  .modal-header h2 {
    font-size: 20px;
  }
  
  .detail-section h3 {
    font-size: 16px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .surgery-photo {
    height: 80px;
  }
}

@media (max-width: 360px) {
  .surgeries-container {
    padding: 8px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .surgery-actions {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  
  .action-btn {
    padding: 12px 6px;
    font-size: 12px;
    min-height: 44px;
  }
}
</style>
