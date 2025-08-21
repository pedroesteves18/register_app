import userService from "../../user/service/user.js";
import Paciente from "../model/paciente.js";
import {Op} from 'sequelize'
const pacienteService = {
    formatDate: (date) => {
        const [day, month, year] = date.split('/');
        return `${year}-${month}-${day}`;
    },
    createPaciente: async (data, userId) => {
        data.dot = pacienteService.formatDate(data.dot)
        return await Paciente.create({
            nome: data.nome,
            dot: data.dot,
            sexo: data.sexo,
            userId: userId,
            hospital: data.hospital,
            registro: data.registro,
            historico: data.historico
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

    },
    updatePaciente: async (paciente,pacienteId) => {
        const beforeUpdate = await pacienteService.fetchPaciente(pacienteId)
        if(paciente.nome === undefined) paciente.nome = beforeUpdate.nome
        if(paciente.sexo === undefined) paciente.sexo = beforeUpdate.sexo
        if(paciente.dot === undefined) paciente.dot = beforeUpdate.dot
        if(paciente.hospital === undefined) paciente.hospital = beforeUpdate.hospital
        if(paciente.registro === undefined) paciente.registro = beforeUpdate.registro
        if(paciente.historico == undefined) paciente.historico = beforeUpdate.historico
        
        if(paciente.dot) paciente.dot = pacienteService.formatDate(paciente.dot)
        return await Paciente.update(
                {
                nome: paciente.nome,
                sexo: paciente.sexo,
                dot: paciente.dot,
                hospital: paciente.hospital,
                registro: paciente.registro,
                historico: paciente.historico
            },
                {
                where: { id: pacienteId }
            }
        )
    },
    fetchUsersPacientes: async (userId) => {
        console.log('Service - userId received:', userId)
        console.log('Service - Paciente model:', Paciente)
        try {
            const result = await Paciente.findAll({
                where: {
                    userId: userId
                }
            })
            console.log('Service - Query result:', result)
            return result
        } catch (error) {
            console.log('Service - Error in fetchUsersPacientes:', error.message)
            throw error
        }
    },
    verifyOwner: async (userId, pacienteId) => {
        const paciente = await Paciente.findOne({
            where: {
                id: pacienteId,
                userId: userId
            }
        })
        return !!paciente
    }
}

export default pacienteService