import pacienteController from "../controller/paciente.js";
import verifyToken from '../../global/verifyToken.js'
import verifyPacienteOwner from "./middlewares/verifyPacienteOwner.js"
import { Router } from 'express'
const router = Router()

router.post('/', verifyToken, pacienteController.createPaciente)
router.get('/all', verifyToken, pacienteController.fetchAllPacientes)
router.get('/:id', verifyToken, pacienteController.fetchPaciente)
router.put('/:id', verifyToken, verifyPacienteOwner, pacienteController.updatePaciente)
router.delete('/:id', verifyToken, verifyPacienteOwner,pacienteController.deletePaciente)

export default router