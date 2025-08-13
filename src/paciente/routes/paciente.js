import pacienteController from "../controller/paciente.js";
import verifyToken from '../../global/verifyToken.js'
import verifyPacienteOwner from "../../global/verifyPacienteOwner.js";
import { Router } from 'express'
const router = Router()

router.post('/', verifyToken, pacienteController.createPaciente)
router.delete('/:id', verifyToken, verifyPacienteOwner,pacienteController.deletePaciente)
router.get('/:id', verifyToken, pacienteController.fetchPaciente)
router.put('/:id', verifyToken, verifyPacienteOwner, pacienteController.updatePaciente)


export default router