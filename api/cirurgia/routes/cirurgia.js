import cirurgiaController from '../controller/cirurgia.js'
import { Router } from 'express'
import verifyToken from '../../global/verifyToken.js'
import multer from 'multer'

const BulkUpload = multer().array('pics',20)
const router = Router()

router.post('/:pacienteId',BulkUpload,verifyToken,cirurgiaController.createCirurgia)
router.get('/paciente/:id', verifyToken, cirurgiaController.fetchPacienteCirurgias)
router.get('/all', verifyToken, cirurgiaController.fetchAllCirurgias)
router.put('/:id', BulkUpload, verifyToken, cirurgiaController.updateCirurgia)
router.get('/:id',verifyToken,cirurgiaController.fetchCirurgia)
router.delete('/:id',verifyToken,cirurgiaController.deleteCirurgia)

export default router