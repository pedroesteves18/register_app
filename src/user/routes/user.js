import userController from "../controller/user.js";
import { Router } from "express";

const router = Router()


router.post('/', userController.createDefaultUser)
router.post('/login', userController.login)

export default router