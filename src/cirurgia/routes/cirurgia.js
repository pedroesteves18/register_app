import cirurgiaController from '../controller/cirurgia.js'
import { Router } from 'express'
import verifyToken from '../../global/verifyToken.js'
import multer from 'multer'

const BulkUpload = multer().array('pics',20)
const router = Router()

router.post('/',BulkUpload,verifyToken,cirurgiaController.createCirurgia)


export default router