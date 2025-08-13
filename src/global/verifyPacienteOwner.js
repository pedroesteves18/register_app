import pacienteService from "../paciente/service/paciente.js"

const verifyPacienteOwner = async (req,res,next) => {
    try{
        const userId = req.user
        const pacienteId = req.params.id
        console.log(userId)
        const isOwner = await pacienteService.verifyOwner(userId,pacienteId)
        if(!isOwner) return res.status(400).send({msg:"You are not the owner of this Paciente"})
        next()
    }catch(err){
        return res.status(500).send({msg:"Error while verifying owner of paciente"})
    }
}

export default verifyPacienteOwner