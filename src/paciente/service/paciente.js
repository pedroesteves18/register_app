import Paciente from "../model/paciente.js";
import {Op} from 'sequelize'
const pacienteService = {
    createPaciente: async (data, userId) => {
        const paciente = await pacienteService.fetchMe(data.nome,data.dot,userId)
        if(paciente){
            return null
        }
        return await Paciente.create({
            nome: data.nome,
            dot: data.dot,
            userId: userId
        })
    },
    fetchMe: async (nome, dot,userId) => {
        return await Paciente.findOne({
            [Op.and]: [
                {nome: nome},
                {dot: dot},
                {userId: userId}
            ]
        })
    }
}