import cirurgiaService from '../service/cirurgia.js'
import pacienteService from '../../paciente/service/paciente.js'
import userService from '../../user/service/user.js';

const cirurgiaController = {
    createCirurgia: async (req,res) => {
        try{
            const data = req.body
            const pacienteId = req.params.pacienteId  // ✅ Get from route parameter
            
            let paciente = await pacienteService.fetchPaciente(pacienteId)
            if(!paciente) return res.status(400).send({msg:"Paciente not found!"})
            
            data.pacienteId = paciente.id  // Set the pacienteId in data
            
            data.pics = req.files || req.file || []
            const user = await userService.fetchme(req.user)
            if(!user) return res.status(401).send({msg:"User not found"})
            data.descrição = data.descricao
            const cirurgia = await cirurgiaService.createCirurgia(data)
            if(!cirurgia) return res.status(400).send({msg:'Error creating Cirurgia'})
            
            return res.status(200).send({msg:"Cirurgia was created!", pics: cirurgia.fotos})
    
        }catch(err){
            return res.status(500).send({msg:"Error while creating a 'Cirurgia'"})
        }
    },
    updateCirurgia: async (req,res) => {
        try{
            const data = req.body
            data.pics = req.files || req.file || []
            data.id = req.params.id
            const user = await userService.fetchme(req.user)
            if(!user) return res.status(401).send({msg:"User not found"})
            const isUpdated = await cirurgiaService.updateCirurgia(data)
            if(!isUpdated) return res.status(400).send({msg:"Error while updating Cirurgia"})
            return res.status(200).send({msg:"Cirurgia updated"})
        }catch(err){
              return res.status(500).send({msg:"Error while removing a Cirurgia"})
        }
    },
    deleteCirurgia: async (req,res) => {
        try{
            const id = req.params.id
            const cirurgia = await cirurgiaService.fetchCirurgia(id)
            if(!cirurgia) return res.status(400).send({msg:"Cirurgia not found"})
            const destroyed = await cirurgiaService.deleteCirurgia(cirurgia)
            if(!destroyed) return res.status(400).send({msg:"Error while destroying data"})
            return res.status(200).send({msg:"Cirurgia was removed"}) 
        }catch(err){
            return res.status(500).send({msg:"Error while removing a Cirurgia"})
        }
    },
    fetchCirurgia: async (req,res) => {
        try{
            const id = req.params.id
            const cirurgia = await cirurgiaService.fetchCirurgia(id)
            if(!cirurgia) return res.status(400).send({msg:"Cirurgia not found"})
            console.log(cirurgia)
            return res.status(200).send({cirurgia:cirurgia})
        }catch(err){
            return res.status(500).send({msg:"Error while fetching a Cirurgia", err: err.message})
        }
    },
    fetchPacienteCirurgias: async (req, res) => {
        try {
            const pacienteId = req.params.id
            console.log('Fetching surgeries for patient ID:', pacienteId) // Add this for debugging
            
            const cirurgias = await cirurgiaService.fetchPacienteCirurgias(pacienteId)
            console.log('Found surgeries:', cirurgias) // Add this for debugging
            
            return res.status(200).send({ cirurgias: cirurgias })
        } catch (err) {
            console.error('Error in fetchPacienteCirurgias:', err) // Add this for debugging
            return res.status(500).send({ msg: "Error while fetching patient surgeries", err: err.message })
        }
    },
    fetchAllCirurgias: async (req, res) => {
        try {
            const cirurgias = await cirurgiaService.fetchAllCirurgias(req.user)
            return res.status(200).send({ cirurgias: cirurgias })
        } catch (err) {
            return res.status(500).send({ msg: "Error while fetching all surgeries", err: err.message })
        }
    }
}

export default cirurgiaController