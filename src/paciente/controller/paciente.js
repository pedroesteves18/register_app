
import pacienteService from '../service/paciente.js'


const pacienteController = {
    createPaciente: async (req,res) => {
        try{
            const user = req.user
            const data = req.body
            const alreadyCreated = await pacienteService.fetchPacienteByName(data.nome)
            if(alreadyCreated) return res.status(400).send({msg:"Paciente already exists!"})
            const paciente = await pacienteService.createPaciente(data,user)
            if(!paciente) return res.status(403).send({msg:"Error creating Paciente"})
            return res.status(200).send({msg:"Paciente created"})
        }catch(err){
            console.log(err.message)
            return res.status(500).send({msg:"Error while creating Paciente"})
        }
    },
    fetchPaciente: async (req,res) => {
        try{
            const paciente = await pacienteService.fetchPaciente(req.params.id)
            if(!paciente) return res.status(400).send({msg:"Paciente not found"})
            return res.status(200).send({paciente})
        }catch(err){
            return res.status(500).send({msg:"Error while fetching Paciente"})
        }
    },
    deletePaciente: async (req,res) => {
        try{
            let id = req.params.id
            const paciente =  await pacienteService.fetchPaciente(id)
            if(!paciente) return res.status(400).send({msg:"Paciente not found"})

            await pacienteService.deletePaciente(id)
            return res.status(200).send({msg:"Paciente deleted"})
        }catch(err){
            return res.status(500).send({msg:"Error while removing Paciente"})
        }
    },
    updatePaciente: async (req,res) => {
        try{
            const paciente = await pacienteService.fetchPaciente(req.params.id)
            let data = req.body
            await pacienteService.updatePaciente(data,paciente.id)
            return res.status(200).send({msg:"Paciente altered"})
        }catch(err){
            return res.status(500).send({msg:"Error while updating Paciente",err:err.message})
        }
    }
}

export default pacienteController