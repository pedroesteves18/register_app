
import userService from "../service/user.js";
import { generateToken } from "../../global/generateToken.js";

const userController = {
    createDefaultUser: async (req,res) => {
        try{
            const user = await userService.createDefaultUser();
            res.status(201).send({message: 'Default user created successfully'});
        }catch(err){
            res.status(500).send({error: `Error creating default user: ${err.message}`});
        }
    },
    login: async (req,res) => {
        const { access } = req.body
        try{
            const user = await userService.login(access);
            if(!user){
                return res.status(401).send({message: 'Invalid Credentials'})
            }
            const token = generateToken(user,res);
            
            res.status(200).send({message: 'Login successful', userId: user.id, token});
        }catch(err){
            res.status(401).send({error: `Login failed: ${err.message}`});
        }
    }
}

export default userController