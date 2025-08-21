import userController from "../controller/user.js";
import { Router } from "express";
import verifyAdm from '../../global/verifyAdm.js'

const router = Router()


router.post('/', userController.createDefaultUser)
router.post('/login', userController.login)
router.post('/new', verifyAdm, userController.createUser)

export default router