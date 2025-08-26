<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { pacientesAPI, cirurgiasAPI } from '../services/api'

const router = useRouter()

const patients = ref([])
const searchQuery = ref('')
const selectedPatient = ref(null)
const showSurgeriesModal = ref(false)
const showHistoryModal = ref(false)
const showImageModal = ref(false)
const selectedImage = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const patientSurgeries = ref([])
const isLoadingSurgeries = ref(false)



const filteredPatients = computed(() => {
  if (!searchQuery.value.trim()) {
    return patients.value
  }
  return patients.value.filter(patient => 
    patient.nome.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const fetchPatients = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    const response = await pacientesAPI.getAllPacientes()
    patients.value = response.pacientes || []
  } catch (error) {
    console.error('Error fetching patients:', error)
    
    if (error.response?.status === 500) {
      errorMessage.value = 'Erro interno do servidor. Verifique se o backend está funcionando corretamente.'
    } else if (error.response?.status === 401) {
      errorMessage.value = 'Erro de autenticação. Faça login novamente.'
    } else if (error.response?.status === 404) {
      errorMessage.value = 'Rota não encontrada. Verifique se o backend está configurado corretamente.'
    } else {
      errorMessage.value = 'Erro ao carregar pacientes. Tente novamente.'
    }
  } finally {
    isLoading.value = false
  }
}

const createNewPatient = () => {
  router.push('/create-patient')
}

const showSurgeries = () => {
  router.push('/surgeries')
}

const createSurgeryForPatient = (patient) => {
  router.push({ name: 'CreateSurgery', query: { patient: JSON.stringify(patient) } })
}

const editSurgeryForPatient = (surgery) => {
  router.push({ name: 'EditSurgery', query: { surgery: JSON.stringify(surgery) } })
}

const viewPatientDetails = async (patient) => {
  selectedPatient.value = patient
  showSurgeriesModal.value = true
  await fetchPatientSurgeries(patient.id)
}

const viewPatientHistory = (patient) => {
  selectedPatient.value = patient
  showHistoryModal.value = true
}

const viewImage = (imageUrl) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
}

const closeModal = () => {
  showSurgeriesModal.value = false
  showHistoryModal.value = false
  showImageModal.value = false
  selectedPatient.value = null
  selectedImage.value = null
  patientSurgeries.value = []
}

const deletePatient = async (patientId) => {
  if (confirm('Tem certeza que deseja excluir este paciente?')) {
    try {
      await pacientesAPI.deletePaciente(patientId)
      await fetchPatients()
    } catch (error) {
      errorMessage.value = 'Erro ao excluir paciente. Tente novamente.'
      console.error('Error deleting patient:', error)
    }
  }
}

const editPatient = (patient) => {
  router.push({ name: 'EditPatient', query: { patient: JSON.stringify(patient) } })
}

const fetchPatientSurgeries = async (patientId) => {
  try {
    isLoadingSurgeries.value = true
    const response = await cirurgiasAPI.getPacienteCirurgias(patientId)
    patientSurgeries.value = response.cirurgias || response || []
  } catch (error) {
    console.error('Error fetching patient surgeries:', error)
    patientSurgeries.value = []
  } finally {
    isLoadingSurgeries.value = false
  }
}

const deleteSurgery = async (surgeryId) => {
  if (confirm('Tem certeza que deseja excluir esta cirurgia?')) {
    try {
      await cirurgiasAPI.deleteCirurgia(surgeryId)
      
      // Refresh the surgeries list
      await fetchPatientSurgeries(selectedPatient.value.id)
    } catch (error) {
      console.error('Error deleting surgery:', error)
      
      if (error.response?.status === 404) {
        errorMessage.value = 'Cirurgia não encontrada.'
      } else if (error.response?.status === 401) {
        errorMessage.value = 'Erro de autenticação. Faça login novamente.'
      } else if (error.response?.status === 500) {
        errorMessage.value = 'Erro interno do servidor. Tente novamente.'
      } else {
        errorMessage.value = 'Erro ao excluir cirurgia. Tente novamente.'
      }
    }
  }
}

