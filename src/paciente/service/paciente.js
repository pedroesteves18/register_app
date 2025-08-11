import Paciente from "../model/paciente.js";
import {Op} from 'sequelize'
const pacienteService = {
    createPaciente: async (data, userId) => {
        const [day, month, year] = data.dot.split('/');
        data.dot = `${year}-${month}-${day}`;
        return await Paciente.create({
            nome: data.nome,
            dot: data.dot,
            sexo: data.sexo,
            userId: userId
        })
    },
    fetchPaciente: async (pacienteId) => {
        return await Paciente.findByPk(pacienteId)
    },
    fetchPacienteByName: async (nome) => {
        return await Paciente.findOne({
            where:{
                nome: nome
            }
        })
    },
    deletePaciente: async (pacienteId) => {
        return await Paciente.destroy({
            where:{
                id: pacienteId
            }
        })

    }
}

export default pacienteService