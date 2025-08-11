import cirurgiaService from '../service/cirurgia.js'
import pacienteService from '../../paciente/service/paciente.js'
import userService from '../../user/service/user.js';

const cirurgiaController = {
    createCirurgia: async (req,res) => {
        try{
            const data = req.body
            let paciente = await pacienteService.fetchPaciente(data.paciente)
            if(!paciente) return res.status(400).send({msg:"Paciente not found!"})
            data.pics = req.files || req.file || []
            const user = await userService.fetchme(req.user)
            if(!user) return res.status(401).send({msg:"User not found"})
            const cirurgia = await cirurgiaService.createCirurgia(data)
            if(!cirurgia) return res.status(400).send({msg:'Error creating Cirurgia'})
            
            return res.status(200).send({msg:"Cirurgia was created!", pics: cirurgia.fotos})

        }catch(err){
            return res.status(500).send({msg:"Error while creating a 'Cirurgia'"})
        }
    }
}

export default cirurgiaController