const formatHistory = (history) => {
  if (!history) return ''
  return history.replace(/\n/g, '<br>')
}

const handleImageError = (event) => {
  console.warn('Image failed to load:', event.target.src)
  // Optionally set a fallback image
  event.target.style.display = 'none'
}

onMounted(() => {
  fetchPatients()
})
</script>

<template>
  <div class="patients-container">
    <div class="header">
      <h1>Gestão de Pacientes</h1>
      <div class="header-actions">
        <button @click="createNewPatient" class="create-button">+ Novo Paciente</button>
        <button @click="showSurgeries" class="action-header-button">Ver Cirurgias</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>


    <div class="search-section">
      <div class="search-container">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Pesquisar pacientes por nome..."
          class="search-input"
        />
      </div>
      <div class="search-results">
        <span v-if="searchQuery && filteredPatients.length === 0" class="no-results">
          Nenhum paciente encontrado para "{{ searchQuery }}"
        </span>
        <span v-else-if="searchQuery" class="results-count">
          Encontrado {{ filteredPatients.length }} paciente{{ filteredPatients.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando pacientes...</p>
    </div>
    
    <div class="patients-grid">
      <div v-for="patient in filteredPatients" :key="patient.id" class="patient-card">
        <div class="patient-header">
          <h3>{{ patient.nome }}</h3>
        </div>
        <div class="patient-details">
          <p><strong>Data de Nascimento:</strong> {{ patient.dot }}</p>
          <p><strong>Sexo:</strong> {{ patient.sexo === 'masc' ? 'Masculino' : 'Feminino' }}</p>
          <p><strong>Hospital:</strong> {{ patient.hospital }}</p>
          <p><strong>Registro:</strong> {{ patient.registro }}</p>
        </div>
                 <div class="patient-actions">
           <button @click="editPatient(patient)" class="action-button edit">Editar</button>
           <button @click="viewPatientDetails(patient)" class="action-button view">Cirurgias</button>
           <button @click="viewPatientHistory(patient)" class="action-button history">Histórico</button>
           <button @click="deletePatient(patient.id)" class="action-button delete">Excluir</button>
         </div>
      </div>
    </div>

    <!-- Surgeries Modal -->
    <div v-if="showSurgeriesModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedPatient?.nome }} - Cirurgias</h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        
        <div class="patient-info">
          <p><strong>Data de Nascimento:</strong> {{ selectedPatient?.dot }}</p>
          <p><strong>Sexo:</strong> {{ selectedPatient?.sexo === 'masc' ? 'Masculino' : 'Feminino' }}</p>
          <p><strong>Hospital:</strong> {{ selectedPatient?.hospital }}</p>
          <p><strong>Registro:</strong> {{ selectedPatient?.registro }}</p>
        </div>

        <div class="surgeries-list">
          <div class="surgeries-header">
            <h3>Cirurgias realizadas</h3>
            <button @click="createSurgeryForPatient(selectedPatient)" class="new-surgery-button">
              + Nova Cirurgia
            </button>
          </div>
                    <div v-if="isLoadingSurgeries" class="loading-surgeries">
            <div class="loading-spinner"></div>
            <p>Carregando cirurgias...</p>
          </div>
          <div v-else-if="!patientSurgeries || patientSurgeries.length === 0" class="no-surgeries">
            Nenhuma cirurgia registrada
          </div>
          <div v-else class="surgery-items">
            <div v-for="surgery in patientSurgeries" :key="surgery.id" class="surgery-item">
              <div class="surgery-header">
                <h4>{{ surgery.descrição }}</h4>
              </div>
              <div class="surgery-details">
                <p><strong>Data:</strong> {{ surgery.data }}</p>
                <p><strong>ID da Cirurgia:</strong> #{{ surgery.id }}</p>
                <p v-if="surgery.fotos && surgery.fotos.length > 0">
                  <strong>Fotos:</strong> {{ surgery.fotos.length }} foto{{ surgery.fotos.length !== 1 ? 's' : '' }}
                </p>
              </div>
              
                             <div v-if="surgery.fotos && surgery.fotos.length > 0" class="surgery-images">
                 <div class="images-grid">
                   <div v-for="(foto, fotoIndex) in surgery.fotos" :key="fotoIndex" class="image-container">
                                           <img 
                        :src="cirurgiasAPI.getImageProxy(foto) || ''" 
                        :alt="`Foto ${fotoIndex + 1}`" 
                        class="surgery-image" 
                        @click="viewImage(cirurgiasAPI.getImageProxy(foto))"
                        @error="handleImageError"
                      />
                   </div>
                 </div>
               </div>
              <div class="surgery-actions">
                <button @click="editSurgeryForPatient(surgery)" class="surgery-action-button edit">Editar</button>
                <button @click="deleteSurgery(surgery.id)" class="surgery-action-button delete">Excluir</button>
              </div>
            </div>
          </div>
        </div>

                 <div class="modal-actions">
           <button @click="closeModal" class="close-modal-button">Fechar</button>
         </div>
       </div>
     </div>

     <!-- History Modal -->
     <div v-if="showHistoryModal" class="modal-overlay" @click="closeModal">
       <div class="modal-content history-modal" @click.stop>
         <div class="modal-header">
           <h2>{{ selectedPatient?.nome }} - Histórico</h2>
           <button @click="closeModal" class="close-button">×</button>
         </div>
         
         <div class="patient-info">
           <p><strong>Data de Nascimento:</strong> {{ selectedPatient?.dot }}</p>
           <p><strong>Sexo:</strong> {{ selectedPatient?.sexo === 'masc' ? 'Masculino' : 'Feminino' }}</p>
           <p><strong>Hospital:</strong> {{ selectedPatient?.hospital }}</p>
           <p><strong>Registro:</strong> {{ selectedPatient?.registro }}</p>
         </div>

         <div class="history-content">
           <h3>Histórico Médico</h3>
           <div class="patient-history" v-html="formatHistory(selectedPatient?.historico)"></div>
         </div>

         <div class="modal-actions">
           <button @click="closeModal" class="close-modal-button">Fechar</button>
         </div>
       </div>
     </div>

     <!-- Image Modal -->
     <div v-if="showImageModal" class="modal-overlay image-modal-overlay" @click="closeModal">
       <div class="image-modal-content" @click.stop>
         <div class="image-modal-header">
           <h3>Visualização da Imagem</h3>
           <button @click="closeModal" class="close-button">×</button>
         </div>
         <div class="image-modal-body">
           <img :src="selectedImage" alt="Imagem da cirurgia" class="full-size-image" />
         </div>
         <div class="image-modal-actions">
           <button @click="closeModal" class="close-modal-button">Fechar</button>
         </div>
       </div>
     </div>
   </div>
 </template>

<style scoped>
.patients-container {
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
  flex-wrap: wrap;
  gap: 2vw;
}

h1 {
  font-size: 3vw;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1vw;
  flex-wrap: wrap;
}

.create-button {
  padding: 1vw 2vw;
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

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
}

.action-header-button {
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

.action-header-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.search-section {
  margin-bottom: 3vw;
}

.search-container {
  position: relative;
  max-width: 50vw;
  margin-bottom: 1vw;
  margin-right: 8vw;
}

.search-input {
  width: 100%;
  padding: 1.2vw 3vw 1.2vw 1.5vw;
  border: none;
  border-radius: 15px;
  font-size: 1.2vw;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  background: white;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: #666;
}

.search-results {
  display: flex;
  gap: 2vw;
  align-items: center;
}

.no-results {
  color: #ff6b6b;
  font-size: 1vw;
  font-style: italic;
}

.results-count {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1vw;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2vw;
  max-width: calc(5 * 320px + 3 * 2vw);
}

.patient-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2vw;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  min-width: 0;
  overflow: hidden;
}

.patient-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.patient-header {
  margin-bottom: 1vw;
}

.patient-header h3 {
  font-size: 1.5vw;
  margin: 0;
}

.patient-details p {
  margin: 0.5vw 0;
  font-size: 1vw;
}

.patient-actions {
  display: flex;
  gap: 0.5vw;
  margin-top: 1.5vw;
  flex-wrap: wrap;
}

.action-button {
  flex: 1;
  min-width: 0;
  padding: 0.8vw 0.5vw;
  border: none;
  border-radius: 8px;
  font-size: 0.7vw;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-button.edit {
  background: #2196f3;
  color: white;
}

.action-button.view {
  background: #4caf50;
  color: white;
}

.action-button.history {
  background: #ff9800;
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

.action-button.history:hover {
  background: #f57c00;
}

.action-button.delete:hover {
  background: #d32f2f;
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

.patient-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 2vw;
  border-radius: 15px;
  margin-bottom: 2vw;
}

.patient-info p {
  margin: 0.5vw 0;
  font-size: 1.2vw;
}

.patient-history {
  margin: 0.5vw 0;
  font-size: 1.2vw;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
  padding: 1vw;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.history-modal {
  max-width: 70vw;
}

.history-content {
  margin-top: 2vw;
}

.history-content h3 {
  font-size: 2vw;
  margin-bottom: 1.5vw;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  color: #ff9800;
}

.surgeries-list h3 {
  font-size: 2vw;
  margin-bottom: 1.5vw;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.surgeries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5vw;
}

.new-surgery-button {
  padding: 0.8vw 1.5vw;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  font-size: 1vw;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.new-surgery-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ff5252 0%, #d63031 100%);
}

.no-surgeries {
  text-align: center;
  padding: 2vw;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 1.2vw;
  font-style: italic;
}

.loading-surgeries {
  text-align: center;
  padding: 2vw;
  color: rgba(255, 255, 255, 0.8);
}

.loading-surgeries .loading-spinner {
  width: 2vw;
  height: 2vw;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1vw auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.surgery-items {
  display: flex;
  flex-direction: column;
  gap: 1.5vw;
}

.surgery-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2vw;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.surgery-header {
  margin-bottom: 1vw;
}

.surgery-header h4 {
  font-size: 1.5vw;
  margin: 0;
}

.surgery-details p {
  margin: 0.5vw 0;
  font-size: 1vw;
}

.surgery-images {
  margin-top: 1vw;
  padding: 1vw;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1vw;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.surgery-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.surgery-image:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
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

.surgery-actions {
  display: flex;
  gap: 0.5vw;
  margin-top: 1.5vw;
}

.surgery-action-button {
  flex: 1;
  padding: 0.6vw 1vw;
  border: none;
  border-radius: 6px;
  font-size: 0.7vw;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.surgery-action-button.edit {
  background: #2196f3;
  color: white;
}

.surgery-action-button.delete {
  background: #f44336;
  color: white;
}

.surgery-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.surgery-action-button.delete:hover {
  background: #d32f2f;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-top: 2vw;
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

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .patients-container {
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

  .header-actions {
    justify-content: center;
    gap: 2vw;
  }

  .create-button,
  .action-header-button {
    padding: 2.5vw 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
  }

  .search-container {
    max-width: 100%;
  }

  .search-input {
    padding: 3vw 6vw 3vw 4vw;
    font-size: 4vw;
    border-radius: 20px;
  }

  .search-results {
    justify-content: center;
  }

  .no-results,
  .results-count {
    font-size: 3vw;
  }

  .patients-grid {
    grid-template-columns: 1fr;
    gap: 4vw;
    max-width: 100%;
  }

  .patient-card {
    padding: 4vw;
    border-radius: 20px;
  }

  .patient-header h3 {
    font-size: 4.5vw;
  }

  .patient-details p {
    font-size: 3.5vw;
    margin: 1vw 0;
  }

  .patient-actions {
    gap: 1.5vw;
    margin-top: 3vw;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 2.5vw;
    font-size: 2.5vw;
    border-radius: 12px;
    min-width: calc(50% - 0.75vw);
  }

  /* Modal Mobile Styles */
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

  .patient-info {
    padding: 4vw;
    border-radius: 20px;
  }

  .patient-info p {
    font-size: 3.5vw;
    margin: 1.5vw 0;
  }

  .patient-history {
    font-size: 3.5vw;
    margin: 1.5vw 0;
    padding: 2vw;
    border-radius: 12px;
  }

  .history-modal {
    max-width: 85vw;
  }

  .history-content h3 {
    font-size: 4.5vw;
    text-align: center;
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

  .surgeries-header {
    flex-direction: column;
    gap: 3vw;
    align-items: stretch;
  }

  .surgeries-list h3 {
    font-size: 4.5vw;
    text-align: center;
  }

  .new-surgery-button {
    padding: 2.5vw 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
  }

  .no-surgeries {
    padding: 4vw;
    font-size: 3.5vw;
    border-radius: 15px;
  }

  .surgery-item {
    padding: 4vw;
    border-radius: 20px;
  }

  .surgery-header h4 {
    font-size: 4.5vw;
  }

  .surgery-details p {
    font-size: 3.5vw;
    margin: 1.5vw 0;
  }

  .surgery-images {
    margin-top: 2vw;
    padding: 2vw;
    border-radius: 12px;
  }

  .images-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 2vw;
  }

  .surgery-image {
    height: auto;
    max-height: 150px;
    border-radius: 8px;
  }

  .surgery-actions {
    gap: 1.5vw;
    margin-top: 3vw;
  }

  .surgery-action-button {
    padding: 2vw 3vw;
    font-size: 2.5vw;
    border-radius: 10px;
  }

  .close-modal-button {
    padding: 3vw 6vw;
    font-size: 3.5vw;
    border-radius: 15px;
  }
}

@media (max-width: 480px) {
  .patients-container {
    padding: 5vw;
  }

  h1 {
    font-size: 7vw;
  }

  .create-button,
  .action-header-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .search-input {
    padding: 4vw 5vw;
    font-size: 4.5vw;
  }

  .patient-card {
    padding: 5vw;
  }

  .patient-header h3 {
    font-size: 5vw;
  }

  .patient-details p {
    font-size: 4vw;
  }

  .action-button {
    padding: 3vw;
    font-size: 3vw;
    min-width: calc(50% - 1.5vw);
  }

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

  .patient-info p {
    font-size: 4vw;
  }

  .surgeries-list h3 {
    font-size: 5.5vw;
  }

  .new-surgery-button {
    padding: 3vw 5vw;
    font-size: 4vw;
  }

  .surgery-header h4 {
    font-size: 5vw;
  }

  .surgery-details p {
    font-size: 4vw;
  }

  .surgery-images {
    margin-top: 3vw;
    padding: 3vw;
    border-radius: 15px;
  }

  .images-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 3vw;
  }

  .surgery-image {
    height: auto;
    max-height: 120px;
    border-radius: 10px;
  }

  .surgery-action-button {
    padding: 2.5vw 4vw;
    font-size: 3vw;
    border-radius: 12px;
  }

  .close-modal-button {
    padding: 4vw 8vw;
    font-size: 4vw;
  }

  .history-content h3 {
    font-size: 5.5vw;
  }

  .history-modal {
    max-width: 90vw;
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

@media (max-width: 768px) {
  .error-message {
    font-size: 3vw;
    padding: 3vw;
  }

  .loading-container {
    padding: 6vw;
    gap: 3vw;
  }

  .loading-spinner {
    width: 6vw;
    height: 6vw;
  }
}

@media (max-width: 480px) {
  .error-message {
    font-size: 3.5vw;
    padding: 4vw;
  }

  .loading-container {
    padding: 8vw;
    gap: 4vw;
  }

  .loading-spinner {
    width: 8vw;
    height: 8vw;
  }
}
</style>
