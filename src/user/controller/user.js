
import userService from "../service/user.js";
import { generateToken } from "../../global/generateToken.js";

const userController = {
    createDefaultUser: async (req, res) => {
        try {
            const result = await userService.createDefaultUser();

            if (!result.created) {
                return res.status(400).send({ message: 'Default users were already inserted' });
            }

            return res.status(201).send({ message: 'Default user(s) created successfully' });
        } catch (err) {
            return res.status(500).send({ error: `Error creating default user: ${err.message}` });
        }
    },
    createUser: async (req,res) => {
        try{
            const user = await userService.createUser(req.body.access)
            if(!user) return res.status(401).send({message: 'User not created'})
            return res.status(200).send({message: 'User Created!'})
        }catch(err){
            return res.status(500).send({ error: `Error creating user: ${err.message}` });
        }
    },
    login: async (req,res) => {
        const { access } = req.body
        try{
            const user = await userService.login(access);
            if(!user) return res.status(401).send({message: 'Invalid Credentials'})
            const token = generateToken(user,res);
            
            return res.status(200).send({message: 'Login successful', userId: user.id, token});
        }catch(err){
            return res.status(401).send({error: `Login failed: ${err.message}`});
        }
    }
}

export default userController