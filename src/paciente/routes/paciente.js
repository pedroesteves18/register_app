import pacienteController from "../controller/paciente.js";
import verifyToken from '../../global/verifyToken.js'
import { Router } from 'express'
const router = Router()

router.post('/', verifyToken, pacienteController.createPaciente)
router.delete('/:id', verifyToken, pacienteController.deletePaciente)
router.get('/', verifyToken, pacienteController.fetchPaciente)

export default router